import { storage } from "../storage";

export interface UserPermissions {
  canAccessOracle: boolean;
  canModifyFiles: boolean;
  canUseVoiceCommands: boolean;
  canAccessCalendar: boolean;
  canAccessNotes: boolean;
  canAccessPhotos: boolean;
  canAccessMusic: boolean;
  canTriggerUpdates: boolean;
  canViewSystemStatus: boolean;
  canRequestAuthorization: boolean;
  autonomousOperations: boolean;
  maxFileSize: number; // in MB
  maxStorageQuota: number; // in MB
}

export interface AdminUser {
  id: number;
  username: string;
  role: 'admin' | 'user' | 'restricted' | 'suspended';
  permissions: UserPermissions;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  notes?: string;
}

export interface SystemSettings {
  allowAutonomousOperations: boolean;
  requireAdminApprovalForUpdates: boolean;
  allowSelfUpdates: boolean;
  maxConcurrentUsers: number;
  sessionTimeout: number; // in minutes
  securityLevel: 'low' | 'medium' | 'high' | 'maximum';
  auditLogging: boolean;
  defaultUserPermissions: UserPermissions;
}

export class AdminControlService {
  private adminUsers: Map<number, AdminUser> = new Map();
  private systemSettings: SystemSettings;
  private auditLog: Array<{
    timestamp: Date;
    adminId: number;
    action: string;
    details: any;
  }> = [];

  constructor() {
    this.systemSettings = {
      allowAutonomousOperations: false,
      requireAdminApprovalForUpdates: true,
      allowSelfUpdates: false,
      maxConcurrentUsers: 10,
      sessionTimeout: 60,
      securityLevel: 'high',
      auditLogging: true,
      defaultUserPermissions: {
        canAccessOracle: false,
        canModifyFiles: false,
        canUseVoiceCommands: true,
        canAccessCalendar: true,
        canAccessNotes: true,
        canAccessPhotos: true,
        canAccessMusic: true,
        canTriggerUpdates: false,
        canViewSystemStatus: false,
        canRequestAuthorization: true,
        autonomousOperations: false,
        maxFileSize: 10,
        maxStorageQuota: 100
      }
    };
    this.initializeDefaultAdmin();
  }

  private initializeDefaultAdmin() {
    const defaultAdmin: AdminUser = {
      id: 1,
      username: 'admin',
      role: 'admin',
      permissions: {
        canAccessOracle: true,
        canModifyFiles: true,
        canUseVoiceCommands: true,
        canAccessCalendar: true,
        canAccessNotes: true,
        canAccessPhotos: true,
        canAccessMusic: true,
        canTriggerUpdates: true,
        canViewSystemStatus: true,
        canRequestAuthorization: true,
        autonomousOperations: true,
        maxFileSize: 1000,
        maxStorageQuota: 10000
      },
      createdAt: new Date(),
      isActive: true,
      notes: 'Default administrator account'
    };
    this.adminUsers.set(1, defaultAdmin);
  }

