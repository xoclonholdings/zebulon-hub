export interface WeatherData {
  location: string;
  temperature: string;
  condition: string;
  high: string;
  low: string;
  humidity: string;
  icon: string;
}

export interface OracleStatus {
  connected: boolean;
  activeConnections: number;
  maxConnections: number;
  responseTime: number;
  memoryUsage: number;
  uptime: string;
}

export interface SystemStatus {
  oracle: OracleStatus;
  fantasma: {
    active: boolean;
    lastScan: string;
    threatsDetected: number;
  };
  zeta: {
    monitoring: boolean;
    alertsActive: number;
    vaultSecure: boolean;
  };
  apiConnections: number;
}

export interface ChatMessage {
  id: number;
  message: string;
  response?: string | null;
  aiCore: string;
  timestamp: Date;
  sender: 'user' | 'ai';
}

export interface UserProfile {
  id: number;
  username: string;
  codename: string;
  role: string;
  theme: string;
  voiceId?: string | null;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
}

export interface Note {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  color: string;
}

export interface MusicTrack {
  title: string;
  artist: string;
  duration: string;
  currentTime: string;
  isPlaying: boolean;
  progress: number;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface VoiceRecognitionResult {
  recognized: boolean;
  confidence: number;
  userId?: number;
  message?: string;
}

export interface WebSocketMessage {
  type: 'chat' | 'voice_command' | 'status_update' | 'chat_response' | 'voice_response' | 'error';
  [key: string]: any;
}
