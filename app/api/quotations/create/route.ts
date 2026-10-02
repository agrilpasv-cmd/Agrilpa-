import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { emptyQuotationRequest, quotationProductTerms, validateQuotation, type QuotationRequest } from "@/lib/quotations"

export async function POST(request: Request) {
  try {
    const auth = await createClient()
    const {data: {user}} = await auth.auth.getUser()
    if (!user) return NextResponse.json({error: "Inicia sesión para solicitar una cotización."}, {status: 401})
    const body = await request.json()
    if (!body || typeof body.productId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.productId)) return NextResponse.json({error: "El producto no es válido."}, {status: 400})
    const admin = createAdminClient()
    const {data: product, error: productError} = await admin.from("user_products").select("*").eq("id", body.productId).maybeSingle()
    if (productError) return NextResponse.json({error: "No pudimos comprobar el producto."}, {status: 500})
    if (!product) return NextResponse.json({error: "Este producto ya no está disponible."}, {status: 404})
    if (product.user_id === user.id) return NextResponse.json({error: "No puedes cotizar tu propio producto."}, {status: 400})
    const values = {...emptyQuotationRequest}
    for (const key of Object.keys(values) as (keyof QuotationRequest)[]) {
      if (key !== "dateFlexible") values[key] = typeof body[key] === "string" || typeof body[key] === "number" ? String(body[key]) : emptyQuotationRequest[key]
    }
    values.dateFlexible = body.dateFlexible === true
    const containers = product.shipping_unit_type === "FCL"
    const {minimum,unit}=quotationProductTerms(product)
    const errors = validateQuotation(values, minimum, containers)
    if (containers && ["20ST", "40HC"].includes(product.container_size) && values.containerSize !== product.container_size) errors.containerSize = "Elige el contenedor disponible para este producto."
    if (Object.keys(errors).length) return NextResponse.json({error: "Revisa los datos de tu solicitud.", fields: errors}, {status: 400})
    const {data: buyer} = await admin.from("users").select("full_name, company_name").eq("id", user.id).maybeSingle()
    const buyerName = buyer?.company_name || buyer?.full_name || user.user_metadata?.full_name
    if (!buyerName) return NextResponse.json({error: "Completa tu nombre en Mi Perfil antes de cotizar."}, {status: 400})
    const {data: quotation, error} = await admin.from("quotations").insert({
      product_id: product.id, product_title: product.title, product_image: product.image || null,
      seller_id: product.user_id, buyer_id: user.id, buyer_name: buyerName,
      contact_method: "platform", email: user.email || null, country_code: null, phone_number: null,
      quantity: Number(values.quantity), quantity_unit: unit,
      container_size: containers ? values.containerSize : null,
      destination_country: values.destinationCountry.trim(), destination_location: values.deliveryMethod === "delivery" ? values.destinationLocation.trim() : null,
      delivery_method: values.deliveryMethod, estimated_date: values.estimatedDate, date_flexible: values.dateFlexible,
      purchase_frequency: values.purchaseFrequency, notes: values.notes.trim() || null,
      target_price: values.targetPrice.trim() ? Number(values.targetPrice) : null, currency: values.currency,
      incoterm: values.incoterm || null, status: "pending", is_read: false,
    }).select("id").single()
    if (error) {
      console.error("[Quotation create]", error.code)
      return NextResponse.json({error: "No pudimos guardar la solicitud. Inténtalo de nuevo más tarde."}, {status: 500})
    }
    return NextResponse.json({success: true, quotation: {id: quotation.id}}, {status: 201})
  } catch {
    return NextResponse.json({error: "No pudimos procesar la solicitud."}, {status: 400})
  }
}
