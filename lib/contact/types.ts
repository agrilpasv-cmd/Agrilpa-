import { COUNTRIES } from "@/lib/countries"

export type ProductContactMode = "chat" | "admin_form"
export interface ContactDraft {
  fullName: string
  countryCode: string
  email: string
  phone: string
  message: string
}
export type ContactErrors = Partial<Record<keyof ContactDraft, string>>
export const emptyContactDraft: ContactDraft = {
  fullName: "",
  countryCode: "",
  email: "",
  phone: "",
  message: ""
}
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
export const normalizeContactPhone = (value: string) =>
  value.replace(/[\s().-]/g, "")
export const contactPhoneDigits = (value: string) =>
  value.replace(/[^0-9]/g, "")

export function validContactEmail(value: string) {
  const email = value.trim()
  if (email.length > 254) return false
  const parts = email.split("@")
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (
    !local ||
    local.length > 64 ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..")
  )
    return false
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false
  const labels = domain.split(".")
  return (
    labels.length >= 2 &&
    labels.every((label) =>
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)
    ) &&
    /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i.test(labels[labels.length - 1])
  )
}
export function validateContact(draft: ContactDraft): ContactErrors {
  const errors: ContactErrors = {}
  if (draft.fullName.trim().length < 2 || draft.fullName.trim().length > 120)
    errors.fullName = "Escribe tu nombre, entre 2 y 120 caracteres."
  else if (
    !/^\p{L}[\p{L}\p{M}\p{Zs}.'’ʼ-]*$/u.test(draft.fullName.trim())
  )
    errors.fullName =
      "Usa letras y espacios en tu nombre. También se permiten tildes, apóstrofes, puntos y guiones."
  if (!COUNTRIES.some((country) => country.code === draft.countryCode))
    errors.countryCode = "Selecciona tu país."
  if (!validContactEmail(draft.email))
    errors.email = "Escribe un correo completo, por ejemplo nombre@empresa.com."
  if (
    draft.phone.length > 32 ||
    !/^\+[1-9]\d{7,14}$/.test(normalizeContactPhone(draft.phone))
  )
    errors.phone =
      "Escribe un teléfono válido: solo números y entre 8 y 15 dígitos contando el prefijo."
  if (draft.message.trim().length > 1000)
    errors.message = "Usa un máximo de 1,000 caracteres."
  return errors
}
export interface ProductContactRequest {
  id: string
  created_at: string
  read_at: string | null
  status: "new" | "contacted"
  full_name: string
  country_code: string
  country_name: string
  email: string
  phone: string
  message: string | null
  product_id: string | null
  product_title: string
  product_image: string | null
  seller_id: string | null
  seller_name: string
  requester_id: string | null
}
