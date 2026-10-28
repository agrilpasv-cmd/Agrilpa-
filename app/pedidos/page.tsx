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
        <Package size={32} strokeWidth={1.4} aria-hidden="true" />
      )}
    </div>
  )
}

export default function PedidosPage() {
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
  ].sort((a, b) => a.localeCompare(b, "es"))
  const hasFilters = !!(search || category || country)
  function clearFilters() {
    setSearch("")
    setCategory("")
    setCountry("")
  }

  return (
    <main className={s.page}>
      <div className={s.container}>
        <header className={s.header}>
          <div>
            <h1>Pedidos de compra</h1>
            <p>
              Consulta lo que buscan los compradores y encuentra pedidos que
              puedes abastecer.
            </p>
          </div>
          <Button asChild className={s.primary}>
            <Link href="/solicitud-compra">
              <Plus size={18} aria-hidden="true" />
              Publicar un pedido
            </Link>
          </Button>
        </header>
        <div className={s.layout}>
          <div>
            <Button
              variant="outline"
              className={s.filterToggle}
              aria-expanded={filtersOpen}
              aria-controls="purchase-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              Filtrar pedidos{category || country ? " · Activos" : ""}
            </Button>
            <aside
              id="purchase-filters"
              aria-label="Filtros de pedidos"
              className={`${s.filters} ${filtersOpen ? s.open : ""}`}
            >
              <div className={s.filterHeading}>
                <h2>Filtrar pedidos</h2>
                <SlidersHorizontal size={17} aria-hidden="true" />
              </div>
              <div className={s.field}>
                <label htmlFor="request-category">Categoría</label>
                <Select
                  value={category || "all"}
                  onValueChange={(value) =>
                    setCategory(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger id="request-category" className={s.select}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={s.field}>
                <label htmlFor="request-country">País de destino</label>
                <CountryPicker
                  id="request-country"
                  value={country}
                  onChange={setCountry}
                  placeholder="Todos los países"
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
                  Quitar filtros
                </Button>
              )}
              <div className={s.filterNote}>
                <h3>¿Buscas un producto?</h3>
                <p>
                  Publica la cantidad y el destino de tu pedido para que los
                  proveedores puedan conocerlo.
                </p>
                <Link href="/solicitud-compra">Crear una solicitud</Link>
              </div>
            </aside>
          </div>
          <section
            className={s.results}
            aria-label="Pedidos disponibles"
            aria-busy={loading}
          >
            <div className={s.search}>
              <Search size={20} aria-hidden="true" />
              <label className="sr-only" htmlFor="request-search">
                Buscar pedidos
              </label>
              <Input
                id="request-search"
                type="search"
                data-no-auto-caps="true"
                placeholder="Buscar por producto, categoría o destino"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={s.searchInput}
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Borrar búsqueda"
                  onClick={() => setSearch("")}
                >
                  <X size={18} />
                </Button>
              )}
            </div>
            <div className={s.resultHeader}>
              <p role="status" aria-live="polite">
                {loading ? (
                  "Cargando pedidos…"
                ) : error ? (
                  "Pedidos no disponibles"
                ) : (
                  <>
                    <strong>{filtered.length}</strong>{" "}
                    {filtered.length === 1
                      ? "pedido disponible"
                      : "pedidos disponibles"}
                  </>
                )}
              </p>
              <div className={s.sort}>
                <label htmlFor="request-sort">Ordenar por</label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger id="request-sort" className={s.sortSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">
                      Destacados primero
                    </SelectItem>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="closing">Próximos a vencer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {loading ? (
              <div className={s.state} role="status">
                <p>Estamos consultando los pedidos disponibles.</p>
              </div>
            ) : error ? (
              <div className={s.state} role="alert">
                <h2>No pudimos cargar los pedidos</h2>
                <p>
                  Intenta de nuevo para consultar las solicitudes de compra.
                </p>
                <Button variant="outline" onClick={() => void fetchRequests()}>
                  Volver a intentar
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className={s.state}>
                <Package size={36} strokeWidth={1.4} aria-hidden="true" />
                <h2>
                  {hasFilters
                    ? "No hay pedidos con estos filtros"
                    : "Todavía no hay pedidos disponibles"}
                </h2>
                <p>
                  {hasFilters
                    ? "Prueba otro producto o amplía la categoría y el país de destino."
                    : "Cuando se publiquen solicitudes de compra activas, las encontrarás aquí."}
                </p>
                {hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar búsqueda y filtros
                  </Button>
                ) : (
                  <Button asChild className={s.primary}>
                    <Link href="/solicitud-compra">Publicar un pedido</Link>
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
                      <div className={s.category}>
                        <span>{request.category || "Sin categoría"}</span>
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
                      <div className={s.metadata}>
                        <span>
                          <MapPin size={15} aria-hidden="true" />
                          {[request.country, request.delivery_state]
                            .filter(Boolean)
                            .join(", ") || "Destino sin indicar"}
                        </span>
                        {request.desired_date && (
                          <span>
                            <CalendarDays size={15} aria-hidden="true" />
                            Entrega: {dateLabel(request.desired_date)}
                          </span>
                        )}
                      </div>
                      <p className={s.published}>
                        Publicado el {dateLabel(request.created_at)}
                      </p>
                    </div>
                    <div className={s.requestAction}>
                      <div>
                        <span className={s.quantityLabel}>
                          Cantidad solicitada
                        </span>
                        <p className={s.quantity}>
                          {request.quantity}{" "}
                          <span>
                            {unitLabels[request.unit] || request.unit}
                          </span>
                        </p>
                      </div>
                      <p className={s.expiry}>
                        {request.days_remaining <= 0
                          ? "Vence hoy"
                          : request.days_remaining === 1
                            ? "Vence en 1 día"
                            : `Vence en ${request.days_remaining} días`}
                      </p>
                      <Button asChild variant="outline" className={s.details}>
                        <Link
                          href={`/pedidos/${request.id}`}
                          aria-label={`Ver pedido: ${request.product_name}`}
                        >
                          Ver pedido
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
