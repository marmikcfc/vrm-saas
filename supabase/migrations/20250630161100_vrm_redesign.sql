-- -- VRM SaaS Platform Schema Redesign
-- -- Dropping unnecessary tables and restructuring for voice AI agent management

-- -- Drop tables that are not used in the current application
-- DROP TABLE IF EXISTS test_runs CASCADE;
-- DROP TABLE IF EXISTS campaigns CASCADE;
-- DROP TABLE IF EXISTS outbound_call_params CASCADE;
-- DROP TABLE IF EXISTS api_keys CASCADE;

-- -- Update agents table structure to match actual usage
-- DROP TABLE IF EXISTS agents CASCADE;

-- CREATE TABLE agents (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     name TEXT NOT NULL,
--     description TEXT,
--     persona TEXT,
--     agent_type TEXT DEFAULT 'voice' CHECK (agent_type IN ('voice', 'chat', 'hybrid')),
--     status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    
--     -- Voice configuration
--     voice_config JSONB DEFAULT '{}',
--     -- Contains: { voice: "sarah", language: "en", speed: 1.0, pitch: 1.0 }
    
--     -- Prompt configuration  
--     prompt_config JSONB DEFAULT '{}',
--     -- Contains: { systemPrompt: "", introPrompt: "", fallbackPrompt: "", context: "" }
    
--     -- Connection and deployment details
--     connection_details JSONB DEFAULT '{}',
--     -- Contains: { webhookUrl: "", apiKeys: {}, environment: "production" }
    
--     -- Deployment configuration
--     deployment_config JSONB DEFAULT '{}',
--     -- Contains: { widgetConfig: {}, embeddable: true, domains: [] }
    
--     -- MCP endpoint configurations (legacy support)
--     mcp_endpoints TEXT[], -- Array of MCP server URLs
    
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Create updated calls table with proper structure
-- DROP TABLE IF EXISTS calls CASCADE;

-- CREATE TABLE calls (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     session_id TEXT,
--     status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'in-progress', 'completed', 'failed', 'cancelled')),
    
--     -- Caller information
--     caller_info JSONB DEFAULT '{}',
--     -- Contains: { phone: "", email: "", name: "", metadata: {} }
    
--     -- Call timing
--     started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     completed_at TIMESTAMP WITH TIME ZONE,
--     duration_seconds INTEGER,
    
--     -- Call content and results
--     transcript JSONB DEFAULT '[]',
--     -- Array of: { speaker: "agent|caller", message: "", timestamp: "", confidence: 0.95 }
    
--     results JSONB DEFAULT '{}',
--     -- Contains: { sentiment: "", summary: "", actions: [], satisfaction: 0.0, resolution: "" }
    
--     -- Additional metadata
--     metadata JSONB DEFAULT '{}',
--     -- Contains: { channel: "web|phone", userAgent: "", location: {}, custom: {} }
    
--     recording_url TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Create knowledge_bases table
-- CREATE TABLE knowledge_bases (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     name TEXT NOT NULL,
--     description TEXT,
--     category TEXT DEFAULT 'general' CHECK (category IN ('product', 'support', 'training', 'general')),
--     status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'active', 'error', 'archived')),
    
--     -- Knowledge sources and content
--     sources JSONB DEFAULT '[]',
--     -- Array of: { type: "pdf|url|video|text", path: "", metadata: {}, processed: false }
    
--     -- Configuration options
--     config JSONB DEFAULT '{}',
--     -- Contains: { chunkSize: 1000, overlap: 200, embedding: "openai", indexing: {} }
    
--     last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Create junction table for agent-knowledge relationships
-- CREATE TABLE agent_knowledge (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
--     knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
--     priority INTEGER DEFAULT 1,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
--     UNIQUE(agent_id, knowledge_base_id)
-- );

-- -- Create mcps table for Model Context Protocol servers
-- CREATE TABLE mcps (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     name TEXT NOT NULL,
--     description TEXT,
--     version TEXT DEFAULT '1.0.0',
--     status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'error', 'archived')),
    
--     -- Server configuration
--     base_url TEXT NOT NULL,
    
