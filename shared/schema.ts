// Zebulon AI System - Core Schema
// Focus: Zebulon and Zed functionality only

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  userId: number;
  message: string;
  aiCore: string;
  createdAt: Date;
}

export interface SystemStatus {
  id: number;
  component: string;
  status: string;
  lastChecked: Date;
  details?: string;
  responseTime?: number;
}

// Insert types for forms
export interface InsertUser {
  username: string;
  passwordHash: string;
  role?: string;
}

export interface InsertChatMessage {
  userId: number;
  message: string;
  aiCore?: string;
}