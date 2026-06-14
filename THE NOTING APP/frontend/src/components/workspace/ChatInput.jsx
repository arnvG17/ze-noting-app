import React, { useRef, useEffect } from 'react';

const ChatInput = ({ value, onChange, onSubmit, isLoading, selectedCount, onGenerateFlowchart }) => {
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 140) + 'px';
        }
    }, [value]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !isLoading) {
                onSubmit();
            }
        }
    };

    const canSend = value.trim() && !isLoading;

    return (
        <div className="chat-input-container">
            <div className="chat-input-wrapper">
                <textarea
                    ref={textareaRef}
                    className="chat-input-textarea"
                    placeholder="Ask anything about your documents..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={1}
                />
                <div className="chat-input-actions">
                    <div className="chat-input-left" style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="chat-input-btn" style={{ cursor: 'default' }}>
                            <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: selectedCount > 0 ? '#8b5cf6' : '#3f3f46',
                                display: 'inline-block'
                            }} />
                            <span>{selectedCount} source{selectedCount !== 1 ? 's' : ''}</span>
                        </div>
                        {selectedCount > 0 && onGenerateFlowchart && (
                            <button
                                type="button"
                                className="chat-flowchart-btn"
                                onClick={onGenerateFlowchart}
                                disabled={isLoading}
                                title="Generate flowchart from selected sources"
                                style={{
                                    background: 'rgba(139, 92, 246, 0.15)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    color: '#c084fc',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginLeft: '10px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(90deg)' }}>
                                    <path d="M9 18H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
                                    <path d="M15 18h5a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-5" />
                                    <line x1="12" y1="4" x2="12" y2="20" />
                                    <polyline points="8 12 12 12 16 12" />
                                </svg>
                                Generate Flowchart
                            </button>
                        )}
                    </div>
                    <button
                        className={`chat-send-btn ${canSend ? 'active' : 'inactive'}`}
                        onClick={canSend ? onSubmit : undefined}
                        disabled={!canSend}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 19V5m0 0l-7 7m7-7l7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
