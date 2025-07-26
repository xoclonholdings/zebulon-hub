import express from 'express';
import { knowledgePool, type KnowledgePoolResult } from '../knowledge-pool.js';

const router = express.Router();

/**
 * POST /api/knowledge/query
 * Pool knowledge from all available AI sources
 */
router.post('/query', async (req, res) => {
  try {
    const { query, targetCore } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query is required and must be a string' 
      });
    }

    if (targetCore && !['zed', 'zync', 'zeta'].includes(targetCore)) {
      return res.status(400).json({ 
        error: 'Target core must be one of: zed, zync, zeta' 
      });
    }

    const result: KnowledgePoolResult = await knowledgePool.poolKnowledge(query, targetCore);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Knowledge pool error:', error);
    res.status(500).json({
      error: 'Failed to pool knowledge',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/knowledge/status
 * Get status of all knowledge sources
 */
router.get('/status', (req, res) => {
  try {
    const status = knowledgePool.getStatus();
    
    res.json({
      success: true,
      sources: {
        openai: {
          name: 'OpenAI (Zed Core)',
          available: status.openai,
          description: 'GPT-4o for general intelligence'
        },
        anthropic: {
          name: 'Anthropic (Zync Core)', 
          available: status.anthropic,
          description: 'Claude Sonnet for development tasks'
        },
        juliusAI: {
          name: 'Julius AI (Zeta Core)',
          available: status.juliusAI,
          description: 'Security and analysis focused'
        },
        ollama: {
          name: 'Ollama (Local Fallback)',
          available: status.ollama,
          description: 'Local LLaMA model for offline operation'
        }
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: (error as Error).message
    });
  }
});

/**
 * PUT /api/knowledge/config
 * Update API configuration
 */
router.put('/config', (req, res) => {
  try {
    const { openaiApiKey, anthropicApiKey, juliusApiKey, ollamaEndpoint } = req.body;

    knowledgePool.updateConfig({
      openaiApiKey,
      anthropicApiKey,
      juliusApiKey,
      ollamaEndpoint
    });

    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({
      error: 'Failed to update configuration',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/knowledge/feed
 * Get recent knowledge pool results
 */
router.get('/feed', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const feedPath = path.join(__dirname, '../../oracle_feed.json');

    try {
      const feedData = await fs.readFile(feedPath, 'utf-8');
      const results = JSON.parse(feedData);
      
      res.json({
        success: true,
        count: results.length,
        data: results.slice(0, 10) // Return last 10 results
      });
    } catch (fileError) {
      res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No feed data available yet'
      });
    }

  } catch (error) {
    console.error('Feed retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve feed',
      message: (error as Error).message
    });
  }
});

export default router;