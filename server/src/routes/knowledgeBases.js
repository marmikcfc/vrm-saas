import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { knowledgeBaseValidation, validateRequest, uuidValidation } from '../middleware/validation.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/json'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, and JSON files are allowed.'));
    }
  }
});

/**
 * @swagger
 * /api/v1/knowledge-bases:
 *   get:
 *     summary: Get all knowledge bases for the authenticated user
 *     tags: [Knowledge Bases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of knowledge bases
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    // For now, return mock data since we don't have a knowledge_bases table
    // In production, you would create a knowledge_bases table
    const mockKnowledgeBases = [
      {
        id: uuidv4(),
        name: 'Product Documentation',
        description: 'Complete product guides and API documentation',
        sources: 23,
        lastUpdated: new Date().toISOString(),
        status: 'active',
        category: 'product'
      },
      {
        id: uuidv4(),
        name: 'Support Articles',
        description: 'Customer support knowledge base and FAQs',
        sources: 45,
        lastUpdated: new Date(Date.now() - 86400000).toISOString(),
        status: 'active',
        category: 'support'
      }
    ];

    res.json(mockKnowledgeBases);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/knowledge-bases/{id}:
 *   get:
 *     summary: Get knowledge base by ID
 *     tags: [Knowledge Bases]
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
 *         description: Knowledge base details
 *       404:
 *         description: Knowledge base not found
 */
router.get('/:id', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    // Mock response for now
    const mockKnowledgeBase = {
      id: req.params.id,
      name: 'Product Documentation',
      description: 'Complete product guides and API documentation',
      sources: 23,
      lastUpdated: new Date().toISOString(),
      status: 'active',
      category: 'product',
      documents: [
        { id: uuidv4(), name: 'API Guide.pdf', type: 'pdf', status: 'processed', size: '2.4 MB' },
        { id: uuidv4(), name: 'Getting Started.txt', type: 'text', status: 'processed', size: '156 KB' }
      ]
    };

    res.json(mockKnowledgeBase);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/knowledge-bases:
 *   post:
 *     summary: Create a new knowledge base
 *     tags: [Knowledge Bases]
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
 *               - description
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [product, support, training]
 *               initialSources:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Knowledge base created successfully
 */
router.post('/', authenticateToken, knowledgeBaseValidation, validateRequest, async (req, res, next) => {
  try {
    const { name, description, category, initialSources } = req.body;

    const knowledgeBase = {
      id: uuidv4(),
      name,
      description,
      category,
      sources: initialSources?.length || 0,
      lastUpdated: new Date().toISOString(),
      status: 'active',
      userId: req.user.id,
      createdAt: new Date().toISOString()
    };

    // In production, you would insert into a knowledge_bases table
    // For now, return the mock object

    res.status(201).json(knowledgeBase);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/knowledge-bases/{id}/documents:
 *   post:
 *     summary: Upload a document to a knowledge base
 *     tags: [Knowledge Bases]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Document upload initiated
 *       400:
 *         description: Invalid file type or size
 *       404:
 *         description: Knowledge base not found
 */
router.post('/:id/documents', authenticateToken, uploadRateLimiter, uuidValidation, validateRequest, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const documentId = uuidv4();

    // In production, you would:
    // 1. Store the file in cloud storage (S3, etc.)
    // 2. Process the document content
    // 3. Extract and index the text
    // 4. Store metadata in database

    res.status(202).json({
      message: 'Document upload initiated',
      documentId,
      status: 'processing'
    });
  } catch (error) {
    next(error);
  }
});

export default router;