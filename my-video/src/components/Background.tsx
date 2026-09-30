import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 300], [1.02, 1.08]);
  const posX = interpolate(frame, [0, 300], [0, -15]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1c12', overflow: 'hidden' }}>
      {/* Real Agricultural Field Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: '-20px',
          transform: `scale(${scale}) translateX(${posX}px)`,
          filter: 'brightness(0.75) contrast(1.05)',
        }}
      >
        <Img
          src={staticFile('agricultural-fields-farmer-harvest-crops-farming-c.jpg')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Agrilpa Clean Gradients & Dark Tint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(139, 198, 70, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(5, 150, 105, 0.3) 0%, transparent 60%),
            linear-gradient(180deg, rgba(3, 19, 12, 0.72) 0%, rgba(2, 16, 10, 0.88) 100%)
          `,
        }}
      />

      {/* Subtle Dot Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
