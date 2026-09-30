import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { CheckCircle, Globe2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 95 },
  });

  const cardSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 85 },
  });

  const exitOpacity = interpolate(frame, [54, 65], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitScale = interpolate(frame, [54, 65], [1, 0.96], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '120px 100px 60px 100px',
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      {/* Left Column: Authentic Hero Headline */}
      <div style={{ maxWidth: 650 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 999,
            backgroundColor: 'rgba(139, 198, 70, 0.2)',
            border: '1px solid rgba(139, 198, 70, 0.5)',
            marginBottom: 20,
            transform: `scale(${Math.max(0, titleSpring)})`,
          }}
        >
          <CheckCircle size={16} color="#8BC646" />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#a3e635' }}>
            Plataforma B2B Agrícola Global
          </span>
        </div>

        <h1
          style={{
            fontSize: 66,
            fontWeight: 900,
            lineHeight: 1.05,
            color: '#ffffff',
            margin: '0 0 18px 0',
            letterSpacing: '-2px',
            transform: `translateY(${(1 - titleSpring) * 35}px)`,
            textShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}
        >
          Conecta el campo <br />
          <span style={{ color: '#8BC646' }}>con el mundo.</span>
        </h1>

        <p
          style={{
            fontSize: 20,
            lineHeight: 1.55,
            color: '#e2e8f0',
            margin: '0 0 32px 0',
            maxWidth: 580,
            transform: `translateY(${(1 - titleSpring) * 20}px)`,
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          Conectamos directamente a <strong style={{ color: '#8BC646' }}>productores del campo</strong> con{' '}
          <strong style={{ color: '#38bdf8' }}>compradores internacionales</strong>, negociando con total transparencia y sin intermediarios.
        </p>

        {/* Hero CTA buttons from actual app/page.tsx */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div
            style={{
              padding: '16px 32px',
              borderRadius: 16,
              backgroundColor: '#8BC646',
              color: '#ffffff',
              fontSize: 18,
              fontWeight: 800,
              boxShadow: '0 0 30px rgba(139, 198, 70, 0.45)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            Buscar Proveedores <ArrowRight size={20} />
          </div>

          <div
            style={{
              padding: '16px 28px',
              borderRadius: 16,
              backgroundColor: '#000000',
              border: '1px solid #333333',
              color: '#ffffff',
              fontSize: 18,
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            Vender mis productos
          </div>
        </div>
      </div>

      {/* Right Column: Hero Banner Showcase */}
      <div
        style={{
          width: 540,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          transform: `scale(${Math.max(0, cardSpring)}) translateY(${(1 - Math.max(0, cardSpring)) * 30}px)`,
        }}
      >
        <div style={{ height: 260, position: 'relative' }}>
          <Img
            src={staticFile('aguacate-mexicano-hass.jpg')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: '#8BC646',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShieldCheck size={14} /> Oferta Destacada
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.95))',
              padding: '24px 20px 14px 20px',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8BC646', textTransform: 'uppercase' }}>
              Aguacate Hass Mexicano Premium
            </span>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff' }}>
              24 Toneladas disponibles • GlobalGAP
            </div>
          </div>
        </div>

        {/* Live Marketplace Highlights */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Precio Directo Productor</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#8BC646' }}>$2.45 USD <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>/ Kg</span></div>
          </div>
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            Ver Ficha Técnica
          </div>
        </div>
      </div>
    </div>
  );
};
