import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import YAML from 'yamljs';
import { getToolsFromOpenApi } from 'openapi-mcp-generator';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, uuidValidation } from '../middleware/validation.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { createModuleLogger } from '../services/logging/LoggerFactory.js';
import mcpServerManager from '../services/mcpServerManager.js';

const router = express.Router();

// Create module-specific logger
const logger = createModuleLogger('mcps');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/json', 'application/x-yaml', 'text/yaml', 'text/plain'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.yaml') || file.originalname.endsWith('.yml')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON and YAML files are allowed.'));
    }
  }
});

/**
 * @swagger
 * /api/v1/mcps:
 *   get:
 *     summary: Get all MCP servers for the authenticated user
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of MCP servers
 */
router.get('/', authenticateToken, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'getMCPs',
    userId: req.user.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Fetching MCP servers for user');

    const { data: mcps, error } = await supabase
      .from('mcps')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      requestLogger.error('Database error while fetching MCPs', { error: error.message }, error);
      throw error;
    }

    requestLogger.info('Successfully fetched MCP servers', { 
      count: mcps?.length || 0,
      mcpIds: mcps?.map(mcp => mcp.id) || []
    });

    res.json(mcps || []);
  } catch (error) {
    requestLogger.error('Failed to fetch MCP servers', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps:
 *   post:
 *     summary: Create a new MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - base_url
 *             properties:
 *               name:
 *                 type: string
 *               base_url:
 *                 type: string
 *               description:
 *                 type: string
 *               auth_config:
 *                 type: object
 *     responses:
 *       201:
 *         description: MCP server created successfully
 */
router.post('/', authenticateToken, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'createMCP',
    userId: req.user.id,
    correlationId: req.correlationId 
  });

  try {
    const { name, base_url, description, auth_config } = req.body;

    requestLogger.info('Creating new MCP server', {
      mcpName: name,
      baseUrl: base_url,
      hasAuthConfig: !!auth_config
    });

    if (!name || !base_url) {
      requestLogger.warn('Missing required fields for MCP creation', {
        hasName: !!name,
        hasBaseUrl: !!base_url
      });
      return res.status(400).json({ 
        message: 'Name and base_url are required' 
      });
    }

    const mcpData = {
      id: uuidv4(),
      user_id: req.user.id,
      name,
      base_url,
      description: description || null,
      auth_config: auth_config || {},
      tools: [],
      endpoints: [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: mcp, error } = await supabase
      .from('mcps')
      .insert([mcpData])
      .select()
      .single();

    if (error) {
      requestLogger.error('Database error while creating MCP', { error: error.message }, error);
      throw error;
    }

    requestLogger.info('Successfully created MCP server', {
      mcpId: mcp.id,
      mcpName: mcp.name
    });

    res.status(201).json(mcp);
  } catch (error) {
    requestLogger.error('Failed to create MCP server', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}:
 *   get:
 *     summary: Get a specific MCP server by ID
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: MCP server details
 *       404:
 *         description: MCP server not found
 */
router.get('/:id', authenticateToken, ...uuidValidation, validateRequest, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'getMCPById',
    userId: req.user.id,
    mcpId: req.params.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Fetching MCP server by ID');

    const { data: mcp, error } = await supabase
      .from('mcps')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        requestLogger.warn('MCP server not found');
        return res.status(404).json({ message: 'MCP server not found' });
      }
      requestLogger.error('Database error while fetching MCP', { error: error.message }, error);
      throw error;
    }

    requestLogger.info('Successfully fetched MCP server', {
      mcpName: mcp.name,
      mcpStatus: mcp.status,
      toolsCount: mcp.tools?.length || 0
    });

    res.json(mcp);
  } catch (error) {
    requestLogger.error('Failed to fetch MCP server', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}:
 *   put:
 *     summary: Update an existing MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               base_url:
 *                 type: string
 *               description:
 *                 type: string
 *               auth_config:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: MCP server updated successfully
 */
router.put('/:id', authenticateToken, ...uuidValidation, validateRequest, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'updateMCP',
    userId: req.user.id,
    mcpId: req.params.id,
    correlationId: req.correlationId 
  });

  try {
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    requestLogger.info('Updating MCP server', {
      updateFields: Object.keys(req.body)
    });

    const { data: mcp, error } = await supabase
      .from('mcps')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        requestLogger.warn('MCP server not found for update');
        return res.status(404).json({ message: 'MCP server not found' });
      }
      requestLogger.error('Database error while updating MCP', { error: error.message }, error);
      throw error;
    }

    requestLogger.info('Successfully updated MCP server', {
      mcpId: mcp.id,
      mcpName: mcp.name
    });

    res.json(mcp);
  } catch (error) {
    requestLogger.error('Failed to update MCP server', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}:
 *   delete:
 *     summary: Delete an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: MCP server deleted successfully
 */
router.delete('/:id', authenticateToken, ...uuidValidation, validateRequest, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'deleteMCP',
    userId: req.user.id,
    mcpId: req.params.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Deleting MCP server');

    // Stop and cleanup the hosted server first
    try {
      await mcpServerManager.stopServer(req.params.id, supabase);
      await mcpServerManager.cleanupServer(req.params.id);
      requestLogger.info('MCP server stopped and cleaned up');
    } catch (cleanupError) {
      requestLogger.warn('Failed to cleanup hosted server, continuing with deletion', {
        error: cleanupError.message
      });
    }

    const { error } = await supabase
      .from('mcps')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      requestLogger.error('Database error while deleting MCP', { error: error.message }, error);
      throw error;
    }

    requestLogger.info('Successfully deleted MCP server');
    res.status(204).send();
  } catch (error) {
    requestLogger.error('Failed to delete MCP server', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/spec:
 *   post:
 *     summary: Upload OpenAPI specification file to create MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - spec
 *             properties:
 *               spec:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               base_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: MCP server created from OpenAPI spec
 */
router.post('/spec', authenticateToken, uploadRateLimiter, upload.single('spec'), async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'uploadMCPSpec',
    userId: req.user.id,
    correlationId: req.correlationId 
  });

  try {
    if (!req.file) {
      requestLogger.warn('No file uploaded');
      return res.status(400).json({ message: 'OpenAPI specification file is required' });
    }

    requestLogger.info('Processing OpenAPI spec upload', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    const { name, description, base_url } = req.body;
    
    // Parse the OpenAPI specification
    let spec;
    try {
      const fileContent = req.file.buffer.toString('utf8');
      
      if (req.file.originalname.endsWith('.yaml') || req.file.originalname.endsWith('.yml')) {
        spec = YAML.parse(fileContent);
        requestLogger.debug('Parsed YAML specification');
      } else {
        spec = JSON.parse(fileContent);
        requestLogger.debug('Parsed JSON specification');
      }
    } catch (parseError) {
      requestLogger.error('Failed to parse OpenAPI specification', {
        fileName: req.file.originalname,
        parseError: parseError.message
      }, parseError);
      return res.status(400).json({ 
        message: 'Invalid OpenAPI specification file. Please ensure it\'s valid JSON or YAML.' 
      });
    }

    // Extract base URL from spec if not provided
    let resolvedBaseUrl = base_url;
    if (!resolvedBaseUrl) {
      if (spec.servers && spec.servers.length > 0) {
        resolvedBaseUrl = spec.servers[0].url;
        requestLogger.debug('Extracted base URL from spec servers', { baseUrl: resolvedBaseUrl });
      } else if (spec.host) {
        // Swagger 2.0 format
        const scheme = spec.schemes && spec.schemes.length > 0 ? spec.schemes[0] : 'https';
        const basePath = spec.basePath || '';
        resolvedBaseUrl = `${scheme}://${spec.host}${basePath}`;
        requestLogger.debug('Extracted base URL from Swagger 2.0 spec', { baseUrl: resolvedBaseUrl });
      }
    }

    if (!resolvedBaseUrl) {
      requestLogger.warn('No base URL found in spec or provided');
      return res.status(400).json({ 
        message: 'Base URL must be provided either in the request or the OpenAPI specification' 
      });
    }

    // Generate tools from OpenAPI spec
    let tools = [];
    let endpoints = [];
    
    try {
      const generatedTools = await getToolsFromOpenApi(spec, resolvedBaseUrl);
      
      tools = generatedTools.map(tool => ({
        ...tool,
        enabled: true
      }));

      // Extract endpoints for storage
      endpoints = tools.map(tool => ({
        method: tool.method,
        path: tool.pathTemplate,
        operationId: tool.operationId,
        summary: tool.summary,
        parameters: tool.parameters || []
      }));

      requestLogger.info('Successfully generated tools from OpenAPI spec', {
        toolsCount: tools.length,
        endpointsCount: endpoints.length
      });

    } catch (toolError) {
      requestLogger.error('Failed to generate tools from OpenAPI spec', {
        toolError: toolError.message
      }, toolError);
      return res.status(400).json({ 
        message: 'Failed to process OpenAPI specification. Please ensure it\'s a valid OpenAPI 3.0+ or Swagger 2.0 document.' 
      });
    }

    // Create MCP server
    const mcpData = {
      id: uuidv4(),
      user_id: req.user.id,
      name: name || spec.info?.title || 'Generated MCP Server',
      base_url: resolvedBaseUrl,
      description: description || spec.info?.description || 'Generated from OpenAPI specification',
      auth_config: {},
      tools,
      endpoints,
      status: 'active',
      hosting_status: 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: mcp, error } = await req.userSupabase
      .from('mcps')
      .insert([mcpData])
      .select()
      .single();

    if (error) {
      requestLogger.error('Database error while creating MCP from spec', { error: error.message }, error);
      throw error;
    }

    // Start async process to generate and host the actual MCP server
    (async () => {
      try {
        requestLogger.info('Starting MCP server generation and hosting', {
          mcpId: mcp.id,
          mcpName: mcp.name
        });

        // Update status to generating
        await req.userSupabase
          .from('mcps')
          .update({ 
            hosting_status: 'generating',
            updated_at: new Date().toISOString()
          })
          .eq('id', mcp.id);

        // Generate server files
        const serverDirectory = await mcpServerManager.generateServerFiles(mcp, spec);

        // Update database with server directory
        await req.userSupabase
          .from('mcps')
          .update({ 
            server_directory: serverDirectory,
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', mcp.id);

        // Start the server
        const hostingInfo = await mcpServerManager.startServer(mcp.id, serverDirectory, req.userSupabase);

        requestLogger.info('MCP server generated and hosted successfully', {
          mcpId: mcp.id,
          mcpName: mcp.name,
          hostingInfo
        });

      } catch (error) {
        requestLogger.error('Failed to generate or host MCP server', {
          mcpId: mcp.id,
          error: error.message
        }, error);

        // Update database with error status
        await req.userSupabase
          .from('mcps')
          .update({
            hosting_status: 'error',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', mcp.id);
      }
    })();

    requestLogger.info('Successfully created MCP server from OpenAPI spec', {
      mcpId: mcp.id,
      mcpName: mcp.name,
      toolsCount: tools.length
    });

    res.status(201).json(mcp);
  } catch (error) {
    requestLogger.error('Failed to process OpenAPI spec upload', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/spec/url:
 *   post:
 *     summary: Import OpenAPI specification from URL to create MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               base_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: MCP server created from OpenAPI spec URL
 */
router.post('/spec/url', authenticateToken, uploadRateLimiter, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'importMCPSpecFromURL',
    userId: req.user.id,
    correlationId: req.correlationId 
  });

  try {
    const { url, name, description, base_url } = req.body;

    if (!url) {
      requestLogger.warn('No URL provided for spec import');
      return res.status(400).json({ message: 'OpenAPI specification URL is required' });
    }

    requestLogger.info('Importing OpenAPI spec from URL', { specUrl: url });

    // Fetch the OpenAPI specification from URL
    let spec;
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        requestLogger.error('Failed to fetch OpenAPI spec from URL', {
          specUrl: url,
          status: response.status,
          statusText: response.statusText
        });
        return res.status(400).json({ 
          message: `Failed to fetch OpenAPI specification from URL: ${response.status} ${response.statusText}` 
        });
      }

      const contentType = response.headers.get('content-type') || '';
      const content = await response.text();

      if (contentType.includes('application/json') || url.endsWith('.json')) {
        spec = JSON.parse(content);
        requestLogger.debug('Parsed JSON specification from URL');
      } else if (contentType.includes('yaml') || url.endsWith('.yaml') || url.endsWith('.yml')) {
        spec = YAML.parse(content);
        requestLogger.debug('Parsed YAML specification from URL');
      } else {
        // Try JSON first, then YAML
        try {
          spec = JSON.parse(content);
          requestLogger.debug('Auto-detected JSON specification');
        } catch {
          spec = YAML.parse(content);
          requestLogger.debug('Auto-detected YAML specification');
        }
      }
    } catch (fetchError) {
      requestLogger.error('Failed to fetch or parse OpenAPI spec from URL', {
        specUrl: url,
        fetchError: fetchError.message
      }, fetchError);
      return res.status(400).json({ 
        message: 'Failed to fetch or parse OpenAPI specification from URL. Please ensure the URL is accessible and returns valid JSON or YAML.' 
      });
    }

    // Extract base URL from spec if not provided
    let resolvedBaseUrl = base_url;
    if (!resolvedBaseUrl) {
      if (spec.servers && spec.servers.length > 0) {
        resolvedBaseUrl = spec.servers[0].url;
        requestLogger.debug('Extracted base URL from spec servers', { baseUrl: resolvedBaseUrl });
      } else if (spec.host) {
        // Swagger 2.0 format
        const scheme = spec.schemes && spec.schemes.length > 0 ? spec.schemes[0] : 'https';
        const basePath = spec.basePath || '';
        resolvedBaseUrl = `${scheme}://${spec.host}${basePath}`;
        requestLogger.debug('Extracted base URL from Swagger 2.0 spec', { baseUrl: resolvedBaseUrl });
      }
    }

    if (!resolvedBaseUrl) {
      requestLogger.warn('No base URL found in spec or provided');
      return res.status(400).json({ 
        message: 'Base URL must be provided either in the request or the OpenAPI specification' 
      });
    }

    // Generate tools from OpenAPI spec
    let tools = [];
    let endpoints = [];
    
    try {
      const generatedTools = await getToolsFromOpenApi(spec, resolvedBaseUrl);
      
      tools = generatedTools.map(tool => ({
        ...tool,
        enabled: true
      }));

      // Extract endpoints for storage
      endpoints = tools.map(tool => ({
        method: tool.method,
        path: tool.pathTemplate,
        operationId: tool.operationId,
        summary: tool.summary,
        parameters: tool.parameters || []
      }));

      requestLogger.info('Successfully generated tools from OpenAPI spec', {
        toolsCount: tools.length,
        endpointsCount: endpoints.length
      });

    } catch (toolError) {
      requestLogger.error('Failed to generate tools from OpenAPI spec', {
        toolError: toolError.message
      }, toolError);
      return res.status(400).json({ 
        message: 'Failed to process OpenAPI specification. Please ensure it\'s a valid OpenAPI 3.0+ or Swagger 2.0 document.' 
      });
    }

    // Create MCP server
    const mcpData = {
      id: uuidv4(),
      user_id: req.user.id,
      name: name || spec.info?.title || 'Generated MCP Server',
      base_url: resolvedBaseUrl,
      description: description || spec.info?.description || 'Generated from OpenAPI specification',
      auth_config: {},
      tools,
      endpoints,
      status: 'active',
      hosting_status: 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: mcp, error } = await req.userSupabase
      .from('mcps')
      .insert([mcpData])
      .select()
      .single();

    if (error) {
      requestLogger.error('Database error while creating MCP from spec URL', { error: error.message }, error);
      throw error;
    }

    // Start async process to generate and host the actual MCP server
    (async () => {
      try {
        requestLogger.info('Starting MCP server generation and hosting from URL', {
          mcpId: mcp.id,
          mcpName: mcp.name,
          specUrl: url
        });

        // Update status to generating
        await req.userSupabase
          .from('mcps')
          .update({ 
            hosting_status: 'generating',
            updated_at: new Date().toISOString()
          })
          .eq('id', mcp.id);

        // Generate server files
        const serverDirectory = await mcpServerManager.generateServerFiles(mcp, spec);

        // Update database with server directory
        await req.userSupabase
          .from('mcps')
          .update({ 
            server_directory: serverDirectory,
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', mcp.id);

        // Start the server
        const hostingInfo = await mcpServerManager.startServer(mcp.id, serverDirectory, req.userSupabase);

        requestLogger.info('MCP server generated and hosted successfully from URL', {
          mcpId: mcp.id,
          mcpName: mcp.name,
          specUrl: url,
          hostingInfo
        });

      } catch (error) {
        requestLogger.error('Failed to generate or host MCP server from URL', {
          mcpId: mcp.id,
          specUrl: url,
          error: error.message
        }, error);

        // Update database with error status
        await req.userSupabase
          .from('mcps')
          .update({
            hosting_status: 'error',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', mcp.id);
      }
    })();

    requestLogger.info('Successfully created MCP server from OpenAPI spec URL', {
      mcpId: mcp.id,
      mcpName: mcp.name,
      toolsCount: tools.length,
      specUrl: url
    });

    res.status(201).json(mcp);
  } catch (error) {
    requestLogger.error('Failed to import OpenAPI spec from URL', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/tools:
 *   get:
 *     summary: Get tools for an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of tools
 *       404:
 *         description: MCP server not found
 */
router.get('/:id/tools', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { data: mcp, error } = await supabase
      .from('mcps')
      .select('tools')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !mcp) {
      return res.status(404).json({ message: 'MCP server not found' });
    }

    res.json(mcp.tools || []);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/tools/{toolName}:
 *   patch:
 *     summary: Update tool configuration
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: toolName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Tool updated successfully
 *       404:
 *         description: MCP server or tool not found
 */
router.patch('/:id/tools/:toolName', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { enabled, config } = req.body;

    // Get current MCP
    const { data: mcp, error: fetchError } = await supabase
      .from('mcps')
      .select('tools')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !mcp) {
      return res.status(404).json({ message: 'MCP server not found' });
    }

    const tools = mcp.tools || [];
    const toolIndex = tools.findIndex(tool => tool.name === req.params.toolName);

    if (toolIndex === -1) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    // Update tool
    if (enabled !== undefined) {
      tools[toolIndex].enabled = enabled;
    }
    if (config !== undefined) {
      tools[toolIndex].config = { ...tools[toolIndex].config, ...config };
    }

    // Update in database
    const { data: updatedMcp, error: updateError } = await supabase
      .from('mcps')
      .update({ 
        tools: tools,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json(tools[toolIndex]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/templates:
 *   get:
 *     summary: Get templates for an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of templates
 *       404:
 *         description: MCP server not found
 */
router.get('/:id/templates', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { data: mcp, error } = await supabase
      .from('mcps')
      .select('templates')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !mcp) {
      return res.status(404).json({ message: 'MCP server not found' });
    }

    res.json(mcp.templates || []);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/templates:
 *   post:
 *     summary: Add a new template to an MCP
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ui, prompt, workflow]
 *               description:
 *                 type: string
 *               linkedPrompt:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template created successfully
 *       404:
 *         description: MCP server not found
 */
router.post('/:id/templates', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { name, type, description, linkedPrompt, content } = req.body;

    if (!name || !type || !content) {
      return res.status(400).json({ message: 'Name, type, and content are required' });
    }

    // Get current MCP
    const { data: mcp, error: fetchError } = await supabase
      .from('mcps')
      .select('templates')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !mcp) {
      return res.status(404).json({ message: 'MCP server not found' });
    }

    const template = {
      id: uuidv4(),
      name,
      type,
      description: description || '',
      linkedPrompt: linkedPrompt || null,
      content,
      created_at: new Date().toISOString()
    };

    const templates = mcp.templates || [];
    templates.push(template);

    // Update in database
    const { error: updateError } = await supabase
      .from('mcps')
      .update({ 
        templates: templates,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (updateError) {
      throw updateError;
    }

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/prompts:
 *   get:
 *     summary: Get prompts for an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of prompts
 *       404:
 *         description: MCP server not found
 */
router.get('/:id/prompts', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { data: mcp, error } = await supabase
      .from('mcps')
      .select('prompts')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !mcp) {
      return res.status(404).json({ message: 'MCP server not found' });
    }

    res.json(mcp.prompts || []);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/prompts:
 *   post:
 *     summary: Add a new prompt to an MCP
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - content
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               linkedTemplates:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *                 enum: [system, user, tool, error]
 *     responses:
 *       201:
 *         description: Prompt created successfully
 *       404:
 *         description: MCP server not found
 */
router.post('/:id/prompts', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { name, content, linkedTemplates, category } = req.body;

    if (!name || !content || !category) {
      return res.status(400).json({ message: 'Name, content, and category are required' });
    }

    // Get current MCP
    const { data: mcp, error: fetchError } = await supabase
      .from('mcps')
      .select('prompts')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !mcp) {
      return res.status(404).json({ message: 'MCP server not found' });
    }

    const prompt = {
      id: uuidv4(),
      name,
      content,
      linkedTemplates: linkedTemplates || [],
      category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const prompts = mcp.prompts || [];
    prompts.push(prompt);

    // Update in database
    const { error: updateError } = await supabase
      .from('mcps')
      .update({ 
        prompts: prompts,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (updateError) {
      throw updateError;
    }

    res.status(201).json(prompt);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/hosting/start:
 *   post:
 *     summary: Start hosting an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: MCP server hosting started successfully
 *       404:
 *         description: MCP server not found
 *       400:
 *         description: Server already running or cannot be started
 */
router.post('/:id/hosting/start', authenticateToken, ...uuidValidation, validateRequest, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'startMCPHosting',
    userId: req.user.id,
    mcpId: req.params.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Starting MCP server hosting');

    // Get MCP server details
    const { data: mcp, error: fetchError } = await supabase
      .from('mcps')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !mcp) {
      requestLogger.warn('MCP server not found');
      return res.status(404).json({ message: 'MCP server not found' });
    }

    if (mcp.hosting_status === 'running') {
      requestLogger.warn('MCP server already running');
      return res.status(400).json({ message: 'MCP server is already running' });
    }

    if (!mcp.server_directory) {
      requestLogger.warn('MCP server files not generated');
      return res.status(400).json({ message: 'MCP server files have not been generated yet' });
    }

    // Start the server
    const hostingInfo = await mcpServerManager.startServer(req.params.id, mcp.server_directory, supabase);

    requestLogger.info('MCP server hosting started successfully', { hostingInfo });

    res.json({
      message: 'MCP server hosting started successfully',
      hostingInfo
    });

  } catch (error) {
    requestLogger.error('Failed to start MCP server hosting', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/hosting/stop:
 *   post:
 *     summary: Stop hosting an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: MCP server hosting stopped successfully
 *       404:
 *         description: MCP server not found
 */
router.post('/:id/hosting/stop', authenticateToken, ...uuidValidation, validateRequest, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'stopMCPHosting',
    userId: req.user.id,
    mcpId: req.params.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Stopping MCP server hosting');

    // Verify ownership
    const { data: mcp, error: fetchError } = await supabase
      .from('mcps')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !mcp) {
      requestLogger.warn('MCP server not found');
      return res.status(404).json({ message: 'MCP server not found' });
    }

    // Stop the server
    await mcpServerManager.stopServer(req.params.id, supabase);

    requestLogger.info('MCP server hosting stopped successfully');

    res.json({
      message: 'MCP server hosting stopped successfully'
    });

  } catch (error) {
    requestLogger.error('Failed to stop MCP server hosting', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/hosting/restart:
 *   post:
 *     summary: Restart hosting an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: MCP server hosting restarted successfully
 *       404:
 *         description: MCP server not found
 */
router.post('/:id/hosting/restart', authenticateToken, ...uuidValidation, validateRequest, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'restartMCPHosting',
    userId: req.user.id,
    mcpId: req.params.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Restarting MCP server hosting');

    // Verify ownership
    const { data: mcp, error: fetchError } = await supabase
      .from('mcps')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !mcp) {
      requestLogger.warn('MCP server not found');
      return res.status(404).json({ message: 'MCP server not found' });
    }

    // Restart the server
    const hostingInfo = await mcpServerManager.restartServer(req.params.id, supabase);

    requestLogger.info('MCP server hosting restarted successfully', { hostingInfo });

    res.json({
      message: 'MCP server hosting restarted successfully',
      hostingInfo
    });

  } catch (error) {
    requestLogger.error('Failed to restart MCP server hosting', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/hosting/status:
 *   get:
 *     summary: Get hosting status of an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: MCP server hosting status
 *       404:
 *         description: MCP server not found
 */
router.get('/:id/hosting/status', authenticateToken, ...uuidValidation, validateRequest, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'getMCPHostingStatus',
    userId: req.user.id,
    mcpId: req.params.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Getting MCP server hosting status');

    // Get MCP server details from database
    const { data: mcp, error: fetchError } = await supabase
      .from('mcps')
      .select('hosting_status, host_port, host_url, process_id, server_directory, generated_at, hosted_at, last_health_check, error_message')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !mcp) {
      requestLogger.warn('MCP server not found');
      return res.status(404).json({ message: 'MCP server not found' });
    }

    // Get runtime status from manager
    const runtimeStatus = mcpServerManager.getServerStatus(req.params.id);

    const hostingStatus = {
      database: {
        hosting_status: mcp.hosting_status,
        host_port: mcp.host_port,
        host_url: mcp.host_url,
        process_id: mcp.process_id,
        server_directory: mcp.server_directory,
        generated_at: mcp.generated_at,
        hosted_at: mcp.hosted_at,
        last_health_check: mcp.last_health_check,
        error_message: mcp.error_message
      },
      runtime: runtimeStatus
    };

    requestLogger.info('Retrieved MCP server hosting status', {
      hostingStatus: mcp.hosting_status,
      hasRuntimeInfo: !!runtimeStatus
    });

    res.json(hostingStatus);

  } catch (error) {
    requestLogger.error('Failed to get MCP server hosting status', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/hosting/pause:
 *   post:
 *     summary: Pause hosting an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: MCP server hosting paused successfully
 *       404:
 *         description: MCP server not found
 *       400:
 *         description: Server not running or already paused
 */
router.post('/:id/hosting/pause', authenticateToken, ...uuidValidation, validateRequest, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'pauseMCPHosting',
    userId: req.user.id,
    mcpId: req.params.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Pausing MCP server hosting');

    // Verify ownership
    const { data: mcp, error: fetchError } = await supabase
      .from('mcps')
      .select('id, hosting_status')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !mcp) {
      requestLogger.warn('MCP server not found');
      return res.status(404).json({ message: 'MCP server not found' });
    }

    if (mcp.hosting_status !== 'running') {
      requestLogger.warn('MCP server not running', { currentStatus: mcp.hosting_status });
      return res.status(400).json({ message: 'MCP server is not running' });
    }

    // Pause the server
    const pauseInfo = await mcpServerManager.pauseServer(req.params.id, supabase);

    requestLogger.info('MCP server hosting paused successfully', { pauseInfo });

    res.json({
      message: 'MCP server hosting paused successfully',
      pauseInfo
    });

  } catch (error) {
    requestLogger.error('Failed to pause MCP server hosting', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/hosting/unpause:
 *   post:
 *     summary: Unpause hosting an MCP server
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: MCP server hosting unpaused successfully
 *       404:
 *         description: MCP server not found
 *       400:
 *         description: Server not paused
 */
router.post('/:id/hosting/unpause', authenticateToken, ...uuidValidation, validateRequest, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'unpauseMCPHosting',
    userId: req.user.id,
    mcpId: req.params.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Unpausing MCP server hosting');

    // Verify ownership
    const { data: mcp, error: fetchError } = await supabase
      .from('mcps')
      .select('id, hosting_status')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !mcp) {
      requestLogger.warn('MCP server not found');
      return res.status(404).json({ message: 'MCP server not found' });
    }

    if (mcp.hosting_status !== 'paused') {
      requestLogger.warn('MCP server not paused', { currentStatus: mcp.hosting_status });
      return res.status(400).json({ message: 'MCP server is not paused' });
    }

    // Unpause the server
    const unpauseInfo = await mcpServerManager.unpauseServer(req.params.id, supabase);

    requestLogger.info('MCP server hosting unpaused successfully', { unpauseInfo });

    res.json({
      message: 'MCP server hosting unpaused successfully',
      unpauseInfo
    });

  } catch (error) {
    requestLogger.error('Failed to unpause MCP server hosting', {}, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/hosting/status:
 *   get:
 *     summary: Get hosting status of all MCP servers for the user
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All MCP servers hosting status
 */
router.get('/hosting/status', authenticateToken, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'getAllMCPHostingStatus',
    userId: req.user.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Getting all MCP servers hosting status');

    // Get all MCP servers for user
    const { data: mcps, error: fetchError } = await supabase
      .from('mcps')
      .select('id, name, hosting_status, host_port, host_url, process_id, last_health_check, error_message')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      requestLogger.error('Database error while fetching MCPs', { error: fetchError.message }, fetchError);
      throw fetchError;
    }

    // Get runtime status for all servers
    const allRuntimeStatus = mcpServerManager.getAllServers();
    
    const hostingStatus = mcps.map(mcp => ({
      id: mcp.id,
      name: mcp.name,
      database: {
        hosting_status: mcp.hosting_status,
        host_port: mcp.host_port,
        host_url: mcp.host_url,
        process_id: mcp.process_id,
        last_health_check: mcp.last_health_check,
        error_message: mcp.error_message
      },
      runtime: allRuntimeStatus.find(runtime => runtime.mcpId === mcp.id) || null
    }));

    requestLogger.info('Retrieved all MCP servers hosting status', {
      count: hostingStatus.length,
      runningCount: hostingStatus.filter(s => s.database.hosting_status === 'running').length
    });

    res.json(hostingStatus);

  } catch (error) {
    requestLogger.error('Failed to get all MCP servers hosting status', {}, error);
    next(error);
  }
});

export default router;