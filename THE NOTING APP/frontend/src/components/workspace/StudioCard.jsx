import React from 'react';
import { Check } from 'lucide-react';

const StudioCard = ({ icon: Icon, title, description, type, status, onClick }) => {
    const isDisabled = status === 'soon';

    return (
        <div
            className={`studio-card ${isDisabled ? 'disabled' : ''}`}
            onClick={isDisabled ? undefined : onClick}
        >
            <div className={`studio-card-icon ${type}`}>
                <Icon size={16} strokeWidth={1.8} />
            </div>
            <div className="studio-card-info">
                <div className="studio-card-title">{title}</div>
                <div className="studio-card-desc">{description}</div>
            </div>
            <div className={`studio-card-badge ${status}`}>
                {status === 'ready' ? (
                    <Check size={11} strokeWidth={2.5} />
                ) : 'Soon'}
            </div>
        </div>
    );
};

export default StudioCard;
