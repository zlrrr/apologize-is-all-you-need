# Vercel 自动部署完全指南（零基础）

本指南将手把手教您如何将项目自动部署到 Vercel，即使您从未使用过 GitHub Actions 或 Vercel。

## 📋 前提条件

您需要准备：
- ✅ 一个 Vercel 账号（您已有）
- ✅ 一个 GitHub 账号
- ✅ 项目已经推送到 GitHub
- ✅ Gemini API Key（您已提供）
- ✅ 电脑上安装了 Node.js

## 🎯 部署流程概览

整个流程分为三个主要步骤：
1. **在本地配置 Vercel**（10 分钟）
2. **在 GitHub 配置密钥**（5 分钟）
3. **在 Vercel 配置环境变量**（5 分钟）

完成后，每次推送代码到 GitHub，都会自动部署到 Vercel！

---

## 第一步：在本地配置 Vercel

### 1.1 安装 Vercel CLI

打开终端（Terminal / 命令提示符），运行：

```bash
npm install -g vercel@latest
```

等待安装完成，您会看到类似 `added 1 package` 的提示。

### 1.2 登录 Vercel

在终端运行：

```bash
vercel login
```

会提示您选择登录方式：
```
Vercel CLI
? Log in to Vercel
  Continue with GitHub
  Continue with GitLab
  Continue with Bitbucket
> Continue with Email
```

**选择您注册 Vercel 时使用的方式**（通常是 Email 或 GitHub）。

如果选择 Email：
1. 输入您的邮箱地址
2. Vercel 会发送一封验证邮件
3. 打开邮件，点击验证链接
4. 回到终端，看到 `Success!` 表示登录成功

### 1.3 切换到项目目录

```bash
cd /path/to/apologize-is-all-you-need
```

将 `/path/to/` 替换为您的项目实际路径。

### 1.4 关联项目到 Vercel

运行：

```bash
vercel link
```

**您会看到一系列问题，请按照以下方式回答：**

#### 问题 1: Set up and deploy?
```
? Set up and deploy "~/apologize-is-all-you-need"? [Y/n]
```
**回答：** 按 `Y` 或直接按回车

#### 问题 2: Which scope?
```
? Which scope do you want to deploy to?
> Your Name
  team-xxx (if you have teams)
```
**回答：** 选择您的个人账号（通常是第一个选项），按回车

#### 问题 3: Link to existing project?
```
? Link to existing project? [y/N]
```
**回答：** 按 `N` 或直接按回车（创建新项目）

#### 问题 4: What's your project's name?
```
? What's your project's name? (apologize-is-all-you-need)
```
**回答：** 直接按回车（使用默认名称），或输入您想要的名称

#### 问题 5: In which directory is your code located?
```
? In which directory is your code located? ./
```
**回答：** 直接按回车（使用当前目录）

**完成！** 您会看到：
```
✅ Linked to your-name/apologize-is-all-you-need (created .vercel)
```

这表示项目已成功关联到 Vercel。

### 1.5 获取项目凭证

运行以下命令查看项目信息：

```bash
cat .vercel/project.json
```

您会看到类似这样的内容：

```json
{
  "orgId": "team_xxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxx"
}
```

**📝 重要：请复制这两个值**
- `orgId`: 组织 ID（以 `team_` 开头）
- `projectId`: 项目 ID（以 `prj_` 开头）

将它们保存到记事本，稍后需要使用。

### 1.6 创建 Vercel Token

1. **打开浏览器**，访问：https://vercel.com/account/tokens

2. **点击 "Create" 按钮**

3. **填写 Token 信息：**
   - **Token Name**: 输入 `GitHub Actions Deployment`（或任何您喜欢的名字）
   - **Scope**: 选择您的账号（通常已默认选中）
   - **Expiration**: 选择 `No Expiration`（永不过期）

4. **点击 "CREATE TOKEN" 按钮**

5. **立即复制 Token**
   - 会显示一个以 `vercel_` 开头的长字符串
   - **⚠️ 重要：立即复制保存！关闭页面后将无法再看到**
   - 将它保存到记事本

