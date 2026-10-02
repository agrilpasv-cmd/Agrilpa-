"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FileText, MapPin, MessageCircle } from "lucide-react"
import { normalizeSearch, shortDate } from "@/lib/dashboard/commerce"
import { CommercePage, DetailLabel, EmptyState, FilterTabs, InlineNotice, LoadingState, Metrics, ProductThumb, SearchField, StatusBadge, commerceStyles as s } from "@/components/dashboard/commerce-ui"

import { useGlobalChat } from "@/components/chat/chat-context"
import { recordQuantity } from "@/lib/quotations"

interface Quotation {
  buyer_id?: string; product_id: string; quantity_unit?: string;
  id: string; product_title: string; product_image?: string; buyer_name: string; quantity: number;
  contact_method?: string; country_code?: string; phone_number?: string; email?: string;
  destination_country?: string; estimated_date?: string; status: string; created_at: string; container_size?: string | null;
}
export default function CotizacionesPage() {
  const router = useRouter()
  const { openChat } = useGlobalChat()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(false)
    const load = async () => {
      try {
        const { data: { user } } = await createClient().auth.getUser()
        if (!user) { router.push("/auth?redirectTo=/dashboard/cotizaciones"); return }
        const response = await fetch(`/api/quotations/get-seller-quotations?sellerId=${user.id}`, { cache: "no-store" })
        const data = await response.json()
        if (!response.ok || !data.success || !Array.isArray(data.quotations)) throw new Error("Quotes unavailable")
        if (mounted) setQuotations(data.quotations)
      } catch { if (mounted) setError(true) }
      finally { if (mounted) setLoading(false) }
    }
    void load()
    return () => { mounted = false }
  }, [router, retry])
  const count = (status: string) => quotations.filter(quotation => quotation.status === status).length
  const filtered = quotations.filter(quotation => normalizeSearch(`${quotation.product_title} ${quotation.buyer_name} ${quotation.destination_country || ""}`).includes(normalizeSearch(query)) && (filter === "all" || quotation.status === filter))

  return <CommercePage title="Cotizaciones" description="Revisa las solicitudes de tus compradores y convierte el interés en negocios.">
    {loading ? <LoadingState label="Cargando tus cotizaciones…" /> : error ? <InlineNotice error>No pudimos cargar tus cotizaciones. <button type="button" className={s.textButton} onClick={() => setRetry(value => value + 1)}>Reintentar</button></InlineNotice> : <>
      <Metrics items={[{ label: "Solicitudes recibidas", value: quotations.length, hint: "Todas tus cotizaciones" }, { label: "Pendientes", value: count("pending"), hint: "Por revisar y responder" }, { label: "Aceptadas", value: count("accepted"), hint: "Solicitudes aprobadas" }, { label: "Rechazadas", value: count("rejected"), hint: "Solicitudes descartadas" }]} />
      <div className={s.section}><div className={s.sectionHead}><div className={s.sectionTitle}><h2>Solicitudes de compradores</h2><span>{quotations.length}</span></div><div className={s.toolbar}><SearchField value={query} onChange={setQuery} placeholder="Buscar producto, comprador o destino" /><span className={s.resultCount}>{filtered.length} de {quotations.length} solicitudes</span></div><FilterTabs value={filter} onChange={setFilter} options={[{ value: "all", label: "Todas", count: quotations.length }, { value: "pending", label: "Pendientes", count: count("pending") }, { value: "accepted", label: "Aceptadas", count: count("accepted") }, { value: "rejected", label: "Rechazadas", count: count("rejected") }]} /></div>
        {!filtered.length ? <EmptyState icon={FileText} title={quotations.length ? "No hay solicitudes con estos filtros" : "Tu próxima oportunidad llegará aquí"} description={quotations.length ? "Prueba otra búsqueda o selecciona un estado diferente." : "Cuando un comprador solicite una cotización, aquí podrás revisar cantidades, destino y requisitos del pedido."} action={quotations.length ? <button type="button" className={s.secondaryButton} onClick={() => { setQuery(""); setFilter("all") }}>Limpiar filtros</button> : <Link href="/dashboard/mis-publicaciones" className={s.primaryButton}>Ver mis publicaciones</Link>} /> : <table className={s.table}><caption className="sr-only">Solicitudes de cotización recibidas</caption><thead><tr><th scope="col">Producto / cantidad</th><th scope="col">Comprador</th><th scope="col">Destino / entrega</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead><tbody>{filtered.map(quotation => {
          const href = `/dashboard/cotizaciones/${quotation.id}`
          const label = ({ pending: "Pendiente", accepted: "Aceptada", rejected: "Rechazada" } as Record<string, string>)[quotation.status] || quotation.status
          return <tr key={quotation.id}><td><div className={s.productCell}><ProductThumb src={quotation.product_image} title={quotation.product_title} /><div><Link href={href} className={s.cellTitle}>{quotation.product_title}</Link><span className={s.cellMeta}>{recordQuantity(quotation)}</span><time className={s.cellMeta} dateTime={quotation.created_at}>Recibida el {shortDate(quotation.created_at)}</time></div></div></td><td data-label="Comprador"><span className={s.cellTitle}>{quotation.buyer_name || "Comprador Agrilpa"}</span><span className={s.cellIconLine}><MessageCircle size={13} aria-hidden="true" />Mensajería Agrilpa</span></td><td data-label="Destino / entrega"><span className={s.cellIconLine}><MapPin size={13} aria-hidden="true" />{quotation.destination_country || "Por confirmar"}</span><span className={s.cellMeta}>{quotation.estimated_date ? shortDate(quotation.estimated_date) : "Fecha por acordar"}</span></td><td data-label="Estado"><StatusBadge tone={quotation.status === "accepted" ? "green" : quotation.status === "pending" ? "amber" : quotation.status === "rejected" ? "red" : "neutral"}>{label}</StatusBadge></td><td><div className={s.cellActions}>{quotation.buyer_id && <button type="button" className={s.iconButton} aria-label={`Conversar con ${quotation.buyer_name}`} title="Conversar en Agrilpa" onClick={()=>openChat({sellerName:quotation.buyer_name,vendorId:quotation.buyer_id!,product:{id:quotation.product_id,title:quotation.product_title,image:quotation.product_image || "",price:"Por cotizar",currency:"USD",quantity:String(quotation.quantity)}})}><MessageCircle size={17} aria-hidden="true" /></button>}<Link href={href} className={s.iconButton} aria-label={`Ver cotización de ${quotation.product_title}`} title="Ver cotización"><DetailLabel>{null}</DetailLabel></Link></div></td></tr>
        })}</tbody></table>}
      </div>
    </>}
  </CommercePage>
}
