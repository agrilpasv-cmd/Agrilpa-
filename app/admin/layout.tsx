"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Users,
  Home,
  Crown,
  Mail,
  Truck,
  ShoppingCart,
  MessageSquare,
  Package,
  Eye,
  LayoutDashboard,
  ClipboardList,
  MousePointer2,
  UserMinus,
  Image as ImageIcon,
  Headphones,
  MessageCircle,
} from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { PanelSidebar } from "@/components/dashboard/panel-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [unreadContactCount, setUnreadContactCount] = useState(0)
  const [unreadContactanosCount, setUnreadContactanosCount] = useState(0)
  const [unreadSupportCount, setUnreadSupportCount] = useState(0)
  const [unreadMensajesCount, setUnreadMensajesCount] = useState(0)
  const [unreadProductContactCount, setUnreadProductContactCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const [resContactar, resContactanos, resSupport, resMensajes, resProductContacts] = await Promise.all([
        fetch(`/api/admin/contact-clicks/unread-count?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/admin/contact-submissions/unread-count?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/admin/support/unread-count?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/admin/conversations/unread-count?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/admin/product-contacts/unread-count?t=${Date.now()}`, { cache: "no-store" }),
      ])

      if (resContactar.ok) {
        const data = await resContactar.json()
        if (typeof data.unreadCount === "number") {
          setUnreadContactCount(data.unreadCount)
        }
      }

      if (resContactanos.ok) {
        const data2 = await resContactanos.json()
        if (typeof data2.unreadCount === "number") {
          setUnreadContactanosCount(data2.unreadCount)
        }
      }

      if (resSupport.ok) {
        const data3 = await resSupport.json()
        if (typeof data3.unreadCount === "number") {
          setUnreadSupportCount(data3.unreadCount)
        }
      }

      if (resMensajes.ok) {
        const data4 = await resMensajes.json()
        if (typeof data4.unreadCount === "number") {
          setUnreadMensajesCount(data4.unreadCount)
        }
      }
      if (resProductContacts.ok) {
        const data = await resProductContacts.json()
        if (typeof data.unreadCount === "number") setUnreadProductContactCount(data.unreadCount)
      }
    } catch (error) {
      console.error("Failed to fetch unread contact counts:", error)
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
  }, [pathname, fetchUnreadCount])

  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 15000)
    window.addEventListener("update-unread-count", fetchUnreadCount)
    window.addEventListener("update-contactanos-unread-count", fetchUnreadCount)
    window.addEventListener("update-support-unread-count", fetchUnreadCount)
    window.addEventListener("update-mensajes-unread-count", fetchUnreadCount)

    return () => {
      clearInterval(interval)
      window.removeEventListener("update-unread-count", fetchUnreadCount)
      window.removeEventListener("update-contactanos-unread-count", fetchUnreadCount)
      window.removeEventListener("update-support-unread-count", fetchUnreadCount)
      window.removeEventListener("update-mensajes-unread-count", fetchUnreadCount)
    }
  }, [fetchUnreadCount])

  const menuItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/mensajes", label: "Mensajes", icon: MessageCircle },
    { href: "/admin/soporte", label: "Soporte", icon: Headphones },
    { href: "/admin/hero", label: "Hero", icon: ImageIcon },
    { href: "/admin/usuarios", label: "Gestión de Usuarios", icon: Users },
    { href: "/admin/membresias", label: "Membresías", icon: Crown },
    { href: "/admin/cotizaciones", label: "Cotizaciones", icon: ClipboardList },
    { href: "/admin/contactar", label: "Contactar", icon: MousePointer2 },
    { href: "/admin/publicaciones", label: "Publicaciones", icon: Package },
    { href: "/admin/visibilidad", label: "Visibilidad", icon: Eye },
    { href: "/admin/suscripciones", label: "Suscripciones", icon: Mail },
    { href: "/admin/compras", label: "Compras", icon: ShoppingCart },
    { href: "/admin/actividad", label: "Registro de Actividad", icon: MousePointer2 },
    { href: "/admin/contactanos", label: "Contáctanos", icon: MessageSquare },
    { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    { href: "/admin/bajas", label: "Reportes de Bajas", icon: UserMinus },
  ]

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      const { createBrowserClient } = await import("@/lib/supabase/client")
      const supabase = createBrowserClient()

      await Promise.allSettled([
        supabase.auth.signOut(),
        fetch("/api/auth/logout", { method: "POST" }),
      ])

      localStorage.clear()
      sessionStorage.clear()

      window.location.replace("/")
    } catch (error) {
      console.error("[Admin] Error al cerrar sesión:", error)
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace("/")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <PanelSidebar
            items={menuItems.map((item) => ({
              ...item,
              notifications:
                item.href === "/admin/mensajes"
                  ? unreadMensajesCount + unreadProductContactCount
                  : item.href === "/admin/soporte"
                    ? unreadSupportCount
                    : item.href === "/admin/contactar"
                      ? unreadContactCount
                      : item.href === "/admin/contactanos"
                        ? unreadContactanosCount
                        : 0,
            }))}
            admin
            open={isSidebarOpen}
            onOpenChange={setIsSidebarOpen}
            onLogout={handleLogout}
            loggingOut={isLoggingOut}
          />

          <main className="min-w-0 flex-1 pt-16 md:pt-0">{children}</main>
        </div>
      </div>
      <Toaster />
    </>
  )
}
