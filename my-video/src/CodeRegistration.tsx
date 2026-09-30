import React, {useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {ArrowLeft, ChevronRight, LockKeyhole, MousePointer2, Plus, Share} from 'lucide-react';
import {GeneratedAuthView, emptyFormData} from './GeneratedAuthView';

const smooth = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.22, 1, .36, 1)} as const;
const typing = (text: string, frame: number, from: number, to: number) => text.slice(0, Math.floor(interpolate(frame, [from, to], [0, text.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
const spans: Array<[string, number, number]> = [
  ['fullName', 15, 45], ['email', 46, 98], ['password', 99, 136], ['confirmPassword', 137, 180],
  ['CONTINUAR', 181, 204], ['companyName', 225, 268], ['state', 302, 325],
  ['address', 326, 360], ['phoneNumber', 361, 386], ['SIGUIENTE PASO', 387, 399],
  ['product1', 409, 438], ['product2', 439, 458], ['product3', 459, 480], ['REGISTRARSE', 505, 524],
];

export const CodeRegistration: React.FC = () => {
  const frame = useCurrentFrame();
  const view = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({x: 1010, y: 332});
  const registrationStep = frame < 205 ? 1 : frame < 400 ? 2 : 3;
  const requiresVerification = frame >= 525;
  const activeIndex = spans.findIndex(([, from, to]) => frame >= from && frame <= to);
  const activeSpan = spans[activeIndex];
  const activeField = activeSpan?.[0] || '';
  const data = {
    ...emptyFormData,
    fullName: typing('Carlos Mendoza', frame, 18, 43),
    email: typing('carlos@finca.example', frame, 50, 94),
    password: typing('Ejemplo!2026Agro', frame, 104, 130),
    confirmPassword: typing('Ejemplo!2026Agro', frame, 145, 170),
    userType: 'vendedor',
    userSubType: frame >= 220 ? 'Productor agrícola / Caficultor' : '',
    companyName: typing('Finca El Roble', frame, 229, 262),
    hasExportCertificates: frame >= 280 ? 'false' : '',
    country: frame >= 291 ? 'El Salvador' : '',
    countryCode: frame >= 291 ? '503' : '',
    state: typing('Santa Ana', frame, 306, 322),
    address: typing('Calle Principal #123', frame, 330, 354),
    phoneNumber: typing('70000000', frame, 365, 382),
    product1: typing('Café', frame, 413, 432),
    product2: typing('Cacao', frame, 443, 454),
    product3: typing('Aguacate', frame, 462, 475),
    volumeRange: frame >= 488 ? '5001-50000' : '',
    howHeardAboutUs: frame >= 499 ? 'Redes Sociales' : '',
  };
  const changeAt = requiresVerification ? 525 : registrationStep === 3 ? 400 : registrationStep === 2 ? 205 : 0;
  const progress = interpolate(frame - changeAt, [0, 9], [0, 1], smooth);
  const contentOffset = registrationStep === 2 ? interpolate(frame, [284, 328], [0, -390], smooth) : registrationStep === 1 ? interpolate(frame, [126, 153], [0, -80], smooth) : 0;

  useLayoutEffect(() => {
    const root = view.current;
    if (!root) return;
    const findTarget = (name: string) => root.querySelector<HTMLElement>(`input[name="${name}"]`) || Array.from(root.querySelectorAll<HTMLElement>('button')).find(el => el.textContent?.replace(/\s+/g, ' ').trim() === name);
    const target = activeField ? findTarget(activeField) : null;
    if (target) {
      const rect = target.getBoundingClientRect();
      const base = root.getBoundingClientRect();
      const to = {x: (rect.x - base.x + rect.width * .8) / 1.5, y: (rect.y - base.y + rect.height * .55) / 1.5};
      const previous = activeIndex > 0 ? findTarget(spans[activeIndex - 1][0]) : null;
      const prevRect = previous?.getBoundingClientRect();
      const from = prevRect ? {x: (prevRect.x - base.x + prevRect.width * .8) / 1.5, y: (prevRect.y - base.y + prevRect.height * .55) / 1.5} : {x: to.x + 35, y: to.y - 50};
      const move = interpolate(frame, [activeSpan[1], activeSpan[1] + 7], [0, 1], smooth);
      setPointer({x: from.x + (to.x - from.x) * move, y: from.y + (to.y - from.y) * move});
    }
  }, [frame, registrationStep, activeField]);

  const clicking = ['CONTINUAR', 'SIGUIENTE PASO', 'REGISTRARSE'].includes(activeField);
  return <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
    <div style={{width: 1280, height: 960, transformOrigin: '0 0', scale: 1.5, position: 'absolute'}}>
      <div style={{height: 64, background: 'linear-gradient(#f2f3f4,#e5e7e9)', color: '#45484b', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', borderBottom: '1px solid #cdd1d5'}}>
        {['#ff5f57', '#ffbd2e', '#28c840'].map(color => <span key={color} style={{width: 14, height: 14, background: color, borderRadius: '50%'}}/>)}
        <ArrowLeft size={20} style={{marginLeft: 26, color: '#777'}}/><ChevronRight size={20} style={{color: '#aaa'}}/>
        <div style={{margin: '0 auto', width: 620, height: 34, borderRadius: 8, background: '#d9dde1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 15}}><LockKeyhole size={13}/>agrilpa.com/auth</div>
        <span style={{fontSize: 11, color: '#6b7177', marginRight: 14}}>Demostración</span><Share size={19}/><Plus size={21} style={{marginLeft: 10}}/>
      </div>
      <div ref={view} className="auth-video" style={{position: 'relative', overflow: 'hidden', '--step-opacity': .65 + progress * .35, '--step-offset': `${(1 - progress) * 14}px`} as React.CSSProperties}>
        <GeneratedAuthView formData={data} registrationStep={registrationStep} requiresVerification={requiresVerification} loading={frame >= 520 && frame < 525} activeField={activeField} contentOffset={contentOffset}/>
        {!requiresVerification && <div style={{position: 'absolute', left: pointer.x, top: pointer.y, pointerEvents: 'none', color: '#fff', filter: 'drop-shadow(0 2px 2px #0005)', scale: clicking && activeSpan && frame >= activeSpan[2] - 4 ? .9 : 1}}>
          <MousePointer2 size={24} strokeWidth={1.5} fill="#151719"/>
        </div>}
      </div>
    </div>
  </AbsoluteFill>;
};
