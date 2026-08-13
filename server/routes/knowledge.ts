import express from 'express';
import { knowledgePool, type KnowledgePoolResult } from '../knowledge-pool.js';
import { requireOwner } from '../zcos-core/requireOwner.js';
import { ownerContextFromRequest } from '../zcos-core/OwnerContext.js';

const router = express.Router();

router.post('/query', requireOwner, async (req, res) => {
  try {
    const { query } = req.body;
    const owner = ownerContextFromRequest(req);

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required and must be a string' });
    }

    const result: KnowledgePoolResult = await knowledgePool.poolKnowledge(query);
    res.json({ success: true, ownerUserId: owner.ownerUserId, galaxyId: owner.originGalaxyId, legacyProjection: true, data: result });
  } catch (error) {
    console.error('Knowledge pool error:', error);
    res.status(500).json({ error: 'Failed to pool knowledge', message: (error as Error).message });
  }
});

router.get('/status', (_req, res) => {
  try {
    const status = knowledgePool.getStatus();
    res.json({ success: true, legacyProjection: true, sources: status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status', message: (error as Error).message });
  }
});

router.put('/config', requireOwner, (req, res) => {
  try {
    const { openaiApiKey, anthropicApiKey, juliusApiKey, ollamaEndpoint } = req.body;
    knowledgePool.updateConfig({ openaiApiKey, anthropicApiKey, juliusApiKey, ollamaEndpoint });
    res.json({ success: true, legacyProjection: true, message: 'Configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update configuration', message: (error as Error).message });
  }
});

router.get('/feed', requireOwner, async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const owner = ownerContextFromRequest(req);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const feedPath = path.join(__dirname, '../../oracle_feed.json');

    try {
      const feedData = await fs.readFile(feedPath, 'utf-8');
      const results = JSON.parse(feedData);
      res.json({ success: true, ownerUserId: owner.ownerUserId, galaxyId: owner.originGalaxyId, legacyProjection: true, count: results.length, data: results.slice(0, 10) });
    } catch {
      res.json({ success: true, ownerUserId: owner.ownerUserId, galaxyId: owner.originGalaxyId, legacyProjection: true, count: 0, data: [] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve feed', message: (error as Error).message });
  }
});

export default router;
