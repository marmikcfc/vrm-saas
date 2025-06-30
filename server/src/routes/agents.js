import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { agentValidation, validateRequest, uuidValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/agents:
 *   get:
 *     summary: Get all agents for the authenticated user
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of agents
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: agents, error } = await supabase
      .from('agents')
      .select(`
        *,
        agent_knowledge!inner(
          knowledge_bases(id, name, category)
        ),
        agent_mcps!inner(
          mcps(id, name, version)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch agents',
        error: error.message 
      });
    }

    // Transform data to match frontend expectations
    const transformedAgents = agents.map(agent => ({
      id: agent.id,
      scenario: agent.name, // Map name to scenario for backward compatibility
      persona: agent.persona,
      agent_type: agent.agent_type,
      status: agent.status,
      direction: 'outbound', // Default for backward compatibility
      connection_details: {
        voice: agent.voice_config?.voice || 'sarah',
        systemPrompt: agent.prompt_config?.systemPrompt || '',
        introPrompt: agent.prompt_config?.introPrompt || '',
        fallbackPrompt: agent.prompt_config?.fallbackPrompt || '',
        ...agent.connection_details
      },
      created_at: agent.created_at,
      updated_at: agent.updated_at,
      knowledge_bases: agent.agent_knowledge?.map(ak => ak.knowledge_bases) || [],
      mcps: agent.agent_mcps?.map(am => am.mcps) || []
    }));

    res.json(transformedAgents);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/agents/{id}:
 *   get:
 *     summary: Get agent by ID
 *     tags: [Agents]
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
 *         description: Agent details
 *       404:
 *         description: Agent not found
 */
router.get('/:id', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: agent, error } = await supabase
      .from('agents')
      .select(`
        *,
        agent_knowledge!inner(
          knowledge_bases(*)
        ),
        agent_mcps!inner(
          mcps(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Agent not found' });
      }
      console.error('Error fetching agent:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch agent',
        error: error.message 
      });
    }

    // Transform data to match frontend expectations
    const transformedAgent = {
      id: agent.id,
      scenario: agent.name,
      persona: agent.persona,
      agent_type: agent.agent_type,
      status: agent.status,
      direction: 'outbound',
      connection_details: {
        voice: agent.voice_config?.voice || 'sarah',
        systemPrompt: agent.prompt_config?.systemPrompt || '',
        introPrompt: agent.prompt_config?.introPrompt || '',
        fallbackPrompt: agent.prompt_config?.fallbackPrompt || '',
        ...agent.connection_details
      },
      voice_config: agent.voice_config,
      prompt_config: agent.prompt_config,
      deployment_config: agent.deployment_config,
      created_at: agent.created_at,
      updated_at: agent.updated_at,
      knowledge_bases: agent.agent_knowledge?.map(ak => ak.knowledge_bases) || [],
      mcps: agent.agent_mcps?.map(am => am.mcps) || []
    };

    res.json(transformedAgent);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/agents:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agents]
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
 *               - identity
 *               - voice
 *             properties:
 *               name:
 *                 type: string
 *               identity:
 *                 type: string
 *               voice:
 *                 type: string
 *                 enum: [sarah, alex, emma, james]
 *               systemPrompt:
 *                 type: string
 *               introPrompt:
 *                 type: string
 *               fallbackPrompt:
 *                 type: string
 *               githubDeploy:
 *                 type: boolean
 *               repo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Agent created successfully
 */
router.post('/', authenticateToken, agentValidation, validateRequest, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      scenario, 
      name, 
      persona, 
      agent_type = 'voice',
      connection_details = {},
      voice_config = {},
      prompt_config = {},
      deployment_config = {},
      mcp_endpoints = []
    } = req.body;

    // Use either name or scenario (backward compatibility)
    const agentName = name || scenario;

    if (!agentName) {
      return res.status(400).json({ message: 'Agent name is required' });
    }

    // Extract voice and prompt configs from connection_details if provided (backward compatibility)
    const finalVoiceConfig = {
      voice: connection_details.voice || voice_config.voice || 'sarah',
      language: voice_config.language || 'en',
      speed: voice_config.speed || 1.0,
      pitch: voice_config.pitch || 1.0,
      ...voice_config
    };

    const finalPromptConfig = {
      systemPrompt: connection_details.systemPrompt || prompt_config.systemPrompt || '',
      introPrompt: connection_details.introPrompt || prompt_config.introPrompt || '',
      fallbackPrompt: connection_details.fallbackPrompt || prompt_config.fallbackPrompt || '',
      context: prompt_config.context || '',
      ...prompt_config
    };

    // Clean connection_details (remove voice/prompt config that's now separate)
    const cleanConnectionDetails = { ...connection_details };
    delete cleanConnectionDetails.voice;
    delete cleanConnectionDetails.systemPrompt;
    delete cleanConnectionDetails.introPrompt;
    delete cleanConnectionDetails.fallbackPrompt;

    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        user_id: userId,
        name: agentName,
        persona: persona || '',
        agent_type,
        status: 'draft',
        voice_config: finalVoiceConfig,
        prompt_config: finalPromptConfig,
        connection_details: cleanConnectionDetails,
        deployment_config,
        mcp_endpoints
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return res.status(500).json({ 
        message: 'Failed to create agent',
        error: error.message 
      });
    }

    // Transform response for backward compatibility
    const transformedAgent = {
      id: agent.id,
      scenario: agent.name,
      persona: agent.persona,
      agent_type: agent.agent_type,
      status: agent.status,
      direction: 'outbound',
      connection_details: {
        voice: agent.voice_config?.voice,
        systemPrompt: agent.prompt_config?.systemPrompt,
        introPrompt: agent.prompt_config?.introPrompt,
        fallbackPrompt: agent.prompt_config?.fallbackPrompt,
        ...agent.connection_details
      },
      created_at: agent.created_at,
      updated_at: agent.updated_at
    };

    res.status(201).json(transformedAgent);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/agents/{id}:
 *   put:
 *     summary: Update an agent
 *     tags: [Agents]
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
 *               identity:
 *                 type: string
 *               voice:
 *                 type: string
 *               systemPrompt:
 *                 type: string
 *               introPrompt:
 *                 type: string
 *               fallbackPrompt:
 *                 type: string
 *               githubDeploy:
 *                 type: boolean
 *               repo:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, draft, inactive]
 *     responses:
 *       200:
 *         description: Agent updated successfully
 *       404:
 *         description: Agent not found
 */
