const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file, dependencies = {}) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
  vm.runInNewContext(code, {
    module, exports: module.exports, URL, Date,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`)
      return dependencies[name]
    }
  })
  return module.exports
}
const plain = value => JSON.parse(JSON.stringify(value))
const periodModule = load("lib/dashboard/period.ts")
const dashboard = load("lib/admin/dashboard.ts", { "@/lib/dashboard/period": periodModule })
const server = load("lib/admin/dashboard-server.ts", {
  "@/lib/dashboard/period": periodModule,
  "./dashboard": dashboard
})
const now = new Date("2026-10-26T18:30:00.000Z")
const period = periodModule.dashboardPeriod(7, now)
assert.equal(period.start, "2026-10-20T06:00:00.000Z")
assert.equal(period.end, now.toISOString())
assert.equal(period.previousStart, "2026-10-13T06:00:00.000Z")
assert.equal(period.previousEnd, "2026-10-19T18:30:00.000Z")
assert.equal(period.timezone, "America/El_Salvador")

const dates = [
  period.start, "2026-10-21T05:59:59.999Z", "2026-10-21T06:00:00.000Z",
  "2026-10-26T18:29:59.999Z", period.end,
  period.previousStart, "2026-10-19T18:29:59.999Z", period.previousEnd,
  "2026-10-19T20:00:00.000Z", "invalid"
]
const daily = dashboard.adminDailySeries(dates, period)
assert.equal(daily.length, 7)
assert.deepEqual(plain(daily[0]), { date: "2026-10-20", previousDate: "2026-10-13", current: 2, previous: 1 })
assert.equal(daily[1].current, 1)
assert.equal(daily[6].current, 1)
assert.equal(daily[6].previous, 1)
assert.equal(daily.reduce((sum, point) => sum + point.current, 0), 4)
assert.equal(daily.reduce((sum, point) => sum + point.previous, 0), 2)
assert.equal(dashboard.adminDateInWindow(period.start, period.start, period.end), true)
assert.equal(dashboard.adminDateInWindow(period.end, period.start, period.end), false)
for (const days of [7, 30, 90]) assert.equal(dashboard.adminDailySeries([], periodModule.dashboardPeriod(days, now)).length, days)
const historical = periodModule.dashboardPeriod(7, now, "2026-09-30")
assert.equal(historical.start, "2026-09-24T06:00:00.000Z")
assert.equal(historical.end, "2026-10-01T06:00:00.000Z")
assert.equal(historical.previousEnd, historical.start)
assert.throws(() => periodModule.dashboardPeriod(7, now, "2026-02-30"))
assert.throws(() => periodModule.dashboardPeriod(7, now, "2026-10-27"))

const user = (id, created_at, role = "user", user_type = "vendedor", source = "Google") => ({ id, created_at, role, user_type, how_heard_about_us: source })
const sourceInput = {
  users: [
    user("old", "2020-01-01T00:00:00Z"), user("current", period.start),
    user("previous", period.previousStart), user("admin", period.start, "admin"),
    user("unknown-role", period.start, null, null, null),
    user("future", now.toISOString()), user("invalid", "invalid")
  ],
  products: [
    { id: "visible", created_at: period.start, is_visible: true },
    { id: "hidden", created_at: period.start, is_visible: false },
    { id: "old", created_at: "2020-01-01T00:00:00Z", is_visible: true }
  ],
  quotations: [
    { id: "accepted", created_at: period.start, status: "accepted" },
    { id: "other", created_at: period.start, status: "archived" },
    { id: "pending", created_at: period.previousStart, status: "pending" },
    { id: "future", created_at: period.end, status: "pending" }
  ],
  contacts: [], pendingQuotations: 9, pendingContacts: 0, supportUnreadTickets: 2, warnings: []
}
const overview = dashboard.buildAdminDashboardOverview(sourceInput, 7, now)
const metric = (result, id) => result.metrics.find(item => item.id === id)
assert.equal(metric(overview, "users").value, 4)
assert.equal(metric(overview, "users").current, 2)
assert.equal(metric(overview, "users").previous, 1)
assert.equal(metric(overview, "products").value, 2)
assert.equal(metric(overview, "products").current, 2)
assert.equal(metric(overview, "quotations").value, 2)
assert.equal(metric(overview, "quotations").previous, 1)
assert.equal(metric(overview, "contacts").value, 0)
assert.equal(overview.pending.find(item => item.id === "quotations").value, 9)
assert.equal(overview.quotationStatuses.reduce((sum, item) => sum + item.value, 0), 3)
assert.ok(overview.quotationStatuses.some(item => item.label === "Pendientes" && item.value === 1))
assert.ok(overview.quotationStatuses.some(item => item.label === "Otros estados" && item.value === 1))
assert.equal(overview.community.reduce((sum, item) => sum + item.value, 0), 4)
assert.ok(overview.community.some(item => item.label === "Sin clasificar" && item.value === 1))
assert.equal(dashboard.adminAcquisitionSource("  TIK TOK  "), "TikTok")
assert.equal(dashboard.adminAcquisitionSource("Recomendación de un amigo/colega"), "Recomendación")
assert.equal(dashboard.adminAcquisitionSource(""), "Sin indicar")
assert.equal(dashboard.adminAcquisitionSource("  Encuentro  agrícola "), "Encuentro agrícola")
assert.equal(dashboard.adminQuotationStatusLabel(null), "Otros estados")
assert.equal(dashboard.adminQuotationStatusLabel(" ACCEPTED "), "Aceptadas")

const unavailable = dashboard.buildAdminDashboardOverview({
  ...sourceInput, users: null, products: null, quotations: null, contacts: null,
  pendingQuotations: null, pendingContacts: null, supportUnreadTickets: null,
  warnings: [{ source: "contacts", message: "Fuente de prueba ausente." }]
}, 7, now)
for (const item of unavailable.metrics) {
  assert.equal(item.value, null)
  assert.equal(item.current, null)
  assert.equal(item.previous, null)
  assert.equal(item.history, null)
  assert.equal(unavailable.series[item.id], null)
}
assert.equal(unavailable.community, null)
assert.equal(unavailable.acquisition, null)
assert.equal(unavailable.quotationStatuses, null)
assert.ok(unavailable.pending.every(item => item.value === null))
const historicalOverview = dashboard.buildAdminDashboardOverview(sourceInput, 7, now, "2026-09-30")
assert.equal(metric(historicalOverview, "users").value, 4)
assert.equal(metric(historicalOverview, "users").current, 0)
assert.deepEqual(plain(historicalOverview.quotationStatuses), plain(overview.quotationStatuses))
assert.equal(metric(historicalOverview, "quotations").value, 0)

const message = (conversation_id, sender_id = "user", read_at = null, created_at = period.start) => ({ conversation_id, sender_id, read_at, created_at })
assert.equal(dashboard.countUnreadSupportTickets(["a", "b", "c"], [
  message("a"), message("a"), message("b"), message("c", "admin-one"),
  message("c", "admin-two"), message("c", "user", period.start),
  message("not-support"), message("c", "user", null, now.toISOString()),
  message("c", "user", null, "invalid")
], ["admin-one", "admin-two"], now), 2)

function fakeDatabase(tables, { failures = {}, pageCap = 1000 } = {}) {
  const calls = []
  return {
    calls,
    from(table) {
      let filters = [], start = 0, end = 999, head = false, sort
      const query = {
        select(columns, options = {}) { head = options.head === true; return query },
        lt(column, value) { filters.push(row => Date.parse(row[column]) < Date.parse(value)); return query },
        gte(column, value) { filters.push(row => Date.parse(row[column]) >= Date.parse(value)); return query },
        eq(column, value) { filters.push(row => row[column] === value); return query },
        is(column, value) { filters.push(row => row[column] === value); return query },
        in(column, values) { filters.push(row => values.includes(row[column])); return query },
        order(column) { sort = column; return query },
        range(first, last) { start = first; end = last; return query },
        then(resolve, reject) {
          calls.push({ table, start, end, head, sort })
          if (failures[table]) return Promise.resolve({ data: null, count: null, error: { code: failures[table] } }).then(resolve, reject)
          const rows = (tables[table] || []).filter(row => filters.every(filter => filter(row))).sort((a, b) => String(a[sort]).localeCompare(String(b[sort])))
          return Promise.resolve({ data: head ? null : rows.slice(start, Math.min(end + 1, start + pageCap)), count: rows.length, error: null }).then(resolve, reject)
        }
      }
      return query
    }
  }
}

async function run() {
  const rows = Array.from({ length: 2507 }, (_, id) => ({ id }))
  let requests = []
  const paged = await server.readAdminDashboardRows((start, end) => {
    requests.push([start, end])
    return Promise.resolve({ data: rows.slice(start, end + 1), count: rows.length, error: null })
  })
  assert.equal(paged.length, 2507)
  assert.deepEqual(requests, [[0, 999], [1000, 1999], [2000, 2999]])
  const capped = await server.readAdminDashboardRows((start, end) => Promise.resolve({ data: rows.slice(start, Math.min(end + 1, start + 333)), count: rows.length, error: null }))
  assert.equal(capped.length, 2507)
  assert.equal(new Set(capped.map(row => row.id)).size, 2507)
  const noCount = await server.readAdminDashboardRows((start, end) => Promise.resolve({ data: rows.slice(start, end + 1), count: null, error: null }))
  assert.equal(noCount.length, 2507)
  await assert.rejects(() => server.readAdminDashboardRows(() => Promise.resolve({ data: null, count: null, error: { code: "PGRST205" } })), error => error.code === "PGRST205")
  await assert.rejects(() => server.readAdminDashboardRows(start => Promise.resolve(start ? { data: null, count: null, error: { code: "57014" } } : { data: rows.slice(0, 1000), count: rows.length, error: null })), error => error.code === "57014")
  await assert.rejects(() => server.readAdminDashboardRows(start => Promise.resolve({ data: start ? [] : rows.slice(0, 1000), count: rows.length, error: null })))

  const tables = {
    users: Array.from({ length: 1103 }, (_, index) => user(`user-${String(index).padStart(5, "0")}`, index % 2 ? period.start : period.previousStart, index === 0 ? "admin" : "user")),
    user_products: Array.from({ length: 1304 }, (_, index) => ({ id: `product-${String(index).padStart(5, "0")}`, created_at: period.start, is_visible: index % 2 === 0 })),
    quotations: [...sourceInput.quotations, { id: "old-pending", created_at: "2020-01-01T00:00:00Z", status: "pending" }],
    product_contact_requests: [{ id: "new", created_at: period.start, status: "new" }, { id: "old-new", created_at: "2020-01-01T00:00:00Z", status: "new" }],
    conversations: Array.from({ length: 105 }, (_, index) => ({ id: `support-${index}`, product_id: null, created_at: period.start })),
    messages: [
      { id: "1", ...message("support-1") }, { id: "2", ...message("support-1") },
      { id: "3", ...message("support-102") }, { id: "4", ...message("support-103", "user-00000") }
    ]
  }
  const db = fakeDatabase(tables, { pageCap: 350 })
  const result = await server.loadAdminDashboardOverview(db, 7, now)
  assert.equal(metric(result, "users").value, 1102)
  assert.equal(metric(result, "products").value, 652)
  assert.equal(metric(result, "products").current, 1304)
  assert.equal(metric(result, "contacts").value, 1)
  assert.equal(result.pending.find(item => item.id === "contacts").value, 2)
  assert.equal(result.pending.find(item => item.id === "quotations").value, 2)
  assert.equal(result.quotationStatuses.reduce((sum, item) => sum + item.value, 0), 4)
  assert.ok(result.quotationStatuses.some(item => item.label === "Pendientes" && item.value === 2))
  assert.equal(metric(result, "quotations").value, 2)
  assert.equal(metric(result, "quotations").previous, 1)
  const historicalResult = await server.loadAdminDashboardOverview(fakeDatabase(tables), 7, now, "2020-01-01")
  assert.deepEqual(plain(historicalResult.quotationStatuses), plain(result.quotationStatuses))
  assert.equal(metric(historicalResult, "quotations").value, 1)
  assert.equal(result.pending.find(item => item.id === "support").value, 2)
  assert.equal(result.warnings.length, 0)
  assert.ok(db.calls.filter(call => !call.head).every(call => call.sort === "id"))
  assert.ok(db.calls.filter(call => call.table === "messages").length >= 2)
  for (const failure of ["PGRST205", "57014"]) {
    const partial = await server.loadAdminDashboardOverview(fakeDatabase(tables, { failures: { product_contact_requests: failure } }), 7, now)
    assert.equal(metric(partial, "contacts").value, null)
    assert.equal(partial.series.contacts, null)
    assert.equal(partial.pending.find(item => item.id === "contacts").value, null)
    assert.equal(metric(partial, "users").value, 1102)
    assert.ok(partial.warnings.some(item => item.source === "contacts"))
  }
  const failedUsers = await server.loadAdminDashboardOverview(fakeDatabase(tables, { failures: { users: "57014" } }), 7, now)
  assert.equal(failedUsers.pending.find(item => item.id === "support").value, null)
  assert.equal(failedUsers.community, null)
  assert.equal(metric(failedUsers, "products").value, 652)
  assert.deepEqual(plain(failedUsers.warnings.map(item => item.source).sort()), ["support", "users"])

  let permissionStatus = 401, loaderCalls = [], legacyClientCalls = 0
  const responseModule = { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200, headers: options.headers || {} }) } }
  const permissionModule = { requireContactAdmin: async () => permissionStatus ? { response: { status: permissionStatus, body: { error: "Denied in test" } } } : { admin: { test: true } } }
  const route = load("app/api/admin/overview/route.ts", {
    "next/server": responseModule,
    "@/lib/contact/server": permissionModule,
    "@/lib/admin/dashboard-server": { loadAdminDashboardOverview: async (...args) => { loaderCalls.push(args); return result } },
    "@/lib/dashboard/period": periodModule
  })
  const request = params => ({ url: `http://localhost/api/admin/overview${params}` })
  for (const status of [401, 403]) {
    permissionStatus = status
    assert.equal((await route.GET(request("?days=7"))).status, status)
    assert.equal(loaderCalls.length, 0)
  }
  permissionStatus = 0
  for (const query of ["?days=8", "?days=NaN", "?days=-7", "?days=7&endDate=invalid", "?days=7&endDate=2026-02-30", "?days=7&endDate=2999-01-01"]) {
    assert.equal((await route.GET(request(query))).status, 400, query)
    assert.equal(loaderCalls.length, 0)
  }
  const response = await route.GET(request("?days=7&endDate=2020-01-01"))
  assert.equal(response.status, 200)
  assert.match(response.headers["Cache-Control"], /private.*no-store/)
  assert.equal(loaderCalls[0][1], 7)
  assert.equal(loaderCalls[0][3], "2020-01-01")
  await route.GET(request(""))
  assert.equal(loaderCalls[1][1], 30)
  const legacy = load("app/api/admin/stats/route.ts", {
    "next/server": responseModule,
    "@/lib/contact/server": permissionModule,
    "@supabase/supabase-js": { createClient() { legacyClientCalls++; throw new Error("Do not contact a real database") } }
  })
  for (const status of [401, 403]) {
    permissionStatus = status
    assert.equal((await legacy.GET(request(""))).status, status)
    assert.equal(legacyClientCalls, 0)
  }
  console.log("PASS admin dashboard: timezone and partial periods, snapshots and flows, null vs zero, statuses, pagination beyond 1000, partial failures, unread support deduplication, 401/403 guards and 400 filters. No network calls or database writes.")
}
run().catch(error => { console.error(error); process.exitCode = 1 })
