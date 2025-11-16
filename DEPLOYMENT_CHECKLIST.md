# Render部署检查清单 ✅

这是一个分步骤的部署检查清单，明确标注哪些需要人工操作，哪些会自动执行。

---

## 📊 自动化程度总览

```
总步骤: 20个
├─ 🔧 人工操作（一次性）: 8个 (40%)
├─ ⚙️  配置后自动化: 10个 (50%)
└─ ✅ 完全自动: 2个 (10%)
```

---

## 第一阶段：初次部署（需人工操作）

### ✋ 步骤1：准备LLM API密钥（人工，5分钟）

**必需操作**：
```bash
# 选择一个LLM提供商并获取API密钥

选项A：Google Gemini（推荐，有免费tier）
→ 访问 https://makersuite.google.com/app/apikey
→ 创建API密钥
→ 记录: GEMINI_API_KEY=AIxxxxx

选项B：OpenAI
→ 访问 https://platform.openai.com/api-keys
→ 创建API密钥（需要信用卡）
→ 记录: OPENAI_API_KEY=sk-xxxxx

选项C：Anthropic Claude
→ 访问 https://console.anthropic.com/
→ 创建API密钥
→ 记录: ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**为什么需要人工**：涉及第三方账号注册和付费信息

---

### ✋ 步骤2：生成安全密钥（人工，2分钟）

**必需操作**：
```bash
# 生成JWT_SECRET（至少32位）
openssl rand -base64 32
# 或在线生成：https://randomkeygen.com/

# 生成SESSION_SECRET
openssl rand -base64 32

# 记录这两个值，后面配置时使用
```

**为什么需要人工**：安全密钥必须保密且唯一

---

### ✋ 步骤3：创建Render账号（人工，3分钟）

**必需操作**：
1. 访问 [render.com](https://render.com)
2. 点击 "Get Started for Free"
3. 使用GitHub账号登录
4. 授权Render访问你的GitHub仓库

**为什么需要人工**：需要授权和选择仓库

---

### ✋ 步骤4：创建Render Web Service（人工，5分钟）

**必需操作**：

**4.1 创建服务**
```
Render Dashboard → New + → Web Service
→ 选择你的GitHub仓库
→ 点击 "Connect"
```

**4.2 配置服务**
```yaml
Name: apologize-backend
Region: Oregon (或选择离你最近的)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
Plan: Free
```

**4.3 高级设置（展开 "Advanced"）**
```
Auto-Deploy: Yes
Health Check Path: /api/health
```

**为什么需要人工**：需要选择配置选项

---

### ✋ 步骤5：配置环境变量（人工，5分钟）

**必需操作**：

在Render Dashboard中，滚动到 "Environment Variables" 区域，逐个添加：

```bash
# 基础配置
NODE_ENV = production
BACKEND_PORT = 10000
LOG_LEVEL = info

# LLM配置（根据你选择的提供商）
# === 如果用Gemini ===
LLM_PROVIDER = gemini
GEMINI_API_KEY = [粘贴步骤1中的密钥]
GEMINI_MODEL = gemini-1.5-flash

# === 或如果用OpenAI ===
# LLM_PROVIDER = openai
# OPENAI_API_KEY = [粘贴步骤1中的密钥]
# OPENAI_MODEL = gpt-4o-mini

# === 或如果用Anthropic ===
# LLM_PROVIDER = anthropic
# ANTHROPIC_API_KEY = [粘贴步骤1中的密钥]
# ANTHROPIC_MODEL = claude-3-5-sonnet-20241022

# 安全配置（使用步骤2生成的密钥）
JWT_SECRET = [粘贴生成的JWT_SECRET]
SESSION_SECRET = [粘贴生成的SESSION_SECRET]

# 可选：启用访问认证
# ACCESS_PASSWORD = 你设置的密码
# INVITE_CODES = CODE1,CODE2,CODE3
```

**提示**：点击每个变量旁边的 🔒 图标可以隐藏敏感值

**为什么需要人工**：涉及敏感信息配置

---

### ⚙️ 步骤6：部署后端（自动，3-5分钟）

**自动执行**：
- ✅ Render自动拉取代码
- ✅ 运行 `npm install && npm run build`
- ✅ 启动服务 `npm start`
- ✅ 分配URL：`https://apologize-backend-xxxx.onrender.com`

**你的操作**：
```bash
# 等待部署完成（观察日志）
# 状态从 "Building" → "Live"

# 记录后端URL（后面前端需要用）
BACKEND_URL=https://apologize-backend-xxxx.onrender.com
```

**为什么自动化**：配置完成后，Render自动执行

---

### ✅ 步骤7：测试后端（自动化脚本，1分钟）

