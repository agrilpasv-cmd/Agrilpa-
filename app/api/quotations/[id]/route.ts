import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  try {
    const client = await createClient()
    const {data: {user}} = await client.auth.getUser()
    if (!user) return NextResponse.json({error: "No autorizado"}, {status: 401})
    const admin = createAdminClient()
    const {data: quotation, error} = await admin.from("quotations").select("*").eq("id", id).maybeSingle()
    if (error) return NextResponse.json({error: "No pudimos cargar la solicitud."}, {status: 500})
    if (!quotation || ![quotation.seller_id, quotation.buyer_id].includes(user.id)) return NextResponse.json({error: "Cotización no encontrada."}, {status: 404})
    const seller = quotation.seller_id === user.id
    const otherId = seller ? quotation.buyer_id : quotation.seller_id
    const {data: counterpart} = otherId ? await admin.from("users").select("id, full_name, company_name, avatar_url, country").eq("id", otherId).maybeSingle() : {data: null}
    const {data: order} = await admin.from("orders").select("id").eq("quotation_id", id).limit(1).maybeSingle()
    // Contact details from older requests remain private; discussion takes place in Agrilpa.
    const {email, phone_number, country_code, contact_method, ...visible} = quotation
    return NextResponse.json({quotation: visible, viewer: seller ? "seller" : "buyer", counterpart: counterpart || (otherId ? {id: otherId, full_name: seller ? quotation.buyer_name : "Vendedor Agrilpa"} : null), orderId: order?.id || null})
  } catch { return NextResponse.json({error: "No pudimos cargar la solicitud."}, {status: 500}) }
}
