import { Router, Request, Response, NextFunction } from 'express';
import { llmService } from '../services/llm.service.js';
import { sessionService } from '../services/session.service.js';
import { validateChatMessage, validateSessionId } from '../middleware/validation.middleware.js';
import { ApologyStyle } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import logger, { sanitizeForLog } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/chat/message
 * Send a message and get an apology response
 */
router.post('/message', validateChatMessage, async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.requestId || uuidv4();

  try {
    const { message, style, sessionId: clientSessionId } = req.body;

    // Use provided session ID or create a new one
    const sessionId = clientSessionId || uuidv4();

    logger.info('[CHAT-001] Processing chat message', {
      requestId,
      sessionId,
      messageLength: message?.length || 0,
      style: style || 'gentle',
      hasHistory: clientSessionId ? 'yes' : 'no',
    });

    // Get conversation history
    const history = sessionService.getMessages(sessionId);

    logger.info('[CHAT-002] Retrieved conversation history', {
      requestId,
      sessionId,
      historyCount: history.length,
    });

    // Generate apology response
    logger.info('[CHAT-003] Calling LLM service', {
      requestId,
      sessionId,
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
      replyLength: response.reply?.length || 0,
      tokensUsed: response.tokensUsed,
      emotion: response.emotion,
    });

    // Save user message and assistant response to session
    sessionService.addMessage(sessionId, {
      role: 'user',
      content: message,
    });

    sessionService.addMessage(sessionId, {
      role: 'assistant',
      content: response.reply,
    });

    logger.info('[CHAT-005] Session updated successfully', {
      requestId,
      sessionId,
      totalMessages: sessionService.getMessages(sessionId).length,
    });

    const duration = Date.now() - startTime;

    // Return response
    res.json({
      sessionId,
      reply: response.reply,
      emotion: response.emotion,
      style: response.style,
      tokensUsed: response.tokensUsed,
      timestamp: new Date().toISOString(),
    });

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
 */
router.get('/history', validateSessionId, async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;

    // Get messages for session
    const messages = sessionService.getMessages(sessionId);

    // Get session info
    const sessionInfo = sessionService.getSessionInfo(sessionId);

    res.json({
      sessionId,
      messages,
      messageCount: messages.length,
      createdAt: sessionInfo?.createdAt,
      updatedAt: sessionInfo?.updatedAt,
    });
  } catch (error) {
    throw error;
  }
});

/**
 * DELETE /api/chat/history
 * Clear conversation history for a session
 */
router.delete('/history', validateSessionId, async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string || req.body.sessionId;

    // Clear session
    sessionService.clearSession(sessionId);

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
 */
router.delete('/session', validateSessionId, async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string || req.body.sessionId;

    // Delete session
    const deleted = sessionService.deleteSession(sessionId);

    if (deleted) {
      res.json({
        sessionId,
        message: 'Session deleted successfully',
      });
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: 'Session not found',
      });
    }
  } catch (error) {
    throw error;
  }
});

/**
 * GET /api/chat/sessions
 * Get all session IDs (for debugging)
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const sessionIds = sessionService.getAllSessionIds();

    res.json({
      sessions: sessionIds,
      count: sessionIds.length,
    });
  } catch (error) {
    throw error;
  }
});

export default router;
