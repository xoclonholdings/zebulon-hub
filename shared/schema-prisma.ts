// Prisma-based schema types and helpers
import type { 
  User, 
  ChatMessage, 
  OracleQuery, 
  SystemStatus,
  UserTask,
  UserNote,
  UserConfiguration,
  ProcessAuthorization,
  ZedMemoryEntry,
  ZedMemoryAssociation,
  ZedConversationContext,
  ZedLearningPattern,
  ZebulonConfig
} from '@prisma/client';

// Export all Prisma types
export type {
  User,
  ChatMessage,
  OracleQuery,
  SystemStatus,
  UserTask,
  UserNote,
  UserConfiguration,
  ProcessAuthorization,
  ZedMemoryEntry,
  ZedMemoryAssociation,
  ZedConversationContext,
  ZedLearningPattern,
  ZebulonConfig
};

// Insert types (omitting auto-generated fields)
export type InsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertChatMessage = Omit<ChatMessage, 'id' | 'createdAt'>;
export type InsertOracleQuery = Omit<OracleQuery, 'id' | 'createdAt'>;
export type InsertUserTask = Omit<UserTask, 'id' | 'createdAt'>;
export type InsertUserNote = Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertUserConfiguration = Omit<UserConfiguration, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertProcessAuthorization = Omit<ProcessAuthorization, 'id' | 'requestedAt'>;

// Default configurations
export const defaultUserConfig = {
  zedCore: {
    enabled: true,
    responseDelay: 500,
    contextMemory: 100,
    autoApproval: false,
    learningMode: true,
    personality: "balanced",
    voiceEnabled: false,
    adaptiveBehavior: false,
    permissions: {
      canExecuteQueries: true,
      canModifyData: false,
      canCreateTables: false,
      canDropTables: false,
      canManageUsers: false,
      canAccessSystemStatus: true,
      canModifySettings: false,
      canReadFiles: true,
      canWriteFiles: false,
      canDeleteFiles: false,
      canConnectToOracle: true,
      canManageConnections: false,
      canRunStoredProcedures: false,
      canUseVoiceCommands: true
    }
  },
  zetaCore: {
    enabled: true,
    securityLevel: "high",
    autoBlock: true,
    threatDetection: true,
    auditLevel: "standard",
    alertThreshold: "medium",
    realTimeMonitoring: true,
    behaviorAnalysis: true
  },
  fantasma: {
    enabled: true,
    stealthMode: false,
    scanInterval: 60,
    deepScanEnabled: false,
    autoQuarantine: false,
    trafficObfuscation: false,
    logRetention: 30,
    emergencyMode: false
  }
};