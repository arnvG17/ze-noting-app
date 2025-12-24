import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { useDocumentText } from './DocumentTextContext';
import CodeBlock from './ui/CodeBlock';
import { TextShimmer } from './ui/text-shimmer';
import { FiPaperclip, FiMessageSquare, FiChevronUp } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';

const InlineChatBox = ({ isExpanded, onToggle }) => {
    const { documentText } = useDocumentText();
    const contextText = (documentText || '').slice(0, 4000);
    const isTruncated = (documentText || '').length > 4000;

    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: 'Hello! I\'m your AI assistant. Ask me anything about your document!'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        // Auto-expand when sending
        if (!isExpanded) onToggle();

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputValue.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('https://the-noting-app.onrender.com/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: contextText,
                    question: userMessage.content
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: data.answer || 'I apologize, but I couldn\'t process your request.'
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: 'I\'m sorry, I encountered an error. Please try again.'
            }]);
            toast.error('Failed to get response from AI');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '750px',
            margin: '0 auto',
            animation: 'fadeInUp 0.5s ease-out'
        }}>
            {/* Expandable Messages Area */}
            <div style={{
                maxHeight: isExpanded ? '400px' : '0px',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: isExpanded ? '0.5rem' : '0',
                opacity: isExpanded ? 1 : 0
            }}>
                <div style={{
                    background: 'linear-gradient(180deg, #1f1f2a 0%, #1a1a24 100%)',
                    borderRadius: '20px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    overflow: 'hidden'
                }}>
                    {/* Chat Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.875rem 1.25rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiMessageSquare size={16} color="#fff" />
                            </div>
                            <span style={{ color: '#e4e4e7', fontWeight: 600, fontSize: '0.95rem' }}>AI Assistant</span>
                        </div>
                        <button
                            onClick={onToggle}
                            style={{
                                background: '#2a2a38',
                                border: '1px solid #3a3a48',
                                borderRadius: '8px',
                                color: '#a1a1aa',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem'
                            }}
                        >
                            <FiChevronUp size={14} />
                            Collapse
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        height: '300px',
                        overflowY: 'auto',
                        padding: '1rem 1.25rem'
                    }}>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{
                                    maxWidth: '80%',
                                    background: message.type === 'user'
                                        ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                                        : '#2a2a38',
                                    color: '#fff',
                                    borderRadius: 16,
                                    borderTopRightRadius: message.type === 'user' ? 4 : 16,
                                    borderTopLeftRadius: message.type === 'bot' ? 4 : 16,
                                    padding: '0.75rem 1rem',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.5
                                }}>
                                    {message.type === 'bot' ? (
                                        <ReactMarkdown
                                            components={{
                                                code({ node, inline, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    return !inline ? (
                                                        <CodeBlock
                                                            language={match ? match[1] : 'text'}
                                                            code={String(children).replace(/\n$/, '')}
                                                        />
                                                    ) : (
                                                        <code style={{
                                                            background: 'rgba(139, 92, 246, 0.2)',
                                                            padding: '0.15rem 0.4rem',
                                                            borderRadius: 4,
                                                            fontSize: '0.85em'
                                                        }} {...props}>{children}</code>
                                                    )
                                                }
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    ) : message.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{
                                    background: '#2a2a38',
                                    borderRadius: 16,
                                    borderTopLeftRadius: 4,
                                    padding: '0.75rem 1rem',
                                }}>
                                    <TextShimmer className="text-sm">Thinking...</TextShimmer>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {isTruncated && (
                        <div style={{
                            color: '#fbbf24',
                            background: '#18181b',
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            textAlign: 'center',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            Note: Using first 4000 characters of your document.
                        </div>
                    )}
                </div>
            </div>

            {/* ChatInput Bar - Same style as shadcn component */}
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
                    placeholder="Ask anything about your document..."
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
                    onFocus={() => !isExpanded && messages.length > 1 && onToggle()}
                />

                {/* Bottom bar with buttons */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    {/* Left side buttons */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Plus button */}
                        <button type="button" style={{
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
                        }}>+</button>

                        {/* Attach button */}
                        <button type="button" style={{
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
                        }}>
                            <FiPaperclip size={14} />
                            Attach
                        </button>

                        {/* Theme button */}
                        <button type="button" style={{
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
                        }}>
                            <HiOutlineSparkles size={14} />
                            Theme
                        </button>
                    </div>

                    {/* Right side - Chat indicator and send */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                        <button type="button" style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#71717a',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
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
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default InlineChatBox;
