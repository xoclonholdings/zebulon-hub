import { db } from "../db";
import { 
  oracleConnections, 
  oracleSchemas, 
  oracleObjects, 
  oracleQueryHistory, 
  oracleSecurityAudits,
  oraclePerformanceMetrics,
  type OracleConnection,
  type InsertOracleConnection,
  type OracleQueryHistory,
  type OracleSecurityAudit
} from "@shared/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import crypto from "crypto";
import { ZetaCoreService } from "./zeta-core";

interface OracleConnectionConfig {
  host: string;
  port: number;
  serviceName: string;
  username: string;
  password: string;
}

interface QueryAnalysis {
  riskLevel: "low" | "medium" | "high" | "critical";
  securityFlags: string[];
  recommendations: string[];
  blocked: boolean;
  reason?: string;
}

export class OracleAdminService {
  private zetaCore: ZetaCoreService;
  private encryptionKey: string;

  constructor() {
    this.zetaCore = new ZetaCoreService();
    this.encryptionKey = process.env.ORACLE_ENCRYPTION_KEY || 'default-key-change-this';
  }

  // Connection Management
  async createConnection(userId: number, config: OracleConnectionConfig & { connectionName: string }): Promise<OracleConnection> {
    // Encrypt the password
    const encryptedPassword = this.encryptPassword(config.password);
    
    // Test connection first
    const testResult = await this.testConnection(config);
    
    const [connection] = await db.insert(oracleConnections).values({
      userId,
      connectionName: config.connectionName,
      host: config.host,
      port: config.port,
      serviceName: config.serviceName,
      username: config.username,
      encryptedPassword,
      lastTested: new Date(),
      testResult: testResult.success ? 'success' : 'failed',
    }).returning();

    if (testResult.success) {
      // Initialize schema discovery
      await this.discoverSchemas(connection.id);
    }

    return connection;
  }

  async testConnection(config: OracleConnectionConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulated Oracle connection test (replace with actual oracledb in production)
      const connectionString = `${config.username}/${config.password}@${config.host}:${config.port}/${config.serviceName}`;
      
      // Log security audit for connection attempt
      await this.logSecurityAudit({
        connectionId: 0, // Will be updated after connection creation
        auditType: 'login',
        userId: 0, // Will be provided by caller
        oracleUser: config.username,
        operation: 'TEST_CONNECTION',
        ipAddress: 'localhost', // Should get actual IP from request
        riskLevel: 'low',
      });

      // For demo purposes, always return success
      // In production, use actual Oracle connection library
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }

  // Schema and Object Discovery
  async discoverSchemas(connectionId: number): Promise<void> {
    try {
      // Simulated schema discovery (replace with actual Oracle queries)
      const mockSchemas = [
        { schemaName: 'HR', isSystem: false, objectCount: 15 },
        { schemaName: 'SALES', isSystem: false, objectCount: 32 },
        { schemaName: 'SYS', isSystem: true, objectCount: 2847 },
        { schemaName: 'SYSTEM', isSystem: true, objectCount: 1205 }
      ];

      for (const schema of mockSchemas) {
        const [dbSchema] = await db.insert(oracleSchemas).values({
          connectionId,
          schemaName: schema.schemaName,
          isSystem: schema.isSystem,
          objectCount: schema.objectCount,
          lastAnalyzed: new Date(),
        }).returning();

        // Discover objects in schema
        await this.discoverSchemaObjects(dbSchema.id, schema.schemaName);
      }
    } catch (error) {
      console.error('Schema discovery failed:', error);
    }
  }

  async discoverSchemaObjects(schemaId: number, schemaName: string): Promise<void> {
    // Simulated object discovery
    const mockObjects = [
      { name: 'EMPLOYEES', type: 'TABLE', status: 'VALID' },
      { name: 'DEPARTMENTS', type: 'TABLE', status: 'VALID' },
      { name: 'EMP_DETAILS_VIEW', type: 'VIEW', status: 'VALID' },
      { name: 'ADD_JOB_HISTORY', type: 'PROCEDURE', status: 'VALID' }
    ];

    for (const obj of mockObjects) {
      await db.insert(oracleObjects).values({
        schemaId,
        objectName: obj.name,
        objectType: obj.type,
        status: obj.status,
        created: new Date(),
        lastDdlTime: new Date(),
        metadata: { 
          schema: schemaName,
          description: `${obj.type} in ${schemaName} schema`
        }
      });
    }
  }

