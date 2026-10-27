import {
  dashboardPeriod,
  shiftDashboardDate,
  type DashboardDays
} from "@/lib/dashboard/period"

export type AdminMetricId = "users" | "products" | "quotations" | "contacts"

export interface AdminDashboardMetric {
  id: AdminMetricId
  value: number | null
  current: number | null
  previous: number | null
  history: number[] | null
}

export interface AdminDashboardPoint {
  date: string
  previousDate: string
  current: number
  previous: number
}

export interface AdminDashboardOverview {
  generatedAt: string
  period: ReturnType<typeof dashboardPeriod>
  metrics: AdminDashboardMetric[]
  series: Record<AdminMetricId, AdminDashboardPoint[] | null>
  quotationStatuses: { label: string; value: number }[] | null
  community: { label: string; value: number }[] | null
  acquisition: { label: string; value: number }[] | null
  pending: {
    id: string
    label: string
    description: string
    value: number | null
    href: string
  }[]
  warnings: { source: string; message: string }[]
}

export interface AdminDashboardUser {
  id: string
  created_at: string
  role: string | null
  user_type: string | null
  how_heard_about_us: string | null
}

export interface AdminDashboardProduct {
  id: string
  created_at: string
  is_visible: boolean | null
}

export interface AdminDashboardQuotation {
  id: string
  created_at: string
  status: string | null
}

export interface AdminDashboardContact {
  id: string
  created_at: string
  status: string | null
}

export interface AdminDashboardInput {
  users: AdminDashboardUser[] | null
  products: AdminDashboardProduct[] | null
  quotations: AdminDashboardQuotation[] | null
  contacts: AdminDashboardContact[] | null
  pendingQuotations: number | null
  pendingContacts: number | null
  supportUnreadTickets: number | null
  warnings: AdminDashboardOverview["warnings"]
}

