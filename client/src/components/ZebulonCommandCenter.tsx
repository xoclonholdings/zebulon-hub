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
  Zap,
  Upload,
  File,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { useVoice } from '@/hooks/use-voice';
import { OracleAdminPanel } from './OracleAdminPanel';
import ZebulonConfigPanel from './ZebulonConfigPanel';
import ZedSystemNotifications from './ZedSystemNotifications';

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
  const [activeFeature, setActiveFeature] = useState<'chat' | 'calendar' | 'notes' | 'music' | 'photos' | 'status' | 'oracle' | 'config' | 'files'>('chat');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { socket, addMessageHandler, removeMessageHandler } = useWebSocket();
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

  // File upload functionality
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Allow all document types
      const validTypes = [
        'text/', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument',
        'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
        'application/json', 'application/xml', 'image/', 'audio/', 'video/'
      ];
      return validTypes.some(type => file.type.startsWith(type)) || 
             file.name.match(/\.(txt|md|csv|rtf|odt|ods|odp|epub|mobi)$/i);
    });

    if (validFiles.length !== fileArray.length) {
      console.warn('Some files were filtered out due to unsupported types');
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    
    // Simulate upload progress for each file
    validFiles.forEach(file => {
      const fileId = `${file.name}_${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
          }, 1000);
        }
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      }, 300);
    });
  };

  const handleFileRemove = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Camera;
    if (file.type.startsWith('audio/')) return Music;
    if (file.type.includes('pdf')) return FileText;
    if (file.type.includes('word') || file.type.includes('document')) return FileText;
    if (file.type.includes('sheet') || file.type.includes('excel')) return BarChart3;
    return File;
  };

  const renderFileUploadInterface = () => {
    return (
      <div className="w-full h-full -m-6 p-6 bg-black bg-opacity-95 rounded-lg text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
                File Management
              </h2>
              <p className="text-sm text-gray-400">Upload and manage documents for Zebulon analysis</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-400/30">
            {uploadedFiles.length} Files
          </Badge>
        </div>

        <div className="flex flex-col h-full space-y-6">
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-pink-400/50 hover:bg-white/5 transition-all duration-200 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-pink-400', 'bg-white/10');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-pink-400', 'bg-white/10');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-pink-400', 'bg-white/10');
              handleFileUpload(e.dataTransfer.files);
            }}
          >
            <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Upload Files</h3>
            <p className="text-gray-400 mb-4">
              Drag and drop files here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports: PDF, DOC, DOCX, TXT, MD, CSV, JSON, Images, Audio, Video and more
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.json,.xml,.rtf,.odt,.ods,.odp,.epub,.mobi,image/*,audio/*,video/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Uploading...</h4>
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white truncate">{fileId.split('_')[0]}</span>
                    <span className="text-gray-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* File List */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-white">Uploaded Files</h4>
              {uploadedFiles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFiles([])}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-full">
              {uploadedFiles.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No files uploaded yet</p>
                  <p className="text-sm mt-1">Upload files to get started with document analysis</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => {
                    const FileIcon = getFileIcon(file);
                    return (
                      <div key={index} className="bg-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/20 transition-all">
                        <div className="flex items-center space-x-3">
                          <FileIcon className="h-8 w-8 text-gray-400" />
                          <div>
                            <div className="text-white font-medium truncate max-w-xs">
                              {file.name}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center space-x-2">
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span>{file.type || 'Unknown type'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Simulate file analysis with Zed
                              sendMessageMutation.mutate({
                                message: `Analyze uploaded file: ${file.name}`,
                                aiCore: 'zed'
                              });
                              setActiveFeature('chat');
                            }}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Analyze
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileRemove(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  };

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
                    placeholder="Ask Zed..."
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

      case 'config':
        return (
          <div className="w-full h-full -m-6">
            <ZebulonConfigPanel userId={userId} />
          </div>
        );

      case 'files':
        return renderFileUploadInterface();

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

          {/* Feature Navigation Buttons - Enhanced 3x3 grid */}
          <div className="grid grid-cols-3 gap-2 p-2 bg-black bg-opacity-20 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('chat')}
              className={`h-12 flex-col p-2 transition-all duration-200 ${
                activeFeature === 'chat' 
                  ? 'bg-gradient-to-r from-pink-500/30 to-blue-500/30 text-white border border-pink-400/50' 
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
              }`}
            >
              <Brain className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">Chat</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('status')}
              className={`h-12 flex-col p-2 transition-all duration-200 ${
                activeFeature === 'status' 
                  ? 'bg-gradient-to-r from-pink-500/30 to-blue-500/30 text-white border border-pink-400/50' 
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
              }`}
            >
              <BarChart3 className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">Status</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('oracle')}
              className={`h-12 flex-col p-2 transition-all duration-200 ${
                activeFeature === 'oracle' 
                  ? 'bg-gradient-to-r from-pink-500/30 to-blue-500/30 text-white border border-pink-400/50' 
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
              }`}
            >
              <Database className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">Oracle</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('calendar')}
              className={`h-12 flex-col p-2 transition-all duration-200 ${
                activeFeature === 'calendar' 
                  ? 'bg-gradient-to-r from-pink-500/30 to-blue-500/30 text-white border border-pink-400/50' 
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
              }`}
            >
              <Calendar className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">Calendar</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('notes')}
              className={`h-12 flex-col p-2 transition-all duration-200 ${
                activeFeature === 'notes' 
                  ? 'bg-gradient-to-r from-pink-500/30 to-blue-500/30 text-white border border-pink-400/50' 
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
              }`}
            >
              <FileText className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">Notes</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('music')}
              className={`h-12 flex-col p-2 transition-all duration-200 ${
                activeFeature === 'music' 
                  ? 'bg-gradient-to-r from-pink-500/30 to-blue-500/30 text-white border border-pink-400/50' 
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
              }`}
            >
              <Music className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">Music</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('photos')}
              className={`h-12 flex-col p-2 transition-all duration-200 ${
                activeFeature === 'photos' 
                  ? 'bg-gradient-to-r from-pink-500/30 to-blue-500/30 text-white border border-pink-400/50' 
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
              }`}
            >
              <Camera className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">Photos</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('config')}
              className={`h-12 flex-col p-2 transition-all duration-200 ${
                activeFeature === 'config' 
                  ? 'bg-gradient-to-r from-pink-500/30 to-blue-500/30 text-white border border-pink-400/50' 
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
              }`}
            >
              <Settings className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">Config</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('files')}
              className={`h-12 flex-col p-2 transition-all duration-200 ${
                activeFeature === 'files' 
                  ? 'bg-gradient-to-r from-pink-500/30 to-blue-500/30 text-white border border-pink-400/50' 
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-transparent hover:border-white/20'
              }`}
            >
              <Upload className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">Files</span>
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
                  placeholder="Ask Zed..."
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
      
      {/* System Notifications for Cross-App Ducking */}
      <ZedSystemNotifications userId={1} websocket={socket} />
    </div>
  );
};

export default ZebulonCommandCenter;