--     -- Available endpoints
--     endpoints JSONB DEFAULT '[]',
--     -- Array of: { path: "/api/customers", method: "GET", description: "", parameters: [] }
    
--     -- Authentication configuration
--     auth_config JSONB DEFAULT '{}',
--     -- Contains: { type: "api_key|oauth|basic", credentials: {}, headers: {} }
    
--     -- Available tools/functions
--     tools JSONB DEFAULT '[]',
--     -- Array of: { name: "createCustomer", description: "", parameters: [], enabled: true }
    
--     -- UI templates
--     templates JSONB DEFAULT '[]',
--     -- Array of: { name: "", type: "ui|prompt", content: "", linkedPrompt: "" }
    
--     -- Prompt templates
--     prompts JSONB DEFAULT '[]',
--     -- Array of: { name: "", content: "", category: "", linkedTemplates: [] }
    
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Create junction table for agent-MCP relationships
-- CREATE TABLE agent_mcps (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
--     mcp_id UUID NOT NULL REFERENCES mcps(id) ON DELETE CASCADE,
    
--     -- Agent-specific configuration for this MCP
--     config JSONB DEFAULT '{}',
--     -- Contains: { enabledTools: [], customPrompts: {}, parameters: {} }
    
--     enabled BOOLEAN DEFAULT true,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
--     UNIQUE(agent_id, mcp_id)
-- );

-- -- Create metrics table for custom tracking
-- CREATE TABLE metrics (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     name TEXT NOT NULL,
--     tool_call TEXT NOT NULL, -- The function/tool call identifier to track
--     description TEXT,
--     metric_type TEXT DEFAULT 'counter' CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Create metric_events table for tracking metric occurrences
-- CREATE TABLE metric_events (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
--     call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
    
--     -- Event data
--     data JSONB DEFAULT '{}',
--     -- Contains: { value: 1, metadata: {}, timestamp: "" }
    
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Create indexes for performance
-- CREATE INDEX idx_agents_user_id ON agents(user_id);
-- CREATE INDEX idx_agents_status ON agents(status);
-- CREATE INDEX idx_calls_agent_id ON calls(agent_id);
-- CREATE INDEX idx_calls_user_id ON calls(user_id);
-- CREATE INDEX idx_calls_status ON calls(status);
-- CREATE INDEX idx_calls_started_at ON calls(started_at);
-- CREATE INDEX idx_knowledge_bases_user_id ON knowledge_bases(user_id);
-- CREATE INDEX idx_knowledge_bases_category ON knowledge_bases(category);
-- CREATE INDEX idx_mcps_user_id ON mcps(user_id);
-- CREATE INDEX idx_mcps_status ON mcps(status);
-- CREATE INDEX idx_metrics_user_id ON metrics(user_id);
-- CREATE INDEX idx_metric_events_metric_id ON metric_events(metric_id);
-- CREATE INDEX idx_metric_events_call_id ON metric_events(call_id);
-- CREATE INDEX idx_metric_events_created_at ON metric_events(created_at);

-- -- Enable Row Level Security
-- ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_knowledge ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mcps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_mcps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE metric_events ENABLE ROW LEVEL SECURITY;

-- -- Create RLS policies for agents
-- CREATE POLICY "Users can view their own agents" ON agents FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can create their own agents" ON agents FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update their own agents" ON agents FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete their own agents" ON agents FOR DELETE USING (auth.uid() = user_id);

-- -- Create RLS policies for calls
-- CREATE POLICY "Users can view calls for their agents" ON calls FOR SELECT USING (
--     auth.uid() = user_id OR 
--     EXISTS (SELECT 1 FROM agents WHERE agents.id = calls.agent_id AND agents.user_id = auth.uid())
-- );
-- CREATE POLICY "Users can create calls for their agents" ON calls FOR INSERT WITH CHECK (
--     auth.uid() = user_id AND
--     EXISTS (SELECT 1 FROM agents WHERE agents.id = calls.agent_id AND agents.user_id = auth.uid())
-- );
-- CREATE POLICY "Users can update calls for their agents" ON calls FOR UPDATE USING (
--     auth.uid() = user_id OR
--     EXISTS (SELECT 1 FROM agents WHERE agents.id = calls.agent_id AND agents.user_id = auth.uid())
-- );

-- -- Create RLS policies for knowledge_bases
-- CREATE POLICY "Users can manage their own knowledge bases" ON knowledge_bases FOR ALL USING (auth.uid() = user_id);

-- -- Create RLS policies for agent_knowledge
-- CREATE POLICY "Users can manage knowledge links for their agents" ON agent_knowledge FOR ALL USING (
--     EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_knowledge.agent_id AND agents.user_id = auth.uid())
-- );

-- -- Create RLS policies for mcps
-- CREATE POLICY "Users can manage their own MCPs" ON mcps FOR ALL USING (auth.uid() = user_id);

-- -- Create RLS policies for agent_mcps
-- CREATE POLICY "Users can manage MCP links for their agents" ON agent_mcps FOR ALL USING (
--     EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_mcps.agent_id AND agents.user_id = auth.uid())
-- );

