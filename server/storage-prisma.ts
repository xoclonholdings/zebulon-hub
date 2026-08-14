import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { User, SystemStatus, OracleMemory, InsertOracleMemory, ModuleIntegration, InsertModuleIntegration } from '../shared/schema.js';

const prisma = new PrismaClient({ log: ['error', 'warn'] });

const MEMORY_CURRENT_STATES = ['active', 'confirmed', 'corrected'];
const KNOWLEDGE_CURRENT_STATES = ['supported', 'confirmed', 'disputed', 'historical'];

export class PrismaStorage {
  async getUser(id: number): Promise<User | null> { return await prisma.user.findUnique({ where: { id } }) as User | null; }
  async getUserByUsername(username: string): Promise<User | null> { return await prisma.user.findUnique({ where: { username } }) as User | null; }
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> { return await prisma.user.create({ data: { ...userData, createdAt: new Date(), updatedAt: new Date() } }) as User; }
  async updateUser(id: number, updates: Partial<User>): Promise<User> { return await prisma.user.update({ where: { id }, data: { ...updates, updatedAt: new Date() } }) as User; }
  async updateUserLogin(id: number): Promise<User> { return await prisma.user.update({ where: { id }, data: { updatedAt: new Date() } }) as User; }
  async updateUserPassword(id: number, passwordHash: string): Promise<User> { return await prisma.user.update({ where: { id }, data: { passwordHash, updatedAt: new Date() } }) as User; }

  async getSystemStatus(): Promise<any[]> { return await prisma.systemStatus.findMany({ orderBy: { lastChecked: 'desc' } }); }
  async updateSystemStatus(component: string, status: any): Promise<any> {
    return await prisma.systemStatus.upsert({ where: { component }, update: { ...status, lastChecked: new Date() }, create: { component, status: status.status || 'unknown', lastChecked: new Date(), ...status } });
  }

  async getModuleIntegrations(): Promise<ModuleIntegration[]> { return await prisma.moduleIntegration.findMany({ orderBy: { createdAt: 'desc' } }) as ModuleIntegration[]; }
  async getModuleIntegration(moduleName: string): Promise<ModuleIntegration | null> { return await prisma.moduleIntegration.findUnique({ where: { moduleName } }) as ModuleIntegration | null; }
  async createModuleIntegration(data: InsertModuleIntegration): Promise<ModuleIntegration> { return await prisma.moduleIntegration.create({ data }) as ModuleIntegration; }
  async updateModuleIntegration(moduleName: string, data: Partial<InsertModuleIntegration>): Promise<ModuleIntegration> { return await prisma.moduleIntegration.update({ where: { moduleName }, data: { ...data, updatedAt: new Date() } }) as ModuleIntegration; }
  async deleteModuleIntegration(moduleName: string): Promise<void> { await prisma.moduleIntegration.delete({ where: { moduleName } }); }

  // Legacy Oracle Memory remains migration evidence only. Production HTTP writes are blocked in server/index.ts.
  async getOracleMemories(): Promise<OracleMemory[]> { return await prisma.oracleMemory.findMany({ orderBy: { lastModified: 'desc' } }) as OracleMemory[]; }
  async getOracleMemoryByLabel(label: string): Promise<OracleMemory | null> { return await prisma.oracleMemory.findUnique({ where: { label } }) as OracleMemory | null; }
  async createOracleMemory(memory: InsertOracleMemory): Promise<OracleMemory> { return await prisma.oracleMemory.create({ data: { ...memory, status: memory.status || 'active', createdAt: new Date(), lastModified: new Date() } }) as OracleMemory; }
  async updateOracleMemory(label: string, updates: Partial<OracleMemory>): Promise<OracleMemory> { return await prisma.oracleMemory.update({ where: { label }, data: { ...updates, lastModified: new Date() } }) as OracleMemory; }
  async deleteOracleMemory(label: string): Promise<void> { await prisma.oracleMemory.delete({ where: { label } }); }
  async searchOracleMemories(searchTerm?: string, status?: string, memoryType?: string): Promise<OracleMemory[]> {
    const where: any = {};
    if (searchTerm) where.OR = [{ label: { contains: searchTerm, mode: 'insensitive' } }, { description: { contains: searchTerm, mode: 'insensitive' } }, { content: { contains: searchTerm, mode: 'insensitive' } }];
    if (status) where.status = status;
    if (memoryType) where.memoryType = memoryType;
    return await prisma.oracleMemory.findMany({ where, orderBy: { lastModified: 'desc' } }) as OracleMemory[];
  }

  async getMemoryEnabled(ownerUserId: string): Promise<boolean> {
    const setting = await prisma.memorySetting.findUnique({ where: { ownerUserId } });
    return setting?.memoryEnabled ?? true;
  }

  async setMemoryEnabled(ownerUserId: string, memoryEnabled: boolean) {
    return prisma.memorySetting.upsert({
      where: { ownerUserId },
      update: { memoryEnabled },
      create: { ownerUserId, memoryEnabled },
    });
  }

