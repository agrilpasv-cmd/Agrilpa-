import { NextResponse } from "next/server"
import {
  requireContactAdmin,
  contactSelection,
  contactHeaders
} from "@/lib/contact/server"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  try {
    const permission = await requireContactAdmin()
    if (permission.response) return permission.response
    const search = new URL(request.url).searchParams
    const page = Math.max(1, Math.min(100000, Number(search.get("page")) || 1))
    const filter = search.get("filter") || "all"
    if (
      !Number.isInteger(page) ||
      !["all", "unread", "contacted"].includes(filter)
    )
      return NextResponse.json(
        { error: "El filtro no es válido." },
        { status: 400 }
      )
    const query = (search.get("q") || "")
      .slice(0, 120)
      .replace(/[^\p{L}\p{N}@ .+\-]/gu, "")
      .trim()
    let select = permission
      .admin!.from("product_contact_requests")
      .select(contactSelection, { count: "exact" })
    if (filter === "unread") select = select.is("read_at", null)
    if (filter === "contacted") select = select.eq("status", "contacted")
    if (query)
      select = select.or(
        ["full_name", "email", "product_title", "country_name", "seller_name"]
          .map((field) => `${field}.ilike.%${query}%`)
          .join(",")
      )
    const { data, error, count } = await select
      .order("created_at", { ascending: false })
      .range((page - 1) * 20, page * 20 - 1)
    if (error) {
      if (
        ["42P01", "PGRST205"].includes(error.code || "") ||
        /product_contact_requests|schema cache|does not exist/i.test(
          error.message || ""
        )
      ) {
        return NextResponse.json(
          {
            requests: [],
            total: 0,
            unreadCount: 0,
            page,
            pageSize: 20
          },
          { headers: contactHeaders }
        )
      }
      return NextResponse.json(
        {
          error:
            "No pudimos cargar las solicitudes. Comprueba que la migración de contactos esté aplicada."
        },
        { status: 503 }
      )
    }
    const { count: unread } = await permission
      .admin!.from("product_contact_requests")
      .select("id", { head: true, count: "exact" })
      .is("read_at", null)
    return NextResponse.json(
      {
        requests: data || [],
        total: count || 0,
        unreadCount: unread || 0,
        page,
        pageSize: 20
      },
      { headers: contactHeaders }
    )
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar las solicitudes." },
      { status: 503 }
    )
  }
}
