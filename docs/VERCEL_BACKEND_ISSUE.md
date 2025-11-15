# Vercel 部署后端 API 问题及解决方案

## 问题分析

### 当前状态
- ✅ **前端部署成功**：静态文件已部署到 Vercel
- ❌ **后端未部署**：API 服务器没有运行
- ❌ **运行时错误**："Failed to send message"

### 根本原因

前端代码 (`frontend/src/services/api.ts:4`) 配置：
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

在 Vercel 上：
1. 没有设置 `VITE_API_URL` 环境变量
2. 默认使用 `http://localhost:5001`
3. 浏览器无法连接到 localhost（后端不存在）
4. 所有 API 调用失败，显示 "Failed to send message"

## 解决方案

### 方案 1: 部署后端到云平台（推荐）

#### 步骤：

**1. 部署后端到 Railway/Render/Heroku**

以 Railway 为例：
```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 创建项目
railway init

# 4. 部署后端
cd backend
railway up

# 5. 获取部署 URL（例如：https://your-app.railway.app）
railway status
```

**2. 在 Vercel 设置环境变量**

在 GitHub Secrets 中添加：
```
VITE_API_URL=https://your-backend-url.railway.app
```

**3. 更新 GitHub Actions workflow**

在 `.github/workflows/vercel-deploy.yml` 的环境变量同步部分添加：
```yaml
# Set Frontend API URL
if [ -n "${{ secrets.VITE_API_URL }}" ]; then
  set_env_var "VITE_API_URL" "${{ secrets.VITE_API_URL }}" "production"
  set_env_var "VITE_API_URL" "${{ secrets.VITE_API_URL }}" "preview"
fi
```

**4. 重新部署**
```bash
git push
```

### 方案 2: 使用 Vercel Serverless Functions

将后端 API 改造为 Vercel Serverless Functions。

#### 优点：
- ✅ 前后端统一部署
- ✅ 自动扩展
- ✅ 无需单独服务器

#### 缺点：
- ❌ 需要重构后端代码
- ❌ 冷启动延迟
- ❌ 执行时间限制（免费版 10 秒）

#### 实现步骤：

**1. 创建 `api` 目录**
```bash
mkdir -p api
```

**2. 创建 API 路由文件**

`api/chat/message.ts`:
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { LLMService } from '../../backend/src/services/llm.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const llmService = new LLMService({
      provider: process.env.LLM_PROVIDER as any,
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
    });

    const result = await llmService.generateApology(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
```

**3. 更新 `vercel.json`**
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**4. 更新前端 API URL**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '';  // 使用相对路径
```

### 方案 3: 临时方案 - 改进错误提示

在不部署后端的情况下，至少让用户知道发生了什么：

`frontend/src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// 检查 API 是否可用
if (!import.meta.env.VITE_API_URL && typeof window !== 'undefined') {
  console.warn(
    '⚠️ Backend API not configured!\n' +
    'Set VITE_API_URL environment variable to your backend URL.\n' +
    'Current default: http://localhost:5001'
  );
}

export async function sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
  try {
    const response = await api.post<SendMessageResponse>('/api/chat/message', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 更友好的错误消息
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        throw new Error(
          'Cannot connect to backend API. ' +
          'Please check if the backend server is running or configure VITE_API_URL.'
        );
      }
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
    throw error;
  }
}
```

## 推荐架构

### 生产环境架构

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ──────> │    Vercel    │ ──────> │   Railway   │
│  (用户)      │         │  (Frontend)  │         │  (Backend)  │
└─────────────┘         └──────────────┘         └─────────────┘
                             静态文件                  API 服务
```

### 配置清单

**GitHub Secrets:**
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
VITE_API_URL=https://your-backend.railway.app  # 新增
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-flash
```

**后端环境变量 (Railway/Render):**
```
PORT=5001
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-flash
CORS_ORIGIN=https://your-app.vercel.app
```

## 快速开始（方案 1）

### 1. 部署后端到 Railway

```bash
# 在项目根目录
cd backend

# 创建 railway.json
cat > railway.json << EOF
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# 初始化并部署
railway login
railway init
railway up

# 获取 URL
railway domain
```

### 2. 配置 Vercel 环境变量

在 GitHub 仓库的 Settings → Secrets 中添加：
```
Name: VITE_API_URL
Value: https://your-backend.railway.app
```

### 3. 更新 GitHub Actions

在 `.github/workflows/vercel-deploy.yml` 的环境变量同步部分添加 VITE_API_URL。

### 4. 触发重新部署

```bash
git commit --allow-empty -m "Trigger redeploy with backend URL"
git push
```

## 验证部署

部署完成后，检查：

1. **前端访问** `https://your-app.vercel.app`
2. **后端健康检查** `https://your-backend.railway.app/health`
3. **API 调用** 在浏览器控制台检查网络请求

## 故障排查

### 错误："Failed to send message"

**原因：** 后端未配置或无法访问

**检查：**
```bash
# 1. 检查 Vercel 环境变量
vercel env ls

# 2. 检查后端是否运行
curl https://your-backend.railway.app/health

# 3. 检查浏览器控制台
# Network tab → 查看 API 请求详情
```

### 错误：CORS 错误

**原因：** 后端未配置允许前端域名

**解决：** 在后端 `backend/src/index.ts` 设置：
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

## 总结

**当前问题：**
- ✅ 前端部署成功
- ❌ 后端未部署
- ❌ API 无法访问

**推荐方案：**
1. 部署后端到 Railway（最简单）
2. 设置 `VITE_API_URL` 环境变量
3. 重新部署前端

**预期结果：**
- ✅ 前端可访问
- ✅ 后端 API 可用
- ✅ 完整功能正常工作
