import { createServerClient, type CookieOptions } from "@supabase/ssr"
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
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet: {name:string;value:string;options:CookieOptions}[]) {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    },
                },
            },
        )

        // 1. Get current user
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const userId = session.user.id

        // 2. Fetch orders using Admin client to bypass RLS, focusing on seller_id
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        const { data: orders, error: ordersError } = await supabaseAdmin
            .from("orders")
            .select(`
                *,
                quotations:quotation_id (
                    container_size
                )
            `)
            .eq("seller_id", userId)

        if (ordersError && !ordersError.message.includes("relation \"orders\" does not exist")) {
            console.error("[API/seller/orders] Orders error:", ordersError)
            return NextResponse.json({ error: ordersError.message }, { status: 500 })
        }

        // Map orders
        const mappedOrders = (orders || []).map(order => {
            const containerSize = order.quotations?.container_size || (["20ST", "40HC"].includes(order.packaging_size) ? order.packaging_size : null);
            return {
                ...order,
                buyer_name: order.buyer_name || order.full_name || "Comprador Agrilpa",
                quantity: order.quantity || order.quantity_kg,
                total_price: order.total_price || order.price_usd,
                product_name: order.product_name || order.product_title || "Producto",
                product_slug: order.product_id,
                product_image: order.product_image || null,
                is_read_seller: order.is_read_seller ?? true,
                origin_table: "orders",
                container_size: containerSize
            }
        });

        const allOrders = mappedOrders.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return NextResponse.json({ orders: allOrders }, { status: 200 })

    } catch (error: any) {
        console.error("[API/seller/orders] Catch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
