import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId")

        if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Only expose safe public fields — never email, phone, internal data
        // Export documents are optional and must not prevent loading the profile.
        const { data: profile, error } = await supabaseAdmin
            .from("users")
            .select("id, full_name, company_name, country, bio, company_website, address, created_at, avatar_url, plan_type, plan_expires_at")
            .eq("id", userId)
            .maybeSingle()

        if (error) {
            console.error("[Public Profile API] Database error:", error)
            return NextResponse.json({ error: "No se pudo cargar el perfil" }, { status: 500 })
        }

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 })
        }

        // Calculate if user is Pro (with expiration check)
        let isPro = false
        if (profile.plan_type === "pro") {
            if (profile.plan_expires_at) {
                isPro = new Date(profile.plan_expires_at) > new Date()
            } else {
                isPro = true
            }
        }

        let exportHistory: unknown = []
        if (isPro) {
            const { data: documents, error: documentsError } = await supabaseAdmin
                .from("users")
                .select("export_history")
                .eq("id", userId)
                .maybeSingle()

            if (!documentsError) exportHistory = documents?.export_history || []
            // Older databases have no export_history column yet.
            else if (documentsError.code !== "42703" && documentsError.code !== "PGRST204") {
                console.error("[Public Profile API] Documents unavailable:", documentsError)
            }
        }

        // Only expose the public document fields for active Pro members.
        const safeProfile = {
            id: profile.id,
            full_name: profile.full_name,
            company_name: profile.company_name,
            country: profile.country,
            bio: profile.bio,
            company_website: profile.company_website,
            address: profile.address,
            created_at: profile.created_at,
            avatar_url: profile.avatar_url,
            is_pro: isPro,
            export_history: Array.isArray(exportHistory)
                ? exportHistory.filter((item: any) => item && typeof item.url === "string" && ["certificate", "container_photo"].includes(item.type))
                    .map((item: any) => ({ url: item.url, type: item.type, label: typeof item.label === "string" ? item.label : "", uploaded_at: item.uploaded_at }))
                : [],
        }

        return NextResponse.json({ profile: safeProfile })
    } catch (error: any) {
        console.error("[Public Profile API] Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
