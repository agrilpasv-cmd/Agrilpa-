import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ArrowLeft, ChevronRight, LockKeyhole, MousePointer2, Plus, Share} from 'lucide-react';

// Actual Agrilpa captures; animate the camera and pointer, not a recreated interface.
const W = 1280;
const H = 896;
const options = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.22, 1, .36, 1)} as const;
const shot = (name: string) => staticFile(`registration-real/${name}.jpg`);
const Capture: React.FC<{name: string}> = ({name}) => <Img src={shot(name)} style={{position: 'absolute', inset: 0, width: W, height: H, objectFit: 'fill'}}/>;

const Cursor: React.FC<{x: number; y: number; click?: number}> = ({x, y, click = -100}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame, [click, click + 10], [0, 1], options);
  return <div style={{position: 'absolute', left: x, top: y, color: '#fff', filter: 'drop-shadow(0 2px 2px #0005)', scale: interpolate(frame, [click, click + 3, click + 7], [1, .84, 1], options)}}>
    {frame >= click && frame < click + 10 && <div style={{position: 'absolute', left: -17, top: -17, width: 38, height: 38, border: '2px solid #8bc646', borderRadius: '50%', scale: .6 + pulse, opacity: 1 - pulse}}/>}
    <MousePointer2 size={27} strokeWidth={1.5} fill="#151719"/>
  </div>;
};

const TypedCapture: React.FC<{base: string; final: string; from: number; to: number; y: number; textWidth: number}> = ({base, final, from, to, y, textWidth}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [from, to], [0, textWidth], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <><Capture name={base}/>{frame >= from && <>
    <div style={{position: 'absolute', left: 749, top: y, width: 410, height: 27, background: '#fff'}}/>
    <div style={{position: 'absolute', left: 749, top: y, width: reveal, height: 27, overflow: 'hidden'}}><Img src={shot(final)} style={{position: 'absolute', left: -749, top: -y, width: W, height: H, maxWidth: 'none'}}/></div>
    {frame < to && <div style={{position: 'absolute', left: 750 + reveal, top: y + 5, width: 1, height: 17, background: '#171717'}}/>}
  </>}</>;
};

