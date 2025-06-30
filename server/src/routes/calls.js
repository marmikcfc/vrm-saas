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
    const userId = req.user.id;
    const { agent_id, status, page = 1, limit = 50 } = req.query;

    let query = supabase
      .from('calls')
      .select(`
        *,
        agents!inner(
          id,
          name,
          persona,
          status
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    // Apply filters
    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: calls, error } = await query;

    if (error) {
      console.error('Error fetching calls:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch calls',
        error: error.message 
      });
    }

    // Transform data to match frontend expectations
    const transformedCalls = calls.map(call => ({
      id: call.id,
      agent_id: call.agent_id,
      session_id: call.session_id,
      status: call.status,
      started_at: call.started_at,
      completed_at: call.completed_at,
      duration_seconds: call.duration_seconds,
      recording_url: call.recording_url,
      created_at: call.created_at,
      
      // Legacy format compatibility
      agents: {
        scenario: call.agents?.name || 'Unknown Agent',
        persona: call.agents?.persona,
        status: call.agents?.status
      },
      
      // Caller information
      outbound_call_params: call.caller_info || {},
      
      // Results and analysis
      results: {
        transcript: call.transcript || [],
        sentiment: call.results?.sentiment || 'neutral',
        summary: call.results?.summary || '',
        actions: call.results?.actions || 0,
        actionsTaken: call.results?.actionsTaken || [],
        insights: call.results?.insights || [],
        satisfaction: call.results?.satisfaction || 0.0,
        resolution: call.results?.resolution || '',
        customer: call.caller_info?.name || call.caller_info?.email || 'Unknown',
        duration: formatDuration(call.duration_seconds),
        ...call.results
      },
      
      // Additional metadata
      metadata: call.metadata || {}
    }));

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
    const { id } = req.params;
    const userId = req.user.id;

    const { data: call, error } = await supabase
      .from('calls')
      .select(`
        *,
        agents!inner(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Call not found' });
      }
      console.error('Error fetching call:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch call',
        error: error.message 
      });
    }

    // Transform data to match frontend expectations
    const transformedCall = {
      id: call.id,
      agent_id: call.agent_id,
      session_id: call.session_id,
      status: call.status,
      started_at: call.started_at,
      completed_at: call.completed_at,
      duration_seconds: call.duration_seconds,
      recording_url: call.recording_url,
      created_at: call.created_at,
      
      // Legacy format compatibility
      agents: {
        scenario: call.agents?.name || 'Unknown Agent',
        persona: call.agents?.persona,
        status: call.agents?.status,
        connection_details: call.agents?.connection_details
      },
      
      // Caller information
      outbound_call_params: call.caller_info || {},
      
      // Results and analysis
      results: {
        transcript: call.transcript || [],
        sentiment: call.results?.sentiment || 'neutral',
        summary: call.results?.summary || '',
        actions: call.results?.actions || 0,
        actionsTaken: call.results?.actionsTaken || [],
        insights: call.results?.insights || [],
        satisfaction: call.results?.satisfaction || 0.0,
        resolution: call.results?.resolution || '',
        customer: call.caller_info?.name || call.caller_info?.email || 'Unknown',
        duration: formatDuration(call.duration_seconds),
        ...call.results
      },
      
      // Additional metadata
      metadata: call.metadata || {}
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
      .from('calls')
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
      .from('calls')
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
      .from('calls')
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

// Update a call (typically used to update status, add transcript, results, etc.)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      status,
      completed_at,
      duration_seconds,
      transcript,
      results,
      metadata,
      recording_url
    } = req.body;

    // Build update object
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (completed_at !== undefined) updateData.completed_at = completed_at;
    if (duration_seconds !== undefined) updateData.duration_seconds = duration_seconds;
    if (transcript !== undefined) updateData.transcript = transcript;
    if (results !== undefined) updateData.results = results;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (recording_url !== undefined) updateData.recording_url = recording_url;

    // Auto-set completed_at if status is completed and not already set
    if (status === 'completed' && !completed_at && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: call, error } = await supabase
      .from('calls')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Call not found' });
      }
      console.error('Error updating call:', error);
      return res.status(500).json({ 
        message: 'Failed to update call',
        error: error.message 
      });
    }

    res.json(call);
  } catch (error) {
    next(error);
  }
});

// Delete a call
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('calls')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting call:', error);
      return res.status(500).json({ 
        message: 'Failed to delete call',
        error: error.message 
      });
    }

    res.json({ message: 'Call deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get call analytics/metrics
router.get('/analytics/summary', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { agent_id, start_date, end_date } = req.query;

    let query = supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (agent_id) query = query.eq('agent_id', agent_id);
    if (start_date) query = query.gte('started_at', start_date);
    if (end_date) query = query.lte('started_at', end_date);

    const { data: calls, error } = await query;

    if (error) {
      console.error('Error fetching call analytics:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch call analytics',
        error: error.message 
      });
    }

    // Calculate analytics
    const totalCalls = calls.length;
    const completedCalls = calls.filter(call => call.status === 'completed');
    const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0);
    const avgDuration = completedCalls.length > 0 ? Math.round(totalDuration / completedCalls.length) : 0;
    
    const sentimentCounts = calls.reduce((acc, call) => {
      const sentiment = call.results?.sentiment || 'neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    const statusCounts = calls.reduce((acc, call) => {
      acc[call.status] = (acc[call.status] || 0) + 1;
      return acc;
    }, {});

    const analytics = {
      totalCalls,
      completedCalls: completedCalls.length,
      totalDuration,
      avgDuration: formatDuration(avgDuration),
      avgDurationSeconds: avgDuration,
      successRate: totalCalls > 0 ? Math.round((completedCalls.length / totalCalls) * 100) : 0,
      sentimentBreakdown: sentimentCounts,
      statusBreakdown: statusCounts
    };

    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// Helper function to format duration
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default router;