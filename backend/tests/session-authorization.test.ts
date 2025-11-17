/**
 * Session Authorization Tests
 * Tests for session ownership verification and access control
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { DatabaseService } from '../src/database/database.service';
import authRoutes from '../src/routes/auth.routes';
import chatRoutes from '../src/routes/chat.routes';
import adminRoutes from '../src/routes/admin.routes';
import cors from 'cors';
import session from 'express-session';
import { optionalAuthenticate } from '../src/middleware/auth.middleware';
import fs from 'fs';
import path from 'path';

describe('Session Authorization', () => {
  let app: express.Application;
  let db: DatabaseService;
  const testDbPath = path.join(__dirname, 'test-session-auth.db');

  let user1Token: string;
  let user2Token: string;
  let adminToken: string;
  let user1SessionId: string;
  let user2SessionId: string;

  beforeAll(async () => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize database
    db = new DatabaseService(testDbPath);
    await db.initialize();

    // Create Express app
    app = express();
    app.use(cors({ credentials: true }));
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }
    }));
    app.use(optionalAuthenticate);

    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/admin', adminRoutes);
  });

  beforeEach(async () => {
    // Clean up test data before each test (keep admin user from environment)
    db.execute('DELETE FROM messages');
    db.execute('DELETE FROM sessions');
    db.execute('DELETE FROM users WHERE username NOT IN (?, ?)', ['admin', 'testadmin']);

    // Register test users
    const user1Res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser1', password: 'password1' });
    user1Token = user1Res.body.token;

    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser2', password: 'password2' });
    user2Token = user2Res.body.token;

    // Use default admin (created from environment variable DEFAULT_ADMIN_USERNAME=admin)
    // Login as admin using the test password from vitest.config.ts
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    // Close database connection
    if (db && db.isInitialized()) {
      db.close();
    }

    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Session Ownership Verification', () => {
    it('should allow user to access own session', async () => {
      // User1 creates a session
      const createRes = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'Hello from user1', style: 'gentle' });

      expect(createRes.status).toBe(200);
      user1SessionId = createRes.body.sessionId;

      // User1 accesses the session history
      const historyRes = await request(app)
        .get(`/api/chat/history?sessionId=${user1SessionId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.sessionId).toBe(user1SessionId);
      expect(historyRes.body.messages).toBeDefined();
    });

    it('should deny access to other users session', async () => {
      // User1 creates a session
      const createRes = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'Private message', style: 'gentle' });

      user1SessionId = createRes.body.sessionId;

      // User2 tries to access user1's session
      const historyRes = await request(app)
        .get(`/api/chat/history?sessionId=${user1SessionId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(historyRes.status).toBe(403);
      expect(historyRes.body.error).toBe('Forbidden');
      expect(historyRes.body.message).toContain('permission');
    });

    it('should prevent user from deleting other users session', async () => {
      // User1 creates a session
      const createRes = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'User1 message', style: 'gentle' });

      user1SessionId = createRes.body.sessionId;

      // User2 tries to delete user1's session
      const deleteRes = await request(app)
        .delete(`/api/chat/session?sessionId=${user1SessionId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error).toBe('Forbidden');
    });

    it('should prevent user from clearing other users session history', async () => {
      // User1 creates a session
      const createRes = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'Message to keep', style: 'gentle' });

      user1SessionId = createRes.body.sessionId;

      // User2 tries to clear user1's session
      const clearRes = await request(app)
        .delete(`/api/chat/history?sessionId=${user1SessionId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(clearRes.status).toBe(403);
      expect(clearRes.body.error).toBe('Forbidden');
    });
  });

  describe('Session ID Collision Prevention', () => {
    it('should prevent session ID collision', async () => {
      const sessionId = 'custom-session-id-123';

      // User1 creates session with custom ID
      const user1Res = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'User1 message', style: 'gentle', sessionId });

      expect(user1Res.status).toBe(200);
      expect(user1Res.body.sessionId).toBe(sessionId);

      // User2 tries to create session with same ID
      const user2Res = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ message: 'User2 message', style: 'gentle', sessionId });

      expect(user2Res.status).toBe(403);
      expect(user2Res.body.error).toBe('Forbidden');
      expect(user2Res.body.message).toContain('already exists');
    });

    it('should allow user to reuse own session ID', async () => {
      const sessionId = 'user-own-session-123';

      // User1 creates session
      const firstRes = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'First message', style: 'gentle', sessionId });

      expect(firstRes.status).toBe(200);

      // User1 sends another message to same session
      const secondRes = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'Second message', style: 'gentle', sessionId });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.sessionId).toBe(sessionId);
    });
  });

  describe('Admin Access Control', () => {
    it('should allow admin to access any session via admin API', async () => {
      // User1 creates session
      const createRes = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'User message', style: 'gentle' });

      user1SessionId = createRes.body.sessionId;

      // Admin accesses session via admin API
      const adminRes = await request(app)
        .get(`/api/admin/sessions/${user1SessionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.session.id).toBe(user1SessionId);
    });

    it('should prevent regular user from accessing admin session endpoint', async () => {
      // User1 creates session
      const createRes = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'Test message', style: 'gentle' });

      user1SessionId = createRes.body.sessionId;

      // User2 tries to access via admin API
      const adminAttempt = await request(app)
        .get(`/api/admin/sessions/${user1SessionId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(adminAttempt.status).toBe(403);
      expect(adminAttempt.body.error).toBe('Forbidden');
    });
  });

  describe('Session Service Level Protection', () => {
    it('should throw error when trying to create session with existing ID belonging to another user', async () => {
      const sessionService = require('../src/services/session.service').sessionService;

      // Get user IDs from database
      const user1 = db.queryOne<any>('SELECT id FROM users WHERE username = ?', ['testuser1']);
      const user2 = db.queryOne<any>('SELECT id FROM users WHERE username = ?', ['testuser2']);

      const sessionId = 'duplicate-session-test';

      // User1 creates session
      sessionService.getOrCreateSession(sessionId, user1.id);

      // User2 tries to create session with same ID - should throw
      expect(() => {
        sessionService.getOrCreateSession(sessionId, user2.id);
      }).toThrow('already exists');
    });
  });
});
