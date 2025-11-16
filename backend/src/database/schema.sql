-- Database Schema for Apologize-is-all-you-need
-- User Authentication and Data Isolation System
--
-- Created: 2025-11-16
-- Version: 1.0.0

-- Users table
-- Stores user accounts with authentication credentials and roles
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  last_login_at DATETIME,

  -- Constraints
  CONSTRAINT username_length CHECK(length(username) >= 3 AND length(username) <= 50)
);

-- Sessions table
-- Stores chat sessions for each user
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,  -- UUID format
  user_id INTEGER NOT NULL,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Indexes for performance
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_updated_at (updated_at)
);

-- Messages table
-- Stores individual messages within sessions
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Indexes for performance
  INDEX idx_messages_session_id (session_id),
  INDEX idx_messages_user_id (user_id),
  INDEX idx_messages_created_at (created_at)
);

-- Create trigger to update updated_at timestamp on users table
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create trigger to update updated_at timestamp on sessions table
CREATE TRIGGER IF NOT EXISTS update_sessions_timestamp
AFTER UPDATE ON sessions
BEGIN
  UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert default admin user (password: admin123)
-- Password hash generated using bcrypt with salt rounds = 10
-- IMPORTANT: Change this password immediately after first login in production
INSERT OR IGNORE INTO users (id, username, password_hash, role)
VALUES (
  1,
  'admin',
  '$2b$10$rGHvZ7L9VQxgE3VxJ5QK3eO5YZzXqQJ5YZzXqQJ5YZzXqQJ5YZzXq',  -- Placeholder - will be updated during migration
  'admin'
);
