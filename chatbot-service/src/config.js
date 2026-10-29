import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve project root (parent directory of chatbot-service)
export const SERVICE_ROOT = path.resolve(__dirname, '..');
export const PROJECT_ROOT = path.resolve(SERVICE_ROOT, '..');
export const DOTENV_PATH = path.resolve(PROJECT_ROOT, '.env');

// Read root .env only if it exists
if (fs.existsSync(DOTENV_PATH)) {
  dotenv.config({ path: DOTENV_PATH });
}

function parseAllowedOrigins(val) {
  const defaults = [
    'https://educrop.com',
    'https://www.educrop.com',
    'https://educrop.netlify.app',
    'http://localhost:5174',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ];
  if (!val) {
    return defaults;
  }
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fall back to comma-separated
      }
    }
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return defaults;
}

function parseBoolean(val, defaultVal = false) {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const s = String(val).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes';
}

function parseSuggestionsConfig(val) {
  const defaults = {
    benefits: 'Benefits of EduCrop',
    about: 'About Us',
    product: 'Our Product & Modules',
    contact: 'Contact Us',
    docs: 'Documentation & Guides',
  };
  if (!val) return defaults;
  if (typeof val === 'object' && val !== null) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      return defaults;
    }
  }
  return defaults;
}

const configSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is missing or empty in environment'),
  GEMINI_MODEL: z.string().default('gemini-3.1-flash-lite'),
  ALLOWED_ORIGINS: z.array(z.string()).default([
    'https://educrop.com',
    'https://www.educrop.com',
    'https://educrop.netlify.app',
    'http://localhost:5174',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]),
  RATE_LIMIT_IP_PER_MINUTE: z.number().int().positive().default(10),
  RATE_LIMIT_IP_PER_DAY: z.number().int().positive().default(100),
  RATE_LIMIT_SESSION_MAX: z.number().int().positive().default(40),
  DAILY_SPEND_CAP_USD: z.number().positive().default(5.0),
  MODEL_INPUT_PRICE_PER_M: z.number().nonnegative().default(0.075),
  MODEL_OUTPUT_PRICE_PER_M: z.number().nonnegative().default(0.30),
  SCHOOL_NAME: z.string().default('EduCrop'),
  BOT_NAME: z.string().default('EduCrop Assistant'),
  SCHOOL_EMAIL: z.string().email().default('Educropblr@gmail.com'),
  FALLBACK_CONTACT: z.string().default('+91 73378 40612'),
  SUGGESTIONS_CONFIG: z.record(z.string()).default({
    benefits: 'Benefits of EduCrop',
    about: 'About Us',
    product: 'Our Product & Modules',
    contact: 'Contact Us',
    docs: 'Documentation & Guides',
  }),
  APP_ENV: z.string().default('development'),
  TRUST_PROXY: z.boolean().default(false),
  GEMINI_TTS_VOICE: z.string().default('Kore'),
  GEMINI_TTS_STYLE: z.string().default(
    'speak as a warm, friendly, professional female assistant with a natural Indian English accent, at a calm and natural pace.'
  ),
  GEMINI_TTS_MODEL: z.string().default('gemini-2.5-flash-preview-tts'),
  TTS_PROVIDER: z.string().default('gemini'),
  TTS_CACHE_DIR: z.string().default(path.resolve(SERVICE_ROOT, 'audio_cache')),
  PORT: z.number().int().positive().default(8001),
});

function loadConfig() {
  const raw = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    ALLOWED_ORIGINS: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
    RATE_LIMIT_IP_PER_MINUTE: process.env.RATE_LIMIT_IP_PER_MINUTE
      ? parseInt(process.env.RATE_LIMIT_IP_PER_MINUTE, 10)
      : 10,
    RATE_LIMIT_IP_PER_DAY: process.env.RATE_LIMIT_IP_PER_DAY
      ? parseInt(process.env.RATE_LIMIT_IP_PER_DAY, 10)
      : 100,
    RATE_LIMIT_SESSION_MAX: process.env.RATE_LIMIT_SESSION_MAX
      ? parseInt(process.env.RATE_LIMIT_SESSION_MAX, 10)
      : 40,
    DAILY_SPEND_CAP_USD: process.env.DAILY_SPEND_CAP_USD
      ? parseFloat(process.env.DAILY_SPEND_CAP_USD)
      : 5.0,
    MODEL_INPUT_PRICE_PER_M: process.env.MODEL_INPUT_PRICE_PER_M
      ? parseFloat(process.env.MODEL_INPUT_PRICE_PER_M)
      : 0.075,
    MODEL_OUTPUT_PRICE_PER_M: process.env.MODEL_OUTPUT_PRICE_PER_M
      ? parseFloat(process.env.MODEL_OUTPUT_PRICE_PER_M)
      : 0.30,
    SCHOOL_NAME: process.env.SCHOOL_NAME || 'EduCrop',
    BOT_NAME: process.env.BOT_NAME || 'EduCrop Assistant',
    SCHOOL_EMAIL: process.env.SCHOOL_EMAIL || 'Educropblr@gmail.com',
    FALLBACK_CONTACT: process.env.FALLBACK_CONTACT || '+91 73378 40612',
    SUGGESTIONS_CONFIG: parseSuggestionsConfig(process.env.SUGGESTIONS_CONFIG),
    APP_ENV: process.env.APP_ENV || 'development',
    TRUST_PROXY: parseBoolean(process.env.TRUST_PROXY, false),
    GEMINI_TTS_VOICE: process.env.GEMINI_TTS_VOICE || 'Kore',
    GEMINI_TTS_STYLE:
      process.env.GEMINI_TTS_STYLE ||
      'speak as a warm, friendly, professional female assistant with a natural Indian English accent, at a calm and natural pace.',
    GEMINI_TTS_MODEL: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts',
    TTS_PROVIDER: process.env.TTS_PROVIDER || 'gemini',
    TTS_CACHE_DIR: process.env.TTS_CACHE_DIR || path.resolve(SERVICE_ROOT, 'audio_cache'),
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 8001,
  };

  const result = configSchema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Configuration validation failed: ${errors}`);
  }

  return result.data;
}

let cachedConfig = null;

export function getConfig() {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export default getConfig;