现在您应该有三个值：
- ✅ `orgId` (team_xxx...)
- ✅ `projectId` (prj_xxx...)
- ✅ `VERCEL_TOKEN` (vercel_xxx...)

---

## 第二步：在 GitHub 配置密钥

现在需要将这三个密钥添加到 GitHub 仓库中。

### 2.1 打开 GitHub 仓库

1. 打开浏览器，访问您的 GitHub 仓库：
   ```
   https://github.com/您的用户名/apologize-is-all-you-need
   ```

2. 点击仓库顶部的 **"Settings"**（设置）选项卡

### 2.2 进入 Secrets 设置

1. 在左侧边栏找到 **"Secrets and variables"**
2. 点击展开，选择 **"Actions"**
3. 您会看到 "Actions secrets" 页面

### 2.3 添加第一个密钥：VERCEL_TOKEN

1. 点击右上角的 **"New repository secret"** 按钮

2. 填写表单：
   - **Name**: 输入 `VERCEL_TOKEN`
   - **Secret**: 粘贴您之前复制的 Vercel token（vercel_xxx...）

3. 点击 **"Add secret"** 按钮

### 2.4 添加第二个密钥：VERCEL_ORG_ID

1. 再次点击 **"New repository secret"** 按钮

2. 填写表单：
   - **Name**: 输入 `VERCEL_ORG_ID`
   - **Secret**: 粘贴您之前复制的 orgId（team_xxx...）

3. 点击 **"Add secret"** 按钮

### 2.5 添加第三个密钥：VERCEL_PROJECT_ID

1. 再次点击 **"New repository secret"** 按钮

2. 填写表单：
   - **Name**: 输入 `VERCEL_PROJECT_ID`
   - **Secret**: 粘贴您之前复制的 projectId（prj_xxx...）

3. 点击 **"Add secret"** 按钮

**完成！** 现在您应该看到三个密钥：
- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID

---

## 第三步：在 Vercel 配置环境变量（配置 Gemini API）

现在需要在 Vercel 中配置您的 Gemini API Key。

### 3.1 打开 Vercel Dashboard

1. 访问：https://vercel.com/dashboard

2. 找到您的项目 `apologize-is-all-you-need`，点击进入

### 3.2 进入环境变量设置

1. 点击顶部的 **"Settings"**（设置）选项卡

2. 在左侧边栏找到 **"Environment Variables"**（环境变量）

### 3.3 添加 LLM 提供商配置

#### 变量 1: LLM_PROVIDER

1. 点击 **"Add New"** 或输入框
2. **Key**: 输入 `LLM_PROVIDER`
3. **Value**: 输入 `gemini`
4. **Environment**: 勾选所有选项（Production, Preview, Development）
5. 点击 **"Save"** 或 **"Add"** 按钮

#### 变量 2: GEMINI_API_KEY

1. 再次点击 **"Add New"**
2. **Key**: 输入 `GEMINI_API_KEY`
3. **Value**: 粘贴您的 Gemini API Key: `AIzaSyCa8PRvwO5cz4Ns-qan1f2DLz5QtEt7teM`
4. **Environment**: 勾选所有选项
5. 点击 **"Save"**

#### 变量 3: GEMINI_MODEL

1. 再次点击 **"Add New"**
2. **Key**: 输入 `GEMINI_MODEL`
3. **Value**: 输入 `gemini-1.5-flash`（推荐，速度快且免费）
   - 或者使用 `gemini-1.5-pro`（更强大但可能有费用）
4. **Environment**: 勾选所有选项
5. 点击 **"Save"**

#### 可选变量（建议添加）:

**LLM_TEMPERATURE**:
- Key: `LLM_TEMPERATURE`
- Value: `0.7`

**LLM_MAX_TOKENS**:
- Key: `LLM_MAX_TOKENS`
- Value: `500`

**NODE_ENV**:
- Key: `NODE_ENV`
- Value: `production`

---

## 第四步：测试自动部署

现在一切就绪！让我们测试自动部署。

### 4.1 推送代码触发部署

在项目目录中，运行：

```bash
git add .
git commit -m "Test Vercel auto-deployment"
git push origin main
```

