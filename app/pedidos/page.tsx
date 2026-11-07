"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Search,
  MapPin,
  CalendarDays,
  Plus,
  Package,
  SlidersHorizontal,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CountryPicker } from "@/components/ui/country-picker"
import { ProBadge } from "@/components/ui/pro-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { PRODUCT_CATEGORIES } from "@/lib/constants"
import {
  useLanguage,
  translateCategory,
  translateUnit,
  formatB2BDate,
} from "@/lib/i18n"
import s from "./pedidos.module.css"

interface PurchaseRequest {
  id: string
  product_name: string
  category: string
  quantity: string
  unit: string
  country: string
  delivery_state: string
  image_url: string | null
  specs: string | null
  desired_date: string | null
  created_at: string
  expires_at: string
  days_remaining: number
  is_pro: boolean
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
const unitLabels: Record<string, string> = {
  kg: "kg",
  ton: "toneladas",
  TM: "toneladas métricas",
  lb: "lb",
  quintales: "quintales",
  unidades: "unidades",
  unidad: "unidades",
  contenedores: "contenedores",
  lt: "litros"
}

function dateLabel(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value)
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString("es-SV", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "America/El_Salvador"
      })
    : "Sin indicar"
}

function RequestPhoto({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={s.photo}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package size={24} strokeWidth={1.4} aria-hidden="true" />
      )}
    </div>
  )
}

