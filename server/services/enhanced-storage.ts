// Enhanced Storage System with Advanced Optimization
// Provides intelligent caching, compression, and performance monitoring

import { storage, type IStorage } from '../storage';
import { StorageOptimizer } from './storage-optimizer';

export class EnhancedStorage {
  private optimizer: StorageOptimizer;
  private indexCache = new Map<string, Map<any, any>>();
  private compressionRatio = new Map<string, number>();
  private accessPatterns = new Map<string, { count: number; lastAccess: Date }>();

  constructor() {
    this.optimizer = new StorageOptimizer();
    this.initializeIndexes();
    
    // Periodic optimization tasks
    setInterval(() => this.analyzeAccessPatterns(), 30 * 60 * 1000); // 30 minutes
    setInterval(() => this.optimizeIndexes(), 60 * 60 * 1000); // 1 hour
  }

  // Initialize search indexes for fast lookups
  private initializeIndexes(): void {
    this.indexCache.set('usersByUsername', new Map());
    this.indexCache.set('messagesByUser', new Map());
    this.indexCache.set('tasksByUser', new Map());
    this.indexCache.set('notesByUser', new Map());
    console.log('Enhanced Storage: Search indexes initialized');
  }

  // Smart caching with compression and TTL
  async getChatMessagesEnhanced(userId: number, limit: number = 50, filters?: any): Promise<any[]> {
    const cacheKey = `enhanced_chat_${userId}_${limit}_${JSON.stringify(filters || {})}`;
    let messages = (this.optimizer as any).getFromCache(cacheKey);
    
    if (!messages) {
      messages = await storage.getChatMessages(userId, limit);
      
      // Apply filters if provided
      if (filters) {
        if (filters.aiCore) {
          messages = messages.filter((msg: any) => msg.aiCore === filters.aiCore);
        }
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          messages = messages.filter((msg: any) => new Date(msg.timestamp) >= fromDate);
        }
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          messages = messages.filter((msg: any) => 
            msg.message.toLowerCase().includes(searchLower) ||
            (msg.response && msg.response.toLowerCase().includes(searchLower))
          );
        }
      }
      
      // Cache with intelligent TTL based on data freshness
      const ttl = this.calculateOptimalTTL('chat', messages.length);
      (this.optimizer as any).setCache(cacheKey, messages, ttl);
      
