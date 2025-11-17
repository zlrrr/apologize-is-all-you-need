import { Router, Request, Response, NextFunction } from 'express';
import { llmService } from '../services/llm.service.js';
import { sessionService } from '../services/session.service.js';
import { validateChatMessage, validateSessionId } from '../middleware/validation.middleware.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { verifySessionOwnership, preventSessionCollision } from '../middleware/session-authorization.middleware.js';
import { ApologyStyle } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import logger, { sanitizeForLog } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/chat/message
 * Send a message and get an apology response
 * Requires authentication
 * Security: Prevents session ID collision
 */
router.post('/message', authenticate, validateChatMessage, preventSessionCollision, async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.requestId || uuidv4();

  try {
    const { message, style, sessionId: clientSessionId } = req.body;

    // Get authenticated user ID
    const userId = req.user!.userId;

    // Use provided session ID or create a new one
    const sessionId = clientSessionId || uuidv4();

    logger.info('[CHAT-001] Processing chat message', {
      requestId,
      sessionId,
      userId,
      messageLength: message?.length || 0,
      style: style || 'gentle',
      hasHistory: clientSessionId ? 'yes' : 'no',
    });

    // Get conversation history (with user isolation)
    const history = sessionService.getMessages(sessionId, userId);

    logger.info('[CHAT-002] Retrieved conversation history', {
      requestId,
      sessionId,
      userId,
      historyCount: history.length,
    });

    // Generate apology response
    logger.info('[CHAT-003] Calling LLM service', {
      requestId,
      sessionId,
      userId,
      provider: llmService.getConfig().provider,
      model: llmService.getConfig().model,
    });

    const response = await llmService.generateApology({
      message,
      style: style as ApologyStyle,
      history: history.slice(-10), // Only use last 10 messages for context
    });

    logger.info('[CHAT-004] LLM response received', {
      requestId,
      sessionId,
      userId,
      replyLength: response.reply?.length || 0,
      tokensUsed: response.tokensUsed,
      emotion: response.emotion,
    });

    // Save user message and assistant response to session (with user isolation)
    sessionService.addMessage(sessionId, userId, {
      role: 'user',
      content: message,
    });

    sessionService.addMessage(sessionId, userId, {
      role: 'assistant',
      content: response.reply,
    }, response.tokensUsed);

    logger.info('[CHAT-005] Session updated successfully', {
      requestId,
      sessionId,
      userId,
      totalMessages: sessionService.getMessages(sessionId, userId).length,
    });

    const duration = Date.now() - startTime;

    // Prepare response data
    const responseData = {
      sessionId,
      reply: response.reply,
      emotion: response.emotion,
      style: response.style,
      tokensUsed: response.tokensUsed,
      timestamp: new Date().toISOString(),
    };

    // Log response data being sent to frontend
    logger.info('[CHAT-RESPONSE] Sending response to frontend', {
      requestId,
      sessionId,
      replyLength: response.reply?.length || 0,
      replyPreview: response.reply ? response.reply.substring(0, 100) : 'EMPTY',
      replyFull: response.reply || 'EMPTY',
      emotion: response.emotion,
      style: response.style,
      tokensUsed: response.tokensUsed,
    });

    // Return response
    res.json(responseData);

    logger.info('[CHAT-006] Chat request completed successfully', {
      requestId,
      sessionId,
      duration: `${duration}ms`,
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('[CHAT-ERROR] Chat request failed', {
      requestId,
      duration: `${duration}ms`,
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        code: (error as any).code,
        type: (error as any).type,
        statusCode: (error as any).statusCode,
      },
    });

    // Pass error to error handling middleware
    next(error);
  }
});

/**
 * GET /api/chat/history
 * Get conversation history for a session
 * Requires authentication - users can only access their own sessions
 * Security: Verifies session ownership before access
 */
router.get('/history', authenticate, validateSessionId, verifySessionOwnership, async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;
    const userId = req.user!.userId;

    // Get messages for session (with user isolation)
    const messages = sessionService.getMessages(sessionId, userId);

    // Get session info
    const session = sessionService.getOrCreateSession(sessionId, userId);

    res.json({
      sessionId,
      messages,
      messageCount: messages.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    throw error;
  }
});

/**
 * DELETE /api/chat/history
 * Clear conversation history for a session
 * Requires authentication - users can only clear their own sessions
 * Security: Verifies session ownership before clearing
 */
router.delete('/history', authenticate, validateSessionId, verifySessionOwnership, async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string || req.body.sessionId;
    const userId = req.user!.userId;

    // Clear session (with user isolation)
    sessionService.clearSession(sessionId, userId);

    res.json({
      sessionId,
      message: 'History cleared successfully',
    });
  } catch (error) {
    throw error;
  }
});

/**
 * DELETE /api/chat/session
 * Delete a session entirely
 * Requires authentication - users can only delete their own sessions
 * Security: Verifies session ownership before deletion
 */
router.delete('/session', authenticate, validateSessionId, verifySessionOwnership, async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string || req.body.sessionId;
    const userId = req.user!.userId;

    // Delete session (with user isolation)
    const deleted = sessionService.deleteSession(sessionId, userId);

    if (deleted) {
      res.json({
        sessionId,
        message: 'Session deleted successfully',
      });
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: 'Session not found or access denied',
      });
    }
  } catch (error) {
    throw error;
  }
});

/**
 * GET /api/chat/sessions
 * Get all sessions for the authenticated user
 * Requires authentication
 */
router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get user's sessions (with data isolation)
    const sessions = sessionService.getUserSessions(userId);

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      count: sessions.length,
    });
  } catch (error) {
    throw error;
  }
});

export default router;
