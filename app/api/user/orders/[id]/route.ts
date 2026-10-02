import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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

        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id

        // Use Admin client to ensure we can fetch data even if RLS policies are tricky for now
        // Ideally we should rely on standard client + RLS, but for 'ventas' (seller view) we need to be sure.
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Try Fetching from 'orders'
        let finalData: any = null
        let origin = 'orders'

        const { data: order, error: orderError } = await supabaseAdmin
            .from("orders")
            .select(`
                *,
                quotations:quotation_id (
                    container_size, destination_country, destination_location, delivery_method
                )
            `)
            .eq("id", id)
            .single()

        if (order) {
            finalData = order
        } else {
            // 2. Try Fetching from 'purchases'
            const { data: purchase, error: purchaseError } = await supabaseAdmin
                .from("purchases")
                .select("*")
                .eq("id", id)
                .single()

            if (purchase) {
                finalData = purchase
                origin = 'purchases'
            }
        }

        if (!finalData) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 })
        }

        // Verify ownership
        const ownerId = origin === 'orders' ? finalData.buyer_id : finalData.user_id
        if (finalData.seller_id !== userId && ownerId !== userId) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
        }

        // Fetch Seller Data
        const { data: sellerProfile } = await supabaseAdmin
            .from("users")
            .select("full_name, company_name, phone_number, id")
            .eq("id", finalData.seller_id)
            .single()

        // Check if reviewed
        const { data: reviewData } = await supabaseAdmin
            .from("product_reviews")
            .select("id")
            .eq("purchase_id", finalData.id)
            .maybeSingle()
            
        const isReviewed = !!reviewData

        // Format data for frontend
        const formattedOrder = origin === 'orders' ? {
            id: finalData.id,
            price_usd: typeof finalData.total_price === 'string' ? parseFloat(finalData.total_price) : (finalData.total_price || 0),
            price_bs: 0,
            quantity_kg: finalData.quantity,
            unit: finalData.unit || "kg",
            currency: finalData.currency || "USD",
            product_name: finalData.product_name,
            product_slug: finalData.product_id,
            product_image: finalData.product_image,
            full_name: finalData.buyer_name,
            email: finalData.buyer_email,
            country_code: "58",
            phone_number: finalData.buyer_phone ? finalData.buyer_phone.replace("+58", "").trim() : "",
            address: finalData.shipping_address,
            city: "N/A",
            state: "N/A",
            zip_code: "N/A",
            country: finalData.quotations?.destination_country || "Por acordar",
            payment_method: "A convenir",
            special_instructions: finalData.origin === 'quotation' ? "Via Cotización" : "",
            incoterm: finalData.incoterm || "EXW",
            status: finalData.status || "Pendiente",
            created_at: finalData.created_at,
            shipping_method: finalData.quotations?.delivery_method === "pickup" ? "Recogida por el comprador" : finalData.quotations?.delivery_method === "delivery" ? "Envío a destino" : "A convenir",
            // Seller Info
            seller_name: sellerProfile?.full_name || "Vendedor Agrilpa",
            seller_company: sellerProfile?.company_name || "Empresa Verificada",
            seller_phone: sellerProfile?.phone_number || "Contactar via Chat",
            unit_price: typeof finalData.unit_price === 'string' ? parseFloat(finalData.unit_price) : (finalData.unit_price || 0),
            // Technical fields
            category: finalData.category || "General",
            origin_country: finalData.origin_country || "Venezuela",
            maturity: finalData.maturity || "Sin especificar",
            packaging_type: finalData.packaging_type || "Estándar",
            packaging_size: finalData.packaging_size || "N/A",
            certifications: finalData.certifications || "En proceso",
            seller_contact_method: finalData.seller_contact_method || "Plataforma Agrilpa",
            seller_contact_info: finalData.seller_contact_info || "",
            is_reviewed: isReviewed,
            seller_id: finalData.seller_id,
            container_size: finalData.quotations?.container_size || (["20ST", "40HC"].includes(finalData.packaging_size) ? finalData.packaging_size : null),
            tracking_history: finalData.tracking || [
                {
                    fecha: finalData.created_at,
                    estado: "Orden Recibida",
                    ubicacion: "Sistema Agrilpa"
                }
            ]
        } : {
            // Native purchase record (direct buy)
            id: finalData.id,
            price_usd: typeof finalData.price_usd === 'string' ? parseFloat(finalData.price_usd) : (finalData.price_usd || 0),
            unit_price: typeof finalData.price_usd === 'string' ? (parseFloat(finalData.price_usd) / (finalData.quantity_kg || 1)) : ((finalData.price_usd || 0) / (finalData.quantity_kg || 1)),
            price_bs: 0,
            quantity_kg: finalData.quantity_kg,
            product_name: finalData.product_name,
            product_slug: finalData.product_slug,
            product_image: finalData.product_image,
            full_name: finalData.full_name,
            email: finalData.email,
            country_code: finalData.country_code || "58",
            phone_number: finalData.phone_number,
            address: finalData.address,
            city: finalData.city,
            state: finalData.state,
            zip_code: finalData.zip_code,
            country: finalData.country,
            payment_method: finalData.payment_method,
            special_instructions: finalData.special_instructions,
            incoterm: "N/A",
            status: finalData.status || "Pagado",
            created_at: finalData.created_at,
            shipping_method: finalData.shipping_method,
            // Seller Info (Purchases might not have seller_id directly depending on schema, but let's try)
            seller_name: "Vendedor Agrilpa",
            seller_company: "Empresa Verificada",
            // Fallbacks for direct purchases (unless we update purchases table too)
            category: "General",
            origin_country: "Venezuela",
            maturity: "Sin especificar",
            packaging_type: "Estándar",
            packaging_size: "N/A",
            certifications: "Verificada",
            seller_contact_method: "Plataforma Agrilpa",
            seller_contact_info: "",
            is_reviewed: isReviewed,
            seller_id: finalData.seller_id,
            tracking_history: finalData.tracking || [
                {
                    fecha: finalData.created_at,
                    estado: "Orden Recibida",
                    ubicacion: "Sistema Agrilpa"
                }
            ]
        }

        return NextResponse.json({ order: formattedOrder })

    } catch (error) {
        console.error("Error fetching order detail:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status } = body

        if (!status) {
            return NextResponse.json({ error: "Missing status" }, { status: 400 })
        }

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

        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id

        // Use Admin client for update
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Fetch current record to get tracking and ownership
        let currentRecord: any = null
        let table = "orders"
        let userRole: 'seller' | 'buyer' = 'seller'

        // Check if seller
        const { data: orderAsSeller } = await supabaseAdmin.from("orders").select("*").eq("id", id).eq("seller_id", userId).single()
        if (orderAsSeller) {
            currentRecord = orderAsSeller
            userRole = 'seller'
        } else {
            const { data: purchaseAsSeller } = await supabaseAdmin.from("purchases").select("*").eq("id", id).eq("seller_id", userId).single()
            if (purchaseAsSeller) {
                currentRecord = purchaseAsSeller
                table = "purchases"
                userRole = 'seller'
            } else {
                // Check if buyer
                const { data: orderAsBuyer } = await supabaseAdmin.from("orders").select("*").eq("id", id).eq("buyer_id", userId).single()
                if (orderAsBuyer) {
                    currentRecord = orderAsBuyer
                    userRole = 'buyer'
                } else {
                    const { data: purchaseAsBuyer } = await supabaseAdmin.from("purchases").select("*").eq("id", id).eq("user_id", userId).single()
                    if (purchaseAsBuyer) {
                        currentRecord = purchaseAsBuyer
                        table = "purchases"
                        userRole = 'buyer'
                    }
                }
            }
        }

        if (!currentRecord) {
            return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 })
        }

        // Restrictions
        if (userRole === 'buyer' && status !== "Entregado") {
            return NextResponse.json({ error: "Compradores solo pueden marcar como 'Entregado'" }, { status: 403 })
        }

        // Status rank map (must go forward)
        const statusRanks: Record<string, number> = {
            "Pendiente": 0,
            "En preparación": 1,
            "Tránsito": 2,
            "Entregado": 3
        }

        const currentRank = statusRanks[currentRecord.status] || 0
        const newRank = statusRanks[status] || 0

        if (newRank <= currentRank && currentRecord.status !== "Pendiente") {
            return NextResponse.json({
                error: `No se puede revertir el estado de '${currentRecord.status}' a '${status}'`
            }, { status: 400 })
        }

        // Prepare tracking entries
        const now = new Date().toISOString()

        // Ensure we always start with "Orden Recibida" if the array is empty or null
        const initialEntry = {
            fecha: currentRecord.created_at || now,
            estado: "Orden Recibida",
            ubicacion: "Sistema Agrilpa"
        }

        let updatedTracking = []
        if (Array.isArray(currentRecord.tracking) && currentRecord.tracking.length > 0) {
            // Check if "Orden Recibida" is already there, if not, prepend it
            const hasInitial = currentRecord.tracking.some((t: any) => t.estado === "Orden Recibida")
            updatedTracking = hasInitial ? [...currentRecord.tracking] : [initialEntry, ...currentRecord.tracking]
        } else {
            updatedTracking = [initialEntry]
        }

        // Add the new status entry
        updatedTracking.push({
            fecha: now,
            estado: status,
            ubicacion: "Sistema Agrilpa"
        })

        // Update in DB
        const { data: updateData, error: updateError } = await supabaseAdmin
            .from(table)
            .update({
                status,
                tracking: updatedTracking
            })
            .eq("id", id)
            .select()

        if (updateError) {
            console.error(`Error updating ${table} status:`, updateError)
            // If it's a "column does not exist" error, at least update the status!
            if (updateError.message.includes("column \"tracking\" does not exist")) {
                await supabaseAdmin.from(table).update({ status }).eq("id", id)
                return NextResponse.json({
                    success: true,
                    warning: "Status updated but tracking failed (missing column). Please run the SQL script.",
                    order: { ...currentRecord, status }
                })
            }
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, order: updateData?.[0] })

    } catch (error) {
        console.error("Error updating order status:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
