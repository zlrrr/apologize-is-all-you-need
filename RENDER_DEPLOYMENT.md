# Render部署完整指南

本指南详细说明如何将"道歉助手"后端部署到Render免费计划。

---

## 📋 目录

1. [Render免费计划说明](#render免费计划说明)
2. [部署步骤](#部署步骤)
3. [自动化部署配置](#自动化部署配置)
4. [环境变量配置](#环境变量配置)
5. [常见问题](#常见问题)

---

## 🆓 Render免费计划说明

### 免费计划特性

✅ **优点**：
- 750小时/月免费使用时间
- 自动HTTPS证书
- 自动部署（git push触发）
- 支持环境变量
- 健康检查和日志
- 0成本开始

⚠️ **限制**：
- **15分钟无活动后自动休眠**
- 休眠后首次访问需要等待30-60秒唤醒
- 512MB内存
- 0.1 CPU
- 不支持自定义域名（免费计划）

💡 **适用场景**：
- 个人项目
- 低流量应用
- 演示/测试环境
- 开发阶段

---

## 🚀 部署步骤

### 方法1：通过Render Dashboard（最简单，推荐）

#### 步骤1：创建Render账号

1. 访问 [render.com](https://render.com)
2. 使用GitHub账号登录
3. 授权Render访问你的GitHub仓库

#### 步骤2：创建新的Web Service

1. 点击 **"New +"** → **"Web Service"**
2. 选择你的GitHub仓库：`apologize-is-all-you-need`
3. 配置如下：

```yaml
Name: apologize-backend
Region: Oregon (或离你最近的)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
Plan: Free
```

#### 步骤3：配置环境变量

在Environment变量区域添加以下配置：

**必需的环境变量**：

```bash
# 服务器配置
NODE_ENV=production
BACKEND_PORT=10000  # Render使用这个端口

# LLM配置（选择一个）
LLM_PROVIDER=gemini
GEMINI_API_KEY=你的Gemini密钥
GEMINI_MODEL=gemini-1.5-flash

# 或使用OpenAI
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk-你的密钥
# OPENAI_MODEL=gpt-4o-mini

# 安全配置
JWT_SECRET=至少32位的随机字符串
SESSION_SECRET=至少32位的随机字符串

# 日志
LOG_LEVEL=info
```

**可选的环境变量**：

```bash
# 认证（如果需要）
ACCESS_PASSWORD=你的访问密码
# INVITE_CODES=CODE1,CODE2,CODE3

# CORS（前端部署后添加）
# FRONTEND_URL=https://你的前端.vercel.app
# CORS_ORIGIN=https://你的前端.vercel.app
```

#### 步骤4：部署

1. 点击 **"Create Web Service"**
2. Render会自动：
   - 拉取代码
   - 安装依赖
   - 构建应用
   - 启动服务
3. 等待3-5分钟完成部署
4. 记录服务URL（格式：`https://apologize-backend-xxxx.onrender.com`）

#### 步骤5：测试部署

```bash
# 替换为你的Render URL
RENDER_URL=https://apologize-backend-xxxx.onrender.com

# 测试健康检查
curl $RENDER_URL/api/health

# 测试LLM健康
curl $RENDER_URL/api/health/llm

# 测试认证状态
curl $RENDER_URL/api/auth/status
```

---

### 方法2：使用render.yaml自动化（高级）

#### 步骤1：使用Blueprint

1. 访问 [render.com/dashboard](https://dashboard.render.com)
2. 点击 **"New +"** → **"Blueprint"**
3. 选择你的GitHub仓库
4. Render会自动检测 `render.yaml` 文件
5. 点击 **"Apply"**

#### 步骤2：配置环境变量

在Render Dashboard中设置敏感环境变量（`sync: false`的那些）：

- `LLM_PROVIDER`
- `OPENAI_API_KEY` 或 `GEMINI_API_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGIN`

---

## 🤖 自动化部署配置（CI/CD）

### GitHub Actions自动部署

#### 步骤1：获取Render API Key

1. 访问 [Render Account Settings](https://dashboard.render.com/u/settings)
2. 滚动到 **"API Keys"**
3. 点击 **"Create API Key"**
4. 复制密钥（只显示一次）

#### 步骤2：获取Service ID

1. 进入你的Web Service
2. 在浏览器地址栏找到URL：
   ```
   https://dashboard.render.com/web/srv-xxxxxxxxxxxxxx
                                      ^^^^^^^^^^^^^^^^
                                      这就是Service ID
   ```

#### 步骤3：配置GitHub Secrets

在GitHub仓库中设置Secrets：

1. 进入仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **"New repository secret"**
3. 添加以下secrets：

```yaml
# 必需的Secrets
RENDER_API_KEY: 你的Render API Key
RENDER_SERVICE_ID: srv-xxxxxxxxxxxxxx
RENDER_SERVICE_URL: https://你的服务.onrender.com

# 可选（如果要部署到多个环境）
RENDER_SERVICE_ID_STAGING: srv-yyyyyyyyyyyyyy
```

#### 步骤4：启用自动部署

配置已经创建在 `.github/workflows/deploy-render.yml`

**自动触发条件**：
- ✅ 推送到 `main` 分支（后端代码变更时）
- ✅ 手动触发（在Actions页面）
- ✅ Pull Request时运行检查（不部署）

**工作流程**：
```
1. 代码检查 (TypeScript编译、测试)
   ↓
2. 部署到Render
   ↓
3. 健康检查
   ↓
4. 部署后测试
```

---

## 🔧 环境变量详细说明

### 必需配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `BACKEND_PORT` | 端口（Render固定） | `10000` |
| `LLM_PROVIDER` | LLM提供商 | `gemini` / `openai` / `anthropic` |
| `*_API_KEY` | 对应LLM的API密钥 | `AIxxxxx` / `sk-xxxxx` |
| `JWT_SECRET` | JWT密钥（>=32字符） | 随机字符串 |
| `SESSION_SECRET` | Session密钥 | 随机字符串 |

### 可选配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `ACCESS_PASSWORD` | 访问密码（启用认证） | 空（禁用认证） |
| `INVITE_CODES` | 邀请码列表（逗号分隔） | 空 |
| `FRONTEND_URL` | 前端URL（CORS） | 空 |
| `CORS_ORIGIN` | 允许的源 | 空 |
| `LOG_LEVEL` | 日志级别 | `info` |
| `LLM_TEMPERATURE` | LLM温度参数 | `0.7` |
| `LLM_MAX_TOKENS` | 最大token数 | `500` |

---

## 📊 自动化vs手动操作对照表

| 步骤 | 手动操作 | 自动化 | 说明 |
|------|----------|--------|------|
| **初次部署** | ✋ 必需 | ❌ | 在Render创建服务 |
| **环境变量配置** | ✋ 必需 | ❌ | 敏感信息手动设置 |
| **获取API Keys** | ✋ 必需 | ❌ | Render/GitHub API密钥 |
| **配置GitHub Secrets** | ✋ 必需 | ❌ | 一次性设置 |
| **代码变更部署** | ❌ | ✅ 自动 | Push到main触发 |
| **代码检查** | ❌ | ✅ 自动 | TypeScript/测试 |
| **健康检查** | ❌ | ✅ 自动 | 部署后自动验证 |
| **回滚** | ✋ 手动 | ✅ 可选 | Render Dashboard或Git revert |

---

## 🎯 完整部署流程（首次）

### 第一次部署（约15分钟）

```bash
# 1️⃣ 准备工作（5分钟）
- [ ] 注册Render账号
- [ ] 获取LLM API密钥（Gemini/OpenAI）
- [ ] 生成JWT_SECRET（可用: openssl rand -base64 32）
- [ ] 生成SESSION_SECRET

# 2️⃣ Render配置（5分钟）
- [ ] 在Render创建Web Service
- [ ] 连接GitHub仓库
- [ ] 配置环境变量
- [ ] 启动部署

# 3️⃣ 等待部署完成（3-5分钟）
- [ ] 查看构建日志
- [ ] 等待服务启动

# 4️⃣ 测试验证（2分钟）
- [ ] 测试 /api/health
- [ ] 测试 /api/health/llm
- [ ] 记录后端URL

# 5️⃣ 配置自动部署（可选，5分钟）
- [ ] 获取Render API Key
- [ ] 配置GitHub Secrets
- [ ] 测试自动部署
```

### 后续部署（自动，无需操作）

```bash
# 开发者工作流
git add .
git commit -m "Update backend code"
git push origin main

# GitHub Actions自动执行：
# 1. 代码检查 ✅
# 2. 触发Render部署 🚀
# 3. 健康检查 ✅
# 4. 发送通知 📧

# 3-5分钟后新版本上线 🎉
```

---

## ❓ 常见问题

### Q1: 服务总是休眠怎么办？

**问题**：免费计划15分钟无活动会休眠

**解决方案**：

**选项A：使用Keep-alive服务（推荐）**
```bash
# 使用UptimeRobot等服务每5分钟ping一次
# 免费账号可监控50个服务
https://uptimerobot.com
```

**选项B：定时任务**
```yaml
# .github/workflows/keep-alive.yml
name: Keep Render Alive
on:
  schedule:
    - cron: '*/10 * * * *'  # 每10分钟
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl ${{ secrets.RENDER_SERVICE_URL }}/api/health
```

**选项C：升级到付费计划**
- Starter Plan: $7/月
- 无休眠限制

### Q2: 部署失败怎么办？

**检查步骤**：

1. **查看构建日志**：
   - Render Dashboard → 你的服务 → Logs

2. **常见错误**：
   ```bash
   # 依赖安装失败
   → 检查package.json是否正确

   # 构建失败
   → 检查TypeScript是否有错误

   # 启动失败
   → 检查环境变量是否配置
   → 检查端口是否使用10000
   ```

3. **测试本地构建**：
   ```bash
   cd backend
   npm install
   npm run build
   npm start
   ```

### Q3: LLM服务不可用

**检查**：
```bash
# 测试LLM健康
curl https://你的服务.onrender.com/api/health/llm

# 查看日志
# Render Dashboard → Logs → 搜索 "LLM"
```

**常见原因**：
- ❌ API密钥未配置或错误
- ❌ LLM_PROVIDER配置错误
- ❌ API额度用完
- ❌ API密钥权限不足

**解决**：
1. 检查环境变量拼写
2. 验证API密钥有效性
3. 查看LLM服务状态页面

### Q4: CORS错误

**问题**：前端无法访问后端API

**解决**：
```bash
# 在Render添加环境变量
FRONTEND_URL=https://你的前端.vercel.app
CORS_ORIGIN=https://你的前端.vercel.app

# 或允许所有源（仅开发）
CORS_ORIGIN=*
```

### Q5: 如何查看日志？

**实时日志**：
```bash
# Render Dashboard → 你的服务 → Logs
# 或使用CLI
render logs -f
```

**日志文件**：
- 位置：`backend/logs/`
- ⚠️ Render重启后日志会丢失（临时文件系统）
- 建议：使用外部日志服务（Logtail、Papertrail等）

### Q6: 如何回滚部署？

**方法1：Render Dashboard**
```
Services → 你的服务 → Deploys → 选择旧版本 → Redeploy
```

**方法2：Git回滚**
```bash
git revert HEAD
git push origin main
# GitHub Actions自动部署旧版本
```

### Q7: 如何扩展到多个环境？

**配置多环境**：

```yaml
# 创建多个服务
production: apologize-backend
staging: apologize-backend-staging
development: apologize-backend-dev

# 配置不同的环境变量
# 使用不同的GitHub分支触发
```

---

## 📈 监控和维护

### 推荐监控工具

1. **Uptime Monitoring**：
   - [UptimeRobot](https://uptimerobot.com) - 免费，50个监控
   - [Better Uptime](https://betteruptime.com) - 免费，10个监控

2. **日志管理**：
   - [Logtail](https://logtail.com) - 免费tier
   - [Papertrail](https://papertrailapp.com) - 免费100MB/月

3. **错误追踪**：
   - [Sentry](https://sentry.io) - 免费5K错误/月
   - [Rollbar](https://rollbar.com) - 免费5K错误/月

### 设置监控

```bash
# 1. 注册UptimeRobot
# 2. 添加监控：
URL: https://你的服务.onrender.com/api/health
Interval: 5分钟
Alert Contacts: 你的邮箱

# 3. 设置告警：
- 服务下线通知
- 响应时间过慢通知
```

---

## 🔗 相关资源

- [Render官方文档](https://render.com/docs)
- [Render Blueprint规范](https://render.com/docs/blueprint-spec)
- [Render API文档](https://api-docs.render.com)
- [GitHub Actions文档](https://docs.github.com/en/actions)

---

## 📝 检查清单

### 部署前

- [ ] Render账号已创建
- [ ] GitHub仓库已连接
- [ ] LLM API密钥已获取
- [ ] JWT_SECRET已生成
- [ ] 环境变量已准备

### 部署后

- [ ] 服务状态为 "Live"
- [ ] `/api/health` 返回200
- [ ] `/api/health/llm` LLM可用
- [ ] 日志无错误
- [ ] 前端可以连接后端

### 自动化配置（可选）

- [ ] Render API Key已获取
- [ ] Service ID已记录
- [ ] GitHub Secrets已配置
- [ ] 测试推送触发部署
- [ ] 设置监控告警

---

**最后更新**: 2025-11-15
**预计部署时间**: 15-20分钟（首次）
**后续部署**: 自动（3-5分钟）
