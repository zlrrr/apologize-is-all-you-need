# 本地测试 Vercel 部署指南

## 为什么需要本地测试？

在推送代码到 GitHub 触发 CI/CD 之前，本地测试可以：
- 节省时间（无需等待 CI/CD 运行）
- 快速发现问题（立即反馈）
- 降低成本（减少 CI/CD 运行次数）

## 方法 1: 使用 Vercel CLI（推荐）

这是**最准确**的方法，完全模拟 Vercel 的构建环境。

### 安装 Vercel CLI

```bash
npm install -g vercel@latest
```

### 本地构建和测试

```bash
# 1. 链接到 Vercel 项目（首次需要）
vercel link

# 2. 本地构建（完全模拟 Vercel 环境）
vercel build --prod

# 3. 查看构建结果
ls -la .vercel/output/static/

# 4. 本地预览构建结果
vercel dev
```

### 测试完整部署流程

```bash
# 构建并部署到预览环境
vercel build && vercel deploy --prebuilt

# 部署到生产环境
vercel build --prod && vercel deploy --prebuilt --prod
```

## 方法 2: 手动模拟构建命令

直接运行 `vercel.json` 中定义的命令：

```bash
# 清理旧构建
rm -rf frontend/dist frontend/node_modules

# 安装依赖并构建（与 vercel.json 中的 buildCommand 完全一致）
cd frontend && npm install && npx vite build && cd ..

# 检查构建输出
ls -la frontend/dist/
```

## 方法 3: 使用 Docker 模拟 CI 环境

```bash
# 使用与 GitHub Actions 相同的 Node 版本
docker run -it --rm -v $(pwd):/app node:18 bash

# 在容器内运行
cd /app/frontend
npm install
npx vite build
```

## 方法 4: 使用 act 本地运行 GitHub Actions

```bash
# 安装 act
brew install act  # macOS
# 或
choco install act  # Windows

# 运行 workflow
act -j deploy

# 只运行特定步骤
act -j deploy --skip-verify
```

## 常见问题排查

### 1. 依赖安装失败

```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm cache clean --force

# 重新安装
npm install
```

### 2. 构建失败

```bash
# 查看详细错误日志
npm run build --verbose

# 检查 node_modules 中是否有 vite
ls -la node_modules/.bin/vite
```

### 3. 环境变量问题

```bash
# 创建本地 .env 文件（用于测试）
cat > .env << EOF
VITE_API_URL=http://localhost:3000
EOF

# 验证环境变量
npm run build
```

## 最佳实践流程

推荐的开发和部署流程：

```bash
# 1. 本地开发
npm run dev

# 2. 本地测试构建
cd frontend && npm install && npx vite build

# 3. 验证构建产物
ls -la frontend/dist/

# 4. 使用 Vercel CLI 本地预览
vercel dev

# 5. 确认无误后提交代码
git add .
git commit -m "Your changes"
git push

# 6. GitHub Actions 自动运行 CI/CD
# 7. 查看部署结果
```

## 调试技巧

### 查看完整构建日志

```bash
# Vercel CLI 详细日志
vercel build --prod --debug

# npm 详细日志
npm run build --loglevel verbose
```

### 检查依赖是否正确安装

```bash
# 查看安装的包数量
npm ls --depth=0

# 查看特定包
npm ls vite
```

### 验证 vite 配置

```bash
# 测试 vite 配置是否正确
npx vite --version
npx vite build --mode production
```

## 时间对比

- **传统方式**（直接推送代码）：3-5 分钟 CI/CD + 调试循环
- **本地测试**：30 秒 - 1 分钟

**节省时间：80-90%**

## 总结

1. **开发阶段**：使用 `npm run dev`
2. **测试构建**：使用 `vercel build`（最准确）
3. **验证部署**：使用 `vercel deploy --prebuilt`
4. **确认无误**：推送代码触发 CI/CD

这样可以在本地快速迭代，只在确认构建成功后才推送代码，大大提高效率！
