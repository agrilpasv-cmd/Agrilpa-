const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const video = path.resolve(__dirname, '..');
function page(file, name) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  if (!fn?.body) throw new Error(`Missing ${name}`);
  const declarations = fn.body.statements.filter(ts.isVariableStatement).flatMap(n => Array.from(n.declarationList.declarations));
  const value = name => declarations.find(n => n.name.getText(ast) === name)?.initializer?.getText(ast);
  const returned = fn.body.statements.find(ts.isReturnStatement);
  return {ast, value, markup: returned.expression.getText(ast), source};
}
const product = page('app/dashboard/mis-publicaciones/nueva/page.tsx', 'NuevaPublicacionPage');
const form = product.value('[formData, setFormData]');
const defaults = form.slice(form.indexOf('({') + 1, form.lastIndexOf(')'));
let markup = product.markup;
markup = markup.replace(/name="([a-zA-Z0-9]+)"/g, (_, name) => `name="${name}" data-active={activeField === "${name}"}`);
markup = markup.replace(/<img /g, '<Img ');
markup = markup.replace('className="relative group rounded-xl', 'data-video-target={imgInfo.key} className="relative group rounded-xl');
for (const name of ['category', 'country', 'maturity', 'packaging']) {
  const re = new RegExp(`(<Select value=\\{formData\\.${name}\\}[\\s\\S]*?<SelectTrigger) `);
  markup = markup.replace(re, `$1 data-video-target="${name}" `);
}
markup = markup.replace('className="max-w-6xl mx-auto', 'style={{translate: `0 ${contentOffset}px`}} className="max-w-6xl mx-auto');
markup = markup.replace('className="w-full lg:w-80 shrink-0', 'style={{translate: `0 ${Math.max(0, -contentOffset - 117)}px`}} className="w-full lg:w-80 shrink-0');
markup = markup.replace('className="fixed inset-0 z-50', 'style={{opacity: successProgress}} className="absolute inset-0 z-50');
markup = markup.replace('className="flex flex-col items-center animate-in zoom-in-75', 'style={{translate: `0 ${(1 - successProgress) * 18}px`}} className="flex flex-col items-center animate-in zoom-in-75');
const certs = product.source.match(/const PREDEFINED_CERTS = \[[\s\S]*?\]/)[0];
fs.writeFileSync(path.join(video, 'src/GeneratedProductView.tsx'), `// Generated from Agrilpa's real product publishing page. Network handlers are omitted.
import React from 'react';
import {Img} from 'remotion';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Textarea} from '@/components/ui/textarea';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {CurrencyPicker} from '@/components/ui/currency-picker';
import {PRODUCT_CATEGORIES,UNIDADES_MEDIDA} from '@/lib/constants';
import {ArrowLeft,Check,Loader,X,Plus,ChevronRight,Image as ImageIcon} from 'lucide-react';
${certs};
export const emptyProductData = ${defaults};
export type ProductData = typeof emptyProductData;
export function GeneratedProductView({formData,currentStep,selectedAlcance,activeField='',contentOffset=0,isLoading=false,successProgress=0}: {formData:ProductData;currentStep:number;selectedAlcance:string[];activeField?:string;contentOffset?:number;isLoading?:boolean;successProgress?:number}) {
  const router = {push: (_url:string) => {}};
  const priceType = 'fixed';
  const certInput = '';
  const statusMessage = {type: successProgress > 0 ? 'success' : isLoading ? 'loading' : null, text: successProgress > 0 ? '¡Producto publicado con éxito en la red B2B!' : isLoading ? 'Creando perfil comercial del producto...' : ''};
  const imagePreview = formData.image, imagePreview2 = formData.image2, imagePreview3 = formData.image3;
  const setFormData:React.Dispatch<React.SetStateAction<ProductData>> = () => {};
  const setImagePreview = (_s:string) => {}, setImagePreview2 = setImagePreview, setImagePreview3 = setImagePreview;
  const setPriceType = (_s:string) => {}, setCertInput = (_s:string) => {}, setSelectedAlcance = (_s:string[]) => {};
  const handleSubmit = (e:React.FormEvent) => e.preventDefault();
  const handleInputChange = () => {}, handleImageUpload = (_e:React.ChangeEvent<HTMLInputElement>,_key:string) => {}, handleNextStep = () => {}, handlePrevStep = () => {}, toggleCertification = (_s:string) => {}, handleAddCustomCert = () => {};
  const ALL_COUNTRIES = ${product.value('ALL_COUNTRIES')};
  const ALCANCE_OPTIONS = ${product.value('ALCANCE_OPTIONS')};
  const activeCertsArray = formData.certifications ? formData.certifications.split(',').map(c => c.trim()).filter(Boolean) : [];
  const stepsInfo = ${product.value('stepsInfo')};
  return ${markup};
}
`);
const shell = page('app/dashboard/dashboard-shell.tsx', 'DashboardShell');
let shellMarkup = shell.markup.slice(0, shell.markup.indexOf('{/* Modal de Configuración Inicial')) + '</div>)';
fs.writeFileSync(path.join(video,'src/GeneratedDashboardShell.tsx'), `// Generated from Agrilpa's real dashboard navigation; no authentication or network calls.
import React from 'react';
import {Link,Image} from './PageAdapters';
import {Badge} from '@/components/ui/badge';
import {Menu,X,LogOut,Settings,FileText,MessageSquare,Home,ClipboardList,Truck,Plus,LayoutDashboard,ShoppingCart,ListOrdered,Receipt,ShoppingBag} from 'lucide-react';
export function GeneratedDashboardShell({children}: {children:React.ReactNode}) {
  const isProfileIncomplete=false,isLoggingOut=false,isSidebarOpen=false,unreadCount=0;
  const counts={perfil:0,publicaciones:0,cotizaciones:0,ventas:0,compras:0,logistica:0,transacciones:0};
  const setIsSidebarOpen=(_b:boolean)=>{},handleLogout=()=>{};
  const menuItems=${shell.value('userMenuItems')};
  return ${shellMarkup};
}
`);
for (const asset of ['cafe-premium-salvadoreno.jpg','cafe-arabica-grano-tostado.jpg','coffee-plantation-salvador.jpg']) {
  fs.copyFileSync(path.join(root,'public',asset),path.join(video,'public',asset));
}
console.log('Generated the real product form and dashboard shell.');
