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
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]))
                    },
                },
            },
        )

        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id

        // Use Admin client for counts and complex queries to bypass RLS issues 
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Run all queries concurrently — select only needed fields (was select("*") before)
        const [
            { data: profile },
            { data: userProducts },
            { data: sellerQuotes },
            { data: buyerQuotes },
            { data: sellerOrders },
            { data: buyerOrders }
        ] = await Promise.all([
            supabaseAdmin.from("users").select("full_name, company_name, plan_type, plan_expires_at").eq("id", userId).single(),
            supabaseAdmin.from("user_products").select("id, title, views, category").eq("user_id", userId),
            supabaseAdmin.from("quotations").select("id, status, created_at, updated_at, buyer_name, product_id, target_price, quantity").eq("seller_id", userId),
            supabaseAdmin.from("quotations").select("id, status, created_at, updated_at, product_title, product_id").eq("buyer_id", userId),
            supabaseAdmin.from("orders").select("id, status, created_at, updated_at").eq("seller_id", userId),
            supabaseAdmin.from("orders").select("id, status, created_at, updated_at, total_price").eq("buyer_id", userId)
        ])

        const companyName = profile?.company_name || profile?.full_name || "Usuario"

        // Auto-downgrade if Pro plan expired
        let planType: string = profile?.plan_type || "gratis"
        let planExpiresAt: string | null = profile?.plan_expires_at || null

        if (planType === "pro" && planExpiresAt && new Date(planExpiresAt) < new Date()) {
            // Downgrade to gratis
            await supabaseAdmin
                .from("users")
                .update({ plan_type: "gratis", plan_expires_at: null })
                .eq("id", userId)
            planType = "gratis"
            planExpiresAt = null
        }

        const isPro = planType === "pro"
        const publicationLimit = isPro ? 10 : 5

        // Date reference for 7 day window
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoIso = sevenDaysAgo.toISOString()

        const isSeller = userProducts && userProducts.length > 0
        const hasSentQuotes = buyerQuotes && buyerQuotes.length > 0
        const hasBoughtOrders = buyerOrders && buyerOrders.length > 0
        const isBuyer = hasSentQuotes || hasBoughtOrders

        // 4. Determine Activity Type
        let activityType: "empty" | "buyer" | "seller" | "mixed" = "empty"
        if (isSeller && isBuyer) activityType = "mixed"
        else if (isSeller) activityType = "seller"
        else if (isBuyer) activityType = "buyer"

        // 5. Build Aggregated Payload

        // -- Seller KPIs --
        const sellerQuotesTotal = sellerQuotes?.length || 0
        const sellerQuotesPending = sellerQuotes?.filter(q => q.status === "pending").length || 0
        const sellerOrdersConfirmed = sellerOrders?.filter(q => q.status === "Entregado" || q.status === "En Tránsito").length || 0 // Assuming logic based on prior mocked data

        // Calculate estimated value in negotiation (pending/accepted quotes)
        const valorNegociacion = sellerQuotes?.filter(q => q.status === "pending" || q.status === "accepted")
            .reduce((sum, q) => sum + (q.target_price || 0) * (q.quantity || 0), 0) || 0

        // -- Buyer KPIs --
        const buyerQuotesSent = buyerQuotes?.length || 0
        const buyerQuotesReceived = buyerQuotes?.filter(q => q.status === "accepted" || q.status === "rejected").length || 0 // Responses received from seller
        const buyerOrdersProcess = buyerOrders?.filter(o => o.status === "Preparación" || o.status === "En Tránsito").length || 0

        const totalComprado = buyerOrders?.filter(o => o.status === "Entregado")
            .reduce((sum, o) => {
                const p = typeof o.total_price === 'string' ? parseFloat(o.total_price) : (o.total_price || 0)
                return sum + p
            }, 0) || 0

        // -- Pipelines --
        // Simplified pipeline metrics based on DB state
        const pipelineVentas = {
            solicitudes: sellerQuotesPending,
            cotizaciones_enviadas: sellerQuotes?.filter(q => q.status === "accepted").length || 0, // 'Accepted' here usually means seller accepted to negotiate
            negociacion: sellerOrders?.filter(o => o.status === "Preparación").length || 0,
            pedidos_confirmados: sellerOrdersConfirmed
        }

        const pipelineCompras = {
            busqueda: 0, // Hard to track objectively
            solicitudes_enviadas: buyerQuotesSent,
            ofertas_recibidas: buyerQuotesReceived,
            compras_completadas: buyerOrders?.filter(o => o.status === "Entregado").length || 0
        }

        // -- Pending Actions Array --
        interface PendingAction {
            id: string
            type: 'alert' | 'info' | 'success'
            title: string
            description: string
            actionText: string
            actionLink: string
        }

        const pendingActions: PendingAction[] = []

        if (isSeller) {
            const pendingQs = sellerQuotes?.filter(q => q.status === "pending") || []
            pendingQs.forEach(q => {
                pendingActions.push({
                    id: `sq-${q.id}`,
                    type: "alert",
                    title: "Responder cotización",
                    description: `Cotización de ${q.buyer_name} necesita respuesta`,
                    actionText: "Responder",
                    actionLink: `/dashboard/cotizaciones/${q.id}`
                })
            })

            const prepOs = sellerOrders?.filter(o => o.status === "Preparación") || []
            prepOs.forEach(o => {
                pendingActions.push({
                    id: `so-${o.id}`,
                    type: "info",
                    title: "Despachar pedido",
                    description: `El pedido #${o.id.slice(0, 6)} está listo para ser despachado`,
                    actionText: "Confirmar",
                    actionLink: `/dashboard/ventas/${o.id}`
                })
            })
        }

        if (isBuyer) {
            const acceptedQs = buyerQuotes?.filter(q => q.status === "accepted") || []
            acceptedQs.forEach(q => {
                pendingActions.push({
                    id: `bq-${q.id}`,
                    type: "info",
                    title: "Revisar oferta recibida",
                    description: `Oferta para compra de ${q.product_title}`,
                    actionText: "Revisar",
                    actionLink: `/dashboard/mis-compras/${q.id}` // Or quote link
                })
            })
        }

        // -- Performance Section (Seller Top 5) --
        const performance = (userProducts || [])
            .map(p => {
                // Find requests for this specific product
                const requests = sellerQuotes?.filter(q => q.product_id === p.id).length || 0
                // Calculate conversion (requests / views)
                const views = p.views || 0
                const conversion = views > 0 ? (requests / views) * 100 : 0

                return {
                    id: p.id,
                    producto: p.title,
                    vistas: views,
                    solicitudes: requests,
                    conversion: `${conversion.toFixed(1)}%`
                }
            })
            .sort((a, b) => b.vistas - a.vistas) // Sort by views descending
            .slice(0, 5) // Top 5

        // -- Recent Activity (Timeline) --
        const recentActivity: any[] = []

        // Helper to add activity items
        const addActivity = (id: string, text: string, time: string, isPositive: boolean = true) => {
            recentActivity.push({
                id,
                text,
                time, // ISO string, will be formatted by frontend
                isPositive
            })
        }

        // 1. Seller Quotes received
        sellerQuotes?.forEach(q => {
            if (q.status === 'pending') {
                addActivity(`rq-${q.id}`, `Recibiste una nueva solicitud de ${q.buyer_name || 'un comprador'}`, q.created_at, true)
            } else if (q.status === 'accepted') {
                addActivity(`aq-${q.id}`, `Aceptaste negociar con ${q.buyer_name || 'un comprador'}`, q.updated_at || q.created_at, true)
            } else if (q.status === 'rejected') {
                addActivity(`rjq-${q.id}`, `Rechazaste la solicitud de ${q.buyer_name || 'un comprador'}`, q.updated_at || q.created_at, false)
            }
        })

        // 2. Buyer Quotes Updates (Seller responded)
        buyerQuotes?.forEach(q => {
            if (q.status === 'accepted') {
                addActivity(`bq-a-${q.id}`, `Tu oferta por ${q.product_title || 'un producto'} fue aceptada`, q.updated_at || q.created_at, true)
            } else if (q.status === 'rejected') {
                addActivity(`bq-r-${q.id}`, `Tu oferta por ${q.product_title || 'un producto'} fue rechazada`, q.updated_at || q.created_at, false)
            } else if (q.status === 'pending') {
                addActivity(`bq-p-${q.id}`, `Enviaste una solicitud por ${q.product_title || 'un producto'}`, q.created_at, true)
            }
        })

        // 3. Seller Orders
        sellerOrders?.forEach(o => {
            if (o.status === 'Preparación') {
                addActivity(`so-p-${o.id}`, `Nuevo pedido a preparar: #${o.id.slice(0, 6)}`, o.created_at, true)
            } else if (o.status === 'En Tránsito') {
                addActivity(`so-t-${o.id}`, `Pedido #${o.id.slice(0, 6)} marcado en tránsito`, o.updated_at || o.created_at, true)
            } else if (o.status === 'Entregado') {
                addActivity(`so-d-${o.id}`, `Pedido #${o.id.slice(0, 6)} entregado con éxito`, o.updated_at || o.created_at, true)
            }
        })

        // 4. Buyer Orders
        buyerOrders?.forEach(o => {
            if (o.status === 'En Tránsito') {
                addActivity(`bo-t-${o.id}`, `Tu compra #${o.id.slice(0, 6)} va en camino`, o.updated_at || o.created_at, true)
            } else if (o.status === 'Entregado') {
                addActivity(`bo-d-${o.id}`, `Recibiste tu compra #${o.id.slice(0, 6)}`, o.updated_at || o.created_at, true)
            }
        })

        // Sort by time descending and take Top 6
        recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

        // Return unified structure
        return NextResponse.json({
            companyName,
            planType,
            isPro,
            publicationLimit,
            planExpiresAt,
            activityType,
            seller: {
                quotes_received_7d: sellerQuotesTotal,
                quotes_pending: sellerQuotesPending,
                orders_confirmed: sellerOrdersConfirmed,
                valor_negociacion: `$${valorNegociacion.toLocaleString()}`,
            },
            buyer: {
                requests_sent: buyerQuotesSent,
                quotes_received: buyerQuotesReceived,
                orders_in_process: buyerOrdersProcess,
                total_bought: `$${totalComprado.toLocaleString()}`,
            },
            pipelineVentas,
            pipelineCompras,
            pendingActions: pendingActions.slice(0, 4), // Top 4 pending actions
            performance,
            recentActivity: recentActivity.slice(0, 6) // Top 6 chronological activities
        })

    } catch (error) {
        console.error("Dashboard Dynamic Data Error:", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
