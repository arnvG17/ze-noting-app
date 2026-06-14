import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://the-noting-app.onrender.com' : 'http://localhost:5000');

const PLACEHOLDER_SCRIPT = {
  productName: "Your Subject",
  hookText: "Generate a custom presentation for your own topic.",
  problemText: "Click 'Generate AI Pitch' or upload documents to analyze your context.",
  solutionText: "Your customized product or service will be detailed here.",
  features: [
    {
      title: "Core Concept 1",
      description: "Details about your first major capability will go here.",
      simulatedChat: {
        userQuestion: "How does it work?",
        aiAnswer: "Once you upload your files, this chat will simulate real-time Q&A."
      }
    },
    {
      title: "Methodology & Flow",
      description: "Details about your second major capability will go here.",
      simulatedFlowchart: {
        nodeA: "Step One",
        nodeB: "Step Two",
        nodeC: "Step Three"
      }
    },
    {
      title: "Key Fact / Quiz",
      description: "Details about your third major capability will go here.",
      simulatedQuiz: {
        question: "Q1. What is your custom question?",
        options: [
          "A) Option One",
          "B) Option Two",
          "C) Option Three",
          "D) Option Four"
        ],
        correctIndex: 2,
        feedback: "Correct explanation is generated here."
      }
    }
  ],
  demoSteps: [
    { action: "First workflow action...", detail: "Workflow step details" },
    { action: "Second workflow action...", detail: "Workflow step details" },
    { action: "Third workflow action...", detail: "Workflow step details" }
  ],
  ctaText: "Upload your business documents to start tailoring your pitch."
};

