import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import authRoutes from '../src/routes/auth.routes.js';
import { authenticate } from '../src/middleware/auth.middleware.js';
import { db } from '../src/database/database.service.js';
import { userService } from '../src/services/user.service.js';

describe('Auth Routes Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Setup Express app with auth routes
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  beforeEach(async () => {
    // Clean all user data except admin (id = 1)
    db.execute('DELETE FROM messages');
    db.execute('DELETE FROM sessions');
    db.execute('DELETE FROM users WHERE id != 1');
  });

  afterAll(async () => {
    // Final cleanup
    db.execute('DELETE FROM messages');
    db.execute('DELETE FROM sessions');
    db.execute('DELETE FROM users WHERE id != 1');
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.user.username).toBe('newuser');
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.isActive).toBe(true);
      expect(response.body.user.password_hash).toBeUndefined();
      expect(typeof response.body.token).toBe('string');
    });

    it('should fail to register with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('required');
    });

    it('should fail to register with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('required');
    });

    it('should fail to register with duplicate username', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(201);

      // Second registration with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password456',
        })
        .expect(409);

      expect(response.body.error).toBe('Conflict');
      expect(response.body.message).toContain('already exists');
    });

    it('should fail to register with username too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('at least');
    });

    it('should fail to register with password too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: '12345',
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('at least');
    });

    it('should fail to register with invalid username characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test user!',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('can only contain');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await userService.register({
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should successfully login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.lastLoginAt).toBeDefined();
      expect(typeof response.body.token).toBe('string');
    });

    it('should fail to login with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('required');
    });

    it('should fail to login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('required');
    });

    it('should fail to login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Invalid username or password');
    });

    it('should fail to login with non-existent username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Invalid username or password');
    });

    it('should fail to login with inactive user', async () => {
      // Deactivate user
      const user = userService.getUserByUsername('testuser');
      if (user) {
        userService.updateUserStatus(user.id, false);
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toContain('disabled');
    });

    it('should return token that can be verified', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      const token = response.body.token;

      // Use token to access protected route (we'll add this later)
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;
    let testUserId: number;

    beforeEach(async () => {
      // Register and login to get auth token
      const user = await userService.register({
        username: 'testuser',
        password: 'password123',
      });
      testUserId = user.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      authToken = loginResponse.body.token;
    });

    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.id).toBe(testUserId);
    });

    it('should fail without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get auth token
      await userService.register({
        username: 'testuser',
        password: 'password123',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      authToken = loginResponse.body.token;
    });

    it('should refresh token with valid auth token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.success).toBe(true);
      expect(response.body.token).not.toBe(authToken); // Should be a new token
    });

    it('should fail without authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get auth token
      await userService.register({
        username: 'testuser',
        password: 'password123',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      authToken = loginResponse.body.token;
    });

    it('should successfully logout with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail without authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/verify (Legacy)', () => {
    it('should return token when no auth configured', async () => {
      // When INVITE_CODES and ACCESS_PASSWORD are not set
      const response = await request(app)
        .post('/api/auth/verify')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    it('should accept empty credentials when auth not configured', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          inviteCode: '',
          password: '',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return auth status', async () => {
      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body).toHaveProperty('authEnabled');
      expect(response.body).toHaveProperty('isAuthenticated');
      expect(response.body).toHaveProperty('requiresAuth');
      expect(typeof response.body.authEnabled).toBe('boolean');
      expect(typeof response.body.isAuthenticated).toBe('boolean');
    });

    it('should show isAuthenticated=true with valid token', async () => {
      // Register and login
      await userService.register({
        username: 'testuser',
        password: 'password123',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      const authToken = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.isAuthenticated).toBe(true);
    });

    it('should show isAuthenticated=false without token', async () => {
      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body.isAuthenticated).toBe(false);
    });
  });

  describe('Integration: Full Auth Flow', () => {
    it('should complete full registration -> login -> protected route -> logout flow', async () => {
      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'flowtest',
          password: 'password123',
        })
        .expect(201);

      expect(registerResponse.body.user.username).toBe('flowtest');
      const registerToken = registerResponse.body.token;

      // Step 2: Use registration token to access protected route
      const meResponse1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      expect(meResponse1.body.user.username).toBe('flowtest');

      // Step 3: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'flowtest',
          password: 'password123',
        })
        .expect(200);

      const loginToken = loginResponse.body.token;
      expect(loginToken).not.toBe(registerToken); // Should be different token

      // Step 4: Use login token to access protected route
      const meResponse2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(meResponse2.body.user.username).toBe('flowtest');

      // Step 5: Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      const refreshedToken = refreshResponse.body.token;
      expect(refreshedToken).not.toBe(loginToken);

      // Step 6: Use refreshed token
      const meResponse3 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshedToken}`)
        .expect(200);

      expect(meResponse3.body.user.username).toBe('flowtest');

      // Step 7: Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${refreshedToken}`)
        .expect(200);
    });

    it('should handle multiple concurrent registrations correctly', async () => {
      const usernames = ['user1', 'user2', 'user3', 'user4', 'user5'];

      const registrationPromises = usernames.map((username) =>
        request(app)
          .post('/api/auth/register')
          .send({
            username,
            password: 'password123',
          })
      );

      const responses = await Promise.all(registrationPromises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.user.username).toBe(usernames[index]);
        expect(response.body.token).toBeDefined();
      });
    });

    it('should prevent duplicate registrations in concurrent requests', async () => {
      const registrationPromises = Array(3)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/auth/register')
            .send({
              username: 'sameuser',
              password: 'password123',
            })
        );

      const responses = await Promise.all(registrationPromises);

      // One should succeed (201), others should fail (409)
      const successCount = responses.filter((r) => r.status === 201).length;
      const conflictCount = responses.filter((r) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express should handle this with default error handler
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('username=test&password=test')
        .expect(400);

      // Should fail validation since username/password won't be parsed correctly
    });
  });
});
