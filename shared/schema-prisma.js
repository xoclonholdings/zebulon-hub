"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultUserConfig = void 0;
// Default configurations
exports.defaultUserConfig = {
    zedCore: {
        enabled: true,
        responseDelay: 500,
        contextMemory: 100,
        autoApproval: false,
        learningMode: true,
        personality: "balanced",
        voiceEnabled: false,
        adaptiveBehavior: false,
        permissions: {
            canExecuteQueries: true,
            canModifyData: false,
            canCreateTables: false,
            canDropTables: false,
            canManageUsers: false,
            canAccessSystemStatus: true,
            canModifySettings: false,
            canReadFiles: true,
            canWriteFiles: false,
            canDeleteFiles: false,
            canConnectToOracle: true,
            canManageConnections: false,
            canRunStoredProcedures: false,
            canUseVoiceCommands: true
        }
    },
    zetaCore: {
        enabled: true,
        securityLevel: "high",
        autoBlock: true,
        threatDetection: true,
        auditLevel: "standard",
        alertThreshold: "medium",
        realTimeMonitoring: true,
        behaviorAnalysis: true
    },
    fantasma: {
        enabled: true,
        stealthMode: false,
        scanInterval: 60,
        deepScanEnabled: false,
        autoQuarantine: false,
        trafficObfuscation: false,
        logRetention: 30,
        emergencyMode: false
    }
};
//# sourceMappingURL=schema-prisma.js.map