**注意**：如果您的主分支是 `master`，请将 `main` 改为 `master`

### 4.2 查看部署进度

#### 在 GitHub 查看

1. 打开您的 GitHub 仓库
2. 点击顶部的 **"Actions"** 选项卡
3. 您会看到一个名为 "Deploy to Vercel" 的工作流正在运行
4. 点击进入可以查看详细日志

#### 在 Vercel 查看

1. 打开 https://vercel.com/dashboard
2. 点击您的项目
3. 在 "Deployments" 选项卡中，您会看到新的部署正在进行

### 4.3 等待部署完成

部署通常需要 2-5 分钟。完成后：

- GitHub Actions 会显示绿色的 ✅ 勾选标记
- Vercel 会显示 "Ready"

### 4.4 访问您的网站

1. 在 Vercel 项目页面，点击 **"Visit"** 按钮
2. 或者点击最新部署旁边的 URL
3. 您的应用现在已经在线了！🎉

URL 通常类似：`https://apologize-is-all-you-need-xxx.vercel.app`

### 4.5 测试 Gemini 集成

1. 打开您的部署网站
2. 在聊天框中输入一条消息，比如："我今天心情不好"
3. 如果收到 AI 的回复，说明 Gemini API 配置成功！

---

## 🔧 常见问题排查

### 问题 1: GitHub Actions 失败，显示 "no credentials found"

**原因**：GitHub Secrets 没有正确配置

**解决方法**：
1. 检查 GitHub Secrets 是否都已添加（VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID）
2. 确保名称完全一致（区分大小写）
3. 重新创建一个新的 Vercel Token 并更新

### 问题 2: 部署成功但网站无法工作

**原因**：环境变量没有配置

**解决方法**：
1. 检查 Vercel 环境变量是否已添加
2. 确保 `GEMINI_API_KEY` 正确
3. 在 Vercel Dashboard → Settings → Environment Variables 中验证

### 问题 3: Gemini API 返回错误

**可能的原因和解决方法**：

#### API Key 无效
- 访问 https://makersuite.google.com/app/apikey 确认 API Key 是否有效
- 确保 API Key 已启用 Generative Language API

#### API 配额超限
- 检查您的 Google Cloud Console 配额
- Gemini 免费版有请求限制

#### 网络问题
- 某些地区可能无法访问 Google API
- 检查 Vercel 部署日志查看具体错误

### 问题 4: 如何查看错误日志？

**在 Vercel 查看运行时日志**：
1. Vercel Dashboard → 您的项目
2. 点击 "Deployments"
3. 点击最新的部署
4. 点击 "Functions" 或 "Runtime Logs"
5. 查看详细错误信息

**在 GitHub Actions 查看构建日志**：
1. GitHub 仓库 → Actions
2. 点击失败的工作流
3. 点击失败的步骤查看详细日志

---

## 🎉 成功！接下来做什么？

### 自动部署已配置完成

现在，每次您向 GitHub 推送代码时：
1. GitHub Actions 会自动触发
2. 代码会自动构建
3. 自动部署到 Vercel
4. 您会收到新的部署 URL

### 自定义域名（可选）

想使用自己的域名？

1. Vercel Dashboard → 您的项目 → Settings → Domains
2. 输入您的域名
3. 按照提示配置 DNS

### 监控使用情况

- **Vercel 使用情况**: https://vercel.com/dashboard/usage
- **Google Cloud 配额**: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

### 成本估算

- **Vercel**: Hobby 计划免费（100GB 带宽/月）
- **Gemini API**:
  - gemini-1.5-flash: 每天 1500 次请求免费
  - gemini-1.5-pro: 每天 50 次请求免费

---

## 📞 需要帮助？

如果遇到问题：
1. 检查本指南的"常见问题排查"部分
2. 查看 GitHub Actions 和 Vercel 的错误日志
3. 在项目 Issues 中提问：https://github.com/您的用户名/apologize-is-all-you-need/issues

---

**恭喜！您已经成功配置了自动部署！** 🚀

现在您可以专注于开发，每次推送代码，网站都会自动更新。
