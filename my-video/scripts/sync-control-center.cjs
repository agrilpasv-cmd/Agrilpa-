// Snapshot the current presentation code. Never runs authentication or account APIs.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'my-video/src/control-center');
const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
const write = (p, text) => fs.writeFileSync(path.join(out, p), text);
let dashboard = read('app/dashboard/components/user-dashboard.tsx');
const start = dashboard.indexOf('export function UserDashboard()');
const end = dashboard.indexOf('/** Separate presentation');
dashboard = dashboard.slice(0, start) + dashboard.slice(end);
dashboard = dashboard.replace('import Link from "next/link"', 'import {Link} from "../PageAdapters"');
dashboard = dashboard.replace('"./user-dashboard.module.css"', '"@/app/dashboard/components/user-dashboard.module.css"');
write('DashboardView.tsx', '// Generated from the current dashboard presentation; demo data only.\n' + dashboard);
let sidebar = read('components/dashboard/panel-sidebar.tsx');
sidebar = sidebar.replace('import Image from "next/image"\nimport Link from "next/link"\nimport { usePathname } from "next/navigation"', 'import {Image, Link} from "../PageAdapters"');
sidebar = sidebar.replace('interface Props {', 'interface Props {\n  pathname?: string');
sidebar = sidebar.replace('items, admin = false,', 'items, pathname = "/dashboard", admin = false,');
sidebar = sidebar.replace('  const pathname = usePathname()\n', '');
write('PanelView.tsx', '// Generated from the current panel sidebar. Navigation is inert in the video.\n' + sidebar);
let profile = read('components/company-profile.tsx');
const profileImports = profile.slice(0, profile.indexOf('export function CompanyProfile()'))
  .replace('import Link from "next/link"', 'import {Link, ProductImage} from "../PageAdapters"')
  .replace('import { useParams } from "next/navigation"', '')
  .replace('import { ProductImage } from "@/components/product-image"', '')
  .replace('import { useGlobalChat } from "@/components/chat/chat-context"', '');
const profileBody = profile.slice(profile.indexOf('  const name = profile.company_name'));
write('CompanyView.tsx', '// Generated from the current public company profile; no network or authentication.\n' + profileImports + `
export function CompanyView({profile, products}: {profile: PublicCompanyProfile; products: CompanyProduct[]}) {
  const currentUserId=profile.id, openChat=(_value:unknown)=>{}, isUserOnline=(_id:string)=>false;
  const catalogueError=false;
  const [query,setQuery]=useState(\"\"),[category,setCategory]=useState(\"\"),[sort,setSort]=useState(\"recent\"),[contactOpen,setContactOpen]=useState(false),[shareStatus,setShareStatus]=useState(\"\");
  const setRetry=(_value:unknown)=>{};
  const categories=Array.from(new Set(products.map(p=>p.category).filter((value):value is string=>Boolean(value)))).sort();
  const filteredProducts=products;
` + profileBody);
const quote=read('components/quotations/quotation-detail.tsx');
const quoteImports=quote.slice(0,quote.indexOf('export function QuotationDetail('))
  .replace('import Link from "next/link"','import {Link} from "../PageAdapters"\nimport {Img} from "remotion"')
  .replace('import { useDashboard } from "@/app/dashboard/context"','')
  .replace('import { useGlobalChat } from "@/components/chat/chat-context"','')
  .replace('"./quotation.module.css"','"@/components/quotations/quotation.module.css"');
write('QuotationView.tsx','// Generated from the current quotation detail presentation; no account writes.\n'+quoteImports+`
export function QuotationView({data}: {data:QuotationDetailData}) {
  const loading=false,error=\"\",busy=false,id=data.quotation.id;
  const [retry,setRetry]=useState(0),[decision,setDecision]=useState<\"accepted\"|\"rejected\"|null>(null),[price,setPrice]=useState(\"\"),[currency,setCurrency]=useState(\"USD\"),[decisionError,setDecisionError]=useState(\"\"),[notice,setNotice]=useState(\"\");
  const decide=async()=>{},openChat=(_value:unknown)=>{};
`+quote.slice(quote.indexOf('  const q=data?.quotation')).replace(/<img /g,'<Img '));
const edit=read('app/dashboard/mis-publicaciones/[id]/editar/page.tsx');
const editImports=edit.slice(0,edit.indexOf('export default function EditarPublicacionPage('))
  .replace('import { useRouter } from "next/navigation"','import {Img} from "remotion"\nimport type {ProductData} from "../GeneratedProductView"')
  .replace('import { createClient } from "@/lib/supabase/client"','')
  .replace('import { useDashboard } from "../../../context"','')
  .replace('import { compressImage, MAX_FILE_SIZE_MB } from "@/lib/compress-image"','');
write('EditView.tsx','// Generated from the current edit-publication form; all actions are inert.\n'+editImports+`
export function EditView({formData,currentStep=2,activeField=\"\"}:{formData:ProductData;currentStep?:number;activeField?:string}) {
  const router={push:(_path:string)=>{}},isLoading=false,isLoadingData=false,priceType=\"fixed\",certInput=\"\",statusMessage:{type:string|null;text:string}={type:null,text:\"\"};
  const imagePreview=formData.image,imagePreview2=formData.image2,imagePreview3=formData.image3,selectedAlcance=[\"Nacional (Cobertura en El Salvador)\"];
  const setFormData:React.Dispatch<React.SetStateAction<ProductData>>=()=>{},setPriceType=(_s:string)=>{},setCertInput=(_s:string)=>{},setSelectedAlcance=(_s:string[])=>{};
  const handleSubmit=(event:React.FormEvent)=>event.preventDefault(),handleInputChange=()=>{},handleImageUpload=(_event:unknown,_key:string)=>{},handleNextStep=()=>{},handlePrevStep=()=>{},toggleCertification=(_cert:string)=>{},handleAddCustomCert=(_event?:unknown)=>{};
`+edit.slice(edit.indexOf('  const ALL_COUNTRIES'),edit.indexOf('  const { refreshCounts }'))+edit.slice(edit.indexOf('  const activeCertsArray')).replace(/<img /g,'<Img ').replace('name="quantity"','name="quantity" data-active={activeField === "quantity"}'));
const tokens = read('app/globals.css').match(/:root \{([\s\S]*?)\n\}/)[1];
write('brand.css', '.cc-root {' + tokens + '\n--font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";\n}\n');
