const assert = require("node:assert/strict")
const fs = require("node:fs")
const { randomUUID } = require("node:crypto")
const { PGlite } = require(
  process.env.AGRILPA_PGLITE_MODULE || "@electric-sql/pglite"
)

async function run() {
  const db = new PGlite()
  const seller = randomUUID(),
    buyer = randomUUID(),
    product = randomUUID()
  try {
    await db.exec(
      `CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key); CREATE TABLE public.users(id uuid primary key,company_name text,full_name text); CREATE TABLE public.user_products(id uuid primary key,user_id uuid,title text,image text,is_visible boolean); CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;`
    )
    const migration = fs.readFileSync(
      "supabase/migrations/20261026173941_product_contact_modes.sql",
      "utf8"
    )
    await db.exec(migration)
    await db.exec(migration)
    assert.equal(
      (await db.query("SELECT mode FROM product_contact_settings")).rows[0]
        .mode,
      "chat"
    )
    await db.query("INSERT INTO auth.users(id) VALUES ($1),($2)", [
      seller,
      buyer
    ])
    await db.query(
      "INSERT INTO public.users(id,company_name,full_name) VALUES ($1,$2,$3)",
      [seller, "Vendedor de prueba", "Nombre original"]
    )
    await db.query(
      "INSERT INTO public.user_products VALUES ($1,$2,$3,$4,true)",
      [product, seller, "Producto original", "/placeholder.svg"]
    )
    const submit = ({
      key = randomUUID(),
      email = "visitor@example.test",
      visitor = "a".repeat(64),
      productId = product
    } = {}) =>
      db.query(
        "SELECT public.submit_product_contact_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS result",
        [
          productId,
          key,
          "Visitante de prueba",
          "SV",
          "El Salvador",
          email,
          "+50370000000",
          "Consulta de prueba",
          visitor,
          buyer
        ]
      )
    await assert.rejects(submit(), (error) =>
      error.message.includes("contact_mode_changed")
    )
    await db.exec("UPDATE product_contact_settings SET mode='admin_form'")
    const key = randomUUID(),
      first = (await submit({ key })).rows[0].result.id
    assert.equal((await submit({ key })).rows[0].result.id, first)
    assert.equal(
      Number(
        (await db.query("SELECT count(*) AS n FROM product_contact_requests"))
          .rows[0].n
      ),
      1
    )
    const row = (
      await db.query("SELECT * FROM product_contact_requests WHERE id=$1", [
        first
      ])
    ).rows[0]
    assert.equal(row.product_title, "Producto original")
    assert.equal(row.seller_id, seller)
    assert.equal(row.seller_name, "Vendedor de prueba")
    assert.equal(row.requester_id, buyer)
    await assert.rejects(
      submit({ key, email: "other@example.test" }),
      (error) => error.message.includes("invalid_request_key")
    )
    for (let n = 0; n < 4; n++) await submit()
    await assert.rejects(submit(), (error) =>
      error.message.includes("contact_rate_limit")
    )
    for (let n = 0; n < 5; n++)
      await submit({ email: `person${n}@example.test` })
    await assert.rejects(submit({ email: "another@example.test" }), (error) =>
      error.message.includes("contact_rate_limit")
    )
    await assert.rejects(
      submit({
        productId: randomUUID(),
        visitor: "b".repeat(64),
        email: "missing@example.test"
      }),
      (error) => error.code === "P0002"
    )
    await db.query(
      "UPDATE public.user_products SET is_visible=false WHERE id=$1",
      [product]
    )
    await assert.rejects(
      submit({ visitor: "c".repeat(64), email: "hidden@example.test" }),
      (error) => error.code === "P0002"
    )
    await db.exec("UPDATE product_contact_settings SET mode='chat'")
    await assert.rejects(
      submit({ visitor: "d".repeat(64), email: "disabled@example.test" }),
      (error) => error.message.includes("contact_mode_changed")
    )
    assert.equal((await submit({ key })).rows[0].result.id, first)
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`)
      await assert.rejects(
        db.query("SELECT email FROM public.product_contact_requests"),
        (error) => error.code === "42501"
      )
      await assert.rejects(
        db.query(
          "UPDATE public.product_contact_settings SET mode='admin_form'"
        ),
        (error) => error.code === "42501"
      )
      await assert.rejects(submit(), (error) => error.code === "42501")
      await db.exec("RESET ROLE")
    }
    await db.query("DELETE FROM public.user_products WHERE id=$1", [product])
    const archived = (
      await db.query(
        "SELECT product_id,product_title FROM product_contact_requests WHERE id=$1",
        [first]
      )
    ).rows[0]
    assert.equal(archived.product_id, null)
    assert.equal(archived.product_title, "Producto original")
    console.log(
      "PASS: migration repeatable; default chat; mode enforcement; authoritative product/seller; deduplication; limits; hidden/deleted products; private data and RPC permissions. Isolated PostgreSQL only."
    )
  } finally {
    await db.close()
  }
}
run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
