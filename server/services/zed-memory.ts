import { db } from "../db";
import { zedMemoryEntries, zedMemoryAssociations, zedConversationContext, zedLearningPatterns } from "@shared/schema";
import { eq, and, desc, asc, sql, inArray, ilike } from "drizzle-orm";
import type { ZedMemoryEntry, ZedMemoryAssociation, ZedConversationContext, ZedLearningPattern } from "@shared/schema";

export interface MemorySearchOptions {
  types?: string[];
  categories?: string[];
  tags?: string[];
  minImportance?: number;
  maxAge?: number; // days
  limit?: number;
  sortBy?: 'relevance' | 'importance' | 'recent' | 'accessed';
}

export interface MemoryCreationData {
  memoryType: string;
  category: string;
  key: string;
  content: any;
  importance?: number;
  confidence?: number;
  source: string;
  contextTags?: string[];
  expiresAt?: Date;
}

export class ZedMemoryService {
  // === MEMORY ENTRY MANAGEMENT ===
  
  async createMemory(userId: number, data: MemoryCreationData): Promise<ZedMemoryEntry> {
    // Check for existing memory with same key to avoid duplicates
    const existing = await this.findMemoryByKey(userId, data.key);
    
    if (existing) {
      // Update existing memory instead of creating duplicate
      return await this.updateMemory(existing.id, {
        content: data.content,
        importance: data.importance || existing.importance,
        confidence: data.confidence || existing.confidence,
        contextTags: data.contextTags || existing.contextTags,
        updatedAt: new Date(),
        lastAccessed: new Date(),
        accessCount: (existing.accessCount || 0) + 1
      });
    }
    
    const [memory] = await db
      .insert(zedMemoryEntries)
      .values({
        userId,
        memoryType: data.memoryType,
        category: data.category,
        key: data.key,
        content: data.content,
        importance: data.importance || 5,
        confidence: data.confidence || 8,
        source: data.source,
        contextTags: data.contextTags || [],
        expiresAt: data.expiresAt
      })
      .returning();
    
    return memory;
  }
  
  async updateMemory(memoryId: number, updates: Partial<ZedMemoryEntry>): Promise<ZedMemoryEntry> {
    const [updated] = await db
      .update(zedMemoryEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(zedMemoryEntries.id, memoryId))
      .returning();
    
    return updated;
  }
  
  async findMemoryByKey(userId: number, key: string): Promise<ZedMemoryEntry | undefined> {
    const [memory] = await db
      .select()
      .from(zedMemoryEntries)
      .where(
        and(
          eq(zedMemoryEntries.userId, userId),
          eq(zedMemoryEntries.key, key),
          eq(zedMemoryEntries.isActive, true)
        )
      )
      .limit(1);
    
    return memory;
  }
  
