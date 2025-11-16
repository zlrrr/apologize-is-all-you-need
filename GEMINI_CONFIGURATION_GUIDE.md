# Gemini API 配置指南

本文档提供在 Render 上配置 Google Gemini API 的详细步骤。

## 系统架构说明

### 当前配置
- **前端**: https://apologize-is-all-you-need-web.vercel.app (部署在 Vercel)
- **后端**: https://apologize-is-all-you-need.onrender.com (部署在 Render)
- **LLM Provider**: Google Gemini (默认从 LM Studio 改为 Gemini)

### 为什么选择 Gemini

1. **免费额度充足**: Gemini 提供慷慨的免费配额
2. **响应速度快**: 特别是 gemini-1.5-flash 模型
3. **无需本地部署**: 相比 LM Studio，不需要本地运行
4. **适合生产环境**: Render 免费层无法运行 LM Studio

## 步骤 1: 获取 Gemini API Key

### 1.1 访问 Google AI Studio
- 打开浏览器，访问 https://aistudio.google.com/app/apikey
- 使用你的 Google 账号登录

### 1.2 创建 API Key
1. 点击 "Create API Key" 按钮
2. 选择一个 Google Cloud 项目（或创建新项目）
3. 点击 "Create API key in existing project"
4. 复制生成的 API key（格式类似：`AIzaSy...`）

**重要提示**:
- 保管好你的 API key，不要泄露给他人
- 不要将 API key 提交到 Git 仓库
- Gemini 免费额度：15 requests/min, 1500 requests/day

## 步骤 2: 在 Render 配置环境变量

### 2.1 登录 Render Dashboard
1. 访问 https://dashboard.render.com
2. 登录你的账号
3. 选择后端服务 `apologize-is-all-you-need`

### 2.2 添加环境变量
1. 点击左侧菜单的 "Environment" 标签
2. 点击 "Add Environment Variable" 按钮
3. 逐个添加以下环境变量：

#### 必需的 Gemini 配置
```bash
# LLM Provider 设置
LLM_PROVIDER=gemini

# Gemini API 密钥
GEMINI_API_KEY=你的-gemini-api-key-这里

# Gemini 模型设置
GEMINI_MODEL=gemini-1.5-flash

# Gemini API 地址（可选，使用默认值）
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

#### 基础配置（必需）
```bash
NODE_ENV=production
BACKEND_PORT=5001
SESSION_SECRET=生成一个随机字符串作为session密钥
JWT_SECRET=生成一个随机字符串作为JWT密钥
```

#### CORS 配置（必需）
```bash
FRONTEND_URL=https://apologize-is-all-you-need-web.vercel.app
CORS_ORIGIN=https://apologize-is-all-you-need-web.vercel.app
```

#### LLM 参数配置（可选）
```bash
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=500
LOG_LEVEL=info
```

#### 认证配置（可选，留空则禁用）
```bash
ACCESS_PASSWORD=
INVITE_CODES=
```

### 2.3 保存并重新部署
1. 点击 "Save Changes" 按钮
2. Render 会自动触发重新部署
3. 等待部署完成（通常需要 2-5 分钟）
4. 查看部署日志确认没有错误

## 步骤 3: 验证配置

### 3.1 检查健康状态 API

打开浏览器开发者工具（F12），然后访问：
https://apologize-is-all-you-need-web.vercel.app

#### 查看网络请求
1. 切换到 "Network" 标签
2. 刷新页面
3. 查找 `/api/health` 请求

#### 预期响应（配置成功）
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T...",
  "uptime": 123.456,
  "services": {
    "api": "healthy",
    "llm": "healthy"
  },
  "config": {
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "baseURL": "https://generativelanguage.googleapis.com/v1beta",
    "configured": true
  }
}
```

**HTTP 状态码**: 200 OK

#### 失败响应示例（未配置 Gemini）
```json
{
  "status": "degraded",
  "timestamp": "2025-11-16T...",
  "uptime": 123.456,
  "services": {
    "api": "healthy",
    "llm": "unavailable"
  },
  "config": {
    "provider": "lm-studio",
    "model": "local-model",
    "baseURL": "http://127.0.0.1:1234",
    "configured": false
  },
  "diagnostics": {
    "message": "LLM provider not configured...",
    "suggestions": [...]
  }
}
```

### 3.2 检查 LLM 专用健康端点

在浏览器控制台（Console）执行：
```javascript
fetch('https://apologize-is-all-you-need.onrender.com/api/health/llm')
  .then(r => r.json())
  .then(console.log)
```

