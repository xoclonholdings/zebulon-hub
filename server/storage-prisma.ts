import { PrismaClient } from '@prisma/client';
import { User, SystemStatus, OracleMemory, InsertOracleMemory, ModuleIntegration, InsertModuleIntegration } from '../shared/schema.js';

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
  // Module Integration methods
  async getModuleIntegrations(): Promise<ModuleIntegration[]> {
    return await prisma.moduleIntegration.findMany({
      orderBy: { createdAt: 'desc' }
    }) as ModuleIntegration[];
  }

  async getModuleIntegration(moduleName: string): Promise<ModuleIntegration | null> {
    const integration = await prisma.moduleIntegration.findUnique({
      where: { moduleName }
    });
    return integration as ModuleIntegration | null;
  }

  async createModuleIntegration(data: InsertModuleIntegration): Promise<ModuleIntegration> {
    const integration = await prisma.moduleIntegration.create({
      data
    });
    return integration as ModuleIntegration;
  }

  async updateModuleIntegration(moduleName: string, data: Partial<InsertModuleIntegration>): Promise<ModuleIntegration> {
    const integration = await prisma.moduleIntegration.update({
      where: { moduleName },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    return integration as ModuleIntegration;
  }

  async deleteModuleIntegration(moduleName: string): Promise<void> {
    await prisma.moduleIntegration.delete({
      where: { moduleName }
    });
  }

  async getOracleMemories(): Promise<OracleMemory[]> {
    const results = await prisma.oracleMemory.findMany({
      orderBy: { lastModified: 'desc' }
    });
    return results as OracleMemory[];
  }

  async getOracleMemoryByLabel(label: string): Promise<OracleMemory | null> {
    const result = await prisma.oracleMemory.findUnique({
      where: { label }
    });
    return result as OracleMemory | null;
  }

  async createOracleMemory(memory: InsertOracleMemory): Promise<OracleMemory> {
    const result = await prisma.oracleMemory.create({
      data: {
        ...memory,
        status: memory.status || 'active',
        createdAt: new Date(),
        lastModified: new Date()
      }
    });
    return result as OracleMemory;
  }

  async updateOracleMemory(label: string, updates: Partial<OracleMemory>): Promise<OracleMemory> {
    const result = await prisma.oracleMemory.update({
      where: { label },
      data: {
        ...updates,
        lastModified: new Date()
      }
    });
    return result as OracleMemory;
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

    const results = await prisma.oracleMemory.findMany({
      where,
      orderBy: { lastModified: 'desc' }
    });
    return results as OracleMemory[];
  }
}

// Export singleton instance
export const storage = new PrismaStorage();
export default storage;