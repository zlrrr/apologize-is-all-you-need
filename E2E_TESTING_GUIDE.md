# 端到端测试指南 (End-to-End Testing Guide)

**日期**: 2025-11-16
**目的**: 确保前后端完整集成并在生产环境中正常工作

## 前置条件

### 已配置的环境变量

#### Render 后端环境变量
```bash
# LLM 配置
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM
GEMINI_MODEL=gemini-1.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# 基础配置
NODE_ENV=production
BACKEND_PORT=5001
SESSION_SECRET=<your-random-secret>
JWT_SECRET=<your-random-secret>

# CORS 配置
FRONTEND_URL=https://apologize-is-all-you-need-web.vercel.app
CORS_ORIGIN=https://apologize-is-all-you-need-web.vercel.app

# LLM 参数
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=500
LOG_LEVEL=info
```

#### Vercel 前端环境变量
```bash
VITE_API_URL=https://apologize-is-all-you-need.onrender.com
```

---

## 第一阶段：测试 Gemini API Key

### 方法 1: 使用诊断工具（本地）

**注意**: 此方法需要本地网络可以访问 Google API。

```bash
cd backend
node test-gemini-api.cjs AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM
```

**预期输出**:
```
============================================================
Gemini API Key Tester
============================================================
API Key: AIzaSyCa8P...7teM
Time: 2025-11-16T...

Test 1: List Available Models
------------------------------------------------------------
✓ Success: API key is valid
  Found X models

  Available models:
    - models/gemini-1.5-flash
    - models/gemini-1.5-pro
    ...

Test 2: Generate Content (Chat Completion)
------------------------------------------------------------
✓ Success: Content generated
  Response time: XXXms
  Tokens used: XX
  Response: "Hello, API test successful!"

Test 3: Rate Limit Check
------------------------------------------------------------
Making 3 rapid requests to check rate limiting...
  Request 1: ✓ (XXXms, HTTP 200)
  Request 2: ✓ (XXXms, HTTP 200)
  Request 3: ✓ (XXXms, HTTP 200)

  Results: 3/3 requests successful
  ✓ No rate limiting issues detected

============================================================
Test Summary
============================================================
List Models:      ✓ PASS
Generate Content: ✓ PASS
Rate Limit:       ✓ PASS

Overall: ✓ ALL TESTS PASSED
============================================================

✓ Your Gemini API key is working correctly!
```

### 方法 2: 使用浏览器测试（推荐）

访问 Google AI Studio 测试页面:
1. 打开 https://aistudio.google.com/app/prompts/new_chat
2. 使用相同的 Google 账号登录
3. 在聊天框输入任意消息测试
4. 如果能正常回复，说明 API key 有效

### 方法 3: 使用 curl（命令行）

```bash
# 列出可用模型
curl "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM"

# 测试内容生成
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Say hello in Chinese"
      }]
    }]
  }'
```

**预期响应** (成功):
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "你好！"
      }]
    }
  }],
  "usageMetadata": {
    "promptTokenCount": 5,
    "candidatesTokenCount": 3,
    "totalTokenCount": 8
  }
}
```

---

## 第二阶段：测试后端 LLM 集成

### 2.1 运行集成测试（本地开发环境）

```bash
cd backend

# 设置环境变量
export LLM_PROVIDER=gemini
export GEMINI_API_KEY=AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM
export GEMINI_MODEL=gemini-1.5-flash

# 运行 LLM 集成测试
npm test -- llm-integration.test.ts
```

**预期输出**:
```
=== LLM Configuration ===
Provider: gemini
Model: gemini-1.5-flash
Base URL: https://generativelanguage.googleapis.com/v1beta
API Key: ***7teM
Temperature: 0.7
Max Tokens: 500
========================

✓ Configuration Tests (6 passed)
  ✓ should have a valid provider configured
  ✓ should have a base URL configured
  ✓ should have a model name configured
  ✓ should have valid temperature (0-2)
  ✓ should have valid maxTokens (> 0)
  ✓ should have API key for cloud providers

✓ Health Check Tests (2 passed)
  ✓ should successfully connect to LLM provider
  ✓ should get available models

✓ Chat Completion Tests (3 passed)
  ✓ should generate a simple text response
  ✓ should handle system prompts correctly
  ✓ should respect temperature settings

✓ Apology Generation Tests (3 passed)
  ✓ should generate an apology response
  ✓ should generate different styles of apologies
  ✓ should maintain conversation context

✓ Error Handling Tests (2 passed)
✓ Performance Tests (2 passed)