const DAY = 86_400_000
const OFFSET = 6 * 60 * 60 * 1000
const normalized = (value: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim()
    .replace(/\s+/g, " ")

export function adminDateInWindow(value: string, start: string, end: string) {
  const timestamp = Date.parse(value)
  return timestamp >= Date.parse(start) && timestamp < Date.parse(end)
}

export function adminDailySeries(
  dates: string[],
  period: ReturnType<typeof dashboardPeriod>
): AdminDashboardPoint[] {
  const start = Date.parse(period.start)
  const previousStart = Date.parse(period.previousStart)
  const points = Array.from({ length: period.days }, (_, index) => {
    const date = new Date(start + index * DAY - OFFSET)
      .toISOString()
      .slice(0, 10)
    return {
      date,
      previousDate: shiftDashboardDate(date, -period.days),
      current: 0,
      previous: 0
    }
  })
  for (const date of dates) {
    const timestamp = Date.parse(date)
    if (adminDateInWindow(date, period.start, period.end))
      points[Math.floor((timestamp - start) / DAY)].current++
    else if (adminDateInWindow(date, period.previousStart, period.previousEnd))
      points[Math.floor((timestamp - previousStart) / DAY)].previous++
  }
  return points
}

export function adminAcquisitionSource(value: string | null) {
  const key = normalized(value)
  const known: Record<string, string> = {
    tiktok: "TikTok",
    "tik tok": "TikTok",
    google: "Google",
    "google search": "Google",
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    correo: "Correo",
    email: "Correo",
    internet: "Internet",
    otro: "Otro",
    "recomendacion de un amigo/colega": "Recomendación",
    recomendacion: "Recomendación"
  }
  return (
    known[key] || (value || "").trim().replace(/\s+/g, " ") || "Sin indicar"
  )
}

export function adminCommunityLabel(value: string | null) {
  const key = normalized(value)
  return (
    (
      {
        comprador: "Compradores",
        vendedor: "Vendedores",
        empresa: "Empresas"
      } as Record<string, string>
    )[key] || "Sin clasificar"
  )
}

export function adminQuotationStatusLabel(value: string | null) {
  return (
    (
      {
        pending: "Pendientes",
        accepted: "Aceptadas",
        rejected: "Rechazadas",
        replied: "Respondidas"
      } as Record<string, string>
    )[normalized(value)] || "Otros estados"
  )
}

export function adminCountGroups(labels: string[]) {
  const counts = new Map<string, number>()
  for (const label of labels) counts.set(label, (counts.get(label) || 0) + 1)
  return Array.from(counts, ([label, value]) => ({ label, value })).sort(
    (a, b) => b.value - a.value || a.label.localeCompare(b.label, "es")
  )
}

export function countUnreadSupportTickets(
  conversationIds: string[],
  messages: {
    conversation_id: string
    sender_id: string
    read_at: string | null
    created_at: string
  }[],
  adminIds: string[],
  now: Date
) {
  const support = new Set(conversationIds)
  const admins = new Set(adminIds)
  return new Set(
    messages
      .filter(
        (message) =>
          support.has(message.conversation_id) &&
          !admins.has(message.sender_id) &&
          !message.read_at &&
          Number.isFinite(Date.parse(message.created_at)) &&
          Date.parse(message.created_at) < now.getTime()
      )
      .map((message) => message.conversation_id)
  ).size
}

export function buildAdminDashboardOverview(
  input: AdminDashboardInput,
  days: DashboardDays,
  now = new Date(),
  endDate = ""
): AdminDashboardOverview {
  const period = dashboardPeriod(days, now, endDate)
  const validRecord = (record: { created_at: string }) =>
    Number.isFinite(Date.parse(record.created_at)) &&
    Date.parse(record.created_at) < now.getTime()
  const users =
    input.users?.filter((user) => user.role !== "admin" && validRecord(user)) ??
    null
  const products = input.products?.filter(validRecord) ?? null
  const quotations = input.quotations?.filter(validRecord) ?? null
  const contacts = input.contacts?.filter(validRecord) ?? null
  const seriesFor = (rows: { created_at: string }[] | null) =>
    rows === null
      ? null
      : adminDailySeries(
          rows.map((row) => row.created_at),
          period
        )
  const series = {
    users: seriesFor(users),
    products: seriesFor(products),
    quotations: seriesFor(quotations),
    contacts: seriesFor(contacts)
  }
  const metric = (
    id: AdminMetricId,
    snapshot?: number | null
  ): AdminDashboardMetric => {
    const points = series[id]
    const current =
      points?.reduce((sum, point) => sum + point.current, 0) ?? null
    return {
      id,
      value: snapshot === undefined ? current : snapshot,
      current,
      previous: points?.reduce((sum, point) => sum + point.previous, 0) ?? null,
      history: points?.map((point) => point.current) ?? null
    }
  }
  return {
    generatedAt: now.toISOString(),
    period,
    metrics: [
      metric("users", users?.length ?? null),
      metric(
        "products",
        products &&
          products.every((product) => typeof product.is_visible === "boolean")
          ? products.filter((product) => product.is_visible === true).length
          : null
      ),
      metric("quotations"),
      metric("contacts")
    ],
    series,
    quotationStatuses:
      quotations === null
        ? null
        : adminCountGroups(
            quotations.map((quote) => adminQuotationStatusLabel(quote.status))
          ),
    community:
      users === null
        ? null
        : adminCountGroups(
            users.map((user) => adminCommunityLabel(user.user_type))
          ),
    acquisition:
      users === null
        ? null
        : adminCountGroups(
            users.map((user) => adminAcquisitionSource(user.how_heard_about_us))
          ),
    pending: [
      {
        id: "contacts",
        label: "Solicitudes de contacto",
        description: "Solicitudes que aún no se han marcado como contactadas.",
        value: contacts === null ? null : input.pendingContacts,
        href: "/admin/mensajes?tab=solicitudes"
      },
      {
        id: "quotations",
        label: "Cotizaciones pendientes",
        description: "Cotizaciones que esperan la respuesta del vendedor.",
        value: quotations === null ? null : input.pendingQuotations,
        href: "/admin/cotizaciones"
      },
      {
        id: "support",
        label: "Soporte sin leer",
        description: "Tickets con mensajes de usuarios pendientes de lectura.",
        value: input.supportUnreadTickets,
        href: "/admin/soporte"
      }
    ],
    warnings: input.warnings
  }
}
