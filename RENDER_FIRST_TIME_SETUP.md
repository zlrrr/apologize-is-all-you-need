# Render 首次配置详细指南 🎯

> **适用对象**：从未使用过 Render 的用户
> **前置条件**：已创建 Render 账号和 Web Service
> **预计耗时**：15-20 分钟

---

## 📍 您现在的位置

✅ Render 账号已创建
✅ Web Service 已创建
⏳ **正在进行**：配置环境变量
⬜ 等待部署完成
⬜ 测试服务

---

## 🔑 第一步：使用生成的密钥

您已经运行了 `generate-secrets.sh`，获得了两个密钥：

```bash
JWT_SECRET: +4I3yEvrJt8f8m1u21i931C93R6sROqHhi3maq8bLTs=
SESSION_SECRET: 8mqMSfT7cPbNHoMzZ4UrAOKN1xBlzGTd1qhGgsQOIIc=
```

**这两个密钥的作用**：
- `JWT_SECRET`：用于加密用户身份验证令牌（JWT tokens）
- `SESSION_SECRET`：用于加密会话数据

**重要提示**：
- ⚠️ 这些是 **敏感信息**，请妥善保管
- ⚠️ 不要提交到 Git 或公开分享
- ⚠️ 每个项目应该使用 **不同的** 密钥

> 💡 如果您关闭了终端窗口，这些密钥已保存在 `.env.secrets` 文件中

---

## 🖥️ 第二步：打开 Render Dashboard

### 2.1 登录 Render

1. 访问：https://dashboard.render.com
2. 登录您的账号

### 2.2 找到您的 Web Service

登录后，您会看到类似这样的界面：

```
┌─────────────────────────────────────────────────────────┐
│  Render Dashboard                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Services                                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 📦 apologize-backend                              │ │
│  │ Web Service • Free                                │ │
│  │ Status: Building... 🔨                           │ │
│  │ Created: Just now                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**点击您的服务名称**（例如：`apologize-backend`）进入服务详情页

---

## ⚙️ 第三步：配置环境变量（核心步骤）

进入服务详情页后，您会看到左侧菜单或页面标签：

```
┌──────────────────────────────────────────┐
│ ← Back to Dashboard                      │
├──────────────────────────────────────────┤
│ apologize-backend                        │
│ Web Service                              │
├──────────────────────────────────────────┤
│ 📊 Metrics                               │
│ 📜 Logs                                  │
│ ⚙️  Settings          ← 点击这里！       │
│ 🔄 Deploys                               │
│ 🌐 Custom Domains                        │
└──────────────────────────────────────────┘
```

### 3.1 进入 Settings（设置）

1. 点击左侧菜单的 **⚙️ Settings** 或页面顶部的 **Settings** 标签

### 3.2 找到 Environment（环境变量）部分

向下滚动页面，找到 **Environment** 或 **Environment Variables** 部分：

```
┌─────────────────────────────────────────────────────────┐
│ Settings                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ▼ Environment                                          │
│                                                         │
│   Environment Variables                                │
│   ┌─────────────────────────────────────────────────┐ │
│   │ No environment variables set                    │ │
│   │                                                 │ │
│   │ [+ Add Environment Variable]    ← 点击这个按钮  │ │
│   └─────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 添加环境变量

点击 **[+ Add Environment Variable]** 按钮后，会出现输入框：

```
┌────────────────────────────────────────┐
│ Key:   [________________]              │
│ Value: [________________]              │
│        [Add]  [Cancel]                 │
└────────────────────────────────────────┘
```

---

## 📝 第四步：逐个添加环境变量

### 必需变量（共 6 个）

#### 变量 1：NODE_ENV

```
Key:   NODE_ENV
Value: production
```

**说明**：告诉 Node.js 这是生产环境

---

#### 变量 2：BACKEND_PORT

```
Key:   BACKEND_PORT
Value: 10000
```

**说明**：Render 要求使用端口 10000

⚠️ **重要**：必须是 `10000`，不能改成其他值

---

#### 变量 3：LLM_PROVIDER

```
Key:   LLM_PROVIDER
Value: gemini
```

**说明**：您使用的 LLM 服务提供商

**可选值**：
- `gemini` - Google Gemini（推荐，有免费额度）
- `openai` - OpenAI GPT
- `anthropic` - Anthropic Claude

> 💡 如果您还没有 LLM API 密钥，推荐使用 Gemini：
> 访问 https://makersuite.google.com/app/apikey 免费获取

---