export default function PedidosPage() {
  const lang = useLanguage()
  const isEn = lang === "en"
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [country, setCountry] = useState("")
  const [sort, setSort] = useState("recommended")
  const [filtersOpen, setFiltersOpen] = useState(false)

  async function fetchRequests(signal?: AbortSignal) {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch("/api/pedidos", { signal })
      if (!response.ok) throw new Error("requests_unavailable")
      const data = await response.json()
      if (!Array.isArray(data.requests)) throw new Error("invalid_response")
      setRequests(data.requests)
    } catch {
      if (signal?.aborted) return
      setError(true)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void fetchRequests(controller.signal)
    return () => controller.abort()
  }, [])

  const query = normalize(search.trim())
  const filtered = requests.filter(
    (request) =>
      (!query ||
        normalize(
          [
            request.product_name,
            request.category,
            translateCategory(request.category, "en"),
            request.country,
            request.delivery_state
          ]
            .filter(Boolean)
            .join(" ")
        ).includes(query)) &&
      (!category || request.category === category) &&
      (!country || normalize(request.country || "") === normalize(country))
  )
  if (sort === "newest")
    filtered.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  if (sort === "closing")
    filtered.sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at))
  const categories = [
    ...new Set([
      ...PRODUCT_CATEGORIES,
      ...requests.map((request) => request.category).filter(Boolean)
    ])
  ].sort((a, b) => a.localeCompare(b, isEn ? "en" : "es"))
  const hasFilters = !!(search || category || country)
  function clearFilters() {
    setSearch("")
    setCategory("")
    setCountry("")
  }

  return (
    <main className={s.page}>
      <div className={s.container}>
        <header className={`${s.header} notranslate`} translate="no">
          <div>
            <h1>{isEn ? "Active Buyer RFQs & Wholesale Orders" : "Pedidos de compra"}</h1>
            <p>
              {isEn
                ? "Explore active Requests for Quotation (RFQs) from international wholesale buyers and submit direct supply proposals."
                : "Consulta lo que buscan los compradores y encuentra pedidos que puedes abastecer."}
            </p>
          </div>
          <Button asChild className={s.primary}>
            <Link href="/solicitud-compra">
              <Plus size={16} aria-hidden="true" />
              {isEn ? "Post a Buying Request (RFQ)" : "Publicar un pedido"}
            </Link>
          </Button>
        </header>
        <div className={s.layout}>
          <div className="notranslate" translate="no">
            <Button
              variant="outline"
              className={s.filterToggle}
              aria-expanded={filtersOpen}
              aria-controls="purchase-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              {isEn ? "Filter RFQs" : "Filtrar pedidos"}
              {category || country ? (isEn ? " · Active" : " · Activos") : ""}
            </Button>
            <aside
              id="purchase-filters"
              aria-label={isEn ? "RFQ Filters" : "Filtros de pedidos"}
              className={`${s.filters} ${filtersOpen ? s.open : ""}`}
            >
              <div className={s.filterHeading}>
                <h2>{isEn ? "Filter RFQs" : "Filtrar pedidos"}</h2>
                <SlidersHorizontal size={17} aria-hidden="true" />
              </div>
              <div className={s.field}>
                <label htmlFor="request-category">
                  {isEn ? "Product Category" : "Categoría"}
                </label>
                <Select
                  value={category || "all"}
                  onValueChange={(value) =>
                    setCategory(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger id="request-category" className={s.select}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="notranslate" translate="no">
                    <SelectItem value="all">
                      {isEn ? "All categories" : "Todas las categorías"}
                    </SelectItem>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {translateCategory(item, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={s.field}>
                <label htmlFor="request-country">
                  {isEn ? "Destination Country" : "País de destino"}
                </label>
                <CountryPicker
                  id="request-country"
                  value={country}
                  onChange={setCountry}
                  placeholder={isEn ? "All countries" : "Todos los países"}
                  className={s.country}
                />
              </div>
              {(category || country) && (
                <Button
                  variant="outline"
                  className={s.reset}
                  onClick={() => {
                    setCategory("")
                    setCountry("")
                  }}
                >
                  {isEn ? "Clear filters" : "Quitar filtros"}
                </Button>
              )}
              <div className={s.filterNote}>
                <h3>{isEn ? "Sourcing a specific product?" : "¿Buscas un producto?"}</h3>
                <p>
                  {isEn
                    ? "Submit an RFQ with your target volume and destination so verified producers and suppliers can send you wholesale quotes."
                    : "Publica la cantidad y el destino de tu pedido para que los proveedores puedan conocerlo."}
                </p>
                <Link href="/solicitud-compra">
                  {isEn ? "Submit an RFQ" : "Crear una solicitud"}
                </Link>
              </div>
            </aside>
          </div>
          <section
            className={s.results}
            aria-label={isEn ? "Available Buyer RFQs" : "Pedidos disponibles"}
            aria-busy={loading}
          >
            <div className={`${s.search} notranslate`} translate="no">
              <Search size={17} aria-hidden="true" />
              <label className="sr-only" htmlFor="request-search">
                {isEn ? "Search RFQs" : "Buscar pedidos"}
              </label>
              <Input
                id="request-search"
                type="search"
                data-no-auto-caps="true"
                placeholder={
                  isEn
                    ? "Search by product, category, or destination country..."
                    : "Buscar por producto, categoría o destino"
                }
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={s.searchInput}
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={isEn ? "Clear search" : "Borrar búsqueda"}
                  onClick={() => setSearch("")}
                >
                  <X size={18} />
                </Button>
              )}
            </div>
            <div className={`${s.resultHeader} notranslate`} translate="no">
              <p role="status" aria-live="polite">
                {loading ? (
                  isEn ? "Loading active RFQs…" : "Cargando pedidos…"
                ) : error ? (
                  isEn ? "RFQs temporarily unavailable" : "Pedidos no disponibles"
                ) : (
                  <>
                    <strong>{filtered.length}</strong>{" "}
                    {filtered.length === 1
                      ? isEn
                        ? "active RFQ available"
                        : "pedido disponible"
                      : isEn
                        ? "active RFQs available"
                        : "pedidos disponibles"}
                  </>
                )}
              </p>
              <div className={s.sort}>
                <label htmlFor="request-sort">
                  {isEn ? "Sort by" : "Ordenar por"}
                </label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger id="request-sort" className={s.sortSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="notranslate" translate="no">
                    <SelectItem value="recommended">
                      {isEn ? "Featured first" : "Destacados primero"}
                    </SelectItem>
                    <SelectItem value="newest">
                      {isEn ? "Most recent" : "Más recientes"}
                    </SelectItem>
                    <SelectItem value="closing">
                      {isEn ? "Closing soon" : "Próximos a vencer"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {loading ? (
              <div className={`${s.state} notranslate`} translate="no" role="status">
                <p>
                  {isEn
                    ? "Fetching active wholesale buying requests..."
                    : "Estamos consultando los pedidos disponibles."}
                </p>
              </div>
            ) : error ? (
              <div className={`${s.state} notranslate`} translate="no" role="alert">
                <h2>
                  {isEn
                    ? "Unable to load buyer RFQs"
                    : "No pudimos cargar los pedidos"}
                </h2>
                <p>
                  {isEn
                    ? "Please try again to view active wholesale buying requests."
                    : "Intenta de nuevo para consultar las solicitudes de compra."}
                </p>
                <Button variant="outline" onClick={() => void fetchRequests()}>
                  {isEn ? "Try again" : "Volver a intentar"}
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className={`${s.state} notranslate`} translate="no">
                <Package size={36} strokeWidth={1.4} aria-hidden="true" />
                <h2>
                  {hasFilters
                    ? isEn
                      ? "No buyer RFQs match these filters"
                      : "No hay pedidos con estos filtros"
                    : isEn
                      ? "No active buyer RFQs yet"
                      : "Todavía no hay pedidos disponibles"}
                </h2>
                <p>
                  {hasFilters
                    ? isEn
                      ? "Try another product keyword or broaden your category and destination country filters."
                      : "Prueba otro producto o amplía la categoría y el país de destino."
                    : isEn
                      ? "New wholesale Requests for Quotation (RFQs) from international buyers will appear here."
                      : "Cuando se publiquen solicitudes de compra activas, las encontrarás aquí."}
                </p>
                {hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    {isEn ? "Reset search & filters" : "Limpiar búsqueda y filtros"}
                  </Button>
                ) : (
                  <Button asChild className={s.primary}>
                    <Link href="/solicitud-compra">
                      {isEn ? "Post a Buying Request (RFQ)" : "Publicar un pedido"}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <ul className={s.list}>
                {filtered.map((request) => (
                  <li key={request.id} className={s.request}>
                    <Link
                      href={`/pedidos/${request.id}`}
                      className={s.photoLink}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <RequestPhoto src={request.image_url} />
                    </Link>
                    <div className={s.description}>
                      <div className={`${s.category} notranslate`} translate="no">
                        <span>
                          {translateCategory(request.category || "Sin categoría", lang)}
                        </span>
                        {request.is_pro && <ProBadge />}
                      </div>
                      <h2>
                        <Link href={`/pedidos/${request.id}`}>
                          {request.product_name}
                        </Link>
                      </h2>
                      {request.specs && (
                        <p className={s.specs}>{request.specs}</p>
                      )}
                      <div className={`${s.metadata} notranslate`} translate="no">
                        <span>
                          <MapPin size={15} aria-hidden="true" />
                          {[request.country, request.delivery_state]
                            .filter(Boolean)
                            .join(", ") ||
                            (isEn ? "Destination TBD" : "Destino sin indicar")}
                        </span>
                        {request.desired_date && (
                          <span>
                            <CalendarDays size={15} aria-hidden="true" />
                            {isEn ? "Target delivery:" : "Entrega:"}{" "}
                            {formatB2BDate(request.desired_date, lang)}
                          </span>
                        )}
                      </div>
                      <p className={`${s.published} notranslate`} translate="no">
                        {isEn ? "Posted" : "Publicado el"}{" "}
                        {formatB2BDate(request.created_at, lang)}
                      </p>
                    </div>
                    <div className={`${s.requestAction} notranslate`} translate="no">
                      <div>
                        <span className={s.quantityLabel}>
                          {isEn ? "Requested Volume" : "Cantidad solicitada"}
                        </span>
                        <p className={s.quantity}>
                          {request.quantity}{" "}
                          <span>
                            {translateUnit(request.unit, lang)}
                          </span>
                        </p>
                      </div>
                      <p className={s.expiry}>
                        {request.days_remaining <= 0
                          ? isEn
                            ? "Closes today"
                            : "Vence hoy"
                          : request.days_remaining === 1
                            ? isEn
                              ? "Closes in 1 day"
                              : "Vence en 1 día"
                            : isEn
                              ? `Closes in ${request.days_remaining} days`
                              : `Vence en ${request.days_remaining} días`}
                      </p>
                      <Button asChild variant="outline" className={s.details}>
                        <Link
                          href={`/pedidos/${request.id}`}
                          aria-label={
                            isEn
                              ? `View RFQ: ${request.product_name}`
                              : `Ver pedido: ${request.product_name}`
                          }
                        >
                          {isEn ? "View RFQ & Quote" : "Ver pedido"}
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
