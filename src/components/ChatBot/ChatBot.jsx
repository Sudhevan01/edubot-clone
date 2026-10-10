import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, Paperclip, Plus, Maximize, Minimize } from 'lucide-react';
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
          {msg.attachment && (
            <div className="attachment-preview" style={{ marginBottom: msg.text ? '8px' : '0' }}>
              {msg.attachment.type.startsWith('image/') ? (
                <img src={msg.attachment.url} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px' }} />
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <Paperclip size={14} />
                  <span>{msg.attachment.name}</span>
                </div>
              )}
            </div>
          )}
          {msg.text && (isBot ? renderMarkdown(msg.text) : <p className="chat-md-p">{msg.text}</p>)}
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
  const [attachment, setAttachment] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showCameraModal, setShowCameraModal] = useState(false);
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

  const sendMessage = useCallback((text, fileAttachment = attachment) => {
    const trimmed = text.trim();
    if ((!trimmed && !fileAttachment) || isTyping) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      attachment: fileAttachment ? { name: fileAttachment.name, type: fileAttachment.type, url: URL.createObjectURL(fileAttachment) } : null,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
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
  }, [isTyping, isOpen, attachment]);

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
      <>
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
              attachment={attachment}
              setAttachment={setAttachment}
              setShowCameraModal={setShowCameraModal}
            />
          </div>
        </div>
        {showCameraModal && (
          <CameraModal 
            onCapture={(file) => {
              setAttachment(file);
              setShowCameraModal(false);
            }} 
            onClose={() => setShowCameraModal(false)} 
          />
        )}
      </>
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
          attachment={attachment}
          setAttachment={setAttachment}
          setShowCameraModal={setShowCameraModal}
        />
      </div>
      {showCameraModal && (
        <CameraModal 
          onCapture={(file) => {
            setAttachment(file);
            setShowCameraModal(false);
          }} 
          onClose={() => setShowCameraModal(false)} 
        />
      )}
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

function ChatInput({ input, setInput, onSubmit, onKeyDown, inputRef, isTyping, attachment, setAttachment, setShowCameraModal }) {
  const [isListening, setIsListening] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [acceptType, setAcceptType] = useState('*/*');
  const [captureType, setCaptureType] = useState(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleAttachClick = (type, capture = null) => {
    setShowAttachMenu(false);
    
    if (capture === 'environment') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setShowCameraModal(true);
        return;
      }
    }

    setAcceptType(type);
    setCaptureType(capture);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isSendActive = (input.trim() || attachment) && !isTyping;

  return (
    <form className="chatbot-input-area" onSubmit={onSubmit}>
      {attachment && (
        <div className="input-attachment-preview" style={{ padding: '8px', marginBottom: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Paperclip size={14} />
            <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</span>
          </div>
          <button type="button" onClick={removeAttachment} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={14} />
          </button>
        </div>
      )}
      <div className="input-wrapper">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept={acceptType}
          {...(captureType ? { capture: captureType } : {})}
          onChange={handleFileChange} 
        />
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="chatbot-attach-btn"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={isTyping}
            title="Attach file"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0, transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <Plus size={22} style={{ transition: 'transform 0.2s', transform: showAttachMenu ? 'rotate(45deg)' : 'rotate(0)' }} />
          </button>
          
          {showAttachMenu && (
            <div className="attach-menu" style={{ position: 'absolute', bottom: '45px', left: '0', background: 'var(--cb-glass2)', backdropFilter: 'blur(10px)', border: '1px solid var(--cb-border)', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', minWidth: '150px', animation: 'msg-appear 0.2s ease-out' }}>
              <button type="button" onClick={() => handleAttachClick('image/*')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#fff', padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '500', textAlign: 'left', width: '100%' }} className="attach-menu-item">
                <span style={{ fontSize: '18px' }}>🖼️</span> Image
              </button>
              <button type="button" onClick={() => handleAttachClick('image/*', 'environment')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#fff', padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '500', textAlign: 'left', width: '100%' }} className="attach-menu-item">
                <span style={{ fontSize: '18px' }}>📷</span> Camera
              </button>
              <button type="button" onClick={() => handleAttachClick('.pdf,.doc,.docx,.txt')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#fff', padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '500', textAlign: 'left', width: '100%' }} className="attach-menu-item">
                <span style={{ fontSize: '18px' }}>📄</span> Document
              </button>
              <button type="button" onClick={() => handleAttachClick('video/*')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#fff', padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '500', textAlign: 'left', width: '100%' }} className="attach-menu-item">
                <span style={{ fontSize: '18px' }}>🎥</span> Video
              </button>
              <button type="button" onClick={() => handleAttachClick('audio/*')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#fff', padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '500', textAlign: 'left', width: '100%' }} className="attach-menu-item">
                <span style={{ fontSize: '18px' }}>🎵</span> Audio
              </button>
            </div>
          )}
        </div>
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
            className={`chatbot-send-btn ${isSendActive ? 'active' : ''}`}
            disabled={!isSendActive}
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

// ── Camera Modal Component ──────────────────────────
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleTakePic = () => {
    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          onCapture(file);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isFullScreen ? '0' : '20px' }}>
      <div style={{ background: 'var(--cb-bg)', padding: isFullScreen ? '20px' : '16px', borderRadius: isFullScreen ? '0' : '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: isFullScreen ? '100%' : '500px', height: isFullScreen ? '100%' : 'auto', border: isFullScreen ? 'none' : '1px solid var(--cb-border)', boxShadow: isFullScreen ? 'none' : '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontFamily: 'var(--cb-font)' }}>Take Photo</h3>
          <button onClick={() => setIsFullScreen(!isFullScreen)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
            {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>

        {error ? (
          <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: 0 }}>{error}</p>
        ) : (
          <div style={{ width: '100%', flex: isFullScreen ? 1 : 'none', aspectRatio: isFullScreen ? 'auto' : '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} playsInline muted />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--cb-font)' }}>Cancel</button>
          {!error && (
            <button onClick={handleTakePic} style={{ padding: '10px 24px', background: 'var(--cb-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--cb-font)', fontWeight: 'bold' }}>Capture</button>
          )}
        </div>
      </div>
    </div>
  );
}
