import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  codename: text("codename").notNull(),
  role: text("role").notNull().default("User"),
  theme: text("theme").notNull().default("light"),
  voiceId: text("voice_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  response: text("response"),
  aiCore: text("ai_core").notNull(), // "zed", "zeta", etc.
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
});

export const oracleQueries = pgTable("oracle_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  naturalLanguage: text("natural_language").notNull(),
  sqlQuery: text("sql_query"),
  results: jsonb("results"),
  executionTime: integer("execution_time"), // in milliseconds
  timestamp: timestamp("timestamp").defaultNow(),
});

export const systemStatus = pgTable("system_status", {
  id: serial("id").primaryKey(),
  component: text("component").notNull(), // "oracle", "fantasia", "zeta"
  status: text("status").notNull(), // "online", "offline", "warning"
  metrics: jsonb("metrics"),
  lastCheck: timestamp("last_check").defaultNow(),
});

export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User configuration table for customizable settings (ENCRYPTED)
export const userConfigurations = pgTable("user_configurations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  encryptedConfig: jsonb("encrypted_config").notNull(), // encrypted configuration object
  configHash: text("config_hash").notNull(), // integrity verification
  encryptionVersion: integer("encryption_version").default(1), // for migration support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Process authorization table for Zed actions requiring user approval
export const processAuthorizations = pgTable("process_authorizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  processType: text("process_type").notNull(),
  description: text("description").notNull(),
  parameters: jsonb("parameters").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, executed, failed
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  autoApprove: boolean("auto_approve").default(false),
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  executedAt: timestamp("executed_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  result: jsonb("result"),
  errorMessage: text("error_message"),
  timeoutMs: integer("timeout_ms").default(300000),
});

// Zed Memory Database - Core memory storage for AI learning and context (ENCRYPTED)
export const zedMemoryEntries = pgTable("zed_memory_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  memoryType: text("memory_type").notNull(), // 'user_preference', 'fact', 'context', 'skill', 'relationship', 'explicit'
  category: text("category").notNull(), // 'personal', 'professional', 'technical', 'behavioral', 'system'
  key: text("key").notNull(), // searchable key/identifier (encrypted)
  encryptedContent: jsonb("encrypted_content").notNull(), // encrypted memory data
  contentHash: text("content_hash").notNull(), // hash for integrity verification
  importance: integer("importance").notNull().default(5), // 1-10 importance scale
  confidence: integer("confidence").notNull().default(8), // 1-10 confidence level
  source: text("source").notNull(), // 'user_told', 'observed', 'inferred', 'system'
  encryptedTags: text("encrypted_tags").array().default([]), // encrypted searchable tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  accessCount: integer("access_count").default(0),
  expiresAt: timestamp("expires_at"), // for temporary memories
  isActive: boolean("is_active").default(true),
});

