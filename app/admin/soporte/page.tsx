"use client"

import React, {
  Fragment,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react"
import {
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  RefreshCw,
  Mail,
  Phone,
  FileText,
  Download,
  X,
  ArrowLeft,
  ChevronDown,
  Copy,
  Loader2,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/compress-image"
import { downloadAttachment } from "@/lib/download"
import { MediaLightbox } from "@/components/chat/media-lightbox"
import s from "./soporte.module.css"

interface SupportTicket {
  id: string
  conversation_id: string
  userId: string
  user: {
    id: string
    name: string
    fullName: string
    companyName: string
    email: string
    phone: string
    role: string
    registeredAt?: string
  }
  status: "open" | "in_progress" | "resolved"
  priority: "low" | "medium" | "high"
  adminNotes: string
  unreadCount: number
  lastMessage: any
  messages: any[]
  createdAt: string
  updatedAt: string
}

const integer = (value: number) => new Intl.NumberFormat("es-SV").format(value)

const initials = (name: string) =>
  (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

const ticketCode = (id: string) =>
  `CHAT-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`

function dateLabel(
  value: string | undefined,
  mode: "day" | "time" | "short" = "short"
) {
  if (!value || !Number.isFinite(Date.parse(value))) return ""
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: "America/El_Salvador",
    ...(mode === "time"
      ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
      : mode === "day"
        ? { day: "numeric", month: "long", year: "numeric" }
        : { day: "numeric", month: "short" }),
  }).format(new Date(value))
}

const STATUS_LABELS: Record<SupportTicket["status"], string> = {
  open: "Abierto",
  in_progress: "En atención",
  resolved: "Resuelto",
}

const PRESET_REPLIES = [
  "Hola, gracias por comunicarte con soporte de Agrilpa. ¿En qué podemos apoyarte?",
  "Recibimos tu solicitud y estamos revisando los detalles. En breve te responderemos.",
  "Tu caso fue verificado. Por favor confirma si todo funciona correctamente.",
  "Damos por resuelta tu consulta. Quedamos a tu disposición si necesitas algo más.",
]

export default function AdminSoportePage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState("")
  const [actionError, setActionError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "in_progress" | "resolved"
  >("all")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [attachment, setAttachment] = useState<{
    url: string
    type: "image" | "pdf" | "docx" | "file"
    name: string
    size?: string
  } | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedTicketIdRef = useRef(selectedTicketId)
  const prevMsgCountRef = useRef<number>(0)
  const prevTicketIdRef = useRef<string | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicketId
  }, [selectedTicketId])

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [])

  useEffect(() => {
    const currentTicket = tickets.find((t) => t.id === selectedTicketId)
    const currentCount = currentTicket?.messages?.length || 0
    const ticketChanged = prevTicketIdRef.current !== selectedTicketId
    const messageCountIncreased = currentCount > prevMsgCountRef.current

    if (ticketChanged || messageCountIncreased || attachment) {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
      }
    }

    prevMsgCountRef.current = currentCount
    prevTicketIdRef.current = selectedTicketId
  }, [selectedTicketId, tickets, attachment])

  const markTicketAsRead = useCallback(
    async (ticketId: string, currentAdminId?: string | null) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, unreadCount: 0 } : t))
      )
      const effectiveAdminId = currentAdminId || adminId || "admin"
      try {
        await Promise.allSettled([
          fetch("/api/chat/mark-as-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: ticketId,
              userId: effectiveAdminId,
            }),
          }),
          fetch("/api/admin/conversations/mark-seen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: ticketId, seen: true }),
          }),
        ])
        window.dispatchEvent(new Event("update-support-unread-count"))
        window.dispatchEvent(new Event("update-mensajes-unread-count"))
        window.dispatchEvent(new Event("update-unread-count"))
      } catch (e) {
        console.error("Error marking ticket as read:", e)
      }
    },
    [adminId]
  )

  const fetchTickets = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true)
      try {
        const res = await fetch(
          `/api/admin/support/conversations?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        )
        if (!res.ok)
          throw new Error("No pudimos actualizar las solicitudes de soporte.")
        const data = await res.json()
        setFetchError("")
        if (data.tickets) {
          const updated = data.tickets.map((t: SupportTicket) => {
            if (
              selectedTicketIdRef.current &&
              t.id === selectedTicketIdRef.current
            ) {
              return { ...t, unreadCount: 0 }
            }
            return t
          })
          setTickets(updated)
          if (data.adminId) setAdminId(data.adminId)

          const activeId =
            selectedTicketIdRef.current ||
            (updated.length > 0 ? updated[0].id : null)
          if (!selectedTicketIdRef.current && updated.length > 0) {
            setSelectedTicketId(updated[0].id)
          }

          if (activeId) {
            const currentT = data.tickets.find(
              (t: SupportTicket) => t.id === activeId
            )
            if (currentT && currentT.unreadCount > 0) {
              void markTicketAsRead(activeId, data.adminId)
            }
          }
        }
      } catch (err) {
        if (!silent) {
          setFetchError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los tickets de soporte."
          )
        }
      } finally {
        setLoading(false)
        if (!silent) setIsRefreshing(false)
      }
    },
    [markTicketAsRead]
  )

  useEffect(() => {
    void fetchTickets()
    const interval = setInterval(() => void fetchTickets(true), 4000)
    return () => clearInterval(interval)
  }, [fetchTickets])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("admin-support-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as any
          if (!newMsg) return

          const isCurrentActive =
            newMsg.conversation_id === selectedTicketIdRef.current

          setTickets((prev) =>
            prev.map((t) => {
              if (t.conversation_id === newMsg.conversation_id) {
                const isFromAdmin = newMsg.sender_id === adminId
                const updatedMessages = [
                  ...t.messages.filter((m) => m.id !== newMsg.id),
                  newMsg,
                ]
                return {
                  ...t,
                  messages: updatedMessages,
                  lastMessage: newMsg,
                  unreadCount: isCurrentActive
                    ? 0
                    : isFromAdmin
                      ? t.unreadCount
                      : t.unreadCount + 1,
                  updatedAt: newMsg.created_at,
                }
              }
              return t
            })
          )

          if (isCurrentActive) {
            void markTicketAsRead(newMsg.conversation_id, adminId)
          } else {
            window.dispatchEvent(new Event("update-support-unread-count"))
            window.dispatchEvent(new Event("update-mensajes-unread-count"))
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [adminId, markTicketAsRead])

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicketId(ticket.id)
    setMobileOpen(true)
    setDetailsOpen(false)
    setActionError("")
    void markTicketAsRead(ticket.id, adminId)
  }

  const handleToggleTicketSeen = async (ticket: SupportTicket) => {
    const isCurrentlyRead = ticket.unreadCount === 0
    const nextUnread = isCurrentlyRead ? 1 : 0
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id ? { ...t, unreadCount: nextUnread } : t
      )
    )
    try {
      await fetch("/api/admin/conversations/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: ticket.id,
          seen: !isCurrentlyRead,
        }),
      })
      if (!isCurrentlyRead) {
        await fetch("/api/chat/mark-as-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: ticket.id,
            userId: adminId || "admin",
          }),
        })
      }
      window.dispatchEvent(new Event("update-support-unread-count"))
      window.dispatchEvent(new Event("update-mensajes-unread-count"))
    } catch {
      setActionError("No pudimos actualizar el estado de lectura del ticket.")
    }
  }

  const handleStatusChange = async (
    newStatus: "open" | "in_progress" | "resolved"
  ) => {
    if (!selectedTicketId) return
    setActionError("")

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicketId
          ? {
              ...t,
              status: newStatus,
              unreadCount: newStatus === "resolved" ? 0 : t.unreadCount,
            }
          : t
      )
    )

    try {
      await fetch("/api/admin/support/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedTicketId,
          status: newStatus,
        }),
      })

      window.dispatchEvent(new Event("update-support-unread-count"))
      window.dispatchEvent(new Event("update-mensajes-unread-count"))
      window.dispatchEvent(new Event("update-unread-count"))
    } catch {
      setActionError("No pudimos guardar el nuevo estado del ticket.")
    }
  }

  const handleSendReply = async (presetText?: string) => {
    const textToSend = presetText || replyText
    if (
      (!textToSend.trim() && !attachment) ||
      isSending ||
      !selectedTicketId ||
      !adminId
    )
      return

    const activeTicket = tickets.find((t) => t.id === selectedTicketId)
    if (!activeTicket) return

    setIsSending(true)
    setActionError("")
    const currentAttachment = attachment
    const content = textToSend.trim()

    const tempId = `temp-${Date.now()}`
    const optimisticMsg = {
      id: tempId,
      conversation_id: selectedTicketId,
      sender_id: adminId,
      content:
        content ||
        (currentAttachment?.type === "image"
          ? "Imagen adjunta"
          : "Documento adjunto"),
      attachment_url: currentAttachment?.url || null,
      attachment_type: currentAttachment?.type || null,
      read_at: null,
      created_at: new Date().toISOString(),
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicketId
          ? {
              ...t,
              messages: [...t.messages, optimisticMsg],
              lastMessage: optimisticMsg,
              status: t.status === "open" ? "in_progress" : t.status,
            }
          : t
      )
    )

    if (!presetText) setReplyText("")
    setAttachment(null)

    try {
      const res = await fetch("/api/chat/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedTicketId,
          productId: null,
          buyerId: activeTicket.userId,
          sellerId: adminId,
          senderId: adminId,
          content,
          attachmentUrl: currentAttachment?.url,
          attachmentType: currentAttachment?.type,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el mensaje")

      if (data.message) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicketId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === tempId ? data.message : m
                  ),
                }
              : t
          )
        )
      }
    } catch {
      setActionError(
        "No pudimos enviar la respuesta. Verifica tu conexión e inténtalo de nuevo."
      )
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicketId
            ? {
                ...t,
                messages: t.messages.filter((m) => m.id !== tempId),
              }
            : t
        )
      )
      if (!presetText) setReplyText(content)
      setAttachment(currentAttachment)
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setActionError("El archivo adjunto no debe superar los 10 MB.")
      return
    }

    setActionError("")
    try {
      if (file.type.startsWith("image/")) {
        const compressedBase64 = await compressImage(file, {
          maxWidth: 1200,
          quality: 0.85,
        })
        setAttachment({
          url: compressedBase64,
          type: "image",
          name: file.name,
          size: `${(file.size / 1024).toFixed(0)} KB`,
        })
      } else {
        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          let fileType: "pdf" | "docx" | "file" = "file"
          if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            fileType = "pdf"
          } else if (file.name.match(/\.(doc|docx)$/i)) {
            fileType = "docx"
          }
          setAttachment({
            url: dataUrl,
            type: fileType,
            name: file.name,
            size: `${(file.size / 1024).toFixed(0)} KB`,
          })
        }
        reader.readAsDataURL(file)
      }
    } catch {
      setActionError("No pudimos procesar el archivo adjunto.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleCopy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      setActionError("No se pudo copiar el dato automáticamente.")
    }
  }

  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const qClean = q.replace(/^#/, "").trim()

    return tickets.filter((t) => {
      const code = `chat-${t.id.replace(/-/g, "").slice(0, 8).toLowerCase()}`
      const matchesSearch =
        searchQuery === "" ||
        t.id.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(qClean) ||
        code.includes(q) ||
        code.includes(qClean) ||
        `#${code}`.includes(q) ||
        t.user.name.toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q) ||
        t.user.companyName.toLowerCase().includes(q) ||
        t.messages.some((m) => m.content?.toLowerCase().includes(q))

      const matchesStatus =
        statusFilter === "all" || t.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [tickets, searchQuery, statusFilter])

  const activeTicket = tickets.find((t) => t.id === selectedTicketId)

  const totalTickets = tickets.length
  const openCount = tickets.filter((t) => t.status === "open").length
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress"
  ).length
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length
  const unreadTotal = tickets.reduce((acc, t) => acc + (t.unreadCount || 0), 0)

  const formatSnippet = (msg: any) => {
    if (!msg) return "Nueva consulta de soporte"
    if (msg.attachment_url && !msg.content) {
      return msg.attachment_type === "image"
        ? "Imagen adjunta"
        : "Documento adjunto"
    }
    return (
      msg.content
        ?.replace(/^📷\s*Foto adjunta$/i, "Imagen adjunta")
        .replace(/^📎\s*Documento adjunto$/i, "Documento adjunto") ||
      "Nueva consulta de soporte"
    )
  }

  return (
    <section className={s.page} aria-label="Centro de soporte de Agrilpa">
      <header className={s.header}>
        <div>
          <h1>Soporte</h1>
          <p>
            Atiende las consultas de ayuda y seguimiento técnico de los usuarios
            en tiempo real.
          </p>
        </div>
        <div className={s.headerActions}>
          <span className={s.summaryText}>
            {integer(totalTickets)}{" "}
            {totalTickets === 1 ? "conversación" : "conversaciones"} ·{" "}
            {integer(unreadTotal)} sin revisar
          </span>
          <button
            type="button"
            className={s.secondaryButton}
            onClick={() => void fetchTickets(false)}
            disabled={isRefreshing || loading}
          >
            <RefreshCw
              size={16}
              className={isRefreshing || loading ? s.spinner : undefined}
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
            onClick={() => void fetchTickets(false)}
          >
            Reintentar
          </button>
        </div>
      )}

      {actionError && (
        <div className={s.notice} role="alert">
          <span>{actionError}</span>
          <button
            type="button"
            className={s.secondaryButton}
            onClick={() => setActionError("")}
          >
            Cerrar
          </button>
        </div>
      )}

      <dl className={s.metrics} aria-label="Resumen de tickets de soporte">
        <button
          type="button"
          className={s.metric}
          aria-pressed={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        >
          <dt>Total de tickets</dt>
          <dd>{integer(totalTickets)}</dd>
          <span>{integer(unreadTotal)} pendientes de lectura</span>
        </button>

        <button
          type="button"
          className={s.metric}
          aria-pressed={statusFilter === "open"}
          onClick={() => setStatusFilter("open")}
        >
          <dt>Abiertos</dt>
          <dd>{integer(openCount)}</dd>
          <span>Solicitudes nuevas por atender</span>
        </button>

        <button
          type="button"
          className={s.metric}
          aria-pressed={statusFilter === "in_progress"}
          onClick={() => setStatusFilter("in_progress")}
        >
          <dt>En atención</dt>
          <dd>{integer(inProgressCount)}</dd>
          <span>Casos con seguimiento activo</span>
        </button>

        <button
          type="button"
          className={s.metric}
          aria-pressed={statusFilter === "resolved"}
          onClick={() => setStatusFilter("resolved")}
        >
          <dt>Resueltos</dt>
          <dd>{integer(resolvedCount)}</dd>
          <span>Consultas cerradas</span>
        </button>
      </dl>

      <div className={s.workspace} data-mobile-open={mobileOpen}>
        <aside className={s.list} aria-label="Listado de tickets de soporte">
          <div className={s.listTools}>
            <div className={s.search}>
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label="Buscar tickets por usuario, correo o código"
                placeholder="Buscar usuario, correo o código"
                data-no-auto-caps="true"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={s.iconBtn}
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>

            <div
              className={s.filters}
              role="group"
              aria-label="Filtrar tickets por estado"
            >
              {(
                [
                  { value: "all", label: "Todos", count: totalTickets },
                  { value: "open", label: "Abiertos", count: openCount },
                  {
                    value: "in_progress",
                    label: "En atención",
                    count: inProgressCount,
                  },
                  {
                    value: "resolved",
                    label: "Resueltos",
                    count: resolvedCount,
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={statusFilter === item.value}
                  onClick={() => setStatusFilter(item.value)}
                >
                  {item.label}
                  <span>{integer(item.count)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={s.rows}>
            {loading ? (
              <div className={s.empty} role="status">
                <Loader2 size={22} className={s.spinner} aria-hidden="true" />
                <span>Cargando tickets de soporte…</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className={s.empty}>
                <h3>
                  {searchQuery || statusFilter !== "all"
                    ? "Sin coincidencias"
                    : "Bandeja de soporte al día"}
                </h3>
                <p>
                  {searchQuery || statusFilter !== "all"
                    ? "Prueba otra búsqueda o cambia el filtro de estado."
                    : "Las nuevas consultas de asistencia aparecerán en esta columna."}
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicketId
                const lastMsg = ticket.lastMessage
                const lastDate = lastMsg?.created_at || ticket.updatedAt
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    className={s.row}
                    aria-pressed={isSelected}
                    onClick={() => handleSelectTicket(ticket)}
                  >
                    <span className={s.avatar} aria-hidden="true">
                      {initials(ticket.user.name)}
                    </span>
                    <div className={s.rowBody}>
                      <div className={s.rowTop}>
                        <strong>{ticket.user.name}</strong>
                        <time dateTime={lastDate}>
                          {dateLabel(lastDate, "time")}
                        </time>
                      </div>
                      <p className={s.rowCompany}>
                        {ticket.user.companyName} · {ticket.user.email}
                      </p>
                      <p className={s.snippet}>{formatSnippet(lastMsg)}</p>
                      <div className={s.rowFoot}>
                        <div className={s.rowBadges}>
                          <span
                            className={s.statusTag}
                            data-status={ticket.status}
                          >
                            {STATUS_LABELS[ticket.status] || "Abierto"}
                          </span>
                          <span className={s.ticketCode}>
                            #{ticketCode(ticket.id)}
                          </span>
                        </div>
                        {ticket.unreadCount > 0 && (
                          <span className={s.unreadIndicator}>
                            <i aria-hidden="true" />
                            {ticket.unreadCount} sin leer
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <div className={s.detail}>
          {!activeTicket ? (
            <div className={s.empty}>
              <h3>Selecciona un ticket de soporte</h3>
              <p>
                Elige una conversación de la lista izquierda para consultar la
                ficha del usuario y enviar una respuesta.
              </p>
            </div>
          ) : (
            <>
              <div className={s.detailHeader}>
                <div className={s.chatTop}>
                  <div className={s.userIdentity}>
                    <button
                      type="button"
                      className={s.back}
                      aria-label="Volver al listado de tickets"
                      onClick={() => setMobileOpen(false)}
                    >
                      <ArrowLeft size={18} aria-hidden="true" />
                    </button>
                    <span className={s.avatar} aria-hidden="true">
                      {initials(activeTicket.user.name)}
                    </span>
                    <div className={s.userTitle}>
                      <div className={s.userTitleRow}>
                        <h2>{activeTicket.user.name}</h2>
                        <span className={s.ticketCode}>
                          #{ticketCode(activeTicket.id)}
                        </span>
                      </div>
                      <p className={s.userSub}>
                        {activeTicket.user.companyName} ·{" "}
                        {activeTicket.user.email}
                      </p>
                    </div>
                  </div>

                  <div className={s.topControls}>
                    <button
                      type="button"
                      className={s.secondaryButton}
                      onClick={() => void handleToggleTicketSeen(activeTicket)}
                    >
                      {activeTicket.unreadCount === 0 ? (
                        <>
                          <CheckCheck size={15} aria-hidden="true" />
                          <span>Revisado</span>
                        </>
                      ) : (
                        <>
                          <Check size={15} aria-hidden="true" />
                          <span>Marcar revisado</span>
                        </>
                      )}
                    </button>

                    <Select
                      value={activeTicket.status}
                      onValueChange={(val: any) => void handleStatusChange(val)}
                    >
                      <SelectTrigger
                        className={s.statusSelect}
                        aria-label="Estado del ticket de soporte"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Abierto</SelectItem>
                        <SelectItem value="in_progress">En atención</SelectItem>
                        <SelectItem value="resolved">Resuelto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <button
                  type="button"
                  className={s.participantsSummary}
                  aria-expanded={detailsOpen}
                  aria-controls="support-user-details"
                  onClick={() => setDetailsOpen((open) => !open)}
                >
                  <div className={s.summaryItems}>
                    <span>
                      <Mail size={14} aria-hidden="true" />
                      {activeTicket.user.email}
                    </span>
                    {activeTicket.user.phone &&
                      activeTicket.user.phone !== "No especificado" && (
                        <span>
                          <Phone size={14} aria-hidden="true" />
                          {activeTicket.user.phone}
                        </span>
                      )}
                  </div>
                  <span className={s.summaryToggle}>
                    <span>
                      {detailsOpen ? "Ocultar datos" : "Ver datos del usuario"}
                    </span>
                    <ChevronDown
                      size={15}
                      className={detailsOpen ? s.rotated : undefined}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                {detailsOpen && (
                  <dl
                    id="support-user-details"
                    className={s.participantDetails}
                  >
                    <div>
                      <dt>Nombre completo</dt>
                      <dd>{activeTicket.user.fullName}</dd>
                    </div>
                    <div>
                      <dt>Empresa</dt>
                      <dd>{activeTicket.user.companyName}</dd>
                    </div>
                    <div>
                      <dt>Correo electrónico</dt>
                      <dd>
                        <span>{activeTicket.user.email}</span>
                        <button
                          type="button"
                          className={s.copyBtn}
                          aria-label="Copiar correo electrónico"
                          onClick={() =>
                            void handleCopy(activeTicket.user.email, "email")
                          }
                        >
                          {copiedKey === "email" ? (
                            <Check size={15} aria-hidden="true" />
                          ) : (
                            <Copy size={15} aria-hidden="true" />
                          )}
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt>Teléfono</dt>
                      <dd>
                        <span>{activeTicket.user.phone}</span>
                        {activeTicket.user.phone &&
                          activeTicket.user.phone !== "No especificado" && (
                            <button
                              type="button"
                              className={s.copyBtn}
                              aria-label="Copiar teléfono"
                              onClick={() =>
                                void handleCopy(
                                  activeTicket.user.phone,
                                  "phone"
                                )
                              }
                            >
                              {copiedKey === "phone" ? (
                                <Check size={15} aria-hidden="true" />
                              ) : (
                                <Copy size={15} aria-hidden="true" />
                              )}
                            </button>
                          )}
                      </dd>
                    </div>
                    <div>
                      <dt>Código de referencia</dt>
                      <dd>
                        <span>#{ticketCode(activeTicket.id)}</span>
                        <button
                          type="button"
                          className={s.copyBtn}
                          aria-label="Copiar código de referencia"
                          onClick={() =>
                            void handleCopy(
                              `#${ticketCode(activeTicket.id)}`,
                              "code"
                            )
                          }
                        >
                          {copiedKey === "code" ? (
                            <Check size={15} aria-hidden="true" />
                          ) : (
                            <Copy size={15} aria-hidden="true" />
                          )}
                        </button>
                      </dd>
                    </div>
                  </dl>
                )}
              </div>

              <div
                ref={chatScrollRef}
                className={s.thread}
                role="log"
                aria-label="Mensajes del ticket de soporte"
              >
                {activeTicket.messages.length === 0 ? (
                  <div className={s.empty}>
                    <h3>Sin mensajes en este ticket</h3>
                    <p>
                      Escribe una respuesta abajo para iniciar la atención con
                      el usuario.
                    </p>
                  </div>
                ) : (
                  activeTicket.messages.map((msg: any, index: number) => {
                    const isAdmin = msg.sender_id === adminId
                    const day = dateLabel(msg.created_at, "day")
                    const prevDay =
                      index > 0
                        ? dateLabel(
                            activeTicket.messages[index - 1].created_at,
                            "day"
                          )
                        : ""
                    const showDay = index === 0 || day !== prevDay
                    const showSender =
                      showDay ||
                      msg.sender_id !==
                        activeTicket.messages[index - 1]?.sender_id
                    const cleanContent = msg.content
                      ?.replace(/^📷\s*Foto adjunta$/i, "")
                      .replace(/^📎\s*Documento adjunto$/i, "")
                      .trim()

                    return (
                      <Fragment key={msg.id}>
                        {showDay && day && <div className={s.day}>{day}</div>}
                        <div
                          className={s.messageRow}
                          data-side={isAdmin ? "admin" : "user"}
                        >
                          {showSender && (
                            <span className={s.sender}>
                              {isAdmin
                                ? "Soporte Agrilpa"
                                : activeTicket.user.name}
                            </span>
                          )}
                          <div className={s.bubble}>
                            {msg.attachment_url && (
                              <div>
                                {msg.attachment_type === "image" ? (
                                  <div className={s.imageAttachment}>
                                    <button
                                      type="button"
                                      aria-label="Ver imagen adjunta"
                                      onClick={() =>
                                        setPreviewImage(msg.attachment_url)
                                      }
                                    >
                                      <img
                                        src={msg.attachment_url}
                                        alt="Adjunto enviado en soporte"
                                        loading="lazy"
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      className={s.fileAction}
                                      onClick={() =>
                                        downloadAttachment(
                                          msg.attachment_url,
                                          "adjunto-soporte.jpg"
                                        )
                                      }
                                    >
                                      <Download size={13} aria-hidden="true" />
                                      Descargar imagen
                                    </button>
                                  </div>
                                ) : (
                                  <div className={s.documentAttachment}>
                                    <span className="flex items-center gap-2 min-w-0">
                                      <FileText size={16} aria-hidden="true" />
                                      <span className="truncate">
                                        Documento adjunto
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      className={s.fileAction}
                                      onClick={() =>
                                        downloadAttachment(
                                          msg.attachment_url,
                                          "documento-soporte"
                                        )
                                      }
                                    >
                                      <Download size={13} aria-hidden="true" />
                                      Descargar
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {cleanContent && (
                              <p className={s.messageText}>{cleanContent}</p>
                            )}

                            <div className={s.messageMeta}>
                              <time dateTime={msg.created_at}>
                                {dateLabel(msg.created_at, "time") || "Ahora"}
                              </time>
                              {isAdmin && (
                                <span>
                                  {msg.read_at ? (
                                    <>
                                      <CheckCheck
                                        size={13}
                                        aria-hidden="true"
                                      />
                                      Leído
                                    </>
                                  ) : (
                                    <>
                                      <Check size={13} aria-hidden="true" />
                                      Enviado
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    )
                  })
                )}
              </div>

              <div className={s.composer}>
                <div className={s.quickBar}>
                  <span className={s.quickLabel}>Respuestas rápidas:</span>
                  {PRESET_REPLIES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => void handleSendReply(preset)}
                      disabled={isSending}
                      className={s.quickChip}
                      title={preset}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {attachment && (
                  <div className={s.attachmentBar}>
                    <div className={s.attachmentInfo}>
                      {attachment.type === "image" ? (
                        <img src={attachment.url} alt="Vista previa" />
                      ) : (
                        <FileText size={20} aria-hidden="true" />
                      )}
                      <div>
                        <strong>{attachment.name}</strong>
                        <span>{attachment.size} · Listo para enviar</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={s.iconBtn}
                      aria-label="Quitar archivo adjunto"
                      onClick={() => setAttachment(null)}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}

                <div className={s.inputRow}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    aria-label="Seleccionar archivo adjunto"
                  />

                  <button
                    type="button"
                    className={s.attachButton}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Adjuntar imagen o documento"
                    title="Adjuntar imagen o documento (máximo 10 MB)"
                  >
                    <Paperclip size={17} aria-hidden="true" />
                  </button>

                  <input
                    type="text"
                    className={s.replyInput}
                    placeholder="Escribe una respuesta como Soporte Agrilpa…"
                    aria-label="Escribir respuesta de soporte"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        void handleSendReply()
                      }
                    }}
                    disabled={isSending}
                  />

                  <button
                    type="button"
                    className={s.primaryButton}
                    onClick={() => void handleSendReply()}
                    disabled={isSending || (!replyText.trim() && !attachment)}
                  >
                    <Send size={15} aria-hidden="true" />
                    <span>Responder</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <MediaLightbox
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
        title="Adjunto de soporte"
      />
    </section>
  )
}
