const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
// Run with Playwright available, or set AGRILPA_PLAYWRIGHT_MODULE to its installed path.
const { chromium } = require(process.env.AGRILPA_PLAYWRIGHT_MODULE || 'playwright')

const base = process.env.AGRILPA_BASE_URL || 'http://localhost:3000'
const output = path.resolve('.next/company-profile-qa')
fs.mkdirSync(output, { recursive: true })
const userId = '11111111-1111-4111-8111-111111111111'
const profile = {
  id: userId, full_name: 'María Rivera', company_name: 'Cooperativa Tierra Verde', country: 'El Salvador',
  bio: 'Somos una cooperativa de productores dedicada al cultivo y comercialización de café y cacao. Trabajamos junto a familias del campo para ofrecer productos de origen, con atención directa y condiciones claras para cada negocio.',
  company_website: 'tierraverde.example', address: 'Santa Ana, El Salvador', created_at: '2024-04-01T12:00:00Z',
  avatar_url: null, is_pro: true,
  export_history: [
    { type: 'certificate', label: 'Ficha técnica de café de origen', url: 'https://example.com/ficha.pdf', uploaded_at: '2025-05-01' },
    { type: 'container_photo', label: 'Preparación de lote para exportación', url: `${base}/coffee-plantation-salvador.jpg`, uploaded_at: '2025-05-01' },
    { type: 'certificate', label: 'Unsafe link', url: 'javascript:alert(1)' },
  ],
}
const products = [
  { id: '22222222-2222-4222-8222-222222222222', title: 'Café de origen · Grano verde', category: 'Café', image: '/cafe-premium-salvadoreno.jpg', price: '6.25', currency: 'USD', country: 'El Salvador', state: 'Santa Ana', unit: 'kg', price_type: 'fixed', min_order_quantity: 500, created_at: '2026-08-01' },
  { id: '33333333-3333-4333-8333-333333333333', title: 'Cacao fermentado premium', category: 'Cacao', image: '/cacao-grano-fermentado-chocolate.jpg', price: null, currency: 'USD', country: 'El Salvador', state: 'Sonsonate', unit: 'TM', price_type: 'quote', min_order_quantity: 1, created_at: '2026-07-01' },
  { id: '44444444-4444-4444-8444-444444444444', title: 'Café arábica tostado', category: 'Café', image: '/cafe-arabica-grano-tostado.jpg', price: '12', currency: 'EUR', country: 'Guatemala', state: 'Antigua', unit: 'kg', price_type: 'fixed', min_order: '100 kg', created_at: '2026-06-01' },
]

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const errors = []
  try {
    // Exercise the real API and the actual public company route first.
    const live = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    live.on('pageerror', error => errors.push(error.message))
    const catalogResponse = await live.request.get(`${base}/api/products/get-user-products`)
    const catalog = await catalogResponse.json()
    const actualProduct = catalog.products?.find(item => item.user_id)
    assert.ok(actualProduct, 'Real catalogue must contain a company product')
    const profileResponse = await live.request.get(`${base}/api/user/public-profile?userId=${actualProduct.user_id}`)
    assert.equal(profileResponse.status(), 200)
    const actualProfile = (await profileResponse.json()).profile
    assert.ok(!('email' in actualProfile) && !('phone' in actualProfile) && !('plan_type' in actualProfile), 'Private fields stay out of public profile')
    const byUser = await live.request.get(`${base}/api/products/get-products-by-user?userId=${actualProduct.user_id}`)
    assert.equal(byUser.status(), 200)
    const actualProducts = (await byUser.json()).products
    assert.ok(actualProducts.length)
    assert.ok(actualProducts.every(item => item.image === `/api/products/${item.id}/thumb`))
    const thumb = await live.request.get(`${base}${actualProducts[0].image}`)
    assert.equal(thumb.status(), 200)
    assert.ok(thumb.headers()['content-type'].startsWith('image/'))
    for (const endpoint of ['user/public-profile', 'products/get-products-by-user']) {
      assert.equal((await live.request.get(`${base}/api/${endpoint}?userId=invalid`)).status(), 400)
    }
    await live.goto(`${base}/vendedor/${actualProduct.user_id}`)
    await live.getByRole('heading', { name: actualProfile.company_name || actualProfile.full_name, exact: true }).waitFor()
    assert.equal(await live.locator('#catalogo article').count(), actualProducts.length)
    await live.screenshot({ path: `${output}/real-desktop.png`, fullPage: true })
    await live.close()
    console.log(`Real profile, ${actualProducts.length} public products, thumbnails and API validation: OK`)

    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], reducedMotion: 'reduce' })
    let profileStatus = 200, productsStatus = 200, currentProfile = profile, currentProducts = products
    await context.route('**/api/**', async route => {
      const url = route.request().url()
      if (url.includes('/api/user/public-profile')) return route.fulfill({ status: profileStatus, json: { profile: currentProfile } })
      if (url.includes('/api/products/get-products-by-user')) return route.fulfill({ status: productsStatus, json: { products: currentProducts } })
      return route.fulfill({ status: 200, json: { users: [], conversations: [], count: 0, success: true } })
    })
    const page = await context.newPage()
    page.setDefaultTimeout(15000)
    page.on('pageerror', error => errors.push(error.message))
    async function load() {
      await page.goto(`${base}/vendedor/${userId}`)
    }
    await load()
    await page.getByRole('heading', { name: profile.company_name, exact: true }).waitFor()
    assert.equal(await page.locator('#catalogo article').count(), 3)
    assert.equal(await page.getByText('Unsafe link', { exact: true }).count(), 0)
    assert.equal(await page.locator('a[href^="javascript:"]').count(), 0)
    async function waitForImages() {
      for (const img of await page.locator('main img').all()) await img.scrollIntoViewIfNeeded()
      await page.waitForFunction(() => [...document.querySelectorAll('main img')].every(img => img.complete))
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForFunction(() => [...document.querySelectorAll('main img')].every(img => getComputedStyle(img).opacity === '1'))
    }
    await waitForImages()
    await page.screenshot({ path: `${output}/desktop.png`, fullPage: true })
    await page.getByRole('button', { name: 'Cacao', exact: true }).click()
    assert.equal(await page.locator('#catalogo article').count(), 1)
    await page.getByRole('button', { name: 'Todos', exact: true }).click()
    await page.getByLabel('Buscar productos de esta empresa').fill('cafe')
    assert.equal(await page.locator('#catalogo article').count(), 2, 'Search ignores accents')
    await page.getByLabel('Buscar productos de esta empresa').fill('no-match')
    await page.getByRole('heading', { name: 'No encontramos productos' }).waitFor()
    await page.getByRole('button', { name: 'Limpiar filtros' }).click()
    assert.equal(await page.locator('#catalogo article').count(), 3)
    await page.getByLabel('Ordenar productos').selectOption('name')
    assert.match(await page.locator('#catalogo article h3').first().textContent(), /Cacao/)
    await page.getByRole('button', { name: 'Compartir', exact: true }).click()
    await page.getByText('Enlace copiado', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Contactar empresa', exact: true }).first().click()
    await page.getByRole('dialog').waitFor()
    assert.equal(await page.getByRole('dialog').locator('button').count(), 4)
    await page.keyboard.press('Escape')
    await page.locator('#catalogo article').first().getByRole('button', { name: 'Consultar', exact: true }).click()
    await page.getByText('Cacao fermentado premium', { exact: true }).last().waitFor()
    await page.getByPlaceholder('Escribe tu consulta...').waitFor()
    console.log('Search, categories, ordering, sharing, contact selector and product chat: OK')
    await load()
    await page.getByRole('heading', { name: profile.company_name, exact: true }).waitFor()
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      assert.ok(dimensions.scroll <= dimensions.client, `No horizontal overflow at ${width}px`)
      if (width === 375) { await waitForImages(); await page.screenshot({ path: `${output}/mobile.png`, fullPage: true }) }
    }
    await page.evaluate(() => document.documentElement.classList.add('dark'))
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#documentos a')).backgroundColor === getComputedStyle(document.querySelector('#catalogo article')).backgroundColor)
    await page.screenshot({ path: `${output}/dark.png`, fullPage: true })
    console.log('Responsive widths 375/768/1024/1440 and dark mode: OK')
    currentProfile = { ...profile, company_name: null, bio: null, address: null, country: null, company_website: 'javascript:alert(1)', avatar_url: '/missing-image.jpg', is_pro: false, export_history: [] }
    currentProducts = []
    await load()
    await page.getByRole('heading', { name: 'María Rivera', exact: true }).waitFor()
    await page.getByRole('heading', { name: 'Su próximo producto está por llegar' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Contactar empresa', exact: true }).count(), 0)
    assert.equal(await page.locator('a[href^="javascript:"]').count(), 0)
    currentProfile = profile
    productsStatus = 500
    await load()
    await page.getByText('No pudimos cargar el catálogo.', { exact: true }).waitFor()
    await page.getByRole('heading', { name: profile.company_name, exact: true }).waitFor()
    productsStatus = 200
    currentProducts = products
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
    await page.locator('#catalogo article').first().waitFor()
    profileStatus = 500
    await load()
    await page.getByRole('heading', { name: 'No pudimos cargar este perfil' }).waitFor()
    profileStatus = 404
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
    await page.getByRole('heading', { name: 'Perfil no encontrado' }).waitFor()
    console.log('Missing data, invalid links, empty catalogue, partial failure, retry and 404: OK')
    assert.deepEqual(errors, [], 'No uncaught browser errors')
    console.log(`Screenshots: ${output}`)
  } finally {
    await browser.close()
  }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
