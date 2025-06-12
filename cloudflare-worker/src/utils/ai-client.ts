/**
 * Cloudflare Workers AI Client
 * 
 * Provides OpenAI-compatible interface for Cloudflare Workers AI
 * Supports both local REST API and Cloudflare bindings
 */

import OpenAI from 'openai';
import type { Env } from '@/types/env.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class CloudflareAIClient {
  private openai: OpenAI;
  private env: Env;
  private isLocal: boolean;

  constructor(env: Env, isLocal = false) {
    this.env = env;
    this.isLocal = isLocal;
    
    if (isLocal) {
      // Local development - use REST API
      this.openai = new OpenAI({
        apiKey: env.CLOUDFLARE_API_TOKEN,
        baseURL: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
      });
    } else {
      // Production - use Cloudflare bindings
      this.openai = new OpenAI({
        apiKey: 'dummy-key', // Not used with bindings
        baseURL: 'https://gateway.ai.cloudflare.com/v1',
      });
    }
  }

  async chat(messages: ChatMessage[], agentName?: string): Promise<ChatResponse> {
    try {
      const systemPrompt = this.getSystemPrompt(agentName);
      const fullMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages
      ];

      if (this.isLocal) {
        return await this.chatLocal(fullMessages);
      } else {
        return await this.chatWithBindings(fullMessages);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  private async chatLocal(messages: ChatMessage[]): Promise<ChatResponse> {
    const response = await this.openai.chat.completions.create({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return {
      id: response.id,
      choices: response.choices.map(choice => ({
        message: {
          role: 'assistant' as const,
          content: choice.message?.content || 'No response',
        },
        finish_reason: choice.finish_reason || 'stop',
      })),
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  private async chatWithBindings(messages: ChatMessage[]): Promise<ChatResponse> {
    // Use Cloudflare AI bindings directly
    const aiResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    // Convert Cloudflare AI response to OpenAI format
    const response = aiResponse as any;
    
    return {
      id: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      choices: [{
        message: {
          role: 'assistant' as const,
          content: response.response || response.result || 'No response',
        },
        finish_reason: 'stop',
      }],
      usage: response.usage,
    };
  }

  private getSystemPrompt(agentName?: string): string {
    const basePrompt = `You are a helpful AI assistant integrated into the Selfie agentic build system. You can help with coding questions, provide explanations, and assist with development tasks.`;

    const agentPrompts: Record<string, string> = {
      alice: `${basePrompt} You are Alice, focused on monitoring and managing Selfie agent activities. You help with system monitoring, task creation, and GitHub issue integration.`,
      bob: `${basePrompt} You are Bob, the coordination center manager. You orchestrate multiple Selfie instances, manage development workflows, and oversee system health.`,
    };

    return agentPrompts[agentName || ''] || basePrompt;
  }

  // Function calling support for the Llama model
  async chatWithFunctions(
    messages: ChatMessage[], 
    functions: Array<{
      name: string;
      description: string;
      parameters: Record<string, any>;
    }>,
    agentName?: string
  ): Promise<ChatResponse> {
    const systemPrompt = this.getSystemPrompt(agentName);
    const functionPrompt = `

You have access to the following functions:
${functions.map(fn => `
- ${fn.name}: ${fn.description}
  Parameters: ${JSON.stringify(fn.parameters, null, 2)}
`).join('')}

If you need to call a function, respond with a JSON object in this format:
{
  "function_call": {
    "name": "function_name",
    "arguments": { "param1": "value1", "param2": "value2" }
  }
}

Otherwise, respond normally with text.`;

    const fullMessages = [
      { role: 'system' as const, content: systemPrompt + functionPrompt },
      ...messages
    ];

    return await this.chat(fullMessages, agentName);
  }
}

// Helper function to detect if running locally
export function isLocalDevelopment(env: Env): boolean {
  // Check if we're in local development by looking for Wrangler-specific headers
  // or environment variables that indicate local development
  return !env.AI || env.NODE_ENV === 'development';
}

// Factory function to create AI client
export function createAIClient(env: Env): CloudflareAIClient {
  const isLocal = isLocalDevelopment(env);
  return new CloudflareAIClient(env, isLocal);
}