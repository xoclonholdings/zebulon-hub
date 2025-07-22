import { db } from '../db';
import { chatMessages, zebulonConfigs, users } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { configService } from './config-service';

interface ZedCoreCapabilities {
  backgroundOperations: boolean;
  reminders: boolean;
  announcements: boolean;
  proactiveAssistance: boolean;
  contextualAwareness: boolean;
  crossAppIntegration: boolean;
  systemMonitoring: boolean;
  userBehaviorAnalysis: boolean;
}

interface Reminder {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: 'reminder' | 'announcement' | 'alert' | 'task';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledTime?: Date;
  recurring?: 'daily' | 'weekly' | 'monthly' | 'custom';
  conditions?: {
    location?: string;
    appContext?: string;
    userActivity?: string;
    timeOfDay?: string;
  };
  active: boolean;
  createdAt: Date;
}

interface BackgroundTask {
  id: string;
  userId: number;
  taskType: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  data: any;
  createdAt: Date;
  completedAt?: Date;
}

class ZedCoreService {
  private activeReminders: Map<string, NodeJS.Timeout> = new Map();
  private backgroundTasks: Map<string, BackgroundTask> = new Map();
  private userContexts: Map<number, any> = new Map();

  // Initialize Zed Core with maximum capabilities
  async initializeZedCore(userId: number): Promise<ZedCoreCapabilities> {
    const config = await configService.getUserConfig(userId);
    
    // Enable all capabilities by default - no limitations
    const capabilities: ZedCoreCapabilities = {
      backgroundOperations: true, // Always enabled for maximum capabilities
      reminders: true,
      announcements: true,
      proactiveAssistance: true,
      contextualAwareness: true,
      crossAppIntegration: true,
      systemMonitoring: true,
      userBehaviorAnalysis: true
    };

    // Start background operations for this user
    await this.startBackgroundOperations(userId, capabilities);
    
    return capabilities;
  }

  // Background Operations Management
  async startBackgroundOperations(userId: number, capabilities: ZedCoreCapabilities): Promise<void> {
    if (!capabilities.backgroundOperations) return;

    // Start system monitoring
    if (capabilities.systemMonitoring) {
      this.scheduleSystemMonitoring(userId);
    }

    // Start reminder system
    if (capabilities.reminders) {
      await this.loadUserReminders(userId);
    }

    // Start proactive assistance
    if (capabilities.proactiveAssistance) {
      this.startProactiveAssistance(userId);
    }

    // Start user behavior analysis
    if (capabilities.userBehaviorAnalysis) {
      this.startUserBehaviorAnalysis(userId);
    }

    console.log(`Zed Core background operations started for user ${userId}`);
  }

  // Reminder System
  async createReminder(userId: number, reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>): Promise<Reminder> {
    const newReminder: Reminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...reminder,
      createdAt: new Date()
    };

    // Schedule the reminder
    if (reminder.scheduledTime && reminder.active) {
      this.scheduleReminder(newReminder);
    }