  // Query Execution with Zeta Core Security
  async executeQuery(
    userId: number, 
    connectionId: number, 
    queryText: string,
    options: { timeout?: number } = {}
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
    securityAnalysis: QueryAnalysis;
    executionTime: number;
  }> {
    const startTime = Date.now();
    
    // Step 1: Zeta Core security analysis
    const securityAnalysis = await this.analyzeQuerySecurity(queryText, userId, connectionId);
    
    // Log the query attempt
    const queryHash = crypto.createHash('sha256').update(queryText).digest('hex');
    
    if (securityAnalysis.blocked) {
      // Log blocked query
      await db.insert(oracleQueryHistory).values({
        userId,
        connectionId,
        queryText,
        queryHash,
        executionTime: (Date.now() - startTime) / 1000,
        status: 'error',
        errorMessage: securityAnalysis.reason || 'Blocked by Zeta Core security',
        zetaSecurityCheck: securityAnalysis,
        securityRisk: securityAnalysis.riskLevel,
      });

      await this.logSecurityAudit({
        connectionId,
        auditType: 'query',
        userId,
        oracleUser: 'zebulon_user', // Get from connection
        operation: 'BLOCKED_QUERY',
        riskLevel: securityAnalysis.riskLevel,
        blocked: true,
      });

      return {
        success: false,
        error: securityAnalysis.reason,
        securityAnalysis,
        executionTime: (Date.now() - startTime) / 1000
      };
    }

    try {
      // Step 2: Execute query (simulated for demo)
      const mockResults = await this.simulateQueryExecution(queryText);
      
      // Step 3: Log successful execution
      await db.insert(oracleQueryHistory).values({
        userId,
        connectionId,
        queryText,
        queryHash,
        executionTime: (Date.now() - startTime) / 1000,
        rowsAffected: mockResults.length,
        status: 'success',
        zetaSecurityCheck: securityAnalysis,
        securityRisk: securityAnalysis.riskLevel,
      });

      return {
        success: true,
        data: mockResults,
        securityAnalysis,
        executionTime: (Date.now() - startTime) / 1000
      };

    } catch (error) {
      // Log failed execution
      await db.insert(oracleQueryHistory).values({
        userId,
        connectionId,
        queryText,
        queryHash,
        executionTime: (Date.now() - startTime) / 1000,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        zetaSecurityCheck: securityAnalysis,
        securityRisk: securityAnalysis.riskLevel,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed',
        securityAnalysis,
        executionTime: (Date.now() - startTime) / 1000
      };
    }
  }

  // Zeta Core Security Analysis
  private async analyzeQuerySecurity(queryText: string, userId: number, connectionId: number): Promise<QueryAnalysis> {
    const analysis: QueryAnalysis = {
      riskLevel: 'low',
      securityFlags: [],
      recommendations: [],
      blocked: false
    };

    const upperQuery = queryText.toUpperCase().trim();

    // Check for high-risk operations
    if (upperQuery.includes('DROP TABLE') || upperQuery.includes('DROP DATABASE')) {
      analysis.riskLevel = 'critical';
      analysis.securityFlags.push('DDL_DROP_OPERATION');
      analysis.blocked = true;
      analysis.reason = 'DROP operations are blocked by Zeta Core security policy';
    }

    if (upperQuery.includes('DELETE') && !upperQuery.includes('WHERE')) {
      analysis.riskLevel = 'high';
      analysis.securityFlags.push('DELETE_WITHOUT_WHERE');
      analysis.recommendations.push('Add WHERE clause to DELETE statements');
    }

    if (upperQuery.includes('UPDATE') && !upperQuery.includes('WHERE')) {
      analysis.riskLevel = 'high';
      analysis.securityFlags.push('UPDATE_WITHOUT_WHERE');
      analysis.recommendations.push('Add WHERE clause to UPDATE statements');
    }

    // Check for system table access
    if (upperQuery.includes('SYS.') || upperQuery.includes('SYSTEM.')) {
      analysis.riskLevel = 'medium';
      analysis.securityFlags.push('SYSTEM_SCHEMA_ACCESS');
      analysis.recommendations.push('Review system schema access requirements');
    }

    // Check for suspicious patterns
    if (upperQuery.includes('UNION') && upperQuery.includes('SELECT')) {
      analysis.securityFlags.push('POTENTIAL_SQL_INJECTION');
      if (analysis.riskLevel === 'low') analysis.riskLevel = 'medium';
    }

    return analysis;
  }

  // Performance Monitoring
  async collectPerformanceMetrics(connectionId: number): Promise<void> {
    const metrics = [
      { type: 'cpu', value: Math.random() * 100, unit: 'percent' },
      { type: 'memory', value: Math.random() * 8192, unit: 'mb' },
      { type: 'sessions', value: Math.floor(Math.random() * 50), unit: 'count' },
      { type: 'locks', value: Math.floor(Math.random() * 10), unit: 'count' }
    ];

    for (const metric of metrics) {
      await db.insert(oraclePerformanceMetrics).values({
        connectionId,
        metricType: metric.type,
        value: metric.value,
        unit: metric.unit,
        threshold: metric.type === 'cpu' ? 80 : metric.type === 'memory' ? 6144 : 100,
        status: metric.value > (metric.type === 'cpu' ? 80 : metric.type === 'memory' ? 6144 : 100) ? 'warning' : 'normal',
      });
    }
  }

  // Security Audit Logging
  private async logSecurityAudit(audit: Omit<OracleSecurityAudit, 'id' | 'timestamp'>): Promise<void> {
    await db.insert(oracleSecurityAudits).values({
      ...audit,
      zetaResponse: {
        timestamp: new Date().toISOString(),
        analyzer: 'zeta-core-v1',
        confidence: 0.95
      }
    });
  }

  // Utility Functions
  private encryptPassword(password: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptPassword(encryptedPassword: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async simulateQueryExecution(queryText: string): Promise<any[]> {
    // Simulate different query results based on query type
    const upperQuery = queryText.toUpperCase().trim();
    
    if (upperQuery.startsWith('SELECT')) {
      return [
        { id: 1, name: 'John Doe', department: 'Engineering', salary: 75000 },
        { id: 2, name: 'Jane Smith', department: 'Marketing', salary: 68000 },
        { id: 3, name: 'Bob Johnson', department: 'Sales', salary: 72000 }
      ];
    }
    
    if (upperQuery.startsWith('INSERT') || upperQuery.startsWith('UPDATE') || upperQuery.startsWith('DELETE')) {
      return [{ rows_affected: Math.floor(Math.random() * 5) + 1 }];
    }

    return [];
  }

  // Admin Dashboard Data
  async getDashboardMetrics(userId: number): Promise<{
    totalConnections: number;
    activeConnections: number;
    todayQueries: number;
    securityAlerts: number;
    performanceAlerts: number;
    recentActivity: any[];
  }> {
    const userConnections = await db.select()
      .from(oracleConnections)
      .where(eq(oracleConnections.userId, userId));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayQueries = await db.select()
      .from(oracleQueryHistory)
      .where(and(
        eq(oracleQueryHistory.userId, userId),
        gte(oracleQueryHistory.executedAt, today)
      ));

    const securityAlerts = await db.select()
      .from(oracleSecurityAudits)
      .where(and(
        eq(oracleSecurityAudits.userId, userId),
        eq(oracleSecurityAudits.blocked, true)
      ));

    return {
      totalConnections: userConnections.length,
      activeConnections: userConnections.filter(c => c.isActive).length,
      todayQueries: todayQueries.length,
      securityAlerts: securityAlerts.length,
      performanceAlerts: 0, // Calculate from performance metrics
      recentActivity: todayQueries.slice(0, 10)
    };
  }
}

// Zeta Core Service for Security Analysis
class ZetaCoreService {
  async analyzeQuery(query: string): Promise<{
    riskLevel: string;
    flags: string[];
    blocked: boolean;
  }> {
    // Placeholder for Zeta Core integration
    // In production, this would connect to the actual Zeta Core AI
    return {
      riskLevel: 'low',
      flags: [],
      blocked: false
    };
  }
}

export const oracleAdminService = new OracleAdminService();