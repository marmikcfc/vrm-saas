import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all metrics for the authenticated user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { metric_type } = req.query;

    let query = supabase
      .from('metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (metric_type) {
      query = query.eq('metric_type', metric_type);
    }

    const { data: metrics, error } = await query;

    if (error) {
      console.error('Error fetching metrics:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch metrics',
        error: error.message 
      });
    }

    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// Get a specific metric with its events
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { start_date, end_date, limit = 100 } = req.query;

    // Get the metric
    const { data: metric, error: metricError } = await supabase
      .from('metrics')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (metricError) {
      if (metricError.code === 'PGRST116') {
        return res.status(404).json({ message: 'Metric not found' });
      }
      console.error('Error fetching metric:', metricError);
      return res.status(500).json({ 
        message: 'Failed to fetch metric',
        error: metricError.message 
      });
    }

    // Get metric events
    let eventsQuery = supabase
      .from('metric_events')
      .select(`
        *,
        calls(id, agent_id, started_at, status)
      `)
      .eq('metric_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (start_date) {
      eventsQuery = eventsQuery.gte('created_at', start_date);
    }
    if (end_date) {
      eventsQuery = eventsQuery.lte('created_at', end_date);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Error fetching metric events:', eventsError);
      return res.status(500).json({ 
        message: 'Failed to fetch metric events',
        error: eventsError.message 
      });
    }

    // Calculate aggregated data
    const totalEvents = events.length;
    const totalValue = events.reduce((sum, event) => sum + (event.data?.value || 1), 0);
    
    // Group events by date for trending
    const eventsByDate = events.reduce((acc, event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { count: 0, value: 0 };
      }
      acc[date].count += 1;
      acc[date].value += (event.data?.value || 1);
      return acc;
    }, {});

    const trendData = Object.entries(eventsByDate).map(([date, data]) => ({
      date,
      count: data.count,
      value: data.value
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      metric,
      events,
      summary: {
        totalEvents,
        totalValue,
        avgValue: totalEvents > 0 ? totalValue / totalEvents : 0,
        trendData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create a new metric
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      tool_call, 
      description, 
      metric_type = 'counter'
    } = req.body;

    if (!name || !tool_call) {
      return res.status(400).json({ message: 'Name and tool_call are required' });
    }

    // Validate metric_type
    if (!['counter', 'gauge', 'histogram'].includes(metric_type)) {
      return res.status(400).json({ message: 'Invalid metric type. Must be counter, gauge, or histogram' });
    }

    const { data: metric, error } = await supabase
      .from('metrics')
      .insert({
        user_id: userId,
        name,
        tool_call,
        description: description || '',
        metric_type
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating metric:', error);
      return res.status(500).json({ 
        message: 'Failed to create metric',
        error: error.message 
      });
    }

    res.status(201).json(metric);
  } catch (error) {
    next(error);
  }
});

// Update a metric
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      name, 
      tool_call, 
      description, 
      metric_type
    } = req.body;

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (tool_call !== undefined) updateData.tool_call = tool_call;
    if (description !== undefined) updateData.description = description;
    if (metric_type !== undefined) {
      if (!['counter', 'gauge', 'histogram'].includes(metric_type)) {
        return res.status(400).json({ message: 'Invalid metric type. Must be counter, gauge, or histogram' });
      }
      updateData.metric_type = metric_type;
    }

    const { data: metric, error } = await supabase
      .from('metrics')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Metric not found' });
      }
      console.error('Error updating metric:', error);
      return res.status(500).json({ 
        message: 'Failed to update metric',
        error: error.message 
      });
    }

    res.json(metric);
  } catch (error) {
    next(error);
  }
});

