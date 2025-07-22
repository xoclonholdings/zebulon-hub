import React, { useEffect, useState } from 'react';
import { Bell, X, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SystemNotification {
  id: string;
  type: 'system_notification';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  canDuckApps: boolean;
  reminderId?: string;
  requiresAcknowledgment?: boolean;
  canInterrupt?: boolean;
}

interface ZedSystemNotificationsProps {
  userId: number;
  websocket?: WebSocket;
}

const ZedSystemNotifications: React.FC<ZedSystemNotificationsProps> = ({ userId, websocket }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isDucked, setIsDucked] = useState(false);

  useEffect(() => {
    if (!websocket) return;

    // Initialize Zed Core on component mount
    websocket.send(JSON.stringify({
      type: 'zed_core_init',
      userId
    }));

    // Register this app for Zed Core integration
    websocket.send(JSON.stringify({
      type: 'app_integration',
      userId,
      appName: 'zebulon-web',
      capabilities: ['notifications', 'ducking', 'background-tasks']
    }));

    // Listen for system notifications
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'system_notification') {
          handleSystemNotification(data);
        } else if (data.type === 'zed_core_initialized') {
          console.log('Zed Core initialized with capabilities:', data.capabilities);
        } else if (data.type === 'app_integrated') {
          console.log(`App integration: ${data.success ? 'successful' : 'failed'}`, data.message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.addEventListener('message', handleMessage);

    // Poll for pending notifications every 5 seconds
    const notificationPoll = setInterval(() => {
      websocket.send(JSON.stringify({
        type: 'get_notifications',
        userId
      }));
    }, 5000);

    return () => {
      websocket.removeEventListener('message', handleMessage);
      clearInterval(notificationPoll);
    };
  }, [websocket, userId]);

  const handleSystemNotification = (notification: SystemNotification) => {
    // Add to notifications list
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10

    // Handle app ducking for high/critical priority notifications
    if (notification.canDuckApps && (notification.priority === 'high' || notification.priority === 'critical')) {
      setIsDucked(true);
      
      // Play system sound (if browser allows)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAABACA=='); // System beep
        audio.play().catch(() => {}); // Ignore if blocked
      } catch (e) {}

      // Create full-screen overlay for critical notifications
      if (notification.priority === 'critical') {
        showCriticalOverlay(notification);
      }

      // Auto-unduck after 5 seconds for non-critical notifications
      if (notification.priority === 'high') {
        setTimeout(() => {
          setIsDucked(false);
        }, 5000);
      }
    }

    // Auto-remove non-critical notifications after 30 seconds
    if (notification.priority !== 'critical') {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 30000);
    }
  };

  const showCriticalOverlay = (notification: SystemNotification) => {
    // Create a modal-like overlay that blocks interaction until acknowledged
    const overlay = document.createElement('div');
    overlay.id = `critical-notification-${notification.id}`;
    overlay.className = 'fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center';
    overlay.innerHTML = `
      <div class="bg-red-900 border-2 border-red-500 rounded-lg p-8 max-w-md mx-4 text-white animate-pulse">
        <div class="flex items-center mb-4">
          <svg class="w-8 h-8 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <h3 class="text-xl font-bold">CRITICAL: ${notification.title}</h3>
        </div>
        <p class="text-gray-100 mb-6">${notification.message}</p>
        <button 
          onclick="document.getElementById('critical-notification-${notification.id}').remove(); window.zedSystemNotifications.acknowledgeCritical('${notification.id}')"
          class="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium"
        >
          ACKNOWLEDGE
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const acknowledgeCritical = (id: string) => {
    setIsDucked(false);
    dismissNotification(id);
  };

  // Expose acknowledgeCritical globally for critical overlay
  useEffect(() => {
    (window as any).zedSystemNotifications = { acknowledgeCritical };
    return () => {
      delete (window as any).zedSystemNotifications;
    };
  }, []);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'high': return <Bell className="h-5 w-5 text-orange-400" />;
      case 'medium': return <Info className="h-5 w-5 text-blue-400" />;
      default: return <CheckCircle className="h-5 w-5 text-green-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-900/20';
      case 'medium': return 'border-blue-500 bg-blue-900/20';
      default: return 'border-green-500 bg-green-900/20';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Ducking Indicator */}
      {isDucked && (
        <Card className="border-yellow-500 bg-yellow-900/20 animate-pulse">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-300 text-sm font-medium">
                Zed Core has your attention
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      {notifications.slice(0, 3).map((notification) => (
        <Card 
          key={notification.id} 
          className={`border ${getPriorityColor(notification.priority)} text-white animate-slide-in-right`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getPriorityIcon(notification.priority)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        notification.priority === 'critical' ? 'border-red-400 text-red-300' :
                        notification.priority === 'high' ? 'border-orange-400 text-orange-300' :
                        notification.priority === 'medium' ? 'border-blue-400 text-blue-300' :
                        'border-green-400 text-green-300'
                      }`}
                    >
                      {notification.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-300 mb-2 line-clamp-2">{notification.message}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(notification.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {notification.canDuckApps && (
              <div className="mt-2 text-xs text-yellow-300 bg-yellow-900/20 p-2 rounded">
                📢 This notification can interrupt running applications
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Overflow indicator */}
      {notifications.length > 3 && (
        <Card className="border-gray-500 bg-gray-900/20 text-white">
          <CardContent className="p-2 text-center">
            <span className="text-xs text-gray-400">
              +{notifications.length - 3} more notifications
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ZedSystemNotifications;