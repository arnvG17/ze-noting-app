import React, { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create noise texture
    const createNoiseTexture = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 15; // Subtle noise
        data[i] = noise;     // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = 25;    // Alpha (very transparent)
      }

      return imageData;
    };

    // Animate with stutter effect
    let lastTime = 0;
    const stutterInterval = 150; // Frame drop every 150ms for subtle stutter
    let skipFrame = false;

    const animate = (currentTime) => {
      // Stutter effect - skip frames occasionally
      if (currentTime - lastTime > stutterInterval) {
        skipFrame = !skipFrame;
        lastTime = currentTime;
      }

      if (!skipFrame) {
        time += 0.005;

        // Create dynamic gradient
        const gradient = ctx.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Gemini-inspired colors: blue, purple, gray
        const hue1 = 220 + Math.sin(time) * 20; // Blue range
        const hue2 = 270 + Math.cos(time * 0.8) * 15; // Purple range
        const hue3 = 240 + Math.sin(time * 1.2) * 10; // Mid-blue-purple

        gradient.addColorStop(0, `hsla(${hue1}, 70%, 15%, 0.95)`);
        gradient.addColorStop(0.4, `hsla(${hue2}, 60%, 12%, 0.95)`);
        gradient.addColorStop(0.7, `hsla(${hue3}, 50%, 10%, 0.95)`);
        gradient.addColorStop(1, 'hsla(220, 30%, 8%, 0.95)');

        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add noise overlay
        const noise = createNoiseTexture();
        ctx.putImageData(noise, 0, 0);

        // Add subtle moving blobs
        const blob1X = canvas.width * (0.3 + Math.sin(time * 0.5) * 0.2);
        const blob1Y = canvas.height * (0.4 + Math.cos(time * 0.3) * 0.2);
        const blob2X = canvas.width * (0.7 + Math.cos(time * 0.4) * 0.15);
        const blob2Y = canvas.height * (0.6 + Math.sin(time * 0.6) * 0.15);

        // Blob 1 (Blue-purple)
        const blob1Gradient = ctx.createRadialGradient(
          blob1X, blob1Y, 0,
          blob1X, blob1Y, 300
        );
        blob1Gradient.addColorStop(0, 'hsla(250, 80%, 40%, 0.15)');
        blob1Gradient.addColorStop(1, 'hsla(250, 80%, 40%, 0)');

        ctx.fillStyle = blob1Gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Blob 2 (Purple-blue)
        const blob2Gradient = ctx.createRadialGradient(
          blob2X, blob2Y, 0,
          blob2X, blob2Y, 250
        );
        blob2Gradient.addColorStop(0, 'hsla(220, 70%, 50%, 0.12)');
        blob2Gradient.addColorStop(1, 'hsla(220, 70%, 50%, 0)');

        ctx.fillStyle = blob2Gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="animated-bg-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}
      aria-hidden="true"
    />
  );
};

export default AnimatedBackground;