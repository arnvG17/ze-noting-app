import React, { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const noiseCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = noiseCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Set canvas size to match viewport
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateNoise();
    };

    // Generate high-quality film grain noise
    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Random grayscale value for film grain
        const noise = Math.random() * 255;
        data[i] = noise;     // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = 35;    // Alpha - controls grain intensity
      }

      ctx.putImageData(imageData, 0, 0);
    };

    // Animate the noise (optional subtle flicker)
    let animationId;
    let frameCount = 0;

    const animate = () => {
      frameCount++;
      // Update noise every 3 frames for subtle flicker effect
      if (frameCount % 3 === 0) {
        generateNoise();
      }
      animationId = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      overflow: 'hidden',
      pointerEvents: 'none'
    }} aria-hidden="true">
      {/* Base dark background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0a0f'
      }} />

      {/* Large gradient blobs */}
      {/* Blue glow (left) */}
      <div style={{
        position: 'absolute',
        width: '900px',
        height: '650px',
        bottom: '-120px',
        left: '0%',
        background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.55) 0%, rgba(139, 92, 246, 0.35) 35%, transparent 70%)',
        filter: 'blur(30px)',
        borderRadius: '50%',
        animation: 'floatBlob1 20s ease-in-out infinite'
      }} />

      {/* Orange-pink glow (center) */}
      <div style={{
        position: 'absolute',
        width: '1100px',
        height: '800px',
        bottom: '-250px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.65) 0%, rgba(244, 114, 182, 0.45) 25%, rgba(168, 85, 247, 0.25) 50%, transparent 75%)',
        filter: 'blur(40px)',
        borderRadius: '50%',
        animation: 'floatBlob2 18s ease-in-out infinite'
      }} />

      {/* Purple-pink glow (right) */}
      <div style={{
        position: 'absolute',
        width: '800px',
        height: '550px',
        bottom: '-80px',
        right: '5%',
        background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.45) 0%, rgba(168, 85, 247, 0.35) 40%, transparent 70%)',
        filter: 'blur(25px)',
        borderRadius: '50%',
        animation: 'floatBlob3 22s ease-in-out infinite'
      }} />

      {/* Canvas-based film grain noise overlay */}
      <canvas
        ref={noiseCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          mixBlendMode: 'overlay',
          opacity: 1,
          pointerEvents: 'none'
        }}
      />

      <style>{`
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