// Memory associations - links between different memory entries
export const zedMemoryAssociations = pgTable("zed_memory_associations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fromMemoryId: integer("from_memory_id").references(() => zedMemoryEntries.id).notNull(),
  toMemoryId: integer("to_memory_id").references(() => zedMemoryEntries.id).notNull(),
  associationType: text("association_type").notNull(), // 'related', 'caused_by', 'conflicts_with', 'builds_on'
  strength: integer("strength").notNull().default(5), // 1-10 association strength
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversation context storage for maintaining dialogue memory (ENCRYPTED)
export const zedConversationContext = pgTable("zed_conversation_context", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").notNull(), // encrypted session identifier
  encryptedContext: jsonb("encrypted_context").notNull(), // encrypted context window
  encryptedSummary: text("encrypted_summary"), // encrypted topic summary
  encryptedMood: text("encrypted_mood"), // encrypted user mood data
  encryptedTaskContext: jsonb("encrypted_task_context"), // encrypted task context
  memoryReferences: integer("memory_references").array().default([]), // referenced memory IDs
  contextHash: text("context_hash").notNull(), // integrity verification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Learning patterns - tracks how Zed learns about user patterns
export const zedLearningPatterns = pgTable("zed_learning_patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  patternType: text("pattern_type").notNull(), // 'behavioral', 'preference', 'skill', 'workflow'
  patternData: jsonb("pattern_data").notNull(),
  confidence: integer("confidence").notNull().default(5),
  observationCount: integer("observation_count").default(1),
  lastObserved: timestamp("last_observed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  codename: true,
  role: true,
  theme: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
  aiCore: true,
});

export const insertOracleQuerySchema = createInsertSchema(oracleQueries).pick({
  userId: true,
  naturalLanguage: true,
});

export const insertTaskSchema = createInsertSchema(userTasks).pick({
  userId: true,
  title: true,
  description: true,
});

export const insertNoteSchema = createInsertSchema(userNotes).pick({
  userId: true,
  content: true,
});

export const insertUserConfigurationSchema = createInsertSchema(userConfigurations).pick({
  userId: true,
  configuration: true,
});

export const insertProcessAuthorizationSchema = createInsertSchema(processAuthorizations).pick({
  userId: true,
  processType: true,
  description: true,
  parameters: true,
  priority: true,
  autoApprove: true,
  timeoutMs: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  chatMessages: many(chatMessages),
  oracleQueries: many(oracleQueries),
  userTasks: many(userTasks),
  userNotes: many(userNotes),
  userConfigurations: many(userConfigurations),
  processAuthorizations: many(processAuthorizations),
  approvedAuthorizations: many(processAuthorizations, { relationName: "approver" }),
  memoryEntries: many(zedMemoryEntries),
  memoryAssociations: many(zedMemoryAssociations),
  conversationContexts: many(zedConversationContext),
  learningPatterns: many(zedLearningPatterns),
}));

export const userConfigurationsRelations = relations(userConfigurations, ({ one }) => ({
  user: one(users, { fields: [userConfigurations.userId], references: [users.id] }),
}));

export const processAuthorizationsRelations = relations(processAuthorizations, ({ one }) => ({
  user: one(users, { fields: [processAuthorizations.userId], references: [users.id] }),
  approver: one(users, { fields: [processAuthorizations.approvedBy], references: [users.id], relationName: "approver" }),
}));

export const zedMemoryEntriesRelations = relations(zedMemoryEntries, ({ one, many }) => ({
  user: one(users, { fields: [zedMemoryEntries.userId], references: [users.id] }),
  fromAssociations: many(zedMemoryAssociations, { relationName: "fromMemory" }),
  toAssociations: many(zedMemoryAssociations, { relationName: "toMemory" }),
}));

export const zedMemoryAssociationsRelations = relations(zedMemoryAssociations, ({ one }) => ({
  user: one(users, { fields: [zedMemoryAssociations.userId], references: [users.id] }),
  fromMemory: one(zedMemoryEntries, { fields: [zedMemoryAssociations.fromMemoryId], references: [zedMemoryEntries.id], relationName: "fromMemory" }),
  toMemory: one(zedMemoryEntries, { fields: [zedMemoryAssociations.toMemoryId], references: [zedMemoryEntries.id], relationName: "toMemory" }),
}));

export const zedConversationContextRelations = relations(zedConversationContext, ({ one }) => ({
  user: one(users, { fields: [zedConversationContext.userId], references: [users.id] }),
}));

export const zedLearningPatternsRelations = relations(zedLearningPatterns, ({ one }) => ({
  user: one(users, { fields: [zedLearningPatterns.userId], references: [users.id] }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type OracleQuery = typeof oracleQueries.$inferSelect;
export type InsertOracleQuery = z.infer<typeof insertOracleQuerySchema>;
export type SystemStatus = typeof systemStatus.$inferSelect;
export type UserTask = typeof userTasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UserNote = typeof userNotes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type UserConfiguration = typeof userConfigurations.$inferSelect;
export type InsertUserConfiguration = z.infer<typeof insertUserConfigurationSchema>;
export type ProcessAuthorization = typeof processAuthorizations.$inferSelect;
export type InsertProcessAuthorization = z.infer<typeof insertProcessAuthorizationSchema>;
export type ZedMemoryEntry = typeof zedMemoryEntries.$inferSelect;
export type ZedMemoryAssociation = typeof zedMemoryAssociations.$inferSelect;
export type ZedConversationContext = typeof zedConversationContext.$inferSelect;
export type ZedLearningPattern = typeof zedLearningPatterns.$inferSelect;
