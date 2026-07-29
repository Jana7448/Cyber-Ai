import React, { useEffect, useRef } from 'react';

export const BackgroundParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particles array
    const particleCount = 35;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 0.6,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? '#38bdf8' : '#a855f7',
    }));

    // Mouse glow tracker
    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isLightMode = document.documentElement.classList.contains('light-mode');

      // Radial mouse glow
      const radialGradient = ctx.createRadialGradient(mouseX, mouseY, 10, mouseX, mouseY, 280);
      if (isLightMode) {
        radialGradient.addColorStop(0, 'rgba(2, 132, 199, 0.08)');
        radialGradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.04)');
        radialGradient.addColorStop(1, 'transparent');
      } else {
        radialGradient.addColorStop(0, 'rgba(56, 189, 248, 0.07)');
        radialGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)');
        radialGradient.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const pColor = p.color === '#38bdf8' || p.color === '#0284c7'
          ? (isLightMode ? '#0284c7' : '#38bdf8')
          : (isLightMode ? '#9333ea' : '#a855f7');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = pColor;
        ctx.globalAlpha = isLightMode ? p.alpha * 0.7 : p.alpha;
        ctx.shadowBlur = isLightMode ? 4 : 10;
        ctx.shadowColor = pColor;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
