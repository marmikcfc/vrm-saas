import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, uuidValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/calls:
 *   get:
 *     summary: Get all calls for the authenticated user
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, in-progress, failed]
 *       - in: query
 *         name: sentiment
 *         schema:
 *           type: string
 *           enum: [positive, neutral, negative]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of calls
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { agentId, status, sentiment, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('test_runs')
      .select(`
        *,
        agents(scenario, persona)
      `)
      .eq('user_id', req.user.id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: calls, error } = await query;

    if (error) throw error;

    // Transform data to match frontend expectations
    const transformedCalls = calls?.map(call => ({
      id: call.id,
      agent: call.agents?.scenario || 'Unknown Agent',
      customer: call.results?.customer || 'Unknown Customer',
      duration: call.results?.duration || '0:00',
      status: call.status,
      sentiment: call.results?.sentiment || 'neutral',
      timestamp: call.started_at,
      actions: call.results?.actions || 0
    })) || [];

    res.json(transformedCalls);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/calls/{id}:
 *   get:
 *     summary: Get call details by ID
 *     tags: [Calls]
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
 *         description: Call details
 *       404:
 *         description: Call not found
 */
router.get('/:id', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { data: call, error } = await supabase
      .from('test_runs')
      .select(`
        *,
        agents(scenario, persona)
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Transform data to include transcript, actions, and insights
    const transformedCall = {
      id: call.id,
      agent: call.agents?.scenario || 'Unknown Agent',
      customer: call.results?.customer || 'Unknown Customer',
      duration: call.results?.duration || '0:00',
      status: call.status,
      sentiment: call.results?.sentiment || 'neutral',
      timestamp: call.started_at,
      actions: call.results?.actions || 0,
      transcript: call.results?.transcript || [],
      actionsTaken: call.results?.actionsTaken || [],
      insights: call.results?.insights || [],
      recordingUrl: call.results?.recordingUrl || null
    };

    res.json(transformedCall);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/calls/start:
 *   post:
 *     summary: Start a new call session
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: string
 *                 format: uuid
 *               customerInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Call started successfully
 *       400:
 *         description: Invalid agent ID
 */
router.post('/start', authenticateToken, async (req, res, next) => {
  try {
    const { agentId, customerInfo } = req.body;

    // Verify agent exists and belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', req.user.id)
      .single();

    if (agentError || !agent) {
      return res.status(400).json({ message: 'Invalid agent ID' });
    }

    const callData = {
      id: uuidv4(),
      user_id: req.user.id,
      agent_id: agentId,
      test_case_ids: [],
      time_limit: 60,
      outbound_call_params: customerInfo || {},
      status: 'in-progress',
      started_at: new Date().toISOString(),
      results: {
        customer: customerInfo?.email || 'Unknown Customer',
        duration: '0:00',
        sentiment: 'neutral',
        actions: 0,
        transcript: [],
        actionsTaken: [],
        insights: []
      }
    };

    const { data: call, error } = await supabase
      .from('test_runs')
      .insert(callData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Call started',
      callId: call.id,
      status: 'in-progress'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/calls/{id}/end:
 *   post:
 *     summary: End an active call session
 *     tags: [Calls]
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
 *         description: Call ended successfully
 *       400:
 *         description: Call not in progress
 *       404:
 *         description: Call not found
 */
router.post('/:id/end', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { data: call, error: fetchError } = await supabase
      .from('test_runs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (call.status !== 'in-progress') {
      return res.status(400).json({ message: 'Call is not in progress' });
    }

    const { error } = await supabase
      .from('test_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({
      message: 'Call ended',
      callId: req.params.id,
      status: 'completed'
    });
  } catch (error) {
    next(error);
  }
});

export default router;