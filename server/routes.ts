import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-prisma";

// Simple Zed AI response simulator
function simulateZedResponse(message: string): string {
  const responses = [
    `I understand you're asking about "${message}". As Zed, I'm here to help with your Zebulon AI System needs.`,
    `Processing your request: "${message}". Let me assist you with that through the Zebulon interface.`,
    `Thank you for your message: "${message}". I'm analyzing this through my Zed core processes.`,
    `Received: "${message}". As your Zed assistant, I'm ready to help you navigate the Zebulon system.`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Simple authentication middleware
  function requireAuth(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }

  // Chat endpoints - Core Zebulon/Zed functionality
  app.get('/api/chat/:userId', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (userId !== req.session.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/chat/:userId', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (userId !== req.session.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const { message, aiCore } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Create user message
      const userMessage = await storage.createChatMessage({
        userId,
        message,
        aiCore: aiCore || 'zed'
      });

      // Generate Zed AI response
      const aiResponse = simulateZedResponse(message);
      
      const aiMessage = await storage.createChatMessage({
        userId,
        message: aiResponse,
        aiCore: 'zed'
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // System status - Core Zebulon monitoring
  app.get('/api/system/status', async (req, res) => {
    try {
      const status = {
        zedCore: {
          active: true,
          memory: 85,
          tasks: 12,
          uptime: "99.9%",
          lastActivity: new Date().toISOString()
        },
        zebulonSystem: {
          status: "operational",
          version: "1.0.0",
          components: ["Zebulon Core", "Zed AI Assistant"]
        }
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return httpServer;
}