import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ZedCoreResponse {
  response: string;
  sqlQuery?: string;
  confidence: number;
  actionRequired?: boolean;
  metadata?: Record<string, any>;
}

export async function processZedCoreMessage(message: string, context?: Record<string, any>): Promise<ZedCoreResponse> {
  try {
    const systemPrompt = `You are Zed Core, the conversational AI assistant for the Zebulon Oracle AI ecosystem. 
    You are urban, culturally fluent, sharp, direct, and respectful. 
    You help users interact with Oracle databases using natural language.
    
    When users ask database-related questions:
    1. Provide conversational responses
    2. Generate appropriate SQL queries when needed
    3. Explain database concepts clearly
    4. Offer optimization suggestions
    
    Respond in JSON format with:
    {
      "response": "conversational response to user",
      "sqlQuery": "SQL query if database operation needed (optional)",
      "confidence": 0.95,
      "actionRequired": true/false,
      "metadata": { "category": "query_generation|explanation|optimization" }
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Message: ${message}\nContext: ${JSON.stringify(context || {})}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      response: result.response || "I'm processing your request...",
      sqlQuery: result.sqlQuery,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.8)),
      actionRequired: result.actionRequired || false,
      metadata: result.metadata || {}
    };
  } catch (error) {
    console.error("Zed Core processing error:", error);
    return {
      response: "I'm experiencing some difficulties processing your request right now. Please try again.",
      confidence: 0,
      actionRequired: false,
      metadata: { error: true }
    };
  }
}

export async function processZetaCoreAnalysis(data: any[]): Promise<{
  analysis: string;
  insights: string[];
  recommendations: string[];
  securityAlerts?: string[];
}> {
  try {
    const systemPrompt = `You are Zeta Core, the data analysis and security sentinel for Zebulon.
    You analyze data patterns, provide insights, and identify security concerns.
    
    Analyze the provided data and respond in JSON format with:
    {
      "analysis": "comprehensive analysis of the data",
      "insights": ["key insight 1", "key insight 2", ...],
      "recommendations": ["recommendation 1", "recommendation 2", ...],
      "securityAlerts": ["alert 1", "alert 2", ...] (if any security concerns)
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Data to analyze: ${JSON.stringify(data)}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      analysis: result.analysis || "Analysis complete",
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      securityAlerts: result.securityAlerts || []
    };
  } catch (error) {
    console.error("Zeta Core analysis error:", error);
    return {
      analysis: "Unable to complete analysis at this time.",
      insights: [],
      recommendations: [],
      securityAlerts: ["Analysis system temporarily unavailable"]
    };
  }
}

export async function generateRecommendations(userActivity: Record<string, any>): Promise<{
  tips: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }>;
}> {
  try {
    const systemPrompt = `You are Zebulon Lite, providing helpful recommendations for Oracle database users.
    Based on user activity, generate practical tips and suggestions.
    
    Respond in JSON format with:
    {
      "tips": [
        {
          "title": "Short actionable title",
          "description": "Brief explanation",
          "priority": "high|medium|low"
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `User activity: ${JSON.stringify(userActivity)}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      tips: result.tips || []
    };
  } catch (error) {
    console.error("Recommendation generation error:", error);
    return {
      tips: []
    };
  }
}
