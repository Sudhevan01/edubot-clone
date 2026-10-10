import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic } from 'lucide-react';
import { WELCOME_MESSAGE, QUICK_REPLIES, getResponse } from '../../data/chatbotResponses';
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
function MessageBubble({ msg }) {
  const isBot = msg.role === 'bot';
  return (
    <div className={`chatbot-message ${isBot ? 'bot-message' : 'user-message'}`}>
      {isBot && (
        <div className="bot-avatar-mini">
          <img src="/assets/images/chatbot-icon-v2.png" alt="EduBot" />
        </div>
      )}
      <div className={`chatbot-bubble ${isBot ? 'bot' : 'user'}`}>
        <div className="bubble-content">
          {isBot ? renderMarkdown(msg.text) : <p className="chat-md-p">{msg.text}</p>}
        </div>
        <span className="bubble-time">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ── Main ChatBot widget ───────────────────────────
export default function ChatBot({ fullPage = false }) {
  const [isOpen, setIsOpen] = useState(fullPage);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [unread, setUnread] = useState(0);
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

  const sendMessage = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowQuickReplies(false);
    setIsTyping(true);

    // Simulate natural typing delay
    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      const responseText = getResponse(trimmed);
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      if (!isOpen) {
        setUnread((n) => n + 1);
      }
    }, delay);
  }, [isTyping, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (qr) => {
    sendMessage(qr.query);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setShowQuickReplies(true);
    setUnread(0);
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
            showQuickReplies={showQuickReplies}
            onQuickReply={handleQuickReply}
            messagesEndRef={messagesEndRef}
          />
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            isTyping={isTyping}
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
        {!isOpen && unread > 0 && (
          <span className="fab-badge">{unread}</span>
        )}
        <div className="fab-ripple" />
      </button>

      {/* Chat window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''} ${isMaximized ? 'maximized' : ''}`} role="dialog" aria-label="EduBot Chat">
        <ParticleCanvas />
        <ChatHeader onClear={clearChat} onClose={() => setIsOpen(false)} isMaximized={isMaximized} setIsMaximized={setIsMaximized} />
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          showQuickReplies={showQuickReplies}
          onQuickReply={handleQuickReply}
          messagesEndRef={messagesEndRef}
        />
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          isTyping={isTyping}
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
              title={isMaximized ? "Restore" : "Maximize"}
              aria-label={isMaximized ? "Restore chat" : "Maximize chat"}
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

function ChatMessages({ messages, isTyping, showQuickReplies, onQuickReply, messagesEndRef }) {
  return (
    <div className="chatbot-messages" role="log" aria-live="polite" aria-label="Chat messages">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
      {isTyping && <TypingDots />}
      {showQuickReplies && !isTyping && (
        <div className="quick-replies">
          <p className="quick-replies-label">Quick questions:</p>
          <div className="quick-replies-grid">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.id}
                className="quick-reply-chip"
                onClick={() => onQuickReply(qr)}
                type="button"
              >
                {qr.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

function ChatInput({ input, setInput, onSubmit, onKeyDown, inputRef, isTyping }) {
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    if (isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  return (
    <form className="chatbot-input-area" onSubmit={onSubmit}>
      <div className="input-wrapper">
        <textarea
          ref={inputRef}
          id="chatbot-input"
          className="chatbot-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask me anything about EduCrop..."
          rows={1}
          disabled={isTyping}
          aria-label="Type your message"
        />
        <div className="input-actions">
          <button
            type="button"
            className={`chatbot-voice-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            disabled={isTyping}
            aria-label="Voice message"
            title="Voice message"
          >
            <Mic size={20} />
          </button>
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