      this.trackAccess(`chat_${userId}`);
    }
    
    return messages;
  }

  // Intelligent batch operations
  async batchOperations(operations: Array<{ type: string; data: any }>): Promise<any[]> {
    const startTime = Date.now();
    const results = [];
    
    // Group operations by type for optimization
    const groupedOps = new Map<string, any[]>();
    for (const op of operations) {
      if (!groupedOps.has(op.type)) {
        groupedOps.set(op.type, []);
      }
      groupedOps.get(op.type)!.push(op.data);
    }
    
    // Execute grouped operations
    for (const [type, items] of Array.from(groupedOps.entries())) {
      switch (type) {
        case 'createChatMessage':
          if ('bulkCreateChatMessages' in storage) {
            const bulkStorage = storage as any;
            const batchResult = await bulkStorage.bulkCreateChatMessages(items);
            results.push(...batchResult);
          } else {
            for (const item of items) {
              const result = await storage.createChatMessage(item);
              results.push(result);
            }
          }
          break;
          
        case 'createTask':
          for (const item of items) {
            const result = await storage.createTask(item);
            results.push(result);
          }
          break;
          
        default:
          console.warn(`Unknown batch operation type: ${type}`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`Enhanced Storage: Batch operations completed in ${duration}ms (${operations.length} operations)`);
    
    return results;
  }

  // Smart indexing for fast user lookups
  async getUserByUsernameIndexed(username: string): Promise<any> {
    const index = this.indexCache.get('usersByUsername');
    if (index && index.has(username)) {
      this.trackAccess('user_lookup_indexed');
      return index.get(username);
    }
    
    const user = await storage.getUserByUsername(username);
    if (user && index) {
      index.set(username, user);
    }
    
    this.trackAccess('user_lookup_direct');
    return user;
  }

  // Advanced search with multiple criteria
  async searchMessages(userId: number, criteria: {
    text?: string;
    aiCore?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<any[]> {
    const cacheKey = `search_${userId}_${JSON.stringify(criteria)}`;
    let results = this.optimizer['getFromCache'](cacheKey);
    
    if (!results) {
      // Get all messages for user
      const allMessages = await storage.getChatMessages(userId, 1000);
      
      // Apply search criteria
      results = allMessages.filter((msg: any) => {
        if (criteria.text && !msg.message.toLowerCase().includes(criteria.text.toLowerCase()) && 
            !(msg.response && msg.response.toLowerCase().includes(criteria.text.toLowerCase()))) {
          return false;
        }
        
        if (criteria.aiCore && msg.aiCore !== criteria.aiCore) {
          return false;
        }
        
        const msgDate = new Date(msg.timestamp);
        if (criteria.dateFrom && msgDate < criteria.dateFrom) {
          return false;
        }
        
        if (criteria.dateTo && msgDate > criteria.dateTo) {
          return false;
        }
        
        return true;
      });
      
      // Sort by relevance (most recent first)
      results.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Apply limit
      if (criteria.limit && criteria.limit > 0) {
        results = results.slice(0, criteria.limit);
      }
      
      // Cache search results for 5 minutes
      this.optimizer['setCache'](cacheKey, results, 5 * 60 * 1000);
    }
    
    this.trackAccess(`search_${userId}`);
    return results;
  }

  // Calculate optimal TTL based on data characteristics
  private calculateOptimalTTL(dataType: string, itemCount: number): number {
    const baseTTL = {
      'chat': 2 * 60 * 1000,      // 2 minutes
      'tasks': 10 * 60 * 1000,    // 10 minutes
      'notes': 15 * 60 * 1000,    // 15 minutes
      'oracle': 5 * 60 * 1000,    // 5 minutes
      'system': 30 * 60 * 1000    // 30 minutes
    };
    
    const base = baseTTL[dataType as keyof typeof baseTTL] || 5 * 60 * 1000;
    
    // Adjust based on item count (less items = longer cache)
    const countMultiplier = Math.max(0.5, Math.min(2.0, 1 - (itemCount / 1000)));
    
    return Math.round(base * countMultiplier);
  }

  // Track access patterns for optimization
  private trackAccess(key: string): void {
    const existing = this.accessPatterns.get(key) || { count: 0, lastAccess: new Date() };
    existing.count++;
    existing.lastAccess = new Date();
    this.accessPatterns.set(key, existing);
  }

  // Analyze access patterns to optimize caching
  private analyzeAccessPatterns(): void {
    const hotPatterns = Array.from(this.accessPatterns.entries())
      .filter(([key, pattern]) => pattern.count > 10) // Frequently accessed
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10); // Top 10
    
    console.log('Enhanced Storage: Hot access patterns:', 
      hotPatterns.map(([key, pattern]) => ({ key, count: pattern.count }))
    );
    
    // Clear old access patterns (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [key, pattern] of Array.from(this.accessPatterns.entries())) {
      if (pattern.lastAccess < oneHourAgo) {
        this.accessPatterns.delete(key);
      }
    }
  }

  // Optimize indexes based on usage
  private optimizeIndexes(): void {
    let optimized = 0;
    
    // Rebuild user index if needed
    const userIndex = this.indexCache.get('usersByUsername');
    if (userIndex && userIndex.size > 100) {
      userIndex.clear();
      optimized++;
    }
    
    console.log(`Enhanced Storage: Optimized ${optimized} indexes`);
  }

  // Get comprehensive storage statistics
  async getEnhancedStats(): Promise<any> {
    const baseStats = await this.optimizer.getOptimizationStats();
    
    return {
      ...baseStats,
      enhanced: {
        indexes: {
          usersByUsername: this.indexCache.get('usersByUsername')?.size || 0,
          messagesByUser: this.indexCache.get('messagesByUser')?.size || 0,
          tasksByUser: this.indexCache.get('tasksByUser')?.size || 0,
          notesByUser: this.indexCache.get('notesByUser')?.size || 0
        },
        accessPatterns: {
          totalPatterns: this.accessPatterns.size,
          hotPatterns: Array.from(this.accessPatterns.entries())
            .filter(([, pattern]) => pattern.count > 5)
            .length
        },
        compression: {
          ratios: Object.fromEntries(this.compressionRatio.entries()),
          avgRatio: Array.from(this.compressionRatio.values())
            .reduce((sum, ratio) => sum + ratio, 0) / this.compressionRatio.size || 0
        }
      }
    };
  }

  // Force optimization of all storage systems
  async forceOptimization(): Promise<any> {
    console.log('Enhanced Storage: Starting force optimization...');
    
    // Clear all caches
    this.optimizer.clearAllCache();
    
    // Rebuild indexes
    this.initializeIndexes();
    
    // Run storage optimization if available
    let storageOptResults = {};
    if ('optimizeStorage' in storage) {
      const storageWithOpt = storage as any;
      storageOptResults = await storageWithOpt.optimizeStorage();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const results = {
      cacheCleared: true,
      indexesRebuilt: true,
      storageOptimization: storageOptResults,
      memoryAfterGC: process.memoryUsage()
    };
    
    console.log('Enhanced Storage: Force optimization completed');
    return results;
  }
}

// Export singleton instance
export const enhancedStorage = new EnhancedStorage();