Test Summary: 18/18 tests passed
```

### 2.2 在 Render 上查看日志

1. 访问 https://dashboard.render.com
2. 选择你的后端服务
3. 点击 "Logs" 标签
4. 查看启动日志

**预期启动日志**:
```
🚀 Backend server running on http://localhost:5001
📝 Health check: http://localhost:5001/api/health
💬 Chat API: http://localhost:5001/api/chat
📊 Detailed health: http://localhost:5001/api/health/detailed
🤖 LLM health: http://localhost:5001/api/health/llm
🔐 Auth API: http://localhost:5001/api/auth
⚠️  Authentication is DISABLED
```

**查找 LLM 初始化日志**:
```
[INFO] LLM Service initialized
  Provider: gemini
  Model: gemini-1.5-flash
  Base URL: https://generativelanguage.googleapis.com/v1beta
```

---

## 第三阶段：远程调试后端 API

### 3.1 测试健康检查端点

#### 方法 A: 浏览器开发者工具

1. 打开浏览器，按 F12 打开开发者工具
2. 切换到 "Console" 标签
3. 执行以下命令：

```javascript
// 测试基础健康检查
fetch('https://apologize-is-all-you-need.onrender.com/api/health')
  .then(r => r.json())
  .then(data => {
    console.log('=== Health Check ===');
    console.log('Status:', data.status);
    console.log('API:', data.services.api);
    console.log('LLM:', data.services.llm);
    console.log('Provider:', data.config.provider);
    console.log('Model:', data.config.model);
    console.log('Configured:', data.config.configured);
    console.log(data);
  });

// 测试 LLM 专用健康检查
fetch('https://apologize-is-all-you-need.onrender.com/api/health/llm')
  .then(r => r.json())
  .then(data => {
    console.log('=== LLM Health ===');
    console.log('Status:', data.status);
    console.log('Response Time:', data.responseTime);
    console.log('Can Connect:', data.diagnostics.canConnect);
    console.log(data);
  });

// 测试认证状态
fetch('https://apologize-is-all-you-need.onrender.com/api/auth/status')
  .then(r => r.json())
  .then(data => {
    console.log('=== Auth Status ===');
    console.log('Auth Enabled:', data.authEnabled);
    console.log('Is Authenticated:', data.isAuthenticated);
    console.log(data);
  });
```

**预期结果 (配置成功)**:
```javascript
// Health Check
{
  status: "healthy",
  services: {
    api: "healthy",
    llm: "healthy"  // ← 应该是 "healthy"
  },
  config: {
    provider: "gemini",
    model: "gemini-1.5-flash",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    configured: true  // ← 应该是 true
  }
}

// LLM Health
{
  status: "healthy",  // ← 应该是 "healthy"
  provider: "gemini",
  responseTime: "234ms",
  diagnostics: {
    canConnect: true,  // ← 应该是 true
    configured: true
  }
}

// Auth Status
{
  authEnabled: false,
  isAuthenticated: false,
  requiresAuth: false
}
```

#### 方法 B: 使用 curl

```bash
# 健康检查
curl https://apologize-is-all-you-need.onrender.com/api/health | jq .

# LLM 健康检查
curl https://apologize-is-all-you-need.onrender.com/api/health/llm | jq .

# 认证状态
curl https://apologize-is-all-you-need.onrender.com/api/auth/status | jq .
```

#### 方法 C: 使用诊断工具

```bash
# 在项目目录运行
node backend/test-api-connection.cjs https://apologize-is-all-you-need.onrender.com
```

### 3.2 测试聊天 API

```javascript
// 在浏览器控制台执行
fetch('https://apologize-is-all-you-need.onrender.com/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '我今天迟到了',
    style: 'gentle'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('=== Chat Response ===');
    console.log('Session ID:', data.sessionId);
    console.log('Reply:', data.reply);
    console.log('Emotion:', data.emotion);
    console.log('Tokens Used:', data.tokensUsed);
    console.log(data);
  })
  .catch(err => {
    console.error('Error:', err);
  });
