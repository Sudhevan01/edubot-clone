/**
 * Chat API service module for communicating with the chatbot backend.
 */

let memorySessionId = null;

/**
 * Return persistent session ID stored in sessionStorage with fallback to memory.
 */
export function getSessionId() {
  if (memorySessionId) {
    return memorySessionId;
  }
  try {
    let storedId = window.sessionStorage.getItem('educrop_chat_session_id');
    if (!storedId) {
      storedId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'sess-' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      window.sessionStorage.setItem('educrop_chat_session_id', storedId);
    }
    memorySessionId = storedId;
    return storedId;
  } catch (err) {
    if (!memorySessionId) {
      memorySessionId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'sess-' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    }
    return memorySessionId;
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Send POST /api/chat with timeout and robust error handling.
 *
 * @param {Object} params
 * @param {string} params.message - Message text
 * @param {string} [params.inputMode='text'] - Input mode ('text' or 'voice')
 * @returns {Promise<{
 *   success: boolean,
 *   data?: { answer: string, answer_type: string, page: object|null, actions: Array, suggestions: Array },
 *   error?: { code: string, message: string }
 * }>}
 */
export async function sendChatMessage({ message, inputMode = 'text' }) {
  const sessionId = getSessionId();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message,
        input_mode: inputMode,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const payload = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        success: true,
        data: {
          answer: payload.answer || 'I have received your message.',
          page: payload.page || null,
          answer_type: payload.answer_type || 'answered',
          actions: Array.isArray(payload.actions) ? payload.actions : [],
          suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
        },
      };
    } else {
      const errDetail = payload.error || {};
      return {
        success: false,
        error: {
          code: errDetail.code || `http_${response.status}`,
          message: errDetail.message || 'An error occurred while communicating with the service. Please try again.',
        },
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'timeout',
          message: 'The request timed out. Please check your network connection and try again.',
        },
      };
    }
    return {
      success: false,
      error: {
        code: 'network_error',
        message: 'Unable to connect to the chatbot server. Please check your connection and try again.',
      },
    };
  }
}

// In-flight request tracker to prevent duplicate concurrent network calls for the same text
const inFlightTTSRequests = new Map();

/**
 * Request speech audio (WAV blob URL) for chatbot response text using the Kore voice.
 * Deduplicates in-flight requests so background prefetching and manual clicks share the same request.
 *
 * @param {string} text - Clean message text to speak
 * @param {AbortSignal} [externalSignal] - Optional abort signal
 * @returns {Promise<string>} Blob URL pointing to audio/wav
 */
export async function fetchChatTTS(text, externalSignal) {
  const cleanKey = (text || '').trim();
  if (!cleanKey) {
    throw new Error('Empty text provided for TTS synthesis');
  }

  if (inFlightTTSRequests.has(cleanKey)) {
    return inFlightTTSRequests.get(cleanKey);
  }

  const requestPromise = (async () => {
    const controller = new AbortController();
    // 25000ms timeout for cloud Kore TTS audio synthesis
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      const response = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanKey }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TTS synthesis failed with status ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  })();

  inFlightTTSRequests.set(cleanKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inFlightTTSRequests.delete(cleanKey);
  }
}

