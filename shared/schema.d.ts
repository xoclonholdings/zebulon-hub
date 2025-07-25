export interface User {
    id: number;
    username: string;
    passwordHash: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ChatMessage {
    id: number;
    userId: number;
    message: string;
    aiCore: string;
    createdAt: Date;
}
export interface SystemStatus {
    id: number;
    component: string;
    status: string;
    lastChecked: Date;
    details?: string;
    responseTime?: number;
}
export interface OracleMemory {
    id: number;
    label: string;
    description: string;
    content: string;
    memoryType: 'workflow' | 'response' | 'repair' | 'security' | 'data-tag' | 'custom';
    status: 'active' | 'locked';
    createdBy: string;
    createdAt: Date;
    lastModified: Date;
}
export interface InsertUser {
    username: string;
    passwordHash: string;
    role?: string;
}
export interface InsertChatMessage {
    userId: number;
    message: string;
    aiCore?: string;
}
export interface InsertOracleMemory {
    label: string;
    description: string;
    content: string;
    memoryType: 'workflow' | 'response' | 'repair' | 'security' | 'data-tag' | 'custom';
    status?: 'active' | 'locked';
    createdBy: string;
}
