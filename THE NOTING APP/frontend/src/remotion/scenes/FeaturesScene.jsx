import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { BrowserMockup } from '../components/BrowserMockup';

export const FeaturesScene = ({ features, productName }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Scene level opacity transition
  const sceneOpacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Determine active sub-feature index (0, 1, 2)
  const activeIndex = Math.min(Math.floor(frame / 150), 2);
  const featureFrame = frame % 150; // Frame within the active sub-feature (0 to 149)

  // Sub-feature fade transition
  const subOpacity = interpolate(
    featureFrame,
    [0, 10, 140, 150],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const renderActiveFeatureContent = () => {
    switch (activeIndex) {
      case 0: // RAG Chat (Frame 0 - 150)
        return renderChatDemo(featureFrame, fps, features[0]?.simulatedChat, productName);
      case 1: // Flowchart (Frame 150 - 300)
        return renderFlowchartDemo(featureFrame, fps, features[1]?.simulatedFlowchart);
      case 2: // Quiz (Frame 300 - 450)
        return renderQuizDemo(featureFrame, fps, features[2]?.simulatedQuiz);
      default:
        return null;
    }
  };

  const currentFeatureTitle = features[activeIndex]?.title || "Feature";
  const currentFeatureDesc = features[activeIndex]?.description || "AI-powered tool";
  const browserUrl = productName 
    ? productName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.io' 
    : 'workspace.notebook-ai.app';

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      opacity: sceneOpacity,
      paddingTop: '60px',
      boxSizing: 'border-box',
      backgroundColor: '#09080d'
    }}>
      {/* Feature Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        zIndex: 10,
        height: '120px',
        opacity: subOpacity,
        transform: `translateY(${interpolate(featureFrame, [0, 15], [15, 0], { extrapolateRight: 'clamp' })}px)`
      }}>
        <h2 style={{
          fontSize: '44px',
          fontWeight: '800',
          margin: 0,
          background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          {currentFeatureTitle}
        </h2>
        <p style={{
          fontSize: '20px',
          color: '#a1a1aa',
          margin: 0,
          fontWeight: '500'
        }}>
          {currentFeatureDesc}
        </p>
      </div>

      {/* Browser Canvas */}
      <BrowserMockup 
        title={browserUrl}
        style={{
          height: '640px',
          marginTop: '10px'
        }}
      >
        <div style={{
          flex: 1,
          opacity: subOpacity,
          backgroundColor: '#09090e',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {renderActiveFeatureContent()}
        </div>
      </BrowserMockup>
    </div>
  );
};

