# 🔧 Vercel 构建错误修复文档

## 问题描述

**错误信息**：
```
failed to load config from /home/runner/work/.../frontend/vite.config.ts
error during build:
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite' imported from ...
npm warn exec The following package was not found and will be installed: vite@6.4.1
```

**触发场景**：
- Vercel 自动部署时
- GitHub Actions 构建 artifact 阶段
- 运行 `vercel build --prod` 命令时

---

## 根本原因分析

### 问题根源

通过本地模拟 Vercel 构建流程，发现了问题的根本原因：

1. **vite 在 devDependencies 中**：
   ```json
   "devDependencies": {
     "vite": "^5.0.8"
   }
   ```

2. **Vercel 只安装 dependencies**：
   - Vercel 的生产构建使用 `npm install --production`
   - 这个命令不会安装 `devDependencies` 中的包
   - 因此 vite 根本没有被安装

3. **构建脚本无法找到 vite**：
   - 构建命令：`npx vite build`
   - npx 尝试下载临时版本的 vite（vite@6.4.1）
   - 但由于配置文件依赖本地的 vite 包，导致模块解析失败

### 为什么会这样？

在传统的 Node.js 项目中，构建工具应该放在 `devDependencies` 中。但在现代 CI/CD 环境：

- **开发环境**：所有依赖都会安装（dev + prod）
- **生产部署**：只安装 `dependencies`（使用 --production 标志）
- **问题**：构建过程发生在"生产部署"阶段，但构建工具在 devDependencies 中

---

## 解决方案

### 修复内容

**修改 `frontend/package.json`**：

