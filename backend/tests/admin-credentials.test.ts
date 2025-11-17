/**
 * Admin Credentials Configuration Tests
 * Tests for secure admin account creation from environment variables
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import fs from 'fs';
import path from 'path';

describe('Admin Credentials Configuration', () => {
  let db: DatabaseService;
  const testDbPath = path.join(__dirname, 'test-admin-creds.db');

  beforeEach(async () => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create new database instance for testing
    db = new DatabaseService(testDbPath);
  });

  afterEach(async () => {
    // Close database connection
    if (db && db.isInitialized()) {
      db.close();
    }

    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Reset environment variables to test defaults
    process.env.DEFAULT_ADMIN_USERNAME = 'admin';
    process.env.DEFAULT_ADMIN_PASSWORD = 'admin123';
  });

  it('should create admin with credentials from environment variables', async () => {
    // Set environment variables
    process.env.DEFAULT_ADMIN_USERNAME = 'myadmin';
    process.env.DEFAULT_ADMIN_PASSWORD = 'SecurePass123!';

    // Initialize database (this should create admin)
    await db.initialize();

    // Verify admin was created
    const admin = db.queryOne<any>(
      'SELECT * FROM users WHERE username = ?',
      ['myadmin']
    );

    expect(admin).toBeDefined();
    expect(admin?.username).toBe('myadmin');
    expect(admin?.role).toBe('admin');
    expect(admin?.password_hash).toBeDefined();
    expect(admin?.password_hash).not.toBe('SecurePass123!'); // Should be hashed
  });

  it('should generate random password if not configured', async () => {
    // Set only username, no password
    process.env.DEFAULT_ADMIN_USERNAME = 'autoadmin';
    delete process.env.DEFAULT_ADMIN_PASSWORD;

    // Capture console output to verify password is logged
    const logSpy = vi.spyOn(console, 'warn');

    // Initialize database
    await db.initialize();

    // Verify admin was created
    const admin = db.queryOne<any>(
      'SELECT * FROM users WHERE username = ?',
      ['autoadmin']
    );

    expect(admin).toBeDefined();
    expect(admin?.username).toBe('autoadmin');
    expect(admin?.role).toBe('admin');

    // Verify warning about auto-generated password was logged
    // (We'll check logger calls in actual implementation)

    logSpy.mockRestore();
  });

  it('should skip admin creation if username not configured', async () => {
    // Do NOT set DEFAULT_ADMIN_USERNAME
    delete process.env.DEFAULT_ADMIN_USERNAME;

    // Initialize database
    await db.initialize();

    // Verify no admin was created
    const admins = db.query<any>(
      'SELECT * FROM users WHERE role = ?',
      ['admin']
    );

    expect(admins.length).toBe(0);
  });

  it('should not recreate admin if already exists', async () => {
    process.env.DEFAULT_ADMIN_USERNAME = 'existingadmin';
    process.env.DEFAULT_ADMIN_PASSWORD = 'FirstPassword123!';

    // First initialization
    await db.initialize();

    const firstAdmin = db.queryOne<any>(
      'SELECT * FROM users WHERE username = ?',
      ['existingadmin']
    );
    const firstPasswordHash = firstAdmin?.password_hash;

    // Close the database
    db.close();

    // Recreate database instance for second initialization
    db = new DatabaseService(testDbPath);

    // Change password in environment
    process.env.DEFAULT_ADMIN_PASSWORD = 'DifferentPassword456!';

    // Second initialization (should NOT recreate)
    await db.initialize();

    const secondAdmin = db.queryOne<any>(
      'SELECT * FROM users WHERE username = ?',
      ['existingadmin']
    );

    // Password hash should remain unchanged
    expect(secondAdmin?.password_hash).toBe(firstPasswordHash);

    // Should still be only one admin with this username
    const adminCount = db.query<any>(
      'SELECT * FROM users WHERE username = ?',
      ['existingadmin']
    );
    expect(adminCount.length).toBe(1);
  });
});

describe('Frontend Credential Exposure', () => {
  it('should not contain hardcoded credentials in i18n files', async () => {
    const enPath = path.join(__dirname, '../..', 'frontend/src/i18n/locales/en.json');
    const zhPath = path.join(__dirname, '../..', 'frontend/src/i18n/locales/zh.json');

    // Read i18n files
    const enContent = fs.readFileSync(enPath, 'utf8');
    const zhContent = fs.readFileSync(zhPath, 'utf8');

    // Check for hardcoded credentials
    expect(enContent).not.toContain('admin123');
    expect(enContent).not.toContain('Password: admin');
    expect(zhContent).not.toContain('admin123');
    expect(zhContent).not.toContain('密码: admin');
  });

  it('should not contain hardcoded credentials in schema.sql', async () => {
    const schemaPath = path.join(__dirname, '../src/database/schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Should not have hardcoded INSERT statement with credentials
    expect(schemaContent).not.toContain('INSERT OR IGNORE INTO users');
    expect(schemaContent).not.toContain('$2b$10$'); // bcrypt hash prefix
  });
});
