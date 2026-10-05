import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { sendNewsletterEmail } from "@/lib/email"

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ["agrilpasv@gmail.com"]

export async function POST(request: Request) {
    try {
        // Verify the user is admin
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    },
                },
            },
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
        const isAdmin = profile?.role === "admin" || ADMIN_EMAILS.includes(user.email || "")
        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { subject, content, specificEmail, selectedEmails, includeGreeting = true } = await request.json()

        if (!subject || !content) {
            return NextResponse.json({ error: "Asunto y contenido son requeridos" }, { status: 400 })
        }

        // Convert newlines to <br> for HTML
        const htmlContent = content.replace(/\n/g, '<br>')

        // OPTION 1: Send to Specific Email
        if (specificEmail) {
            const result = await sendNewsletterEmail({
                recipientEmail: specificEmail,
                recipientName: "Usuario",
                subject,
                htmlContent,
                includeGreeting,
            })

            if (result.success) {
                return NextResponse.json({ success: true, totalUsers: 1, sent: 1, failed: 0 })
            } else {
                return NextResponse.json({ success: false, totalUsers: 1, sent: 0, failed: 1, error: JSON.stringify(result.error) })
            }
        }

        // OPTION 2: Send to Selected Users (multi-select from admin UI)
        if (selectedEmails && Array.isArray(selectedEmails) && selectedEmails.length > 0) {
            let sent = 0
            let failed = 0
            const errors: string[] = []

            for (const recipient of selectedEmails as { email: string; name: string }[]) {
                if (!recipient.email) continue

                const result = await sendNewsletterEmail({
                    recipientEmail: recipient.email,
                    recipientName: recipient.name || "Usuario",
                    subject,
                    htmlContent,
                    includeGreeting,
                })

                if (result.success) {
                    sent++
                } else {
                    failed++
                    errors.push(`${recipient.email}: ${JSON.stringify(result.error)}`)
                }

                await new Promise(resolve => setTimeout(resolve, 200))
            }

            return NextResponse.json({
                success: true,
                totalUsers: selectedEmails.length,
                sent,
                failed,
                errors: errors.length > 0 ? errors : undefined,
            })
        }

        // OPTION 2: Send to All Users
        // Get all registered users
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        const { data: users, error: usersError } = await supabaseAdmin
            .from("users")
            .select("email, full_name, company_name")

        if (usersError) {
            console.error("[Newsletter] Error fetching users:", usersError)
            return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ error: "No hay usuarios registrados" }, { status: 404 })
        }

        // Send emails one by one (Resend free tier doesn't support batch)
        let sent = 0
        let failed = 0
        const errors: string[] = []

        for (const user of users) {
            if (!user.email) continue

            const result = await sendNewsletterEmail({
                recipientEmail: user.email,
                recipientName: user.company_name || user.full_name || "Usuario",
                subject,
                htmlContent,
                includeGreeting,
            })

            if (result.success) {
                sent++
            } else {
                failed++
                errors.push(`${user.email}: ${JSON.stringify(result.error)}`)
            }

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 200))
        }

        return NextResponse.json({
            success: true,
            totalUsers: users.length,
            sent,
            failed,
            errors: errors.length > 0 ? errors : undefined,
        })
    } catch (error: any) {
        console.error("[Newsletter] Error:", error)
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
    }
}
