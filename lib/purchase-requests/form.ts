import { PRODUCT_CATEGORIES } from "@/lib/constants"
import { COUNTRIES } from "@/lib/countries"
import { normalizeContactPhone, validContactEmail } from "@/lib/contact/types"

export const PURCHASE_UNITS = {
  kg: "kg",
  ton: "toneladas",
  lb: "lb",
  quintales: "quintales",
  unidades: "unidades",
  contenedores: "contenedores"
} as const
export const PURCHASE_STEPS = [
  {
    title: "Producto",
    description: "Qué necesitas",
    keys: [
      "productName",
      "category",
      "quantity",
      "unit",
      "description",
      "specs"
    ]
  },
  {
    title: "Entrega",
    description: "Dónde y cuándo",
    keys: ["country", "deliveryState", "deliveryAddress", "desiredDate"]
  },
  {
    title: "Condiciones",
    description: "Presupuesto y contacto",
    keys: ["budget", "sourceType", "contactMethod", "contactValue"]
  },
  { title: "Revisión", description: "Antes de publicar", keys: [] }
] as const

export const emptyPurchaseDraft = {
  productName: "",
  category: "",
  quantity: "",
  unit: "kg",
  description: "",
  specs: "",
  country: "",
  deliveryState: "",
  deliveryAddress: "",
  desiredDate: "",
  budget: "",
  sourceType: "cualquiera",
  contactMethod: "email",
  contactValue: ""
}
export type PurchaseDraft = typeof emptyPurchaseDraft
export type PurchaseErrors = Partial<Record<keyof PurchaseDraft, string>>
export function purchaseToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date())
  const part = (type: string) =>
    parts.find((value) => value.type === type)!.value
  return `${part("year")}-${part("month")}-${part("day")}`
}
export function readPurchaseDraft(form: FormData): PurchaseDraft {
  const draft = { ...emptyPurchaseDraft }
  for (const key of Object.keys(draft) as (keyof PurchaseDraft)[]) {
    const value = form.get(key)
    draft[key] = typeof value === "string" ? value.trim() : ""
  }
  return draft
}
export function validatePurchaseDraft(
  draft: PurchaseDraft,
  today = purchaseToday()
): PurchaseErrors {
  const errors: PurchaseErrors = {}
  const length = (
    key: keyof PurchaseDraft,
    min: number,
    max: number,
    label: string
  ) => {
    if (draft[key].trim().length < min || draft[key].trim().length > max)
      errors[key] = `${label}: usa entre ${min} y ${max} caracteres.`
  }
  length("productName", 15, 50, "Nombre del producto")
  if (!PRODUCT_CATEGORIES.includes(draft.category))
    errors.category = "Selecciona una categoría."
  if (
    !/^\d+(?:\.\d+)?$/.test(draft.quantity) ||
    !Number.isFinite(Number(draft.quantity)) ||
    Number(draft.quantity) <= 0 ||
    Number(draft.quantity) > Number.MAX_SAFE_INTEGER
  )
    errors.quantity = "Escribe una cantidad numérica mayor que cero."
  if (!Object.keys(PURCHASE_UNITS).includes(draft.unit))
    errors.unit = "Selecciona una unidad válida."
  length("description", 1, 3000, "Descripción")
  length("specs", 1, 2000, "Especificaciones")
  if (!COUNTRIES.some((country) => country.name === draft.country))
    errors.country = "Selecciona el país de entrega."
  length("deliveryState", 1, 100, "Estado o provincia")
  length("deliveryAddress", 1, 300, "Dirección")
  const date = new Date(`${draft.desiredDate}T12:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(draft.desiredDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== draft.desiredDate ||
    draft.desiredDate < today
  )
    errors.desiredDate =
      "Selecciona una fecha de entrega desde hoy en adelante."
  length("budget", 1, 120, "Presupuesto")
  if (!["cualquiera", "local", "importado"].includes(draft.sourceType))
    errors.sourceType = "Selecciona un origen válido."
  if (!["email", "whatsapp"].includes(draft.contactMethod))
    errors.contactMethod = "Selecciona un medio de contacto."
  else if (
    draft.contactMethod === "email" &&
    !validContactEmail(draft.contactValue)
  )
    errors.contactValue =
      "Escribe un correo completo, por ejemplo nombre@empresa.com."
  else if (
    draft.contactMethod === "whatsapp" &&
    !/^\+[1-9]\d{7,14}$/.test(normalizeContactPhone(draft.contactValue))
  )
    errors.contactValue =
      "El teléfono debe tener entre 8 y 15 dígitos, incluido el prefijo."
  return errors
}
