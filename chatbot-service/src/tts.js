import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import getConfig from './config.js';

export function cleanTextForTTS(rawText) {
  if (!rawText) return '';
  let text = rawText;
  // Convert email addresses: name@domain.com -> name at domain dot com
  text = text.replace(
    /([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g,
    (_, user, domain) => `${user} at ${domain.replace(/\./g, ' dot ')}`
  );
  // Strip markdown images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  // Strip markdown links
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Strip code blocks and inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  // Strip headers
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Strip bold / italics
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  // Strip bullet points
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  // Strip emojis
  text = text.replace(/[\u{10000}-\u{10ffff}]/gu, '');
  // Collapse whitespace and newlines
  text = text.replace(/\n+/g, '. ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

export function pcmToWav(pcmData, sampleRate = 24000, numChannels = 1, sampWidth = 2) {
  if (!pcmData || pcmData.length === 0) {
    return Buffer.alloc(0);
  }

  const buf = Buffer.isBuffer(pcmData) ? pcmData : Buffer.from(pcmData);

  // If already wrapped in RIFF or ID3 or MP3 header, return as-is
  if (
    buf.subarray(0, 4).toString() === 'RIFF' ||
    buf.subarray(0, 3).toString() === 'ID3' ||
    (buf[0] === 0xff && (buf[1] === 0xfb || buf[1] === 0xf3 || buf[1] === 0xf2))
  ) {
    return buf;
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + buf.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * sampWidth, 28);
  header.writeUInt16LE(numChannels * sampWidth, 32);
  header.writeUInt16LE(sampWidth * 8, 34);
  header.write('data', 36);
  header.writeUInt32LE(buf.length, 40);

  return Buffer.concat([header, buf]);
}

export function getCacheKey(
  text,
  voice = null,
  style = null,
  provider = null,
  model = null,
  settings = null
) {
  let cfg = settings;
  if (!cfg) {
    try {
      cfg = getConfig();
    } catch {
      cfg = null;
    }
  }

  const p = provider || (cfg?.TTS_PROVIDER || 'gemini');
  const m = model || (cfg?.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts');
  const v = voice || (cfg?.GEMINI_TTS_VOICE || 'Kore');
  const s = style !== null && style !== undefined ? style : (cfg?.GEMINI_TTS_STYLE || '');

  const keySrc = `${p}::${m}::${v}::${s}::${text.trim()}`;
  return crypto.createHash('md5').update(keySrc, 'utf-8').digest('hex');
}

export function clearTtsConfigIfChanged(settings = null, logger = null) {
  const cfg = settings || getConfig();
  const cacheDir = path.resolve(cfg.TTS_CACHE_DIR);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const metaFile = path.resolve(cacheDir, 'cache_meta.json');
  const currentMeta = {
    provider: cfg.TTS_PROVIDER || 'gemini',
    model: cfg.GEMINI_TTS_MODEL,
    voice: cfg.GEMINI_TTS_VOICE,
    style: cfg.GEMINI_TTS_STYLE,
  };

  let cacheCleared = false;

  if (fs.existsSync(metaFile)) {
    try {
      const savedMeta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
      if (
        savedMeta.provider !== currentMeta.provider ||
        savedMeta.model !== currentMeta.model ||
        savedMeta.voice !== currentMeta.voice ||
        savedMeta.style !== currentMeta.style
      ) {
        if (logger) {
          logger.info(
            `TTS configuration changed (voice: '${savedMeta.voice}' -> '${currentMeta.voice}', ` +
            `model: '${savedMeta.model}' -> '${currentMeta.model}'). Clearing old audio cache in ${cacheDir}...`
          );
        }
        for (const file of fs.readdirSync(cacheDir)) {
          if (file.endsWith('.wav') || file.endsWith('.mp3')) {
            try {
              fs.unlinkSync(path.resolve(cacheDir, file));
            } catch {
              // Ignore
            }
          }
        }
        cacheCleared = true;
      }
    } catch {
      for (const file of fs.readdirSync(cacheDir)) {
        if (file.endsWith('.wav') || file.endsWith('.mp3')) {
          try {
            fs.unlinkSync(path.resolve(cacheDir, file));
          } catch {
            // Ignore
          }
        }
      }
      cacheCleared = true;
    }
  } else {
    for (const file of fs.readdirSync(cacheDir)) {
      if (file.endsWith('.wav')) {
        try {
          fs.unlinkSync(path.resolve(cacheDir, file));
        } catch {
          // Ignore
        }
      }
    }
    cacheCleared = true;
  }

  try {
    fs.writeFileSync(metaFile, JSON.stringify(currentMeta, null, 2), 'utf-8');
  } catch (err) {
    if (logger) {
      logger.warn(`Failed to write TTS cache metadata to ${metaFile}: ${err.message}`);
    }
  }

  return cacheCleared;
}

export function splitIntoSentences(text) {
  if (!text) return [];
  const sentences = text
    .split(/(?<=[.?!;:])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences.length > 0 ? sentences : [text];
}

const TTS_CHAIN_MODELS = [
  'gemini-2.5-flash-preview-tts',
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
];

const exhaustedTtsModels = new Map(); // model -> timestamp when exhausted

function isModelExhausted(model) {
  const exhaustedAt = exhaustedTtsModels.get(model);
  if (!exhaustedAt) return false;
  // Circuit breaker reset after 5 minutes
  if (Date.now() - exhaustedAt > 5 * 60 * 1000) {
    exhaustedTtsModels.delete(model);
    return false;
  }
  return true;
}

function markModelExhausted(model) {
  exhaustedTtsModels.set(model, Date.now());
}

function withTimeout(promise, ms, errorMsg = 'TTS audio synthesis timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    ),
  ]);
}

async function callGeminiTtsModel(ai, model, text, voice, logger) {
  const response = await ai.models.generateContent({
    model,
    contents: text,
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      },
    },
  });

  if (response.candidates && response.candidates[0]?.content?.parts) {
    const part = response.candidates[0].content.parts[0];
    if (part && part.inlineData && part.inlineData.data) {
      const rawBuf = Buffer.from(part.inlineData.data, 'base64');
      let sampleRate = 24000;
      const mime = part.inlineData.mimeType || '';
      if (mime.includes('rate=')) {
        try {
          sampleRate = parseInt(mime.split('rate=')[1].split(';')[0], 10) || 24000;
        } catch {
          sampleRate = 24000;
        }
      }
      return { rawBuf, sampleRate };
    }
  }

  throw new Error(`No audio data returned by model ${model}`);
}

export async function synthesizeSpeech(text, voiceOverride = null, settings = null, logger = null) {
  const cfg = settings || getConfig();
  const cleanText = cleanTextForTTS(text);
  if (!cleanText) {
    return Buffer.alloc(0);
  }

  const provider = cfg.TTS_PROVIDER || 'gemini';
  const configuredVoice = cfg.GEMINI_TTS_VOICE;
  const configuredModel = cfg.GEMINI_TTS_MODEL;
  const style = cfg.GEMINI_TTS_STYLE;

  if (voiceOverride && voiceOverride !== configuredVoice) {
    if (logger) {
      logger.warn(
        `TTS voice mismatch: request specified voice='${voiceOverride}', overriding with configured voice='${configuredVoice}'. ` +
        `Reason: Configured voice '${configuredVoice}' is enforced for all requests.`
      );
    }
  }

  const chosenVoice = configuredVoice;
  const cacheDir = path.resolve(cfg.TTS_CACHE_DIR);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const cacheKey = getCacheKey(cleanText, chosenVoice, style, provider, configuredModel, cfg);
  const cachedFileWav = path.resolve(cacheDir, `${cacheKey}.wav`);
  const cachedFileMp3 = path.resolve(cacheDir, `${cacheKey}.mp3`);

  for (const cFile of [cachedFileWav, cachedFileMp3]) {
    if (fs.existsSync(cFile)) {
      const stat = fs.statSync(cFile);
      if (stat.size > 0) {
        if (logger) {
          logger.info(
            `TTS audio cache hit for key ${cacheKey.slice(0, 8)} ` +
            `(provider=${provider}, model=${configuredModel}, voice=${chosenVoice})`
          );
        }
        const rawData = fs.readFileSync(cFile);
        if (cFile === cachedFileWav && rawData.subarray(0, 4).toString() !== 'RIFF') {
          const wavData = pcmToWav(rawData);
          try {
            fs.writeFileSync(cFile, wavData);
          } catch {
            // Ignore
          }
          return wavData;
        }
        return rawData;
      }
    }
  }

  if (!cfg.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured for TTS audio generation.');
  }

  const ai = new GoogleGenAI({ apiKey: cfg.GEMINI_API_KEY });

  // Ordered fallback models: primary gemini-2.5-flash-preview-tts, then gemini-3.8-flash-tts, then gemini-3.8-flash-lite-tts
  const modelsToTry = [configuredModel, ...TTS_CHAIN_MODELS].filter((m) => !isModelExhausted(m));
  const orderedModels = Array.from(new Set(modelsToTry));

  if (orderedModels.length === 0) {
    // Reset circuit breaker if all were marked
    exhaustedTtsModels.clear();
    orderedModels.push(...Array.from(new Set([configuredModel, ...TTS_CHAIN_MODELS])));
  }

  // Handle sentence chunking for long text (> 1200 characters)
  const sentences = cleanText.length > 1200 ? splitIntoSentences(cleanText) : [cleanText];

  let lastError = null;

  for (const model of orderedModels) {
    if (model !== configuredModel && logger) {
      logger.warn(
        `TTS model fallback triggered: using fallback model '${model}' instead of configured model '${configuredModel}'. ` +
        `Reason: Configured model was exhausted or experienced an error.`
      );
    }

    try {
      if (logger) {
        logger.info(
          `Calling Gemini TTS provider '${provider}', model '${model}' with voice '${chosenVoice}'...`
        );
      }

      const pcmChunks = [];
      let detectedSampleRate = 24000;

      for (const sentence of sentences) {
        const { rawBuf, sampleRate } = await withTimeout(
          callGeminiTtsModel(ai, model, sentence, chosenVoice, logger),
          25000,
          `TTS call to ${model} timed out after 25s`
        );
        pcmChunks.push(rawBuf);
        detectedSampleRate = sampleRate;
      }

      const mergedPcm = Buffer.concat(pcmChunks);
      const wavData = pcmToWav(mergedPcm, detectedSampleRate);

      fs.writeFileSync(cachedFileWav, wavData);
      if (logger) {
        logger.info(
          `TTS audio generated & cached (${wavData.length} bytes, key=${cacheKey.slice(0, 8)}, voice=${chosenVoice})`
        );
      }
      return wavData;
    } catch (exc) {
      lastError = exc;
      const errMsg = String(exc && exc.message ? exc.message : exc);
      if (
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('429') ||
        errMsg.toLowerCase().includes('quota') ||
        errMsg.includes('503') ||
        errMsg.toLowerCase().includes('unavailable')
      ) {
        if (logger) {
          logger.warn(`TTS model '${model}' reached quota or server error. Marking exhausted.`);
        }
        markModelExhausted(model);
      } else if (logger) {
        logger.warn(`Gemini TTS generation failed on model '${model}': ${errMsg}`);
      }
    }
  }

  throw lastError || new Error(`Failed to generate TTS audio for voice ${chosenVoice}`);
}

export function prewarmTtsCache(settings = null, logger = null) {
  const cfg = settings || getConfig();
  const welcomeText =
    "Hello! I'm EduBot - your EduCrop AI assistant. I can help you with " +
    'product info, features, and more. What would you like to know today?';

  synthesizeSpeech(welcomeText, null, cfg, logger)
    .then(() => {
      if (logger) {
        logger.info('Pre-warmed TTS cache for welcome message greeting.');
      }
    })
    .catch((err) => {
      if (logger) {
        logger.warn(`Could not pre-warm welcome message TTS: ${err.message}`);
      }
    });
}

export default {
  cleanTextForTTS,
  pcmToWav,
  getCacheKey,
  clearTtsConfigIfChanged,
  synthesizeSpeech,
  prewarmTtsCache,
  splitIntoSentences,
};
