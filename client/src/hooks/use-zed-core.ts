import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface ZedCoreReminder {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledTime?: Date;
  recurring?: boolean;
  active: boolean;
}

export interface ZedCoreBackgroundTask {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  createdAt: Date;
  completedAt?: Date;
  data?: any;
  result?: any;
}

export interface ZedCoreStatus {
  initialized: boolean;
  backgroundOperationsEnabled: boolean;
  activeTasksCount: number;
  pendingRemindersCount: number;
  integratedAppsCount: number;
  lastActivity: Date;
}

interface UseZedCoreReturn {
  // Status
  status: ZedCoreStatus | null;
  isLoading: boolean;
  
  // Reminders
  createReminder: (reminder: Partial<ZedCoreReminder>) => Promise<void>;
  
  // Background Tasks
  backgroundTasks: ZedCoreBackgroundTask[];
  createBackgroundTask: (type: string, description: string, data?: any) => Promise<string>;
  announceTaskCompletion: (taskId: string, description: string, results?: any) => Promise<void>;
  
  // Utilities
  refresh: () => Promise<void>;
}

export const useZedCore = (userId: number): UseZedCoreReturn => {
  const [status, setStatus] = useState<ZedCoreStatus | null>(null);
  const [backgroundTasks, setBackgroundTasks] = useState<ZedCoreBackgroundTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      // Get Zed Core status
      const statusResponse = await fetch(`/api/zed-core/status/${userId}`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData.status);
      }

      // Get background tasks
      const tasksResponse = await fetch(`/api/zed-core/background-tasks/${userId}`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setBackgroundTasks(tasksData.tasks || []);
      }
    } catch (error) {
      console.error('Error refreshing Zed Core data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createReminder = async (reminder: Partial<ZedCoreReminder>) => {
    try {
      const response = await apiRequest('/api/zed-core/reminder', 'POST', {
        userId,
        ...reminder
      });

      if (!response.success) {
        throw new Error('Failed to create reminder');
      }

      // Refresh data after creating reminder
      await refresh();
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  };

  const createBackgroundTask = async (type: string, description: string, data?: any): Promise<string> => {
    try {
      const response = await apiRequest('/api/zed-core/background-task', 'POST', {
        userId,
        taskType: type,
        description,
        data
      });

      if (!response.success) {
        throw new Error('Failed to create background task');
      }

      // Refresh data after creating task
      await refresh();
      
      return response.taskId;
    } catch (error) {
      console.error('Error creating background task:', error);
      throw error;
    }
  };

  const announceTaskCompletion = async (taskId: string, description: string, results?: any) => {
    try {
      const response = await apiRequest('/api/zed-core/announce-completion', 'POST', {
        userId,
        taskId,
        taskDescription: description,
        results
      });

      if (!response.success) {
        throw new Error('Failed to announce task completion');
      }

      // Refresh data after announcing completion
      await refresh();
    } catch (error) {
      console.error('Error announcing task completion:', error);
      throw error;
    }
  };

  // Initialize and refresh data on mount
  useEffect(() => {
    refresh();
  }, [userId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return {
    status,
    isLoading,
    backgroundTasks,
    createReminder,
    createBackgroundTask,
    announceTaskCompletion,
    refresh
  };
};