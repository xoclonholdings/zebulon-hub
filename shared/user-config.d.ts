import { z } from "zod";
export declare const userConfigSchema: z.ZodObject<{
    dashboard: z.ZodObject<{
        layout: z.ZodDefault<z.ZodEnum<["grid", "list", "compact"]>>;
        widgets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            enabled: z.ZodBoolean;
            position: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
                width: number;
                height: number;
            }, {
                x: number;
                y: number;
                width: number;
                height: number;
            }>;
            config: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: string;
            config: Record<string, any>;
            enabled: boolean;
            position: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }, {
            id: string;
            type: string;
            config: Record<string, any>;
            enabled: boolean;
            position: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }>, "many">>;
        theme: z.ZodDefault<z.ZodEnum<["dark", "light", "auto"]>>;
        autoRefresh: z.ZodDefault<z.ZodBoolean>;
        refreshInterval: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        theme: "dark" | "light" | "auto";
        layout: "grid" | "list" | "compact";
        widgets: {
            id: string;
            type: string;
            config: Record<string, any>;
            enabled: boolean;
            position: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }[];
        autoRefresh: boolean;
        refreshInterval: number;
    }, {
        theme?: "dark" | "light" | "auto" | undefined;
        layout?: "grid" | "list" | "compact" | undefined;
        widgets?: {
            id: string;
            type: string;
            config: Record<string, any>;
            enabled: boolean;
            position: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }[] | undefined;
        autoRefresh?: boolean | undefined;
        refreshInterval?: number | undefined;
    }>;
    zedCore: z.ZodObject<{
        permissions: z.ZodObject<{
            canExecuteQueries: z.ZodDefault<z.ZodBoolean>;
            canModifyData: z.ZodDefault<z.ZodBoolean>;
            canCreateTables: z.ZodDefault<z.ZodBoolean>;
            canDropTables: z.ZodDefault<z.ZodBoolean>;
            canManageUsers: z.ZodDefault<z.ZodBoolean>;
            canAccessSystemStatus: z.ZodDefault<z.ZodBoolean>;
            canModifySettings: z.ZodDefault<z.ZodBoolean>;
            canReadFiles: z.ZodDefault<z.ZodBoolean>;
            canWriteFiles: z.ZodDefault<z.ZodBoolean>;
            canDeleteFiles: z.ZodDefault<z.ZodBoolean>;
            canConnectToOracle: z.ZodDefault<z.ZodBoolean>;
            canManageConnections: z.ZodDefault<z.ZodBoolean>;
            canRunStoredProcedures: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            canExecuteQueries: boolean;
            canModifyData: boolean;
            canCreateTables: boolean;
            canDropTables: boolean;
            canManageUsers: boolean;
            canAccessSystemStatus: boolean;
            canModifySettings: boolean;
            canReadFiles: boolean;
            canWriteFiles: boolean;
            canDeleteFiles: boolean;
            canConnectToOracle: boolean;
            canManageConnections: boolean;
            canRunStoredProcedures: boolean;
        }, {
            canExecuteQueries?: boolean | undefined;
            canModifyData?: boolean | undefined;
            canCreateTables?: boolean | undefined;
            canDropTables?: boolean | undefined;
            canManageUsers?: boolean | undefined;
            canAccessSystemStatus?: boolean | undefined;
            canModifySettings?: boolean | undefined;
            canReadFiles?: boolean | undefined;
            canWriteFiles?: boolean | undefined;
            canDeleteFiles?: boolean | undefined;
            canConnectToOracle?: boolean | undefined;
            canManageConnections?: boolean | undefined;
            canRunStoredProcedures?: boolean | undefined;
        }>;
        behavior: z.ZodObject<{
            requireConfirmation: z.ZodDefault<z.ZodBoolean>;
            confirmationTimeout: z.ZodDefault<z.ZodNumber>;
            maxActionsPerSession: z.ZodDefault<z.ZodNumber>;
            autoExecuteSimpleQueries: z.ZodDefault<z.ZodBoolean>;
            enableLearningMode: z.ZodDefault<z.ZodBoolean>;
            verboseLogging: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            requireConfirmation: boolean;
            confirmationTimeout: number;
            maxActionsPerSession: number;
            autoExecuteSimpleQueries: boolean;
            enableLearningMode: boolean;
            verboseLogging: boolean;
        }, {
            requireConfirmation?: boolean | undefined;
            confirmationTimeout?: number | undefined;
            maxActionsPerSession?: number | undefined;
            autoExecuteSimpleQueries?: boolean | undefined;
            enableLearningMode?: boolean | undefined;
            verboseLogging?: boolean | undefined;
        }>;
        aiSettings: z.ZodObject<{
            model: z.ZodDefault<z.ZodEnum<["claude-sonnet-4", "claude-haiku-3", "local"]>>;
            temperature: z.ZodDefault<z.ZodNumber>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
            responseStyle: z.ZodDefault<z.ZodEnum<["concise", "detailed", "technical", "friendly"]>>;
            enableContextMemory: z.ZodDefault<z.ZodBoolean>;
            contextWindow: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            model: "claude-sonnet-4" | "claude-haiku-3" | "local";
            temperature: number;
            maxTokens: number;
            responseStyle: "concise" | "detailed" | "technical" | "friendly";
            enableContextMemory: boolean;
            contextWindow: number;
        }, {
            model?: "claude-sonnet-4" | "claude-haiku-3" | "local" | undefined;
            temperature?: number | undefined;
            maxTokens?: number | undefined;
            responseStyle?: "concise" | "detailed" | "technical" | "friendly" | undefined;
            enableContextMemory?: boolean | undefined;
            contextWindow?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        behavior: {
            requireConfirmation: boolean;
            confirmationTimeout: number;
            maxActionsPerSession: number;
            autoExecuteSimpleQueries: boolean;
            enableLearningMode: boolean;
            verboseLogging: boolean;
        };
        permissions: {
            canExecuteQueries: boolean;
            canModifyData: boolean;
            canCreateTables: boolean;
            canDropTables: boolean;
            canManageUsers: boolean;
            canAccessSystemStatus: boolean;
            canModifySettings: boolean;
            canReadFiles: boolean;
            canWriteFiles: boolean;
            canDeleteFiles: boolean;
            canConnectToOracle: boolean;
            canManageConnections: boolean;
            canRunStoredProcedures: boolean;
        };
        aiSettings: {
            model: "claude-sonnet-4" | "claude-haiku-3" | "local";
            temperature: number;
            maxTokens: number;
            responseStyle: "concise" | "detailed" | "technical" | "friendly";
            enableContextMemory: boolean;
            contextWindow: number;
        };
    }, {
        behavior: {
            requireConfirmation?: boolean | undefined;
            confirmationTimeout?: number | undefined;
            maxActionsPerSession?: number | undefined;
            autoExecuteSimpleQueries?: boolean | undefined;
            enableLearningMode?: boolean | undefined;
            verboseLogging?: boolean | undefined;
        };
        permissions: {
            canExecuteQueries?: boolean | undefined;
            canModifyData?: boolean | undefined;
            canCreateTables?: boolean | undefined;
            canDropTables?: boolean | undefined;
            canManageUsers?: boolean | undefined;
            canAccessSystemStatus?: boolean | undefined;
            canModifySettings?: boolean | undefined;
            canReadFiles?: boolean | undefined;
            canWriteFiles?: boolean | undefined;
            canDeleteFiles?: boolean | undefined;
            canConnectToOracle?: boolean | undefined;
            canManageConnections?: boolean | undefined;
            canRunStoredProcedures?: boolean | undefined;
        };
        aiSettings: {
            model?: "claude-sonnet-4" | "claude-haiku-3" | "local" | undefined;
            temperature?: number | undefined;
            maxTokens?: number | undefined;
            responseStyle?: "concise" | "detailed" | "technical" | "friendly" | undefined;
            enableContextMemory?: boolean | undefined;
            contextWindow?: number | undefined;
        };
    }>;
    zetaCore: z.ZodObject<{
        monitoring: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            alertLevel: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
            realTimeScanning: z.ZodDefault<z.ZodBoolean>;
            behaviorAnalysis: z.ZodDefault<z.ZodBoolean>;
            anomalyDetection: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            alertLevel: "high" | "medium" | "low" | "critical";
            realTimeScanning: boolean;
            behaviorAnalysis: boolean;
            anomalyDetection: boolean;
        }, {
            enabled?: boolean | undefined;
            alertLevel?: "high" | "medium" | "low" | "critical" | undefined;
            realTimeScanning?: boolean | undefined;
            behaviorAnalysis?: boolean | undefined;
            anomalyDetection?: boolean | undefined;
        }>;
        notifications: z.ZodObject<{
            email: z.ZodDefault<z.ZodBoolean>;
            desktop: z.ZodDefault<z.ZodBoolean>;
            sound: z.ZodDefault<z.ZodBoolean>;
            detailedReports: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            email: boolean;
            desktop: boolean;
            sound: boolean;
            detailedReports: boolean;
        }, {
            email?: boolean | undefined;
            desktop?: boolean | undefined;
            sound?: boolean | undefined;
            detailedReports?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        monitoring: {
            enabled: boolean;
            alertLevel: "high" | "medium" | "low" | "critical";
            realTimeScanning: boolean;
            behaviorAnalysis: boolean;
            anomalyDetection: boolean;
        };
        notifications: {
            email: boolean;
            desktop: boolean;
            sound: boolean;
            detailedReports: boolean;
        };
    }, {
        monitoring: {
            enabled?: boolean | undefined;
            alertLevel?: "high" | "medium" | "low" | "critical" | undefined;
            realTimeScanning?: boolean | undefined;
            behaviorAnalysis?: boolean | undefined;
            anomalyDetection?: boolean | undefined;
        };
        notifications: {
            email?: boolean | undefined;
            desktop?: boolean | undefined;
            sound?: boolean | undefined;
            detailedReports?: boolean | undefined;
        };
    }>;
    fantasmaFirewall: z.ZodObject<{
        protection: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            automaticScanning: z.ZodDefault<z.ZodBoolean>;
            scanInterval: z.ZodDefault<z.ZodNumber>;
            deepScan: z.ZodDefault<z.ZodBoolean>;
            quarantineThreats: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            automaticScanning: boolean;
            scanInterval: number;
            deepScan: boolean;
            quarantineThreats: boolean;
        }, {
            enabled?: boolean | undefined;
            automaticScanning?: boolean | undefined;
            scanInterval?: number | undefined;
            deepScan?: boolean | undefined;
            quarantineThreats?: boolean | undefined;
        }>;
        stealth: z.ZodObject<{
            behaviorCloaking: z.ZodDefault<z.ZodBoolean>;
            metadataVaulting: z.ZodDefault<z.ZodBoolean>;
            trafficObfuscation: z.ZodDefault<z.ZodBoolean>;
            ghostMode: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            behaviorCloaking: boolean;
            metadataVaulting: boolean;
            trafficObfuscation: boolean;
            ghostMode: boolean;
        }, {
            behaviorCloaking?: boolean | undefined;
            metadataVaulting?: boolean | undefined;
            trafficObfuscation?: boolean | undefined;
            ghostMode?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        protection: {
            enabled: boolean;
            automaticScanning: boolean;
            scanInterval: number;
            deepScan: boolean;
            quarantineThreats: boolean;
        };
        stealth: {
            behaviorCloaking: boolean;
            metadataVaulting: boolean;
            trafficObfuscation: boolean;
            ghostMode: boolean;
        };
    }, {
        protection: {
            enabled?: boolean | undefined;
            automaticScanning?: boolean | undefined;
            scanInterval?: number | undefined;
            deepScan?: boolean | undefined;
            quarantineThreats?: boolean | undefined;
        };
        stealth: {
            behaviorCloaking?: boolean | undefined;
            metadataVaulting?: boolean | undefined;
            trafficObfuscation?: boolean | undefined;
            ghostMode?: boolean | undefined;
        };
    }>;
    oracle: z.ZodObject<{
        connections: z.ZodObject<{
            maxConnections: z.ZodDefault<z.ZodNumber>;
            connectionTimeout: z.ZodDefault<z.ZodNumber>;
            autoReconnect: z.ZodDefault<z.ZodBoolean>;
            pooling: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            maxConnections: number;
            connectionTimeout: number;
            autoReconnect: boolean;
            pooling: boolean;
        }, {
            maxConnections?: number | undefined;
            connectionTimeout?: number | undefined;
            autoReconnect?: boolean | undefined;
            pooling?: boolean | undefined;
        }>;
        queryLimits: z.ZodObject<{
            maxExecutionTime: z.ZodDefault<z.ZodNumber>;
            maxResultRows: z.ZodDefault<z.ZodNumber>;
            allowDangerousOperations: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            maxExecutionTime: number;
            maxResultRows: number;
            allowDangerousOperations: boolean;
        }, {
            maxExecutionTime?: number | undefined;
            maxResultRows?: number | undefined;
            allowDangerousOperations?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        connections: {
            maxConnections: number;
            connectionTimeout: number;
            autoReconnect: boolean;
            pooling: boolean;
        };
        queryLimits: {
            maxExecutionTime: number;
            maxResultRows: number;
            allowDangerousOperations: boolean;
        };
    }, {
        connections: {
            maxConnections?: number | undefined;
            connectionTimeout?: number | undefined;
            autoReconnect?: boolean | undefined;
            pooling?: boolean | undefined;
        };
        queryLimits: {
            maxExecutionTime?: number | undefined;
            maxResultRows?: number | undefined;
            allowDangerousOperations?: boolean | undefined;
        };
    }>;
    audio: z.ZodObject<{
        voiceCommands: z.ZodDefault<z.ZodBoolean>;
        voiceId: z.ZodOptional<z.ZodString>;
        language: z.ZodDefault<z.ZodEnum<["en-US", "en-GB", "es-ES", "fr-FR", "de-DE"]>>;
        sensitivity: z.ZodDefault<z.ZodNumber>;
        wakeWord: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: "en-US" | "en-GB" | "es-ES" | "fr-FR" | "de-DE";
        voiceCommands: boolean;
        sensitivity: number;
        wakeWord: string;
        voiceId?: string | undefined;
    }, {
        voiceId?: string | undefined;
        language?: "en-US" | "en-GB" | "es-ES" | "fr-FR" | "de-DE" | undefined;
        voiceCommands?: boolean | undefined;
        sensitivity?: number | undefined;
        wakeWord?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    oracle: {
        connections: {
            maxConnections: number;
            connectionTimeout: number;
            autoReconnect: boolean;
            pooling: boolean;
        };
        queryLimits: {
            maxExecutionTime: number;
            maxResultRows: number;
            allowDangerousOperations: boolean;
        };
    };
    zedCore: {
        behavior: {
            requireConfirmation: boolean;
            confirmationTimeout: number;
            maxActionsPerSession: number;
            autoExecuteSimpleQueries: boolean;
            enableLearningMode: boolean;
            verboseLogging: boolean;
        };
        permissions: {
            canExecuteQueries: boolean;
            canModifyData: boolean;
            canCreateTables: boolean;
            canDropTables: boolean;
            canManageUsers: boolean;
            canAccessSystemStatus: boolean;
            canModifySettings: boolean;
            canReadFiles: boolean;
            canWriteFiles: boolean;
            canDeleteFiles: boolean;
            canConnectToOracle: boolean;
            canManageConnections: boolean;
            canRunStoredProcedures: boolean;
        };
        aiSettings: {
            model: "claude-sonnet-4" | "claude-haiku-3" | "local";
            temperature: number;
            maxTokens: number;
            responseStyle: "concise" | "detailed" | "technical" | "friendly";
            enableContextMemory: boolean;
            contextWindow: number;
        };
    };
    zetaCore: {
        monitoring: {
            enabled: boolean;
            alertLevel: "high" | "medium" | "low" | "critical";
            realTimeScanning: boolean;
            behaviorAnalysis: boolean;
            anomalyDetection: boolean;
        };
        notifications: {
            email: boolean;
            desktop: boolean;
            sound: boolean;
            detailedReports: boolean;
        };
    };
    fantasmaFirewall: {
        protection: {
            enabled: boolean;
            automaticScanning: boolean;
            scanInterval: number;
            deepScan: boolean;
            quarantineThreats: boolean;
        };
        stealth: {
            behaviorCloaking: boolean;
            metadataVaulting: boolean;
            trafficObfuscation: boolean;
            ghostMode: boolean;
        };
    };
    dashboard: {
        theme: "dark" | "light" | "auto";
        layout: "grid" | "list" | "compact";
        widgets: {
            id: string;
            type: string;
            config: Record<string, any>;
            enabled: boolean;
            position: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }[];
        autoRefresh: boolean;
        refreshInterval: number;
    };
    audio: {
        language: "en-US" | "en-GB" | "es-ES" | "fr-FR" | "de-DE";
        voiceCommands: boolean;
        sensitivity: number;
        wakeWord: string;
        voiceId?: string | undefined;
    };
}, {
    oracle: {
        connections: {
            maxConnections?: number | undefined;
            connectionTimeout?: number | undefined;
            autoReconnect?: boolean | undefined;
            pooling?: boolean | undefined;
        };
        queryLimits: {
            maxExecutionTime?: number | undefined;
            maxResultRows?: number | undefined;
            allowDangerousOperations?: boolean | undefined;
        };
    };
    zedCore: {
        behavior: {
            requireConfirmation?: boolean | undefined;
            confirmationTimeout?: number | undefined;
            maxActionsPerSession?: number | undefined;
            autoExecuteSimpleQueries?: boolean | undefined;
            enableLearningMode?: boolean | undefined;
            verboseLogging?: boolean | undefined;
        };
        permissions: {
            canExecuteQueries?: boolean | undefined;
            canModifyData?: boolean | undefined;
            canCreateTables?: boolean | undefined;
            canDropTables?: boolean | undefined;
            canManageUsers?: boolean | undefined;
            canAccessSystemStatus?: boolean | undefined;
            canModifySettings?: boolean | undefined;
            canReadFiles?: boolean | undefined;
            canWriteFiles?: boolean | undefined;
            canDeleteFiles?: boolean | undefined;
            canConnectToOracle?: boolean | undefined;
            canManageConnections?: boolean | undefined;
            canRunStoredProcedures?: boolean | undefined;
        };
        aiSettings: {
            model?: "claude-sonnet-4" | "claude-haiku-3" | "local" | undefined;
            temperature?: number | undefined;
            maxTokens?: number | undefined;
            responseStyle?: "concise" | "detailed" | "technical" | "friendly" | undefined;
            enableContextMemory?: boolean | undefined;
            contextWindow?: number | undefined;
        };
    };
    zetaCore: {
        monitoring: {
            enabled?: boolean | undefined;
            alertLevel?: "high" | "medium" | "low" | "critical" | undefined;
            realTimeScanning?: boolean | undefined;
            behaviorAnalysis?: boolean | undefined;
            anomalyDetection?: boolean | undefined;
        };
        notifications: {
            email?: boolean | undefined;
            desktop?: boolean | undefined;
            sound?: boolean | undefined;
            detailedReports?: boolean | undefined;
        };
    };
    fantasmaFirewall: {
        protection: {
            enabled?: boolean | undefined;
            automaticScanning?: boolean | undefined;
            scanInterval?: number | undefined;
            deepScan?: boolean | undefined;
            quarantineThreats?: boolean | undefined;
        };
        stealth: {
            behaviorCloaking?: boolean | undefined;
            metadataVaulting?: boolean | undefined;
            trafficObfuscation?: boolean | undefined;
            ghostMode?: boolean | undefined;
        };
    };
    dashboard: {
        theme?: "dark" | "light" | "auto" | undefined;
        layout?: "grid" | "list" | "compact" | undefined;
        widgets?: {
            id: string;
            type: string;
            config: Record<string, any>;
            enabled: boolean;
            position: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }[] | undefined;
        autoRefresh?: boolean | undefined;
        refreshInterval?: number | undefined;
    };
    audio: {
        voiceId?: string | undefined;
        language?: "en-US" | "en-GB" | "es-ES" | "fr-FR" | "de-DE" | undefined;
        voiceCommands?: boolean | undefined;
        sensitivity?: number | undefined;
        wakeWord?: string | undefined;
    };
}>;
export type UserConfig = z.infer<typeof userConfigSchema>;
export declare const defaultUserConfig: UserConfig;
export declare const processAuthorizationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodNumber;
    processType: z.ZodEnum<["query_execution", "data_modification", "table_creation", "user_management", "system_modification", "file_operation", "oracle_connection", "security_scan", "configuration_change"]>;
    description: z.ZodString;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    requestedAt: z.ZodDate;
    approvedAt: z.ZodOptional<z.ZodDate>;
    rejectedAt: z.ZodOptional<z.ZodDate>;
    approvedBy: z.ZodOptional<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["pending", "approved", "rejected", "executed", "failed"]>>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    autoApprove: z.ZodDefault<z.ZodBoolean>;
    timeoutMs: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: number;
    status: "pending" | "failed" | "approved" | "rejected" | "executed";
    description: string;
    processType: "query_execution" | "data_modification" | "table_creation" | "user_management" | "system_modification" | "file_operation" | "oracle_connection" | "security_scan" | "configuration_change";
    parameters: Record<string, any>;
    priority: "high" | "medium" | "low" | "critical";
    autoApprove: boolean;
    requestedAt: Date;
    timeoutMs: number;
    approvedAt?: Date | undefined;
    rejectedAt?: Date | undefined;
    approvedBy?: number | undefined;
}, {
    id: string;
    userId: number;
    description: string;
    processType: "query_execution" | "data_modification" | "table_creation" | "user_management" | "system_modification" | "file_operation" | "oracle_connection" | "security_scan" | "configuration_change";
    parameters: Record<string, any>;
    requestedAt: Date;
    status?: "pending" | "failed" | "approved" | "rejected" | "executed" | undefined;
    priority?: "high" | "medium" | "low" | "critical" | undefined;
    autoApprove?: boolean | undefined;
    approvedAt?: Date | undefined;
    rejectedAt?: Date | undefined;
    approvedBy?: number | undefined;
    timeoutMs?: number | undefined;
}>;
export type ProcessAuthorization = z.infer<typeof processAuthorizationSchema>;
