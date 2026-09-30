import React,{useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,Easing,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {ArrowLeft,ChevronRight,LockKeyhole,MousePointer2,Plus,Share} from 'lucide-react';
import {GeneratedCatalogView} from './GeneratedCatalogView';
import {GeneratedNavbar} from './GeneratedNavbar';
import {GeneratedProductDetail} from './GeneratedProductDetail';
import catalog from './catalog-data.json';

const smooth={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.22,1,.36,1)} as const;
const typing=(text:string,frame:number,start:number,end:number)=>text.slice(0,Math.floor(interpolate(frame,[start,end],[0,text.length],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})));
const spans:Array<[string,number,number]>=[
  ['search',100,157],['Café',158,188],['Mostrar más filtros',189,208],
  ['country',249,277],['content',278,322],['Ocultar filtros',323,339],
  [catalog.product.id,360,384],['photo-1',435,453],
];
export const CodeCatalogSearch:React.FC=()=>{
  const frame=useCurrentFrame();
  const view=useRef<HTMLDivElement>(null);
  const [pointer,setPointer]=useState({x:640,y:440});
  const detail=frame>=385;
  const index=spans.reduce((last,[,start],i)=>frame>=start?i:last,-1);
  const span=spans[index];
  const activeField=span?.[0]||'';
  const showFilters=frame>=209&&frame<340;
  const searchTerm=typing('Café',frame,112,153);
  const selectedCategory=frame>=185?'Café':'todos';
  const selectedCountry=frame>=272?'El Salvador':'todos';
  const searchContent=typing('Geisha',frame,289,318);
  const products=catalog.products;
  const product={...catalog.product,image:staticFile(catalog.product.images[0]),image2:catalog.product.images[1]?staticFile(catalog.product.images[1]):'',image3:catalog.product.images[2]?staticFile(catalog.product.images[2]):''};
  const offset=detail?interpolate(frame,[468,556],[0,-595],smooth):frame<80?interpolate(frame,[25,67],[0,-250],smooth):frame<209?interpolate(frame,[80,100],[-250,0],smooth):frame<340?interpolate(frame,[220,247],[0,-255],smooth):frame<365?interpolate(frame,[340,360],[-255,-180],smooth):interpolate(frame,[365,380],[-180,-260],smooth);
  const enter=interpolate(frame,[385,395],[0,1],smooth);

  useLayoutEffect(()=>{
    if(!view.current||!span||frame>=468)return;
    const root=view.current;
    const find=(name:string)=>root.querySelector<HTMLElement>(`[data-video-target="${name}"]`)||Array.from(root.querySelectorAll<HTMLElement>('button')).find(el=>el.textContent?.replace(/\s+/g,' ').trim()===name);
    const target=find(activeField);
    if(!target)return;
    const base=root.getBoundingClientRect();
    const point=(el:HTMLElement)=>{
      const card=el.matches('a')?el.querySelector<HTMLElement>('.h-52'):null;
      const rect=(card||el).getBoundingClientRect();
      return {x:(rect.x-base.x+rect.width*.65)/1.5,y:(rect.y-base.y+rect.height*.55)/1.5};
    };
    const to=point(target),previous=index>0?find(spans[index-1][0]):null;
    const from=previous?point(previous):{x:to.x+40,y:to.y-30};
    const move=interpolate(frame,[span[1],span[1]+9],[0,1],smooth);
    setPointer({x:from.x+(to.x-from.x)*move,y:from.y+(to.y-from.y)*move});
  },[frame,activeField,detail]);

  return <AbsoluteFill style={{background:'#fff',overflow:'hidden'}}>
    <div style={{width:1280,height:960,transformOrigin:'0 0',scale:1.5,position:'absolute'}}>
      <div style={{height:64,background:'linear-gradient(#f2f3f4,#e5e7e9)',color:'#45484b',display:'flex',alignItems:'center',gap:10,padding:'0 22px',borderBottom:'1px solid #cdd1d5'}}>
        {['#ff5f57','#ffbd2e','#28c840'].map(color=><span key={color} style={{width:14,height:14,background:color,borderRadius:'50%'}}/>)}
        <ArrowLeft size={20} style={{marginLeft:26,color:'#777'}}/><ChevronRight size={20} style={{color:'#aaa'}}/>
        <div style={{margin:'0 auto',width:620,height:34,borderRadius:8,background:'#d9dde1',display:'flex',alignItems:'center',justifyContent:'center',gap:9,fontSize:14}}><LockKeyhole size={13}/>{detail?'agrilpa.com/producto/'+catalog.product.id:'agrilpa.com/productos'}</div>
        <span style={{fontSize:11,color:'#6b7177',marginRight:14}}>Demostración</span><Share size={19}/><Plus size={21} style={{marginLeft:10}}/>
      </div>
      <div ref={view} className="catalog-video" style={{position:'relative',overflow:'hidden'}}>
        <GeneratedNavbar/>
        <div className="catalog-content" style={{opacity:detail ? .65+enter*.35 : 1,translate:detail?`0 ${(1-enter)*12}px`:'0 0'}}>
          {detail?<GeneratedProductDetail product={product} contentOffset={offset} selectedImage={frame>=451&&product.image2?product.image2:null}/>:<GeneratedCatalogView userProducts={products} searchTerm={searchTerm} selectedCategory={selectedCategory} showFilters={showFilters} selectedCountry={selectedCountry} searchContent={searchContent} contentOffset={offset} activeField={activeField}/>}
        </div>
        {span&&frame<468&&<div style={{position:'absolute',left:pointer.x,top:pointer.y,pointerEvents:'none',filter:'drop-shadow(0 2px 2px #0005)',scale:frame>=span[2]-3&&frame<=span[2] ? .9 : 1}}><MousePointer2 size={24} strokeWidth={1.5} fill="#151719" color="#fff"/></div>}
      </div>
    </div>
  </AbsoluteFill>;
};
