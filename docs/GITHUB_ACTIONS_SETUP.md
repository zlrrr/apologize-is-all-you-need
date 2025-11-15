# GitHub Actions Setup Guide for Vercel Deployment

This guide will help you set up automatic deployment to Vercel using GitHub Actions.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your project already pushed to GitHub
3. Terminal access for running Vercel CLI commands

## Step-by-Step Setup

### Step 1: Install Vercel CLI

```bash
npm install -g vercel@latest
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate with your Vercel account.

### Step 3: Link Your Project to Vercel

Navigate to your project directory and run:

```bash
cd /path/to/your/project
vercel link
```

You'll be asked several questions:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (unless you already created one)
- **What's your project's name?** → Press Enter to use the default or type a custom name
- **In which directory is your code located?** → Press Enter (current directory)

This creates a `.vercel` directory with project configuration.

### Step 4: Get Your Vercel Credentials

After linking, get your project details:

```bash
cat .vercel/project.json
```

You'll see something like:
```json
{
  "orgId": "team_xxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxx"
}
```

**Save these values** - you'll need them for GitHub secrets.

### Step 5: Create a Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Give it a name like `GitHub Actions`
4. Set scope to your account/team
5. Set expiration (recommended: No Expiration for production)
6. Click **"Create"**
7. **Copy the token immediately** (you won't be able to see it again)

### Step 6: Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the following three secrets:

#### Secret 1: VERCEL_TOKEN
- **Name**: `VERCEL_TOKEN`
- **Value**: The token you just created (starts with something like `A9Qx...`)
- Click **"Add secret"**

#### Secret 2: VERCEL_ORG_ID
- **Name**: `VERCEL_ORG_ID`
- **Value**: The `orgId` from `.vercel/project.json` (e.g., `team_xxxxxxxxxxxx`)
- Click **"Add secret"**

#### Secret 3: VERCEL_PROJECT_ID
- **Name**: `VERCEL_PROJECT_ID`
- **Value**: The `projectId` from `.vercel/project.json` (e.g., `prj_xxxxxxxxxxxx`)
- Click **"Add secret"**

### Step 7: Configure Environment Variables in Vercel (LLM API Keys)

Since your app needs LLM API keys, configure them in Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add your LLM provider variables:

**For OpenAI:**
```
Name: LLM_PROVIDER
Value: openai

Name: OPENAI_API_KEY
Value: your-openai-api-key-here

Name: OPENAI_MODEL
Value: gpt-4o-mini
```

**For Anthropic:**
```
Name: LLM_PROVIDER
Value: anthropic

Name: ANTHROPIC_API_KEY
Value: your-anthropic-api-key-here

Name: ANTHROPIC_MODEL
Value: claude-3-5-sonnet-20241022
```

**Other recommended variables:**
```
Name: LLM_TEMPERATURE
Value: 0.7

Name: LLM_MAX_TOKENS
Value: 500

Name: NODE_ENV
Value: production
```

**Important**: Make sure to set these for the **"Production"** environment.

### Step 8: Test the Workflow

Now push a commit to the `main` or `master` branch:

```bash
git add .
git commit -m "Test GitHub Actions deployment"
git push origin main
```

### Step 9: Monitor the Deployment

1. Go to your GitHub repository
2. Click the **Actions** tab
3. You should see a workflow run for "Deploy to Vercel"
4. Click on it to see the progress
5. If successful, you'll see a green checkmark ✅

## Troubleshooting

### Error: "No existing credentials found"

This means the `VERCEL_TOKEN` secret is not set or is incorrect.

**Solution:**
1. Verify the secret exists in GitHub Settings → Secrets
2. Make sure the token is valid (create a new one if needed)
3. Check for extra spaces in the token value

### Error: "Project not found"

This means `VERCEL_ORG_ID` or `VERCEL_PROJECT_ID` is incorrect.

**Solution:**
1. Run `cat .vercel/project.json` again to verify the IDs
2. Update the GitHub secrets with the correct values
3. Make sure there are no typos

### Workflow doesn't run

**Check:**
1. The workflow file is at `.github/workflows/vercel-deploy.yml`
2. You're pushing to `main` or `master` branch
3. The secrets are set correctly

### Build fails

**Check:**
1. Your project builds locally: `npm run build`
2. All dependencies are in `package.json`
3. Environment variables are set in Vercel dashboard
4. Check the error logs in the Actions tab

### Deployment succeeds but app doesn't work

**Check:**
1. Environment variables in Vercel (especially LLM API keys)
2. Your API keys are valid
3. Check Vercel deployment logs for runtime errors
4. Visit your Vercel dashboard → Deployments → click on latest → check logs

## Verify Deployment

After successful deployment:

1. Go to your Vercel dashboard
2. Find your project
3. Click on the latest deployment
4. Click **"Visit"** to see your live site
5. Test the chat functionality

## Disabling Auto-Deployment

If you want to disable automatic deployment:

1. Go to `.github/workflows/vercel-deploy.yml`
2. Delete the file or rename it to `vercel-deploy.yml.disabled`
3. Commit and push the change

## Manual Deployment Alternative

If you prefer manual deployment instead of GitHub Actions:

```bash
# Deploy to production
vercel --prod

# Or just deploy (preview)
vercel
```

## Security Notes

1. **Never commit** the `.vercel` directory to Git (it's in `.gitignore`)
2. **Never commit** API keys or tokens
3. **Rotate tokens** if they're ever exposed
4. Use **environment variables** for all secrets
5. Set token expiration appropriately

## Support

If you encounter issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Check project issues on GitHub

---

**Setup Complete!** 🎉 Your project will now automatically deploy to Vercel on every push to main/master.
