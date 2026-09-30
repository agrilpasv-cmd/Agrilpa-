const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const video = path.resolve(__dirname, '..');
function read(file, name) {
  const source = fs.readFileSync(path.join(root,file),'utf8');
  const ast = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fn = ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  if(!fn?.body)throw new Error(`Missing ${name}`);
  const vars = fn.body.statements.filter(ts.isVariableStatement).flatMap(n=>Array.from(n.declarationList.declarations));
  const value=name=>vars.find(n=>n.name.getText(ast)===name)?.initializer?.getText(ast);
  const returned = fn.body.statements.find(ts.isReturnStatement);
  return {source,ast,fn,vars,value,markup:returned.expression.getText(ast)};
}

const catalog=read('app/productos/page.tsx','ProductosPage');
const logicNames=['categories','countries','mappedUserProducts','proUserProducts','freeUserProducts','allProductsToDisplay','filteredProducts'];
let logic=catalog.fn.body.statements.filter(ts.isVariableStatement).filter(n=>logicNames.includes(n.declarationList.declarations[0].name.getText(catalog.ast))).map(n=>n.getText(catalog.ast)).join('\n');
logic=logic.replace('image: `/api/products/${up.id}/thumb`','image: staticFile(up.videoImage)');
let markup=catalog.markup;
markup=markup.replace('className="max-w-screen-2xl mx-auto','style={{translate: `0 ${contentOffset}px`}} className="max-w-screen-2xl mx-auto');
markup=markup.replace('value={searchTerm}','data-video-target="search" data-active={activeField === "search"} value={searchTerm}');
markup=markup.replace('value={selectedCountry}','data-video-target="country" data-active={activeField === "country"} value={selectedCountry}');
markup=markup.replace('value={searchContent}','data-video-target="content" data-active={activeField === "content"} value={searchContent}');
markup=markup.replace('key={category}','data-video-target={category} key={category}');
markup=markup.replace('key={product.id} href=', 'data-video-target={product.id} key={product.id} href=');
fs.writeFileSync(path.join(video,'src/GeneratedCatalogView.tsx'),`// Generated from the real Agrilpa catalog, including its filtering rules.
import React from 'react';
import {staticFile} from 'remotion';
import {Link,ProductImage} from './PageAdapters';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {PRODUCT_CATEGORIES} from '@/lib/constants';
import {formatMinOrder} from '@/lib/utils';
import {Search,Filter,Star,MapPin,MessageCircle,X,AlertCircle,ShieldCheck,Ship} from 'lucide-react';
const normalizeText=(text:string)=>text.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
export function GeneratedCatalogView({userProducts,searchTerm='',selectedCategory='todos',showFilters=false,selectedCountry='todos',searchContent='',contentOffset=0,activeField=''}:{userProducts:any[];searchTerm?:string;selectedCategory?:string;showFilters?:boolean;selectedCountry?:string;searchContent?:string;contentOffset?:number;activeField?:string}) {
  const isLoading=false,verifiedOnly=false,minRating=0,containerFilter='todos',isAuthenticated=false,currentUserId=null,isAuthDialogOpen=false;
  const priceRange:[number,number]=[0,500];
  const router={push:(_s:string)=>{}};
  const setSearchTerm=(_s:string)=>{},setSelectedCategory=setSearchTerm,setSelectedCountry=setSearchTerm,setSearchContent=setSearchTerm,setContainerFilter=setSearchTerm;
  const setShowFilters=(_b:boolean)=>{},setVerifiedOnly=setShowFilters,setIsAuthDialogOpen=setShowFilters;
  const setMinRating=(_n:number)=>{},setPriceRange=(_a:[number,number])=>{},handleResetFilters=()=>{},trackContactClick=(_p:any,_t:string)=>{};
  ${logic}
  return ${markup};
}
`);

const nav=read('components/navbar.tsx','Navbar');
fs.writeFileSync(path.join(video,'src/GeneratedNavbar.tsx'),`// Agrilpa's actual public navigation, with inert handlers.
import React,{useRef} from 'react';
import {Link,Image} from './PageAdapters';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Menu,X,LogOut,AlertCircle} from 'lucide-react';
export function GeneratedNavbar() {
  const isOpen=false,isLoggedIn=false,isLoggingOut=false,showVenderPopup=false,notificationCount=0;
  const venderPopupRef=useRef<HTMLDivElement>(null),venderButtonRef=useRef<HTMLButtonElement>(null);
  const setIsOpen=(_b:boolean)=>{},setShowVenderPopup=setIsOpen,handleVenderClick=()=>{},handleLogout=()=>{},getPanelUrl=()=>'/dashboard';
  const router={push:(_s:string)=>{}};
  const navLinks=${nav.value('navLinks')};
  const contactLink=${nav.value('contactLink')};
  return ${nav.markup};
}
`);

let hero=fs.readFileSync(path.join(root,'components/product-hero.tsx'),'utf8');
hero=hero.replace('import Link from "next/link"','import {Link,ProductImage} from "./PageAdapters";\nimport {Img} from "remotion"');
hero=hero.replace('import { ProductImage } from "@/components/product-image"','');
hero=hero.replace(/<img /g,'<Img ');
hero=hero.replace('onClick={() => setSelectedImage(img)}','data-video-target={`photo-${i}`} onClick={() => setSelectedImage(img)}');
fs.writeFileSync(path.join(video,'src/GeneratedProductHero.tsx'),hero);

