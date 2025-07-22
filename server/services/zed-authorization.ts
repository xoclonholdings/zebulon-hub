import { db } from "../db";
import { processAuthorizations, userConfigurations } from "@shared/schema";
import { eq, and, or, lt } from "drizzle-orm";
import { userConfigSchema, type UserConfig, defaultUserConfig } from "@shared/user-config";
import type { InsertProcessAuthorization, ProcessAuthorization } from "@shared/schema";

export class ZedAuthorizationService {
  // Get user configuration with fallback to defaults
  async getUserConfig(userId: number): Promise<UserConfig> {
    try {
      const [config] = await db
        .select()
        .from(userConfigurations)
        .where(eq(userConfigurations.userId, userId))
        .orderBy(userConfigurations.updatedAt)
        .limit(1);

      if (config?.configuration) {
        return userConfigSchema.parse(config.configuration);
      }
    } catch (error) {
      console.error("Error loading user config:", error);
    }
    
    return defaultUserConfig;
  }

  // Update user configuration
  async updateUserConfig(userId: number, config: Partial<UserConfig>): Promise<UserConfig> {
    const currentConfig = await this.getUserConfig(userId);
    const mergedConfig = this.deepMerge(currentConfig, config);
    
    // Validate the merged config
    const validatedConfig = userConfigSchema.parse(mergedConfig);
    
    // Check if user has existing config
    const existing = await db
      .select()
      .from(userConfigurations)
      .where(eq(userConfigurations.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userConfigurations)
        .set({
          configuration: validatedConfig,
          version: existing[0].version + 1,
          updatedAt: new Date()
        })
        .where(eq(userConfigurations.userId, userId));
    } else {
      await db
        .insert(userConfigurations)
        .values({
          userId,
          configuration: validatedConfig
        });
    }

    return validatedConfig;
  }

  // Check if Zed has permission to perform an action
  async checkPermission(userId: number, action: string): Promise<boolean> {
    const config = await this.getUserConfig(userId);
    const permissions = config.zedCore.permissions;

    switch (action) {
      case "execute_query":
        return permissions.canExecuteQueries;
      case "modify_data":
        return permissions.canModifyData;
      case "create_table":
        return permissions.canCreateTables;
      case "drop_table":
        return permissions.canDropTables;
      case "manage_users":
        return permissions.canManageUsers;
      case "access_system_status":
        return permissions.canAccessSystemStatus;
      case "modify_settings":
        return permissions.canModifySettings;
      case "read_files":
        return permissions.canReadFiles;
      case "write_files":
        return permissions.canWriteFiles;
      case "delete_files":
        return permissions.canDeleteFiles;
      case "connect_oracle":
        return permissions.canConnectToOracle;
      case "manage_connections":
        return permissions.canManageConnections;
      case "run_stored_procedures":
        return permissions.canRunStoredProcedures;
      default:
        return false;
    }
  }

  // Request authorization for a process
  async requestAuthorization(
    userId: number,
    processType: string,
    description: string,
    parameters: any,
    priority: "low" | "medium" | "high" | "critical" = "medium"
  ): Promise<ProcessAuthorization> {
    const config = await this.getUserConfig(userId);
    
    // Check if auto-approval is enabled for this type of process
    const autoApprove = this.shouldAutoApprove(config, processType, parameters);
    
    const authData: InsertProcessAuthorization = {
      userId,
      processType,
      description,
      parameters,
      priority,
      autoApprove,
      timeoutMs: config.zedCore.behavior.confirmationTimeout
    };

    const [authorization] = await db
      .insert(processAuthorizations)
      .values(authData)
      .returning();

    // If auto-approve, immediately approve
    if (autoApprove) {
      return await this.approveAuthorization(authorization.id, userId);
    }

    return authorization;
  }

  // Approve an authorization request
  async approveAuthorization(authId: number, approverId: number): Promise<ProcessAuthorization> {
    const [updated] = await db
      .update(processAuthorizations)
      .set({
        status: "approved",
        approvedAt: new Date(),
        approvedBy: approverId
      })
      .where(eq(processAuthorizations.id, authId))
      .returning();

    return updated;
  }

  // Reject an authorization request
  async rejectAuthorization(authId: number, approverId: number): Promise<ProcessAuthorization> {
    const [updated] = await db
      .update(processAuthorizations)
      .set({
        status: "rejected",
        rejectedAt: new Date(),
        approvedBy: approverId
      })
      .where(eq(processAuthorizations.id, authId))
      .returning();

    return updated;
  }

  // Get pending authorizations for a user
  async getPendingAuthorizations(userId: number): Promise<ProcessAuthorization[]> {
    return await db
      .select()
      .from(processAuthorizations)
      .where(
        and(
          eq(processAuthorizations.userId, userId),
          eq(processAuthorizations.status, "pending")
        )
      )
      .orderBy(processAuthorizations.requestedAt);
  }

  // Clean up expired authorizations
  async cleanupExpiredAuthorizations(): Promise<number> {
    const expiredTime = new Date(Date.now() - 300000); // 5 minutes ago
    
    const expired = await db
      .update(processAuthorizations)
      .set({ status: "failed", errorMessage: "Authorization timed out" })
      .where(
        and(
          eq(processAuthorizations.status, "pending"),
          lt(processAuthorizations.requestedAt, expiredTime)
        )
      )
      .returning();

    return expired.length;
  }

  // Execute an authorized process
  async executeAuthorization(authId: number): Promise<ProcessAuthorization> {
    const [auth] = await db
      .select()
      .from(processAuthorizations)
      .where(eq(processAuthorizations.id, authId))
      .limit(1);

    if (!auth) {
      throw new Error("Authorization not found");
    }

    if (auth.status !== "approved") {
      throw new Error("Authorization not approved");
    }

    // Mark as executed
    const [updated] = await db
      .update(processAuthorizations)
      .set({
        status: "executed",
        executedAt: new Date()
      })
      .where(eq(processAuthorizations.id, authId))
      .returning();

    return updated;
  }

  // Check if a process should be auto-approved
  private shouldAutoApprove(config: UserConfig, processType: string, parameters: any): boolean {
    const behavior = config.zedCore.behavior;
    
    if (!behavior.requireConfirmation) {
      return true;
    }

    // Auto-approve simple queries if enabled
    if (processType === "query_execution" && behavior.autoExecuteSimpleQueries) {
      return this.isSimpleQuery(parameters.query);
    }

    // Auto-approve read-only operations
    if (processType === "query_execution" && this.isReadOnlyQuery(parameters.query)) {
      return true;
    }

    return false;
  }

  // Check if a query is simple (SELECT without complex operations)
  private isSimpleQuery(query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    
    // Must be a SELECT statement
    if (!normalizedQuery.startsWith("select")) {
      return false;
    }

    // Should not contain complex operations
    const complexKeywords = [
      "union", "join", "subquery", "window", "recursive", "with",
      "case", "exists", "any", "all", "having"
    ];
    
    return !complexKeywords.some(keyword => normalizedQuery.includes(keyword));
  }

  // Check if a query is read-only
  private isReadOnlyQuery(query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    
    const readOnlyKeywords = ["select", "show", "describe", "explain"];
    const writeKeywords = ["insert", "update", "delete", "create", "drop", "alter", "truncate"];
    
    return (
      readOnlyKeywords.some(keyword => normalizedQuery.startsWith(keyword)) &&
      !writeKeywords.some(keyword => normalizedQuery.includes(keyword))
    );
  }

  // Deep merge two objects
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

export const zedAuthService = new ZedAuthorizationService();