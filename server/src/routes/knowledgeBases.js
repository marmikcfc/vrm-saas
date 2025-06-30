import express from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedMimes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/json'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, MD, DOC, DOCX, CSV, and JSON files are allowed.'));
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
    const userId = req.user.id;
    const { category, status } = req.query;

    let query = supabase
      .from('knowledge_bases')
      .select(`
        *,
        agent_knowledge!inner(
          agents(id, name, status)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: knowledgeBases, error } = await query;

    if (error) {
      console.error('Error fetching knowledge bases:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch knowledge bases',
        error: error.message 
      });
    }

    // Transform data to include agent links and source counts
    const transformedKBs = knowledgeBases.map(kb => ({
      id: kb.id,
      name: kb.name,
      description: kb.description,
      category: kb.category,
      status: kb.status,
      sources: kb.sources || [],
      sourceCount: (kb.sources || []).length,
      config: kb.config || {},
      last_updated: kb.last_updated,
      created_at: kb.created_at,
      linkedAgents: kb.agent_knowledge?.map(ak => ak.agents) || []
    }));

    res.json(transformedKBs);
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
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: kb, error } = await supabase
      .from('knowledge_bases')
      .select(`
        *,
        agent_knowledge!inner(
          agents(id, name, status)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Knowledge base not found' });
      }
      console.error('Error fetching knowledge base:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch knowledge base',
        error: error.message 
      });
    }

    // Transform data
    const transformedKB = {
      id: kb.id,
      name: kb.name,
      description: kb.description,
      category: kb.category,
      status: kb.status,
      sources: kb.sources || [],
      sourceCount: (kb.sources || []).length,
      config: kb.config || {},
      last_updated: kb.last_updated,
      created_at: kb.created_at,
      linkedAgents: kb.agent_knowledge?.map(ak => ak.agents) || []
    };

    res.json(transformedKB);
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
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      description, 
      category = 'general',
      sources = [],
      config = {}
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Knowledge base name is required' });
    }

    const { data: kb, error } = await supabase
      .from('knowledge_bases')
      .insert({
        user_id: userId,
        name,
        description: description || '',
        category,
        status: 'draft',
        sources,
        config,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating knowledge base:', error);
      return res.status(500).json({ 
        message: 'Failed to create knowledge base',
        error: error.message 
      });
    }

    res.status(201).json(kb);
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
router.post('/:id/documents', authenticateToken, upload.single('file'), async (req, res, next) => {
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

// Update a knowledge base
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      name, 
      description, 
      category,
      status,
      sources,
      config
    } = req.body;

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (sources !== undefined) updateData.sources = sources;
    if (config !== undefined) updateData.config = config;
    
    // Always update last_updated timestamp
    updateData.last_updated = new Date().toISOString();

    const { data: kb, error } = await supabase
      .from('knowledge_bases')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Knowledge base not found' });
      }
      console.error('Error updating knowledge base:', error);
      return res.status(500).json({ 
        message: 'Failed to update knowledge base',
        error: error.message 
      });
    }

    res.json(kb);
  } catch (error) {
    next(error);
  }
});

// Delete a knowledge base
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('knowledge_bases')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting knowledge base:', error);
      return res.status(500).json({ 
        message: 'Failed to delete knowledge base',
        error: error.message 
      });
    }

    res.json({ message: 'Knowledge base deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Upload files to a knowledge base
router.post('/:id/upload', authenticateToken, upload.array('files', 10), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    // Verify knowledge base exists and belongs to user
    const { data: kb, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('sources')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (kbError || !kb) {
      return res.status(404).json({ message: 'Knowledge base not found' });
    }

    const existingSources = kb.sources || [];
    const newSources = [];

    // Process each uploaded file
    for (const file of files) {
      // For now, we'll store file metadata
      // In a real implementation, you would:
      // 1. Upload file to cloud storage (AWS S3, etc.)
      // 2. Process the file content (extract text, chunk, embed)
      // 3. Store embeddings in vector database
      
      const sourceData = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'file',
        name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `uploads/${userId}/${id}/${file.originalname}`, // Placeholder path
        processed: false,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.originalname,
          encoding: file.encoding
        }
      };

      newSources.push(sourceData);
    }

    // Update knowledge base with new sources
    const updatedSources = [...existingSources, ...newSources];
    
    const { data: updatedKB, error: updateError } = await supabase
      .from('knowledge_bases')
      .update({
        sources: updatedSources,
        last_updated: new Date().toISOString(),
        status: 'processing' // Mark as processing since we have new files
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating knowledge base with new sources:', updateError);
      return res.status(500).json({ 
        message: 'Failed to update knowledge base with uploaded files',
        error: updateError.message 
      });
    }

    res.json({
      message: `Successfully uploaded ${files.length} file(s)`,
      uploadedFiles: newSources.map(source => ({
        id: source.id,
        name: source.name,
        size: source.size
      })),
      knowledgeBase: updatedKB
    });
  } catch (error) {
    next(error);
  }
});

