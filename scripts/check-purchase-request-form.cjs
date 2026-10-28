const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")
function load(file, deps = {}) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { module, exports: module.exports, require(name) { if (!(name in deps)) throw new Error(`Unexpected dependency: ${name}`); return deps[name] }, Date, URL, FormData, Request, Response, process: { env: {} }, console: { error() {} } })
  return module.exports
}
const countries = load("lib/countries.ts")
const constants = load("lib/constants.ts")
const contact = load("lib/contact/types.ts", { "@/lib/countries": countries })
const form = load("lib/purchase-requests/form.ts", { "@/lib/constants": constants, "@/lib/countries": countries, "@/lib/contact/types": contact })
const valid = { ...form.emptyPurchaseDraft, productName: "Café de prueba para compra", category: "Café", quantity: "500.5", unit: "kg", description: "Descripción de prueba", specs: "Empaque de prueba", country: "El Salvador", deliveryState: "Santa Ana", deliveryAddress: "Dirección de prueba", desiredDate: "2099-12-01", budget: "A convenir", sourceType: "cualquiera", contactMethod: "email", contactValue: "buyer@example.test" }
assert.equal(Object.keys(form.validatePurchaseDraft(valid)).length, 0)
for (const quantity of ["0", "-1", "1e4", "500kg", "1.2.3", "Infinity", "9007199254740992"]) assert.ok(form.validatePurchaseDraft({ ...valid, quantity }).quantity)
for (const unit of ["bad", "toString", "constructor"]) assert.ok(form.validatePurchaseDraft({ ...valid, unit }).unit)
for (const contactValue of ["wrong", "a@b", "a@b.", "a@@b.com"]) assert.ok(form.validatePurchaseDraft({ ...valid, contactValue }).contactValue)
for (const contactValue of ["+50370000000", "+1 268 7000000"]) assert.equal(form.validatePurchaseDraft({ ...valid, contactMethod: "whatsapp", contactValue }).contactValue, undefined)
for (const contactValue of ["letters", "+5037000abcd", "123", "+1234567890123456"]) assert.ok(form.validatePurchaseDraft({ ...valid, contactMethod: "whatsapp", contactValue }).contactValue)
for (const desiredDate of ["2026-02-30", "2026-12-00", "invalid", "2025-12-01"]) assert.ok(form.validatePurchaseDraft({ ...valid, desiredDate }, "2026-10-27").desiredDate)
assert.equal(form.validatePurchaseDraft({ ...valid, desiredDate: "2026-10-27" }, "2026-10-27").desiredDate, undefined)
assert.ok(form.validatePurchaseDraft({ ...valid, country: "Unknown" }).country)
assert.ok(form.validatePurchaseDraft({ ...valid, description: " " }).description)
assert.ok(form.validatePurchaseDraft({ ...valid, specs: "x".repeat(2001) }).specs)
assert.ok(form.validatePurchaseDraft({ ...valid, sourceType: "invalid" }).sourceType)
assert.ok(form.validatePurchaseDraft({ ...valid, contactMethod: "invalid" }).contactMethod)
let user = null, inserts = [], insertError = null
const admin = { from(table) { const q = { select() { return q }, eq() { return q }, insert(value) { inserts.push(value); return q }, async single() { return table === "users" ? { data: { company_name: "Empresa de prueba", email: "buyer@example.test" }, error: null } : { data: insertError ? null : { id: "test-request" }, error: insertError } } }; return q } }
let clients = 0
const api = load("app/api/solicitud-compra/route.ts", { "@/lib/purchase-requests/form": form, "next/server": { NextResponse: { json(data, options) { return Response.json(data, options) } } }, "@supabase/supabase-js": { createClient() { clients++; return clients === 1 ? admin : { auth: { async getUser() { return { data: { user }, error: user ? null : { message: "unauthorized" } } } } } } } })
function request(draft = valid, authorized = true) { const body = new FormData(); for (const [key, value] of Object.entries(draft)) body.append(key, value); return new Request("http://localhost:3001/api/solicitud-compra", { method: "POST", headers: authorized ? { Authorization: "Bearer isolated-test" } : {}, body }) }
async function run() {
  assert.equal((await api.POST(request(valid, false))).status, 401)
  assert.equal((await api.POST(request())).status, 401)
  assert.equal(inserts.length, 0)
  user = { id: "11111111-1111-4111-8111-111111111111", email: "buyer@example.test" }
  const invalid = await api.POST(request({ ...valid, quantity: "invalid", contactValue: "invalid@example" }))
  assert.equal(invalid.status, 400);const invalidBody = await invalid.json();assert.ok(invalidBody.fields.quantity);assert.ok(invalidBody.fields.contactValue);assert.equal(inserts.length, 0)
  const result = await api.POST(request(valid));assert.equal(result.status, 200);assert.equal((await result.json()).success, true);assert.equal(inserts[0].quantity, "500.5");assert.equal(inserts[0].user_id, user.id);assert.equal(inserts[0].country, "El Salvador");assert.equal(inserts[0].contact_value, "buyer@example.test");assert.ok(Date.parse(inserts[0].expires_at) > Date.now())
  insertError = { message: "isolated failure" };assert.equal((await api.POST(request(valid))).status, 500)
  console.log("PASS: purchase field validation, invalid dates, numeric quantities, valid email/phone, unit allowlist, authentication, invalid payload blocked before insertion, canonical saved fields and failure response. No network or database writes.")
}
run().catch(error => { console.error(error); process.exitCode = 1 })
