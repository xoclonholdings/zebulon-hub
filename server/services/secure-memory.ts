import { encryptionService } from './encryption';
import { zedMemoryService, MemoryCreationData } from './zed-memory';
import type { ZedMemoryEntry } from '@shared/schema';
import crypto from 'crypto';

/**
 * Secure Memory Service - Wraps the ZedMemoryService with encryption
 * All memory data is encrypted before storage and decrypted on retrieval
 */
export class SecureMemoryService {
  // Create encrypted memory entry
  async createSecureMemory(userId: number, data: MemoryCreationData): Promise<ZedMemoryEntry> {
    try {
      // Encrypt the content
      const encryptedContent = encryptionService.encryptMemoryContent(data.content, userId);
      
      // Create content hash for integrity verification
      const contentHash = crypto.createHash('sha256')
        .update(JSON.stringify(data.content))
        .digest('hex');
      
      // Encrypt context tags if provided
      const encryptedTags = data.contextTags ? 
        data.contextTags.map(tag => encryptionService.encrypt(tag, `user_${userId}_tags`).encryptedData) :
        [];
      
      // Prepare encrypted data structure
      const encryptedData = {
        ...data,
        content: encryptedContent,
        contentHash,
        contextTags: encryptedTags
      };
      
      // Store through the base memory service
      return await zedMemoryService.createMemory(userId, encryptedData as any);
    } catch (error) {
      console.error('Secure memory creation failed:', error);
      throw new Error('Failed to create secure memory entry');
    }
  }

  // Decrypt and retrieve memory
  async getDecryptedMemory(userId: number, memoryId: number): Promise<any> {
    try {
      // Get the encrypted memory from storage by searching
      const memories = await zedMemoryService.searchMemories(userId, '', { limit: 1000 });
      const memory = memories.find(m => m.id === memoryId);
      
      if (!memory || memory.userId !== userId) {
        throw new Error('Memory not found or access denied');
      }
      
      // Decrypt the content
      const decryptedContent = encryptionService.decryptMemoryContent(memory.encryptedContent as any, userId);
      
      // Verify content integrity
      const computedHash = crypto.createHash('sha256')
        .update(JSON.stringify(decryptedContent))
        .digest('hex');
      
      if (memory.contentHash && computedHash !== memory.contentHash) {
        console.warn(`Content integrity check failed for memory ${memoryId}`);
        // Could indicate tampering or corruption
      }
      
      // Decrypt context tags
      const decryptedTags = memory.contextTags ? 
        memory.contextTags.map((encTag: string) => {
          try {
            return encryptionService.decrypt({
              encryptedData: encTag,
              salt: '',
              iv: '',
              tag: ''
            } as any, `user_${userId}_tags`);
          } catch {
            return '[encrypted]'; // Fallback for corrupted tags
          }
        }) : [];
      
      return {
        ...memory,
        content: decryptedContent,
        contextTags: decryptedTags
      };
    } catch (error) {
      console.error('Memory decryption failed:', error);
      throw new Error('Failed to decrypt memory entry');
    }
  }

  // Search memories with decryption
  async searchSecureMemories(userId: number, query: string, options: any = {}): Promise<any[]> {
    try {
      // Get encrypted memories from base service
      const encryptedMemories = await zedMemoryService.searchMemories(userId, query, options);
      
      // Decrypt each memory
      const decryptedMemories = await Promise.all(
        encryptedMemories.map(async (memory) => {
          try {
            return await this.getDecryptedMemory(userId, memory.id);
          } catch (error) {
            console.warn(`Failed to decrypt memory ${memory.id}:`, error);
            // Return partial data for corrupted memories
            return {
              ...memory,
              content: { error: 'Decryption failed', encrypted: true },
              contextTags: ['[encrypted]']
            };
          }
        })
      );
      
      return decryptedMemories;
    } catch (error) {
      console.error('Secure memory search failed:', error);
      throw new Error('Failed to search secure memories');
    }
  }

