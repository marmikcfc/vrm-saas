import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { apiKeyValidation, validateRequest, uuidValidation } from '../middleware/validation.js';

const router = express.Router();

// Helper function to mask API keys
const maskApiKey = (key) => {
  if (!key || key.length < 8) return key;
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
};

/**
 * @swagger
 * /api/v1/api-keys:
 *   get:
 *     summary: Get all API keys (admin only)
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys (masked)
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mask the keys before sending
    const maskedKeys = apiKeys?.map(key => ({
      ...key,
      key: maskApiKey(key.key)
    })) || [];

    res.json(maskedKeys);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/api-keys:
 *   post:
 *     summary: Add a new API key (admin only)
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service
 *               - key
 *             properties:
 *               service:
 *                 type: string
 *               key:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: API key created successfully
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: API key for this service already exists
 */
router.post('/', authenticateToken, requireRole(['admin']), apiKeyValidation, validateRequest, async (req, res, next) => {
  try {
    const { service, key, description } = req.body;

    // Check if API key for this service already exists
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('service', service)
      .single();

    if (existingKey) {
      return res.status(409).json({ message: 'API key for this service already exists' });
    }

    const apiKeyData = {
      id: uuidv4(),
      service,
      key, // In production, encrypt this before storing
      description: description || null,
      created_at: new Date().toISOString()
    };

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert(apiKeyData)
      .select()
      .single();

    if (error) throw error;

    // Return masked key
    res.status(201).json({
      ...apiKey,
      key: maskApiKey(apiKey.key)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/api-keys/{id}:
 *   put:
 *     summary: Update an API key (admin only)
 *     tags: [API Keys]
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
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: API key updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: API key not found
 */
router.put('/:id', authenticateToken, requireRole(['admin']), uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { key, description } = req.body;

    const updateData = {
      key, // In production, encrypt this before storing
      ...(description !== undefined && { description })
    };

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }

    // Return masked key
    res.json({
      ...apiKey,
      key: maskApiKey(apiKey.key)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/api-keys/{id}:
 *   delete:
 *     summary: Delete an API key (admin only)
 *     tags: [API Keys]
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
 *         description: API key deleted successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: API key not found
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(404).json({ message: 'API key not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;