import { eq } from 'drizzle-orm';
import { db } from '../db';
import { zebulonConfigs, type ZebulonConfig, type InsertZebulonConfig } from '@shared/schema';

export interface ParsedZebulonConfig {
  id: number;
  userId: number;
  
  // Parsed theme settings
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    opacity: number;
    glowIntensity: number;
    animationSpeed: string;
    logoSize: number;
  };
  
  // Parsed core system settings
  zedCore: {
    enabled: boolean;
    responseDelay: number;
    contextMemory: number;
    autoApproval: boolean;
    learningMode: boolean;
    personality: string;
    voiceEnabled: boolean;
    adaptiveBehavior: boolean;
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
  
  fantasmaFirewall: {
    enabled: boolean;
    stealthMode: boolean;
    scanInterval: number;
    deepScanEnabled: boolean;
    autoQuarantine: boolean;
    trafficObfuscation: boolean;
    logRetention: number;
    emergencyMode: boolean;
  };
  
  // Parsed interface settings
  interface: {
    layout: string;
    widgetSize: string;
    chatPosition: string;
    enableVoice: boolean;
    enableGestures: boolean;
    autoHide: boolean;
    compactMode: boolean;
    multiMonitor: boolean;
  };
  
  // Parsed Oracle settings
  oracle: {
    defaultTimeout: number;
    maxConnections: number;
    autoCommit: boolean;
    queryLogging: boolean;
    performanceMode: string;
    compressionEnabled: boolean;
    encryptionLevel: string;
  };
  
  // Parsed behavioral settings
  behavior: {
    contextAwareness: number;
    adaptivePersonality: boolean;
    learningFromInteractions: boolean;
    proactiveAssistance: boolean;
    emotionalIntelligence: boolean;
    customRoutines: string[];
    workflowAutomation: boolean;
  };
  
  // Parsed security settings
  security: {
    biometricAuth: boolean;
    sessionTimeout: number;
    dataEncryption: string;
    auditTrail: boolean;
    anonymousMode: boolean;
    secureDelete: boolean;
    vpnIntegration: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

class ConfigService {
  async getUserConfig(userId: number): Promise<ParsedZebulonConfig | null> {
    const [config] = await db
      .select()
      .from(zebulonConfigs)
      .where(eq(zebulonConfigs.userId, userId));

    if (!config) {
      // Create default config if none exists
      const defaultConfig = await this.createDefaultConfig(userId);
      return this.parseConfig(defaultConfig);
    }

    return this.parseConfig(config);
  }

  async createDefaultConfig(userId: number): Promise<ZebulonConfig> {
    const [config] = await db
      .insert(zebulonConfigs)
      .values({ userId })
      .returning();

    return config;
  }

  async updateUserConfig(userId: number, updates: Partial<ParsedZebulonConfig>): Promise<ParsedZebulonConfig> {
    const currentConfig = await this.getUserConfig(userId);
    if (!currentConfig) {
      throw new Error('Configuration not found');
    }

    // Prepare updates by stringifying JSON sections
    const updateData: Partial<ZebulonConfig> = {
      updatedAt: new Date(),
    };

    if (updates.theme) {
      updateData.themeSettings = JSON.stringify(updates.theme);
    }
    
    if (updates.zedCore) {
      updateData.zedCoreSettings = JSON.stringify(updates.zedCore);
    }
    
    if (updates.zetaCore) {
      updateData.zetaCoreSettings = JSON.stringify(updates.zetaCore);
    }
    
    if (updates.fantasmaFirewall) {
      updateData.fantasmaSettings = JSON.stringify(updates.fantasmaFirewall);
    }
    
    if (updates.interface) {
      updateData.interfaceSettings = JSON.stringify(updates.interface);
    }
    
    if (updates.oracle) {
      updateData.oracleSettings = JSON.stringify(updates.oracle);
    }
    
    if (updates.behavior) {
      updateData.behaviorSettings = JSON.stringify(updates.behavior);
    }
    
    if (updates.security) {
      updateData.securitySettings = JSON.stringify(updates.security);
    }

    const [updatedConfig] = await db
      .update(zebulonConfigs)
      .set(updateData)
      .where(eq(zebulonConfigs.userId, userId))
      .returning();

    return this.parseConfig(updatedConfig);
  }

  async resetUserConfig(userId: number): Promise<ParsedZebulonConfig> {
    // Delete existing config
    await db.delete(zebulonConfigs).where(eq(zebulonConfigs.userId, userId));
    
    // Create new default config
    const defaultConfig = await this.createDefaultConfig(userId);
    return this.parseConfig(defaultConfig);
  }

  async exportUserConfig(userId: number): Promise<ParsedZebulonConfig | null> {
    return await this.getUserConfig(userId);
  }

  async importUserConfig(userId: number, configData: Partial<ParsedZebulonConfig>): Promise<ParsedZebulonConfig> {
    return await this.updateUserConfig(userId, configData);
  }

  private parseConfig(config: ZebulonConfig): ParsedZebulonConfig {
    try {
      return {
        id: config.id,
        userId: config.userId,
        theme: JSON.parse(config.themeSettings || '{}'),
        zedCore: JSON.parse(config.zedCoreSettings || '{}'),
        zetaCore: JSON.parse(config.zetaCoreSettings || '{}'),
        fantasmaFirewall: JSON.parse(config.fantasmaSettings || '{}'),
        interface: JSON.parse(config.interfaceSettings || '{}'),
        oracle: JSON.parse(config.oracleSettings || '{}'),
        behavior: JSON.parse(config.behaviorSettings || '{}'),
        security: JSON.parse(config.securitySettings || '{}'),
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    } catch (error) {
      console.error('Error parsing config:', error);
      throw new Error('Invalid configuration data');
    }
  }
}

export const configService = new ConfigService();