import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ArrowLeft, ChevronRight, LockKeyhole, Share, Plus, Home, LayoutDashboard, MessageSquare, ClipboardList, ShoppingBag, ShoppingCart, Truck, Receipt, FileText, Settings, ListOrdered, Headphones, MousePointer2, Check, Bell} from 'lucide-react';
import {PanelSidebar} from './PanelView';
import './control-center.css';
export const smooth = {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.22,1,.36,1)} as const;
export const typing = (text:string,frame:number,start:number,end:number) => text.slice(0,Math.floor(interpolate(frame,[start,end],[0,text.length],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})));
const sections = [
  ['/', 'Inicio', Home],['/dashboard','Dashboard',LayoutDashboard],['/dashboard/mensajes','Mensajes B2B',MessageSquare],['/dashboard/mis-publicaciones','Publicaciones',Plus],['/dashboard/mis-solicitudes','Solicitudes',ListOrdered],['/dashboard/cotizaciones','Cotizaciones',ClipboardList],['/dashboard/ventas','Mis Ventas',ShoppingBag],['/dashboard/compras','Mis Compras',ShoppingCart],['/dashboard/logistica','Logística',Truck],['/dashboard/transacciones','Transacciones',Receipt],['/dashboard/perfil','Mi Perfil',FileText],['/dashboard/configuracion','Configuración',Settings],['/dashboard/soporte','Soporte',Headphones],
] as const;
export function Frame({path,step,title,subtitle,children,panel=true}:{path:string;step:number;title:string;subtitle:string;children:React.ReactNode;panel?:boolean}) {
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{background:'white',overflow:'hidden'}}>
    <div className="cc-root" style={{position:'absolute',width:1280,height:960,scale:1.5,transformOrigin:'0 0'}}>
      <div className="cc-browser">
        <div className="cc-lights">{['#ff5f57','#ffbd2e','#28c840'].map(color=><i key={color} style={{background:color}}/>)}</div>
        <ArrowLeft size={21}/><ChevronRight size={21}/>
        <div className="cc-address"><LockKeyhole size={14}/>agrilpa.com{path}</div><span className="cc-demo">Datos de ejemplo</span><Share size={20}/><Plus size={22}/>
      </div>
      <div className="cc-viewport">
        {panel&&<PanelSidebar pathname={path} items={sections.map(([href,label,icon])=>({href,label,icon,notifications:label==='Cotizaciones'?2:label==='Mensajes B2B'?2:0}))} open={false} onOpenChange={()=>{}} onLogout={()=>{}}/>}
        <main className="cc-main"><div style={{height:'100%',opacity:interpolate(frame,[0,10],[.4,1],smooth),translate:`0 ${interpolate(frame,[0,10],[12,0],smooth)}px`}}>{children}</div></main>
      </div>
      <div className="cc-caption">
        <div className="cc-caption-copy"><span className="cc-step">0{step+1} / 06</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>
        <div className="cc-progress">{['Dashboard','Publicaciones','Cotizaciones','Mensajes','Empresa','Proveedores'].map((label,i)=><div key={label} className={i===step?'current':i<step?'done':''}><i/><span>{label}</span></div>)}</div>
      </div>
    </div>
  </AbsoluteFill>;
}
export function Pointer({points}:{points:Array<[number,number,number]>}) {
  const frame=useCurrentFrame();
  const opts={...smooth};
  const x=interpolate(frame,points.map(p=>p[0]),points.map(p=>p[1]),opts);
  const y=interpolate(frame,points.map(p=>p[0]),points.map(p=>p[2]),opts);
  const click=points.some(([at])=>frame>=at&&frame<at+8);
  return <div className="cc-pointer" style={{left:x,top:y,scale:click?.9:1}}><MousePointer2 size={26} fill="var(--foreground)" stroke="white" strokeWidth={1.5}/>{click&&<span className="cc-click" style={{scale:interpolate(frame%8,[0,7],[.5,1.5]),opacity:interpolate(frame%8,[0,7],[.5,0])}}/>}</div>;
}
export function Toast({text,from=0,notification=false}:{text:string;from?:number;notification?:boolean}) {
  const frame=useCurrentFrame();
  return <div className="cc-toast" style={{opacity:interpolate(frame,[from,from+10],[0,1],smooth),translate:`0 ${interpolate(frame,[from,from+10],[-18,0],smooth)}px`}}>{notification?<Bell size={20}/>:<Check size={20}/>}<span>{text}</span></div>;
}
export function DemoAvatar({file='finca-el-roble-logo.jpg',size=44}:{file?:string;size?:number}) {return <Img src={staticFile(file)} style={{width:size,height:size,borderRadius:size>60?18:'50%',objectFit:'cover',flexShrink:0}}/>;}
