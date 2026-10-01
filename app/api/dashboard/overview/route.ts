import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildOverview, type DashboardDays, type ProductRecord, type QuoteRecord, type OrderRecord, type ConversationRecord, type MessageRecord, type ProfileRecord } from "@/lib/dashboard/overview"
import { dashboardPeriod } from "@/lib/dashboard/period"

export const dynamic = "force-dynamic"
type QueryResult = { data: unknown[] | null; error: { message: string; code?: string } | null; count: number | null }
class DashboardQueryError extends Error {
  constructor(message: string, public code?: string) { super(message) }
}
// Respect the configured PostgREST page size; never use a top-products list as a total.
async function readAll<T>(query: (start: number, end: number) => PromiseLike<QueryResult>, optional = false): Promise<T[]> {
  const rows: T[] = []
  while (true) {
    const result = await query(rows.length, rows.length + 999)
    if (result.error) {
      if (optional && ["42P01", "PGRST205"].includes(result.error.code || "")) return []
      throw new DashboardQueryError(result.error.message, result.error.code)
    }
    const page = result.data as T[] | null
    if (!page?.length) break
    rows.push(...page)
    if (result.count !== null ? rows.length >= result.count : page.length < 1000) break
  }
  return rows
}
export async function GET(request: NextRequest) {
  try {
    const sessionClient = await createClient()
    const { data: { user }, error } = await sessionClient.auth.getUser()
    if (error || !user) return NextResponse.json({ error: "Inicia sesión para consultar tu dashboard." }, { status: 401 })
    const requestedDays = Number(request.nextUrl.searchParams.get("days") || 30)
    if (![7, 30, 90].includes(requestedDays)) return NextResponse.json({ error: "Período no válido." }, { status: 400 })
    const days = requestedDays as DashboardDays
    const endDate = request.nextUrl.searchParams.get("endDate") || ""
    const now = new Date()
    try { dashboardPeriod(days, now, endDate) } catch { return NextResponse.json({ error: "Fecha no válida. Elige hoy o una fecha anterior." }, { status: 400 }) }
    const db = createAdminClient()
    const userId = user.id
    const [profileResult, products, quotes, orders, purchases, conversationResult] = await Promise.all([
      (async () => {
        const result = await db.from("users").select("id, company_name, full_name, role, user_type, avatar_url").eq("id", userId).maybeSingle()
        // Older installations can lack the optional avatar column.
        if (result.error && result.error.message.includes("avatar_url") && ["42703", "PGRST204"].includes(result.error.code)) return db.from("users").select("id, company_name, full_name, role, user_type").eq("id", userId).maybeSingle()
        return result
      })(),
      readAll<ProductRecord>((a, b) => db.from("user_products").select("*", { count: "exact" }).eq("user_id", userId).order("id").range(a, b)),
      readAll<QuoteRecord>((a, b) => db.from("quotations").select("id, buyer_id, seller_id, product_id, product_title, buyer_name, status, created_at", { count: "exact" }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order("id").range(a, b)),
      // Optional monetary columns vary between deployments; only aggregate the stored currency, never infer it from today's product price.
      readAll<OrderRecord>((a, b) => db.from("orders").select("*", { count: "exact" }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order("id").range(a, b)),
      readAll<OrderRecord>((a, b) => db.from("purchases").select("*", { count: "exact" }).or(`user_id.eq.${userId},seller_id.eq.${userId}`).order("id").range(a, b), true).catch(error => {
        // Historical purchases have a buyer but no seller_id column. Preserve those buyer records.
        if (error instanceof DashboardQueryError && error.code === "42703" && error.message.includes("seller_id")) return readAll<OrderRecord>((a, b) => db.from("purchases").select("*", { count: "exact" }).eq("user_id", userId).order("id").range(a, b), true)
        throw error
      }),
      readAll<ConversationRecord>((a, b) => db.from("conversations").select("id, buyer_id, seller_id, product_id", { count: "exact" }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).not("product_id", "is", null).order("id").range(a, b)).then(data => ({ data, available: true })).catch(() => ({ data: [] as ConversationRecord[], available: false })),
    ])
    if (profileResult.error) throw new Error(profileResult.error.message)
    const conversations = conversationResult.data
    const participantIds = Array.from(new Set([...conversations.flatMap(c => [c.buyer_id, c.seller_id]), ...quotes.flatMap(q => [q.buyer_id, q.seller_id])])).filter(id => id && id !== userId)
    const productIds = Array.from(new Set(conversations.map(c => c.product_id).filter((id): id is string => !!id)))
    const profiles: ProfileRecord[] = [], relatedProducts: { id: string; title: string }[] = [], messages: MessageRecord[] = []
    let chatAvailable = conversationResult.available
    const batches = <T,>(values: T[]) => Array.from({ length: Math.ceil(values.length / 100) }, (_, i) => values.slice(i * 100, (i + 1) * 100))
    await Promise.all([
      ...batches(participantIds).map(async ids => { profiles.push(...await readAll<ProfileRecord>((a, b) => db.from("users").select("id, full_name, company_name, role", { count: "exact" }).in("id", ids).order("id").range(a, b))) }),
      ...batches(productIds).map(async ids => { relatedProducts.push(...await readAll<{ id: string; title: string }>((a, b) => db.from("user_products").select("id, title", { count: "exact" }).in("id", ids).order("id").range(a, b))) }),
      ...batches(conversations.map(c => c.id)).map(async ids => {
        try { messages.push(...await readAll<MessageRecord>((a, b) => db.from("messages").select("id, conversation_id, sender_id, content, attachment_type, created_at", { count: "exact" }).in("conversation_id", ids).order("id").range(a, b))) }
        catch { chatAvailable = false }
      }),
    ])
    const result = buildOverview({ userId, profile: profileResult.data, products, quotes, orders: [...orders, ...purchases.map(p => ({ ...p, source: "purchase" }))], conversations: chatAvailable ? conversations : [], messages: chatAvailable ? messages : [], profiles,
      productNames: Object.fromEntries([...products, ...relatedProducts].map(p => [p.id, p.title || "Producto agrícola"])), chatAvailable }, days, now, endDate)
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("[Dashboard overview] Unable to load analytics", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "No pudimos cargar las métricas. Vuelve a intentarlo." }, { status: 503 })
  }
}
