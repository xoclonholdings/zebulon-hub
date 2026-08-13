import { PrismaClient } from '@prisma/client';
import { User, SystemStatus, OracleMemory, InsertOracleMemory, ModuleIntegration, InsertModuleIntegration } from '../shared/schema.js';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export class PrismaStorage {
  async getUser(id: number): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } }) as User | null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { username } }) as User | null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return await prisma.user.create({ data: { ...userData, createdAt: new Date(), updatedAt: new Date() } }) as User;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    return await prisma.user.update({ where: { id }, data: { ...updates, updatedAt: new Date() } }) as User;
  }

  async updateUserLogin(id: number): Promise<User> {
    return await prisma.user.update({ where: { id }, data: { updatedAt: new Date() } }) as User;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<User> {
    return await prisma.user.update({ where: { id }, data: { passwordHash, updatedAt: new Date() } }) as User;
  }

  async getSystemStatus(): Promise<any[]> {
    return await prisma.systemStatus.findMany({ orderBy: { lastChecked: 'desc' } });
  }

  async updateSystemStatus(component: string, status: any): Promise<any> {
    return await prisma.systemStatus.upsert({
      where: { component },
      update: { ...status, lastChecked: new Date() },
      create: { component, status: status.status || 'unknown', lastChecked: new Date(), ...status },
    });
  }

  async getModuleIntegrations(): Promise<ModuleIntegration[]> {
    return await prisma.moduleIntegration.findMany({ orderBy: { createdAt: 'desc' } }) as ModuleIntegration[];
  }

  async getModuleIntegration(moduleName: string): Promise<ModuleIntegration | null> {
    return await prisma.moduleIntegration.findUnique({ where: { moduleName } }) as ModuleIntegration | null;
  }

  async createModuleIntegration(data: InsertModuleIntegration): Promise<ModuleIntegration> {
    return await prisma.moduleIntegration.create({ data }) as ModuleIntegration;
  }

  async updateModuleIntegration(moduleName: string, data: Partial<InsertModuleIntegration>): Promise<ModuleIntegration> {
    return await prisma.moduleIntegration.update({ where: { moduleName }, data: { ...data, updatedAt: new Date() } }) as ModuleIntegration;
  }

  async deleteModuleIntegration(moduleName: string): Promise<void> {
    await prisma.moduleIntegration.delete({ where: { moduleName } });
  }

  // Legacy Oracle memory remains read-only migration evidence for new ZCOS work.
  async getOracleMemories(): Promise<OracleMemory[]> {
    return await prisma.oracleMemory.findMany({ orderBy: { lastModified: 'desc' } }) as OracleMemory[];
  }

  async getOracleMemoryByLabel(label: string): Promise<OracleMemory | null> {
    return await prisma.oracleMemory.findUnique({ where: { label } }) as OracleMemory | null;
  }

  async createOracleMemory(memory: InsertOracleMemory): Promise<OracleMemory> {
    return await prisma.oracleMemory.create({ data: { ...memory, status: memory.status || 'active', createdAt: new Date(), lastModified: new Date() } }) as OracleMemory;
  }

  async updateOracleMemory(label: string, updates: Partial<OracleMemory>): Promise<OracleMemory> {
    return await prisma.oracleMemory.update({ where: { label }, data: { ...updates, lastModified: new Date() } }) as OracleMemory;
  }

  async deleteOracleMemory(label: string): Promise<void> {
    await prisma.oracleMemory.delete({ where: { label } });
  }

  async searchOracleMemories(searchTerm?: string, status?: string, memoryType?: string): Promise<OracleMemory[]> {
    const where: any = {};
    if (searchTerm) where.OR = [
      { label: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { content: { contains: searchTerm, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (memoryType) where.memoryType = memoryType;
    return await prisma.oracleMemory.findMany({ where, orderBy: { lastModified: 'desc' } }) as OracleMemory[];
  }

  async listMemory(ownerUserId: string, galaxyId: string) {
    return prisma.memoryRecord.findMany({
      where: { ownerUserId, galaxyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createMemory(data: {
    ownerUserId: string;
    galaxyId: string;
    memoryType: string;
    canonicalName: string;
    content: string;
    lifecycleState?: string;
  }) {
    return prisma.memoryRecord.create({
      data: { ...data, lifecycleState: data.lifecycleState || 'confirmed' },
    });
  }

  async listKnowledge(ownerUserId: string, galaxyId: string) {
    return prisma.knowledgeRecord.findMany({
      where: { ownerUserId, galaxyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createKnowledge(data: {
    ownerUserId: string;
    galaxyId: string;
    objectType: string;
    canonicalName: string;
    summary?: string;
    originClass: string;
    lifecycleState?: string;
  }) {
    return prisma.knowledgeRecord.create({
      data: { ...data, lifecycleState: data.lifecycleState || 'candidate' },
    });
  }

  async recordAudit(data: {
    ownerUserId?: string;
    galaxyId?: string;
    eventType: string;
    targetType?: string;
    targetId?: string;
    details?: any;
  }) {
    return prisma.auditEvent.create({ data });
  }
}

export const storage = new PrismaStorage();
export default storage;
