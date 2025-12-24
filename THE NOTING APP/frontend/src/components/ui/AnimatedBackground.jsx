import React from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  return (
    <div className="animated-bg-container" aria-hidden="true">
      {/* Clean dark background */}
      <div className="bg-base" />

      {/* Smooth gradient blobs at the bottom - Lovable style */}
      <div className="gradient-glow gradient-glow-1" />
      <div className="gradient-glow gradient-glow-2" />
      <div className="gradient-glow gradient-glow-3" />

      {/* Subtle grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
};

export default AnimatedBackground;