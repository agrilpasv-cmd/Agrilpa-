import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Plus, Pencil, ExternalLink, Trash2, MapPin, Eye, ArrowLeft} from 'lucide-react';
import {CommercePage, Metrics, SearchField, FilterTabs, StatusBadge, commerceStyles as s} from '@/components/dashboard/commerce-ui';
import {demoProducts} from './demo';
import {Frame, Pointer, Toast, smooth, typing} from './Frame';
import {EditView} from './EditView';
import {emptyProductData} from '../GeneratedProductView';

export function PublicationsScene() {
  const frame=useCurrentFrame();
  const editing=frame>=67&&frame<143;
  const saved=frame>=143;
  return <Frame path="/dashboard/mis-publicaciones" step={1} title="Un catálogo siempre al día." subtitle="Publica, edita y actualiza la disponibilidad de tus productos.">
    {!editing?<div style={{translate:`0 ${saved?-150:interpolate(frame,[22,39],[0,-150],smooth)}px`}}><CommercePage title="Publicaciones" description="Tu catálogo, listo para conectar con nuevos compradores." action={<button className={s.primaryButton}><Plus size={17}/>Nueva publicación</button>}>
      <Metrics items={[{label:'Publicaciones',value:3,hint:'Productos en tu catálogo'},{label:'Activas',value:3,hint:'Visibles para compradores'},{label:'Pausadas',value:0,hint:'Fuera del catálogo activo'},{label:'Vistas acumuladas',value:'2,680',hint:'Visitas a tus productos'}]}/>
      <div className={s.catalogTools}><div className={s.toolbar}><SearchField value="" onChange={()=>{}} placeholder="Buscar producto, categoría o país"/><span className={s.resultCount}>3 de 3 publicaciones</span></div><FilterTabs value="all" onChange={()=>{}} options={[{value:'all',label:'Todas',count:3},{value:'activa',label:'Activas',count:3},{value:'pausada',label:'Pausadas',count:0},{value:'vendida',label:'Vendidas',count:0}]}/></div>
      <div className={s.catalogGrid}>{demoProducts.map((p,i)=><article key={p.id} className={s.productCard} style={{opacity:interpolate(frame,[i*5,i*5+12],[0,1],smooth),translate:`0 ${interpolate(frame,[i*5,i*5+12],[16,0],smooth)}px`}}>
        <div className={s.productCover}><Img src={staticFile(p.videoImage)} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
        <div className={s.productBody}><div className={s.productTop}><span>{p.category}</span><StatusBadge tone="green">Activa</StatusBadge></div><h2>{p.title}</h2><strong className={s.money}>US${p.price} / kg</strong><div className={s.productInfo}><span><MapPin size={13}/>{p.country}</span><span><Eye size={13}/>{p.views} vistas</span></div><span className={s.cellMeta}>Disponible: {saved&&i===0?'6,000':Number(p.quantity).toLocaleString('en')} kg</span><div className={s.productActions}><button className={s.primaryButton}><Pencil size={15}/>Editar</button><button className={s.iconButton}><ExternalLink size={17}/></button><button className={s.iconButton}><Trash2 size={17}/></button></div></div>
      </article>)}</div>
    </CommercePage></div>:<div className="cc-edit-view" style={{translate:`0 ${interpolate(frame,[68,84],[0,-230],smooth)}px`}}><EditView currentStep={frame<120?2:frame<132?3:4} activeField={frame<120?'quantity':''} formData={{...emptyProductData,title:'Café de altura salvadoreño',category:'Café',country:'El Salvador',state:'Santa Ana',price:'6.50',maturity:'No aplica',quantity:frame<89?'5000':typing('6000',frame,89,112),image:staticFile('cafe-premium-salvadoreno.jpg'),packaging:'Sacos',packagingSize:'25',minOrderQuantity:'100',supplyCapacity:'6',description:'Café arábica de altura de Santa Ana. Cosecha seleccionada a mano, notas de cacao y caramelo.',certifications:'Rainforest Alliance'}}/></div>}
    {saved&&<Toast text="Publicación actualizada · 6,000 kg disponibles" from={143}/>}
    <Pointer points={editing?[[67,500,440],[86,205,620],[112,205,620],[132,545,610],[142,545,610]]:[[0,620,285],[33,300,580],[58,65,710],[66,65,710],[150,780,650]]}/>
  </Frame>;
}
