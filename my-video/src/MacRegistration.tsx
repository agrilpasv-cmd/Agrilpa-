import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ArrowLeft, ArrowRight, Check, ChevronDown, Eye, LockKeyhole, Mail, MousePointer2, ShieldCheck} from 'lucide-react';

const green = '#529500';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type Field = {label: string; text: string; start: number; end: number; select?: boolean; secret?: boolean};
const identity: Field[] = [
  {label: 'Nombre Completo *', text: 'Carlos Mendoza', start: 88, end: 130},
  {label: 'Correo Electrónico *', text: 'carlos@fincaejemplo.example', start: 145, end: 210},
  {label: 'Contraseña *', text: '••••••••••••', start: 222, end: 253, secret: true},
  {label: 'Confirmar Contraseña *', text: '••••••••••••', start: 265, end: 292, secret: true},
];
const business: Field[] = [
  {label: 'Tipo de Usuario *', text: 'Vendedor Agrícola', start: 338, end: 357, select: true},
  {label: '¿Qué tipo de vendedor eres? *', text: 'Productor agrícola / Caficultor', start: 365, end: 384, select: true},
  {label: 'Nombre de la Empresa *', text: 'Finca El Roble', start: 395, end: 428},
  {label: '¿Posee certificados para exportar? *', text: 'No, no tengo certificados', start: 436, end: 451, select: true},
  {label: 'Página web (Opcional)', text: 'www.fincaejemplo.example', start: 465, end: 495},
  {label: 'País *', text: 'El Salvador', start: 505, end: 520, select: true},
  {label: 'Estado / Provincia *', text: 'Santa Ana', start: 527, end: 550},
  {label: 'Dirección de la Empresa *', text: 'Calle Principal #123', start: 558, end: 590},
  {label: 'Teléfono *', text: '+503 7000 0000', start: 598, end: 625},
];
const interests: Field[] = [
  {label: 'Productos que Ofreces / Cultivas *', text: 'Café, cacao, aguacate', start: 665, end: 710},
  {label: 'Países de interés comercial (Opcional)', text: 'Guatemala, México', start: 720, end: 750},
  {label: '¿Abastecen o proveen productos de algún país? *', text: 'No', start: 760, end: 776, select: true},
  {label: 'Volumen de Movimiento Anual (USD $) *', text: 'De $5,001 a $50,000', start: 785, end: 804, select: true},
  {label: '¿Cómo se enteró de nosotros? *', text: 'Redes sociales', start: 812, end: 829, select: true},
];