**自动执行**：
```bash
# 测试健康检查
curl https://你的后端.onrender.com/api/health

# 测试LLM连接
curl https://你的后端.onrender.com/api/health/llm

# 预期输出：
# {"status":"healthy",...}
```

**如果测试失败**：
1. 检查Render Dashboard中的日志
2. 验证环境变量配置
3. 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

### ✋ 步骤8：创建Vercel账号（人工，2分钟）

**必需操作**：
1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 授权Vercel访问你的仓库

**为什么需要人工**：需要授权

---

### ✋ 步骤9：导入前端项目（人工，5分钟）

**必需操作**：

**9.1 导入项目**
```
Vercel Dashboard → Add New... → Project
→ 选择你的GitHub仓库
→ 点击 "Import"
```

**9.2 配置项目**
```yaml
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**9.3 配置环境变量**
```bash
# 在 "Environment Variables" 区域添加
VITE_API_URL = [粘贴步骤6记录的BACKEND_URL]

# 例如：
# VITE_API_URL = https://apologize-backend-xxxx.onrender.com
```

**注意**：
- ⚠️ 不要有尾部斜杠
- ⚠️ 必须以 `VITE_` 开头

**为什么需要人工**：需要配置选项

---

### ⚙️ 步骤10：部署前端（自动，2-3分钟）

**自动执行**：
- ✅ Vercel自动拉取代码
- ✅ 运行 `npm install && npm run build`
- ✅ 部署到CDN
- ✅ 分配URL：`https://your-app-xxxx.vercel.app`

**你的操作**：
```bash
# 等待部署完成
# 状态从 "Building" → "Ready"

# 记录前端URL
FRONTEND_URL=https://your-app-xxxx.vercel.app
```

---

### ✋ 步骤11：配置CORS（人工，2分钟）

**必需操作**：

回到Render Dashboard，在后端服务的环境变量中添加：

```bash
FRONTEND_URL = [粘贴步骤10的FRONTEND_URL]
CORS_ORIGIN = [粘贴步骤10的FRONTEND_URL]

# 例如：
# FRONTEND_URL = https://your-app-xxxx.vercel.app
# CORS_ORIGIN = https://your-app-xxxx.vercel.app
```

**然后重新部署**：
```
Render Dashboard → Manual Deploy → Deploy latest commit
```

**为什么需要人工**：需要前端URL才能配置

---

### ✅ 步骤12：测试完整应用（手动验证，2分钟）

**验证清单**：
```bash
✅ 访问前端：https://your-app.vercel.app
✅ 页面正常加载
✅ 健康状态指示器显示绿色
✅ 发送测试消息
✅ 收到AI回复
✅ 浏览器控制台无错误
```

**如果有错误**：
- CORS错误 → 检查步骤11的配置
- 连接失败 → 检查VITE_API_URL配置
- LLM错误 → 检查步骤5的LLM配置

---

## 第二阶段：配置自动化部署（可选）

### ✋ 步骤13：获取Render API Key（人工，2分钟）

**必需操作**：
```
1. Render Dashboard → Account Settings
2. 滚动到 "API Keys"
3. 点击 "Create API Key"
4. 命名：github-actions
5. 复制密钥（只显示一次！）
6. 保存到安全的地方
```

---

### ✋ 步骤14：获取Render Service ID（人工，1分钟）

**必需操作**：
```
1. 进入你的后端服务
2. 查看浏览器地址栏：
   https://dashboard.render.com/web/srv-xxxxxxxxxxxxxx
                                      ^^^^^^^^^^^^^^^^
                                      这就是Service ID
3. 复制Service ID
```

---

### ✋ 步骤15：配置GitHub Secrets（人工，3分钟）

**必需操作**：
```
1. GitHub仓库 → Settings
2. Secrets and variables → Actions
3. 点击 "New repository secret"
4. 逐个添加以下secrets：

Name: RENDER_API_KEY
Value: [粘贴步骤13的API Key]

Name: RENDER_SERVICE_ID
Value: srv-xxxxxxxxxxxxxx

Name: RENDER_SERVICE_URL
Value: https://apologize-backend-xxxx.onrender.com

Name: BACKEND_URL
Value: https://apologize-backend-xxxx.onrender.com
```

---

### ✋ 步骤16：获取Vercel Token（人工，2分钟）

**必需操作**：
```
1. Vercel Dashboard → Settings → Tokens
2. 点击 "Create Token"
3. 命名：github-actions
4. Scope: Full Account
5. Expiration: No Expiration
6. 复制token（只显示一次！）
```

---

### ✋ 步骤17：获取Vercel项目信息（人工，2分钟）

