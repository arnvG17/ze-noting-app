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

export default function FlashcardViewer({ notebookId, documents = [], pitchScript, onPitchScriptChange }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const readyDocs = documents ? documents.filter(d => d.status === 'ready') : [];

  const handleGenerateScript = async () => {
    if (readyDocs.length === 0) {
      toast.error("Please upload documents first to generate study flashcards.");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Analyzing documents and writing study flashcards...");
    try {
      const response = await axios.post(`${API_BASE}/api/pitch/generate`, { 
        notebookId,
        userInput: ''
      });
      onPitchScriptChange(response.data);
      toast.success("Study flashcards generated successfully!", { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate study flashcards.", { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c0b10', gap: '15px', color: '#e4e4e7', height: '100%' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '500' }}>Preparing study flashcards...</span>
      </div>
    );
  }

  if (!pitchScript) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c0b10', gap: '20px', color: '#e4e4e7', height: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px' }}>📇</div>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>No Flashcards Generated Yet</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa', maxWidth: '360px', lineHeight: '1.5' }}>
          Generate interactive study flashcards from your uploaded documents to test your memory and study key concepts.
        </p>
        <button
          onClick={handleGenerateScript}
          disabled={readyDocs.length === 0}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '13px',
            border: 'none',
            cursor: readyDocs.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            opacity: readyDocs.length === 0 ? 0.5 : 1,
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
          }}
        >
          Generate Flashcards
        </button>
        {readyDocs.length === 0 && (
          <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '5px' }}>⚠️ Please upload ready documents in the workspace first.</span>
        )}
      </div>
    );
  }

  const script = pitchScript;

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
    <div className="flowchart-wrapper flashcards-wrapper" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Dynamic Flip Card CSS */}
      <style>{`
        .flashcard-perspective {
          perspective: 1000px;
          width: 100%;
          max-width: 600px;
          aspect-ratio: 16/10;
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
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 15px 35px rgba(0,0,0,0.5), inset 0 1px 1px 0 rgba(255,255,255,0.03);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 30px;
          box-sizing: border-box;
        }
        .flashcard-front {
          background: #09080d;
        }
        .flashcard-back {
          background: #0d0c13;
          transform: rotateY(180deg);
        }
      `}</style>

      <div className="flowchart-header flashcards-header">
        <h3>Study Flashcards</h3>
        <p>Test your memory and study key concepts with interactive cards.</p>
      </div>

      <div className="flowchart-layout-container flashcards-layout" style={{ flex: 1, display: 'flex', gap: '1.25rem', width: '100%', minHeight: 0, overflow: 'hidden' }}>
        {/* Main Canvas Area */}
        <div className="flowchart-container flashcards-canvas" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#09090b', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '16px', position: 'relative', padding: '40px' }}>
          {/* Grid Canvas Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none'
          }} />

          {/* Interactive Card */}
          <div className="flashcard-perspective" onClick={() => setIsFlipped(!isFlipped)} style={{ zIndex: 5 }}>
            <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
              {/* Card Front */}
              <div className="flashcard-front">
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#a78bfa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px', opacity: 0.8 }}>
                  {current.frontTitle}
                </div>
                <div style={{
                  fontSize: '18px',
                  lineHeight: '1.5',
                  textAlign: 'center',
                  color: '#ffffff',
                  maxWidth: '85%',
                  ...current.frontStyle
                }}>
                  {current.frontContent}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a', marginTop: '25px', fontWeight: '600' }}>
                  Click to Flip
                </div>
              </div>

              {/* Card Back */}
              <div className="flashcard-back">
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: current.backColor, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>
                  {current.backTitle}
                </div>
                <div style={{
                  width: '100%',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  textAlign: typeof current.backContent === 'string' ? 'center' : 'left',
                  color: '#e4e4e7',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {current.backContent}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a', marginTop: '25px', fontWeight: '600' }}>
                  Click to Flip
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="flowchart-sidebar flashcards-sidebar" style={{ width: '250px', background: 'rgba(10, 10, 12, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          <div className="sidebar-section">
            <h4>Card Navigation</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                color: '#a78bfa',
                letterSpacing: '1.5px',
                textTransform: 'uppercase'
              }}>
                Card {currentCard + 1} of {cards.length}
              </div>

              <div className="toolbar-buttons">
                <button
                  className="toolbar-btn primary"
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{ width: '100%' }}
                >
                  Flip Card
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="toolbar-btn secondary"
                    disabled={currentCard === 0}
                    onClick={handlePrev}
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.75rem' }}
                  >
                    Previous
                  </button>
                  <button
                    className="toolbar-btn secondary"
                    disabled={currentCard === cards.length - 1}
                    onClick={handleNext}
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.75rem' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-help">
            <span style={{ fontSize: '1.2rem', color: '#a78bfa', marginBottom: '8px' }}>💡</span>
            <p><strong>Study Tips:</strong></p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Click the card to flip it and reveal details.</li>
              <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Pillars cover hook, solution, Q&A, and validation tests.</li>
              <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Generate new flashcards by uploading different documents.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
