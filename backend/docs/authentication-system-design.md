# Authentication System Design

## Overview

This document describes the multi-user authentication system with role-based access control (RBAC) and data isolation for the Apologize-is-all-you-need application.

**Version**: 1.0.0
**Last Updated**: 2025-11-16
**Status**: Implementation in Progress

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Authentication Flow](#authentication-flow)
4. [Data Isolation Strategy](#data-isolation-strategy)
5. [API Endpoints](#api-endpoints)
6. [Security Considerations](#security-considerations)
7. [Admin Features](#admin-features)

---

## System Architecture

### Components

1. **Database Layer**: SQLite3 with structured schema
2. **Service Layer**: User management, session management, message storage
3. **Middleware Layer**: Authentication, authorization, validation
4. **API Layer**: RESTful endpoints for auth and data access

### Technology Stack

- **Database**: SQLite3 (file-based, no external server required)
- **Password Hashing**: bcrypt (salt rounds = 10)
- **Token Management**: JSON Web Tokens (JWT) with 7-day expiry
- **ORM**: Native SQL queries with prepared statements (SQL injection protection)

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  last_login_at DATETIME
);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `username`: Unique identifier (3-50 characters)
- `password_hash`: bcrypt hashed password
- `role`: Either 'user' or 'admin'
- `is_active`: Soft delete flag
- `last_login_at`: Tracks last successful login

### Sessions Table

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,  -- UUID
  user_id INTEGER NOT NULL,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Relationship**: One user has many sessions

### Messages Table

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Relationship**: One session has many messages, all tied to a user

---

## Authentication Flow

### 1. User Registration

```
Client                    Backend                Database
  |                         |                       |
  |--- POST /api/auth/register                     |
  |    { username, password }                      |
  |                         |                       |
  |                    Validate input              |
  |                    Check username uniqueness   |
  |                         |--- SELECT username --|
  |                         |<-- Result ------------|
  |                    Hash password (bcrypt)      |
  |                         |--- INSERT user ------|
  |                         |<-- user_id ----------|
  |                    Generate JWT token          |
  |<-- { user, token } -----|                      |
  |                         |                       |
```

**Steps:**
1. Client sends username and password
2. Backend validates input (username length, password strength)
3. Check if username already exists
4. Hash password using bcrypt (10 rounds)
5. Insert new user into database
6. Generate JWT token with user info
7. Return user object and token to client

### 2. User Login

```
Client                    Backend                Database
  |                         |                       |
  |--- POST /api/auth/login                        |
  |    { username, password }                      |
  |                         |                       |
  |                    Validate input              |
  |                         |--- SELECT user ------|
  |                         |<-- user data ---------|
  |                    Verify password (bcrypt)    |
  |                    Update last_login_at        |
  |                         |--- UPDATE user ------|
  |                    Generate JWT token          |
  |<-- { user, token } -----|                      |
  |                         |                       |
```

**Steps:**
1. Client sends username and password
2. Backend retrieves user from database
3. Compare provided password with stored hash using bcrypt
4. If valid, update last_login_at timestamp
5. Generate JWT token with user info (userId, username, role)
6. Return user object and token to client

### 3. Protected Request

```
Client                    Backend                Database
  |                         |                       |
  |--- GET /api/chat/history                       |
  |    Authorization: Bearer <token>               |
  |                         |                       |
  |                    Verify JWT token            |
  |                    Extract userId from token   |
  |                         |--- SELECT messages --|
  |                         |    WHERE user_id = ? |
  |                         |<-- messages ---------|
  |<-- { messages } --------|                      |
  |                         |                       |
```

**Steps:**
1. Client includes JWT token in Authorization header
2. Auth middleware verifies token signature and expiry
3. Extracts userId from token payload
4. Attaches user info to req.user
5. Route handler uses req.user.userId to filter data
6. Only returns data belonging to the authenticated user

### 4. Logout

```
Client                    Backend
  |                         |
  |--- POST /api/auth/logout
  |    Authorization: Bearer <token>
  |                         |
  |                    Verify JWT token
  |                    Log logout event
  |<-- { success: true } ---|
  |                         |
  | Delete token from       |
  | localStorage            |
  |                         |
```

**Steps:**
1. Client sends logout request with token
2. Backend logs the logout event (optional)
3. Returns success response
4. Client deletes token from localStorage
5. Redirects to login page

---

## Data Isolation Strategy

### Principle: User-Based Access Control

Every piece of data (sessions, messages) is tied to a user_id. Access is controlled through:

1. **Authentication**: Verify user identity via JWT
2. **Authorization**: Check ownership before data access
3. **Query Filtering**: Always include WHERE user_id = ? in queries

### Implementation

#### Normal User Queries

```typescript
// Get user's sessions
const sessions = await db.query(
  'SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC',
  [req.user.userId]
);

// Get user's messages
const messages = await db.query(
  'SELECT * FROM messages WHERE user_id = ? AND session_id = ?',
  [req.user.userId, sessionId]
);
```

#### Admin Queries

```typescript
// Admins can query all data
if (req.user.role === 'admin') {
  // Optional filtering by user
  const userId = req.query.userId;

  const query = userId
    ? 'SELECT * FROM messages WHERE user_id = ?'
    : 'SELECT * FROM messages ORDER BY created_at DESC';

  const params = userId ? [userId] : [];
  const messages = await db.query(query, params);
}
```

### Data Ownership Validation

```typescript
// Example: Delete session - verify ownership
export async function deleteSession(sessionId: string, userId: number) {
  // First check if session belongs to user
  const session = await db.query(
    'SELECT id FROM sessions WHERE id = ? AND user_id = ?',
    [sessionId, userId]
  );

  if (!session) {
    throw new Error('Session not found or access denied');
  }

  // Now safe to delete
  await db.query('DELETE FROM sessions WHERE id = ?', [sessionId]);
}
```

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register

**Description**: Register a new user account

**Request:**
```json
{
  "username": "string (3-50 chars)",
  "password": "string (min 6 chars)"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "role": "user",
    "createdAt": "2025-11-16T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800000
}
```

**Errors:**
- 400: Invalid input (username too short, password weak)
- 409: Username already exists
- 500: Server error

#### POST /api/auth/login

**Description**: Login with existing credentials

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "role": "user",
    "lastLoginAt": "2025-11-16T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800000
}
```

**Errors:**
- 401: Invalid credentials
- 403: Account disabled
- 500: Server error

#### GET /api/auth/me

**Description**: Get current user information

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "role": "user",
    "createdAt": "2025-11-15T10:00:00Z",
    "lastLoginAt": "2025-11-16T10:00:00Z"
  }
}
```

**Errors:**
- 401: Invalid or expired token

#### POST /api/auth/logout

**Description**: Logout current user

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Data Access Endpoints (Updated with Auth)

All data endpoints now require authentication and filter by user_id:

- GET /api/chat/history?sessionId=xxx
- POST /api/chat/message
- DELETE /api/chat/session/:sessionId

### Admin Endpoints

#### GET /api/admin/users

**Description**: List all users (admin only)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "isActive": true,
      "createdAt": "2025-11-15T10:00:00Z",
      "lastLoginAt": "2025-11-16T10:00:00Z"
    },
    ...
  ]
}
```

#### GET /api/admin/sessions?userId=1

**Description**: View all sessions, optionally filtered by user (admin only)

#### GET /api/admin/messages?userId=1&sessionId=xxx

**Description**: View all messages with optional filters (admin only)

---

## Security Considerations

### Password Security

1. **Hashing Algorithm**: bcrypt with 10 salt rounds
2. **Minimum Length**: 6 characters
3. **Recommended**: Include numbers, letters, special characters
4. **Never Stored**: Plain text passwords are never logged or stored

### Token Security

1. **Algorithm**: HS256 (HMAC with SHA-256)
2. **Secret**: Stored in environment variable (JWT_SECRET)
3. **Expiry**: 7 days (configurable)
4. **Storage**: localStorage on client (acceptable for MVP)
5. **Production**: Consider httpOnly cookies for enhanced security

### SQL Injection Prevention

1. **Prepared Statements**: All queries use parameterized queries
2. **Input Validation**: Username and password validated before use
3. **Type Checking**: TypeScript enforces type safety

### XSS Prevention

1. **Content Escaping**: React automatically escapes user input
2. **Content Security Policy**: Recommended for production

### CSRF Prevention

1. **Token-based Auth**: JWT doesn't require cookies
2. **SameSite Cookies**: If using cookie storage, set SameSite=Strict

### Rate Limiting

**Recommended for Production:**
- Login endpoint: 5 attempts per 15 minutes per IP
- Register endpoint: 3 accounts per hour per IP
- Password reset: 3 attempts per hour per user

---

## Admin Features

### Initial Admin Account

**Username**: admin
**Password**: admin123
**Role**: admin

⚠️ **IMPORTANT**: Change this password immediately after first login in production!

### Admin Capabilities

1. **User Management**
   - View all users
   - Deactivate/activate users
   - View user statistics

2. **Data Access**
   - View all sessions across all users
   - View all messages (with user filtering)
   - Export data for specific users

3. **Analytics**
   - Total user count
   - Active sessions count
   - Message statistics per user
   - System usage metrics

### Admin Dashboard (Future Enhancement)

Planned features for admin interface:
- User list with search/filter
- Session browser with user grouping
- Message viewer with export functionality
- System health and metrics visualization

---

## Migration Path

### From Current System

The current system uses:
- Invite code / password authentication (no user accounts)
- In-memory session storage

Migration steps:
1. Install SQLite3 and bcrypt dependencies
2. Run database initialization script
3. Update auth middleware to support user-based JWT
4. Update session service to use database
5. Add registration/login endpoints
6. Update frontend to use new auth flow

### Backward Compatibility

During transition:
- Old invite code system remains functional
- New user registration is optional
- Data migration tool for existing sessions (if needed)

---

## Testing Checklist

- [ ] User can register with valid credentials
- [ ] Registration fails with duplicate username
- [ ] Registration fails with weak password
- [ ] User can login with correct credentials
- [ ] Login fails with incorrect password
- [ ] Login updates last_login_at timestamp
- [ ] JWT token is generated correctly
- [ ] JWT token expires after 7 days
- [ ] Protected routes require valid token
- [ ] User can only access their own data
- [ ] Admin can access all data
- [ ] Regular user cannot access admin endpoints
- [ ] Sessions are tied to correct user_id
- [ ] Messages are tied to correct user_id
- [ ] Database cascade deletes work correctly
- [ ] Password is never logged or returned in API
- [ ] SQL injection attempts are blocked

---

## Future Enhancements

1. **Password Reset**: Email-based password recovery
2. **Email Verification**: Verify email during registration
3. **Two-Factor Authentication**: TOTP or SMS-based 2FA
4. **OAuth Integration**: Google, GitHub, etc.
5. **Session Management**: View and revoke active sessions
6. **Audit Log**: Track all authentication events
7. **Role Hierarchy**: Add more granular roles (moderator, premium user)
8. **Data Export**: GDPR-compliant user data export

---

## References

- [bcrypt npm package](https://www.npmjs.com/package/bcrypt)
- [jsonwebtoken npm package](https://www.npmjs.com/package/jsonwebtoken)
- [SQLite3 documentation](https://www.sqlite.org/docs.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**End of Authentication System Design Document**
