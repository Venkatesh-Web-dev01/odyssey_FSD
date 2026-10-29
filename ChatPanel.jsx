import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

const SUGGESTION_CHIPS = [
  'Make Day 2 less packed',
  'Add more food spots',
  'Reduce the budget',
  'Add more nature',
];

/**
 * ChatPanel — Conversational refinement interface for Odyssey.
 *
 * @param {Object} props
 * @param {Array} props.chatHistory - Array of { role, content, createdAt }
 * @param {Function} props.onSendMessage - Callback when user sends a message
 * @param {boolean} props.isRefining - Whether a refinement request is in progress
 * @param {number} props.currentVersion - Current itinerary version number
 * @param {boolean} props.isOpen - Whether the panel is open (mobile)
 * @param {Function} props.onToggle - Toggle panel open/close (mobile)
 */
function ChatPanel({ chatHistory = [], onSendMessage, isRefining, currentVersion, isOpen, onToggle }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isRefining]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isRefining) return;
    onSendMessage(trimmed);
    setMessage('');
  };

  const handleChipClick = (suggestion) => {
    if (isRefining) return;
    onSendMessage(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <aside className={`chat-panel ${isOpen ? 'chat-panel--open' : ''}`}>
      {/* Mobile Toggle Handle */}
      <button
        type="button"
        className="chat-panel__mobile-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close refinement drawer' : 'Open refinement drawer'}
      >
        <span className="toggle-bar" />
      </button>

      {/* Panel Header */}
      <div className="chat-panel__header">
        <div className="chat-header__left">
          <h3 className="chat-title">Refine your journey</h3>
          <span className="chat-subtitle">
            Tell Odyssey what you'd like to change.
          </span>
        </div>
        <span className="chat-version-badge">v{currentVersion || 1}</span>
      </div>

      {/* Messages Container */}
      <div className="chat-panel__messages">
        {chatHistory.length === 0 && !isRefining ? (
          <div className="chat-empty-state">
            <h4 className="chat-empty-title">Refine your journey</h4>
            <p className="chat-empty-text">
              Tell Odyssey what you'd like to change. Your current itinerary state is preserved while applying your exact updates.
            </p>

            {/* Suggestion Chips */}
            <div className="chat-suggestions">
              <span className="suggestions-label">Try asking:</span>
              <div className="suggestions-chips">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="suggestion-btn"
                    onClick={() => handleChipClick(chip)}
                  >
                    "{chip}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`chat-message chat-message--${msg.role}`}
              >
                <div className="message-bubble">
                  <span className="message-role-tag">
                    {msg.role === 'user' ? 'You' : 'Odyssey'}
                  </span>
                  <div className="message-content">{msg.content}</div>
                  {msg.createdAt && (
                    <time className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  )}
                </div>
              </div>
            ))}

            {/* In-Flight Refining Indicator */}
            {isRefining && (
              <div className="chat-message chat-message--assistant chat-message--typing">
                <div className="message-bubble typing-bubble">
                  <span className="message-role-tag">Odyssey</span>
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="typing-label">Refining itinerary...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Strip (when conversation is active) */}
      {chatHistory.length > 0 && !isRefining && (
        <div className="chat-quick-strip">
          {SUGGESTION_CHIPS.slice(0, 2).map((chip) => (
            <button
              key={chip}
              type="button"
              className="quick-chip"
              onClick={() => handleChipClick(chip)}
            >
              + {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form className="chat-panel__input-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            rows="1"
            placeholder="Tell Odyssey what to change..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRefining}
            aria-label="Refinement message"
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!message.trim() || isRefining}
            aria-label="Send refinement request"
          >
            {isRefining ? (
              <span className="chat-spinner" />
            ) : (
              <span className="send-arrow">↑</span>
            )}
          </button>
        </div>
      </form>
    </aside>
  );
}

export default ChatPanel;
