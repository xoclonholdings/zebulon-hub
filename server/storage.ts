import { 
  users, chatMessages, oracleQueries, systemStatus, userTasks, userNotes,
  type User, type InsertUser, type ChatMessage, type InsertChatMessage,
  type OracleQuery, type InsertOracleQuery, type UserTask, type InsertTask,
  type UserNote, type InsertNote, type SystemStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  
  // Chat Messages
  createChatMessage(message: InsertChatMessage & { response?: string; metadata?: any }): Promise<ChatMessage>;
  getChatMessages(userId: number, limit?: number): Promise<ChatMessage[]>;
  
  // Oracle Queries
  createOracleQuery(query: InsertOracleQuery & { sqlQuery?: string; results?: any; executionTime?: number }): Promise<OracleQuery>;
  getOracleQueries(userId: number, limit?: number): Promise<OracleQuery[]>;
  
  // Tasks
  getUserTasks(userId: number): Promise<UserTask[]>;
  createTask(task: InsertTask): Promise<UserTask>;
  updateTask(id: number, updates: Partial<UserTask>): Promise<UserTask>;
  deleteTask(id: number): Promise<boolean>;
  
  // Notes
  getUserNotes(userId: number): Promise<UserNote[]>;
  createNote(note: InsertNote): Promise<UserNote>;
  updateNote(id: number, updates: Partial<UserNote>): Promise<UserNote>;
  deleteNote(id: number): Promise<boolean>;
  
  // System Status
  updateSystemStatus(component: string, status: string, metrics?: any): Promise<SystemStatus>;
  getSystemStatus(component?: string): Promise<SystemStatus[]>;
  
  // User Activity
  getUserActivity(userId: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatMessages: Map<number, ChatMessage>;
  private oracleQueries: Map<number, OracleQuery>;
  private tasks: Map<number, UserTask>;
  private notes: Map<number, UserNote>;
  private systemStatuses: Map<number, SystemStatus>;
  
  private currentUserId: number = 1;
  private currentMessageId: number = 1;
  private currentQueryId: number = 1;
  private currentTaskId: number = 1;
  private currentNoteId: number = 1;
  private currentStatusId: number = 1;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.oracleQueries = new Map();
    this.tasks = new Map();
    this.notes = new Map();
    this.systemStatuses = new Map();
    
    // Create default user (async)
    this.initializeStorage();
    
    // Initialize cleanup intervals for optimization
    this.initializeCleanupTasks();
  }

  private async initializeStorage() {
    await this.createDefaultUser();
  }

  private async createDefaultUser() {
    const { securityManager } = await import("./security/security-manager");
    const hashedPassword = await securityManager.hashPassword('zebulon2025');
    
    const defaultUser: User = {
      id: 1,
      username: 'admin',
      passwordHash: hashedPassword,
      codename: 'System Administrator',
      role: 'Administrator',
      theme: 'dark',
      voiceId: null,
      isActive: true,
      lastLogin: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(1, defaultUser);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: insertUser.username,
      passwordHash: insertUser.passwordHash,
      codename: insertUser.codename,
      role: insertUser.role || 'User',
      theme: insertUser.theme || 'dark',
      voiceId: null,
      isActive: true,
      lastLogin: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Chat Messages
  async createChatMessage(messageData: InsertChatMessage & { response?: string; metadata?: any; isUser?: boolean }): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = {
      id,
      userId: messageData.userId,
      message: messageData.message,
      response: messageData.response || null,
      aiCore: messageData.aiCore,
      isUser: messageData.isUser || false,
      timestamp: new Date(),
      metadata: messageData.metadata || null
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessages(userId: number, limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  // Oracle Queries
  async createOracleQuery(queryData: InsertOracleQuery & { sqlQuery?: string; results?: any; executionTime?: number }): Promise<OracleQuery> {
    const id = this.currentQueryId++;
    const query: OracleQuery = {
      id,
      userId: queryData.userId,
      naturalLanguage: queryData.naturalLanguage,
      sqlQuery: queryData.sqlQuery || null,
      results: queryData.results || null,
      executionTime: queryData.executionTime || null,
      timestamp: new Date()
    };
    this.oracleQueries.set(id, query);
    return query;
  }

  async getOracleQueries(userId: number, limit: number = 50): Promise<OracleQuery[]> {
    return Array.from(this.oracleQueries.values())
      .filter(query => query.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  // Tasks
  async getUserTasks(userId: number): Promise<UserTask[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createTask(taskData: InsertTask): Promise<UserTask> {
    const id = this.currentTaskId++;
    const task: UserTask = {
      id,
      userId: taskData.userId,
      title: taskData.title,
      description: taskData.description || null,
      completed: false,
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<UserTask>): Promise<UserTask> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Notes
  async getUserNotes(userId: number): Promise<UserNote[]> {
    return Array.from(this.notes.values())
      .filter(note => note.userId === userId)
      .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime());
  }

  async createNote(noteData: InsertNote): Promise<UserNote> {
    const id = this.currentNoteId++;
    const note: UserNote = {
      id,
      userId: noteData.userId,
      content: noteData.content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: number, updates: Partial<UserNote>): Promise<UserNote> {
    const note = this.notes.get(id);
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    
    const updatedNote = { ...note, ...updates, updatedAt: new Date() };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  // System Status
  async updateSystemStatus(component: string, status: string, metrics?: any): Promise<SystemStatus> {
    // Find existing status for component or create new one
    const existing = Array.from(this.systemStatuses.values())
      .find(s => s.component === component);

    if (existing) {
      const updated: SystemStatus = {
        ...existing,
        status,
        metrics: metrics || existing.metrics,
        lastCheck: new Date()
      };
      this.systemStatuses.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentStatusId++;
      const newStatus: SystemStatus = {
        id,
        component,
        status,
        metrics: metrics || null,
        lastCheck: new Date()
      };
      this.systemStatuses.set(id, newStatus);
      return newStatus;
    }
  }

  async getSystemStatus(component?: string): Promise<SystemStatus[]> {
    const statuses = Array.from(this.systemStatuses.values());
    if (component) {
      return statuses.filter(s => s.component === component);
    }
    return statuses;
  }

  // User Activity
  async getUserActivity(userId: number): Promise<any> {
    const messages = await this.getChatMessages(userId, 10);
    const queries = await this.getOracleQueries(userId, 10);
    const tasks = await this.getUserTasks(userId);
    
    return {
      userId,
      recentMessages: messages.length,
      totalQueries: queries.length,
      activeTasks: tasks.filter(t => !t.completed).length,
      completedTasks: tasks.filter(t => t.completed).length,
      lastActivity: messages[0]?.timestamp || new Date()
    };
  }

  // Storage Optimization Methods
  private initializeCleanupTasks(): void {
    // Clean up old messages every hour (keep last 1000 per user)
    setInterval(() => this.cleanupOldMessages(), 60 * 60 * 1000);
    
    // Clean up old system status entries every 30 minutes (keep last 100)
    setInterval(() => this.cleanupSystemStatus(), 30 * 60 * 1000);
    
    // Clean up completed tasks older than 7 days
    setInterval(() => this.cleanupOldTasks(), 24 * 60 * 60 * 1000);

    // Memory usage reporting every 15 minutes
    setInterval(() => this.reportMemoryUsage(), 15 * 60 * 1000);
  }

  private cleanupOldMessages(): void {
    const userMessageCounts = new Map<number, ChatMessage[]>();
    
    // Group messages by user
    for (const message of Array.from(this.chatMessages.values())) {
      if (!userMessageCounts.has(message.userId)) {
        userMessageCounts.set(message.userId, []);
      }
      userMessageCounts.get(message.userId)?.push(message);
    }
    
    // Keep only the latest 1000 messages per user
    for (const [userId, messages] of Array.from(userMessageCounts.entries())) {
      if (messages.length > 1000) {
        messages.sort((a: any, b: any) => b.timestamp!.getTime() - a.timestamp!.getTime());
        const toDelete = messages.slice(1000);
        
        for (const message of toDelete) {
          this.chatMessages.delete(message.id);
        }
        
        console.log(`Cleaned up ${toDelete.length} old messages for user ${userId}`);
      }
    }
  }

  private cleanupSystemStatus(): void {
    const statuses = Array.from(this.systemStatuses.values())
      .sort((a, b) => b.lastCheck!.getTime() - a.lastCheck!.getTime());
    
    if (statuses.length > 100) {
      const toDelete = statuses.slice(100);
      
      for (const status of toDelete) {
        this.systemStatuses.delete(status.id);
      }
      
      console.log(`Cleaned up ${toDelete.length} old system status entries`);
    }
  }

  private cleanupOldTasks(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const [id, task] of Array.from(this.tasks.entries())) {
      if (task.completed && task.createdAt && task.createdAt < oneWeekAgo) {
        this.tasks.delete(id);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old completed tasks`);
    }
  }

  private reportMemoryUsage(): void {
    const usage = {
      users: this.users.size,
      chatMessages: this.chatMessages.size,
      oracleQueries: this.oracleQueries.size,
      tasks: this.tasks.size,
      notes: this.notes.size,
      systemStatuses: this.systemStatuses.size,
      totalEntries: this.users.size + this.chatMessages.size + this.oracleQueries.size + 
                   this.tasks.size + this.notes.size + this.systemStatuses.size
    };
    
    console.log('Storage Usage Report:', usage);
  }

  // Bulk operations for performance optimization
  async bulkCreateChatMessages(messages: (InsertChatMessage & { response?: string; metadata?: any })[]): Promise<ChatMessage[]> {
    const created: ChatMessage[] = [];
    
    for (const messageData of messages) {
      const message = await this.createChatMessage(messageData);
      created.push(message);
    }
    
    return created;
  }

  async getStorageStats(): Promise<{
    users: number;
    chatMessages: number;
    oracleQueries: number;
    tasks: number;
    notes: number;
    systemStatuses: number;
    memoryEstimate: string;
  }> {
    // Rough memory estimation (simplified)
    const avgChatMessageSize = 500; // bytes
    const avgQuerySize = 1000;
    const avgTaskSize = 300;
    const avgNoteSize = 400;
    const avgStatusSize = 200;
    
    const estimatedMemory = 
      (this.chatMessages.size * avgChatMessageSize) +
      (this.oracleQueries.size * avgQuerySize) +
      (this.tasks.size * avgTaskSize) +
      (this.notes.size * avgNoteSize) +
      (this.systemStatuses.size * avgStatusSize);
    
    return {
      users: this.users.size,
      chatMessages: this.chatMessages.size,
      oracleQueries: this.oracleQueries.size,
      tasks: this.tasks.size,
      notes: this.notes.size,
      systemStatuses: this.systemStatuses.size,
      memoryEstimate: `${Math.round(estimatedMemory / 1024)} KB`
    };
  }

  // Advanced memory optimization
  async optimizeStorage(): Promise<{
    cleaned: {
      messages: number;
      queries: number;
      tasks: number;
      statuses: number;
    };
    beforeSize: string;
    afterSize: string;
  }> {
    const beforeStats = await this.getStorageStats();
    const beforeSize = beforeStats.memoryEstimate;
    
    let cleanedCounts = {
      messages: 0,
      queries: 0,
      tasks: 0,
      statuses: 0
    };

    // Clean old messages (keep last 500 per user)
    const userMessageGroups = new Map<number, ChatMessage[]>();
    for (const message of Array.from(this.chatMessages.values())) {
      if (!userMessageGroups.has(message.userId)) {
        userMessageGroups.set(message.userId, []);
      }
      userMessageGroups.get(message.userId)?.push(message);
    }

    for (const [userId, messages] of userMessageGroups.entries()) {
      if (messages.length > 500) {
        messages.sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
        const toDelete = messages.slice(500);
        
        for (const message of toDelete) {
          this.chatMessages.delete(message.id);
          cleanedCounts.messages++;
        }
      }
    }

    // Clean old queries (keep last 200 per user)
    const userQueryGroups = new Map<number, OracleQuery[]>();
    for (const query of Array.from(this.oracleQueries.values())) {
      if (!userQueryGroups.has(query.userId)) {
        userQueryGroups.set(query.userId, []);
      }
      userQueryGroups.get(query.userId)?.push(query);
    }

    for (const [userId, queries] of userQueryGroups.entries()) {
      if (queries.length > 200) {
        queries.sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
        const toDelete = queries.slice(200);
        
        for (const query of toDelete) {
          this.oracleQueries.delete(query.id);
          cleanedCounts.queries++;
        }
      }
    }

    // Clean completed tasks older than 14 days
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    for (const [id, task] of Array.from(this.tasks.entries())) {
      if (task.completed && task.createdAt && task.createdAt < twoWeeksAgo) {
        this.tasks.delete(id);
        cleanedCounts.tasks++;
      }
    }

    // Clean old system statuses (keep last 50)
    const statuses = Array.from(this.systemStatuses.values())
      .sort((a, b) => b.lastCheck!.getTime() - a.lastCheck!.getTime());
    
    if (statuses.length > 50) {
      const toDelete = statuses.slice(50);
      for (const status of toDelete) {
        this.systemStatuses.delete(status.id);
        cleanedCounts.statuses++;
      }
    }

    const afterStats = await this.getStorageStats();
    const afterSize = afterStats.memoryEstimate;

    console.log('Storage optimization completed:', {
      cleaned: cleanedCounts,
      beforeSize,
      afterSize
    });

    return {
      cleaned: cleanedCounts,
      beforeSize,
      afterSize
    };
  }

  // Performance monitoring
  async getPerformanceMetrics(): Promise<{
    averageQueryTime: number;
    totalOperations: number;
    cacheHitRate: number;
    memoryEfficiency: number;
  }> {
    // Simulate performance metrics based on storage size
    const stats = await this.getStorageStats();
    const totalOperations = stats.chatMessages + stats.oracleQueries + stats.tasks;
    
    return {
      averageQueryTime: Math.max(10, Math.min(100, totalOperations / 100)), // ms
      totalOperations,
      cacheHitRate: Math.max(0.7, 1 - (totalOperations / 10000)), // Efficiency decreases with load
      memoryEfficiency: Math.max(0.6, 1 - (parseInt(stats.memoryEstimate) / 10000)) // Efficiency based on memory usage
    };
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createChatMessage(message: InsertChatMessage & { response?: string; metadata?: any }): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return chatMessage;
  }

  async getChatMessages(userId: number, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  async createOracleQuery(query: InsertOracleQuery & { sqlQuery?: string; results?: any; executionTime?: number }): Promise<OracleQuery> {
    const [oracleQuery] = await db
      .insert(oracleQueries)
      .values(query)
      .returning();
    return oracleQuery;
  }

  async getOracleQueries(userId: number, limit: number = 50): Promise<OracleQuery[]> {
    return await db
      .select()
      .from(oracleQueries)
      .where(eq(oracleQueries.userId, userId))
      .orderBy(desc(oracleQueries.timestamp))
      .limit(limit);
  }

  async getUserTasks(userId: number): Promise<UserTask[]> {
    return await db
      .select()
      .from(userTasks)
      .where(eq(userTasks.userId, userId))
      .orderBy(desc(userTasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<UserTask> {
    const [userTask] = await db
      .insert(userTasks)
      .values(task)
      .returning();
    return userTask;
  }

  async updateTask(id: number, updates: Partial<UserTask>): Promise<UserTask> {
    const [userTask] = await db
      .update(userTasks)
      .set(updates)
      .where(eq(userTasks.id, id))
      .returning();
    return userTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(userTasks)
      .where(eq(userTasks.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUserNotes(userId: number): Promise<UserNote[]> {
    return await db
      .select()
      .from(userNotes)
      .where(eq(userNotes.userId, userId))
      .orderBy(desc(userNotes.updatedAt));
  }

  async createNote(note: InsertNote): Promise<UserNote> {
    const [userNote] = await db
      .insert(userNotes)
      .values(note)
      .returning();
    return userNote;
  }

  async updateNote(id: number, updates: Partial<UserNote>): Promise<UserNote> {
    const [userNote] = await db
      .update(userNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userNotes.id, id))
      .returning();
    return userNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await db
      .delete(userNotes)
      .where(eq(userNotes.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateSystemStatus(component: string, status: string, metrics?: any): Promise<SystemStatus> {
    // First try to update existing record
    const existing = await db
      .select()
      .from(systemStatus)
      .where(eq(systemStatus.component, component))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(systemStatus)
        .set({ status, metrics, lastCheck: new Date() })
        .where(eq(systemStatus.component, component))
        .returning();
      return updated;
    } else {
      // Insert new record
      const [newRecord] = await db
        .insert(systemStatus)
        .values({ component, status, metrics })
        .returning();
      return newRecord;
    }
  }

  async getSystemStatus(component?: string): Promise<SystemStatus[]> {
    if (component) {
      return await db
        .select()
        .from(systemStatus)
        .where(eq(systemStatus.component, component));
    }
    return await db.select().from(systemStatus);
  }

  async getUserActivity(userId: number): Promise<any> {
    // Get recent activity across all user data
    const tasks = await this.getUserTasks(userId);
    const notes = await this.getUserNotes(userId);
    const chats = await this.getChatMessages(userId, 10);
    const queries = await this.getOracleQueries(userId, 10);
    
    return {
      recentTasks: tasks.slice(0, 5),
      recentNotes: notes.slice(0, 5),
      recentChats: chats.slice(0, 5),
      recentQueries: queries.slice(0, 5)
    };
  }
}

export const storage = new DatabaseStorage();
