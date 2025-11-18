/**
 * Storage Service Unit Tests
 * Tests for user-isolated session caching
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getActiveSessionId,
  setActiveSessionId,
  clearActiveSessionId,
  clearUserSessionData,
  clearAllSessionData,
} from './storage';

describe('Storage - User Isolation Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('Active Session Management', () => {
    it('should set and get active session with user isolation', () => {
      const userId1 = 1;
      const userId2 = 2;
      const sessionId1 = 'session-user-1';
      const sessionId2 = 'session-user-2';

      // Set active sessions for two different users
      setActiveSessionId(sessionId1, userId1);
      setActiveSessionId(sessionId2, userId2);

      // Each user should have their own active session
      expect(getActiveSessionId(userId1)).toBe(sessionId1);
      expect(getActiveSessionId(userId2)).toBe(sessionId2);
    });

    it('should return null for user without active session', () => {
      const userId = 1;
      expect(getActiveSessionId(userId)).toBeNull();
    });

    it('should clear active session for specific user', () => {
      const userId1 = 1;
      const userId2 = 2;

      setActiveSessionId('session-1', userId1);
      setActiveSessionId('session-2', userId2);

      // Clear only user1's session
      clearActiveSessionId(userId1);

      expect(getActiveSessionId(userId1)).toBeNull();
      expect(getActiveSessionId(userId2)).toBe('session-2');
    });

    it('should use user-specific localStorage keys', () => {
      const userId = 1;
      const sessionId = 'test-session-123';

      setActiveSessionId(sessionId, userId);

      // Verify the key format includes userId
      const expectedKey = `apology_active_session_user_${userId}`;
      expect(localStorage.getItem(expectedKey)).toBe(sessionId);
    });
  });

  describe('User Data Cleanup', () => {
    it('should clear all session data for a specific user', () => {
      const userId = 1;

      // Simulate cached data
      localStorage.setItem(`apology_sessions_cache_user_${userId}`, JSON.stringify({ data: [], timestamp: Date.now() }));
      localStorage.setItem(`apology_active_session_user_${userId}`, 'session-123');

      // Clear user data
      clearUserSessionData(userId);

      // Verify all user-specific keys are removed
      expect(localStorage.getItem(`apology_sessions_cache_user_${userId}`)).toBeNull();
      expect(localStorage.getItem(`apology_active_session_user_${userId}`)).toBeNull();
    });

    it('should not affect other users data when clearing specific user', () => {
      const userId1 = 1;
      const userId2 = 2;

      // Set data for both users
      setActiveSessionId('session-1', userId1);
      setActiveSessionId('session-2', userId2);

      // Clear only user1
      clearUserSessionData(userId1);

      // User2's data should remain
      expect(getActiveSessionId(userId1)).toBeNull();
      expect(getActiveSessionId(userId2)).toBe('session-2');
    });

    it('should clear all session data across all users', () => {
      // Simulate multiple users
      setActiveSessionId('session-1', 1);
      setActiveSessionId('session-2', 2);
      setActiveSessionId('session-3', 3);

      // Add some cache data
      localStorage.setItem('apology_sessions_cache_user_1', 'data1');
      localStorage.setItem('apology_sessions_cache_user_2', 'data2');

      // Clear all session data
      clearAllSessionData();

      // All session-related keys should be removed
      expect(getActiveSessionId(1)).toBeNull();
      expect(getActiveSessionId(2)).toBeNull();
      expect(getActiveSessionId(3)).toBeNull();
      expect(localStorage.getItem('apology_sessions_cache_user_1')).toBeNull();
      expect(localStorage.getItem('apology_sessions_cache_user_2')).toBeNull();
    });

    it('should not remove non-session localStorage keys', () => {
      // Add some non-session keys
      localStorage.setItem('auth_token', 'token123');
      localStorage.setItem('other_app_data', 'data');

      // Add session keys
      setActiveSessionId('session-1', 1);

      // Clear all session data
      clearAllSessionData();

      // Session keys should be removed
      expect(getActiveSessionId(1)).toBeNull();

      // Non-session keys should remain
      expect(localStorage.getItem('auth_token')).toBe('token123');
      expect(localStorage.getItem('other_app_data')).toBe('data');
    });
  });

  describe('Cache Key Format', () => {
    it('should generate correct cache key format for sessions', () => {
      const userId = 42;
      const expectedCacheKey = `apology_sessions_cache_user_${userId}`;
      const expectedActiveKey = `apology_active_session_user_${userId}`;

      setActiveSessionId('test-session', userId);

      // Verify the expected keys exist in localStorage
      const allKeys = Object.keys(localStorage);
      expect(allKeys).toContain(expectedActiveKey);
    });

    it('should differentiate between users with similar IDs', () => {
      setActiveSessionId('session-10', 1);
      setActiveSessionId('session-100', 10);
      setActiveSessionId('session-100x', 100);

      expect(getActiveSessionId(1)).toBe('session-10');
      expect(getActiveSessionId(10)).toBe('session-100');
      expect(getActiveSessionId(100)).toBe('session-100x');
    });
  });

  describe('Edge Cases', () => {
    it('should handle userId of 0', () => {
      const userId = 0;
      const sessionId = 'session-zero';

      setActiveSessionId(sessionId, userId);
      expect(getActiveSessionId(userId)).toBe(sessionId);
    });

    it('should handle large userId values', () => {
      const userId = 9999999;
      const sessionId = 'session-large-id';

      setActiveSessionId(sessionId, userId);
      expect(getActiveSessionId(userId)).toBe(sessionId);
    });

    it('should handle clearing non-existent user data', () => {
      // Should not throw error
      expect(() => clearUserSessionData(999)).not.toThrow();
    });

    it('should handle overwriting active session for same user', () => {
      const userId = 1;

      setActiveSessionId('session-1', userId);
      expect(getActiveSessionId(userId)).toBe('session-1');

      setActiveSessionId('session-2', userId);
      expect(getActiveSessionId(userId)).toBe('session-2');
    });
  });
});

describe('Storage - Logout Scenario Simulation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should simulate complete logout flow', () => {
    // Simulate user login and activity
    const userId = 1;

    // User creates sessions
    setActiveSessionId('session-abc', userId);
    localStorage.setItem(`apology_sessions_cache_user_${userId}`, JSON.stringify({
      data: [
        { id: 'session-abc', name: 'Test Session', messages: [] }
      ],
      timestamp: Date.now()
    }));

    // Verify data exists
    expect(getActiveSessionId(userId)).toBe('session-abc');
    expect(localStorage.getItem(`apology_sessions_cache_user_${userId}`)).not.toBeNull();

    // Simulate logout (as done in AuthContext)
    clearAllSessionData();

    // Verify all session data is cleared
    expect(getActiveSessionId(userId)).toBeNull();
    expect(localStorage.getItem(`apology_sessions_cache_user_${userId}`)).toBeNull();
  });

  it('should simulate user switching scenario', () => {
    // User A logs in
    const userA = 1;
    setActiveSessionId('session-a', userA);
    localStorage.setItem(`apology_sessions_cache_user_${userA}`, JSON.stringify({
      data: [{ id: 'session-a', name: 'User A Session' }],
      timestamp: Date.now()
    }));

    // Verify User A's data
    expect(getActiveSessionId(userA)).toBe('session-a');

    // User A logs out
    clearAllSessionData();

    // User B logs in
    const userB = 2;
    setActiveSessionId('session-b', userB);
    localStorage.setItem(`apology_sessions_cache_user_${userB}`, JSON.stringify({
      data: [{ id: 'session-b', name: 'User B Session' }],
      timestamp: Date.now()
    }));

    // Verify User B's data exists
    expect(getActiveSessionId(userB)).toBe('session-b');

    // Verify User A's data is NOT accessible
    expect(getActiveSessionId(userA)).toBeNull();
    expect(localStorage.getItem(`apology_sessions_cache_user_${userA}`)).toBeNull();
  });
});
