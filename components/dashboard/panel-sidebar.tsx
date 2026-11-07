"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, LogOut, LockKeyhole, Menu, Globe, type LucideIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/language-switcher"

export interface PanelMenuItem { href: string; label: string; icon: LucideIcon; notifications?: number }
interface Props {
  items: PanelMenuItem[]
  admin?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  locked?: boolean
  onLogout: () => void
  loggingOut?: boolean
}

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

const TRANSLATIONS_EN: Record<string, string> = {
  // Common / Dashboard navigation
  "Inicio": "Home",
  "Dashboard": "Dashboard",
  "Mensajes B2B": "B2B Messages",
  "Publicar producto": "Publish Product",
  "Publicaciones": "Publications",
  "Mis Publicaciones": "My Publications",
  "Solicitudes": "Requests",
  "Mis Solicitudes": "My Requests",
  "Cotizaciones": "Quotes",
  "Mis Ventas": "My Sales",
  "Mis Compras": "My Purchases",
  "Logística": "Logistics",
  "Transacciones": "Transactions",
  "Mi Perfil": "My Profile",
  "Configuración": "Settings",
  "Soporte": "Support",
  "Cerrar Sesión": "Log Out",
  "Cerrando sesión…": "Logging out…",
  "Cerrando sesión...": "Logging out...",

  // Admin navigation
  "Usuarios": "Users",
  "Gestión de Usuarios": "Users Management",
  "Planes y Suscripciones": "Plans & Subscriptions",
  "Membresías": "Memberships",
  "Gestión de Publicaciones": "Publications Management",
  "Verificador de Publicaciones": "Publications Verifier",
  "Publicaciones en Revisión": "Publications Under Review",
  "Gestión de Mensajes": "Messages Management",
  "Mensajes": "Messages",
  "Hero": "Hero",
  "Hero (Banners)": "Hero (Banners)",
  "Envíos y Seguimiento": "Shipments & Tracking",
  "Gestión de Pedidos": "Orders Management",
  "Gestión de Cuentas": "Accounts Management",
  "Registro de Actividad": "Activity Log",
  "Estadísticas de Clics": "Click Statistics",
  "Contactar": "Contact Clicks",
  "Contactos de Productos": "Product Contacts",
  "Mensajes de Contacto": "Contact Messages",
  "Contáctanos": "Contact Us",
  "Newsletter": "Newsletter",
  "Banners Publicitarios": "Ad Banners",
  "Visibilidad": "Visibility",
  "Suscripciones": "Subscriptions",
  "Compras": "Purchases",
  "Compras Globales": "Global Purchases",
  "Eliminaciones de Cuenta": "Account Deletions",
  "Reportes de Bajas": "Account Deletion Reports",

  // UI labels & placeholders
  "Administración": "Administration",
  "Tu espacio de negocio": "Your business space",
  "Buscar sección": "Search section",
  "Buscar sección del panel": "Search panel section",
  "Completa tu perfil para acceder al panel.": "Complete your profile to access the dashboard.",
  "No hay secciones con ese nombre.": "No sections with that name.",
  "Secciones de administración": "Administration sections",
  "Secciones de tu cuenta": "Account sections",
  "Menú de administración": "Administration menu",
  "Menú de tu cuenta": "Account menu",
  "Navega por las secciones de Agrilpa.": "Navigate through Agrilpa sections.",
  "Abrir menú de administración": "Open administration menu",
  "Abrir menú del panel": "Open panel menu",
  "Idioma": "Language",
}

