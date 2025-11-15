# 部署指南 - Deployment Guide

本文档详细说明如何将"道歉助手"应用部署到生产环境。

---

## 📋 目录

1. [架构概述](#架构概述)
2. [Vercel部署方案（推荐）](#vercel部署方案推荐)
3. [其他部署方案](#其他部署方案)
4. [环境变量配置](#环境变量配置)
5. [部署检查清单](#部署检查清单)

---

## 🏗️ 架构概述

### 应用组件

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend  │────▶│   Backend   │────▶│  LLM Service │
│   (React)   │     │  (Node.js)  │     │  (External)  │
└─────────────┘     └─────────────┘     └──────────────┘
     Vercel          Railway/Render       OpenAI/Anthropic
                     or Serverless         /Gemini/等
```

### 关键特性

- **前端**: 静态React应用，适合CDN部署
- **后端**: Node.js Express服务，需要持续运行或Serverless
- **LLM**: 可以是本地（LM Studio）或云端API（OpenAI等）

---

## ✅ Vercel部署方案（推荐）

### 方案A：前端在Vercel + 后端在其他平台（推荐★★★★★）

**这是业界最佳实践，原因：**
- 前端静态资源使用CDN（快速、便宜）
- 后端长时间运行服务独立部署（稳定、无超时限制）
- 各组件独立扩展，互不影响

#### 步骤1：前端部署到Vercel

```bash
# 1. 连接GitHub仓库到Vercel
# 2. 在Vercel配置：
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist

# 3. 环境变量：
VITE_API_URL=https://your-backend.railway.app
```

#### 步骤2：后端部署到Railway/Render（推荐）

**Railway部署（最简单）：**

1. 访问 [Railway.app](https://railway.app)
2. 连接GitHub仓库
3. 选择 `backend` 目录
4. 添加环境变量（见下方）
5. 自动部署完成

**环境变量配置：**
```bash
# 必需
PORT=5001
NODE_ENV=production

# LLM配置（使用云端API）
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini

# 或使用Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# 认证（可选）
JWT_SECRET=your-production-secret
ACCESS_PASSWORD=your-secure-password
# INVITE_CODES=CODE1,CODE2,CODE3

# CORS（重要！）
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

**Railway部署命令：**
```json
// railway.json (在backend目录)
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

### 方案B：全部在Vercel（Serverless Functions）

**优点：**
- 单一平台管理
- 自动扩展
- 按使用付费

**缺点：**
- Serverless函数有10秒超时限制
- LLM响应可能超时
- 无状态，需要外部数据库

**适用场景：** 使用快速响应的LLM API（OpenAI Turbo、Gemini Flash等）

#### Vercel Serverless配置

需要将Express应用改造为Serverless函数：

```javascript
// api/index.js (Vercel Serverless Entry)
import express from 'express';
import chatRoutes from '../backend/src/routes/chat.routes.js';
import healthRoutes from '../backend/src/routes/health.routes.js';
import authRoutes from '../backend/src/routes/auth.routes.js';
// ... 其他imports

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);

// Export as Vercel Serverless Function
export default app;
```

**vercel.json配置：**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "LLM_PROVIDER": "@llm-provider",
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
```

**限制：**
- ⚠️ 最大执行时间：10秒（Hobby）或60秒（Pro）
- ⚠️ LLM必须快速响应
- ⚠️ 不适合本地LM Studio

---

## 🌐 其他部署方案

### 方案C：传统VPS部署（AWS/DigitalOcean/Linode）

**优点：**
- 完全控制
- 可运行本地LM Studio
- 无超时限制

**步骤：**
```bash
# 1. 准备服务器（Ubuntu 22.04）
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm nginx

# 2. 克隆代码
git clone https://github.com/your-repo/apologize-is-all-you-need.git
cd apologize-is-all-you-need

# 3. 安装依赖
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build

# 4. 使用PM2管理进程
npm install -g pm2

# 启动后端
cd backend
pm2 start dist/server.js --name apologize-backend

# 5. Nginx配置
sudo nano /etc/nginx/sites-available/apologize
```

**Nginx配置：**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### 方案D：Docker部署

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - LLM_PROVIDER=${LLM_PROVIDER}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

---

## 🔧 环境变量配置

### 前端环境变量

```bash
# .env (frontend/)
VITE_API_URL=https://your-backend-url.com
```

### 后端环境变量（生产环境）

```bash
# .env (backend/)

# Server
NODE_ENV=production
BACKEND_PORT=5001
FRONTEND_URL=https://your-frontend.vercel.app

# LLM - OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=500

# 或 LLM - Anthropic
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# 或 LLM - Gemini
# LLM_PROVIDER=gemini
# GEMINI_API_KEY=AIxxxxxxxxxxxxxxxxxxxx
# GEMINI_MODEL=gemini-1.5-flash

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ACCESS_PASSWORD=your-secure-password
# INVITE_CODES=CODE123,CODE456

# Logging
LOG_LEVEL=info

# Session
SESSION_SECRET=your-session-secret-change-this

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## ✅ 部署检查清单

### 部署前

- [ ] 所有环境变量已配置
- [ ] JWT_SECRET和SESSION_SECRET已更改为强密码
- [ ] LLM API密钥已配置
- [ ] 前端API_URL指向正确的后端地址
- [ ] CORS配置包含前端域名

### 部署后

- [ ] 前端可以访问并加载
- [ ] 健康检查端点正常：`/api/health`
- [ ] LLM健康检查正常：`/api/health/llm`
- [ ] 可以成功发送消息并获得回复
- [ ] 认证功能正常（如果启用）
- [ ] 日志记录正常
- [ ] HTTPS证书配置（生产环境必需）

### 监控

- [ ] 设置后端服务监控（UptimeRobot等）
- [ ] 配置错误告警
- [ ] 监控API响应时间
- [ ] 监控LLM API使用量和成本

---

## 🎯 推荐方案总结

### 个人项目/小团队（推荐）

```
Frontend: Vercel (免费)
Backend:  Railway (免费tier或$5/月)
LLM:      OpenAI API ($0.15/1M tokens) 或 Gemini API (免费tier)
数据库:   Railway PostgreSQL (如需要)
```

**月成本估算：**
- Vercel: $0
- Railway: $5
- OpenAI API: ~$1-10（根据使用量）
- **总计：$6-15/月**

### 企业/高流量

```
Frontend: Vercel Pro ($20/月)
Backend:  AWS ECS/Fargate 或 Railway Pro
LLM:      OpenAI API + 缓存层
CDN:      Cloudflare (免费)
监控:     Datadog/NewRelic
```

---

## 🔗 相关资源

- [Vercel部署文档](https://vercel.com/docs)
- [Railway部署文档](https://docs.railway.app)
- [OpenAI API文档](https://platform.openai.com/docs)
- [Nginx配置指南](https://nginx.org/en/docs/)

---

## 💡 常见问题

**Q: 为什么不推荐全部用Vercel Serverless？**
A: Serverless有10-60秒超时限制，LLM响应可能超时。分离部署更稳定。

**Q: 可以使用本地LM Studio部署吗？**
A: 可以，但需要VPS或家庭服务器，不能用Serverless。

**Q: 如何降低LLM API成本？**
A: 使用更便宜的模型（如GPT-4o-mini），添加响应缓存，限制token数量。

**Q: HTTPS如何配置？**
A: Vercel自动提供HTTPS。Railway也自动配置。VPS需要Let's Encrypt。

---

**最后更新**: 2025-11-15
