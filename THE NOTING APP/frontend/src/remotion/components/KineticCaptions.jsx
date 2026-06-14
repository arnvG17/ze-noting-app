import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const KineticCaptions = ({ text, style = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  if (!text) return null;
  const words = text.split(' ');

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px 18px',
      maxWidth: '1200px',
      textAlign: 'center',
      padding: '20px',
      ...style
    }}>
      {words.map((word, index) => {
        // Stagger each word by 4 frames
        const delay = index * 4;
        const spr = spring({
          frame: frame - delay,
          fps,
          config: {
            damping: 12,
            mass: 0.5,
            stiffness: 100
          }
        });

        const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp'
        });

        const scale = interpolate(spr, [0, 1], [0.85, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp'
        });

        const translateY = interpolate(spr, [0, 1], [25, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp'
        });

        return (
          <span
            key={index}
            style={{
              fontSize: '48px',
              fontWeight: '800',
              color: '#ffffff',
              display: 'inline-block',
              transform: `scale(${scale}) translateY(${translateY}px)`,
              opacity: opacity,
              textShadow: '0 4px 20px rgba(139, 92, 246, 0.2)',
              letterSpacing: '-0.5px'
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
