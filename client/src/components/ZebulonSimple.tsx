import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Activity, LogOut, Settings, MessageCircle, Shield, Music, Eye, Server, Database, Lock, FileText, Calendar, Camera, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import zedLogoPath from '@assets/Zed-ai-logo_1753425830375.jpg';

interface ChatMessage {
  id: number;
  message: string;
  aiCore: string;
  createdAt: string;
  userId: number;
}

interface SystemStatus {
  zedCore: {
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
  const [activeTab, setActiveTab] = useState('chat');
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
        description: "Zed has responded to your message",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
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

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await apiRequest('/api/auth/change-password', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  });

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
              src={zedLogoPath} 
              alt="Zed AI Logo" 
              className="w-8 h-8 object-contain"
              style={{ backgroundColor: '#000000' }}
            />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#a855f7' }}>ZEBULON</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#1a1a1a', color: '#10b981' }}>
              Zed Core
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

      {/* Main Navigation Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-white" />
              <span className="text-white font-medium">Zed</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-white" />
              <span className="text-white font-medium">Zeta</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center space-x-3">
              <Lock className="h-6 w-6 text-white" />
              <span className="text-white font-medium">Fantasma</span>
            </div>
          </div>
        </div>

        {/* Zed Core Section */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <Database className="h-6 w-6 text-white mr-2" />
            <span className="text-xl font-bold text-white">Zed Core</span>
          </div>
          <p className="text-gray-400">Oracle database management and AI assistance</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-white" />
              <div>
                <span className="text-white font-medium block">Zed: Active</span>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-white" />
              <div>
                <span className="text-white font-medium block">Zeta: Monitoring</span>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center space-x-3">
              <Lock className="h-6 w-6 text-white" />
              <div>
                <span className="text-white font-medium block">Fantasma: Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div 
            className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setActiveTab('chat')}
          >
            <MessageCircle className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Chat</span>
          </div>
          <div className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity">
            <FileText className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Notes</span>
          </div>
          <div className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity">
            <Settings className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Config</span>
          </div>
          <div className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity">
            <Music className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Music</span>
          </div>
          <div className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity">
            <Database className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Oracle</span>
          </div>
          <div 
            className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setActiveTab('status')}
          >
            <Activity className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Status</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity">
            <Calendar className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Calendar</span>
          </div>
          <div className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity">
            <Camera className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Photos</span>
          </div>
          <div className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity">
            <FileText className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Notes</span>
          </div>
          <div 
            className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setActiveTab('admin')}
          >
            <Shield className="h-8 w-8 text-white" />
            <span className="text-white text-sm">Admin</span>
          </div>
        </div>

        {/* Time Display */}
        <div className="flex justify-end mb-4">
          <div className="px-4 py-2 rounded-lg text-gray-300" style={{ backgroundColor: '#1a1a1a' }}>
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Modal-style content when tab is active */}
      {activeTab && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setActiveTab('')}>
          <div className="max-w-2xl w-full mx-4 rounded-2xl" style={{ backgroundColor: '#000000' }} onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  {activeTab === 'chat' && 'Chat with Zed'}
                  {activeTab === 'status' && 'System Status'}
                  {activeTab === 'admin' && 'Admin Panel'}
                </h2>
                <Button variant="ghost" onClick={() => setActiveTab('')} className="text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {activeTab === 'chat' && (
                <div>
                  <Card className="border-white/20" style={{ backgroundColor: '#000000' }}>
                    <CardContent className="space-y-4">
                      <ScrollArea className="h-96 w-full border border-white/20 rounded-lg p-4" style={{ backgroundColor: '#000000' }}>
                        {isLoading ? (
                          <div className="text-center text-gray-400">Loading messages...</div>
                        ) : messages.length === 0 ? (
                          <div className="text-center text-gray-400">
                            Start a conversation with Zed AI assistant
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.aiCore === 'zed' ? 'justify-start' : 'justify-end'}`}
                              >
                                <div className={`flex items-start gap-3 ${msg.aiCore === 'zed' ? 'flex-row' : 'flex-row-reverse'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    msg.aiCore === 'zed' ? 'text-white' : 'text-white'
                                  }`} style={{ backgroundColor: msg.aiCore === 'zed' ? '#a855f7' : '#10b981' }}>
                                    {msg.aiCore === 'zed' ? 'Z' : 'U'}
                                  </div>
                                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                                    msg.aiCore === 'zed' 
                                      ? 'text-white' 
                                      : 'text-white'
                                  }`} style={{ backgroundColor: msg.aiCore === 'zed' ? '#a855f7' : '#10b981' }}>
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
                          placeholder="Ask Zed Core..."
                          className="flex-1 border-white/20 text-white"
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
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'status' && (
                <div>
                  <Card className="border-white/20" style={{ backgroundColor: '#000000' }}>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg border border-white/20">
                          <h3 className="text-lg font-semibold text-white mb-2">Zed Core Status</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-400">Status</p>
                              <p className="text-white font-medium">
                                {systemStatus.zedCore.active ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Memory Usage</p>
                              <p className="text-white font-medium">{systemStatus.zedCore.memory}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Active Tasks</p>
                              <p className="text-white font-medium">{systemStatus.zedCore.tasks}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">User</p>
                              <p className="text-white font-medium">{user?.username}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'admin' && (
                <div>
                  <Card className="border-white/20" style={{ backgroundColor: '#000000' }}>
                    <CardContent className="space-y-6">
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
                              className="border-white/20 text-white"
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
                              className="border-white/20 text-white"
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
                              className="border-white/20 text-white"
                              style={{ backgroundColor: '#000000' }}
                              required
                            />
                          </div>
                          <Button 
                            type="submit"
                            disabled={changePasswordMutation.isPending}
                            className="text-white"
                            style={{ backgroundColor: '#a855f7' }}
                          >
                            {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-6 right-6">
        <div className="flex justify-between items-center p-4 rounded-2xl" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#2563eb' }}>
              <Database className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Zed</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 rounded-xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1a1a' }}>
              <Shield className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Zeta</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 rounded-xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1a1a' }}>
              <Lock className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Fantasma</span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1a1a' }}>
              <Settings className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#10b981' }}>
            Zed Core
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZebulonSimple;