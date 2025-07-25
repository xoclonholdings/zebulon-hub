import type { User, ChatMessage, OracleQuery, SystemStatus, UserTask, UserNote, UserConfiguration, ProcessAuthorization, ZedMemoryEntry, ZedMemoryAssociation, ZedConversationContext, ZedLearningPattern, ZebulonConfig } from '@prisma/client';
export type { User, ChatMessage, OracleQuery, SystemStatus, UserTask, UserNote, UserConfiguration, ProcessAuthorization, ZedMemoryEntry, ZedMemoryAssociation, ZedConversationContext, ZedLearningPattern, ZebulonConfig };
export type InsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertChatMessage = Omit<ChatMessage, 'id' | 'createdAt'>;
export type InsertOracleQuery = Omit<OracleQuery, 'id' | 'createdAt'>;
export type InsertUserTask = Omit<UserTask, 'id' | 'createdAt'>;
export type InsertUserNote = Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertUserConfiguration = Omit<UserConfiguration, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertProcessAuthorization = Omit<ProcessAuthorization, 'id' | 'requestedAt'>;
export declare const defaultUserConfig: {
    zedCore: {
        enabled: boolean;
        responseDelay: number;
        contextMemory: number;
        autoApproval: boolean;
        learningMode: boolean;
        personality: string;
        voiceEnabled: boolean;
        adaptiveBehavior: boolean;
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
            canUseVoiceCommands: boolean;
        };
    };
    zetaCore: {
        enabled: boolean;
        securityLevel: string;
        autoBlock: boolean;
        threatDetection: boolean;
        auditLevel: string;
        alertThreshold: string;
        realTimeMonitoring: boolean;
        behaviorAnalysis: boolean;
    };
    fantasma: {
        enabled: boolean;
        stealthMode: boolean;
        scanInterval: number;
        deepScanEnabled: boolean;
        autoQuarantine: boolean;
        trafficObfuscation: boolean;
        logRetention: number;
        emergencyMode: boolean;
    };
};
