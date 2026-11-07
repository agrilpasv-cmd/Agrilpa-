"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/footer"

export function FooterWrapper() {
  const pathname = usePathname()

  const shouldHideFooter =
    pathname === "/" ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname === "/auth" ||
    pathname?.startsWith("/productor/registro")

  if (shouldHideFooter) {
    return null
  }

  return <Footer />
}
