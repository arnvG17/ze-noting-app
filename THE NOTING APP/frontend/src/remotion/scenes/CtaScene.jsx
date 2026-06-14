import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { KineticCaptions } from '../components/KineticCaptions';

export const CtaScene = ({ productName, ctaText }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Scene level entrance/exit transitions
  const sceneOpacity = interpolate(
    frame,
    [0, 15, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Logo spring animation
  const logoSpr = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, stiffness: 80 }
  });

  const logoScale = interpolate(logoSpr, [0, 1], [0.5, 1.1]);
  const logoBounce = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12, stiffness: 100 }
  });
  const logoFinalScale = interpolate(logoBounce, [0, 1], [logoScale, 1.0]);

  // CTA Button pulse effect
  const pulseScale = 1 + Math.sin(frame / 12) * 0.03;

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
      backgroundColor: '#07060b'
    }}>
      {/* Background large neon grid layout */}
      <div style={{
        position: 'absolute',
        width: '1000px',
        height: '1000px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0) 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      {/* Dynamic central Logo */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '28px',
        background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
        boxShadow: '0 15px 40px rgba(124, 58, 237, 0.4), 0 0 80px rgba(124, 58, 237, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#ffffff',
        transform: `scale(${logoFinalScale})`,
        marginBottom: '30px',
        zIndex: 10
      }}>
        N
      </div>

      {/* Product Name */}
      <div style={{
        fontSize: '44px',
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: '-1px',
        marginBottom: '20px',
        zIndex: 10,
        opacity: logoSpr
      }}>
        {productName}
      </div>

      {/* Caption description */}
      <div style={{ zIndex: 10, height: '100px', marginBottom: '30px', transform: `translateY(${interpolate(logoSpr, [0, 1], [20, 0])}px)` }}>
        <KineticCaptions text={ctaText} style={{ fontSize: '30px' }} />
      </div>

      {/* Action CTA Button */}
      {frame >= 50 && (
        <div style={{
          padding: '16px 36px',
          borderRadius: '30px',
          background: 'linear-gradient(135deg, #a78bfa 0%, #3b82f6 100%)',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '18px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          transform: `scale(${pulseScale})`,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 10,
          cursor: 'pointer'
        }}>
          Get Started Free
        </div>
      )}
    </div>
  );
};
