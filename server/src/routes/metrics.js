import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { metricsValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/metrics:
 *   get:
 *     summary: Get platform metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of metrics
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;

    // Get custom metrics from database
    let query = supabase
      .from('metrics')
      .select('*')
      .eq('user_id', req.user.id);

    const { data: customMetrics, error } = await query;

    if (error) throw error;

    // Generate mock platform metrics
    const platformMetrics = [
      {
        id: uuidv4(),
        name: 'Total Calls',
        value: 2847,
        unit: 'calls',
        trend: '+12% this month',
        graphData: [
          { day: 'Mon', value: 380, label: 'Jan 15' },
          { day: 'Tue', value: 420, label: 'Jan 16' },
          { day: 'Wed', value: 390, label: 'Jan 17' },
          { day: 'Thu', value: 450, label: 'Jan 18' },
          { day: 'Fri', value: 410, label: 'Jan 19' },
          { day: 'Sat', value: 380, label: 'Jan 20' },
          { day: 'Sun', value: 400, label: 'Jan 21' }
        ]
      },
      {
        id: uuidv4(),
        name: 'Average Duration',
        value: 272,
        unit: 'seconds',
        trend: '+15% this month',
        graphData: [
          { day: 'Mon', value: 240, label: 'Jan 15' },
          { day: 'Tue', value: 260, label: 'Jan 16' },
          { day: 'Wed', value: 250, label: 'Jan 17' },
          { day: 'Thu', value: 280, label: 'Jan 18' },
          { day: 'Fri', value: 270, label: 'Jan 19' },
          { day: 'Sat', value: 260, label: 'Jan 20' },
          { day: 'Sun', value: 272, label: 'Jan 21' }
        ]
      },
      {
        id: uuidv4(),
        name: 'Agents Created',
        value: 12,
        unit: 'agents',
        trend: '+3 this week',
        graphData: [
          { day: 'Mon', value: 8, label: 'Jan 15' },
          { day: 'Tue', value: 10, label: 'Jan 16' },
          { day: 'Wed', value: 9, label: 'Jan 17' },
          { day: 'Thu', value: 12, label: 'Jan 18' },
          { day: 'Fri', value: 11, label: 'Jan 19' },
          { day: 'Sat', value: 12, label: 'Jan 20' },
          { day: 'Sun', value: 12, label: 'Jan 21' }
        ]
      }
    ];

    // Combine platform and custom metrics
    const allMetrics = [...platformMetrics, ...(customMetrics || [])];

    res.json(allMetrics);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/metrics:
 *   post:
 *     summary: Add a custom metric
 *     tags: [Metrics]
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
 *               - toolCall
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               toolCall:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Metric created successfully
 */
router.post('/', authenticateToken, metricsValidation, validateRequest, async (req, res, next) => {
  try {
    const { name, toolCall, description } = req.body;

    const metricData = {
      id: uuidv4(),
      name,
      prompt: toolCall, // Using prompt field to store toolCall
      user_id: req.user.id,
      created_at: new Date().toISOString()
    };

    const { data: metric, error } = await supabase
      .from('metrics')
      .insert(metricData)
      .select()
      .single();

    if (error) throw error;

    // Transform response to include additional fields
    const responseMetric = {
      ...metric,
      toolCall: metric.prompt,
      description,
      value: 0,
      unit: 'count',
      trend: 'New metric',
      graphData: []
    };

    res.status(201).json(responseMetric);
  } catch (error) {
    next(error);
  }
});

export default router;