import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) return NextResponse.json({error: "No autorizado"}, {status: 401})
    const {data, error} = await createAdminClient().from("quotations").select("*").eq("seller_id", user.id).order("created_at", {ascending: false})
    if (error) return NextResponse.json({error: "No pudimos cargar las cotizaciones."}, {status: 500})
    return NextResponse.json({success: true, quotations: data})
  } catch { return NextResponse.json({error: "No pudimos cargar las cotizaciones."}, {status: 500}) }
}
