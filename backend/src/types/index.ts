// Chat message types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Apology style types
export type ApologyStyle = 'gentle' | 'formal' | 'empathetic';

// LLM request parameters
export interface ApologyRequest {
  message: string;
  emotion?: string;
  style?: ApologyStyle;
  history?: ChatMessage[];
}

// LLM response
export interface ApologyResponse {
  reply: string;
  emotion?: string;
  style: ApologyStyle;
  tokensUsed?: number;
}

// LLM Provider types
export type LLMProvider = 'lm-studio' | 'openai' | 'anthropic' | 'custom';

// LLM service configuration
export interface LLMConfig {
  provider?: LLMProvider;
  baseURL?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

// OpenAI-compatible API types
export interface OpenAIChatRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