router.put('/:id', authenticateToken, uuidValidation, agentValidation, validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      scenario, 
      name, 
      persona, 
      agent_type,
      status,
      connection_details = {},
      voice_config = {},
      prompt_config = {},
      deployment_config = {},
      mcp_endpoints
    } = req.body;

    // Use either name or scenario (backward compatibility)
    const agentName = name || scenario;

    // Build update object
    const updateData = {};
    if (agentName) updateData.name = agentName;
    if (persona !== undefined) updateData.persona = persona;
    if (agent_type !== undefined) updateData.agent_type = agent_type;
    if (status !== undefined) updateData.status = status;
    if (mcp_endpoints !== undefined) updateData.mcp_endpoints = mcp_endpoints;

    // Handle voice config (merge with existing + connection_details for backward compatibility)
    if (Object.keys(voice_config).length > 0 || connection_details.voice) {
      updateData.voice_config = {
        voice: connection_details.voice || voice_config.voice || 'sarah',
        language: voice_config.language || 'en',
        speed: voice_config.speed || 1.0,
        pitch: voice_config.pitch || 1.0,
        ...voice_config
      };
    }

    // Handle prompt config (merge with existing + connection_details for backward compatibility)
    if (Object.keys(prompt_config).length > 0 || 
        connection_details.systemPrompt || 
        connection_details.introPrompt || 
        connection_details.fallbackPrompt) {
      updateData.prompt_config = {
        systemPrompt: connection_details.systemPrompt || prompt_config.systemPrompt || '',
        introPrompt: connection_details.introPrompt || prompt_config.introPrompt || '',
        fallbackPrompt: connection_details.fallbackPrompt || prompt_config.fallbackPrompt || '',
        context: prompt_config.context || '',
        ...prompt_config
      };
    }

    // Handle connection details (remove voice/prompt config)
    if (Object.keys(connection_details).length > 0) {
      const cleanConnectionDetails = { ...connection_details };
      delete cleanConnectionDetails.voice;
      delete cleanConnectionDetails.systemPrompt;
      delete cleanConnectionDetails.introPrompt;
      delete cleanConnectionDetails.fallbackPrompt;
      
      if (Object.keys(cleanConnectionDetails).length > 0) {
        updateData.connection_details = cleanConnectionDetails;
      }
    }

    // Handle deployment config
    if (Object.keys(deployment_config).length > 0) {
      updateData.deployment_config = deployment_config;
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Agent not found' });
      }
      console.error('Error updating agent:', error);
      return res.status(500).json({ 
        message: 'Failed to update agent',
        error: error.message 
      });
    }

    // Transform response for backward compatibility
    const transformedAgent = {
      id: agent.id,
      scenario: agent.name,
      persona: agent.persona,
      agent_type: agent.agent_type,
      status: agent.status,
      direction: 'outbound',
      connection_details: {
        voice: agent.voice_config?.voice,
        systemPrompt: agent.prompt_config?.systemPrompt,
        introPrompt: agent.prompt_config?.introPrompt,
        fallbackPrompt: agent.prompt_config?.fallbackPrompt,
        ...agent.connection_details
      },
      created_at: agent.created_at,
      updated_at: agent.updated_at
    };

    res.json(transformedAgent);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/agents/{id}:
 *   delete:
 *     summary: Delete an agent
 *     tags: [Agents]
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
 *         description: Agent deleted successfully
 *       404:
 *         description: Agent not found
 */
router.delete('/:id', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting agent:', error);
      return res.status(500).json({ 
        message: 'Failed to delete agent',
        error: error.message 
      });
    }

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/agents/{id}/deploy:
 *   post:
 *     summary: Deploy an agent
 *     tags: [Agents]
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
 *               deploymentType:
 *                 type: string
 *                 enum: [github-pr, direct-deploy]
 *               config:
 *                 type: object
 *     responses:
 *       202:
 *         description: Deployment initiated
 *       404:
 *         description: Agent not found
 */
router.post('/:id/deploy', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { deploymentType, config } = req.body;

    // Check if agent exists
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Create deployment record (you might want a deployments table)
    const deploymentId = uuidv4();

    // Here you would typically trigger a background job for deployment
    // For now, we'll just return a success response

    res.status(202).json({
      message: 'Agent deployment initiated',
      deploymentId
    });
  } catch (error) {
    next(error);
  }
});

// Activate/deactivate an agent
router.patch('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['draft', 'active', 'inactive', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Agent not found' });
      }
      console.error('Error updating agent status:', error);
      return res.status(500).json({ 
        message: 'Failed to update agent status',
        error: error.message 
      });
    }

    res.json({ 
      message: `Agent ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      agent: {
        id: agent.id,
        status: agent.status
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;