import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { KineticCaptions } from '../components/KineticCaptions';

const MESSY_DOCUMENTS = [
  { name: 'thesis_draft_final_v3.pdf', type: 'PDF', color: '#ef4444', x: 200, y: 150, rotate: -15, scale: 0.9 },
  { name: 'class_notes_biology.docx', type: 'DOC', color: '#3b82f6', x: 1400, y: 180, rotate: 12, scale: 0.95 },
  { name: 'dataset_raw_october.csv', type: 'CSV', color: '#10b981', x: 350, y: 650, rotate: -8, scale: 0.85 },
  { name: 'unorganized_links.txt', type: 'TXT', color: '#a1a1aa', x: 1350, y: 680, rotate: 22, scale: 0.9 },
  { name: 'research_paper_scanned.pdf', type: 'PDF', color: '#ef4444', x: 800, y: 700, rotate: -5, scale: 1.0 },
];

export const ProblemScene = ({ problemText }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Scene entrance/exit transitions
  const sceneOpacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: sceneOpacity,
      position: 'relative',
      backgroundColor: '#0c0a0f'
    }}>
      {/* Background Red Warning Glow */}
      <div style={{
        position: 'absolute',
        width: '800px',
        height: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0) 70%)',
        filter: 'blur(50px)',
        top: '10%',
        left: '25%',
        pointerEvents: 'none'
      }} />

      {/* Scattered documents flying in chaotically */}
      {MESSY_DOCUMENTS.map((doc, index) => {
        const delay = index * 8;
        const spr = spring({
          frame: frame - delay,
          fps,
          config: { damping: 10, stiffness: 60, mass: 1 }
        });

        // Drop from top and bounce with spring
        const initialY = -200;
        const targetY = doc.y;
        const y = interpolate(spr, [0, 1], [initialY, targetY]);

        // Drift slowly over time
        const driftX = Math.sin(frame / 60 + index) * 15;
        const driftY = Math.cos(frame / 50 + index) * 10;

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: doc.x + driftX,
              top: y + driftY,
              transform: `rotate(${doc.rotate}deg) scale(${doc.scale})`,
              width: '280px',
              height: '180px',
              backgroundColor: 'rgba(20, 20, 25, 0.85)',
              border: `1px solid rgba(255, 255, 255, 0.08)`,
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: spr
            }}
          >
            {/* Header / File Icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: `${doc.color}20`,
                color: doc.color,
                letterSpacing: '1px'
              }}>{doc.type}</span>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: doc.color }} />
            </div>

            {/* File Name */}
            <div style={{ 
              color: '#d4d4d8', 
              fontSize: '14px', 
              fontWeight: '500', 
              wordBreak: 'break-all',
              lineHeight: '1.4',
              fontFamily: 'monospace'
            }}>
              {doc.name}
            </div>

            {/* Fake Content Bar lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px' }} />
              <div style={{ width: '70%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px' }} />
            </div>
          </div>
        );
      })}

      {/* Overlay caption */}
      <div style={{ 
        zIndex: 10, 
        marginTop: '100px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '0 40px'
      }}>
        <KineticCaptions text={problemText} />
      </div>
    </div>
  );
};
