import crypto from 'node:crypto';
import path from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import getConfig, { SERVICE_ROOT } from './config.js';
import { loadKnowledge } from './knowledge.js';
import { clearTtsConfigIfChanged, prewarmTtsCache } from './tts.js';
import healthRoutes from './routes/health.js';
import chatRoutes from './routes/chat.js';
import ttsRoutes from './routes/tts.js';
import { defaultCostTracker } from './guards.js';

export async function buildApp() {
  const cfg = getConfig();

  const fastify = Fastify({
    logger: {
      level: 'info',
      // Pino logs JSON to stdout by default
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            hostname: req.hostname,
            remoteAddress: req.ip,
          };
        },
      },
    },
    genReqId(req) {
      return req.headers['x-request-id'] || crypto.randomUUID();
    },
    requestIdHeader: 'x-request-id',
    trustProxy: cfg.TRUST_PROXY,
  });

  // CORS configuration strictly matching Python ALLOWED_ORIGINS + Netlify preview regex
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (cfg.ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      if (/^https:\/\/.*\.netlify\.app$/.test(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['*'],
  });

  // Per-request logging and X-Request-ID propagation
  fastify.addHook('onRequest', async (request, reply) => {
    request.log.info(`Incoming request: ${request.method} ${request.url}`);
  });

  fastify.addHook('onResponse', async (request, reply) => {
    reply.header('X-Request-ID', request.id);
    request.log.info(
      `Completed request: ${request.method} ${request.url} status=${reply.statusCode}`
    );
  });

  // Custom error handler guaranteeing { error: { code, message } } format
  fastify.setErrorHandler((error, request, reply) => {
    reply.header('X-Request-ID', request.id);

    if (error.validation) {
      for (const err of error.validation) {
        if (err.params?.missingProperty === 'message' || err.instancePath.includes('message')) {
          return reply.code(400).send({
            error: {
              code: 'too_long',
              message: 'Message is invalid or empty.',
            },
          });
        }
      }
      return reply.code(400).send({
        error: {
          code: 'too_long',
          message: error.message || 'Validation error',
        },
      });
    }

    const statusCode = error.statusCode || 500;
    if (statusCode === 429) {
      return reply.code(429).send({
        error: {
          code: 'rate_limited',
          message: error.message || 'Rate limit exceeded.',
        },
      });
    }

    if (statusCode === 400) {
      return reply.code(400).send({
        error: {
          code: 'too_long',
          message: error.message || 'Bad request.',
        },
      });
    }

    request.log.error(`Unhandled exception during request ${request.method} ${request.url}: ${error.message}`);
    return reply.code(statusCode >= 400 && statusCode < 600 ? statusCode : 503).send({
      error: {
        code: 'unavailable',
        message: 'The chatbot service is temporarily unavailable. Please try again in a moment.',
      },
    });
  });

  // Register API routers
  await fastify.register(healthRoutes);
  await fastify.register(chatRoutes);
  await fastify.register(ttsRoutes);

  // Live Cost & Token Tracker endpoint matching Python /api/cost
  fastify.get('/api/cost', async (request, reply) => {
    const sessionId = request.query?.session_id || null;
    const metrics = await defaultCostTracker.getMetrics(sessionId, cfg);
    return metrics;
  });

  return fastify;
}

export async function startServer() {
  const cfg = getConfig();
  const fastify = await buildApp();

  fastify.log.info(`Starting Chatbot Service (${cfg.APP_ENV})`);

  // Load knowledge base at startup
  const knowledgeDir = path.resolve(SERVICE_ROOT, 'knowledge');
  try {
    loadKnowledge(knowledgeDir);
  } catch (err) {
    fastify.log.error(`Failed to load knowledge base at startup: ${err.message}`);
    process.exit(1);
  }

  // Clear TTS cache if configuration changed and prewarm welcome greeting
  try {
    clearTtsConfigIfChanged(cfg, fastify.log);
    prewarmTtsCache(cfg, fastify.log);
  } catch (err) {
    fastify.log.warn(`Error checking TTS cache at startup: ${err.message}`);
  }

  const port = cfg.PORT || 8001;
  const host = '0.0.0.0';

  try {
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown handling
  const shutdown = async () => {
    fastify.log.info('Shutting down Chatbot Service');
    await fastify.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return fastify;
}

// Auto-start when executed directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export default startServer;
