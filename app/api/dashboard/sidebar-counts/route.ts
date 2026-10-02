import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]))
                    },
                },
            },
        )

        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ publicaciones: 0, cotizaciones: 0, pedidos: 0, compras: 0, ventas: 0, logistica: 0, transacciones: 0, mensajes: 0, contactanos: 0 })
        }

        const userId = session.user.id

        // Use Admin client to bypass RLS for counts
        const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        // ── Run ALL counts in parallel (was serial before) ──
        const [
            { count: publicaciones },
            { count: compras },
            { data: salesData },
            { data: quotesData },
            { data: profile },
        ] = await Promise.all([
            admin.from("user_products").select("id", { count: "exact", head: true }).eq("user_id", userId),
            admin.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", userId).eq("is_read_buyer", false),
            admin.from("orders").select("status").eq("seller_id", userId),
            admin.from("quotations").select("status").eq("seller_id", userId),
            admin.from("users").select("role").eq("id", userId).maybeSingle(),
        ])

        const isAdmin = profile?.role === "admin" || session.user.email === "agrilpasv@gmail.com"
        let contactanosCount = 0

        if (isAdmin) {
            const { count } = await admin.from("contact_submissions").select("id", { count: "exact", head: true })
            contactanosCount = count || 0
        }

        const ventas = salesData?.filter(o => o.status?.toLowerCase() === "pendiente" || o.status?.toLowerCase() === "pending").length || 0
        const cotizaciones = quotesData?.filter(q => q.status?.toLowerCase() === "pending").length || 0

        return NextResponse.json({
            publicaciones: publicaciones || 0,
            cotizaciones,
            pedidos: compras || 0,
            compras: compras || 0,
            ventas,
            logistica: 0,
            transacciones: 0,
            mensajes: 0,
            contactanos: contactanosCount,
        })

    } catch (error) {
        console.error("Sidebar Counts Error:", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