  // Admin authentication
  async authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
    // In production, this would use proper password hashing
    if (username === 'admin' && password === 'zebulon2025') {
      const admin = this.adminUsers.get(1);
      if (admin) {
        admin.lastLogin = new Date();
        this.logAction(1, 'login', { username });
        return admin;
      }
    }
    return null;
  }

  // User management
  async createUser(adminId: number, userData: {
    username: string;
    role: 'user' | 'restricted';
    permissions?: Partial<UserPermissions>;
    notes?: string;
  }): Promise<AdminUser> {
    this.requireAdminPermission(adminId);
    
    const newUserId = Math.max(...Array.from(this.adminUsers.keys())) + 1;
    const newUser: AdminUser = {
      id: newUserId,
      username: userData.username,
      role: userData.role,
      permissions: {
        ...this.systemSettings.defaultUserPermissions,
        ...userData.permissions
      },
      createdAt: new Date(),
      isActive: true,
      notes: userData.notes
    };

    this.adminUsers.set(newUserId, newUser);
    this.logAction(adminId, 'create_user', { newUserId, username: userData.username, role: userData.role });
    
    return newUser;
  }

  async updateUserPermissions(adminId: number, userId: number, permissions: Partial<UserPermissions>): Promise<AdminUser> {
    this.requireAdminPermission(adminId);
    
    const user = this.adminUsers.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.permissions = { ...user.permissions, ...permissions };
    this.adminUsers.set(userId, user);
    this.logAction(adminId, 'update_permissions', { userId, permissions });
    
    return user;
  }

  async suspendUser(adminId: number, userId: number, reason?: string): Promise<void> {
    this.requireAdminPermission(adminId);
    
    const user = this.adminUsers.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.role = 'suspended';
    user.isActive = false;
    if (reason) {
      user.notes = (user.notes || '') + `\nSuspended: ${reason}`;
    }
    
    this.logAction(adminId, 'suspend_user', { userId, reason });
  }

  async deleteUser(adminId: number, userId: number): Promise<void> {
    this.requireAdminPermission(adminId);
    
    if (userId === 1) {
      throw new Error('Cannot delete default admin');
    }

    this.adminUsers.delete(userId);
    this.logAction(adminId, 'delete_user', { userId });
  }

  // System settings management
  async updateSystemSettings(adminId: number, settings: Partial<SystemSettings>): Promise<SystemSettings> {
    this.requireAdminPermission(adminId);
    
    this.systemSettings = { ...this.systemSettings, ...settings };
    this.logAction(adminId, 'update_system_settings', settings);
    
    return this.systemSettings;
  }

  // Permission checking
  checkPermission(userId: number, permission: keyof UserPermissions): boolean {
    const user = this.adminUsers.get(userId);
    if (!user || !user.isActive || user.role === 'suspended') {
      return false;
    }
    
    return user.permissions[permission] as boolean;
  }

  checkAutonomousOperationPermission(userId: number): boolean {
    if (!this.systemSettings.allowAutonomousOperations) {
      return false;
    }
    
    const user = this.adminUsers.get(userId);
    return user?.permissions.autonomousOperations || false;
  }

  // File operation permissions
  checkFileOperationPermission(userId: number, fileSize: number): { allowed: boolean; reason?: string } {
    const user = this.adminUsers.get(userId);
    if (!user || !user.isActive) {
      return { allowed: false, reason: 'User not found or inactive' };
    }

    if (!user.permissions.canModifyFiles) {
      return { allowed: false, reason: 'File modification not permitted' };
    }

    if (fileSize > user.permissions.maxFileSize * 1024 * 1024) {
      return { allowed: false, reason: `File size exceeds limit of ${user.permissions.maxFileSize}MB` };
    }

    return { allowed: true };
  }

  // System operation permissions
  checkSystemOperationPermission(userId: number, operation: string): boolean {
    const user = this.adminUsers.get(userId);
    if (!user || !user.isActive || user.role === 'suspended') {
      return false;
    }

    switch (operation) {
      case 'update_system':
        return user.permissions.canTriggerUpdates;
      case 'view_system_status':
        return user.permissions.canViewSystemStatus;
      case 'oracle_access':
        return user.permissions.canAccessOracle;
      case 'voice_commands':
        return user.permissions.canUseVoiceCommands;
      default:
        return false;
    }
  }

  // Admin utilities
  async getAllUsers(adminId: number): Promise<AdminUser[]> {
    this.requireAdminPermission(adminId);
    return Array.from(this.adminUsers.values());
  }

  async getSystemSettings(adminId: number): Promise<SystemSettings> {
    this.requireAdminPermission(adminId);
    return this.systemSettings;
  }

  async getAuditLog(adminId: number): Promise<typeof this.auditLog> {
    this.requireAdminPermission(adminId);
    return this.auditLog;
  }

  // Emergency controls
  async emergencyShutdown(adminId: number, reason: string): Promise<void> {
    this.requireAdminPermission(adminId);
    
    // Disable all autonomous operations
    this.systemSettings.allowAutonomousOperations = false;
    this.systemSettings.allowSelfUpdates = false;
    
    // Suspend all non-admin users
    for (const [userId, user] of Array.from(this.adminUsers.entries())) {
      if (user.role !== 'admin') {
        user.isActive = false;
      }
    }
    
    this.logAction(adminId, 'emergency_shutdown', { reason });
  }

  async enableMaximumSecurity(adminId: number): Promise<void> {
    this.requireAdminPermission(adminId);
    
    this.systemSettings.securityLevel = 'maximum';
    this.systemSettings.allowAutonomousOperations = false;
    this.systemSettings.requireAdminApprovalForUpdates = true;
    this.systemSettings.sessionTimeout = 15;
    
    this.logAction(adminId, 'enable_maximum_security', {});
  }

  private requireAdminPermission(userId: number): void {
    const user = this.adminUsers.get(userId);
    if (!user || user.role !== 'admin' || !user.isActive) {
      throw new Error('Admin permission required');
    }
  }

  private logAction(adminId: number, action: string, details: any): void {
    if (this.systemSettings.auditLogging) {
      this.auditLog.push({
        timestamp: new Date(),
        adminId,
        action,
        details
      });
      
      // Keep only last 1000 entries
      if (this.auditLog.length > 1000) {
        this.auditLog = this.auditLog.slice(-1000);
      }
    }
  }

  // Get user info (for current user context)
  getUser(userId: number): AdminUser | undefined {
    return this.adminUsers.get(userId);
  }
}

export const adminControlService = new AdminControlService();