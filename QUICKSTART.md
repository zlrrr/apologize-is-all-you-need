# 快速开始指南

## 本地开发（5分钟上手）

### 前置要求
- Node.js 18+
- npm 或 yarn

### 一键启动

```bash
# 克隆项目
git clone <your-repo-url>
cd apologize-is-all-you-need

# 一键启动开发服务器
./start-dev.sh
```

启动后访问：
- **前端**: http://localhost:5173
- **后端**: http://localhost:5001
- **健康检查**: http://localhost:5001/api/health

### 手动启动

如果一键脚本不工作，可以手动启动：

```bash
# Terminal 1 - 后端
cd backend
npm install
cp .env.example .env  # 然后编辑.env配置LLM
npm run dev

# Terminal 2 - 前端
cd frontend
npm install
echo "VITE_API_URL=http://localhost:5001" > .env
npm run dev
```

---

## LLM配置

### 选项1：使用云端LLM API（推荐新手）

编辑 `backend/.env`:

```bash
# OpenAI（最简单）
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini

# 或 Gemini（有免费额度）
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# 或 Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 选项2：使用本地LM Studio

1. 下载并启动 [LM Studio](https://lmstudio.ai/)
2. 加载一个模型（推荐：Llama 3.2 3B或更大）
3. 启动Local Server（端口1234）
4. 编辑 `backend/.env`:

```bash
LLM_PROVIDER=lm-studio
LM_STUDIO_URL=http://127.0.0.1:1234
```

---

## 测试应用

### 1. 检查健康状态

```bash
# 后端健康
curl http://localhost:5001/api/health

# LLM健康
curl http://localhost:5001/api/health/llm
```

### 2. 发送测试消息

```bash
curl -X POST http://localhost:5001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "今天好累啊",
    "style": "gentle",
    "sessionId": "test-session"
  }'
```

### 3. 访问Web界面

打开浏览器访问 http://localhost:5173，输入消息测试。

---

## 启用认证（可选）

如果要保护应用不被未授权访问：

编辑 `backend/.env`:

```bash
# 设置JWT密钥
JWT_SECRET=your-super-secret-key-min-32-chars

# 方式1：使用密码
ACCESS_PASSWORD=your-strong-password

# 方式2：使用邀请码
INVITE_CODES=WELCOME123,FRIEND456,TEAM789
```

重启后端服务，访问时需要输入密码或邀请码。

---

## 常见问题

### Q: "无法连接到服务器" 错误

**原因**: 后端服务没有运行

**解决**:
```bash
cd backend
npm run dev
```

### Q: "LLM服务不可用" 错误

**原因**: LLM配置不正确或服务未运行

**解决**:
1. 检查 `.env` 文件中的LLM配置
2. 如果用LM Studio，确保它在运行
3. 如果用API，检查API密钥是否正确
4. 查看后端日志：`tail -f backend/logs/combined.log`

### Q: 端口被占用

**解决**:
```bash
# 查找占用端口的进程
lsof -i :5001  # 后端
lsof -i :5173  # 前端

# 杀死进程
kill -9 <PID>
```

### Q: 依赖安装失败

**解决**:
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 下一步

- 📖 阅读 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解生产部署
- 🔧 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 排查问题
- 📝 查看 [PLAN.md](./PLAN.md) 了解开发计划

---

## 开发命令

```bash
# 后端
npm run dev          # 开发模式（热重载）
npm run build        # 构建生产版本
npm start            # 启动生产版本
npm test             # 运行测试

# 前端
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
```

---

## 项目结构

```
apologize-is-all-you-need/
├── backend/              # Node.js后端
│   ├── src/
│   │   ├── server.ts    # 服务器入口
│   │   ├── routes/      # API路由
│   │   ├── services/    # 业务逻辑
│   │   ├── middleware/  # 中间件
│   │   └── utils/       # 工具函数
│   ├── logs/            # 日志文件
│   └── .env             # 环境变量
│
├── frontend/            # React前端
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── services/    # API调用
│   │   └── utils/       # 工具函数
│   └── .env             # 环境变量
│
└── start-dev.sh         # 一键启动脚本
```

---

**祝你使用愉快！** 🎉

如有问题，请查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 或提交Issue。
