import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { FooterWrapper } from "@/components/footer-wrapper"
import { NavbarWrapper } from "@/components/navbar-wrapper"
import { RouteTracker } from "@/components/route-tracker"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

import { ChatProvider } from "@/components/chat/chat-context"
import { GlobalChatWrapper } from "@/components/chat/global-chat-wrapper"
import { AutoCapitalizeProvider } from "@/components/utils/auto-capitalize-provider"
import { GlobalTranslator } from "@/components/global-translator"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://agrilpa.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Agrilpa | Marketplace B2B Agrícola para Exportar e Importar",
    template: "%s | Agrilpa Marketplace B2B Agrícola",
  },
  description:
    "Marketplace B2B para exportar e importar café, cacao, frutas, verduras y cereales al por mayor. Cotiza directo con productores, sin intermediarios.",
  keywords: [
    "marketplace B2B agrícola",
    "exportar productos agrícolas",
    "importar café al por mayor",
    "proveedores agrícolas verificados",
    "comercio agrícola internacional",
    "cacao al por mayor",
    "frutas y verduras de exportación",
    "agricultural B2B marketplace",
  ],
  alternates: {
    canonical: "/",
    languages: {
      es: "/",
      en: "/?lang=en",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_LA",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: "Agrilpa",
    title: "Agrilpa | Marketplace B2B Agrícola para Exportar e Importar",
    description:
      "Conecta directamente con productores agrícolas y compradores mayoristas internacionales. Cotiza café, cacao, frutas, verduras y granos al por mayor.",
    images: [
      {
        url: "/agricultural-landscape-modern-farm.jpg",
        width: 1200,
        height: 630,
        alt: "Agrilpa - Marketplace B2B Agrícola Global para Productores y Compradores Mayoristas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agrilpa | Marketplace B2B Agrícola para Exportar e Importar",
    description:
      "Marketplace B2B para exportar e importar café, cacao, frutas, verduras y cereales al por mayor. Cotiza directo con productores.",
    images: ["/agricultural-landscape-modern-farm.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png?v=2",
    apple: "/favicon.png?v=2",
  },
}

const organizationAndWebsiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Agrilpa",
      legalName: "Agrilpa",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/agrilpa-logo.svg`,
      },
      description:
        "Agrilpa es una plataforma B2B que conecta productores agrícolas con compradores mayoristas internacionales de forma segura, gestionando cotizaciones, verificación empresarial y logística comercial.",
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+503-7489-9726",
          contactType: "customer support",
          email: "agrilpasv@gmail.com",
          availableLanguage: ["Spanish", "English"],
          areaServed: "Worldwide",
        },
      ],
      sameAs: ["https://www.linkedin.com/company/agrilpa/"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Agrilpa",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: ["es", "en"],
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/productos?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationAndWebsiteSchema),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <GlobalTranslator />
        <ChatProvider>
          <AutoCapitalizeProvider />
          <RouteTracker />
          <NavbarWrapper />
          {children}
          <Toaster />
          <FooterWrapper />
          <GlobalChatWrapper />
        </ChatProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
