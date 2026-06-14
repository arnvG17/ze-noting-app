import React from 'react';
import { X } from 'lucide-react';

const StudioModal = ({ title, onClose, children }) => {
    return (
        <div className="studio-modal-overlay" onClick={onClose}>
            <div className="studio-modal" onClick={(e) => e.stopPropagation()}>
                <div className="studio-modal-header">
                    <h2>{title}</h2>
                    <button className="studio-modal-close" onClick={onClose}>
                        <X size={16} strokeWidth={2} />
                    </button>
                </div>
                <div className="studio-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default StudioModal;
