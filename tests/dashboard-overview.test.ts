import { test } from "node:test"
import assert from "node:assert/strict"
import { buildOverview, normalizeOrderStatus, type OverviewInput, type QuoteRecord, type MessageRecord } from "../lib/dashboard/overview"
import { dashboardPeriod, readDashboardFilters, shiftDashboardDate } from "../lib/dashboard/period"
import { dashboardReport } from "../lib/dashboard/report"

const now = new Date("2026-09-30T18:00:00Z")
const base = (): OverviewInput => ({ userId: "me", profile: { id: "me" }, products: [], quotes: [], orders: [], conversations: [], messages: [], profiles: [], productNames: {}, chatAvailable: true })
const quote = (id: string, created_at: string): QuoteRecord => ({ id, created_at, buyer_id: "buyer", seller_id: "me", status: "pending" })
const message = (id: string, conversation_id: string, sender_id: string, created_at: string): MessageRecord => ({ id, conversation_id, sender_id, created_at })

test("periods respect El Salvador midnight and compare today's elapsed hours", () => {
  const input = base()
  input.quotes = [quote("before", "2026-09-24T05:59:59Z"), quote("start", "2026-09-24T06:00:00Z"), quote("today", "2026-09-30T17:59:59Z"), quote("future", "2026-09-30T19:00:00Z"), quote("past-late", "2026-09-23T19:00:00Z"), quote("past-now", "2026-09-23T17:59:59Z")]
  const result = buildOverview(input, 7, now)
  assert.equal(result.period.start, "2026-09-24T06:00:00.000Z")
  assert.equal(result.period.previousEnd, "2026-09-23T18:00:00.000Z")
  const metric = result.views.seller.metrics.find(m => m.id === "quotes")!
  assert.equal(metric.value, 2); assert.equal(metric.previous, 1)
  assert.equal(result.views.seller.series[0].points.length, 7)
  assert.equal(result.views.seller.series[0].points[0].current, 1)
  assert.equal(result.views.seller.series[0].points[6].current, 1)
})
test("totals count all owned products, excluding deleted and foreign products", () => {
  const input = base()
  input.products = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, user_id: "me", views: i + 1, is_visible: i < 8 }))
  input.products.push({ id: "deleted", user_id: "me", views: 999, is_deleted: true }, { id: "foreign", user_id: "other", views: 999 })
  const view = buildOverview(input, 30, now).views.seller
  assert.equal(view.metrics[0].value, 78); assert.equal(view.metrics[0].previous, null); assert.equal(view.metrics[0].history, null)
  assert.equal(view.secondary[0].value, 8); assert.equal(view.ranking.length, 5)
})
test("absent fields are unavailable, but an empty account is a real zero", () => {
  const empty = buildOverview(base(), 30, now)
  assert.equal(empty.isEmpty, true); assert.equal(empty.views.seller.metrics[0].value, 0)
  const input = base(); input.products = [{ id: "p", user_id: "me" }]
  const view = buildOverview(input, 30, now).views.seller
  assert.equal(view.metrics[0].value, null); assert.equal(view.secondary[0].value, null); assert.equal(view.ranking.length, 0)
})
test("completed orders use their creation cohort and do not mix currencies", () => {
  const input = base()
  input.orders = [
    { id: "usd", buyer_id: "buyer", seller_id: "me", status: "Entregado", created_at: "2026-09-29T12:00:00Z", total_price: "120.25", currency: "USD" },
    { id: "eur", buyer_id: "buyer", seller_id: "me", status: "delivered", created_at: "2026-09-28T12:00:00Z", total_price: 50, currency: "EUR" },
    { id: "unknown", buyer_id: "buyer", seller_id: "me", status: "delivered", created_at: "2026-09-28T12:00:00Z", total_price: 30 },
    { id: "older", buyer_id: "buyer", seller_id: "me", status: "delivered", created_at: "2026-08-29T12:00:00Z", total_price: 900, currency: "USD" },
    { id: "cancel", buyer_id: "buyer", seller_id: "me", status: "Cancelado", created_at: "2026-09-27T12:00:00Z", total_price: 200, currency: "USD" },
    { id: "direct", user_id: "me", seller_id: "vendor", status: "En Tránsito", created_at: "2026-09-29T12:00:00Z", total_amount: 99 },
  ]
  const result = buildOverview(input, 30, now)
  assert.equal(result.views.seller.metrics[2].value, 3)
  assert.deepEqual(result.views.seller.money.current, { USD: 120.25, EUR: 50 })
  assert.equal(result.views.seller.money.unknownCurrent, 1)
  assert.equal(result.views.seller.orders.reduce((sum, item) => sum + item.value, 0), 5)
  assert.equal(result.views.buyer.secondary[0].value, 1)
  for (const [inputStatus, expected] of [["Preparación", "processing"], ["En Tránsito", "shipped"], ["Entregado", "delivered"], ["canceled", "cancelled"], ["unknown", "other"]]) assert.equal(normalizeOrderStatus(inputStatus), expected)
})
test("historical purchases use explicit price_usd without inventing a seller or status", () => {
  const input = base()
  input.orders = [
    { id: "old", user_id: "me", status: "", created_at: "2026-09-29T12:00:00Z", price_usd: 78, source: "purchase" },
    { id: "delivered", user_id: "me", status: "delivered", created_at: "2026-09-29T12:00:00Z", price_usd: "49.75", source: "purchase" },
  ]
  const result = buildOverview(input, 30, now)
  assert.equal(result.views.buyer.orders.find(item => item.id === "other")?.value, 1)
  assert.equal(result.views.seller.orders.reduce((sum, item) => sum + item.value, 0), 0)
  assert.deepEqual(result.views.buyer.money.current, { USD: 49.75 })
})
test("chat excludes empty/support/admin/foreign threads; read messages still need a reply", () => {
  const input = base()
  input.profiles = [{ id: "admin", role: "admin" }]
  input.conversations = [
    { id: "commercial", buyer_id: "buyer", seller_id: "me", product_id: "p" },
    { id: "empty", buyer_id: "buyer", seller_id: "me", product_id: "p" },
    { id: "support", buyer_id: "buyer", seller_id: "me", product_id: null },
    { id: "admin", buyer_id: "admin", seller_id: "me", product_id: "p" },
    { id: "foreign", buyer_id: "buyer", seller_id: "someone", product_id: "p" },
  ]
  input.messages = input.conversations.filter(c => c.id !== "empty").map(c => message(c.id, c.id, c.buyer_id, "2026-09-29T12:00:00Z"))
  const view = buildOverview(input, 30, now).views.seller
  assert.equal(view.secondary.find(m => m.id === "conversations")?.value, 1)
  assert.equal(view.secondary.find(m => m.id === "pending")?.value, 1)
  assert.equal(view.chat.unanswered, 1); assert.equal(view.chat.response24h, 0)
  assert.equal(view.conversations[0].href, "/dashboard/mensajes?conversation=commercial")
  assert.equal(view.actions.length, 1)
})
test("response timing starts at the first incoming message and recent samples do not lower the 24h rate", () => {
  const input = base()
  input.conversations = ["a", "b", "recent"].map(id => ({ id, buyer_id: "buyer", seller_id: "me", product_id: "p" }))
  input.messages = [
    message("a1", "a", "buyer", "2026-09-28T12:00:00Z"), message("a2", "a", "buyer", "2026-09-28T12:04:00Z"), message("a3", "a", "me", "2026-09-28T12:10:00Z"),
    message("b1", "b", "buyer", "2026-09-28T12:00:00Z"), message("b2", "b", "me", "2026-09-28T12:20:00Z"),
    message("r1", "recent", "buyer", "2026-09-30T17:00:00Z"),
  ]
  const view = buildOverview(input, 30, now).views.seller
  assert.equal(view.chat.medianMinutes, 15); assert.equal(view.chat.response24h, 100); assert.equal(view.chat.sample24h, 2)
  assert.equal(view.chat.responded, 2); assert.equal(view.chat.unanswered, 1)
  assert.equal(view.secondary.find(m => m.id === "pending")?.value, 1)
})
test("unavailable chat is not presented as zero activity and buyer mode remains independent", () => {
  const input = base(); input.chatAvailable = false; input.profile = { id: "me", user_type: "comprador" }
  input.quotes = [{ id: "q", buyer_id: "me", seller_id: "vendor", status: "accepted", created_at: "2026-09-29T12:00:00Z" }]
  const result = buildOverview(input, 30, now)
  assert.equal(result.defaultRole, "buyer"); assert.equal(result.views.buyer.metrics[0].value, 1); assert.equal(result.views.buyer.metrics[1].value, 1)
  assert.equal(result.views.seller.metrics[1].value, 0)
  assert.equal(result.views.buyer.secondary.find(m => m.id === "conversations")?.value, null)
  assert.equal(result.views.buyer.chat.available, false)
  assert.equal(result.views.buyer.series.some(item => item.id === "conversations"), false)
})

