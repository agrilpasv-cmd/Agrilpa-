import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const client=await createClient()
    const {data:{user}}=await client.auth.getUser()
    if(!user) return NextResponse.json({error:"Inicia sesión para responder a la solicitud."},{status:401})
    const {quotationId,status,unitPrice,currency}=await request.json()
    if(typeof quotationId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quotationId) || !["accepted","rejected"].includes(status)) return NextResponse.json({error:"La decisión no es válida."},{status:400})
    if(status === "accepted" && (typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice<=0 || unitPrice>1e9 || !["USD","EUR"].includes(currency))) return NextResponse.json({error:"Confirma el precio acordado y la moneda."},{status:400})
    const admin=createAdminClient()
    const {data:quotation,error:fetchError}=await admin.from("quotations").select("id,seller_id").eq("id",quotationId).maybeSingle()
    if(fetchError) return NextResponse.json({error:"No pudimos comprobar la solicitud."},{status:500})
    if(!quotation || quotation.seller_id !== user.id) return NextResponse.json({error:"Cotización no encontrada."},{status:404})
    const {data,error}=await admin.rpc("decide_quotation",{p_quotation_id:quotationId,p_seller_id:user.id,p_status:status,p_unit_price:status === "accepted" ? unitPrice : null,p_currency:status === "accepted" ? currency : null})
    if(error) {
      console.error("[Quotation decision]",error.code)
      const conflict=error.code === "22023"
      return NextResponse.json({error:conflict ? "La solicitud ya fue respondida o sus datos no permiten crear un pedido. Actualiza la página para revisar el estado." : "No pudimos guardar la respuesta. Inténtalo de nuevo más tarde."},{status:conflict ? 409 : 500})
    }
    return NextResponse.json({success:true,...data})
  } catch {return NextResponse.json({error:"No pudimos procesar la respuesta."},{status:400})}
}
