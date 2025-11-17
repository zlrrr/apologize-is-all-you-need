import axios from 'axios';
import api from './api';
import logger from '../utils/logger';

/**
 * Admin API Service
 * All endpoints require admin authentication
 */

// Admin types
export interface AdminUser {
  id: number;
  username: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserStats {
  totalMessages: number;
  totalSessions: number;
  lastLoginAt?: string;
  sessionCount: number;
}

export interface AdminSession {
  id: string;
  userId: number;
  title?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  };
  sessions: {
    total: number;
  };
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<{ users: AdminUser[]; count: number }> {
  try {
    const response = await api.get('/api/admin/users');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to get users');
    }
    throw error;
  }
}

/**
 * Get specific user details (admin only)
 */
export async function getUserDetails(
  userId: number
): Promise<{ user: AdminUser; stats: UserStats }> {
  try {
    const response = await api.get(`/api/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to get user details');
    }
    throw error;
  }
}

/**
 * Update user status (enable/disable) (admin only)
 */
export async function updateUserStatus(
  userId: number,
  isActive: boolean
): Promise<{ message: string; userId: number; isActive: boolean }> {
  try {
    const response = await api.patch(`/api/admin/users/${userId}/status`, {
      isActive,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to update user status');
    }
    throw error;
  }
}

/**
 * Get all sessions (admin only)
 * Optionally filter by userId
 */
export async function getAllSessions(
  userId?: number
): Promise<{ sessions: AdminSession[]; count: number }> {
  try {
    const params = userId ? { userId } : {};
    const response = await api.get('/api/admin/sessions', { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to get sessions');
    }
    throw error;
  }
}

/**
 * Get specific session details with full message history (admin only)
 */
export async function getSessionDetails(sessionId: string): Promise<{
  session: {
    id: string;
    userId: number;
    title?: string;
    messages: Array<{ role: string; content: string }>;
    createdAt: string;
    updatedAt: string;
  };
}> {
  try {
    const response = await api.get(`/api/admin/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to get session details');
    }
    throw error;
  }
}

/**
 * Get system statistics (admin only)
 */
export async function getSystemStats(): Promise<SystemStats> {
  try {
    const response = await api.get('/api/admin/stats');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to get statistics');
    }
    throw error;
  }
}