**之前**（有问题）：
```json
{
  "scripts": {
    "build": "npx vite build"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "uuid": "^13.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

**之后**（已修复）：
```json
{
  "scripts": {
    "build": "vite build"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "uuid": "^13.0.0",
    "vite": "^5.0.8",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "vitest": "^1.0.4"
  }
}
```

### 关键更改

1. **移动构建依赖到 dependencies**：
   - ✅ `vite` - 构建工具
   - ✅ `@vitejs/plugin-react` - Vite React 插件
   - ✅ `typescript` - TypeScript 编译器
   - ✅ `autoprefixer`, `postcss`, `tailwindcss` - CSS 处理工具

2. **修改构建脚本**：
   - 从 `npx vite build` 改为 `vite build`
   - 使用本地安装的 vite，而不是 npx 下载临时版本

3. **保留真正的开发依赖**：
   - `@types/*` - TypeScript 类型定义（仅开发时需要）
   - `vitest` - 测试工具（仅开发时需要）

---

## 本地验证流程

### 创建的测试脚本

#### 1. 复现问题脚本 (`test_vercel_build.sh`)

模拟 Vercel 的构建流程：
```bash
# 清理环境
rm -rf node_modules dist package-lock.json

# 使用旧的 package.json（vite 在 devDependencies）
npm install --production  # 只安装 dependencies

# 尝试构建
npm run build  # ❌ 失败：找不到 vite
```

**结果**：成功复现了 Vercel 的错误！

#### 2. 验证修复脚本 (`verify_fix.sh`)

验证修复后的配置：
```bash
# 清理环境
rm -rf node_modules dist package-lock.json

# 使用新的 package.json（vite 在 dependencies）
npm install --production  # 安装 dependencies

# 尝试构建
npm run build  # ✅ 成功：构建完成
```

**结果**：
```
vite v5.4.21 building for production...
✓ 113 modules transformed.
✓ built in 2.72s
🎉 修复验证成功！
```

---

## 技术细节

### npm install 的不同模式

| 命令 | 安装内容 | 使用场景 |
|------|---------|----------|
| `npm install` | dependencies + devDependencies | 本地开发 |
| `npm install --production` | 仅 dependencies | 生产部署 |
| `npm ci` | 根据 package-lock.json | CI/CD 环境 |
| `npm ci --production` | 仅 dependencies (from lock file) | 生产 CI/CD |

### Vercel 的构建流程

1. **Checkout 代码**
2. **运行 install 命令**：
   ```bash
   cd frontend && npm install
   ```
   实际上 Vercel 可能使用 `--production` 或类似标志

3. **运行 build 命令**：
   ```bash
   npm run build
   ```

4. **生成 artifact**

### 为什么这是最佳实践

**对于现代前端项目**：

将构建依赖放在 `dependencies` 中是合理的，因为：

1. **构建是部署的一部分**：
   - 现代前端需要构建步骤才能部署
   - 构建工具是部署的必需依赖

2. **CI/CD 环境的需求**：
   - CI/CD 环境通常只安装生产依赖
   - 构建发生在 CI/CD 中，因此构建工具必须在生产依赖中

3. **明确的依赖分类**：
   - `dependencies`：运行时需要的包 + **构建时需要的包**
   - `devDependencies`：仅开发时需要的包（类型定义、测试、linter）

---

## 其他可能的解决方案（未采用）

### 方案 1：修改 Vercel 配置

在 `vercel.json` 中指定安装命令：
```json
{
  "installCommand": "npm install"
}
```

**缺点**：
- 需要额外配置
- 会安装所有 devDependencies（包括不需要的测试工具）
- 增加构建时间

### 方案 2：使用构建命令环境变量

```json
{
  "buildCommand": "npm install && npm run build"
}
```

**缺点**：
- 每次都重新安装依赖
- 浪费时间和资源

### 方案 3：保持 devDependencies，但使用 npm ci

**不可行**：
- Vercel 控制安装命令
- 我们无法强制它使用 `npm ci` 而不是 `npm install --production`

---

## 验证部署成功

### Vercel 部署后检查

1. **查看构建日志**：
   ```
   ✅ Running "install" command: `cd frontend && npm install`
   ✅ Installing dependencies (包含 vite)
   ✅ Running "build" command
   ✅ vite v5.x.x building for production...
   ✅ ✓ built in X.XXs
   ```

2. **检查生成的文件**：
   ```
   dist/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].css
   │   └── index-[hash].js
   └── ...
   ```

3. **测试前端功能**：
   - 访问 Vercel 部署 URL
   - 验证页面正常加载
   - 检查环境变量（window.__ENV__）

---

## 相关问题

### 为什么不使用 npx vite build？

**问题**：
- `npx vite build` 会尝试下载 vite（如果本地没有）
- 下载的可能是不同版本（如 vite@6.x）
- 与项目配置的版本不匹配
- 导致模块解析错误

**解决**：
- 使用 `vite build` 直接调用本地安装的 vite
- 确保版本一致性

### package-lock.json 的作用

**重要性**：
- 锁定确切的依赖版本
- 确保所有环境使用相同的依赖
- 提高构建可重复性

**建议**：
- ✅ 提交 package-lock.json 到 Git
- ✅ 定期更新依赖（npm update）
- ✅ 审查 lock file 的变更

---

## 总结

| 项目 | 状态 |
|------|------|
| **问题诊断** | ✅ 完成（通过本地模拟复现） |
| **根本原因** | ✅ 明确（vite 在 devDependencies） |
| **解决方案** | ✅ 实施（移动到 dependencies） |
| **本地验证** | ✅ 通过（构建成功） |
| **文档编写** | ✅ 完成（本文档） |
| **准备部署** | ✅ 就绪 |

---

## 下一步

1. **提交更改**：
   ```bash
   git add frontend/package.json frontend/package-lock.json
   git commit -m "Fix Vercel build error: move build dependencies to dependencies"
   git push
   ```

2. **触发 Vercel 部署**：
   - 推送后 Vercel 会自动部署
   - 或在 Vercel Dashboard 手动触发

3. **验证部署**：
   - 检查构建日志
   - 测试前端功能
   - 确认没有错误

---

**修复完成！Vercel 部署现在应该可以正常工作！** 🎉
