import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const INVITE_CODES = (process.env.INVITE_CODES || '').split(',').filter(Boolean);
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        authenticated: boolean;
        timestamp: number;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verify JWT token from Authorization header
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      path: req.path,
      ip: req.ip,
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication token provided',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      authenticated: boolean;
      timestamp: number;
    };

    req.user = decoded;

    logger.debug('Authentication successful', {
      path: req.path,
      user: req.user,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', {
      path: req.path,
      ip: req.ip,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Optional authentication middleware
 * Does not block request if no token, but validates if present
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      authenticated: boolean;
      timestamp: number;
    };

    req.user = decoded;
    logger.debug('Optional authentication successful', {
      path: req.path,
    });
  } catch (error) {
    logger.debug('Optional authentication: Invalid token', {
      path: req.path,
    });
    // Don't block the request, just continue without user
  }

  next();
}

/**
 * Verify invite code or password
 */
export function verifyCredentials(inviteCode?: string, password?: string): boolean {
  // Check invite code
  if (inviteCode && INVITE_CODES.includes(inviteCode)) {
    logger.info('Valid invite code used', { inviteCode });
    return true;
  }

  // Check password
  if (password && ACCESS_PASSWORD && password === ACCESS_PASSWORD) {
    logger.info('Valid password used');
    return true;
  }

  // If no auth configured, allow access (for development)
  if (INVITE_CODES.length === 0 && !ACCESS_PASSWORD) {
    logger.warn('No authentication configured - allowing access');
    return true;
  }

  logger.warn('Invalid credentials', {
    hasInviteCode: !!inviteCode,
    hasPassword: !!password,
  });

  return false;
}

/**
 * Generate JWT token
 */
export function generateToken(payload: any = {}): string {
  const token = jwt.sign(
    {
      authenticated: true,
      timestamp: Date.now(),
      ...payload,
    },
    JWT_SECRET,
    { expiresIn: '7d' } // 7 days
  );

  return token;
}

/**
 * Check if authentication is enabled
 */
export function isAuthEnabled(): boolean {
  return INVITE_CODES.length > 0 || !!ACCESS_PASSWORD;
}