-- -- Create RLS policies for metrics
-- CREATE POLICY "Users can manage their own metrics" ON metrics FOR ALL USING (auth.uid() = user_id);

-- -- Create RLS policies for metric_events
-- CREATE POLICY "Users can view metric events for their metrics" ON metric_events FOR SELECT USING (
--     EXISTS (SELECT 1 FROM metrics WHERE metrics.id = metric_events.metric_id AND metrics.user_id = auth.uid())
-- );
-- CREATE POLICY "System can create metric events" ON metric_events FOR INSERT WITH CHECK (true);

-- -- Create triggers for updated_at timestamps
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_mcps_updated_at BEFORE UPDATE ON mcps
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- Insert sample data for testing (optional - remove in production)
-- DO $$
-- DECLARE
--     sample_user_id UUID;
--     sample_agent_id UUID;
--     sample_kb_id UUID;
--     sample_mcp_id UUID;
-- BEGIN
--     -- Only insert if user_profiles table exists and has data
--     IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
--         SELECT id INTO sample_user_id FROM user_profiles LIMIT 1;
        
--         IF sample_user_id IS NOT NULL THEN
--             -- Insert sample agent
--             INSERT INTO agents (user_id, name, description, persona, voice_config, prompt_config)
--             VALUES (
--                 sample_user_id,
--                 'Sales Assistant',
--                 'A friendly sales agent that helps customers with product inquiries',
--                 'You are a helpful and knowledgeable sales assistant. You are enthusiastic about helping customers find the right products for their needs.',
--                 '{"voice": "sarah", "language": "en", "speed": 1.0, "pitch": 1.0}',
--                 '{"systemPrompt": "You are a sales assistant. Be helpful and friendly.", "introPrompt": "Hi! How can I help you today?", "fallbackPrompt": "I''m sorry, I didn''t understand that. Could you please rephrase?"}'
--             ) RETURNING id INTO sample_agent_id;
            
--             -- Insert sample knowledge base
--             INSERT INTO knowledge_bases (user_id, name, description, category)
--             VALUES (
--                 sample_user_id,
--                 'Product Documentation',
--                 'Complete product guides and documentation',
--                 'product'
--             ) RETURNING id INTO sample_kb_id;
            
--             -- Insert sample MCP
--             INSERT INTO mcps (user_id, name, description, base_url, tools)
--             VALUES (
--                 sample_user_id,
--                 'CRM Integration',
--                 'Customer relationship management tools',
--                 'https://api.example.com',
--                 '[{"name": "getCustomer", "description": "Retrieve customer information", "enabled": true}]'
--             ) RETURNING id INTO sample_mcp_id;
            
--             -- Link agent to knowledge base
--             IF sample_agent_id IS NOT NULL AND sample_kb_id IS NOT NULL THEN
--                 INSERT INTO agent_knowledge (agent_id, knowledge_base_id) VALUES (sample_agent_id, sample_kb_id);
--             END IF;
            
--             -- Link agent to MCP
--             IF sample_agent_id IS NOT NULL AND sample_mcp_id IS NOT NULL THEN
--                 INSERT INTO agent_mcps (agent_id, mcp_id) VALUES (sample_agent_id, sample_mcp_id);
--             END IF;
--         END IF;
--     END IF;
-- END $$; 