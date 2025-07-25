// Prisma-based schema - replacing Drizzle ORM
export * from './schema-prisma';

// Legacy compatibility exports
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
  ZebulonConfig,
  InsertUser,
  InsertChatMessage,
  InsertOracleQuery,
  InsertUserTask,
  InsertUserNote
} from './schema-prisma';

// Re-export for compatibility
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
  ZebulonConfig,
  InsertUser,
  InsertChatMessage,
  InsertOracleQuery,
  InsertUserTask,
  InsertUserNote
};