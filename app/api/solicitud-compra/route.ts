import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { readPurchaseDraft, validatePurchaseDraft } from "@/lib/purchase-requests/form"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Verify auth
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    const draft = readPurchaseDraft(formData)
    const { productName, category, quantity, unit, desiredDate, country, deliveryState, deliveryAddress, description, budget, specs, sourceType, contactMethod, contactValue } = draft
    const emoji = formData.get("emoji") as string || null

    const fields = validatePurchaseDraft(draft)
    if (Object.keys(fields).length) {
      return NextResponse.json(
        { error: "Revisa los campos de tu solicitud.", fields },
        { status: 400 }
      )
    }

    // Get user profile info
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("company_name, email")
      .eq("id", user.id)
      .single()

    // Calculate expiry date (90 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    // Insert purchase request
    const { data, error } = await supabaseAdmin
      .from("purchase_requests")
      .insert({
        user_id: user.id,
        product_name: productName,
        category,
        quantity,
        unit,
        desired_date: desiredDate || null,
        country: country || null,
        delivery_state: deliveryState || null,
        delivery_address: deliveryAddress || null,
        description: description || null,
        budget: budget || null,
        specs: specs || null,
        source_type: sourceType,
        contact_method: contactMethod,
        contact_value: contactValue || null,
        image_url: emoji || null,
        buyer_company: profile?.company_name || null,
        buyer_email: profile?.email || user.email,
        status: "active",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[Agrilpa] Error creating purchase request:", error)
      return NextResponse.json(
        { error: "Error al crear la solicitud" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      request: data,
      message: "Solicitud de compra creada exitosamente",
    })
  } catch (error) {
    console.error("[Agrilpa] Purchase request error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