// Add URL source to knowledge base
router.post('/:id/sources/url', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { url, name } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    // Verify knowledge base exists and belongs to user
    const { data: kb, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('sources')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (kbError || !kb) {
      return res.status(404).json({ message: 'Knowledge base not found' });
    }

    const existingSources = kb.sources || [];
    
    // Check if URL already exists
    const urlExists = existingSources.some(source => 
      source.type === 'url' && source.path === url
    );

    if (urlExists) {
      return res.status(400).json({ message: 'URL already exists in this knowledge base' });
    }

    const newSource = {
      id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'url',
      name: name || url,
      path: url,
      processed: false,
      metadata: {
        addedAt: new Date().toISOString(),
        domain: new URL(url).hostname
      }
    };

    const updatedSources = [...existingSources, newSource];
    
    const { data: updatedKB, error: updateError } = await supabase
      .from('knowledge_bases')
      .update({
        sources: updatedSources,
        last_updated: new Date().toISOString(),
        status: 'processing'
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error adding URL source:', updateError);
      return res.status(500).json({ 
        message: 'Failed to add URL source',
        error: updateError.message 
      });
    }

    res.json({
      message: 'URL source added successfully',
      source: newSource,
      knowledgeBase: updatedKB
    });
  } catch (error) {
    next(error);
  }
});

// Remove a source from knowledge base
router.delete('/:id/sources/:sourceId', authenticateToken, async (req, res, next) => {
  try {
    const { id, sourceId } = req.params;
    const userId = req.user.id;

    // Get current knowledge base
    const { data: kb, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('sources')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (kbError || !kb) {
      return res.status(404).json({ message: 'Knowledge base not found' });
    }

    const existingSources = kb.sources || [];
    const sourceIndex = existingSources.findIndex(source => source.id === sourceId);

    if (sourceIndex === -1) {
      return res.status(404).json({ message: 'Source not found' });
    }

    // Remove the source
    const updatedSources = existingSources.filter(source => source.id !== sourceId);
    
    const { data: updatedKB, error: updateError } = await supabase
      .from('knowledge_bases')
      .update({
        sources: updatedSources,
        last_updated: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error removing source:', updateError);
      return res.status(500).json({ 
        message: 'Failed to remove source',
        error: updateError.message 
      });
    }

    res.json({
      message: 'Source removed successfully',
      knowledgeBase: updatedKB
    });
  } catch (error) {
    next(error);
  }
});

// Link knowledge base to agent
router.post('/:id/agents/:agentId', authenticateToken, async (req, res, next) => {
  try {
    const { id, agentId } = req.params;
    const userId = req.user.id;
    const { priority = 1 } = req.body;

    // Verify both knowledge base and agent belong to user
    const [kbCheck, agentCheck] = await Promise.all([
      supabase.from('knowledge_bases').select('id').eq('id', id).eq('user_id', userId).single(),
      supabase.from('agents').select('id').eq('id', agentId).eq('user_id', userId).single()
    ]);

    if (kbCheck.error || agentCheck.error) {
      return res.status(404).json({ message: 'Knowledge base or agent not found' });
    }

    // Create the link
    const { data: link, error } = await supabase
      .from('agent_knowledge')
      .insert({
        agent_id: agentId,
        knowledge_base_id: id,
        priority
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: 'Knowledge base is already linked to this agent' });
      }
      console.error('Error linking knowledge base to agent:', error);
      return res.status(500).json({ 
        message: 'Failed to link knowledge base to agent',
        error: error.message 
      });
    }

    res.status(201).json({
      message: 'Knowledge base linked to agent successfully',
      link
    });
  } catch (error) {
    next(error);
  }
});

// Unlink knowledge base from agent
router.delete('/:id/agents/:agentId', authenticateToken, async (req, res, next) => {
  try {
    const { id, agentId } = req.params;
    const userId = req.user.id;

    // Verify the link exists and user owns the agent
    const { error } = await supabase
      .from('agent_knowledge')
      .delete()
      .eq('knowledge_base_id', id)
      .eq('agent_id', agentId)
      .in('agent_id', 
        supabase.from('agents').select('id').eq('user_id', userId)
      );

    if (error) {
      console.error('Error unlinking knowledge base from agent:', error);
      return res.status(500).json({ 
        message: 'Failed to unlink knowledge base from agent',
        error: error.message 
      });
    }

    res.json({ message: 'Knowledge base unlinked from agent successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;