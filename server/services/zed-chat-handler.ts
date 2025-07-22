import { zedAuthService } from "./zed-authorization";

interface ChatContext {
  userId: number;
  sessionId?: string;
}

export interface ZedChatResponse {
  response: string;
  requiresAuthorization?: boolean;
  authorizationId?: number;
  processType?: string;
  confidence: number;
  suggestions?: string[];
}

export class ZedChatHandler {
  async processMessage(message: string, context: ChatContext): Promise<ZedChatResponse> {
    const { userId } = context;
    
    // Get user configuration to understand permissions and behavior settings
    const config = await zedAuthService.getUserConfig(userId);
    
    // Analyze the user's message to determine intent
    const intent = this.analyzeIntent(message);
    
    // Check if this action requires authorization
    const needsAuth = await this.checkAuthorizationRequired(intent, userId);
    
    if (needsAuth) {
      // Request authorization for the action
      const authorization = await zedAuthService.requestAuthorization(
        userId,
        intent.processType,
        intent.description,
        intent.parameters,
        intent.priority
      );
      
      return {
        response: `I understand you want me to ${intent.description}. This action requires your approval for security. I've created authorization request #${authorization.id}. Please review it in your configuration panel.`,
        requiresAuthorization: true,
        authorizationId: authorization.id,
        processType: intent.processType,
        confidence: intent.confidence,
        suggestions: [
          "Open configuration panel to approve",
          "Modify your permissions to auto-approve similar requests",
          "Ask me to explain what this action will do"
        ]
      };
    }
    
    // Process the message directly if no authorization needed
    const response = await this.generateResponse(message, intent, config);
    
    return {
      response: response.text,
      confidence: intent.confidence,
      suggestions: response.suggestions
    };
  }

  private analyzeIntent(message: string) {
    const lowerMessage = message.toLowerCase();
    
    // Database operations
    if (lowerMessage.includes('create table') || lowerMessage.includes('drop table')) {
      return {
        processType: 'table_creation',
        description: 'modify database schema',
        parameters: { query: message },
        priority: 'high' as const,
        confidence: 0.9
      };
    }
    
    if (lowerMessage.includes('delete') || lowerMessage.includes('update') || lowerMessage.includes('insert')) {
      return {
        processType: 'data_modification',
        description: 'modify database data',
        parameters: { query: message },
        priority: 'medium' as const,
        confidence: 0.85
      };
    }
    
    if (lowerMessage.includes('select') || lowerMessage.includes('show') || lowerMessage.includes('describe')) {
      return {
        processType: 'query_execution',
        description: 'execute database query',
        parameters: { query: message },
        priority: 'low' as const,
        confidence: 0.8
      };
    }
    
    // File operations
    if (lowerMessage.includes('create file') || lowerMessage.includes('write file')) {
      return {
        processType: 'file_operation',
        description: 'create or modify files',
        parameters: { operation: 'write', content: message },
        priority: 'medium' as const,
        confidence: 0.75
      };
    }
    
    // System operations
    if (lowerMessage.includes('restart') || lowerMessage.includes('shutdown') || lowerMessage.includes('config')) {
      return {
        processType: 'system_modification',
        description: 'modify system settings',
        parameters: { action: message },
        priority: 'high' as const,
        confidence: 0.85
      };
    }
    
    // Default to general conversation
    return {
      processType: 'general_conversation',
      description: 'general conversation',
      parameters: { message },
      priority: 'low' as const,
      confidence: 0.6
    };
  }

  private async checkAuthorizationRequired(intent: any, userId: number): Promise<boolean> {
    const hasPermission = await zedAuthService.checkPermission(userId, this.mapProcessToPermission(intent.processType));
    
    // If user doesn't have permission, always require authorization
    if (!hasPermission) {
      return true;
    }
    
    // Check user's behavior settings
    const config = await zedAuthService.getUserConfig(userId);
    
    // If user requires confirmation for all actions
    if (config.zedCore.behavior.requireConfirmation) {
      // Exception: auto-execute simple queries if enabled
      if (intent.processType === 'query_execution' && config.zedCore.behavior.autoExecuteSimpleQueries) {
        return false;
      }
      return true;
    }
    
    // For high-priority actions, always require authorization
    if (intent.priority === 'high' || intent.priority === 'critical') {
      return true;
    }
    
    return false;
  }

  private mapProcessToPermission(processType: string): string {
    const mapping: Record<string, string> = {
      'table_creation': 'create_table',
      'data_modification': 'modify_data', 
      'query_execution': 'execute_query',
      'file_operation': 'write_files',
      'system_modification': 'modify_settings',
      'user_management': 'manage_users',
      'oracle_connection': 'connect_oracle'
    };
    
    return mapping[processType] || 'access_system_status';
  }

  private async generateResponse(message: string, intent: any, config: any) {
    // Generate contextual response based on intent and user preferences
    const responseStyle = config.zedCore.aiSettings.responseStyle;
    
    let baseResponse = "";
    let suggestions: string[] = [];
    
    switch (intent.processType) {
      case 'query_execution':
        baseResponse = this.generateQueryResponse(message, responseStyle);
        suggestions = [
          "Show me the table structure first",
          "Explain what this query does",
          "Run this query with a limit"
        ];
        break;
        
      case 'data_modification':
        baseResponse = this.generateModificationResponse(message, responseStyle);
        suggestions = [
          "Show me what will be changed first",
          "Create a backup before modifying",
          "Test this on a smaller dataset"
        ];
        break;
        
      case 'general_conversation':
        baseResponse = this.generateConversationResponse(message, responseStyle);
        suggestions = [
          "Tell me more about Oracle operations",
          "Show system status",
          "Help me with database queries"
        ];
        break;
        
      default:
        baseResponse = "I understand your request. How would you like me to proceed?";
        suggestions = [
          "Give me more details",
          "Show available options",
          "Explain the process"
        ];
    }
    
    return { text: baseResponse, suggestions };
  }

  private generateQueryResponse(message: string, style: string): string {
    switch (style) {
      case 'technical':
        return `Analyzing your SQL query request. I'll execute this query against the Oracle database and return the results with execution metadata.`;
      case 'friendly':
        return `I'd be happy to help you with that database query! Let me run it for you and show you the results.`;
      case 'concise':
        return `Executing query...`;
      default:
        return `I'll execute your database query and provide the results with relevant details.`;
    }
  }

  private generateModificationResponse(message: string, style: string): string {
    switch (style) {
      case 'technical':
        return `This operation will modify database records. I'll validate the query syntax, check constraints, and execute the transaction with proper error handling.`;
      case 'friendly':
        return `I can help you modify the database records. Let me make sure everything looks good and then apply the changes safely.`;
      case 'concise':
        return `Modifying data...`;
      default:
        return `I'll carefully modify the database records as requested, ensuring data integrity throughout the process.`;
    }
  }

  private generateConversationResponse(message: string, style: string): string {
    switch (style) {
      case 'technical':
        return `I'm Zed Core, your Oracle database management AI. I can execute queries, manage connections, analyze performance, and help optimize your database operations.`;
      case 'friendly':
        return `Hi! I'm Zed, your AI assistant for Oracle database management. I'm here to help you with queries, data analysis, and keeping your systems running smoothly. What would you like to work on?`;
      case 'concise':
        return `Zed Core ready. How can I assist with Oracle operations?`;
      default:
        return `I'm Zed Core, your AI assistant for Oracle database operations. I can help with queries, data management, system monitoring, and more. What would you like to do?`;
    }
  }
}

export const zedChatHandler = new ZedChatHandler();