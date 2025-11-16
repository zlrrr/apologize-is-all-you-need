import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { userService } from '../services/user.service.js';
import { sessionService } from '../services/session.service.js';
import logger from '../utils/logger.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = userService.getAllUsers();

    res.json({
      users,
      count: users.length,
    });

    logger.info('Admin retrieved user list', {
      adminId: req.user!.userId,
      userCount: users.length,
    });
  } catch (error) {
    logger.error('Failed to get users', { error, adminId: req.user!.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve users',
    });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get specific user details (admin only)
 */
router.get('/users/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid user ID',
      });
    }

    const user = userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Get user statistics
    const stats = userService.getUserStats(userId);
    const sessionCount = sessionService.getSessionCount(userId);

    res.json({
      user,
      stats: {
        ...stats,
        sessionCount,
      },
    });

    logger.info('Admin retrieved user details', {
      adminId: req.user!.userId,
      targetUserId: userId,
    });
  } catch (error) {
    logger.error('Failed to get user details', {
      error,
      adminId: req.user!.userId,
      userId: req.params.userId,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user details',
    });
  }
});

/**
 * PATCH /api/admin/users/:userId/status
 * Enable/disable a user account (admin only)
 */
router.patch('/users/:userId/status', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { isActive } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid user ID',
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'isActive must be a boolean',
      });
    }

    // Prevent disabling admin user
    const targetUser = userService.getUserById(userId);
    if (targetUser?.role === 'admin' && !isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot disable admin user',
      });
    }

    userService.updateUserStatus(userId, isActive);

    res.json({
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
      userId,
      isActive,
    });

    logger.info('Admin updated user status', {
      adminId: req.user!.userId,
      targetUserId: userId,
      newStatus: isActive,
    });
  } catch (error) {
    logger.error('Failed to update user status', {
      error,
      adminId: req.user!.userId,
      userId: req.params.userId,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user status',
    });
  }
});

/**
 * GET /api/admin/sessions
 * Get all sessions across all users (admin only)
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    let sessions;
    if (userId) {
      // Get sessions for specific user
      const targetUserId = parseInt(userId as string);
      if (isNaN(targetUserId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid user ID',
        });
      }
      sessions = sessionService.getUserSessions(targetUserId);
    } else {
      // Get all sessions
      sessions = sessionService.getAllSessions();
    }

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        userId: s.userId,
        title: s.title,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      count: sessions.length,
    });

    logger.info('Admin retrieved sessions', {
      adminId: req.user!.userId,
      filterUserId: userId || 'all',
      sessionCount: sessions.length,
    });
  } catch (error) {
    logger.error('Failed to get sessions', {
      error,
      adminId: req.user!.userId,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve sessions',
    });
  }
});

/**
 * GET /api/admin/sessions/:sessionId
 * Get specific session details with full message history (admin only)
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId;

    // Get session from all sessions
    const allSessions = sessionService.getAllSessions();
    const session = allSessions.find(s => s.id === sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found',
      });
    }

    res.json({
      session: {
        id: session.id,
        userId: session.userId,
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });

    logger.info('Admin retrieved session details', {
      adminId: req.user!.userId,
      sessionId,
      userId: session.userId,
    });
  } catch (error) {
    logger.error('Failed to get session details', {
      error,
      adminId: req.user!.userId,
      sessionId: req.params.sessionId,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve session details',
    });
  }
});

/**
 * GET /api/admin/stats
 * Get overall system statistics (admin only)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const users = userService.getAllUsers();
    const totalSessions = sessionService.getSessionCount();

    const stats = {
      users: {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        admins: users.filter(u => u.role === 'admin').length,
      },
      sessions: {
        total: totalSessions,
      },
    };

    res.json(stats);

    logger.info('Admin retrieved system stats', {
      adminId: req.user!.userId,
    });
  } catch (error) {
    logger.error('Failed to get system stats', {
      error,
      adminId: req.user!.userId,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve statistics',
    });
  }
});

export default router;
