import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from("account_deletion_reports")
            .select("id, user_email, reason, custom_reason, deleted_at")
            .order("deleted_at", { ascending: false })

        if (error) {
            console.error("[DeletionReports] Fetch error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ reports: data ?? [] })
    } catch (err) {
        console.error("[DeletionReports] Unexpected error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        // 1. Verificar sesión y permisos de administrador
        let isAuthorized = false
        try {
            const supabase = await createServerClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const adminClient = createAdminClient()
                const { data: profile } = await adminClient
                    .from("users")
                    .select("role")
                    .eq("id", user.id)
                    .single()

                if (profile?.role === "admin" || user.email === "agrilpasv@gmail.com") {
                    isAuthorized = true
                }
            }
        } catch (authErr) {
            console.warn("[DeletionReports DELETE] Error verificando sesión:", authErr)
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Acceso denegado: requieres permisos de Administrador" }, { status: 403 })
        }

        // 2. Extraer ID o lista de IDs (vía URL params o JSON body)
        const url = new URL(request.url)
        let id = url.searchParams.get("id")
        const idsParam = url.searchParams.get("ids")
        let ids: string[] = []

        if (idsParam) {
            ids = idsParam.split(",").map(s => s.trim()).filter(Boolean)
        }

        if (!id && ids.length === 0) {
            try {
                const body = await request.json()
                if (body) {
                    if (typeof body.id === "string" && body.id.trim().length > 0) {
                        id = body.id.trim()
                    }
                    if (Array.isArray(body.ids)) {
                        ids = body.ids.filter((item: any) => typeof item === "string" && item.trim().length > 0)
                    }
                }
            } catch {
                // Si no hay body JSON, se usan los query params
            }
        }

        if (!id && ids.length === 0) {
            return NextResponse.json({ error: "Se requiere 'id' o 'ids' para eliminar" }, { status: 400 })
        }

        // 3. Eliminar de la base de datos usando el cliente administrativo
        const adminClient = createAdminClient()
        let query = adminClient.from("account_deletion_reports").delete()

        if (ids.length > 0) {
            query = query.in("id", ids)
        } else if (id) {
            query = query.eq("id", id)
        }

        const { error, count } = await query

        if (error) {
            console.error("[DeletionReports DELETE] Error eliminando registro:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            deletedCount: count ?? (ids.length || 1),
            message: "Reporte(s) eliminado(s) correctamente de la base de datos" 
        })
    } catch (err: any) {
        console.error("[DeletionReports DELETE] Error inesperado:", err)
        return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 })
    }
}
