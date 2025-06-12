/**
 * Chat API Endpoints
 * 
 * Handles chat requests for Alice and Bob agents using Cloudflare Workers AI
 */

import { createAIClient, type ChatMessage } from '@/utils/ai-client.js';
import { createSuccessResponse, createErrorResponse } from '@/utils/response.js';
import type { Env } from '@/types/env.js';

export interface ChatRequest {
  messages: ChatMessage[];
  agent?: 'alice' | 'bob';
}

export interface ChatStreamRequest extends ChatRequest {
  stream?: boolean;
}

/**
 * Handle chat completion requests
 */
export async function handleChatCompletion(request: Request, env: Env): Promise<Response> {
  try {
    if (request.method !== 'POST') {
      return createErrorResponse('Method not allowed', { status: 405 });
    }

    const body = await request.json() as ChatRequest;
    const { messages, agent } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return createErrorResponse('Messages array is required', { status: 400 });
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content) {
        return createErrorResponse('Each message must have role and content', { status: 400 });
      }
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        return createErrorResponse('Invalid message role', { status: 400 });
      }
    }

    const aiClient = createAIClient(env);
    const response = await aiClient.chat(messages, agent);

    return createSuccessResponse(response as any);
  } catch (error) {
    console.error('Chat completion error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
}

/**
 * Handle streaming chat completions
 */
export async function handleChatStream(request: Request, env: Env): Promise<Response> {
  try {
    if (request.method !== 'POST') {
      return createErrorResponse('Method not allowed', { status: 405 });
    }

    const body = await request.json() as ChatStreamRequest;
    const { messages, agent } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return createErrorResponse('Messages array is required', { status: 400 });
    }

    const aiClient = createAIClient(env);
    
    // For now, we'll simulate streaming by returning the complete response
    // Real streaming would require server-sent events implementation
    const response = await aiClient.chat(messages, agent);

    // Convert to streaming format
    const streamResponse = {
      id: response.id,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'llama-3.3-70b-instruct-fp8-fast',
      choices: response.choices.map((choice, index) => ({
        index,
        delta: {
          role: choice.message.role,
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      })),
    };

    return new Response(
      `data: ${JSON.stringify(streamResponse)}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Chat stream error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
}

/**
 * Handle chat with function calling
 */
export async function handleChatWithFunctions(request: Request, env: Env): Promise<Response> {
  try {
    if (request.method !== 'POST') {
      return createErrorResponse('Method not allowed', { status: 405 });
    }

    const body = await request.json() as ChatRequest & {
      functions?: Array<{
        name: string;
        description: string;
        parameters: Record<string, any>;
      }>;
    };

    const { messages, agent, functions = [] } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return createErrorResponse('Messages array is required', { status: 400 });
    }

    const aiClient = createAIClient(env);
    
    let response;
    if (functions.length > 0) {
      response = await aiClient.chatWithFunctions(messages, functions, agent);
    } else {
      response = await aiClient.chat(messages, agent);
    }

    return createSuccessResponse(response as any);
  } catch (error) {
    console.error('Chat with functions error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
}

/**
 * Get available AI models
 */
export async function handleModels(_request: Request, _env: Env): Promise<Response> {
  const models = {
    object: 'list',
    data: [
      {
        id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        object: 'model',
        created: 1677610602,
        owned_by: 'cloudflare',
        permission: [],
        root: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        parent: null,
      },
    ],
  };

  return createSuccessResponse(models);
}