// Delete a metric
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('metrics')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting metric:', error);
      return res.status(500).json({ 
        message: 'Failed to delete metric',
        error: error.message 
      });
    }

    res.json({ message: 'Metric deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Record a metric event
router.post('/:id/events', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      call_id, 
      data = {}, 
      value = 1 
    } = req.body;

    // Verify metric exists and belongs to user
    const { data: metric, error: metricError } = await supabase
      .from('metrics')
      .select('id, metric_type')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (metricError || !metric) {
      return res.status(404).json({ message: 'Metric not found' });
    }

    // If call_id is provided, verify it belongs to user
    if (call_id) {
      const { data: call, error: callError } = await supabase
        .from('calls')
        .select('id')
        .eq('id', call_id)
        .eq('user_id', userId)
        .single();

      if (callError || !call) {
        return res.status(404).json({ message: 'Call not found' });
      }
    }

    // Prepare event data
    const eventData = {
      ...data,
      value,
      timestamp: new Date().toISOString()
    };

    const { data: event, error } = await supabase
      .from('metric_events')
      .insert({
        metric_id: id,
        call_id: call_id || null,
        data: eventData
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording metric event:', error);
      return res.status(500).json({ 
        message: 'Failed to record metric event',
        error: error.message 
      });
    }

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

// Get metric events for a specific metric
router.get('/:id/events', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      start_date, 
      end_date, 
      call_id,
      page = 1, 
      limit = 50 
    } = req.query;

    // Verify metric belongs to user
    const { data: metric, error: metricError } = await supabase
      .from('metrics')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (metricError || !metric) {
      return res.status(404).json({ message: 'Metric not found' });
    }

    let query = supabase
      .from('metric_events')
      .select(`
        *,
        calls(id, agent_id, started_at, status)
      `)
      .eq('metric_id', id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);
    if (call_id) query = query.eq('call_id', call_id);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching metric events:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch metric events',
        error: error.message 
      });
    }

    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Get aggregated metrics dashboard data
router.get('/dashboard/summary', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    // Get all metrics for the user
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('*')
      .eq('user_id', userId);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return res.status(500).json({ 
        message: 'Failed to fetch metrics',
        error: metricsError.message 
      });
    }

    if (metrics.length === 0) {
      return res.json({
        totalMetrics: 0,
        totalEvents: 0,
        metricsBreakdown: {},
        recentActivity: []
      });
    }

    // Get all metric events in the date range
    let eventsQuery = supabase
      .from('metric_events')
      .select(`
        *,
        metrics!inner(name, metric_type)
      `)
      .in('metric_id', metrics.map(m => m.id))
      .order('created_at', { ascending: false })
      .limit(1000); // Reasonable limit for dashboard

    if (start_date) eventsQuery = eventsQuery.gte('created_at', start_date);
    if (end_date) eventsQuery = eventsQuery.lte('created_at', end_date);

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Error fetching metric events:', eventsError);
      return res.status(500).json({ 
        message: 'Failed to fetch metric events',
        error: eventsError.message 
      });
    }

    // Calculate summary statistics
    const totalEvents = events.length;
    
    // Group events by metric
    const metricsBreakdown = events.reduce((acc, event) => {
      const metricName = event.metrics.name;
      if (!acc[metricName]) {
        acc[metricName] = {
          name: metricName,
          type: event.metrics.metric_type,
          count: 0,
          totalValue: 0
        };
      }
      acc[metricName].count += 1;
      acc[metricName].totalValue += (event.data?.value || 1);
      return acc;
    }, {});

    // Get recent activity (last 10 events)
    const recentActivity = events.slice(0, 10).map(event => ({
      id: event.id,
      metricName: event.metrics.name,
      value: event.data?.value || 1,
      timestamp: event.created_at,
      callId: event.call_id
    }));

    // Generate time series data for trending
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const trendData = last7Days.map(date => {
      const dayEvents = events.filter(event => 
        event.created_at.startsWith(date)
      );
      return {
        date,
        count: dayEvents.length,
        value: dayEvents.reduce((sum, event) => sum + (event.data?.value || 1), 0)
      };
    });

    res.json({
      totalMetrics: metrics.length,
      totalEvents,
      metricsBreakdown: Object.values(metricsBreakdown),
      recentActivity,
      trendData
    });
  } catch (error) {
    next(error);
  }
});

export default router;