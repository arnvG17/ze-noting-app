import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="animated-bg-container" aria-hidden="true">
      {/* Clean dark background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0a0f'
      }} />

      {/* Large gradient blobs - Lovable style with less blur */}
      {/* Blue glow (left side) */}
      <div style={{
        position: 'absolute',
        width: '800px',
        height: '600px',
        bottom: '-100px',
        left: '5%',
        background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.5) 0%, rgba(139, 92, 246, 0.3) 40%, transparent 70%)',
        filter: 'blur(40px)',
        borderRadius: '50%',
        animation: 'floatBlob1 20s ease-in-out infinite'
      }} />

      {/* Orange-pink glow (center bottom) - Large like Lovable */}
      <div style={{
        position: 'absolute',
        width: '1000px',
        height: '700px',
        bottom: '-200px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.6) 0%, rgba(244, 114, 182, 0.4) 25%, rgba(168, 85, 247, 0.2) 50%, transparent 75%)',
        filter: 'blur(50px)',
        borderRadius: '50%',
        animation: 'floatBlob2 18s ease-in-out infinite'
      }} />

      {/* Purple-pink glow (right side) */}
      <div style={{
        position: 'absolute',
        width: '700px',
        height: '500px',
        bottom: '-50px',
        right: '10%',
        background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.4) 0%, rgba(168, 85, 247, 0.3) 40%, transparent 70%)',
        filter: 'blur(35px)',
        borderRadius: '50%',
        animation: 'floatBlob3 22s ease-in-out infinite'
      }} />

      {/* Fine grain noise overlay - more granular */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.04,
        mixBlendMode: 'overlay',
        pointerEvents: 'none'
      }} />

      <style>{`
        .animated-bg-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }
        
        @keyframes floatBlob1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
        
        @keyframes floatBlob2 {
          0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
          50% { transform: translateX(-50%) translateY(-20px) scale(1.05); }
        }
        
        @keyframes floatBlob3 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-25px) translateX(-15px); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;