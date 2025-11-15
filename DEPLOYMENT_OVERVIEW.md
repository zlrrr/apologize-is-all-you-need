# 部署总览 - 快速参考

本文档提供项目部署的快速参考和决策树。

---

## 🎯 推荐部署方案

```
┌──────────────────────────────────────────────┐
│          推荐架构（免费/低成本）               │
├──────────────────────────────────────────────┤
│  前端: Vercel (免费)                          │
│  后端: Render (免费)                          │
│  LLM:  Gemini API (免费tier) 或 OpenAI       │
│  成本: $0-15/月                               │
└──────────────────────────────────────────────┘
```

---

## 📚 部署文档导航

| 文档 | 用途 | 适用人群 |
|------|------|----------|
| [QUICKSTART.md](./QUICKSTART.md) | 本地开发快速上手 | 开发者（必读） |
| [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) | 后端部署到Render | 后端部署（必读） |
| [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) | 前端部署到Vercel | 前端部署（必读） |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 完整部署选项对比 | 架构决策参考 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 问题排查 | 遇到问题时查看 |

---

## 🚀 快速部署指南（30分钟）

### 第一步：本地开发测试（5分钟）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd apologize-is-all-you-need

# 2. 一键启动
./start-dev.sh

# 3. 配置LLM
cd backend
cp .env.example .env
# 编辑.env，添加你的LLM API密钥

# 4. 测试
访问 http://localhost:5173
```

### 第二步：部署后端到Render（10分钟）

详细步骤见 [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

**快速版本**：
1. 访问 [render.com](https://render.com) 并登录
2. 创建Web Service，连接GitHub仓库
3. 配置：
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. 添加环境变量（最少配置）：
   ```bash
   NODE_ENV=production
   BACKEND_PORT=10000
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=你的密钥
   JWT_SECRET=随机32位字符串
   SESSION_SECRET=随机32位字符串
   ```
5. 部署并记录URL：`https://xxx.onrender.com`

### 第三步：部署前端到Vercel（10分钟）

详细步骤见 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

