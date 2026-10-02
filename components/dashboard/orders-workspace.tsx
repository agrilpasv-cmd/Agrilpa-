"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCheck, ShoppingBag, ShoppingCart, SlidersHorizontal, X } from "lucide-react"
import { useDashboard } from "@/app/dashboard/context"
import { normalizeSearch, orderStage, orderStatusLabel, shortDate, withinDateRange } from "@/lib/dashboard/commerce"
import { CommercePage, DetailLabel, EmptyState, FilterTabs, InlineNotice, LoadingState, Metrics, ProductThumb, SearchField, StatusBadge, commerceStyles as s } from "./commerce-ui"

interface OrderRecord {
  id: string; product_name?: string; product_title?: string; product_image?: string;
  buyer_name?: string; full_name?: string; seller_company?: string; seller_name?: string;
  quantity?: number; quantity_kg?: number; container_size?: string; unit?: string; currency?: string;
  status?: string; created_at: string; total_price?: number | string; price_usd?: number | string;
  is_read_seller?: boolean; is_read_buyer?: boolean; is_read?: boolean; origin_table?: string;
}

export function OrdersWorkspace({ mode }: { mode: "sales" | "purchases" }) {
  const sales = mode === "sales"
  const router = useRouter()
  const { refreshCounts } = useDashboard()
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [datesOpen, setDatesOpen] = useState(false)
  const [marking, setMarking] = useState(false)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(false)
    fetch(sales ? "/api/seller/orders" : "/api/user/orders", { cache: "no-store" })
      .then(async response => {
        if (response.status === 401) { router.push(`/auth?redirectTo=${encodeURIComponent(sales ? "/dashboard/ventas" : "/dashboard/compras")}`); return null }
        if (!response.ok) throw new Error("Orders unavailable")
        return response.json()
      })
      .then(data => {
        if (!mounted || !data) return
        if (!Array.isArray(data.orders)) throw new Error("Invalid orders")
        // Preserve the actual record ID for detail links and read updates.
        const unique = new Map<string, OrderRecord>()
        data.orders.forEach((order: OrderRecord) => unique.set(`${order.origin_table || "orders"}:${order.id}`, order))
        setOrders(Array.from(unique.values()))
      })
      .catch(() => { if (mounted) setError(true) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [sales, router, retry])

  const isRead = (order: OrderRecord) => (sales ? order.is_read_seller : order.origin_table === "orders" ? order.is_read_buyer ?? order.is_read : order.is_read ?? order.is_read_buyer) ?? true
  const counterpart = (order: OrderRecord) => sales ? order.buyer_name || order.full_name || "Comprador Agrilpa" : order.seller_company || order.full_name || order.seller_name || "Vendedor Agrilpa"
  const title = (order: OrderRecord) => order.product_name || order.product_title || "Producto"
  const quantity = (order: OrderRecord) => `${order.quantity ?? order.quantity_kg ?? 0} ${order.container_size ? `contenedores · ${order.container_size}` : order.unit || "kg"}`
  const amount = (order: OrderRecord) => {
    const value = Number(sales ? order.total_price ?? order.price_usd : order.price_usd ?? order.total_price)
    return value > 0 ? new Intl.NumberFormat("es-SV", { style: "currency", currency: order.currency === "EUR" ? "EUR" : "USD" }).format(value) : "A cotizar"
  }
  const unread = orders.filter(order => !isRead(order))
  const count = (stage: string) => orders.filter(order => orderStage(order.status || "Pendiente") === stage).length
  const dateInvalid = Boolean(start && end && start > end)
  const filtered = orders.filter(order => {
    const search = normalizeSearch(`${title(order)} ${counterpart(order)} ${order.id}`)
    return search.includes(normalizeSearch(query)) && (filter === "all" || orderStage(order.status || "Pendiente") === filter) && !dateInvalid && withinDateRange(order.created_at, start, end)
  })
  const clear = () => { setQuery(""); setFilter("all"); setStart(""); setEnd("") }
  const markRead = async (ids: string[], all = false) => {
    if (!ids.length || marking) return
    if (all) setMarking(true)
    try {
      const response = await fetch("/api/user/orders/mark-read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }), keepalive: true })
      if (!response.ok) throw new Error("Read update failed")
      setOrders(prev => prev.map(order => ids.includes(order.id) ? { ...order, ...(sales ? { is_read_seller: true } : { is_read: true, is_read_buyer: true }) } : order))
      await refreshCounts()
      if (all) setNotice({ text: "Todos los pedidos de esta sección están marcados como vistos." })
    } catch { setNotice({ text: "No pudimos marcar los pedidos como vistos. Inténtalo de nuevo.", error: true }) }
    finally { if (all) setMarking(false) }
  }
  const route = sales ? "/dashboard/ventas" : "/dashboard/compras"

  return <CommercePage title={sales ? "Mis ventas" : "Mis compras"} description={sales ? "Gestiona tus pedidos y da seguimiento a cada entrega." : "Consulta tus pedidos y sigue el avance de tus compras."} action={<button type="button" className={s.secondaryButton} disabled={!unread.length || marking || loading} onClick={() => void markRead(unread.map(order => order.id), true)}><CheckCheck size={17} aria-hidden="true" />{marking ? "Marcando…" : "Marcar como vistos"}</button>}>
    {notice && <InlineNotice error={notice.error} onClose={() => setNotice(null)}>{notice.text}</InlineNotice>}
    {loading ? <LoadingState label={sales ? "Cargando tus ventas…" : "Cargando tus compras…"} /> : error ? <InlineNotice error>No pudimos cargar tus pedidos. <button type="button" className={s.textButton} onClick={() => setRetry(value => value + 1)}>Reintentar</button></InlineNotice> : <>
      <Metrics items={[{ label: sales ? "Pedidos recibidos" : "Pedidos realizados", value: orders.length, hint: "Historial de operaciones" }, { label: "En preparación", value: count("preparation"), hint: "Pendientes de entrega" }, { label: "En tránsito", value: count("transit"), hint: "En camino a su destino" }, { label: "Entregados", value: count("delivered"), hint: "Operaciones completadas" }]} />
      <div className={s.section}>
        <div className={s.sectionHead}><div className={s.sectionTitle}><h2>{sales ? "Tus pedidos de venta" : "Tus pedidos de compra"}</h2><span>{orders.length}</span></div>
          <div className={s.toolbar}><SearchField value={query} onChange={setQuery} placeholder={sales ? "Buscar producto, comprador o pedido" : "Buscar producto, vendedor o pedido"} /><button type="button" className={s.secondaryButton} aria-expanded={datesOpen} aria-controls="order-date-filters" onClick={() => setDatesOpen(value => !value)}><SlidersHorizontal size={16} aria-hidden="true" />Fechas{(start || end) && <span>·</span>}</button><span className={s.resultCount}>{filtered.length} de {orders.length} pedidos</span></div>
          {datesOpen && <div id="order-date-filters" className={s.dateFilters}><label>Desde<input type="date" aria-label="Fecha inicial" value={start} max={end || undefined} onInput={event => setStart(event.currentTarget.value)} onChange={event => setStart(event.target.value)} /></label><label>Hasta<input type="date" aria-label="Fecha final" value={end} min={start || undefined} onInput={event => setEnd(event.currentTarget.value)} onChange={event => setEnd(event.target.value)} /></label>{(start || end) && <button type="button" className={s.textButton} onClick={() => { setStart(""); setEnd("") }}><X size={15} aria-hidden="true" />Quitar fechas</button>}{dateInvalid && <span className={s.dateSummary} role="alert">La fecha final debe ser igual o posterior a la inicial.</span>}</div>}
          <FilterTabs value={filter} onChange={setFilter} options={[{ value: "all", label: "Todos", count: orders.length }, { value: "preparation", label: "En preparación", count: count("preparation") }, { value: "transit", label: "En tránsito", count: count("transit") }, { value: "delivered", label: "Entregados", count: count("delivered") }, ...(count("cancelled") ? [{ value: "cancelled", label: "Cancelados", count: count("cancelled") }] : [])]} />
        </div>
        {!filtered.length ? <EmptyState icon={sales ? ShoppingBag : ShoppingCart} title={orders.length ? "No hay pedidos con estos filtros" : sales ? "Tus próximas ventas empiezan aquí" : "Tu historial de compras está listo"} description={orders.length ? "Prueba otra búsqueda o ajusta el estado y las fechas." : sales ? "Cuando un comprador realice un pedido, podrás consultar sus detalles y seguir la entrega aquí." : "Aquí encontrarás los pedidos que realices a los proveedores de Agrilpa."} action={orders.length ? <button type="button" className={s.secondaryButton} onClick={clear}>Limpiar filtros</button> : <Link href={sales ? "/dashboard/mis-publicaciones" : "/productos"} className={s.primaryButton}>{sales ? "Ver mis publicaciones" : "Explorar productos"}</Link>} /> : <table className={s.table}><caption className="sr-only">{sales ? "Pedidos recibidos" : "Compras realizadas"}</caption><thead><tr><th scope="col">Producto / pedido</th><th scope="col">{sales ? "Comprador" : "Vendedor"}</th><th scope="col">Estado</th><th scope="col">Importe / fecha</th><th scope="col">Detalle</th></tr></thead><tbody>{filtered.map(order => {
          const status = order.status || "Pendiente"
          const stage = orderStage(status)
          const tone = stage === "delivered" ? "green" : stage === "transit" ? "blue" : stage === "cancelled" ? "red" : stage === "preparation" ? "amber" : "neutral"
          const href = `${route}/${order.id}`
          return <tr key={`${order.origin_table}:${order.id}`} data-unread={!isRead(order)}><td><div className={s.productCell}><ProductThumb src={order.product_image} title={title(order)} /><div><Link href={href} className={s.cellTitle} onClick={() => { if (!isRead(order)) void markRead([order.id]) }}>{title(order)}</Link><span className={s.cellMeta}>#{order.id.slice(0, 8).toUpperCase()}{!isRead(order) && <span className={s.newLabel}>Nuevo</span>}</span><span className={s.cellMeta}>{quantity(order)}</span></div></div></td><td data-label={sales ? "Comprador" : "Vendedor"}><span className={s.cellTitle}>{counterpart(order)}</span></td><td data-label="Estado"><StatusBadge tone={tone}>{orderStatusLabel(status)}</StatusBadge></td><td data-label="Importe"><strong className={s.money}>{amount(order)}</strong><time className={s.cellMeta} dateTime={order.created_at}>{shortDate(order.created_at)}</time></td><td><Link href={href} className={s.detailLink} aria-label={`Ver pedido ${order.id.slice(0, 8).toUpperCase()}`} onClick={() => { if (!isRead(order)) void markRead([order.id]) }}><DetailLabel /></Link></td></tr>
        })}</tbody></table>}
      </div>
    </>}
  </CommercePage>
}
