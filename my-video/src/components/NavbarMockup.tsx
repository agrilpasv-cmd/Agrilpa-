import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { Search, User, ArrowRight } from 'lucide-react';

interface Props {
  activeStepIndex: number;
}

export const NavbarMockup: React.FC<Props> = ({ activeStepIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const navSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const progress = interpolate(frame, [0, 300], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transform: `translateY(${(1 - navSpring) * -40}px)`,
        opacity: navSpring,
      }}
    >
      <div
        style={{
          margin: '20px 48px',
          padding: '14px 28px',
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Agrilpa Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#8BC646',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(139, 198, 70, 0.4)',
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 900, color: '#ffffff' }}>🌱</span>
          </div>
          <div>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>
              agrilpa
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#8BC646', marginLeft: 6 }}>
              .com
            </span>
          </div>
        </div>

        {/* Real Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[
            { label: 'Mercado', href: '#' },
            { label: 'Para Compradores', href: '#', step: 2 },
            { label: 'Para Vendedores', href: '#', step: 1 },
            { label: 'Cómo Funciona', href: '#', active: true },
            { label: 'Sobre Nosotros', href: '#' },
          ].map((link, i) => {
            const isHighlight =
              (link.step === 1 && activeStepIndex === 1) ||
              (link.step === 2 && activeStepIndex === 2);

            return (
              <span
                key={i}
                style={{
                  fontSize: 15,
                  fontWeight: isHighlight ? 800 : 600,
                  color: isHighlight ? '#8BC646' : '#4b5563',
                  padding: '6px 12px',
                  borderRadius: 8,
                  backgroundColor: isHighlight ? 'rgba(139, 198, 70, 0.12)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {link.label}
              </span>
            );
          })}
        </div>

        {/* Auth & CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: '9px 18px',
              borderRadius: 12,
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <User size={16} /> Iniciar Sesión
          </div>
          <div
            style={{
              padding: '9px 20px',
              borderRadius: 12,
              backgroundColor: '#8BC646',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 800,
              boxShadow: '0 4px 16px rgba(139, 198, 70, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Publicar Cosecha <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* Thin Timeline Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: -4,
          left: 64,
          right: 64,
          height: 3,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#8BC646',
            boxShadow: '0 0 10px rgba(139, 198, 70, 0.8)',
          }}
        />
      </div>
    </div>
  );
};
