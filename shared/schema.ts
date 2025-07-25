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



export interface SystemStatus {
  id: number;
  component: string;
  status: string;
  lastChecked: Date;
  details?: string;
  responseTime?: number;
}

export interface OracleMemory {
  id: number;
  label: string;
  description: string;
  content: string;
  memoryType: 'workflow' | 'response' | 'repair' | 'security' | 'data-tag' | 'custom';
  status: 'active' | 'locked';
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

// Insert types for forms
export interface InsertUser {
  username: string;
  passwordHash: string;
  role?: string;
}



export interface InsertOracleMemory {
  label: string;
  description: string;
  content: string;
  memoryType: 'workflow' | 'response' | 'repair' | 'security' | 'data-tag' | 'custom';
  status?: 'active' | 'locked';
  createdBy: string;
}

export interface ModuleIntegration {
  id: string;
  moduleName: string;
  displayName: string;
  isConnected: boolean;
  integrationType?: 'url' | 'script' | 'embed' | null;
  integrationUrl?: string | null;
  integrationScript?: string | null;
  integrationEmbed?: string | null;
  integrationConfig?: any;
  connectedAppName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertModuleIntegration {
  moduleName: string;
  displayName: string;
  isConnected?: boolean;
  integrationType?: 'url' | 'script' | 'embed';
  integrationUrl?: string;
  integrationScript?: string;
  integrationEmbed?: string;
  integrationConfig?: any;
  connectedAppName?: string;
}