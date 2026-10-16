const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function loadModule(filename, dependencies) {
  const module = { exports: {} }
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  vm.runInNewContext(compiled, {
    exports: module.exports, module, require: name => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    URL, Date, console: { error() {} },
    process: { env: { RESEND_API_KEY: 'test-only', RESEND_FROM_EMAIL: 'test@example.test' } },
  })
  return module.exports
}

const template = loadModule('lib/emails/password-reset.ts', {})
const logo = require('../lib/emails/agrilpa-logo.json')
const { buildPasswordRecoveryUrl } = loadModule('lib/auth-email-url.ts', {})
const resetUrl = buildPasswordRecoveryUrl('TEST_ONLY', {})
const sample = template.buildPasswordResetEmail({ recipientName: 'Alejandro Peñate', resetUrl, year: 2026 })
assert.equal(sample.subject, 'Restablece tu contraseña de Agrilpa')
assert.ok(sample.html.includes('Hola Alejandro Peñate,'))
assert.equal((sample.html.match(/href="https:\/\/agrilpa\.com\/auth\/callback\?token_hash=TEST_ONLY&amp;type=recovery"/g) || []).length, 2)
assert.ok(sample.text.includes(resetUrl))
assert.ok(sample.html.includes('cid:agrilpa-logo'))
assert.ok(Buffer.byteLength(sample.html) < 102400)
assert.equal(Buffer.from(logo.content, 'base64').subarray(1, 4).toString(), 'PNG')
assert.ok(!sample.html.includes('1 hora'))
const escaped = template.buildPasswordResetEmail({ recipientName: '<img src=x onerror=alert(1)> & "Nombre"', resetUrl })
assert.ok(!escaped.html.includes('<img src=x'))
assert.ok(escaped.html.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;Nombre&quot;'))
assert.ok(template.buildPasswordResetEmail({ recipientName: '   ', resetUrl }).html.includes('>Hola,</p>'))
assert.throws(() => template.buildPasswordResetEmail({ recipientName: 'Nombre', resetUrl: 'javascript:alert(1)' }))

let captured, providerError = null
const email = loadModule('lib/email.ts', {
  resend: { Resend: class { emails = { send: async message => { captured = message; return { data: { id: 'test-message' }, error: providerError } } } } },
  './emails/password-reset': template,
  './emails/agrilpa-logo.json': logo,
})

async function run() {
  const result = await email.sendPasswordResetEmail({ recipientEmail: 'recipient@example.test', recipientName: 'Alejandro Peñate', resetUrl })
  assert.equal(result.success, true)
  assert.equal(captured.from, 'Agrilpa <test@example.test>')
  assert.equal(captured.to, 'recipient@example.test')
  assert.equal(captured.attachments[0].contentId, 'agrilpa-logo')
  assert.equal(captured.attachments[0].contentType, 'image/png')
  assert.equal(captured.attachments[0].content, logo.content)
  assert.ok(captured.html.includes('TEST_ONLY&amp;type=recovery'))
  assert.ok(captured.text.includes(resetUrl))
  providerError = { message: 'Simulated delivery error' }
  assert.equal((await email.sendPasswordResetEmail({ recipientEmail: 'recipient@example.test', recipientName: '', resetUrl })).success, false)
  console.log('PASS: greeting, escaped data, original recovery URL, plain text, inline logo and send/error contract. No emails sent.')

  if (process.env.AGRILPA_EMAIL_PREVIEW_DIR) {
    const directory = path.resolve(process.env.AGRILPA_EMAIL_PREVIEW_DIR)
    fs.mkdirSync(directory, { recursive: true })
    const preview = sample.html.replace('cid:agrilpa-logo', `data:image/png;base64,${logo.content}`)
    fs.writeFileSync(path.join(directory, 'agrilpa-password-reset.html'), preview)
    fs.writeFileSync(path.join(directory, 'agrilpa-password-reset.txt'), sample.text)
    fs.writeFileSync(path.join(directory, 'agrilpa-password-reset-logo.png'), Buffer.from(logo.content, 'base64'))
    console.log('Preview exported with a nonfunctional test token.')
  }
}

run().catch(error => { console.error(error); process.exitCode = 1 })
