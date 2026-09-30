import React, {useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,Easing,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {ArrowLeft,ChevronRight,LockKeyhole,MousePointer2,Plus,Share} from 'lucide-react';
import {GeneratedProductView,emptyProductData} from './GeneratedProductView';
import {GeneratedDashboardShell} from './GeneratedDashboardShell';

const smooth={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.22,1,.36,1)} as const;
const typing=(text:string,frame:number,from:number,to:number)=>text.slice(0,Math.floor(interpolate(frame,[from,to],[0,text.length],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})));
const spans:Array<[string,number,number]>=[
  ['image',10,26],['image2',27,42],['image3',43,58],['title',59,106],['category',107,120],
  ['country',121,132],['state',133,151],['maturity',152,161],['Continuar',162,179],
  ['packaging',185,200],['packagingSize',201,218],['price',240,265],['quantity',266,285],
  ['minOrderQuantity',286,302],['supplyCapacity',303,322],['Continuar',323,349],
  ['Nacional',355,375],['Centroamérica',376,391],['Continuar',392,414],
  ['description',423,493],['+ Rainforest Alliance',494,516],['Publicar producto',517,544],
];

export const CodeProductPublishing:React.FC=()=>{
  const frame=useCurrentFrame();
  const view=useRef<HTMLDivElement>(null);
  const [pointer,setPointer]=useState({x:450,y:370});
  const currentStep=frame<180?1:frame<350?2:frame<415?3:4;
  const success=frame>=545;
  const index=spans.reduce((last,[,start],i)=>frame>=start?i:last,-1);
  const span=spans[index];
  const activeField=span?.[0]||'';
  const data={
    ...emptyProductData,
    image:frame>=24?staticFile('cafe-premium-salvadoreno.jpg'):'',
    image2:frame>=40?staticFile('cafe-arabica-grano-tostado.jpg'):'',
    image3:frame>=56?staticFile('coffee-plantation-salvador.jpg'):'',
    title:typing('Café de altura salvadoreño',frame,65,104),
    category:frame>=117?'Café':'',country:frame>=130?'El Salvador':'',
    state:typing('Santa Ana',frame,137,149),maturity:frame>=159?'No aplica':'',
    packaging:frame>=198?'Sacos':'',packagingSize:typing('25',frame,207,216),
    price:typing('6.50',frame,246,263),quantity:typing('5000',frame,270,282),
    minOrderQuantity:typing('100',frame,290,300),supplyCapacity:typing('5',frame,310,320),
    description:typing('Café arábica de altura de Santa Ana. Cosecha seleccionada a mano, notas de cacao y caramelo. Empacado en sacos de 25 kg.',frame,428,490),
    certifications:frame>=512?'Rainforest Alliance':'',
  };
  const selectedAlcance=frame>=389?['Nacional (Cobertura en El Salvador)','Regional (Centroamérica)']:frame>=373?['Nacional (Cobertura en El Salvador)']:[];
  const changedAt=success?545:currentStep===4?415:currentStep===3?350:currentStep===2?180:0;
  const progress=interpolate(frame-changedAt,[0,10],[0,1],smooth);
  const contentOffset=currentStep===1?interpolate(frame,[112,141],[0,-170],smooth):currentStep===2?interpolate(frame,[220,242],[0,-445],smooth):currentStep===3?interpolate(frame,[379,398],[0,-130],smooth):interpolate(frame,[496,520],[0,-170],smooth);

  useLayoutEffect(()=>{
    const root=view.current;
    if(!root||!span||success)return;
    const find=(name:string)=>root.querySelector<HTMLElement>(`[name="${name}"],[data-video-target="${name}"]`)||Array.from(root.querySelectorAll<HTMLElement>('button,p')).find(el=>el.textContent?.replace(/\s+/g,' ').trim()===name);
    const target=find(activeField);
    if(!target)return;
    const base=root.getBoundingClientRect();
    const point=(el:HTMLElement)=>{
      const rect=el.getBoundingClientRect();
      return {x:(rect.x-base.x+rect.width*.72)/1.5,y:(rect.y-base.y+rect.height*.58)/1.5};
    };
    const to=point(target);
    const previous=index>0?find(spans[index-1][0]):null;
    const from=previous?point(previous):{x:to.x+35,y:to.y-40};
    const move=interpolate(frame,[span[1],span[1]+7],[0,1],smooth);
    setPointer({x:from.x+(to.x-from.x)*move,y:from.y+(to.y-from.y)*move});
  },[frame,currentStep,activeField,success]);

  return <AbsoluteFill style={{background:'#fff',overflow:'hidden'}}>
    <div style={{width:1280,height:960,transformOrigin:'0 0',scale:1.5,position:'absolute'}}>
      <div style={{height:64,background:'linear-gradient(#f2f3f4,#e5e7e9)',color:'#45484b',display:'flex',alignItems:'center',gap:10,padding:'0 22px',borderBottom:'1px solid #cdd1d5'}}>
        {['#ff5f57','#ffbd2e','#28c840'].map(color=><span key={color} style={{width:14,height:14,background:color,borderRadius:'50%'}}/>)}
        <ArrowLeft size={20} style={{marginLeft:26,color:'#777'}}/><ChevronRight size={20} style={{color:'#aaa'}}/>
        <div style={{margin:'0 auto',width:620,height:34,borderRadius:8,background:'#d9dde1',display:'flex',alignItems:'center',justifyContent:'center',gap:9,fontSize:14}}><LockKeyhole size={13}/>agrilpa.com/dashboard/mis-publicaciones/nueva</div>
        <span style={{fontSize:11,color:'#6b7177',marginRight:14}}>Demostración</span><Share size={19}/><Plus size={21} style={{marginLeft:10}}/>
      </div>
      <div ref={view} className="product-video" style={{position:'relative',overflow:'hidden','--step-opacity':.65+progress*.35,'--step-offset':`${(1-progress)*14}px`} as React.CSSProperties}>
        <GeneratedDashboardShell>
          <GeneratedProductView formData={data} currentStep={currentStep} selectedAlcance={selectedAlcance} activeField={activeField} contentOffset={contentOffset} isLoading={frame>=538&&frame<545} successProgress={success?progress:0}/>
        </GeneratedDashboardShell>
        {!success&&span&&<div style={{position:'absolute',left:pointer.x,top:pointer.y,pointerEvents:'none',color:'#fff',filter:'drop-shadow(0 2px 2px #0005)',scale:frame>=span[2]-3&&frame<=span[2] ? .9 : 1}}><MousePointer2 size={24} strokeWidth={1.5} fill="#151719"/></div>}
      </div>
    </div>
  </AbsoluteFill>;
};
