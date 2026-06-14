import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, Paperclip, FileText, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import SourceItem from './SourceItem';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SourcesPanel = ({ documents, selectedDocIds, onToggleDoc, onSelectAll, notebookId, onDocumentAdded, summary }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const allSelected = documents.length > 0 && selectedDocIds.length === documents.length;
    const readyDocs = documents.filter(d => d.status === 'ready');

    const filteredDocs = documents.filter(doc => {
        if (!searchQuery) return true;
        const name = (doc.original_name || doc.filename || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    const handleUpload = useCallback(async (file) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (notebookId) formData.append('notebookId', notebookId);

            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            toast.success('Document uploaded and processed!');
            if (onDocumentAdded) onDocumentAdded(data);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            setShowAddModal(false);
        }
    }, [notebookId, onDocumentAdded]);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const allowedTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Please upload a PDF, DOCX, or TXT file');
                return;
            }
            if (file.size > 25 * 1024 * 1024) {
                toast.error('File size must be less than 25MB');
                return;
            }
            handleUpload(file);
        }
    }, [handleUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        multiple: false,
        noClick: false,
        noKeyboard: true
    });

    // Build combined summary from all documents
    const combinedSummary = summary || documents
        .filter(d => d.summary && d.status === 'ready')
        .map(d => d.summary)
        .join(' ')
        .substring(0, 300);

    return (
        <div className="sources-panel">
            <div className="sources-header">
                <h2>Sources</h2>
                <button className="source-add-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={14} strokeWidth={2} />
                    Add source
                </button>
                <div className="sources-count">{readyDocs.length} source{readyDocs.length !== 1 ? 's' : ''} ready</div>
            </div>

            {documents.length > 0 && (
                <>
                    <div className="sources-search">
                        <div style={{ position: 'relative' }}>
                            <Search size={13} strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#3f3f46', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search sources..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="sources-select-all" onClick={onSelectAll}>
                        <div className={`source-checkbox ${allSelected ? 'checked' : ''}`}>
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="2,6 5,9 10,3" />
                            </svg>
                        </div>
                        <span>Select all</span>
                    </div>
                </>
            )}

            <div className="sources-list">
                {filteredDocs.length === 0 && documents.length === 0 ? (
                    <div className="empty-sources">
                        <div className="empty-sources-icon"><FileText size={32} strokeWidth={1.2} /></div>
                        <p>No sources yet. Upload a document to get started.</p>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="empty-sources">
                        <p>No sources match "{searchQuery}"</p>
                    </div>
                ) : (
                    filteredDocs.map(doc => (
                        <SourceItem
                            key={doc.id}
                            source={doc}
                            isSelected={selectedDocIds.includes(doc.id)}
                            onToggle={onToggleDoc}
                        />
                    ))
                )}
                {combinedSummary && (
                    <div className="chat-summary-card" style={{ margin: '16px 0 0 0', flexShrink: 0 }}>
                        <h3>
                            <Sparkles size={14} strokeWidth={2} />
                            AI Summary
                        </h3>
                        <p>{combinedSummary}</p>
                    </div>
                )}
            </div>

            {/* Add Source Modal */}
            {showAddModal && (
                <div className="studio-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="add-source-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="studio-modal-header">
                            <h2>Add Source</h2>
                            <button className="studio-modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <div style={{ padding: '20px 0 24px' }}>
                            <div
                                {...getRootProps()}
                                className={`add-source-dropzone ${isDragActive ? 'active' : ''}`}
                            >
                                <input {...getInputProps()} />
                                {isUploading ? (
                                    <>
                                        <div className="add-source-dropzone-icon">
                                            <div style={{
                                                width: 28, height: 28, border: '2px solid #8b5cf6',
                                                borderTopColor: 'transparent', borderRadius: '50%',
                                                animation: 'spin 1s linear infinite', margin: '0 auto'
                                            }} />
                                        </div>
                                        <p style={{ color: '#a78bfa' }}>Processing document...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="add-source-dropzone-icon"><Paperclip size={28} strokeWidth={1.5} /></div>
                                        <p>{isDragActive ? 'Drop file here...' : 'Click or drag to upload'}</p>
                                        <p className="supported">PDF, DOCX, TXT (Max 25MB)</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SourcesPanel;