**快速版本**：
1. 访问 [vercel.com](https://vercel.com) 并登录
2. Import Project，选择你的GitHub仓库
3. 配置：
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 添加环境变量：
   ```bash
   VITE_API_URL=https://xxx.onrender.com  # 你的Render后端URL
   ```
5. 部署并记录URL：`https://yyy.vercel.app`

### 第四步：配置CORS（2分钟）

在Render后端添加环境变量：
```bash
FRONTEND_URL=https://yyy.vercel.app
CORS_ORIGIN=https://yyy.vercel.app
```

重新部署后端（Render Dashboard → Manual Deploy）

### 第五步：测试（3分钟）

```bash
# 1. 访问前端
https://yyy.vercel.app

# 2. 发送测试消息
# 3. 验证功能正常

# 4. 测试健康检查
curl https://xxx.onrender.com/api/health
curl https://xxx.onrender.com/api/health/llm
```

---

## 🤖 自动化部署配置（可选，20分钟）

### GitHub Actions自动部署

#### 配置后端自动部署（Render）

1. **获取Render API Key**
   - 访问 [Render Account Settings](https://dashboard.render.com/u/settings)
   - 创建API Key

2. **获取Service ID**
   - 在Render服务URL中找到：`srv-xxxxx`

3. **配置GitHub Secrets**
   ```
   RENDER_API_KEY: 你的API Key
   RENDER_SERVICE_ID: srv-xxxxx
   RENDER_SERVICE_URL: https://xxx.onrender.com
   ```

#### 配置前端自动部署（Vercel）

1. **获取Vercel Token**
   - 访问 [Vercel Tokens](https://vercel.com/account/tokens)
   - 创建token

2. **链接项目并获取ID**
   ```bash
   cd frontend
   vercel link
   cat .vercel/project.json
   ```

3. **配置GitHub Secrets**
   ```
   VERCEL_TOKEN: 你的token
   VERCEL_ORG_ID: 从project.json获取
   VERCEL_PROJECT_ID: 从project.json获取
   BACKEND_URL: https://xxx.onrender.com
   FRONTEND_URL: https://yyy.vercel.app
   ```

#### 测试自动部署

```bash
# 推送代码到main分支
git add .
git commit -m "Test auto deployment"
git push origin main

# GitHub Actions会自动：
# 1. 检查代码质量
# 2. 构建项目
# 3. 部署到Render/Vercel
# 4. 运行部署后测试
```

---

## 🆚 部署方案对比

| 方案 | 成本 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|----------|
| **Vercel + Render**<br/>（推荐⭐） | $0/月 | 免费<br/>简单<br/>稳定 | 后端会休眠<br/>需唤醒 | 个人项目<br/>演示 |
| **Vercel + Railway** | $5/月 | 稳定<br/>无休眠 | 需付费 | 小团队<br/>生产环境 |
| **全Vercel Serverless** | $0/月 | 单一平台<br/>自动扩展 | 10秒超时<br/>LLM受限 | 仅快速LLM<br/>测试 |
| **VPS全栈** | $5-20/月 | 完全控制<br/>可用LM Studio | 需运维 | 企业内网<br/>本地LLM |
| **Docker** | 取决于托管 | 标准化<br/>可移植 | 需容器知识 | DevOps团队 |

---

## 📋 部署检查清单

### ✅ 后端部署（Render）

- [ ] Render账号已创建
- [ ] Web Service已创建
- [ ] 环境变量已配置（LLM_PROVIDER, API_KEY, JWT_SECRET等）
- [ ] 服务状态为"Live"
- [ ] `/api/health` 返回200
- [ ] `/api/health/llm` 显示LLM可用
- [ ] 日志无严重错误
- [ ] 记录后端URL

### ✅ 前端部署（Vercel）

- [ ] Vercel账号已创建
- [ ] 项目已导入
- [ ] 环境变量已配置（VITE_API_URL）
- [ ] 部署状态为"Ready"
- [ ] 网站可以访问
- [ ] 记录前端URL

### ✅ 集成配置

- [ ] 后端CORS已配置（FRONTEND_URL, CORS_ORIGIN）
- [ ] 前端可以连接后端
- [ ] 可以成功发送消息
- [ ] 认证功能正常（如启用）
- [ ] 健康状态指示器显示正常

### ✅ 自动化部署（可选）

- [ ] Render API Key已获取
- [ ] Vercel Token已获取
- [ ] GitHub Secrets已配置
- [ ] 测试推送触发自动部署
- [ ] CI/CD Pipeline正常工作

---

## 🔧 环境变量速查表

### 后端（Render）

```bash
# 必需
NODE_ENV=production
BACKEND_PORT=10000
LLM_PROVIDER=gemini|openai|anthropic
<PROVIDER>_API_KEY=你的密钥
JWT_SECRET=至少32位随机字符串
SESSION_SECRET=至少32位随机字符串

# 集成后添加
FRONTEND_URL=https://你的前端.vercel.app
CORS_ORIGIN=https://你的前端.vercel.app

# 可选
ACCESS_PASSWORD=访问密码
INVITE_CODES=CODE1,CODE2,CODE3
LOG_LEVEL=info
```

### 前端（Vercel）

```bash
# 必需
VITE_API_URL=https://你的后端.onrender.com
```

---

## 🚨 常见问题快速解决

### 错误：无法连接到服务器

```bash
# 检查后端是否运行
curl https://你的后端.onrender.com/api/health

# 如果失败：
# 1. 检查Render服务状态
# 2. 查看Render日志
# 3. 验证环境变量配置
```

### 错误：CORS错误

```bash
# 在Render后端确认配置：
FRONTEND_URL=https://你的前端.vercel.app  # 不要有尾部斜杠
CORS_ORIGIN=https://你的前端.vercel.app   # 不要有尾部斜杠

# 重新部署后端
```

### 错误：LLM服务不可用

```bash
# 检查LLM配置
curl https://你的后端.onrender.com/api/health/llm

# 验证：
# 1. LLM_PROVIDER 拼写正确
# 2. API_KEY 有效
# 3. API额度充足
# 4. 查看后端日志
```

### Render后端休眠

```bash
# 免费计划会在15分钟无活动后休眠

# 解决方案A：使用UptimeRobot
# 每5分钟ping一次保持唤醒

# 解决方案B：升级到付费计划
# Starter: $7/月，无休眠
```

---

## 📊 成本估算

### 免费方案（推荐入门）

```
前端 (Vercel):      $0/月
后端 (Render):      $0/月
LLM (Gemini Free):  $0/月
────────────────────────
总计:               $0/月

限制：
- Render后端会休眠
- Gemini免费tier有速率限制
- 适合个人项目、演示
```

### 低成本生产方案

```
前端 (Vercel):      $0/月
后端 (Render):      $7/月 (Starter)
LLM (OpenAI):       ~$5-10/月 (按使用)
────────────────────────
总计:               $12-17/月

优点：
- 后端不休眠
- 稳定可靠
- 适合小团队生产使用
```

---

## 🔗 重要链接

### 服务平台

- [Render Dashboard](https://dashboard.render.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Actions](https://github.com/你的用户名/apologize-is-all-you-need/actions)

### API密钥

- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Google AI Studio (Gemini)](https://makersuite.google.com/app/apikey)
- [Anthropic Console](https://console.anthropic.com/)

### 监控工具

- [UptimeRobot](https://uptimerobot.com) - 免费服务监控
- [Better Uptime](https://betteruptime.com) - 免费监控

---

## 📚 相关文档

- [本地开发指南](./QUICKSTART.md)
- [Render部署详细指南](./RENDER_DEPLOYMENT.md)
- [Vercel部署详细指南](./VERCEL_DEPLOYMENT.md)
- [完整部署选项](./DEPLOYMENT.md)
- [问题排查](./TROUBLESHOOTING.md)

---

**最后更新**: 2025-11-15
**总部署时间**: 约30分钟（首次完整部署）
**后续更新**: 自动（2-5分钟）
