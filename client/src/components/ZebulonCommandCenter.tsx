import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Mic, 
  MicOff, 
  Shield, 
  Database, 
  Brain, 
  Target,
  Activity,
  Lock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { useVoice } from '@/hooks/use-voice';

interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: string;
  aiCore?: 'zed' | 'zeta' | 'fantasma';
}

interface ZebulonCommandCenterProps {
  userId: number;
}

const ZebulonCommandCenter: React.FC<ZebulonCommandCenterProps> = ({ userId }) => {
  const [message, setMessage] = useState('');
  const [activeCore, setActiveCore] = useState<'zed' | 'zeta' | 'fantasma'>('zed');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { addMessageHandler, removeMessageHandler } = useWebSocket();
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    isSupported 
  } = useVoice();

  // Fetch chat messages
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat', userId],
    refetchInterval: 1000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { message: string; aiCore: string }) =>
      apiRequest(`/api/chat/${userId}`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', userId] });
      setMessage('');
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice input
  useEffect(() => {
    if (transcript && !isListening) {
      setMessage(transcript);
    }
  }, [transcript, isListening]);

  // Handle WebSocket messages
  useEffect(() => {
    addMessageHandler('ai_response', (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', userId] });
    });

    return () => {
      removeMessageHandler('ai_response');
    };
  }, [addMessageHandler, removeMessageHandler, queryClient, userId]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      message: message.trim(),
      aiCore: activeCore
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCoreInfo = (core: string) => {
    switch (core) {
      case 'zed':
        return { 
          name: 'Zed Core', 
          status: 'Active',
          description: 'Oracle database management and AI assistance',
          icon: Database,
          color: 'text-blue-400'
        };
      case 'zeta':
        return { 
          name: 'Zeta Core', 
          status: 'Monitoring',
          description: 'Security monitoring and threat detection',
          icon: Shield,
          color: 'text-green-400'
        };
      case 'fantasma':
        return { 
          name: 'Fantasma Firewall', 
          status: 'Secure',
          description: 'Advanced security and anomaly detection',
          icon: Lock,
          color: 'text-purple-400'
        };
      default:
        return { 
          name: 'Unknown', 
          status: 'Inactive',
          description: '',
          icon: Brain,
          color: 'text-gray-400'
        };
    }
  };

  const currentCoreInfo = getCoreInfo(activeCore);
  const CurrentIcon = currentCoreInfo.icon;

  return (
    <div className="w-full h-full">
      <Card className="zebulon-gradient border-0 text-white h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <CardTitle className="text-center text-2xl font-bold text-white mb-2">
            Zebulon Command
          </CardTitle>
          
          {/* Active Core Status */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <CurrentIcon className="h-5 w-5" />
              <span className="font-semibold">{currentCoreInfo.name}</span>
            </div>
            <div className="text-white text-opacity-90 text-sm">
              {currentCoreInfo.description}
            </div>
          </div>

          {/* AI Core Status Pills */}
          <div className="flex justify-center space-x-2 mt-4">
            <Button
              variant={activeCore === 'zed' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCore('zed')}
              className="h-8 px-3 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 border-white border-opacity-20"
            >
              <Database className="h-3 w-3 mr-1" />
              Zed: Active
            </Button>
            
            <Button
              variant={activeCore === 'zeta' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCore('zeta')}
              className="h-8 px-3 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 border-white border-opacity-20"
            >
              <Shield className="h-3 w-3 mr-1" />
              Zeta: Monitoring
            </Button>
            
            <Button
              variant={activeCore === 'fantasma' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCore('fantasma')}
              className="h-8 px-3 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 border-white border-opacity-20"
            >
              <Lock className="h-3 w-3 mr-1" />
              Fantasma: Secure
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4 pt-0">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 bg-black bg-opacity-20 rounded-lg p-3 max-h-64">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.isUser 
                      ? 'bg-white bg-opacity-20 text-white ml-auto' 
                      : 'bg-black bg-opacity-30 text-white'
                  }`}>
                    {!msg.isUser && msg.aiCore && (
                      <div className="text-xs opacity-75 mb-1 flex items-center space-x-1">
                        {getCoreInfo(msg.aiCore).icon && React.createElement(getCoreInfo(msg.aiCore).icon, { className: "h-3 w-3" })}
                        <span>{getCoreInfo(msg.aiCore).name}</span>
                      </div>
                    )}
                    <div className="text-sm">{msg.content}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Ask Zebulon anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder:text-white placeholder:text-opacity-60 pr-12"
                  disabled={sendMessageMutation.isPending}
                />
                
                {/* Voice Input Button */}
                {isSupported && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-white hover:bg-opacity-10"
                    onClick={isListening ? stopListening : startListening}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 text-red-400" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 text-white border-white border-opacity-20"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Voice Feedback */}
            {isListening && (
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Activity className="h-4 w-4 animate-pulse text-red-400" />
                <span className="text-white text-opacity-75">Listening...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZebulonCommandCenter;