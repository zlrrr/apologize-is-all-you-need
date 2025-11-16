# 🔍 如何在浏览器中查看前端环境变量

## ❌ 错误方法（会报错）

在浏览器控制台直接输入：
```javascript
console.log(import.meta.env.VITE_API_URL)  // ❌ 错误！
```

**错误信息**：
```
Uncaught SyntaxError: Cannot use 'import.meta' outside a module
```

**原因**：
- 浏览器控制台不是 ES Module 上下文
- `import.meta` 只能在模块代码中使用
- 控制台是全局作用域，无法直接使用模块特性

---

## ✅ 正确方法

### 方法 1：使用调试组件（已添加）

我已经在前端代码中添加了 `EnvDebug` 调试组件。

**步骤**：
1. 确保前端代码已更新（包含 `EnvDebug` 组件）
2. 重新构建并部署前端
3. 访问前端页面

**您会看到**：
- 页面右下角出现一个黑色调试面板
- 显示所有前端环境变量
- 包括 `VITE_API_URL`、`MODE`、`PROD` 等

---

### 方法 2：使用 window.__ENV__（推荐）

调试组件会自动将环境变量暴露到全局对象。

**在浏览器控制台输入**：
```javascript
window.__ENV__
```

**期望输出**：
```javascript
{
  VITE_API_URL: "https://apologize-is-all-you-need.onrender.com",
  MODE: "production",
  DEV: false,
  PROD: true
}
```

**检查特定变量**：
```javascript
window.__ENV__.VITE_API_URL
// 应输出: "https://apologize-is-all-you-need.onrender.com"
```

---

### 方法 3：查看控制台自动输出

调试组件会在页面加载时自动打印环境变量到控制台。

**步骤**：
1. 打开前端页面
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. 查看输出

**期望看到**：
```
=== Frontend Environment Variables ===
VITE_API_URL: https://apologize-is-all-you-need.onrender.com
MODE: production
DEV: false
PROD: true
======================================
✅ 环境变量已暴露到 window.__ENV__
💡 在控制台输入: window.__ENV__
```

---

### 方法 4：检查 Network 请求（最可靠）

这个方法不需要调试组件，直接查看实际的网络请求。

**步骤**：
1. F12 → **Network** 标签
2. 刷新页面（F5）
3. 找到对 `/api/health` 或 `/api/auth/status` 的请求
4. 点击该请求
5. 查看 **Headers** → **General** → **Request URL**

**期望看到**：
```
Request URL: https://apologize-is-all-you-need.onrender.com/api/health
```

**如果看到**：
```
Request URL: http://localhost:5001/api/health
```
→ 说明 `VITE_API_URL` 未设置或未生效

---

## 🎯 快速诊断

### 问题：前端访问 localhost 而不是 Render 后端

**检查步骤**：

1. **控制台输入**：
   ```javascript
   window.__ENV__.VITE_API_URL
   ```

2. **结果判断**：

   **如果输出 `undefined`**：
   - ❌ 环境变量未设置
   - 解决：在 Vercel Dashboard 添加 `VITE_API_URL`
   - 然后重新部署

   **如果输出 `"http://localhost:5001"`**：
   - ❌ 环境变量设置错误
   - 解决：在 Vercel 修改为 `https://apologize-is-all-you-need.onrender.com`
   - 然后重新部署

   **如果输出 `"https://apologize-is-all-you-need.onrender.com"`**：
   - ✅ 环境变量设置正确
   - 但如果 Network 请求仍是 localhost → 清除浏览器缓存

---

## 📝 重要说明

### 前端 vs 后端环境变量

**前端环境变量**（在 Vercel 配置）：
- ✅ `VITE_API_URL` - 后端 API 地址
- ✅ 所有 `VITE_` 开头的变量
- ❌ **不能**访问后端环境变量（如 `LLM_PROVIDER`）

**后端环境变量**（在 Render 配置）：
- ✅ `LLM_PROVIDER` - LLM 提供商
- ✅ `GEMINI_API_KEY` - Gemini API 密钥
- ✅ `JWT_SECRET` - JWT 密钥
- ✅ `CORS_ORIGIN` - CORS 配置
- ❌ **不能**在前端访问（出于安全考虑）

### 为什么前端不能访问后端环境变量？

**安全原因**：
- 前端代码在用户浏览器中运行
- 所有前端环境变量都会被打包到 JavaScript 文件中
- 用户可以查看所有前端环境变量
- 敏感信息（API 密钥、密码等）绝对不能放在前端环境变量中

**正确做法**：
- 前端只存储公开信息（API 地址、功能开关等）
- 敏感信息存储在后端环境变量
- 前端通过 API 调用后端获取需要的数据

---

## 🚀 部署后如何测试

### 完整测试流程

1. **部署前端**（在 Vercel）
   ```
   Settings → Environment Variables → 添加 VITE_API_URL
   Deployments → Redeploy
   ```

2. **等待部署完成**（2-3 分钟）

3. **访问前端页面**
   ```
   https://apologize-is-all-you-need-web.vercel.app
   ```

4. **检查调试面板**（页面右下角）
   - 查看 VITE_API_URL 是否正确

5. **或控制台检查**
   ```javascript
   window.__ENV__.VITE_API_URL
   ```

6. **检查 Network 请求**
   - F12 → Network → 刷新页面
   - 查看 /api/health 的 Request URL

7. **如果都正确，移除调试组件**
   - 编辑 `frontend/src/App.tsx`
   - 删除或注释 `<EnvDebug />` 行
   - 重新部署

---

## 🔧 故障排除

### 问题 1：window.__ENV__ 是 undefined

**原因**：调试组件未加载或代码未更新

**解决**：
1. 确认 `EnvDebug.tsx` 文件存在
2. 确认 `App.tsx` 中引入了 `EnvDebug`
3. 重新构建并部署
4. 清除浏览器缓存

---

### 问题 2：window.__ENV__ 存在但 VITE_API_URL 是 undefined

**原因**：Vercel 环境变量未设置

**解决**：
1. Vercel Dashboard → Settings → Environment Variables
2. 添加 `VITE_API_URL = https://apologize-is-all-you-need.onrender.com`
3. 确保勾选 Production 环境
4. 重新部署

---

### 问题 3：VITE_API_URL 正确但 Network 请求仍是 localhost

**原因**：浏览器缓存

**解决**：
1. 硬刷新：`Ctrl + Shift + R` × 3 次
2. 或清除浏览器缓存
3. 或无痕模式测试

---

## ✅ 成功标志

当所有配置正确时，您应该看到：

**调试面板显示**：
```
VITE_API_URL: https://apologize-is-all-you-need.onrender.com ✅
MODE: production
PROD: true
```

**控制台输入**：
```javascript
window.__ENV__.VITE_API_URL
// "https://apologize-is-all-you-need.onrender.com"
```

**Network 请求**：
```
Request URL: https://apologize-is-all-you-need.onrender.com/api/health
Status: 200 OK
```

**前端服务状态**：
```
✅ 后端服务: 正常
```

---

## 📚 相关文档

- `VERCEL_ENV_FIX_GUIDE.md` - Vercel 环境变量配置指南
- `VERCEL_URGENT_FIX.md` - 紧急修复步骤
- `FRONTEND_LOCALHOST_DIAGNOSIS.md` - localhost 问题诊断

---

**现在您知道如何正确查看环境变量了！** 🎉

**快速命令**：
```javascript
// 查看所有环境变量
window.__ENV__

// 查看 API URL
window.__ENV__.VITE_API_URL

// 查看运行模式
window.__ENV__.MODE
```
