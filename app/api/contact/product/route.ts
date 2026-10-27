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
import { sameContactOrigin, contactHeaders } from "@/lib/contact/server"
import { isLocalContactPreview } from "@/lib/contact/local-mode"
import { notifyProductContactAdmins } from "@/lib/contact/admin-notifications"

export const maxDuration = 120

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
      if (error.code === "P0002")
        return NextResponse.json(
          {
            error: "Este producto ya no está disponible para recibir consultas."
          },
          { status: 404 }
        )
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
