import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create admin client that completely bypasses RLS
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Fetch profiles from public table
    const { data: profiles, error } = await supabaseAdmin.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[Agrilpa] Admin Users API error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch auth users to get metadata (products of interest, volume, etc.) and last sign-in
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })
    const authUsers = authData?.users

    if (authError) {
      console.error("[Agrilpa] Error fetching auth users:", authError)
      // Continue with just profiles if auth fetch fails, but log it
    }

    // Merge metadata into profiles
    const enrichedProfiles = profiles.map(profile => {
      // Find corresponding auth user
      const authUser = authUsers?.find(u => u.id === profile.id)
      return {
        ...profile,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        products_of_interest: profile?.products_of_interest || authUser?.user_metadata?.products_of_interest || [],
        supply_countries: profile?.supply_countries || authUser?.user_metadata?.supply_countries || [],
        provider_countries: profile?.provider_countries || authUser?.user_metadata?.provider_countries || [],
        has_export_certificates: profile?.has_export_certificates ?? authUser?.user_metadata?.has_export_certificates ?? null,
        annual_volume: profile?.annual_volume || authUser?.user_metadata?.annual_volume || null,
        country_code: authUser?.user_metadata?.country_code || null,
        metadata_phone_number: authUser?.user_metadata?.phone_number || null,
        company_website: profile.company_website || authUser?.user_metadata?.company_website || null,
        plan_type: profile.plan_type || 'gratis',
        how_heard_about_us: profile.how_heard_about_us || authUser?.user_metadata?.how_heard_about_us || null,
        how_heard_other: profile.how_heard_other || authUser?.user_metadata?.how_heard_other || null,
      }
    })

    return NextResponse.json(enrichedProfiles, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error: any) {
    console.error("[Agrilpa] Admin Users API unexpected error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