  // Remember user preference with encryption
  async rememberSecurePreference(
    userId: number,
    preference: string,
    value: any,
    context?: string
  ): Promise<ZedMemoryEntry> {
    return await this.createSecureMemory(userId, {
      memoryType: 'user_preference',
      category: 'behavioral',
      key: `preference_${preference}`,
      content: { preference, value, context },
      importance: 7,
      source: 'user_told',
      contextTags: ['preference', context || 'general'].filter(Boolean)
    });
  }

  // Remember fact with encryption
  async rememberSecureFact(
    userId: number,
    fact: string,
    category: string = 'general',
    importance: number = 5
  ): Promise<ZedMemoryEntry> {
    return await this.createSecureMemory(userId, {
      memoryType: 'fact',
      category,
      key: `fact_${Date.now()}`,
      content: { fact, learned: new Date().toISOString() },
      importance,
      source: 'user_told',
      contextTags: [category, 'fact']
    });
  }

  // Secure memory cleanup with verification
  async secureMemoryCleanup(userId: number): Promise<number> {
    try {
      // Get all user memories for verification
      const memories = await zedMemoryService.searchMemories(userId, '', { limit: 1000 });
      
      let corruptedCount = 0;
      let cleanedCount = 0;
      
      for (const memory of memories) {
        try {
          // Try to decrypt and verify each memory
          await this.getDecryptedMemory(userId, memory.id);
        } catch (error) {
          console.warn(`Corrupted memory detected: ${memory.id}`);
          corruptedCount++;
          
          // Mark corrupted memories as inactive
          await zedMemoryService.updateMemory(memory.id, { isActive: false });
        }
      }
      
      // Run standard cleanup
      cleanedCount = await zedMemoryService.cleanupMemories(userId);
      
      if (corruptedCount > 0) {
        console.log(`Secure cleanup completed: ${cleanedCount} expired, ${corruptedCount} corrupted memories cleaned`);
      }
      
      return cleanedCount + corruptedCount;
    } catch (error) {
      console.error('Secure memory cleanup failed:', error);
      return 0;
    }
  }

  // Export encrypted memory backup
  async exportSecureMemoryBackup(userId: number): Promise<string> {
    try {
      const memories = await zedMemoryService.searchMemories(userId, '', { limit: 10000 });
      
      // Create encrypted backup
      const backupData = {
        userId,
        exportDate: new Date().toISOString(),
        memories: memories.map(m => ({
          id: m.id,
          memoryType: m.memoryType,
          category: m.category,
          encryptedContent: m.content,
          importance: m.importance,
          source: m.source,
          createdAt: m.createdAt
        }))
      };
      
      // Double-encrypt the entire backup
      const backupEncryption = encryptionService.encrypt(backupData, `user_${userId}_backup`);
      
      return JSON.stringify(backupEncryption);
    } catch (error) {
      console.error('Memory backup export failed:', error);
      throw new Error('Failed to export secure memory backup');
    }
  }

  // Get memory statistics with security metrics
  async getSecureMemoryStats(userId: number): Promise<any> {
    try {
      const baseStats = await zedMemoryService.getMemoryStats(userId);
      
      // Add security metrics
      const memories = await zedMemoryService.searchMemories(userId, '', { limit: 1000 });
      let integrityChecks = 0;
      let corruptedMemories = 0;
      
      for (const memory of memories) {
        try {
          await this.getDecryptedMemory(userId, memory.id);
          integrityChecks++;
        } catch {
          corruptedMemories++;
        }
      }
      
      return {
        ...baseStats,
        security: {
          totalChecked: integrityChecks,
          corrupted: corruptedMemories,
          integrityRatio: integrityChecks / (integrityChecks + corruptedMemories || 1),
          encryptionVersion: 1,
          lastSecurityScan: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Secure memory stats failed:', error);
      return { error: 'Failed to get secure memory statistics' };
    }
  }
}

export const secureMemoryService = new SecureMemoryService();