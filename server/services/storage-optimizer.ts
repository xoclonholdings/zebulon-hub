// Storage Optimization Service
// Provides advanced storage management, caching, and performance optimization

import { storage } from '../storage';

export class StorageOptimizer {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private queryCache = new Map<string, { data: any; timestamp: number }>();
  private compressionEnabled = true;
  private maxCacheSize = 1000; // Maximum number of cached items
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  constructor() {
    this.initializeOptimizations();
  }

  private initializeOptimizations() {
    // Clean cache every 10 minutes
    setInterval(() => this.cleanExpiredCache(), 10 * 60 * 1000);
    
    // Memory pressure monitoring
    setInterval(() => this.handleMemoryPressure(), 5 * 60 * 1000);
    
    // Performance metrics collection
    setInterval(() => this.collectPerformanceMetrics(), 15 * 60 * 1000);
    
    console.log('Storage Optimizer initialized with caching and performance monitoring');
  }

  // Optimized chat message retrieval with caching
  async getChatMessagesOptimized(userId: number, limit: number = 50): Promise<any[]> {
    const cacheKey = `chat_${userId}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    const messages = await storage.getChatMessages(userId, limit);
    this.setCache(cacheKey, messages, 2 * 60 * 1000); // 2-minute TTL for chat
    
    return messages;
  }

  // Batch operations for better performance
  async batchCreateMessages(messagesData: any[]): Promise<any[]> {
    const startTime = Date.now();
    const created = [];

    // Use storage bulk operations if available
    if ('bulkCreateChatMessages' in storage) {
      const bulkStorage = storage as any;
      const result = await bulkStorage.bulkCreateChatMessages(messagesData);
      this.recordOperation('bulk_create_messages', Date.now() - startTime, messagesData.length);
      return result;
    }

    // Fallback to individual operations
    for (const messageData of messagesData) {
      const message = await storage.createChatMessage(messageData);
      created.push(message);
    }

    this.recordOperation('sequential_create_messages', Date.now() - startTime, messagesData.length);
    return created;
  }

  // Query optimization with result caching
  async getOptimizedOracleQueries(userId: number, filters?: any): Promise<any[]> {
    const cacheKey = `oracle_queries_${userId}_${JSON.stringify(filters || {})}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    const queries = await storage.getOracleQueries(userId, filters?.limit || 50);
    this.setCache(cacheKey, queries, 5 * 60 * 1000); // 5-minute TTL for queries
    
    return queries;
  }

  // User activity aggregation with caching
  async getUserActivityOptimized(userId: number): Promise<any> {
    const cacheKey = `user_activity_${userId}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    const activity = await storage.getUserActivity(userId);
    this.setCache(cacheKey, activity, 10 * 60 * 1000); // 10-minute TTL for activity
    
    return activity;
  }

  // Advanced caching methods
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = this.defaultTTL): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestCache();
    }
    
    this.cache.set(key, {
      data: this.compressionEnabled ? this.compress(data) : data,
      timestamp: Date.now(),
      ttl
    });
  }

  private evictOldestCache(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, value] of Array.from(this.cache.entries())) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of Array.from(this.cache.entries())) {
      if (now > value.timestamp + value.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Storage Optimizer: Cleaned ${cleaned} expired cache entries`);
    }
  }

  private handleMemoryPressure(): void {
    const memUsage = this.getMemoryUsage();
    
    if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
      console.log('Storage Optimizer: Memory pressure detected, clearing cache');
      this.cache.clear();
      this.queryCache.clear();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  private getMemoryUsage() {
    return process.memoryUsage();
  }

  // Simple compression for cached data
  private compress(data: any): any {
    if (!this.compressionEnabled) return data;
    
    try {
      // For now, just stringify and store - could use actual compression library
      return JSON.stringify(data);
    } catch (error) {
      console.error('Compression failed:', error);
      return data;
    }
  }

  private decompress(data: any): any {
    if (!this.compressionEnabled || typeof data !== 'string') return data;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Decompression failed:', error);
      return data;
    }
  }

  // Performance metrics
  private performanceMetrics = {
    operations: new Map<string, { count: number; totalTime: number; avgTime: number }>(),
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: [] as Array<{ timestamp: Date; heapUsed: number; heapTotal: number; external: number }>
  };

  private recordOperation(operation: string, duration: number, items: number = 1): void {
    const existing = this.performanceMetrics.operations.get(operation) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count += 1;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.performanceMetrics.operations.set(operation, existing);
  }

  private collectPerformanceMetrics(): void {
    const memUsage = this.getMemoryUsage();
    this.performanceMetrics.memoryUsage.push({
      timestamp: new Date(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });
    
    // Keep only last 24 hours of memory data
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.filter(
      (entry: { timestamp: Date; heapUsed: number; heapTotal: number; external: number }) => 
        entry.timestamp.getTime() > oneDayAgo
    );

    const cacheHitRate = this.performanceMetrics.cacheHits / 
      (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100;

    console.log('Storage Optimizer Metrics:', {
      cacheSize: this.cache.size,
      cacheHitRate: isNaN(cacheHitRate) ? 0 : cacheHitRate.toFixed(2) + '%',
      memoryUsage: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      operations: Object.fromEntries(this.performanceMetrics.operations.entries())
    });
  }

  // Public API for getting optimization stats
  async getOptimizationStats(): Promise<any> {
    const memUsage = this.getMemoryUsage();
    const cacheHitRate = this.performanceMetrics.cacheHits / 
      (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100;

    // Get storage stats if available
    let storageStats = {};
    if ('getStorageStats' in storage) {
      const storageWithStats = storage as any;
      storageStats = await storageWithStats.getStorageStats();
    }

    return {
      cache: {
        size: this.cache.size,
        maxSize: this.maxCacheSize,
        hitRate: isNaN(cacheHitRate) ? 0 : parseFloat(cacheHitRate.toFixed(2)),
        hits: this.performanceMetrics.cacheHits,
        misses: this.performanceMetrics.cacheMisses
      },
      memory: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      },
      storage: storageStats,
      operations: Object.fromEntries(this.performanceMetrics.operations.entries()),
      uptime: process.uptime()
    };
  }

  // Cache invalidation methods
  invalidateUserCache(userId: number): void {
    const keysToDelete = [];
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(`_${userId}_`) || key.endsWith(`_${userId}`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Invalidated ${keysToDelete.length} cache entries for user ${userId}`);
  }

  clearAllCache(): void {
    this.cache.clear();
    this.queryCache.clear();
    console.log('All caches cleared');
  }

  // Preload frequently accessed data
  async preloadUserData(userId: number): Promise<void> {
    const startTime = Date.now();
    
    // Preload common queries
    await Promise.all([
      this.getChatMessagesOptimized(userId, 20),
      this.getOptimizedOracleQueries(userId),
      this.getUserActivityOptimized(userId)
    ]);
    
    console.log(`Preloaded user ${userId} data in ${Date.now() - startTime}ms`);
  }
}

export const storageOptimizer = new StorageOptimizer();