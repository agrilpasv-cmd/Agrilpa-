export const normalizeSearch = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

export type OrderStage = "preparation" | "transit" | "delivered" | "cancelled" | "other"
export function orderStage(status: string): OrderStage {
  const value = normalizeSearch(status).replace(/[_-]/g, " ")
  if (["pendiente", "pending", "preparacion", "en preparacion", "processing", "preparing", "accepted", "aceptado", "confirmado", "confirmed"].includes(value)) return "preparation"
  if (["en transito", "in transit", "shipped", "enviado", "en camino"].includes(value)) return "transit"
  if (["entregado", "entregada", "delivered", "completed", "completado", "completada"].includes(value)) return "delivered"
  if (["cancelado", "cancelada", "cancelled", "canceled", "rejected", "rechazado"].includes(value)) return "cancelled"
  return "other"
}
export function orderStatusLabel(status: string) {
  const stage = orderStage(status)
  if (stage === "preparation") return ["pending", "pendiente"].includes(normalizeSearch(status)) ? "Pendiente" : "En preparación"
  return { transit: "En tránsito", delivered: "Entregado", cancelled: "Cancelado", other: status || "Pendiente" }[stage as Exclude<OrderStage, "preparation">]
}
export function withinDateRange(value: string, start: string, end: string) {
  if (!start && !end) return true
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) && (!start || timestamp >= new Date(`${start}T00:00:00`).getTime()) && (!end || timestamp <= new Date(`${end}T23:59:59.999`).getTime())
}
export function shortDate(value?: string) {
  if (!value) return "Sin fecha"
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  if (!Number.isFinite(date.getTime())) return "Sin fecha"
  return date.toLocaleDateString("es-SV", { day: "numeric", month: "short", year: "numeric" })
}
export function productPrice(value: string | number, currency = "USD", unit = "kg", quote = false) {
  const price = Number(value)
  if (quote || !Number.isFinite(price)) return "Precio a cotizar"
  const symbol = ({ USD: "$", EUR: "€", "$": "$", "€": "€" } as Record<string, string>)[currency] || `${currency} `
  return `${symbol}${new Intl.NumberFormat("es-SV", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(price)} / ${unit}`
}
