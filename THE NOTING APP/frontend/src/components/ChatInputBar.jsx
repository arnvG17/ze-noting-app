import React, { useState } from 'react';
import { FiSend, FiPaperclip } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

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
            maxWidth: '700px',
            margin: '0 auto',
            animation: 'fadeInUp 0.5s ease-out'
        }}>
            <form onSubmit={handleSubmit} style={{
                background: '#1a1a22',
                borderRadius: '16px',
                border: '1px solid #2a2a35',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
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
                        lineHeight: 1.5
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
                        <button
                            type="button"
                            style={{
                                background: '#2a2a35',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#a1a1aa',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.85rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#3a3a45'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#2a2a35'}
                        >
                            <FiPaperclip size={14} />
                            Attach
                        </button>
                    </div>

                    {/* Right side - Chat button and send */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#2a2a35',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            color: '#a1a1aa',
                            fontSize: '0.85rem'
                        }}>
                            <FaRobot size={14} />
                            <span>Chat</span>
                        </div>

                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            style={{
                                background: inputValue.trim() ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : '#2a2a35',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                                color: inputValue.trim() ? '#fff' : '#71717a',
                                transition: 'all 0.2s'
                            }}
                        >
                            <FiSend size={16} />
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
