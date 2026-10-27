import { NextResponse } from "next/server"
import { requireContactAdmin } from "@/lib/contact/server"
import { loadAdminDashboardOverview } from "@/lib/admin/dashboard-server"
import { dashboardPeriod, type DashboardDays } from "@/lib/dashboard/period"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const permission = await requireContactAdmin()
    if (permission.response) return permission.response
    const search = new URL(request.url).searchParams
    const days = Number(search.get("days") || "30")
    const endDate = search.get("endDate") || ""
    const now = new Date()
    if (![7, 30, 90].includes(days))
      return NextResponse.json(
        { error: "Elige un período de 7, 30 o 90 días." },
        { status: 400 }
      )
    try {
      dashboardPeriod(days as DashboardDays, now, endDate)
    } catch {
      return NextResponse.json(
        { error: "Elige una fecha válida, igual o anterior a hoy." },
        { status: 400 }
      )
    }
    const overview = await loadAdminDashboardOverview(
      permission.admin!,
      days as DashboardDays,
      now,
      endDate
    )
    return NextResponse.json(overview, {
      headers: { "Cache-Control": "private, no-store, max-age=0" }
    })
  } catch {
    return NextResponse.json(
      {
        error:
          "No pudimos cargar el resumen del administrador. Vuelve a intentarlo."
      },
      { status: 503 }
    )
  }
}
