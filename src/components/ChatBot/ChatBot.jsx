import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mic, ArrowRight, Mail } from 'lucide-react';
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

// ── Single message bubble ─────────────────────────
function MessageBubble({ msg, onSuggestionClick, onNavigate }) {
  const isBot = msg.role === 'bot';
  const isError = Boolean(msg.isError);
  const navigate = useNavigate();

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

// ── Main ChatBot widget ───────────────────────────
export default function ChatBot({ fullPage = false }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(fullPage);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isVoiceTranscript, setIsVoiceTranscript] = useState(false);

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

  const sendMessage = useCallback(
    async (text, overrideInputMode = null) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

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
    [isTyping, isOpen, isVoiceTranscript]
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
        className={`chatbot-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open EduBot chat"
      >
        <div className="fab-icon-wrapper">
          {isOpen ? (
            <X className="fab-close-icon" size={28} />
          ) : (
            <img src="/assets/images/chatbot-icon-v2.png" alt="EduBot" className="fab-avatar" />
          )}
        </div>
        {!isOpen && unread > 0 && <span className="fab-badge">{unread}</span>}
        <div className="fab-ripple" />
      </button>

      {/* Chat window */}
      <div
        className={`chatbot-window ${isOpen ? 'open' : ''} ${isMaximized ? 'maximized' : ''}`}
        role="dialog"
        aria-label="EduBot Chat"
      >
        <ParticleCanvas />
        <ChatHeader
          onClear={clearChat}
          onClose={() => setIsOpen(false)}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        />
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          onSuggestionClick={handleSuggestionClick}
          onNavigate={handleNavigate}
          messagesEndRef={messagesEndRef}
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

function ChatHeader({ onClear, onClose, fullPage, isMaximized, setIsMaximized }) {
  return (
    <div className="chatbot-header">
      <div className="chatbot-header-left">
        <div className="header-avatar-container">
          <div className="header-avatar">
            <img src="/assets/images/chatbot-icon-v2.png" alt="EduBot" />
          </div>
          <span className="avatar-online-dot" />
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
}) {
  return (
    <div className="chatbot-messages" role="log" aria-live="polite" aria-label="Chat messages">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          msg={msg}
          onSuggestionClick={onSuggestionClick}
          onNavigate={onNavigate}
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
