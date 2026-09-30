import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Mail, Lock, User, Building2, Phone, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, Check, Eye } from 'lucide-react';
import { Cursor } from './Cursor';

export const RegisterWalkthrough: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Helper for typing text progressively
  const getTypedText = (text: string, startFrame: number, speed: number = 2) => {
    if (frame < startFrame) return '';
    const length = Math.min(text.length, Math.floor((frame - startFrame) / speed));
    return text.substring(0, length);
  };

  // Field values typed at specific frames
  const nameText = getTypedText('Carlos Mendoza', 35, 1.8);
  const isNameActive = frame >= 30 && frame < 75;

  const companyText = getTypedText('Agroexportadora del Sol S.A.', 78, 1.6);
  const isCompanyActive = frame >= 75 && frame < 125;

  const emailText = getTypedText('carlos.mendoza@agrosol.com', 128, 1.5);
  const isEmailActive = frame >= 125 && frame < 175;

  const phoneText = getTypedText('+52 443 281 9040', 178, 1.8);
  const isPhoneActive = frame >= 175 && frame < 215;

  const isPasswordActive = frame >= 215 && frame < 265;
  const passwordCharsCount = Math.min(14, Math.max(0, Math.floor((frame - 218) / 1.8)));
  const passwordDots = '•'.repeat(passwordCharsCount);

  // Button state & submission
  const isButtonHovered = frame >= 268 && frame < 285;
  const isButtonClicked = frame >= 280 && frame < 295;
  const isSubmitted = frame >= 290;

  // Camera zoom in onto the form during typing, then zoom out to celebrate
  const cameraZoom = interpolate(
    frame,
    [0, 40, 240, 285, 330],
    [1.0, 1.15, 1.18, 1.08, 1.0],
    { extrapolateRight: 'clamp' }
  );

  const cameraPanY = interpolate(
    frame,
    [0, 60, 180, 270, 320],
    [0, -40, -100, -20, 0],
    { extrapolateRight: 'clamp' }
  );

  // Dynamic Cursor Position (x, y)
  // 0-30: Moving to Name
  // 30-75: On Name
  // 75-125: On Company
  // 125-175: On Email
  // 175-215: On Phone
  // 215-265: On Password
  // 265-290: Moving to Submit Button
  // 290+: Idle
  let cursorX = 850;
  let cursorY = 480;

  if (frame < 30) {
    cursorX = interpolate(frame, [0, 30], [1200, 780]);
    cursorY = interpolate(frame, [0, 30], [800, 485]);
  } else if (frame < 75) {
    cursorX = 780;
    cursorY = 485;
  } else if (frame < 125) {
    cursorX = interpolate(frame, [72, 78], [780, 1140]);
    cursorY = interpolate(frame, [72, 78], [485, 485]);
  } else if (frame < 175) {
    cursorX = interpolate(frame, [120, 128], [1140, 780]);
    cursorY = interpolate(frame, [120, 128], [485, 575]);
  } else if (frame < 215) {
    cursorX = interpolate(frame, [170, 178], [780, 1140]);
    cursorY = interpolate(frame, [170, 178], [575, 575]);
  } else if (frame < 265) {
    cursorX = interpolate(frame, [210, 218], [1140, 780]);
    cursorY = interpolate(frame, [210, 218], [575, 665]);
  } else if (frame < 295) {
    cursorX = interpolate(frame, [260, 278], [780, 960]);
    cursorY = interpolate(frame, [260, 278], [665, 840]);
  } else {
    cursorX = 1400;
    cursorY = 900;
  }

  const cursorClicking =
    (frame >= 28 && frame <= 34) ||
    (frame >= 74 && frame <= 80) ||
    (frame >= 124 && frame <= 130) ||
    (frame >= 174 && frame <= 180) ||
    (frame >= 214 && frame <= 220) ||
    (frame >= 278 && frame <= 286);

  // Success screen spring
  const successSpring = spring({
    frame: frame - 290,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#03140c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background Gradients */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: 800,
          height: 800,
          background: 'radial-gradient(circle, rgba(139, 198, 70, 0.22) 0%, transparent 70%)',
          filter: 'blur(80px)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '25%',
          width: 700,
          height: 700,
          background: 'radial-gradient(circle, rgba(5, 150, 105, 0.25) 0%, transparent 70%)',
          filter: 'blur(70px)',
          borderRadius: '50%',
        }}
      />

      {/* Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Floating Badge */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 24px',
          borderRadius: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(139, 198, 70, 0.4)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          zIndex: 30,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 900,
            color: '#8BC646',
            backgroundColor: 'rgba(139, 198, 70, 0.15)',
            padding: '4px 10px',
            borderRadius: 6,
          }}
        >
          PASO 1
        </span>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
          Regístrate Gratis en Agrilpa
        </span>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          (Menos de 5 minutos)
        </span>
      </div>

      {/* Camera Viewport with dynamic Zoom/Pan */}
      <div
        style={{
          transform: `scale(${cameraZoom}) translateY(${cameraPanY}px)`,
          transformOrigin: 'center center',
          transition: 'transform 0.05s linear',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {/* Main Card */}
        <div
          style={{
            width: 820,
            borderRadius: 28,
            backgroundColor: '#ffffff',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(226, 232, 240, 0.8)',
            padding: 38,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top Brand & Form Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#8BC646',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(139, 198, 70, 0.35)',
                }}
              >
                <span style={{ fontSize: 24 }}>🌱</span>
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                  Crear Cuenta de Vendedor
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>
                  Comienza a vender tus cosechas a compradores mayoristas en todo el mundo
                </p>
              </div>
            </div>

            {/* Free badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                backgroundColor: 'rgba(139, 198, 70, 0.12)',
                border: '1px solid rgba(139, 198, 70, 0.3)',
                color: '#5a9e22',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              <ShieldCheck size={16} color="#8BC646" /> Sin Costos Iniciales
            </div>
          </div>

          {/* Role selector tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              padding: 5,
              borderRadius: 14,
              backgroundColor: '#f1f5f9',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                padding: '10px',
                textAlign: 'center',
                borderRadius: 10,
                backgroundColor: '#8BC646',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                boxShadow: '0 2px 8px rgba(139, 198, 70, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Check size={16} /> Soy Vendedor / Productor Agrícola
            </div>
            <div
              style={{
                padding: '10px',
                textAlign: 'center',
                borderRadius: 10,
                color: '#64748b',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Soy Comprador Mayorista
            </div>
          </div>

          {/* Registration Form Fields */}
          {!isSubmitted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Row 1: Nombre Completo & Nombre Empresa */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Field 1: Nombre */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Nombre Completo
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: isNameActive ? '2px solid #8BC646' : '1px solid #cbd5e1',
                      backgroundColor: isNameActive ? '#fafff5' : '#ffffff',
                      boxShadow: isNameActive ? '0 0 0 4px rgba(139, 198, 70, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <User size={18} color={isNameActive ? '#8BC646' : '#94a3b8'} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: nameText ? '#0f172a' : '#94a3b8' }}>
                      {nameText || 'Ej. Carlos Mendoza'}
                      {isNameActive && <span style={{ borderRight: '2px solid #8BC646', animation: 'blink 1s infinite', marginLeft: 2 }}>&nbsp;</span>}
                    </span>
                  </div>
                </div>

                {/* Field 2: Empresa */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Nombre de la Empresa o Finca
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: isCompanyActive ? '2px solid #8BC646' : '1px solid #cbd5e1',
                      backgroundColor: isCompanyActive ? '#fafff5' : '#ffffff',
                      boxShadow: isCompanyActive ? '0 0 0 4px rgba(139, 198, 70, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Building2 size={18} color={isCompanyActive ? '#8BC646' : '#94a3b8'} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: companyText ? '#0f172a' : '#94a3b8' }}>
                      {companyText || 'Ej. Agroexportadora del Sol'}
                      {isCompanyActive && <span style={{ borderRight: '2px solid #8BC646', animation: 'blink 1s infinite', marginLeft: 2 }}>&nbsp;</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Correo Electrónico & Teléfono */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Field 3: Email */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Correo Electrónico de Contacto
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: isEmailActive ? '2px solid #8BC646' : '1px solid #cbd5e1',
                      backgroundColor: isEmailActive ? '#fafff5' : '#ffffff',
                      boxShadow: isEmailActive ? '0 0 0 4px rgba(139, 198, 70, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Mail size={18} color={isEmailActive ? '#8BC646' : '#94a3b8'} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: emailText ? '#0f172a' : '#94a3b8' }}>
                      {emailText || 'carlos@tuempresa.com'}
                      {isEmailActive && <span style={{ borderRight: '2px solid #8BC646', animation: 'blink 1s infinite', marginLeft: 2 }}>&nbsp;</span>}
                    </span>
                  </div>
                </div>

                {/* Field 4: Teléfono */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Teléfono / WhatsApp
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: isPhoneActive ? '2px solid #8BC646' : '1px solid #cbd5e1',
                      backgroundColor: isPhoneActive ? '#fafff5' : '#ffffff',
                      boxShadow: isPhoneActive ? '0 0 0 4px rgba(139, 198, 70, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>🇲🇽</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: phoneText ? '#0f172a' : '#94a3b8' }}>
                      {phoneText || '+52 (000) 000-0000'}
                      {isPhoneActive && <span style={{ borderRight: '2px solid #8BC646', animation: 'blink 1s infinite', marginLeft: 2 }}>&nbsp;</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Contraseña con Medidor de Seguridad */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                    Contraseña Segura
                  </label>
                  {isPasswordActive && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#8BC646' }}>
                      ✓ Seguridad: Muy Alta
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: isPasswordActive ? '2px solid #8BC646' : '1px solid #cbd5e1',
                    backgroundColor: isPasswordActive ? '#fafff5' : '#ffffff',
                    boxShadow: isPasswordActive ? '0 0 0 4px rgba(139, 198, 70, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Lock size={18} color={isPasswordActive ? '#8BC646' : '#94a3b8'} />
                    <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '3px', color: '#0f172a' }}>
                      {passwordDots || '••••••••••••'}
                    </span>
                  </div>
                  <Eye size={18} color="#94a3b8" />
                </div>

                {/* Password strength bar */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#8BC646' }} />
                  <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#8BC646' }} />
                  <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#8BC646' }} />
                  <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#8BC646' }} />
                </div>
              </div>

              {/* Submit CTA Button */}
              <div
                style={{
                  marginTop: 10,
                  padding: '16px 24px',
                  borderRadius: 16,
                  backgroundColor: '#8BC646',
                  color: '#ffffff',
                  fontSize: 17,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: isButtonHovered
                    ? '0 12px 30px rgba(139, 198, 70, 0.5), 0 0 0 4px rgba(139, 198, 70, 0.3)'
                    : '0 6px 20px rgba(139, 198, 70, 0.4)',
                  transform: `scale(${isButtonClicked ? 0.96 : 1})`,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <span>Crear Cuenta de Vendedor (Gratis)</span>
                <ArrowRight size={20} />
              </div>
            </div>
          ) : (
            /* SUCCESS CONFIRMATION STATE */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 10px',
                textAlign: 'center',
                transform: `scale(${Math.max(0, successSpring)})`,
                opacity: Math.max(0, successSpring),
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(139, 198, 70, 0.15)',
                  border: '3px solid #8BC646',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  boxShadow: '0 0 30px rgba(139, 198, 70, 0.4)',
                }}
              >
                <CheckCircle2 size={46} color="#8BC646" />
              </div>

              <span style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#8BC646' }}>
                ¡REGISTRO COMPLETADO!
              </span>

              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '6px 0 10px 0' }}>
                Bienvenido a Agrilpa, Carlos
              </h2>

              <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Tu perfil de vendedor para <strong>Agroexportadora del Sol S.A.</strong> ha sido creado exitosamente. Ya puedes publicar tus cosechas.
              </p>

              {/* 3 Pillars from como-funciona page */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, width: '100%' }}>
                <div style={{ padding: '14px 12px', borderRadius: 14, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>⚡</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Simple y Rápido</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Listo en 5 minutos</div>
                </div>

                <div style={{ padding: '14px 12px', borderRadius: 14, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🏢</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Empresa Verificada</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Perfil profesional</div>
                </div>

                <div style={{ padding: '14px 12px', borderRadius: 14, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🔒</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#8BC646' }}>0 Costos Iniciales</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Sin costos ocultos</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Animated Cursor */}
      <Cursor x={cursorX} y={cursorY} isClicking={cursorClicking} />
    </div>
  );
};