```

**预期响应**:
```javascript
{
  sessionId: "uuid-here",
  reply: "对不起，我迟到了真的很抱歉...",  // 中文道歉内容
  emotion: "guilt",
  style: "gentle",
  tokensUsed: 123,
  timestamp: "2025-11-16T..."
}
```

---

## 第四阶段：远程调试前端集成

### 4.1 访问前端应用

访问: https://apologize-is-all-you-need-web.vercel.app

### 4.2 检查健康状态指示器

1. 查看右上角的健康状态指示器（小圆点）
2. 点击查看详细信息

**预期状态**:
- 🟢 绿色圆点 = 所有服务正常
- 后端服务: 正常
- LLM服务: 正常
- 最后检查时间显示

**如果显示黄色或红色**:
- 🟡 黄色 = LLM 服务不可用（需要检查 Gemini 配置）
- 🔴 红色 = 后端服务不可用（需要检查 Render 部署状态）

### 4.3 检查网络请求

1. 打开浏览器开发者工具 (F12)
2. 切换到 "Network" 标签
3. 刷新页面
4. 查找以下请求：

| 请求 | 状态码 | 说明 |
|------|--------|------|
| `/api/health` | 200 OK | ✅ 后端健康 |
| `/api/auth/status` | 200 OK | ✅ 认证状态 |

### 4.4 测试聊天功能

1. 在输入框输入测试消息，例如："你好"
2. 点击发送按钮
3. 观察响应

**预期行为**:
- ✅ 输入框清空
- ✅ 用户消息显示在聊天区域
- ✅ 显示"思考中..."加载状态
- ✅ 收到 AI 道歉回复（中文）
- ✅ 回复显示在聊天区域
- ✅ 显示 token 使用量

**检查 Network 标签**:
- 应该看到 POST `/api/chat/message` 请求
- 状态码应该是 200 OK
- 响应应该包含 `reply` 字段

### 4.5 测试不同的道歉风格

测试以下场景:

| 场景 | 消息 | 风格 | 预期 |
|------|------|------|------|
| 迟到 | "我今天迟到了" | gentle | 温和的道歉 |
| 忘记 | "我忘记了你的生日" | sincere | 真诚的道歉 |
| 损坏 | "我弄坏了你的东西" | formal | 正式的道歉 |

### 4.6 测试对话历史

1. 发送第一条消息："我做错了"
2. 发送第二条消息："我应该怎么办？"
3. 检查第二条回复是否考虑了上下文

**预期**: 第二条回复应该与第一条消息相关联

---

## 第五阶段：端到端功能测试

### 测试用例清单

#### ✅ 基础功能测试

- [ ] **T1**: 页面加载正常，无 JavaScript 错误
- [ ] **T2**: 健康状态指示器显示绿色
- [ ] **T3**: 可以输入消息
- [ ] **T4**: 可以发送消息
- [ ] **T5**: 收到 AI 回复
- [ ] **T6**: 回复内容为中文
- [ ] **T7**: 显示 token 使用量

#### ✅ 对话历史测试

- [ ] **T8**: 发送多条消息，历史记录保留
- [ ] **T9**: 刷新页面，会话 ID 保持
- [ ] **T10**: 清除历史功能正常工作

#### ✅ 风格切换测试

- [ ] **T11**: 切换到 "sincere" 风格
- [ ] **T12**: 切换到 "formal" 风格
- [ ] **T13**: 切换到 "humorous" 风格
- [ ] **T14**: 不同风格的回复确实不同

#### ✅ 错误处理测试

- [ ] **T15**: 发送空消息 - 应该提示错误或禁止发送
- [ ] **T16**: 发送超长消息 (>1000字) - 应该正常处理或提示
- [ ] **T17**: 网络断开时发送消息 - 应该显示错误提示
- [ ] **T18**: 后端返回错误时 - 应该友好提示用户

#### ✅ 性能测试

- [ ] **T19**: 首次加载时间 < 3 秒
- [ ] **T20**: 消息响应时间 < 10 秒
- [ ] **T21**: 连续发送 5 条消息无卡顿
- [ ] **T22**: 100 条历史记录不影响性能

#### ✅ 移动端测试

- [ ] **T23**: 在手机浏览器打开正常
- [ ] **T24**: 输入框自适应移动端键盘
- [ ] **T25**: 聊天界面在小屏幕上正常显示

---

## 第六阶段：查看日志和监控

### 6.1 Render 日志

访问 Render Dashboard 查看实时日志:

**成功的 API 调用日志**:
```
[INFO] POST /api/chat/message 200 1234ms
  Session: abc-123
  Tokens: 156
  Style: gentle

[LLM] Gemini chat completion successful
  Model: gemini-1.5-flash
  Tokens: { prompt: 78, completion: 78, total: 156 }
  Duration: 1234ms
```

**失败的调用日志** (如果 API key 无效):
```
[ERROR] LLM API call failed
  Provider: gemini
  Error: API key is invalid

[ERROR] POST /api/chat/message 500 234ms
  Error: Cannot connect to LLM provider
