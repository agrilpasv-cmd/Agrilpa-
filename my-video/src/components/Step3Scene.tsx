import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { ShieldCheck, Truck, ArrowRight, CheckCircle, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

export const Step3Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const cardSpring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  const isTransitioningToCta = interpolate(frame, [38, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaSpring = spring({
    frame: frame - 42,
    fps,
    config: { damping: 14, stiffness: 95 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '110px 100px 50px 100px',
      }}
    >
      {/* PHASE 1: Step 3 Info & Deal Confirmation */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '110px 100px 50px 100px',
          opacity: 1 - isTransitioningToCta,
          transform: `scale(${1 - isTransitioningToCta * 0.08})`,
          pointerEvents: frame > 45 ? 'none' : 'auto',
        }}
      >
        {/* Left Column */}
        <div style={{ maxWidth: 560 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 8,
              backgroundColor: 'rgba(139, 198, 70, 0.2)',
              border: '1px solid rgba(139, 198, 70, 0.5)',
              marginBottom: 16,
              transform: `scale(${Math.max(0, titleSpring)})`,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 900, color: '#8BC646' }}>PASO 03</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>CIERRE Y ENTREGA SEGURA</span>
          </div>

          <h2
            style={{
              fontSize: 46,
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              margin: '0 0 16px 0',
              letterSpacing: '-1px',
            }}
          >
            Cierra el Trato con Total Respaldo
          </h2>

          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#cbd5e1', margin: '0 0 24px 0' }}>
            Acuerda los términos de entrega, formaliza la operación y expande tu negocio agrícola con la garantía y el soporte continuo de Agrilpa.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Acuerdos flexibles y directos entre comprador y vendedor',
              'Soporte y acompañamiento durante todo el proceso',
              'Mayor rentabilidad sin comisiones abusivas',
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#f1f5f9',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    backgroundColor: 'rgba(139, 198, 70, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={15} color="#8BC646" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Deal Confirmed */}
        <div
          style={{
            width: 500,
            borderRadius: 24,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(139, 198, 70, 0.4)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 35px rgba(139, 198, 70, 0.2)',
            backdropFilter: 'blur(20px)',
            padding: 28,
            transform: `scale(${Math.max(0, cardSpring)})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              backgroundColor: 'rgba(139, 198, 70, 0.2)',
              border: '2px solid #8BC646',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 24px rgba(139, 198, 70, 0.4)',
            }}
          >
            <ShieldCheck size={38} color="#8BC646" />
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: '#8BC646',
            }}
          >
            TRATO FORMALIZADO
          </span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '6px 0 16px 0' }}>
            Operación Cerrada con Éxito
          </h3>

          <div
            style={{
              padding: 16,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Operación Comercial:</span>
              <span style={{ color: '#ffffff', fontWeight: 800 }}>15 Ton Café SHG</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Monto acordado:</span>
              <span style={{ color: '#8BC646', fontWeight: 800 }}>$63,000 USD (Directo)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Intermediarios:</span>
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>0% Sin comisiones ocultas</span>
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 2: Final Grand CTA (Exactly matching Agrilpa CTA section) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '110px 80px 50px 80px',
          opacity: isTransitioningToCta,
          transform: `scale(${0.92 + isTransitioningToCta * 0.08}) translateY(${(1 - Math.max(0, ctaSpring)) * 30}px)`,
          pointerEvents: frame > 45 ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 22px',
            borderRadius: 999,
            backgroundColor: 'rgba(139, 198, 70, 0.2)',
            border: '1px solid rgba(139, 198, 70, 0.5)',
            marginBottom: 20,
            boxShadow: '0 0 24px rgba(139, 198, 70, 0.3)',
          }}
        >
          <Sparkles size={18} color="#8BC646" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#8BC646' }}>
            Comercio Agrícola Moderno y Transparente
          </span>
        </div>

        <h1
          style={{
            fontSize: 64,
            fontWeight: 900,
            textAlign: 'center',
            margin: '0 0 16px 0',
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            color: '#ffffff',
            textShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}
        >
          ¿Listo para Empezar?
        </h1>

        <p
          style={{
            fontSize: 22,
            color: '#cbd5e1',
            textAlign: 'center',
            maxWidth: 780,
            lineHeight: 1.5,
            margin: '0 0 36px 0',
          }}
        >
          Únete a productores y compradores mayoristas que ya están transformando el comercio agroalimentario.
        </p>

        {/* Big Agrilpa CTA Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '18px 44px',
            borderRadius: 18,
            backgroundColor: '#8BC646',
            color: '#ffffff',
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: '-0.5px',
            boxShadow: '0 16px 40px rgba(139, 198, 70, 0.5), 0 0 60px rgba(139, 198, 70, 0.3)',
            marginBottom: 36,
          }}
        >
          <span>Crear Cuenta Gratis en agrilpa.com</span>
          <ArrowRight size={26} />
        </div>

        {/* Benefits bar matching components/como-funciona/page.tsx */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#8BC646' }}>Mejores Precios</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Sin intermediarios</div>
          </div>
          <div style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8' }}>Perfiles Verificados</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Compra con confianza</div>
          </div>
          <div style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>Chat Directo</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Tratos en tiempo real</div>
          </div>
        </div>
      </div>
    </div>
  );
};
