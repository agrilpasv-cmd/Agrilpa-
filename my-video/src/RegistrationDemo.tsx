import React from 'react';
import {Composition, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

import homepageImg from "../public/assets/homepage.png";
const BACKGROUND_IMAGE = homepageImg;

export const RegistrationDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Zoom animation using spring (0-90 frames)
  const zoom = spring({frame, fps, from: 1, to: 1.5, config: {damping: 200, mass: 0.5}});

  // Simulated typing text
  const fullText = 'Juan Pérez\njuanp@example.com\nContraseña: ********';
  const typingSpeed = 3; // frames per character
  const chars = Math.min(Math.floor(frame / typingSpeed), fullText.length);
  const displayed = fullText.slice(0, chars);

  // Fade‑in of form overlay after zoom
  const overlayOpacity = interpolate(frame, [100, 130], [0, 1]);

  return (
    <div style={{width: '100%', height: '100%', position: 'relative', backgroundColor: '#111', overflow: 'hidden'}}>
      <Img src={BACKGROUND_IMAGE} style={{width: '100%', height: '100%', transform: `scale(${zoom})`, objectFit: 'cover'}} />
      <div style={{position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '40%', padding: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', opacity: overlayOpacity, fontFamily: "'Inter', sans-serif"}}>
        <h2 style={{margin: 0, fontSize: '1.4rem', color: '#222'}}>Registro de Vendedor</h2>
        <pre style={{marginTop: '12px', fontSize: '1rem', lineHeight: 1.4, color: '#333', whiteSpace: 'pre-wrap'}}>{displayed}</pre>
      </div>
    </div>
  );
};

export const RegistrationComposition = () => (
  <Composition
    id="RegistrationDemo"
    component={RegistrationDemo}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={720}
    defaultProps={{}}
  />
);
