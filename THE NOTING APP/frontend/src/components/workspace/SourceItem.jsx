import React from 'react';
import { Link2 } from 'lucide-react';

const SourceItem = ({ source, isSelected, onToggle }) => {
    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'pdf': return 'PDF';
            case 'docx': case 'doc': return 'DOC';
            case 'txt': return 'TXT';
            default: return <Link2 size={12} strokeWidth={2} />;
        }
    };

    const getTypeClass = (type) => {
        switch (type?.toLowerCase()) {
            case 'pdf': return 'pdf';
            case 'docx': case 'doc': return 'docx';
            case 'txt': return 'txt';
            default: return 'link';
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div
            className={`source-item ${getTypeClass(source.file_type)} ${isSelected ? 'selected' : ''}`}
            onClick={() => onToggle(source.id)}
        >
            <div className={`source-checkbox ${isSelected ? 'checked' : ''}`}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="2,6 5,9 10,3" />
                </svg>
            </div>

            <div className={`source-icon ${getTypeClass(source.file_type)}`}>
                {getTypeIcon(source.file_type)}
            </div>

            <div className="source-info">
                <div className="source-name">
                    {source.original_name || source.filename}
                </div>
                <div className="source-meta">
                    {source.chunk_count ? `${source.chunk_count} chunks` : ''}
                    {source.chunk_count && source.file_size ? ' · ' : ''}
                    {formatSize(source.file_size)}
                </div>
            </div>

            <div className={`source-status ${source.status}`} title={source.status} />
        </div>
    );
};

export default SourceItem;
