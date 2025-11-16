import { Router, Request, Response } from 'express';
import { llmService } from '../services/llm.service.js';
import logger from '../utils/logger.js';
import os from 'os';

const router = Router();

/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const llmHealthy = await llmService.healthCheck();
    const config = llmService.getConfig();

    // Check if LLM is properly configured
    const isLLMConfigured = config.baseURL && config.baseURL.length > 0;

    const health = {
      status: llmHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        api: 'healthy',
        llm: llmHealthy ? 'healthy' : 'unavailable',
      },
      config: {
        provider: config.provider,
        model: config.model,
        baseURL: config.baseURL,
        configured: isLLMConfigured,
      },
      diagnostics: isLLMConfigured ? undefined : {
        message: 'LLM provider not configured. Please set LLM_PROVIDER environment variable and corresponding credentials.',
        suggestions: [
          'For OpenAI: Set LLM_PROVIDER=openai, OPENAI_API_KEY, OPENAI_MODEL',
          'For Anthropic: Set LLM_PROVIDER=anthropic, ANTHROPIC_API_KEY, ANTHROPIC_MODEL',
          'For Gemini: Set LLM_PROVIDER=gemini, GEMINI_API_KEY, GEMINI_MODEL',
          'For Custom: Set LLM_PROVIDER=custom, CUSTOM_BASE_URL, CUSTOM_API_KEY, CUSTOM_MODEL',
        ],
      },
    };

    // Always return 200 for API health check - the service is running
    // LLM status is informational only
    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * GET /api/health/detailed
 * Detailed health check with system metrics
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const llmHealthy = await llmService.healthCheck();
    const config = llmService.getConfig();

    // System metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const health = {
      status: llmHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: process.uptime(),
        formatted: formatUptime(process.uptime()),
      },
      services: {
        api: {
          status: 'healthy',
          version: process.env.npm_package_version || '0.1.0',
        },
        llm: {
          status: llmHealthy ? 'healthy' : 'unavailable',
          provider: config.provider,
          model: config.model,
          baseURL: config.baseURL,
        },
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        memory: {
          total: `${Math.round(totalMem / 1024 / 1024)} MB`,
          free: `${Math.round(freeMem / 1024 / 1024)} MB`,
          used: `${Math.round(usedMem / 1024 / 1024)} MB`,
          usagePercent: `${Math.round((usedMem / totalMem) * 100)}%`,
        },
        loadAverage: os.loadavg(),
      },
      process: {
        pid: process.pid,
        memoryUsage: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(process.memoryUsage().external / 1024 / 1024)} MB`,
        },
      },
    };

    // Always return 200 - service is running, LLM status is informational
    res.status(200).json(health);
  } catch (error) {
    logger.error('Detailed health check failed', { error });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * GET /api/health/llm
 * LLM-specific health check
 */
router.get('/llm', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const isHealthy = await llmService.healthCheck();
    const responseTime = Date.now() - startTime;
    const config = llmService.getConfig();

    // Check if LLM is properly configured
    const isLLMConfigured = config.baseURL && config.baseURL.length > 0;

    const llmHealth: any = {
      status: isHealthy ? 'healthy' : 'unavailable',
      timestamp: new Date().toISOString(),
      provider: config.provider,
      model: config.model,
      baseURL: config.baseURL,
      responseTime: `${responseTime}ms`,
      diagnostics: {
        canConnect: isHealthy,
        timeout: config.timeout,
        configured: isLLMConfigured,
      },
    };

    // Try to get models if healthy
    if (isHealthy) {
      try {
        const models = await llmService.getModels();
        llmHealth.diagnostics.availableModels = models?.data?.length || 0;
      } catch (error) {
        logger.warn('Failed to get models list', { error });
      }
    } else if (!isLLMConfigured) {
      // Provide configuration guidance
      llmHealth.diagnostics.message = 'LLM provider not configured. Please set environment variables.';
      llmHealth.diagnostics.suggestions = [
        'For OpenAI: Set LLM_PROVIDER=openai, OPENAI_API_KEY, OPENAI_MODEL',
        'For Anthropic: Set LLM_PROVIDER=anthropic, ANTHROPIC_API_KEY, ANTHROPIC_MODEL',
        'For Gemini: Set LLM_PROVIDER=gemini, GEMINI_API_KEY, GEMINI_MODEL',
        'For Custom: Set LLM_PROVIDER=custom, CUSTOM_BASE_URL, CUSTOM_API_KEY, CUSTOM_MODEL',
      ];
    }

    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(llmHealth);
  } catch (error) {
    logger.error('LLM health check failed', { error });
    res.status(503).json({
      status: 'unavailable',
      timestamp: new Date().toISOString(),
      error: 'LLM service unreachable',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Helper function to format uptime
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export default router;
