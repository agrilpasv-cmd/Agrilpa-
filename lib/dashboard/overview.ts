import { dashboardPeriod, type DashboardDays } from "./period"
export type { DashboardDays } from "./period"
export type DashboardRole = "seller" | "buyer"
export interface ProductRecord { id: string; user_id: string; title?: string; views?: number; is_visible?: boolean; is_deleted?: boolean; deleted_at?: string | null }
export interface QuoteRecord { id: string; buyer_id: string; seller_id: string; product_id?: string; product_title?: string; buyer_name?: string; status: string; created_at: string }
export interface OrderRecord { id: string; buyer_id?: string; user_id?: string; seller_id?: string; status: string; created_at: string; total_price?: number | string | null; total_amount?: number | string | null; price_usd?: number | string | null; currency?: string | null; source?: string }
export interface ConversationRecord { id: string; buyer_id: string; seller_id: string; product_id: string | null }
export interface MessageRecord { id: string; conversation_id: string; sender_id: string; content?: string; attachment_type?: string | null; created_at: string }
export interface ProfileRecord { id: string; company_name?: string; full_name?: string; avatar_url?: string | null; role?: string; user_type?: string; plan_type?: string; plan_expires_at?: string | null }
export interface DashboardMetric { id: string; label: string; value: number | null; previous: number | null; history: number[] | null; detail: string }
export interface DashboardAction { id: string; title: string; detail: string; href: string; time: string }
export interface DashboardSeriesPoint { date: string; label: string; current: number; previous: number }
export interface DashboardRoleView {
  metrics: DashboardMetric[]
  secondary: DashboardMetric[]
  series: { id: string; label: string; points: DashboardSeriesPoint[] }[]
  orders: { id: string; label: string; value: number }[]
  money: { current: Record<string, number>; previous: Record<string, number>; unknownCurrent: number; unknownPrevious: number }
  ranking: { id: string; label: string; value: number; href: string }[]
  rankingLabel: string
  rankingDetail: string
  chat: { available: boolean; medianMinutes: number | null; responded: number; unanswered: number; response24h: number | null; sample24h: number }
  conversations: { id: string; name: string; product: string; content: string; time: string; pending: boolean; href: string }[]
  actions: DashboardAction[]
  pendingCount: number
}
export interface DashboardOverview {
  userId: string
  companyName: string
  avatarUrl: string | null
  defaultRole: DashboardRole
  isEmpty: boolean
  period: ReturnType<typeof dashboardPeriod>
  generatedAt: string
  views: Record<DashboardRole, DashboardRoleView>
  chatUnavailable: boolean
}
export interface OverviewInput {
  userId: string; profile: ProfileRecord | null; products: ProductRecord[]; quotes: QuoteRecord[]; orders: OrderRecord[];
  conversations: ConversationRecord[]; messages: MessageRecord[]; profiles: ProfileRecord[]; productNames: Record<string, string>; chatAvailable: boolean
}
const DAY = 86_400_000
const OFFSET = 6 * 60 * 60 * 1000 // America/El_Salvador: UTC-6, without daylight saving.
const numeric = (value: unknown) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null
const stamp = (value: string) => new Date(value).getTime()
const dateKey = (value: number) => new Date(value - OFFSET).toISOString().slice(0, 10)
export function normalizeOrderStatus(status: string) {
  const key = (status || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[ _-]+/g, "")
  if (["pending", "pendiente"].includes(key)) return "pending"
  if (["processing", "preparacion", "enpreparacion"].includes(key)) return "processing"
  if (["shipped", "entransito", "transito"].includes(key)) return "shipped"
  if (["delivered", "entregado", "completed", "completado"].includes(key)) return "delivered"
  if (["cancelled", "canceled", "cancelado", "cancelada"].includes(key)) return "cancelled"
  return "other"
}
export function normalizeCurrency(value?: string | null) {
  if (!value) return null
  const text = value.trim().toUpperCase()
  if (["US$", "USD", "$", "DOLAR", "DÓLAR"].includes(text)) return "USD"
  if (["EUR", "€"].includes(text)) return "EUR"
  return /^[A-Z]{3}$/.test(text) ? text : null
}
export function buildOverview(input: OverviewInput, days: DashboardDays, now = new Date(), endDate = ""): DashboardOverview {
  const period = dashboardPeriod(days, now, endDate)
  const start = stamp(period.start), end = stamp(period.end), previousStart = stamp(period.previousStart), previousEnd = stamp(period.previousEnd)
  const inWindow = (date: string, previous = false) => {
    const value = stamp(date)
    return value >= (previous ? previousStart : start) && value < (previous ? previousEnd : end)
  }
  const profiles = new Map(input.profiles.map(p => [p.id, p]))
  const products = input.products.filter(p => p.user_id === input.userId && !p.is_deleted && !p.deleted_at)
  const groupedMessages = new Map<string, MessageRecord[]>()
  for (const message of input.messages) {
    if (!Number.isFinite(stamp(message.created_at)) || stamp(message.created_at) > now.getTime()) continue
    const list = groupedMessages.get(message.conversation_id) || []
    list.push(message)
    groupedMessages.set(message.conversation_id, list)
  }
  const threads = input.conversations.filter(c => c.product_id && c.buyer_id !== c.seller_id && (c.buyer_id === input.userId || c.seller_id === input.userId)).flatMap(c => {
    const partnerId = c.buyer_id === input.userId ? c.seller_id : c.buyer_id
    if (profiles.get(partnerId)?.role === "admin") return []
    const messages = (groupedMessages.get(c.id) || []).filter(m => m.sender_id === c.buyer_id || m.sender_id === c.seller_id).sort((a, b) => stamp(a.created_at) - stamp(b.created_at) || a.id.localeCompare(b.id))
    if (!messages.length) return []
    const inboundIndex = messages.findIndex(m => m.sender_id === partnerId)
    const firstInbound = inboundIndex < 0 ? undefined : messages[inboundIndex]
    const response = firstInbound && messages.slice(inboundIndex + 1).find(m => m.sender_id === input.userId)
    const partner = profiles.get(partnerId)
    return [{ conversation: c, partnerId, name: partner?.company_name || partner?.full_name || "Usuario de Agrilpa", messages, firstInbound, response, first: messages[0], last: messages[messages.length - 1] }]
  })
  const makeSeries = (dates: string[]): DashboardSeriesPoint[] => {
    const result = Array.from({ length: days }, (_, i) => {
      const date = dateKey(start + i * DAY)
      return { date, label: new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "short", timeZone: "America/El_Salvador" }).format(new Date(start + i * DAY)), current: 0, previous: 0 }
    })
    for (const date of dates) {
      const ms = stamp(date)
      if (inWindow(date)) result[Math.floor((ms - start) / DAY)].current++
      else if (inWindow(date, true)) result[Math.floor((ms - previousStart) / DAY)].previous++
    }
    return result
  }
  const metric = (id: string, label: string, dates: string[], detail: string): DashboardMetric => ({
    id, label, value: dates.filter(d => inWindow(d)).length, previous: dates.filter(d => inWindow(d, true)).length,
    history: makeSeries(dates).map(p => p.current), detail,
  })
  const currentMetric = (id: string, label: string, value: number | null, detail = "Estado actual"): DashboardMetric => ({ id, label, value, previous: null, history: null, detail })
  const buildRole = (role: DashboardRole): DashboardRoleView => {
    const quotes = input.quotes.filter(q => (role === "seller" ? q.seller_id : q.buyer_id) === input.userId)
    const orders = input.orders.filter(o => (role === "seller" ? o.seller_id : o.buyer_id || o.user_id) === input.userId)
    const roleThreads = threads.filter(t => (role === "seller" ? t.conversation.seller_id : t.conversation.buyer_id) === input.userId)
    const pendingThreads = roleThreads.filter(t => t.last.sender_id !== input.userId)
    const completed = orders.filter(o => normalizeOrderStatus(o.status) === "delivered")
    const quoteDates = quotes.map(q => q.created_at)
    const conversationDates = roleThreads.map(t => t.first.created_at)
    const completedDates = completed.map(o => o.created_at)
    const money = { current: {} as Record<string, number>, previous: {} as Record<string, number>, unknownCurrent: 0, unknownPrevious: 0 }
    for (const order of completed) {
      const current = inWindow(order.created_at), previous = inWindow(order.created_at, true)
      if (!current && !previous) continue
      const legacyUsd = order.source === "purchase" && numeric(order.price_usd) !== null
      const amount = numeric(order.total_price ?? order.total_amount ?? (legacyUsd ? order.price_usd : null))
      const currency = normalizeCurrency(order.currency) || (legacyUsd ? "USD" : null)
      if (amount === null || amount < 0 || !currency) { if (current) money.unknownCurrent++; else money.unknownPrevious++; continue }
      const totals = current ? money.current : money.previous
      totals[currency] = Math.round(((totals[currency] || 0) + amount) * 100) / 100
    }
    const cohort = roleThreads.filter(t => t.firstInbound && inWindow(t.firstInbound.created_at))
    const responded = cohort.filter(t => t.response)
    const durations = responded.map(t => (stamp(t.response!.created_at) - stamp(t.firstInbound!.created_at)) / 60_000).sort((a, b) => a - b)
    const medianMinutes = durations.length ? (durations[Math.floor(durations.length / 2)] + durations[Math.floor((durations.length - 1) / 2)]) / 2 : null
    const mature = cohort.filter(t => now.getTime() - stamp(t.firstInbound!.created_at) >= DAY)
    const within24h = mature.filter(t => t.response && stamp(t.response.created_at) - stamp(t.firstInbound!.created_at) <= DAY).length
    const chat = { available: input.chatAvailable, medianMinutes, responded: responded.length, unanswered: cohort.length - responded.length, response24h: mature.length ? within24h / mature.length * 100 : null, sample24h: mature.length }
    const conversations = roleThreads.sort((a, b) => stamp(b.last.created_at) - stamp(a.last.created_at)).slice(0, 4).map(t => ({
      id: t.conversation.id, name: t.name, product: input.productNames[t.conversation.product_id!] || "Producto agrícola",
      content: t.last.content || (t.last.attachment_type ? "Archivo adjunto" : "Conversación de Agrilpa"), time: t.last.created_at,
      pending: t.last.sender_id !== input.userId, href: `/dashboard/mensajes?conversation=${encodeURIComponent(t.conversation.id)}`,
    }))
    const actions: DashboardAction[] = pendingThreads.map(t => ({ id: `chat-${t.conversation.id}`, title: `Responder a ${t.name}`, detail: input.productNames[t.conversation.product_id!] || "Conversación pendiente", time: t.last.created_at, href: `/dashboard/mensajes?conversation=${encodeURIComponent(t.conversation.id)}` }))
    if (role === "seller") for (const quote of quotes.filter(q => q.status === "pending")) actions.push({ id: `quote-${quote.id}`, title: "Revisar cotización", detail: quote.buyer_name || quote.product_title || "Solicitud recibida", time: quote.created_at, href: `/dashboard/cotizaciones/${quote.id}` })
    for (const order of orders.filter(o => normalizeOrderStatus(o.status) === (role === "seller" ? "processing" : "shipped"))) actions.push({ id: `order-${order.id}`, title: role === "seller" ? "Gestionar pedido en preparación" : "Revisar compra en tránsito", detail: `Pedido #${order.id.slice(0, 8)}`, time: order.created_at, href: role === "seller" ? "/dashboard/ventas" : "/dashboard/compras" })
    actions.sort((a, b) => stamp(a.time) - stamp(b.time))
    const statusNames = { pending: "Pendientes", processing: "En preparación", shipped: "En tránsito", delivered: "Entregados", cancelled: "Cancelados", other: "Sin estado / otros" }
    const orderCounts = Object.entries(statusNames).map(([id, label]) => ({ id, label, value: orders.filter(o => normalizeOrderStatus(o.status) === id).length }))
    const viewsAvailable = products.every(p => numeric(p.views) !== null)
    const visibilityAvailable = products.every(p => typeof p.is_visible === "boolean")
    const newConversations = metric("conversations", "Conversaciones nuevas", conversationDates, "Primer mensaje en el período")
    if (!input.chatAvailable) { newConversations.value = null; newConversations.previous = null; newConversations.history = null }
    const metrics = [
      role === "seller" ? currentMetric("visits", "Visitas acumuladas", viewsAvailable ? products.reduce((sum, p) => sum + Math.max(0, numeric(p.views) || 0), 0) : null, "Todas tus publicaciones · sin filtro de fecha") : metric("quotes", "Solicitudes enviadas", quoteDates, "Creadas en el período"),
      role === "seller" ? metric("quotes", "Cotizaciones recibidas", quoteDates, "Creadas en el período") : metric("responses", "Solicitudes con respuesta", quotes.filter(q => q.status === "accepted" || q.status === "rejected").map(q => q.created_at), "Solicitudes del período aceptadas o rechazadas"),
      metric("completed", role === "seller" ? "Pedidos completados" : "Compras completadas", completedDates, "Creados en el período y entregados"),
      currentMetric("amount", "Importe de pedidos completados", null, "Pedidos del período · separado por moneda"),
    ]
    const secondary = [
      role === "seller" ? currentMetric("active", "Publicaciones activas", visibilityAvailable ? products.filter(p => p.is_visible).length : null) : currentMetric("inProgress", "Compras en curso", orders.filter(o => ["pending", "processing", "shipped"].includes(normalizeOrderStatus(o.status))).length),
      newConversations,
      currentMetric("pending", "Pendientes de respuesta", input.chatAvailable ? pendingThreads.length : null),
      role === "seller" ? currentMetric("responseTime", "Primera respuesta · mediana", input.chatAvailable ? medianMinutes : null, "Conversaciones recibidas en el período") : currentMetric("suppliers", "Proveedores contactados", input.chatAvailable ? new Set(roleThreads.filter(t => t.messages.some(m => m.sender_id === input.userId && inWindow(m.created_at))).map(t => t.partnerId)).size : null, "Mensajes enviados en el período · chat interno"),
    ]
    const supplierCounts = new Map<string, number>()
    for (const quote of quotes.filter(q => inWindow(q.created_at))) supplierCounts.set(quote.seller_id, (supplierCounts.get(quote.seller_id) || 0) + 1)
    const ranking = role === "seller" ? products.filter(p => numeric(p.views) !== null).map(p => ({ id: p.id, label: p.title || "Producto agrícola", value: Math.max(0, numeric(p.views) || 0), href: "/dashboard/mis-publicaciones" })) : Array.from(supplierCounts, ([id, value]) => ({ id, label: profiles.get(id)?.company_name || profiles.get(id)?.full_name || "Proveedor de Agrilpa", value, href: "/dashboard/cotizaciones" }))
    return { metrics, secondary, series: [{ id: "quotes", label: role === "seller" ? "Cotizaciones" : "Solicitudes", points: makeSeries(quoteDates) }, ...(input.chatAvailable ? [{ id: "conversations", label: "Conversaciones", points: makeSeries(conversationDates) }] : []), { id: "completed", label: "Pedidos del período entregados", points: makeSeries(completedDates) }], orders: orderCounts, money,
      ranking: ranking.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)).slice(0, 5), rankingLabel: role === "seller" ? "Productos con más visitas" : "Proveedores por solicitudes", rankingDetail: role === "seller" ? "Visitas acumuladas · sin filtro de fecha" : "Solicitudes creadas en el período", chat, conversations, actions: actions.slice(0, 5), pendingCount: actions.length }
  }
  const declaredBuyer = (input.profile?.user_type || "").toLowerCase().includes("comprador")
  const buyerActivity = input.quotes.some(q => q.buyer_id === input.userId) || input.orders.some(o => (o.buyer_id || o.user_id) === input.userId) || threads.some(t => t.conversation.buyer_id === input.userId)
  const sellerActivity = products.length > 0 || input.quotes.some(q => q.seller_id === input.userId) || input.orders.some(o => o.seller_id === input.userId) || threads.some(t => t.conversation.seller_id === input.userId)
  return { userId: input.userId, companyName: input.profile?.company_name || input.profile?.full_name || "Tu negocio", avatarUrl: input.profile?.avatar_url || null, defaultRole: declaredBuyer || (buyerActivity && !sellerActivity) ? "buyer" : "seller", isEmpty: !sellerActivity && !buyerActivity,
    period, generatedAt: now.toISOString(), views: { seller: buildRole("seller"), buyer: buildRole("buyer") }, chatUnavailable: !input.chatAvailable }
}