#### 预期响应（Gemini 配置成功）
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T...",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "baseURL": "https://generativelanguage.googleapis.com/v1beta",
  "responseTime": "234ms",
  "diagnostics": {
    "canConnect": true,
    "timeout": 30000,
    "configured": true
  }
}
```

**HTTP 状态码**: 200 OK

### 3.3 测试聊天功能

1. 访问前端: https://apologize-is-all-you-need-web.vercel.app
2. 在右上角查看健康状态指示器（小圆点）
   - 🟢 绿色 = 所有服务正常
   - 🟡 黄色 = 服务降级（LLM 不可用但 API 正常）
   - 🔴 红色 = 服务不可用
3. 点击健康状态指示器查看详细信息
4. 发送测试消息，例如："你好"
5. 应该能收到来自 Gemini 的道歉回复

## 步骤 4: 查看日志（故障排除）

### 4.1 查看 Render 日志
1. 在 Render Dashboard 中选择你的服务
2. 点击 "Logs" 标签
3. 查看实时日志输出

### 4.2 关键日志信息

#### 成功启动日志
```
🚀 Backend server running on http://localhost:5001
📝 Health check: http://localhost:5001/api/health
💬 Chat API: http://localhost:5001/api/chat
⚠️  Authentication is DISABLED
```

#### LLM 调用成功日志
```
[LLM] Gemini chat completion successful
Provider: gemini
Model: gemini-1.5-flash
Tokens: { prompt: 45, completion: 78, total: 123 }
Duration: 1234ms
```

#### LLM 调用失败日志
```
[LLM] Gemini chat completion failed
Error: API key is invalid
Provider: gemini
Model: gemini-1.5-flash
```

## 常见问题排除

### 问题 1: LLM 状态显示 "unavailable"

**可能原因**:
- Gemini API key 未配置或配置错误
- API key 无效或已过期
- 超出 Gemini API 配额限制

**解决方案**:
1. 检查 Render 环境变量中的 `GEMINI_API_KEY` 是否正确
2. 访问 https://aistudio.google.com/app/apikey 确认 key 有效
3. 检查 API 使用配额：https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

### 问题 2: API 返回 403 Forbidden

**可能原因**:
- CORS 配置不正确
- Gemini API key 权限不足

**解决方案**:
1. 确认 `CORS_ORIGIN` 设置为前端 URL
2. 在 Google Cloud Console 中检查 API key 的 API 限制设置

### 问题 3: API 返回 429 Too Many Requests

**可能原因**:
- 超出 Gemini 免费配额（15 req/min 或 1500 req/day）

**解决方案**:
1. 等待配额重置（每分钟或每天）
2. 考虑升级到付费计划
3. 在代码中实现请求限流

### 问题 4: 响应速度慢

**可能原因**:
- 使用了较慢的模型
- Render 免费层的冷启动延迟
- 网络延迟

**解决方案**:
1. 使用 `gemini-1.5-flash` 而不是 `gemini-pro`（Flash 更快）
2. 考虑升级 Render 到付费计划（避免冷启动）
3. 调整 `LLM_MAX_TOKENS` 以减少响应长度

### 问题 5: Render 服务无法访问

**可能原因**:
- Render 服务正在部署
- Render 服务休眠（免费层 15 分钟无活动后休眠）
- 服务崩溃

**解决方案**:
1. 访问 Render Dashboard 查看服务状态
2. 等待部署完成
3. 手动触发重新部署
4. 查看日志找出崩溃原因

## Gemini 模型选择

### 推荐模型

| 模型 | 特点 | 适用场景 |
|------|------|----------|
| gemini-1.5-flash | 快速、高效 | 生产环境推荐 ⭐ |
| gemini-1.5-pro | 更强大，但较慢 | 需要高质量回复 |
| gemini-pro | 稳定版本 | 平衡性能和质量 |

### 修改模型

在 Render 环境变量中修改：
```bash
GEMINI_MODEL=gemini-1.5-pro  # 改为其他模型
```

## 成本和配额

### Gemini 免费配额
- **Rate limit**: 15 requests/minute
- **Daily limit**: 1500 requests/day
- **Token limit**: 依模型而定

### 付费定价（参考）
- **gemini-1.5-flash**: ~$0.075/百万 tokens（输入），~$0.30/百万 tokens（输出）
- **gemini-1.5-pro**: ~$1.25/百万 tokens（输入），~$5.00/百万 tokens（输出）

更多信息: https://ai.google.dev/pricing

## 前后端对接检查清单

- [ ] Render 上已配置 `LLM_PROVIDER=gemini`
- [ ] Render 上已配置有效的 `GEMINI_API_KEY`
- [ ] Render 上已配置 `GEMINI_MODEL=gemini-1.5-flash`
- [ ] Render 上已配置正确的 `CORS_ORIGIN`
- [ ] Vercel 上已配置 `VITE_API_URL` 指向 Render 后端
- [ ] `/api/health` 返回 200 且 `services.llm` 为 "healthy"
- [ ] `/api/health/llm` 返回 200 且 `status` 为 "healthy"
- [ ] 前端健康指示器显示绿色
- [ ] 能够成功发送消息并收到回复

## 安全建议

1. **不要在代码中硬编码 API Key**
2. **定期轮换 API Key**
3. **在 Google Cloud Console 中设置 API Key 限制**（限制为特定 API）
4. **启用 IP 地址限制**（如果有固定 IP）
5. **监控 API 使用情况**，防止滥用
6. **考虑启用后端认证**（设置 `ACCESS_PASSWORD` 或 `INVITE_CODES`）

## 下一步

配置完成后，你可以：
1. 在前端测试聊天功能
2. 查看 Render 日志监控 API 调用
3. 调整 `LLM_TEMPERATURE` 和 `LLM_MAX_TOKENS` 参数优化响应质量
4. 启用认证保护你的服务
5. 考虑添加速率限制中间件

## 相关文档

- [后端 API 文档](./backend/README.md)
- [Render 配置指南](./RENDER_CONFIGURATION.md)
- [Google AI Studio](https://aistudio.google.com)
- [Gemini API 文档](https://ai.google.dev/docs)

---

**最后更新**: 2025-11-16
**维护者**: Claude
