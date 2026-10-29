import { z } from 'zod';
import getConfig from '../config.js';
import { synthesizeSpeech } from '../tts.js';

const ttsRequestSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty.').max(1500, 'Text exceeds 1500 characters limit.'),
  voice: z.string().optional().nullable(),
});

const ttsOpenApiSchema = {
  tags: ['TTS'],
  summary: 'Generate speech audio for message using configured voice',
  description: 'Synthesize speech audio using configured Google Gemini TTS voice with caching.',
  body: {
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        minLength: 1,
        maxLength: 1500,
        description: 'Text to convert to speech',
        default: 'EduCrop is an all-in-one educational platform.',
        example: 'EduCrop is an all-in-one educational platform.',
      },
      voice: {
        type: 'string',
        description: 'Optional voice override (defaults to configured Kore voice)',
        default: 'Kore',
        example: 'Kore',
      },
    },
  },
};

export default async function ttsRoutes(fastify) {
  const handleTts = async (request, reply) => {
    const cfg = getConfig();
    const body = request.body || {};

    if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
      return reply.code(400).send({
        error: {
          code: 'empty',
          message: 'Text cannot be empty.',
        },
      });
    }

    const parseResult = ttsRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: {
          code: 'empty',
          message: parseResult.error.errors[0]?.message || 'Invalid request body.',
        },
      });
    }

    const { text, voice } = parseResult.data;
    const provider = cfg.TTS_PROVIDER || 'gemini';
    const model = cfg.GEMINI_TTS_MODEL;
    const configuredVoice = cfg.GEMINI_TTS_VOICE;

    if (voice && voice !== configuredVoice) {
      request.log.warn(
        `Client requested voice '${voice}', but using configured voice '${configuredVoice}'. ` +
        `Reason: Server config overrides client voice parameter.`
      );
    }

    request.log.info(
      `/api/tts request: provider='${provider}', model='${model}', voice='${configuredVoice}'`
    );

    try {
      const audioBuffer = await synthesizeSpeech(text, voice, cfg, request.log);

      if (!audioBuffer || audioBuffer.length === 0) {
        return reply.code(400).send({
          error: {
            code: 'empty',
            message: 'No speech generated for provided text.',
          },
        });
      }

      const isMp3 =
        audioBuffer.subarray(0, 3).toString() === 'ID3' ||
        (audioBuffer[0] === 0xff &&
          (audioBuffer[1] === 0xfb || audioBuffer[1] === 0xf3 || audioBuffer[1] === 0xf2));

      const mediaType = isMp3 ? 'audio/mpeg' : 'audio/wav';
      const filename = isMp3 ? 'speech.mp3' : 'speech.wav';

      reply
        .header('Cache-Control', 'public, max-age=604800, immutable')
        .header('Content-Disposition', `inline; filename="${filename}"`)
        .type(mediaType);

      return reply.send(audioBuffer);
    } catch (err) {
      const errMsg = String(err && err.message ? err.message : err);
      if (errMsg.includes('timed out') || errMsg.includes('timeout')) {
        request.log.warn(`TTS audio synthesis timed out for voice '${configuredVoice}'`);
        return reply.code(504).send({
          error: {
            code: 'timeout',
            message: 'TTS audio synthesis timed out.',
          },
        });
      }

      request.log.error(`TTS generation error: ${errMsg}`);
      return reply.code(503).send({
        error: {
          code: 'unavailable',
          message: 'TTS audio synthesis is temporarily unavailable.',
        },
      });
    }
  };

  fastify.post('/api/tts', { schema: ttsOpenApiSchema }, handleTts);
  fastify.post('/api/chat/tts', { schema: ttsOpenApiSchema }, handleTts);
}
