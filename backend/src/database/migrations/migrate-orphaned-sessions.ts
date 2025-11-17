/**
 * Migration: Migrate Orphaned Sessions to Admin
 *
 * This migration handles sessions that don't have a valid user_id:
 * 1. Find all sessions where user_id doesn't exist in users table
 * 2. Find the first admin user
 * 3. Reassign orphaned sessions to admin
 * 4. If no admin exists, log warning but don't fail
 *
 * Run this migration once during deployment or database initialization
 */

import { DatabaseService } from '../database.service.js';
import logger from '../../utils/logger.js';

interface OrphanedSession {
  id: string;
  user_id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  role: string;
}

export async function migrateOrphanedSessions(db: DatabaseService): Promise<void> {
  try {
    logger.info('Starting orphaned sessions migration');

    // Find all sessions where user_id doesn't exist in users table
    const orphanedSessions = db.query<OrphanedSession>(`
      SELECT s.*
      FROM sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE u.id IS NULL
    `);

    if (orphanedSessions.length === 0) {
      logger.info('No orphaned sessions found');
      return;
    }

    logger.warn('Found orphaned sessions', { count: orphanedSessions.length });

    // Find first admin user
    const admin = db.queryOne<User>(`
      SELECT id, username, role
      FROM users
      WHERE role = 'admin'
      ORDER BY id ASC
      LIMIT 1
    `);

    if (!admin) {
      logger.error('Cannot migrate orphaned sessions: No admin user found', {
        orphanedCount: orphanedSessions.length,
        orphanedSessionIds: orphanedSessions.map(s => s.id),
      });

      // Don't fail migration - just log the issue
      // These sessions will be inaccessible but won't break the system
      return;
    }

    logger.info('Migrating orphaned sessions to admin', {
      adminId: admin.id,
      adminUsername: admin.username,
      sessionCount: orphanedSessions.length,
    });

    // Migrate each orphaned session to admin
    let migratedCount = 0;
    let failedCount = 0;

    for (const session of orphanedSessions) {
      try {
        // Update session to belong to admin
        db.execute(
          'UPDATE sessions SET user_id = ? WHERE id = ?',
          [admin.id, session.id]
        );

        // Update all messages in this session to belong to admin
        db.execute(
          'UPDATE messages SET user_id = ? WHERE session_id = ?',
          [admin.id, session.id]
        );

        migratedCount++;

        logger.debug('Migrated orphaned session', {
          sessionId: session.id,
          oldUserId: session.user_id,
          newUserId: admin.id,
        });
      } catch (error) {
        failedCount++;
        logger.error('Failed to migrate orphaned session', {
          sessionId: session.id,
          error,
        });
      }
    }

    logger.info('Orphaned sessions migration completed', {
      total: orphanedSessions.length,
      migrated: migratedCount,
      failed: failedCount,
      adminId: admin.id,
    });

    if (migratedCount > 0) {
      console.warn('\n' + '='.repeat(80));
      console.warn('⚠️  ORPHANED SESSIONS MIGRATION NOTICE ⚠️');
      console.warn('='.repeat(80));
      console.warn(`Migrated ${migratedCount} orphaned session(s) to admin user: ${admin.username}`);
      console.warn('These sessions were not associated with any existing user.');
      console.warn('Admin can now access and manage these sessions.');
      console.warn('='.repeat(80) + '\n');
    }
  } catch (error) {
    logger.error('Orphaned sessions migration failed', { error });
    // Don't throw - allow app to continue even if migration fails
  }
}
