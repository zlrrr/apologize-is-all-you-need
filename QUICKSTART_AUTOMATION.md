# 快速开始：自动化部署配置（5分钟完成）

## 🎯 目标

完成一次性配置后，实现：
- ✅ 推送代码自动部署到 Vercel
- ✅ 环境变量自动从 GitHub 同步到 Vercel
- ✅ 无需再手动操作 Vercel 控制台

---

## ⚡ 快速配置（只需 5 分钟）

### 第 1 步：添加 GitHub Secrets（5 分钟）

访问：https://github.com/zlrrr/apologize-is-all-you-need/settings/secrets/actions

点击 **"New repository secret"** 按钮，依次添加以下 **6 个** secrets：

#### Vercel 凭证（3 个）

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | `6i1w23yPz9e7V4pa5QRFk8EH` |
| `VERCEL_ORG_ID` | `team_1BnK6azSM80DNnlN1ZdtBO0s` |
| `VERCEL_PROJECT_ID` | `prj_WyLKUlzu7mOTvYkHuRRuzYU6yNhn` |

#### LLM 配置（3 个）

| Name | Value |
|------|-------|
| `LLM_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | `AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM` |
| `GEMINI_MODEL` | `gemini-1.5-flash` |

#### 可选配置（推荐添加）

| Name | Value |
|------|-------|
| `LLM_TEMPERATURE` | `0.7` |
| `LLM_MAX_TOKENS` | `500` |

---

### 第 2 步：推送代码触发部署（1 分钟）

```bash
# 推送到 main 分支
git push origin main
```

**就这么简单！** 🎉

---

## 📊 查看部署进度

### 在 GitHub 查看

访问：https://github.com/zlrrr/apologize-is-all-you-need/actions

- 看到 "Deploy to Vercel" 工作流正在运行
- 等待显示绿色 ✅ 完成

### 在 Vercel 查看

访问：https://vercel.com/team_1BnK6azSM80DNnlN1ZdtBO0s/apologize-is-all-you-need-web

- 看到新的部署正在进行
- 等待状态变为 "Ready"

---

## ✅ 部署完成后

1. **访问您的网站**
   - 在 Vercel Dashboard 点击 "Visit" 按钮
   - 或访问部署 URL（类似：https://apologize-is-all-you-need-web-xxx.vercel.app）

2. **测试应用**
   - 在聊天框输入："我今天心情不好"
   - 应该收到 Gemini AI 的回复

3. **享受自动化**
   - 以后每次推送代码，都会自动部署！
   - 无需再手动配置任何东西！

---

## 🔄 自动化流程说明

### 每次推送代码时自动发生：

```
代码推送到 GitHub
    ↓
GitHub Actions 自动启动
    ↓
自动同步环境变量到 Vercel
    ↓
自动构建项目
    ↓
自动部署到 Vercel
    ↓
完成！网站自动更新
```

### 自动同步的环境变量：

GitHub Actions 会自动将以下 Secrets 同步到 Vercel：

- ✅ `LLM_PROVIDER` → Vercel 生产环境和预览环境
- ✅ `GEMINI_API_KEY` → Vercel 生产环境和预览环境
- ✅ `GEMINI_MODEL` → Vercel 生产环境和预览环境
- ✅ `LLM_TEMPERATURE` → Vercel 生产环境和预览环境
- ✅ `LLM_MAX_TOKENS` → Vercel 生产环境和预览环境
- ✅ `NODE_ENV=production` → Vercel 生产环境

**无需手动在 Vercel 控制台配置任何环境变量！**

---

## 🔧 更改配置

如需更改 LLM 提供商或 API Key：

1. **更新 GitHub Secrets**
   - 访问：https://github.com/zlrrr/apologize-is-all-you-need/settings/secrets/actions
   - 更新对应的 Secret

2. **推送代码**
   ```bash
   git commit --allow-empty -m "Update configuration"
   git push origin main
   ```

3. **自动生效**
   - GitHub Actions 自动同步新的环境变量到 Vercel
   - 自动重新部署

---

## 🎯 检查清单

配置完成后，确认以下内容：

- [ ] GitHub Secrets 已添加（至少 6 个）
- [ ] 代码已推送到 GitHub
- [ ] GitHub Actions 显示绿色 ✅（部署成功）
- [ ] Vercel 部署状态为 "Ready"
- [ ] 访问网站可以正常聊天

---

## 📞 遇到问题？

查看详细故障排除指南：[MANUAL_SETUP_REQUIRED.md](./MANUAL_SETUP_REQUIRED.md)

---

**恭喜！您的自动化部署已配置完成！** 🚀

现在您可以专注于开发，每次推送代码都会自动部署到 Vercel！
