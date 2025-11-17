import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  saveSession,
  deleteSession as deleteStoredSession,
  getActiveSessionId,
  setActiveSessionId,
  clearActiveSessionId,
  toSessionListItem,
  generateSessionName,
  StoredSession,
} from '../utils/storage';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const ChatInterface: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<ApologyStyle>('gentle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load sessions and active session on mount
  useEffect(() => {
    loadSessions();
    const activeId = getActiveSessionId();
    if (activeId) {
      loadSession(activeId);
    }
  }, []);

  // Save current session when messages change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const stored = getSession(sessionId);
      const sessionName = stored?.name || generateSessionName(messages[0].content);

      const updatedSession: StoredSession = {
        id: sessionId,
        name: sessionName,
        messages,
        createdAt: stored?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveSession(updatedSession);
      loadSessions();
    }
  }, [messages, sessionId]);

  const loadSessions = () => {
    const stored = getSessions();
    const sessionList = stored.map(toSessionListItem);
    sessionList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    setSessions(sessionList);
  };

  const loadSession = (sid: string) => {
    const stored = getSession(sid);
    if (stored) {
      setSessionId(sid);
      setMessages(stored.messages);
      setActiveSessionId(sid);
    }
  };

  const handleNewSession = () => {
    setSessionId(null);
    setMessages([]);
    setError(null);
    clearActiveSessionId();
  };

  const handleSelectSession = (sid: string) => {
    loadSession(sid);
  };

  const handleDeleteSession = (sid: string) => {
    deleteStoredSession(sid);
    loadSessions();

    // If deleting active session, clear it
    if (sid === sessionId) {
      handleNewSession();
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    logger.logUserAction('Send message', { messageLength: content.length, style });

    setIsLoading(true);
    setError(null);

    // Create or use existing session ID
    const currentSessionId = sessionId || uuidv4();
    if (!sessionId) {
      setSessionId(currentSessionId);
      setActiveSessionId(currentSessionId);
      logger.info('Created new session', { sessionId: currentSessionId });
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Send message to API
      const response = await sendMessageApi({
        message: content,
        style,
        sessionId: currentSessionId,
      });

      logger.info('Message sent successfully', {
        sessionId: currentSessionId,
        tokensUsed: response.tokensUsed,
      });

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      logger.error('Failed to send message', logger.getErrorDetails(err));

      // Remove user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (sessionId) {
      if (confirm(t('chat.confirmClear'))) {
        handleNewSession();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Continuously visible apology character */}
            <ApologyCharacter
              showContinuously={true}
              size={100}
              className="flex-shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {t('app.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('header.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User menu */}
            <UserMenu />

            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Health indicator */}
            <HealthIndicator />

            {/* Session list */}
            <SessionList
              sessions={sessions}
              activeSessionId={sessionId}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
            />

            {/* Style selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{t('chat.styleLabel')}:</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as ApologyStyle)}
                className="px-3 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={t('chat.styleTooltip')}
              >
                <option value="gentle">{t('styles.gentle')}</option>
                <option value="formal">{t('styles.formal')}</option>
                <option value="empathetic">{t('styles.empathetic')}</option>
              </select>
            </div>

            {/* Clear button */}
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-4 py-1.5 text-sm rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                title={t('chat.clearTooltip')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('chat.clearHistory')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">{t('chat.emptyStateGreeting')}</p>
              <p className="text-sm">{t('chat.emptyStateSubtitle')}</p>
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
              <div className="flex justify-start mb-4 items-end gap-3">
                <ApologyCharacter isApologizing={true} size={80} className="animate-gentle-pulse" />
                <div className="bg-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
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

      {/* Error message */}
      {error && (
        <div className="px-6 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Input area */}
      <InputBox onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};
