import { PrismaClient } from '@prisma/client';
import type { 
  User, 
  ChatMessage, 
  OracleQuery, 
  SystemStatus,
  UserTask,
  UserNote,
  UserConfiguration,
  ProcessAuthorization
} from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export interface IStorage {
  // User management
  getUserById(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUser(id: number): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  
  // Chat messages
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
  
  // Oracle queries
  getOracleQueries(userId: number): Promise<OracleQuery[]>;
  createOracleQuery(query: Omit<OracleQuery, 'id' | 'createdAt'>): Promise<OracleQuery>;
  
  // System status
  getSystemStatus(): Promise<SystemStatus[]>;
  updateSystemStatus(component: string, status: Partial<SystemStatus>): Promise<SystemStatus>;
  
  // Tasks
  getUserTasks(userId: number): Promise<UserTask[]>;
  createTask(task: Omit<UserTask, 'id' | 'createdAt'>): Promise<UserTask>;
  updateTask(id: number, updates: Partial<UserTask>): Promise<UserTask>;
  
  // Notes
  getUserNotes(userId: number): Promise<UserNote[]>;
  createNote(note: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserNote>;
  
  // Configuration
  getUserConfiguration(userId: number): Promise<UserConfiguration | null>;
  updateUserConfiguration(userId: number, config: Partial<UserConfiguration>): Promise<UserConfiguration>;
}

export class PrismaStorage implements IStorage {
  async getUserById(id: number): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username }
    });
  }

  async getUser(id: number): Promise<User | null> {
    return await this.getUserById(id);
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return await prisma.user.create({
      data: user
    });
  }

  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    return await prisma.chatMessage.create({
      data: message
    });
  }

  async getOracleQueries(userId: number): Promise<OracleQuery[]> {
    return await prisma.oracleQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createOracleQuery(query: Omit<OracleQuery, 'id' | 'createdAt'>): Promise<OracleQuery> {
    return await prisma.oracleQuery.create({
      data: {
        userId: query.userId,
        naturalLanguage: query.naturalLanguage,
        generatedSql: query.generatedSql,
        result: query.result as any,
        executionTime: query.executionTime,
        status: query.status,
        errorMessage: query.errorMessage,
        executedAt: query.executedAt
      }
    });
  }

  async getSystemStatus(): Promise<SystemStatus[]> {
    return await prisma.systemStatus.findMany({
      orderBy: { lastChecked: 'desc' }
    });
  }

  async updateSystemStatus(component: string, status: Partial<SystemStatus>): Promise<SystemStatus> {
    return await prisma.systemStatus.upsert({
      where: { component },
      update: status,
      create: {
        component,
        status: status.status || 'unknown',
        ...status
      }
    });
  }

  async getUserTasks(userId: number): Promise<UserTask[]> {
    return await prisma.userTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createTask(task: Omit<UserTask, 'id' | 'createdAt'>): Promise<UserTask> {
    return await prisma.userTask.create({
      data: task
    });
  }

  async updateTask(id: number, updates: Partial<UserTask>): Promise<UserTask> {
    return await prisma.userTask.update({
      where: { id },
      data: updates
    });
  }

  async getUserNotes(userId: number): Promise<UserNote[]> {
    return await prisma.userNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createNote(note: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserNote> {
    return await prisma.userNote.create({
      data: note
    });
  }

  async getUserConfiguration(userId: number): Promise<UserConfiguration | null> {
    return await prisma.userConfiguration.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateUserConfiguration(userId: number, config: Partial<UserConfiguration>): Promise<UserConfiguration> {
    const existing = await this.getUserConfiguration(userId);
    
    if (existing) {
      return await prisma.userConfiguration.update({
        where: { id: existing.id },
        data: {
          encryptedConfig: config.encryptedConfig as any || existing.encryptedConfig,
          configHash: config.configHash || existing.configHash,
          encryptionVersion: config.encryptionVersion || existing.encryptionVersion
        }
      });
    } else {
      return await prisma.userConfiguration.create({
        data: {
          userId,
          encryptedConfig: config.encryptedConfig as any || {},
          configHash: config.configHash || '',
          encryptionVersion: config.encryptionVersion || 1
        }
      });
    }
  }
}

// Export singleton instance
export const storage = new PrismaStorage();
export default storage;