// ==========================================
// 1. RAG CHAT SIMULATION
// ==========================================
function renderChatDemo(f, fps, chatData, productName) {
  const userQuestion = chatData?.userQuestion || "What is the difference between fiscal and monetary policy?";
  const aiAnswer = chatData?.aiAnswer || "Based on your notes, fiscal policy refers to the use of government spending and taxation to influence the economy. [Source: lecture_notes.pdf, p.4] In contrast, monetary policy is controlled by the central bank.";

  // Question bubble entrance (Frame 10)
  const qSpr = spring({ frame: f - 10, fps, config: { damping: 12 } });
  const qY = interpolate(qSpr, [0, 1], [30, 0]);

  // AI typing indicator (Frame 35 to 65)
  const isTyping = f >= 35 && f < 65;

  // Answer bubble entrance (Frame 65)
  const aSpr = spring({ frame: f - 65, fps, config: { damping: 12 } });
  const aY = interpolate(aSpr, [0, 1], [30, 0]);

  // Answer text typewriter effect
  const charCount = Math.floor(interpolate(f - 75, [0, 60], [0, aiAnswer.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const visibleText = aiAnswer.slice(0, Math.max(0, charCount));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100%'
    }}>
      {/* Left sidebar showing checked document */}
      <div style={{
        width: '240px',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(15, 15, 20, 0.4)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#a78bfa', letterSpacing: '1px', textTransform: 'uppercase' }}>Active Source</div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '10px',
          backgroundColor: 'rgba(139, 92, 246, 0.12)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          fontSize: '13px',
          color: '#ffffff',
          fontWeight: '500'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a78bfa' }} />
          {productName ? productName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_data.pdf' : 'workspace_notes.pdf'}
        </div>
      </div>

      {/* Chat messages viewport */}
      <div style={{
        flex: 1,
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: '#0c0c12',
        position: 'relative'
      }}>
        {/* User Question */}
        {f >= 10 && (
          <div style={{
            alignSelf: 'flex-end',
            maxWidth: '70%',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: '16px 16px 4px 16px',
            fontSize: '15px',
            fontWeight: '500',
            opacity: qSpr,
            transform: `translateY(${qY}px)`,
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
          }}>
            {userQuestion}
          </div>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div style={{
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 20px',
            borderRadius: '16px 16px 16px 4px',
            display: 'flex',
            gap: '6px',
            alignItems: 'center'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a78bfa', animation: 'pulse 1s infinite' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a78bfa', animation: 'pulse 1s infinite 0.2s' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a78bfa', animation: 'pulse 1s infinite 0.4s' }} />
          </div>
        )}

        {/* AI Answer with Citation */}
        {f >= 65 && (
          <div style={{
            alignSelf: 'flex-start',
            maxWidth: '85%',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#e4e4e7',
            padding: '18px 22px',
            borderRadius: '16px 16px 16px 4px',
            fontSize: '15px',
            lineHeight: '1.6',
            opacity: aSpr,
            transform: `translateY(${aY}px)`
          }}>
            {visibleText}
            {f - 75 < 60 && <span style={{ width: '2px', height: '15px', backgroundColor: '#a78bfa', display: 'inline-block', marginLeft: '2px' }} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. FLOWCHART GENERATION SIMULATION
// ==========================================
function renderFlowchartDemo(f, fps, flowchartData) {
  const nodeA = flowchartData?.nodeA || "Government Budget";
  const nodeB = flowchartData?.nodeB || "Tax Revenues";
  const nodeC = flowchartData?.nodeC || "Fiscal Balance";

  // Node animations based on springs
  const sNodeA = spring({ frame: f - 10, fps, config: { damping: 12 } });
  const sLineAB = spring({ frame: f - 45, fps, config: { damping: 15 } });
  const sNodeB = spring({ frame: f - 60, fps, config: { damping: 12 } });
  const sLineBC = spring({ frame: f - 95, fps, config: { damping: 15 } });
  const sNodeC = spring({ frame: f - 110, fps, config: { damping: 12 } });

  const lineABWidth = interpolate(sLineAB, [0, 1], [0, 120]);
  const lineBCWidth = interpolate(sLineBC, [0, 1], [0, 120]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#09090f',
      padding: '40px',
      position: 'relative'
    }}>
      {/* Grid Canvas Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', zIndex: 10 }}>
        {/* Node A */}
        {f >= 10 && (
          <div style={{
            width: '200px',
            height: '80px',
            borderRadius: '12px',
            border: '2px solid #a78bfa',
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(167, 139, 250, 0.02) 100%)',
            boxShadow: '0 8px 30px rgba(167, 139, 250, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '14px',
            textAlign: 'center',
            padding: '10px',
            boxSizing: 'border-box',
            transform: `scale(${sNodeA})`,
            opacity: sNodeA
          }}>
            {nodeA}
          </div>
        )}

        {/* Connection Line AB */}
        {f >= 45 && (
          <div style={{
            width: `${lineABWidth}px`,
            height: '2px',
            backgroundColor: '#a78bfa',
            position: 'relative',
            opacity: sLineAB
          }}>
            <div style={{
              position: 'absolute',
              right: 0,
              top: '-4px',
              width: '10px',
              height: '10px',
              borderTop: '2px solid #a78bfa',
              borderRight: '2px solid #a78bfa',
              transform: 'rotate(45deg)'
            }} />
          </div>
        )}

        {/* Node B */}
        {f >= 60 && (
          <div style={{
            width: '200px',
            height: '80px',
            borderRadius: '12px',
            border: '2px solid #f472b6',
            background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.15) 0%, rgba(244, 114, 182, 0.02) 100%)',
            boxShadow: '0 8px 30px rgba(244, 114, 182, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '14px',
            textAlign: 'center',
            padding: '10px',
            boxSizing: 'border-box',
            transform: `scale(${sNodeB})`,
            opacity: sNodeB
          }}>
            {nodeB}
          </div>
        )}

        {/* Connection Line BC */}
        {f >= 95 && (
          <div style={{
            width: `${lineBCWidth}px`,
            height: '2px',
            backgroundColor: '#f472b6',
            position: 'relative',
            opacity: sLineBC
          }}>
            <div style={{
              position: 'absolute',
              right: 0,
              top: '-4px',
              width: '10px',
              height: '10px',
              borderTop: '2px solid #f472b6',
              borderRight: '2px solid #f472b6',
              transform: 'rotate(45deg)'
            }} />
          </div>
        )}

        {/* Node C */}
        {f >= 110 && (
          <div style={{
            width: '200px',
            height: '80px',
            borderRadius: '12px',
            border: '2px solid #60a5fa',
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.02) 100%)',
            boxShadow: '0 8px 30px rgba(96, 165, 250, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '14px',
            textAlign: 'center',
            padding: '10px',
            boxSizing: 'border-box',
            transform: `scale(${sNodeC})`,
            opacity: sNodeC
          }}>
            {nodeC}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. QUIZ INTERACTION SIMULATION
// ==========================================
function renderQuizDemo(f, fps, quizData) {
  const question = quizData?.question || "Q1. Which body manages monetary policy in the United States?";
  const options = quizData?.options || [
    "A) Department of Treasury",
    "B) Congress",
    "C) The Federal Reserve System",
    "D) Internal Revenue Service"
  ];
  const correctIndex = typeof quizData?.correctIndex === 'number' ? quizData.correctIndex : 2;
  const feedback = quizData?.feedback || "✨ Correct answer! +10 XP added to your studio progress.";

  // Question Card Slide in (Frame 10)
  const qSpr = spring({ frame: f - 10, fps, config: { damping: 13 } });
  const qY = interpolate(qSpr, [0, 1], [40, 0]);

  // Options selection timing
  const isSelected = f >= 75;
  const optSpr = spring({ frame: f - 75, fps, config: { damping: 10, stiffness: 100 } });

  // Correct Banner pop (Frame 90)
  const bSpr = spring({ frame: f - 90, fps, config: { damping: 12 } });

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0b0a0f',
      padding: '40px'
    }}>
      {/* Quiz Card */}
      {f >= 10 && (
        <div style={{
          width: '640px',
          backgroundColor: 'rgba(20, 20, 25, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          opacity: qSpr,
          transform: `translateY(${qY}px)`
        }}>
          {/* Question Text */}
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', lineHeight: '1.5' }}>
            {question}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {options.map((option, idx) => {
              const isCorrectOpt = idx === correctIndex;
              let borderCol = 'rgba(255, 255, 255, 0.08)';
              let bgCol = 'rgba(255, 255, 255, 0.02)';
              let textCol = '#a1a1aa';

              if (isCorrectOpt && isSelected) {
                borderCol = 'rgba(34, 197, 94, 0.5)';
                bgCol = 'rgba(34, 197, 94, 0.15)';
                textCol = '#22c55e';
              } else if (isCorrectOpt && f >= 50 && f < 75) {
                // Simulated hover state
                borderCol = 'rgba(167, 139, 250, 0.4)';
                bgCol = 'rgba(167, 139, 250, 0.05)';
                textCol = '#ffffff';
              }

              return (
                <div key={idx} style={{
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: `1px solid ${borderCol}`,
                  backgroundColor: bgCol,
                  color: textCol,
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transform: isCorrectOpt && isSelected ? `scale(${interpolate(optSpr, [0, 1], [1, 1.02])})` : 'none',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}>
                  <span>{option}</span>
                  {isCorrectOpt && isSelected && (
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>✓</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Success Banner */}
          {f >= 90 && (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22c55e',
              fontWeight: '700',
              fontSize: '14px',
              gap: '8px',
              opacity: bSpr,
              transform: `scale(${bSpr})`
            }}>
              ✨ {feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
