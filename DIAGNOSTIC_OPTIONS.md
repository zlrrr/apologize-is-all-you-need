# 远程诊断选项 🔍

---

## 选项 1：交互式诊断（推荐）⭐

运行交互式诊断工具，按提示输入信息：

```bash
./diagnose-now.sh
```

**会询问您**：
1. Render 后端 URL
2. 是否有 Vercel 前端（如果有，提供 URL）

**然后自动**：
- ✅ 测试后端连通性
- ✅ 检查健康状态
- ✅ 验证 LLM 服务
- ✅ 检查 CORS 配置
- ✅ 测量响应延迟
- ✅ 生成详细报告和修复建议

---

## 选项 2：命令行诊断

如果您已知道 URL，可以直接提供：

```bash
# 只测试后端
./test-production.sh https://your-backend.onrender.com

# 测试前后端集成
./test-production.sh \
  https://your-backend.onrender.com \
  https://your-frontend.vercel.app
```

---

## 选项 3：手动测试（快速验证）

### 测试后端基础连通性

```bash
# 替换为您的实际 URL
BACKEND_URL="https://your-backend.onrender.com"

# 1. 基础连通性
curl $BACKEND_URL/api/health

# 2. LLM 服务
curl $BACKEND_URL/api/health/llm

# 3. 详细健康检查
curl $BACKEND_URL/api/health/detailed
```

### 测试 CORS（如果有前端）

```bash
FRONTEND_URL="https://your-frontend.vercel.app"

# CORS Preflight
curl -i -X OPTIONS $BACKEND_URL/api/health \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: GET"

# 查找 access-control-allow-origin 头
```

---

## 如何获取您的 URL

### Render 后端 URL

1. 访问：https://dashboard.render.com
2. 点击您的服务（`apologize-backend`）
3. URL 显示在服务详情页顶部
4. 格式：`https://apologize-backend-xxxx.onrender.com`

### Vercel 前端 URL（如果已部署）

1. 访问：https://vercel.com/dashboard
2. 点击您的项目
3. URL 显示在项目页面
4. 格式：`https://apologize-frontend-xxxx.vercel.app`

---

## 现在开始

**推荐流程**：

```bash
# 1. 运行交互式诊断
./diagnose-now.sh

# 2. 按提示输入您的 URL

# 3. 查看诊断结果和修复建议

# 4. 如果需要详细指导
cat QUICK_DEPLOYMENT_GUIDE.md
```

---

## 我可以帮您什么？

请告诉我：

1. **您的 Render 后端 URL 是什么？**
   - 我可以立即帮您运行诊断

2. **您是否已部署前端到 Vercel？**
   - 如果是，前端 URL 是什么？

3. **您遇到的具体问题是什么？**
   - 前端无法连接？
   - CORS 错误？
   - LLM 服务不可用？

提供这些信息后，我可以为您定制诊断和解决方案！🚀
