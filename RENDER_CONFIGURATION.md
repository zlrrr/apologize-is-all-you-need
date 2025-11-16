# Render 环境变量配置指南

## 当前问题

`/api/health` 返回 503 状态码是因为后端默认尝试连接本地 LM Studio (`http://127.0.0.1:1234`)，但在 Render 生产环境中该服务不可用。

## 解决方案

需要在 Render 上配置云端 LLM provider（如 OpenAI、Anthropic、Gemini 或自定义 API）。

## Render 环境变量配置步骤

### 1. 登录 Render Dashboard
- 访问 https://dashboard.render.com
- 选择你的后端服务

### 2. 进入环境变量设置
- 点击 "Environment" 标签
- 点击 "Add Environment Variable" 添加以下变量

### 3. 基础配置（必需）

```bash
NODE_ENV=production
BACKEND_PORT=5001
SESSION_SECRET=your-random-secret-key-change-this
JWT_SECRET=your-jwt-secret-key-change-this
```

### 4. CORS 配置（必需）

```bash
FRONTEND_URL=https://apologize-is-all-you-need.vercel.app
CORS_ORIGIN=https://apologize-is-all-you-need.vercel.app
```

### 5. LLM Provider 配置（选择一个）

#### 选项 A: 使用 OpenAI（推荐）

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

**获取 API Key:**
1. 访问 https://platform.openai.com/api-keys
2. 创建新的 API key
3. 复制并粘贴到 `OPENAI_API_KEY`

#### 选项 B: 使用 Anthropic Claude

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
```

**获取 API Key:**
1. 访问 https://console.anthropic.com/settings/keys
2. 创建新的 API key
3. 复制并粘贴到 `ANTHROPIC_API_KEY`

#### 选项 C: 使用 Google Gemini

```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

**获取 API Key:**
1. 访问 https://aistudio.google.com/app/apikey
2. 创建新的 API key
3. 复制并粘贴到 `GEMINI_API_KEY`

#### 选项 D: 使用自定义 OpenAI 兼容 API

```bash
LLM_PROVIDER=custom
CUSTOM_BASE_URL=https://your-custom-api-url
CUSTOM_API_KEY=your-custom-api-key
CUSTOM_MODEL=your-model-name
```

### 6. 可选配置

```bash
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=500
LOG_LEVEL=info

# 认证配置（可选，留空则禁用认证）
ACCESS_PASSWORD=
INVITE_CODES=
```

### 7. 保存并重新部署

- 点击 "Save Changes"
- Render 会自动重新部署服务
- 等待部署完成（通常 2-5 分钟）

## 验证配置

部署完成后，访问以下端点验证配置：

### 1. 检查基础健康状态
```bash
curl https://apologize-is-all-you-need.onrender.com/api/health
```

应该返回 200 状态码和包含 LLM 配置信息的 JSON。

### 2. 检查 LLM 健康状态
```bash
curl https://apologize-is-all-you-need.onrender.com/api/health/llm
```

如果配置正确，应该返回 200 状态码表示 LLM 服务可用。

### 3. 检查认证状态
```bash
curl https://apologize-is-all-you-need.onrender.com/api/auth/status
```

应该返回认证配置信息。

## 故障排除

### 问题 1: 仍然返回 503
- 检查环境变量是否正确保存
- 确认 API Key 有效且有足够的配额
- 查看 Render 日志确认错误信息

### 问题 2: CORS 错误
- 确认 `FRONTEND_URL` 和 `CORS_ORIGIN` 设置正确
- 确认前端 URL 没有尾部斜杠

### 问题 3: API Key 无效
- 重新生成 API Key
- 确认没有额外的空格或换行符
- 检查 API provider 的账户状态和配额

## 成本考虑

- **OpenAI gpt-4o-mini**: ~$0.15/百万 tokens（输入），~$0.60/百万 tokens（输出）
- **Anthropic Claude**: ~$3.00/百万 tokens（输入），~$15.00/百万 tokens（输出）
- **Google Gemini**: 免费配额，超出后付费

建议从 OpenAI 的 gpt-4o-mini 开始，性价比最高。

## 更新日志

- 2025-11-16: 修复健康检查逻辑，`/api/health` 现在返回 200 状态码
- 2025-11-16: 添加 LLM 配置诊断信息
- 2025-11-16: 支持多种 LLM providers
