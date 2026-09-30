export interface CompanyDocument {
  url: string
  type: "container_photo" | "certificate"
  label: string
  uploaded_at: string
}

export interface PublicCompanyProfile {
  id: string
  full_name: string | null
  company_name: string | null
  country: string | null
  bio: string | null
  company_website: string | null
  address: string | null
  created_at: string | null
  avatar_url: string | null
  is_pro: boolean
  export_history: CompanyDocument[]
}

export interface CompanyProduct {
  id: string
  title: string
  category: string | null
  price: string | number | null
  currency: string | null
  country: string | null
  state: string | null
  image: string
  min_order: string | null
  unit: string | null
  price_type: string | null
  min_order_quantity: number | null
  created_at: string
}

/** Only allow web links in user-supplied websites and documents. */
export function publicWebUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const input = value.trim()
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`)
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

export function companyProductPrice(product: CompanyProduct): string {
  if (product.price_type === "quote" || product.price == null || product.price === "") return "Precio a cotizar"
  const price = Number(product.price)
  if (!Number.isFinite(price) || price < 0) return "Precio a cotizar"
  const currency = product.currency === "US$" || product.currency === "$" || !product.currency ? "USD" : product.currency
  const amount = new Intl.NumberFormat("es-SV", { maximumFractionDigits: 2 }).format(price)
  return `${currency} ${amount}${product.unit ? ` / ${product.unit}` : ""}`
}

export function companyMemberSince(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("es-SV", { month: "long", year: "numeric", timeZone: "UTC" })
}
