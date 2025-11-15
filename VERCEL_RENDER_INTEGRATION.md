# Vercel + Render 完整集成与调试指南 🚀

> **架构**：前端部署在 Vercel，后端部署在 Render
> **目标**：实现跨域通信，完整调试流程
> **预计耗时**：20 分钟

---

## 📊 当前配置检查

### ✅ 已修复的问题

**CORS 配置已更新** (`backend/src/server.ts`)：
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL || '',
  process.env.CORS_ORIGIN || '',  // ✅ 已添加
].filter(origin => origin.length > 0);
```

现在后端支持通过两个环境变量配置允许的前端域名。

---

## 🎯 完整配置步骤

### 步骤 1：部署后端到 Render（已完成 ✅）

您的后端应该已经在 Render 上运行。

**验证**：
```bash
# 获取您的 Render 后端 URL
RENDER_URL="https://your-backend.onrender.com"

# 测试健康检查
curl https://your-backend.onrender.com/api/health
```

**预期响应**：
```json
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "api": "healthy",
    "llm": "healthy"
  }
}
```

---

### 步骤 2：部署前端到 Vercel

#### 2.1 准备 Vercel 部署

1. **登录 Vercel**：
   - 访问：https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**：
   - Dashboard → **Add New** → **Project**
   - 选择 **Import Git Repository**
   - 选择您的仓库：`apologize-is-all-you-need`

#### 2.2 配置项目设置

在 "Configure Project" 页面：

```
┌─────────────────────────────────────────────────────────┐
│ Configure Project                                       │
├─────────────────────────────────────────────────────────┤
│ Project Name:                                           │
│ ┌───────────────────────────────────────────────────┐  │
│ │ apologize-frontend                                │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ Framework Preset:                                      │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Vite                        ▼                     │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ Root Directory:                                        │
│ ┌───────────────────────────────────────────────────┐  │
│ │ frontend                                          │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ Build Command:                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ npm run build                                     │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ Output Directory:                                      │
│ ┌───────────────────────────────────────────────────┐  │
│ │ dist                                              │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ Install Command:                                       │
│ ┌───────────────────────────────────────────────────┐  │
│ │ npm install                                       │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**填写**：
- **Project Name**: `apologize-frontend`（或您喜欢的名称）
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend` ⚠️ **必须设置！**
- **Build Command**: `npm run build`（默认）
- **Output Directory**: `dist`（默认）
- **Install Command**: `npm install`（默认）

#### 2.3 配置环境变量（关键步骤）

向下滚动到 **Environment Variables** 部分：

```
┌─────────────────────────────────────────────────────────┐
│ Environment Variables                                   │
├─────────────────────────────────────────────────────────┤
│ Add environment variables to use in your application.  │
│                                                         │
│ ┌─────────────────────┬─────────────────────────────┐  │
│ │ KEY                 │ VALUE                       │  │
│ ├─────────────────────┼─────────────────────────────┤  │
│ │ [VITE_API_URL    ]  │ [https://your-backend...  ] │  │
│ └─────────────────────┴─────────────────────────────┘  │
│                                                         │
│ Environment: ☑ Production ☑ Preview ☑ Development     │
└─────────────────────────────────────────────────────────┘
```

**添加环境变量**：

**KEY**：
```
VITE_API_URL
```

**VALUE**（替换为您的实际 Render URL）：
```
https://your-backend.onrender.com
```

⚠️ **重要**：
- KEY 必须是 `VITE_API_URL`（Vite 要求以 `VITE_` 开头）
- VALUE 必须是完整的 URL，包含 `https://`
- URL 末尾**不要**有斜杠 `/`
- 所有环境都勾选（Production、Preview、Development）

#### 2.4 部署

点击 **Deploy** 按钮，等待 2-5 分钟。

**部署过程**：
```
Building...
  ├─ Installing dependencies (npm install)
  ├─ Building application (npm run build)
  ├─ Optimizing output
  └─ Deploying to CDN

✅ Deployment Complete
```

#### 2.5 获取 Vercel 前端 URL

部署完成后，您会看到：

```
┌─────────────────────────────────────────────────────────┐
│ 🎉 Congratulations!                                     │
├─────────────────────────────────────────────────────────┤
│ Your project has been deployed.                        │
│                                                         │
│ https://apologize-frontend-xxx.vercel.app               │
│                                                         │
│ [Visit] [Dashboard]                                    │
└─────────────────────────────────────────────────────────┘
```

**记录这个 URL**：`https://apologize-frontend-xxx.vercel.app`

---

### 步骤 3：配置 Render 后端 CORS

现在需要在 Render 后端添加 Vercel 前端 URL，允许跨域访问。

#### 3.1 登录 Render Dashboard

访问：https://dashboard.render.com

#### 3.2 进入服务的 Environment 设置

1. 点击您的服务（`apologize-backend`）
2. 点击 **Settings** 标签
3. 向下滚动到 **Environment Variables** 部分

#### 3.3 添加/更新环境变量

**添加或更新以下两个变量**：

**变量 1：FRONTEND_URL**

```
Key:   FRONTEND_URL
Value: https://apologize-frontend-xxx.vercel.app
```

**变量 2：CORS_ORIGIN**

```
Key:   CORS_ORIGIN
Value: https://apologize-frontend-xxx.vercel.app
```

⚠️ **重要**：
- 使用您的**实际 Vercel URL**
- URL 必须完全一致（包括 `https://`）
- URL 末尾**不要**有斜杠 `/`
- 两个变量的值应该相同

#### 3.4 保存并等待重新部署

点击 **Save Changes** 后，Render 会自动触发重新部署（2-3 分钟）。

---

## 🧪 验证配置

### 测试 1：后端健康检查

```bash
curl https://your-backend.onrender.com/api/health
```

**预期**：返回 `{"status": "healthy", ...}`

### 测试 2：CORS 配置

```bash
curl -i -X OPTIONS https://your-backend.onrender.com/api/health \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

**预期响应头**：
```
HTTP/2 204
access-control-allow-origin: https://your-frontend.vercel.app
access-control-allow-credentials: true
```

### 测试 3：前端访问

1. 打开 Vercel 前端 URL：`https://your-frontend.vercel.app`
2. 打开浏览器开发者工具（F12）
3. 查看 **Console** 标签

**预期日志**：
```
[API Request] https://your-backend.onrender.com/api/health GET
[API Response] 200 {...} 234ms
```

### 测试 4：实际功能

在前端界面尝试发送消息，应该可以正常工作。

---

## 🔍 远程调试方法（Vercel + Render）

### 方法 1：浏览器开发者工具（最重要）

#### Console 标签

查看前端日志：

```javascript
// 检查环境变量
console.log(import.meta.env.VITE_API_URL)
// 应该输出: https://your-backend.onrender.com

// 查看 API 请求日志
[API Request] https://your-backend.onrender.com/api/health GET
[API Response] 200 {...} 234ms
```

**常见错误**：

| 日志 | 问题 | 解决方法 |
|------|------|----------|
| `VITE_API_URL: undefined` | 环境变量未配置 | Vercel Dashboard 添加环境变量 |
| `VITE_API_URL: http://localhost:5001` | 使用了默认值 | 检查环境变量，重新部署 |
| `CORS error` | CORS 配置错误 | Render 添加 FRONTEND_URL |
| `502 Bad Gateway` | 后端服务崩溃 | 查看 Render 日志 |

#### Network 标签

查看实际的 HTTP 请求：

```
Name: health
Status: 200
Type: fetch
Initiator: api.ts:89
```

**点击请求查看详情**：

**Headers 标签**：
```
Request URL: https://your-backend.onrender.com/api/health
Request Method: GET
Status Code: 200 OK

Response Headers:
  access-control-allow-origin: https://your-frontend.vercel.app
  content-type: application/json

Request Headers:
  origin: https://your-frontend.vercel.app
```

**Preview 标签**：
```json
{
  "status": "healthy",
  ...
}
```

---

### 方法 2：Vercel 部署日志

#### 查看构建日志

1. Vercel Dashboard → 您的项目
2. 点击 **Deployments** 标签
3. 点击最新的部署

**检查环境变量是否生效**：

在构建日志中搜索：
```
Environment Variables
  VITE_API_URL: https://your-backend.onrender.com
```

#### 查看运行时日志（Serverless Functions）

Vercel 主要是静态网站，前端日志在浏览器控制台。

但如果有 API routes（`/api/*`），可以查看：
- Deployments → Functions 标签 → 点击函数查看日志

---

### 方法 3：Render 后端日志

#### 实时日志

1. Render Dashboard → 您的服务
2. 点击 **Logs** 标签
3. 实时查看日志流

**关键日志**：

**启动日志**：
```
[info] Server running on port 10000
[info] LLM Provider: gemini
[info] LLM service initialized successfully
[info] Environment: production
```

**请求日志**：
```
[info] GET /api/health 200 23ms
[info] Request from origin: https://your-frontend.vercel.app
```

**CORS 日志**（如果添加了日志）：
```
[info] CORS allowed origins: http://localhost:3000, https://your-frontend.vercel.app
```

**错误日志**：
```
[error] LLM API error: 401 Unauthorized
[error] Database connection failed
```

#### 过滤日志

使用搜索框过滤：
- `error` - 只看错误
- `CORS` - CORS 相关
- `/api/health` - 健康检查请求
- `200` - 成功请求
- `500` - 服务器错误

---

### 方法 4：使用 curl 测试端点

#### 从本地测试 Render 后端

```bash
# 基础健康检查
curl https://your-backend.onrender.com/api/health

# 详细健康检查
curl https://your-backend.onrender.com/api/health/detailed

# LLM 服务检查
curl https://your-backend.onrender.com/api/health/llm

# 测试 CORS Preflight
curl -i -X OPTIONS https://your-backend.onrender.com/api/health \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET"

# 测试实际请求（带 Origin）
curl -i https://your-backend.onrender.com/api/health \
  -H "Origin: https://your-frontend.vercel.app"
```

#### 从 Vercel 测试后端（使用浏览器）

在 Vercel 前端打开控制台，执行：

```javascript
// 测试基础连接
fetch('https://your-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// 测试带凭证的请求
fetch('https://your-backend.onrender.com/api/health', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log);

// 检查环境变量
console.log('API URL:', import.meta.env.VITE_API_URL);
```

---

### 方法 5：创建远程调试脚本

在项目中创建调试脚本：

```bash
cat > test-production.sh << 'EOF'
#!/bin/bash

# 从命令行参数读取 URL，或使用默认值
BACKEND_URL="${1:-https://your-backend.onrender.com}"
FRONTEND_URL="${2:-https://your-frontend.vercel.app}"

echo "========================================="
echo "🔍 生产环境调试工具"
echo "========================================="
echo ""
echo "后端: $BACKEND_URL"
echo "前端: $FRONTEND_URL"
echo ""

echo "[1/5] 测试后端健康检查..."
HEALTH=$(curl -s "$BACKEND_URL/api/health")
echo "$HEALTH" | jq '.' || echo "$HEALTH"

echo ""
echo "[2/5] 测试 LLM 服务..."
LLM=$(curl -s "$BACKEND_URL/api/health/llm")
echo "$LLM" | jq '.' || echo "$LLM"

echo ""
echo "[3/5] 测试 CORS Preflight..."
curl -i -X OPTIONS "$BACKEND_URL/api/health" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: GET" 2>&1 | grep -i "access-control"

echo ""
echo "[4/5] 测试实际 API 调用..."
curl -i "$BACKEND_URL/api/health" \
  -H "Origin: $FRONTEND_URL" 2>&1 | grep -E "HTTP/|access-control"

echo ""
echo "[5/5] 检查前端部署..."
echo "访问: $FRONTEND_URL"
echo "打开浏览器控制台，运行:"
echo "  console.log(import.meta.env.VITE_API_URL)"
echo ""
echo "========================================="
EOF

chmod +x test-production.sh
```

**使用**：
```bash
./test-production.sh \
  https://your-backend.onrender.com \
  https://your-frontend.vercel.app
```

---

## 🐛 常见问题诊断

### 问题 1：前端显示 "无法连接到后端服务"

**可能原因**：

**A. 环境变量未配置或未生效**

**诊断**：
1. 访问 Vercel 前端
2. F12 打开控制台
3. 输入：`console.log(import.meta.env.VITE_API_URL)`

**结果**：
- ❌ 输出 `undefined` → 环境变量未配置
- ❌ 输出 `http://localhost:5001` → 环境变量未生效
- ✅ 输出 `https://your-backend.onrender.com` → 配置正确

**修复**：
```
1. Vercel Dashboard → 项目 → Settings → Environment Variables
2. 添加: VITE_API_URL = https://your-backend.onrender.com
3. Deployments → 最新部署 → ⋯ → Redeploy
```

**B. 后端服务休眠（免费计划）**

**诊断**：
```bash
curl https://your-backend.onrender.com/api/health
```

**结果**：
- 超时或非常慢（30+ 秒）→ 服务休眠

**修复**：
- 等待 30-60 秒，服务会自动唤醒
- 刷新前端页面重试
- 考虑使用 UptimeRobot 定期 ping（保持唤醒）

**C. 后端服务未启动**

**诊断**：
- Render Dashboard → 服务状态

**结果**：
- ❌ 状态显示 "Failed" 或 "Build Failed"

**修复**：
- 查看 Render Logs 查找错误
- 检查环境变量是否都已配置
- 参考 `RENDER_BUILD_FIX.md`

---

### 问题 2：CORS 错误

**浏览器控制台错误**：
```
Access to fetch at 'https://backend.onrender.com/api/health'
from origin 'https://frontend.vercel.app' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

**诊断**：

**A. 检查后端 CORS 配置**

```bash
curl -i -X OPTIONS https://your-backend.onrender.com/api/health \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

**预期响应头**：
```
access-control-allow-origin: https://your-frontend.vercel.app
access-control-allow-credentials: true
```

**如果缺失**：

**修复**：
1. Render Dashboard → 服务 → Settings → Environment
2. 添加或更新：
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
3. 保存后等待重新部署（2-3 分钟）

**B. URL 不匹配**

**常见错误**：
- 后端配置: `https://frontend.vercel.app/` （多了斜杠）
- 实际前端: `https://frontend.vercel.app`

**修复**：
- 确保 URL 完全一致
- 移除末尾斜杠
- 检查 http vs https

---

### 问题 3：LLM 服务不可用

**错误信息**：
```
LLM服务不可用，请确认LM Studio已启动并加载模型
```

**诊断**：
```bash
curl https://your-backend.onrender.com/api/health/llm
```

**可能响应**：
```json
{
  "status": "unavailable",
  "error": "LLM_PROVIDER not configured"
}
```

**修复**：

1. **检查 Render 环境变量**：
   - `LLM_PROVIDER` 应该设置为 `gemini`、`openai` 或 `anthropic`

2. **检查对应的 API Key**：
   - 如果 `LLM_PROVIDER=gemini`，需要 `GEMINI_API_KEY`
   - 如果 `LLM_PROVIDER=openai`，需要 `OPENAI_API_KEY`
   - 如果 `LLM_PROVIDER=anthropic`，需要 `ANTHROPIC_API_KEY`

3. **验证 API Key 有效性**：
   - 检查 API Key 格式是否正确
   - 验证 API Key 是否有额度
   - 测试 API Key 是否被禁用

---

### 问题 4：环境变量更新后不生效

**症状**：
- 在 Vercel 更新了 `VITE_API_URL`
- 但前端仍然使用旧值

**原因**：
Vercel 构建时会将环境变量打包进代码，更新环境变量后需要重新构建。

**修复**：

**手动重新部署**：
1. Vercel Dashboard → Deployments
2. 找到最新的部署
3. 点击 **⋯** → **Redeploy**
4. 勾选 "Use existing Build Cache" 或不勾选（重新构建更安全）
5. 点击 **Redeploy**

**或触发新的 Git push**：
```bash
git commit --allow-empty -m "Trigger Vercel rebuild"
git push
```

---

## 📋 完整配置检查清单

### Vercel 前端
- [ ] 项目已成功部署
- [ ] Root Directory 设置为 `frontend`
- [ ] Framework Preset 设置为 `Vite`
- [ ] 环境变量 `VITE_API_URL` 已添加
- [ ] 环境变量值为正确的 Render 后端 URL
- [ ] 环境变量应用于所有环境（Production、Preview、Development）
- [ ] 访问前端 URL 可以打开页面
- [ ] 浏览器控制台 `import.meta.env.VITE_API_URL` 输出正确

### Render 后端
- [ ] 服务状态显示 "Live"
- [ ] `/api/health` 返回 `"status": "healthy"`
- [ ] 环境变量 `FRONTEND_URL` 已设置
- [ ] 环境变量 `CORS_ORIGIN` 已设置
- [ ] FRONTEND_URL 和 CORS_ORIGIN 值为 Vercel 前端 URL
- [ ] URL 值无尾部斜杠，包含 `https://`
- [ ] `LLM_PROVIDER` 已设置
- [ ] 对应的 LLM API Key 已配置
- [ ] `/api/health/llm` 返回 `"status": "healthy"`

### 网络连通性
- [ ] 从浏览器可以访问后端 `/api/health`
- [ ] CORS Preflight 请求成功
- [ ] 浏览器控制台无 CORS 错误
- [ ] Network 标签显示请求到正确的后端 URL
- [ ] API 请求返回 200 状态码

### 功能验证
- [ ] 前端页面可以正常加载
- [ ] 可以输入消息
- [ ] 点击发送后无错误提示
- [ ] 收到 AI 回复
- [ ] 无 "无法连接到后端服务" 错误

---

## 🎯 快速诊断命令

```bash
# 设置您的 URL
BACKEND_URL="https://your-backend.onrender.com"
FRONTEND_URL="https://your-frontend.vercel.app"

# 1. 后端健康检查
curl -s "$BACKEND_URL/api/health" | jq '.'

# 2. LLM 服务检查
curl -s "$BACKEND_URL/api/health/llm" | jq '.'

# 3. CORS 检查
curl -i -X OPTIONS "$BACKEND_URL/api/health" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: GET" 2>&1 | grep "access-control"

# 4. 端到端测试
curl -i "$BACKEND_URL/api/health" \
  -H "Origin: $FRONTEND_URL" | head -20

# 全部通过 → 配置正确！
```

---

## 🚀 下一步

配置完成后：

1. **测试完整功能**
   - 访问 Vercel 前端
   - 发送测试消息
   - 验证 AI 回复

2. **设置自定义域名**（可选）
   - Vercel: Dashboard → Domains
   - Render: Dashboard → Custom Domains
   - 更新 CORS 配置使用新域名

3. **配置监控**
   - UptimeRobot: 监控后端健康
   - Vercel Analytics: 监控前端性能
   - Render Metrics: 监控后端资源

4. **优化性能**
   - Vercel Edge Functions（如需）
   - Render Disk 缓存
   - CDN 配置

---

**恭喜！您已完成 Vercel + Render 的完整集成！** 🎉

---

**文档版本**：v1.0
**最后更新**：2025-11-15
**适用项目**：Apologize-is-all-you-need
