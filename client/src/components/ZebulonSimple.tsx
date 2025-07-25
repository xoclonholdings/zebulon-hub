import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Activity, LogOut, Settings, MessageCircle, Shield, Music, Eye, Server } from 'lucide-react';
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
    <div className="min-h-screen bg-black text-white">
      {/* Header with Logo */}
      <header className="bg-black border-b border-white/20 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={zedLogoPath} 
              alt="Zed AI Logo" 
              className="w-8 h-8 object-contain hover:scale-110 transition-transform"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-400">Zebulon AI System</h1>
              <p className="text-sm text-gray-400">Welcome, {user?.username} • Local Processing</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-green-400 border-green-400">
              Active
            </Badge>
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

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-black border-white/20">
            <TabsTrigger value="chat" className="data-[state=active]:bg-blue-600">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-blue-600">
              <Activity className="h-4 w-4 mr-2" />
              Status
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="music" className="data-[state=active]:bg-blue-600">
              <Music className="h-4 w-4 mr-2" />
              Music
            </TabsTrigger>
            <TabsTrigger value="oracle" className="data-[state=active]:bg-blue-600">
              <Eye className="h-4 w-4 mr-2" />
              Oracle
            </TabsTrigger>
            <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <Card className="bg-black border-white/20">
              <CardHeader>
                <CardTitle className="text-blue-400">Chat with Zed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-96 w-full border border-white/20 rounded-lg p-4 bg-black">
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
                              msg.aiCore === 'zed' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                            }`}>
                              {msg.aiCore === 'zed' ? 'Z' : 'U'}
                            </div>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                              msg.aiCore === 'zed' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100'
                            }`}>
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
                    placeholder="Ask Zed anything..."
                    className="flex-1 bg-black border-white/20 text-white"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="mt-4">
            <Card className="bg-black border-white/20">
              <CardHeader>
                <CardTitle className="text-blue-400">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Zed Core</span>
                      <Badge variant={systemStatus.zedCore.active ? "default" : "destructive"}>
                        {systemStatus.zedCore.active ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-400">
                      Memory: {systemStatus.zedCore.memory}% | Tasks: {systemStatus.zedCore.tasks}
                    </div>
                  </div>
                  <div className="bg-black border border-white/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-2">System Information</h4>
                    <div className="space-y-1 text-sm text-gray-400">
                      <div>🧠 AI Core: Zed Assistant</div>
                      <div>💾 Database: PostgreSQL</div>
                      <div>🔒 Security: Active</div>
                      <div>📊 Status: Operational</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <Card className="bg-black border-white/20">
              <CardHeader>
                <CardTitle className="text-blue-400">Security Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Shield className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Security Features</h3>
                  <p className="text-sm">Advanced security monitoring and controls</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="music" className="mt-4">
            <Card className="bg-black border-white/20">
              <CardHeader>
                <CardTitle className="text-blue-400">AI Music Studio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Music className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Music Generation</h3>
                  <p className="text-sm">Create ambient soundscapes and music</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oracle" className="mt-4">
            <Card className="bg-black border-white/20">
              <CardHeader>
                <CardTitle className="text-blue-400">Oracle Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Eye className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Predictive Analytics</h3>
                  <p className="text-sm">Advanced pattern recognition and insights</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="mt-4">
            <Card className="bg-black border-white/20">
              <CardHeader>
                <CardTitle className="text-blue-400">Administration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
                  
                  <Card className="bg-black border-white/20">
                    <CardHeader>
                      <CardTitle className="text-sm text-gray-300">Change Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword" className="text-gray-300">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            placeholder="Enter current password"
                            className="bg-black border-white/20 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            placeholder="Enter new password (min 6 characters)"
                            className="bg-black border-white/20 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            placeholder="Confirm new password"
                            className="bg-black border-white/20 text-white"
                            required
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
                  <Card className="bg-black/50 border-gray-600">
                    <CardContent className="pt-6">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">User:</span>
                          <span className="text-white">{user?.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">AI Core:</span>
                          <span className="text-green-400">Zed Assistant</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Database:</span>
                          <span className="text-green-400">PostgreSQL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Security:</span>
                          <span className="text-green-400">Active</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Session Management</h3>
                  <Button 
                    onClick={logout}
                    variant="destructive"
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ZebulonSimple;