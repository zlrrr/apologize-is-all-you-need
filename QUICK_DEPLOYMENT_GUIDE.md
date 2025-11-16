# Vercel + Render 快速部署指南 ⚡

> **5 分钟完成前后端部署并连接**

---

## ✅ 配置检查结果

### 已修复的问题

1. **CORS 配置缺失** ✅
   - 已在 `backend/src/server.ts` 添加 `CORS_ORIGIN` 支持
   - 现在支持两种环境变量：`FRONTEND_URL` 和 `CORS_ORIGIN`

2. **Vercel 配置优化** ✅
   - 已创建 `vercel.json` 配置文件
   - 自动配置 SPA 路由和安全头

3. **调试工具完善** ✅
   - 创建远程调试脚本 `test-production.sh`
   - 详细的集成文档 `VERCEL_RENDER_INTEGRATION.md`

---

## 🚀 立即部署（5 个步骤）

### 步骤 1：部署后端到 Render（已完成 ✅）

您的后端应该已经运行。验证：

```bash
curl https://your-backend.onrender.com/api/health
```

如果返回 `{"status": "healthy", ...}` → 后端正常 ✅

---

### 步骤 2：部署前端到 Vercel（5 分钟）

#### 2.1 登录 Vercel

访问：https://vercel.com

#### 2.2 导入项目

1. Dashboard → **Add New** → **Project**
2. **Import Git Repository** → 选择 `apologize-is-all-you-need`

#### 2.3 配置项目（重要！）

```
Framework Preset:   Vite
Root Directory:     frontend          ← 必须设置！
Build Command:      npm run build
Output Directory:   dist
Install Command:    npm install
```

#### 2.4 添加环境变量（关键！）

在 **Environment Variables** 部分：

```
KEY:    VITE_API_URL
VALUE:  https://your-backend.onrender.com

Environment: ✓ Production  ✓ Preview  ✓ Development
```

⚠️ **替换为您的实际 Render 后端 URL！**

#### 2.5 部署

点击 **Deploy**，等待 2-5 分钟。

**完成后记录您的 Vercel URL**：
```
https://apologize-frontend-xxx.vercel.app
```

---

### 步骤 3：配置 Render CORS（2 分钟）

#### 3.1 打开 Render Dashboard

访问：https://dashboard.render.com

#### 3.2 添加环境变量

进入服务 → **Settings** → **Environment Variables**

**添加两个变量**：

```
Key:   FRONTEND_URL
Value: https://your-frontend.vercel.app

Key:   CORS_ORIGIN
Value: https://your-frontend.vercel.app
```

⚠️ **使用您的实际 Vercel URL！**
⚠️ **URL 末尾不要有斜杠 `/`**

#### 3.3 保存

点击 **Save Changes**，等待自动重新部署（2-3 分钟）。

---

### 步骤 4：验证配置（1 分钟）

运行测试脚本：

```bash
./test-production.sh \
  https://your-backend.onrender.com \
  https://your-frontend.vercel.app
```

**预期输出**：
```
✅ 后端连通性
✅ 后端健康检查
✅ LLM 服务
✅ CORS 配置
✅ 响应速度
```

---

### 步骤 5：测试前端（30 秒）

#### 5.1 访问 Vercel 前端

```
https://your-frontend.vercel.app
```

#### 5.2 打开浏览器控制台（F12）

**Console 标签**，执行：
```javascript
console.log(import.meta.env.VITE_API_URL)
```

**应该输出**：
```
https://your-backend.onrender.com
```

#### 5.3 测试发送消息

输入测试消息 → 点击发送 → 应该收到 AI 回复 ✅

---

## 🐛 快速排障

### 问题 1：前端显示 "无法连接到后端服务"

**检查 1**：环境变量是否生效

```javascript
// 在浏览器控制台
console.log(import.meta.env.VITE_API_URL)

// 如果输出 undefined 或 http://localhost:5001
// → 环境变量未生效
```

