import { db } from "../db";
import { zedMemoryEntries, zedMemoryAssociations, zedConversationContext, zedLearningPatterns } from "@shared/schema";
import { eq, and, desc, sql, inArray, orderBy } from "drizzle-orm";
import { encryptionService } from "./encryption";
import type { ZedMemoryEntry, ZedMemoryAssociation, ZedConversationContext, ZedLearningPattern } from "@shared/schema";
import crypto from 'crypto';

export interface MemorySearchOptions {
  types?: string[];
  categories?: string[];
  tags?: string[];
  minImportance?: number;
  maxAge?: number;
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

export class ZedMemoryServiceFixed {
  // === ENCRYPTED MEMORY ENTRY MANAGEMENT ===
  
  async createMemory(userId: number, data: MemoryCreationData): Promise<ZedMemoryEntry> {
    try {
      // Check for existing memory with same key to avoid duplicates
      const existing = await this.findMemoryByKey(userId, data.key);
      
      if (existing) {
        return await this.updateMemory(existing.id, {
          encryptedContent: encryptionService.encryptMemoryContent(data.content, userId),
          contentHash: crypto.createHash('sha256').update(JSON.stringify(data.content)).digest('hex'),
          importance: data.importance || existing.importance,
          confidence: data.confidence || existing.confidence,
          encryptedTags: data.contextTags?.map(tag => 
            encryptionService.encrypt(tag, `user_${userId}_tags`).encryptedData
          ) || existing.encryptedTags,
          updatedAt: new Date(),
          lastAccessed: new Date(),
          accessCount: (existing.accessCount || 0) + 1
        } as any);
      }
      
      // Encrypt content and tags
      const encryptedContent = encryptionService.encryptMemoryContent(data.content, userId);
      const contentHash = crypto.createHash('sha256').update(JSON.stringify(data.content)).digest('hex');
      const encryptedTags = data.contextTags?.map(tag => 
        encryptionService.encrypt(tag, `user_${userId}_tags`).encryptedData
      ) || [];
      
      const [memory] = await db
        .insert(zedMemoryEntries)
        .values({
          userId,
          memoryType: data.memoryType,
          category: data.category,
          key: data.key,
          encryptedContent,
          contentHash,
          importance: data.importance || 5,
          confidence: data.confidence || 8,
          source: data.source,
          encryptedTags,
          expiresAt: data.expiresAt
        })
        .returning();
      
      return memory;
    } catch (error: any) {
      console.error('Memory creation failed:', error);
      throw new Error('Failed to create encrypted memory');
    }
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
    
    // Text search in key (encrypted content search is more complex)
    if (query) {
      conditions.push(
        sql`(
          ${zedMemoryEntries.key} ILIKE ${`%${query}%`} OR
          ${zedMemoryEntries.category} ILIKE ${`%${query}%`} OR
          ${zedMemoryEntries.memoryType} ILIKE ${`%${query}%`}
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
        baseQuery = baseQuery.orderBy(desc(zedMemoryEntries.importance), desc(zedMemoryEntries.updatedAt));
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

  // Decrypt a single memory entry
  async decryptMemory(memory: ZedMemoryEntry): Promise<any> {
    try {
      const decryptedContent = encryptionService.decryptMemoryContent(
        memory.encryptedContent as any, 
        memory.userId
      );
      
      // Verify content integrity if hash exists
      if (memory.contentHash) {
        const computedHash = crypto.createHash('sha256')
          .update(JSON.stringify(decryptedContent))
          .digest('hex');
        
        if (computedHash !== memory.contentHash) {
          console.warn(`Content integrity check failed for memory ${memory.id}`);
        }
      }
      
      // Decrypt tags
      const decryptedTags = memory.encryptedTags?.map((encTag: string) => {
        try {
          return encryptionService.decrypt({
            encryptedData: encTag,
            salt: '',
            iv: ''
          }, `user_${memory.userId}_tags`);
        } catch {
          return '[encrypted]';
        }
      }) || [];
      
      return {
        ...memory,
        content: decryptedContent,
        contextTags: decryptedTags
      };
    } catch (error: any) {
      console.error('Memory decryption failed:', error);
      return {
        ...memory,
        content: { error: 'Decryption failed' },
        contextTags: ['[encrypted]']
      };
    }
  }
  
  // Search and decrypt memories
  async searchAndDecryptMemories(userId: number, query: string, options: MemorySearchOptions = {}): Promise<any[]> {
    const encryptedMemories = await this.searchMemories(userId, query, options);
    return await Promise.all(encryptedMemories.map(memory => this.decryptMemory(memory)));
  }
  
  // === HIGH-LEVEL ENCRYPTED OPERATIONS ===
  
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
      totalAccess: stats.reduce((sum, stat) => sum + (stat.totalAccess || 0), 0),
      encrypted: true,
      securityLevel: 'AES-256'
    };
  }
  
  // Clean up expired or corrupted memories
  async cleanupMemories(userId: number): Promise<number> {
    // Remove expired memories
    const expiredResult = await db
      .update(zedMemoryEntries)
      .set({ isActive: false })
      .where(
        and(
          eq(zedMemoryEntries.userId, userId),
          eq(zedMemoryEntries.isActive, true),
          sql`${zedMemoryEntries.expiresAt} < NOW()`
        )
      );
    
    // Archive old, low-importance, rarely accessed memories
    const archiveResult = await db
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
    
    return (expiredResult.rowCount || 0) + (archiveResult.rowCount || 0);
  }

  // Delete a memory entry permanently
  async deleteMemory(userId: number, memoryId: number): Promise<boolean> {
    try {
      const result = await db
        .update(zedMemoryEntries)
        .set({ 
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(zedMemoryEntries.id, memoryId),
            eq(zedMemoryEntries.userId, userId),
            eq(zedMemoryEntries.isActive, true)
          )
        );
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Failed to delete memory:', error);
      return false;
    }
  }
}

export const zedMemoryServiceFixed = new ZedMemoryServiceFixed();