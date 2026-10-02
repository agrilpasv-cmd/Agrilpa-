"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, ExternalLink, MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ProBadge } from "@/components/ui/pro-badge"
import { useDashboard } from "../context"
import { normalizeSearch, productPrice, shortDate } from "@/lib/dashboard/commerce"
import { CommercePage, EmptyState, FilterTabs, InlineNotice, LoadingState, Metrics, ProductThumb, SearchField, StatusBadge, commerceStyles as s } from "@/components/dashboard/commerce-ui"

interface Publication {
  id: string; title: string; category?: string; price: string; currency?: string; quantity?: string;
  country?: string; status?: "activa" | "pausada" | "vendida"; created_at: string;
  views?: number; image?: string; unit?: string; price_type?: string;
}

export default function MisPublicacionesPage() {
  const { refreshCounts } = useDashboard()
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [limit, setLimit] = useState(10)
  const [pro, setPro] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(false)
    fetch(`/api/products/get-my-products?t=${Date.now()}`, { cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error("Products unavailable"); return response.json() })
      .then(data => { if (mounted) { if (!Array.isArray(data.products)) throw new Error("Invalid products"); setPublications(data.products) } })
      .catch(() => { if (mounted) setError(true) })
      .finally(() => { if (mounted) setLoading(false) })
    fetch("/api/dashboard/dynamic-data").then(response => response.ok ? response.json() : null).then(data => {
      if (!mounted || !data) return
      if (Number(data.publicationLimit) > 0) setLimit(Number(data.publicationLimit))
      setPro(Boolean(data.isPro))
    }).catch(() => {})
    return () => { mounted = false }
  }, [retry])

  const status = (publication: Publication) => publication.status || "activa"
  const count = (value: string) => publications.filter(publication => status(publication) === value).length
  const views = publications.reduce((total, publication) => total + (Number(publication.views) || 0), 0)
  const filtered = publications.filter(publication => normalizeSearch(`${publication.title} ${publication.category || ""} ${publication.country || ""}`).includes(normalizeSearch(query)) && (filter === "all" || status(publication) === filter))
  const selected = publications.find(publication => publication.id === deleteId)
  const confirmDelete = async () => {
    if (!deleteId || deleting) return
    const id = deleteId
    setDeleting(id)
    setDeleteId(null)
    try {
      const response = await fetch("/api/products/delete-product", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      if (!response.ok) throw new Error("Delete failed")
      setPublications(previous => previous.filter(publication => publication.id !== id))
      setNotice({ text: "La publicación se eliminó correctamente." })
      void refreshCounts()
    } catch { setNotice({ text: "No pudimos eliminar la publicación. Inténtalo de nuevo.", error: true }) }
    finally { setDeleting(null) }
  }

  return <CommercePage title="Publicaciones" description="Tu catálogo, listo para conectar con nuevos compradores." action={<><div className={s.plan}><div><span>{publications.length} de {limit} publicaciones</span>{pro ? <ProBadge /> : <strong>Plan gratuito</strong>}</div><div className={s.planTrack} role="progressbar" aria-label="Uso de publicaciones" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(publications.length, limit)}><span style={{ width: `${Math.min(publications.length / limit * 100, 100)}%` }} /></div></div><Link href="/dashboard/mis-publicaciones/nueva" className={s.primaryButton}><Plus size={17} aria-hidden="true" />Nueva publicación</Link></>}>
    {notice && <InlineNotice error={notice.error} onClose={() => setNotice(null)}>{notice.text}</InlineNotice>}
    {loading ? <LoadingState label="Cargando tus publicaciones…" /> : error ? <InlineNotice error>No pudimos cargar tu catálogo. <button type="button" className={s.textButton} onClick={() => setRetry(value => value + 1)}>Reintentar</button></InlineNotice> : <>
      <Metrics items={[{ label: "Publicaciones", value: publications.length, hint: "Productos en tu catálogo" }, { label: "Activas", value: count("activa"), hint: "Visibles para compradores" }, { label: "Pausadas", value: count("pausada"), hint: "Fuera del catálogo activo" }, { label: "Vistas acumuladas", value: views.toLocaleString("es-SV"), hint: "Visitas a tus productos" }]} />
      <div className={s.catalogTools}><div className={s.toolbar}><SearchField value={query} onChange={setQuery} placeholder="Buscar producto, categoría o país" /><span className={s.resultCount}>{filtered.length} de {publications.length} publicaciones</span></div><FilterTabs value={filter} onChange={setFilter} options={[{ value: "all", label: "Todas", count: publications.length }, { value: "activa", label: "Activas", count: count("activa") }, { value: "pausada", label: "Pausadas", count: count("pausada") }, { value: "vendida", label: "Vendidas", count: count("vendida") }]} /></div>
      {!filtered.length ? <div className={s.section}><EmptyState title={publications.length ? "No hay publicaciones con estos filtros" : "Presenta tu primer producto"} description={publications.length ? "Busca otro producto o cambia el estado para ver más resultados." : "Añade una foto, las condiciones de venta y la información que tus compradores necesitan para cotizar."} action={publications.length ? <button type="button" className={s.secondaryButton} onClick={() => { setQuery(""); setFilter("all") }}>Limpiar filtros</button> : <Link href="/dashboard/mis-publicaciones/nueva" className={s.primaryButton}><Plus size={17} aria-hidden="true" />Crear primera publicación</Link>} /></div> : <div className={s.catalogGrid}>{filtered.map(publication => <article key={publication.id} className={s.productCard}>
        <Link href={`/producto/${publication.id}`} aria-label={`Ver ${publication.title}`}><ProductThumb large src={publication.image || `/api/products/${publication.id}/thumb`} title={publication.title} /></Link>
        <div className={s.productBody}><div className={s.productTop}><span>{publication.category || "Producto agrícola"}</span><StatusBadge tone={status(publication) === "activa" ? "green" : status(publication) === "pausada" ? "amber" : "blue"}>{status(publication) === "activa" ? "Activa" : status(publication) === "pausada" ? "Pausada" : "Vendida"}</StatusBadge></div>
          <h2><Link href={`/producto/${publication.id}`}>{publication.title}</Link></h2><strong className={s.money}>{productPrice(publication.price, publication.currency || "USD", publication.unit || "kg", publication.price_type === "quote")}</strong>
          <div className={s.productInfo}>{publication.country && <span><MapPin size={13} aria-hidden="true" />{publication.country}</span>}<span><Eye size={13} aria-hidden="true" />{Number(publication.views) || 0} vistas</span></div>
          <span className={s.cellMeta}>Publicada el {shortDate(publication.created_at)}</span>
          <div className={s.productActions}><Link href={`/dashboard/mis-publicaciones/${publication.id}/editar`} className={s.primaryButton}><Pencil size={15} aria-hidden="true" />Editar</Link><Link href={`/producto/${publication.id}`} className={s.iconButton} aria-label={`Ver publicación ${publication.title}`} title="Ver publicación"><ExternalLink size={17} aria-hidden="true" /></Link><button type="button" className={s.iconButton} data-danger="true" aria-label={`Eliminar ${publication.title}`} title="Eliminar publicación" disabled={deleting === publication.id} onClick={() => setDeleteId(publication.id)}><Trash2 size={17} aria-hidden="true" /></button></div>
        </div>
      </article>)}</div>}
    </>}
    <AlertDialog open={Boolean(deleteId)} onOpenChange={open => { if (!open) setDeleteId(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar esta publicación?</AlertDialogTitle><AlertDialogDescription>Se eliminará «{selected?.title}» de tu catálogo. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Conservar publicación</AlertDialogCancel><AlertDialogAction onClick={() => void confirmDelete()} className="bg-destructive text-white hover:bg-destructive/90">Eliminar publicación</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </CommercePage>
}
