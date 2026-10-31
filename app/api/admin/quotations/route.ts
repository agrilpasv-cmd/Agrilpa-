import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        const { data: rawQuotations, error } = await supabaseAdmin
            .from("quotations")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) {
            if (
                error.code === "42P01" ||
                error.code === "PGRST205" ||
                error.message?.includes("does not exist") ||
                error.message?.includes("schema cache")
            ) {
                return NextResponse.json({
                    quotations: [],
                    stats: {
                        total: 0,
                        pending: 0,
                        replied: 0,
                        rejected: 0,
                        topProducts: [],
                    },
                })
            }
            console.error("Error fetching admin quotations:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const rows = rawQuotations || []
        const userIds = Array.from(
            new Set(
                rows
                    .flatMap((q: any) => [q.seller_id, q.buyer_id])
                    .filter((id): id is string => typeof id === "string" && id.length > 0),
            ),
        )

        const usersById = new Map<
            string,
            { company_name: string | null; full_name: string | null; email: string }
        >()

        if (userIds.length > 0) {
            const { data: usersData } = await supabaseAdmin
                .from("users")
                .select("id, company_name, full_name, email")
                .in("id", userIds)

            for (const u of usersData || []) {
                usersById.set(u.id, {
                    company_name: u.company_name ?? null,
                    full_name: u.full_name ?? null,
                    email: u.email ?? "",
                })
            }
        }

        const quotations = rows.map((q: any) => ({
            ...q,
            seller: q.seller_id ? usersById.get(q.seller_id) : undefined,
            buyer: q.buyer_id ? usersById.get(q.buyer_id) : undefined,
        }))

        const stats = {
            total: quotations.length,
            pending: quotations.filter((q: any) => q.status === "pending").length,
            replied: quotations.filter((q: any) => q.status === "replied").length,
            rejected: quotations.filter((q: any) => q.status === "rejected").length,
            topProducts: {} as Record<string, { title: string; count: number }>,
        }

        quotations.forEach((q: any) => {
            if (q.product_id) {
                if (!stats.topProducts[q.product_id]) {
                    stats.topProducts[q.product_id] = {
                        title: q.product_title || "Producto desconocido",
                        count: 0,
                    }
                }
                stats.topProducts[q.product_id].count++
            }
        })

        const topProductsArray = Object.values(stats.topProducts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        return NextResponse.json(
            {
                quotations,
                stats: {
                    ...stats,
                    topProducts: topProductsArray,
                },
            },
            {
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                    Pragma: "no-cache",
                },
            },
        )
    } catch (error: any) {
        console.error("[Admin Quotations API] Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        const ids = searchParams.get("ids")

        if (!id && !ids) {
            return NextResponse.json({ error: "ID or IDs are required" }, { status: 400 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        let query = supabaseAdmin.from("quotations").delete()

        if (ids) {
            const idList = ids.split(",")
            query = query.in("id", idList)
        } else {
            query = query.eq("id", id)
        }

        const { error } = await query

        if (error) {
            console.error("Error deleting quotation(s):", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("[Admin Quotations DELETE] Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