**修复**：
1. Vercel Dashboard → Settings → Environment Variables
2. 检查 `VITE_API_URL` 是否存在
3. 如果存在，重新部署：Deployments → ⋯ → Redeploy

**检查 2**：CORS 是否配置

```bash
curl -i -X OPTIONS https://your-backend.onrender.com/api/health \
  -H "Origin: https://your-frontend.vercel.app" \
  | grep "access-control"

# 应该看到：
# access-control-allow-origin: https://your-frontend.vercel.app
```

**修复**：
- 确认 Render 环境变量已添加
- 检查 URL 是否完全一致
- 等待 Render 重新部署完成

---

### 问题 2：CORS 错误

**浏览器控制台显示**：
```
CORS policy: No 'Access-Control-Allow-Origin' header
```

**修复**：
1. 检查 Render 环境变量 `FRONTEND_URL` 和 `CORS_ORIGIN`
2. 确保值与 Vercel URL 完全一致
3. 移除末尾斜杠
4. 保存后等待重新部署

---

### 问题 3：LLM 服务不可用

**错误信息**：
```
LLM服务不可用，请确认LM Studio已启动
```

**修复**：
1. Render → Settings → Environment
2. 检查：
   - `LLM_PROVIDER` = `gemini`（或 `openai`/`anthropic`）
   - `GEMINI_API_KEY` = 您的 API 密钥

---

## 📋 完整配置清单

### Vercel 前端
- [x] 项目已部署
- [x] Root Directory = `frontend`
- [x] 环境变量 `VITE_API_URL` 已设置
- [ ] 环境变量值为您的 Render 后端 URL
- [ ] 浏览器控制台可验证环境变量

### Render 后端
- [x] 服务状态 = Live
- [x] `/api/health` 返回 healthy
- [ ] `FRONTEND_URL` = 您的 Vercel URL
- [ ] `CORS_ORIGIN` = 您的 Vercel URL
- [ ] `LLM_PROVIDER` 已设置
- [ ] 对应的 API Key 已配置

### 功能测试
- [ ] 前端可以访问
- [ ] 控制台无 CORS 错误
- [ ] 可以发送消息
- [ ] 收到 AI 回复

---

## 🎯 需要您完成的操作

由于您已经有 Render 后端运行，现在只需：

### 必须完成（10 分钟）

1. **部署前端到 Vercel**
   - 按照步骤 2 操作
   - 重点：Root Directory 设置为 `frontend`
   - 重点：添加 `VITE_API_URL` 环境变量

2. **配置 Render CORS**
   - 按照步骤 3 操作
   - 添加 `FRONTEND_URL` 和 `CORS_ORIGIN`
   - 值为您的 Vercel 前端 URL

3. **验证配置**
   - 运行 `./test-production.sh`
   - 访问 Vercel 前端测试功能

### 可选完成（稍后）

4. **设置自定义域名**
   - Vercel: Settings → Domains
   - Render: Settings → Custom Domains

5. **配置监控**
   - UptimeRobot 监控后端
   - Vercel Analytics 监控前端

---

## 📚 详细文档

需要更详细的说明，请查看：

- **完整集成指南**：`VERCEL_RENDER_INTEGRATION.md`
- **前端连接排障**：`FRONTEND_BACKEND_CONNECTION_GUIDE.md`
- **Render 配置**：`RENDER_FIRST_TIME_SETUP.md`
- **CI/CD 配置**：`CICD_SETUP_GUIDE.md`

---

## 🆘 需要帮助？

运行远程诊断：

```bash
./test-production.sh \
  https://your-backend-url.onrender.com \
  https://your-frontend-url.vercel.app
```

将输出结果发送给我，我会帮您分析问题。

---

**立即开始部署！** 🚀

1. 访问 https://vercel.com
2. 导入您的 GitHub 仓库
3. 按照上述配置操作
4. 10 分钟后完成部署！

---

**文档版本**：v1.0
**最后更新**：2025-11-15
