# 错误码参考手册 (Error Codes Reference)

本文档列出了所有后端 API 可能返回的错误码及其含义、原因和解决方案。

---

## 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "error": "错误类型",
  "errorCode": "ERR-XXXX",
  "message": "错误描述信息",
  "requestId": "请求唯一标识",
  "timestamp": "2025-11-16T...",
  "diagnostic": {  // 仅在开发环境返回
    "provider": "llm-provider-name",
    "suggestion": "修复建议"
  }
}
```

---

## LLM 相关错误 (5000-5999)

### ERR-5001: LLM_CONNECTION_REFUSED

**含义**: 无法连接到 LLM 提供商

**HTTP 状态码**: 503 Service Unavailable

**可能原因**:
- LLM provider 未配置或配置错误
- API key 缺失或无效
- 网络无法访问 LLM provider

**解决方案**:
1. 检查环境变量是否正确配置
   - Gemini: `GEMINI_API_KEY`, `LLM_PROVIDER=gemini`
   - OpenAI: `OPENAI_API_KEY`, `LLM_PROVIDER=openai`
2. 验证 API key 是否有效
3. 检查网络连接

**示例错误响应**:
```json
{
  "error": "CONNECTION_REFUSED",
  "errorCode": "ERR-5001",
  "message": "Cannot connect to LM Studio. Please ensure LM Studio is running.",
  "requestId": "abc-123",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "diagnostic": {
    "provider": "lm-studio",
    "suggestion": "Check if LLM provider is configured and accessible. For Gemini, verify GEMINI_API_KEY is set."
  }
}
```

**日志标识**: `[LLM-ERROR]`

---

### ERR-5002: LLM_TIMEOUT

**含义**: LLM API 请求超时

**HTTP 状态码**: 504 Gateway Timeout

**可能原因**:
- LLM provider 响应时间过长
- 网络延迟过高
- 请求的 tokens 数量过多

**解决方案**:
1. 重试请求
2. 减少 `LLM_MAX_TOKENS` 的值
3. 检查 LLM provider 的状态页面
4. 考虑使用更快的模型（如 gemini-1.5-flash）

**示例错误响应**:
```json
{
  "error": "TIMEOUT",
  "errorCode": "ERR-5002",
  "message": "Request to LM Studio timed out",
  "requestId": "abc-123",
  "diagnostic": {
    "suggestion": "LLM provider is taking too long to respond. Try again or check provider status."
  }
}
```

**日志标识**: `[LLM-ERROR]`, duration > 30000ms

---

### ERR-5003: LLM_API_ERROR

**含义**: LLM API 返回错误

**HTTP 状态码**: 502 Bad Gateway (或 API 返回的具体状态码)

**可能原因**:
- API key 无效或已过期
- 超出 API 配额限制
- 请求格式不正确
- 模型不可用

**解决方案**:
1. 验证 API key 是否有效
2. 检查 API 配额使用情况
   - Gemini: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   - OpenAI: https://platform.openai.com/usage
3. 重新生成 API key
4. 检查模型名称是否正确

**示例错误响应**:
```json
{
  "error": "API_ERROR",
  "errorCode": "ERR-5003",
  "message": "LM Studio API error: Unauthorized",
  "requestId": "abc-123",
  "diagnostic": {
    "suggestion": "LLM API returned an error. Check API key validity and quota limits."
  }
}
```

**日志标识**: `[LLM-ERROR]`, `errorStatus: 4xx or 5xx`

---

### ERR-5004: LLM_NETWORK_ERROR

**含义**: 网络连接失败

**HTTP 状态码**: 502 Bad Gateway

**可能原因**:
- 网络连接中断
- DNS 解析失败
- 防火墙阻止连接

**解决方案**:
1. 检查网络连接
2. 验证 DNS 设置
3. 检查防火墙规则
4. 使用 `ping` 或 `curl` 测试连接

**示例错误响应**:
```json
{
  "error": "NETWORK_ERROR",
  "errorCode": "ERR-5004",
  "message": "Network error: ENOTFOUND generativelanguage.googleapis.com",
  "requestId": "abc-123"
}
```

---

### ERR-5005: LLM_UNKNOWN_ERROR

**含义**: LLM 服务未知错误

**HTTP 状态码**: 500 Internal Server Error

**可能原因**:
- 未预期的错误
- LLM provider 内部错误

**解决方案**:
1. 查看后端日志获取详细信息
2. 重试请求
3. 联系技术支持

**日志标识**: `[LLM-ERROR]`, 无特定错误类型

---

### ERR-5006: LLM_NOT_CONFIGURED

**含义**: LLM 服务未配置

**HTTP 状态码**: 503 Service Unavailable

**可能原因**:
- `LLM_PROVIDER` 未设置
- 对应 provider 的 API key 未配置

**解决方案**:
1. 设置 `LLM_PROVIDER` 环境变量
2. 设置对应的 API key 环境变量
3. 参考 `GEMINI_CONFIGURATION_GUIDE.md`

---

## 验证错误 (4000-4999)

### ERR-4001: VALIDATION_ERROR

**含义**: 请求参数验证失败

**HTTP 状态码**: 400 Bad Request

**可能原因**:
- 缺少必需参数
- 参数格式不正确
- 参数值超出范围

**解决方案**:
1. 检查请求体格式
2. 确保所有必需字段都存在
3. 验证参数值的类型和范围

**示例错误响应**:
```json
{
  "error": "Validation Error",
  "errorCode": "ERR-4001",
  "message": "message is required",
  "requestId": "abc-123"
}
```

---

### ERR-4002: INVALID_INPUT

**含义**: 输入数据无效

**HTTP 状态码**: 400 Bad Request

**可能原因**:
- 数据格式错误
- 包含非法字符
- 数据长度超出限制

**解决方案**:
1. 检查输入数据格式
2. 移除非法字符
3. 确保数据长度在允许范围内

---

### ERR-4003: MISSING_PARAMETER

**含义**: 缺少必需参数

**HTTP 状态码**: 400 Bad Request

**可能原因**:
- 请求缺少必需字段

**解决方案**:
1. 添加缺少的参数
2. 查看 API 文档确认必需字段

---

## 会话错误 (3000-3999)

### ERR-3001: SESSION_NOT_FOUND

**含义**: 会话不存在

**HTTP 状态码**: 404 Not Found

**可能原因**:
- 会话 ID 不存在
- 会话已被删除

**解决方案**:
1. 验证会话 ID 是否正确
2. 创建新会话

---

### ERR-3002: SESSION_EXPIRED

**含义**: 会话已过期

**HTTP 状态码**: 401 Unauthorized

**可能原因**:
- 会话超时
- 服务器重启导致会话丢失

**解决方案**:
1. 创建新会话
2. 重新登录

---

## 通用错误 (1000-1999)

### ERR-1000: INTERNAL_ERROR

**含义**: 服务器内部错误

**HTTP 状态码**: 500 Internal Server Error

**可能原因**:
- 未预期的服务器错误
- 代码 bug
- 资源不足

**解决方案**:
1. 查看服务器日志
2. 重试请求
3. 联系技术支持

---

### ERR-1999: UNKNOWN_ERROR

**含义**: 未知错误

**HTTP 状态码**: 500 Internal Server Error

**可能原因**:
- 未分类的错误
- 第三方服务错误

**解决方案**:
1. 查看日志获取详细信息
2. 重试请求
3. 联系技术支持

---

## 调试日志代码

### 聊天相关日志

| 日志代码 | 含义 | 级别 |
|---------|------|------|
| `[CHAT-001]` | 开始处理聊天消息 | INFO |
| `[CHAT-002]` | 检索到对话历史 | INFO |
| `[CHAT-003]` | 调用 LLM 服务 | INFO |
| `[CHAT-004]` | LLM 响应已接收 | INFO |
| `[CHAT-005]` | 会话更新成功 | INFO |
| `[CHAT-006]` | 聊天请求完成 | INFO |
| `[CHAT-ERROR]` | 聊天请求失败 | ERROR |

### LLM 服务日志

| 日志代码 | 含义 | 级别 |
|---------|------|------|
| `[LLM-001]` | 开始生成道歉 | INFO |
| `[LLM-002]` | 情感检测完成 | INFO |
| `[LLM-003]` | 调用 LLM API | INFO |
| `[LLM-004]` | LLM API 调用成功 | INFO |
| `[LLM-ERROR]` | 道歉生成失败 | ERROR |

### 错误处理日志

| 日志代码 | 含义 | 级别 |
|---------|------|------|
| `[ERROR-HANDLER]` | 全局错误处理 | ERROR |

---

## 调试工具

### 1. 聊天调试器

使用 `chat-debugger.html` 工具测试聊天功能：

```bash
# 在浏览器中打开
open chat-debugger.html
```

**功能**:
- 发送测试消息
- 查看详细的请求/响应日志
- 显示错误码和诊断信息
- 实时日志输出

### 2. E2E 测试工具

使用 `browser-e2e-test.html` 工具测试所有 API：

```bash
open browser-e2e-test.html
```

### 3. 命令行测试

```bash
# 测试聊天 API
curl -X POST https://apologize-is-all-you-need.onrender.com/api/chat/message \
  -H 'Content-Type: application/json' \
  -d '{"message":"测试消息","style":"gentle"}'
