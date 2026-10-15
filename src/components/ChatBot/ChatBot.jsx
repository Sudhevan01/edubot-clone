import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Mic, ArrowRight, Mail, SlidersHorizontal, RotateCcw, Volume2, Square } from 'lucide-react';
import { WELCOME_MESSAGE } from '../../data/chatbotResponses';
import { sendChatMessage } from '../../services/chatApi';
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

function getBestVoice(targetLang = 'en-IN') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  try {
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;

    const normTarget = targetLang.toLowerCase().replace('_', '-');
    const isEnglish = normTarget.startsWith('en');

    // Keywords to identify female voices across operating systems and browsers
    const femaleKeywords = [
      'female', 'woman', 'girl', 'zira', 'heera', 'neerja', 'hazel',
      'susan', 'jenny', 'aria', 'eva', 'catherine', 'linda', 'sarah',
      'karen', 'samantha', 'victoria', 'natasha', 'ayushi', 'veena', 'swara'
    ];
    // Keywords to filter out male voices
    const maleKeywords = [
      'male', 'man', 'david', 'ravi', 'prabhat', 'mark', 'george',
      'guy', 'richard', 'james', 'brian'
    ];

    const isExplicitlyMale = (v) => {
      const name = (v.name || '').toLowerCase();
      return maleKeywords.some((m) => name.includes(m));
    };

    const isExplicitlyFemale = (v) => {
      const name = (v.name || '').toLowerCase();
      if (isExplicitlyMale(v)) return false;
      return femaleKeywords.some((f) => name.includes(f));
    };

    // 1. Target lang (e.g. en-in) + explicitly female
    const targetFemale = voices.find(
      (v) => v.lang && v.lang.toLowerCase().replace('_', '-') === normTarget && isExplicitlyFemale(v)
    );
    if (targetFemale) return targetFemale;

    // 2. Target lang (e.g. en-in) + not male
    const targetNotMale = voices.find(
      (v) => v.lang && v.lang.toLowerCase().replace('_', '-') === normTarget && !isExplicitlyMale(v)
    );
    if (targetNotMale) return targetNotMale;

    // 3. Any English voice + explicitly female (e.g. Microsoft Zira Desktop, Google UK English Female)
    if (isEnglish) {
      const anyEnglishFemale = voices.find(
        (v) => v.lang && v.lang.toLowerCase().startsWith('en') && isExplicitlyFemale(v)
      );
      if (anyEnglishFemale) return anyEnglishFemale;

      const anyEnglishNotMale = voices.find(
        (v) => v.lang && v.lang.toLowerCase().startsWith('en') && !isExplicitlyMale(v)
      );
      if (anyEnglishNotMale) return anyEnglishNotMale;
    }

    // 4. Any explicitly female voice in any language
    const anyFemale = voices.find((v) => isExplicitlyFemale(v));
    if (anyFemale) return anyFemale;

    // 5. Any voice that is not explicitly male
    const anyNotMale = voices.find((v) => !isExplicitlyMale(v));
    if (anyNotMale) return anyNotMale;

    // 6. Fallback
    return voices.find((v) => v.default) || voices[0] || null;
  } catch (err) {
    console.warn('Error selecting speech voice:', err);
    return null;
  }
}

// ── Single message bubble ─────────────────────────
function MessageBubble({ msg, onSuggestionClick, onNavigate, isSpeaking, onToggleSpeak }) {
  const isBot = msg.role === 'bot';
  const isError = Boolean(msg.isError);
  const navigate = useNavigate();

  const isSpeechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

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
            className={`bubble-speech-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={onToggleSpeak}
            aria-label={isSpeaking ? 'Stop reading' : 'Read message aloud'}
            title={isSpeaking ? 'Stop reading' : 'Read message aloud'}
          >
            {isSpeaking ? (
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

  // Speech synthesis state & voice config
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const speakingIdRef = useRef(null);
  const preferredVoiceLang = 'en-IN'; // Structured to easily follow selected language in the future

  // Listen for voiceschanged event so async voices load properly
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const handleVoicesChanged = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch {}
    };

    try {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    } catch {}

    return () => {
      try {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      } catch {}
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (err) {
      console.warn('Error stopping speech synthesis:', err);
    }
    speakingIdRef.current = null;
    setSpeakingMessageId(null);
  }, []);

  const startSpeaking = useCallback(
    (msg) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('Error resetting speech synthesis:', err);
      }

      const cleanText = cleanTextForSpeech(msg.text);
      if (!cleanText) return;

      const sentences = splitIntoSentences(cleanText);
      if (sentences.length === 0) return;

      speakingIdRef.current = msg.id;
      setSpeakingMessageId(msg.id);

      let currentIndex = 0;

      const speakNextSentence = () => {
        if (speakingIdRef.current !== msg.id) return;

        if (currentIndex >= sentences.length) {
          speakingIdRef.current = null;
          setSpeakingMessageId(null);
          return;
        }

        try {
          const sentence = sentences[currentIndex];
          const utterance = new SpeechSynthesisUtterance(sentence);
          utterance.rate = 1.0;
          utterance.pitch = 1.05;
          utterance.lang = preferredVoiceLang;

          const voice = getBestVoice(preferredVoiceLang);
          if (voice) {
            utterance.voice = voice;
          }

          utterance.onend = () => {
            if (speakingIdRef.current === msg.id) {
              currentIndex++;
              speakNextSentence();
            }
          };

          utterance.onerror = (e) => {
            if (e.error === 'interrupted' || e.error === 'canceled') {
              return;
            }
            console.warn('Speech synthesis utterance error:', e);
            if (speakingIdRef.current === msg.id) {
              currentIndex++;
              speakNextSentence();
            }
          };

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.error('Error speaking utterance:', err);
          stopSpeaking();
        }
      };

      speakNextSentence();
    },
    [stopSpeaking, preferredVoiceLang]
  );

  const handleToggleSpeak = useCallback(
    (msg) => {
      if (speakingMessageId === msg.id) {
        stopSpeaking();
      } else {
        startSpeaking(msg);
      }
    },
    [speakingMessageId, startSpeaking, stopSpeaking]
  );

  // Chrome watchdog timer to keep long speech sessions alive
  useEffect(() => {
    if (!speakingMessageId) return;

    const watchdog = setInterval(() => {
      try {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      } catch {}
    }, 10000);

    return () => clearInterval(watchdog);
  }, [speakingMessageId]);

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
      } else {
        const botErrMsg = {
          id: Date.now() + 1,
          role: 'bot',
          isError: true,
          text: result.error?.message || 'An error occurred. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botErrMsg]);
      }

      setIsTyping(false);

      if (!isOpen) {
        setUnread((n) => n + 1);
      }
    },
    [isTyping, isOpen, isVoiceTranscript, stopSpeaking]
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
            onToggleSpeak={handleToggleSpeak}
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
          onToggleSpeak={handleToggleSpeak}
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
  onToggleSpeak,
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
          onToggleSpeak={() => onToggleSpeak && onToggleSpeak(msg)}
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
