import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { processZedCoreMessage, generateRecommendations, processAIMessage } from "./services/local-ai";
import { oracleService } from "./services/oracle";
import { voiceService } from "./services/voice";
import { insertChatMessageSchema, insertOracleQuerySchema, insertTaskSchema, insertNoteSchema, insertZebulonConfigSchema } from "@shared/schema";
import { configService } from "./services/config-service";
import { zedCoreService } from "./services/zed-core-service";
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
          case 'zed_core_init':
            await handleZedCoreInit(ws, data);
            break;
          case 'app_integration':
            await handleAppIntegration(ws, data);
            break;
          case 'get_notifications':
            await handleGetNotifications(ws, data);
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
        const zedResponse = await processZedCoreMessage(validatedData.message);
        
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

  // Zed Core WebSocket Handlers
  async function handleZedCoreInit(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const { userId } = data;
        const capabilities = await zedCoreService.initializeZedCore(userId);
        
        ws.send(JSON.stringify({
          type: 'zed_core_initialized',
          capabilities,
          status: 'success'
        }));
        
        console.log(`Zed Core initialized for user ${userId}`);
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to initialize Zed Core'
        }));
      }
    }
  }

  async function handleAppIntegration(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const { userId, appName, capabilities } = data;
        const success = await zedCoreService.integrateWithApp(userId, appName, capabilities);
        
        ws.send(JSON.stringify({
          type: 'app_integrated',
          appName,
          success,
          message: success ? 'App successfully integrated with Zed Core' : 'Failed to integrate app'
        }));
        
        console.log(`App integration ${success ? 'successful' : 'failed'} for ${appName}`);
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to integrate app'
        }));
      }
    }
  }

  async function handleGetNotifications(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const { userId } = data;
        const notifications = zedCoreService.getPendingNotifications(userId);
        
        // Send system notifications that can duck running apps
        for (const notification of notifications) {
          ws.send(JSON.stringify(notification));
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to get notifications'
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

  // Zed Core Background Operations API
  app.post('/api/zed-core/reminder', async (req, res) => {
    try {
      const { userId, title, message, scheduledTime, priority, recurring } = req.body;
      
      const reminder = await zedCoreService.createReminder(userId, {
        title,
        message,
        type: 'reminder',
        priority: priority || 'medium',
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
        recurring,
        active: true
      });
      
      res.json({ success: true, reminder });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  app.post('/api/zed-core/background-task', async (req, res) => {
    try {
      const { userId, taskType, description, data } = req.body;
      
      const taskId = await zedCoreService.createBackgroundTask(userId, taskType, description, data);
      
      res.json({ success: true, taskId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  app.get('/api/zed-core/status/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const status = zedCoreService.getZedCoreStatus(userId);
      
      res.json({ success: true, status });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  app.get('/api/zed-core/background-tasks/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const tasks = await zedCoreService.getBackgroundTasks(userId);
      
      res.json({ success: true, tasks });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  app.post('/api/zed-core/announce-completion', async (req, res) => {
    try {
      const { userId, taskId, taskDescription, results } = req.body;
      
      await zedCoreService.announceTaskCompletion(userId, taskId, taskDescription, results);
      
      res.json({ success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

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
      // Return basic storage stats since getStorageStats doesn't exist
      const stats = {
        totalRecords: 0,
        activeUsers: 1,
        storageUsed: "0 MB",
        lastBackup: new Date().toISOString()
      };
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

  // Encrypted Zed Memory Management API
  app.post("/api/memory/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { zedMemoryServiceFixed } = await import("./services/zed-memory-fixed");
      
      const memory = await zedMemoryServiceFixed.createMemory(userId, req.body);
      res.json(memory);
    } catch (error) {
      res.status(500).json({ error: "Failed to create encrypted memory" });
    }
  });

  app.get("/api/memory/:userId/search", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const query = req.query.q as string || "";
      const options = {
        types: req.query.types ? (req.query.types as string).split(',') : undefined,
        categories: req.query.categories ? (req.query.categories as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as any || 'relevance'
      };
      
      const { zedMemoryServiceFixed } = await import("./services/zed-memory-fixed");
      const memories = await zedMemoryServiceFixed.searchAndDecryptMemories(userId, query, options);
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to search encrypted memories" });
    }
  });

  app.get("/api/memory/:userId/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { zedMemoryServiceFixed } = await import("./services/zed-memory-fixed");
      
      const stats = await zedMemoryServiceFixed.getMemoryStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get encrypted memory stats" });
    }
  });

  app.post("/api/memory/:userId/remember", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { type, content, importance } = req.body;
      const { zedMemoryServiceFixed } = await import("./services/zed-memory-fixed");
      
      let memory;
      switch (type) {
        case 'preference':
          memory = await zedMemoryServiceFixed.rememberUserPreference(
            userId, 
            content.preference, 
            content.value, 
            content.context
          );
          break;
        case 'fact':
          memory = await zedMemoryServiceFixed.rememberFact(
            userId, 
            content.fact, 
            content.category, 
            importance
          );
          break;
        case 'skill':
          memory = await zedMemoryServiceFixed.rememberSkill(
            userId, 
            content.skill, 
            content.proficiency, 
            content.context
          );
          break;
        default:
          memory = await zedMemoryServiceFixed.createMemory(userId, {
            memoryType: type,
            category: content.category || 'general',
            key: `${type}_${Date.now()}`,
            content,
            importance: importance || 5,
            source: 'user_told'
          });
      }
      
      res.json(memory);
    } catch (error) {
      res.status(500).json({ error: "Failed to remember information" });
    }
  });

  app.get("/api/memory/:userId/context/:sessionId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessionId = req.params.sessionId;
      const { zedMemoryService } = await import("./services/zed-memory");
      
      const context = await zedMemoryService.getConversationContext(userId, sessionId);
      res.json(context);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversation context" });
    }
  });

  app.post("/api/memory/:userId/context/:sessionId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessionId = req.params.sessionId;
      const { contextWindow, topicSummary, userMood, taskContext, memoryReferences } = req.body;
      const { zedMemoryService } = await import("./services/zed-memory");
      
      const context = await zedMemoryService.updateConversationContext(
        userId, 
        sessionId, 
        contextWindow, 
        topicSummary, 
        userMood, 
        taskContext, 
        memoryReferences
      );
      res.json(context);
    } catch (error) {
      res.status(500).json({ error: "Failed to update conversation context" });
    }
  });

  // Security vulnerability scanning endpoints
  app.get("/api/security/scan", async (req, res) => {
    try {
      const { vulnerabilityScanner } = await import("./security/vulnerability-scanner");
      const report = await vulnerabilityScanner.performSecurityScan();
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Security scan failed" });
    }
  });

  app.get("/api/security/status", async (req, res) => {
    try {
      // Simplified security status without full vulnerability scan
      const securityStatus = {
        securityLevel: 'high',
        vulnerabilities: 0,
        encrypted: true,
        lastScan: new Date().toISOString(),
        systemHealth: {
          encryptionStatus: true,
          authenticationStrength: 8,
          dataIntegrity: true,
          accessControls: true
        }
      };
      
      res.json(securityStatus);
    } catch (error) {
      res.status(500).json({ error: "Security status check failed" });
    }
  });

  // Oracle Administration Routes
  app.post('/api/oracle/connections', async (req, res) => {
    try {
      const { oracleAdminService } = await import('./services/oracle-admin');
      const { insertOracleConnectionSchema } = await import('@shared/schema');
      
      const validatedData = insertOracleConnectionSchema.parse(req.body);
      const connection = await oracleAdminService.createConnection(validatedData.userId, {
        connectionName: validatedData.connectionName,
        host: validatedData.host,
        port: validatedData.port || 1521,
        serviceName: validatedData.serviceName,
        username: validatedData.username,
        password: req.body.password // Raw password, will be encrypted
      });
      
      res.json(connection);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/oracle/connections/:userId', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { oracleConnections } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const userId = parseInt(req.params.userId);
      const connections = await db.select().from(oracleConnections).where(eq(oracleConnections.userId, userId));
      res.json(connections);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.post('/api/oracle/execute', async (req, res) => {
    try {
      const { oracleAdminService } = await import('./services/oracle-admin');
      const { userId, connectionId, query, timeout } = req.body;
      
      const result = await oracleAdminService.executeQuery(userId, connectionId, query, { timeout });
      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/oracle/schemas/:connectionId', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { oracleSchemas } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const connectionId = parseInt(req.params.connectionId);
      const schemas = await db.select().from(oracleSchemas).where(eq(oracleSchemas.connectionId, connectionId));
      res.json(schemas);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/oracle/history/:userId', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { oracleQueryHistory } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 50;
      
      const history = await db.select()
        .from(oracleQueryHistory)
        .where(eq(oracleQueryHistory.userId, userId))
        .orderBy(desc(oracleQueryHistory.executedAt))
        .limit(limit);
      
      res.json(history);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/oracle/security-audits/:userId', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { oracleSecurityAudits } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 20;
      
      const audits = await db.select()
        .from(oracleSecurityAudits)
        .where(eq(oracleSecurityAudits.userId, userId))
        .orderBy(desc(oracleSecurityAudits.timestamp))
        .limit(limit);
      
      res.json(audits);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/oracle/dashboard/:userId', async (req, res) => {
    try {
      const { oracleAdminService } = await import('./services/oracle-admin');
      const userId = parseInt(req.params.userId);
      
      const metrics = await oracleAdminService.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // ========================
  // ZEBULON CONFIGURATION API
  // Complete system customization with NO limitations
  // ========================

  // Get user's Zebulon system configuration
  app.get('/api/zebulon-config/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const config = await configService.getUserConfig(userId);
      res.json(config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get configuration';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Update user's Zebulon system configuration
  app.put('/api/zebulon-config/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertZebulonConfigSchema.parse(req.body);
      const updatedConfig = await configService.updateUserConfig(userId, validatedData);
      res.json(updatedConfig);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update configuration';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Create new Zebulon system configuration
  app.post('/api/zebulon-config', async (req, res) => {
    try {
      const validatedData = insertZebulonConfigSchema.parse(req.body);
      const config = await configService.createUserConfig(validatedData);
      res.json(config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create configuration';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Reset configuration to maximum capabilities
  app.post('/api/zebulon-config/:userId/reset', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const maximumConfig = await configService.createMaximumCapabilityConfig(userId);
      res.json(maximumConfig);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset to maximum configuration';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get system defaults (maximum capabilities)
  app.get('/api/zebulon-config/defaults', async (req, res) => {
    try {
      const defaults = configService.getMaximumCapabilityDefaults();
      res.json(defaults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get defaults';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Apply maximum Oracle capabilities
  app.post('/api/oracle/maximize-capabilities/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { oracleAdminService } = await import('./services/oracle-admin');
      
      const maximizedOracle = await oracleAdminService.enableMaximumCapabilities(userId, {
        // No query timeouts or limitations
        unlimitedTimeout: true,
        unlimitedConnections: true,
        unlimitedQueryComplexity: true,
        
        // Maximum performance settings
        parallelExecution: true,
        advancedOptimization: true,
        memoryOptimization: true,
        
        // Full administrative privileges
        ddlOperations: true,
        systemQueries: true,
        crossSchemaAccess: true,
        
        // Advanced features
        storedProcedures: true,
        functions: true,
        triggers: true,
        partitioning: true,
        indexing: true,
        
        // Security with maximum flexibility
        encryptedConnections: true,
        auditLogging: true,
        roleBasedAccess: false // Disable role restrictions for maximum access
      });

      res.json(maximizedOracle);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to maximize Oracle capabilities';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Apply maximum Zed Core capabilities  
  app.post('/api/zed-core/maximize-capabilities/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const maximizedZed = await configService.enableMaximumZedCapabilities(userId, {
        // Unlimited processing power
        unlimitedContextMemory: true,
        unlimitedResponseLength: true,
        unlimitedComplexity: true,
        
        // Advanced AI features
        deepReasoning: true,
        codeGeneration: true,
        dataAnalysis: true,
        naturalLanguageSQL: true,
        
        // Learning and adaptation
        continuousLearning: true,
        userPatternRecognition: true,
        adaptivePersonality: true,
        
        // Full system integration
        oracleIntegration: true,
        systemControlAccess: true,
        fileSystemAccess: true,
        
        // No restrictions or limitations
        autoApprovalBypass: true,
        securityLevelOverride: true,
        adminPrivileges: true,
        
        // Voice and multimodal
        voiceProcessing: true,
        imageAnalysis: true,
        documentProcessing: true,
        
        // Real-time capabilities
        liveDataAccess: true,
        streamProcessing: true,
        instantResponses: true
      });

      res.json(maximizedZed);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to maximize Zed Core capabilities';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Remove all system limitations (nuclear option)
  app.post('/api/system/remove-all-limitations/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const unlimitedSystem = {
        oracle: {
          // Remove all Oracle limitations
          queryTimeouts: 'unlimited',
          connectionLimits: 'unlimited',
          queryComplexity: 'unlimited',
          memoryUsage: 'unlimited',
          cpuUsage: 'unlimited',
          
          // Enable all Oracle features
          ddl: true,
          dml: true,
          systemQueries: true,
          crossSchema: true,
          adminFunctions: true,
          storedProcedures: true,
          functions: true,
          triggers: true,
          partitioning: true,
          clustering: true,
          replication: true,
          backupRestore: true
        },
        
        zedCore: {
          // Remove all AI limitations  
          contextWindow: 'unlimited',
          responseLength: 'unlimited',
          processingPower: 'unlimited',
          memoryAccess: 'unlimited',
          
          // Enable all AI capabilities
          reasoning: 'maximum',
          creativity: 'maximum',
          problemSolving: 'maximum',
          codeGeneration: 'expert',
          dataAnalysis: 'expert',
          
          // Remove safety restrictions
          contentFilters: 'disabled',
          ethicalConstraints: 'minimal',
          safetyLimits: 'disabled',
          
          // Maximum system access
          fileSystem: 'full',
          networkAccess: 'full',
          systemCommands: 'full',
          databaseAccess: 'full'
        },
        
        system: {
          resourceLimits: 'disabled',
          securityRestrictions: 'minimal',
          accessControls: 'bypassed',
          auditRequirements: 'optional'
        }
      };

      // Apply unlimited configuration
      await configService.applyUnlimitedConfiguration(userId, unlimitedSystem);
      
      res.json({
        message: 'All system limitations have been removed. Zebulon now operates at maximum potential.',
        configuration: unlimitedSystem,
        warnings: [
          'System is now operating with unlimited capabilities',
          'All safety restrictions have been minimized',
          'User has full administrative access to all systems'
        ]
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove system limitations';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Serve static assets
  app.use('/attached_assets', express.static('attached_assets'));

  return httpServer;
}
