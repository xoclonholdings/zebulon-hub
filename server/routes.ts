import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { processZedCoreMessage, generateRecommendations, processAIMessage } from "./services/local-ai";
import { oracleService } from "./services/oracle";
import { voiceService } from "./services/voice";
import { insertChatMessageSchema, insertOracleQuerySchema, insertTaskSchema, insertNoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'chat':
            await handleChatMessage(ws, data);
            break;
          case 'voice_command':
            await handleVoiceCommand(ws, data);
            break;
          case 'status_update':
            await broadcastStatusUpdate();
            break;
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  async function handleChatMessage(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const validatedData = insertChatMessageSchema.parse(data);
        
        // Process with Zed Core
        const zedResponse = await processZedCoreMessage(validatedData.message, { userId: validatedData.userId });
        
        // Save to storage
        const chatMessage = await storage.createChatMessage({
          ...validatedData,
          response: zedResponse.response,
          metadata: zedResponse.metadata
        });

        // If there's an Oracle query, execute it
        if (zedResponse.sqlQuery) {
          try {
            const queryResult = await oracleService.executeQuery(zedResponse.sqlQuery);
            
            // Save Oracle query
            await storage.createOracleQuery({
              userId: validatedData.userId,
              naturalLanguage: validatedData.message,
              sqlQuery: zedResponse.sqlQuery,
              results: queryResult.rows,
              executionTime: queryResult.metadata.executionTime
            });

            ws.send(JSON.stringify({
              type: 'chat_response',
              message: chatMessage,
              queryResult,
              aiCore: 'zed'
            }));
          } catch (queryError) {
            const errorMessage = queryError instanceof Error ? queryError.message : 'Unknown error';
            ws.send(JSON.stringify({
              type: 'chat_response',
              message: chatMessage,
              error: `Query execution failed: ${errorMessage}`,
              aiCore: 'zed'
            }));
          }
        } else {
          ws.send(JSON.stringify({
            type: 'chat_response',
            message: chatMessage,
            aiCore: 'zed'
          }));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        ws.send(JSON.stringify({
          type: 'error',
          message: `Chat processing failed: ${errorMessage}`
        }));
      }
    }
  }

  async function handleVoiceCommand(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const audioBuffer = Buffer.from(data.audioData, 'base64');
        const result = await voiceService.processVoiceCommand(audioBuffer, data.userId);
        
        if (result.authenticated && result.transcription.text) {
          // Process as regular chat message
          await handleChatMessage(ws, {
            userId: data.userId,
            message: result.transcription.text,
            aiCore: 'zed'
          });
        }

        ws.send(JSON.stringify({
          type: 'voice_response',
          ...result
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        ws.send(JSON.stringify({
          type: 'error',
          message: `Voice processing failed: ${errorMessage}`
        }));
      }
    }
  }

  async function broadcastStatusUpdate() {
    const status = await oracleService.getStatus();
    const statusData = JSON.stringify({
      type: 'status_update',
      oracle: status,
      timestamp: new Date().toISOString()
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(statusData);
      }
    });
  }

  // REST API Routes

  // Authentication and user management
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Oracle database status
  app.get('/api/oracle/status', async (req, res) => {
    try {
      const status = await oracleService.getStatus();
      res.json(status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Execute Oracle query
  app.post('/api/oracle/query', async (req, res) => {
    try {
      const validatedData = insertOracleQuerySchema.parse(req.body);
      
      // Process with Zed Core to get SQL
      const zedResponse = await processZedCoreMessage(validatedData.naturalLanguage);
      
      if (!zedResponse.sqlQuery) {
        return res.status(400).json({ message: 'Could not generate SQL query from natural language' });
      }

      // Validate query
      const validation = await oracleService.validateQuery(zedResponse.sqlQuery);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      // Execute query
      const result = await oracleService.executeQuery(zedResponse.sqlQuery);
      
      // Save query
      const savedQuery = await storage.createOracleQuery({
        ...validatedData,
        sqlQuery: zedResponse.sqlQuery,
        results: result.rows,
        executionTime: result.metadata.executionTime
      });

      res.json({
        query: savedQuery,
        result,
        zedResponse: zedResponse.response
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Chat history
  app.get('/api/chat/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Tasks management
  app.get('/api/tasks/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const tasks = await storage.getUserTasks(userId);
      res.json(tasks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateTask(id, req.body);
      res.json(task);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Notes management
  app.get('/api/notes/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notes = await storage.getUserNotes(userId);
      res.json(notes);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.post('/api/notes', async (req, res) => {
    try {
      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedData);
      res.json(note);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Voice profile management
  app.post('/api/voice/profile', async (req, res) => {
    try {
      const { userId, audioData } = req.body;
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      const voiceId = await voiceService.createVoiceProfile(userId, audioBuffer);
      
      await storage.updateUser(userId, { voiceId });
      
      res.json({ voiceId, message: 'Voice profile created successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Recommendations
  app.get('/api/recommendations/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userActivity = await storage.getUserActivity(userId);
      
      const recommendations = await generateRecommendations(userActivity);
      
      res.json(recommendations);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Weather endpoint (mock implementation)
  app.get('/api/weather/:location?', async (req, res) => {
    try {
      // Mock weather data - in production would use real weather API
      const weather = {
        location: req.params.location || 'San Francisco, CA',
        temperature: '72°F',
        condition: 'Partly Cloudy',
        high: '78°',
        low: '65°',
        humidity: '45%',
        icon: 'fas fa-sun'
      };
      
      res.json(weather);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // System status
  app.get('/api/system/status', async (req, res) => {
    try {
      const oracleStatus = await oracleService.getStatus();
      
      const systemStatus = {
        oracle: oracleStatus,
        fantasma: {
          active: true,
          lastScan: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          threatsDetected: 0
        },
        zeta: {
          monitoring: true,
          alertsActive: 0,
          vaultSecure: true
        },
        apiConnections: 5
      };
      
      res.json(systemStatus);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Storage stats endpoint (for monitoring and optimization)
  app.get('/api/storage/stats', async (req, res) => {
    try {
      const stats = await storage.getStorageStats();
      res.json(stats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Periodic status updates
  setInterval(broadcastStatusUpdate, 30000); // Every 30 seconds

  // User Configuration Management API
  app.get("/api/config/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { zedAuthService } = await import("./services/zed-authorization");
      const config = await zedAuthService.getUserConfig(userId);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user configuration" });
    }
  });

  app.put("/api/config/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { zedAuthService } = await import("./services/zed-authorization");
      const updatedConfig = await zedAuthService.updateUserConfig(userId, req.body);
      res.json(updatedConfig);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user configuration" });
    }
  });

  // Process Authorization Management API
  app.post("/api/authorize", async (req, res) => {
    try {
      const { userId, processType, description, parameters, priority } = req.body;
      const { zedAuthService } = await import("./services/zed-authorization");
      
      const authorization = await zedAuthService.requestAuthorization(
        userId,
        processType,
        description,
        parameters,
        priority
      );
      
      res.json(authorization);
    } catch (error) {
      res.status(500).json({ error: "Failed to request authorization" });
    }
  });

  app.get("/api/authorizations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { zedAuthService } = await import("./services/zed-authorization");
      const authorizations = await zedAuthService.getPendingAuthorizations(userId);
      res.json(authorizations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get authorizations" });
    }
  });

  app.post("/api/authorize/:authId/approve", async (req, res) => {
    try {
      const authId = parseInt(req.params.authId);
      const { approverId } = req.body;
      const { zedAuthService } = await import("./services/zed-authorization");
      
      const authorization = await zedAuthService.approveAuthorization(authId, approverId);
      res.json(authorization);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve authorization" });
    }
  });

  app.post("/api/authorize/:authId/reject", async (req, res) => {
    try {
      const authId = parseInt(req.params.authId);
      const { approverId } = req.body;
      const { zedAuthService } = await import("./services/zed-authorization");
      
      const authorization = await zedAuthService.rejectAuthorization(authId, approverId);
      res.json(authorization);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject authorization" });
    }
  });

  return httpServer;
}
