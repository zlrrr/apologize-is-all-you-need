# 🚀 部署快速参考指南

## 最近修复的问题

### ✅ GitHub Actions 缓存错误（已修复）

**错误**：`Some specified paths were not resolved, unable to cache dependencies`

**解决**：使用 `actions/cache@v3` 替代 `setup-node` 内置缓存

**文档**：`GITHUB_ACTIONS_CACHE_FIX.md`

**提交**：`b067cd1`

---

### ✅ Vercel 构建错误（已修复）

**错误**：`Cannot find package 'vite'`

**解决**：将 vite 和构建工具从 devDependencies 移到 dependencies

**文档**：`VERCEL_BUILD_FIX.md`

**提交**：`3e266e9`

---

## 部署检查清单

### 后端部署（Render）

- ✅ Branch: `claude/add-plan-features-01KZ8uzJP67EWunQhRsC7EFL`
- ✅ 环境变量已配置
- ✅ 健康检查路径：`/api/health`
- ✅ Auto-Deploy：已启用
- ✅ 服务状态：Live

**URL**：https://apologize-is-all-you-need.onrender.com

**验证**：
```bash
curl https://apologize-is-all-you-need.onrender.com/
# 应返回 {"status":"ok","version":"1.0.1",...}
```

---

### 前端部署（Vercel）

- ✅ 环境变量需要设置：`VITE_API_URL`
- ✅ 构建依赖已移到 dependencies
- ✅ package-lock.json 已提交
- ✅ Auto-Deploy：已启用

**URL**：https://apologize-is-all-you-need-web.vercel.app

**需要配置的环境变量**：
```
Name:  VITE_API_URL
Value: https://apologize-is-all-you-need.onrender.com
Environments: Production, Preview, Development
```

**验证**：
- 访问前端 URL
- 浏览器控制台：`window.__ENV__.VITE_API_URL`
- 应显示 Render 后端地址

---

## 当前待办事项

### 1. Vercel 环境变量配置

**状态**：⏳ 待用户配置

**步骤**：
1. 访问 https://vercel.com/dashboard
2. 项目 → Settings → Environment Variables
3. 添加 `VITE_API_URL = https://apologize-is-all-you-need.onrender.com`
4. 勾选所有环境（Production, Preview, Development）
5. Deployments → Redeploy

**文档**：
- `VERCEL_ENV_FIX_GUIDE.md` - 详细步骤
- `VERCEL_URGENT_FIX.md` - 紧急修复指南
- `QUICK_FIX.md` - 快速参考

---

### 2. 合并到 main 分支

**状态**：⏳ 待创建 PR

**原因**：main 分支有推送保护（403 错误）

**步骤**：
1. 访问 GitHub 仓库
2. 创建 Pull Request：
   - Base: `main`
   - Compare: `claude/add-plan-features-01KZ8uzJP67EWunQhRsC7EFL`
3. 标题：`Fix: Vercel build error and GitHub Actions cache`
4. 合并 PR

---

## 部署流程

### GitHub Actions 自动部署

**触发条件**：
- Push to `main` 分支
- Push to `claude/add-plan-features-01KZ8uzJP67EWunQhRsC7EFL` 分支
- 手动触发（workflow_dispatch）

**工作流程**：
1. Code Quality Check（代码检查）
2. Deploy to Render（触发 Render 部署）
3. Post-deployment Tests（部署后测试）

**查看状态**：
- GitHub 仓库 → Actions 标签

---

### Render 自动部署

**触发条件**：
- 检测到分支更新
- 手动触发（Dashboard）
- GitHub Actions 触发（API）

**监控**：
- Render Dashboard → Logs

---

### Vercel 自动部署

**触发条件**：
- 检测到代码推送
- 手动触发（Dashboard）

**监控**：
- Vercel Dashboard → Deployments

---

## 故障排除

### 后端 403 错误

