import { PrismaClient } from '@prisma/client';
import { User, ChatMessage, SystemStatus } from '../shared/schema.js';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['error', 'warn', 'info', 'query'],
});

export class PrismaStorage {
  // User management
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

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return await prisma.user.create({
      data: {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
  }

  async updateUserLogin(id: number): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { 
        updatedAt: new Date()
      }
    });
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { 
        passwordHash,
        updatedAt: new Date()
      }
    });
  }

  // Chat message management
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    return await prisma.chatMessage.create({
      data: {
        ...message,
        createdAt: new Date()
      }
    });
  }

  // System status management
  async getSystemStatus(): Promise<any[]> {
    return await prisma.systemStatus.findMany({
      orderBy: { lastChecked: 'desc' }
    });
  }

  async updateSystemStatus(component: string, status: any): Promise<any> {
    return await prisma.systemStatus.upsert({
      where: { component },
      update: {
        ...status,
        lastChecked: new Date()
      },
      create: {
        component,
        status: status.status || 'unknown',
        lastChecked: new Date(),
        ...status
      }
    });
  }
}

// Export singleton instance
export const storage = new PrismaStorage();
export default storage;