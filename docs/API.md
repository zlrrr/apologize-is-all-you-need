# API Documentation

Backend API for the Apologize Is All You Need application.

## Base URL

```
http://localhost:5001/api
```

## Authentication

Most API endpoints require authentication using JWT (JSON Web Tokens).

### Authentication Header

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

To obtain a JWT token, you must first register or log in:

#### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "username": "your-username",
  "password": "your-password"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "your-username",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/login
Log in with existing credentials.

**Request:**
```json
{
  "username": "your-username",
  "password": "your-password"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "your-username",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Authorization Levels

- **Public**: No authentication required
- **Authenticated**: Requires valid JWT token
- **Admin**: Requires valid JWT token with admin role

## Endpoints

### Health Check

#### GET /health

**Authorization**: Public (no authentication required)

Check if the API server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend server is running"
}
```

---

### Chat API

#### POST /chat/message

**Authorization**: Authenticated (requires JWT token)
**Session Security**: Prevents session ID collision across users

Send a message and receive an apology response.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "今天工作太累了",
  "style": "gentle",
  "sessionId": "optional-session-id"
}
```

**Parameters:**
- `message` (string, required): User's message
- `style` (string, optional): Apology style - one of `gentle`, `formal`, `empathetic`. Default: `gentle`
- `sessionId` (string, optional): Session ID for conversation continuity. If not provided, a new session will be created.

**Response:**
```json
{
  "sessionId": "cb83af6f-c2ba-4f20-b51c-2bcd2e5041ff",
  "reply": "非常抱歉听到你今天这么辛苦...",
  "emotion": "tired",
  "style": "gentle",
  "tokensUsed": 116,
  "timestamp": "2025-10-21T11:38:26.162Z"
}
```

**Error Response:**
```json
{
  "error": "Validation Error",
  "message": "Message is required",
  "field": "message"
}
```

---

#### GET /chat/history

**Authorization**: Authenticated (requires JWT token)
**Session Security**: Verifies session ownership before access

Get conversation history for a session. Users can only access their own sessions.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `sessionId` (string, required): Session ID

**Example:**
```
GET /chat/history?sessionId=cb83af6f-c2ba-4f20-b51c-2bcd2e5041ff
```

**Response:**
```json
{
  "sessionId": "cb83af6f-c2ba-4f20-b51c-2bcd2e5041ff",
  "messages": [
    {
      "role": "user",
      "content": "今天工作太累了"
    },
    {
      "role": "assistant",
      "content": "非常抱歉听到你今天这么辛苦..."
    }
  ],
  "messageCount": 2,
  "createdAt": "2025-10-21T11:38:26.162Z",
  "updatedAt": "2025-10-21T11:38:26.162Z"
}
```

---

#### DELETE /chat/history

**Authorization**: Authenticated (requires JWT token)
**Session Security**: Verifies session ownership before clearing

Clear conversation history for a session. Users can only clear their own sessions.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `sessionId` (string, required): Session ID

**Response:**
```json
{
  "sessionId": "cb83af6f-c2ba-4f20-b51c-2bcd2e5041ff",
  "message": "History cleared successfully"
}
```

---

#### DELETE /chat/session

**Authorization**: Authenticated (requires JWT token)
**Session Security**: Verifies session ownership before deletion

Delete a session entirely. Users can only delete their own sessions.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `sessionId` (string, required): Session ID

**Response:**
```json
{
  "sessionId": "cb83af6f-c2ba-4f20-b51c-2bcd2e5041ff",
  "message": "Session deleted successfully"
}
```

---

#### GET /chat/sessions

**Authorization**: Authenticated (requires JWT token)
**Data Isolation**: Returns only the authenticated user's sessions

Get all sessions for the authenticated user.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "sessions": [
    "cb83af6f-c2ba-4f20-b51c-2bcd2e5041ff",
    "8a7b9c2d-1e3f-4g5h-6i7j-8k9l0m1n2o3p"
  ],
  "count": 2
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - Insufficient permissions or session access denied |
| 404 | Not Found - Session not found |
| 500 | Internal Server Error |
| 502 | Bad Gateway - LLM API error |
| 503 | Service Unavailable - Cannot connect to LM Studio |
| 504 | Gateway Timeout - LLM request timeout |

### Common Error Responses

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "No authentication token provided"
}
```

**403 Forbidden (Session Access)**:
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this session"
}
```

**403 Forbidden (Session Collision)**:
```json
{
  "error": "Forbidden",
  "message": "This session ID already exists. Please use a different ID or let the system generate one."
}
```

## Apology Styles

### gentle (温和)
- Warm and caring tone
- Like a friend expressing concern
- Uses gentle, affectionate language

### formal (正式)
- Professional but warm tone
- Respectful and dignified
- Maintains appropriate distance

### empathetic (共情)
- Deep empathy and understanding
- Validates user's pain completely
- Strong emotional resonance

## Examples

### Example 1: Register and Login

```bash
# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "myuser",
    "password": "mypassword123"
  }'

# Response will include token:
# { "user": {...}, "token": "eyJhbGc..." }
```

### Example 2: Send a message with gentle style

```bash
curl -X POST http://localhost:5001/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "message": "今天心情很不好",
    "style": "gentle"
  }'
```

### Example 3: Continue a conversation

```bash
curl -X POST http://localhost:5001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "还是感觉很难受",
    "style": "empathetic",
    "sessionId": "your-session-id-here"
  }'
```

### Example 3: Get conversation history

```bash
curl http://localhost:5001/api/chat/history?sessionId=your-session-id-here
```
