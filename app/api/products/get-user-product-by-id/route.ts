import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get("id")

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
        }

        // Use standard supabase-js client with Service Role Key for admin access
        // This ensures consistent RLS bypass for both fetching and updating
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabase
            .from("user_products")
            .select("*")
            .eq("id", productId)
            .single()

        if (error) {
            console.error("[Agrilpa] Database error fetching product:", error)
            return NextResponse.json({ error: "Database error" }, { status: 500 })
        }

        if (!data) {
            console.log("[Agrilpa] Product not found for ID:", productId)
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        // Increment view count
        const currentViews = data.views || 0
        const { error: updateError } = await supabase
            .from("user_products")
            .update({ views: currentViews + 1 })
            .eq("id", productId)

        if (updateError) {
            console.error("[Agrilpa] Error incrementing views:", updateError)
        } else {
             // Force revalidation of the dashboard so the user sees the new count immediately
             revalidatePath('/dashboard/mis-publicaciones')
        }

        // Check if seller is Pro and get company details
        let sellerIsPro = false
        let sellerCompany = null
        let sellerCountry = null
        let sellerAddress = null
        let sellerAvatar = null
        if (data.user_id) {
            const { data: sellerProfile } = await supabase
                .from("users")
                .select("plan_type, plan_expires_at, company_name, full_name, country, address, avatar_url")
                .eq("id", data.user_id)
                .single()

            if (sellerProfile) {
                sellerCompany = sellerProfile.company_name || sellerProfile.full_name
                sellerCountry = sellerProfile.country
                sellerAddress = sellerProfile.address
                sellerAvatar = sellerProfile.avatar_url || null

                if (sellerProfile.plan_type === "pro") {
                    if (sellerProfile.plan_expires_at) {
                        sellerIsPro = new Date(sellerProfile.plan_expires_at) > new Date()
                    } else {
                        sellerIsPro = true
                    }
                }
            }
        }

        // Fetch product reviews
        const { data: reviewsData } = await supabase
            .from("product_reviews")
            .select(`
                id, 
                rating, 
                comment, 
                created_at,
                buyer:buyer_id (full_name, company_name)
            `)
            .eq("product_id", productId)
            .order("created_at", { ascending: false })
            
        let averageRating = 0.0
        let reviewCount = 0
        let formattedReviews: any[] = []

        if (reviewsData && reviewsData.length > 0) {
            reviewCount = reviewsData.length
            const totalRating = reviewsData.reduce((acc, r) => acc + r.rating, 0)
            averageRating = totalRating / reviewCount
            
            formattedReviews = reviewsData.map((r: any) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                created_at: r.created_at,
                reviewer_name: r.buyer?.full_name || r.buyer?.company_name || "Comprador Verificado"
            }))
        }

        // Return data with incremented view count for immediate UI update
        return NextResponse.json({
            product: {
                ...data,
                views: currentViews + 1,
                seller_is_pro: sellerIsPro,
                rating: Number(averageRating.toFixed(1)),
                reviews: reviewCount,
                reviews_data: formattedReviews,
                seller_company: sellerCompany,
                seller_country: sellerCountry,
                seller_address: sellerAddress,
                seller_avatar: sellerAvatar
            }
        }, { status: 200 })
    } catch (error) {
        console.error("[Agrilpa] API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
