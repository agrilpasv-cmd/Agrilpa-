const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const { randomUUID } = require("node:crypto")
const delays = [],
  logs = []
function load(file, dependencies = {}) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true
    }
  }).outputText
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => {
      if (!(name in dependencies)) throw Error(`Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    URL,
    Date,
    Buffer,
    AbortSignal,
    console: {
      error: (...items) => logs.push(items),
      warn: (...items) => logs.push(items)
    },
    setTimeout: (callback) => {
      delays.push(true)
      callback()
    },
    process: {
      env: {
        RESEND_API_KEY: "test-only",
        RESEND_FROM_EMAIL: "notifications@example.test"
      }
    }
  })
  return module.exports
}
const countries = load("lib/countries.ts")
const types = load("lib/contact/types.ts", { "@/lib/countries": countries })
const requestId = randomUUID()
let contact = {
  id: requestId,
  created_at: new Date().toISOString(),
  full_name: "Persona de prueba",
  country_code: "SV",
  country_name: "El Salvador",
  email: "visitor@example.test",
  phone: "+50370000000",
  message: "Quisiera conocer disponibilidad y presentación.",
  product_id: randomUUID(),
  product_title: "Café de especialidad",
  product_image: null,
  seller_id: randomUUID(),
  seller_name: "Empresa de prueba",
  requester_id: null,
  read_at: null,
  status: "new"
}
let admins = [
  {
    id: "1",
    role: "admin",
    email: " ADMIN@example.test ",
    full_name: "Administración de prueba"
  },
  {
    id: "2",
    role: "admin",
    email: "admin@example.test",
    full_name: "Cuenta duplicada"
  },
  {
    id: "3",
    role: "admin",
    email: "ops@example.test",
    full_name: "Operaciones de prueba"
  },
  {
    id: "4",
    role: "user",
    email: "user@example.test",
    full_name: "Usuario sin permisos"
  },
  { id: "5", role: "admin", email: "wrong", full_name: "Sin correo válido" },
  { id: "6", role: "admin", email: null, full_name: "Sin correo" }
]
const calls = [],
  accepted = new Map()
const failures = new Map()
const fakeResend = {
  Resend: class {
    emails = {
      send: async (payload, options) => {
        calls.push({ payload, options })
        const plan = failures.get(payload.to)
        if (plan?.length) {
          const error = plan.shift()
          if (error.throw) throw Error("Simulated network failure")
          return { data: null, error }
        }
        const key = options.idempotencyKey
        if (!accepted.has(key)) accepted.set(key, { id: randomUUID(), payload })
        else
          assert.equal(
            JSON.stringify(accepted.get(key).payload),
            JSON.stringify(payload)
          )
        return { data: { id: accepted.get(key).id }, error: null }
      }
    }
  }
}
const emails = load("lib/email.ts", {
  resend: fakeResend,
  "./emails/password-reset": load("lib/emails/password-reset.ts"),
  "./emails/agrilpa-logo.json": require("../lib/emails/agrilpa-logo.json")
})
let lookupError = false,
  roleQueries = 0
const client = {
  from(table) {
    const filters = {}
    const q = {
      select() {
        return q
      },
      eq(key, value) {
        filters[key] = value
        return q
      },
      order() {
        return q
      },
      async maybeSingle() {
        return { data: contact, error: lookupError ? { code: "test" } : null }
      },
      async range(start, end) {
        assert.equal(table, "users")
        assert.equal(filters.role, "admin")
        roleQueries++
        return {
          data: admins
            .filter((user) => user.role === filters.role)
            .slice(start, end + 1),
          error: null
        }
      }
    }
    return q
  }
}
const notifications = load("lib/contact/admin-notifications.ts", {
  "node:crypto": require("node:crypto"),
  "@/lib/supabase/admin": { createAdminClient: () => client },
  "@/lib/email": emails,
  "./server": { contactSelection: "id,created_at" },
  "./types": types
})
async function run() {
  const sample = emails.buildProductContactAdminEmail(
    "Administración de prueba",
    contact
  )
  assert.ok(sample.html.includes("Nueva solicitud de contacto"))
  assert.ok(sample.html.includes("Mensajes → Solicitudes de contacto"))
  assert.ok(sample.html.includes('href="https://agrilpa.com/admin/mensajes?tab=solicitudes"'))
  assert.ok(!sample.html.includes("localhost"))
  assert.ok(sample.html.includes("notification-content"))
  assert.ok(sample.html.includes('lang="es"'))
  assert.ok(sample.html.includes("<h1 "))
  assert.ok(Buffer.byteLength(sample.html) < 102400)
  assert.ok(sample.text.includes("WhatsApp: +50370000000"))
  const malicious = emails.buildProductContactAdminEmail(
    "<img src=x onerror=alert(1)>",
    {
      ...contact,
      product_title: "Producto\r\nBcc: injected@example.test",
      message: "<script>alert(1)</script>"
    }
  )
  assert.ok(!malicious.html.includes("<script>"))
  assert.ok(!malicious.html.includes("<img src=x"))
  assert.ok(!/[\r\n]/.test(malicious.subject))
  assert.ok(malicious.html.includes("&lt;script&gt;"))
  let result = await notifications.notifyProductContactAdmins(requestId)
  assert.equal(result.sent, 2)
  assert.equal(result.failed, 0)
  assert.equal(accepted.size, 2)
  assert.deepEqual(
    calls.map((call) => call.payload.to),
    ["admin@example.test", "ops@example.test"]
  )
  assert.ok(
    calls.every(
      ({ payload, options }) =>
        typeof payload.to === "string" &&
        !payload.cc &&
        !payload.bcc &&
        payload.replyTo === contact.email &&
        options.idempotencyKey.includes(requestId) &&
        options.signal
    )
  )
  const firstKeys = calls.map((call) => call.options.idempotencyKey)
  result = await notifications.notifyProductContactAdmins(requestId)
  assert.equal(accepted.size, 2)
  assert.deepEqual(
    calls.slice(2).map((call) => call.options.idempotencyKey),
    firstKeys
  )
  failures.set("ops@example.test", [
    { name: "rate_limit_exceeded", statusCode: 429 },
    { name: "application_error", statusCode: 503 }
  ])
  const beforeRetry = calls.length
  await notifications.notifyProductContactAdmins(requestId)
  assert.equal(
    calls
      .slice(beforeRetry)
      .filter((call) => call.payload.to === "ops@example.test").length,
    3
  )
  failures.set("admin@example.test", [
    { name: "validation_error", statusCode: 401 }
  ])
  const beforePermanent = calls.length
  result = await notifications.notifyProductContactAdmins(requestId)
  assert.equal(result.failed, 1)
  assert.equal(result.sent, 1)
  assert.equal(
    calls
      .slice(beforePermanent)
      .filter((call) => call.payload.to === "admin@example.test").length,
    1
  )
  const originalDate = contact.created_at
  contact = {
    ...contact,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  }
  const beforeOld = calls.length
  await notifications.notifyProductContactAdmins(requestId)
  assert.equal(calls.length, beforeOld)
  contact = { ...contact, created_at: originalDate }
  lookupError = true
  await notifications.notifyProductContactAdmins(requestId)
  assert.equal(calls.length, beforeOld)
  lookupError = false
  admins = []
  await notifications.notifyProductContactAdmins(requestId)
  assert.equal(calls.length, beforeOld)
  admins = Array.from({ length: 251 }, (_, index) => ({
    id: String(index),
    role: "admin",
    email: `admin${index}@example.test`,
    full_name: "Administrador de prueba"
  }))
  const beforePages = roleQueries
  result = await notifications.notifyProductContactAdmins(requestId)
  assert.equal(result.sent, 251)
  assert.equal(roleQueries - beforePages, 2)
  assert.ok(!JSON.stringify(logs).includes("visitor@example.test"))
  if (process.env.AGRILPA_CONTACT_EMAIL_PREVIEW_DIR) {
    const directory = path.resolve(
      process.env.AGRILPA_CONTACT_EMAIL_PREVIEW_DIR
    )
    fs.mkdirSync(directory, { recursive: true })
    const logo = fs.readFileSync("public/logo-email.png").toString("base64")
    fs.writeFileSync(
      path.join(directory, "agrilpa-contact-admin.html"),
      sample.html.replace(
        "https://agrilpa.com/logo-email.png",
        `data:image/png;base64,${logo}`
      )
    )
    fs.writeFileSync(
      path.join(directory, "agrilpa-contact-admin.txt"),
      sample.text
    )
  }
  console.log(
    "PASS: notification design, escaping, registered admin recipients, privacy, pagination, idempotency, transient retries, permanent failures and old-request guard. No emails or database writes."
  )
}
run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
