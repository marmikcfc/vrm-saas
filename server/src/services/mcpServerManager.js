import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import { createModuleLogger } from './logging/LoggerFactory.js';

class MCPServerManager {
  constructor() {
    this.servers = new Map(); // mcpId -> { process, port, directory }
    this.usedPorts = new Set();
    this.baseDirectory = path.join(process.cwd(), 'mcp_servers');
    this.portRange = { min: 8000, max: 9000 };
    this.healthCheckInterval = 30000; // 30 seconds
    
    // Create module-specific logger
    this.logger = createModuleLogger('mcpServerManager');
    
    // Ensure base directory exists
    this.ensureBaseDirectory();
    
    // Start health check interval
    this.startHealthCheckInterval();
  }

  async ensureBaseDirectory() {
    try {
      await fs.mkdir(this.baseDirectory, { recursive: true });
      this.logger.info('MCP servers directory ensured', { directory: this.baseDirectory });
    } catch (error) {
      this.logger.error('Failed to create MCP servers directory', { 
        directory: this.baseDirectory,
        error: error.message 
      });
      throw error;
    }
  }

  async findAvailablePort() {
    for (let port = this.portRange.min; port <= this.portRange.max; port++) {
      if (!this.usedPorts.has(port) && await this.isPortAvailable(port)) {
        this.usedPorts.add(port);
        return port;
      }
    }
    throw new Error('No available ports in range');
  }

  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  }

  async generateServerFiles(mcpData, openApiSpec) {
    const serverLogger = this.logger.child({ 
      operation: 'generateServerFiles',
      mcpId: mcpData.id,
      mcpName: mcpData.name 
    });

    try {
      serverLogger.info('Starting MCP server file generation');

      // Create unique directory for this MCP server
      const serverDir = path.join(this.baseDirectory, mcpData.id);
      await fs.mkdir(serverDir, { recursive: true });

      // Save OpenAPI spec to file
      const specPath = path.join(serverDir, 'openapi.json');
      await fs.writeFile(specPath, JSON.stringify(openApiSpec, null, 2));

      // Use openapi-mcp-generator CLI to generate the server
      const generatorArgs = [
        '-y', 'openapi-mcp-generator',
        '--input', specPath,
        '--output', serverDir,
        '--server-name', mcpData.name.replace(/[^a-zA-Z0-9-]/g, '-'),
        '--base-url', mcpData.base_url
      ];

      serverLogger.info('Running openapi-mcp-generator', { args: generatorArgs });

      await new Promise((resolve, reject) => {
        const generator = spawn('npx', generatorArgs, {
          cwd: serverDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        generator.stdout.on('data', (data) => {
          stdout += data.toString();
          serverLogger.debug('Generator stdout', { output: data.toString().trim() });
        });

        generator.stderr.on('data', (data) => {
          stderr += data.toString();
          serverLogger.debug('Generator stderr', { output: data.toString().trim() });
        });

        generator.on('close', (code) => {
          if (code === 0) {
            serverLogger.info('MCP server generation completed successfully');
            resolve();
          } else {
            serverLogger.error('MCP server generation failed', { 
              code, 
              stdout: stdout.trim(), 
              stderr: stderr.trim() 
            });
            reject(new Error(`Generator failed with code ${code}: ${stderr}`));
          }
        });

        generator.on('error', (error) => {
          serverLogger.error('Failed to start generator process', { error: error.message });
          reject(error);
        });
      });

      // Install dependencies
      serverLogger.info('Installing dependencies');
      await new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install'], {
          cwd: serverDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        npm.on('close', (code) => {
          if (code === 0) {
            serverLogger.info('Dependencies installed successfully');
            resolve();
          } else {
            serverLogger.error('Failed to install dependencies', { code });
            reject(new Error(`npm install failed with code ${code}`));
          }
        });

        npm.on('error', (error) => {
          serverLogger.error('Failed to start npm install', { error: error.message });
          reject(error);
        });
      });

      // Create a startup script
      const startupScript = this.createStartupScript(mcpData.id, serverDir);
      const scriptPath = path.join(serverDir, 'start.js');
      await fs.writeFile(scriptPath, startupScript);

      // Make startup script executable
      await fs.chmod(scriptPath, '755');

      serverLogger.info('MCP server files generated successfully', {
        serverDirectory: serverDir,
        scriptPath
      });

      return serverDir;
    } catch (error) {
      serverLogger.error('Failed to generate MCP server files', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  createStartupScript(mcpId, serverDir) {
    return `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const port = process.argv[2] || 8080;
const mcpId = '${mcpId}';

console.log(\`Starting MCP server \${mcpId} on port \${port}\`);

// Start the generated MCP server with HTTP transport
const server = spawn('node', [
  path.join(__dirname, 'src', 'index.js'),
  '--transport', 'web',
  '--port', port.toString()
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
});

server.on('error', (error) => {
  console.error(\`Failed to start MCP server \${mcpId}:\`, error);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  console.log(\`MCP server \${mcpId} exited with code \${code} and signal \${signal}\`);
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  console.log(\`Stopping MCP server \${mcpId}\`);
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log(\`Stopping MCP server \${mcpId}\`);
  server.kill('SIGINT');
});

// Health check endpoint simulation
const http = require('http');
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mcpId: '${mcpId}' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(parseInt(port) + 1000, () => {
  console.log(\`Health check server for \${mcpId} running on port \${parseInt(port) + 1000}\`);
});

process.on('exit', () => {
  healthServer.close();
});
`;
  }

  async startServer(mcpId, serverDirectory, supabase) {
    const serverLogger = this.logger.child({ 
      operation: 'startServer',
      mcpId,
      serverDirectory 
    });

    try {
      serverLogger.info('Starting MCP server');

      // Find available port
      const port = await this.findAvailablePort();
      
      // Update hosting status to starting
      await supabase
        .from('mcps')
        .update({ 
          hosting_status: 'starting',
          host_port: port,
          updated_at: new Date().toISOString()
        })
        .eq('id', mcpId);

      // Start the server process
      const startScript = path.join(serverDirectory, 'start.js');
      const process = spawn('node', [startScript, port.toString()], {
        cwd: serverDirectory,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      // Store process information
      this.servers.set(mcpId, {
        process,
        port,
        directory: serverDirectory,
        startedAt: new Date(),
        lastHealthCheck: new Date()
      });

      const hostUrl = `http://localhost:${port}`;

      // Handle process events
      process.stdout.on('data', (data) => {
        serverLogger.info('MCP server stdout', { output: data.toString().trim() });
      });

      process.stderr.on('data', (data) => {
        serverLogger.error('MCP server stderr', { output: data.toString().trim() });
      });

      process.on('exit', async (code, signal) => {
        serverLogger.warn('MCP server process exited', { code, signal });
        
        // Clean up
        this.usedPorts.delete(port);
        this.servers.delete(mcpId);
        
        // Update database
        await supabase
          .from('mcps')
          .update({
            hosting_status: code === 0 ? 'stopped' : 'error',
            error_message: code !== 0 ? `Process exited with code ${code}` : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', mcpId);
      });

      process.on('error', async (error) => {
        serverLogger.error('MCP server process error', { error: error.message });
        
        // Update database
        await supabase
          .from('mcps')
          .update({
            hosting_status: 'error',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', mcpId);
      });

      // Wait a moment for server to start, then verify it's running
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isHealthy = await this.checkServerHealth(hostUrl);
      
      if (isHealthy) {
        // Update database with running status
        await supabase
          .from('mcps')
          .update({
            hosting_status: 'running',
            host_url: hostUrl,
            process_id: process.pid,
            hosted_at: new Date().toISOString(),
            last_health_check: new Date().toISOString(),
            error_message: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', mcpId);

        serverLogger.info('MCP server started successfully', {
          port,
          hostUrl,
          processId: process.pid
        });

        return { port, hostUrl, processId: process.pid };
      } else {
        throw new Error('Server failed health check after startup');
      }

    } catch (error) {
      serverLogger.error('Failed to start MCP server', { error: error.message });
      
      // Clean up on failure
      if (this.servers.has(mcpId)) {
        const serverInfo = this.servers.get(mcpId);
        if (serverInfo.process) {
          serverInfo.process.kill();
        }
        this.usedPorts.delete(serverInfo.port);
        this.servers.delete(mcpId);
      }

      // Update database with error status
      await supabase
        .from('mcps')
        .update({
          hosting_status: 'error',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', mcpId);

      throw error;
    }
  }

  async stopServer(mcpId, supabase) {
    const serverLogger = this.logger.child({ 
      operation: 'stopServer',
      mcpId 
    });

    try {
      const serverInfo = this.servers.get(mcpId);
      
      if (!serverInfo) {
        serverLogger.warn('Server not found in memory, updating database status only');
        
        // Update database status even if not in memory
        await supabase
          .from('mcps')
          .update({
            hosting_status: 'stopped',
            host_port: null,
            host_url: null,
            process_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', mcpId);
        
        return;
      }

      serverLogger.info('Stopping MCP server', { 
        port: serverInfo.port,
        processId: serverInfo.process.pid 
      });

      // Kill the process
      serverInfo.process.kill('SIGTERM');
      
      // Clean up
      this.usedPorts.delete(serverInfo.port);
      this.servers.delete(mcpId);

      // Update database
      await supabase
        .from('mcps')
        .update({
          hosting_status: 'stopped',
          host_port: null,
          host_url: null,
          process_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', mcpId);

      serverLogger.info('MCP server stopped successfully');
    } catch (error) {
      serverLogger.error('Failed to stop MCP server', { error: error.message });
      throw error;
    }
  }

  async checkServerHealth(hostUrl) {
    try {
      // Health check on the health port (main port + 1000)
      const healthPort = parseInt(hostUrl.split(':').pop()) + 1000;
      const healthUrl = hostUrl.replace(/:\d+$/, `:${healthPort}`) + '/health';
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async restartServer(mcpId, supabase) {
    const serverLogger = this.logger.child({ 
      operation: 'restartServer',
      mcpId 
    });

    try {
      serverLogger.info('Restarting MCP server');

      // Get server directory from database
      const { data: mcp, error } = await supabase
        .from('mcps')
        .select('server_directory')
        .eq('id', mcpId)
        .single();

      if (error || !mcp?.server_directory) {
        throw new Error('Server directory not found');
      }

      // Stop if running
      if (this.servers.has(mcpId)) {
        await this.stopServer(mcpId, supabase);
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Start again
      return await this.startServer(mcpId, mcp.server_directory, supabase);
    } catch (error) {
      serverLogger.error('Failed to restart MCP server', { error: error.message });
      throw error;
    }
  }

  async pauseServer(mcpId, supabase) {
    const serverLogger = this.logger.child({ 
      operation: 'pauseServer',
      mcpId 
    });

    try {
      const serverInfo = this.servers.get(mcpId);
      
      if (!serverInfo) {
        serverLogger.warn('Server not found in memory');
        throw new Error('Server not running');
      }

      if (serverInfo.paused) {
        serverLogger.warn('Server already paused');
        throw new Error('Server is already paused');
      }

      serverLogger.info('Pausing MCP server', { 
        port: serverInfo.port,
        processId: serverInfo.process.pid 
      });

      // Send SIGSTOP to pause the process (suspend)
      serverInfo.process.kill('SIGSTOP');
      serverInfo.paused = true;
      serverInfo.pausedAt = new Date();

      // Update database
      await supabase
        .from('mcps')
        .update({
          hosting_status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', mcpId);

      serverLogger.info('MCP server paused successfully');
      return { paused: true, pausedAt: serverInfo.pausedAt };
    } catch (error) {
      serverLogger.error('Failed to pause MCP server', { error: error.message });
      throw error;
    }
  }

  async unpauseServer(mcpId, supabase) {
    const serverLogger = this.logger.child({ 
      operation: 'unpauseServer',
      mcpId 
    });

    try {
      const serverInfo = this.servers.get(mcpId);
      
      if (!serverInfo) {
        serverLogger.warn('Server not found in memory');
        throw new Error('Server not running');
      }

      if (!serverInfo.paused) {
        serverLogger.warn('Server not paused');
        throw new Error('Server is not paused');
      }

      serverLogger.info('Unpausing MCP server', { 
        port: serverInfo.port,
        processId: serverInfo.process.pid 
      });

      // Send SIGCONT to resume the process
      serverInfo.process.kill('SIGCONT');
      serverInfo.paused = false;
      delete serverInfo.pausedAt;

      // Update database
      await supabase
        .from('mcps')
        .update({
          hosting_status: 'running',
          last_health_check: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', mcpId);

      serverLogger.info('MCP server unpaused successfully');
      return { paused: false };
    } catch (error) {
      serverLogger.error('Failed to unpause MCP server', { error: error.message });
      throw error;
    }
  }

  startHealthCheckInterval() {
    setInterval(async () => {
      for (const [mcpId, serverInfo] of this.servers.entries()) {
        try {
          const hostUrl = `http://localhost:${serverInfo.port}`;
          const isHealthy = await this.checkServerHealth(hostUrl);
          
          if (isHealthy) {
            serverInfo.lastHealthCheck = new Date();
          } else {
            this.logger.warn('MCP server health check failed', { 
              mcpId,
              hostUrl,
              port: serverInfo.port 
            });
          }
        } catch (error) {
          this.logger.error('Health check error', { 
            mcpId,
            error: error.message 
          });
        }
      }
    }, this.healthCheckInterval);
  }

  async cleanupServer(mcpId) {
    const serverLogger = this.logger.child({ 
      operation: 'cleanupServer',
      mcpId 
    });

    try {
      const serverInfo = this.servers.get(mcpId);
      
      if (serverInfo) {
        // Stop the process if running
        if (serverInfo.process && !serverInfo.process.killed) {
          serverInfo.process.kill('SIGTERM');
        }
        
        // Clean up port
        this.usedPorts.delete(serverInfo.port);
        this.servers.delete(mcpId);
      }

      // Remove server directory
      const serverDir = path.join(this.baseDirectory, mcpId);
      try {
        await fs.rm(serverDir, { recursive: true, force: true });
        serverLogger.info('Server directory cleaned up', { serverDir });
      } catch (error) {
        serverLogger.warn('Failed to remove server directory', { 
          serverDir,
          error: error.message 
        });
      }

    } catch (error) {
      serverLogger.error('Failed to cleanup server', { error: error.message });
      throw error;
    }
  }

  getServerStatus(mcpId) {
    const serverInfo = this.servers.get(mcpId);
    if (!serverInfo) {
      return null;
    }

    return {
      port: serverInfo.port,
      processId: serverInfo.process.pid,
      isRunning: !serverInfo.process.killed,
      startedAt: serverInfo.startedAt,
      lastHealthCheck: serverInfo.lastHealthCheck
    };
  }

  getAllServers() {
    const servers = [];
    for (const [mcpId, serverInfo] of this.servers.entries()) {
      servers.push({
        mcpId,
        port: serverInfo.port,
        processId: serverInfo.process.pid,
        isRunning: !serverInfo.process.killed,
        startedAt: serverInfo.startedAt,
        lastHealthCheck: serverInfo.lastHealthCheck
      });
    }
    return servers;
  }
}

// Create singleton instance
const mcpServerManager = new MCPServerManager();

export default mcpServerManager; 