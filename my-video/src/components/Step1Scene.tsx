import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { CheckCircle, UploadCloud, Tag, Award, Package, Shield } from 'lucide-react';

export const Step1Scene: React.FC = () => {
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
      {/* Left Column: Para Vendedores */}
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
          <span style={{ fontSize: 13, fontWeight: 900, color: '#8BC646' }}>PASO 01</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>PARA VENDEDORES & PRODUCTORES</span>
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
          Publica tus Productos Agrícolas
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
          Añade tus cosechas con fotos reales, fichas técnicas, certificaciones internacionales y precios directos para llegar a compradores globales.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            'Plantillas guiadas y subida rápida de catálogo',
            'Gestión de inventario y volumen en tiempo real',
            'Validación de certificados (GlobalGAP, Orgánico, etc.)',
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

      {/* Right Column: Interactive Product Publishing Card */}
      <div
        style={{
          width: 520,
          borderRadius: 24,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          padding: 24,
          transform: `scale(${Math.max(0, cardSpring)}) translateY(${(1 - Math.max(0, cardSpring)) * 30}px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 18,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            }}
          >
            <Img
              src={staticFile('cafe-arabica-grano-tostado.jpg')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#8BC646', backgroundColor: 'rgba(139,198,70,0.15)', padding: '2px 8px', borderRadius: 4 }}>
                CAFÉ DE ESPECIALIDAD
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Lote #CFE-102</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
              Café Arábica Premium SHG
            </h3>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>
              Altura 1,400 msnm • Finca Los Cerezos
            </div>
          </div>
        </div>

        {/* Details row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Disponibilidad</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>
              15,000 <span style={{ fontSize: 12, color: '#8BC646' }}>Kg (Sacos 69kg)</span>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Precio Referencial</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b', marginTop: 2 }}>
              $4.20 <span style={{ fontSize: 12, color: '#cbd5e1' }}>USD / Kg</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: 'rgba(139,198,70,0.15)', color: '#8BC646', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={14} /> Certificado Rainforest & Orgánico
          </div>
          <div style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={14} /> GrainPro Bag
          </div>
        </div>
      </div>
    </div>
  );
};
