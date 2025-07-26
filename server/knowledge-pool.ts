import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Knowledge Pool Configuration
interface KnowledgeConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  juliusApiKey?: string;
  ollamaEndpoint?: string;
  outputPath?: string;
  maxRetries?: number;
  timeout?: number;
}

interface KnowledgeSource {
  name: string;
  core: string;
  status: 'active' | 'failed' | 'unavailable';
  response?: string;
  error?: string;
  timestamp: string;
  responseTime?: number;
}

interface KnowledgePoolResult {
  query: string;
  sources: KnowledgeSource[];
  primaryResponse: string;
  fallbackUsed: boolean;
  aggregatedKnowledge: string;
  timestamp: string;
  success: boolean;
}

class KnowledgePoolManager {
  private config: Required<KnowledgeConfig>;
  private openai?: OpenAI;
  private anthropic?: Anthropic;

  constructor(config: KnowledgeConfig = {}) {
    this.config = {
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || '',
      anthropicApiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
      juliusApiKey: config.juliusApiKey || process.env.JULIUS_AI_API_KEY || '',
      ollamaEndpoint: config.ollamaEndpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
      outputPath: config.outputPath || path.join(__dirname, '../oracle_feed.json'),
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000
    };

    // Initialize API clients if keys are available
    if (this.config.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: this.config.openaiApiKey });
    }
    if (this.config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: this.config.anthropicApiKey });
    }
  }

  /**
   * Main function to pool knowledge from all available sources
   */
  async poolKnowledge(query: string, targetCore?: 'zed' | 'zync' | 'zeta'): Promise<KnowledgePoolResult> {
    const startTime = Date.now();
    const sources: KnowledgeSource[] = [];
    let primaryResponse = '';
    let fallbackUsed = false;

    console.log(`🔮 Pooling knowledge for query: "${query}"`);
    if (targetCore) {
      console.log(`🎯 Target core: ${targetCore.toUpperCase()}`);
    }

    // Attempt to query each source in parallel
    const sourcePromises = [
      this.queryOpenAI(query),
      this.queryAnthropic(query),
      this.queryJuliusAI(query),
      this.queryOllama(query)
    ];

    const results = await Promise.allSettled(sourcePromises);
    
    // Process results and build source array
    results.forEach((result, index) => {
      const sourceNames = ['OpenAI', 'Anthropic', 'Julius AI', 'Ollama'];
      const coreNames = ['zed', 'zync', 'zeta', 'local'];
      
      if (result.status === 'fulfilled' && result.value) {
        sources.push({
          name: sourceNames[index],
          core: coreNames[index],
          status: 'active',
          response: result.value,
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime
        });
      } else {
        sources.push({
          name: sourceNames[index],
          core: coreNames[index],
          status: 'failed',
          error: result.status === 'rejected' ? (result.reason as Error)?.message || 'Unknown error' : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Apply fallback logic to determine primary response
    const fallbackResult = this.applyFallbackLogic(sources, targetCore);
    primaryResponse = fallbackResult.response;
    fallbackUsed = fallbackResult.fallbackUsed;

    // Generate aggregated knowledge
    const aggregatedKnowledge = this.aggregateKnowledge(sources);

    // Build final result
    const result: KnowledgePoolResult = {
      query,
      sources,
      primaryResponse,
      fallbackUsed,
      aggregatedKnowledge,
      timestamp: new Date().toISOString(),
      success: sources.some(s => s.status === 'active')
    };

    // Store results offline
    await this.storeKnowledge(result);

    console.log(`✅ Knowledge pooling completed. Active sources: ${sources.filter(s => s.status === 'active').length}/4`);
    
    return result;
  }

  /**
   * Query OpenAI (Zed Core)
   */
  private async queryOpenAI(query: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are Zed Core, an advanced AI assistant. Provide concise, helpful responses.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  }

  /**
   * Query Anthropic (Zync Core)
   */
  private async queryAnthropic(query: string): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are Zync Core, a development-focused AI assistant. ${query}`
        }
      ]
    });

    return message.content[0]?.type === 'text' ? message.content[0].text : 'No response generated';
  }

  /**
   * Query Julius AI (Zeta Core)
   */
  private async queryJuliusAI(query: string): Promise<string> {
    if (!this.config.juliusApiKey) {
      throw new Error('Julius AI API key not configured');
    }

    // Julius AI API implementation (adjust based on actual API)
    const response = await fetch('https://api.julius.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.juliusApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'julius-latest',
        messages: [
          {
            role: 'system',
            content: 'You are Zeta Core, a security and analysis-focused AI assistant.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Julius AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated';
  }

  /**
   * Query Ollama (Local Fallback)
   */
  private async queryOllama(query: string): Promise<string> {
    try {
      const response = await fetch(`${this.config.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `You are a local AI assistant providing backup responses. ${query}`,
          stream: false,
          options: {
            num_predict: 300
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'No response generated';
    } catch (error) {
      throw new Error(`Ollama connection failed: ${error.message}`);
    }
  }

  /**
   * Apply fallback logic to determine primary response
   */
  private applyFallbackLogic(sources: KnowledgeSource[], targetCore?: string): { response: string; fallbackUsed: boolean } {
    // Priority order based on target core or default hierarchy
    const priorityOrder = targetCore 
      ? this.getCoreOrder(targetCore)
      : ['zed', 'zync', 'zeta', 'local'];

    for (const core of priorityOrder) {
      const source = sources.find(s => s.core === core && s.status === 'active');
      if (source?.response) {
        return {
          response: source.response,
          fallbackUsed: core !== priorityOrder[0]
        };
      }
    }

    return {
      response: 'All knowledge sources unavailable. Please check API configurations.',
      fallbackUsed: true
    };
  }

  /**
   * Get core priority order based on target
   */
  private getCoreOrder(targetCore: string): string[] {
    const orders: Record<string, string[]> = {
      zed: ['zed', 'zync', 'zeta', 'local'],
      zync: ['zync', 'zed', 'zeta', 'local'],
      zeta: ['zeta', 'zed', 'zync', 'local']
    };
    return orders[targetCore] || ['zed', 'zync', 'zeta', 'local'];
  }

  /**
   * Aggregate knowledge from all successful sources
   */
  private aggregateKnowledge(sources: KnowledgeSource[]): string {
    const activeSources = sources.filter(s => s.status === 'active' && s.response);
    
    if (activeSources.length === 0) {
      return 'No knowledge sources available.';
    }

    if (activeSources.length === 1) {
      return activeSources[0].response!;
    }

    let aggregated = 'Combined Knowledge Summary:\n\n';
    activeSources.forEach((source, index) => {
      aggregated += `**${source.name} (${source.core.toUpperCase()} Core):**\n`;
      aggregated += `${source.response}\n\n`;
    });

    return aggregated;
  }

  /**
   * Store knowledge results to file for offline access
   */
  private async storeKnowledge(result: KnowledgePoolResult): Promise<void> {
    try {
      // Read existing data
      let existingData: KnowledgePoolResult[] = [];
      try {
        const fileContent = await fs.readFile(this.config.outputPath, 'utf-8');
        existingData = JSON.parse(fileContent);
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
        existingData = [];
      }

      // Add new result
      existingData.unshift(result); // Add to beginning for chronological order

      // Keep only last 100 entries to prevent file from growing too large
      if (existingData.length > 100) {
        existingData = existingData.slice(0, 100);
      }

      // Write back to file
      await fs.writeFile(this.config.outputPath, JSON.stringify(existingData, null, 2));

      // Also create a markdown version for easier reading
      await this.createMarkdownFeed(existingData);

    } catch (error) {
      console.error('Failed to store knowledge:', (error as Error).message);
    }
  }

  /**
   * Create human-readable markdown version
   */
  private async createMarkdownFeed(data: KnowledgePoolResult[]): Promise<void> {
    const mdPath = this.config.outputPath.replace('.json', '.md');
    
    let markdown = '# Zebulon Oracle Knowledge Feed\n\n';
    markdown += `Last updated: ${new Date().toISOString()}\n\n`;

    data.slice(0, 10).forEach((result, index) => {
      markdown += `## Query ${index + 1}: ${result.query}\n`;
      markdown += `**Timestamp:** ${result.timestamp}\n`;
      markdown += `**Success:** ${result.success ? '✅' : '❌'}\n`;
      markdown += `**Fallback Used:** ${result.fallbackUsed ? '🔄' : '🎯'}\n\n`;

      markdown += `### Primary Response\n${result.primaryResponse}\n\n`;

      if (result.sources.length > 1) {
        markdown += `### Source Status\n`;
        result.sources.forEach(source => {
          const status = source.status === 'active' ? '✅' : '❌';
          markdown += `- **${source.name} (${source.core.toUpperCase()}):** ${status}\n`;
        });
        markdown += '\n';
      }

      markdown += '---\n\n';
    });

    await fs.writeFile(mdPath, markdown);
  }

  /**
   * Update API configuration without restart
   */
  updateConfig(newConfig: Partial<KnowledgeConfig>): void {
    Object.assign(this.config, newConfig);
    
    // Reinitialize clients if keys changed
    if (newConfig.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: newConfig.openaiApiKey });
    }
    if (newConfig.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: newConfig.anthropicApiKey });
    }
  }

  /**
   * Get current configuration status
   */
  getStatus(): { [key: string]: boolean } {
    return {
      openai: !!this.config.openaiApiKey,
      anthropic: !!this.config.anthropicApiKey,
      juliusAI: !!this.config.juliusApiKey,
      ollama: true // Always assume available for local fallback
    };
  }
}

// Export singleton instance
export const knowledgePool = new KnowledgePoolManager();

// Export types for external use
export type { KnowledgePoolResult, KnowledgeSource, KnowledgeConfig };