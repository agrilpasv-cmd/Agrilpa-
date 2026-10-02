import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
export async function POST(request: Request) {
  try {
    const client = await createClient()
    const {data: {user}} = await client.auth.getUser()
    if (!user) return NextResponse.json({error: "No autorizado"}, {status: 401})
    const {quotationId} = await request.json()
    if (typeof quotationId !== "string") return NextResponse.json({error: "Solicitud inválida"}, {status: 400})
    const {error} = await createAdminClient().from("quotations").update({is_read: true}).eq("id", quotationId).eq("seller_id", user.id)
    return error ? NextResponse.json({error: "No pudimos marcar la solicitud."}, {status: 500}) : NextResponse.json({success: true})
  } catch { return NextResponse.json({error: "Solicitud inválida"}, {status: 400}) }
}
