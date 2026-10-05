import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = body.userId
    const newRole = body.newRole || body.role

    if (!userId || !newRole) {
      return NextResponse.json({ error: "userId y role son requeridos" }, { status: 400 })
    }

    const validRoles = ["user", "vendedor", "comprador", "admin"]
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: `Rol inválido. Roles permitidos: ${validRoles.join(", ")}` },
        { status: 400 }
      )
    }

    // 1. Verificar que el usuario actual esté autenticado
    const supabase = await createServerClient()
    const {
      data: { user: requestingUser },
    } = await supabase.auth.getUser()

    if (!requestingUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // 2. Usar admin client para verificar permisos y realizar la actualización
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Verificar si el usuario que hace la solicitud es admin
    const { data: requesterProfile } = await adminClient
      .from("users")
      .select("role")
      .eq("id", requestingUser.id)
      .single()

    const isRequesterAdmin =
      requesterProfile?.role === "admin" || requestingUser.email === "agrilpasv@gmail.com"

    if (!isRequesterAdmin) {
      return NextResponse.json({ error: "No tienes permisos de administrador" }, { status: 403 })
    }

    // 3. Obtener el usuario objetivo
    const { data: targetUser, error: targetError } = await adminClient
      .from("users")
      .select("id, email, full_name, role")
      .eq("id", userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "Usuario objetivo no encontrado" }, { status: 404 })
    }

    // 4. Proteger contra quitarle admin al super-admin principal
    if (targetUser.email === "agrilpasv@gmail.com" && newRole !== "admin") {
      return NextResponse.json(
        { error: "No se puede revocar el rol de administrador al administrador principal del sistema" },
        { status: 400 }
      )
    }

    // 5. Actualizar el rol en la base de datos (tabla public.users)
    const { error: updateError } = await adminClient
      .from("users")
      .update({ role: newRole })
      .eq("id", userId)

    if (updateError) {
      console.error("[Agrilpa] Error updating role in users table:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 6. Actualizar también en auth.users metadata si es posible
    try {
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole },
      })
    } catch (authErr) {
      console.warn("[Agrilpa] Could not update auth user metadata:", authErr)
    }

    return NextResponse.json({
      success: true,
      message: `Rol actualizado a ${newRole} exitosamente`,
      user: {
        id: userId,
        email: targetUser.email,
        full_name: targetUser.full_name,
        role: newRole,
      },
    })
  } catch (error) {
    console.error("[Agrilpa] Error in update-role API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

