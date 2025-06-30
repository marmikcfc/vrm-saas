-- Add hosting-related fields to mcps table for actual MCP server instances
-- This migration adds fields to track hosted MCP server instances

-- Add hosting fields to mcps table
ALTER TABLE mcps ADD COLUMN IF NOT EXISTS hosting_status TEXT DEFAULT 'inactive' CHECK (hosting_status IN ('inactive', 'generating', 'starting', 'running', 'error', 'stopped'));
ALTER TABLE mcps ADD COLUMN IF NOT EXISTS host_port INTEGER NULL;
ALTER TABLE mcps ADD COLUMN IF NOT EXISTS host_url TEXT NULL;
ALTER TABLE mcps ADD COLUMN IF NOT EXISTS process_id INTEGER NULL;
ALTER TABLE mcps ADD COLUMN IF NOT EXISTS server_directory TEXT NULL;
ALTER TABLE mcps ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE mcps ADD COLUMN IF NOT EXISTS hosted_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE mcps ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE mcps ADD COLUMN IF NOT EXISTS error_message TEXT NULL;

-- Create index for performance on hosting status and port lookups
CREATE INDEX IF NOT EXISTS idx_mcps_hosting_status ON mcps(hosting_status);
CREATE INDEX IF NOT EXISTS idx_mcps_host_port ON mcps(host_port);

-- Update the existing status check constraint to include new hosting statuses
ALTER TABLE mcps DROP CONSTRAINT IF EXISTS mcps_status_check;
ALTER TABLE mcps ADD CONSTRAINT mcps_status_check CHECK (status IN ('draft', 'active', 'error', 'archived')); 