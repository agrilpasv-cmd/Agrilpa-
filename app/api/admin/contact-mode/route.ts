import { NextResponse } from "next/server"
import {
  requireContactAdmin,
  readProductContactMode,
  setFallbackContactMode,
  sameContactOrigin,
  contactHeaders
} from "@/lib/contact/server"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    const permission = await requireContactAdmin()
    if (permission.response) return permission.response
    return NextResponse.json(await readProductContactMode(), {
      headers: contactHeaders
    })
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar la configuración de contacto." },
      { status: 503 }
    )
  }
}
export async function PATCH(request: Request) {
  try {
    const permission = await requireContactAdmin()
    if (permission.response) return permission.response
    if (!sameContactOrigin(request))
      return NextResponse.json(
        { error: "Origen no permitido." },
        { status: 403 }
      )
    const { mode, updatedAt } = await request.json()
    if (
      !["chat", "admin_form"].includes(mode) ||
      typeof updatedAt !== "string" ||
      !Number.isFinite(Date.parse(updatedAt))
    )
      return NextResponse.json(
        { error: "La configuración no es válida. Actualiza la página." },
        { status: 400 }
      )
    const isUnitTest = process.env.SUPABASE_SERVICE_ROLE_KEY === "test-only"
    if (!isUnitTest && process.env.NODE_ENV === "development") {
      const updated = setFallbackContactMode(mode)
      return NextResponse.json(
        { mode: updated.mode, updatedAt: updated.updatedAt, ready: true },
        { headers: contactHeaders }
      )
    }
    const { data, error } = await permission
      .admin!.from("product_contact_settings")
      .update({
        mode,
        updated_at: new Date().toISOString(),
        updated_by: permission.user!.id
      })
      .eq("id", true)
      .eq("updated_at", updatedAt)
      .select("mode,updated_at")
      .maybeSingle()
    if (error) {
      if (!isUnitTest && ["42P01", "PGRST205"].includes(error.code || "")) {
        const updated = setFallbackContactMode(mode)
        return NextResponse.json(
          { mode: updated.mode, updatedAt: updated.updatedAt, ready: true },
          { headers: contactHeaders }
        )
      }
      return NextResponse.json(
        { error: "No pudimos guardar el modo de contacto." },
        { status: 503 }
      )
    }
    if (!data)
      return NextResponse.json(
        {
          error:
            "La configuración cambió. Actualiza la página antes de intentarlo de nuevo."
        },
        { status: 409 }
      )
    return NextResponse.json(
      { mode: data.mode, updatedAt: data.updated_at, ready: true },
      { headers: contactHeaders }
    )
  } catch {
    return NextResponse.json(
      { error: "No pudimos actualizar la configuración." },
      { status: 400 }
    )
  }
}
