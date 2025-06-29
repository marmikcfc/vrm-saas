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
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(agents || []);
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
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(agent);
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
    const agentData = {
      id: uuidv4(),
      user_id: req.user.id,
      agent_id: `agent_${Date.now()}`,
      agent_type: 'voice',
      connection_details: {
        voice: req.body.voice,
        systemPrompt: req.body.systemPrompt || '',
        introPrompt: req.body.introPrompt || '',
        fallbackPrompt: req.body.fallbackPrompt || ''
      },
      persona: req.body.identity,
      scenario: req.body.name,
      created_at: new Date().toISOString()
    };

    const { data: agent, error } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(agent);
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
    const updateData = {
      persona: req.body.identity,
      scenario: req.body.name,
      connection_details: {
        voice: req.body.voice,
        systemPrompt: req.body.systemPrompt || '',
        introPrompt: req.body.introPrompt || '',
        fallbackPrompt: req.body.fallbackPrompt || ''
      }
    };

    const { data: agent, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(agent);
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
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.status(204).send();
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

export default router;