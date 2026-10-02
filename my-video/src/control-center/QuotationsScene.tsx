import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {ArrowLeft, ArrowUpRight, MessageCircle, MapPin, Check} from 'lucide-react';
import {CommercePage, Metrics, SearchField, FilterTabs, StatusBadge, commerceStyles as s} from '@/components/dashboard/commerce-ui';
import {Frame, Pointer, Toast} from './Frame';
import {demoQuotationCount} from './demo';
import {QuotationView} from './QuotationView';

export function QuotationsScene() {
  const frame=useCurrentFrame();
  const detail=frame>=53;
  if(detail) return <Frame path="/dashboard/cotizaciones/demo-cafe" step={2} title="Cada cotización, con todos sus detalles." subtitle="Revisa el pedido y acuerda precio y entrega con el comprador.">
    <QuotationView data={{viewer:'seller',counterpart:{id:'demo-buyer',company_name:'Agroindustrias Pacífico',avatar_url:staticFile('agroindustrias-pacifico-logo.jpg'),country:'El Salvador'},quotation:{id:'DEMO2026',product_id:'demo-coffee',product_title:'Café de altura salvadoreño',product_image:staticFile('cafe-premium-salvadoreno.jpg'),buyer_id:'demo-buyer',buyer_name:'Agroindustrias Pacífico',quantity:1000,quantity_unit:'kg',status:'pending',created_at:'2026-09-30T16:30:00Z',destination_country:'El Salvador',destination_location:'San Salvador',delivery_method:'delivery',estimated_date:'2026-10-10',target_price:6.50,currency:'USD',notes:'Café de altura, empacado en sacos de 25 kg. Confirmar disponibilidad y fecha de entrega.'} as any}}/>
    <Pointer points={[[53,790,320],[81,790,430],[126,790,580],[149,790,580]]}/>
  </Frame>;
  return <Frame path="/dashboard/cotizaciones" step={2} title="El interés se convierte en oportunidades." subtitle="Recibe cotizaciones y revisa cantidades, destinos y condiciones.">
    <CommercePage title={detail?'Detalle de cotización':'Cotizaciones'} description={detail?'Agroindustrias Pacífico · Solicitud de compra':'Revisa las solicitudes de tus compradores y convierte el interés en negocios.'}>
      <><Metrics items={[{label:'Solicitudes recibidas',value:demoQuotationCount,hint:'Todas tus cotizaciones'},{label:'Pendientes',value:2,hint:'Por revisar y responder'},{label:'Aceptadas',value:demoQuotationCount-2,hint:'Solicitudes aprobadas'},{label:'Rechazadas',value:0,hint:'Solicitudes descartadas'}]}/><div className={s.section}><div className={s.sectionHead}><div className={s.sectionTitle}><h2>Solicitudes de compradores</h2><span>{demoQuotationCount}</span></div><SearchField value="" onChange={()=>{}} placeholder="Buscar producto, comprador o destino"/><FilterTabs value="pending" onChange={()=>{}} options={[{value:'all',label:'Todas',count:demoQuotationCount},{value:'pending',label:'Pendientes',count:2},{value:'accepted',label:'Aceptadas',count:demoQuotationCount-2},{value:'rejected',label:'Rechazadas',count:0}]}/></div><table className={s.table}><thead><tr><th>Producto / cantidad</th><th>Comprador</th><th>Destino / entrega</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{['Agroindustrias Pacífico','Cooperativa Los Andes'].map((name,i)=><tr key={name}><td><div className={s.productCell}><div className={s.productThumb}><Img src={staticFile(i?'cacao-grano-fermentado-chocolate.jpg':'cafe-premium-salvadoreno.jpg')}/></div><div><span className={s.cellTitle}>{i?'Cacao fermentado':'Café de altura'}</span><span className={s.cellMeta}>{i?'500':'1,000'} kg</span><span className={s.cellMeta}>Recibida hoy</span></div></div></td><td><span className={s.cellTitle}>{name}</span><span className={s.cellIconLine}><MessageCircle size={13}/>Mensajería Agrilpa</span></td><td><span className={s.cellIconLine}><MapPin size={13}/>El Salvador</span><span className={s.cellMeta}>10 oct. 2026</span></td><td><StatusBadge> Pendiente</StatusBadge></td><td><button className={s.iconButton}><ArrowUpRight size={18}/></button></td></tr>)}</tbody></table></div></>
    </CommercePage>
    {frame<48&&<Toast text="Nueva cotización · 1,000 kg de café" notification from={5}/>}
    <Pointer points={[[0,755,340],[42,880,515],[53,880,515],[103,790,415],[114,790,415],[140,790,470]]}/>
  </Frame>;
}
