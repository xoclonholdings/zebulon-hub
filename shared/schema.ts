import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
