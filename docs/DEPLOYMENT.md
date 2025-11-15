# Deployment Guide

This guide covers deploying the Apologize Is All You Need application to production.

## Table of Contents

- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Environment Variables](#environment-variables)
- [Manual Deployment](#manual-deployment)
- [Troubleshooting](#troubleshooting)

## Vercel Deployment (Recommended)

### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/cli) installed: `npm install -g vercel`
3. Your LLM API keys (OpenAI, Anthropic, or other)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Fork/Clone the repository** to your GitHub account

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

3. **Click "Add New Project"**

4. **Import your repository**

5. **Configure the project:**
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm run install:all`

6. **Add Environment Variables** (see [Environment Variables](#environment-variables) section below)

7. **Click "Deploy"**

8. **Your app will be live!** 🎉

### Option 2: Deploy via Vercel CLI

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy to production:**
   ```bash
   vercel --prod
   ```

3. **Follow the prompts** to link your project

4. **Add environment variables** via Vercel dashboard or CLI:
   ```bash
   vercel env add LLM_PROVIDER
   vercel env add OPENAI_API_KEY  # or other provider keys
   ```

### Option 3: Auto-deploy with GitHub Actions

This repository includes a GitHub Actions workflow for automatic deployment.

1. **Set up Vercel project** (via dashboard or CLI first time)

2. **Get your Vercel tokens:**
   ```bash
   # Get your Vercel token from https://vercel.com/account/tokens
   # Get your Org ID and Project ID:
   vercel link
   cat .vercel/project.json
   ```

3. **Add GitHub Secrets:**
   Go to your GitHub repository → Settings → Secrets and add:
   - `VERCEL_TOKEN`: Your Vercel token
   - `VERCEL_ORG_ID`: Your organization ID
   - `VERCEL_PROJECT_ID`: Your project ID

4. **Push to main/master branch** - deployment will trigger automatically!

## Environment Variables

### Required Variables

Configure these in your Vercel project settings:

#### LLM Provider Configuration

**For OpenAI:**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

**For Anthropic Claude:**
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**For Local LM Studio (not recommended for production):**
```bash
LLM_PROVIDER=lm-studio
LM_STUDIO_URL=http://your-server-url:1234
```

**For Custom OpenAI-compatible API:**
```bash
LLM_PROVIDER=custom
CUSTOM_API_KEY=your-api-key-here
CUSTOM_BASE_URL=https://your-api-url.com/v1
CUSTOM_MODEL=your-model-name
```

### Optional Variables

```bash
# Server Configuration
BACKEND_PORT=5001
BACKEND_HOST=localhost

# Frontend API URL (auto-configured on Vercel)
VITE_API_URL=/api

# LLM Settings
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=500

# Session Secret
SESSION_SECRET=your-random-secret-here
```

### Setting Environment Variables on Vercel

**Via Dashboard:**
1. Go to your project on Vercel
2. Click Settings → Environment Variables
3. Add each variable with appropriate values
4. Redeploy if needed

**Via CLI:**
```bash
vercel env add VARIABLE_NAME production
# Enter value when prompted
```

## Manual Deployment

### Build Locally

```bash
# Install dependencies
npm run install:all

# Build frontend and backend
npm run build

# The built files will be in:
# - frontend/dist (static files)
# - backend/dist (compiled backend)
```

### Deploy to Other Platforms

#### Static Hosting (Netlify, Cloudflare Pages, etc.)

For frontend only:
```bash
cd frontend
npm run build
# Upload the 'dist' folder to your hosting provider
```

#### Node.js Hosting (Heroku, Railway, Render, etc.)

For full-stack deployment:

1. **Ensure all environment variables are set**
2. **Deploy the entire repository**
3. **Build command**: `npm run build`
4. **Start command**: `cd backend && npm start`
5. **Set PORT from environment**: Update backend to use `process.env.PORT`

## Backend Deployment Options

### Option A: Deploy Backend Separately

If you want to deploy backend and frontend separately:

**Backend** (Railway, Render, Fly.io, etc.):
```bash
cd backend
npm install
npm run build
npm start
```

**Frontend** (Vercel, Netlify, etc.):
- Set `VITE_API_URL` to your backend URL
- Deploy the `frontend` folder

### Option B: Serverless Functions (Vercel)

The included `vercel.json` configures the backend as serverless functions.

**Note**: Serverless functions have cold start times. For better performance, consider deploying backend separately on a always-on Node.js host.

## Vercel Configuration Explained

The `vercel.json` file configures:

- **Build settings**: Builds both frontend and backend
- **Routing**: Routes `/api/*` to backend, everything else to frontend
- **Environment**: Production environment variables

## Post-Deployment

After deploying:

1. **Test the deployment:**
   - Visit your Vercel URL
   - Send a test message
   - Verify LLM responses

2. **Monitor usage:**
   - Check Vercel analytics
   - Monitor LLM API usage
   - Watch for errors in Vercel logs

3. **Set up custom domain** (optional):
   - Go to Vercel project settings
   - Add your custom domain
   - Follow DNS configuration steps

## Troubleshooting

### Build Failures

**Error: "Command failed: npm run build"**
- Check that all dependencies are installed
- Verify Node.js version (>= 18)
- Check build logs for specific errors

**TypeScript errors:**
```bash
# Run locally to see full error details
npm run build:frontend
npm run build:backend
```

### Runtime Errors

**"Cannot connect to LLM"**
- Verify environment variables are set correctly
- Check API key is valid
- Ensure provider is set correctly (`LLM_PROVIDER`)

**CORS errors:**
- Frontend and backend must be on same domain OR
- Update CORS settings in `backend/src/server.ts`

**404 on refresh:**
- Vercel should handle this automatically with the config
- Verify `vercel.json` routing is correct

### Environment Variable Issues

**Changes not taking effect:**
1. Update environment variables in Vercel dashboard
2. Trigger a new deployment (redeploy)
3. Hard refresh browser (Ctrl+Shift+R)

### Performance Issues

**Slow API responses:**
- Check LLM provider status
- Consider upgrading LLM model tier
- Monitor Vercel function execution time

**Cold starts:**
- Serverless functions have cold start latency
- Consider deploying backend to always-on hosting
- Use Vercel Pro for lower cold start times

## Security Considerations

1. **Never commit API keys** to the repository
2. **Use environment variables** for all secrets
3. **Rotate API keys** regularly
4. **Monitor API usage** to detect unauthorized access
5. **Set up rate limiting** if needed
6. **Use HTTPS** always (Vercel provides this automatically)

## Cost Estimates

### Vercel
- **Hobby (Free)**: 100GB bandwidth, serverless functions included
- **Pro ($20/month)**: More bandwidth, better performance

### LLM API Costs
- **OpenAI GPT-4o-mini**: ~$0.15/1M input tokens, ~$0.60/1M output tokens
- **Anthropic Claude 3.5 Sonnet**: ~$3/1M input tokens, ~$15/1M output tokens
- **LM Studio**: Free (runs locally, but not suitable for production hosting)

**Estimated monthly costs** (for moderate usage ~10k messages/month):
- Hosting: $0-20 (Vercel)
- LLM API: $5-50 (depending on provider and usage)

## Support

For issues or questions:
- Check [GitHub Issues](https://github.com/turtacn/apologize-is-all-you-need/issues)
- Review [Vercel Documentation](https://vercel.com/docs)
- Check LLM provider documentation

---

**Happy Deploying!** 🚀
