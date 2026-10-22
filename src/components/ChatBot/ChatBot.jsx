import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Mic, ArrowRight, Mail, SlidersHorizontal, RotateCcw, Volume2, Square, Loader2 } from 'lucide-react';
import { WELCOME_MESSAGE, getResponse } from '../../data/chatbotResponses';
import { sendChatMessage, fetchChatTTS } from '../../services/chatApi';
import { renderMarkdown } from '../../utils/markdownRenderer';
import './ChatBot.css';

// ── Particle canvas background ──────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    const particles = [];
    const PARTICLE_COUNT = 60;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.6 + 0.2,
        hue: Math.random() * 60 + 200, // cyan to violet
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(260, 80%, 70%, ${0.15 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="chatbot-particles" />;
}

// ── Typing indicator ─────────────────────────────
function TypingDots() {
  return (
    <div className="chatbot-bubble bot typing-bubble">
      <div className="typing-dots">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ── Text-to-Speech Helpers ─────────────────────────
function cleanTextForSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // Convert email addresses to natural speech: "name at domain dot com"
  text = text.replace(/([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g, (match, user, domain) => {
    const cleanDomain = domain.replace(/\./g, ' dot ');
    return `${user} at ${cleanDomain}`;
  });

  // Strip markdown links: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Strip images: ![alt](url) -> ""
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // Strip inline code: `code` -> code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Strip headers: ### Header -> Header
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Strip bold/italics: **text**, *text*, __text__, _text_
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');

  // Strip blockquotes: > quote -> quote
  text = text.replace(/^>\s+/gm, '');

  // Strip list bullets and numbers: "- item", "* item", "1. item"
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // Strip horizontal rules: ---, ***
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // Strip emojis safely
  try {
    text = text.replace(/\p{Extended_Pictographic}/gu, '');
  } catch {
    text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  }

  // Convert multiple line breaks to pause punctuation
  text = text.replace(/\n+/g, '. ');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

function splitIntoSentences(text) {
  if (!text) return [];
  const sentences = text
    .split(/(?<=[.?!;:])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences.length > 0 ? sentences : [text];
}

// ── Single message bubble ─────────────────────────
function MessageBubble({
  msg,
  onSuggestionClick,
  onNavigate,
  isSpeaking,
  isLoadingSpeech,
  onToggleSpeak,
  onPrefetch,
}) {
  const isBot = msg.role === 'bot';
  const isError = Boolean(msg.isError);
  const navigate = useNavigate();

  const isSpeechSupported = typeof window !== 'undefined' && typeof Audio !== 'undefined';

  return (
    <div className={`chatbot-message ${isBot ? 'bot-message' : 'user-message'}`}>
      {isBot && (
        <div className="bot-avatar-mini">
          <img src="/assets/images/chatbot-icon-v2.png" alt="EduBot" />
        </div>
      )}
      <div
        className={`chatbot-bubble ${isBot ? 'bot' : 'user'} ${
          msg.answer_type === 'not_found' ? 'not-found' : ''
        } ${isError ? 'error-bubble' : ''}`}
      >
        {/* Read aloud speaker button - only on bot messages when speech is supported */}
        {isBot && isSpeechSupported && (
          <button
            type="button"
            className={`bubble-speech-btn ${isSpeaking ? 'speaking' : ''} ${isLoadingSpeech ? 'loading' : ''}`}
            onClick={onToggleSpeak}
            onMouseEnter={onPrefetch}
            onTouchStart={onPrefetch}
            disabled={isLoadingSpeech}
            aria-label={isLoadingSpeech ? 'Preparing Kore audio...' : isSpeaking ? 'Stop reading' : 'Read message aloud'}
            title={isLoadingSpeech ? 'Preparing Kore audio...' : isSpeaking ? 'Stop reading' : 'Read message aloud'}
          >
            {isLoadingSpeech ? (
              <Loader2 size={12} className="spin-icon" />
            ) : isSpeaking ? (
              <Square size={11} fill="currentColor" strokeWidth={0} />
            ) : (
              <Volume2 size={13} strokeWidth={2.2} />
            )}
          </button>
        )}

        <div className="bubble-content">
          {isBot ? renderMarkdown(msg.text) : <p className="chat-md-p">{msg.text}</p>}
        </div>

        {/* Render Actions */}
        {isBot && Array.isArray(msg.actions) && msg.actions.length > 0 && (
          <div className="msg-actions">
            {msg.actions.map((act, idx) => {
              if (act.type === 'navigate' && act.url && act.url.startsWith('/')) {
                return (
                  <button
                    key={idx}
                    type="button"
                    className="quick-reply-chip action-btn navigate-btn"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate(act.url);
                      } else {
                        navigate(act.url);
                      }
                    }}
                  >
                    <ArrowRight size={15} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
                    <span>{act.label || 'View Page'}</span>
                  </button>
                );
              }
              if (act.type === 'email' && act.value) {
                const mailtoUrl = `mailto:${act.value}?subject=${encodeURIComponent(
                  act.subject || 'Question from website'
                )}`;
                return (
                  <a
                    key={idx}
                    href={mailtoUrl}
                    className="quick-reply-chip action-btn email-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Mail size={15} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
                    <span>{act.label || 'Email the school'}</span>
                  </a>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Render Suggestions */}
        {isBot && Array.isArray(msg.suggestions) && msg.suggestions.length > 0 && (
          <div className="msg-suggestions">
            <p className="quick-replies-label">Suggested topics:</p>
            <div className="quick-replies-grid">
              {msg.suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-reply-chip"
                  onClick={() => onSuggestionClick && onSuggestionClick(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        <span className="bubble-time">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ── FAB sizing configuration & persistence helpers ────────────────
const FAB_SIZES = {
  small: { size: 48, iconSize: 20, label: 'S', name: 'Small' },
  medium: { size: 56, iconSize: 24, label: 'M', name: 'Medium' },
  large: { size: 68, iconSize: 28, label: 'L', name: 'Large' },
};
const DEFAULT_FAB_SIZE = 'small';
const EDGE_MARGIN = 12;
const DRAG_THRESHOLD = 6;
const STORAGE_POS_KEY = 'educrop_chatbot_fab_position';
const STORAGE_SIZE_KEY = 'educrop_chatbot_fab_size';

function clampPosition(x, y, diameter) {
  if (typeof window === 'undefined') return { x, y };
  const minX = EDGE_MARGIN;
  const maxX = Math.max(EDGE_MARGIN, window.innerWidth - diameter - EDGE_MARGIN);
  const minY = EDGE_MARGIN;
  const maxY = Math.max(EDGE_MARGIN, window.innerHeight - diameter - EDGE_MARGIN);
  return {
    x: Math.round(Math.min(Math.max(minX, x), maxX)),
    y: Math.round(Math.min(Math.max(minY, y), maxY)),
  };
}

function getDefaultPosition(diameter) {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  const margin = window.innerWidth <= 480 ? 16 : 28;
  return clampPosition(
    window.innerWidth - diameter - margin,
    window.innerHeight - diameter - margin,
    diameter
  );
}

function loadSavedPosition(diameter) {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_POS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
        return clampPosition(parsed.x, parsed.y, diameter);
      }
    }
  } catch (err) {
    console.warn('Error reading FAB position from localStorage:', err);
  }
  return getDefaultPosition(diameter);
}

function loadSavedSize() {
  if (typeof window === 'undefined') return DEFAULT_FAB_SIZE;
  try {
    const raw = localStorage.getItem(STORAGE_SIZE_KEY);
    if (raw && FAB_SIZES[raw]) {
      return raw;
    }
  } catch (err) {
    console.warn('Error reading FAB size from localStorage:', err);
  }
  return DEFAULT_FAB_SIZE;
}

function getWindowPosition(buttonPos, diameter, isMaximized) {
  if (typeof window === 'undefined' || !buttonPos || isMaximized) return {};
  if (window.innerWidth <= 768) return {};

  const PADDING = 14;
  const GAP = 12;
  const winW = 390;
  const maxH = Math.min(600, window.innerHeight - 140);

  const btnX = buttonPos.x;
  const btnY = buttonPos.y;
  const btnCenterX = btnX + diameter / 2;
  const btnCenterY = btnY + diameter / 2;

  let top;
  let left;
  let originY = 'bottom';
  let originX = 'right';

  // Vertical placement: place window above or below the button depending on screen half
  if (btnCenterY > window.innerHeight / 2) {
    top = btnY - maxH - GAP;
    originY = 'bottom';
    if (top < PADDING) {
      if (window.innerHeight - (btnY + diameter + GAP) >= maxH) {
        top = btnY + diameter + GAP;
        originY = 'top';
      } else {
        top = PADDING;
      }
    }
  } else {
    top = btnY + diameter + GAP;
    originY = 'top';
    if (top + maxH > window.innerHeight - PADDING) {
      if (btnY - GAP >= maxH) {
        top = btnY - maxH - GAP;
        originY = 'bottom';
      } else {
        top = Math.max(PADDING, window.innerHeight - maxH - PADDING);
      }
    }
  }

  // Horizontal placement: align window edge near the button
  if (btnCenterX > window.innerWidth / 2) {
    left = btnX + diameter - winW;
    originX = 'right';
  } else {
    left = btnX;
    originX = 'left';
  }

  // Clamp safely within viewport bounds
  const minLeft = PADDING;
  const maxLeft = Math.max(PADDING, window.innerWidth - winW - PADDING);
  left = Math.min(Math.max(minLeft, left), maxLeft);

  const minTop = PADDING;
  const maxTop = Math.max(PADDING, window.innerHeight - maxH - PADDING);
  top = Math.min(Math.max(minTop, top), maxTop);

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
    bottom: 'auto',
    right: 'auto',
    transformOrigin: `${originY} ${originX}`,
  };
}

// ── Main ChatBot widget ───────────────────────────
export default function ChatBot({ fullPage = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(fullPage);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isVoiceTranscript, setIsVoiceTranscript] = useState(false);

  // Speech synthesis state & voice config (Kore voice)
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [speechLoadingId, setSpeechLoadingId] = useState(null);
  const speakingIdRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const ttsAbortCtrlRef = useRef(null);
  const audioCacheRef = useRef(new Map());

  // Clear any persistent storage audio keys from before the voice change
  useEffect(() => {
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('educrop_audio_') || key.startsWith('tts_')) {
          sessionStorage.removeItem(key);
        }
      });
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('educrop_audio_') || key.startsWith('tts_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
  }, []);

  // Pre-fetch welcome message greeting so it is ready to play with 0ms delay
  useEffect(() => {
    const welcomeClean = cleanTextForSpeech(WELCOME_MESSAGE.text);
    if (welcomeClean && !audioCacheRef.current.has(welcomeClean)) {
      fetchChatTTS(welcomeClean)
        .then((url) => {
          audioCacheRef.current.set(welcomeClean, url);
        })
        .catch(() => {});
    }
  }, []);

  const handlePrefetch = useCallback((msg) => {
    const cleanText = cleanTextForSpeech(msg.text);
    if (!cleanText || audioCacheRef.current.has(cleanText)) return;
    fetchChatTTS(cleanText)
      .then((url) => {
        audioCacheRef.current.set(cleanText, url);
      })
      .catch(() => {});
  }, []);

  const stopSpeaking = useCallback(() => {
    setSpeechLoadingId(null);

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {}
      audioPlayerRef.current = null;
    }

    if (ttsAbortCtrlRef.current) {
      try {
        ttsAbortCtrlRef.current.abort();
      } catch {}
      ttsAbortCtrlRef.current = null;
    }

    speakingIdRef.current = null;
    setSpeakingMessageId(null);
  }, []);

  const speakWithDeviceVoice = useCallback(
    (cleanText, msgId) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        stopSpeaking();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find(
            (v) => (v.lang === 'en-IN' || v.lang === 'en_IN') && /female|natural/i.test(v.name)
          ) ||
          voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN') ||
          voices.find(
            (v) => v.lang.startsWith('en') && /female|zira|samantha|karen|victoria|susan/i.test(v.name)
          ) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0];

        if (preferred) utterance.voice = preferred;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        speakingIdRef.current = msgId;
        setSpeakingMessageId(msgId);

        utterance.onend = () => {
          if (speakingIdRef.current === msgId) {
            stopSpeaking();
          }
        };
        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('Device speech synthesis failed:', e);
          }
          if (speakingIdRef.current === msgId) {
            stopSpeaking();
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Device speech synthesis exception:', e);
        stopSpeaking();
      }
    },
    [stopSpeaking]
  );

  const startSpeaking = useCallback(
    (msg) => {
      stopSpeaking();

      const cleanText = cleanTextForSpeech(msg.text);
      if (!cleanText) return;

      const audio = new Audio();
      audioPlayerRef.current = audio;

      // 1. Instant Playback from In-Memory Cache (0ms latency!)
      if (audioCacheRef.current.has(cleanText)) {
        const cachedUrl = audioCacheRef.current.get(cleanText);
        speakingIdRef.current = msg.id;
        setSpeakingMessageId(msg.id);

        audio.src = cachedUrl;
        audio.currentTime = 0;
        audio.onended = () => {
          if (speakingIdRef.current === msg.id) {
            stopSpeaking();
          }
        };
        audio.onerror = (e) => {
          console.warn('Error during cached Kore audio playback, falling back to device voice:', e);
          if (speakingIdRef.current === msg.id) {
            speakWithDeviceVoice(cleanText, msg.id);
          }
        };
        const playPromise = audio.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch((err) => {
            console.warn('Audio play was prevented, falling back to device voice:', err);
            if (speakingIdRef.current === msg.id) {
              speakWithDeviceVoice(cleanText, msg.id);
            }
          });
        }
        return;
      }

      // 2. Fresh generation via backend with primed Audio element
      setSpeechLoadingId(msg.id);
      speakingIdRef.current = msg.id;

      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      try {
        const unlock = audio.play();
        if (unlock && unlock.catch) {
          unlock.catch(() => {});
        }
      } catch {}

      const abortCtrl = new AbortController();
      ttsAbortCtrlRef.current = abortCtrl;

      fetchChatTTS(cleanText, abortCtrl.signal)
        .then((audioUrl) => {
          audioCacheRef.current.set(cleanText, audioUrl);
          setSpeechLoadingId(null);
          if (speakingIdRef.current !== msg.id) {
            return;
          }

          setSpeakingMessageId(msg.id);

          audio.src = audioUrl;
          audio.currentTime = 0;
          try {
            audio.load();
          } catch {}

          audio.onended = () => {
            if (speakingIdRef.current === msg.id) {
              stopSpeaking();
            }
          };

          audio.onerror = (e) => {
            console.warn('Error during Kore audio playback, falling back to device voice:', e);
            if (speakingIdRef.current === msg.id) {
              speakWithDeviceVoice(cleanText, msg.id);
            }
          };

          const playPromise = audio.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch((err) => {
              console.warn('Audio play was prevented, falling back to device voice:', err);
              if (speakingIdRef.current === msg.id) {
                speakWithDeviceVoice(cleanText, msg.id);
              }
            });
          }
        })
        .catch((err) => {
          setSpeechLoadingId(null);
          if (speakingIdRef.current !== msg.id) return;
          console.warn('Kore TTS synthesis error, falling back to device voice:', err);
          speakWithDeviceVoice(cleanText, msg.id);
        });
    },
    [stopSpeaking, speakWithDeviceVoice]
  );

  const handleToggleSpeak = useCallback(
    (msg) => {
      if (speakingMessageId === msg.id || speechLoadingId === msg.id) {
        stopSpeaking();
      } else {
        startSpeaking(msg);
      }
    },
    [speakingMessageId, speechLoadingId, startSpeaking, stopSpeaking]
  );

  // Stop speaking when chat panel closes
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
    }
  }, [isOpen, stopSpeaking]);

  // Stop speaking when page navigates away, unmounts, or window closes
  useEffect(() => {
    stopSpeaking();
  }, [location.pathname, stopSpeaking]);

  useEffect(() => {
    const handleUnload = () => {
      stopSpeaking();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      stopSpeaking();
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [stopSpeaking]);

  // FAB size & position state (Small: 48px by default)
  const [fabSize, setFabSize] = useState(loadSavedSize);
  const currentDiameter = FAB_SIZES[fabSize]?.size || 48;
  const currentIconSize = FAB_SIZES[fabSize]?.iconSize || 20;

  const [position, setPosition] = useState(() => loadSavedPosition(currentDiameter));
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  // Dragging refs
  const pointerStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const hasDraggedRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const activePointerIdRef = useRef(null);
  const posRef = useRef(position);
  posRef.current = position;
  const fabSizeRef = useRef(fabSize);
  fabSizeRef.current = fabSize;

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Adjust position when window resizes so button is never outside viewport
  useEffect(() => {
    const handleResize = () => {
      const diameter = FAB_SIZES[fabSizeRef.current]?.size || 48;
      setPosition((prev) => {
        if (!prev) return prev;
        const clamped = clampPosition(prev.x, prev.y, diameter);
        if (clamped.x !== prev.x || clamped.y !== prev.y) {
          try {
            localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(clamped));
          } catch {}
          return clamped;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent unwanted text selection while dragging anywhere on screen
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragging]);

  // Dismiss context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleDismiss = () => setContextMenu(null);
    window.addEventListener('pointerdown', handleDismiss);
    return () => window.removeEventListener('pointerdown', handleDismiss);
  }, [contextMenu]);

  const handleSizeChange = useCallback((newSize) => {
    if (!FAB_SIZES[newSize]) return;
    setFabSize(newSize);
    try {
      localStorage.setItem(STORAGE_SIZE_KEY, newSize);
    } catch {}

    const newDiameter = FAB_SIZES[newSize].size;
    setPosition((prev) => {
      const current = prev || getDefaultPosition(newDiameter);
      const clamped = clampPosition(current.x, current.y, newDiameter);
      try {
        localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(clamped));
      } catch {}
      return clamped;
    });
  }, []);

  const handleResetPosition = useCallback(() => {
    const diameter = FAB_SIZES[fabSizeRef.current]?.size || 48;
    const defaultPos = getDefaultPosition(diameter);
    setPosition(defaultPos);
    try {
      localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(defaultPos));
    } catch {}
  }, []);

  // Pointer event handlers for desktop mouse and mobile touch
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button or touch
    if (contextMenu) setContextMenu(null);

    const currentPos = posRef.current || getDefaultPosition(currentDiameter);

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: currentPos.x,
      top: currentPos.y,
    };
    hasDraggedRef.current = false;
    isPointerDownRef.current = true;
    activePointerIdRef.current = e.pointerId;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current || e.pointerId !== activePointerIdRef.current) return;

    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (!hasDraggedRef.current && dist >= DRAG_THRESHOLD) {
      hasDraggedRef.current = true;
      setIsDragging(true);
    }

    if (hasDraggedRef.current) {
      const nextPos = clampPosition(
        pointerStartRef.current.left + dx,
        pointerStartRef.current.top + dy,
        currentDiameter
      );
      setPosition(nextPos);
    }
  };

  const handlePointerUp = (e) => {
    if (e.pointerId !== activePointerIdRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    isPointerDownRef.current = false;
    activePointerIdRef.current = null;

    if (hasDraggedRef.current) {
      setIsDragging(false);
      if (posRef.current) {
        try {
          localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(posRef.current));
        } catch {}
      }
      // Suppress the click event that triggers immediately after pointerup
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 80);
    }
  };

  const handlePointerCancel = (e) => {
    if (e.pointerId === activePointerIdRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      isPointerDownRef.current = false;
      activePointerIdRef.current = null;
      setIsDragging(false);
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 80);
    }
  };

  const handleFabClick = (e) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen((v) => !v);
  };

  const handleFabContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const menuW = 190;
    const menuH = 170;
    const clickX = e.clientX;
    const clickY = e.clientY;
    const menuX = Math.min(Math.max(10, clickX - menuW / 2), window.innerWidth - menuW - 10);
    const menuY = Math.min(Math.max(10, clickY - menuH - 10), window.innerHeight - menuH - 10);
    setContextMenu({ x: menuX, y: menuY });
  };

  const sendMessage = useCallback(
    async (text, overrideInputMode = null) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      stopSpeaking();

      const inputMode = overrideInputMode || (isVoiceTranscript ? 'voice' : 'text');

      const userMsg = {
        id: Date.now(),
        role: 'user',
        text: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsVoiceTranscript(false);
      setIsTyping(true);

      const result = await sendChatMessage({
        message: trimmed,
        inputMode: inputMode,
      });

      if (result.success) {
        const { answer, answer_type, page, actions, suggestions } = result.data;
        const botMsg = {
          id: Date.now() + 1,
          role: 'bot',
          text: answer,
          answer_type,
          page,
          actions,
          suggestions,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        handlePrefetch(botMsg);
      } else {
        // Fallback: If backend service is not reached (e.g. Netlify static hosting without backend proxy),
        // answer directly using the client-side knowledge engine so the visitor gets an immediate answer!
        const fallbackText = getResponse(trimmed);
        const botMsg = {
          id: Date.now() + 1,
          role: 'bot',
          text: fallbackText,
          answer_type: 'answered',
          suggestions: [
            'What is EduCrop?',
            'What are the key features?',
            'Tell me about pricing plans',
            'How do I contact support?',
          ],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        handlePrefetch(botMsg);
      }

      setIsTyping(false);

      if (!isOpen) {
        setUnread((n) => n + 1);
      }
    },
    [isTyping, isOpen, isVoiceTranscript, stopSpeaking, handlePrefetch]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (sugText) => {
    sendMessage(sugText, 'text');
  };

  const handleNavigate = (url) => {
    setIsOpen(false);
    setIsMaximized(false);
    navigate(url);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    stopSpeaking();
    setMessages([WELCOME_MESSAGE]);
    setUnread(0);
    setIsVoiceTranscript(false);
  };

  // ── Full-page layout ──────────────────────────
  if (fullPage) {
    return (
      <div className="chatbot-fullpage">
        <ParticleCanvas />
        <div className="chatbot-fullpage-inner">
          <ChatHeader onClear={clearChat} fullPage />
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            onSuggestionClick={handleSuggestionClick}
            onNavigate={handleNavigate}
            messagesEndRef={messagesEndRef}
            speakingMessageId={speakingMessageId}
            speechLoadingId={speechLoadingId}
            onToggleSpeak={handleToggleSpeak}
            onPrefetch={handlePrefetch}
          />
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            isTyping={isTyping}
            isVoiceTranscript={isVoiceTranscript}
            setIsVoiceTranscript={setIsVoiceTranscript}
          />
        </div>
      </div>
    );
  }

  // ── Floating widget layout ─────────────────────
  return (
    <>
      {/* Floating bubble button */}
      <button
        id="chatbot-fab"
        className={`chatbot-fab size-${fabSize} ${isOpen ? 'open' : ''} ${isDragging ? 'dragging' : ''}`}
        style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleFabClick}
        onContextMenu={handleFabContextMenu}
        aria-label="Open EduBot chat"
        type="button"
      >
        <div className="fab-icon-wrapper">
          <img
            src="/assets/images/chatbot-icon-v2.png"
            alt="EduBot"
            className="fab-avatar"
            draggable={false}
          />
        </div>
        {!isOpen && unread > 0 && <span className="fab-badge">{unread}</span>}
        <div className="fab-ripple" />
      </button>

      {/* Context Menu when right clicking FAB */}
      {contextMenu && (
        <div
          className="fab-context-menu"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          role="menu"
          aria-label="Button size options"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="fab-context-header">
            <span>Button Size</span>
          </div>
          <div className="fab-context-options">
            {Object.entries(FAB_SIZES).map(([key, opt]) => (
              <button
                key={key}
                type="button"
                className={`fab-context-item ${fabSize === key ? 'active' : ''}`}
                onClick={() => {
                  handleSizeChange(key);
                  setContextMenu(null);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    className="context-item-dot"
                    style={{
                      width: `${Math.round(opt.size * 0.28)}px`,
                      height: `${Math.round(opt.size * 0.28)}px`,
                    }}
                  />
                  <span className="context-item-name">
                    {opt.name} ({opt.size}px)
                  </span>
                </div>
                {fabSize === key && <span className="context-check">✓</span>}
              </button>
            ))}
          </div>
          <div className="fab-context-divider" />
          <button
            type="button"
            className="fab-context-item reset-item"
            onClick={() => {
              handleResetPosition();
              setContextMenu(null);
            }}
          >
            <RotateCcw size={13} style={{ marginRight: '6px' }} />
            <span>Reset Position</span>
          </button>
        </div>
      )}

      {/* Chat window */}
      <div
        className={`chatbot-window ${isOpen ? 'open' : ''} ${isMaximized ? 'maximized' : ''}`}
        style={getWindowPosition(position, currentDiameter, isMaximized)}
        role="dialog"
        aria-label="EduBot Chat"
      >
        <ParticleCanvas />
        <ChatHeader
          onClear={clearChat}
          onClose={() => setIsOpen(false)}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
          fabSize={fabSize}
          onSizeChange={handleSizeChange}
          onResetPosition={handleResetPosition}
        />
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          onSuggestionClick={handleSuggestionClick}
          onNavigate={handleNavigate}
          messagesEndRef={messagesEndRef}
          speakingMessageId={speakingMessageId}
          speechLoadingId={speechLoadingId}
          onToggleSpeak={handleToggleSpeak}
          onPrefetch={handlePrefetch}
        />
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          isTyping={isTyping}
          isVoiceTranscript={isVoiceTranscript}
          setIsVoiceTranscript={setIsVoiceTranscript}
        />
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────

function ChatHeader({
  onClear,
  onClose,
  fullPage,
  isMaximized,
  setIsMaximized,
  fabSize,
  onSizeChange,
  onResetPosition,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showSettings]);

  return (
    <div className="chatbot-header">
      <div className="chatbot-header-left">
        <div className="header-avatar-container">
          <div className="header-avatar">
            <img src="/assets/images/chatbot-icon-v2.png" alt="EduBot" />
          </div>
        </div>
        <div className="header-info">
          <h3 className="header-name">EduBot</h3>
          <p className="header-status">
            <span className="status-pulse" />
            AI-Powered • Always Online
          </p>
        </div>
      </div>
      <div className="chatbot-header-actions">
        {!fullPage && onSizeChange && (
          <div className="header-settings-wrapper" ref={settingsRef}>
            <button
              type="button"
              className={`header-action-btn ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings((v) => !v)}
              title="Button Size & Settings"
              aria-label="Floating button size and settings"
              aria-expanded={showSettings}
            >
              <SlidersHorizontal size={17} />
            </button>
            {showSettings && (
              <div
                className="header-settings-popover"
                role="dialog"
                aria-label="Floating button size settings"
              >
                <div className="settings-popover-header">
                  <span className="settings-popover-title">Floating Button Size</span>
                </div>
                <div className="size-options-grid">
                  {Object.entries(FAB_SIZES).map(([key, opt]) => (
                    <button
                      key={key}
                      type="button"
                      className={`size-option-btn ${fabSize === key ? 'active' : ''}`}
                      onClick={() => onSizeChange(key)}
                    >
                      <div className="size-option-left">
                        <span
                          className="size-option-circle"
                          style={{
                            width: `${Math.round(opt.size * 0.35)}px`,
                            height: `${Math.round(opt.size * 0.35)}px`,
                          }}
                        />
                        <div className="size-option-info">
                          <span className="size-option-name">{opt.name}</span>
                          <span className="size-option-val">{opt.size}px</span>
                        </div>
                      </div>
                      {fabSize === key && <span className="size-check">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="settings-popover-divider" />
                <button
                  type="button"
                  className="settings-reset-pos-btn"
                  onClick={() => {
                    onResetPosition();
                  }}
                >
                  <RotateCcw size={13} style={{ marginRight: '6px' }} />
                  Reset Position to Corner
                </button>
              </div>
            )}
          </div>
        )}
        <button
          className="header-action-btn"
          onClick={onClear}
          title="Clear chat"
          aria-label="Clear chat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.08" />
          </svg>
        </button>
        {!fullPage && onClose && (
          <>
            <button
              className="header-action-btn"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? 'Restore' : 'Maximize'}
              aria-label={isMaximized ? 'Restore chat' : 'Maximize chat'}
            >
              {isMaximized ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
            <button
              className="header-action-btn"
              onClick={onClose}
              title="Close chat"
              aria-label="Close chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ChatMessages({
  messages,
  isTyping,
  onSuggestionClick,
  onNavigate,
  messagesEndRef,
  speakingMessageId,
  speechLoadingId,
  onToggleSpeak,
  onPrefetch,
}) {
  return (
    <div className="chatbot-messages" role="log" aria-live="polite" aria-label="Chat messages">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          msg={msg}
          onSuggestionClick={onSuggestionClick}
          onNavigate={onNavigate}
          isSpeaking={speakingMessageId === msg.id}
          isLoadingSpeech={speechLoadingId === msg.id}
          onToggleSpeak={() => onToggleSpeak && onToggleSpeak(msg)}
          onPrefetch={() => onPrefetch && onPrefetch(msg)}
        />
      ))}
      {isTyping && <TypingDots />}
      <div ref={messagesEndRef} />
    </div>
  );
}

function ChatInput({
  input,
  setInput,
  onSubmit,
  onKeyDown,
  inputRef,
  isTyping,
  isVoiceTranscript,
  setIsVoiceTranscript,
}) {
  const [isListening, setIsListening] = useState(false);
  const [micDenied, setMicDenied] = useState(false);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSpeechSupported = Boolean(SpeechRecognition);

  const toggleListening = () => {
    if (isListening || !isSpeechSupported) return;

    setMicDenied(false);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e);
      setIsListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setMicDenied(true);
      }
    };
    recognition.onresult = (e) => {
      if (e.results && e.results[0] && e.results[0][0]) {
        const transcript = e.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsVoiceTranscript(true);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (!val.trim()) {
      setIsVoiceTranscript(false);
    }
  };

  return (
    <form className="chatbot-input-area" onSubmit={onSubmit}>
      {micDenied && (
        <div className="mic-denied-notice">
          Microphone permission denied. Please allow microphone access in browser settings.
        </div>
      )}
      <div className="input-wrapper">
        <textarea
          ref={inputRef}
          id="chatbot-input"
          className="chatbot-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          placeholder="Ask me anything about EduCrop..."
          rows={1}
          disabled={isTyping}
          aria-label="Type your message"
        />
        <div className="input-actions">
          {isSpeechSupported && (
            <button
              type="button"
              className={`chatbot-voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              disabled={isTyping}
              aria-label="Voice message"
              title="Voice message (Web Speech API)"
            >
              <Mic size={20} />
            </button>
          )}
          <button
            type="submit"
            id="chatbot-send-btn"
            className={`chatbot-send-btn ${input.trim() && !isTyping ? 'active' : ''}`}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
      <p className="input-hint">Press Enter to send • Shift+Enter for new line</p>
    </form>
  );
}
