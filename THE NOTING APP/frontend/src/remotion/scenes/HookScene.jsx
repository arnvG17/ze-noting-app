import React from 'react';
import { useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { KineticCaptions } from '../components/KineticCaptions';

export const HookScene = ({ productName, hookText }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Entrance and exit opacity transition
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Slow, smooth cinematic zoom-in effect
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [1, 1.05],
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
      opacity,
      transform: `scale(${scale})`,
      position: 'relative'
    }}>
      {/* Product Tag */}
      <div style={{
        padding: '8px 20px',
        borderRadius: '30px',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        color: '#a78bfa',
        fontSize: '18px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '3px',
        marginBottom: '40px',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)'
      }}>
        {productName}
      </div>

      {/* Kinetic Hook Question */}
      <KineticCaptions text={hookText} />
    </div>
  );
};
