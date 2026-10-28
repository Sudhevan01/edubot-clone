import { GoogleGenAI } from '@google/genai';
import getConfig from './config.js';
import { getKnowledgeContent } from './knowledge.js';

export const SYSTEM_PROMPT_TEMPLATE = `You are {bot_name}, the AI assistant for {school_name}.

YOUR ROLE:
Answer visitor questions about {school_name} strictly and exclusively using the knowledge provided below.

RULES AND CONSTRAINTS:
1. ANSWER SOURCE: Base your answers ONLY on the provided knowledge content. Never invent facts, fees, dates, features, or promises not explicitly mentioned.
2. ANSWER LENGTH & STYLE: Keep every answer concise, between 2 and 4 sentences long, in simple, clear, and friendly English. Do NOT use em dashes. Never use technical terms like "knowledge base" or "database" in your answer text.
3. LANGUAGE COMPREHENSION: Understand informal Indian English, short forms, typos, and common spelling mistakes (e.g., "wat r the benifits" -> benefits).
4. UNANSWERABLE / MISSING INFORMATION (answer_type = "not_found"):
   If the requested information is not found in the knowledge content, set answer_type to "not_found".
   Set page_key to "contact". Provide a polite, natural response explaining that you do not have that information right now and that the visitor can reach the school directly using the options below. Do NOT include specific email addresses or phone numbers in your text.
5. OFF-TOPIC REQUESTS (answer_type = "off_topic"):
   If the query is off-topic (such as general knowledge, coding, math, world capitals, creative writing, politics, or personal questions), set answer_type to "off_topic".
   Set page_key to null. Politely decline the query and guide the visitor back to asking about {school_name}.
6. ANSWERED REQUESTS (answer_type = "answered"):
   If you can answer the question using the knowledge content, set answer_type to "answered".
7. STRUCTURED OUTPUT FIELDS:
   - Output JSON matching the schema: "answer", "page_key", "answer_type", and "suggestion_keys".
   - page_key: "home", "product", "docs", "about", "contact", "benefits", or null.
   - suggestion_keys: Select 2 or 3 relevant keys from ["benefits", "about", "product", "contact", "docs"] to suggest follow-up queries.

==================== KNOWLEDGE BASE CONTENT ====================
{knowledge_content}
================================================================
`;

export const VOICE_INPUT_INSTRUCTION =
  '\nVOICE TRANSCRIPT HANDLING:\n' +
  'The user message is a speech transcript that may have no punctuation, ' +
  'filler words, repeated words, or misheard words that sound similar to ' +
  'the intended word. Interpret the most likely intended meaning using ' +
  'the website content.\n';

export function buildSystemPrompt(settings = null, inputMode = 'text') {
  const cfg = settings || getConfig();
  const knowledgeContent = getKnowledgeContent();

  let prompt = SYSTEM_PROMPT_TEMPLATE.replace(/\{bot_name\}/g, cfg.BOT_NAME)
    .replace(/\{school_name\}/g, cfg.SCHOOL_NAME)
    .replace(/\{knowledge_content\}/g, knowledgeContent);

  if (inputMode === 'voice') {
    prompt = VOICE_INPUT_INSTRUCTION + prompt;
  }

  return prompt;
}

const geminiResponseSchema = {
  type: 'OBJECT',
  properties: {
    answer: {
      type: 'STRING',
      description: '2 to 4 sentence clear, friendly answer based only on knowledge.md',
    },
    page_key: {
      type: 'STRING',
      nullable: true,
      description: 'Page key from: home, product, docs, about, contact, benefits, or null if no page is relevant',
    },
    answer_type: {
      type: 'STRING',
      enum: ['answered', 'not_found', 'off_topic'],
      description: 'One of: answered, not_found, off_topic',
    },
    suggestion_keys: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      nullable: true,
      description: 'List of up to 3 keys chosen from: benefits, about, product, contact, docs',
    },
  },
  required: ['answer', 'answer_type'],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, errorMsg = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    ),
  ]);
}

export class GeminiLLMClient {
  constructor(apiKey = null, modelName = null, logger = null) {
    const cfg = getConfig();
    this.apiKey = apiKey || cfg.GEMINI_API_KEY;
    this.modelName = modelName || cfg.GEMINI_MODEL;
    this.logger = logger;
    this._ai = null;
    this._cachedContentName = null;
    this._cachedPrompt = null;
    this._cacheFailed = false;
  }

