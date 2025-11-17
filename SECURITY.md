# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by emailing the project maintainers. Please do not open a public issue.

**Email**: [Your security contact email]

We will respond to your report within 48 hours and work with you to understand and address the issue.

## Security Updates

This document tracks security issues and their resolutions.

### Phase 10: Security Hardening (2025-11-17)

#### Fixed Vulnerabilities

##### 1. Hardcoded Administrator Credentials (CWE-798) - CRITICAL

**Severity**: 🔴 High
**Status**: ✅ Fixed

**Description**:
- Default admin credentials were hardcoded in multiple locations:
  - `frontend/src/i18n/locales/en.json` and `zh.json` - displayed "Username: admin, Password: admin123"
  - `backend/src/database/schema.sql` - contained hardcoded admin insert
  - `backend/src/database/database.service.ts` - hardcoded password 'admin123'

**Impact**:
- Attackers could easily obtain admin credentials by inspecting frontend code
- Production deployments could not change default password
- Violation of security best practices

**Resolution**:
- **backend/.env.example**: Added `DEFAULT_ADMIN_USERNAME` and `DEFAULT_ADMIN_PASSWORD` configuration
- **database.service.ts**: Modified `createDefaultAdmin()` to:
  - Read credentials from environment variables
  - Skip admin creation if `DEFAULT_ADMIN_USERNAME` not set
  - Auto-generate secure random password if `DEFAULT_ADMIN_PASSWORD` not set
  - Log generated credentials securely to console (only during initialization)
- **frontend i18n files**: Removed all hardcoded credentials, added generic help text
- **schema.sql**: Removed hardcoded admin INSERT, added comments explaining env-based creation

**Files Changed**:
- `backend/.env.example`
- `backend/src/database/database.service.ts`
- `backend/src/database/schema.sql`
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/zh.json`

##### 2. Session Authorization Vulnerability (CWE-639) - MEDIUM

**Severity**: 🟡 Medium
**Status**: ✅ Fixed

**Description**:
- Users could potentially access or manipulate sessions belonging to other users
- Session ID collision could occur when multiple users used the same session ID
- Lack of explicit ownership verification before session operations

**Impact**:
- Session ID confusion and unexpected behavior
- Potential for session hijacking attempts
- Data isolation not enforced at middleware level

**Resolution**:
- **session-authorization.middleware.ts**: Created new middleware
  - `verifySessionOwnership()` - Verifies user owns requested session before access
  - `preventSessionCollision()` - Prevents session ID conflicts across users
  - Logs unauthorized access attempts with full context (user, IP, user-agent)
- **chat.routes.ts**: Applied authorization middleware to all session routes:
  - `POST /api/chat/message` - `preventSessionCollision`
  - `GET /api/chat/history` - `verifySessionOwnership`
  - `DELETE /api/chat/history` - `verifySessionOwnership`
  - `DELETE /api/chat/session` - `verifySessionOwnership`
- **session.service.ts**: Updated `getOrCreateSession()` to check for ID collision and throw error

**Files Changed**:
- `backend/src/middleware/session-authorization.middleware.ts` (new)
- `backend/src/routes/chat.routes.ts`
- `backend/src/services/session.service.ts`

## Security Best Practices

### Authentication & Authorization

1. **Environment Variables**: All sensitive configuration (passwords, API keys, secrets) must be stored in environment variables, never hardcoded
2. **Password Hashing**: Use bcrypt with salt rounds ≥ 10 for password hashing
3. **JWT Secrets**: Use strong, randomly generated JWT secrets (minimum 32 characters)
4. **Token Expiration**: JWT tokens should have reasonable expiration times (default: 7 days)
5. **Role-Based Access Control**: Implement and enforce role-based permissions (user/admin)

### Session Management

1. **Session Ownership**: Always verify session ownership before allowing access
2. **Session Isolation**: Enforce data isolation between users at database and application level
3. **Session ID Generation**: Use UUIDs for session IDs to prevent collision
4. **Audit Logging**: Log all unauthorized access attempts with full context

### Database Security

1. **Parameterized Queries**: Always use parameterized queries to prevent SQL injection
2. **Foreign Keys**: Enable and use foreign key constraints for data integrity
3. **Data Isolation**: Filter all queries by user_id to enforce data isolation
4. **Password Storage**: Never store passwords in plain text, always hash with bcrypt

### API Security

1. **Authentication Required**: All API endpoints (except public ones) must require authentication
2. **Input Validation**: Validate all user inputs before processing
3. **Error Handling**: Don't expose sensitive information in error messages
4. **Rate Limiting**: Implement rate limiting on authentication endpoints
5. **CORS Configuration**: Properly configure CORS for production environments

### Frontend Security

1. **No Hardcoded Secrets**: Never include API keys, passwords, or secrets in frontend code
2. **Token Storage**: Store JWT tokens in memory or localStorage (not in cookies without httpOnly flag)
3. **XSS Prevention**: Sanitize all user-generated content before rendering
4. **HTTPS Only**: Always use HTTPS in production

## Security Checklist for Deployment

Before deploying to production, verify:

- [ ] All environment variables are properly configured
- [ ] Default admin password has been changed
- [ ] JWT_SECRET is a strong, random value
- [ ] CORS is configured to allow only trusted origins
- [ ] HTTPS is enabled
- [ ] Database credentials are secure
- [ ] Error messages don't expose sensitive information
- [ ] Rate limiting is enabled
- [ ] Logging is configured (without logging passwords)
- [ ] Security headers are set (CSP, HSTS, etc.)

## Dependencies Security

Run security audits regularly:

```bash
# Backend
cd backend
npm audit

# Frontend
cd frontend
npm audit
```

Address critical and high severity vulnerabilities promptly.

## Compliance

This application implements security controls in accordance with:

- OWASP Top 10 (2021)
- CWE/SANS Top 25 Most Dangerous Software Errors
- NIST Cybersecurity Framework

## Version History

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0.0   | 2025-11-17 | Initial security policy and Phase 10 fixes   |

## Contact

For security concerns or questions, please contact the project maintainers.

---

**Last Updated**: 2025-11-17