export const MacRegistration: React.FC = () => {
  const frame = useCurrentFrame();
  const home = frame < 75;
  const step = frame < 325 ? 1 : frame < 650 ? 2 : 3;
  const success = frame >= 875;
  const sending = frame >= 856 && frame < 875;
  const fields = step === 1 ? identity : step === 2 ? business : interests;
  const scroll = step === 2 ? interpolate(frame, [450, 478, 550, 580], [0, 300, 300, 650], clamp) : step === 3 ? interpolate(frame, [770, 798], [0, 180], clamp) : 0;
  const activeIndex = fields.findIndex(field => frame >= field.start && frame <= field.end);
  const submit = (frame >= 307 && frame < 325) || (frame >= 634 && frame < 650) || (frame >= 846 && frame < 875);
  const cursorY = home ? interpolate(frame, [0, 55], [695, 1100], clamp) : submit ? (step === 1 ? 1025 : step === 2 ? 1080 : 1100) : (step === 1 ? 570 : 620) + Math.max(0, activeIndex) * 124 - scroll;
  const caption = home ? 'Comienza en Agrilpa' : success ? 'Revisa tu correo para activar tu cuenta' : step === 1 ? '1. Crea tu acceso' : step === 2 ? '2. Registra tu empresa' : '3. Añade tus productos';

  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 15% 90%, #df9477, transparent 55%), radial-gradient(ellipse at 85% 10%, #87b6c6, transparent 65%), linear-gradient(130deg,#213f4c,#557667)', fontFamily: 'Arial, sans-serif', color: '#171b21'}}>
    <div style={{height: 42, background: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', fontSize: 21}}><span style={{fontWeight: 700}}>●</span><b>Safari</b><span>Archivo</span><span>Edición</span><span>Visualización</span><span>Historial</span><span style={{marginLeft: 'auto'}}>Wi-Fi　▰　 10:09</span></div>
    <div style={{position: 'absolute', top: 76, left: 80, width: 1760, height: 1230, borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 35px 90px #12232b66', border: '1px solid #ffffff77'}}>
      <div style={{height: 80, background: '#eef0f2', display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', borderBottom: '1px solid #d5d8db'}}>
        {['#ff5f57','#ffbd2e','#28c840'].map(color => <span key={color} style={{width: 19, height: 19, borderRadius: '50%', background: color}}/>)}
        <ArrowLeft size={26} style={{marginLeft: 30, color: '#71777d'}}/>
        <div style={{marginLeft: 210, width: 800, padding: '12px 24px', borderRadius: 10, background: '#dfe3e6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 24}}><LockKeyhole size={19}/>agrilpa.com{home ? '' : '/auth'}</div>
      </div>
      <div style={{height: 1150, position: 'relative', overflow: 'hidden'}}>
        {home ? <>
          <Img src={staticFile('screens/agrilpa_homepage_hero_1790270732121.png')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left top'}}/>
          <div style={{position: 'absolute', bottom: 50, left: 50, padding: '18px 28px', borderRadius: 14, background: '#ffffffee', fontSize: 30}}>Haz clic en <b>Vender mis productos</b></div>
        </> : <>
          <div style={{position: 'absolute', left: 0, width: 790, height: '100%', overflow: 'hidden'}}>
            <Img src={staticFile('auth-bg-vineyard.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
            <AbsoluteFill style={{background: 'linear-gradient(0deg,rgba(0,20,6,.83),transparent 65%)'}}/>
            <div style={{position: 'absolute', bottom: 90, left: 48, right: 48, color: '#fff'}}><h2 style={{fontSize: 49, lineHeight: 1.15, letterSpacing: -1, margin: '0 0 25px'}}>Conecta y expande tu negocio en el mercado agrícola global.</h2><p style={{fontSize: 26, lineHeight: 1.5, margin: 0}}>Regístrate como vendedor o comprador y comienza a expandir tu negocio agrícola. Rápido, seguro y totalmente gratuito.</p></div>
          </div>
          <div style={{position: 'absolute', left: 790, right: 0, top: 0, bottom: 0, background: '#fafafa', overflow: 'hidden'}}>
            {success ? <div style={{padding: '230px 80px', textAlign: 'center'}}>
              <div style={{width: 116, height: 116, borderRadius: '50%', background: '#eaf3de', color: green, margin: '0 auto 40px', display: 'grid', placeItems: 'center'}}><Mail size={58}/></div>
              <h2 style={{fontSize: 48, margin: '0 0 26px'}}>¡Revisa tu correo!</h2>
              <p style={{fontSize: 29, lineHeight: 1.5, color: '#616872'}}>Te enviamos un enlace de verificación a</p><b style={{fontSize: 30}}>carlos@fincaejemplo.example</b>
              <p style={{fontSize: 28, lineHeight: 1.5, color: '#616872', marginTop: 36}}>Confirma tu correo para activar tu cuenta y comenzar a vender en Agrilpa.</p>
              <div style={{marginTop: 45, color: green, display: 'flex', justifyContent: 'center', gap: 12, fontSize: 28}}><ShieldCheck/>Registro gratuito</div>
            </div> : <div style={{padding: '52px 92px', translate: `0px ${-scroll}px`}}>
              <Img src={staticFile('agrilpa-logo.svg')} style={{width: 225, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto 20px'}}/>
              <h1 style={{fontSize: 42, margin: '0 0 10px'}}>Únete a Agrilpa</h1><p style={{fontSize: 23, color: '#767d85', margin: '0 0 28px'}}>¿Ya tienes una cuenta? <span style={{color: green}}>Inicia sesión</span></p>
              <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26}}>{[1,2,3].map(n => <React.Fragment key={n}><div style={{height: 5, flex: 1, background: n <= step ? green : '#dadddf'}}/>{n === step && <span style={{fontSize: 22, color: green}}>{step}/3</span>}</React.Fragment>)}</div>
              {step > 1 && <p style={{fontSize: 25, margin: '0 0 22px'}}>Paso {step} de 3: {step === 2 ? 'Información de la Empresa' : 'Intereses y Volumen'}</p>}
              {fields.map((field, index) => {
                const active = frame >= field.start && frame <= field.end;
                const value = field.select ? frame >= field.end ? field.text : '' : field.text.slice(0, Math.floor(interpolate(frame, [field.start, field.end], [0, field.text.length], clamp)));
                return <div key={field.label} style={{height: 124}}><div style={{fontSize: 24, fontWeight: 600, marginBottom: 12}}>{field.label}</div><div style={{height: 65, border: `2px solid ${active ? green : '#d7dade'}`, boxShadow: active ? '0 0 0 4px #52950012' : 'none', borderRadius: 8, display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: 26, color: value ? '#292e35' : '#93999f', background: active ? '#fff' : '#fafafa', position: 'relative'}}><span>{value || (field.select ? 'Selecciona una opción' : field.secret ? 'Mínimo 8 caracteres' : index === 0 && step === 1 ? 'Juan Pérez' : 'Escribe aquí')}{active && !field.select && frame % 24 < 12 && <span style={{color: green}}>|</span>}</span>{field.secret && <Eye size={23} style={{marginLeft: 'auto'}}/>}{field.select && <ChevronDown size={23} style={{marginLeft: 'auto'}}/>}{active && field.select && <div style={{position: 'absolute', top: 67, left: -2, right: -2, padding: '18px 22px', background: '#fff', color: green, border: '1px solid #d7dade', borderRadius: 8, zIndex: 4, boxShadow: '0 12px 30px #0002', display: 'flex', justifyContent: 'space-between'}}>{field.text}<Check size={24}/></div>}</div></div>;
              })}
              {step === 3 && <div style={{display: 'flex', gap: 12, alignItems: 'center', fontSize: 22, margin: '8px 0 24px'}}><span style={{width: 26, height: 26, borderRadius: 5, background: frame > 838 ? green : '#eee', color: '#fff', display: 'grid', placeItems: 'center'}}>{frame > 838 && <Check size={22}/>}</span>Acepto los Términos y Condiciones</div>}
              <div style={{height: 68, borderRadius: 8, background: submit ? '#437c00' : green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, fontSize: 25, fontWeight: 700, scale: submit ? 0.98 : 1}}>{sending ? 'CREANDO CUENTA…' : step === 1 ? 'CONTINUAR' : step === 2 ? 'SIGUIENTE PASO' : 'CREAR CUENTA'}<ArrowRight size={27}/></div>
            </div>}
          </div>
        </>}
      </div>
    </div>
    {!success && <div style={{position: 'absolute', top: cursorY, left: home ? interpolate(frame, [0, 55], [1480, 958], clamp) : 1435, color: '#fff', filter: 'drop-shadow(0 2px 2px #000)', scale: submit ? 0.88 : 1}}><MousePointer2 size={45} fill="#13171b" strokeWidth={1.8}/>{(submit || (home && frame > 60)) && <span style={{position: 'absolute', width: 54, height: 54, top: -12, left: -14, borderRadius: '50%', border: '3px solid #8bc646', opacity: frame % 12 / 12}}/>}</div>}
    <div style={{position: 'absolute', bottom: 39, left: 80, right: 80, display: 'flex', alignItems: 'center', gap: 22, color: '#fff'}}><span style={{fontSize: 31, fontWeight: 600}}>{caption}</span><span style={{marginLeft: 'auto', fontSize: 22, opacity: .85}}>Demostración · Datos de ejemplo</span></div>
    <div style={{position: 'absolute', bottom: 19, left: 80, right: 80, height: 4, borderRadius: 3, background: '#ffffff33'}}><div style={{height: '100%', width: `${frame / 989 * 100}%`, background: '#b2dd74'}}/></div>
  </AbsoluteFill>;
};
