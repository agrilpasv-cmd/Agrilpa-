"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, LogOut, LockKeyhole, Menu, type LucideIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"

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

/** One visual system for both panels; navigation is supplied by each existing layout. */
export function PanelSidebar({ items, admin = false, open, onOpenChange, locked = false, onLogout, loggingOut }: Props) {
  const pathname = usePathname()
  const [search, setSearch] = useState("")
  const desktopSearch = useRef<HTMLInputElement>(null)
  const mobileSearch = useRef<HTMLInputElement>(null)
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
  const filtered = items.filter(item => normalize(item.label).includes(normalize(search)))
  const primary = filtered.filter(item => !footerRoutes.includes(item.href))
  const footer = filtered.filter(item => footerRoutes.includes(item.href)).sort((a, b) => footerRoutes.indexOf(a.href) - footerRoutes.indexOf(b.href))
  const row = (item: PanelMenuItem) => {
    const active = pathname === item.href || (!["/", "/admin", "/dashboard"].includes(item.href) && pathname.startsWith(`${item.href}/`))
    const Icon = item.icon
    return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} onClick={() => onOpenChange(false)}
      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "bg-muted/40 text-foreground" : "text-foreground hover:bg-muted/40 hover:text-foreground"}`}>
      <Icon aria-hidden="true" className={`h-[22px] w-[22px] shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`} strokeWidth={1.7} />
      <span className="flex-1">{item.label}</span>
      {!!item.notifications && item.notifications > 0 && <span aria-label={`${item.notifications} notificaciones`} className="min-w-6 rounded-full border border-border bg-background px-1.5 py-0.5 text-center text-xs text-foreground">{item.notifications > 99 ? "99+" : item.notifications}</span>}
    </Link>
  }
  const contents = (mobile: boolean) => <>
    <div className={`px-5 pt-6 ${admin ? "pb-4" : "flex flex-col items-center pb-4 text-center"}`}>
      <Link href="/" aria-label="Agrilpa, inicio" onClick={() => onOpenChange(false)} className={admin ? "inline-block" : "flex justify-center"}>
        <Image src="/agrilpa-logo.svg" alt="Agrilpa" width={229} height={66} style={{ width: "auto", height: "auto", maxWidth: 145 }} priority />
      </Link>
      <p className={`mt-2 text-sm text-muted-foreground ${admin ? "mb-5" : "mb-2 text-center"}`}>{admin ? "Administración" : "Tu espacio de negocio"}</p>
      {admin && !locked && <label className="flex h-12 items-center gap-2.5 rounded-xl border border-border px-3 focus-within:ring-2 focus-within:ring-primary">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input ref={mobile ? mobileSearch : desktopSearch} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar sección" aria-label="Buscar sección del panel" className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
      </label>}
    </div>
    {locked ? <div className="flex flex-1 flex-col items-center gap-3 px-5 pt-8 text-center text-sm text-muted-foreground"><LockKeyhole className="h-6 w-6" /><p>Completa tu perfil para acceder al panel.</p></div> : <>
      <nav aria-label={admin ? "Secciones de administración" : "Secciones de tu cuenta"} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-5">
        {primary.map(row)}
        {!filtered.length && <p className="px-3 py-4 text-sm text-muted-foreground" role="status">No hay secciones con ese nombre.</p>}
      </nav>
      <div className="space-y-0.5 border-t border-border px-3 py-3">{footer.map(row)}</div>
    </>}
    <div className="px-3 pb-4"><button type="button" onClick={onLogout} disabled={loggingOut} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-base text-muted-foreground hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"><LogOut className="h-[22px] w-[22px]" aria-hidden="true" />{loggingOut ? "Cerrando sesión…" : "Cerrar Sesión"}</button></div>
  </>
  return <>
    <button id="panel-menu-toggle" type="button" aria-label={admin ? "Abrir menú de administración" : "Abrir menú del panel"} aria-expanded={open} aria-controls="panel-mobile-menu" onClick={() => onOpenChange(!open)} className="fixed left-4 top-3 z-40 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-primary md:hidden"><Menu size={24} aria-hidden="true" /></button>
    <aside className="sticky top-0 hidden h-dvh w-[280px] shrink-0 self-start flex-col border-r border-border bg-background md:flex xl:w-[288px]">{contents(false)}</aside>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent id="panel-mobile-menu" side="left" className="w-[300px] max-w-[90vw] gap-0 bg-background [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center" onCloseAutoFocus={event => { event.preventDefault(); document.getElementById("panel-menu-toggle")?.focus() }}>
        <SheetTitle className="sr-only">Menú de {admin ? "administración" : "tu cuenta"}</SheetTitle>
        <SheetDescription className="sr-only">Navega por las secciones de Agrilpa.</SheetDescription>
        {contents(true)}
      </SheetContent>
    </Sheet>
  </>
}
