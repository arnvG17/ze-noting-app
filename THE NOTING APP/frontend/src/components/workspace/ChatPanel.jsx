import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, GitBranch, Presentation, Layers, ClipboardList, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import FlowchartViewer from '../FlowchartViewer';
import PitchDeckViewer from './PitchDeckViewer';
import FlashcardViewer from './FlashcardViewer';
import ReportViewer from './ReportViewer';
import PodcastViewer from './PodcastViewer';
import { PromptInputBox } from '../ui/ai-prompt-box';


const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://the-noting-app.onrender.com' : 'http://localhost:5000');

const ChatPanel = ({ 
    notebookId, 
    notebookTitle, 
    onTitleChange, 
    documents, 
    selectedDocIds, 
    summary, 
    setFlowchartData,
    activeCenterView,
    onActiveCenterViewChange,
    flowchartData
}) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const selectedCount = selectedDocIds.length;

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load chat history
    useEffect(() => {
        if (!notebookId) return;
        fetch(`${API_BASE}/api/ask/history/${notebookId}`)
            .then(res => res.json())
            .then(data => {
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages.map(m => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        citations: m.citations
                    })));
                }
            })
            .catch(err => console.warn('Could not load chat history:', err));
    }, [notebookId]);

    const handleSubmit = async (messageText) => {
        if (!messageText || !messageText.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: messageText.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMessage.content,
                    notebookId,
                    selectedDocIds: selectedDocIds.length > 0 ? selectedDocIds : undefined
                })
            });

            if (!response.ok) throw new Error('Failed to get response');
            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.answer || 'I could not process that request.',
                citations: data.citations
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateFlowchart = async () => {
        if (selectedDocIds.length === 0 || isLoading) return;

        const loadingMsgId = 'flow-loading-' + Date.now();
        const placeholderMsg = {
            id: loadingMsgId,
            role: 'assistant',
            content: 'Generating flowchart from selected sources...',
            isFlowchartLoading: true
        };

        setMessages(prev => [...prev, placeholderMsg]);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/generate-flowchart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    selectedDocIds
                })
            });

            if (!response.ok) throw new Error('Failed to generate flowchart');
            const data = await response.json();

            // Replace loading message with actual flowchart message
            setMessages(prev => 
                prev.map(m => m.id === loadingMsgId ? {
                    id: Date.now(),
                    role: 'assistant',
                    content: 'I have analyzed your selected sources and generated this process flowchart:',
                    flowchartData: data
                } : m)
            );

            // Also update the workspace-wide flowchart view
            if (setFlowchartData) {
                setFlowchartData(data);
            }

            // Redirect to flowchart tab to let them see it in full view
            if (onActiveCenterViewChange) {
                onActiveCenterViewChange('flowchart');
            }
        } catch (error) {
            console.error('Flowchart generation error:', error);
            setMessages(prev => 
                prev.map(m => m.id === loadingMsgId ? {
                    id: Date.now(),
                    role: 'assistant',
                    content: 'Sorry, I encountered an error while generating the flowchart. Please try again.'
                } : m)
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateFlowchartInMessage = (messageId, updatedData) => {
        setMessages(prev => 
            prev.map(m => m.id === messageId ? { ...m, flowchartData: updatedData } : m)
        );
        // Sync back to workspace flowchart
        if (setFlowchartData) {
            setFlowchartData(updatedData);
        }
    };

    // Build combined summary from all documents
    const combinedSummary = summary || documents
        .filter(d => d.summary && d.status === 'ready')
        .map(d => d.summary)
        .join(' ')
        .substring(0, 300);

    return (
        <div className="chat-panel bg-[linear-gradient(rgba(255,255,255,0.4),rgba(255,255,255,0.4)),radial-gradient(125%_125%_at_50%_100%,rgba(249,115,22,1)_10%,rgba(234,88,12,1)_25%,rgba(217,70,239,1)_55%,rgba(139,92,246,1)_80%,rgba(76,29,149,1)_100%)]">
            {/* Title Bar */}
            <div className="chat-title-bar">
                <input
                    className="chat-notebook-title"
                    type="text"
                    value={notebookTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Untitled Notebook"
                />
            </div>

            {/* View Tabs */}
            <div className="chat-tabs">
                {[
                    { id: 'chat', label: 'Chat', icon: MessageSquare, activeBg: 'rgba(16, 158, 187, 0.12)', activeBorder: 'rgba(16, 158, 187, 0.45)' },
                    { id: 'flowchart', label: 'Flowchart', icon: GitBranch, activeBg: 'rgba(186, 228, 69, 0.12)', activeBorder: 'rgba(186, 228, 69, 0.45)' },
                    { id: 'slides', label: 'Pitch Video', icon: Presentation, activeBg: 'rgba(124, 58, 237, 0.12)', activeBorder: 'rgba(124, 58, 237, 0.45)' },
                    { id: 'flashcards', label: 'Flashcards', icon: Layers, activeBg: 'rgba(20, 184, 166, 0.12)', activeBorder: 'rgba(20, 184, 166, 0.45)' },
                    { id: 'report', label: 'Report', icon: ClipboardList, activeBg: 'rgba(99, 102, 241, 0.12)', activeBorder: 'rgba(99, 102, 241, 0.45)' },
                    { id: 'podcast', label: 'Podcast', icon: Headphones, activeBg: 'rgba(236, 72, 153, 0.12)', activeBorder: 'rgba(236, 72, 153, 0.45)' }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeCenterView === tab.id;
                    return (
                        <button 
                            key={tab.id}
                            className={`chat-tab ${isActive ? 'active' : ''}`}
                            onClick={() => onActiveCenterViewChange(tab.id)}
                            style={{ position: 'relative' }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabPill"
                                    className="active-tab-bg-pill"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: tab.activeBg,
                                        border: `1px solid ${tab.activeBorder}`,
                                        borderRadius: '9999px',
                                        zIndex: 0
                                    }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Icon size={14} />
                                <span>{tab.label}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* View Content with Transitions */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', width: '100%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeCenterView}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', height: '100%', width: '100%' }}
                    >
                        {activeCenterView === 'chat' ? (
                            <div className="flowchart-wrapper chat-view-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                                <div className="flowchart-header chat-view-header">
                                    <h3>AI Chat Assistant</h3>
                                    <p>Ask questions about your documents. I'll find relevant information and answer with citations.</p>
                                </div>
                                
                                <div className="flowchart-layout-container chat-layout-container" style={{ flex: 1, display: 'flex', gap: '1.25rem', width: '100%', minHeight: 0, overflow: 'hidden' }}>
                                    <div className="flowchart-container chat-messages-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', background: '#09090b', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '16px', position: 'relative' }}>
                                        {messages.length === 0 ? (
                                            <div className="chat-welcome" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center' }}>
                                                <div className="chat-welcome-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyCenter: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', color: '#a78bfa', marginBottom: '16px', justifyContent: 'center' }}><MessageSquare size={24} strokeWidth={1.5} /></div>
                                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '700', color: '#f4f4f5' }}>Start a conversation</h3>
                                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#71717a', maxWidth: '320px', lineHeight: '1.5' }}>Ask questions about your documents. I'll find relevant information and answer with citations.</p>
                                            </div>
                                        ) : (
                                            <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                                                {messages.map((msg) => (
                                                    <ChatMessage 
                                                        key={msg.id} 
                                                        message={msg} 
                                                        onUpdateFlowchart={handleUpdateFlowchartInMessage}
                                                    />
                                                ))}
                                                {isLoading && (
                                                    <div className="chat-message assistant">
                                                        <div className="chat-message-avatar">AI</div>
                                                        <div className="chat-message-content">
                                                            <div className="typing-indicator">
                                                                <span /><span /><span />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}

                                        <div className="chat-input-container" style={{ padding: '16px', background: 'rgba(9, 9, 11, 0.6)', borderTop: '1px solid rgba(63, 63, 70, 0.4)', flexShrink: 0 }}>
                                            <PromptInputBox 
                                                onSend={handleSubmit}
                                                isLoading={isLoading}
                                                placeholder="Ask anything about your documents..."
                                            />
                                        </div>
                                    </div>

                                    {/* Sidebar */}
                                    <div className="flowchart-sidebar chat-sidebar" style={{ width: '250px', background: 'rgba(10, 10, 12, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
                                        <div className="sidebar-section">
                                            <h4>Session Details</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: '#e4e4e7', lineHeight: '1.4' }}>
                                                <div>
                                                    <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600' }}>Notebook Name</span>
                                                    <strong style={{ color: '#fff' }}>{notebookTitle || 'Untitled Notebook'}</strong>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600' }}>Active Context</span>
                                                    <strong style={{ color: '#fff' }}>{selectedCount} sources selected</strong>
                                                </div>
                                                {selectedCount > 0 && (
                                                    <button 
                                                        className="toolbar-btn secondary" 
                                                        onClick={handleGenerateFlowchart}
                                                        disabled={isLoading}
                                                        style={{ marginTop: '6px', fontSize: '0.75rem', padding: '6px 12px', width: '100%' }}
                                                    >
                                                        <GitBranch size={12} /> Generate Flowchart
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sidebar-help">
                                            <MessageSquare className="help-icon" style={{ color: '#a78bfa', marginBottom: '8px' }} />
                                            <p><strong>Chat Guidelines:</strong></p>
                                            <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Ask questions based on your loaded documents.</li>
                                                <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Click inline citations to highlight the text source.</li>
                                                <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Toggle selected files in the Sources panel to focus reasoning.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeCenterView === 'flowchart' ? (
                            <div className="center-panel-viewer-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                                <FlowchartViewer 
                                    flowchartData={flowchartData} 
                                    onFlowchartUpdate={setFlowchartData} 
                                    notebookId={notebookId}
                                    selectedDocIds={selectedDocIds}
                                />
                            </div>
                        ) : activeCenterView === 'flashcards' ? (
                            <div className="center-panel-viewer-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                                <FlashcardViewer 
                                    notebookId={notebookId} 
                                    documents={documents}
                                />
                            </div>
                        ) : activeCenterView === 'report' ? (
                            <div className="center-panel-viewer-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                                <ReportViewer 
                                    notebookId={notebookId} 
                                    documents={documents}
                                />
                            </div>
                        ) : activeCenterView === 'podcast' ? (
                            <div className="center-panel-viewer-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                                <PodcastViewer 
                                    notebookId={notebookId} 
                                    documents={documents}
                                    selectedDocIds={selectedDocIds}
                                />
                            </div>
                        ) : (
                            <div className="center-panel-viewer-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                                <PitchDeckViewer 
                                    notebookId={notebookId} 
                                    documents={documents}
                                    selectedDocIds={selectedDocIds}
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ChatPanel;
