import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agrilpa.com"

  const disallowedPaths = [
    "/admin/",
    "/dashboard/",
    "/api/",
    "/auth/",
    "/workspace-admin-preview/",
    "/workspace-admin-sections/",
    "/workspace-chat-preview/",
    "/contact-workspace-preview/",
  ]

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/productos",
          "/producto/",
          "/mercado",
          "/compradores",
          "/para-vendedores",
          "/como-funciona",
          "/solicitud-compra",
          "/sourcing",
          "/socios-logisticos",
          "/financiamiento",
          "/guia-exportacion",
          "/casos-exito",
          "/sobre-nosotros",
          "/contacto",
        ],
        disallow: disallowedPaths,
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: ["/"],
        disallow: disallowedPaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