  async searchMemories(userId: number, query: string, options: MemorySearchOptions = {}): Promise<ZedMemoryEntry[]> {
    // Apply filters
    const conditions = [
      eq(zedMemoryEntries.userId, userId),
      eq(zedMemoryEntries.isActive, true)
    ];
    
    if (options.types?.length) {
      conditions.push(inArray(zedMemoryEntries.memoryType, options.types));
    }
    
    if (options.categories?.length) {
      conditions.push(inArray(zedMemoryEntries.category, options.categories));
    }
    
    if (options.minImportance) {
      conditions.push(sql`${zedMemoryEntries.importance} >= ${options.minImportance}`);
    }
    
    if (options.maxAge) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.maxAge);
      conditions.push(sql`${zedMemoryEntries.createdAt} >= ${cutoffDate.toISOString()}`);
    }
    
    // Text search in key and content
    if (query) {
      conditions.push(
        sql`(
          ${zedMemoryEntries.key} ILIKE ${`%${query}%`} OR
          ${zedMemoryEntries.content}::text ILIKE ${`%${query}%`} OR
          array_to_string(${zedMemoryEntries.contextTags}, ' ') ILIKE ${`%${query}%`}
        )`
      );
    }
    
    let baseQuery = db
      .select()
      .from(zedMemoryEntries)
      .where(and(...conditions));
    
    // Apply sorting
    switch (options.sortBy) {
      case 'importance':
        baseQuery = baseQuery.orderBy(desc(zedMemoryEntries.importance));
        break;
      case 'recent':
        baseQuery = baseQuery.orderBy(desc(zedMemoryEntries.updatedAt));
        break;
      case 'accessed':
        baseQuery = baseQuery.orderBy(desc(zedMemoryEntries.lastAccessed));
        break;
      default:
        // Relevance-based sorting (importance * confidence * recent access)
        baseQuery = baseQuery.orderBy(
          desc(sql`(${zedMemoryEntries.importance} * ${zedMemoryEntries.confidence} * 
                   EXTRACT(EPOCH FROM (NOW() - ${zedMemoryEntries.lastAccessed}))::int / -86400)`)
        );
    }
    
    if (options.limit) {
      baseQuery = baseQuery.limit(options.limit);
    }
    
    const memories = await baseQuery;
    
    // Update access tracking for returned memories
    if (memories.length > 0) {
      const memoryIds = memories.map(m => m.id);
      await db
        .update(zedMemoryEntries)
        .set({
          lastAccessed: new Date(),
          accessCount: sql`${zedMemoryEntries.accessCount} + 1`
        })
        .where(inArray(zedMemoryEntries.id, memoryIds));
    }
    
    return memories;
  }
  
  // === MEMORY ASSOCIATIONS ===
  
  async createAssociation(
    userId: number,
    fromMemoryId: number,
    toMemoryId: number,
    associationType: string,
    strength: number = 5
  ): Promise<ZedMemoryAssociation> {
    // Check if association already exists
    const existing = await db
      .select()
      .from(zedMemoryAssociations)
      .where(
        and(
          eq(zedMemoryAssociations.userId, userId),
          eq(zedMemoryAssociations.fromMemoryId, fromMemoryId),
          eq(zedMemoryAssociations.toMemoryId, toMemoryId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update strength of existing association
      const [updated] = await db
        .update(zedMemoryAssociations)
        .set({ strength: Math.max(existing[0].strength, strength) })
        .where(eq(zedMemoryAssociations.id, existing[0].id))
        .returning();
      return updated;
    }
    
    const [association] = await db
      .insert(zedMemoryAssociations)
      .values({
        userId,
        fromMemoryId,
        toMemoryId,
        associationType,
        strength
      })
      .returning();
    
    return association;
  }
  
  async getRelatedMemories(userId: number, memoryId: number, limit: number = 10): Promise<ZedMemoryEntry[]> {
    const associations = await db
      .select({
        relatedMemoryId: sql<number>`CASE 
          WHEN ${zedMemoryAssociations.fromMemoryId} = ${memoryId} 
          THEN ${zedMemoryAssociations.toMemoryId}
          ELSE ${zedMemoryAssociations.fromMemoryId}
        END`,
        strength: zedMemoryAssociations.strength
      })
      .from(zedMemoryAssociations)
      .where(
        and(
          eq(zedMemoryAssociations.userId, userId),
          sql`(${zedMemoryAssociations.fromMemoryId} = ${memoryId} OR ${zedMemoryAssociations.toMemoryId} = ${memoryId})`
        )
      )
      .orderBy(desc(zedMemoryAssociations.strength))
      .limit(limit);
    
    if (associations.length === 0) return [];
    
    const relatedIds = associations.map(a => a.relatedMemoryId);
    
    return await db
      .select()
      .from(zedMemoryEntries)
      .where(
        and(
          inArray(zedMemoryEntries.id, relatedIds),
          eq(zedMemoryEntries.isActive, true)
        )
      );
  }
  
  // === CONVERSATION CONTEXT ===
  
  async updateConversationContext(
    userId: number,
    sessionId: string,
    contextWindow: any,
    topicSummary?: string,
    userMood?: string,
    taskContext?: any,
    memoryReferences?: number[]
  ): Promise<ZedConversationContext> {
    // Try to update existing context
    const existing = await db
      .select()
      .from(zedConversationContext)
      .where(
        and(
          eq(zedConversationContext.userId, userId),
          eq(zedConversationContext.sessionId, sessionId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(zedConversationContext)
        .set({
          contextWindow,
          topicSummary,
          userMood,
          taskContext,
          memoryReferences: memoryReferences || [],
          updatedAt: new Date()
        })
        .where(eq(zedConversationContext.id, existing[0].id))
        .returning();
      
      return updated;
    }
    
    // Create new context
    const [context] = await db
      .insert(zedConversationContext)
      .values({
        userId,
        sessionId,
        contextWindow,
        topicSummary,
        userMood,
        taskContext,
        memoryReferences: memoryReferences || []
      })
      .returning();
    
    return context;
  }
  
  async getConversationContext(userId: number, sessionId: string): Promise<ZedConversationContext | undefined> {
    const [context] = await db
      .select()
      .from(zedConversationContext)
      .where(
        and(
          eq(zedConversationContext.userId, userId),
          eq(zedConversationContext.sessionId, sessionId)
        )
      )
      .orderBy(desc(zedConversationContext.updatedAt))
      .limit(1);
    
    return context;
  }
  
  // === LEARNING PATTERNS ===
  
  async recordLearningPattern(
    userId: number,
    patternType: string,
    patternData: any,
    confidence: number = 5
  ): Promise<ZedLearningPattern> {
    // Check for existing pattern
    const existing = await db
      .select()
      .from(zedLearningPatterns)
      .where(
        and(
          eq(zedLearningPatterns.userId, userId),
          eq(zedLearningPatterns.patternType, patternType)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing pattern
      const [updated] = await db
        .update(zedLearningPatterns)
        .set({
          patternData,
          confidence: Math.min(10, existing[0].confidence + 1), // Increase confidence
          observationCount: existing[0].observationCount + 1,
          lastObserved: new Date()
        })
        .where(eq(zedLearningPatterns.id, existing[0].id))
        .returning();
      
      return updated;
    }
    
    // Create new pattern
    const [pattern] = await db
      .insert(zedLearningPatterns)
      .values({
        userId,
        patternType,
        patternData,
        confidence
      })
      .returning();
    
    return pattern;
  }
  
  async getUserPatterns(userId: number): Promise<ZedLearningPattern[]> {
    return await db
      .select()
      .from(zedLearningPatterns)
      .where(eq(zedLearningPatterns.userId, userId))
      .orderBy(desc(zedLearningPatterns.confidence), desc(zedLearningPatterns.observationCount));
  }
  
  // === HIGH-LEVEL MEMORY OPERATIONS ===
  
  async rememberUserPreference(
    userId: number,
    preference: string,
    value: any,
    context?: string
  ): Promise<ZedMemoryEntry> {
    return await this.createMemory(userId, {
      memoryType: 'user_preference',
      category: 'behavioral',
      key: `preference_${preference}`,
      content: { preference, value, context },
      importance: 7,
      source: 'user_told',
      contextTags: ['preference', context || 'general'].filter(Boolean)
    });
  }
  
  async rememberFact(
    userId: number,
    fact: string,
    category: string = 'general',
    importance: number = 5
  ): Promise<ZedMemoryEntry> {
    return await this.createMemory(userId, {
      memoryType: 'fact',
      category,
      key: `fact_${Date.now()}`,
      content: { fact, learned: new Date().toISOString() },
      importance,
      source: 'user_told',
      contextTags: [category, 'fact']
    });
  }
  
  async rememberSkill(
    userId: number,
    skill: string,
    proficiency: string,
    context?: any
  ): Promise<ZedMemoryEntry> {
    return await this.createMemory(userId, {
      memoryType: 'skill',
      category: 'professional',
      key: `skill_${skill.toLowerCase().replace(/\s+/g, '_')}`,
      content: { skill, proficiency, context, observed: new Date().toISOString() },
      importance: 6,
      source: 'observed',
      contextTags: ['skill', 'professional', proficiency]
    });
  }
  
  async getMemoryStats(userId: number): Promise<any> {
    const stats = await db
      .select({
        memoryType: zedMemoryEntries.memoryType,
        category: zedMemoryEntries.category,
        count: sql<number>`count(*)`,
        avgImportance: sql<number>`avg(${zedMemoryEntries.importance})`,
        totalAccess: sql<number>`sum(${zedMemoryEntries.accessCount})`
      })
      .from(zedMemoryEntries)
      .where(
        and(
          eq(zedMemoryEntries.userId, userId),
          eq(zedMemoryEntries.isActive, true)
        )
      )
      .groupBy(zedMemoryEntries.memoryType, zedMemoryEntries.category);
    
    return {
      totalMemories: stats.reduce((sum, stat) => sum + stat.count, 0),
      byType: stats.reduce((acc, stat) => {
        if (!acc[stat.memoryType]) acc[stat.memoryType] = 0;
        acc[stat.memoryType] += stat.count;
        return acc;
      }, {} as Record<string, number>),
      byCategory: stats.reduce((acc, stat) => {
        if (!acc[stat.category]) acc[stat.category] = 0;
        acc[stat.category] += stat.count;
        return acc;
      }, {} as Record<string, number>),
      totalAccess: stats.reduce((sum, stat) => sum + (stat.totalAccess || 0), 0)
    };
  }
  
  // Clean up expired or low-importance memories to manage storage
  async cleanupMemories(userId: number): Promise<number> {
    // Remove expired memories
    const expiredCount = await db
      .update(zedMemoryEntries)
      .set({ isActive: false })
      .where(
        and(
          eq(zedMemoryEntries.userId, userId),
          eq(zedMemoryEntries.isActive, true),
          sql`${zedMemoryEntries.expiresAt} < NOW()`
        )
      );
    
    // Archive very old, low-importance, rarely accessed memories
    const archiveCount = await db
      .update(zedMemoryEntries)
      .set({ isActive: false })
      .where(
        and(
          eq(zedMemoryEntries.userId, userId),
          eq(zedMemoryEntries.isActive, true),
          sql`${zedMemoryEntries.importance} <= 3`,
          sql`${zedMemoryEntries.accessCount} <= 1`,
          sql`${zedMemoryEntries.createdAt} < NOW() - INTERVAL '90 days'`
        )
      );
    
    return expiredCount.rowCount + archiveCount.rowCount;
  }
}

export const zedMemoryService = new ZedMemoryService();