import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';

interface Props {
  imageSrc: string;
  badgeText: string;
  title: string;
  subtitle: string;
  panY?: number;
  zoom?: number;
  cursorX?: number;
  cursorY?: number;
  clickFrame?: number;
}

export const RealScreenSlide: React.FC<Props> = ({
  imageSrc,
  badgeText,
  title,
  subtitle,
  panY = 0,
  zoom = 1,
  cursorX,
  cursorY,
  clickFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  // Animated continuous camera pan & zoom
  const currentZoom = interpolate(frame, [0, 80], [zoom, zoom * 1.05], {
    extrapolateRight: 'clamp',
  });
  const currentPanY = interpolate(frame, [0, 80], [0, panY], {
    extrapolateRight: 'clamp',
  });

  // Cursor click animation
  const isClicking = clickFrame !== undefined && frame >= clickFrame && frame <= clickFrame + 10;
  const clickScale = isClicking ? 0.8 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 60px 36px 60px',
        opacity: enterSpring,
        transform: `scale(${0.96 + enterSpring * 0.04})`,
      }}
    >
      {/* Top Banner overlay info */}
      <div
        style={{
          width: '100%',
          maxWidth: 1600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              backgroundColor: '#8BC646',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '0.5px',
              boxShadow: '0 4px 14px rgba(139, 198, 70, 0.4)',
            }}
          >
            {badgeText}
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: 0 }}>
              {title}
            </h2>
          </div>
        </div>

        <div style={{ fontSize: 16, color: '#cbd5e1', fontWeight: 600 }}>
          {subtitle}
        </div>
      </div>

      {/* Browser Window Framing of Real Agrilpa App */}
      <div
        style={{
          width: '100%',
          maxWidth: 1600,
          height: 860,
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Browser Top Chrome Header */}
        <div
          style={{
            height: 42,
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
            borderBottom: '1px solid #334155',
            zIndex: 10,
          }}
        >
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
          </div>

          {/* Real URL address bar */}
          <div
            style={{
              flex: 1,
              maxWidth: 500,
              margin: '0 auto',
              height: 26,
              backgroundColor: '#0f172a',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: 12,
              color: '#94a3b8',
              fontFamily: 'monospace',
              border: '1px solid #334155',
            }}
          >
            <span style={{ color: '#8BC646', marginRight: 6 }}>🔒</span> https://agrilpa.com
          </div>
        </div>

        {/* Real Screenshot Viewport */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              width: '100%',
              transform: `scale(${currentZoom}) translateY(${currentPanY}px)`,
              transformOrigin: 'top center',
              transition: 'transform 0.05s linear',
            }}
          >
            <Img
              src={staticFile(imageSrc)}
              style={{
                width: '100%',
                display: 'block',
              }}
            />
          </div>

          {/* Animated Interactive Mouse Cursor */}
          {cursorX !== undefined && cursorY !== undefined && (
            <div
              style={{
                position: 'absolute',
                top: `${cursorY}%`,
                left: `${cursorX}%`,
                transform: `scale(${clickScale}) translate(-50%, -50%)`,
                pointerEvents: 'none',
                zIndex: 20,
                transition: 'transform 0.1s ease',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                  fill="#111827"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </svg>
              {isClicking && (
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: -10,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '2px solid #8BC646',
                    animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
