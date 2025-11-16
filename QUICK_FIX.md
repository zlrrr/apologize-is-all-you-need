# ⚡ 快速修复 - 前端环境变量问题

## 🎯 问题

前端访问 `http://localhost:5001` 而不是 `https://apologize-is-all-you-need.onrender.com`

## 🔧 快速解决（3 步骤，5 分钟）

### 1️⃣ 设置 Vercel 环境变量

```
1. 访问：https://vercel.com/dashboard
2. 点击项目 → Settings → Environment Variables
3. 添加新变量：
   Name:  VITE_API_URL
   Value: https://apologize-is-all-you-need.onrender.com
   Environments: ✅ Production ✅ Preview ✅ Development
4. 点击 Save
```

### 2️⃣ 重新部署前端

```
1. Deployments 标签
2. 最新部署 → "..." 菜单 → Redeploy
3. 等待 2-3 分钟
```

### 3️⃣ 验证成功

```
浏览器打开：https://apologize-is-all-you-need-web.vercel.app
按 F12 → Console 标签 → 输入：
  console.log(import.meta.env.VITE_API_URL)

应显示：
  "https://apologize-is-all-you-need.onrender.com"
```

## ✅ 成功标志

前端页面显示：
```
✅ 后端服务: 正常
✅ LLM服务: 正常
```

## 📖 详细文档

完整步骤和故障排除：见 `VERCEL_ENV_FIX_GUIDE.md`

---

**立即开始 →** https://vercel.com/dashboard