  async listMemory(ownerUserId: string, galaxyId: string, includeReview = false) {
    return prisma.memoryRecord.findMany({
      where: {
        ownerUserId,
        galaxyId,
        lifecycleState: includeReview
          ? { notIn: ['rejected', 'superseded', 'forgotten'] }
          : { in: MEMORY_CURRENT_STATES },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMemory(ownerUserId: string, galaxyId: string, id: string) {
    return prisma.memoryRecord.findFirst({ where: { id, ownerUserId, galaxyId } });
  }

  async createDirectMemory(data: {
    ownerUserId: string;
    galaxyId: string;
    memoryType: string;
    canonicalName: string;
    content: string;
    properties?: any;
    topics?: string[];
    entityIds?: string[];
    occurredAt?: Date;
    sourceId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const source = await tx.sourceRecord.create({
        data: {
          ownerUserId: data.ownerUserId,
          galaxyId: data.galaxyId,
          sourceOwnerUserId: data.ownerUserId,
          sourceGalaxyId: data.galaxyId,
          sourceType: 'direct_user',
          sourceId: data.sourceId || `direct:${randomUUID()}`,
          originClass: 'UGC / Uploaded',
          extractionMethod: 'direct instruction',
        },
      });
      const record = await tx.memoryRecord.create({
        data: {
          ownerUserId: data.ownerUserId,
          galaxyId: data.galaxyId,
          memoryType: data.memoryType,
          canonicalName: data.canonicalName,
          content: data.content,
          properties: data.properties,
          topics: data.topics || [],
          entityIds: data.entityIds || [],
          occurredAt: data.occurredAt,
          sourceRefs: [source.id],
          lifecycleState: 'confirmed',
          confirmationMethod: 'direct user instruction',
        },
      });
      await tx.auditEvent.create({ data: { ownerUserId: data.ownerUserId, galaxyId: data.galaxyId, eventType: 'memory.created', targetType: 'memory', targetId: record.id, details: { sourceRef: source.id, lifecycleState: 'confirmed' } } });
      return { record, source };
    });
  }

  async correctMemory(input: { ownerUserId: string; galaxyId: string; id: string; content: string; canonicalName?: string }) {
    return prisma.$transaction(async (tx) => {
      const prior = await tx.memoryRecord.findFirst({ where: { id: input.id, ownerUserId: input.ownerUserId, galaxyId: input.galaxyId } });
      if (!prior || prior.lifecycleState === 'forgotten') return null;
      const source = await tx.sourceRecord.create({
        data: {
          ownerUserId: input.ownerUserId,
          galaxyId: input.galaxyId,
          sourceOwnerUserId: input.ownerUserId,
          sourceGalaxyId: input.galaxyId,
          sourceType: 'direct_user',
          sourceId: `correction:${randomUUID()}`,
          originClass: 'UGC / Uploaded',
          extractionMethod: 'manual confirmation',
        },
      });
      const corrected = await tx.memoryRecord.create({
        data: {
          ownerUserId: prior.ownerUserId,
          galaxyId: prior.galaxyId,
          memoryType: prior.memoryType,
          canonicalName: input.canonicalName || prior.canonicalName,
          content: input.content,
          properties: prior.properties ?? undefined,
          topics: prior.topics,
          entityIds: prior.entityIds,
          sourceRefs: [...prior.sourceRefs, source.id],
          confidence: prior.confidence,
          occurredAt: prior.occurredAt,
          lifecycleState: 'corrected',
          confirmationMethod: 'correction',
          supersedesId: prior.id,
          derivedFromIds: [prior.id],
          retentionPolicy: prior.retentionPolicy ?? undefined,
          version: prior.version + 1,
        },
      });
      await tx.memoryRecord.update({ where: { id: prior.id }, data: { lifecycleState: 'superseded' } });
      await tx.memoryRelationship.create({ data: { ownerUserId: prior.ownerUserId, galaxyId: prior.galaxyId, subjectId: corrected.id, objectId: prior.id, predicate: 'SUPERSEDES', sourceRefs: [source.id], lifecycleState: 'active' } });
      await tx.auditEvent.create({ data: { ownerUserId: prior.ownerUserId, galaxyId: prior.galaxyId, eventType: 'memory.corrected', targetType: 'memory', targetId: corrected.id, details: { supersedesId: prior.id } } });
      return { priorId: prior.id, record: corrected };
    });
  }

  async rejectMemory(ownerUserId: string, galaxyId: string, id: string) {
    const record = await prisma.memoryRecord.findFirst({ where: { id, ownerUserId, galaxyId } });
    if (!record || record.lifecycleState === 'forgotten') return null;
    return prisma.memoryRecord.update({ where: { id }, data: { lifecycleState: 'rejected' } });
  }

  async confirmMemory(ownerUserId: string, galaxyId: string, id: string) {
    const record = await prisma.memoryRecord.findFirst({ where: { id, ownerUserId, galaxyId } });
    if (!record || record.lifecycleState !== 'proposed') return null;
    return prisma.memoryRecord.update({ where: { id }, data: { lifecycleState: 'confirmed', confirmationMethod: 'user review' } });
  }

  async forgetMemory(ownerUserId: string, galaxyId: string, id: string) {
    const cascadeId = `forget:${randomUUID()}`;
    return prisma.$transaction(async (tx) => {
      const record = await tx.memoryRecord.findFirst({ where: { id, ownerUserId, galaxyId } });
      if (!record) return null;
      if (record.lifecycleState === 'forgotten') return { record, cascadeId: record.deletionCascadeId || cascadeId, alreadyForgotten: true };
      const forgotten = await tx.memoryRecord.update({
        where: { id },
        data: {
          content: '',
          properties: undefined,
          topics: [],
          entityIds: [],
          sourceRefs: [],
          derivedFromIds: [],
          lifecycleState: 'forgotten',
          deletedAt: new Date(),
          deletionCascadeId: cascadeId,
        },
      });
      await tx.memoryRelationship.updateMany({
        where: { ownerUserId, galaxyId, OR: [{ subjectId: id }, { objectId: id }] },
        data: { lifecycleState: 'rejected' },
      });
      await tx.auditEvent.create({ data: { ownerUserId, galaxyId, eventType: 'memory.forgotten', targetType: 'memory', targetId: id, details: { cascadeId, status: 'complete' } } });
      return { record: forgotten, cascadeId, alreadyForgotten: false };
    });
  }

  async listKnowledge(ownerUserId: string, galaxyId: string, includeReview = false) {
    return prisma.knowledgeRecord.findMany({
      where: {
        ownerUserId,
        galaxyId,
        lifecycleState: includeReview
          ? { notIn: ['rejected', 'superseded', 'deprecated'] }
          : { in: KNOWLEDGE_CURRENT_STATES },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createKnowledgeCandidate(data: {
    ownerUserId: string;
    galaxyId: string;
    objectType: string;
    canonicalName: string;
    summary?: string;
    originClass: string;
    sourceType: string;
    sourceId?: string;
    evidenceExcerpt?: string;
    scope?: any;
  }) {
    return prisma.$transaction(async (tx) => {
      const source = await tx.sourceRecord.create({
        data: {
          ownerUserId: data.ownerUserId,
          galaxyId: data.galaxyId,
          sourceOwnerUserId: data.ownerUserId,
          sourceGalaxyId: data.galaxyId,
          sourceType: data.sourceType,
          sourceId: data.sourceId || `knowledge:${randomUUID()}`,
          originClass: data.originClass,
          evidenceExcerpt: data.evidenceExcerpt,
          extractionMethod: data.originClass === 'UGC / Uploaded' ? 'direct instruction' : 'model extraction',
        },
      });
      const record = await tx.knowledgeRecord.create({
        data: {
          ownerUserId: data.ownerUserId,
          galaxyId: data.galaxyId,
          objectType: data.objectType,
          canonicalName: data.canonicalName,
          summary: data.summary,
          originClass: data.originClass,
          sourceBindings: [source.id],
          scope: data.scope,
          lifecycleState: 'candidate',
          currency: 'unknown',
        },
      });
      await tx.auditEvent.create({ data: { ownerUserId: data.ownerUserId, galaxyId: data.galaxyId, eventType: 'knowledge.candidate_created', targetType: 'knowledge', targetId: record.id, details: { sourceRef: source.id, originClass: data.originClass } } });
      return { record, source };
    });
  }

  async listTopics(ownerUserId: string, galaxyId: string) {
    return prisma.topicRecord.findMany({ where: { ownerUserId, galaxyId, lifecycleState: { notIn: ['rejected'] } }, orderBy: { canonicalLabel: 'asc' } });
  }

  async listLexicon(ownerUserId: string, galaxyId: string) {
    return prisma.lexiconSense.findMany({ where: { ownerUserId, galaxyId, lifecycleState: { notIn: ['rejected', 'superseded'] } }, orderBy: { canonicalForm: 'asc' } });
  }

  async listSources(ownerUserId: string, galaxyId: string) {
    return prisma.sourceRecord.findMany({ where: { ownerUserId, galaxyId }, orderBy: { capturedAt: 'desc' } });
  }

  async listKnowledgeRelationships(ownerUserId: string, galaxyId: string) {
    return prisma.knowledgeRelationship.findMany({ where: { ownerUserId, galaxyId, lifecycleState: { notIn: ['rejected', 'superseded', 'deprecated'] } }, orderBy: { updatedAt: 'desc' } });
  }

  async hasPartitionGrant(input: { ownerUserId: string; sourceGalaxyId: string; targetGalaxyId: string; authorityKind: 'memory' | 'knowledge'; permission: 'read' | 'write' | 'contribute' | 'admin' }) {
    const now = new Date();
    const grant = await prisma.partitionGrant.findFirst({
      where: {
        ownerUserId: input.ownerUserId,
        sourceGalaxyId: input.sourceGalaxyId,
        targetGalaxyId: input.targetGalaxyId,
        authorityKind: input.authorityKind,
        permissions: { has: input.permission },
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    });
    return grant?.id || null;
  }

  async recordAudit(data: { ownerUserId?: string; galaxyId?: string; eventType: string; targetType?: string; targetId?: string; details?: any }) {
    return prisma.auditEvent.create({ data });
  }
}

export const storage = new PrismaStorage();
export default storage;
