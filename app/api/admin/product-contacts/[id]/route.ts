import { NextResponse } from "next/server"
import {
  requireContactAdmin,
  contactSelection,
  sameContactOrigin,
  contactHeaders
} from "@/lib/contact/server"
import { isUuid } from "@/lib/contact/types"
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permission = await requireContactAdmin()
    if (permission.response) return permission.response
    if (!sameContactOrigin(request))
      return NextResponse.json(
        { error: "Origen no permitido." },
        { status: 403 }
      )
    const { id } = await params
    const body = await request.json()
    if (
      !isUuid(id) ||
      (body.read !== undefined && typeof body.read !== "boolean") ||
      (body.status !== undefined &&
        !["new", "contacted"].includes(body.status)) ||
      (body.read === undefined && body.status === undefined)
    )
      return NextResponse.json(
        { error: "La acción no es válida." },
        { status: 400 }
      )
    const changes: { read_at?: string | null; status?: string } = {}
    if (body.read !== undefined)
      changes.read_at = body.read ? new Date().toISOString() : null
    if (body.status !== undefined) changes.status = body.status
    const { data, error } = await permission
      .admin!.from("product_contact_requests")
      .update(changes)
      .eq("id", id)
      .select(contactSelection)
      .maybeSingle()
    if (error)
      return NextResponse.json(
        { error: "No pudimos actualizar la solicitud." },
        { status: 503 }
      )
    if (!data)
      return NextResponse.json(
        { error: "Solicitud no encontrada." },
        { status: 404 }
      )
    return NextResponse.json({ request: data }, { headers: contactHeaders })
  } catch {
    return NextResponse.json(
      { error: "No pudimos procesar la acción." },
      { status: 400 }
    )
  }
}
