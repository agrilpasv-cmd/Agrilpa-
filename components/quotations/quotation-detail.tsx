"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Check, FileText, Loader2, MessageCircle, X } from "lucide-react"
import { useDashboard } from "@/app/dashboard/context"
import { useGlobalChat } from "@/components/chat/chat-context"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { CommercePage, InlineNotice, LoadingState, StatusBadge, commerceStyles as c } from "@/components/dashboard/commerce-ui"
import { purchaseFrequencies, quotationMoney, recordQuantity, type QuotationRecord } from "@/lib/quotations"
import s from "./quotation.module.css"

export interface QuotationDetailData { quotation: QuotationRecord; viewer:"seller"|"buyer"; counterpart: {id:string;full_name?:string;company_name?:string;avatar_url?:string;country?:string}|null; orderId?:string|null }
function date(value:string,withTime=false) { if (!Number.isFinite(Date.parse(value))) return "Por acordar"; return new Intl.DateTimeFormat("es-SV",{dateStyle:"long",...(withTime ? {timeStyle:"short",timeZone:"America/El_Salvador"} : {timeZone:"UTC"})}).format(new Date(value.length===10 ? `${value}T12:00:00Z` : value)) }
export function QuotationDetail({ id }: {id:string}) {
  const [data,setData] = useState<QuotationDetailData|null>(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")
  const [retry,setRetry] = useState(0)
  const [decision,setDecision] = useState<"accepted"|"rejected"|null>(null)
  const [price,setPrice] = useState("")
  const [currency,setCurrency] = useState("USD")
  const [busy,setBusy] = useState(false)
  const [decisionError,setDecisionError] = useState("")
  const [notice,setNotice] = useState("")
  const {refreshCounts} = useDashboard()
  const {openChat} = useGlobalChat()
  useEffect(() => {
    let active=true
    setLoading(true);setError("")
    async function load() {
      try {
        const response=await fetch(`/api/quotations/${id}`,{cache:"no-store"})
        const result=await response.json()
        if(!response.ok) throw new Error(result.error || "No pudimos cargar esta cotización.")
        if(!active) return
        setData(result);setCurrency(result.quotation.currency === "EUR" ? "EUR" : "USD")
        if(result.viewer === "seller" && !result.quotation.is_read) {
          const read=await fetch("/api/quotations/mark-read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({quotationId:id})})
          if(read.ok) void refreshCounts()
        }
      } catch(err) { if(active) setError(err instanceof Error ? err.message : "No pudimos cargar esta cotización.") }
      finally { if(active) setLoading(false) }
    }
    void load();return()=>{active=false}
  },[id,retry,refreshCounts])
  async function decide() {
    if(busy || !decision || !data) return
    if(decision === "accepted" && (!Number.isFinite(Number(price)) || Number(price)<=0 || Number(price)>1e9)) {setDecisionError("Introduce el precio unitario acordado, mayor que cero.");return}
    setBusy(true);setDecisionError("")
    try {
      const response=await fetch("/api/quotations/update-status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({quotationId:id,status:decision,unitPrice:decision === "accepted" ? Number(price) : undefined,currency})})
      const result=await response.json()
      if(!response.ok) throw new Error(result.error || "No pudimos actualizar la cotización.")
      setData(previous=>previous ? {...previous,quotation:{...previous.quotation,status:decision,...(decision === "accepted" ? {agreed_unit_price:result.unitPrice ?? Number(price),agreed_currency:result.currency || currency}: {})},orderId:result.orderId}:previous)
      setNotice(decision === "accepted" ? "Cotización aceptada. El pedido está disponible en Mis Ventas." : "La solicitud ha sido rechazada.")
      setDecision(null);void refreshCounts()
    } catch(err) { setDecisionError(err instanceof Error ? err.message : "No pudimos conectar. Inténtalo de nuevo.") }
    finally {setBusy(false)}
  }
  const q=data?.quotation
  const seller=data?.viewer === "seller"
  const counterpart=data?.counterpart
  const name=counterpart?.company_name || counterpart?.full_name || (seller ? q?.buyer_name : "Vendedor Agrilpa") || "Usuario Agrilpa"
  const unit=q?.container_size ? "contenedor" : q?.quantity_unit || "kg"
  const agreed=q?.status === "accepted" && q.agreed_unit_price != null
  const amount=agreed ? q?.agreed_unit_price : q?.target_price
  const moneyCurrency=agreed ? q?.agreed_currency : q?.currency
  const statusLabel=({pending:"Por responder",accepted:"Aceptada",rejected:"Rechazada"} as Record<string,string>)[q?.status || ""] || "Por responder"
  return <CommercePage title="Detalle de cotización" description={q ? `Solicitud #${q.id.slice(0,8).toUpperCase()} · ${date(q.created_at,true)}` : "Consulta los detalles y coordina la propuesta en Agrilpa."}>
    <div className={s.detailTop}><Link href={seller || !q ? "/dashboard/cotizaciones" : `/producto/${q.product_id}`}><ArrowLeft size={17}/>{seller || !q ? "Volver a cotizaciones" : "Volver al producto"}</Link>{q && <StatusBadge tone={q.status === "accepted" ? "green" : q.status === "rejected" ? "red" : "amber"}>{statusLabel}</StatusBadge>}</div>
    {loading ? <LoadingState label="Cargando la solicitud…"/> : error ? <InlineNotice error>{error} <button className={c.textButton} onClick={()=>setRetry(v=>v+1)}>Reintentar</button></InlineNotice> : q && <>
      {notice && <InlineNotice onClose={()=>setNotice("")}>{notice}</InlineNotice>}
      <div className={s.detailGrid}><div className={s.stack}>
        <section className={`${s.panel} ${s.product}`}><img src={q.product_image || "/placeholder.svg"} alt={q.product_title}/><div><span className={s.eyebrow}>Producto solicitado</span><h2>{q.product_title}</h2><p className={s.quantity}>{recordQuantity(q)}</p><Link href={`/producto/${q.product_id}`}>Ver publicación <ArrowUpRight size={16}/></Link></div></section>
        <section className={s.panel}><h2>Entrega y planificación</h2><p className={s.hint}>Información enviada por el comprador.</p><dl className={s.dataGrid}>
          <div><dt>{q.delivery_method === "pickup" ? "País de recogida" : "País de destino"}</dt><dd>{q.destination_country || "Por acordar"}</dd></div>
          <div><dt>Ciudad o puerto</dt><dd>{q.destination_location || "Por acordar"}</dd></div>
          <div><dt>Modalidad</dt><dd>{q.delivery_method === "pickup" ? "Recogida por el comprador" : q.delivery_method === "delivery" ? "Envío a destino" : "Por acordar"}</dd></div>
          <div><dt>Fecha deseada</dt><dd>{q.estimated_date ? date(q.estimated_date) : "Por acordar"}{q.date_flexible && <small>El comprador puede acordar otra fecha.</small>}</dd></div>
          <div><dt>Frecuencia de compra</dt><dd>{purchaseFrequencies.find(f=>f.value===q.purchase_frequency)?.label || "Por acordar"}</dd></div>
          <div><dt>Condición comercial preferida</dt><dd>{q.incoterm || "Por acordar"}</dd></div>
        </dl></section>
        <section className={s.panel}><h2>Requisitos del comprador</h2><p className={s.notes}>{q.notes || "No se añadieron requisitos. Puedes consultar los detalles en la conversación."}</p></section>
      </div><aside className={s.stack}>
        <section className={`${s.panel} ${s.summary}`}><span className={s.eyebrow}>{agreed ? "Condiciones acordadas" : "Referencia del comprador"}</span><h2>{agreed ? "Precio acordado" : "Presupuesto objetivo"}</h2><div className={s.amount}>{amount != null && Number(amount)>0 ? <>{quotationMoney(amount,moneyCurrency)} <small>/ {unit}</small></> : "Por acordar"}</div><p className={s.statusNote}>{agreed ? "Precio unitario registrado al aceptar la cotización." : "El comprador comparte esta referencia para negociar. El vendedor confirma el precio y la disponibilidad."}</p>{amount != null && Number(amount)>0 && <dl className={`${s.facts} ${s.divider}`}><div><dt>{agreed ? "Importe del producto" : "Total orientativo"}</dt><dd>{quotationMoney(Number(amount)*q.quantity,moneyCurrency)}</dd></div></dl>}<p className={s.statusNote}>Transporte y otros cargos se acuerdan en la conversación.</p></section>
        <section className={s.panel}><h2>{seller ? "Tu comprador" : "Tu vendedor"}</h2><div className={s.identity}><div className={s.avatar}>{counterpart?.avatar_url ? <img src={counterpart.avatar_url} alt=""/> : name.charAt(0).toUpperCase()}</div><div><strong>{name}</strong><span>{counterpart?.country || "Comunidad Agrilpa"}</span></div></div>{counterpart?.id ? <button type="button" className={`${c.primaryButton} ${s.blockButton}`} onClick={()=>openChat({sellerName:name,vendorId:counterpart.id,product:{id:q.product_id,title:q.product_title,image:q.product_image || "",price:amount != null ? String(amount) : "Por cotizar",currency:moneyCurrency || "USD",quantity:String(q.quantity)}})}><MessageCircle size={18}/>Conversar con {seller ? "comprador" : "vendedor"}</button> : <p className={s.statusNote}>Esta solicitud antigua no tiene una cuenta de comprador vinculada.</p>}{counterpart?.id && <Link className={`${c.secondaryButton} ${s.blockButton}`} href={`/vendedor/${counterpart.id}`}>Ver perfil empresarial <ArrowUpRight size={16}/></Link>}<p className={s.statusNote}>Acuerda los detalles desde Mensajes B2B.</p></section>
        {seller && q.status === "pending" && <section className={s.panel}><h2>Responder a la solicitud</h2><p className={s.statusNote}>Conversa primero para acordar el precio y las condiciones del pedido.</p><button className={`${c.primaryButton} ${s.blockButton}`} disabled={!q.buyer_id} onClick={()=>{setDecision("accepted");setDecisionError("");setPrice("")}}><Check size={17}/>Aceptar y crear pedido</button><button className={`${c.secondaryButton} ${s.blockButton}`} onClick={()=>{setDecision("rejected");setDecisionError("")}}>Rechazar solicitud</button>{!q.buyer_id && <p className={s.statusNote}>Para crear un pedido, la solicitud debe estar vinculada a una cuenta de comprador.</p>}</section>}
        {data?.orderId && <section className={s.panel}><h2>Pedido creado</h2><p className={s.statusNote}>Continúa el seguimiento del negocio en {seller ? "Mis Ventas" : "Mis Compras"}.</p><Link href={`/dashboard/${seller ? "ventas" : "compras"}/${data.orderId}`} className={`${c.secondaryButton} ${s.blockButton}`}><FileText size={17}/>Ver pedido <ArrowUpRight size={16}/></Link></section>}
      </aside></div>
    </>}
    <Dialog open={!!decision} onOpenChange={open=>{if(!open&&!busy)setDecision(null)}}><DialogContent className={`${s.dialog} ${s.decision}`} showCloseButton={false}><header className={s.header}><DialogTitle className={s.title}>{decision === "accepted" ? "Confirmar el acuerdo" : "Rechazar solicitud"}</DialogTitle><DialogDescription className={s.description}>{decision === "accepted" ? "Registra el precio que acordaste con el comprador." : "Esta acción cerrará la solicitud de cotización."}</DialogDescription><button className={s.close} aria-label="Cerrar confirmación" disabled={busy} onClick={()=>setDecision(null)}><X size={19}/></button></header><form onSubmit={e=>{e.preventDefault();void decide()}}><div className={s.decisionBody}>{decision === "accepted" ? <><p>Se creará un pedido por <strong>{q && recordQuantity(q)}</strong>. Revisa el importe antes de confirmar.</p><div className={s.grid}><label className={s.field}>Precio acordado por {unit}<input type="number" inputMode="decimal" min="0.0001" step="any" required value={price} onChange={e=>setPrice(e.target.value)}/></label><label className={s.field}>Moneda<select value={currency} onChange={e=>setCurrency(e.target.value)}><option value="USD">USD · Dólar</option><option value="EUR">EUR · Euro</option></select></label></div><div className={s.total}><span>Importe del producto</span><strong>{quotationMoney((Number(price)||0)*(q?.quantity||0),currency)}</strong></div></> : <p>El comprador podrá consultar el estado de su solicitud. La conversación seguirá disponible para coordinar otras opciones.</p>}{decisionError && <div className={s.divider}><InlineNotice error>{decisionError}</InlineNotice></div>}</div><footer className={s.footer}><div className={s.actions}><button type="button" className={c.secondaryButton} disabled={busy} onClick={()=>setDecision(null)}>Cancelar</button><button className={c.primaryButton} type="submit" disabled={busy}>{busy && <Loader2 size={17} className={c.spinner}/>} {busy ? "Guardando…" : decision === "accepted" ? "Confirmar y crear pedido" : "Confirmar rechazo"}</button></div></footer></form></DialogContent></Dialog>
  </CommercePage>
}
