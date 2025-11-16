import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserService } from '../src/services/user.service.js';
import { DatabaseService } from '../src/database/database.service.js';
import fs from 'fs';
import path from 'path';

describe('UserService', () => {
  let userService: UserService;
  let dbService: DatabaseService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-apologize.db');

  beforeEach(async () => {
    // Remove test database if exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize test database
    dbService = new DatabaseService(testDbPath);
    await dbService.initialize();

    // Create user service instance with test database
    userService = new UserService(dbService);
  });

  afterEach(async () => {
    // Clean up - close database first, then delete file
    if (dbService && dbService.isInitialized()) {
      dbService.close();
    }

    // Wait a bit for file handles to be released
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (error) {
        // Ignore error if file is still locked
        console.warn('Could not delete test database:', error);
      }
    }
  });

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const user = await userService.register({
        username: 'testuser',
        password: 'password123',
      });

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.id).toBeDefined();
      // Password hash should not be in the safe user object
      expect((user as any).password_hash).toBeUndefined();
    });

    it('should fail to register with duplicate username', async () => {
      await userService.register({
        username: 'testuser',
        password: 'password123',
      });

      await expect(
        userService.register({
          username: 'testuser',
          password: 'password456',
        })
      ).rejects.toThrow('Username already exists');
    });

    it('should fail to register with username too short', async () => {
      await expect(
        userService.register({
          username: 'ab',
          password: 'password123',
        })
      ).rejects.toThrow('at least 3 characters');
    });

    it('should fail to register with username too long', async () => {
      const longUsername = 'a'.repeat(51);
      await expect(
        userService.register({
          username: longUsername,
          password: 'password123',
        })
      ).rejects.toThrow('at most 50 characters');
    });

    it('should fail to register with invalid username characters', async () => {
      await expect(
        userService.register({
          username: 'test user!',
          password: 'password123',
        })
      ).rejects.toThrow('can only contain');
    });

    it('should fail to register with password too short', async () => {
      await expect(
        userService.register({
          username: 'testuser',
          password: '12345',
        })
      ).rejects.toThrow('at least 6 characters');
    });

    it('should fail to register with missing username', async () => {
      await expect(
        userService.register({
          username: '',
          password: 'password123',
        })
      ).rejects.toThrow('Username is required');
    });

    it('should fail to register with missing password', async () => {
      await expect(
        userService.register({
          username: 'testuser',
          password: '',
        })
      ).rejects.toThrow('Password is required');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user
      await userService.register({
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should successfully login with correct credentials', async () => {
      const user = await userService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.lastLoginAt).toBeDefined();
    });

    it('should fail to login with incorrect password', async () => {
      await expect(
        userService.login({
          username: 'testuser',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid username or password');
    });

    it('should fail to login with non-existent username', async () => {
      await expect(
        userService.login({
          username: 'nonexistent',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid username or password');
    });

    it('should fail to login with inactive user', async () => {
      // Get the user and deactivate
      const user = userService.getUserByUsername('testuser');
      if (user) {
        userService.updateUserStatus(user.id, false);
      }

      await expect(
        userService.login({
          username: 'testuser',
          password: 'password123',
        })
      ).rejects.toThrow('Account is disabled');
    });

    it('should update last_login_at timestamp on successful login', async () => {
      // Set beforeLogin to 1 second earlier to account for SQLite CURRENT_TIMESTAMP precision (seconds only)
      const beforeLogin = new Date(Date.now() - 1000);

      const user = await userService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(user.lastLoginAt).toBeDefined();
      const lastLoginDate = new Date(user.lastLoginAt!);
      expect(lastLoginDate.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('Get User Operations', () => {
    let testUserId: number;

    beforeEach(async () => {
      const user = await userService.register({
        username: 'testuser',
        password: 'password123',
      });
      testUserId = user.id;
    });

    it('should get user by ID', () => {
      const user = userService.getUserById(testUserId);

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect(user?.id).toBe(testUserId);
    });

    it('should return null for non-existent user ID', () => {
      const user = userService.getUserById(99999);

      expect(user).toBeNull();
    });

    it('should get user by username', () => {
      const user = userService.getUserByUsername('testuser');

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect(user?.id).toBe(testUserId);
    });

    it('should return null for non-existent username', () => {
      const user = userService.getUserByUsername('nonexistent');

      expect(user).toBeNull();
    });

    it('should get all users', async () => {
      // Register another user
      await userService.register({
        username: 'testuser2',
        password: 'password123',
      });

      const users = userService.getAllUsers();

      // Should have at least 3 users (admin + testuser + testuser2)
      expect(users.length).toBeGreaterThanOrEqual(3);
      expect(users.some((u) => u.username === 'admin')).toBe(true);
      expect(users.some((u) => u.username === 'testuser')).toBe(true);
      expect(users.some((u) => u.username === 'testuser2')).toBe(true);
    });
  });

  describe('Update User Status', () => {
    let testUserId: number;

    beforeEach(async () => {
      const user = await userService.register({
        username: 'testuser',
        password: 'password123',
      });
      testUserId = user.id;
    });

    it('should deactivate user', () => {
      const updatedUser = userService.updateUserStatus(testUserId, false);

      expect(updatedUser.isActive).toBe(false);
    });

    it('should activate user', () => {
      // First deactivate
      userService.updateUserStatus(testUserId, false);

      // Then activate
      const updatedUser = userService.updateUserStatus(testUserId, true);

      expect(updatedUser.isActive).toBe(true);
    });
  });

  describe('Change Password', () => {
    let testUserId: number;

    beforeEach(async () => {
      const user = await userService.register({
        username: 'testuser',
        password: 'oldpassword',
      });
      testUserId = user.id;
    });

    it('should successfully change password with correct old password', async () => {
      await userService.changePassword(testUserId, 'oldpassword', 'newpassword123');

      // Verify new password works
      const user = await userService.login({
        username: 'testuser',
        password: 'newpassword123',
      });

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
    });

    it('should fail to change password with incorrect old password', async () => {
      await expect(
        userService.changePassword(testUserId, 'wrongpassword', 'newpassword123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should fail to change password with new password too short', async () => {
      await expect(
        userService.changePassword(testUserId, 'oldpassword', '12345')
      ).rejects.toThrow('at least 6 characters');
    });

    it('should fail to change password for non-existent user', async () => {
      await expect(
        userService.changePassword(99999, 'oldpassword', 'newpassword123')
      ).rejects.toThrow('User not found');
    });
  });

  describe('Delete User', () => {
    let testUserId: number;

    beforeEach(async () => {
      const user = await userService.register({
        username: 'testuser',
        password: 'password123',
      });
      testUserId = user.id;
    });

    it('should soft delete user (set is_active to false)', () => {
      userService.deleteUser(testUserId);

      const user = userService.getUserById(testUserId);

      expect(user).toBeDefined();
      expect(user?.isActive).toBe(false);
    });

    it('should prevent login after deletion', async () => {
      userService.deleteUser(testUserId);

      await expect(
        userService.login({
          username: 'testuser',
          password: 'password123',
        })
      ).rejects.toThrow('Account is disabled');
    });
  });

  describe('User Statistics', () => {
    let testUserId: number;

    beforeEach(async () => {
      const user = await userService.register({
        username: 'testuser',
        password: 'password123',
      });
      testUserId = user.id;
    });

    it('should return user statistics with zero counts for new user', () => {
      const stats = userService.getUserStats(testUserId);

      expect(stats).toBeDefined();
      expect(stats.userId).toBe(testUserId);
      expect(stats.sessionCount).toBe(0);
      expect(stats.messageCount).toBe(0);
      expect(stats.firstSessionDate).toBeNull();
      expect(stats.lastActivityDate).toBeNull();
    });
  });

  describe('Default Admin User', () => {
    it('should have default admin user created', () => {
      const admin = userService.getUserByUsername('admin');

      expect(admin).toBeDefined();
      expect(admin?.role).toBe('admin');
      expect(admin?.isActive).toBe(true);
    });

    it('should be able to login as admin with default password', async () => {
      const admin = await userService.login({
        username: 'admin',
        password: 'admin123',
      });

      expect(admin).toBeDefined();
      expect(admin.username).toBe('admin');
      expect(admin.role).toBe('admin');
    });
  });
});
