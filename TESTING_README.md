# 测试工具和指南

本项目包含了全面的测试工具和指南，用于验证 Gemini API 配置和前后端集成。

## 📁 文件索引

### 文档
1. **E2E_TESTING_GUIDE.md** - 完整的端到端测试指南
   - 详细的测试步骤
   - 故障排除清单
   - 测试报告模板

2. **API_DEBUGGING_SUMMARY.md** - API 调试总结
   - 问题分析
   - 修复方案
   - 系统架构图

3. **GEMINI_CONFIGURATION_GUIDE.md** - Gemini 配置指南
   - Gemini API Key 获取步骤
   - Render 环境变量配置
   - 验证和故障排除

4. **RENDER_CONFIGURATION.md** - Render 配置指南
   - 支持多种 LLM providers
   - 通用环境变量配置

### 测试工具

1. **browser-e2e-test.html** - 浏览器端到端测试工具 🌟 **推荐使用**
   - 图形化界面
   - 一键测试所有端点
   - 实时结果显示
   - 支持测试 Gemini API 和后端 API

2. **backend/test-gemini-api.cjs** - Gemini API Key 测试工具
   - 命令行工具
   - 测试 API key 有效性
   - 测试模型列表和内容生成
   - 速率限制检查

3. **backend/test-api-connection.cjs** - 后端 API 连接测试
   - 命令行工具
   - 测试所有后端端点
   - 健康检查分析
   - 彩色输出

4. **backend/tests/llm-integration.test.ts** - LLM 集成测试套件
   - Vitest 测试套件
   - 全面的 LLM 功能测试
   - 配置、健康检查、聊天完成、道歉生成等
   - 性能和错误处理测试

---

## 🚀 快速开始

### 方法 1: 使用浏览器测试工具（最简单）

1. **打开测试工具**
   ```bash
   # 在浏览器中打开
   open browser-e2e-test.html
   # 或者双击文件
   ```

2. **配置参数**
   - 后端 API 地址已预设为: `https://apologize-is-all-you-need.onrender.com`
   - Gemini API Key 已预填（如需更改请修改）

3. **运行测试**
   - 点击"🚀 运行所有测试"按钮
   - 或单独测试:
     - "🔑 测试 Gemini Key" - 仅测试 Gemini API
     - "🔧 测试后端 API" - 仅测试后端端点

4. **查看结果**
   - ✓ 绿色 = 通过
   - ✗ 红色 = 失败
   - 点击展开查看详细响应数据

### 方法 2: 使用命令行工具

#### 测试 Gemini API Key
```bash
cd backend
node test-gemini-api.cjs AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM
```

#### 测试后端 API 连接
```bash
node backend/test-api-connection.cjs https://apologize-is-all-you-need.onrender.com
```

#### 运行 LLM 集成测试（需要环境变量）
```bash
cd backend
export GEMINI_API_KEY=AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM
export LLM_PROVIDER=gemini
npm test -- llm-integration.test.ts
```

### 方法 3: 使用浏览器开发者工具

1. 打开浏览器，按 F12 打开开发者工具
2. 切换到 "Console" 标签
3. 复制粘贴以下代码：

```javascript
// 快速测试脚本
async function quickTest() {
  const baseUrl = 'https://apologize-is-all-you-need.onrender.com';

  // 1. 测试健康检查
  console.log('1️⃣ 测试健康检查...');
  const health = await fetch(`${baseUrl}/api/health`).then(r => r.json());
  console.log('  API:', health.services.api);
  console.log('  LLM:', health.services.llm);
  console.log('  Provider:', health.config.provider);

  // 2. 测试 LLM 健康
  console.log('\n2️⃣ 测试 LLM 健康...');
  const llmHealth = await fetch(`${baseUrl}/api/health/llm`).then(r => r.json());
  console.log('  Status:', llmHealth.status);
  console.log('  Response Time:', llmHealth.responseTime);

  // 3. 测试聊天
  console.log('\n3️⃣ 测试聊天功能...');
  const chat = await fetch(`${baseUrl}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '我今天迟到了', style: 'gentle' })
  }).then(r => r.json());
  console.log('  Reply:', chat.reply?.substring(0, 50) + '...');
  console.log('  Tokens:', chat.tokensUsed);

  console.log('\n✅ 所有测试完成！');
  return { health, llmHealth, chat };
}

// 运行测试
quickTest();
```

---

## 📊 测试检查清单

### Gemini API Key 测试

- [ ] ✅ List models: PASS (能列出可用模型)
- [ ] ✅ Generate content: PASS (能生成内容)
- [ ] ✅ Rate limit: PASS (无速率限制问题)

**如果失败**: 检查 API key 是否正确，是否启用了 Generative Language API

### 后端 API 测试

- [ ] ✅ `/` 返回 200，包含服务信息
- [ ] ✅ `/api/health` 返回 200，`services.api` 为 "healthy"
- [ ] ✅ `/api/health` 中 `services.llm` 为 "healthy"
- [ ] ✅ `/api/health` 中 `config.configured` 为 true
- [ ] ✅ `/api/health/llm` 返回 200，`status` 为 "healthy"
- [ ] ✅ `/api/auth/status` 返回 200，包含认证状态
- [ ] ✅ `/api/chat/message` 返回 200，包含 `reply` 字段
- [ ] ✅ 聊天回复为中文内容
- [ ] ✅ 返回 `tokensUsed` 大于 0

**如果失败**: 查看 E2E_TESTING_GUIDE.md 的故障排除部分

### 前端集成测试

- [ ] ✅ 访问 https://apologize-is-all-you-need-web.vercel.app 成功加载
- [ ] ✅ 健康状态指示器显示绿色
- [ ] ✅ 点击健康指示器查看详情，显示"后端服务: 正常"和"LLM服务: 正常"
- [ ] ✅ 可以输入消息
- [ ] ✅ 可以发送消息
- [ ] ✅ 收到 AI 回复
- [ ] ✅ 回复为中文道歉内容
- [ ] ✅ 显示 token 使用量

---

## 🔍 预期结果

### 1. Gemini API Key 测试成功

```
============================================================
Gemini API Key Tester
============================================================
API Key: AIzaSyCa8P...7teM

