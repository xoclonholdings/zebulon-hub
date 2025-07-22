import React, { useState, useEffect, useRef } from 'react';
import logoSrc from '@assets/IMG_2227_1753155820979.png';
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
  Lock,
  Calendar,
  FileText,
  Music,
  Camera,
  Settings,
  BarChart3,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { useVoice } from '@/hooks/use-voice';
import { OracleAdminPanel } from './OracleAdminPanel';

interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: string;
  aiCore?: 'zed' | 'zeta' | 'fantasma';
}

interface SystemStatus {
  oracle: {
    connected: boolean;
    activeConnections: number;
    maxConnections: number;
    responseTime: number;
    memoryUsage: number;
    uptime: string;
  };
  security: {
    level: 'high' | 'medium' | 'low';
    vulnerabilities: number;
    encrypted: boolean;
  };
  zedCore: {
    active: boolean;
    memory: number;
    tasks: number;
  };
  zetaCore: {
    monitoring: boolean;
    threats: number;
    alerts: number;
  };
  fantasmaFirewall: {
    active: boolean;
    blocked: number;
    stealth: boolean;
  };
}

interface ZebulonCommandCenterProps {
  userId: number;
  systemStatus: SystemStatus;
}

const ZebulonCommandCenter: React.FC<ZebulonCommandCenterProps> = ({ userId, systemStatus }) => {
  const [message, setMessage] = useState('');
  const [activeCore, setActiveCore] = useState<'zed' | 'zeta' | 'fantasma'>('zed');
  const [activeFeature, setActiveFeature] = useState<'chat' | 'calendar' | 'notes' | 'music' | 'photos' | 'status' | 'oracle'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { addMessageHandler, removeMessageHandler } = useWebSocket();
  const { 
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    recordAndProcess
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
  const handleVoiceRecording = async () => {
    if (isRecording) {
      try {
        const audioBlob = await stopRecording();
        await processVoiceCommand(audioBlob, userId, (result) => {
          if (result.transcription?.text) {
            setMessage(result.transcription.text);
          }
        });
      } catch (error) {
        console.error('Voice recording failed:', error);
      }
    } else {
      await startRecording();
    }
  };

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

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case 'chat':
        return (
          <>
            {/* Chat Messages */}
            <ScrollArea className="flex-1 bg-black bg-opacity-20 rounded-lg p-3 max-h-64 mb-4">
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
                  <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-white hover:bg-opacity-10"
                      onClick={handleVoiceRecording}
                    >
                      {isRecording ? (
                        <MicOff className="h-4 w-4 text-red-400" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
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
              {(isRecording || isProcessing) && (
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <Activity className="h-4 w-4 animate-pulse text-red-400" />
                  <span className="text-white text-opacity-75">
                    {isRecording ? 'Recording...' : 'Processing...'}
                  </span>
                </div>
              )}
            </div>
          </>
        );

      case 'status':
        return (
          <div className="space-y-4 text-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold">Oracle Status</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Connections: {systemStatus.oracle.activeConnections}/{systemStatus.oracle.maxConnections}</div>
                  <div>Response: {systemStatus.oracle.responseTime}ms</div>
                  <div>Memory: {systemStatus.oracle.memoryUsage}%</div>
                  <div>Uptime: {systemStatus.oracle.uptime}</div>
                </div>
              </div>

              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span className="font-semibold">Security Status</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Level: {systemStatus.security?.level || 'High'}</div>
                  <div>Vulnerabilities: {systemStatus.security?.vulnerabilities || 0}</div>
                  <div>Encrypted: {systemStatus.security?.encrypted ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <span className="font-semibold">AI Cores</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Zed: {systemStatus.zedCore?.active ? 'Active' : 'Inactive'}</div>
                  <div>Zeta: {systemStatus.zetaCore?.monitoring ? 'Monitoring' : 'Standby'}</div>
                  <div>Fantasma: {systemStatus.fantasmaFirewall?.active ? 'Secure' : 'Disabled'}</div>
                </div>
              </div>

              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-yellow-400" />
                  <span className="font-semibold">Performance</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>CPU: 45%</div>
                  <div>Memory: 67%</div>
                  <div>Network: 12 MB/s</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="bg-black bg-opacity-20 rounded-lg p-4 text-white">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">Today's Schedule</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3 p-2 bg-white bg-opacity-10 rounded">
                <Clock className="h-4 w-4" />
                <div>
                  <div className="font-medium">Database Maintenance</div>
                  <div className="text-xs opacity-75">2:00 PM - 3:00 PM</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-white bg-opacity-10 rounded">
                <Users className="h-4 w-4" />
                <div>
                  <div className="font-medium">Team Sync</div>
                  <div className="text-xs opacity-75">4:00 PM - 4:30 PM</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'oracle':
        return (
          <div className="w-full h-full -m-6">
            <OracleAdminPanel userId={userId} />
          </div>
        );

      default:
        return (
          <div className="text-center text-white text-opacity-75 py-8">
            <div className="text-lg font-semibold mb-2">Feature Coming Soon</div>
            <div className="text-sm">This feature is being developed.</div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full">
      <Card className="bg-black bg-opacity-95 border border-primary border-opacity-20 zebulon-glow text-white h-full flex flex-col min-h-[80vh] rounded-xl backdrop-blur-lg">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 flex items-center justify-center">
              <img 
                src={logoSrc} 
                alt="Zebulon Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => console.log('Logo loaded successfully')}
              />
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl zebulon-text-gradient" style={{display: 'none'}}>
                Z?
              </div>
            </div>
          </div>
          
          <CardTitle className="text-center text-xl font-bold zebulon-text-gradient">
            ZEBULON
          </CardTitle>
          
          {/* Active Core Status */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <CurrentIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{currentCoreInfo.name}</span>
            </div>
            <div className="text-xs text-white text-opacity-75">
              {currentCoreInfo.description}
            </div>
          </div>

          {/* AI Core Status Pills */}
          <div className="flex justify-center space-x-1 flex-wrap gap-1">
            <Button
              variant={activeCore === 'zed' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCore('zed')}
              className="h-7 px-2 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20"
            >
              <Database className="h-3 w-3 mr-1" />
              Zed: Active
            </Button>
            
            <Button
              variant={activeCore === 'zeta' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCore('zeta')}
              className="h-7 px-2 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20"
            >
              <Shield className="h-3 w-3 mr-1" />
              Zeta: Monitoring
            </Button>
            
            <Button
              variant={activeCore === 'fantasma' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCore('fantasma')}
              className="h-7 px-2 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20"
            >
              <Lock className="h-3 w-3 mr-1" />
              Fantasma: Secure
            </Button>
          </div>

          {/* Feature Navigation Buttons - 3x3 grid */}
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant={activeFeature === 'chat' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFeature('chat')}
              className="h-10 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 flex-col p-1"
            >
              <Brain className="h-3 w-3 mb-1" />
              <span className="text-xs">Chat</span>
            </Button>
            
            <Button
              variant={activeFeature === 'status' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFeature('status')}
              className="h-10 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 flex-col p-1"
            >
              <BarChart3 className="h-3 w-3 mb-1" />
              <span className="text-xs">Status</span>
            </Button>
            
            <Button
              variant={activeFeature === 'oracle' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFeature('oracle')}
              className="h-10 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 flex-col p-1"
            >
              <Database className="h-3 w-3 mb-1" />
              <span className="text-xs">Oracle</span>
            </Button>
            
            <Button
              variant={activeFeature === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFeature('calendar')}
              className="h-10 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 flex-col p-1"
            >
              <Calendar className="h-3 w-3 mb-1" />
              <span className="text-xs">Calendar</span>
            </Button>
            
            <Button
              variant={activeFeature === 'notes' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFeature('notes')}
              className="h-10 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 flex-col p-1"
            >
              <FileText className="h-3 w-3 mb-1" />
              <span className="text-xs">Notes</span>
            </Button>
            
            <Button
              variant={activeFeature === 'music' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFeature('music')}
              className="h-10 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 flex-col p-1"
            >
              <Music className="h-3 w-3 mb-1" />
              <span className="text-xs">Music</span>
            </Button>
            
            <Button
              variant={activeFeature === 'photos' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFeature('photos')}
              className="h-10 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 flex-col p-1"
            >
              <Camera className="h-3 w-3 mb-1" />
              <span className="text-xs">Photos</span>
            </Button>
            
            <Button
              variant={activeFeature === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFeature('calendar')}
              className="h-10 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 flex-col p-1"
            >
              <Settings className="h-3 w-3 mb-1" />
              <span className="text-xs">Config</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col pt-0">
          {renderFeatureContent()}
        </CardContent>

        {/* Chat Input Area - Only show when not in chat mode */}
        {activeFeature !== 'chat' && (
          <div className="p-4 border-t border-white border-opacity-10">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Ask Zebulon anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-full px-4 py-2 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
              <button 
                className="p-2 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                onClick={handleVoiceRecording}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-red-400" />
                ) : (
                  <Mic className="h-4 w-4 text-white" />
                )}
              </button>
              <button 
                className="p-2 bg-primary hover:bg-primary/80 rounded-full transition-all"
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ZebulonCommandCenter;