import type { SupabaseClient } from "@supabase/supabase-js"
import { dashboardPeriod, type DashboardDays } from "@/lib/dashboard/period"
import {
  buildAdminDashboardOverview,
  countUnreadSupportTickets,
  type AdminDashboardContact,
  type AdminDashboardOverview,
  type AdminDashboardProduct,
  type AdminDashboardQuotation,
  type AdminDashboardUser
} from "./dashboard"

interface AdminDashboardQueryResult {
  data: unknown[] | null
  count: number | null
  error: { code?: string; message?: string } | null
}

export class AdminDashboardQueryError extends Error {
  constructor(public code?: string) {
    super("No se pudo leer una fuente del dashboard.")
  }
}

export async function readAdminDashboardRows<T>(
  query: (start: number, end: number) => PromiseLike<AdminDashboardQueryResult>
): Promise<T[]> {
  const rows: T[] = []
  while (true) {
    const result = await query(rows.length, rows.length + 999)
    if (result.error) throw new AdminDashboardQueryError(result.error.code)
    if (!result.data) throw new AdminDashboardQueryError()
    if (!result.data.length) {
      if (result.count !== null && rows.length < result.count)
        throw new AdminDashboardQueryError()
      break
    }
    rows.push(...(result.data as T[]))
    if (result.count !== null && rows.length >= result.count) break
  }
  return rows
}

async function exactCount(
  query: PromiseLike<{
    count: number | null
    error: { code?: string } | null
  }>
) {
  const result = await query
  if (result.error || result.count === null)
    throw new AdminDashboardQueryError(result.error?.code)
  return result.count
}

export async function loadAdminDashboardOverview(
  db: SupabaseClient,
  days: DashboardDays,
  now = new Date(),
  endDate = ""
): Promise<AdminDashboardOverview> {
  const period = dashboardPeriod(days, now, endDate)
  const warnings: AdminDashboardOverview["warnings"] = []
  async function source<T>(
    name: string,
    query: () => Promise<T>,
    unavailable: string
  ): Promise<T | null> {
    try {
      return await query()
    } catch (error) {
      const missing =
        error instanceof AdminDashboardQueryError &&
        ["42P01", "PGRST205"].includes(error.code || "")
      warnings.push({
        source: name,
        message:
          name === "contacts" && missing
            ? "Las solicitudes de contacto todavía no están disponibles en esta base de datos."
            : unavailable
      })
      return null
    }
  }
  const [users, products, quotations, contacts] = await Promise.all([
    source(
      "users",
      () =>
        readAdminDashboardRows<AdminDashboardUser>((start, end) =>
          db
            .from("users")
            .select("id,created_at,role,user_type,how_heard_about_us", {
              count: "exact"
            })
            .lt("created_at", now.toISOString())
            .order("id")
            .range(start, end)
        ),
      "No pudimos consultar los usuarios, sus perfiles ni sus fuentes de registro."
    ),
    source(
      "products",
      () =>
        readAdminDashboardRows<AdminDashboardProduct>((start, end) =>
          db
            .from("user_products")
            .select("id,created_at,is_visible", { count: "exact" })
            .lt("created_at", now.toISOString())
            .order("id")
            .range(start, end)
        ),
      "No pudimos consultar las publicaciones."
    ),
    source(
      "quotations",
      async () => {
        const [rows, pending] = await Promise.all([
          readAdminDashboardRows<AdminDashboardQuotation>((start, end) =>
            db
              .from("quotations")
              .select("id,created_at,status", { count: "exact" })
              .lt("created_at", now.toISOString())
              .order("id")
              .range(start, end)
          ),
          exactCount(
            db
              .from("quotations")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending")
              .lt("created_at", now.toISOString())
          )
        ])
        return { rows, pending }
      },
      "No pudimos consultar las cotizaciones ni sus pendientes."
    ),
    source(
      "contacts",
      async () => {
        const rows = await readAdminDashboardRows<AdminDashboardContact>(
          (start, end) =>
            db
              .from("product_contact_requests")
              .select("id,created_at,status", { count: "exact" })
              .gte("created_at", period.previousStart)
              .lt("created_at", period.end)
              .order("id")
              .range(start, end)
        )
        const pending = await exactCount(
          db
            .from("product_contact_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "new")
            .lt("created_at", now.toISOString())
        )
        return { rows, pending }
      },
      "No pudimos consultar las solicitudes de contacto ni sus pendientes."
    )
  ])
  const supportUnreadTickets = await source(
    "support",
    async () => {
      if (!users) throw new AdminDashboardQueryError()
      const conversations = await readAdminDashboardRows<{ id: string }>(
        (start, end) =>
          db
            .from("conversations")
            .select("id", { count: "exact" })
            .is("product_id", null)
            .lt("created_at", now.toISOString())
            .order("id")
            .range(start, end)
      )
      const messages: {
        conversation_id: string
        sender_id: string
        read_at: string | null
        created_at: string
      }[] = []
      for (let index = 0; index < conversations.length; index += 100) {
        const ids = conversations.slice(index, index + 100).map((row) => row.id)
        messages.push(
          ...(await readAdminDashboardRows<(typeof messages)[number]>(
            (start, end) =>
              db
                .from("messages")
                .select("conversation_id,sender_id,read_at,created_at", {
                  count: "exact"
                })
                .in("conversation_id", ids)
                .is("read_at", null)
                .lt("created_at", now.toISOString())
                .order("id")
                .range(start, end)
          ))
        )
      }
      return countUnreadSupportTickets(
        conversations.map((row) => row.id),
        messages,
        users.filter((user) => user.role === "admin").map((user) => user.id),
        now
      )
    },
    "No pudimos consultar los tickets de soporte sin leer."
  )
  return buildAdminDashboardOverview(
    {
      users,
      products,
      quotations: quotations?.rows ?? null,
      contacts: contacts?.rows ?? null,
      pendingQuotations: quotations?.pending ?? null,
      pendingContacts: contacts?.pending ?? null,
      supportUnreadTickets,
      warnings
    },
    days,
    now,
    endDate
  )
}
