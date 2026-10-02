import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Search, MessageSquare, Package, Send, Paperclip, CheckCheck, ArrowUpRight, ShieldCheck} from 'lucide-react';
import s from '@/components/chat/chat-workspace.module.css';
import {Frame, DemoAvatar, Pointer, typing, smooth} from './Frame';

export function MessagesScene() {
  const frame=useCurrentFrame();
  const response='Sí, tenemos disponibilidad. US$6.50/kg. Entrega el 10 de octubre.';
  const sent=frame>=108;
  const reply=frame>=133;
  return <Frame path="/dashboard/mensajes" step={3} title="La negociación vive en Agrilpa." subtitle="Habla directamente con compradores y coordina cada detalle aquí.">
    <section className={s.page} style={{height:768,padding:'28px 26px 24px'}}><header className={s.pageHeader}><div><h1>Mensajes B2B</h1><p>Tus conversaciones comerciales, en un solo lugar.</p></div></header>
      <div className={s.workspace}><aside className={s.inbox} style={{width:290}}><div className={s.inboxHeader}><div className={s.inboxTitle}><h2>Conversaciones</h2><span>12</span></div><div className={s.search}><Search size={18}/><input readOnly placeholder="Buscar conversaciones"/></div><div className={s.filters}><button aria-pressed>Todos</button><button>No leídos <span>2</span></button></div></div><div className={s.conversationList}>
        {['Agroindustrias Pacífico','Cooperativa Los Andes','Tropical Exports'].map((name,i)=><button key={name} className={s.conversation} aria-pressed={i===0}><DemoAvatar file={['agroindustrias-pacifico-logo.jpg','cooperativa-los-andes-logo.jpg','tropical-exports-logo.jpg'][i]} size={39}/><div className={s.conversationDetails}><div className={s.conversationTop}><strong>{name}</strong><time>10:30</time></div><div className={s.conversationPreview}><span>{i===0?(sent?'Tú: Sí, tenemos disponibilidad.':'¿Tienen 1,000 kg disponibles?'):'Gracias por la información.'}</span></div><div className={s.conversationProduct}><Package size={12}/><span>{i===0?'Café de altura':'Productos agrícolas'}</span></div></div></button>)}
      </div><div className={s.inboxFooter}><ShieldCheck size={14}/>Mensajería dentro de Agrilpa</div></aside>
      <div className={s.chat}><header className={s.chatHeader}><DemoAvatar file="agroindustrias-pacifico-logo.jpg" size={39}/><div className={s.contactIdentity}><h2>Agroindustrias Pacífico</h2><p><span className={s.online}/>En línea</p></div><span className={s.profileLink}>Ver perfil <ArrowUpRight size={14}/></span></header>
        <div className={s.productContext}><div className={s.productImage}><Img src={staticFile('cafe-premium-salvadoreno.jpg')}/></div><div className={s.productIdentity}><span>Producto de esta conversación</span><strong>Café de altura salvadoreño</strong></div><div className={s.productPrice}><strong>US$6.50</strong><span> / kg</span></div></div>
        <div className={s.messageScroll}><div className={s.dateDivider}>Hoy</div><div className={s.messages}>
          <div className={s.messageRow} style={{opacity:interpolate(frame,[8,22],[0,1],smooth),translate:`0 ${interpolate(frame,[8,22],[14,0],smooth)}px`}}><div className={s.messageBubble}><p className={s.messageText}>¡Hola! Nos interesa su café. ¿Tienen 1,000 kg disponibles para entrega en San Salvador?</p><div className={s.messageMeta}>10:30</div></div></div>
          {sent&&<div className={`${s.messageRow} ${s.mine}`} style={{opacity:interpolate(frame,[108,118],[0,1],smooth),translate:`0 ${interpolate(frame,[108,118],[12,0],smooth)}px`}}><div className={s.messageBubble}><p className={s.messageText}>{response}</p><div className={s.messageMeta}>10:31 <CheckCheck size={15}/></div></div></div>}
          {reply&&<div className={s.messageRow} style={{opacity:interpolate(frame,[133,144],[0,1],smooth),translate:`0 ${interpolate(frame,[133,144],[12,0],smooth)}px`}}><div className={s.messageBubble}><p className={s.messageText}>Perfecto. Confirmemos el pedido desde la cotización.</p><div className={s.messageMeta}>10:31</div></div></div>}
        </div></div>
        <footer className={s.composer}><div className={s.inputBox} style={{borderColor:frame>=37&&!sent?'var(--primary)':undefined}}><textarea readOnly placeholder="Escribe un mensaje..." value={!sent?typing(response,frame,38,100):''}/><div className={s.inputTools}><Paperclip size={19}/><button className={s.sendButton}><Send size={18}/></button></div></div><div className={s.composerHint}><span>Enter para enviar · Shift + Enter para nueva línea</span></div></footer>
      </div></div>
    </section>
    <Pointer points={[[0,370,480],[35,455,653],[98,455,653],[107,945,675],[130,945,675]]}/>
  </Frame>;
}
