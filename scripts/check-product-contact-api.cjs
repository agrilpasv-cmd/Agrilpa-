const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const { randomUUID } = require("node:crypto")
function load(file, deps = {}, environment = {}) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => {
      if (!(name in deps)) throw Error(`Unexpected dependency ${name}`)
      return deps[name]
    },
    console: { error() {} },
    URL,
    Date,
    Buffer,
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: "test-only", ...environment } }
  })
  return module.exports
}
const countries = load("lib/countries.ts")
const types = load("lib/contact/types.ts", { "@/lib/countries": countries })
const valid = {
  fullName: "Visitante de prueba",
  countryCode: "SV",
  email: "person@example.test",
  phone: "+503 7000 0000",
  message: "Quisiera información."
}
assert.equal(Object.keys(types.validateContact(valid)).length, 0)
assert.ok(types.validateContact({ ...valid, email: "wrong" }).email)
assert.ok(types.validateContact({ ...valid, phone: "70000000" }).phone)
assert.ok(types.validateContact({ ...valid, countryCode: "ZZ" }).countryCode)
assert.equal(types.normalizeContactPhone("+503 (7000)-0000"), "+50370000000")
for (const fullName of [
  "María-José O’Connor",
  "李雷",
  "أحمد علي",
  "D'Arcy",
  "J. Pérez"
])
  assert.equal(
    types.validateContact({ ...valid, fullName }).fullName,
    undefined
  )
for (const fullName of ["Juan123", "<script>", "Ana@correo.com", "1234"])
  assert.ok(types.validateContact({ ...valid, fullName }).fullName)
for (const email of [
  "ventas+compras@empresa.com.sv",
  "first.last@example.travel",
  "a_b@example-domain.co",
  "o'connor@example.com"
])
  assert.equal(types.validateContact({ ...valid, email }).email, undefined)
for (const email of [
  "persona@empresa",
  "persona@empresa.",
  "persona@empresa.c",
  "persona@empresa..com",
  "persona@@empresa.com",
  "persona@-empresa.com",
  "persona@empresa_.com",
  "a..b@empresa.com",
  ".a@empresa.com",
  "a@empresa.123",
  "a b@empresa.com"
])
  assert.ok(types.validateContact({ ...valid, email }).email)
for (const phone of ["+5037000ab00", "+50370000000e2", "+5037000000000000"])
  assert.ok(types.validateContact({ ...valid, phone }).phone)
let user = null,
  role = "user",
  rpcPayload = null,
  rpcError = null,
  settingData = null,
  lastChanges = null
const admin = {
  from(table) {
    const q = {
      select() {
        return q
      },
      eq() {
        return q
      },
      update(value) {
        lastChanges = value
        return q
      },
      async maybeSingle() {
        return { data: table === "users" ? { role } : settingData, error: null }
      }
    }
    return q
  },
  async rpc(name, values) {
    rpcPayload = { name, ...values }
    return { data: { id: "receipt" }, error: rpcError }
  }
}
const notificationTasks = []
const notifiedContacts = []
const notificationDependency = {
  notifyProductContactAdmins: async (id) => {
    notifiedContacts.push(id)
  }
}
const next = {
  "next/server": {
    after: (task) => {
      notificationTasks.push(task)
    },
    NextResponse: {
      json: (body, options = {}) => ({ body, status: options.status || 200 })
    }
  }
}
const clients = {
  "@/lib/supabase/server": {
    createClient: async () => ({
      auth: { getUser: async () => ({ data: { user }, error: null }) }
    })
  },
  "@/lib/supabase/admin": { createAdminClient: () => admin }
}
const server = load("lib/contact/server.ts", { ...next, ...clients })
const localMode = load("lib/contact/local-mode.ts")
const api = load("app/api/contact/product/route.ts", {
  ...next,
  ...clients,
  "node:crypto": require("node:crypto"),
  "@/lib/countries": countries,
  "@/lib/contact/types": types,
  "@/lib/contact/server": server,
  "@/lib/contact/local-mode": localMode,
  "@/lib/contact/admin-notifications": notificationDependency
})
const modeApi = load("app/api/admin/contact-mode/route.ts", {
  ...next,
  "@/lib/contact/server": server
})
const request = (body, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/contact/product", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body)
  })