type SceneProps = {kind: 'home' | 'identity' | 'business' | 'products' | 'verification'; duration: number};
const Scene: React.FC<SceneProps> = ({kind, duration}) => {
  const frame = useCurrentFrame();
  let zoom = 1, focusX = 640, focusY = 448, cursorX = 1000, cursorY = 600, clicking = -100;
  let content: React.ReactNode;
  if (kind === 'home') {
    zoom = interpolate(frame, [0, 18, 32], [1, 1.6, 1.7], options);
    focusX = interpolate(frame, [0, 20], [640, 420], options);
    focusY = interpolate(frame, [0, 20], [448, 693], options);
    cursorX = interpolate(frame, [0, 20], [800, 400], options);
    cursorY = interpolate(frame, [0, 20], [520, 850], options);
    clicking = 23;
    content = <Capture name="home"/>;
  } else if (kind === 'identity') {
    zoom = interpolate(frame, [0, 12, 45, 61, 83], [1.12, 1.75, 1.8, 1.6, 1.4], options);
    focusX = interpolate(frame, [0, 12], [750, 955], options);
    focusY = interpolate(frame, [0, 18, 48, 63, 83], [400, 378, 430, 572, 565], options);
    cursorX = 1050;
    cursorY = interpolate(frame, [0, 10, 24, 32, 53, 65, 77], [330, 342, 342, 440, 440, 648, 733], options);
    clicking = 77;
    content = frame < 28 ? <TypedCapture base="identity-empty" final="identity-name" from={8} to={23} y={328} textWidth={113}/> : frame < 52 ? <TypedCapture base="identity-name" final="identity-email" from={29} to={46} y={426} textWidth={165}/> : <Capture name="identity-complete"/>;
  } else if (kind === 'business') {
    zoom = interpolate(frame, [0, 12, 32, 48, 75], [1.25, 1.7, 1.75, 1.55, 1.4], options);
    focusX = interpolate(frame, [0, 12], [800, 960], options);
    focusY = interpolate(frame, [0, 12, 26, 38, 48, 64, 75], [400, 425, 250, 250, 628, 650, 650], options);
    cursorX = 1060;
    cursorY = interpolate(frame, [0, 17, 30, 43, 65], [460, 480, 203, 554, 834], options);
    clicking = 67;
    content = <Capture name={frame < 13 ? 'business-empty' : frame < 26 ? 'business-dropdown' : frame < 41 ? 'business-top' : 'business-bottom'}/>;
  } else if (kind === 'products') {
    zoom = interpolate(frame, [0, 12, 30, 53, 75], [1.3, 1.85, 1.85, 1.62, 1.4], options);
    focusX = interpolate(frame, [0, 12], [820, 957], options);
    focusY = interpolate(frame, [0, 12, 35, 57, 75], [410, 390, 420, 670, 660], options);
    cursorX = interpolate(frame, [0, 16, 26, 38, 64], [800, 812, 961, 1110, 1060], options);
    cursorY = interpolate(frame, [0, 35, 64], [385, 385, 805], options);
    clicking = 65;
    content = <Capture name={frame < 19 ? 'products-empty' : 'products-complete'}/>;
  } else {
    zoom = interpolate(frame, [0, 14, 36, 53], [1.4, 1.8, 1.8, 1.08], options);
    focusX = interpolate(frame, [0, 36, 53], [953, 953, 670], options);
    focusY = interpolate(frame, [0, 36, 53], [470, 470, 448], options);
    content = <Capture name="verification"/>;
  }
  return <AbsoluteFill style={{overflow: 'hidden', background: '#fff', opacity: interpolate(frame, kind === 'verification' ? [0, 6] : [0, 6, duration - 6, duration - 1], kind === 'verification' ? [0, 1] : [0, 1, 1, 0], options)}}>
    <div style={{width: W, height: H, position: 'absolute', transformOrigin: '0 0', scale: zoom, translate: `${W / 2 - focusX * zoom}px ${H / 2 - focusY * zoom}px`, filter: `blur(${interpolate(frame, [0, 5, 9], [2, .5, 0], options)}px)`}}>
      {content}
      {kind !== 'verification' && <Cursor x={cursorX} y={cursorY} click={clicking}/>}
    </div>
  </AbsoluteFill>;
};

export const MacRegistration: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{background: '#fff', color: '#45484b', fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
    {/* Safari-style browser chrome only, with no desktop or operating-system menu. */}
    <div style={{height: 64, background: 'linear-gradient(#f2f3f4,#e5e7e9)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', borderBottom: '1px solid #cdd1d5', zIndex: 2}}>
      {['#ff5f57', '#ffbd2e', '#28c840'].map(color => <span key={color} style={{width: 14, height: 14, background: color, borderRadius: '50%'}}/>)}
      <ArrowLeft size={20} style={{marginLeft: 26, color: '#777'}}/><ChevronRight size={20} style={{color: '#aaa'}}/>
      <div style={{margin: '0 auto', width: 620, height: 34, borderRadius: 8, background: '#d9dde1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 15}}><LockKeyhole size={13}/>agrilpa.com{frame >= 28 ? '/auth' : ''}</div>
      <span style={{fontSize: 11, color: '#6b7177', marginRight: 14}}>Demostración</span><Share size={19}/><Plus size={21} style={{marginLeft: 10}}/>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 64, height: H, overflow: 'hidden'}}>
      <Sequence from={0} durationInFrames={34}><Scene kind="home" duration={34}/></Sequence>
      <Sequence from={28} durationInFrames={84}><Scene kind="identity" duration={84}/></Sequence>
      <Sequence from={106} durationInFrames={76}><Scene kind="business" duration={76}/></Sequence>
      <Sequence from={176} durationInFrames={76}><Scene kind="products" duration={76}/></Sequence>
      <Sequence from={246} durationInFrames={54}><Scene kind="verification" duration={54}/></Sequence>
    </div>
  </AbsoluteFill>;
};
