import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Message, ApologyStyle } from '../types';
import { MessageBubble } from './MessageBubble';
import { InputBox } from './InputBox';
import { SessionList, Session } from './SessionList';
import { ApologyCharacter } from './ApologyCharacter';
import { HealthIndicator } from './HealthIndicator';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { sendMessage as sendMessageApi } from '../services/api';
import {
  getSessions,
  getSession,
  deleteSession as deleteStoredSession,
  getActiveSessionId,
  setActiveSessionId,
  clearActiveSessionId,
  toSessionListItem,
  invalidateCache,
} from '../utils/storage';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const ChatInterface: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<ApologyStyle>('gentle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load sessions and active session on mount
  useEffect(() => {
    if (user?.id) {
      loadSessionsFromBackend();
      const activeId = getActiveSessionId(user.id);
      if (activeId) {
        loadSessionFromBackend(activeId);
      }
    }
  }, [user?.id]);

  /**
   * Load sessions from backend API
   */
  const loadSessionsFromBackend = async () => {
    if (!user?.id) {
      logger.warn('[ChatInterface] Cannot load sessions - user not authenticated');
      return;
    }

    try {
      logger.info('[ChatInterface] Loading sessions from backend', { userId: user.id });
      const stored = await getSessions(user.id);
      const sessionList = stored.map(toSessionListItem);
      sessionList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setSessions(sessionList);
      logger.info('[ChatInterface] Sessions loaded', { userId: user.id, count: sessionList.length });
    } catch (error) {
      logger.error('[ChatInterface] Failed to load sessions', error);
      // Don't show error to user - sessions will be empty
    }
  };

  /**
   * Load a specific session from backend with full message history
   */
  const loadSessionFromBackend = async (sid: string) => {
    if (!user?.id) {
      logger.warn('[ChatInterface] Cannot load session - user not authenticated');
      return;
    }

    try {
      setIsLoadingSession(true);
      logger.info('[ChatInterface] Loading session from backend', { sessionId: sid, userId: user.id });

      const stored = await getSession(sid, user.id);
      if (stored) {
        setSessionId(sid);
        setMessages(stored.messages);
        setActiveSessionId(sid, user.id);
        logger.info('[ChatInterface] Session loaded', {
          sessionId: sid,
          userId: user.id,
          messageCount: stored.messages.length,
        });
      } else {
        logger.warn('[ChatInterface] Session not found', { sessionId: sid, userId: user.id });
        setError('Session not found');
      }
    } catch (error) {
      logger.error('[ChatInterface] Failed to load session', { sessionId: sid, error });
      setError('Failed to load session');
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleNewSession = () => {
    if (!user?.id) return;

    setSessionId(null);
    setMessages([]);
    setError(null);
    clearActiveSessionId(user.id);
    logger.info('[ChatInterface] New session started', { userId: user.id });
  };

  const handleSelectSession = (sid: string) => {
    loadSessionFromBackend(sid);
  };

  const handleDeleteSession = async (sid: string) => {
    if (!user?.id) return;

    try {
      logger.info('[ChatInterface] Deleting session', { sessionId: sid, userId: user.id });
      await deleteStoredSession(sid, user.id);

      // Reload sessions list from backend
      await loadSessionsFromBackend();

      // If deleting active session, clear it
      if (sid === sessionId) {
        handleNewSession();
      }

      logger.info('[ChatInterface] Session deleted successfully', { sessionId: sid, userId: user.id });
    } catch (error) {
      logger.error('[ChatInterface] Failed to delete session', { sessionId: sid, error });
      setError('Failed to delete session');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user?.id) return;

    logger.logUserAction('Send message', { messageLength: content.length, style, userId: user.id });

    setIsLoading(true);
    setError(null);

    // Create or use existing session ID
    const currentSessionId = sessionId || uuidv4();
    if (!sessionId) {
      setSessionId(currentSessionId);
      setActiveSessionId(currentSessionId, user.id);
      logger.info('[ChatInterface] Created new session', { sessionId: currentSessionId, userId: user.id });
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Send message to API (backend automatically saves session)
      const response = await sendMessageApi({
        message: content,
        style,
        sessionId: currentSessionId,
      });

      logger.info('[ChatInterface] Message sent successfully', {
        sessionId: currentSessionId,
        userId: user.id,
        tokensUsed: response.tokensUsed,
      });

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Invalidate cache and reload sessions to show updated session
      invalidateCache(user.id);
      await loadSessionsFromBackend();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      logger.error('[ChatInterface] Failed to send message', logger.getErrorDetails(err));

      // Remove user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (sessionId && user?.id) {
      if (confirm(t('chat.confirmClear'))) {
        try {
          logger.info('[ChatInterface] Clearing session history', { sessionId, userId: user.id });

          // Delete session from backend
          await deleteStoredSession(sessionId, user.id);

          // Reload sessions
          await loadSessionsFromBackend();

          // Clear UI
          handleNewSession();

          logger.info('[ChatInterface] Session history cleared', { sessionId, userId: user.id });
        } catch (error) {
          logger.error('[ChatInterface] Failed to clear history', { sessionId, error });
          setError('Failed to clear history');
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - Responsive */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Responsive apology character */}
            <ApologyCharacter
              showContinuously={true}
              size={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 100}
              className="flex-shrink-0"
            />
            <div>
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800">
                {t('app.title')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                {t('header.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-wrap">
            {/* User menu */}
            <UserMenu />

            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Health indicator - hidden on small screens */}
            <div className="hidden lg:block">
              <HealthIndicator />
            </div>

            {/* Session list */}
            <SessionList
              sessions={sessions}
              activeSessionId={sessionId}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
            />

            {/* Style selector - responsive */}
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs text-gray-600 hidden sm:inline">
                {t('chat.styleLabel')}:
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as ApologyStyle)}
                className="px-2 py-1 rounded border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={t('chat.styleTooltip')}
              >
                <option value="gentle">{t('styles.gentle')}</option>
                <option value="formal">{t('styles.formal')}</option>
                <option value="empathetic">{t('styles.empathetic')}</option>
              </select>
            </div>

            {/* Clear button - responsive */}
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-2 sm:px-3 md:px-4 py-1 text-xs sm:text-sm rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                title={t('chat.clearTooltip')}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">{t('chat.clearHistory')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages area - Responsive */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        {isLoadingSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-xs sm:text-sm">{t('common.loading')}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 px-4">
              <p className="text-sm sm:text-base md:text-lg mb-2">{t('chat.emptyStateGreeting')}</p>
              <p className="text-xs sm:text-sm">{t('chat.emptyStateSubtitle')}</p>
              {sessions.length > 0 && (
                <p className="text-xs mt-4 text-gray-400">
                  {t('chat.emptyStateHint')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4 items-end gap-2 sm:gap-3">
                <ApologyCharacter
                  isApologizing={true}
                  size={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 80}
                  className="animate-gentle-pulse"
                />
                <div className="bg-gray-200 rounded-2xl rounded-bl-none px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error message - Responsive */}
      {error && (
        <div className="px-3 sm:px-4 md:px-6 py-2 bg-red-50 border-t border-red-200">
          <p className="text-xs sm:text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Input area */}
      <InputBox onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};
