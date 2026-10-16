import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") // e.g. "signup", "recovery", "email"
  const next = searchParams.get("next") || "/dashboard"

  const cookieStore = await cookies()
  const cookiesToSetOnResponse: { name: string; value: string; options?: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignored in Server Components
          }
          cookiesToSet.forEach((c) => {
            cookiesToSetOnResponse.push(c)
          })
        },
      },
    }
  )

  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"
  const publicOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.SITE_URL || origin)

  const createRedirectResponse = (url: string) => {
    const response = NextResponse.redirect(url)
    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  // --- Flow 1: token_hash verification (custom email links) ---
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "recovery" | "email" | "invite" | "magiclink" | "email_change",
    })

    if (!error) {
      if (type === "recovery") {
        return createRedirectResponse(`${publicOrigin}/auth/reset-password`)
      }
      return createRedirectResponse(`${publicOrigin}/auth/verified`)
    } else if (type === "recovery") {
      return createRedirectResponse(`${publicOrigin}/auth/reset-password?error=expired`)
    }
  }

  // --- Flow 2: PKCE code exchange (OAuth, Supabase default emails) ---
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session) {
      const isRecovery =
        type === "recovery" ||
        next.includes("reset-password") ||
        searchParams.get("next")?.includes("reset-password")

      if (isRecovery) {
        return createRedirectResponse(`${publicOrigin}/auth/reset-password`)
      }

      return createRedirectResponse(`${publicOrigin}${next}`)
    } else if (type === "recovery") {
      return createRedirectResponse(`${publicOrigin}/auth/reset-password?error=expired`)
    }
  }

  // Fallback: redirect to an error state or reset-password if it was a recovery attempt
  if (type === "recovery") {
    return createRedirectResponse(`${publicOrigin}/auth/reset-password?error=expired`)
  }

  return createRedirectResponse(`${publicOrigin}/auth/verified?error=true`)
}
