import getConfig from './config.js';

export class InputValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'InputValidationError';
    this.code = code;
    this.message = message;
  }
}

export function sanitizeInput(text) {
  if (!text) return '';
  // Strip C0 and C1 control characters except \t (\x09), \n (\x0A), \r (\x0D)
  return text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, '').trim();
}

export function validateInput(text) {
  if (!text || !text.trim()) {
    throw new InputValidationError('empty', 'Message must not be empty.');
  }

  const sanitized = sanitizeInput(text);

  if (!sanitized) {
    throw new InputValidationError('empty', 'Message must not be empty.');
  }

  if (sanitized.length > 500) {
    throw new InputValidationError(
      'too_long',
      'Message is too long. Please limit your message to 500 characters.'
    );
  }

  return sanitized;
}

export function cleanVoiceInput(text) {
  if (!text) return '';
  let cleaned = text.trim().replace(/\s+/g, ' ');
  while (true) {
    const nextCleaned = cleaned.replace(/^(?:um|uh|hmm|er|ah)\b[\s,.]*/i, '');
    if (nextCleaned === cleaned) break;
    cleaned = nextCleaned;
  }
  return cleaned.trim();
}

export class RateLimitExceeded extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitExceeded';
    this.message = message;
  }
}

export function getClientIp(req, trustProxy = false) {
  if (trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const firstIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
        .split(',')[0]
        .trim();
      if (firstIp) return firstIp;
    }
  }

  if (req.ip) return req.ip;
  if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;

  return '127.0.0.1';
}

export class InMemoryRateLimiter {
  constructor() {
    this._ipMinute = new Map();
    this._ipDay = new Map();
    this._sessionCounts = new Map();
  }

  async checkAndIncrement(ip, sessionId, settings = null) {
    const cfg = settings || getConfig();

    // Bypass rate limits when APP_ENV=test
    if (cfg.APP_ENV === 'test') {
      return;
    }

    const now = Date.now();
    const oneMinAgo = now - 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const minuteHistory = (this._ipMinute.get(ip) || []).filter((t) => t > oneMinAgo);
    const dayHistory = (this._ipDay.get(ip) || []).filter((t) => t > oneDayAgo);

    this._ipMinute.set(ip, minuteHistory);
    this._ipDay.set(ip, dayHistory);

    // 1. Check Session Limit
    const sessionMsgCount = this._sessionCounts.get(sessionId) || 0;
    if (sessionMsgCount >= cfg.RATE_LIMIT_SESSION_MAX) {
      throw new RateLimitExceeded(
        `This chat session has reached its maximum limit of ${cfg.RATE_LIMIT_SESSION_MAX} messages.`
      );
    }

    // 2. Check IP Per-Minute Limit
    if (minuteHistory.length >= cfg.RATE_LIMIT_IP_PER_MINUTE) {
      throw new RateLimitExceeded(
        'Rate limit exceeded: maximum 10 requests per minute allowed. Please wait a moment.'
      );
    }

    // 3. Check IP Per-Day Limit
    if (dayHistory.length >= cfg.RATE_LIMIT_IP_PER_DAY) {
      throw new RateLimitExceeded(
        'Daily request limit exceeded for your IP address. Please try again tomorrow.'
      );
    }

    // All checks passed: record request
    minuteHistory.push(now);
    dayHistory.push(now);
    this._sessionCounts.set(sessionId, sessionMsgCount + 1);
  }

  async clear() {
    this._ipMinute.clear();
    this._ipDay.clear();
    this._sessionCounts.clear();
  }
}

export const defaultRateLimiter = new InMemoryRateLimiter();

export class SpendCapExceeded extends Error {
  constructor(message) {
    super(message);
    this.name = 'SpendCapExceeded';
    this.message = message;
  }
}

function getISTDateString(d = new Date()) {
  // IST is UTC+05:30
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  return ist.toISOString().slice(0, 10);
}

export class InMemoryCostTracker {
  constructor() {
    this.currentDate = getISTDateString();
    this.dailyTotalUsd = 0.0;
    this.dailyInputTokens = 0;
    this.dailyOutputTokens = 0;
    this.dailyTotalTokens = 0;
    this.dailyRequestCount = 0;
    this.sessionUsage = new Map();
    this.latestSessionId = null;
    this.warningLogged = false;
  }

  _resetIfNewDay() {
    const nowDate = getISTDateString();
    if (nowDate !== this.currentDate) {
      this.currentDate = nowDate;
      this.dailyTotalUsd = 0.0;
      this.dailyInputTokens = 0;
      this.dailyOutputTokens = 0;
      this.dailyTotalTokens = 0;
      this.dailyRequestCount = 0;
      this.sessionUsage.clear();
      this.latestSessionId = null;
      this.warningLogged = false;
    }
  }

