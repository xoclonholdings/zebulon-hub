import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, real, uuid } from "drizzle-orm/pg-core";
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

// Oracle Administration Tables
export const oracleConnections = pgTable("oracle_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  connectionName: text("connection_name").notNull(),
  host: text("host").notNull(),
  port: integer("port").default(1521),
  serviceName: text("service_name").notNull(),
  username: text("username").notNull(),
  encryptedPassword: text("encrypted_password").notNull(), // AES encrypted
  connectionString: text("connection_string"),
  isActive: boolean("is_active").default(true),
  lastTested: timestamp("last_tested"),
  testResult: text("test_result"), // "success" | "failed" | "timeout"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const oracleSchemas = pgTable("oracle_schemas", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").references(() => oracleConnections.id).notNull(),
  schemaName: text("schema_name").notNull(),
  isSystem: boolean("is_system").default(false),
  objectCount: integer("object_count").default(0),
  sizeBytes: integer("size_bytes").default(0),
  lastAnalyzed: timestamp("last_analyzed"),
  privileges: jsonb("privileges"), // user privileges on this schema
});

export const oracleObjects = pgTable("oracle_objects", {
  id: serial("id").primaryKey(),
  schemaId: integer("schema_id").references(() => oracleSchemas.id).notNull(),
  objectName: text("object_name").notNull(),
  objectType: text("object_type").notNull(), // TABLE, VIEW, PROCEDURE, FUNCTION, etc.
  status: text("status").notNull(), // VALID, INVALID
  created: timestamp("created"),
  lastDdlTime: timestamp("last_ddl_time"),
  metadata: jsonb("metadata"), // columns, indexes, etc.
});

export const oracleQueryHistory = pgTable("oracle_query_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  connectionId: integer("connection_id").references(() => oracleConnections.id).notNull(),
  queryText: text("query_text").notNull(),
  queryHash: text("query_hash").notNull(), // SHA256 for deduplication
  executionTime: real("execution_time"), // in seconds
  rowsAffected: integer("rows_affected"),
  status: text("status").notNull(), // "success" | "error" | "timeout"
  errorMessage: text("error_message"),
  zetaSecurityCheck: jsonb("zeta_security_check"), // Zeta Core security analysis
  securityRisk: text("security_risk").default("low"), // "low" | "medium" | "high" | "critical"
  executedAt: timestamp("executed_at").defaultNow(),
});

export const oracleSecurityAudits = pgTable("oracle_security_audits", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").references(() => oracleConnections.id).notNull(),
  auditType: text("audit_type").notNull(), // "login" | "query" | "ddl" | "privilege_escalation"
  userId: integer("user_id").references(() => users.id).notNull(),
  oracleUser: text("oracle_user").notNull(), // Oracle username
  operation: text("operation").notNull(),
  objectName: text("object_name"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  riskLevel: text("risk_level").default("low"), // Zeta Core risk assessment
  blocked: boolean("blocked").default(false), // Whether Zeta blocked the operation
  zetaResponse: jsonb("zeta_response"), // Zeta Core analysis details
  timestamp: timestamp("timestamp").defaultNow(),
});

export const oraclePerformanceMetrics = pgTable("oracle_performance_metrics", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").references(() => oracleConnections.id).notNull(),
  metricType: text("metric_type").notNull(), // "cpu" | "memory" | "io" | "sessions" | "locks"
  value: real("value").notNull(),
  unit: text("unit").notNull(), // "percent" | "mb" | "seconds" | "count"
  threshold: real("threshold"), // alert threshold
  status: text("status").default("normal"), // "normal" | "warning" | "critical"
  collectedAt: timestamp("collected_at").defaultNow(),
});

// Insert schemas for Oracle administration
export const insertOracleConnectionSchema = createInsertSchema(oracleConnections).pick({
  userId: true,
  connectionName: true,
  host: true,
  port: true,
  serviceName: true,
  username: true,
  encryptedPassword: true,
});

export const insertOracleQueryHistorySchema = createInsertSchema(oracleQueryHistory).pick({
  userId: true,
  connectionId: true,
  queryText: true,
  queryHash: true,
});

export const insertOracleSecurityAuditSchema = createInsertSchema(oracleSecurityAudits).pick({
  connectionId: true,
  auditType: true,
  userId: true,
  oracleUser: true,
  operation: true,
  objectName: true,
  riskLevel: true,
});

// Relations for Oracle administration
export const oracleConnectionsRelations = relations(oracleConnections, ({ one, many }) => ({
  user: one(users, { fields: [oracleConnections.userId], references: [users.id] }),
  schemas: many(oracleSchemas),
  queryHistory: many(oracleQueryHistory),
  securityAudits: many(oracleSecurityAudits),
  performanceMetrics: many(oraclePerformanceMetrics),
}));

export const oracleSchemasRelations = relations(oracleSchemas, ({ one, many }) => ({
  connection: one(oracleConnections, { fields: [oracleSchemas.connectionId], references: [oracleConnections.id] }),
  objects: many(oracleObjects),
}));

export const oracleObjectsRelations = relations(oracleObjects, ({ one }) => ({
  schema: one(oracleSchemas, { fields: [oracleObjects.schemaId], references: [oracleSchemas.id] }),
}));

export const oracleQueryHistoryRelations = relations(oracleQueryHistory, ({ one }) => ({
  user: one(users, { fields: [oracleQueryHistory.userId], references: [users.id] }),
  connection: one(oracleConnections, { fields: [oracleQueryHistory.connectionId], references: [oracleConnections.id] }),
}));

export const oracleSecurityAuditsRelations = relations(oracleSecurityAudits, ({ one }) => ({
  connection: one(oracleConnections, { fields: [oracleSecurityAudits.connectionId], references: [oracleConnections.id] }),
  user: one(users, { fields: [oracleSecurityAudits.userId], references: [users.id] }),
}));

export const oraclePerformanceMetricsRelations = relations(oraclePerformanceMetrics, ({ one }) => ({
  connection: one(oracleConnections, { fields: [oraclePerformanceMetrics.connectionId], references: [oracleConnections.id] }),
}));

// Type exports
export type OracleConnection = typeof oracleConnections.$inferSelect;
export type InsertOracleConnection = typeof oracleConnections.$inferInsert;
export type OracleSchema = typeof oracleSchemas.$inferSelect;
export type OracleObject = typeof oracleObjects.$inferSelect;
export type OracleQueryHistory = typeof oracleQueryHistory.$inferSelect;
export type OracleSecurityAudit = typeof oracleSecurityAudits.$inferSelect;
export type OraclePerformanceMetric = typeof oraclePerformanceMetrics.$inferSelect;

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
