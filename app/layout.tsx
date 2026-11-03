import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Footer } from "@/components/footer"
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

export const metadata: Metadata = {
  title: "Agrilpa - Plataforma Digital de Comercio Agrícola",
  description:
    "Conecta vendedores agrícolas con compradores mayoristas en todo el mundo. Del campo a tu negocio, nosotros gestionamos todo.",
  icons: {
    icon: "/favicon.png?v=2",
    apple: "/favicon.png?v=2",
  },
}

function ConditionalFooter({ pathname }: { pathname: string }) {
  const shouldHideFooter =
    pathname.startsWith("/dashboard") || pathname === "/auth" || pathname.startsWith("/productor/registro")

  if (shouldHideFooter) {
    return null
  }

  return <Footer />
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans antialiased`}>
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
