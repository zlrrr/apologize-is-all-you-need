# 前端连接后端问题排查与解决指南 🔍

> **问题**：前端无法连接到 Render 后端
> **错误信息**：
> - 无法连接到后端服务，请检查服务是否运行
> - LLM服务不可用，请确认LM Studio已启动并加载模型
>
> **适用场景**：后端已在 Render 成功部署，但前端无法访问

---

## 📊 问题诊断矩阵

### 第一步：确定前端运行环境

请回答以下问题：

**问题 1：前端在哪里运行？**
- [ ] A. 本地开发环境（`npm run dev`）
- [ ] B. 已部署到 Vercel/其他平台
- [ ] C. 本地生产构建（`npm run build` + `npm run preview`）

**问题 2：后端 URL 是什么？**
- Render 服务 URL：`https://________.onrender.com`

根据您的答案，请跳转到对应部分：
- **选择 A** → [场景 1：本地开发环境](#场景-1本地开发环境)
- **选择 B** → [场景 2：前端已部署](#场景-2前端已部署到-vercel)
- **选择 C** → [场景 3：本地生产构建](#场景-3本地生产构建)

---

## 🎯 场景 1：本地开发环境

**当前配置**：
```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

**问题**：默认连接 `http://localhost:5001`，但后端在 Render 上

### 解决方案 1A：创建 .env 文件

1. **在 `frontend/` 目录创建 `.env.local` 文件**：

```bash
cd /home/user/apologize-is-all-you-need/frontend
cat > .env.local << 'EOF'
# Render 后端 URL
VITE_API_URL=https://your-service-name.onrender.com

# 示例：
# VITE_API_URL=https://apologize-backend-ctq8.onrender.com
EOF
```

⚠️ **重要**：
- 将 `your-service-name.onrender.com` 替换为您的实际 Render URL
- URL **不要**以斜杠 `/` 结尾
- 必须包含 `https://`（不是 `http://`）

2. **重启前端开发服务器**：

```bash
# 如果前端正在运行，先停止（Ctrl+C）
# 然后重新启动
npm run dev
```

3. **验证配置**：

打开浏览器控制台（F12），应该看到：
```
[API Request] https://your-service.onrender.com/api/health GET
```

### 解决方案 1B：临时环境变量（快速测试）

```bash
cd frontend

# 临时设置环境变量并启动
VITE_API_URL=https://your-service.onrender.com npm run dev
```

### 可能遇到的问题

#### 问题 1A：CORS 错误

**症状**（浏览器控制台）：
```
Access to fetch at 'https://xxx.onrender.com/api/health' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**原因**：后端没有配置允许本地前端访问

**解决方法** → 跳转到 [配置后端 CORS](#配置后端-cors-允许前端访问)

#### 问题 1B：服务休眠（免费计划）

**症状**：
```
Request timeout (30s)
Error: ETIMEDOUT
```

**原因**：Render 免费计划 15 分钟无活动会休眠，首次访问需要 30-60 秒唤醒

**解决方法**：
1. 等待 1-2 分钟后重试
2. 直接在浏览器访问后端 URL 唤醒服务：
   ```
   https://your-service.onrender.com/api/health
   ```
3. 刷新前端页面重试

---

## 🚀 场景 2：前端已部署到 Vercel

**部署位置**：
- 前端：Vercel（例如：`https://your-app.vercel.app`）
- 后端：Render（例如：`https://your-backend.onrender.com`）

### 解决方案 2A：配置 Vercel 环境变量

1. **登录 Vercel Dashboard**：
   - 访问：https://vercel.com/dashboard
   - 选择您的项目

2. **进入 Settings → Environment Variables**：

```
┌─────────────────────────────────────────────────────────┐
│ Project Settings                                        │
├─────────────────────────────────────────────────────────┤
│ General                                                 │
│ Domains                                                 │
│ Environment Variables      ← 点击这里                   │
│ Git                                                     │
└─────────────────────────────────────────────────────────┘
```

3. **添加环境变量**：

点击 **Add New** 按钮：

```
┌──────────────────────────────────────┐
│ Name:  VITE_API_URL                  │
│                                      │
│ Value: https://your-backend.onrender.com
│                                      │
│ Environment:                         │
│ ☑ Production                         │
│ ☑ Preview                            │
│ ☑ Development                        │
│                                      │
│ [Save]                               │
└──────────────────────────────────────┘
```

**填写**：
- Name: `VITE_API_URL`
- Value: `https://your-service.onrender.com`（您的 Render 后端 URL）
- Environment: 全选（Production、Preview、Development）

4. **重新部署**：

环境变量添加后，需要重新部署才能生效：

```
Deployments → 最新部署 → ⋯ → Redeploy
```

### 解决方案 2B：配置后端 CORS

**必须配置**：后端需要允许 Vercel 前端域名

1. **获取 Vercel 前端 URL**：
   ```
   https://your-app.vercel.app
   ```

2. **在 Render Dashboard 添加环境变量**：

访问：https://dashboard.render.com → 您的服务 → Settings → Environment

添加两个环境变量：

```
Key:   FRONTEND_URL
Value: https://your-app.vercel.app

Key:   CORS_ORIGIN
Value: https://your-app.vercel.app
```

⚠️ **重要**：
- URL 末尾**不要**有斜杠 `/`
- 必须是 `https://`
- 与 Vercel 的实际域名完全一致

3. **保存后自动重新部署**

Render 会自动重新部署后端应用 CORS 配置。

---

## 🔧 场景 3：本地生产构建

**当前操作**：
```bash
npm run build
npm run preview
```

### 解决方案 3：设置环境变量

**方法 A：创建 .env.production**

```bash
cd frontend
cat > .env.production << 'EOF'
VITE_API_URL=https://your-service.onrender.com
EOF
```

**方法 B：构建时指定**

```bash
cd frontend
VITE_API_URL=https://your-service.onrender.com npm run build
npm run preview
```

---

## 🛡️ 配置后端 CORS（允许前端访问）

### 检查当前 CORS 配置

后端代码（`backend/src/server.ts`）应该包含：

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL || '',
  process.env.CORS_ORIGIN || ''
].filter(origin => origin.length > 0);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

### 配置步骤

1. **确定前端 URL**：
   - 本地开发：`http://localhost:3000`（已包含）
   - Vercel 部署：`https://your-app.vercel.app`

2. **在 Render 添加环境变量**：

访问：Render Dashboard → 您的服务 → Settings → Environment

```
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

3. **保存并等待重新部署**（2-3 分钟）

### 验证 CORS 配置

在浏览器控制台运行：

```javascript
fetch('https://your-backend.onrender.com/api/health', {
  method: 'GET',
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**成功**：返回健康检查数据
**失败**：显示 CORS 错误

---

## 🔍 业界最佳实践：系统化排障流程

### Level 1: 基础连通性检查（网络层）

```bash
# 1. 检查后端是否可访问
curl -v https://your-backend.onrender.com/api/health

# 预期：HTTP 200
# 实际返回 5xx → 后端问题
# 实际返回超时 → 服务休眠或网络问题
# 实际返回 CORS → CORS 配置问题
```

### Level 2: 前端配置检查（应用层）

**检查清单**：

```bash
# 1. 检查环境变量是否生效
cd frontend
npm run dev

# 在浏览器控制台执行：
console.log(import.meta.env.VITE_API_URL)
// 应该输出：https://your-backend.onrender.com
// 如果输出 undefined 或 http://localhost:5001 → 环境变量未生效
```

**常见问题**：
- ❌ `.env` 文件未创建
- ❌ 环境变量名称错误（必须是 `VITE_API_URL`，不是 `API_URL`）
- ❌ 修改 `.env` 后未重启开发服务器
- ❌ Vite 要求环境变量必须以 `VITE_` 开头

### Level 3: 浏览器 DevTools 诊断（传输层）

**打开浏览器开发者工具**（F12）：

1. **Network 标签**：
   - 查看请求是否发出
   - 检查请求 URL 是否正确
   - 查看响应状态码

2. **Console 标签**：
   - 查看前端日志输出
   - 查看 CORS 错误
   - 查看 API 请求/响应日志

**诊断表**：

| 现象 | 原因 | 解决方法 |
|------|------|----------|
| 请求 URL 是 `localhost:5001` | 环境变量未生效 | 检查 `.env.local` 文件 |
| Status: (failed) net::ERR_FAILED | 网络无法连接 | 检查后端是否运行 |
| Status: 502 Bad Gateway | 后端服务崩溃 | 查看 Render 日志 |
| Status: (cors error) | CORS 配置错误 | 配置后端 CORS |
| Pending 很久后超时 | 服务休眠 | 等待唤醒（30-60秒）|

### Level 4: 后端日志分析（服务层）

**查看 Render 日志**：

Render Dashboard → Logs

**关键日志**：

```bash
# 正常启动
[info] Server running on port 10000
[info] LLM Provider: gemini
[info] LLM service initialized successfully

# CORS 日志（如果启用）
[info] CORS allowed origins: http://localhost:3000, https://your-app.vercel.app

# API 请求日志
[info] GET /api/health 200 23ms
```

**诊断**：
- 看不到请求日志 → 请求未到达后端（网络问题）
- 看到 403/401 → 认证问题
- 看到 500 → 后端代码错误
- 看到 OPTIONS 请求失败 → CORS preflight 失败

### Level 5: 端到端测试（集成层）

**创建测试脚本**：

```bash
# 创建 test-frontend-backend.sh
cat > test-frontend-backend.sh << 'EOF'
#!/bin/bash

BACKEND_URL="https://your-backend.onrender.com"
FRONTEND_ORIGIN="http://localhost:3000"

echo "=== 测试 1: 后端健康检查 ==="
curl -i "$BACKEND_URL/api/health"

echo -e "\n\n=== 测试 2: CORS Preflight ==="
curl -i -X OPTIONS "$BACKEND_URL/api/health" \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Access-Control-Request-Method: GET"

echo -e "\n\n=== 测试 3: 实际 API 调用 ==="
curl -i "$BACKEND_URL/api/health" \
  -H "Origin: $FRONTEND_ORIGIN"

echo -e "\n\n=== 测试 4: LLM 健康检查 ==="
curl -i "$BACKEND_URL/api/health/llm"
EOF

chmod +x test-frontend-backend.sh
./test-frontend-backend.sh
```

**预期结果**：
- 测试 1: HTTP 200 + JSON 数据
- 测试 2: HTTP 204 + `Access-Control-Allow-Origin` 头
- 测试 3: HTTP 200 + `Access-Control-Allow-Origin: http://localhost:3000`
- 测试 4: HTTP 200 + LLM 状态信息

---

## 📋 完整排障检查清单

### 前端配置
- [ ] `.env.local` 文件已创建（本地开发）
- [ ] `VITE_API_URL` 环境变量已设置
- [ ] 环境变量值是正确的 Render URL
- [ ] URL 包含 `https://` 且无尾部 `/`
- [ ] 已重启前端开发服务器
- [ ] 浏览器控制台能看到正确的 API URL

### 后端配置
- [ ] Render 服务状态显示 "Live"
- [ ] `/api/health` 端点可访问
- [ ] `FRONTEND_URL` 环境变量已设置（如果前端部署）
- [ ] `CORS_ORIGIN` 环境变量已设置（如果前端部署）
- [ ] 后端日志无错误信息

### 网络连通性
- [ ] 能直接在浏览器访问后端 URL
- [ ] CORS 预检请求成功
- [ ] 没有防火墙/代理阻止请求
- [ ] 后端未因休眠无响应

### LLM 服务（如适用）
- [ ] `LLM_PROVIDER` 环境变量已设置
- [ ] 对应的 API Key 已配置
- [ ] API Key 有效且有额度
- [ ] `/api/health/llm` 返回 healthy

---

## 🎯 快速诊断命令

在项目根目录运行：

```bash
# 一键诊断脚本
cat > diagnose.sh << 'EOF'
#!/bin/bash

echo "========================================="
echo "前后端连接诊断工具"
echo "========================================="

# 读取配置
read -p "请输入后端 URL (例如: https://xxx.onrender.com): " BACKEND_URL
read -p "前端在哪里运行? (local/vercel): " FRONTEND_ENV

echo -e "\n[1/5] 检查后端健康状态..."
HEALTH=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH" | grep -q "healthy"; then
  echo "✅ 后端运行正常"
else
  echo "❌ 后端健康检查失败"
  echo "响应: $HEALTH"
fi

echo -e "\n[2/5] 检查 LLM 服务..."
LLM_HEALTH=$(curl -s "$BACKEND_URL/api/health/llm")
if echo "$LLM_HEALTH" | grep -q "healthy"; then
  echo "✅ LLM 服务正常"
else
  echo "⚠️  LLM 服务不可用（可能是配置问题）"
  echo "响应: $LLM_HEALTH"
fi

echo -e "\n[3/5] 检查 CORS 配置..."
if [ "$FRONTEND_ENV" = "local" ]; then
  ORIGIN="http://localhost:3000"
else
  read -p "请输入 Vercel URL: " ORIGIN
fi

CORS_RESPONSE=$(curl -i -s -X OPTIONS "$BACKEND_URL/api/health" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: GET")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo "✅ CORS 配置正确"
else
  echo "❌ CORS 配置缺失"
  echo "需要在 Render 添加环境变量："
  echo "  FRONTEND_URL=$ORIGIN"
  echo "  CORS_ORIGIN=$ORIGIN"
fi

echo -e "\n[4/5] 检查前端环境变量..."
if [ -f "frontend/.env.local" ]; then
  echo "✅ .env.local 文件存在"
  echo "内容:"
  cat frontend/.env.local
else
  echo "❌ .env.local 文件不存在"
  echo "建议创建: frontend/.env.local"
  echo "内容: VITE_API_URL=$BACKEND_URL"
fi

echo -e "\n[5/5] 连接测试总结..."
echo "========================================="
echo "后端 URL: $BACKEND_URL"
echo "前端环境: $FRONTEND_ENV"
echo "前端 Origin: $ORIGIN"
echo "========================================="
echo ""
echo "建议下一步操作："
echo "1. 如果后端不健康 → 检查 Render 日志"
echo "2. 如果 CORS 失败 → 配置 FRONTEND_URL 环境变量"
echo "3. 如果 LLM 不可用 → 检查 LLM_PROVIDER 和 API Key"
echo "4. 如果环境变量缺失 → 创建 .env.local 文件"
EOF

chmod +x diagnose.sh
./diagnose.sh
```

---

## 💡 最佳实践总结

### 1. 环境变量管理

**开发环境**：
```bash
frontend/.env.local          # 本地开发（不提交 Git）
frontend/.env.production     # 生产构建默认值
frontend/.env.example        # 示例文件（提交 Git）
```

**生产环境**：
- Vercel: Dashboard → Environment Variables
- Render: Dashboard → Environment
- 使用 CI/CD secrets 管理敏感信息

### 2. CORS 配置策略

**开发环境**：允许 localhost
```typescript
origin: ['http://localhost:3000', 'http://localhost:5173']
```

**生产环境**：使用环境变量
```typescript
origin: process.env.FRONTEND_URL
```

**安全最佳实践**：
- ✅ 明确指定允许的域名（不使用 `*`）
- ✅ 使用 HTTPS（生产环境）
- ✅ 启用 credentials（如需 cookie）

### 3. 错误处理和日志

**前端**：
```typescript
// 详细的错误消息
catch (error) {
  if (error.code === 'ERR_NETWORK') {
    console.error('无法连接到后端:', API_BASE_URL);
  }
  logger.logApiError(url, error);
}
```

**后端**：
```typescript
// 请求日志
app.use(requestLogger);

// 错误处理中间件
app.use(errorHandler);
```

### 4. 健康检查和监控

**实现多层健康检查**：
- `/api/health` - 基础健康检查
- `/api/health/detailed` - 系统详情
- `/api/health/llm` - LLM 服务状态

**监控策略**：
- 前端：实时健康状态组件
- 后端：Render 内置监控 + 自定义日志
- 外部：UptimeRobot 定期 ping

---

## 🆘 仍然无法解决？

请提供以下信息以进一步诊断：

1. **前端运行环境**：
   - 本地 / Vercel / 其他

2. **浏览器控制台完整错误**：
   - 截图或复制完整错误消息

3. **Network 标签信息**：
   - 请求 URL
   - 状态码
   - 响应内容

4. **Render 后端日志**：
   - 最近 50 行日志

5. **环境变量配置**：
   - 前端 `.env.local` 内容（脱敏）
   - Render Environment Variables 列表（脱敏）

---

**立即开始排查！** 🚀

建议按照以下顺序：
1. 运行诊断脚本
2. 根据诊断结果修复配置
3. 逐项检查清单
4. 测试端到端连接

---

**文档版本**：v1.0
**最后更新**：2025-11-15
**适用项目**：Apologize-is-all-you-need
