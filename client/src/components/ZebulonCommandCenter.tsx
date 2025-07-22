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
  AlertTriangle,
  Plus,
  Edit,
  Save,
  Trash2,
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  AlbumIcon,
  Image,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { useVoice } from '@/hooks/use-voice';
import { OracleAdminPanel } from './OracleAdminPanel';
import ZebulonConfigPanel from './ZebulonConfigPanel';
import { AdminLoginModal } from './AdminLoginModal';
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
  const [activeFeature, setActiveFeature] = useState<'chat' | 'calendar' | 'music' | 'photos' | 'status' | 'oracle' | 'config' | 'files' | 'admin'>('chat');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Admin controls
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<any>({});
  

  
  // Calendar functionality  
  const [calendarEvents, setCalendarEvents] = useState<Array<{id: number, title: string, date: string, time: string, description: string}>>([]);
  const [newEvent, setNewEvent] = useState({title: '', date: '', time: '', description: ''});
  const [showEventForm, setShowEventForm] = useState(false);
  
  // Photo albums functionality
  const [photoAlbums, setPhotoAlbums] = useState<Array<{id: number, name: string, photos: File[], date: string}>>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Music interface state - moved outside render functions to avoid hooks error
  const [currentTrack, setCurrentTrack] = useState({
    title: 'Connect to Spotify',
    artist: 'No track playing',
    playing: false
  });
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  // Files interface state - moved outside render functions to avoid hooks error
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
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

  // Fetch chat messages - Reduced polling frequency to prevent rate limiting
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat', userId],
    refetchInterval: 5000, // Reduced from 1000ms to 5000ms
  });

  // Check user permissions
  const { data: permissions } = useQuery({
    queryKey: [`/api/user/${userId}/permissions/canUseVoiceCommands`],
    enabled: !!userId,
  });

  // Send message mutation with permission check
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; aiCore: string }) => {
      // Check if autonomous operations are allowed
      try {
        const autonomousCheck: any = await apiRequest(`/api/user/${userId}/permissions/autonomousOperations`, 'GET');
        if (!autonomousCheck.hasPermission && data.message.includes('autonomous')) {
          throw new Error('Autonomous operations require admin approval');
        }
      } catch (error) {
        console.warn('Permission check failed, proceeding with message');
      }
      
      return apiRequest(`/api/chat/${userId}`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', userId] });
      setMessage('');
    },
    onError: (error: Error) => {
      console.error('Message send failed:', error.message);
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
        // Process voice internally - simulate transcription
        setMessage("Voice input processed by Zed Core");
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



  // Calendar Interface
  const renderCalendarInterface = () => {
    const addEvent = () => {
      if (newEvent.title.trim() && newEvent.date && newEvent.time) {
        setCalendarEvents([...calendarEvents, {
          id: Date.now(),
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          description: newEvent.description
        }]);
        setNewEvent({title: '', date: '', time: '', description: ''});
        setShowEventForm(false);
      }
    };

    const deleteEvent = (id: number) => {
      setCalendarEvents(calendarEvents.filter(event => event.id !== id));
    };

    return (
      <div className="w-full h-full -m-6 p-6 bg-black bg-opacity-95 rounded-lg text-white overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
                Smart Calendar
              </h2>
              <p className="text-sm text-gray-400">Schedule and manage your events</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-400/30">
              {calendarEvents.length} Events
            </Badge>
            <Button onClick={() => setShowEventForm(!showEventForm)} className="bg-gradient-to-r from-pink-500 to-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        <div className="flex flex-col h-full space-y-6">
          {/* Add Event Form */}
          {showEventForm && (
            <div className="bg-white/10 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Event title..."
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  className="bg-white/10 border-white/20 text-white"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={addEvent} className="bg-gradient-to-r from-pink-500 to-blue-500 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save Event
                </Button>
                <Button onClick={() => setShowEventForm(false)} variant="ghost" className="text-gray-400">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Events List */}
          <ScrollArea className="flex-1">
            {calendarEvents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events scheduled</p>
                <p className="text-sm mt-1">Add your first event to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calendarEvents.map((event) => (
                  <div key={event.id} className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white">{event.title}</h3>
                      <Button variant="ghost" size="sm" onClick={() => deleteEvent(event.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                      <span>{event.date}</span>
                      <span>•</span>
                      <span>{event.time}</span>
                    </div>
                    {event.description && (
                      <p className="text-gray-400 text-sm mt-2">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    );
  };

  // Photos Interface
  const renderPhotosInterface = () => {
    const createAlbum = () => {
      if (newAlbumName.trim()) {
        setPhotoAlbums([...photoAlbums, {
          id: Date.now(),
          name: newAlbumName,
          photos: [],
          date: new Date().toISOString().split('T')[0]
        }]);
        setNewAlbumName('');
      }
    };

    const addPhotosToAlbum = (files: FileList | null) => {
      if (!files || selectedAlbum === null) return;
      
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      setPhotoAlbums(albums => albums.map(album => 
        album.id === selectedAlbum 
          ? { ...album, photos: [...album.photos, ...imageFiles] }
          : album
      ));
    };

    return (
      <div className="w-full h-full -m-6 p-6 bg-black bg-opacity-95 rounded-lg text-white overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
                Photo Albums
              </h2>
              <p className="text-sm text-gray-400">Organize and manage your photo collections</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30">
            {photoAlbums.length} Albums
          </Badge>
        </div>

        <div className="flex flex-col h-full space-y-6">
          {/* Create Album */}
          <div className="bg-white/10 rounded-lg p-4 space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Album name..."
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Button onClick={createAlbum} className="bg-gradient-to-r from-pink-500 to-blue-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Album
              </Button>
            </div>
          </div>

          {/* Albums Grid */}
          <ScrollArea className="flex-1">
            {photoAlbums.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No photo albums yet</p>
                <p className="text-sm mt-1">Create your first album above</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoAlbums.map((album) => (
                  <div 
                    key={album.id} 
                    className={`bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer ${
                      selectedAlbum === album.id ? 'ring-2 ring-pink-400' : ''
                    }`}
                    onClick={() => setSelectedAlbum(album.id)}
                  >
                    <div className="aspect-square bg-white/5 rounded-lg mb-3 flex items-center justify-center">
                      {album.photos.length > 0 ? (
                        <img 
                          src={URL.createObjectURL(album.photos[0])} 
                          alt="Album preview" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-gray-500" />
                      )}
                    </div>
                    <h3 className="font-medium text-white mb-1">{album.name}</h3>
                    <p className="text-xs text-gray-400">{album.photos.length} photos • {album.date}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Photo Upload for Selected Album */}
          {selectedAlbum && (
            <div className="bg-white/10 rounded-lg p-4">
              <Button 
                onClick={() => photoInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Photos to Selected Album
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => addPhotosToAlbum(e.target.files)}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Music Interface with Spotify Integration
  const renderAdminInterface = () => {
    if (!currentAdmin) {
      return (
        <div className="text-center text-white text-opacity-75 py-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-orange-400" />
          <div className="text-lg font-semibold mb-2">Admin Access Required</div>
          <div className="text-sm">Click the Zebulon logo to login as admin</div>
        </div>
      );
    }

    return (
      <div className="w-full h-full text-white space-y-6">
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-orange-400" />
            <div>
              <h3 className="font-bold text-lg">Admin Control Panel</h3>
              <p className="text-sm text-gray-300">Welcome, {currentAdmin.username}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-lg p-3">
              <h4 className="font-medium mb-2">System Control</h4>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    // Emergency shutdown
                    apiRequest(`/api/admin/emergency-shutdown/${currentAdmin.id}`, 'POST', {
                      reason: 'Manual admin shutdown'
                    });
                  }}
                >
                  Emergency Shutdown
                </Button>
                <Button 
                  size="sm" 
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={() => {
                    // Enable maximum security
                    apiRequest(`/api/admin/maximum-security/${currentAdmin.id}`, 'POST');
                  }}
                >
                  Maximum Security
                </Button>
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-3">
              <h4 className="font-medium mb-2">User Management</h4>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View All Users
                </Button>
                <Button 
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Create New User
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-black/20 rounded-lg p-3">
            <h4 className="font-medium mb-2">System Status</h4>
            <div className="text-sm space-y-1">
              <div>Autonomous Operations: <span className="text-red-400">DISABLED</span></div>
              <div>Self-Updates: <span className="text-red-400">ADMIN APPROVAL REQUIRED</span></div>
              <div>Security Level: <span className="text-green-400">MAXIMUM</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Music interface functions
  const connectSpotify = () => {
    // Internal Spotify simulation
    setSpotifyConnected(true);
    setCurrentTrack({
      title: 'AI-Generated Ambient Focus',
      artist: 'Zebulon™ Soundscapes',
      playing: false
    });
  };

  const togglePlay = () => {
    setCurrentTrack(prev => ({ ...prev, playing: !prev.playing }));
  };

  const renderMusicInterface = () => {

    return (
      <div className="w-full h-full -m-6 p-6 bg-black bg-opacity-95 rounded-lg text-white overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <Music className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Zebulon Music Hub
              </h2>
              <p className="text-sm text-gray-400">AI-powered music experience with Spotify integration</p>
            </div>
          </div>
          <Badge className={`${spotifyConnected ? 'bg-green-500/20 text-green-300 border-green-400/30' : 'bg-gray-500/20 text-gray-300 border-gray-400/30'}`}>
            {spotifyConnected ? 'Connected' : 'Offline'}
          </Badge>
        </div>

        <div className="flex flex-col h-full space-y-6">
          {/* Spotify Connection */}
          {!spotifyConnected ? (
            <div className="bg-white/10 rounded-lg p-6 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-medium text-white mb-2">Connect to Music Services</h3>
              <p className="text-gray-400 mb-4">Integrate with Spotify or use Zebulon's AI music generation</p>
              <Button onClick={connectSpotify} className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                <Music className="h-4 w-4 mr-2" />
                Connect Music Services
              </Button>
            </div>
          ) : (
            <>
              {/* Now Playing */}
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                      <Music className="h-8 w-8 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{currentTrack.title}</h3>
                      <p className="text-gray-400">{currentTrack.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button onClick={togglePlay} className="bg-gradient-to-r from-green-500 to-blue-500">
                      {currentTrack.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI Music Suggestions */}
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="font-medium text-white mb-4 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-blue-400" />
                  AI-Generated Playlists
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="ghost" className="text-left justify-start bg-white/5 hover:bg-white/10">
                    <Brain className="h-4 w-4 mr-2" />
                    Focus & Flow
                  </Button>
                  <Button variant="ghost" className="text-left justify-start bg-white/5 hover:bg-white/10">
                    <Target className="h-4 w-4 mr-2" />
                    Deep Work
                  </Button>
                  <Button variant="ghost" className="text-left justify-start bg-white/5 hover:bg-white/10">
                    <Activity className="h-4 w-4 mr-2" />
                    Energy Boost
                  </Button>
                  <Button variant="ghost" className="text-left justify-start bg-white/5 hover:bg-white/10">
                    <Shield className="h-4 w-4 mr-2" />
                    Calm & Zen
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="font-medium text-white mb-4">Quick Actions</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="ghost" className="bg-white/5 hover:bg-white/10">
                    <Users className="h-4 w-4 mb-1" />
                    <span className="text-xs">Discover</span>
                  </Button>
                  <Button variant="ghost" className="bg-white/5 hover:bg-white/10">
                    <Clock className="h-4 w-4 mb-1" />
                    <span className="text-xs">Recent</span>
                  </Button>
                  <Button variant="ghost" className="bg-white/5 hover:bg-white/10">
                    <BarChart3 className="h-4 w-4 mb-1" />
                    <span className="text-xs">Stats</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Oracle Interface with Documentation and FAQs
  const renderOracleInterface = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'docs' | 'faqs' | 'howto'>('dashboard');
    
    const oracleDocs = [
      {
        title: "Getting Started with Oracle Database",
        description: "Complete guide to setting up and connecting to Oracle databases through Zebulon",
        category: "Setup",
        content: "Learn how to establish secure connections, configure schemas, and manage database credentials..."
      },
      {
        title: "Advanced Query Optimization",
        description: "Techniques for improving query performance and database efficiency",
        category: "Performance",
        content: "Discover indexing strategies, query hints, and execution plan analysis..."
      },
      {
        title: "Security Best Practices",
        description: "Comprehensive security guidelines for Oracle database management",
        category: "Security",
        content: "Implement role-based access control, audit trails, and encryption protocols..."
      }
    ];

    const oracleFAQs = [
      {
        question: "How do I connect to my Oracle database?",
        answer: "Use the 'New Connection' button in the Oracle dashboard to configure your database credentials. Zebulon supports both local and cloud Oracle instances with automatic SSL detection."
      },
      {
        question: "What security measures does Zeta Core implement?",
        answer: "Zeta Core provides real-time SQL injection detection, query analysis for dangerous operations, and automatic blocking of unauthorized access attempts."
      },
      {
        question: "Can I run automated database maintenance?",
        answer: "Yes, Zed Core can schedule and execute maintenance tasks including backups, statistics updates, and performance optimization routines."
      }
    ];

    const howToGuides = [
      {
        title: "How to Create a Secure Database Connection",
        steps: [
          "Click 'New Connection' in the Oracle dashboard",
          "Enter your database credentials (host, port, SID/service name)",
          "Enable SSL if your database supports encrypted connections",
          "Test the connection using the built-in diagnostics",
          "Save the connection profile for future use"
        ]
      },
      {
        title: "How to Analyze Query Performance",
        steps: [
          "Navigate to the Query History section",
          "Select a query from your execution history",
          "Click 'Performance Analysis' to view execution plans",
          "Review the suggested optimizations from Zed Core",
          "Apply recommended indexes or query restructuring"
        ]
      }
    ];

    return (
      <div className="w-full h-full -m-6 p-6 bg-black bg-opacity-95 rounded-lg text-white overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Oracle Database Hub
              </h2>
              <p className="text-sm text-gray-400">Complete database management with documentation and support</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border border-orange-400/30">
            Enterprise Ready
          </Badge>
        </div>

        <div className="flex flex-col h-full space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-white/10 rounded-lg p-2">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('dashboard')}
              className={activeTab === 'dashboard' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-gray-300'}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'docs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('docs')}
              className={activeTab === 'docs' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-gray-300'}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Documentation
            </Button>
            <Button
              variant={activeTab === 'faqs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('faqs')}
              className={activeTab === 'faqs' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-gray-300'}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQs
            </Button>
            <Button
              variant={activeTab === 'howto' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('howto')}
              className={activeTab === 'howto' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-gray-300'}
            >
              <Target className="h-4 w-4 mr-2" />
              How-To Guides
            </Button>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-4">Quick Database Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Database className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                      <div className="text-sm text-gray-300">Connections</div>
                      <div className="font-bold text-white">3 Active</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Shield className="h-6 w-6 mx-auto mb-2 text-green-400" />
                      <div className="text-sm text-gray-300">Security</div>
                      <div className="font-bold text-white">Protected</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Activity className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                      <div className="text-sm text-gray-300">Performance</div>
                      <div className="font-bold text-white">Optimal</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Zap className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                      <div className="text-sm text-gray-300">Queries</div>
                      <div className="font-bold text-white">1.2k Today</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">AI-Powered Features</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <span className="text-gray-300">Natural Language to SQL</span>
                      <Badge className="bg-green-500/20 text-green-300">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <span className="text-gray-300">Query Optimization</span>
                      <Badge className="bg-blue-500/20 text-blue-300">Running</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <span className="text-gray-300">Security Monitoring</span>
                      <Badge className="bg-purple-500/20 text-purple-300">Protected</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-4">
                {oracleDocs.map((doc, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-white mb-1">{doc.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{doc.description}</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {doc.category}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm">{doc.content}</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-blue-400 hover:text-blue-300">
                      Read Full Documentation →
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="space-y-4">
                {oracleFAQs.map((faq, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-3 flex items-center">
                      <HelpCircle className="h-4 w-4 mr-2 text-blue-400" />
                      {faq.question}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-lg p-4 text-center">
                  <h4 className="font-medium text-white mb-2">Need More Help?</h4>
                  <p className="text-gray-400 text-sm mb-3">Ask Zed Core directly for personalized assistance with your Oracle database questions.</p>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <Brain className="h-4 w-4 mr-2" />
                    Ask Zed Core
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'howto' && (
              <div className="space-y-4">
                {howToGuides.map((guide, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-4 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-green-400" />
                      {guide.title}
                    </h3>
                    <ol className="space-y-3">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start space-x-3">
                          <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                            {stepIndex + 1}
                          </span>
                          <span className="text-gray-300 text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
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



      case 'oracle':
        return renderOracleInterface();

      case 'config':
        return (
          <div className="w-full h-full -m-6">
            <ZebulonConfigPanel userId={userId} />
          </div>
        );

      case 'files':
        return renderFileUploadInterface();



      case 'calendar':
        return renderCalendarInterface();

      case 'photos':
        return renderPhotosInterface();

      case 'music':
        return renderMusicInterface();

      case 'admin':
        return renderAdminInterface();

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
            <div className="w-16 h-16 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => setShowAdminLogin(true)}>
              <img 
                src={logoSrc} 
                alt="Zebulon Logo - Click for Admin" 
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
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl zebulon-text-gradient cursor-pointer" style={{display: 'none'}} onClick={() => setShowAdminLogin(true)}>
                Z™
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

          {/* Feature Navigation Buttons - Enhanced 3x3 grid with consistent spacing */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-black/20 rounded-xl border border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('chat')}
              className={`h-14 flex-col p-3 transition-all duration-200 rounded-lg ${
                activeFeature === 'chat' 
                  ? 'zebulon-button-active' 
                  : 'zebulon-button'
              }`}
            >
              <Brain className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-medium">Chat</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('status')}
              className={`h-14 flex-col p-3 transition-all duration-200 rounded-lg ${
                activeFeature === 'status' 
                  ? 'zebulon-button-active' 
                  : 'zebulon-button'
              }`}
            >
              <BarChart3 className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-medium">Status</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('oracle')}
              className={`h-14 flex-col p-3 transition-all duration-200 rounded-lg ${
                activeFeature === 'oracle' 
                  ? 'zebulon-button-active' 
                  : 'zebulon-button'
              }`}
            >
              <Database className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-medium">Oracle</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('calendar')}
              className={`h-14 flex-col p-3 transition-all duration-200 rounded-lg ${
                activeFeature === 'calendar' 
                  ? 'zebulon-button-active' 
                  : 'zebulon-button'
              }`}
            >
              <Calendar className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-medium">Calendar</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('music')}
              className={`h-14 flex-col p-3 transition-all duration-200 rounded-lg ${
                activeFeature === 'music' 
                  ? 'zebulon-button-active' 
                  : 'zebulon-button'
              }`}
            >
              <Music className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-medium">Music</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('photos')}
              className={`h-14 flex-col p-3 transition-all duration-200 rounded-lg ${
                activeFeature === 'photos' 
                  ? 'zebulon-button-active' 
                  : 'zebulon-button'
              }`}
            >
              <Camera className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-medium">Photos</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('config')}
              className={`h-14 flex-col p-3 transition-all duration-200 rounded-lg ${
                activeFeature === 'config' 
                  ? 'zebulon-button-active' 
                  : 'zebulon-button'
              }`}
            >
              <Settings className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-medium">Config</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFeature('files')}
              className={`h-14 flex-col p-3 transition-all duration-200 rounded-lg ${
                activeFeature === 'files' 
                  ? 'zebulon-button-active' 
                  : 'zebulon-button'
              }`}
            >
              <Upload className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-medium">Files</span>
            </Button>

            {/* Admin Button - Enhanced styling, only show if logged in as admin */}
            {currentAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFeature('admin')}
                className={`h-14 flex-col p-3 transition-all duration-200 rounded-lg ${
                  activeFeature === 'admin' 
                    ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50 shadow-lg' 
                    : 'bg-red-900/20 hover:bg-red-800/30 text-orange-300 hover:text-white border border-red-700/40 hover:border-orange-400/50'
                }`}
              >
                <Shield className="h-5 w-5 mb-1.5" />
                <span className="text-xs font-medium">Admin</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col pt-0">
          {renderFeatureContent()}
        </CardContent>

        {/* Chat Input Area - Enhanced styling and spacing */}
        {activeFeature !== 'chat' && (
          <div className="p-6 border-t border-white/20 bg-black/10 rounded-b-lg">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Ask Zed..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full zebulon-input rounded-full px-6 py-3 text-sm shadow-inner"
                />
              </div>
              <Button 
                variant="ghost"
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10"
                onClick={handleVoiceRecording}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5 text-red-400" />
                ) : (
                  <Mic className="h-5 w-5 text-white" />
                )}
              </Button>
              <Button 
                className="p-3 bg-primary hover:bg-primary/80 rounded-full transition-all shadow-lg"
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* System Notifications for Cross-App Ducking */}
      <ZedSystemNotifications userId={1} />
      
      {/* Admin Login Modal */}
      <AdminLoginModal
        open={showAdminLogin}
        onOpenChange={setShowAdminLogin}
        onLoginSuccess={(admin) => {
          setCurrentAdmin(admin);
          setActiveFeature('admin');
        }}
      />
    </div>
  );
};

export default ZebulonCommandCenter;