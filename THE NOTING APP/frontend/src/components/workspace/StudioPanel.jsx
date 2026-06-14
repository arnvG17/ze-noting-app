import React, { useState, useEffect, useRef } from 'react';
import {
    FileText,
    HelpCircle,
    Share2,
    GitBranch,
    Headphones,
    Layers,
    Presentation,
    ClipboardList
} from 'lucide-react';
import StudioCard from './StudioCard';
import StudioModal from './StudioModal';
import NotesViewer from '../NotesViewer';
import FlowchartViewer from '../FlowchartViewer';
import MindMapViewer from '../MindMapViewer';
import QuizSection from '../quizz/QuizzPage';
import PitchDeckViewer from './PitchDeckViewer';
import gsap from 'gsap';
import CardSwap, { Card } from './CardSwap';

const STUDIO_ITEMS = [
    {
        id: 'notes',
        icon: FileText,
        title: 'Notes',
        description: 'AI-generated summary & notes',
        type: 'notes',
        status: 'ready'
    },
    {
        id: 'quiz',
        icon: HelpCircle,
        title: 'Quiz',
        description: 'Test your knowledge with MCQs',
        type: 'quiz',
        status: 'ready'
    },
    {
        id: 'mindmap',
        icon: Share2,
        title: 'Mind Map',
        description: 'Interactive concept visualization',
        type: 'mindmap',
        status: 'ready'
    },
    {
        id: 'flowchart',
        icon: GitBranch,
        title: 'Flowchart',
        description: 'Document structure overview',
        type: 'flowchart',
        status: 'ready'
    },
    {
        id: 'audio',
        icon: Headphones,
        title: 'Audio Overview',
        description: 'Listen to a document summary',
        type: 'audio',
        status: 'soon'
    },
    {
        id: 'flashcards',
        icon: Layers,
        title: 'Flashcards',
        description: 'Study with flip cards',
        type: 'flashcards',
        status: 'ready'
    },
    {
        id: 'slides',
        icon: Presentation,
        title: 'Pitch Video',
        description: 'Cinematic pitch deck generator',
        type: 'slides',
        status: 'ready'
    },
    {
        id: 'report',
        icon: ClipboardList,
        title: 'Report',
        description: 'Structured document report',
        type: 'report',
        status: 'ready'
    }
];

const StudioPanel = ({ summaryText, flowchartData, documentText, notebookId, selectedDocIds, setFlowchartData, activeCenterView, onActiveCenterViewChange }) => {
    const [activeModal, setActiveModal] = useState(null);
    const cardsRef = useRef([]);

    useEffect(() => {
        if (cardsRef.current.length > 0) {
            gsap.fromTo(cardsRef.current.filter(Boolean),
                { opacity: 0, y: 25 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
            );
        }
    }, []);

    const handleCardClick = (itemId) => {
        if (itemId === 'flowchart') {
            if (onActiveCenterViewChange) {
                onActiveCenterViewChange('flowchart');
            }
        } else if (itemId === 'slides') {
            if (onActiveCenterViewChange) {
                onActiveCenterViewChange('slides');
            }
        } else if (itemId === 'flashcards') {
            if (onActiveCenterViewChange) {
                onActiveCenterViewChange('flashcards');
            }
        } else if (itemId === 'report') {
            if (onActiveCenterViewChange) {
                onActiveCenterViewChange('report');
            }
        } else {
            setActiveModal(itemId);
        }
    };

    const renderModalContent = () => {
        switch (activeModal) {
            case 'notes':
                return <NotesViewer notes={summaryText} />;
            case 'quiz':
                return <QuizSection docText={documentText} />;
            case 'mindmap':
                return <MindMapViewer flowchartData={flowchartData} />;
            case 'flowchart':
                return <FlowchartViewer flowchartData={flowchartData} onFlowchartUpdate={setFlowchartData} />;
            case 'slides':
                return <PitchDeckViewer notebookId={notebookId} />;
            default:
                return <p style={{ color: '#52525b', textAlign: 'center', padding: 40, fontSize: '0.85rem' }}>Coming soon</p>;
        }
    };

    const getModalTitle = () => {
        const item = STUDIO_ITEMS.find(i => i.id === activeModal);
        return item ? item.title : '';
    };

    const hasContent = summaryText || documentText || flowchartData;

    return (
        <div className="studio-panel">
            <div className="studio-header">
                <h2>Studio</h2>
            </div>

            <div className="studio-cards" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' }}>
                <CardSwap
                    width={260}
                    height={82}
                    cardDistance={0}
                    verticalDistance={90}
                    delay={4500}
                    pauseOnHover={true}
                    easing="elastic"
                >
                    {STUDIO_ITEMS.map(item => (
                        <Card key={item.id}>
                            <StudioCard
                                icon={item.icon}
                                title={item.title}
                                description={item.description}
                                type={item.type}
                                status={!hasContent && item.status === 'ready' ? 'soon' : item.status}
                                onClick={() => handleCardClick(item.id)}
                            />
                        </Card>
                    ))}
                </CardSwap>
            </div>

            {/* Feature Modal */}
            {activeModal && (
                <StudioModal
                    title={getModalTitle()}
                    onClose={() => setActiveModal(null)}
                >
                    {renderModalContent()}
                </StudioModal>
            )}
        </div>
    );
};

export default StudioPanel;
