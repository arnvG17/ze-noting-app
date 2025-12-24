import React, { useState } from 'react';
import { FiSend, FiPaperclip, FiMessageSquare } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';

const ChatInputBar = ({ onSendMessage, isLoading, placeholder = "Ask anything about your document..." }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        onSendMessage(inputValue.trim());
        setInputValue('');
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '750px',
            margin: '0 auto',
            animation: 'fadeInUp 0.5s ease-out'
        }}>
            <form onSubmit={handleSubmit} style={{
                background: 'linear-gradient(180deg, #1f1f2a 0%, #1a1a24 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.03) inset'
            }}>
                {/* Input area */}
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={placeholder}
                    disabled={isLoading}
                    rows={2}
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#fff',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'none',
                        lineHeight: 1.6,
                        letterSpacing: '0.01em'
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />

                {/* Bottom bar with buttons */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    {/* Left side buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                    }}>
                        {/* Plus button */}
                        <button
                            type="button"
                            style={{
                                background: '#2a2a38',
                                border: '1px solid #3a3a48',
                                borderRadius: '10px',
                                width: '36px',
                                height: '36px',
                                color: '#a1a1aa',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.1rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#3a3a48';
                                e.currentTarget.style.borderColor = '#4a4a58';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#2a2a38';
                                e.currentTarget.style.borderColor = '#3a3a48';
                            }}
                        >
                            +
                        </button>

                        {/* Attach button */}
                        <button
                            type="button"
                            style={{
                                background: '#2a2a38',
                                border: '1px solid #3a3a48',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                color: '#a1a1aa',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#3a3a48';
                                e.currentTarget.style.borderColor = '#4a4a58';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#2a2a38';
                                e.currentTarget.style.borderColor = '#3a3a48';
                            }}
                        >
                            <FiPaperclip size={14} />
                            Attach
                        </button>

                        {/* Theme button */}
                        <button
                            type="button"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                color: '#71717a',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#a1a1aa'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#71717a'}
                        >
                            <HiOutlineSparkles size={14} />
                            Theme
                        </button>
                    </div>

                    {/* Right side - Chat indicator and send */}
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center'
                    }}>
                        {/* Chat indicator pill */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#2a2a38',
                            border: '1px solid #3a3a48',
                            padding: '7px 14px',
                            borderRadius: '10px',
                            color: '#e4e4e7',
                            fontSize: '0.85rem',
                            fontWeight: 500
                        }}>
                            <FiMessageSquare size={14} />
                            <span>Chat</span>
                        </div>

                        {/* Voice/waves icon */}
                        <button
                            type="button"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#71717a',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 12h2m4-4v8m4-10v12m4-8v4m4-6v8m2-4h2" />
                            </svg>
                        </button>

                        {/* Send button */}
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            style={{
                                background: inputValue.trim()
                                    ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                                    : '#2a2a38',
                                border: inputValue.trim() ? 'none' : '1px solid #3a3a48',
                                borderRadius: '50%',
                                width: '38px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                                color: inputValue.trim() ? '#fff' : '#71717a',
                                transition: 'all 0.2s',
                                boxShadow: inputValue.trim() ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 19V5m0 0l-7 7m7-7l7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </form>

            <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
};

export default ChatInputBar;
