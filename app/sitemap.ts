import type { MetadataRoute } from "next"
import { allProducts } from "@/lib/products-data"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agrilpa.com"
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { route: "", priority: 1.0, changeFrequency: "daily" as const },
    { route: "/productos", priority: 0.95, changeFrequency: "daily" as const },
    { route: "/como-funciona", priority: 0.85, changeFrequency: "weekly" as const },
    { route: "/para-vendedores", priority: 0.85, changeFrequency: "weekly" as const },
    { route: "/compradores", priority: 0.85, changeFrequency: "weekly" as const },
    { route: "/mercado", priority: 0.8, changeFrequency: "daily" as const },
    { route: "/solicitud-compra", priority: 0.8, changeFrequency: "weekly" as const },
    { route: "/sourcing", priority: 0.75, changeFrequency: "weekly" as const },
    { route: "/socios-logisticos", priority: 0.7, changeFrequency: "monthly" as const },
    { route: "/financiamiento", priority: 0.7, changeFrequency: "monthly" as const },
    { route: "/guia-exportacion", priority: 0.75, changeFrequency: "monthly" as const },
    { route: "/casos-exito", priority: 0.7, changeFrequency: "monthly" as const },
    { route: "/sobre-nosotros", priority: 0.65, changeFrequency: "monthly" as const },
    { route: "/contacto", priority: 0.65, changeFrequency: "monthly" as const },
    { route: "/terminos-uso", priority: 0.3, changeFrequency: "yearly" as const },
    { route: "/privacidad", priority: 0.3, changeFrequency: "yearly" as const },
    { route: "/cookies", priority: 0.3, changeFrequency: "yearly" as const },
  ].map((item) => ({
    url: `${baseUrl}${item.route}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }))

  const staticProductRoutes: MetadataRoute.Sitemap = allProducts.map((product) => ({
    url: `${baseUrl}/producto/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...staticProductRoutes]
}

