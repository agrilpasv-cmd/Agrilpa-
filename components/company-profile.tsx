"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Building2, CalendarDays, Check, ChevronRight, ExternalLink, FileText, Globe2, Leaf, MapPin, MessageSquare, Package, Search, Share2, Sprout, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProductImage } from "@/components/product-image"
import { useGlobalChat } from "@/components/chat/chat-context"
import { companyMemberSince, companyProductPrice, publicWebUrl, type PublicCompanyProfile, type CompanyProduct } from "@/lib/public-company-profile"

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
const muted = "text-muted-foreground"
const green = "text-primary"
const action = "h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90"

export function CompanyProfile() {
  const { userId } = useParams<{ userId: string }>()
  const { currentUserId, openChat, isUserOnline } = useGlobalChat()
  const [profile, setProfile] = useState<PublicCompanyProfile | null>(null)
  const [products, setProducts] = useState<CompanyProduct[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading")
  const [catalogueError, setCatalogueError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState("recent")
  const [contactOpen, setContactOpen] = useState(false)
  const [shareStatus, setShareStatus] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    setStatus("loading")
    setCatalogueError(false)
    setProfile(null)
    setProducts([])
    setQuery("")
    setCategory("")
    setContactOpen(false)
    setShareStatus("")
    async function load() {
      try {
        const encodedId = encodeURIComponent(userId)
        // Keep the company visible even when its catalogue cannot be fetched.
        const [profileResult, catalogueResult] = await Promise.allSettled([
          fetch(`/api/user/public-profile?userId=${encodedId}`, { signal: controller.signal, cache: "no-store" }),
          fetch(`/api/products/get-products-by-user?userId=${encodedId}`, { signal: controller.signal, cache: "no-store" }),
        ])
        if (controller.signal.aborted) return
        if (profileResult.status === "rejected") throw profileResult.reason
        if ([400, 404].includes(profileResult.value.status)) { setStatus("missing"); return }
        if (!profileResult.value.ok) throw new Error("Profile unavailable")
        const data = await profileResult.value.json()
        if (!data.profile) throw new Error("Profile unavailable")
        let catalogue: CompanyProduct[] = []
        try {
          if (catalogueResult.status === "rejected" || !catalogueResult.value.ok) throw new Error("Catalogue unavailable")
          const catalogueData = await catalogueResult.value.json()
          if (!Array.isArray(catalogueData.products)) throw new Error("Invalid catalogue")
          catalogue = catalogueData.products
        } catch {
          if (!controller.signal.aborted) setCatalogueError(true)
        }
        if (controller.signal.aborted) return
        setProfile(data.profile)
        setProducts(catalogue)
        setStatus("ready")
      } catch {
        if (!controller.signal.aborted) setStatus("error")
      }
    }
    void load()
    return () => controller.abort()
  }, [userId, retry])

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, "es")), [products])
  const filteredProducts = useMemo(() => {
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    return products.filter(p => (!category || p.category === category) && normalize(`${p.title} ${p.category || ""} ${p.country || ""}`).includes(normalize(query.trim())))
      .sort((a, b) => sort === "name" ? a.title.localeCompare(b.title, "es") : new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [products, category, query, sort])

  if (status === "loading") return <ProfileSkeleton />
  if (status !== "ready" || !profile) return (
    <main className="grid min-h-[70vh] place-items-center bg-background px-5 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-3xl border border-border bg-background"><Building2 aria-hidden="true" className="size-8 text-muted-foreground" /></div>
        <h1 className="text-2xl font-semibold tracking-tight">{status === "missing" ? "Perfil no encontrado" : "No pudimos cargar este perfil"}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">{status === "missing" ? "Este perfil empresarial no está disponible. Puedes descubrir otros proveedores en el catálogo." : "Hubo un problema al obtener la información de la empresa. Inténtalo de nuevo."}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {status === "error" && <Button onClick={() => setRetry(value => value + 1)}>Reintentar</Button>}
          <Button variant="outline" asChild><Link href="/productos">Explorar catálogo <ArrowRight aria-hidden="true" className="size-4" /></Link></Button>
        </div>
      </div>
    </main>
  )

  const name = profile.company_name || profile.full_name || "Empresa en Agrilpa"
  const initials = name.trim().split(/\s+/).map(word => word[0]).slice(0, 2).join("").toUpperCase()
  const memberSince = companyMemberSince(profile.created_at)
  const website = publicWebUrl(profile.company_website)
  const isOwner = currentUserId === profile.id
  const documents = (profile.export_history || []).filter(item => publicWebUrl(item.url))
  const certificates = documents.filter(item => item.type === "certificate")
  const shipments = documents.filter(item => item.type === "container_photo")
  const origins = Array.from(new Set(products.map(product => product.country).filter(Boolean)))

  function contact(product: CompanyProduct) {
    if (isOwner) return
    setContactOpen(false)
    openChat({
      sellerName: name,
      vendorId: profile!.id,
      sellerOnline: isUserOnline(profile!.id),
      product: { id: product.id, title: product.title, price: companyProductPrice(product) === "Precio a cotizar" ? "" : String(product.price), currency: product.currency || "USD", image: product.image || "/placeholder.svg", quantity: product.unit || "" },
    })
  }

  async function shareProfile() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareStatus("Enlace copiado")
    } catch {
      setShareStatus("Copia el enlace desde la barra de direcciones")
    }
  }

  return (
    <main className="font-sans bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <nav aria-label="Ruta de navegación" className={`mb-5 flex min-h-11 flex-wrap items-center gap-2 text-sm ${muted}`}>
          <Link href="/productos" className={`inline-flex min-h-11 items-center gap-2 rounded-md hover:text-foreground ${focus}`}><ArrowLeft aria-hidden="true" className="size-4" /> Catálogo</Link>
          <ChevronRight aria-hidden="true" className="size-3.5" /><span aria-current="page">Perfil empresarial</span>
        </nav>

        <section aria-labelledby="company-name" className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative h-40 overflow-hidden bg-primary/10 sm:h-48">
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-primary/20" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMid slice" fill="none">
              {Array.from({ length: 11 }, (_, index) => <path key={index} d={`M ${500 + index * 35} -40 C ${280 + index * 40} 80, ${680 + index * 40} 110, ${400 + index * 40} 280`} stroke="currentColor" strokeWidth="1.5" />)}
              <circle cx="1120" cy="40" r="170" stroke="currentColor" /><circle cx="1120" cy="40" r="135" stroke="currentColor" /><circle cx="1120" cy="40" r="100" stroke="currentColor" />
            </svg>
            <div className="relative flex items-start justify-between gap-4 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-foreground"><Sprout aria-hidden="true" className="size-4" /> Red de empresas Agrilpa</div>
              <span className="hidden rounded-full border border-primary/20 px-3 py-1.5 text-xs text-foreground sm:block">Comercio agrícola B2B</span>
            </div>
          </div>
          <div className="relative px-5 pb-7 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <Avatar className="-mt-12 mb-5 size-24 rounded-2xl border-[5px] border-card bg-card shadow-sm sm:-mt-14 sm:size-28">
                  <AvatarImage src={profile.avatar_url || undefined} alt={`Logo de ${name}`} className="object-cover" />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-3xl font-semibold text-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 id="company-name" className="min-w-0 break-words text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{name}</h1>
                  {profile.is_pro && <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-foreground"><Leaf aria-hidden="true" className="size-3.5" /> Agrilpa Pro</span>}
                </div>
                <div className={`mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm ${muted}`}>
                  {profile.country && <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4" />{profile.country}</span>}
                  {memberSince && <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4" />En Agrilpa desde {memberSince}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end lg:pt-7">
                <Button variant="outline" onClick={shareProfile} className="h-11 gap-2 rounded-xl">{shareStatus === "Enlace copiado" ? <Check aria-hidden="true" className="size-4" /> : <Share2 aria-hidden="true" className="size-4" />} Compartir</Button>
                {isOwner ? <Button asChild className="h-11 rounded-xl"><Link href="/dashboard/perfil">Editar mi perfil <ArrowRight aria-hidden="true" className="size-4" /></Link></Button> : products.length > 0 && <Button onClick={() => setContactOpen(true)} className={`${action} gap-2`}><MessageSquare aria-hidden="true" className="size-4" />Contactar empresa</Button>}
                <p role="status" className={`basis-full text-sm ${muted}`}>{shareStatus}</p>
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/20 px-2 py-5 sm:px-6">
            {[{ value: products.length, label: "Productos publicados" }, { value: categories.length, label: "Categorías de producto" }, { value: origins.length, label: "Países de origen" }].map(stat => (
              <div key={stat.label} className="flex flex-col px-2 text-center sm:px-5 sm:text-left"><dt className={`mt-1 text-xs leading-relaxed sm:text-sm ${muted}`}>{stat.label}</dt><dd className="order-first text-2xl font-semibold tracking-tight sm:text-3xl">{catalogueError ? "—" : stat.value}</dd></div>
            ))}
          </dl>
        </section>

        <nav aria-label="Secciones del perfil" className="mt-5 flex flex-wrap gap-x-6 border-b border-border px-1 text-sm font-medium sm:gap-x-8">
          <a href="#empresa" className={`inline-flex min-h-14 items-center gap-2 rounded-sm ${green} ${focus}`}><Building2 aria-hidden="true" className="size-4" /> La empresa</a>
          <a href="#catalogo" className={`inline-flex min-h-14 items-center gap-2 rounded-sm hover:text-foreground ${muted} ${focus}`}><Package aria-hidden="true" className="size-4" /> Catálogo <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs">{catalogueError ? "—" : products.length}</span></a>
          {documents.length > 0 && <a href="#documentos" className={`inline-flex min-h-14 items-center gap-2 rounded-sm hover:text-foreground ${muted} ${focus}`}><FileText aria-hidden="true" className="size-4" /> Documentos</a>}
        </nav>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-10">
            <section id="empresa" aria-labelledby="about-title" className="scroll-mt-28">
              <SectionHeading id="about-title" eyebrow="Conoce a tu proveedor">Acerca de la empresa</SectionHeading>
              <p className={`mt-4 max-w-3xl whitespace-pre-line break-words text-base leading-7 ${muted}`}>{profile.bio || "Esta empresa aún no ha añadido su presentación. Explora sus publicaciones para conocer los productos y las condiciones comerciales que ofrece."}</p>
              {categories.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{categories.map(value => <span key={value} className={`rounded-lg border border-border bg-card px-3 py-1.5 text-sm ${muted}`}>{value}</span>)}</div>}
            </section>

            <section id="catalogo" aria-labelledby="catalogue-title" className="scroll-mt-28">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <SectionHeading id="catalogue-title" eyebrow="Oferta de la empresa">Catálogo de productos</SectionHeading>
                <span role="status" className={`text-sm ${muted}`}>{!catalogueError && `${filteredProducts.length} de ${products.length} productos`}</span>
              </div>
              {catalogueError ? (
                <div role="alert" className="rounded-2xl border border-border bg-card p-8"><p className="font-medium">No pudimos cargar el catálogo.</p><p className="mt-2 text-sm text-muted-foreground">La información de la empresa sigue disponible.</p><Button variant="outline" onClick={() => setRetry(value => value + 1)} className="mt-5">Reintentar</Button></div>
              ) : products.length === 0 ? <EmptyCatalogue /> : <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <label htmlFor="company-search" className="sr-only">Buscar productos de esta empresa</label>
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                    <Input id="company-search" type="search" data-no-auto-caps="true" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar en el catálogo de la empresa" className="h-11 rounded-xl border-border bg-card pl-10 pr-11 [&::-webkit-search-cancel-button]:appearance-none" />
                    {query && <button aria-label="Borrar búsqueda" onClick={() => setQuery("")} className={`absolute right-0 top-0 grid size-11 place-items-center rounded-xl text-muted-foreground ${focus}`}><X aria-hidden="true" className="size-4" /></button>}
                  </div>
                  <div><label htmlFor="company-sort" className="sr-only">Ordenar productos</label><select id="company-sort" value={sort} onChange={event => setSort(event.target.value)} className={`h-11 w-full cursor-pointer rounded-xl border border-border bg-card px-3 text-sm sm:w-44 ${focus}`}><option value="recent">Más recientes</option><option value="name">Nombre: A a Z</option></select></div>
                </div>
                <div aria-label="Filtrar por categoría" className="mb-6 flex flex-wrap gap-2">
                  {["", ...categories].map(value => <button key={value} aria-pressed={category === value} onClick={() => setCategory(value)} className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors ${focus} ${category === value ? "border-foreground bg-foreground text-background" : `border-border bg-card hover:border-primary ${muted}`}`}>{value || "Todos"}</button>)}
                </div>
                {filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"><Search aria-hidden="true" className="mx-auto mb-3 size-7 text-muted-foreground" /><h3 className="font-semibold">No encontramos productos</h3><p className="mt-2 text-sm text-muted-foreground">Prueba otro nombre o cambia la categoría.</p><Button variant="outline" onClick={() => { setQuery(""); setCategory("") }} className="mt-5">Limpiar filtros</Button></div>
                ) : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map(product => <CompanyProductCard key={product.id} product={product} onContact={isOwner ? undefined : contact} />)}</div>}
              </>}
            </section>

            {documents.length > 0 && (
              <section id="documentos" aria-labelledby="documents-title" className="scroll-mt-28">
                <SectionHeading id="documents-title" eyebrow="Información compartida">Documentos y exportaciones</SectionHeading>
                <p className={`mt-3 text-sm leading-6 ${muted}`}>Material publicado por la empresa. Consulta su vigencia y alcance directamente con el proveedor.</p>
                {certificates.length > 0 && <div className="mt-5 grid gap-3 sm:grid-cols-2">{certificates.map((item, index) => (
                  <a key={`${item.url}-${index}`} href={publicWebUrl(item.url)!} target="_blank" rel="noopener noreferrer" className={`flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary ${focus}`}>
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 ${green}`}><FileText aria-hidden="true" className="size-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{item.label || "Documento de la empresa"}</span><span className="mt-1 block text-xs text-muted-foreground">Abrir documento · Nueva pestaña</span></span><ExternalLink aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                ))}</div>}
                {shipments.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">{shipments.map((item, index) => (
                  <a key={`${item.url}-${index}`} href={publicWebUrl(item.url)!} target="_blank" rel="noopener noreferrer" className={`overflow-hidden rounded-2xl border border-border bg-card ${focus}`}>
                    <div className="aspect-video overflow-hidden bg-muted"><ProductImage src={publicWebUrl(item.url)!} alt={item.label || "Exportación compartida por la empresa"} className="object-cover" /></div>
                    <div className="flex items-start justify-between gap-3 p-4"><span className="text-sm font-medium">{item.label || "Registro de exportación"}</span><ExternalLink aria-label="Abre en una nueva pestaña" className="size-4 shrink-0 text-muted-foreground" /></div>
                  </a>
                ))}</div>}
              </section>
            )}
          </div>

          <aside aria-label="Información comercial" className="space-y-5 lg:sticky lg:top-28">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold"><Building2 aria-hidden="true" className={`size-4 ${green}`} />Información empresarial</h2>
              <dl className="mt-5 space-y-5">
                {profile.country && <div><dt className={`text-xs ${muted}`}>País de la empresa</dt><dd className="mt-1.5 text-sm font-medium">{profile.country}</dd></div>}
                {profile.address && <div><dt className={`text-xs ${muted}`}>Ubicación</dt><dd className="mt-1.5 break-words text-sm leading-6">{profile.address}</dd></div>}
                {memberSince && <div><dt className={`text-xs ${muted}`}>Miembro desde</dt><dd className="mt-1.5 text-sm capitalize">{memberSince}</dd></div>}
                {website && <div><dt className={`text-xs ${muted}`}>Sitio web</dt><dd><a href={website} target="_blank" rel="noopener noreferrer" className={`mt-1 inline-flex min-h-11 max-w-full items-center gap-2 rounded-sm text-sm font-medium underline-offset-4 hover:underline ${green} ${focus}`}><Globe2 aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 break-all">{new URL(website).hostname.replace(/^www\./, "")}</span><ExternalLink aria-label="Abre en una nueva pestaña" className="size-3.5 shrink-0" /></a></dd></div>}
              </dl>
              {!profile.country && !profile.address && !memberSince && !website && <p className="mt-4 text-sm leading-6 text-muted-foreground">La empresa aún no ha añadido sus datos comerciales.</p>}
            </section>
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className={`mb-4 grid size-11 place-items-center rounded-xl bg-card ${green}`}><MessageSquare aria-hidden="true" className="size-5" /></div>
              <h2 className="text-lg font-semibold tracking-tight">{isOwner ? "Tu empresa, al alcance del mercado" : "La próxima oportunidad empieza con una conversación"}</h2>
              <p className={`mt-3 text-sm leading-6 ${muted}`}>{isOwner ? "Este es el perfil que ven los compradores. Mantén tu presentación y catálogo actualizados." : "Pregunta por disponibilidad, volúmenes y condiciones comerciales directamente al proveedor."}</p>
              {isOwner ? <Button asChild variant="outline" className="mt-5 h-11 w-full rounded-xl"><Link href="/dashboard/perfil">Gestionar mi perfil</Link></Button> : products.length > 0 ? <Button onClick={() => setContactOpen(true)} className={`${action} mt-5 w-full`}>Contactar empresa <ArrowRight aria-hidden="true" className="size-4" /></Button> : <Button asChild variant="outline" className="mt-5 h-11 w-full rounded-xl"><Link href="/productos">Explorar otros productos</Link></Button>}
            </section>
          </aside>
        </div>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader><DialogTitle>Conversa con {name}</DialogTitle><DialogDescription>Elige el producto que te interesa para iniciar una conversación sobre disponibilidad, precio o condiciones de compra.</DialogDescription></DialogHeader>
          <div className="mt-2 space-y-2">{products.map(product => (
            <button key={product.id} onClick={() => contact(product)} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted ${focus}`}>
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted"><ProductImage src={product.image || "/placeholder.svg"} alt="" className="object-cover" /></div>
              <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{product.title}</span><span className="mt-1 block text-xs text-muted-foreground">{companyProductPrice(product)}</span></span><MessageSquare aria-hidden="true" className={`size-4 shrink-0 ${green}`} />
            </button>
          ))}</div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function SectionHeading({ id, eyebrow, children }: { id: string; eyebrow: string; children: React.ReactNode }) {
  return <div><p className={`mb-2 text-xs font-semibold uppercase tracking-[0.16em] ${green}`}>{eyebrow}</p><h2 id={id} className="text-2xl font-bold tracking-tight">{children}</h2></div>
}

function CompanyProductCard({ product, onContact }: { product: CompanyProduct; onContact?: (product: CompanyProduct) => void }) {
  const minimum = product.min_order_quantity != null && product.min_order_quantity > 0 ? `${product.min_order_quantity} ${product.unit || ""}` : product.min_order
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/producto/${product.id}`} aria-label={`Ver ${product.title}`} className={`relative block aspect-[4/3] overflow-hidden bg-muted ${focus}`}>
        <ProductImage src={product.image || "/placeholder.svg"} alt={product.title} className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
        {product.category && <span className="absolute left-3 top-3 max-w-[calc(100%-24px)] truncate rounded-lg bg-card/95 px-2.5 py-1 text-xs font-medium shadow-sm">{product.category}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-6"><Link href={`/producto/${product.id}`} className={`rounded-sm hover:text-primary ${focus}`}>{product.title}</Link></h3>
        {product.country && <p className={`mt-2 flex items-start gap-1.5 text-xs leading-5 ${muted}`}><MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />{[product.state, product.country].filter(Boolean).join(", ")}</p>}
        <div className="mt-auto pt-5"><p className={`text-base font-semibold ${green}`}>{companyProductPrice(product)}</p><p className={`mt-1 text-xs leading-5 ${muted}`}>{minimum ? `Pedido mínimo: ${minimum}` : "Consulta las condiciones de compra"}</p></div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
          <Link href={`/producto/${product.id}`} className={`inline-flex min-h-11 items-center gap-1 text-sm font-medium ${focus}`}>Ver producto <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
          {onContact && <button onClick={() => onContact(product)} className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-medium hover:bg-primary/10 ${green} ${focus}`}><MessageSquare aria-hidden="true" className="size-4" />Consultar</button>}
        </div>
      </div>
    </article>
  )
}

function EmptyCatalogue() {
  return <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"><div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted"><Package aria-hidden="true" className="size-6 text-muted-foreground" /></div><h3 className="font-semibold">Su próximo producto está por llegar</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Esta empresa todavía no tiene productos públicos. Puedes seguir explorando el mercado de Agrilpa.</p><Button asChild variant="outline" className="mt-5 h-11 rounded-xl"><Link href="/productos">Ver catálogo de Agrilpa <ArrowRight aria-hidden="true" className="size-4" /></Link></Button></div>
}

function ProfileSkeleton() {
  return <main aria-busy="true" aria-label="Cargando perfil empresarial" className="min-h-screen bg-background px-4 py-8"><div className="mx-auto max-w-7xl"><p role="status" className="sr-only">Cargando perfil empresarial…</p><div className="mb-6 h-5 w-48 rounded bg-muted motion-safe:animate-pulse" /><div className="overflow-hidden rounded-3xl border border-border bg-card"><div className="h-48 bg-primary/10 motion-safe:animate-pulse" /><div className="space-y-5 p-8"><div className="-mt-20 size-28 rounded-2xl border-4 border-card bg-muted" /><div className="h-8 w-2/3 rounded bg-muted motion-safe:animate-pulse" /><div className="h-4 w-1/2 rounded bg-muted motion-safe:animate-pulse" /><div className="h-16 rounded-xl bg-muted/60 motion-safe:animate-pulse" /></div></div><div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]"><div className="h-72 rounded-2xl bg-muted motion-safe:animate-pulse" /><div className="h-64 rounded-2xl bg-muted motion-safe:animate-pulse" /></div></div></main>
}
