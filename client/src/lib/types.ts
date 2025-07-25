// Shared types for the Zebulon AI System

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}



export interface SystemStatus {
  id: number;
  component: string;
  status: 'operational' | 'warning' | 'error';
  lastChecked: string;
  details: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}