#### 变量 4：GEMINI_API_KEY（或其他 LLM 密钥）

**如果您选择 Gemini**：
```
Key:   GEMINI_API_KEY
Value: [您的 Gemini API 密钥]
```

**如果您选择 OpenAI**：
```
Key:   OPENAI_API_KEY
Value: [您的 OpenAI API 密钥]
```

**如果您选择 Anthropic**：
```
Key:   ANTHROPIC_API_KEY
Value: [您的 Anthropic API 密钥]
```

**说明**：LLM 服务的 API 密钥，用于调用 AI 模型

---

#### 变量 5：JWT_SECRET

```
Key:   JWT_SECRET
Value: +4I3yEvrJt8f8m1u21i931C93R6sROqHhi3maq8bLTs=
```

**说明**：使用 `generate-secrets.sh` 生成的第一个密钥

⚠️ **重要**：直接复制粘贴您生成的完整密钥，包括末尾的 `=`

---

#### 变量 6：SESSION_SECRET

```
Key:   SESSION_SECRET
Value: 8mqMSfT7cPbNHoMzZ4UrAOKN1xBlzGTd1qhGgsQOIIc=
```

**说明**：使用 `generate-secrets.sh` 生成的第二个密钥

⚠️ **重要**：直接复制粘贴您生成的完整密钥，包括末尾的 `=`

---

### 添加完毕后的界面

完成后，您应该看到类似这样的列表：

```
┌─────────────────────────────────────────────────────────┐
│ Environment Variables                                   │
├─────────────────────────────────────────────────────────┤
│ NODE_ENV            production                    [🗑️]  │
│ BACKEND_PORT        10000                         [🗑️]  │
│ LLM_PROVIDER        gemini                        [🗑️]  │
│ GEMINI_API_KEY      AIzaSy*********************   [🗑️]  │
│ JWT_SECRET          +4I3yE*******************     [🗑️]  │
│ SESSION_SECRET      8mqMSf*******************     [🗑️]  │
└─────────────────────────────────────────────────────────┘
[+ Add Environment Variable]
```

✅ **检查清单**：
- [ ] 共有 6 个环境变量
- [ ] 所有 Key 拼写正确（区分大小写！）
- [ ] BACKEND_PORT 是 `10000`
- [ ] LLM_PROVIDER 与 API_KEY 匹配（例如 gemini + GEMINI_API_KEY）
- [ ] JWT_SECRET 和 SESSION_SECRET 是完整的 base64 字符串

---

## 🚀 第五步：保存并触发部署

### 5.1 保存环境变量

找到页面底部或顶部的 **Save Changes** 按钮：

```
┌────────────────────────────────────────┐
│ [Save Changes]                         │
└────────────────────────────────────────┘
```

点击后，Render 会显示确认消息：

```
✓ Environment variables updated
  This will trigger a new deployment
```

### 5.2 自动触发重新部署

保存环境变量后，Render 会 **自动开始重新部署**。

您会看到类似提示：

```
┌─────────────────────────────────────────────────────────┐
│ 🔨 Deployment started                                   │
│                                                         │
│ Your service is being redeployed with new environment  │
│ variables. This may take 2-5 minutes.                  │
└─────────────────────────────────────────────────────────┘
```

---

## 👀 第六步：查看部署日志

### 6.1 进入 Logs 页面

点击左侧菜单的 **📜 Logs**：

```
┌──────────────────────────────────────────┐
│ ← Back to Dashboard                      │
├──────────────────────────────────────────┤
│ apologize-backend                        │
├──────────────────────────────────────────┤
│ 📊 Metrics                               │
│ 📜 Logs              ← 点击这里！        │
│ ⚙️  Settings                             │
└──────────────────────────────────────────┘
```

### 6.2 观察构建过程

您会看到实时日志输出：

```
┌─────────────────────────────────────────────────────────┐
│ Build Logs                                              │
├─────────────────────────────────────────────────────────┤
│ ==> Cloning from https://github.com/xxx/yyy...          │
│ ==> Running build command: cd backend && npm install... │
│                                                         │
│ > npm install                                           │
│ added 245 packages in 23s                               │
│                                                         │
│ > npm run build                                         │
│ Compiling TypeScript...                                 │
│ Build completed successfully!                           │
│                                                         │
│ ==> Build completed in 2m 34s                           │
│ ==> Starting service...                                 │
│                                                         │
│ [info] Server running on port 10000                     │
│ [info] LLM Provider: gemini                             │
│ [info] LLM service initialized successfully             │
│ [info] Environment: production                          │
│                                                         │
│ ✓ Service is live                                       │
└─────────────────────────────────────────────────────────┘
```

