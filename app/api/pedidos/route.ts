import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date().toISOString()

    // Fetch active, non-expired purchase requests
    const { data: requests, error } = await supabase
      .from("purchase_requests")
      .select("id, product_name, category, quantity, unit, country, delivery_state, delivery_address, image_url, specs, source_type, desired_date, user_id, created_at, expires_at, views_count")
      .eq("status", "active")
      .gte("expires_at", now)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API] Error fetching purchase requests:", error)
      return NextResponse.json({ error: "No pudimos consultar los pedidos." }, { status: 503 })
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ requests: [] }, { status: 200 })
    }

    // Fetch user info (Pro status) for all requesters
    const userIds = [...new Set(requests.map(r => r.user_id).filter(Boolean))]
    let usersMap: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, plan_type, plan_expires_at")
        .in("id", userIds)

      if (usersData) {
        usersData.forEach(user => {
          usersMap[user.id] = user
        })
      }
    }

    // Process: add is_pro flag, hide sensitive data
    const nowDate = new Date()
    const processed = requests.map((r: any) => {
      const user = usersMap[r.user_id]
      let isPro = false
      if (user && user.plan_type === "pro") {
        if (user.plan_expires_at) {
          isPro = new Date(user.plan_expires_at) > nowDate
        } else {
          isPro = true
        }
      }

      // Calculate days remaining
      const expiresAt = new Date(r.expires_at)
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24)))

      return {
        id: r.id,
        product_name: r.product_name,
        category: r.category,
        quantity: r.quantity,
        unit: r.unit,
        country: r.country,
        delivery_state: r.delivery_state,
        delivery_address: r.delivery_address,
        image_url: r.image_url,
        specs: r.specs,
        source_type: r.source_type,
        desired_date: r.desired_date,
        created_at: r.created_at,
        expires_at: r.expires_at,
        days_remaining: daysRemaining,
        is_pro: isPro,
        views_count: r.views_count || 0,
        // NO buyer_email, buyer_company, contact_value, budget
      }
    })

    // Sort: Pro first, then by created_at desc (already ordered)
    processed.sort((a: any, b: any) => {
      if (a.is_pro && !b.is_pro) return -1
      if (!a.is_pro && b.is_pro) return 1
      return 0
    })

    const response = NextResponse.json({ requests: processed }, { status: 200 })
    response.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60")
    return response
  } catch (error) {
    console.error("[API] Pedidos error:", error)
    return NextResponse.json({ error: "No pudimos consultar los pedidos." }, { status: 503 })
  }
}
