import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Sprout, CheckCircle2 } from 'lucide-react';

interface Props {
  currentStepIndex: number; // 0 for intro, 1 for step 1, 2 for step 2, 3 for step 3
}

export const HeaderProgress: React.FC<Props> = ({ currentStepIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const progressWidth = interpolate(frame, [0, 300], [0, 100], {
    extrapolateRight: 'clamp',
  });

  const steps = [
    { num: '01', label: 'Publica Cosecha' },
    { num: '02', label: 'Cotiza Directo' },
    { num: '03', label: 'Trato Seguro' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '32px 56px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        opacity: headerOpacity,
      }}
    >
      {/* Brand logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          }}
        >
          <Sprout size={26} color="#ffffff" />
        </div>
        <div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(to right, #ffffff, #a7f3d0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Agrilpa
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              padding: '3px 8px',
              borderRadius: 6,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.3)',
            }}
          >
            B2B Agro
          </span>
        </div>
      </div>

      {/* Step Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {steps.map((st, idx) => {
          const isActive = currentStepIndex === idx + 1;
          const isPassed = currentStepIndex > idx + 1;

          return (
            <div
              key={st.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 18px',
                borderRadius: 999,
                backgroundColor: isActive
                  ? 'rgba(16, 185, 129, 0.25)'
                  : isPassed
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: isActive
                  ? '1px solid rgba(52, 211, 153, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
            >
              {isPassed ? (
                <CheckCircle2 size={16} color="#10b981" />
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: isActive ? '#34d399' : '#94a3b8',
                  }}
                >
                  {st.num}
                </span>
              )}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Global Progress Bar on Top */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 56,
          right: 56,
          height: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressWidth}%`,
            background: 'linear-gradient(90deg, #10b981, #84cc16)',
            borderRadius: 4,
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.8)',
          }}
        />
      </div>
    </div>
  );
};