**症状**：`curl https://apologize-is-all-you-need.onrender.com/` 返回 403

**可能原因**：
1. Render 服务休眠（免费计划 15 分钟不活动）
2. 健康检查失败
3. 新代码未部署

**解决**：
1. 等待 30-60 秒（唤醒服务）
2. 查看 Render Dashboard 部署历史
3. 手动触发部署

**文档**：`COMPREHENSIVE_TROUBLESHOOTING.md`

---

### 前端访问 localhost

**症状**：前端请求发送到 `http://localhost:5001`

**原因**：Vercel 环境变量 `VITE_API_URL` 未设置

**解决**：
1. Vercel Dashboard 设置环境变量
2. 重新部署前端
3. 清除浏览器缓存（Ctrl+Shift+R）

**文档**：`VERCEL_ENV_FIX_GUIDE.md`

---

### Vercel 构建失败

**症状**：`Cannot find package 'vite'`

**原因**：构建依赖在 devDependencies 中

**解决**：✅ 已修复（commit `3e266e9`）

**验证**：下次 Vercel 部署应该成功

---

## 环境变量总览

### 后端（Render）

```
NODE_ENV=production
BACKEND_PORT=10000
LLM_PROVIDER=gemini
GEMINI_API_KEY=[您的密钥]
JWT_SECRET=htwj/yZuo57AOwukVLcNy3XMz/9aoVlRgYZUGytXXMc=
SESSION_SECRET=rO188rxtFda0DGFKvXvEedjpRCiKPvttQuGXDrGPLRs=
FRONTEND_URL=https://apologize-is-all-you-need-web.vercel.app
CORS_ORIGIN=https://apologize-is-all-you-need-web.vercel.app
```

### 前端（Vercel）

```
VITE_API_URL=https://apologize-is-all-you-need.onrender.com
```

---

## 有用的命令

### 本地测试后端

```bash
cd backend
npm install
npm run build
npm start
```

### 本地测试前端

```bash
cd frontend
npm install
npm run dev
```

### 模拟 Vercel 构建

```bash
cd frontend
rm -rf node_modules dist package-lock.json
npm install --production
npm run build
```

### 测试后端 API

```bash
# 健康检查
curl https://apologize-is-all-you-need.onrender.com/api/health

# LLM 健康检查
curl https://apologize-is-all-you-need.onrender.com/api/health/llm

# 认证状态
curl https://apologize-is-all-you-need.onrender.com/api/auth/status
```

---

## 相关文档

### 部署和配置
- `CICD_SETUP_GUIDE.md` - CI/CD 配置指南
- `RENDER_MANUAL_STEPS.md` - Render 手动部署步骤
- `VERCEL_ENV_FIX_GUIDE.md` - Vercel 环境变量配置

### 问题排查
- `COMPREHENSIVE_TROUBLESHOOTING.md` - 全面故障排查（7 大类别）
- `LOG_COLLECTION_GUIDE.md` - 日志收集指南
- `DIAGNOSIS_SUMMARY.md` - 诊断报告总结

### 技术修复
- `GITHUB_ACTIONS_CACHE_FIX.md` - GitHub Actions 缓存修复
- `VERCEL_BUILD_FIX.md` - Vercel 构建错误修复
- `HOW_TO_CHECK_ENV_VARS.md` - 如何检查环境变量

### 快速参考
- `QUICK_FIX.md` - 快速修复步骤
- `CURRENT_STATUS_SUMMARY.md` - 当前状态总结
- `DEPLOYMENT_QUICK_REFERENCE.md` - 本文档

---

## 联系和支持

### GitHub Issues
https://github.com/zlrrr/apologize-is-all-you-need/issues

### 当前分支
`claude/add-plan-features-01KZ8uzJP67EWunQhRsC7EFL`

---

**最后更新**：2025-11-16
**状态**：✅ 后端部署正常，⏳ 前端等待环境变量配置