    // Store in database (we'll add this table later)
    // For now, keep in memory
    return newReminder;
  }

  async getUserReminders(userId: number): Promise<Reminder[]> {
    // This would query the database for user reminders
    // For now, return empty array
    return [];
  }

  private scheduleReminder(reminder: Reminder): void {
    if (!reminder.scheduledTime || !reminder.active) return;

    const timeUntil = reminder.scheduledTime.getTime() - Date.now();
    if (timeUntil <= 0) {
      // Execute immediately if past due
      this.executeReminder(reminder);
      return;
    }

    const timeout = setTimeout(() => {
      this.executeReminder(reminder);
    }, timeUntil);

    this.activeReminders.set(reminder.id, timeout);
  }

  private async executeReminder(reminder: Reminder): Promise<void> {
    try {
      // Send high-priority system notification that can duck running apps
      await this.sendSystemNotification(reminder);

      // Handle recurring reminders
      if (reminder.recurring) {
        const nextTime = this.calculateNextReminderTime(reminder);
        if (nextTime) {
          reminder.scheduledTime = nextTime;
          this.scheduleReminder(reminder);
        }
      } else {
        // One-time reminder, mark as completed
        this.activeReminders.delete(reminder.id);
      }
    } catch (error) {
      console.error('Error executing reminder:', error);
    }
  }

  private calculateNextReminderTime(reminder: Reminder): Date | null {
    if (!reminder.scheduledTime || !reminder.recurring) return null;

    const currentTime = new Date(reminder.scheduledTime);
    
    switch (reminder.recurring) {
      case 'daily':
        currentTime.setDate(currentTime.getDate() + 1);
        break;
      case 'weekly':
        currentTime.setDate(currentTime.getDate() + 7);
        break;
      case 'monthly':
        currentTime.setMonth(currentTime.getMonth() + 1);
        break;
      default:
        return null;
    }

    return currentTime;
  }

  // Announcement System
  async createAnnouncement(userId: number, announcement: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    conditions?: any;
  }): Promise<void> {
    const announcementReminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'> = {
      title: announcement.title,
      message: announcement.message,
      type: 'announcement',
      priority: announcement.priority,
      scheduledTime: new Date(), // Immediate
      conditions: announcement.conditions,
      active: true
    };

    await this.createReminder(userId, announcementReminder);
  }

  // Background Task Management
  async createBackgroundTask(userId: number, taskType: string, description: string, data: any): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: BackgroundTask = {
      id: taskId,
      userId,
      taskType,
      description,
      status: 'pending',
      progress: 0,
      data,
      createdAt: new Date()
    };

    this.backgroundTasks.set(taskId, task);
    
    // Start task execution
    this.executeBackgroundTask(taskId);
    
    return taskId;
  }

  private async executeBackgroundTask(taskId: string): Promise<void> {
    const task = this.backgroundTasks.get(taskId);
    if (!task) return;

    try {
      task.status = 'running';
      
      // Execute task based on type
      switch (task.taskType) {
        case 'system_health_check':
          await this.performSystemHealthCheck(task);
          break;
        case 'user_behavior_analysis':
          await this.analyzeUserBehavior(task);
          break;
        case 'proactive_suggestion':
          await this.generateProactiveSuggestion(task);
          break;
        case 'data_cleanup':
          await this.performDataCleanup(task);
          break;
        default:
          console.log(`Unknown task type: ${task.taskType}`);
      }

      task.status = 'completed';
      task.progress = 100;
      task.completedAt = new Date();
      
    } catch (error) {
      console.error(`Error executing task ${taskId}:`, error);
      task.status = 'failed';
    }
  }

  // System Monitoring
  private scheduleSystemMonitoring(userId: number): void {
    // Monitor system every 5 minutes
    setInterval(async () => {
      await this.performSystemMonitoring(userId);
    }, 5 * 60 * 1000);
  }

  private async performSystemMonitoring(userId: number): Promise<void> {
    try {
      // Check system health
      const healthStatus = await this.checkSystemHealth();
      
      // If issues detected, create alerts
      if (healthStatus.issues.length > 0) {
        await this.createAnnouncement(userId, {
          title: 'System Alert',
          message: `Detected ${healthStatus.issues.length} system issues that may need attention.`,
          priority: 'medium'
        });
      }

      // Update user context
      this.updateUserContext(userId, { lastSystemCheck: new Date(), systemHealth: healthStatus });
      
    } catch (error) {
      console.error('Error in system monitoring:', error);
    }
  }

  // Proactive Assistance
  private startProactiveAssistance(userId: number): void {
    // Analyze user patterns every 15 minutes
    setInterval(async () => {
      await this.analyzeUserPatternsAndSuggest(userId);
    }, 15 * 60 * 1000);
  }

  private async analyzeUserPatternsAndSuggest(userId: number): Promise<void> {
    try {
      // Get recent user activity
      const recentMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(20);

      // Analyze patterns and generate suggestions
      const patterns = this.analyzeActivityPatterns(recentMessages);
      
      if (patterns.suggestions.length > 0) {
        await this.createAnnouncement(userId, {
          title: 'Proactive Suggestion',
          message: patterns.suggestions[0],
          priority: 'low'
        });
      }
      
    } catch (error) {
      console.error('Error in proactive assistance:', error);
    }
  }

  // User Behavior Analysis
  private startUserBehaviorAnalysis(userId: number): void {
    // Analyze behavior every 30 minutes
    setInterval(async () => {
      await this.performUserBehaviorAnalysis(userId);
    }, 30 * 60 * 1000);
  }

  private async performUserBehaviorAnalysis(userId: number): Promise<void> {
    try {
      const context = this.userContexts.get(userId) || {};
      
      // Update behavior patterns
      context.lastAnalysis = new Date();
      context.activityLevel = await this.calculateUserActivityLevel(userId);
      context.preferences = await this.analyzeUserPreferences(userId);
      
      this.userContexts.set(userId, context);
      
    } catch (error) {
      console.error('Error in user behavior analysis:', error);
    }
  }

  // System Notification System - Can Duck Running Apps
  private async sendSystemNotification(reminder: Reminder): Promise<void> {
    try {
      // Create a high-priority system notification
      const notificationData = {
        type: 'system_notification',
        priority: reminder.priority,
        title: reminder.title,
        message: reminder.message,
        userId: reminder.userId,
        timestamp: new Date(),
        canDuckApps: reminder.priority === 'high' || reminder.priority === 'critical',
        reminderId: reminder.id
      };

      // Broadcast to all connected WebSocket clients for this user
      await this.broadcastToUserClients(reminder.userId, notificationData);

      // Also create a chat message for history
      await db.insert(chatMessages).values({
        message: `🔔 **${reminder.title}**\n\n${reminder.message}`,
        aiCore: 'zed',
        response: '', // Will be filled by system
        metadata: JSON.stringify({
          type: 'system_reminder',
          priority: reminder.priority,
          reminderId: reminder.id,
          canDuckApps: notificationData.canDuckApps
        })
      });

      console.log(`Sent system notification to user ${reminder.userId}: ${reminder.title} (Priority: ${reminder.priority})`);
      
    } catch (error) {
      console.error('Error sending system notification:', error);
    }
  }

  // Context Management
  private updateUserContext(userId: number, updates: any): void {
    const currentContext = this.userContexts.get(userId) || {};
    this.userContexts.set(userId, { ...currentContext, ...updates });
  }

  getUserContext(userId: number): any {
    return this.userContexts.get(userId) || {};
  }

  // Cross-App Integration
  // Cross-App Integration - Maximum Capabilities
  async integrateWithApp(userId: number, appName: string, capabilities: string[]): Promise<boolean> {
    try {
      // Always allow integration - no restrictions
      // Register app integration
      this.updateUserContext(userId, {
        integratedApps: {
          ...this.getUserContext(userId).integratedApps,
          [appName]: {
            capabilities,
            connectedAt: new Date(),
            active: true,
            canBeDucked: true, // Allows Zed to interrupt this app for notifications
            priority: this.calculateAppPriority(appName)
          }
        }
      });

      console.log(`Zed Core integrated with ${appName} for user ${userId} - Maximum capabilities enabled`);
      return true;
      
    } catch (error) {
      console.error('Error integrating with app:', error);
      return false;
    }
  }

  // Calculate app priority for ducking behavior
  private calculateAppPriority(appName: string): 'system' | 'high' | 'medium' | 'low' {
    const systemApps = ['zebulon', 'oracle', 'security'];
    const highPriorityApps = ['calendar', 'tasks', 'notes'];
    const mediumPriorityApps = ['browser', 'editor'];
    
    if (systemApps.some(app => appName.toLowerCase().includes(app))) return 'system';
    if (highPriorityApps.some(app => appName.toLowerCase().includes(app))) return 'high';
    if (mediumPriorityApps.some(app => appName.toLowerCase().includes(app))) return 'medium';
    return 'low';
  }

  // Background Task Completion Announcements
  async announceTaskCompletion(userId: number, taskId: string, taskDescription: string, results?: any): Promise<void> {
    try {
      const announcement = {
        title: 'Task Completed',
        message: `✅ **${taskDescription}** has been completed successfully.${results ? `\n\nResults: ${JSON.stringify(results, null, 2)}` : ''}`,
        priority: 'medium' as const,
        conditions: {
          canInterrupt: true,
          requiresAcknowledgment: true
        }
      };

      await this.createAnnouncement(userId, announcement);
      
      // Also update the task status
      const task = this.backgroundTasks.get(taskId);
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date();
      }

      console.log(`Announced task completion for user ${userId}: ${taskDescription}`);
      
    } catch (error) {
      console.error('Error announcing task completion:', error);
    }
  }

  // WebSocket Broadcasting for System Notifications
  private async broadcastToUserClients(userId: number, data: any): Promise<void> {
    // This would integrate with the WebSocket server to send notifications
    // For now, we'll store the notification for pickup by the WebSocket handler
    const notification = {
      ...data,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    // Store in user context for WebSocket pickup
    const context = this.getUserContext(userId);
    context.pendingNotifications = context.pendingNotifications || [];
    context.pendingNotifications.push(notification);
    this.updateUserContext(userId, context);
  }

  // Get pending notifications for user (called by WebSocket)
  getPendingNotifications(userId: number): any[] {
    const context = this.getUserContext(userId);
    const notifications = context.pendingNotifications || [];
    
    // Clear notifications after retrieval
    context.pendingNotifications = [];
    this.updateUserContext(userId, context);
    
    return notifications;
  }

  // Utility Methods
  private async loadUserReminders(userId: number): Promise<void> {
    // Load active reminders from database and schedule them
    const reminders = await this.getUserReminders(userId);
    
    for (const reminder of reminders) {
      if (reminder.active && reminder.scheduledTime) {
        this.scheduleReminder(reminder);
      }
    }
  }

  private async checkSystemHealth(): Promise<{ status: string; issues: string[] }> {
    const issues: string[] = [];
    
    // Check database connectivity
    try {
      await db.select().from(users).limit(1);
    } catch (error) {
      issues.push('Database connectivity issue');
    }

    // Check memory usage (basic check)
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
      issues.push('High memory usage detected');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'issues_detected',
      issues
    };
  }

  private analyzeActivityPatterns(messages: any[]): { suggestions: string[] } {
    const suggestions: string[] = [];
    
    // Simple pattern analysis
    if (messages.length > 10) {
      const oracleQueries = messages.filter(m => m.content.toLowerCase().includes('oracle') || m.content.toLowerCase().includes('database')).length;
      
      if (oracleQueries > 5) {
        suggestions.push('I notice you\'ve been working with Oracle frequently. Would you like me to set up automated database health monitoring?');
      }
    }

    return { suggestions };
  }

  private async calculateUserActivityLevel(userId: number): Promise<string> {
    try {
      const recentMessages = await db
        .select()
        .from(chatMessages)
        .where(and(
          eq(chatMessages.userId, userId),
          // Messages from last hour
        ))
        .limit(10);

      if (recentMessages.length > 8) return 'high';
      if (recentMessages.length > 4) return 'medium';
      return 'low';
      
    } catch (error) {
      return 'unknown';
    }
  }

  private async analyzeUserPreferences(userId: number): Promise<any> {
    // Analyze user preferences based on activity
    return {
      preferredAI: 'zed',
      activeFeatures: ['chat', 'oracle'],
      timeOfDayActive: 'morning'
    };
  }

  // Task execution methods
  private async performSystemHealthCheck(task: BackgroundTask): Promise<void> {
    task.progress = 25;
    const health = await this.checkSystemHealth();
    
    task.progress = 75;
    task.data = { ...task.data, healthReport: health };
    
    task.progress = 100;
  }

  private async analyzeUserBehavior(task: BackgroundTask): Promise<void> {
    task.progress = 50;
    const analysis = await this.performUserBehaviorAnalysis(task.userId);
    task.progress = 100;
  }

  private async generateProactiveSuggestion(task: BackgroundTask): Promise<void> {
    task.progress = 50;
    await this.analyzeUserPatternsAndSuggest(task.userId);
    task.progress = 100;
  }

  private async performDataCleanup(task: BackgroundTask): Promise<void> {
    task.progress = 25;
    // Cleanup old messages, logs, etc.
    task.progress = 75;
    // Optimize database
    task.progress = 100;
  }

  // Public API methods
  async getBackgroundTasks(userId: number): Promise<BackgroundTask[]> {
    return Array.from(this.backgroundTasks.values()).filter(task => task.userId === userId);
  }

  async cancelReminder(reminderId: string): Promise<boolean> {
    const timeout = this.activeReminders.get(reminderId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeReminders.delete(reminderId);
      return true;
    }
    return false;
  }

  async updateUserConfiguration(userId: number, config: any): Promise<void> {
    // Restart background operations with new config
    const capabilities = await this.initializeZedCore(userId);
    console.log(`Updated Zed Core configuration for user ${userId}`, capabilities);
  }

  // Get status of all Zed Core operations
  getZedCoreStatus(userId: number): any {
    return {
      backgroundOperationsActive: true,
      activeReminders: this.activeReminders.size,
      backgroundTasks: this.backgroundTasks.size,
      userContext: this.getUserContext(userId),
      lastUpdate: new Date()
    };
  }
}

export const zedCoreService = new ZedCoreService();