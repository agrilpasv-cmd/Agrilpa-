import { createAdminClient } from "@/lib/supabase/admin"
import { sendPasswordResetEmail } from "@/lib/email"
import { buildPasswordRecoveryUrl, getAuthEmailOrigin } from "@/lib/auth-email-url"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "El correo electrónico es requerido." }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Ingresa un correo electrónico válido." }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Query user name from profiles if available
    let recipientName = cleanEmail.split("@")[0]
    const { data: profile } = await adminClient
      .from("users")
      .select("full_name")
      .eq("email", cleanEmail)
      .maybeSingle()

    if (profile?.full_name) {
      recipientName = profile.full_name
    }

    // Generate recovery link via Supabase admin
    // admin.generateLink does NOT send Supabase's built-in email — only generates link data.
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: cleanEmail,
      options: {
        redirectTo: `${getAuthEmailOrigin()}/auth/reset-password`,
      },
    })

    if (linkError) {
      console.warn("[Agrilpa] Recovery link generation note:", linkError.message)
      // Even if user not found, respond with generic success to protect user privacy
      return NextResponse.json({
        success: true,
        message: "Si este correo está registrado en Agrilpa, recibirás un enlace de recuperación en breve.",
      })
    }

    // Build the reset URL from the token hash returned by generateLink
    const tokenHash = linkData?.properties?.hashed_token
    if (!tokenHash) {
      console.error("[Agrilpa] No hashed_token returned for recovery link")
      return NextResponse.json({ error: "No se pudo generar el enlace de recuperación." }, { status: 500 })
    }

    // Determine the origin from the request to allow local testing (e.g. localhost:3000)
    // while defaulting to https://agrilpa.com in production.
    const originHeader = request.headers.get("origin")
    const hostHeader = request.headers.get("host")
    const proto = request.headers.get("x-forwarded-proto") || (hostHeader?.includes("localhost") ? "http" : "https")
    const requestOrigin = originHeader || (hostHeader ? `${proto}://${hostHeader}` : undefined)

    const resetUrl = buildPasswordRecoveryUrl(tokenHash, undefined, requestOrigin)

    // Send formatted email via Resend (our own branded email)
    const emailResult = await sendPasswordResetEmail({
      recipientEmail: cleanEmail,
      recipientName,
      resetUrl,
    })

    if (!emailResult.success) {
      console.error("[Agrilpa] Error sending password reset email:", emailResult.error)
      return NextResponse.json(
        { error: "No se pudo enviar el correo de recuperación. Inténtalo nuevamente." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Hemos enviado un correo con instrucciones para restablecer tu contraseña.",
    })
  } catch (error) {
    console.error("[Agrilpa] Forgot password unexpected error:", error)
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
