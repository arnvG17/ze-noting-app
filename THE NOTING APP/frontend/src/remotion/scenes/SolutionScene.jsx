import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { BrowserMockup } from '../components/BrowserMockup';
import { KineticCaptions } from '../components/KineticCaptions';

export const SolutionScene = ({ productName, solutionText }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Scene entrance/exit transitions
  const sceneOpacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Browser Mockup Slide Up
  const mockupSpr = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 80 }
  });

  const mockupY = interpolate(mockupSpr, [0, 1], [400, 0]);
  const mockupScale = interpolate(mockupSpr, [0, 1], [0.9, 1]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      opacity: sceneOpacity,
      paddingTop: '80px',
      boxSizing: 'border-box',
      backgroundColor: '#07050a'
    }}>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute',
        width: '1200px',
        height: '1200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0) 70%)',
        filter: 'blur(60px)',
        top: '20%',
        pointerEvents: 'none'
      }} />

      {/* Headline Text */}
      <div style={{ zIndex: 10, height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <KineticCaptions text={solutionText} />
      </div>

      {/* Browser Mockup */}
      <BrowserMockup 
        title="workspace.notebook-ai.app"
        style={{
          transform: `translateY(${mockupY}px) scale(${mockupScale})`,
          opacity: mockupSpr,
          marginTop: '20px',
          height: '620px'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          backgroundColor: '#0a0a0f',
          color: '#e4e4e7'
        }}>
          {/* Left panel: Sources */}
          <div style={{
            width: '240px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 15, 20, 0.4)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', letterSpacing: '1px', textTransform: 'uppercase' }}>Sources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['chemistry_notes.pdf', 'research_paper.pdf', 'formulas_sheet.docx'].map((filename, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: i === 0 ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                  border: i === 0 ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent',
                  fontSize: '13px'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: i === 0 ? '#a78bfa' : '#52525b' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: i === 0 ? '#fff' : '#a1a1aa' }}>{filename}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center panel: Chat */}
          <div style={{
            flex: 1,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#0d0d12'
          }}>
            {/* Chat Welcome */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                background: 'linear-gradient(to right, #ffffff, #a1a1aa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Welcome to NotebookAI</div>
              <div style={{ fontSize: '13px', color: '#71717a', lineHeight: '1.5' }}>
                Ask questions about your uploaded documents. Get summaries, citations, and interactive learning guides instantly.
              </div>
            </div>

            {/* Simulated Chat Input */}
            <div style={{
              height: '46px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              color: '#52525b',
              fontSize: '13px'
            }}>
              Ask anything about your notes...
            </div>
          </div>

          {/* Right panel: Studio */}
          <div style={{
            width: '260px',
            backgroundColor: 'rgba(15, 15, 20, 0.4)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', letterSpacing: '1px', textTransform: 'uppercase' }}>Studio</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['Notes', 'Quiz', 'Mind Map', 'Flowchart'].map((tool, i) => (
                <div key={i} style={{
                  height: '80px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#a1a1aa'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }} />
                  {tool}
                </div>
              ))}
            </div>
          </div>
        </div>
      </BrowserMockup>
    </div>
  );
};
