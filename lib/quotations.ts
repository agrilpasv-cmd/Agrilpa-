export const purchaseFrequencies = [
  { value: "one_time", label: "Compra puntual" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "to_agree", label: "Por definir" },
] as const
export const quotationIncoterms = ["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"]
export function quotationCurrency(value?: string | null) { return value === "EUR" || value === "€" ? "EUR" : "USD" }
export function quotationMoney(value: number | string, currency?: string | null) {
  return new Intl.NumberFormat("es-SV", { style: "currency", currency: quotationCurrency(currency), maximumFractionDigits: 2 }).format(Number(value))
}
export function quotationToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}
export interface QuotationRequest {
  quantity: string; destinationCountry: string; destinationLocation: string;
  deliveryMethod: string; estimatedDate: string; dateFlexible: boolean;
  purchaseFrequency: string; notes: string; targetPrice: string; currency: string;
  incoterm: string; containerSize: string;
}
export const emptyQuotationRequest: QuotationRequest = { quantity: "", destinationCountry: "", destinationLocation: "", deliveryMethod: "delivery", estimatedDate: "", dateFlexible: false, purchaseFrequency: "one_time", notes: "", targetPrice: "", currency: "USD", incoterm: "", containerSize: "" }
export interface QuotationProduct {
  id: string; name: string; image?: string; category?: string; producer?: string;
  vendorId?: string; unit?: string; currency?: string; minOrder?: string;
  minOrderQuantity?: number; shippingUnitType?: string; containerSize?: string;
  country?: string; packaging?: string; price?: string;
}
export function quotationUnit(product: Pick<QuotationProduct, "shippingUnitType" | "unit">) { return product.shippingUnitType === "FCL" ? "contenedor" : product.unit || "kg" }
// Older publications keep their minimum and unit together in min_order (e.g. "500 lb").
export function quotationProductTerms(product: {unit?:string|null; min_order?:string|null; min_order_quantity?:number|string|null; shipping_unit_type?:string|null}) {
  const text=product.min_order || ""
  const match=text.match(/\b(kg|kilos?|kilogramos?|lb|libras?|TM|toneladas?|qq|quintales?|lt|litros?|gal|galones?|unidad(?:es)?|cajas?)\b/i)
  const aliases:Record<string,string>={kilo:"kg",kilos:"kg",kilogramo:"kg",kilogramos:"kg",libra:"lb",libras:"lb",tm:"TM",tonelada:"TM",toneladas:"TM",quintal:"qq",quintales:"qq",litro:"lt",litros:"lt",galon:"gal",galones:"gal",unidades:"unidad",cajas:"caja"}
  const explicitMinimum=Number(product.min_order_quantity) || 0
  const legacyUnit=match ? aliases[match[1].toLowerCase()] || match[1].toLowerCase() : null
  const legacyNumber=text.match(/\d[\d.,]*/)?.[0] || ""
  const parsedMinimum=Number(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(legacyNumber) ? legacyNumber.replaceAll(",","") : legacyNumber.replace(",",".")) || 0
  const unit=product.shipping_unit_type === "FCL" ? "contenedor" : (!explicitMinimum && (!product.unit || product.unit === "kg") && legacyUnit ? legacyUnit : product.unit || legacyUnit || "kg")
  return {unit,minimum:explicitMinimum || parsedMinimum}
}
export function validateQuotation(values: QuotationRequest, minimum = 0, containers = false) {
  const errors: Partial<Record<keyof QuotationRequest, string>> = {}
  const quantity = Number(values.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1e9 || Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > .00001) errors.quantity = "Introduce una cantidad válida, con un máximo de 3 decimales."
  else if (containers && !Number.isInteger(quantity)) errors.quantity = "Introduce un número entero de contenedores."
  else if (minimum > 0 && quantity < minimum) errors.quantity = `El pedido mínimo es de ${minimum}.`
  if (!values.destinationCountry.trim() || values.destinationCountry.length > 120) errors.destinationCountry = "Selecciona el país de destino."
  if (values.deliveryMethod === "delivery" && !values.destinationLocation.trim()) errors.destinationLocation = "Indica la ciudad o puerto de destino."
  if (values.destinationLocation.length > 180) errors.destinationLocation = "Usa un máximo de 180 caracteres."
  if (!["delivery", "pickup"].includes(values.deliveryMethod)) errors.deliveryMethod = "Selecciona cómo recibirás el producto."
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.estimatedDate) || !Number.isFinite(Date.parse(values.estimatedDate)) || new Date(values.estimatedDate).toISOString().slice(0,10) !== values.estimatedDate || values.estimatedDate < quotationToday()) errors.estimatedDate = "Elige una fecha válida a partir de hoy."
  if (!purchaseFrequencies.some(option => option.value === values.purchaseFrequency)) errors.purchaseFrequency = "Selecciona la frecuencia de compra."
  if (values.notes.length > 2000) errors.notes = "Usa un máximo de 2,000 caracteres."
  if (values.targetPrice.trim() && (!Number.isFinite(Number(values.targetPrice)) || Number(values.targetPrice) <= 0 || Number(values.targetPrice) > 1e9)) errors.targetPrice = "Introduce un presupuesto mayor que cero."
  if (!["USD", "EUR"].includes(values.currency)) errors.currency = "Selecciona una moneda válida."
  if (values.incoterm && !quotationIncoterms.includes(values.incoterm)) errors.incoterm = "Selecciona una condición comercial válida."
  if (containers && !["20ST", "40HC"].includes(values.containerSize)) errors.containerSize = "Selecciona el tamaño del contenedor."
  return errors
}
export interface QuotationRecord {
  id: string; product_id: string; product_title: string; product_image?: string;
  seller_id: string; buyer_id?: string | null; buyer_name: string;
  quantity: number; quantity_unit?: string | null; container_size?: string | null;
  destination_country: string; destination_location?: string | null; delivery_method?: string | null;
  estimated_date: string; date_flexible?: boolean; purchase_frequency?: string | null;
  notes?: string | null; target_price?: number | null; currency?: string | null; incoterm?: string | null;
  agreed_unit_price?: number | null; agreed_currency?: string | null;
  status: string; created_at: string; is_read?: boolean;
}
export function recordQuantity(record: Pick<QuotationRecord, "quantity" | "quantity_unit" | "container_size">) {
  return `${new Intl.NumberFormat("es-SV", {maximumFractionDigits: 3}).format(record.quantity)} ${record.container_size ? `contenedores · ${record.container_size}` : record.quantity_unit || "kg"}`
}
