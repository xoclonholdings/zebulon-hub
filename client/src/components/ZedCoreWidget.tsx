import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Bell,
  Activity,
  Plus,
  Loader2
} from 'lucide-react';
import { useZedCore, ZedCoreBackgroundTask } from '@/hooks/use-zed-core';

interface ZedCoreWidgetProps {
  userId: number;
}

const ZedCoreWidget: React.FC<ZedCoreWidgetProps> = ({ userId }) => {
  const { 
    status, 
    isLoading, 
    backgroundTasks, 
    createReminder, 
    createBackgroundTask, 
    announceTaskCompletion 
  } = useZedCore(userId);

  const [reminderForm, setReminderForm] = useState({
    title: '',
    message: '',
    scheduledTime: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });

  const [taskForm, setTaskForm] = useState({
    type: '',
    description: '',
    data: ''
  });

  const [activeTab, setActiveTab] = useState<'status' | 'reminders' | 'tasks'>('status');

  const handleCreateReminder = async () => {
    try {
      await createReminder({
        title: reminderForm.title,
        message: reminderForm.message,
        priority: reminderForm.priority,
        scheduledTime: reminderForm.scheduledTime ? new Date(reminderForm.scheduledTime) : undefined,
        active: true
      });

      // Reset form
      setReminderForm({
        title: '',
        message: '',
        scheduledTime: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to create reminder:', error);
    }
  };

  const handleCreateBackgroundTask = async () => {
    try {
      const taskId = await createBackgroundTask(
        taskForm.type,
        taskForm.description,
        taskForm.data ? JSON.parse(taskForm.data) : undefined
      );

      // Simulate task completion after 10 seconds for demo
      setTimeout(async () => {
        await announceTaskCompletion(taskId, taskForm.description, {
          completed: true,
          timestamp: new Date(),
          processingTime: '10 seconds'
        });
      }, 10000);

      // Reset form
      setTaskForm({
        type: '',
        description: '',
        data: ''
      });
    } catch (error) {
      console.error('Failed to create background task:', error);
    }
  };

  const getTaskStatusIcon = (task: ZedCoreBackgroundTask) => {
    switch (task.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/20 text-green-300 border-green-500';
      case 'running': return 'bg-blue-900/20 text-blue-300 border-blue-500';
      case 'failed': return 'bg-red-900/20 text-red-300 border-red-500';
      default: return 'bg-yellow-900/20 text-yellow-300 border-yellow-500';
    }
  };

  return (
    <Card className="bg-black border-white border-opacity-10 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg">Zed Core Control</CardTitle>
          </div>
          {status && (
            <Badge 
              variant="outline" 
              className={status.initialized ? 'border-green-400 text-green-300' : 'border-red-400 text-red-300'}
            >
              {status.initialized ? 'ACTIVE' : 'INITIALIZING'}
            </Badge>
          )}
        </div>
        <CardDescription className="text-gray-400">
          Background operations and cross-app integration
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4">
          <Button
            variant={activeTab === 'status' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('status')}
            className="text-xs"
          >
            <Activity className="h-3 w-3 mr-1" />
            Status
          </Button>
          <Button
            variant={activeTab === 'reminders' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('reminders')}
            className="text-xs"
          >
            <Bell className="h-3 w-3 mr-1" />
            Reminders
          </Button>
          <Button
            variant={activeTab === 'tasks' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('tasks')}
            className="text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Tasks
          </Button>
        </div>

        <ScrollArea className="h-64">
          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-3">
              {status ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white bg-opacity-5 p-2 rounded">
                      <div className="text-gray-400">Background Ops</div>
                      <div className={status.backgroundOperationsEnabled ? 'text-green-400' : 'text-red-400'}>
                        {status.backgroundOperationsEnabled ? 'ENABLED' : 'DISABLED'}
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-5 p-2 rounded">
                      <div className="text-gray-400">Active Tasks</div>
                      <div className="text-white">{status.activeTasksCount}</div>
                    </div>
                    <div className="bg-white bg-opacity-5 p-2 rounded">
                      <div className="text-gray-400">Reminders</div>
                      <div className="text-white">{status.pendingRemindersCount}</div>
                    </div>
                    <div className="bg-white bg-opacity-5 p-2 rounded">
                      <div className="text-gray-400">Integrated Apps</div>
                      <div className="text-white">{status.integratedAppsCount}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Last Activity: {new Date(status.lastActivity).toLocaleTimeString()}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  {isLoading ? 'Loading Zed Core status...' : 'Zed Core not initialized'}
                </div>
              )}
            </div>
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="space-y-3">
              <div className="bg-white bg-opacity-5 p-3 rounded">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Reminder
                </h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Reminder title"
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white bg-opacity-10 border-white border-opacity-20 text-white text-xs"
                  />
                  <Input
                    placeholder="Message"
                    value={reminderForm.message}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, message: e.target.value }))}
                    className="bg-white bg-opacity-10 border-white border-opacity-20 text-white text-xs"
                  />
                  <div className="flex space-x-2">
                    <Input
                      type="datetime-local"
                      value={reminderForm.scheduledTime}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="bg-white bg-opacity-10 border-white border-opacity-20 text-white text-xs flex-1"
                    />
                    <Select value={reminderForm.priority} onValueChange={(value: any) => setReminderForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="bg-white bg-opacity-10 border-white border-opacity-20 text-white text-xs w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCreateReminder}
                    disabled={!reminderForm.title || !reminderForm.message}
                    className="w-full"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule Reminder
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                💡 High/Critical reminders can duck running applications for your attention
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="bg-white bg-opacity-5 p-3 rounded">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Background Task
                </h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Task type (e.g., report, analysis, backup)"
                    value={taskForm.type}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, type: e.target.value }))}
                    className="bg-white bg-opacity-10 border-white border-opacity-20 text-white text-xs"
                  />
                  <Input
                    placeholder="Task description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white bg-opacity-10 border-white border-opacity-20 text-white text-xs"
                  />
                  <Input
                    placeholder="Task data (JSON format - optional)"
                    value={taskForm.data}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, data: e.target.value }))}
                    className="bg-white bg-opacity-10 border-white border-opacity-20 text-white text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateBackgroundTask}
                    disabled={!taskForm.type || !taskForm.description}
                    className="w-full"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start Background Task
                  </Button>
                </div>
              </div>

              {/* Active Tasks */}
              {backgroundTasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Background Tasks</h4>
                  <div className="space-y-2">
                    {backgroundTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="bg-white bg-opacity-5 p-2 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            {getTaskStatusIcon(task)}
                            <span className="text-xs font-medium truncate">{task.description}</span>
                          </div>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">
                          Type: {task.type} • {new Date(task.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400">
                🎯 Zed will announce when background tasks complete, even while you're using other apps
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ZedCoreWidget;