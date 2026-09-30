import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MessageSquare, FileText, Check, DollarSign, CheckCircle2 } from 'lucide-react';

export const Step2Scene: React.FC = () => {
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

  const chatMessage2 = spring({
    frame: frame - 18,
    fps,
    config: { damping: 13, stiffness: 95 },
  });

  const quoteBoxSpring = spring({
    frame: frame - 28,
    fps,
    config: { damping: 13, stiffness: 100 },
  });

  const exitOpacity = interpolate(frame, [65, 80], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitX = interpolate(frame, [65, 80], [0, -60], {
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
        padding: '110px 100px 50px 100px',
        opacity: exitOpacity,
        transform: `translateX(${exitX}px)`,
      }}
    >
      {/* Left Column: Para Compradores */}
      <div style={{ maxWidth: 560 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 8,
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            marginBottom: 16,
            transform: `scale(${Math.max(0, titleSpring)})`,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>PASO 02</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>PARA COMPRADORES MAYORISTAS</span>
        </div>

        <h2
          style={{
            fontSize: 46,
            fontWeight: 900,
            lineHeight: 1.15,
            color: '#ffffff',
            margin: '0 0 16px 0',
            letterSpacing: '-1px',
            transform: `translateY(${(1 - titleSpring) * 30}px)`,
          }}
        >
          Cotiza y Negocia en Tiempo Real
        </h2>

        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: '#cbd5e1',
            margin: '0 0 24px 0',
            transform: `translateY(${(1 - titleSpring) * 20}px)`,
          }}
        >
          Envía solicitudes de cotización formal, compara especificaciones y comunícate directamente con los productores a través del chat integrado de Agrilpa.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            'Solicitud estructurada con cantidades e Incoterms',
            'Chat en vivo 1 a 1 entre comprador y vendedor',
            'Cotizaciones formales con desglose claro y sin comisiones ocultas',
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
                  backgroundColor: 'rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={15} color="#38bdf8" />
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Agrilpa Chat & Quotation Component */}
      <div
        style={{
          width: 530,
          borderRadius: 24,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          padding: 22,
          transform: `scale(${Math.max(0, cardSpring)}) translateY(${(1 - Math.max(0, cardSpring)) * 30}px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Chat Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 12,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#8BC646',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: '#ffffff',
                fontSize: 13,
              }}
            >
              FC
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>Finca Los Cerezos</div>
              <div style={{ fontSize: 11, color: '#8BC646', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#8BC646' }} /> Vendedor Verificado Agrilpa
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: 'rgba(139, 198, 70, 0.15)',
              color: '#8BC646',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Soporte & Negociación
          </span>
        </div>

        {/* Message 1 (Buyer) */}
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: '85%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '10px 14px',
            borderRadius: '16px 16px 16px 4px',
            fontSize: 13,
            color: '#e2e8f0',
            lineHeight: 1.4,
          }}
        >
          Hola, somos importadores en Europa y requerimos 1 contenedor (15 Ton) de Café Arábica SHG. ¿Disponibilidad inmediata?
        </div>

        {/* Message 2 with Quotation */}
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: '94%',
            transform: `scale(${Math.max(0, chatMessage2)})`,
            opacity: Math.max(0, chatMessage2),
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(139, 198, 70, 0.2)',
              border: '1px solid rgba(139, 198, 70, 0.4)',
              padding: '10px 14px',
              borderRadius: '16px 16px 4px 16px',
              fontSize: 13,
              color: '#ffffff',
            }}
          >
            ¡Hola! Sí, lote listo para despacho. Te comparto la cotización formal por volumen:
          </div>

          {/* Quotation Card Box */}
          <div
            style={{
              backgroundColor: 'rgba(2, 38, 22, 0.95)',
              border: '1px solid rgba(139, 198, 70, 0.5)',
              borderRadius: 14,
              padding: 14,
              transform: `scale(${Math.max(0, quoteBoxSpring)})`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#8BC646' }}>COTIZACIÓN AGRILPA #COT-942</span>
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>Incoterm: FOB Puerto Cortés</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>15,000 Kg Café Arábica SHG</span>
              <span style={{ fontSize: 20, color: '#8BC646', fontWeight: 900 }}>$63,000 USD</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: '#8BC646',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              <CheckCircle2 size={16} /> Aceptar y Formalizar Compra
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
