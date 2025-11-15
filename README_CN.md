# Apologize Is All You Need

> 一个由AI驱动的道歉应用 - 提供无限的情绪价值和真诚的道歉

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## 项目状态

✅ **MVP 已完成** - 核心功能全部实现

当前版本：v0.1.0

## 功能特性

- ✅ **多种LLM提供商支持** - OpenAI、Anthropic Claude、Google Gemini、LM Studio 或自定义API
- ✅ **灵活的API密钥配置** - 轻松配置您自己的LLM API密钥
- ✅ **一键部署** - 通过Vercel自动化CI/CD部署
- ✅ **实时对话界面** - 响应式聊天UI
- ✅ **多种道歉风格** - 温和/正式/共情三种风格
- ✅ **多会话管理** - 创建、切换、删除会话
- ✅ **会话持久化** - localStorage自动保存
- ✅ **情绪识别** - 自动检测用户情绪
- ✅ **完整的错误处理** - 友好的错误提示
- ✅ **Mock服务器** - 无需真实LLM即可测试
- ✅ **可爱的道歉动画** - 日式鞠躬角色

## 快速开始

### 方式一：一键启动（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/turtacn/apologize-is-all-you-need.git
cd apologize-is-all-you-need

# 2. 运行启动脚本
./scripts/start.sh
```

启动脚本会自动：
- 检查 Node.js 版本
- 安装依赖（如需要）
- 创建 .env 文件
- 检测 LM Studio
- 启动所有服务

### 方式二：手动启动

```bash
# 1. 安装依赖
npm run install:all

# 2. 配置环境（可选）
cp .env.example .env

# 3. 启动应用
npm run dev

# 4. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:5001
```

详细步骤请查看 [快速开始指南](./docs/QUICK_START.md)

### LLM提供商配置

在 `.env` 文件中配置您喜欢的LLM提供商：

**使用 OpenAI:**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

**使用 Anthropic Claude:**
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**使用 Google Gemini:**
```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash
```

**使用 LM Studio (本地):**
```bash
LLM_PROVIDER=lm-studio
LM_STUDIO_URL=http://127.0.0.1:1234
```

查看 [.env.example](./.env.example) 了解所有配置选项。

## 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **LLM提供商** (选择一个):
  - OpenAI API密钥
  - Anthropic API密钥
  - Google Gemini API密钥
  - LM Studio (本地, 免费)
  - 任何OpenAI兼容的API

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS
- **状态**: React Hooks + localStorage
- **HTTP**: Axios

### 后端
- **运行时**: Node.js + Express.js
- **语言**: TypeScript
- **LLM**: LM Studio API (OpenAI兼容)
- **会话**: 内存存储 (支持100会话, 24h TTL)
- **测试**: Vitest (14个单元测试)

## 项目结构

```
apologize-is-all-you-need/
├── frontend/                    # React前端
│   ├── src/
│   │   ├── components/         # UI组件
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── InputBox.tsx
│   │   │   └── SessionList.tsx
│   │   ├── services/           # API服务
│   │   ├── utils/              # 工具函数
│   │   └── types/              # TypeScript类型
│   └── package.json
│
├── backend/                     # Express后端
│   ├── src/
│   │   ├── services/           # 业务逻辑
│   │   │   ├── llm.service.ts
│   │   │   └── session.service.ts
│   │   ├── routes/             # API路由
│   │   ├── middleware/         # 中间件
│   │   ├── prompts/            # Prompt模板
│   │   └── types/              # TypeScript类型
│   ├── tests/                  # 单元测试
│   └── package.json
│
├── docs/                        # 文档
│   ├── API.md                  # API文档
│   ├── QUICK_START.md          # 快速开始
│   └── phase-logs/             # 开发日志
│
├── scripts/                     # 工具脚本
│   ├── start.sh                # 启动脚本
│   └── test-lm-studio.sh       # LM Studio测试
│
├── .env.example                # 环境变量示例
├── package.json                # 根配置
├── PLAN.md                     # 开发计划
└── README.md                   # 本文件
```

## API 文档

### 主要端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/chat/message` | POST | 发送消息获取道歉 |
| `/api/chat/history` | GET | 获取会话历史 |
| `/api/chat/sessions` | GET | 获取所有会话 |
| `/api/health` | GET | 健康检查 |

完整API文档: [docs/API.md](./docs/API.md)

## 道歉风格

### 温和 (Gentle)
温柔体贴，像朋友般关怀，使用温暖的词汇

### 正式 (Formal)
专业得体，保持适当距离，但不失温度

### 共情 (Empathetic)
深度理解，充分表达对用户痛苦的共鸣

## 开发

### 运行测试

```bash
# 后端测试
cd backend
npm run test

# Watch模式
npm run test:watch
```

### 构建生产版本

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd backend
npm run build
```

### 代码规范

项目使用 TypeScript strict mode 和 ESLint。

## 测试结果

| 测试类型 | 状态 | 详情 |
|---------|------|------|
| 后端单元测试 | ✅ 14/14 | LLMService 全部通过 |
| API集成测试 | ✅ | 所有端点正常 |
| 前后端联调 | ✅ | 通信正常 |

## MVP 完成度

- [x] Phase 0: 项目初始化
- [x] Phase 1: 后端API开发
- [x] Phase 2: 前端基础界面
- [x] Phase 3: 功能增强
- [x] Phase 4: 测试与优化
- [x] Phase 5: 文档与部署

详细开发计划: [PLAN.md](./PLAN.md)

## 故障排除

### LM Studio无法连接

使用Mock服务器进行测试：

```bash
cd backend
npx tsx src/mock-lm-studio.ts
```

### 端口被占用

修改 `.env` 文件中的端口配置：

```bash
BACKEND_PORT=5001  # 修改为其他端口
```

更多问题请查看 [快速开始指南](./docs/QUICK_START.md)

## 🚀 部署

部署您自己的实例到Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/turtacn/apologize-is-all-you-need)

**重要**: 部署后，请在Vercel环境变量中配置您的LLM提供商API密钥。

详细部署说明请查看 [部署指南](./docs/DEPLOYMENT.md)

### 快速部署步骤

1. 点击上方 "Deploy with Vercel" 按钮
2. 将仓库导入到您的Vercel账户
3. 添加环境变量（API密钥）
4. 部署完成！

### 使用 GitHub Actions 自动化 CI/CD

本仓库包含 GitHub Actions 工作流，可实现自动部署。启用步骤：

1. 配置 GitHub secrets（VERCEL_TOKEN、VERCEL_ORG_ID、VERCEL_PROJECT_ID）
2. 在 Vercel 控制台设置环境变量（LLM API 密钥）
3. 推送到 main/master 分支

**完整设置说明：** [GitHub Actions 设置指南](./docs/GITHUB_ACTIONS_SETUP.md)

## 贡献

欢迎贡献！请：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE)

## 致谢

- 感谢 [LM Studio](https://lmstudio.ai/) 提供本地LLM运行环境
- 感谢 [Anthropic](https://www.anthropic.com/) 的 Claude 协助开发

## 联系方式

- 项目地址: https://github.com/turtacn/apologize-is-all-you-need
- Issue跟踪: https://github.com/turtacn/apologize-is-all-you-need/issues

---

**使用愉快！** 🎉

如果这个项目对你有帮助，请给个 ⭐️ Star！
