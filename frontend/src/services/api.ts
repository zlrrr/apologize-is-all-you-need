import axios, { AxiosError } from 'axios';
import { SendMessageRequest, SendMessageResponse, HistoryResponse } from '../types';
import logger from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - log all requests
api.interceptors.request.use(
  (config) => {
    const startTime = Date.now();
    config.metadata = { startTime };

    logger.logApiRequest(
      config.url || '',
      config.method?.toUpperCase() || 'GET',
      config.data
    );

    return config;
  },
  (error) => {
    logger.error('[API] Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor - log all responses
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config.metadata?.startTime || 0);

    logger.logApiResponse(
      response.config.url || '',
      response.status,
      response.data,
      duration
    );

    return response;
  },
  (error: AxiosError) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);

    // Log error with details
    logger.logApiError(error.config?.url || 'unknown', error);

    return Promise.reject(error);
  }
);

// Extend axios config to include metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

/**
 * Send a message and get apology response
 */
export async function sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
  try {
    const response = await api.post<SendMessageResponse>('/api/chat/message', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Enhanced error message based on error type
      const errorMessage = getErrorMessage(error);
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Get conversation history
 */
export async function getHistory(sessionId: string): Promise<HistoryResponse> {
  try {
    const response = await api.get<HistoryResponse>('/api/chat/history', {
      params: { sessionId },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to get history');
    }
    throw error;
  }
}

/**
 * Clear conversation history
 */
export async function clearHistory(sessionId: string): Promise<void> {
  try {
    await api.delete('/api/chat/history', {
      params: { sessionId },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to clear history');
    }
    throw error;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await api.delete('/api/chat/session', {
      params: { sessionId },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to delete session');
    }
    throw error;
  }
}

/**
 * Health check endpoints
 */
export async function checkHealth(): Promise<any> {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    logger.error('Health check failed', error);
    throw error;
  }
}

export async function checkDetailedHealth(): Promise<any> {
  try {
    const response = await api.get('/api/health/detailed');
    return response.data;
  } catch (error) {
    logger.error('Detailed health check failed', error);
    throw error;
  }
}

export async function checkLLMHealth(): Promise<any> {
  try {
    const response = await api.get('/api/health/llm');
    return response.data;
  } catch (error) {
    logger.error('LLM health check failed', error);
    throw error;
  }
}

/**
 * Get user-friendly error message based on error type
 */
function getErrorMessage(error: AxiosError): string {
  // Network error (cannot reach server)
  if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
    return '无法连接到服务器，请检查后端服务是否正在运行（端口5001）';
  }

  // Timeout error
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return '请求超时，LLM服务可能响应缓慢，请稍后重试';
  }

  // Connection refused
  if (error.code === 'ECONNREFUSED') {
    return '连接被拒绝，请确认后端服务已启动';
  }

  // HTTP error responses
  if (error.response) {
    const status = error.response.status;
    const data: any = error.response.data;

    switch (status) {
      case 400:
        return data?.message || '请求参数错误，请检查输入内容';
      case 401:
        return '未授权访问，请重新登录';
      case 403:
        return '访问被拒绝，请检查权限';
      case 404:
        return 'API端点不存在，请检查服务器配置';
      case 500:
        return data?.message || '服务器内部错误，请查看后端日志';
      case 502:
        return 'LLM服务不可用，请确认LM Studio正在运行并已加载模型';
      case 503:
        return '服务暂时不可用，请稍后重试';
      case 504:
        return 'LLM服务响应超时，请尝试使用更小的模型或增加超时时间';
      default:
        return data?.message || `请求失败 (${status})`;
    }
  }

  // Default error message
  return error.message || '发送消息失败，请重试';
}

export default api;

/**
 * Authentication APIs
 */
export async function verifyAuth(inviteCode?: string, password?: string): Promise<any> {
  try {
    const response = await api.post('/api/auth/verify', {
      inviteCode,
      password,
    });
    return response.data;
  } catch (error) {
    logger.error('Auth verification failed', error);
    throw error;
  }
}

export async function checkAuthStatus(): Promise<any> {
  try {
    const response = await api.get('/api/auth/status');
    return response.data;
  } catch (error) {
    logger.error('Auth status check failed', error);
    throw error;
  }
}

export async function refreshToken(): Promise<any> {
  try {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  } catch (error) {
    logger.error('Token refresh failed', error);
    throw error;
  }
}

export async function logout(): Promise<any> {
  try {
    const response = await api.post('/api/auth/logout');
    return response.data;
  } catch (error) {
    logger.error('Logout failed', error);
    throw error;
  }
}

/**
 * Set authentication token in axios headers
 */
export function setAuthToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    logger.info('Auth token set');
  } else {
    delete api.defaults.headers.common['Authorization'];
    logger.info('Auth token cleared');
  }
}