  async checkCap(settings = null, logger = null) {
    const cfg = settings || getConfig();
    this._resetIfNewDay();

    if (this.dailyTotalUsd >= cfg.DAILY_SPEND_CAP_USD) {
      if (!this.warningLogged) {
        if (logger) {
          logger.warn(
            `Daily spend cap of $${cfg.DAILY_SPEND_CAP_USD.toFixed(2)} USD exceeded! ` +
            `Current daily total: $${this.dailyTotalUsd.toFixed(4)} USD.`
          );
        }
        this.warningLogged = true;
      }
      throw new SpendCapExceeded(
        'The chatbot daily usage limit has been reached. Please visit our Contact page to get in touch with us.'
      );
    }
  }

  async recordUsage(inputTokens, outputTokens, settings = null, sessionId = null, logger = null) {
    const cfg = settings || getConfig();
    this._resetIfNewDay();

    const cost =
      (inputTokens / 1000000.0) * cfg.MODEL_INPUT_PRICE_PER_M +
      (outputTokens / 1000000.0) * cfg.MODEL_OUTPUT_PRICE_PER_M;

    this.dailyTotalUsd += cost;
    this.dailyInputTokens += inputTokens;
    this.dailyOutputTokens += outputTokens;
    this.dailyTotalTokens += inputTokens + outputTokens;
    this.dailyRequestCount += 1;

    if (sessionId) {
      this.latestSessionId = sessionId;
      if (!this.sessionUsage.has(sessionId)) {
        this.sessionUsage.set(sessionId, {
          sessionId,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          turnCount: 0,
          costUsd: 0.0,
        });
      }
      const s = this.sessionUsage.get(sessionId);
      s.inputTokens += inputTokens;
      s.outputTokens += outputTokens;
      s.totalTokens += inputTokens + outputTokens;
      s.turnCount += 1;
      s.costUsd += cost;
    }

    if (this.dailyTotalUsd >= cfg.DAILY_SPEND_CAP_USD && !this.warningLogged) {
      if (logger) {
        logger.warn(
          `Daily spend cap of $${cfg.DAILY_SPEND_CAP_USD.toFixed(2)} USD exceeded! ` +
          `Current daily total: $${this.dailyTotalUsd.toFixed(4)} USD.`
        );
      }
      this.warningLogged = true;
    }

    return cost;
  }

  async getDailyTotal() {
    this._resetIfNewDay();
    return this.dailyTotalUsd;
  }

  async getMetrics(sessionId = null, settings = null) {
    const cfg = settings || getConfig();
    this._resetIfNewDay();

    const cap = cfg.DAILY_SPEND_CAP_USD;
    const spent = this.dailyTotalUsd;
    const pending = Math.max(0.0, cap - spent);
    const percent = cap > 0 ? (spent / cap) * 100.0 : 0.0;

    const cleanSid = sessionId && typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null;
    const targetSid = (cleanSid && this.sessionUsage.has(cleanSid)) ? cleanSid : this.latestSessionId;

    let sessionStats = null;
    if (targetSid && this.sessionUsage.has(targetSid)) {
      const raw = this.sessionUsage.get(targetSid);
      const remainingTurns = Math.max(0, cfg.RATE_LIMIT_SESSION_MAX - raw.turnCount);
      sessionStats = {
        session_id: targetSid,
        messages_count: raw.turnCount,
        remaining_messages_allowed: remainingTurns,
        input_tokens: raw.inputTokens,
        output_tokens: raw.outputTokens,
        total_tokens: raw.totalTokens,
        session_cost_usd: Number(raw.costUsd.toFixed(6)),
      };
    }

    return {
      date: `${this.currentDate} (IST)`,
      status: spent >= cap ? 'cap_exceeded' : 'ok',
      total_requests: this.dailyRequestCount,
      total_tokens_used: this.dailyTotalTokens,
      total_input_tokens: this.dailyInputTokens,
      total_output_tokens: this.dailyOutputTokens,
      total_spent_usd: Number(spent.toFixed(6)),
      daily_budget_cap_usd: Number(cap.toFixed(2)),
      pending_budget_usd: Number(pending.toFixed(6)),
      budget_used_percentage: `${percent.toFixed(2)}%`,
      is_cap_exceeded: spent >= cap,
      pricing: {
        input_per_million_usd: cfg.MODEL_INPUT_PRICE_PER_M,
        output_per_million_usd: cfg.MODEL_OUTPUT_PRICE_PER_M,
      },
      current_session: sessionStats,
      active_sessions_count: this.sessionUsage.size,
      active_session_ids: Array.from(this.sessionUsage.keys()),
    };
  }

  async reset() {
    this.currentDate = getISTDateString();
    this.dailyTotalUsd = 0.0;
    this.dailyInputTokens = 0;
    this.dailyOutputTokens = 0;
    this.dailyTotalTokens = 0;
    this.dailyRequestCount = 0;
    this.sessionUsage.clear();
    this.latestSessionId = null;
    this.warningLogged = false;
  }
}

export const defaultCostTracker = new InMemoryCostTracker();

export default {
  InputValidationError,
  sanitizeInput,
  validateInput,
  cleanVoiceInput,
  RateLimitExceeded,
  getClientIp,
  InMemoryRateLimiter,
  defaultRateLimiter,
  SpendCapExceeded,
  InMemoryCostTracker,
  defaultCostTracker,
};
