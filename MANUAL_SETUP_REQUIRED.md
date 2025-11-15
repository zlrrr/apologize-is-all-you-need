# 人工配置指南 - 只需配置一次

本文档列出了所有需要人工操作的配置步骤。**完成这些配置后，所有后续部署将完全自动化。**

---

## 📋 人工操作清单

### ✅ 需要人工配置的内容（一次性）

只需要配置 **GitHub Secrets**，Vercel 环境变量将由 GitHub Actions 自动同步！

---

## 🔧 人工配置步骤

### 步骤 1: 在 GitHub 添加 Secrets（必需）

访问：https://github.com/zlrrr/apologize-is-all-you-need/settings/secrets/actions

**必需的 Secrets（Vercel 凭证）：**

1. **VERCEL_TOKEN**
   - Name: `VERCEL_TOKEN`
   - Secret: `6i1w23yPz9e7V4pa5QRFk8EH`

2. **VERCEL_ORG_ID**
   - Name: `VERCEL_ORG_ID`
   - Secret: `team_1BnK6azSM80DNnlN1ZdtBO0s`

3. **VERCEL_PROJECT_ID**
   - Name: `VERCEL_PROJECT_ID`
   - Secret: `prj_WyLKUlzu7mOTvYkHuRRuzYU6yNhn`

**必需的 Secrets（LLM 配置 - 使用 Gemini）：**

4. **LLM_PROVIDER**
   - Name: `LLM_PROVIDER`
   - Secret: `gemini`

5. **GEMINI_API_KEY**
   - Name: `GEMINI_API_KEY`
   - Secret: `AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM`

6. **GEMINI_MODEL**
   - Name: `GEMINI_MODEL`
   - Secret: `gemini-1.5-flash`

**可选的 Secrets（推荐添加）：**

7. **LLM_TEMPERATURE**
   - Name: `LLM_TEMPERATURE`
   - Secret: `0.7`

8. **LLM_MAX_TOKENS**
   - Name: `LLM_MAX_TOKENS`
   - Secret: `500`

---

### 步骤 2: 触发首次部署

配置完所有 GitHub Secrets 后，推送代码触发部署：

```bash
# 推送到 main 分支触发自动部署
git push origin main
```

---

## ✅ 完成！后续操作完全自动化

配置完成后，GitHub Actions 将自动：

1. ✅ **自动同步环境变量到 Vercel** - 从 GitHub Secrets 读取并设置到 Vercel
2. ✅ **自动构建项目** - 编译前端和后端
3. ✅ **自动部署到 Vercel** - 部署到生产环境
4. ✅ **自动设置 NODE_ENV** - 生产环境自动设置为 production
5. ✅ **PR 评论部署链接** - Pull Request 会自动评论部署 URL

### 自动化流程说明

每次推送代码到 `main` 或 `master` 分支时：

```
1. GitHub Actions 启动
   ↓
2. 检查 Secrets 是否配置
   ↓
3. 从 GitHub Secrets 自动同步环境变量到 Vercel
   ↓
4. 构建项目
   ↓
5. 部署到 Vercel
   ↓
6. 完成！访问部署 URL
```

---

## 📊 配置状态检查

### 如何验证配置是否正确

**1. 检查 GitHub Secrets**

访问：https://github.com/zlrrr/apologize-is-all-you-need/settings/secrets/actions

应该看到至少以下 6 个 Secrets：
- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID
- ✅ LLM_PROVIDER
- ✅ GEMINI_API_KEY
- ✅ GEMINI_MODEL

**2. 检查 GitHub Actions**

访问：https://github.com/zlrrr/apologize-is-all-you-need/actions

- 应该看到 "Deploy to Vercel" 工作流
- 最新运行状态应该是 ✅ 绿色勾选

**3. 检查 Vercel 部署**

访问：https://vercel.com/team_1BnK6azSM80DNnlN1ZdtBO0s/apologize-is-all-you-need-web/deployments

- 应该看到最新的部署
- 状态应该是 "Ready"

**4. 测试应用**

访问 Vercel 提供的部署 URL，测试聊天功能：
- 输入消息："我今天心情不好"
- 应该收到 Gemini AI 的回复

---

## 🔄 更新配置

如果需要更改 LLM 提供商或 API Key：

### 方法 1: 更新 GitHub Secrets（推荐）

1. 访问：https://github.com/zlrrr/apologize-is-all-you-need/settings/secrets/actions
2. 点击要更新的 Secret
3. 点击 "Update secret"
4. 输入新值
5. 保存
6. 推送任意代码触发重新部署（环境变量会自动同步）

### 方法 2: 手动更新 Vercel（不推荐）

访问 Vercel Dashboard 手动更新（下次 GitHub Actions 运行时会被覆盖）

---

## 🚨 故障排除

### 问题 1: GitHub Actions 失败

**查看日志**：
1. 访问：https://github.com/zlrrr/apologize-is-all-you-need/actions
2. 点击失败的工作流
3. 查看错误信息

**常见原因**：
- ❌ GitHub Secrets 未配置或配置错误
- ❌ Vercel Token 过期或无效
- ❌ 网络问题

**解决方法**：
- 检查所有 Secrets 是否正确配置
- 重新生成 Vercel Token 并更新

### 问题 2: 部署成功但应用不工作

**查看 Vercel 日志**：
1. 访问：https://vercel.com/team_1BnK6azSM80DNnlN1ZdtBO0s/apologize-is-all-you-need-web
2. 点击最新部署
3. 查看 "Runtime Logs"

**常见原因**：
- ❌ Gemini API Key 无效
- ❌ 环境变量未正确同步
- ❌ API 配额超限

**解决方法**：
- 验证 Gemini API Key：https://makersuite.google.com/app/apikey
- 检查配额：https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
- 查看 Vercel 环境变量是否正确

### 问题 3: 环境变量未同步

**手动触发同步**：
```bash
# 创建空提交触发 GitHub Actions
git commit --allow-empty -m "Sync environment variables"
git push origin main
```

---

## 📞 需要帮助？

如果遇到问题：
1. 查看本文档的"故障排除"部分
2. 检查 GitHub Actions 日志
3. 检查 Vercel 部署日志
4. 随时询问获取帮助

---

## 🎯 总结

### 需要人工操作的内容（一次性）

✅ **只需在 GitHub 添加 Secrets**（6-8 个）

### 完全自动化的内容（无需手动操作）

✅ Vercel 环境变量同步 - 自动从 GitHub Secrets 同步
✅ 项目构建 - 自动编译
✅ 部署到 Vercel - 自动部署
✅ 环境配置 - 自动设置 Production/Preview 环境
✅ PR 评论 - 自动评论部署链接

**配置一次，永久自动化！** 🚀
