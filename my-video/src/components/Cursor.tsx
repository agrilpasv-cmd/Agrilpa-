import React from 'react';

interface Props {
  x: number;
  y: number;
  isClicking?: boolean;
}

export const Cursor: React.FC<Props> = ({ x, y, isClicking = false }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${y}px`,
        left: `${x}px`,
        transform: `scale(${isClicking ? 0.82 : 1}) translate(-2px, -2px)`,
        pointerEvents: 'none',
        zIndex: 100,
        transition: 'transform 0.1s ease',
      }}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill="#0f172a"
          stroke="#ffffff"
          strokeWidth="1.6"
        />
      </svg>
      {isClicking && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: -12,
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '3px solid #8BC646',
            backgroundColor: 'rgba(139, 198, 70, 0.25)',
          }}
        />
      )}
    </div>
  );
};