### 6.3 成功部署的标志

✅ **成功部署的标志**：
- 看到 `Build completed successfully`
- 看到 `Server running on port 10000`
- 看到 `Service is live` 或服务状态显示绿色的 `Live`
- 没有红色的 ERROR 消息

❌ **失败的标志**：
- 看到红色的 `ERROR` 或 `FAILED`
- 构建停止且状态显示 `Failed`
- 看到 `Port 10000 is not responding`

如果失败，请跳转到 **第九步：常见问题排查**

---

## 🔗 第七步：获取服务 URL

### 7.1 找到服务 URL

部署成功后，回到服务详情页顶部，您会看到：

```
┌─────────────────────────────────────────────────────────┐
│ apologize-backend                                       │
│ Status: ● Live                                          │
├─────────────────────────────────────────────────────────┤
│ https://apologize-backend-xxxx.onrender.com             │
│ [Copy URL]  [Open]                                      │
└─────────────────────────────────────────────────────────┘
```

**您的后端 URL**：`https://apologize-backend-xxxx.onrender.com`

- `xxxx` 是 Render 自动生成的随机字符串
- 这个 URL 是 **公开的**，任何人都可以访问（如果您启用了认证，需要登录）

### 7.2 复制并保存 URL

1. 点击 **[Copy URL]** 按钮
2. 将 URL 保存到记事本或其他地方
3. 稍后配置前端时会用到

---

## ✅ 第八步：测试后端服务

### 8.1 测试健康检查端点

打开终端或浏览器，测试以下 URL（替换为您的实际 URL）：

#### 测试 1：基础健康检查

**在浏览器中访问**：
```
https://apologize-backend-xxxx.onrender.com/api/health
```

**预期结果**（JSON 格式）：
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T12:34:56.789Z",
  "services": {
    "api": "healthy",
    "llm": "healthy"
  }
}
```

#### 测试 2：LLM 服务检查

**在浏览器中访问**：
```
https://apologize-backend-xxxx.onrender.com/api/health/llm
```

**预期结果**：
```json
{
  "provider": "gemini",
  "status": "healthy",
  "model": "gemini-pro",
  "responseTime": 234
}
```

#### 测试 3：详细健康检查

**在浏览器中访问**：
```
https://apologize-backend-xxxx.onrender.com/api/health/detailed
```

**预期结果**（包含系统信息）：
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T12:34:56.789Z",
  "services": {
    "api": "healthy",
    "llm": "healthy"
  },
  "system": {
    "platform": "linux",
    "nodeVersion": "v20.10.0",
    "memory": {
      "used": 45.2,
      "total": 512
    },
    "uptime": 3600
  }
}
```

### 8.2 使用命令行测试（可选）

如果您熟悉命令行，也可以在终端中运行：

```bash
# 测试健康检查
curl https://apologize-backend-xxxx.onrender.com/api/health

# 测试 LLM 服务
curl https://apologize-backend-xxxx.onrender.com/api/health/llm

# 测试发送消息（需要认证）
curl -X POST https://apologize-backend-xxxx.onrender.com/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "测试消息",
    "style": "gentle",
    "sessionId": "test-session"
  }'
```

---

## 🎯 第九步：常见问题排查

### 问题 1：部署失败 - 构建错误

**症状**：
```
npm ERR! missing script: build
```

**原因**：构建命令配置错误

**解决方法**：
1. 进入 **Settings** → **Build & Deploy**
2. 确认 **Build Command** 是：
   ```bash
   cd backend && npm install && npm run build
   ```
3. 确认 **Start Command** 是：
   ```bash
   cd backend && npm start
   ```

---

### 问题 2：服务启动失败 - 端口错误

**症状**：
```
Error: Port 10000 is not responding
```

**原因**：环境变量 `BACKEND_PORT` 配置错误

**解决方法**：
1. 检查 `BACKEND_PORT` 是否设置为 `10000`（必须是这个值）
2. 如果不是，修改后保存
3. 等待自动重新部署

---

### 问题 3：LLM 服务不可用

**症状**：
```
/api/health 返回 200
/api/health/llm 返回 "status": "unavailable"
```

**原因**：LLM API 密钥配置错误

**解决方法**：
1. 检查 `LLM_PROVIDER` 和对应的 API_KEY 是否匹配
   - 如果 `LLM_PROVIDER=gemini`，必须设置 `GEMINI_API_KEY`
   - 如果 `LLM_PROVIDER=openai`，必须设置 `OPENAI_API_KEY`