**必需操作**：
```bash
# 在本地项目目录
cd frontend
vercel link

# 按提示操作：
# Set up "~/frontend"? [Y/n] y
# Which scope? 选择你的账号
# Link to existing project? [Y/n] y
# What's the name of your existing project? 选择项目

# 查看项目信息
cat .vercel/project.json

# 复制 orgId 和 projectId
```

---

### ✋ 步骤18：配置Vercel Secrets（人工，3分钟）

**必需操作**：
```
GitHub仓库 → Settings → Secrets and variables → Actions

添加以下secrets：

Name: VERCEL_TOKEN
Value: [粘贴步骤16的token]

Name: VERCEL_ORG_ID
Value: [从.vercel/project.json复制]

Name: VERCEL_PROJECT_ID
Value: [从.vercel/project.json复制]

Name: FRONTEND_URL
Value: https://your-app.vercel.app
```

---

### ✅ 步骤19：测试自动部署（自动，3-5分钟）

**自动执行**：
```bash
# 推送代码到main分支
git add .
git commit -m "Test auto deployment"
git push origin main

# GitHub Actions会自动：
# 1. ✅ 运行代码检查（TypeScript编译、测试）
# 2. ✅ 触发Render后端部署
# 3. ✅ 构建和部署Vercel前端
# 4. ✅ 运行健康检查
# 5. ✅ 运行Lighthouse性能测试
# 6. ✅ 发送部署通知
```

**查看进度**：
```
GitHub仓库 → Actions标签
→ 查看最新workflow运行状态
```

---

### ✅ 步骤20：享受自动化！（完全自动）

**从现在开始，每次推送代码**：
```bash
git add .
git commit -m "Update feature"
git push origin main

# 3-5分钟后：
# ✅ 新版本自动上线
# ✅ 自动测试验证
# ✅ 失败自动通知
```

**Pull Request时**：
```bash
# 创建PR后自动：
# ✅ 运行所有检查
# ✅ 创建预览部署
# ✅ 在PR中显示预览URL
# ✅ 合并后自动部署到生产环境
```

---

## 📊 时间估算

| 阶段 | 步骤 | 时间 | 类型 |
|------|------|------|------|
| **准备工作** | 1-2 | 7分钟 | 人工一次性 |
| **后端部署** | 3-7 | 20分钟 | 人工+自动 |
| **前端部署** | 8-12 | 15分钟 | 人工+自动 |
| **自动化配置** | 13-18 | 15分钟 | 人工一次性（可选） |
| **测试验证** | 19-20 | 5分钟 | 自动 |
| **总计（首次）** | | **60分钟** | |
| **后续部署** | | **3-5分钟** | 完全自动 |

---

## 🎯 操作类型统计

### 人工操作（一次性设置）
- ✋ 获取API密钥
- ✋ 创建账号
- ✋ 配置服务
- ✋ 设置环境变量
- ✋ 配置GitHub Secrets
- ✋ 链接项目

**总计**: 8个步骤，约40分钟

### 配置后自动化
- ⚙️ 代码构建
- ⚙️ 服务部署
- ⚙️ 健康检查
- ⚙️ 性能测试
- ⚙️ 部署通知

**总计**: 10个步骤，配置后完全自动

### 完全自动
- ✅ 持续部署
- ✅ 自动测试

**总计**: 2个步骤，无需人工干预

---

## ✅ 快速验证清单

部署完成后，确认以下各项：

### 后端验证
```bash
- [ ] https://你的后端.onrender.com/api/health 返回 200
- [ ] https://你的后端.onrender.com/api/health/llm 显示LLM可用
- [ ] Render Dashboard显示服务状态为 "Live"
- [ ] 日志中无严重错误
```

### 前端验证
```bash
- [ ] https://你的前端.vercel.app 可以访问
- [ ] 页面正常加载，无白屏
- [ ] 健康状态指示器显示绿色
- [ ] 可以发送消息并收到回复
- [ ] 浏览器控制台无CORS错误
```

### 自动化验证（如果配置）
```bash
- [ ] GitHub Actions成功运行
- [ ] Push到main触发自动部署
- [ ] PR创建预览部署
- [ ] 部署后测试通过
```

---

## 🆘 遇到问题？

1. **查看错误日志**
   - Render: Dashboard → Logs
   - Vercel: Deployment → Logs
   - GitHub: Actions → 失败的workflow

2. **常见问题排查**
   - 参考 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
   - 检查环境变量拼写
   - 验证API密钥有效性

3. **获取帮助**
   - 查看详细文档：[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
   - 提交Issue到GitHub仓库

---

**恭喜！🎉 你已经完成了部署配置！**

现在你可以：
- ✅ 向朋友分享你的应用URL
- ✅ 专注于功能开发，部署自动化
- ✅ 每次推送代码，3-5分钟后自动上线

---

**最后更新**: 2025-11-15
