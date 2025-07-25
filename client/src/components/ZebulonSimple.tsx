import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Activity, LogOut } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import ZebulonLogo from './ZebulonLogo';

interface ChatMessage {
  id: number;
  message: string;
  aiCore: string;
  createdAt: string;
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
  const queryClient = useQueryClient();

  // Get chat messages
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat', user?.id],
    enabled: !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return await apiRequest(`/api/chat/${user?.id}`, 'POST', {
        message: messageText,
        aiCore: 'zed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', user?.id] });
      setMessage('');
      toast({
        title: "Message Sent",
        description: "Zed is processing your request...",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with Logo */}
      <header className="bg-gray-900 border-b border-blue-500/30 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ZebulonLogo size={32} className="hover:scale-110 transition-transform" />
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
        {/* System Status */}
        <Card className="bg-gray-900 border-blue-500/30 mb-4">
          <CardHeader>
            <CardTitle className="text-blue-400">System Status</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

      {/* Chat Interface */}
      <Card className="bg-gray-900 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-blue-400">Chat with Zed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <ScrollArea className="h-96 w-full border border-gray-700 rounded-lg p-4 bg-black/50">
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
                    className={`flex ${msg.message.startsWith('Echo:') ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.message.startsWith('Echo:')
                          ? 'bg-blue-500/20 text-blue-100'
                          : 'bg-gray-600/50 text-white'
                      }`}
                    >
                      <div className="text-sm">{msg.message}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Zed anything..."
              className="flex-1 bg-black/50 border-gray-600 text-white"
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
      </div>
    </div>
  );
};

export default ZebulonSimple;