```

### 6.2 Vercel 日志

访问 Vercel Dashboard 查看前端日志:
- 访问: https://vercel.com/
- 选择项目
- 点击 "Logs" 标签

---

## 故障排除清单

### 问题 1: Health API 返回 "llm: unavailable"

**可能原因**:
- Gemini API key 未配置
- API key 配置错误
- API key 无效或过期

**解决方案**:
1. 检查 Render 环境变量 `GEMINI_API_KEY`
2. 确认 key 以 "AIza" 开头
3. 使用 test-gemini-api.cjs 测试 key
4. 重新生成 API key: https://aistudio.google.com/app/apikey

### 问题 2: Chat API 返回 500 错误

**可能原因**:
- LLM 服务连接失败
- API 配额用尽
- 网络连接问题

**解决方案**:
1. 查看 Render 日志确认错误详情
2. 检查 Gemini API 配额: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
3. 测试 API key 是否有效

### 问题 3: 前端无法连接到后端

**可能原因**:
- Render 服务休眠（免费层）
- CORS 配置错误
- Vercel 环境变量未配置

**解决方案**:
1. 访问后端 URL 唤醒服务
2. 检查 Render `CORS_ORIGIN` 设置
3. 检查 Vercel `VITE_API_URL` 设置

### 问题 4: 响应速度很慢 (>10 秒)

**可能原因**:
- Render 免费层冷启动
- Gemini API 响应慢
- 使用了较慢的模型

**解决方案**:
1. 等待服务完全启动（首次访问较慢）
2. 使用 `gemini-1.5-flash` 而不是 `gemini-pro`
3. 调整 `LLM_MAX_TOKENS` 减少响应长度
4. 考虑升级 Render 到付费计划

---

## 成功标准

### ✅ 全部测试通过的标志

1. **Gemini API Key 测试**
   - ✅ List models: PASS
   - ✅ Generate content: PASS
   - ✅ Rate limit: PASS

2. **后端 API 测试**
   - ✅ `/api/health` 返回 200, llm: "healthy"
   - ✅ `/api/health/llm` 返回 200, status: "healthy"
   - ✅ `/api/chat/message` 返回 200, 包含 reply

3. **前端集成测试**
   - ✅ 健康状态显示绿色
   - ✅ 可以发送消息并收到回复
   - ✅ 回复内容为中文道歉
   - ✅ 不同风格产生不同回复

4. **性能测试**
   - ✅ 页面加载时间 < 3 秒
   - ✅ API 响应时间 < 10 秒
   - ✅ 连续请求无卡顿

5. **日志验证**
   - ✅ Render 日志显示成功的 LLM 调用
   - ✅ 无错误或异常日志
   - ✅ Token 使用量正常

---

## 测试报告模板

完成测试后，填写此报告：

```
# E2E 测试报告

**测试日期**: 2025-11-16
**测试人员**: [你的名字]
**环境**: Production (Render + Vercel)

## 第一阶段: Gemini API Key 测试
- [ ] List models: PASS/FAIL
- [ ] Generate content: PASS/FAIL
- [ ] Rate limit: PASS/FAIL

## 第二阶段: 后端 LLM 集成测试
- [ ] Configuration: PASS/FAIL
- [ ] Health check: PASS/FAIL
- [ ] Chat completion: PASS/FAIL
- [ ] Apology generation: PASS/FAIL

## 第三阶段: 后端 API 远程调试
- [ ] /api/health: PASS/FAIL
- [ ] /api/health/llm: PASS/FAIL
- [ ] /api/chat/message: PASS/FAIL

## 第四阶段: 前端集成测试
- [ ] 页面加载: PASS/FAIL
- [ ] 健康状态: PASS/FAIL
- [ ] 发送消息: PASS/FAIL
- [ ] 接收回复: PASS/FAIL

## 第五阶段: 端到端功能测试
- [ ] 基础功能 (7/7): PASS/FAIL
- [ ] 对话历史 (3/3): PASS/FAIL
- [ ] 风格切换 (4/4): PASS/FAIL
- [ ] 错误处理 (4/4): PASS/FAIL
- [ ] 性能测试 (4/4): PASS/FAIL

## 总体评估
- 通过率: __/__ (__%)
- 状态: ✅ 通过 / ❌ 失败

## 遇到的问题
[列出遇到的问题和解决方案]

## 建议和改进
[列出改进建议]
```

---

## 附录：快速命令参考

```bash
# 测试 Gemini API key
node backend/test-gemini-api.cjs AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM

# 测试后端 API 连接
node backend/test-api-connection.cjs https://apologize-is-all-you-need.onrender.com

# 运行 LLM 集成测试
cd backend
export GEMINI_API_KEY=AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM
npm test -- llm-integration.test.ts

# 快速健康检查 (curl)
curl https://apologize-is-all-you-need.onrender.com/api/health | jq '.services'
curl https://apologize-is-all-you-need.onrender.com/api/health/llm | jq '.status'

# 测试聊天 API (curl)
curl -X POST https://apologize-is-all-you-need.onrender.com/api/chat/message \
  -H 'Content-Type: application/json' \
  -d '{"message":"你好","style":"gentle"}' | jq '.reply'
```

---

**最后更新**: 2025-11-16
**维护者**: Claude
