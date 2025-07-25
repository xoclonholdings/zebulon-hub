import { PrismaClient } from '@prisma/client';
import { User, ChatMessage, SystemStatus, OracleMemory, InsertOracleMemory } from '../shared/schema.js';

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

  // Oracle Memory management
  async getOracleMemories(): Promise<OracleMemory[]> {
    return await prisma.oracleMemory.findMany({
      orderBy: { lastModified: 'desc' }
    });
  }

  async getOracleMemoryByLabel(label: string): Promise<OracleMemory | null> {
    return await prisma.oracleMemory.findUnique({
      where: { label }
    });
  }

  async createOracleMemory(memory: InsertOracleMemory): Promise<OracleMemory> {
    return await prisma.oracleMemory.create({
      data: {
        ...memory,
        status: memory.status || 'active',
        createdAt: new Date(),
        lastModified: new Date()
      }
    });
  }

  async updateOracleMemory(label: string, updates: Partial<OracleMemory>): Promise<OracleMemory> {
    return await prisma.oracleMemory.update({
      where: { label },
      data: {
        ...updates,
        lastModified: new Date()
      }
    });
  }

  async deleteOracleMemory(label: string): Promise<void> {
    await prisma.oracleMemory.delete({
      where: { label }
    });
  }

  async searchOracleMemories(searchTerm?: string, status?: string, memoryType?: string): Promise<OracleMemory[]> {
    const where: any = {};
    
    if (searchTerm) {
      where.OR = [
        { label: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (memoryType) {
      where.memoryType = memoryType;
    }

    return await prisma.oracleMemory.findMany({
      where,
      orderBy: { lastModified: 'desc' }
    });
  }
}

// Export singleton instance
export const storage = new PrismaStorage();
export default storage;