import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId")

        if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Fetch user plan info alongside products
        const [productsResult, profileResult] = await Promise.all([
            supabaseAdmin
                .from("user_products")
                .select("id, title, category, price, currency, country, state, min_order, packaging, views, created_at, shipping_unit_type, container_size, unit, price_type, min_order_quantity")
                .eq("user_id", userId)
                .eq("is_visible", true)
                .order("created_at", { ascending: false }),
            supabaseAdmin
                .from("users")
                .select("plan_type, plan_expires_at")
                .eq("id", userId)
                .single()
        ])

        if (productsResult.error) {
            console.error("[Products by User API] Error:", productsResult.error)
            return NextResponse.json({ error: "No se pudo cargar el catálogo" }, { status: 500 })
        }

        // Calculate if seller is Pro
        let sellerIsPro = false
        const profile = profileResult.data
        if (profile?.plan_type === "pro") {
            if (profile.plan_expires_at) {
                sellerIsPro = new Date(profile.plan_expires_at) > new Date()
            } else {
                sellerIsPro = true
            }
        }

        // Add seller_is_pro to each product
        const products = (productsResult.data || []).map(p => ({
            ...p,
            image: `/api/products/${p.id}/thumb`,
            seller_is_pro: sellerIsPro
        }))

        return NextResponse.json({ products, seller_is_pro: sellerIsPro })
    } catch (error: any) {
        console.error("[Products by User API] Unexpected error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
