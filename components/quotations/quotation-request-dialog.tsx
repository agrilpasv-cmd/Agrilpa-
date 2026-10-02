"use client"

import { useEffect, useRef, useState, type ReactNode, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, Check, Loader2, MessageCircle, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { CountryPicker } from "@/components/ui/country-picker"
import { InlineNotice, commerceStyles as c } from "@/components/dashboard/commerce-ui"
import { useGlobalChat } from "@/components/chat/chat-context"
import { emptyQuotationRequest, purchaseFrequencies, quotationCurrency, quotationIncoterms, quotationToday, quotationUnit, validateQuotation, type QuotationProduct, type QuotationRequest } from "@/lib/quotations"
import s from "./quotation.module.css"

export function QuotationRequestDialog({ open, onOpenChange, product }: { open: boolean; onOpenChange: (open: boolean) => void; product: QuotationProduct }) {
  const [values, setValues] = useState<QuotationRequest>({...emptyQuotationRequest, currency:quotationCurrency(product.currency), containerSize:["20ST","40HC"].includes(product.containerSize || "") ? product.containerSize! : ""})
  const [errors, setErrors] = useState<Partial<Record<keyof QuotationRequest,string>>>({})
  const [failure, setFailure] = useState("")
  const [busy, setBusy] = useState(false)
  const [createdId, setCreatedId] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const form = useRef<HTMLFormElement>(null)
  const { openChat } = useGlobalChat()
  const containers = product.shippingUnitType === "FCL"
  const unit = quotationUnit(product)
  useEffect(() => {
    if (!open) return
    let active = true
    fetch("/api/user/profile").then(r => r.json()).then(data => { if (active) setBuyerName(data.user?.company_name || data.user?.full_name || "") }).catch(() => {})
    return () => { active = false }
  }, [open])
  function update<K extends keyof QuotationRequest>(key:K,value:QuotationRequest[K]) { setValues(previous => ({...previous,[key]:value})); setErrors(previous => ({...previous,[key]:undefined})); setFailure("") }
  function field(key:keyof QuotationRequest,label:string,children:ReactNode,full=false,hint?:string) {
    return <div className={`${s.field} ${full ? s.full : ""}`}><label htmlFor={`quote-${key}`}>{label}</label>{children}{hint && <small>{hint}</small>}{errors[key] && <small id={`quote-${key}-error`} className={s.error} role="alert">{errors[key]}</small>}</div>
  }
  const inputProps = (key:keyof QuotationRequest) => ({id:`quote-${key}`,"aria-invalid":!!errors[key],"aria-describedby":errors[key] ? `quote-${key}-error` : undefined})
  function focusError(next:typeof errors) { requestAnimationFrame(() => { form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus() }) }
  async function submit(event:FormEvent) {
    event.preventDefault()
    if (busy) return
    const next = validateQuotation(values,product.minOrderQuantity || 0,containers)
    setErrors(next)
    if (Object.keys(next).length) { focusError(next); return }
    setBusy(true); setFailure("")
    try {
      const response = await fetch("/api/quotations/create", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,productId:product.id})})
      const result = await response.json()
      if (!response.ok || !result.quotation?.id) { if (result.fields) { setErrors(result.fields); focusError(result.fields) } throw new Error(result.error || "No pudimos enviar tu solicitud. Inténtalo de nuevo.") }
      setCreatedId(result.quotation.id)
    } catch (error) { setFailure(error instanceof Error ? error.message : "No pudimos conectar. Tu solicitud sigue aquí para volver a intentarlo.") }
    finally { setBusy(false) }
  }
  function close(next:boolean) { if (busy) return; onOpenChange(next); if (!next && createdId) { setCreatedId(""); setValues({...emptyQuotationRequest,currency:quotationCurrency(product.currency),containerSize:["20ST","40HC"].includes(product.containerSize || "") ? product.containerSize! : ""}) } }
  return <Dialog open={open} onOpenChange={close}><DialogContent className={s.dialog} showCloseButton={false} onInteractOutside={event => { if(busy) event.preventDefault() }}>
    <header className={s.header}><span className={s.eyebrow}>Una nueva oportunidad de negocio</span><DialogTitle className={s.title}>{createdId ? "Solicitud enviada" : "Solicitar cotización"}</DialogTitle><DialogDescription className={s.description}>{createdId ? "El vendedor ya puede revisar los detalles de tu pedido." : "Cuéntale al vendedor qué necesitas para recibir una propuesta a tu medida."}</DialogDescription><button type="button" className={s.close} onClick={() => close(false)} aria-label="Cerrar cotización" disabled={busy}><X size={20}/></button></header>
    {createdId ? <div className={s.success} role="status"><div className={s.successIcon}><Check size={30}/></div><h3>El siguiente paso, conversar.</h3><p>Tu solicitud de <strong>{product.name}</strong> está lista. Coordina el precio, la disponibilidad y la entrega con {product.producer || "el vendedor"} desde Agrilpa.</p><div className={s.actions}><Link href={`/dashboard/cotizaciones/${createdId}`} className={c.primaryButton}>Ver mi solicitud <ArrowRight size={17}/></Link>{product.vendorId && <button className={c.secondaryButton} onClick={() => { close(false); openChat({sellerName:product.producer || "Vendedor",vendorId:product.vendorId!,product:{id:product.id,title:product.name,image:product.image || "",price:product.price || "Por cotizar",currency:product.currency || "USD",quantity:values.quantity}}) }}><MessageCircle size={17}/>Conversar</button>}</div></div> : <form ref={form} onSubmit={submit} className={s.form} noValidate>
      <div className={s.body}><div className={s.fields}>
        <section className={s.section}><h3>1. Tu pedido</h3><p className={s.hint}>Los campos marcados con * son obligatorios.</p><div className={s.grid}>
          {field("quantity",`Cantidad (${unit}) *`,<div className={s.unitInput}><input {...inputProps("quantity")} data-no-auto-caps="true" type="number" inputMode="decimal" min={product.minOrderQuantity || (containers ? 1 : .001)} step={containers ? 1 : .001} value={values.quantity} onChange={e=>update("quantity",e.target.value)} placeholder={String(product.minOrderQuantity || (containers ? 1 : 500))}/><span>{unit}</span></div>,false,product.minOrderQuantity ? `Pedido mínimo: ${product.minOrderQuantity} ${unit}.` : undefined)}
          {field("purchaseFrequency","Frecuencia de compra",<select {...inputProps("purchaseFrequency")} value={values.purchaseFrequency} onChange={e=>update("purchaseFrequency",e.target.value)}>{purchaseFrequencies.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>)}
          {containers && field("containerSize","Tipo de contenedor *",<select {...inputProps("containerSize")} value={values.containerSize} onChange={e=>update("containerSize",e.target.value)}><option value="">Selecciona el tamaño</option>{["20ST","40HC"].filter(size => !["20ST","40HC"].includes(product.containerSize || "") || size === product.containerSize).map(size=><option key={size} value={size}>{size === "20ST" ? "20′ Standard" : "40′ High Cube"}</option>)}</select>,true)}
        </div></section>
        <section className={s.section}><h3>2. Entrega</h3><fieldset><legend className="sr-only">Cómo recibirás el producto</legend><div className={s.choices}><label className={s.choice}><input type="radio" name="delivery-method" checked={values.deliveryMethod === "delivery"} onChange={()=>update("deliveryMethod","delivery")}/>Necesito envío</label><label className={s.choice}><input type="radio" name="delivery-method" checked={values.deliveryMethod === "pickup"} onChange={()=>update("deliveryMethod","pickup")}/>Coordinaré la recogida</label></div></fieldset><div className={s.grid}>
          {field("destinationCountry",values.deliveryMethod === "pickup" ? "País de recogida *" : "País de destino *",<CountryPicker id="quote-destinationCountry" error={!!errors.destinationCountry} value={values.destinationCountry} onChange={val=>update("destinationCountry",val)} placeholder="Selecciona un país" />)}
          {values.deliveryMethod === "delivery" && field("destinationLocation","Ciudad o puerto *",<input data-no-auto-caps="true" {...inputProps("destinationLocation")} value={values.destinationLocation} onChange={e=>update("destinationLocation",e.target.value)} maxLength={180} placeholder="Ej. San Salvador o Puerto de Acajutla"/>)}
          {field("estimatedDate",values.deliveryMethod === "pickup" ? "Fecha deseada de recogida *" : "Fecha deseada de entrega *",<input {...inputProps("estimatedDate")} type="date" min={quotationToday()} value={values.estimatedDate} onInput={e=>update("estimatedDate",e.currentTarget.value)} onChange={e=>update("estimatedDate",e.target.value)}/>)}
          <label className={`${s.choice} ${s.full}`}><input type="checkbox" checked={values.dateFlexible} onChange={e=>update("dateFlexible",e.target.checked)}/>Puedo acordar otra fecha con el vendedor</label>
        </div></section>
        <section className={s.section}><h3>3. Requisitos del pedido</h3><p className={s.hint}>Ayuda al vendedor a preparar una propuesta más precisa.</p>{field("notes","Notas para el vendedor (opcional)",<textarea data-no-auto-caps="true" {...inputProps("notes")} value={values.notes} onChange={e=>update("notes",e.target.value)} maxLength={2000} rows={3} placeholder="Indica la calidad, presentación, embalaje o documentos que necesitas."/>,true,`${values.notes.length.toLocaleString("es-SV")} / 2,000 caracteres`)}
          <details className={s.optionalBox} open={errors.targetPrice || errors.currency || errors.incoterm ? true : undefined}><summary>Presupuesto y condiciones <span className={s.optional}>(opcional)</span></summary><p className={s.hint}>Si ya tienes una referencia, compártela. El precio final se acuerda con el vendedor.</p><div className={s.grid}>{field("targetPrice",`Presupuesto por ${unit}`,<input {...inputProps("targetPrice")} type="number" inputMode="decimal" min="0.01" step="any" value={values.targetPrice} onChange={e=>update("targetPrice",e.target.value)} placeholder="Ej. 1.50"/>)}{field("currency","Moneda",<select {...inputProps("currency")} value={values.currency} onChange={e=>update("currency",e.target.value)}><option value="USD">USD · Dólar</option><option value="EUR">EUR · Euro</option></select>)}{field("incoterm","Condición comercial preferida",<select {...inputProps("incoterm")} value={values.incoterm} onChange={e=>update("incoterm",e.target.value)}><option value="">Por acordar</option>{quotationIncoterms.map(value=><option key={value}>{value}</option>)}</select>,true)}</div></details>
        </section>{failure && <div className={s.divider}><InlineNotice error>{failure}</InlineNotice></div>}
      </div><aside className={s.aside}><span className={s.eyebrow}>Producto a cotizar</span><img className={s.productImage} src={product.image || "/placeholder.svg"} alt={product.name}/><h3>{product.name}</h3><p className={s.seller}>{product.producer}</p><dl className={s.facts}>{product.minOrder && <div><dt>Pedido mínimo</dt><dd>{product.minOrderQuantity ? `${product.minOrderQuantity} ${unit}` : product.minOrder}</dd></div>}{product.country && <div><dt>Origen</dt><dd>{product.country}</dd></div>}{product.packaging && <div><dt>Presentación</dt><dd>{product.packaging}</dd></div>}</dl><div className={s.platformNote}><MessageCircle size={23}/><p><strong>Todo en Agrilpa</strong><br/>Recibe la respuesta y acuerda los detalles en Mensajes B2B.</p>{buyerName && <p className={s.divider}>Enviarás esta solicitud como <strong>{buyerName}</strong>.</p>}</div></aside></div>
      <footer className={s.footer}><p>Solicitar una cotización no confirma una compra.</p><div className={s.actions}><button type="button" className={c.secondaryButton} disabled={busy} onClick={()=>close(false)}>Cancelar</button><button type="submit" className={c.primaryButton} disabled={busy}>{busy ? <Loader2 size={18} className={c.spinner}/> : <ArrowRight size={18}/>} {busy ? "Enviando…" : "Enviar solicitud"}</button></div></footer>
    </form>}
  </DialogContent></Dialog>
}
