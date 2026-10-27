"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  Search
} from "lucide-react"
import type { ProductContactRequest } from "@/lib/contact/types"
import s from "./product-contacts.module.css"

function date(value: string, short = false) {
  return new Intl.DateTimeFormat(
    "es-SV",
    short
      ? { day: "2-digit", month: "short", timeZone: "America/El_Salvador" }
      : {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "America/El_Salvador"
        }
  ).format(new Date(value))
}

export function ProductContactInbox({
  onUnread,
  mode = "chat"
}: {
  onUnread: (count: number) => void
  mode?: "chat" | "admin_form"
}) {
  const [items, setItems] = useState<ProductContactRequest[]>([])
  const [selected, setSelected] = useState<ProductContactRequest | null>(null)
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState("")
  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [copied, setCopied] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query)
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])
  useEffect(() => {
    const timer = setInterval(() => setRefresh((n) => n + 1), 20000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFailure("")
    const parameters = new URLSearchParams({
      q: search,
      filter,
      page: String(page)
    })
    fetch(`/api/admin/product-contacts?${parameters}`, {
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok)
          throw new Error(result.error || "No pudimos cargar las solicitudes.")
        if (!Array.isArray(result.requests))
          throw new Error(
            "No pudimos interpretar las solicitudes. Vuelve a intentarlo."
          )
        if (controller.signal.aborted) return
        setItems(result.requests)
        setTotal(result.total)
        onUnread(result.unreadCount)
        setSelected((previous) =>
          previous
            ? result.requests.find(
                (item: ProductContactRequest) => item.id === previous.id
              ) || previous
            : null
        )
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setFailure(error.message)
          setItems([])
          setSelected(null)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [search, filter, page, refresh, onUnread])
  async function update(
    item: ProductContactRequest,
    changes: { read?: boolean; status?: "new" | "contacted" }
  ) {
    if (busy) return
    setBusy(true)
    setActionError("")
    try {
      const response = await fetch(`/api/admin/product-contacts/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes)
      })
      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || "No pudimos actualizar esta solicitud.")
      setItems((previous) =>
        previous.map((current) =>
          current.id === item.id ? result.request : current
        )
      )
      setSelected((previous) =>
        previous?.id === item.id ? result.request : previous
      )
      setRefresh((n) => n + 1)
      window.dispatchEvent(new Event("update-mensajes-unread-count"))
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No pudimos guardar el cambio."
      )
    } finally {
      setBusy(false)
    }
  }
  function select(item: ProductContactRequest) {
    if (busy) return
    setSelected(item)
    setActionError("")
    setCopied("")
    if (!item.read_at) void update(item, { read: true })
  }
  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
    } catch {
      setActionError(
        "No pudimos copiar. Puedes seleccionar y copiar el dato directamente."
      )
    }
  }
  return (
    <section aria-label="Solicitudes de contacto">
      <div className={s.toolbar}>
        <div className={s.search}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar solicitudes de contacto"
            data-no-auto-caps="true"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar persona, producto, país o correo"
          />
        </div>
        <select
          aria-label="Filtrar solicitudes"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value)
            setPage(1)
          }}
        >
          <option value="all">Todas las solicitudes</option>
          <option value="unread">Sin revisar</option>
          <option value="contacted">Contactadas</option>
        </select>
        <button
          className={s.secondary}
          onClick={() => setRefresh((n) => n + 1)}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? s.spinner : undefined}
            aria-hidden="true"
          />
          Actualizar
        </button>
      </div>
      {failure ? (
        <div className={s.notice} role="alert">
          {failure}{" "}
          <button onClick={() => setRefresh((n) => n + 1)}>Reintentar</button>
        </div>
      ) : (
        <div className={s.inbox} data-selected={!!selected}>
          <div className={s.list}>
            <div className={s.listHead}>
              <span>
                {total} {total === 1 ? "solicitud" : "solicitudes"}
              </span>
              {loading && (
                <Loader2
                  size={16}
                  className={s.spinner}
                  aria-label="Actualizando solicitudes"
                />
              )}
            </div>
            {loading && !items.length ? (
              <div className={s.loading} role="status">
                Cargando solicitudes…
              </div>
            ) : !items.length ? (
              <div className={s.empty}>
                <h3>
                  {query || filter !== "all"
                    ? "No hay coincidencias"
                    : mode === "chat"
                      ? "Formulario de contacto desactivado"
                      : "Aquí llegarán las consultas"}
                </h3>
                <p>
                  {query || filter !== "all"
                    ? "Prueba otra búsqueda o cambia el filtro."
                    : mode === "chat"
                      ? "Las consultas nuevas se abren en Chats entre usuarios. Activa el interruptor superior si prefieres recibirlas por formulario."
                      : "Las solicitudes enviadas desde los productos aparecerán con los datos de contacto de la persona."}
                </p>
              </div>
            ) : (
              <div className={s.rows}>
                {items.map((item) => (
                  <button
                    className={s.row}
                    key={item.id}
                    aria-pressed={selected?.id === item.id}
                    onClick={() => select(item)}
                    disabled={busy}
                  >
                    <div className={s.rowTop}>
                      <strong>{item.full_name}</strong>
                      {!item.read_at && (
                        <span className={s.unread} aria-label="Sin revisar" />
                      )}
                      <time dateTime={item.created_at}>
                        {date(item.created_at, true)}
                      </time>
                    </div>
                    <p>{item.product_title}</p>
                    <small>
                      {item.country_name} ·{" "}
                      {item.status === "contacted" ? "Contactada" : "Pendiente"}
                    </small>
                  </button>
                ))}
              </div>
            )}
            {total > 20 && (
              <div className={s.pagination}>
                <button
                  aria-label="Página anterior"
                  disabled={loading || page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  Página {page} de {Math.ceil(total / 20)}
                </span>
                <button
                  aria-label="Página siguiente"
                  disabled={loading || page * 20 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
          <div className={s.detail}>
            {!selected ? (
              <div className={s.empty}>
                <h2>Selecciona una solicitud</h2>
                <p>
                  Podrás revisar los datos de contacto, el mensaje y el producto
                  que despertó su interés.
                </p>
              </div>
            ) : (
              <>
                <button
                  className={s.mobileBack}
                  onClick={() => setSelected(null)}
                >
                  <ArrowLeft size={16} />
                  Volver a solicitudes
                </button>
                <div className={s.detailTop}>
                  <span className={s.reference}>
                    SOL-{selected.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    className={s.status}
                    data-contacted={selected.status === "contacted"}
                  >
                    {selected.status === "contacted"
                      ? "Contactada"
                      : "Pendiente de contacto"}
                  </span>
                </div>
                <h2>{selected.full_name}</h2>
                <p className={s.date}>
                  Recibida el {date(selected.created_at)}
                </p>
                <dl className={s.facts}>
                  <div>
                    <dt>País</dt>
                    <dd>{selected.country_name}</dd>
                  </div>
                  <div>
                    <dt>Origen</dt>
                    <dd>
                      {selected.requester_id
                        ? "Usuario con cuenta"
                        : "Visitante sin registro"}
                    </dd>
                  </div>
                  <div>
                    <dt>Correo electrónico</dt>
                    <dd className={s.value}>
                      <span>{selected.email}</span>
                      <button
                        className={s.copy}
                        onClick={() => copy(selected.email, "email")}
                        aria-label="Copiar correo"
                      >
                        {copied === "email" ? (
                          <Check size={15} />
                        ) : (
                          <Copy size={15} />
                        )}
                      </button>
                    </dd>
                  </div>
                  <div>
                    <dt>WhatsApp</dt>
                    <dd className={s.value}>
                      <span>{selected.phone}</span>
                      <button
                        className={s.copy}
                        onClick={() => copy(selected.phone, "phone")}
                        aria-label="Copiar WhatsApp"
                      >
                        {copied === "phone" ? (
                          <Check size={15} />
                        ) : (
                          <Copy size={15} />
                        )}
                      </button>
                    </dd>
                  </div>
                </dl>
                {copied && (
                  <p className={s.date} role="status">
                    {copied === "email" ? "Correo copiado" : "WhatsApp copiado"}
                  </p>
                )}
                <div className={s.actions}>
                  <a
                    className={s.primary}
                    href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={16} />
                    Abrir WhatsApp
                  </a>
                  <a
                    className={s.secondary}
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Consulta sobre ${selected.product_title}`)}`}
                  >
                    <Mail size={16} />
                    Escribir correo
                  </a>
                </div>
                <div className={s.product}>
                  <img
                    src={selected.product_image || "/placeholder.svg"}
                    alt=""
                  />
                  <div>
                    <span>Producto de interés</span>
                    <strong>{selected.product_title}</strong>
                    <span>{selected.seller_name}</span>
                    <div>
                      {selected.product_id ? (
                        <Link
                          href={`/producto/${selected.product_id}`}
                          target="_blank"
                        >
                          Ver publicación <ArrowUpRight size={14} />
                        </Link>
                      ) : (
                        <span>La publicación ya no está disponible.</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={s.message}>
                  <h3>Mensaje de la persona</h3>
                  <p>{selected.message || "No añadió un mensaje adicional."}</p>
                </div>
                {actionError && (
                  <div className={s.notice} role="alert">
                    {actionError}
                  </div>
                )}
                <div className={s.detailFooter}>
                  <button
                    className={s.primary}
                    disabled={busy}
                    onClick={() =>
                      update(selected, {
                        status:
                          selected.status === "contacted" ? "new" : "contacted"
                      })
                    }
                  >
                    {busy && <Loader2 size={16} className={s.spinner} />}{" "}
                    {selected.status === "contacted"
                      ? "Volver a pendiente"
                      : "Marcar como contactada"}
                  </button>
                  <button
                    className={s.secondary}
                    disabled={busy}
                    onClick={() =>
                      update(selected, { read: !selected.read_at })
                    }
                  >
                    {selected.read_at
                      ? "Marcar sin revisar"
                      : "Marcar revisada"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
