import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const { fullName, phone, company, country, address, bio, companyLink } = body

        const adminClient = createAdminClient()
        const { error: updateError } = await adminClient
            .from("users")
            .update({
                full_name: fullName,
                phone: phone,
                company_name: company,
                company_website: companyLink,
                country: country,
                address: address,
                bio: bio,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)

        if (updateError) {
            console.error("[Agrilpa] Update profile error:", updateError)
            return NextResponse.json({
                error: "Error al actualizar el perfil",
                details: updateError.message || updateError.details || JSON.stringify(updateError)
            }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Perfil actualizado correctamente" })
    } catch (error: any) {
        console.error("[Agrilpa] Update profile unexpected error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
