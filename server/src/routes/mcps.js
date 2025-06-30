import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import YAML from 'yamljs';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, uuidValidation } from '../middleware/validation.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/json', 'application/x-yaml', 'text/yaml', 'text/plain'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.yaml') || file.originalname.endsWith('.yml')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON and YAML files are allowed.'));
    }
  }
});

/**
 * @swagger
 * /api/v1/mcps:
 *   get:
 *     summary: Get all MCP servers for the authenticated user
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of MCP servers
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    // Return empty array until we have a proper mcps table
    // TODO: Create mcps table and query from database
    res.json([]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}:
 *   get:
 *     summary: Get MCP server by ID
 *     tags: [MCPs]
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
 *         description: MCP server details
 *       404:
 *         description: MCP server not found
 */
router.get('/:id', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    // TODO: Query from mcps table when it exists
    // For now, return 404 since we don't have any real MCPs
    res.status(404).json({ message: 'MCP server not found' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/spec:
 *   post:
 *     summary: Upload an OpenAPI specification
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               specFile:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       202:
 *         description: Specification processing initiated
 *       400:
 *         description: Invalid file format or URL
 */
router.post('/spec', authenticateToken, uploadRateLimiter, upload.single('specFile'), async (req, res, next) => {
  try {
    let specContent;
    let specName;

    if (req.file) {
      // Handle file upload
      const fileContent = req.file.buffer.toString('utf8');
      specName = req.file.originalname;

      try {
        if (req.file.originalname.endsWith('.json')) {
          specContent = JSON.parse(fileContent);
        } else if (req.file.originalname.endsWith('.yaml') || req.file.originalname.endsWith('.yml')) {
          specContent = YAML.parse(fileContent);
        } else {
          // Try to parse as JSON first, then YAML
          try {
            specContent = JSON.parse(fileContent);
          } catch {
            specContent = YAML.parse(fileContent);
          }
        }
      } catch (parseError) {
        return res.status(400).json({ message: 'Invalid JSON or YAML format' });
      }
    } else if (req.body.url) {
      // Handle URL import
      try {
        const response = await fetch(req.body.url);
        if (!response.ok) {
          return res.status(400).json({ message: 'Unable to fetch specification from URL' });
        }
        const contentType = response.headers.get('content-type');
        const content = await response.text();
        
        if (contentType?.includes('application/json')) {
          specContent = JSON.parse(content);
        } else {
          specContent = YAML.parse(content);
        }
        specName = req.body.url.split('/').pop() || 'imported-spec';
      } catch (fetchError) {
        return res.status(400).json({ message: 'Failed to fetch or parse specification from URL' });
      }
    } else {
      return res.status(400).json({ message: 'Either file or URL must be provided' });
    }

    // Validate OpenAPI specification
    if (!specContent.openapi && !specContent.swagger) {
      return res.status(400).json({ message: 'Invalid OpenAPI specification' });
    }

    if (!specContent.info || !specContent.info.title) {
      return res.status(400).json({ message: 'Specification must have info.title' });
    }

    // Create MCP entry with status "creating"
    const mcpId = uuidv4();
    const mcpData = {
      id: mcpId,
      name: specContent.info.title,
      description: specContent.info.description || '',
      version: specContent.info.version || '1.0.0',
      status: 'creating',
      specification: specContent,
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // In production, you would insert into an mcps table
    // For now, we'll simulate the database operation
    console.log('Creating MCP entry:', mcpData);

    // Simulate async processing by updating status after a delay
    setTimeout(async () => {
      console.log(`MCP ${mcpId} processing completed`);
      // In production, you would update the status to 'active' and extract tools
    }, 5000);

    res.status(202).json({
      message: 'Specification processing initiated',
      mcpId,
      status: 'creating'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/tools:
 *   get:
 *     summary: Get tools for an MCP server
 *     tags: [MCPs]
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
 *         description: List of tools
 *       404:
 *         description: MCP server not found
 */
router.get('/:id/tools', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    // TODO: Query tools from database when mcps table exists
    // For now, return empty array since we don't have any real MCPs
    res.json([]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/tools/{toolId}:
 *   patch:
 *     summary: Update tool configuration
 *     tags: [MCPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: toolId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Tool updated successfully
 *       404:
 *         description: MCP server or tool not found
 */
router.patch('/:id/tools/:toolId', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { enabled, config } = req.body;

    // Mock updated tool
    const updatedTool = {
      id: req.params.toolId,
      name: req.params.toolId,
      description: 'Updated tool description',
      enabled: enabled !== undefined ? enabled : true,
      config: config || {}
    };

    res.json(updatedTool);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/templates:
 *   post:
 *     summary: Add a new template to an MCP
 *     tags: [MCPs]
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
 *               - name
 *               - type
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ui, prompt, workflow]
 *               description:
 *                 type: string
 *               linkedPrompt:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template created successfully
 *       404:
 *         description: MCP server not found
 */
router.post('/:id/templates', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { name, type, description, linkedPrompt, content } = req.body;

    const template = {
      id: uuidv4(),
      name,
      type,
      description: description || '',
      linkedPrompt: linkedPrompt || null,
      content,
      mcpId: req.params.id,
      createdAt: new Date().toISOString()
    };

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mcps/{id}/prompts:
 *   post:
 *     summary: Add a new prompt to an MCP
 *     tags: [MCPs]
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
 *               - name
 *               - content
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               linkedTemplates:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *                 enum: [system, user, tool, error]
 *     responses:
 *       201:
 *         description: Prompt created successfully
 *       404:
 *         description: MCP server not found
 */
router.post('/:id/prompts', authenticateToken, uuidValidation, validateRequest, async (req, res, next) => {
  try {
    const { name, content, linkedTemplates, category } = req.body;

    const prompt = {
      id: uuidv4(),
      name,
      content,
      linkedTemplates: linkedTemplates || [],
      category,
      mcpId: req.params.id,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    res.status(201).json(prompt);
  } catch (error) {
    next(error);
  }
});

export default router;