export function PanelSidebar({ items, admin = false, open, onOpenChange, locked = false, onLogout, loggingOut }: Props) {
  const pathname = usePathname()
  const [search, setSearch] = useState("")
  const [lang, setLang] = useState<"es" | "en">("es")
  const desktopSearch = useRef<HTMLInputElement>(null)
  const mobileSearch = useRef<HTMLInputElement>(null)

  // Sync language with localStorage & cookies & custom event
  useEffect(() => {
    const readCurrentLang = (): "es" | "en" => {
      try {
        const saved = localStorage.getItem("agrilpa_language") as "es" | "en" | null
        if (saved === "en" || saved === "es") return saved
        const match = document.cookie.match(/googtrans=\/es\/(en|es)/)
        if (match && match[1]) return match[1] as "es" | "en"
      } catch {
        // fallback
      }
      return "es"
    }

    setLang(readCurrentLang())

    const handleLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<"es" | "en">
      if (customEvent.detail && (customEvent.detail === "es" || customEvent.detail === "en")) {
        setLang(customEvent.detail)
      } else {
        setLang(readCurrentLang())
      }
    }

    window.addEventListener("agrilpa:language_change", handleLangChange)
    window.addEventListener("storage", handleLangChange)
    return () => {
      window.removeEventListener("agrilpa:language_change", handleLangChange)
      window.removeEventListener("storage", handleLangChange)
    }
  }, [])

  const t = useCallback((text: string): string => {
    if (lang === "en" && TRANSLATIONS_EN[text]) {
      return TRANSLATIONS_EN[text]
    }
    return text
  }, [lang])

  useEffect(() => {
    if (!admin) return
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !locked) {
        event.preventDefault()
        if (window.matchMedia("(min-width: 768px)").matches) desktopSearch.current?.focus()
        else { onOpenChange(true); requestAnimationFrame(() => mobileSearch.current?.focus()) }
      }
    }
    document.addEventListener("keydown", shortcut)
    return () => document.removeEventListener("keydown", shortcut)
  }, [admin, locked, onOpenChange])

  const footerRoutes = admin ? ["/admin/soporte"] : ["/dashboard/perfil", "/dashboard/configuracion", "/dashboard/soporte"]
  
  // Search filter supports both original Spanish and translated English
  const filtered = items.filter(item => {
    const translated = t(item.label)
    return normalize(item.label).includes(normalize(search)) || normalize(translated).includes(normalize(search))
  })
  
  const primary = filtered.filter(item => !footerRoutes.includes(item.href))
  const footer = filtered.filter(item => footerRoutes.includes(item.href)).sort((a, b) => footerRoutes.indexOf(a.href) - footerRoutes.indexOf(b.href))

  const row = (item: PanelMenuItem) => {
    const active = pathname === item.href || (!["/", "/admin", "/dashboard"].includes(item.href) && pathname.startsWith(`${item.href}/`))
    const Icon = item.icon
    const label = t(item.label)
    const rowClassName = `flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active ? "bg-muted/40 text-foreground" : "text-foreground hover:bg-muted/40 hover:text-foreground"
    }`
    const rowChildren = (
      <>
        <Icon aria-hidden="true" className={`h-[22px] w-[22px] shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`} strokeWidth={1.7} />
        <span className="flex-1">{label}</span>
        {!!item.notifications && item.notifications > 0 && (
          <span
            aria-label={`${item.notifications} ${lang === "en" ? "notifications" : "notificaciones"}`}
            className="inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-full bg-red-600 px-1.5 text-center text-xs font-bold text-white shadow-sm"
          >
            {item.notifications > 99 ? "99+" : item.notifications}
          </span>
        )}
      </>
    )

    if (item.href === "/") {
      return (
        <a
          key={item.href}
          href="/"
          aria-current={active ? "page" : undefined}
          onClick={() => onOpenChange(false)}
          className={rowClassName}
        >
          {rowChildren}
        </a>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => onOpenChange(false)}
        className={rowClassName}
      >
        {rowChildren}
      </Link>
    )
  }

  const contents = (mobile: boolean) => (
    <>
      <div className={`px-5 pt-6 ${admin ? "pb-4" : "flex flex-col items-center pb-4 text-center"}`}>
        <a href="/" aria-label="Agrilpa, inicio" onClick={() => onOpenChange(false)} className={admin ? "inline-block" : "flex justify-center"}>
          <Image src="/agrilpa-logo.svg" alt="Agrilpa" width={229} height={66} style={{ width: "auto", height: "auto", maxWidth: 145 }} priority />
        </a>
        <p className={`mt-2 text-sm text-muted-foreground ${admin ? "mb-5" : "mb-2 text-center"}`}>
          {t(admin ? "Administración" : "Tu espacio de negocio")}
        </p>
        {admin && !locked && (
          <label className="flex h-12 items-center gap-2.5 rounded-xl border border-border px-3 focus-within:ring-2 focus-within:ring-primary">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={mobile ? mobileSearch : desktopSearch}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("Buscar sección")}
              aria-label={t("Buscar sección del panel")}
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        )}
      </div>

      {locked ? (
        <div className="flex flex-1 flex-col items-center gap-3 px-5 pt-8 text-center text-sm text-muted-foreground">
          <LockKeyhole className="h-6 w-6" />
          <p>{t("Completa tu perfil para acceder al panel.")}</p>
        </div>
      ) : (
        <>
          <nav aria-label={t(admin ? "Secciones de administración" : "Secciones de tu cuenta")} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-5">
            {primary.map(row)}
            {!filtered.length && <p className="px-3 py-4 text-sm text-muted-foreground" role="status">{t("No hay secciones con ese nombre.")}</p>}
          </nav>
          <div className="space-y-0.5 border-t border-border px-3 py-3">{footer.map(row)}</div>
        </>
      )}

      <div className="px-3 pb-4 space-y-2">
        {/* Sleek inline language switcher row inside the sidebar */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground bg-muted/20">
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{t("Idioma")}</span>
          </span>
          <LanguageSwitcher />
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-base text-muted-foreground hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 cursor-pointer"
        >
          <LogOut className="h-[22px] w-[22px]" aria-hidden="true" />
          {loggingOut ? t("Cerrando sesión…") : t("Cerrar Sesión")}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Top Bar Controls */}
      <button
        id="panel-menu-toggle"
        type="button"
        aria-label={t(admin ? "Abrir menú de administración" : "Abrir menú del panel")}
        aria-expanded={open}
        aria-controls="panel-mobile-menu"
        onClick={() => onOpenChange(!open)}
        className="fixed left-4 top-3 z-40 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-primary md:hidden cursor-pointer"
      >
        <Menu size={24} aria-hidden="true" />
      </button>

      <div className="fixed right-4 top-3 z-40 flex items-center md:hidden bg-background border border-border rounded-xl shadow-sm px-1.5 py-1">
        <LanguageSwitcher />
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[280px] shrink-0 self-start flex-col border-r border-border bg-background md:flex xl:w-[288px]">
        {contents(false)}
      </aside>

      {/* Mobile Drawer Sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          id="panel-mobile-menu"
          side="left"
          className="w-[300px] max-w-[90vw] gap-0 bg-background [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center"
          onCloseAutoFocus={event => {
            event.preventDefault()
            document.getElementById("panel-menu-toggle")?.focus()
          }}
        >
          <SheetTitle className="sr-only">{t(admin ? "Menú de administración" : "Menú de tu cuenta")}</SheetTitle>
          <SheetDescription className="sr-only">{t("Navega por las secciones de Agrilpa.")}</SheetDescription>
          {contents(true)}
        </SheetContent>
      </Sheet>
    </>
  )
}
