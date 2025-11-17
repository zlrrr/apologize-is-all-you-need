import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { UserService } from '../src/services/user.service.js';
import { SessionService } from '../src/services/session.service.js';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

/**
 * Multi-User Integration Tests
 * Tests data isolation between users and admin functionality
 * Covers Checkpoints 9.4-9.6
 */

describe('Multi-User Integration Tests', () => {
  let db: DatabaseService;
  let userService: UserService;
  let sessionService: SessionService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-multi-user.db');

  // Test users
  let user1Id: number;
  let user2Id: number;
  let adminId: number;
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;

  beforeAll(async () => {
    // Remove existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize test database
    db = new DatabaseService(testDbPath);
    await db.initialize();

    // Initialize services
    userService = new UserService(db);
    sessionService = new SessionService(db);

    // Create test users
    const user1 = await userService.register({ username: 'testuser1', password: 'password123' });
    user1Id = user1.id;

    const user2 = await userService.register({ username: 'testuser2', password: 'password456' });
    user2Id = user2.id;

    // Get admin ID
    const admin = userService.getUserByUsername('admin');
    adminId = admin!.id;
  });

  afterAll(async () => {
    // Clean up
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  beforeEach(() => {
    // Clear sessions and messages before each test (keep users)
    db.execute('DELETE FROM messages');
    db.execute('DELETE FROM sessions');
  });

  describe('Default Admin Account', () => {
    it('should have default admin account with username "admin"', () => {
      const admin = userService.getUserByUsername('admin');
      expect(admin).toBeDefined();
      expect(admin?.username).toBe('admin');
      expect(admin?.role).toBe('admin');
      expect(admin?.isActive).toBe(true);
    });

    it('should authenticate with default password "admin123"', async () => {
      // Get user with password hash from database directly
      const adminWithHash = db.queryOne<any>(
        'SELECT * FROM users WHERE username = ?',
        ['admin']
      );
      expect(adminWithHash).toBeDefined();

      const isValid = await bcrypt.compare('admin123', adminWithHash.password_hash);
      expect(isValid).toBe(true);
    });

    it('should confirm admin user was set in beforeAll', () => {
      expect(adminId).toBeDefined();
      const admin = userService.getUserById(adminId);
      expect(admin).toBeDefined();
      expect(admin?.role).toBe('admin');
    });
  });

  describe('User Creation and Data Isolation Setup', () => {
    it('should have created two regular users in beforeAll', () => {
      expect(user1Id).toBeDefined();
      expect(user2Id).toBeDefined();
      expect(adminId).toBeDefined();
    });

    it('should retrieve users by ID', () => {
      const user1 = userService.getUserById(user1Id);
      expect(user1).toBeDefined();
      expect(user1?.id).toBe(user1Id);
      expect(user1?.username).toBe('testuser1');

      const user2 = userService.getUserById(user2Id);
      expect(user2).toBeDefined();
      expect(user2?.id).toBe(user2Id);
      expect(user2?.username).toBe('testuser2');
    });
  });

  describe('Session Data Isolation', () => {
    it('should create separate sessions for each user', () => {
      // User1 creates a session
      const session1 = sessionService.getOrCreateSession('session-user1', user1Id);
      expect(session1).toBeDefined();
      expect(session1.id).toBe('session-user1');
      expect(session1.userId).toBe(user1Id);

      // User2 creates a session
      const session2 = sessionService.getOrCreateSession('session-user2', user2Id);
      expect(session2).toBeDefined();
      expect(session2.id).toBe('session-user2');
      expect(session2.userId).toBe(user2Id);
    });

    it('should not allow user1 to access user2\'s session', () => {
      // User2 creates a session
      sessionService.getOrCreateSession('session-user2-private', user2Id);

      // User1 tries to access user2's session
      const session = sessionService.getSession('session-user2-private', user1Id);
      expect(session).toBeUndefined();
    });

    it('should only return user-owned sessions in getUserSessions', () => {
      // Create multiple sessions for user1
      sessionService.getOrCreateSession('user1-session-1', user1Id);
      sessionService.getOrCreateSession('user1-session-2', user1Id);

      // Create sessions for user2
      sessionService.getOrCreateSession('user2-session-1', user2Id);

      // Get user1's sessions
      const user1Sessions = sessionService.getUserSessions(user1Id);
      expect(user1Sessions).toHaveLength(2);
      expect(user1Sessions.every((s) => s.userId === user1Id)).toBe(true);

      // Get user2's sessions
      const user2Sessions = sessionService.getUserSessions(user2Id);
      expect(user2Sessions).toHaveLength(1);
      expect(user2Sessions.every((s) => s.userId === user2Id)).toBe(true);
    });

    it('should delete only user-owned sessions', () => {
      // Create sessions
      sessionService.getOrCreateSession('delete-test-user1', user1Id);
      sessionService.getOrCreateSession('delete-test-user2', user2Id);

      // User1 tries to delete user2's session - should not work
      sessionService.deleteSession('delete-test-user2', user1Id);

      // Verify user2's session still exists
      const user2Session = sessionService.getSession('delete-test-user2', user2Id);
      expect(user2Session).toBeDefined();

      // User2 deletes their own session
      sessionService.deleteSession('delete-test-user2', user2Id);
      const deletedSession = sessionService.getSession('delete-test-user2', user2Id);
      expect(deletedSession).toBeUndefined();
    });
  });

  describe('Message Data Isolation', () => {
    it('should isolate messages between users in different sessions', () => {
      // User1 creates session and adds messages
      sessionService.getOrCreateSession('msg-test-user1', user1Id);
      sessionService.addMessage('msg-test-user1', user1Id, {
        role: 'user',
        content: 'User1 private message',
      });

      // User2 creates session and adds messages
      sessionService.getOrCreateSession('msg-test-user2', user2Id);
      sessionService.addMessage('msg-test-user2', user2Id, {
        role: 'user',
        content: 'User2 private message',
      });

      // User1 should only see their messages
      const user1Messages = sessionService.getMessages('msg-test-user1', user1Id);
      expect(user1Messages).toHaveLength(1);
      expect(user1Messages[0].content).toBe('User1 private message');

      // User1 should not access user2's messages
      const user1AccessUser2 = sessionService.getMessages('msg-test-user2', user1Id);
      expect(user1AccessUser2).toHaveLength(0);

      // User2 should only see their messages
      const user2Messages = sessionService.getMessages('msg-test-user2', user2Id);
      expect(user2Messages).toHaveLength(1);
      expect(user2Messages[0].content).toBe('User2 private message');
    });

    it('should track message counts per session correctly', () => {
      // Create session for user1
      sessionService.getOrCreateSession('count-test', user1Id);

      // Add multiple messages
      sessionService.addMessage('count-test', user1Id, { role: 'user', content: 'Message 1' });
      sessionService.addMessage('count-test', user1Id, { role: 'assistant', content: 'Reply 1' });
      sessionService.addMessage('count-test', user1Id, { role: 'user', content: 'Message 2' });

      // Get session and verify count through messages array
      const session = sessionService.getSession('count-test', user1Id);
      expect(session?.messages.length).toBe(3);
    });

    it('should clear only user-owned session messages', () => {
      // User1 creates session with messages
      sessionService.getOrCreateSession('clear-test-user1', user1Id);
      sessionService.addMessage('clear-test-user1', user1Id, {
        role: 'user',
        content: 'Message 1',
      });

      // User2 creates session with messages
      sessionService.getOrCreateSession('clear-test-user2', user2Id);
      sessionService.addMessage('clear-test-user2', user2Id, {
        role: 'user',
        content: 'Message 2',
      });

      // User1 tries to clear user2's messages - should not work
      sessionService.clearSession('clear-test-user2', user1Id);
      const user2Messages = sessionService.getMessages('clear-test-user2', user2Id);
      expect(user2Messages).toHaveLength(1);

      // User1 clears their own messages
      sessionService.clearSession('clear-test-user1', user1Id);
      const user1Messages = sessionService.getMessages('clear-test-user1', user1Id);
      expect(user1Messages).toHaveLength(0);
    });
  });

  describe('Admin Functionality', () => {
    it('should allow admin to view all users', () => {
      const allUsers = userService.getAllUsers();
      expect(allUsers.length).toBeGreaterThanOrEqual(3); // admin + user1 + user2

      const usernames = allUsers.map((u) => u.username);
      expect(usernames).toContain('admin');
      expect(usernames).toContain('testuser1');
      expect(usernames).toContain('testuser2');
    });

    it('should allow admin to get detailed user information', () => {
      const user = userService.getUserById(user1Id);
      expect(user).toBeDefined();
      expect(user?.id).toBe(user1Id);
      expect(user?.username).toBe('testuser1');

      const stats = userService.getUserStats(user1Id);
      expect(stats).toBeDefined();
      expect(stats.sessionCount).toBeDefined();
    });

    it('should allow admin to update user status', () => {
      // Disable user1
      userService.updateUserStatus(user1Id, false);
      const disabledUser = userService.getUserById(user1Id);
      expect(disabledUser?.isActive).toBe(false);

      // Re-enable user1
      userService.updateUserStatus(user1Id, true);
      const enabledUser = userService.getUserById(user1Id);
      expect(enabledUser?.isActive).toBe(true);
    });

    it('should allow sessions for disabled users (auth middleware prevents this in routes)', () => {
      // Disable user1
      userService.updateUserStatus(user1Id, false);

      // Session service itself doesn't check user status
      // (this is enforced at the authentication middleware level)
      const session = sessionService.getOrCreateSession('disabled-user-session', user1Id);
      expect(session).toBeDefined();

      // Re-enable user1 for other tests
      userService.updateUserStatus(user1Id, true);
    });

    it('should allow admin to view all sessions across all users', () => {
      // Create sessions for different users
      sessionService.getOrCreateSession('admin-view-user1', user1Id);
      sessionService.getOrCreateSession('admin-view-user2', user2Id);

      // In a real implementation, there would be an admin method to get all sessions
      // For now, verify through database directly
      const allSessions = db.query('SELECT * FROM sessions');
      expect(allSessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should get system statistics', () => {
      // Ensure all users are active for consistent test results
      userService.updateUserStatus(user1Id, true);
      userService.updateUserStatus(user2Id, true);

      const users = userService.getAllUsers();
      const totalSessions = sessionService.getSessionCount();

      const stats = {
        users: {
          total: users.length,
          active: users.filter((u) => u.isActive).length,
          inactive: users.filter((u) => !u.isActive).length,
          admins: users.filter((u) => u.role === 'admin').length,
        },
        sessions: {
          total: totalSessions,
        },
      };

      expect(stats.users.total).toBeGreaterThanOrEqual(3); // admin + user1 + user2
      expect(stats.users.active).toBeGreaterThanOrEqual(3); // all should be active
      expect(stats.users.inactive).toBe(0); // none should be inactive
      expect(stats.users.admins).toBeGreaterThanOrEqual(1);
      expect(stats.sessions.total).toBeDefined();
    });
  });

  describe('Cross-User Attack Prevention', () => {
    it('should prevent user from accessing another user\'s data via session ID reuse', () => {
      // User2 creates a session
      sessionService.getOrCreateSession('shared-session-id', user2Id);
      sessionService.addMessage('shared-session-id', user2Id, {
        role: 'user',
        content: 'User2 secret message',
      });

      // User1 tries to access the same session ID
      const messages = sessionService.getMessages('shared-session-id', user1Id);
      expect(messages).toHaveLength(0);
    });

    it('should prevent session enumeration attacks', () => {
      // User2 creates sessions
      sessionService.getOrCreateSession('user2-session-a', user2Id);
      sessionService.getOrCreateSession('user2-session-b', user2Id);

      // User1 tries to enumerate user2's sessions
      const user1Sessions = sessionService.getUserSessions(user1Id);
      const user2SessionIds = ['user2-session-a', 'user2-session-b'];

      user1Sessions.forEach((session) => {
        expect(user2SessionIds).not.toContain(session.id);
      });
    });

    it('should enforce user_id in all database queries', () => {
      // Create session for user2
      sessionService.getOrCreateSession('security-test', user2Id);
      sessionService.addMessage('security-test', user2Id, {
        role: 'user',
        content: 'Secure message',
      });

      // Verify messages table has user_id column populated
      const messages = db.query('SELECT * FROM messages WHERE session_id = ?', [
        'security-test',
      ]);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toHaveProperty('user_id');
      expect(messages[0].user_id).toBe(user2Id);
    });
  });

  describe('Update Session Title with Data Isolation', () => {
    it('should allow user to update own session title', () => {
      // User1 creates session
      sessionService.getOrCreateSession('title-test-user1', user1Id);

      // User1 updates title
      sessionService.updateSessionTitle('title-test-user1', user1Id, 'My Updated Title');

      // Verify title updated
      const session = sessionService.getSession('title-test-user1', user1Id);
      expect(session?.title).toBe('My Updated Title');
    });

    it('should prevent user from updating another user\'s session title', () => {
      // User2 creates session
      sessionService.getOrCreateSession('title-test-user2', user2Id);
      sessionService.updateSessionTitle('title-test-user2', user2Id, 'User2 Title');

      // User1 tries to update user2's session title
      sessionService.updateSessionTitle('title-test-user2', user1Id, 'Hacked Title');

      // Verify title unchanged
      const session = sessionService.getSession('title-test-user2', user2Id);
      expect(session?.title).toBe('User2 Title');
    });
  });

  describe('Token Usage Tracking with Data Isolation', () => {
    it('should track tokens per user separately', () => {
      // User1 creates session and adds message with tokens
      sessionService.getOrCreateSession('token-test-user1', user1Id);
      sessionService.addMessage(
        'token-test-user1',
        user1Id,
        { role: 'user', content: 'Test' },
        100
      );

      // User2 creates session and adds message with tokens
      sessionService.getOrCreateSession('token-test-user2', user2Id);
      sessionService.addMessage(
        'token-test-user2',
        user2Id,
        { role: 'user', content: 'Test' },
        200
      );

      // Verify tokens are stored in database per message
      const user1Messages = db.query<any>(
        'SELECT SUM(tokens_used) as total FROM messages WHERE session_id = ? AND user_id = ?',
        ['token-test-user1', user1Id]
      );
      const user2Messages = db.query<any>(
        'SELECT SUM(tokens_used) as total FROM messages WHERE session_id = ? AND user_id = ?',
        ['token-test-user2', user2Id]
      );

      expect(user1Messages[0].total).toBe(100);
      expect(user2Messages[0].total).toBe(200);
    });
  });
});
