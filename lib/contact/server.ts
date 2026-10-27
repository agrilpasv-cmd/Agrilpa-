import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import type { ProductContactMode } from "./types"

export const contactHeaders = { "Cache-Control": "no-store, max-age=0" }
export async function requireContactAdmin() {
  const client = await createClient()
  const {
    data: { user },
    error
  } = await client.auth.getUser()
  if (error || !user)
    return {
      response: NextResponse.json(
        { error: "Inicia sesión como administrador." },
        { status: 401 }
      )
    }
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (profileError)
    return {
      response: NextResponse.json(
        { error: "No pudimos comprobar tus permisos." },
        { status: 503 }
      )
    }
  if (profile?.role !== "admin")
    return {
      response: NextResponse.json(
        { error: "Se requieren permisos de administrador." },
        { status: 403 }
      )
    }
  return { admin, user }
}
const fallbackStore = globalThis as typeof globalThis & {
  __agrilpaFallbackContactMode?: {
    mode: ProductContactMode
    updatedAt: string
  }
}

export function hasFallbackContactMode() {
  return Boolean(fallbackStore.__agrilpaFallbackContactMode)
}

export function getFallbackContactMode() {
  if (!fallbackStore.__agrilpaFallbackContactMode) {
    fallbackStore.__agrilpaFallbackContactMode = {
      mode: "chat",
      updatedAt: new Date().toISOString()
    }
  }
  return fallbackStore.__agrilpaFallbackContactMode
}

export function setFallbackContactMode(mode: ProductContactMode) {
  fallbackStore.__agrilpaFallbackContactMode = {
    mode,
    updatedAt: new Date().toISOString()
  }
  return fallbackStore.__agrilpaFallbackContactMode
}

export async function readProductContactMode() {
  const isUnitTest = process.env.SUPABASE_SERVICE_ROLE_KEY === "test-only"
  if (!isUnitTest && process.env.NODE_ENV === "development") {
    const local = getFallbackContactMode()
    return {
      mode: local.mode,
      ready: true,
      updatedAt: local.updatedAt
    }
  }
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("product_contact_settings")
    .select("mode, updated_at")
    .eq("id", true)
    .maybeSingle()
  if (error && !["42P01", "PGRST205"].includes(error.code)) throw error
  if (!data && !isUnitTest) {
    const fallback = getFallbackContactMode()
    return {
      mode: fallback.mode,
      ready: true,
      updatedAt: fallback.updatedAt
    }
  }
  return {
    mode: (data?.mode === "admin_form"
      ? "admin_form"
      : "chat") as ProductContactMode,
    ready: !!data,
    updatedAt: data?.updated_at || null
  }
}
export function sameContactOrigin(request: Request) {
  const origin = request.headers.get("origin")
  return !origin || origin === new URL(request.url).origin
}
export const contactSelection =
  "id,created_at,read_at,status,full_name,country_code,country_name,email,phone,message,product_id,product_title,product_image,seller_id,seller_name,requester_id"
