import { Router, Request, Response } from 'express';
import {
  verifyCredentials,
  generateToken,
  isAuthEnabled,
  authenticate,
} from '../middleware/auth.middleware.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/auth/verify
 * Verify invite code or password and return JWT token
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { inviteCode, password } = req.body;

    // Validate credentials
    const isValid = verifyCredentials(inviteCode, password);

    if (!isValid) {
      logger.warn('Authentication attempt failed', {
        ip: req.ip,
        hasInviteCode: !!inviteCode,
        hasPassword: !!password,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: '邀请码或密码错误',
      });
    }

    // Generate JWT token
    const token = generateToken();
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    logger.info('Authentication successful', {
      ip: req.ip,
      method: inviteCode ? 'inviteCode' : 'password',
    });

    res.json({
      success: true,
      token,
      expiresIn,
      message: '认证成功',
    });
  } catch (error) {
    logger.error('Authentication error', { error });

    res.status(500).json({
      error: 'Internal Server Error',
      message: '认证过程出错，请稍后重试',
    });
  }
});

/**
 * GET /api/auth/status
 * Check if authentication is enabled and current auth status
 */
router.get('/status', async (req: Request, res: Response) => {
  const authEnabled = isAuthEnabled();

  // Try to verify token if provided
  const token = req.headers.authorization?.replace('Bearer ', '');
  let isAuthenticated = false;

  if (token) {
    try {
      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      jwt.default.verify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (error) {
      isAuthenticated = false;
    }
  }

  res.json({
    authEnabled,
    isAuthenticated,
    requiresAuth: authEnabled,
  });
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token (extends expiry)
 */
router.post('/refresh', authenticate, async (req: Request, res: Response) => {
  try {
    // Generate new token
    const token = generateToken();
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    logger.info('Token refreshed', {
      ip: req.ip,
    });

    res.json({
      success: true,
      token,
      expiresIn,
      message: 'Token已刷新',
    });
  } catch (error) {
    logger.error('Token refresh error', { error });

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token刷新失败',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client should delete token)
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  logger.info('User logged out', {
    ip: req.ip,
  });

  res.json({
    success: true,
    message: '已登出',
  });
});

export default router;
