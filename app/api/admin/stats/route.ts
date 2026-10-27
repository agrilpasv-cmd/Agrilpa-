import { NextResponse } from "next/server"
import { requireContactAdmin } from "@/lib/contact/server"

export const dynamic = 'force-dynamic'

interface StatsUser {
    id: string
    created_at: string
    plan_type?: string | null
    user_type?: string | null
    user_sub_type?: string | null
    how_heard_about_us?: string | null
    has_export_certificates?: boolean | null
    annual_volume?: string | number | null
    provider_countries?: string[] | null
    supply_countries?: string[] | null
}

export async function GET(request: Request) {
    try {
        const permission = await requireContactAdmin()
        if (permission.response) return permission.response
        const supabaseAdmin = permission.admin!

        // 1. Fetch Users Count & Breakdown
        const { data: profiles, error: usersError } = await supabaseAdmin
            .from("users")
            .select("id, created_at, plan_type, user_type, user_sub_type, how_heard_about_us, has_export_certificates, annual_volume, provider_countries, supply_countries")

        // If users table fails, try auth users as fallback for count
        let usersData: StatsUser[] = profiles || []
        if (usersError) {
            console.error("Error fetching users table:", usersError)
            // Fallback: list auth users
            const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
            if (!authError && authUsers) {
                usersData = authUsers.map(u => ({ id: u.id, created_at: u.created_at }))
            }
        }

        const totalUsers = usersData.length

        // Calculate monthly registrations for the chart (last 6 months)
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        const currentMonth = new Date().getMonth()

        // Initialize last 6 months buckets
        const chartData: { name: string; monthIdx: number; year: number; usuarios: number }[] = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(currentMonth - i)
            const monthIdx = d.getMonth()
            chartData.push({
                name: months[monthIdx],
                monthIdx: monthIdx,
                year: d.getFullYear(),
                usuarios: 0
            })
        }

        usersData.forEach((user: any) => {
            const date = new Date(user.created_at)
            const m = date.getMonth()
            const y = date.getFullYear()

            const bucket = chartData.find(b => b.monthIdx === m && b.year === y)
            if (bucket) {
                bucket.usuarios++
            }
        })

        // Clean up chart data for frontend
        const monthlyData = chartData.map(({ name, usuarios }) => ({ name, usuarios }))

        // 1b. Plan Breakdown
        const proUsers = usersData.filter((u: any) => u.plan_type === 'pro').length
        const freeUsers = totalUsers - proUsers

        // User type breakdown (role comprador / vendedor / industrial)
        const compradorUsers = usersData.filter((u: any) => u.user_type === 'comprador').length
        const vendedorUsers = usersData.filter((u: any) => u.user_type === 'vendedor').length
        const industrialUsers = usersData.filter((u: any) => u.user_type === 'empresa').length

        // Acquisition Stats breakdown
        const acquisitionSourceCounts: Record<string, number> = {}
        usersData.forEach((u: any) => {
            const source = u.how_heard_about_us || 'Desconocido'
            if (acquisitionSourceCounts[source]) {
                acquisitionSourceCounts[source]++
            } else {
                acquisitionSourceCounts[source] = 1
            }
        })
        const acquisitionStats = Object.keys(acquisitionSourceCounts)
            .map(source => ({ source, count: acquisitionSourceCounts[source] }))
            .sort((a, b) => b.count - a.count)

        // --- BUSINESS METRICS EXTRACTION ---
        let certCon = 0
        let certSin = 0
        const actorCounts: Record<string, number> = {}
        const volumeCounts: Record<string, number> = {}
        const countryCounts: Record<string, number> = {}

        usersData.forEach((u: any) => {
            // Certification
            if (u.has_export_certificates === true) certCon++
            else if (u.has_export_certificates === false) certSin++

            // Actor Type (Sub-type fallback to type)
            const actorType = u.user_sub_type || u.user_type || 'Desconocido'
            actorCounts[actorType] = (actorCounts[actorType] || 0) + 1

            // Volume
            const vol = u.annual_volume || 'No especificado'
            volumeCounts[vol] = (volumeCounts[vol] || 0) + 1

            // Countries
            const pCountries = Array.isArray(u.provider_countries) ? u.provider_countries : []
            const sCountries = Array.isArray(u.supply_countries) ? u.supply_countries : []
            const allCountries = [...pCountries, ...sCountries].filter(Boolean)

            allCountries.forEach((country: string) => {
                countryCounts[country] = (countryCounts[country] || 0) + 1
            })
        })

        const businessMetrics = {
            certificationStats: [
                { name: "Con Certificados", value: certCon },
                { name: "Sin Certificados", value: certSin }
            ],
            actorTypeStats: Object.keys(actorCounts).map(k => ({ name: k, value: actorCounts[k] })).sort((a, b) => b.value - a.value),
            volumeStats: Object.keys(volumeCounts).map(k => ({ name: k, value: volumeCounts[k] })).sort((a, b) => b.value - a.value),
            countryStats: Object.keys(countryCounts).map(k => ({ name: k, value: countryCounts[k] })).sort((a, b) => b.value - a.value).slice(0, 10) // Top 10
        }
        // --- END BUSINESS METRICS ---

        // 2. Fetch Subscriptions Count
        const { count: subscriptionsCount, error: subsError } = await supabaseAdmin
            .from("subscriptions")
            .select("*", { count: 'exact', head: true })

        // 3. Admin Count (Estimation based on our knowledge or metadata if available)
        // For now we'll fetch roles if possible, or just assume distinct role management
        // We already have enriched profiles in users endpoint, but for speed just count
        // If we want accurate admin count we need to check roles. 
        // Let's assume admins are in the 'users' table with a role column as per admin/page.tsx logic
        // But since we selected only id/created_at, let's re-select if we can, or just skip strict admin count for speed
        // Actually, let's try to get role.
        const { data: admins, error: adminError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("role", "admin")

        const adminUsers = admins?.length || 0
        const regularUsers = totalUsers - adminUsers
        const adminIds = (admins || []).map((a: any) => a.id)

        // 3b. Count quotations excluding those sent/received by admins
        let totalQuotations = 0
        try {
            let query = supabaseAdmin
                .from("quotations")
                .select("id", { count: 'exact', head: true })
            if (adminIds.length > 0) {
                query = query.not("buyer_id", "in", `(${adminIds.join(",")})`)
            }
            const { count } = await query
            totalQuotations = count || 0
        } catch (e) {
            console.error("[Stats API] Error counting quotations:", e)
        }

        // 3c. Count product contact clicks
        let productContactClicks = 0
        try {
            const { count } = await supabaseAdmin
                .from("product_contact_clicks")
                .select("id", { count: 'exact', head: true })
            productContactClicks = count || 0
        } catch (e) {
            console.error("[Stats API] Error counting contact clicks:", e)
        }

        // 4. Analytics Data - (Disabled to reduce database load)
        const detailedAnalytics = null

        // Calculate daily active users for today (in local server time or UTC, last 30 days of activities)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        let activeRegisteredToday = 0
        let activeGuestsToday = 0
        let activeUsersToday = 0
        let last7DaysActive: { date: string; registered: number; guests: number; total: number }[] = []

        try {
            const { data: activityRows, error: activityError } = await supabaseAdmin
                .from("user_activities")
                .select("user_id, ip_address, user_agent, created_at")
                .gte("created_at", thirtyDaysAgo.toISOString())

            const dailyActiveMap: Record<string, { registered: Set<string>, guests: Set<string> }> = {}

            if (!activityError && activityRows) {
                activityRows.forEach((row: any) => {
                    const dateStr = new Date(row.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    if (!dailyActiveMap[dateStr]) {
                        dailyActiveMap[dateStr] = { registered: new Set(), guests: new Set() }
                    }

                    if (row.user_id) {
                        dailyActiveMap[dateStr].registered.add(row.user_id)
                    } else {
                        const guestId = row.ip_address || (row.user_agent || "")
                        if (guestId) {
                            dailyActiveMap[dateStr].guests.add(guestId)
                        }
                    }
                })
            }

            // Get today's key in 'es-ES' format
            const todayStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const todayData = dailyActiveMap[todayStr] || { registered: new Set(), guests: new Set() }
            
            activeRegisteredToday = todayData.registered.size
            activeGuestsToday = todayData.guests.size
            activeUsersToday = activeRegisteredToday + activeGuestsToday

            // Build list of last 7 days of daily active users for display
            for (let i = 6; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                const dStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                const dayData = dailyActiveMap[dStr] || { registered: new Set(), guests: new Set() }
                last7DaysActive.push({
                    date: dStr,
                    registered: dayData.registered.size,
                    guests: dayData.guests.size,
                    total: dayData.registered.size + dayData.guests.size
                })
            }
        } catch (e) {
            console.error("[Stats API] Error fetching user activities:", e)
        }

        const onboardingRetention = null
        const avgOnboardingTime = null
        const recentEvents: unknown[] = []
        const throughput: unknown[] = []

        return NextResponse.json({
            totalUsers,
            totalSubscriptions: subscriptionsCount || 0,
            adminUsers,
            regularUsers,
            proUsers,
            freeUsers,
            totalQuotations,
            monthlyData,
            analyticsData: [],
            detailedAnalytics,
            databaseStatus: "Activa",
            compradorUsers,
            vendedorUsers,
            industrialUsers,
            activeRegisteredToday,
            activeGuestsToday,
            activeUsersToday,
            last7DaysActive,
            acquisitionStats,
            productContactClicks,
            onboardingRetention,
            avgOnboardingTime,
            recentEvents,
            throughput,
            businessMetrics
        }, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                Pragma: "no-cache",
            }
        })

    } catch (error: any) {
        console.error("[Stats API] Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
