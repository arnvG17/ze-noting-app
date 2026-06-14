import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, GitBranch, Presentation, Layers, ClipboardList } from 'lucide-react';
import ChatMessage from './ChatMessage';
import FlowchartViewer from '../FlowchartViewer';
import PitchDeckViewer from './PitchDeckViewer';
import FlashcardViewer from './FlashcardViewer';
import ReportViewer from './ReportViewer';
import { PromptInputBox } from '../ui/ai-prompt-box';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
                <button 
                    className={`chat-tab ${activeCenterView === 'chat' ? 'active' : ''}`}
                    onClick={() => onActiveCenterViewChange('chat')}
                >
                    <MessageSquare size={14} />
                    <span>Chat</span>
                </button>
                <button 
                    className={`chat-tab ${activeCenterView === 'flowchart' ? 'active' : ''}`}
                    onClick={() => onActiveCenterViewChange('flowchart')}
                >
                    <GitBranch size={14} />
                    <span>Flowchart</span>
                </button>
                <button 
                    className={`chat-tab ${activeCenterView === 'slides' ? 'active' : ''}`}
                    onClick={() => onActiveCenterViewChange('slides')}
                >
                    <Presentation size={14} />
                    <span>Pitch Video</span>
                </button>
                <button 
                    className={`chat-tab ${activeCenterView === 'flashcards' ? 'active' : ''}`}
                    onClick={() => onActiveCenterViewChange('flashcards')}
                >
                    <Layers size={14} />
                    <span>Flashcards</span>
                </button>
                <button 
                    className={`chat-tab ${activeCenterView === 'report' ? 'active' : ''}`}
                    onClick={() => onActiveCenterViewChange('report')}
                >
                    <ClipboardList size={14} />
                    <span>Report</span>
                </button>
            </div>

            {/* View Content */}
            {activeCenterView === 'chat' ? (
                <>

                    {/* Messages */}
                    {messages.length === 0 ? (
                        <div className="chat-welcome">
                            <div className="chat-welcome-icon"><MessageSquare size={24} strokeWidth={1.5} /></div>
                            <h3>Start a conversation</h3>
                            <p>Ask questions about your documents. I'll find relevant information and answer with citations.</p>
                        </div>
                    ) : (
                        <div className="chat-messages">
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

                    {/* Input Container */}
                    <div className="chat-input-container" style={{ padding: '16px 32px 24px', background: 'transparent' }}>
                        <PromptInputBox 
                            onSend={handleSubmit}
                            isLoading={isLoading}
                            placeholder="Ask anything about your documents..."
                        />
                    </div>
                </>
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
            ) : (
                <div className="center-panel-viewer-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                    <PitchDeckViewer 
                        notebookId={notebookId} 
                        documents={documents}
                        selectedDocIds={selectedDocIds}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatPanel;