Test 1: List Available Models
------------------------------------------------------------
✓ Success: API key is valid
  Found 5+ models

Test 2: Generate Content (Chat Completion)
------------------------------------------------------------
✓ Success: Content generated
  Response time: <2000ms
  Tokens used: >0
  Response: "你好！..."

Test 3: Rate Limit Check
------------------------------------------------------------
  Results: 3/3 requests successful
  ✓ No rate limiting issues detected

Overall: ✓ ALL TESTS PASSED
============================================================
```

### 2. 后端 Health API 成功

```json
{
  "status": "healthy",
  "services": {
    "api": "healthy",
    "llm": "healthy"
  },
  "config": {
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "baseURL": "https://generativelanguage.googleapis.com/v1beta",
    "configured": true
  }
}
```

### 3. 后端 Chat API 成功

```json
{
  "sessionId": "uuid-here",
  "reply": "对不起，我迟到了。我知道这给你带来了不便...",
  "emotion": "guilt",
  "style": "gentle",
  "tokensUsed": 156,
  "timestamp": "2025-11-16T..."
}
```

### 4. 前端界面正常

- 🟢 健康指示器显示绿色
- ✅ 可以正常发送和接收消息
- ✅ 消息显示在聊天区域
- ✅ 回复内容为中文道歉

---

## ❌ 常见问题

### 问题 1: Gemini API 测试失败

**症状**: `EAI_AGAIN` 或 `Network Error`

**原因**:
- 网络无法访问 Google API
- DNS 解析失败
- 防火墙阻止

**解决方案**:
1. 确保网络可以访问 `generativelanguage.googleapis.com`
2. 尝试使用浏览器测试工具（browser-e2e-test.html）
3. 或在可访问外网的环境运行测试

### 问题 2: 后端 Health API 返回 llm: "unavailable"

**症状**: `/api/health` 中 `services.llm` 为 "unavailable"

**原因**:
- Render 上未配置 `GEMINI_API_KEY`
- API key 配置错误
- API key 无效

**解决方案**:
1. 登录 Render Dashboard
2. 检查环境变量 `GEMINI_API_KEY`
3. 确认值正确（应以 "AIza" 开头）
4. 保存后重新部署

### 问题 3: 聊天 API 返回 500 错误

**症状**: POST `/api/chat/message` 返回 500

**原因**:
- LLM 服务无法连接
- API 配额用尽
- API key 无效

**解决方案**:
1. 查看 Render 日志获取详细错误
2. 使用浏览器工具测试 Gemini API key
3. 检查 API 配额: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

### 问题 4: 前端无法连接后端

**症状**: 健康指示器显示红色，"无法连接到后端服务"

**原因**:
- Render 服务休眠（免费层）
- CORS 配置错误
- Vercel 环境变量未配置

**解决方案**:
1. 访问 `https://apologize-is-all-you-need.onrender.com/` 唤醒服务
2. 检查 Render `CORS_ORIGIN` 是否包含前端 URL
3. 检查 Vercel `VITE_API_URL` 是否正确

---

## 📖 详细文档

### 阅读顺序建议

1. **首次配置**: 阅读 `GEMINI_CONFIGURATION_GUIDE.md`
2. **遇到问题**: 查看 `API_DEBUGGING_SUMMARY.md`
3. **完整测试**: 参考 `E2E_TESTING_GUIDE.md`
4. **其他 Provider**: 查看 `RENDER_CONFIGURATION.md`

### 工具使用建议

1. **快速验证**: 使用 `browser-e2e-test.html`
2. **详细诊断**: 使用命令行工具 `test-gemini-api.cjs` 和 `test-api-connection.cjs`
3. **开发测试**: 运行集成测试套件 `llm-integration.test.ts`

---

## 🎯 成功标准

当以下所有条件满足时，表示系统已正确配置并运行：

### Gemini API
- ✅ API key 有效
- ✅ 可以列出模型
- ✅ 可以生成内容
- ✅ 无速率限制问题

### 后端 API
- ✅ `/api/health` 返回 200，llm 状态为 "healthy"
- ✅ `/api/health/llm` 返回 200，status 为 "healthy"
- ✅ `/api/chat/message` 返回 200，包含中文回复

### 前端集成
- ✅ 页面正常加载
- ✅ 健康指示器显示绿色
- ✅ 可以发送消息并收到回复
- ✅ 回复内容为中文道歉

### 性能
- ✅ API 响应时间 < 10 秒
- ✅ 页面加载时间 < 3 秒

---

## 💡 提示

- 使用 **browser-e2e-test.html** 进行快速测试，无需安装任何依赖
- 在 Render Dashboard 的 Logs 页面可以实时查看后端日志
- 使用浏览器开发者工具的 Network 标签可以查看前端请求详情
- 如果遇到问题，按照 E2E_TESTING_GUIDE.md 的故障排除部分逐步检查

---

**最后更新**: 2025-11-16
**维护者**: Claude

---

## 📞 获取帮助

如果测试失败或遇到问题：

1. **查看文档**: 从上述文档列表中找到相关指南
2. **查看日志**: Render Dashboard → Logs
3. **运行诊断**: 使用 browser-e2e-test.html 或命令行工具
4. **检查配置**: 确认所有环境变量正确设置

祝测试顺利！🎉