export default function FlashcardViewer({ notebookId, documents = [] }) {
  const [script, setScript] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const readyDocs = documents ? documents.filter(d => d.status === 'ready') : [];

  useEffect(() => {
    const fetchScript = async () => {
      setIsLoading(true);
      try {
        const response = await axios.post(`${API_BASE}/api/pitch/generate`, { 
          notebookId,
          userInput: ''
        });
        setScript(response.data);
      } catch (err) {
        console.error(err);
        setScript(PLACEHOLDER_SCRIPT);
      } finally {
        setIsLoading(false);
      }
    };

    if (notebookId && readyDocs.length > 0) {
      fetchScript();
    } else {
      setScript(PLACEHOLDER_SCRIPT);
    }
  }, [notebookId, readyDocs.length]);

  if (isLoading || !script) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c0b10', gap: '15px', color: '#e4e4e7', height: '100%' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '500' }}>Preparing study flashcards...</span>
      </div>
    );
  }

  // Generate cards
  const cards = [
    {
      frontTitle: "HOOK & CORE INQUIRY",
      frontContent: `"${script.hookText}"`,
      frontStyle: { fontStyle: 'italic', fontFamily: 'Georgia', fontSize: '26px' },
      backTitle: "THE CHALLENGE",
      backContent: script.problemText,
      backColor: '#ef4444'
    },
    {
      frontTitle: "THE CORE QUESTION",
      frontContent: "How do we address this domain challenge?",
      frontStyle: { fontSize: '22px', fontWeight: 'bold' },
      backTitle: "THE SOLUTION",
      backContent: script.solutionText,
      backColor: '#10b981'
    },
    {
      frontTitle: `PILLAR 1: ${script.features[0]?.title || "Deep Dive"}`,
      frontContent: script.features[0]?.description || "",
      frontStyle: { fontSize: '18px' },
      backTitle: "SIMULATED CONCEPT Q&A",
      backContent: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', textAlign: 'left' }}>
          <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '13px', color: '#60a5fa' }}>
            <strong>Q:</strong> {script.features[0]?.simulatedChat?.userQuestion}
          </div>
          <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '13px', color: '#e4e4e7', lineHeight: '1.5' }}>
            <strong>A:</strong> {script.features[0]?.simulatedChat?.aiAnswer}
          </div>
        </div>
      ),
      backColor: '#3b82f6'
    },
    {
      frontTitle: `PILLAR 2: ${script.features[1]?.title || "Process Flow"}`,
      frontContent: script.features[1]?.description || "",
      frontStyle: { fontSize: '18px' },
      backTitle: "PROCESS METHODOLOGY",
      backContent: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ padding: '12px 20px', borderRadius: '8px', border: '1.5px solid #7c3aed', background: 'rgba(124, 58, 237, 0.1)', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
              {script.features[1]?.simulatedFlowchart?.nodeA}
            </div>
            <span style={{ color: '#a78bfa', fontSize: '16px' }}>➔</span>
            <div style={{ padding: '12px 20px', borderRadius: '8px', border: '1.5px solid #f472b6', background: 'rgba(244, 114, 182, 0.1)', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
              {script.features[1]?.simulatedFlowchart?.nodeB}
            </div>
            <span style={{ color: '#f472b6', fontSize: '16px' }}>➔</span>
            <div style={{ padding: '12px 20px', borderRadius: '8px', border: '1.5px solid #3b82f6', background: 'rgba(59, 130, 246, 0.1)', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
              {script.features[1]?.simulatedFlowchart?.nodeC}
            </div>
          </div>
        </div>
      ),
      backColor: '#a78bfa'
    },
    {
      frontTitle: `PILLAR 3: ${script.features[2]?.title || "Evaluation"}`,
      frontContent: script.features[2]?.description || "",
      frontStyle: { fontSize: '18px' },
      backTitle: "CONCEPT VALIDATION TEST",
      backContent: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', textAlign: 'left' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
            {script.features[2]?.simulatedQuiz?.question}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {script.features[2]?.simulatedQuiz?.options.map((opt, idx) => {
              const isCorrect = idx === script.features[2]?.simulatedQuiz?.correctIndex;
              return (
                <div key={idx} style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: isCorrect ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                  backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(0,0,0,0.15)',
                  color: isCorrect ? '#22c55e' : '#a1a1aa',
                  fontSize: '12px',
                  fontWeight: isCorrect ? '700' : 'normal'
                }}>
                  {opt}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '11px', color: '#22c55e', fontStyle: 'italic', marginTop: '4px' }}>
            Feedback: {script.features[2]?.simulatedQuiz?.feedback}
          </div>
        </div>
      ),
      backColor: '#22c55e'
    },
    {
      frontTitle: "OPERATIONAL FLOW",
      frontContent: "What are the stages of project implementation?",
      frontStyle: { fontSize: '22px', fontWeight: 'bold' },
      backTitle: "WORKFLOW TIMELINE",
      backContent: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', textAlign: 'left' }}>
          {script.demoSteps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{step.action}</div>
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '1px' }}>{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      ),
      backColor: '#8b5cf6'
    },
    {
      frontTitle: "CONCLUDING VISION",
      frontContent: "What is the ultimate vision and next steps?",
      frontStyle: { fontSize: '22px', fontWeight: 'bold' },
      backTitle: "FUTURE IMPACT",
      backContent: script.ctaText,
      backColor: '#7c3aed'
    }
  ];

  const current = cards[currentCard];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCard(prev => Math.min(cards.length - 1, prev + 1));
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCard(prev => Math.max(0, prev - 1));
    }, 150);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0c0b10',
      color: '#e4e4e7',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Dynamic Flip Card CSS */}
      <style>{`
        .flashcard-perspective {
          perspective: 1000px;
          width: 100%;
          max-width: 680px;
          aspect-ratio: 16/9;
          margin-bottom: 30px;
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          cursor: pointer;
        }
        .flashcard-inner.flipped {
          transform: rotateY(180deg);
        }
        .flashcard-front, .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px 0 rgba(255,255,255,0.03);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 50px;
          box-sizing: border-box;
        }
        .flashcard-front {
          background: #09080d;
        }
        .flashcard-back {
          background: #0d0c13;
          transform: rotateY(180deg);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Grid Canvas Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none'
      }} />

      {/* Counter */}
      <div style={{
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#a78bfa',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        marginBottom: '20px',
        zIndex: 10
      }}>
        Card {currentCard + 1} of {cards.length}
      </div>

      {/* Interactive Card */}
      <div className="flashcard-perspective" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* Card Front */}
          <div className="flashcard-front">
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a78bfa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '25px', opacity: 0.8 }}>
              {current.frontTitle}
            </div>
            <div style={{
              fontSize: '20px',
              lineHeight: '1.5',
              textAlign: 'center',
              color: '#ffffff',
              maxWidth: '85%',
              ...current.frontStyle
            }}>
              {current.frontContent}
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '30px', fontWeight: '600' }}>
              Click to Flip
            </div>
          </div>

          {/* Card Back */}
          <div className="flashcard-back">
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: current.backColor, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '25px' }}>
              {current.backTitle}
            </div>
            <div style={{
              width: '100%',
              fontSize: '15px',
              lineHeight: '1.6',
              textAlign: typeof current.backContent === 'string' ? 'center' : 'left',
              color: '#e4e4e7',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {current.backContent}
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '30px', fontWeight: '600' }}>
              Click to Flip
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons (Text-only, Solid Purple) */}
      <div style={{ display: 'flex', gap: '15px', zIndex: 10 }}>
        <button
          disabled={currentCard === 0}
          onClick={handlePrev}
          onMouseOver={(e) => { if (currentCard !== 0) e.currentTarget.style.backgroundColor = '#6d28d9'; }}
          onMouseOut={(e) => { if (currentCard !== 0) e.currentTarget.style.backgroundColor = '#7c3aed'; }}
          style={{
            height: '38px',
            padding: '0 20px',
            borderRadius: '8px',
            backgroundColor: currentCard === 0 ? 'rgba(124, 58, 237, 0.2)' : '#7c3aed',
            color: currentCard === 0 ? '#52525b' : '#ffffff',
            fontWeight: '700',
            fontSize: '12px',
            border: 'none',
            cursor: currentCard === 0 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          Previous
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#6d28d9'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#7c3aed'; }}
          style={{
            height: '38px',
            padding: '0 24px',
            borderRadius: '8px',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '12px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)'
          }}
        >
          Flip Card
        </button>

        <button
          disabled={currentCard === cards.length - 1}
          onClick={handleNext}
          onMouseOver={(e) => { if (currentCard !== cards.length - 1) e.currentTarget.style.backgroundColor = '#6d28d9'; }}
          onMouseOut={(e) => { if (currentCard !== cards.length - 1) e.currentTarget.style.backgroundColor = '#7c3aed'; }}
          style={{
            height: '38px',
            padding: '0 20px',
            borderRadius: '8px',
            backgroundColor: currentCard === cards.length - 1 ? 'rgba(124, 58, 237, 0.2)' : '#7c3aed',
            color: currentCard === cards.length - 1 ? '#52525b' : '#ffffff',
            fontWeight: '700',
            fontSize: '12px',
            border: 'none',
            cursor: currentCard === cards.length - 1 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
