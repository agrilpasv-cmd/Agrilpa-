import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[Agrilpa] Login error:", error)
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Obtener perfil de usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.error("[Agrilpa] Profile fetch error:", profileError)
    }

    let role = profile?.role || "user"
    if (email === "agrilpasv@gmail.com" || profile?.role === "admin") {
      role = "admin"
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        profile: profile || null,
        role: role,
      },
    })
  } catch (error) {
    console.error("[Agrilpa] Login error:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
