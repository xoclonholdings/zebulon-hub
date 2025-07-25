import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Send, Activity, LogOut, Settings, MessageCircle, Shield, Music, Database, Lock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import zebulonLogoPath from '@assets/Zed-ai-logo_1753441894358.png';

interface ChatMessage {
  id: number;
  message: string;
  aiCore: string;
  createdAt: string;
  userId: number;
}

interface SystemStatus {
  oracleCore?: {
    active: boolean;
    memory: number;
    queries: number;
    uptime: string;
    lastActivity: string;
    databaseConnections: number;
    responseTime: string;
  };
  zedCore?: {
    active: boolean;
    memory: number;
    tasks: number;
  };
}

const ZebulonSimple: React.FC = () => {
  const { user, logout } = useAuth();
  const systemStatus: SystemStatus = {
    zedCore: {
      active: true,
      memory: 45,
      tasks: 3
    }
  };
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const queryClient = useQueryClient();

  // Get chat messages
  const { data: chatData, isLoading } = useQuery<{messages: ChatMessage[]}>({
    queryKey: ['/api/chat/history'],
    enabled: !!user,
  });

  const messages: ChatMessage[] = chatData?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return await apiRequest('/api/chat', 'POST', {
        message: messageText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      setMessage('');
      toast({
        title: "Message Sent",
        description: "Oracle has processed your query",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordChange: { currentPassword: string; newPassword: string }) => {
      return await apiRequest('/api/auth/change-password', 'POST', passwordChange);
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error", 
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#000000' }}>
      {/* Header with Logo */}
      <header className="p-6 mb-6" style={{ backgroundColor: '#000000' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={zebulonLogoPath} 
              alt="Zebulon Oracle Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-extrabold tracking-wide" style={{ 
                color: '#ffffff', 
                textShadow: '0 0 10px rgba(168, 85, 247, 0.3)',
                background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 50%, #ffffff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>ZEBULON</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#1a1a1a', color: '#10b981' }}>
              Zebulon Core
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Interface Grid */}
      <div className="px-8 mb-8">
        {/* Primary Module Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => setActiveTab('chat')}
          >
            <div className="flex flex-col items-center space-y-3">
              <MessageCircle className="h-10 w-10 text-purple-400" />
              <span className="text-white font-bold text-lg">ZED</span>
              <span className="text-gray-400 text-sm text-center">Chat Interface</span>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => setActiveTab('status')}
          >
            <div className="flex flex-col items-center space-y-3">
              <Activity className="h-10 w-10 text-green-400" />
              <span className="text-white font-bold text-lg">ZYNC</span>
              <span className="text-gray-400 text-sm text-center">IDE Interface</span>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => setActiveTab('admin')}
          >
            <div className="flex flex-col items-center space-y-3">
              <Shield className="h-10 w-10 text-blue-400" />
              <span className="text-white font-bold text-lg">ZETA</span>
              <span className="text-gray-400 text-sm text-center">Security Panel</span>
            </div>
          </div>
        </div>

        {/* Secondary Module Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => setActiveTab('music')}
          >
            <div className="flex flex-col items-center space-y-3">
              <Music className="h-10 w-10 text-pink-400" />
              <span className="text-white font-bold text-lg">Music</span>
              <span className="text-gray-400 text-sm text-center">Audio Control</span>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => setActiveTab('oracle')}
          >
            <div className="flex flex-col items-center space-y-3">
              <Database className="h-10 w-10 text-orange-400" />
              <span className="text-white font-bold text-lg">Oracle</span>
              <span className="text-gray-400 text-sm text-center">Database Core</span>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl cursor-pointer hover:opacity-80 transition-all duration-200 border border-gray-800" 
            style={{ backgroundColor: '#000000' }}
            onClick={() => setActiveTab('config')}
          >
            <div className="flex flex-col items-center space-y-3">
              <Settings className="h-10 w-10 text-gray-400" />
              <span className="text-white font-bold text-lg">Config</span>
              <span className="text-gray-400 text-sm text-center">System Settings</span>
            </div>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="flex justify-between items-center p-4 rounded-xl border border-gray-800 mb-6" style={{ backgroundColor: '#000000' }}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Zebulon Core Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-blue-400 text-sm font-medium">Database Connected</span>
            </div>
          </div>
          <div className="text-gray-300 text-sm font-mono">
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Active Module Content - Only show when a tab is selected */}
        {activeTab && (
          <div className="border border-gray-800 rounded-2xl p-6" style={{ backgroundColor: '#000000' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {activeTab === 'chat' && 'ZED Chat Interface'}
                {activeTab === 'status' && 'ZYNC IDE System'}
                {activeTab === 'admin' && 'ZETA Security Panel'}
                {activeTab === 'music' && 'Music Control'}
                {activeTab === 'oracle' && 'Oracle Database'}
                {activeTab === 'config' && 'System Configuration'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab('')}
                className="text-gray-400 hover:text-white"
              >
                Back to Dashboard
              </Button>
            </div>

            {activeTab === 'chat' && (
              <div className="space-y-4">
                <ScrollArea className="h-96 w-full border border-gray-800 rounded-lg p-4" style={{ backgroundColor: '#000000' }}>
                  {isLoading ? (
                    <div className="text-center text-gray-400">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400">
                      Start a conversation with ZED AI assistant
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.aiCore === 'zed' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`flex items-start gap-3 ${msg.aiCore === 'zed' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white`} 
                                 style={{ backgroundColor: msg.aiCore === 'zed' ? '#a855f7' : '#10b981' }}>
                              {msg.aiCore === 'zed' ? 'Z' : 'U'}
                            </div>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow text-white`} 
                                 style={{ backgroundColor: msg.aiCore === 'zed' ? '#a855f7' : '#10b981' }}>
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Chat with ZED..."
                    className="flex-1 border-gray-800 text-white"
                    style={{ backgroundColor: '#000000' }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="text-white"
                    style={{ backgroundColor: '#a855f7' }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'status' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">ZYNC IDE Status</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <p className="text-white font-medium flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        {systemStatus.oracleCore?.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Memory Usage</p>
                      <p className="text-white font-medium">{systemStatus.oracleCore?.memory || 92}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Active Queries</p>
                      <p className="text-white font-medium">{systemStatus.oracleCore?.queries || 847}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">User</p>
                      <p className="text-white font-medium">{user?.username}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="border-gray-800 text-white"
                        style={{ backgroundColor: '#000000' }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className="text-white">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="border-gray-800 text-white"
                        style={{ backgroundColor: '#000000' }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="border-gray-800 text-white"
                        style={{ backgroundColor: '#000000' }}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="text-white"
                      style={{ backgroundColor: '#3b82f6' }}
                    >
                      {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'music' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Audio Controls</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">System Volume</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">85%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Audio Input</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Output Device</span>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">Speakers</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Audio Processing</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Voice Recognition</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Audio Analysis</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">Processing</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Real-time Mode</span>
                        <Badge variant="outline" className="text-pink-400 border-pink-400">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center text-gray-400">
                  <p>Music and audio control functionality ready for implementation</p>
                </div>
              </div>
            )}

            {activeTab === 'oracle' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Database Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Connection</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Provider</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">PostgreSQL</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Tables</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">3 Active</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">Data Overview</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Users</span>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">2 Records</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Messages</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Active Logging</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">System Status</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">Monitoring</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center text-gray-400">
                  <p>Oracle database core is operational and ready for advanced queries</p>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">System Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Environment</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Development</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Port</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">5000</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Architecture</span>
                        <Badge variant="outline" className="text-purple-400 border-purple-400">Unified</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-800" style={{ backgroundColor: '#000000' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">AI Configuration</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Zebulon Core</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Response Mode</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">Contextual</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Memory</span>
                        <Badge variant="outline" className="text-pink-400 border-pink-400">Persistent</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center text-gray-400">
                  <p>System configuration and settings management interface</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZebulonSimple;