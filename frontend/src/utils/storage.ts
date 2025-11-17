/**
 * Session Management API
 * Server-side session storage with optional localStorage caching
 *
 * CRITICAL: All session data is stored on the backend server
 * localStorage is used ONLY for caching to improve performance
 * Cross-device synchronization is fully supported
 */

import { Message } from '../types';
import { Session } from '../components/SessionList';
import api from '../services/api';
import logger from './logger';

const ACTIVE_SESSION_KEY = 'apology_active_session';
const SESSION_CACHE_KEY = 'apology_sessions_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface StoredSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface CachedData {
  data: StoredSession[];
  timestamp: number;
}

/**
 * Get all sessions from backend API
 * Uses localStorage as temporary cache only
 */
export async function getSessions(): Promise<StoredSession[]> {
  try {
    logger.info('[Storage] Fetching sessions from backend');

    // Try cache first (for performance)
    const cached = getCachedSessions();
    if (cached) {
      logger.info('[Storage] Using cached sessions', { count: cached.length });
      // Fetch fresh data in background
      fetchAndCacheSessions().catch(err =>
        logger.error('[Storage] Background fetch failed', err)
      );
      return cached;
    }

    // Fetch from backend
    const sessions = await fetchAndCacheSessions();
    return sessions;
  } catch (error) {
    logger.error('[Storage] Failed to get sessions from backend', error);
    // Fallback to cache even if expired
    const cachedData = localStorage.getItem(SESSION_CACHE_KEY);
    if (cachedData) {
      const { data } = JSON.parse(cachedData) as CachedData;
      logger.warn('[Storage] Using expired cache as fallback', { count: data.length });
      return data;
    }
    return [];
  }
}

/**
 * Fetch sessions from backend and update cache
 */
async function fetchAndCacheSessions(): Promise<StoredSession[]> {
  const response = await api.get('/api/chat/sessions');
  const backendSessions = response.data.sessions;

  // Convert backend format to frontend format
  const sessions: StoredSession[] = backendSessions.map((s: any) => ({
    id: s.id,
    name: s.title || generateSessionName(''),
    messages: s.lastMessage ? [{ role: 'assistant', content: s.lastMessage, timestamp: s.updatedAt }] : [], // Store last message for preview
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));

  // Update cache
  const cacheData: CachedData = {
    data: sessions,
    timestamp: Date.now(),
  };
  localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cacheData));

  logger.info('[Storage] Sessions fetched and cached', { count: sessions.length });
  return sessions;
}

/**
 * Get cached sessions if not expired
 */
function getCachedSessions(): StoredSession[] | null {
  try {
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached) as CachedData;
    const age = Date.now() - timestamp;

    if (age > CACHE_DURATION) {
      logger.debug('[Storage] Cache expired', { ageMs: age });
      return null;
    }

    return data;
  } catch (error) {
    logger.error('[Storage] Failed to parse cache', error);
    return null;
  }
}

/**
 * Get a specific session from backend with full message history
 */
export async function getSession(sessionId: string): Promise<StoredSession | null> {
  try {
    logger.info('[Storage] Fetching session from backend', { sessionId });

    const response = await api.get(`/api/chat/history?sessionId=${sessionId}`);
    const { messages: backendMessages, createdAt, updatedAt } = response.data;

    // Find session metadata from cache or fetch list
    const sessions = await getSessions();
    const sessionMeta = sessions.find(s => s.id === sessionId);

    const session: StoredSession = {
      id: sessionId,
      name: sessionMeta?.name || generateSessionName(backendMessages[0]?.content || ''),
      messages: backendMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(), // Backend doesn't store timestamp per message
      })),
      createdAt,
      updatedAt,
    };

    logger.info('[Storage] Session loaded', { sessionId, messageCount: session.messages.length });
    return session;
  } catch (error) {
    logger.error('[Storage] Failed to get session from backend', { sessionId, error });
    return null;
  }
}

/**
 * Sessions are saved automatically by backend when messages are sent
 * This function exists for compatibility but doesn't need to do anything
 */
export function saveSession(session: StoredSession): void {
  // IMPORTANT: Backend automatically saves sessions when messages are sent
  // No need to manually save - session data is already on the server
  logger.debug('[Storage] Session save requested (handled by backend)', {
    sessionId: session.id,
  });

  // Invalidate cache so next load fetches fresh data
  localStorage.removeItem(SESSION_CACHE_KEY);
}

/**
 * Delete a session from backend
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    logger.info('[Storage] Deleting session from backend', { sessionId });

    await api.delete(`/api/chat/session?sessionId=${sessionId}`);

    // Invalidate cache
    localStorage.removeItem(SESSION_CACHE_KEY);

    logger.info('[Storage] Session deleted successfully', { sessionId });
  } catch (error) {
    logger.error('[Storage] Failed to delete session from backend', { sessionId, error });
    throw error;
  }
}

/**
 * Clear session history (delete all messages but keep session)
 */
export async function clearSessionHistory(sessionId: string): Promise<void> {
  try {
    logger.info('[Storage] Clearing session history from backend', { sessionId });

    await api.delete(`/api/chat/history?sessionId=${sessionId}`);

    // Invalidate cache
    localStorage.removeItem(SESSION_CACHE_KEY);

    logger.info('[Storage] Session history cleared successfully', { sessionId });
  } catch (error) {
    logger.error('[Storage] Failed to clear session history from backend', { sessionId, error });
    throw error;
  }
}

/**
 * Get active session ID (stored locally for UX)
 */
export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

/**
 * Set active session ID (stored locally for UX)
 */
export function setActiveSessionId(sessionId: string): void {
  localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

/**
 * Clear active session ID
 */
export function clearActiveSessionId(): void {
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

/**
 * Invalidate session cache (force refresh from backend)
 */
export function invalidateCache(): void {
  localStorage.removeItem(SESSION_CACHE_KEY);
  logger.info('[Storage] Cache invalidated');
}

/**
 * Convert stored session to session list item
 */
export function toSessionListItem(stored: StoredSession): Session {
  const lastMessage = stored.messages.length > 0
    ? stored.messages[stored.messages.length - 1].content
    : undefined;

  return {
    id: stored.id,
    name: stored.name,
    lastMessage: lastMessage?.substring(0, 50) + (lastMessage && lastMessage.length > 50 ? '...' : ''),
    updatedAt: new Date(stored.updatedAt),
    messageCount: stored.messages.length,
  };
}

/**
 * Generate session name from first message
 */
export function generateSessionName(firstMessage: string): string {
  if (!firstMessage || firstMessage.trim() === '') {
    return 'New Conversation';
  }

  const maxLength = 30;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength) + '...';
}
