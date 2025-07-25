import { PrismaClient } from '@prisma/client';
import type { 
  User, 
  ChatMessage, 
  OracleQuery, 
  SystemStatus 
} from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: {
    username: string;
    passwordHash: string;
    codename?: string;
    role?: string;
    theme?: string;
    isAdmin?: boolean;
  }): Promise<User>;
  
  // Chat Messages
  createChatMessage(message: {
    userId: number;
    message: string;
    aiCore?: string;
  }): Promise<ChatMessage>;
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  
  // Oracle Queries
  createOracleQuery(query: {
    userId: number;
    naturalLanguage: string;
    generatedSql?: string;
    result?: any;
    executionTime?: number;
    status?: string;
  }): Promise<OracleQuery>;
  getOracleQueries(userId: number): Promise<OracleQuery[]>;
  
  // System Status
  updateSystemStatus(component: string, status: string): Promise<SystemStatus>;
  getSystemStatus(): Promise<SystemStatus[]>;
}

export class PrismaStorage implements IStorage {
  async getUser(id: number): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username }
    });
  }

  async createUser(user: {
    username: string;
    passwordHash: string;
    codename?: string;
    role?: string;
    theme?: string;
    isAdmin?: boolean;
  }): Promise<User> {
    return await prisma.user.create({
      data: {
        username: user.username,
        passwordHash: user.passwordHash,
        codename: user.codename || 'User',
        role: user.role || 'user',
        theme: user.theme || 'dark',
        isAdmin: user.isAdmin || false
      }
    });
  }

  async createChatMessage(message: {
    userId: number;
    message: string;
    aiCore?: string;
  }): Promise<ChatMessage> {
    return await prisma.chatMessage.create({
      data: {
        userId: message.userId,
        message: message.message,
        aiCore: message.aiCore || 'zed'
      }
    });
  }

  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createOracleQuery(query: {
    userId: number;
    naturalLanguage: string;
    generatedSql?: string;
    result?: any;
    executionTime?: number;
    status?: string;
  }): Promise<OracleQuery> {
    return await prisma.oracleQuery.create({
      data: {
        userId: query.userId,
        naturalLanguage: query.naturalLanguage,
        generatedSql: query.generatedSql,
        result: query.result,
        executionTime: query.executionTime,
        status: query.status || 'pending'
      }
    });
  }

  async getOracleQueries(userId: number): Promise<OracleQuery[]> {
    return await prisma.oracleQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateSystemStatus(component: string, status: string): Promise<SystemStatus> {
    return await prisma.systemStatus.upsert({
      where: { component },
      update: { status, lastChecked: new Date() },
      create: { component, status }
    });
  }

  async getSystemStatus(): Promise<SystemStatus[]> {
    return await prisma.systemStatus.findMany({
      orderBy: { lastChecked: 'desc' }
    });
  }
}

// Export singleton instance
export const storage = new PrismaStorage();
export default storage;