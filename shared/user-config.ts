import { z } from "zod";

// User Configuration Schema for Zebulon System
export const userConfigSchema = z.object({
  // Dashboard Configuration
  dashboard: z.object({
    layout: z.enum(["grid", "list", "compact"]).default("grid"),
    widgets: z.array(z.object({
      id: z.string(),
      type: z.string(),
      enabled: z.boolean(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number()
      }),
      config: z.record(z.any())
    })).default([]),
    theme: z.enum(["dark", "light", "auto"]).default("dark"),
    autoRefresh: z.boolean().default(true),
    refreshInterval: z.number().min(5000).max(300000).default(30000)
  }),
  
  // Zed Core Configuration
  zedCore: z.object({
    permissions: z.object({
      // Database operations
      canExecuteQueries: z.boolean().default(false),
      canModifyData: z.boolean().default(false),
      canCreateTables: z.boolean().default(false),
      canDropTables: z.boolean().default(false),
      
      // System operations
      canManageUsers: z.boolean().default(false),
      canAccessSystemStatus: z.boolean().default(true),
      canModifySettings: z.boolean().default(false),
      
      // File operations
      canReadFiles: z.boolean().default(false),
      canWriteFiles: z.boolean().default(false),
      canDeleteFiles: z.boolean().default(false),
      
      // Oracle operations
      canConnectToOracle: z.boolean().default(true),
      canManageConnections: z.boolean().default(false),
      canRunStoredProcedures: z.boolean().default(false)
    }),
    
    behavior: z.object({
      requireConfirmation: z.boolean().default(true),
      confirmationTimeout: z.number().min(5000).max(60000).default(30000),
      maxActionsPerSession: z.number().min(1).max(100).default(10),
      autoExecuteSimpleQueries: z.boolean().default(false),
      enableLearningMode: z.boolean().default(true),
      verboseLogging: z.boolean().default(false)
    }),
    
    aiSettings: z.object({
      model: z.enum(["claude-sonnet-4", "claude-haiku-3", "local"]).default("local"),
      temperature: z.number().min(0).max(2).default(0.7),
      maxTokens: z.number().min(100).max(8000).default(2000),
      responseStyle: z.enum(["concise", "detailed", "technical", "friendly"]).default("friendly"),
      enableContextMemory: z.boolean().default(true),
      contextWindow: z.number().min(1).max(50).default(10)
    })
  }),
  
  // Zeta Core (Security) Configuration
  zetaCore: z.object({
    monitoring: z.object({
      enabled: z.boolean().default(true),
      alertLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      realTimeScanning: z.boolean().default(true),
      behaviorAnalysis: z.boolean().default(true),
      anomalyDetection: z.boolean().default(true)
    }),
    
    notifications: z.object({
      email: z.boolean().default(false),
      desktop: z.boolean().default(true),
      sound: z.boolean().default(false),
      detailedReports: z.boolean().default(false)
    })
  }),
  
  // Fantasma Firewall Configuration
  fantasmaFirewall: z.object({
    protection: z.object({
      enabled: z.boolean().default(true),
      automaticScanning: z.boolean().default(true),
      scanInterval: z.number().min(60000).max(3600000).default(300000), // 5 minutes
      deepScan: z.boolean().default(false),
      quarantineThreats: z.boolean().default(true)
    }),
    
    stealth: z.object({
      behaviorCloaking: z.boolean().default(false),
      metadataVaulting: z.boolean().default(true),
      trafficObfuscation: z.boolean().default(false),
      ghostMode: z.boolean().default(false)
    })
  }),
  
  // Oracle Database Configuration
  oracle: z.object({
    connections: z.object({
      maxConnections: z.number().min(1).max(100).default(10),
      connectionTimeout: z.number().min(5000).max(60000).default(30000),
      autoReconnect: z.boolean().default(true),
      pooling: z.boolean().default(true)
    }),
    
    queryLimits: z.object({
      maxExecutionTime: z.number().min(1000).max(300000).default(60000), // 1 minute
      maxResultRows: z.number().min(100).max(10000).default(1000),
      allowDangerousOperations: z.boolean().default(false)
    })
  }),
  
  // Voice and Audio Configuration
  audio: z.object({
    voiceCommands: z.boolean().default(true),
    voiceId: z.string().optional(),
    language: z.enum(["en-US", "en-GB", "es-ES", "fr-FR", "de-DE"]).default("en-US"),
    sensitivity: z.number().min(0.1).max(1.0).default(0.7),
    wakeWord: z.string().default("Zed")
  })
});

export type UserConfig = z.infer<typeof userConfigSchema>;

// Default configuration
export const defaultUserConfig: UserConfig = {
  dashboard: {
    layout: "grid",
    widgets: [],
    theme: "dark",
    autoRefresh: true,
    refreshInterval: 30000
  },
  zedCore: {
    permissions: {
      canExecuteQueries: false,
      canModifyData: false,
      canCreateTables: false,
      canDropTables: false,
      canManageUsers: false,
      canAccessSystemStatus: true,
      canModifySettings: false,
      canReadFiles: false,
      canWriteFiles: false,
      canDeleteFiles: false,
      canConnectToOracle: true,
      canManageConnections: false,
      canRunStoredProcedures: false
    },
    behavior: {
      requireConfirmation: true,
      confirmationTimeout: 30000,
      maxActionsPerSession: 10,
      autoExecuteSimpleQueries: false,
      enableLearningMode: true,
      verboseLogging: false
    },
    aiSettings: {
      model: "local",
      temperature: 0.7,
      maxTokens: 2000,
      responseStyle: "friendly",
      enableContextMemory: true,
      contextWindow: 10
    }
  },
  zetaCore: {
    monitoring: {
      enabled: true,
      alertLevel: "medium",
      realTimeScanning: true,
      behaviorAnalysis: true,
      anomalyDetection: true
    },
    notifications: {
      email: false,
      desktop: true,
      sound: false,
      detailedReports: false
    }
  },
  fantasmaFirewall: {
    protection: {
      enabled: true,
      automaticScanning: true,
      scanInterval: 300000,
      deepScan: false,
      quarantineThreats: true
    },
    stealth: {
      behaviorCloaking: false,
      metadataVaulting: true,
      trafficObfuscation: false,
      ghostMode: false
    }
  },
  oracle: {
    connections: {
      maxConnections: 10,
      connectionTimeout: 30000,
      autoReconnect: true,
      pooling: true
    },
    queryLimits: {
      maxExecutionTime: 60000,
      maxResultRows: 1000,
      allowDangerousOperations: false
    }
  },
  audio: {
    voiceCommands: true,
    language: "en-US",
    sensitivity: 0.7,
    wakeWord: "Zed"
  }
};

// Process Authorization Schema
export const processAuthorizationSchema = z.object({
  id: z.string(),
  userId: z.number(),
  processType: z.enum([
    "query_execution",
    "data_modification", 
    "table_creation",
    "user_management",
    "system_modification",
    "file_operation",
    "oracle_connection",
    "security_scan",
    "configuration_change"
  ]),
  description: z.string(),
  parameters: z.record(z.any()),
  requestedAt: z.date(),
  approvedAt: z.date().optional(),
  rejectedAt: z.date().optional(),
  approvedBy: z.number().optional(),
  status: z.enum(["pending", "approved", "rejected", "executed", "failed"]).default("pending"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  autoApprove: z.boolean().default(false),
  timeoutMs: z.number().default(300000) // 5 minutes
});

export type ProcessAuthorization = z.infer<typeof processAuthorizationSchema>;