async function run() {
  for (const environment of [
    { NODE_ENV: "production", AGRILPA_LOCAL_CONTACT_MODE: "admin_form" },
    { NODE_ENV: "development" }
  ]) {
    assert.equal(
      load("lib/contact/local-mode.ts", {}, environment).isLocalContactPreview(
        request({})
      ),
      false
    )
  }
  const previewMode = load(
    "lib/contact/local-mode.ts",
    {},
    { NODE_ENV: "development", AGRILPA_LOCAL_CONTACT_MODE: "admin_form" }
  )
  assert.equal(previewMode.isLocalContactPreview(request({})), true)
  assert.equal(
    previewMode.isLocalContactPreview(
      new Request("https://agrilpa.com/api/contact/mode")
    ),
    false
  )
  const payload = {
    ...valid,
    productId: randomUUID(),
    submissionKey: randomUUID(),
    sellerId: "forged",
    requesterId: "forged",
    productTitle: "forged"
  }
  let result = await api.POST(request(payload))
  assert.equal(result.status, 201)
  assert.equal(notificationTasks.length, 1)
  assert.equal(notifiedContacts.length, 0)
  await notificationTasks.shift()()
  assert.equal(notifiedContacts[0], "receipt")
  assert.equal(rpcPayload.p_requester_id, null)
  assert.equal(rpcPayload.p_phone, "+50370000000")
  assert.equal(rpcPayload.p_visitor_hash.length, 64)
  assert.equal(rpcPayload.productTitle, undefined)
  assert.equal(rpcPayload.sellerId, undefined)
  for (const invalid of [
    { fullName: "Persona123" },
    { email: "persona@dominio" },
    { phone: "+5037000abc0" }
  ]) {
    rpcPayload = null
    const rejected = await api.POST(request({ ...payload, ...invalid }))
    assert.equal(rejected.status, 400)
    assert.equal(rpcPayload, null)
  }
  const previewDependencies = {
    ...next,
    ...clients,
    "node:crypto": require("node:crypto"),
    "@/lib/countries": countries,
    "@/lib/contact/types": types,
    "@/lib/contact/server": server,
    "@/lib/contact/local-mode": previewMode,
    "@/lib/contact/admin-notifications": notificationDependency
  }
  const previewApi = load(
    "app/api/contact/product/route.ts",
    previewDependencies
  )
  rpcPayload = null
  const scheduledBeforePreview = notificationTasks.length
  const previewResult = await previewApi.POST(request(payload))
  assert.equal(previewResult.status, 503)
  assert.equal(notificationTasks.length, scheduledBeforePreview)
  assert.equal(rpcPayload, null)
  const publicPreviewMode = load(
    "app/api/contact/mode/route.ts",
    previewDependencies
  )
  assert.equal(
    (await publicPreviewMode.GET(request({}))).body.mode,
    "admin_form"
  )
  user = { id: randomUUID() }
  result = await api.POST(request(payload))
  assert.equal(rpcPayload.p_requester_id, user.id)
  result = await api.POST(request(payload, "https://untrusted.example"))
  assert.equal(result.status, 403)
  result = await api.POST(request({ ...payload, email: "" }))
  assert.equal(result.status, 400)
  assert.ok(result.body.fields.email)
  result = await api.POST(request({ ...payload, website: "spam" }))
  assert.equal(result.status, 400)
  rpcError = { code: "22023", message: "contact_mode_changed" }
  result = await api.POST(request(payload))
  assert.equal(result.status, 409)
  assert.equal(result.body.code, "MODE_CHANGED")
  rpcError = { code: "22023", message: "contact_rate_limit" }
  result = await api.POST(request(payload))
  assert.equal(result.status, 429)
  rpcError = null
  user = null
  assert.equal((await modeApi.GET()).status, 401)
  user = { id: randomUUID() }
  role = "user"
  assert.equal((await modeApi.GET()).status, 403)
  role = "admin"
  assert.equal((await modeApi.GET()).body.ready, false)
  settingData = { mode: "chat", updated_at: "2026-10-26T10:00:00Z" }
  assert.equal((await modeApi.GET()).body.ready, true)
  result = await modeApi.PATCH(
    request({ mode: "admin_form", updatedAt: settingData.updated_at })
  )
  assert.equal(result.status, 200)
  assert.equal(lastChanges.updated_by, user.id)
  result = await modeApi.PATCH(
    request({ mode: "invalid", updatedAt: settingData.updated_at })
  )
  assert.equal(result.status, 400)
  result = await modeApi.PATCH(
    request(
      { mode: "admin_form", updatedAt: settingData.updated_at },
      "https://untrusted.example"
    )
  )
  assert.equal(result.status, 403)
  for (const endpoint of [
    "app/api/admin/product-contacts/route.ts",
    "app/api/admin/product-contacts/[id]/route.ts",
    "app/api/admin/product-contacts/unread-count/route.ts"
  ]) {
    const handler = load(endpoint, {
      ...next,
      "@/lib/contact/server": server,
      "@/lib/contact/types": types
    })
    user = null
    const method = handler.GET || handler.PATCH
    assert.equal(
      (
        await method(request({}), {
          params: Promise.resolve({ id: randomUUID() })
        })
      ).status,
      401
    )
    user = { id: randomUUID() }
    role = "user"
    assert.equal(
      (
        await method(request({}), {
          params: Promise.resolve({ id: randomUUID() })
        })
      ).status,
      403
    )
  }
  console.log(
    "PASS: contact validation, anonymous and signed-in identity, mode/admin authorization, origin checks, limits and private inbox guards. No network calls."
  )
}
run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
