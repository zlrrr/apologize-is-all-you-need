/**
 * Session List Data Isolation Tests
 * Tests to verify users can only see their own sessions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { DatabaseService } from '../src/database/database.service';
import authRoutes from '../src/routes/auth.routes';
import chatRoutes from '../src/routes/chat.routes';
import cors from 'cors';
import session from 'express-session';
import { optionalAuthenticate } from '../src/middleware/auth.middleware';
import fs from 'fs';
import path from 'path';

describe('Session List Data Isolation', () => {
  let app: express.Application;
  let db: DatabaseService;
  const testDbPath = path.join(__dirname, 'test-session-list.db');

  let user1Token: string;
  let user2Token: string;
  let user1Id: number;
  let user2Id: number;

  beforeAll(async () => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize database
    db = DatabaseService.getInstance();
    await db.initialize(testDbPath);

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
  });

  beforeEach(async () => {
    // Clean up sessions and users
    db.execute('DELETE FROM messages');
    db.execute('DELETE FROM sessions');
    db.execute('DELETE FROM users WHERE role != ?', ['admin']);

    // Register test users
    const user1Res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user1', password: 'pass1' });
    user1Token = user1Res.body.token;
    user1Id = user1Res.body.user.id;

    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user2', password: 'pass2' });
    user2Token = user2Res.body.token;
    user2Id = user2Res.body.user.id;
  });

  afterAll(async () => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Session List Visibility', () => {
    it('should only return user\'s own sessions in session list', async () => {
      // User1 creates 2 sessions
      await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'User1 message 1', style: 'gentle' });

      await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'User1 message 2', style: 'gentle' });

      // User2 creates 1 session
      await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ message: 'User2 message', style: 'gentle' });

      // User1 gets session list - should only see their 2 sessions
      const user1Sessions = await request(app)
        .get('/api/chat/sessions')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(user1Sessions.status).toBe(200);
      expect(user1Sessions.body.sessions).toHaveLength(2);
      expect(user1Sessions.body.sessions.every((s: any) =>
        s.messageCount > 0
      )).toBe(true);

      // User2 gets session list - should only see their 1 session
      const user2Sessions = await request(app)
        .get('/api/chat/sessions')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2Sessions.status).toBe(200);
      expect(user2Sessions.body.sessions).toHaveLength(1);
    });

    it('should not expose other users\' session IDs in the list', async () => {
      // User1 creates a session
      const user1Res = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'User1 private data', style: 'gentle' });

      const user1SessionId = user1Res.body.sessionId;

      // User2 gets session list
      const user2Sessions = await request(app)
        .get('/api/chat/sessions')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2Sessions.status).toBe(200);

      // User2's session list should NOT contain user1's session ID
      const sessionIds = user2Sessions.body.sessions.map((s: any) => s.id);
      expect(sessionIds).not.toContain(user1SessionId);
    });

    it('should handle orphaned sessions (sessions without valid user_id)', async () => {
      // Create an orphaned session directly in database (simulating old data)
      const orphanedSessionId = 'orphaned-session-123';
      db.execute(
        'INSERT INTO sessions (id, user_id, title) VALUES (?, ?, ?)',
        [orphanedSessionId, 99999, 'Orphaned Session'] // Non-existent user_id
      );

      // User1 gets session list - should NOT see orphaned session
      const user1Sessions = await request(app)
        .get('/api/chat/sessions')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(user1Sessions.status).toBe(200);
      const sessionIds = user1Sessions.body.sessions.map((s: any) => s.id);
      expect(sessionIds).not.toContain(orphanedSessionId);
    });
  });

  describe('Session Count Accuracy', () => {
    it('should return accurate session count for user', async () => {
      // User1 creates 3 sessions
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/chat/message')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ message: `Message ${i}`, style: 'gentle' });
      }

      // Get session list
      const response = await request(app)
        .get('/api/chat/sessions')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
      expect(response.body.sessions).toHaveLength(3);
    });
  });

  describe('Database Level Verification', () => {
    it('should verify getUserSessions only returns user\'s own sessions', async () => {
      const sessionService = require('../src/services/session.service').sessionService;

      // Create sessions for both users directly
      db.execute(
        'INSERT INTO sessions (id, user_id, title) VALUES (?, ?, ?)',
        ['user1-session', user1Id, 'User1 Session']
      );

      db.execute(
        'INSERT INTO sessions (id, user_id, title) VALUES (?, ?, ?)',
        ['user2-session', user2Id, 'User2 Session']
      );

      // Get user1's sessions
      const user1Sessions = sessionService.getUserSessions(user1Id);
      expect(user1Sessions).toHaveLength(1);
      expect(user1Sessions[0].id).toBe('user1-session');
      expect(user1Sessions[0].userId).toBe(user1Id);

      // Get user2's sessions
      const user2Sessions = sessionService.getUserSessions(user2Id);
      expect(user2Sessions).toHaveLength(1);
      expect(user2Sessions[0].id).toBe('user2-session');
      expect(user2Sessions[0].userId).toBe(user2Id);
    });
  });
});
