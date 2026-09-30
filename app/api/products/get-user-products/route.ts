import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if we only want featured products
    const { searchParams } = new URL(request.url)
    const onlyFeatured = searchParams.get("featured") === "true"

    let productsData: any[] = []
    let productsError = null
    let featuredIds: string[] = []

    if (onlyFeatured) {
      // Check if there is a custom featured products setting
      const { data: featuredRow } = await supabase
        .from("hero_images")
        .select("link_url")
        .eq("id", "11111111-1111-1111-1111-111111111111")
        .maybeSingle()

      featuredIds = featuredRow?.link_url ? featuredRow.link_url.split(",").filter(Boolean) : []
    }

    if (onlyFeatured && featuredIds.length > 0) {
      const { data, error } = await supabase
        .from("user_products")
        .select("id, title, category, description, country, state, price, currency, quantity, min_order, contact_method, contact_info, shipping_unit_type, container_size, user_id, unit, price_type, min_order_quantity")
        .eq("is_visible", true)
        .in("id", featuredIds)
      
      if (error) {
        productsError = error
      } else if (data) {
        // Sort products according to the order of featuredIds chosen by the user
        productsData = data.sort((a: any, b: any) => featuredIds.indexOf(a.id) - featuredIds.indexOf(b.id))
      }
    } else {
      // Fetch latest products dynamically for general listing (e.g. catalog page)
      const { data, error } = await supabase
        .from("user_products")
        .select("id, title, category, description, country, state, price, currency, quantity, min_order, contact_method, contact_info, shipping_unit_type, container_size, user_id, unit, price_type, min_order_quantity")
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(onlyFeatured ? 4 : 100)
      
      productsData = data || []
      productsError = error
    }

    if (productsError) {
      console.error("[API] Database fetch error:", productsError)
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    if (!productsData || productsData.length === 0) {
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    // Then fetch users for those products
    const userIds = [...new Set(productsData.map(p => p.user_id).filter(Boolean))]
    let usersMap: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, plan_type, plan_expires_at, company_name, avatar_url")
        .in("id", userIds)

      if (!usersError && usersData) {
        usersData.forEach(user => {
          usersMap[user.id] = user
        })
      }
    }

    // Fetch reviews for these products
    const productIds = productsData.map(p => p.id)
    let reviewsMap: Record<string, { totalRating: number, count: number }> = {}
    if (productIds.length > 0) {
      const { data: reviewsData } = await supabase
        .from("product_reviews")
        .select("product_id, rating")
        .in("product_id", productIds)
        
      if (reviewsData) {
        reviewsData.forEach(review => {
          if (!reviewsMap[review.product_id]) {
            reviewsMap[review.product_id] = { totalRating: 0, count: 0 }
          }
          reviewsMap[review.product_id].totalRating += review.rating
          reviewsMap[review.product_id].count += 1
        })
      }
    }

    // Process products: determine if seller is Pro (with expiration check) and add ratings
    const now = new Date()
    const processed = productsData.map((p: any) => {
      const user = usersMap[p.user_id]
      let sellerIsPro = false
      if (user && user.plan_type === "pro") {
        // Check if plan has expired
        if (user.plan_expires_at) {
          sellerIsPro = new Date(user.plan_expires_at) > now
        } else {
          sellerIsPro = true // No expiry = active Pro
        }
      }
      
      const revData = reviewsMap[p.id]
      const reviewsCount = revData?.count || 0
      const averageRating = reviewsCount > 0 ? (revData.totalRating / reviewsCount).toFixed(1) : 0

      return {
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        country: p.country,
        state: p.state || null,
        image: p.image,
        price: p.price,
        currency: p.currency || "US$",
        quantity: p.quantity,
        min_order: p.min_order,
        contact_method: p.contact_method,
        contact_info: p.contact_info,
        shipping_unit_type: p.shipping_unit_type || null,
        container_size: p.container_size || null,
        company_name: user?.company_name || null,
        seller_avatar: user?.avatar_url || null,
        seller_is_pro: sellerIsPro,
        rating: Number(averageRating),
        reviews: reviewsCount,
        user_id: p.user_id,
      }
    })

    // Sort: Pro sellers first, then by original order (only if not using manual featured products)
    if (featuredIds.length === 0) {
      processed.sort((a: any, b: any) => {
        if (a.seller_is_pro && !b.seller_is_pro) return -1
        if (!a.seller_is_pro && b.seller_is_pro) return 1
        return 0
      })
    }

    const response = NextResponse.json({ products: processed }, { status: 200 })
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    return response
  } catch (error) {
    console.error("[API] Internal error:", error)
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}