```

---

## 常见问题排查

### Q1: 收到 ERR-5001 错误

**检查清单**:
- [ ] Render 环境变量 `LLM_PROVIDER` 已设置
- [ ] 对应的 API key 已设置（如 `GEMINI_API_KEY`）
- [ ] API key 格式正确（Gemini 以 "AIza" 开头）
- [ ] API key 有效且未过期

**验证方法**:
```bash
# 使用 chat-debugger.html 或浏览器控制台
fetch('https://apologize-is-all-you-need.onrender.com/api/health/llm')
  .then(r => r.json())
  .then(console.log)
```

### Q2: 前端看不到错误信息

**可能原因**:
- CORS 预检请求失败（OPTIONS 204）
- 实际 POST 请求被阻止

**解决方案**:
1. 检查浏览器控制台的 Network 标签
2. 确认 CORS 配置正确
3. 使用 `chat-debugger.html` 查看详细日志

### Q3: 后端日志在哪里查看

**Render 日志**:
1. 访问 https://dashboard.render.com
2. 选择服务
3. 点击 "Logs" 标签
4. 搜索日志代码（如 `[CHAT-ERROR]`）

---

## 最佳实践

### 1. 错误处理

```javascript
// 前端错误处理示例
try {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'test', style: 'gentle' })
  });

  const data = await response.json();

  if (!response.ok) {
    // 根据错误码采取不同的处理
    switch (data.errorCode) {
      case 'ERR-5001':
        console.error('LLM 未配置，请联系管理员');
        break;
      case 'ERR-5002':
        console.error('请求超时，请重试');
        break;
      case 'ERR-5003':
        console.error('API 配额用尽或 key 无效');
        break;
      default:
        console.error(`未知错误: ${data.errorCode}`);
    }
  }
} catch (error) {
  console.error('网络错误:', error);
}
```

### 2. 日志分析

在 Render 日志中搜索：
- `[CHAT-ERROR]` - 聊天错误
- `[LLM-ERROR]` - LLM 服务错误
- `ERR-` - 所有错误码

### 3. 性能监控

关注日志中的 `duration` 字段：
- 正常: < 5000ms
- 慢: 5000-10000ms
- 超时: > 30000ms

---

**最后更新**: 2025-11-16
**维护者**: Claude
