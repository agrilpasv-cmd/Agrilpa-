"use client"

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from "react"
import Link from "next/link"
import {
  MessageCircle,
  Mail,
  Send,
  MousePointer2,
  Search,
  ExternalLink,
  Trash2,
  Check,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import s from "./contactar.module.css"

interface ContactClick {
  id: string
  product_id: string
  product_title: string
  seller_id: string
  click_type: string
  user_id: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_company: string | null
  buyer_type: string | null
  seller_name: string | null
  seller_email: string | null
  seller_company: string | null
  created_at: string
  is_read?: boolean
}

type ClickFilter = "all" | "unread" | "whatsapp" | "email" | "generic"

const integer = (value: number) => new Intl.NumberFormat("es-SV").format(value)

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

export default function AdminContactClicksPage() {
  const [clicks, setClicks] = useState<ContactClick[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState("")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<ClickFilter>("all")
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchClicks = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      else setRefreshing(true)
      setFetchError("")

      const response = await fetch("/api/admin/contact-clicks", {
        cache: "no-store",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(
          data.error || "No pudimos consultar el registro de contactos."
        )
      }
      if (Array.isArray(data.clicks)) {
        setClicks(data.clicks)
        setStats(data.stats)
        setLastUpdate(new Date())
      }
    } catch (error) {
      setFetchError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el registro de contactos."
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchClicks(true)

    const interval = setInterval(() => {
      void fetchClicks(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchClicks])

  const confirmDelete = async () => {
    if (deleteTargetIds.length === 0) return
    setIsDeleting(true)
    try {
      const query =
        deleteTargetIds.length === 1
          ? `id=${deleteTargetIds[0]}`
          : `ids=${deleteTargetIds.join(",")}`
      const response = await fetch(`/api/admin/contact-clicks?${query}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setClicks((prev) =>
          prev.filter((c) => !deleteTargetIds.includes(c.id))
        )
        setSelectedIds((prev) =>
          prev.filter((id) => !deleteTargetIds.includes(id))
        )
        toast.success(
          deleteTargetIds.length === 1
            ? "Registro eliminado"
            : `${deleteTargetIds.length} registros eliminados`
        )
        void fetchClicks(false)
        window.dispatchEvent(new Event("update-unread-count"))
      } else {
        const data = await response.json()
        toast.error(data.error || "No se pudo eliminar el registro")
      }
    } catch {
      toast.error("Error de conexión al eliminar")
    } finally {
      setIsDeleting(false)
      setDeleteTargetIds([])
    }
  }

  const handleMarkAsRead = async (idsToMark: string[]) => {
    if (idsToMark.length === 0) return
    try {
      const response = await fetch(`/api/admin/contact-clicks/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToMark }),
      })

      if (response.ok) {
        if (idsToMark.length > 1) setSelectedIds([])
        toast.success(
          idsToMark.length === 1
            ? "Marcado como revisado"
            : `${idsToMark.length} registros marcados como revisados`
        )
        void fetchClicks(false)
        window.dispatchEvent(new Event("update-unread-count"))
      } else {
        toast.error("No se pudo actualizar el estado de lectura")
      }
    } catch {
      toast.error("Error de conexión al actualizar")
    }
  }

  const unreadCount = useMemo(
    () => clicks.filter((c) => !c.is_read).length,
    [clicks]
  )
  const whatsappCount = useMemo(
    () =>
      clicks.filter((c) => c.click_type?.toLowerCase().trim() === "whatsapp")
        .length,
    [clicks]
  )
  const emailCount = useMemo(
    () =>
      clicks.filter((c) => c.click_type?.toLowerCase().trim() === "email")
        .length,
    [clicks]
  )
  const telegramCount = useMemo(
    () =>
      clicks.filter((c) => c.click_type?.toLowerCase().trim() === "telegram")
        .length,
    [clicks]
  )
  const genericCount = useMemo(
    () =>
      clicks.filter(
        (c) =>
          !["whatsapp", "email", "telegram"].includes(
            c.click_type?.toLowerCase().trim() || ""
          )
      ).length,
    [clicks]
  )

  const filteredClicks = useMemo(() => {
    const q = normalize(searchTerm.trim())
    return clicks.filter((c) => {
      const channel = c.click_type?.toLowerCase().trim() || "generic"
      if (typeFilter === "unread" && c.is_read) return false
      if (typeFilter === "whatsapp" && channel !== "whatsapp") return false
      if (typeFilter === "email" && channel !== "email") return false
      if (
        typeFilter === "generic" &&
        ["whatsapp", "email"].includes(channel)
      )
        return false

      if (!q) return true
      return [
        c.product_title,
        c.click_type,
        c.buyer_name,
        c.buyer_company,
        c.buyer_email,
        c.seller_name,
        c.seller_company,
        c.seller_email,
      ].some((val) => typeof val === "string" && normalize(val).includes(q))
    })
  }, [clicks, searchTerm, typeFilter])

  const toggleSelectAll = () => {
    if (
      filteredClicks.length > 0 &&
      selectedIds.length === filteredClicks.length
    ) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredClicks.map((c) => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleString("es-SV", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
  }

  const renderChannelBadge = (type: string) => {
    const clean = type?.toLowerCase().trim()
    if (clean === "whatsapp") {
      return (
        <span className={s.channelBadge} data-channel="whatsapp">
          <MessageCircle size={13} aria-hidden="true" />
          WhatsApp
        </span>
      )
    }
    if (clean === "email") {
      return (
        <span className={s.channelBadge}>
          <Mail size={13} aria-hidden="true" />
          Correo electrónico
        </span>
      )
    }
    if (clean === "telegram") {
      return (
        <span className={s.channelBadge}>
          <Send size={13} aria-hidden="true" />
          Telegram
        </span>
      )
    }
    return (
      <span className={s.channelBadge}>
        <MousePointer2 size={13} aria-hidden="true" />
        Apertura de contacto
      </span>
    )
  }

  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const order: ClickFilter[] = [
      "all",
      "unread",
      "whatsapp",
      "email",
      "generic",
    ]
    const currentIndex = order.indexOf(typeFilter)
    const next =
      event.key === "Home"
        ? order[0]
        : event.key === "End"
          ? order[order.length - 1]
          : event.key === "ArrowRight"
            ? order[(currentIndex + 1) % order.length]
            : order[(currentIndex - 1 + order.length) % order.length]
    setTypeFilter(next)
    document.getElementById(`contact-tab-${next}`)?.focus()
  }

  const channelBreakdown = [
    { label: "WhatsApp", count: whatsappCount },
    { label: "Correo electrónico", count: emailCount },
    { label: "Aperturas directas", count: genericCount },
    ...(telegramCount > 0 ? [{ label: "Telegram", count: telegramCount }] : []),
  ]
  const maxChannelCount = Math.max(...channelBreakdown.map((c) => c.count), 1)
  const topProducts: { title: string; count: number }[] =
    stats?.topProducts || []
  const maxProductCount = Math.max(...topProducts.map((p) => p.count), 1)

  return (
    <section className={s.page} aria-label="Interacciones de contacto">
      <header className={s.header}>
        <div>
          <h1>Contactar</h1>
          <p>
            Consulta los clics de contacto en las publicaciones y revisa qué
            productos concentran mayor interés comercial.
          </p>
        </div>
        <div className={s.headerActions}>
          {lastUpdate && (
            <span className={s.updated}>
              Actualizado a las{" "}
              {lastUpdate.toLocaleTimeString("es-SV", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            type="button"
            className={s.secondaryButton}
            onClick={() => void fetchClicks(false)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={16}
              className={loading || refreshing ? s.spinner : undefined}
              aria-hidden="true"
            />
            Actualizar
          </button>
        </div>
      </header>

      {fetchError && (
        <div className={s.notice} role="alert">
          <span>{fetchError}</span>
          <button
            type="button"
            className={s.secondaryButton}
            onClick={() => void fetchClicks(true)}
          >
            Reintentar
          </button>
        </div>
      )}

      <dl className={s.metrics} aria-label="Resumen de clics de contacto">
        <button
          type="button"
          className={s.metric}
          aria-pressed={typeFilter === "unread"}
          onClick={() => setTypeFilter("unread")}
        >
          <dt>Sin revisar</dt>
          <dd>{integer(unreadCount)}</dd>
          <span>Interacciones pendientes de lectura</span>
        </button>

        <button
          type="button"
          className={s.metric}
          aria-pressed={typeFilter === "all"}
          onClick={() => setTypeFilter("all")}
        >
          <dt>Total de interacciones</dt>
          <dd>{integer(clicks.length)}</dd>
          <span>Registros acumulados en el catálogo</span>
        </button>

        <button
          type="button"
          className={s.metric}
          aria-pressed={typeFilter === "whatsapp"}
          onClick={() => setTypeFilter("whatsapp")}
        >
          <dt>Por WhatsApp</dt>
          <dd>{integer(whatsappCount)}</dd>
          <span>
            {clicks.length > 0
              ? `${Math.round((whatsappCount / clicks.length) * 100)}% del total de intentos`
              : "Sin registros en este canal"}
          </span>
        </button>

        <button
          type="button"
          className={s.metric}
          aria-pressed={typeFilter === "email"}
          onClick={() => setTypeFilter("email")}
        >
          <dt>Por correo y otros</dt>
          <dd>{integer(emailCount + genericCount + telegramCount)}</dd>
          <span>
            {integer(emailCount)} por correo · {integer(genericCount)} aperturas
          </span>
        </button>
      </dl>

      <div className={s.mainColumns}>
        <div className={s.panel}>
          <div className={s.panelHead}>
            <div className={s.toolbar}>
              <div className={s.search}>
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Buscar por producto, comprador, vendedor o correo"
                  aria-label="Buscar interacciones de contacto"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-no-auto-caps="true"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className={s.clearSearch}
                    aria-label="Limpiar búsqueda"
                    onClick={() => setSearchTerm("")}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div
              className={s.tabs}
              role="tablist"
              aria-label="Filtrar interacciones por canal o lectura"
              onKeyDown={navigateTabs}
            >
              {(
                [
                  { id: "all", label: "Todos", count: clicks.length },
                  { id: "unread", label: "Sin revisar", count: unreadCount },
                  { id: "whatsapp", label: "WhatsApp", count: whatsappCount },
                  { id: "email", label: "Correo", count: emailCount },
                  {
                    id: "generic",
                    label: "Aperturas",
                    count: genericCount + telegramCount,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`contact-tab-${tab.id}`}
                  aria-selected={typeFilter === tab.id}
                  tabIndex={typeFilter === tab.id ? 0 : -1}
                  onClick={() => setTypeFilter(tab.id)}
                >
                  {tab.label}
                  <span>{integer(tab.count)}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredClicks.length > 0 && (
            <div className={s.selectionBar}>
              <label className={s.selectAllLabel}>
                <Checkbox
                  checked={
                    filteredClicks.length > 0 &&
                    selectedIds.length === filteredClicks.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Seleccionar todos los registros visibles"
                />
                <span>
                  {selectedIds.length > 0
                    ? `${integer(selectedIds.length)} ${
                        selectedIds.length === 1
                          ? "registro seleccionado"
                          : "registros seleccionados"
                      }`
                    : `Seleccionar visibles (${integer(filteredClicks.length)})`}
                </span>
              </label>

              {selectedIds.length > 0 && (
                <div className={s.bulkActions}>
                  <button
                    type="button"
                    className={s.secondaryButton}
                    onClick={() => void handleMarkAsRead(selectedIds)}
                  >
                    <Check size={16} aria-hidden="true" />
                    Marcar revisados
                  </button>
                  <button
                    type="button"
                    className={s.dangerButton}
                    onClick={() => setDeleteTargetIds(selectedIds)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Eliminar ({integer(selectedIds.length)})
                  </button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className={s.loading} role="status">
              <Loader2 size={22} className={s.spinner} aria-hidden="true" />
              <span>Cargando interacciones de contacto…</span>
            </div>
          ) : filteredClicks.length === 0 ? (
            <div className={s.empty}>
              <h3>
                {searchTerm || typeFilter !== "all"
                  ? "No hay registros con estos filtros"
                  : "Todavía no hay clics de contacto registrados"}
              </h3>
              <p>
                {searchTerm || typeFilter !== "all"
                  ? "Cambia la búsqueda o selecciona otra pestaña para consultar el resto del historial."
                  : "Cuando un comprador pulse un botón de contacto en una publicación, el registro aparecerá aquí."}
              </p>
              {(searchTerm || typeFilter !== "all") && (
                <button
                  type="button"
                  className={s.secondaryButton}
                  onClick={() => {
                    setSearchTerm("")
                    setTypeFilter("all")
                  }}
                >
                  Ver todos los registros
                </button>
              )}
            </div>
          ) : (
            <div className={s.rows}>
              {filteredClicks.map((c) => {
                const isSelected = selectedIds.includes(c.id)
                const productLabel =
                  c.product_title || "Publicación no disponible"
                return (
                  <article
                    key={c.id}
                    className={s.row}
                    data-unread={!c.is_read}
                    data-selected={isSelected}
                  >
                    <div className={s.rowMain}>
                      <div className={s.checkCell}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(c.id)}
                          aria-label={`Seleccionar registro de ${productLabel}`}
                        />
                      </div>

                      <div className={s.rowBody}>
                        <div className={s.rowTop}>
                          {c.product_id ? (
                            <Link
                              href={`/producto/${c.product_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={s.productTitle}
                            >
                              {productLabel}
                            </Link>
                          ) : (
                            <span className={s.productTitle}>
                              {productLabel}
                            </span>
                          )}
                          {!c.is_read && (
                            <span className={s.unreadBadge}>
                              <i aria-hidden="true" />
                              Sin revisar
                            </span>
                          )}
                        </div>

                        <div className={s.metaLine}>
                          {renderChannelBadge(c.click_type)}
                          <time dateTime={c.created_at}>
                            {formatDate(c.created_at)}
                          </time>
                        </div>

                        <dl className={s.participants}>
                          <div className={s.participant}>
                            <dt>Interesado</dt>
                            <dd>
                              <strong>
                                {c.buyer_company ||
                                  c.buyer_name ||
                                  "Visitante sin sesión"}
                              </strong>
                              <span>
                                {c.buyer_email || "Correo no registrado"}
                              </span>
                            </dd>
                          </div>
                          <div className={s.participant}>
                            <dt>Vendedor</dt>
                            <dd>
                              <strong>
                                {c.seller_company ||
                                  c.seller_name ||
                                  "Vendedor de la publicación"}
                              </strong>
                              <span>
                                {c.seller_email ||
                                  c.seller_id ||
                                  "Sin correo asociado"}
                              </span>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className={s.rowActions}>
                      {!c.is_read && (
                        <button
                          type="button"
                          className={s.iconAction}
                          onClick={() => void handleMarkAsRead([c.id])}
                          aria-label={`Marcar como revisado el contacto de ${productLabel}`}
                          title="Marcar como revisado"
                        >
                          <Check size={16} aria-hidden="true" />
                        </button>
                      )}
                      {c.product_id && (
                        <Link
                          href={`/producto/${c.product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={s.iconAction}
                          aria-label={`Abrir publicación ${productLabel}`}
                          title="Abrir publicación"
                        >
                          <ExternalLink size={16} aria-hidden="true" />
                        </Link>
                      )}
                      <button
                        type="button"
                        className={s.iconAction}
                        data-danger="true"
                        onClick={() => setDeleteTargetIds([c.id])}
                        aria-label={`Eliminar registro de ${productLabel}`}
                        title="Eliminar registro"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside className={s.sidebar} aria-label="Estadísticas de interés">
          <article className={s.sidePanel}>
            <div className={s.sideHeader}>
              <h2>Publicaciones con más interés</h2>
              <p>Productos que acumulan más clics de contacto directo.</p>
            </div>
            {topProducts.length > 0 ? (
              <ul className={s.barList}>
                {topProducts.map((p, index) => (
                  <li key={`${p.title}-${index}`}>
                    <div>
                      <span>{p.title}</span>
                      <strong>{integer(p.count)}</strong>
                    </div>
                    <div className={s.barTrack} aria-hidden="true">
                      <div
                        style={{
                          width: `${(p.count / maxProductCount) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.sideNote}>
                Todavía no hay suficientes clics para mostrar la comparación por
                producto.
              </p>
            )}
          </article>

          <article className={s.sidePanel}>
            <div className={s.sideHeader}>
              <h2>Distribución por canal</h2>
              <p>Preferencia de contacto en las publicaciones.</p>
            </div>
            <ul className={s.barList}>
              {channelBreakdown.map((item) => (
                <li key={item.label}>
                  <div>
                    <span>{item.label}</span>
                    <strong>{integer(item.count)}</strong>
                  </div>
                  <div className={s.barTrack} aria-hidden="true">
                    <div
                      style={{
                        width: `${(item.count / maxChannelCount) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className={s.sideNote}>
              WhatsApp concentra el{" "}
              <strong>
                {clicks.length > 0
                  ? `${Math.round((whatsappCount / clicks.length) * 100)}%`
                  : "0%"}
              </strong>{" "}
              de las interacciones registradas en el catálogo.
            </p>
          </article>
        </aside>
      </div>

      <AlertDialog
        open={deleteTargetIds.length > 0}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTargetIds([])
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTargetIds.length === 1
                ? "Eliminar registro de contacto"
                : `Eliminar ${deleteTargetIds.length} registros de contacto`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargetIds.length === 1
                ? "Este registro de interacción se eliminará permanentemente del historial."
                : `Se eliminarán permanentemente los ${deleteTargetIds.length} registros seleccionados.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 min-h-11"
            >
              {isDeleting ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
