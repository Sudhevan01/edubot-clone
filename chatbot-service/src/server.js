import crypto from 'node:crypto';
import path from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
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
    ajv: {
      customOptions: {
        strict: false,
      },
    },
    logger: {
      level: 'info',
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

  // Swagger and OpenAPI documentation
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Landing Page Chatbot Backend',
        description: 'Fastify service serving landing page visitor chatbot.',
        version: '0.1.0',
      },
      tags: [
        { name: 'Health', description: 'Service health check endpoints' },
        { name: 'Chat', description: 'Chatbot message processing endpoints' },
        { name: 'TTS', description: 'Speech synthesis and audio caching endpoints' },
        { name: 'Cost & Token Tracker', description: 'Real-time token metrics and spend cap tracking' },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // CORS configuration strictly matching Python ALLOWED_ORIGINS + Netlify preview regex + Swagger UI local origin
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const port = cfg.PORT || 8001;
      const isLocalhost =
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://[::1]') ||
        origin.includes(`:${port}`) ||
        (cfg.APP_ENV === 'development' && (
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://172.')
        ));
      if (
        isLocalhost ||
        cfg.ALLOWED_ORIGINS.includes(origin) ||
        /^https:\/\/.*\.netlify\.app$/.test(origin)
      ) {
        return cb(null, true);
      }
      return cb(null, false);
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
  fastify.get('/api/cost', {
    schema: {
      description: 'Returns real-time live metrics on tokens consumed (total, input, output), daily expenditure vs budget cap, remaining pending budget, and session-specific token usage.',
      tags: ['Cost & Token Tracker'],
      summary: 'Live Cost & Token Tracker',
      querystring: {
        type: 'object',
        properties: {
          session_id: { type: 'string', description: 'Optional session UUID' },
        },
      },
    },
  }, async (request, reply) => {
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
    fastify.log.info(`Swagger UI available at http://localhost:${port}/docs`);
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
