import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FlowchartViewer from '../FlowchartViewer';

const ChatMessage = ({ message, onUpdateFlowchart }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`chat-message ${message.role}`}>
            <div className="chat-message-avatar">
                {isUser ? 'U' : 'AI'}
            </div>
            <div className="chat-message-content" style={{ width: '100%' }}>
                {isUser ? (
                    message.content
                ) : (
                    <>
                        {message.isFlowchartLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
                                <div className="flowchart-spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{message.content}</span>
                            </div>
                        ) : (
                            <>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ node, inline, className, children, ...props }) {
                                            return !inline ? (
                                                <pre><code className={className} {...props}>{children}</code></pre>
                                            ) : (
                                                <code className={className} {...props}>{children}</code>
                                            );
                                        }
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>

                                {message.flowchartData && (
                                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(63, 63, 70, 0.4)', paddingTop: '16px' }}>
                                        <FlowchartViewer
                                            flowchartData={message.flowchartData}
                                            onFlowchartUpdate={(updatedData) => {
                                                if (onUpdateFlowchart) {
                                                    onUpdateFlowchart(message.id, updatedData);
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