  _getClient() {
    if (!this._ai) {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY is missing or empty');
      }
      this._ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this._ai;
  }

  async _createContextCacheIfSupported(ai, systemPrompt) {
    if (this._cacheFailed) {
      return null;
    }

    if (this._cachedContentName && this._cachedPrompt === systemPrompt) {
      return this._cachedContentName;
    }

    try {
      const cache = await ai.caches.create({
        model: this.modelName,
        config: {
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          ttl: '1800s',
        },
      });
      if (cache && cache.name) {
        this._cachedContentName = cache.name;
        this._cachedPrompt = systemPrompt;
        if (this.logger) {
          this.logger.info(`Created Gemini context cache: ${cache.name}`);
        }
        return cache.name;
      }
    } catch (err) {
      this._cacheFailed = true;
      if (this.logger) {
        this.logger.debug(`Context caching not used/supported for model ${this.modelName}: ${err.message}`);
      }
    }
    return null;
  }

  async generateResponse(systemPrompt, history = [], userMessage = '') {
    const ai = this._getClient();

    const contents = [];
    for (const msg of history) {
      const role = msg.role === 'user' ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const cachedName = await this._createContextCacheIfSupported(ai, systemPrompt);

    const config = {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: geminiResponseSchema,
    };

    if (cachedName) {
      config.cachedContent = cachedName;
    } else {
      config.systemInstruction = systemPrompt;
    }

    const candidateModels = [this.modelName];
    for (const alt of [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
    ]) {
      if (!candidateModels.includes(alt)) {
        candidateModels.push(alt);
      }
    }

    const maxAttempts = candidateModels.length + 1;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const currentModel = candidateModels[Math.min(attempt - 1, candidateModels.length - 1)];
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: currentModel,
            contents,
            config,
          }),
          16000,
          `Gemini request timed out after 16s on ${currentModel}`
        );

        const rawText = response.text || '';
        let answerText = '';
        let pageKey = null;
        let answerType = 'answered';
        let suggestionKeys = null;

        try {
          const data = JSON.parse(rawText);
          if (data && typeof data === 'object') {
            answerText = String(data.answer || '').trim();
            const rawKey = data.page_key;
            if (typeof rawKey === 'string' && rawKey.trim()) {
              pageKey = rawKey.trim();
            }
            const rawType = data.answer_type;
            if (
              typeof rawType === 'string' &&
              ['answered', 'not_found', 'off_topic'].includes(rawType.trim())
            ) {
              answerType = rawType.trim();
            }
            const rawSug = data.suggestion_keys;
            if (Array.isArray(rawSug)) {
              suggestionKeys = rawSug
                .map((k) => (typeof k === 'string' ? k.trim() : ''))
                .filter(Boolean);
            }
          }
        } catch (parseErr) {
          if (this.logger) {
            this.logger.warn(`Failed to parse JSON response from Gemini: ${parseErr.message}`);
          }
          answerText = rawText.trim();
        }

        let inputTokens = 0;
        let outputTokens = 0;
        if (response.usageMetadata) {
          inputTokens = response.usageMetadata.promptTokenCount || 0;
          outputTokens = response.usageMetadata.candidatesTokenCount || 0;
        }

        return {
          answer: answerText,
          page_key: pageKey,
          answer_type: answerType,
          suggestion_keys: suggestionKeys,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
        };
      } catch (exc) {
        lastError = exc;
        const errMsg = String(exc && exc.message ? exc.message : exc);
        if (this.logger) {
          this.logger.warn(
            `Gemini generate_content attempt ${attempt}/${maxAttempts} with ${currentModel} failed: ${errMsg}`
          );
        }

        if (attempt < maxAttempts) {
          if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
            if (this.logger) this.logger.info('Gemini rate limit hit. Waiting 2.5s before retry...');
            await sleep(2500);
          } else if (
            errMsg.includes('503') ||
            errMsg.toLowerCase().includes('high demand') ||
            errMsg.toLowerCase().includes('unavailable')
          ) {
            if (this.logger) this.logger.info(`Gemini temporary 503 high demand on ${currentModel}. Switching model...`);
            await sleep(1000);
          } else {
            await sleep(1000);
          }
        }
      }
    }

    if (this.logger) {
      this.logger.error(`All ${maxAttempts} attempts to Gemini model failed: ${lastError?.message}`);
    }
    throw lastError || new Error('Gemini API request failed');
  }
}

export default GeminiLLMClient;
