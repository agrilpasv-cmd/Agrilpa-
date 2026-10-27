import { NextResponse } from "next/server"
import { requireContactAdmin, contactHeaders } from "@/lib/contact/server"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    const permission = await requireContactAdmin()
    if (permission.response) return permission.response
    const { count, error } = await permission
      .admin!.from("product_contact_requests")
      .select("id", { head: true, count: "exact" })
      .is("read_at", null)
    if (error)
      return NextResponse.json({ unreadCount: 0 }, { headers: contactHeaders })
    return NextResponse.json(
      { unreadCount: count || 0 },
      { headers: contactHeaders }
    )
  } catch {
    return NextResponse.json(
      { error: "No pudimos comprobar las solicitudes nuevas." },
      { status: 503 }
    )
  }
}
