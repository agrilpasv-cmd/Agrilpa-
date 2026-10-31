import { createHmac } from "node:crypto"
import { after, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { COUNTRIES } from "@/lib/countries"
import {
  emptyContactDraft,
  validateContact,
  normalizeContactPhone,
  isUuid,
  type ContactDraft
} from "@/lib/contact/types"
import {
  sameContactOrigin,
  contactHeaders,
  readProductContactMode
} from "@/lib/contact/server"
import { isLocalContactPreview } from "@/lib/contact/local-mode"
import { notifyProductContactAdmins } from "@/lib/contact/admin-notifications"

export const maxDuration = 120

async function submitPurchaseRequestContact({
  requestId,
  submissionKey,
  draft,
  countryCode,
  countryName,
  visitorHash,
  requesterId
}: {
  requestId: string
  submissionKey: string
  draft: ContactDraft
  countryCode: string
  countryName: string
  visitorHash: string
  requesterId: string | null
}) {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from("product_contact_requests")
    .select("id, email, product_image")
    .eq("request_key", submissionKey)
    .maybeSingle()

  const normalizedEmail = draft.email.trim().toLowerCase()
  const expectedMarker = `#pedido=${requestId}`

  if (existing) {
    if (
      existing.email !== normalizedEmail ||
      !existing.product_image?.endsWith(expectedMarker)
    ) {
      return { status: 400, body: { error: "Revisa los datos de tu solicitud." } }
    }
    return { status: 201, body: { success: true, id: existing.id } }
  }

  const modeState = await readProductContactMode()
  if (modeState.mode !== "admin_form") {
    return {
      status: 409,
      body: {
        error:
          "El método de contacto cambió. Revisa el método disponible para continuar.",
        code: "MODE_CHANGED"
      }
    }
  }

  const { data: purchaseReq } = await admin
    .from("purchase_requests")
    .select(
      "id, product_name, quantity, unit, country, delivery_state, user_id, buyer_company, buyer_email, status, image_url"
    )
    .eq("id", requestId)
    .maybeSingle()

  if (!purchaseReq || purchaseReq.status === "deleted") {
    return {
      status: 404,
      body: {
        error: "Este pedido de compra ya no está disponible para recibir propuestas."
      }
    }
  }

  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const [{ count: visitorCount }, { count: emailCount }] = await Promise.all([
    admin
      .from("product_contact_requests")
      .select("id", { head: true, count: "exact" })
      .eq("visitor_hash", visitorHash)
      .gt("created_at", fifteenMinAgo),
    admin
      .from("product_contact_requests")
      .select("id", { head: true, count: "exact" })
      .eq("email", normalizedEmail)
      .gt("created_at", fifteenMinAgo)
  ])

  if ((visitorCount || 0) >= 10 || (emailCount || 0) >= 5) {
    return {
      status: 429,
      headers: { "Retry-After": "900" },
      body: {
        error:
          "Has enviado varias solicitudes. Espera unos minutos antes de volver a intentarlo."
      }
    }
  }

  let buyerName =
    purchaseReq.buyer_company?.trim() ||
    purchaseReq.buyer_email?.trim() ||
    "Comprador en Agrilpa"

  if (purchaseReq.user_id) {
    const { data: buyerProfile } = await admin
      .from("users")
      .select("company_name, full_name, email")
      .eq("id", purchaseReq.user_id)
      .maybeSingle()
    if (buyerProfile) {
      buyerName =
        buyerProfile.company_name?.trim() ||
        buyerProfile.full_name?.trim() ||
        buyerName
    }
  }

  const productTitle = `Pedido: ${purchaseReq.product_name} (${purchaseReq.quantity} ${purchaseReq.unit})`
  const imageBase = (purchaseReq.image_url || "/placeholder.svg").split("#")[0]

  const { data: inserted, error: insertError } = await admin
    .from("product_contact_requests")
    .insert({
      request_key: submissionKey,
      full_name: draft.fullName.trim(),
      country_code: countryCode,
      country_name: countryName,
      email: normalizedEmail,
      phone: normalizeContactPhone(draft.phone),
      message: draft.message.trim() || null,
      product_id: null,
      product_title: productTitle,
      product_image: `${imageBase}${expectedMarker}`,
      seller_id: purchaseReq.user_id || null,
      seller_name: buyerName,
      requester_id: requesterId,
      visitor_hash: visitorHash
    })
    .select("id")
    .single()

  if (insertError || !inserted) {
    console.error("[Purchase request contact]", insertError?.code, insertError?.message)
    return {
      status: 503,
      body: {
        error:
          "No pudimos guardar tu propuesta. Tus datos siguen aquí para volver a intentarlo."
      }
    }
  }

  await admin
    .from("product_contact_clicks")
    .insert({
      product_id: purchaseReq.id,
      product_title: productTitle,
      seller_id: purchaseReq.user_id || purchaseReq.id,
      click_type: "whatsapp",
      user_id: requesterId,
      created_at: new Date().toISOString()
    })
    .then(() => {})
    .catch(() => {})

  return { status: 201, body: { success: true, id: inserted.id } }
}

export async function POST(request: Request) {
  try {
    if (!sameContactOrigin(request))
      return NextResponse.json(
        { error: "Origen no permitido." },
        { status: 403 }
      )
    const raw = await request.text()
    if (Buffer.byteLength(raw) > 8000)
      return NextResponse.json(
        { error: "La solicitud es demasiado larga." },
        { status: 413 }
      )
    const body = JSON.parse(raw)
    if (
      !isUuid(body?.productId) ||
      !isUuid(body?.submissionKey) ||
      (typeof body.website === "string" && body.website.trim())
    )
      return NextResponse.json(
        { error: "Revisa los datos de tu solicitud." },
        { status: 400 }
      )
    const draft = { ...emptyContactDraft }
    for (const key of Object.keys(draft) as (keyof ContactDraft)[])
      draft[key] = typeof body[key] === "string" ? body[key] : ""
    const fields = validateContact(draft)
    if (Object.keys(fields).length)
      return NextResponse.json(
        { error: "Revisa los campos indicados.", fields },
        { status: 400 }
      )
    if (isLocalContactPreview(request)) {
      return NextResponse.json(
        {
          error:
            "Estás probando el formulario en local. No se ha enviado ninguna solicitud. Para habilitar los envíos reales, aplica la migración en Supabase y activa el formulario desde administración."
        },
        { status: 503, headers: contactHeaders }
      )
    }
    const client = await createClient()
    const {
      data: { user }
    } = await client.auth.getUser()
    const country = COUNTRIES.find((item) => item.code === draft.countryCode)!
    const address = (
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown"
    ).trim()
    const visitorHash = createHmac(
      "sha256",
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
      .update(`product-contact:${address}`)
      .digest("hex")

    if (body.isPurchaseRequest) {
      const outcome = await submitPurchaseRequestContact({
        requestId: body.productId,
        submissionKey: body.submissionKey,
        draft,
        countryCode: country.code,
        countryName: country.name,
        visitorHash,
        requesterId: user?.id || null
      })
      if (outcome.status === 201 && outcome.body.id) {
        const contactId = outcome.body.id
        try {
          after(async () => {
            await notifyProductContactAdmins(contactId)
          })
        } catch {
          console.error("[Product contact email] Could not schedule notification", {
            requestId: contactId
          })
        }
      }
      return NextResponse.json(outcome.body, {
        status: outcome.status,
        headers: { ...contactHeaders, ...(outcome.headers || {}) }
      })
    }

    const { data, error } = await createAdminClient().rpc(
      "submit_product_contact_request",
      {
        p_product_id: body.productId,
        p_request_key: body.submissionKey,
        p_full_name: draft.fullName.trim(),
        p_country_code: country.code,
        p_country_name: country.name,
        p_email: draft.email.trim().toLowerCase(),
        p_phone: normalizeContactPhone(draft.phone),
        p_message: draft.message.trim() || null,
        p_visitor_hash: visitorHash,
        p_requester_id: user?.id || null
      }
    )
    if (error) {
      if (error.message?.includes("contact_mode_changed"))
        return NextResponse.json(
          {
            error:
              "El método de contacto cambió. Revisa el método disponible para continuar.",
            code: "MODE_CHANGED"
          },
          { status: 409 }
        )
      if (error.message?.includes("contact_rate_limit"))
        return NextResponse.json(
          {
            error:
              "Has enviado varias solicitudes. Espera unos minutos antes de volver a intentarlo."
          },
          { status: 429, headers: { "Retry-After": "900" } }
        )
      if (error.code === "P0002") {
        const fallback = await submitPurchaseRequestContact({
          requestId: body.productId,
          submissionKey: body.submissionKey,
          draft,
          countryCode: country.code,
          countryName: country.name,
          visitorHash,
          requesterId: user?.id || null
        })
        if (fallback.status === 201 && fallback.body.id) {
          const contactId = fallback.body.id
          try {
            after(async () => {
              await notifyProductContactAdmins(contactId)
            })
          } catch {
            console.error("[Product contact email] Could not schedule notification", {
              requestId: contactId
            })
          }
          return NextResponse.json(fallback.body, {
            status: 201,
            headers: contactHeaders
          })
        }
        return NextResponse.json(
          {
            error: "Este producto ya no está disponible para recibir consultas."
          },
          { status: 404 }
        )
      }
      console.error("[Product contact]", error.code)
      return NextResponse.json(
        {
          error:
            "No pudimos guardar tu solicitud. Tus datos siguen aquí para volver a intentarlo."
        },
        { status: 503 }
      )
    }
    const contactId = data.id
    try {
      after(async () => {
        await notifyProductContactAdmins(contactId)
      })
    } catch {
      console.error("[Product contact email] Could not schedule notification", {
        requestId: contactId
      })
    }
    return NextResponse.json(
      { success: true, id: contactId },
      { status: 201, headers: contactHeaders }
    )
  } catch {
    return NextResponse.json(
      { error: "No pudimos procesar la solicitud. Inténtalo de nuevo." },
      { status: 400 }
    )
  }
}
