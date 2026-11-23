import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    )
                },
            },
        },
    )

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    let user = null
    try {
        const { data } = await supabase.auth.getUser()
        user = data.user
    } catch (err) {
        console.error("[Middleware] Error fetching user session:", err)
    }

    // Protected routes - require authentication
    const protectedRoutes = ["/dashboard", "/admin"]
    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    )

    // If trying to access a protected route without being logged in, redirect to auth
    if (isProtectedRoute && !user) {
        const redirectUrl = new URL("/auth", request.url)
        // Save the original URL to redirect back after login
        redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Use a faster check for admin access if possible
    if (user && request.nextUrl.pathname.startsWith("/admin")) {
        try {
            // Known admin emails as fallback when DB is unavailable or slow
            const ADMIN_EMAILS = ["agrilpasv@gmail.com"]
            const isAdminByEmail = ADMIN_EMAILS.includes(user.email || "")

            // Perform DB check with a controller to handle potential hangs on mobile
            // Note: Next.js middleware has a 30s timeout, but mobile connections can be fickle
            const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("role")
                .eq("id", user.id)
                .maybeSingle()

            if (profileError) {
                console.warn("[Middleware] DB Role check failed, using fallback:", profileError.message)
            }

            const isAdminByRole = profile?.role === "admin"

            // Allow access if admin by role OR by email fallback
            if (!isAdminByRole && !isAdminByEmail) {
                console.log(`[Middleware] Non-admin user ${user.email} attempted to access admin. Redirecting to dashboard.`)
                return NextResponse.redirect(new URL("/dashboard", request.url))
            }
        } catch (err) {
            console.error("[Middleware] Critical error in admin check:", err)
            // If everything fails, and they aren't on the fallback list, safety first
            const ADMIN_EMAILS = ["agrilpasv@gmail.com"]
            if (!ADMIN_EMAILS.includes(user.email || "")) {
                return NextResponse.redirect(new URL("/dashboard", request.url))
            }
        }
    }

    // If user is logged in and trying to access auth page, redirect to dashboard
    if (user && request.nextUrl.pathname === "/auth") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Analytics Tracking DISABLED - re-enable when Supabase I/O budget is upgraded
    // This was burning the free-tier daily I/O budget on every page visit
    // if (request.method === "GET" && !request.nextUrl.pathname.startsWith("/api") && !request.nextUrl.pathname.includes(".")) {
    //     supabase.from("page_analytics").insert({ ... }).catch(() => {})
    // }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
