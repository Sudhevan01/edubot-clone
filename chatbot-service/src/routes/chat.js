import { z } from 'zod';
import getConfig from '../config.js';
import { getPageByKey } from '../knowledge.js';
import { buildSystemPrompt, GeminiLLMClient } from '../llm.js';
import { cleanTextForTTS } from '../tts.js';
import {
  InputValidationError,
  cleanVoiceInput,
  validateInput,
  getClientIp,
  defaultRateLimiter,
  RateLimitExceeded,
  defaultCostTracker,
  SpendCapExceeded,
} from '../guards.js';
import { defaultHistoryStore } from '../history.js';

let sharedLlmClient = null;

function getLlmClient(logger) {
  if (!sharedLlmClient) {
    sharedLlmClient = new GeminiLLMClient(null, null, logger);
  } else if (logger && !sharedLlmClient.logger) {
    sharedLlmClient.logger = logger;
  }
  return sharedLlmClient;
}

const chatSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required.'),
  message: z.string(),
  input_mode: z.enum(['text', 'voice']).default('text'),
});

export default async function chatRoutes(fastify) {
  fastify.post('/api/chat', async (request, reply) => {
    const cfg = getConfig();
    const body = request.body || {};

    // Validate body structure
    if (typeof body !== 'object' || body === null) {
      return reply.code(400).send({
        error: {
          code: 'too_long',
          message: 'Message is invalid or empty.',
        },
      });
    }

    if (!('message' in body) || typeof body.message !== 'string') {
      return reply.code(400).send({
        error: {
          code: 'too_long',
          message: 'Message is invalid or empty.',
        },
      });
    }

    if (!body.session_id || typeof body.session_id !== 'string') {
      return reply.code(422).send({
        detail: [{ loc: ['body', 'session_id'], msg: 'Field required', type: 'value_error' }],
      });
    }

    if (body.input_mode !== undefined && body.input_mode !== 'text' && body.input_mode !== 'voice') {
      return reply.code(422).send({
        detail: [
          {
            loc: ['body', 'input_mode'],
            msg: "Input should be 'text' or 'voice'",
            type: 'enum',
          },
        ],
      });
    }

    const sessionId = body.session_id;
    const inputMode = body.input_mode || 'text';

    // 1. Input Sanitization & Length Validation
    let cleanMessage = '';
    try {
      cleanMessage = validateInput(body.message);
      if (inputMode === 'voice') {
        cleanMessage = cleanVoiceInput(cleanMessage);
        if (!cleanMessage) {
          throw new InputValidationError('empty', 'Message must not be empty.');
        }
      }
    } catch (err) {
      if (err instanceof InputValidationError) {
        return reply.code(400).send({
          error: {
            code: 'too_long',
            message: err.message,
          },
        });
      }
      return reply.code(400).send({
        error: {
          code: 'too_long',
          message: 'Message is invalid or empty.',
        },
      });
    }

    // 2. Check Daily Spend Cap
    try {
      await defaultCostTracker.checkCap(cfg, request.log);
    } catch (err) {
      if (err instanceof SpendCapExceeded) {
        return reply.code(503).send({
          error: {
            code: 'unavailable',
            message: err.message,
          },
        });
      }
      throw err;
    }

    // 3. Rate Limiting Check
    const clientIp = getClientIp(request, cfg.TRUST_PROXY);
    try {
      await defaultRateLimiter.checkAndIncrement(clientIp, sessionId, cfg);
    } catch (err) {
      if (err instanceof RateLimitExceeded) {
        return reply.code(429).send({
          error: {
            code: 'rate_limited',
            message: err.message,
          },
        });
      }
      throw err;
    }

    const startTime = performance.now();

    try {
      // 4. Build system prompt and load history
      const systemPrompt = buildSystemPrompt(cfg, inputMode);
      const history = await defaultHistoryStore.getHistory(sessionId);

      // 5. Call LLM Client
      const llmClient = getLlmClient(request.log);
      const llmResp = await llmClient.generateResponse(systemPrompt, history, cleanMessage);

      // 6. Record Token Usage Cost
      const turnCost = await defaultCostTracker.recordUsage(
        llmResp.input_tokens,
        llmResp.output_tokens,
        cfg,
        sessionId,
        request.log
      );

      // 7. Determine answer_type and map page / actions / suggestions
      const answerType = ['answered', 'not_found', 'off_topic'].includes(llmResp.answer_type)
        ? llmResp.answer_type
        : 'answered';

      let pageObj = null;
      if (answerType === 'not_found') {
        const contactPage = getPageByKey('contact');
        if (contactPage) {
          pageObj = {
            key: contactPage.key,
            label: contactPage.label,
            url: contactPage.url,
          };
        }
      } else if (answerType === 'answered' && llmResp.page_key) {
        const page = getPageByKey(llmResp.page_key);
        if (page) {
          pageObj = {
            key: page.key,
            label: page.label,
            url: page.url,
          };
        }
      }

      let actions = [];
      if (answerType === 'answered') {
        if (pageObj) {
          actions.push({
            type: 'navigate',
            label: `View ${pageObj.label}`,
            url: pageObj.url,
            value: null,
            subject: null,
          });
        }
      } else if (answerType === 'not_found') {
        actions.push({
          type: 'navigate',
          label: 'View Contact',
          url: '/contact',
          value: null,
          subject: null,
        });
        actions.push({
          type: 'email',
          label: 'Email the school',
          value: cfg.SCHOOL_EMAIL,
          subject: 'Question from website',
          url: null,
        });
      } else if (answerType === 'off_topic') {
        actions = [];
      }

      let suggestions = [];
      const sugConfig = cfg.SUGGESTIONS_CONFIG;
      if (Array.isArray(llmResp.suggestion_keys)) {
        for (const k of llmResp.suggestion_keys) {
          const text = sugConfig[k];
          if (answerType === 'not_found' && (k === 'contact' || text?.toLowerCase().includes('contact'))) {
            continue;
          }
          if (text && !suggestions.includes(text)) {
            suggestions.push(text);
            if (suggestions.length === 3) break;
          }
        }
      }

      if (answerType === 'not_found' || answerType === 'off_topic') {
        const fallbackCandidates = ['benefits', 'about', 'product', 'docs'];
        for (const k of fallbackCandidates) {
          if (suggestions.length >= 3) break;
          const text = sugConfig[k];
          if (answerType === 'not_found' && (k === 'contact' || text?.toLowerCase().includes('contact'))) {
            continue;
          }
          if (text && !suggestions.includes(text)) {
            suggestions.push(text);
          }
        }
      }

      if (answerType === 'not_found') {
        suggestions = suggestions.filter((s) => !s.toLowerCase().includes('contact'));
      }

      // 8. Save turn to history
      await defaultHistoryStore.addTurn(sessionId, cleanMessage, llmResp.answer);

      // 9. Calculate latency and log metrics (DO NOT log full message text at INFO level)
      const latencyMs = Number((performance.now() - startTime).toFixed(2));
      request.log.info(
        `Chat processed: input_mode=${inputMode} answer_type=${answerType} ` +
        `question_len=${cleanMessage.length} page_key=${llmResp.page_key} ` +
        `latency_ms=${latencyMs} input_tokens=${llmResp.input_tokens} ` +
        `output_tokens=${llmResp.output_tokens} cost_usd=$${turnCost.toFixed(6)}`
      );

      const spokenText = cleanTextForTTS(llmResp.answer);

      return {
        answer: llmResp.answer,
        answer_type: answerType,
        page: pageObj,
        actions,
        suggestions,
        spoken_text: spokenText,
      };
    } catch (exc) {
      const latencyMs = Number((performance.now() - startTime).toFixed(2));
      request.log.error(
        `Error processing chat for session ${sessionId} after ${latencyMs}ms: ${exc.message}`
      );

      return reply.code(503).send({
        error: {
          code: 'unavailable',
          message: 'The chatbot service is temporarily unavailable. Please try again in a moment.',
        },
      });
    }
  });
}
