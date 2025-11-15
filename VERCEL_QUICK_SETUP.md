# 您的 Vercel 自动部署配置信息

## 📋 配置信息总结

根据您提供的信息，以下是您需要在 GitHub 中配置的三个密钥：

### GitHub Secrets 配置

| Secret 名称 | Secret 值 |
|------------|-----------|
| `VERCEL_TOKEN` | `6i1w23yPz9e7V4pa5QRFk8EH` |
| `VERCEL_ORG_ID` | `team_1BnK6azSM80DNnlN1ZdtBO0s` |
| `VERCEL_PROJECT_ID` | `prj_WyLKUlzu7mOTvYkHuRRuzYU6yNhn` |

### Vercel 项目信息

- **项目名称**: `apologize-is-all-you-need-web`
- **团队 ID**: `team_1BnK6azSM80DNnlN1ZdtBO0s`
- **项目 ID**: `prj_WyLKUlzu7mOTvYkHuRRuzYU6yNhn`

---

## 🚀 配置步骤

### 第一步：在 GitHub 添加 Secrets（3分钟）

1. **打开 GitHub 仓库**
   ```
   https://github.com/zlrrr/apologize-is-all-you-need
   ```

2. **进入 Settings**
   - 点击仓库顶部的 "Settings" 选项卡

3. **进入 Secrets 页面**
   - 在左侧边栏找到 "Secrets and variables"
   - 点击展开，选择 "Actions"

4. **添加三个 Secrets**

   #### Secret 1: VERCEL_TOKEN
   - 点击 "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Secret: `6i1w23yPz9e7V4pa5QRFk8EH`
   - 点击 "Add secret"

   #### Secret 2: VERCEL_ORG_ID
   - 点击 "New repository secret"
   - Name: `VERCEL_ORG_ID`
   - Secret: `team_1BnK6azSM80DNnlN1ZdtBO0s`
   - 点击 "Add secret"

   #### Secret 3: VERCEL_PROJECT_ID
   - 点击 "New repository secret"
   - Name: `VERCEL_PROJECT_ID`
   - Secret: `prj_WyLKUlzu7mOTvYkHuRRuzYU6yNhn`
   - 点击 "Add secret"

5. **验证配置**
   - 应该可以看到三个 secrets 已添加
   - ✅ VERCEL_TOKEN
   - ✅ VERCEL_ORG_ID
   - ✅ VERCEL_PROJECT_ID

---

### 第二步：在 Vercel 配置环境变量（5分钟）

1. **打开 Vercel 项目**
   - 访问: https://vercel.com/dashboard
   - 找到项目 `apologize-is-all-you-need-web`
   - 点击进入

2. **进入环境变量设置**
   - 点击顶部的 "Settings" 选项卡
   - 在左侧边栏找到 "Environment Variables"

3. **添加 Gemini API 配置**

   #### 变量 1: LLM_PROVIDER
   - Key: `LLM_PROVIDER`
   - Value: `gemini`
   - Environment: 勾选 ✅ Production, ✅ Preview, ✅ Development
   - 点击 "Save"

   #### 变量 2: GEMINI_API_KEY
   - Key: `GEMINI_API_KEY`
   - Value: `AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM`
   - Environment: 勾选 ✅ Production, ✅ Preview, ✅ Development
   - 点击 "Save"

   #### 变量 3: GEMINI_MODEL
   - Key: `GEMINI_MODEL`
   - Value: `gemini-1.5-flash`
   - Environment: 勾选 ✅ Production, ✅ Preview, ✅ Development
   - 点击 "Save"

4. **添加可选配置（推荐）**

   #### LLM_TEMPERATURE
   - Key: `LLM_TEMPERATURE`
   - Value: `0.7`
   - Environment: 勾选全部
   - 点击 "Save"

   #### LLM_MAX_TOKENS
   - Key: `LLM_MAX_TOKENS`
   - Value: `500`
   - Environment: 勾选全部
   - 点击 "Save"

   #### NODE_ENV
   - Key: `NODE_ENV`
   - Value: `production`
   - Environment: 仅勾选 ✅ Production
   - 点击 "Save"

---

### 第三步：触发自动部署（1分钟）

配置完成后，推送代码到 GitHub 将自动触发部署：

```bash
# 进入项目目录
cd /home/user/apologize-is-all-you-need

# 创建一个测试提交来触发部署
git commit --allow-empty -m "Trigger Vercel deployment"

# 推送到远程仓库（触发部署）
git push origin main
```

**注意**: 如果您的主分支是 `master`，请将 `main` 改为 `master`

---

## 📊 监控部署进度

### 在 GitHub 查看

1. 打开 GitHub 仓库
2. 点击顶部的 "Actions" 选项卡
3. 您会看到 "Deploy to Vercel" 工作流正在运行
4. 点击进入查看详细日志

### 在 Vercel 查看

1. 访问: https://vercel.com/dashboard
2. 进入 `apologize-is-all-you-need-web` 项目
3. 点击 "Deployments" 选项卡
4. 查看最新的部署状态

---

## ✅ 部署成功后

部署完成后（通常 2-5 分钟）：

1. **获取部署 URL**
   - 在 Vercel Dashboard 中，点击 "Visit" 按钮
   - 或者在 Deployments 中点击最新部署的 URL

2. **测试应用**
   - 访问您的部署 URL
   - 在聊天框输入消息测试 Gemini API
   - 例如："我今天心情不好"

3. **设置自定义域名**（可选）
   - Vercel Dashboard → Settings → Domains
   - 添加您的自定义域名

---

## 🎯 环境变量配置总结

您的 Vercel 项目应该有以下环境变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `LLM_PROVIDER` | `gemini` | All |
| `GEMINI_API_KEY` | `AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM` | All |
| `GEMINI_MODEL` | `gemini-1.5-flash` | All |
| `LLM_TEMPERATURE` | `0.7` | All |
| `LLM_MAX_TOKENS` | `500` | All |
| `NODE_ENV` | `production` | Production only |

---

## 🔧 故障排除

### GitHub Actions 失败

**如果看到错误**: "No existing credentials found"

**解决方法**:
1. 检查 GitHub Secrets 是否都已添加
2. 确保 Secret 名称完全一致（区分大小写）
3. 确保 Secret 值正确无误

### Vercel 部署失败

**查看错误日志**:
1. Vercel Dashboard → 项目 → Deployments
2. 点击失败的部署
3. 查看 "Build Logs" 或 "Runtime Logs"

**常见问题**:
- 环境变量未设置：检查 Vercel Environment Variables
- API Key 无效：确认 Gemini API Key 正确
- 构建错误：查看构建日志中的具体错误信息

### Gemini API 不工作

1. **验证 API Key**: 访问 https://makersuite.google.com/app/apikey
2. **检查配额**: 访问 https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
3. **查看运行时日志**: Vercel → Deployments → 最新部署 → Runtime Logs

---

## 📞 需要帮助？

如果遇到问题，请：
1. 查看本指南的"故障排除"部分
2. 检查 GitHub Actions 和 Vercel 的错误日志
3. 随时询问我获取帮助

---

**配置完成！现在每次推送代码都会自动部署到 Vercel！** 🚀