const detail=read('app/producto/[slug]/page.tsx','ProductPage');
let detailMarkup=detail.markup.slice(0,detail.markup.indexOf('{/* Reseñas Section */}'))+'</main></div>)';
detailMarkup=detailMarkup.replace('<main className=', '<main style={{translate: `0 ${contentOffset}px`}} className=');
fs.writeFileSync(path.join(video,'src/GeneratedProductDetail.tsx'),`// Actual product hero, description, certifications and specifications from Agrilpa.
import React from 'react';
import {Link} from './PageAdapters';
import {ProductHero} from './GeneratedProductHero';
import {Card} from '@/components/ui/card';
import {ChevronLeft,Check,Package,Globe,MessageCircle} from 'lucide-react';
export function GeneratedProductDetail({product,contentOffset=0,selectedImage=null}:{product:any;contentOffset?:number;selectedImage?:string|null}) {
  const currentUserId=null;
  const setSelectedImage=(_s:string)=>{},setIsZoomOpen=(_b:boolean)=>{},setIsAuthDialogOpen=setIsZoomOpen,setIsQuotationDialogOpen=setIsZoomOpen;
  const setAuthDialogAction=(_s:string)=>{},handleBuy=()=>{},handleContactVendor=()=>{};
  const specificContactButton=${detail.value('specificContactButton')};
  return ${detailMarkup};
}
`);

async function saveImage(value,name) {
  if(!value)return '';
  const match=value.match(/^data:(image\/\w+);base64,(.+)$/s);
  let buffer,extension;
  if(match) {buffer=Buffer.from(match[2],'base64');extension=match[1].split('/')[1];}
  else {const res=await fetch(value);if(!res.ok)throw new Error(`Image failed: ${name}`);buffer=Buffer.from(await res.arrayBuffer());extension=(res.headers.get('content-type')||'image/jpeg').split('/')[1].split(';')[0];}
  const asset=`catalog-${name}.${extension}`;
  fs.writeFileSync(path.join(video,'public',asset),buffer);
  return asset;
}
async function main() {
  const {products}=await (await fetch('http://localhost:3000/api/products/get-user-products')).json();
  if(!products?.length)throw new Error('Catalog is empty');
  const safe=products.map(p=>({id:p.id,user_id:p.user_id,title:p.title,category:p.category,price:p.price,currency:p.currency,quantity:p.quantity,description:p.description,country:p.country,state:p.state,min_order:p.min_order,company_name:p.company_name,rating:p.rating,reviews:p.reviews,seller_is_pro:p.seller_is_pro,shipping_unit_type:p.shipping_unit_type,container_size:p.container_size,videoImage:'placeholder.svg'}));
  for(let start=0;start<Math.min(10,safe.length);start+=4) {
    await Promise.all(safe.slice(start,start+4).map(async p=>p.videoImage=await saveImage(`http://localhost:3000/api/products/${p.id}/thumb`,p.id)));
  }
  const chosen=products.find(p=>p.title.includes('Oro-Verde'));
  if(!chosen)throw new Error('The selected coffee product is unavailable');
  const {product:p}=await (await fetch(`http://localhost:3000/api/products/get-user-product-by-id?id=${chosen.id}`)).json();
  const images=await Promise.all(['image','image2','image3'].map((k,i)=>saveImage(p[k],`${p.id}-detail-${i}`)));
  const product={id:p.id,name:p.title,category:p.category,producer:p.seller_company||chosen.company_name||'Productor Local',vendorId:p.user_id,location:p.seller_country||p.country,country:p.country,fullDescription:p.description,description:p.description,price:p.price_type==='quote'||!p.price||p.price==='Por Cotizar'?'Por Cotizar':`${p.currency||'$'}${p.price} / ${p.unit||'kg'}`,minOrder:p.min_order,rating:p.rating||0,reviews:p.reviews||0,verified:p.seller_is_pro||false,sellerIsPro:p.seller_is_pro||false,images,packaging:p.packaging,packagingSize:`${p.packaging_size} ${p.unit||'kg'}`,certifications:p.certifications||null,incoterm:'',alcance_comercial:p.alcance_comercial||[],specifications:[{label:'País de Origen',value:p.country},{label:'Categoría',value:p.category},{label:'Método de Venta',value:'Por Embalaje Estándar'},{label:'Tipo de Embalaje',value:p.packaging},{label:'Peso por Embalaje',value:`${p.packaging_size} ${p.unit||'kg'}`},{label:'Unidad',value:p.unit||'kg'},{label:'Vendedor',value:p.seller_company||chosen.company_name}]};
  fs.writeFileSync(path.join(video,'src/catalog-data.json'),JSON.stringify({products:safe,product},null,2));
  const cssFolder=path.join(root,'.next/dev/static/chunks');
  const cssName=fs.readdirSync(cssFolder).find(n=>n.startsWith('app_globals_css_')&&n.endsWith('.css'));
  fs.copyFileSync(path.join(cssFolder,cssName),path.join(video,'src/agrilpa-page.css'));
  console.log(`Prepared ${safe.length} real listings and the selected coffee product.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
