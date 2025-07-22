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

// User configuration table for customizable settings
export const userConfigurations = pgTable("user_configurations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  configuration: jsonb("configuration").notNull(),
  version: integer("version").default(1),
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
}));

export const userConfigurationsRelations = relations(userConfigurations, ({ one }) => ({
  user: one(users, { fields: [userConfigurations.userId], references: [users.id] }),
}));

export const processAuthorizationsRelations = relations(processAuthorizations, ({ one }) => ({
  user: one(users, { fields: [processAuthorizations.userId], references: [users.id] }),
  approver: one(users, { fields: [processAuthorizations.approvedBy], references: [users.id], relationName: "approver" }),
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