test("historical periods include the complete last day and compare non-overlapping complete days", () => {
  const input = base()
  input.profile = { id: "me", company_name: "Cooperativa", avatar_url: "https://example.com/avatar.jpg" }
  input.quotes = [quote("before", "2026-08-25T05:59:59Z"), quote("start", "2026-08-25T06:00:00Z"), quote("end", "2026-09-01T05:59:59Z"), quote("after", "2026-09-01T06:00:00Z"), quote("previous", "2026-08-25T05:00:00Z")]
  const result = buildOverview(input, 7, now, "2026-08-31")
  assert.equal(result.period.start, "2026-08-25T06:00:00.000Z")
  assert.equal(result.period.end, "2026-09-01T06:00:00.000Z")
  assert.equal(result.period.previousEnd, result.period.start)
  assert.equal(result.period.historical, true)
  assert.equal(result.period.endDate, "2026-08-31")
  assert.equal(result.views.seller.metrics[1].value, 2)
  assert.equal(result.views.seller.metrics[1].previous, 2)
  assert.equal(result.views.seller.series[0].points[6].current, 1)
  assert.equal(result.avatarUrl, "https://example.com/avatar.jpg")
  assert.equal(result.generatedAt, now.toISOString())
})
test("historical cohorts include subsequent replies while operational pending counts remain current", () => {
  const input = base()
  input.conversations = [{ id: "c", buyer_id: "buyer", seller_id: "me", product_id: "p" }]
  input.messages = [message("incoming", "c", "buyer", "2026-08-31T23:00:00Z"), message("reply", "c", "me", "2026-09-01T07:00:00Z")]
  const view = buildOverview(input, 7, now, "2026-08-31").views.seller
  assert.equal(view.chat.medianMinutes, 480)
  assert.equal(view.chat.response24h, 100)
  assert.equal(view.secondary.find(m => m.id === "pending")?.value, 0)
})
test("dates and stored filters reject invalid or future selections and handle year changes", () => {
  for (const value of ["2026-02-30", "2026-13-01", "2026-10-01", "not-a-date"]) assert.throws(() => dashboardPeriod(30, now, value))
  assert.equal(dashboardPeriod(30, now, "2026-09-30").end, now.toISOString())
  assert.equal(shiftDashboardDate("2026-01-03", -7), "2025-12-27")
  assert.deepEqual(readDashboardFilters('{"days":90,"endDate":"2026-08-31"}', now), { days: 90, endDate: "2026-08-31" })
  for (const value of ["broken", '{"days":999,"endDate":"2026-02-30"}', '{"days":30,"endDate":"2026-10-01"}']) assert.deepEqual(readDashboardFilters(value, now), { days: 30, endDate: "" })
})
test("downloaded reports preserve both periods, currencies and safe spreadsheet text", () => {
  const input = base()
  input.profile = { id: "me", company_name: '=HYPERLINK("malicious")' }
  input.quotes = [quote("q", "2026-08-30T12:00:00Z")]
  input.orders = [{ id: "usd", seller_id: "me", status: "delivered", total_price: 12.5, currency: "USD", created_at: "2026-08-30T12:00:00Z" }, { id: "eur", seller_id: "me", status: "delivered", total_price: 8, currency: "EUR", created_at: "2026-08-30T12:00:00Z" }]
  const csv = dashboardReport(buildOverview(input, 7, now, "2026-08-31"), "seller")
  assert.ok(csv.startsWith("\uFEFF"))
  assert.ok(csv.includes("'=HYPERLINK"))
  assert.ok(csv.includes('"USD","12.5","0"'))
  assert.ok(csv.includes('"EUR","8","0"'))
  assert.ok(csv.includes('"2026-08-31","2026-08-24"'))
  assert.ok(csv.includes('"Anterior"'))
})