2. 验证 API 密钥是否有效：
   - Gemini: https://makersuite.google.com/app/apikey
   - OpenAI: https://platform.openai.com/api-keys
3. 检查 API 密钥是否有额度（没有超出免费限制或欠费）

---

### 问题 4：服务显示 Live 但无法访问

**症状**：
- Render 显示服务状态为 `Live`
- 但访问 URL 超时或无响应

**原因**：免费计划服务在无活动 15 分钟后会休眠

**解决方法**：
1. **第一次访问**：等待 30-60 秒，服务会自动唤醒
2. **保持唤醒**（可选）：
   - 使用 UptimeRobot（https://uptimerobot.com）每 5 分钟 ping 一次
   - 或升级到 Render Starter 计划（$7/月，无休眠）

---

### 问题 5：CORS 错误（稍后配置前端时可能遇到）

**症状**（在浏览器控制台）：
```
Access to fetch at 'https://xxx.onrender.com' from origin 'https://yyy.vercel.app'
has been blocked by CORS policy
```

**原因**：后端没有配置前端域名

**解决方法**（在部署前端后执行）：
1. 获取 Vercel 前端 URL（例如：`https://apologize-xxx.vercel.app`）
2. 在 Render 添加两个环境变量：
   ```
   FRONTEND_URL=https://apologize-xxx.vercel.app
   CORS_ORIGIN=https://apologize-xxx.vercel.app
   ```
3. ⚠️ **重要**：URL 末尾 **不要** 加斜杠 `/`
4. 保存后等待重新部署

---

## 🎉 完成！后端部署成功

如果您能看到：

✅ `/api/health` 返回 `"status": "healthy"`
✅ `/api/health/llm` 返回 `"status": "healthy"`
✅ 服务状态显示 `Live`

**恭喜！您的后端已成功部署到 Render！** 🎊

---

## 📋 后端部署检查清单

完成以下所有项目后，您可以继续部署前端：

- [ ] Render Web Service 已创建
- [ ] 6 个必需环境变量已配置：
  - [ ] NODE_ENV=production
  - [ ] BACKEND_PORT=10000
  - [ ] LLM_PROVIDER=gemini（或其他）
  - [ ] GEMINI_API_KEY=您的密钥（或其他 LLM 密钥）
  - [ ] JWT_SECRET=生成的密钥
  - [ ] SESSION_SECRET=生成的密钥
- [ ] 部署状态显示 `Live`
- [ ] 已测试 `/api/health` 并返回成功
- [ ] 已测试 `/api/health/llm` 并返回成功
- [ ] 已记录后端 URL：`https://apologize-backend-xxxx.onrender.com`

---

## 🚀 下一步：部署前端到 Vercel

后端部署完成后，您需要：

1. **阅读 Vercel 部署指南**：
   - 快速版：[DEPLOYMENT_OVERVIEW.md](./DEPLOYMENT_OVERVIEW.md) - 第三步
   - 详细版：[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

2. **核心步骤预览**：
   - 访问 https://vercel.com 并登录
   - 导入 GitHub 仓库
   - 配置 Root Directory 为 `frontend`
   - 添加环境变量 `VITE_API_URL=https://您的后端URL`
   - 部署并获取前端 URL

3. **配置 CORS**（前后端集成）：
   - 在 Render 添加 `FRONTEND_URL` 和 `CORS_ORIGIN`
   - 值为您的 Vercel 前端 URL

4. **完整测试**：
   - 访问前端 URL
   - 测试发送消息功能
   - 验证认证功能（如果启用）

---

## 📞 需要帮助？

如果遇到问题：

1. **查看日志**：
   - Render Dashboard → Logs
   - 查找红色的 ERROR 消息

2. **查看文档**：
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 问题排查指南
   - [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - 完整部署指南

3. **检查环境变量**：
   - 所有 Key 拼写正确（区分大小写）
   - 所有 Value 没有多余的空格或换行
   - API 密钥有效且有额度

4. **重新部署**：
   - Settings → Manual Deploy → Deploy latest commit
   - 查看新的部署日志

---

**祝您部署顺利！** 🚀

如果您成功完成了后端部署，请继续阅读前端部署指南。

---

**文档版本**：v1.0
**最后更新**：2025-11-15
**适用项目**：Apologize-is-all-you-need
**目标用户**：Render 首次使用者
