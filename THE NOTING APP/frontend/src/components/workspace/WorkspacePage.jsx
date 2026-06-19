import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import SourcesPanel from './SourcesPanel';
import ChatPanel from './ChatPanel';
import StudioPanel from './StudioPanel';
import { useDocumentText } from '../DocumentTextContext';
import './workspace.css';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://the-noting-app.onrender.com' : 'http://localhost:5000');

const WorkspacePage = () => {
    const { notebookId } = useParams();
    const navigate = useNavigate();
    const { documentText } = useDocumentText();

    const [notebook, setNotebook] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [selectedDocIds, setSelectedDocIds] = useState([]);
    const [notebookTitle, setNotebookTitle] = useState('Untitled Notebook');
    const [summaryText, setSummaryText] = useState('');
    const [loading, setLoading] = useState(true);

    // Feature states
    const [flowchartData, _setFlowchartData] = useState(null);
    const [pitchScript, _setPitchScript] = useState(null);
    const [reportMarkdown, _setReportMarkdown] = useState('');
    const [podcastScript, _setPodcastScript] = useState('');
    const [podcastAudioUrl, _setPodcastAudioUrl] = useState('');
    const [quizQuestions, _setQuizQuestions] = useState(null);

    // Custom state updaters that write to localStorage
    const setFlowchartData = useCallback((val) => {
        _setFlowchartData(val);
        if (notebookId) {
            if (val) localStorage.setItem(`notebook_${notebookId}_flowchart_data`, JSON.stringify(val));
            else localStorage.removeItem(`notebook_${notebookId}_flowchart_data`);
        }
    }, [notebookId]);

    const setPitchScript = useCallback((val) => {
        _setPitchScript(val);
        if (notebookId) {
            if (val) localStorage.setItem(`notebook_${notebookId}_pitch_script`, JSON.stringify(val));
            else localStorage.removeItem(`notebook_${notebookId}_pitch_script`);
        }
    }, [notebookId]);

    const setReportMarkdown = useCallback((val) => {
        _setReportMarkdown(val);
        if (notebookId) {
            if (val) localStorage.setItem(`notebook_${notebookId}_report_markdown`, val);
            else localStorage.removeItem(`notebook_${notebookId}_report_markdown`);
        }
    }, [notebookId]);

    const setPodcastScript = useCallback((val) => {
        _setPodcastScript(val);
        if (notebookId) {
            if (val) localStorage.setItem(`notebook_${notebookId}_podcast_script`, val);
            else localStorage.removeItem(`notebook_${notebookId}_podcast_script`);
        }
    }, [notebookId]);

    const setPodcastAudioUrl = useCallback((val) => {
        _setPodcastAudioUrl(val);
        if (notebookId) {
            if (val) localStorage.setItem(`notebook_${notebookId}_podcast_audio_url`, val);
            else localStorage.removeItem(`notebook_${notebookId}_podcast_audio_url`);
        }
    }, [notebookId]);

    const setQuizQuestions = useCallback((val) => {
        _setQuizQuestions(val);
        if (notebookId) {
            if (val) localStorage.setItem(`notebook_${notebookId}_quiz_questions`, JSON.stringify(val));
            else localStorage.removeItem(`notebook_${notebookId}_quiz_questions`);
        }
    }, [notebookId]);

    // Load feature states from localStorage when notebookId changes
    useEffect(() => {
        if (!notebookId) return;

        try {
            const savedFlowchart = localStorage.getItem(`notebook_${notebookId}_flowchart_data`);
            _setFlowchartData(savedFlowchart ? JSON.parse(savedFlowchart) : null);
        } catch (e) {
            _setFlowchartData(null);
        }

        try {
            const savedPitch = localStorage.getItem(`notebook_${notebookId}_pitch_script`);
            _setPitchScript(savedPitch ? JSON.parse(savedPitch) : null);
        } catch (e) {
            _setPitchScript(null);
        }

        try {
            const savedReport = localStorage.getItem(`notebook_${notebookId}_report_markdown`);
            _setReportMarkdown(savedReport || '');
        } catch (e) {
            _setReportMarkdown('');
        }

        try {
            const savedPodcastScript = localStorage.getItem(`notebook_${notebookId}_podcast_script`);
            _setPodcastScript(savedPodcastScript || '');
        } catch (e) {
            _setPodcastScript('');
        }

        try {
            const savedPodcastAudio = localStorage.getItem(`notebook_${notebookId}_podcast_audio_url`);
            _setPodcastAudioUrl(savedPodcastAudio || '');
        } catch (e) {
            _setPodcastAudioUrl('');
        }

        try {
            const savedQuiz = localStorage.getItem(`notebook_${notebookId}_quiz_questions`);
            _setQuizQuestions(savedQuiz ? JSON.parse(savedQuiz) : null);
        } catch (e) {
            _setQuizQuestions(null);
        }
    }, [notebookId]);

    // Dynamic sizing states
    const [leftWidth, setLeftWidth] = useState(310);
    const [rightWidth, setRightWidth] = useState(280);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
    const [activeCenterView, setActiveCenterView] = useState('chat'); // 'chat', 'flowchart', 'slides'

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth > 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const startResizingLeft = useCallback((mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizingLeft(true);
        
        const startWidth = leftWidth;
        const startX = mouseDownEvent.clientX;

        const doDrag = (mouseMoveEvent) => {
            const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
            if (newWidth > 200 && newWidth < 500) {
                setLeftWidth(newWidth);
            }
        };

        const stopDrag = () => {
            setIsResizingLeft(false);
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [leftWidth]);

    const startResizingRight = useCallback((mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizingRight(true);
        
        const startWidth = rightWidth;
        const startX = mouseDownEvent.clientX;

        const doDrag = (mouseMoveEvent) => {
            const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
            if (newWidth > 200 && newWidth < 500) {
                setRightWidth(newWidth);
            }
        };

        const stopDrag = () => {
            setIsResizingRight(false);
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [rightWidth]);

    // Fetch notebook data on mount
    useEffect(() => {
        if (!notebookId) {
            navigate('/');
            return;
        }

        const fetchNotebook = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/notebooks/${notebookId}`);
                if (!res.ok) throw new Error('Notebook not found');
                const data = await res.json();
                
                setNotebook(data);
                setNotebookTitle(data.title || 'Untitled Notebook');
                setDocuments(data.documents || []);
                
                // Auto-select all ready documents
                const readyIds = (data.documents || [])
                    .filter(d => d.status === 'ready')
                    .map(d => d.id);
                setSelectedDocIds(readyIds);

                // Build summary from all docs
                const summaries = (data.documents || [])
                    .filter(d => d.summary)
                    .map(d => d.summary);
                if (summaries.length > 0) {
                    setSummaryText(summaries.join('\n\n'));
                }
            } catch (err) {
                console.error('Failed to load notebook:', err);
                // Don't navigate away — might be a temporary error
            } finally {
                setLoading(false);
            }
        };

        fetchNotebook();
    }, [notebookId, navigate]);

    // Toggle document selection
    const handleToggleDoc = useCallback((docId) => {
        setSelectedDocIds(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    }, []);

    // Select/deselect all
    const handleSelectAll = useCallback(() => {
        const readyIds = documents.filter(d => d.status === 'ready').map(d => d.id);
        if (selectedDocIds.length === readyIds.length) {
            setSelectedDocIds([]);
        } else {
            setSelectedDocIds(readyIds);
        }
    }, [documents, selectedDocIds]);

    // Handle new document added
    const handleDocumentAdded = useCallback((data) => {
        // Refetch notebook to get updated documents list
        fetch(`${API_BASE}/api/notebooks/${notebookId}`)
            .then(res => res.json())
            .then(nbData => {
                setDocuments(nbData.documents || []);
                const readyIds = (nbData.documents || [])
                    .filter(d => d.status === 'ready')
                    .map(d => d.id);
                setSelectedDocIds(readyIds);

                // Update summary
                const summaries = (nbData.documents || [])
                    .filter(d => d.summary)
                    .map(d => d.summary);
                if (summaries.length > 0) {
                    setSummaryText(summaries.join('\n\n'));
                }

                // Update flowchart if available
                if (data.flowchartData) {
                    setFlowchartData(data.flowchartData);
                }
            })
            .catch(err => console.error('Failed to refresh notebook:', err));
    }, [notebookId]);

    // Update notebook title
    const handleTitleChange = useCallback((newTitle) => {
        setNotebookTitle(newTitle);
        // Debounced save
        const timer = setTimeout(() => {
            fetch(`${API_BASE}/api/notebooks/${notebookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            }).catch(err => console.warn('Failed to save title:', err));
        }, 1000);
        return () => clearTimeout(timer);
    }, [notebookId]);



    if (loading) {
        return (
            <div className="workspace">
                <div className="studio-panel">
                    <div className="studio-header"><h2>Studio</h2></div>
                </div>
                <div className="chat-panel">
                    <div className="chat-title-bar">
                        <div className="skeleton" style={{ height: 28, width: '60%' }} />
                    </div>
                    <div className="chat-welcome">
                        <div className="chat-welcome-icon"><Loader2 size={24} strokeWidth={1.5} style={{ animation: 'spin 1.5s linear infinite' }} /></div>
                        <h3>Loading workspace...</h3>
                    </div>
                </div>
                <div className="sources-panel">
                    <div className="sources-header"><h2>Sources</h2></div>
                    <div style={{ padding: 20 }}>
                        <div className="skeleton" style={{ height: 40, marginBottom: 10 }} />
                        <div className="skeleton" style={{ height: 40, marginBottom: 10 }} />
                        <div className="skeleton" style={{ height: 40 }} />
                    </div>
                </div>
            </div>
        );
    }

    const workspaceStyle = isDesktop ? {
        gridTemplateColumns: `${leftWidth}px 12px 1fr 12px ${rightWidth}px`,
        gap: 0
    } : {};

    return (
        <div className="workspace" style={workspaceStyle}>
            <StudioPanel
                summaryText={summaryText}
                flowchartData={flowchartData}
                documentText={documentText}
                notebookId={notebookId}
                selectedDocIds={selectedDocIds}
                setFlowchartData={setFlowchartData}
                activeCenterView={activeCenterView}
                onActiveCenterViewChange={setActiveCenterView}
                quizQuestions={quizQuestions}
                setQuizQuestions={setQuizQuestions}
            />

            {isDesktop && (
                <div 
                    className={`workspace-resizer left-resizer ${isResizingLeft ? 'resizing' : ''}`}
                    onMouseDown={startResizingLeft}
                />
            )}

            <ChatPanel
                notebookId={notebookId}
                notebookTitle={notebookTitle}
                onTitleChange={handleTitleChange}
                documents={documents}
                selectedDocIds={selectedDocIds}
                summary={summaryText}
                setFlowchartData={setFlowchartData}
                activeCenterView={activeCenterView}
                onActiveCenterViewChange={setActiveCenterView}
                flowchartData={flowchartData}
                pitchScript={pitchScript}
                setPitchScript={setPitchScript}
                reportMarkdown={reportMarkdown}
                setReportMarkdown={setReportMarkdown}
                podcastScript={podcastScript}
                setPodcastScript={setPodcastScript}
                podcastAudioUrl={podcastAudioUrl}
                setPodcastAudioUrl={setPodcastAudioUrl}
                documentText={documentText}
                quizQuestions={quizQuestions}
                setQuizQuestions={setQuizQuestions}
            />

            {isDesktop && (
                <div 
                    className={`workspace-resizer right-resizer ${isResizingRight ? 'resizing' : ''}`}
                    onMouseDown={startResizingRight}
                />
            )}

            <SourcesPanel
                documents={documents}
                selectedDocIds={selectedDocIds}
                onToggleDoc={handleToggleDoc}
                onSelectAll={handleSelectAll}
                notebookId={notebookId}
                onDocumentAdded={handleDocumentAdded}
                summary={summaryText}
            />
        </div>
    );
};

export default WorkspacePage;
