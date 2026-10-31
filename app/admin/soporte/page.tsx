"use client"

import React, {
  Fragment,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  RefreshCw,
  MoreHorizontal,
  FileText,
  Download,
  Eye,
  EyeOff,
  Check,
  CheckCheck,
  Copy,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Paperclip,
  Send,
  X,
  MessageSquare,
  ExternalLink,
} from "lucide-react"
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

const userCode = (id: string) =>
  `USR-${(id || "").replace(/-/g, "").slice(0, 8).toUpperCase()}`

function dateLabel(
  value: string | undefined,
  mode: "day" | "time" | "short" = "short"
) {
  if (!value || !Number.isFinite(Date.parse(value))) return ""
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: "America/El_Salvador",
    ...(mode === "time"
      ? { hour: "2-digit", minute: "2-digit" }
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

const QUICK_REPLIES = [
  {
    label: "Saludo y bienvenida",
    text: "Hola, gracias por comunicarte con soporte de Agrilpa. ¿En qué podemos apoyarte?",
  },
  {
    label: "Caso en revisión",
    text: "Recibimos tu solicitud y estamos revisando los detalles. En breve te responderemos.",
  },
  {
    label: "Solicitar más detalles",
    text: "Para ayudarte mejor, ¿podrías compartirnos una captura o indicarnos los pasos que realizaste?",
  },
  {
    label: "Caso verificado",
    text: "Tu caso fue verificado por nuestro equipo. Por favor confirma si todo funciona correctamente.",
  },
  {
    label: "Consulta resuelta",
    text: "Damos por resuelta tu consulta. Quedamos a tu disposición si necesitas algo más.",
  },
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
  const [updatedAt, setUpdatedAt] = useState("")
  const [attachment, setAttachment] = useState<{
    url: string
    type: "image" | "pdf" | "docx" | "file"
    name: string
    size?: string
  } | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)
  const detailHeaderRef = useRef<HTMLDivElement>(null)
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
          throw new Error("No pudimos actualizar las conversaciones de soporte.")
        const data = await res.json()
        setFetchError("")
        setUpdatedAt(new Date().toISOString())
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
              : "No se pudieron cargar las conversaciones de soporte."
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
    requestAnimationFrame(() => {
      if (detailHeaderRef.current) detailHeaderRef.current.scrollTop = 0
    })
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
      setActionError("No pudimos actualizar el estado de revisión.")
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

      setUpdatedAt(new Date().toISOString())
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
      setActionError("")
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      setActionError("No se pudo copiar el dato automáticamente.")
    }
  }

  function copyButton(value: string, key: string, label: string) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={s.copy}
        aria-label={label}
        onClick={() => void handleCopy(value, key)}
      >
        {copiedKey === key ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
      </Button>
    )
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
        t.user.fullName.toLowerCase().includes(q) ||
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
    if (!msg) return "Sin mensajes"
    if (msg.attachment_url && !msg.content) {
      return msg.attachment_type === "image"
        ? "Imagen adjunta"
        : "Archivo adjunto"
    }
    return (
      msg.content
        ?.replace(/^📷\s*Foto adjunta$/i, "Imagen adjunta")
        .replace(/^📎\s*Documento adjunto$/i, "Archivo adjunto") ||
      "Sin mensajes"
    )
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerIntro}>
          <h1>Soporte</h1>
          <p>
            Gestiona las consultas de ayuda y responde los tickets de soporte de
            los usuarios.
          </p>
        </div>
      </header>

      <section className={s.panel} aria-label="Conversaciones de soporte">
        <header className={s.heading}>
          <div>
            <h2>Conversaciones</h2>
            <p>
              {loading
                ? "Cargando conversaciones…"
                : fetchError && !tickets.length
                  ? "No se pudo cargar la bandeja."
                  : `${totalTickets} ${totalTickets === 1 ? "conversación" : "conversaciones"} · ${unreadTotal} sin revisar`}
            </p>
          </div>
        </header>

        {fetchError && (
          <div role="alert" className={s.notice}>
            {fetchError}
            <Button variant="outline" onClick={() => void fetchTickets(false)}>
              Reintentar
            </Button>
          </div>
        )}

        {actionError && (
          <p role="alert" className={s.notice}>
            {actionError}
          </p>
        )}

        <div className={s.workspace} data-mobile-open={mobileOpen}>
          <aside className={s.list} aria-label="Listado de tickets de soporte">
            <div className={s.listTools}>
              <div className={s.search}>
                <Search size={18} aria-hidden="true" />
                <Input
                  type="search"
                  aria-label="Buscar conversaciones"
                  placeholder="Buscar conversaciones"
                  data-no-auto-caps="true"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={s.refresh}
                  disabled={isRefreshing}
                  aria-label="Actualizar conversaciones"
                  title="Actualizar conversaciones"
                  onClick={() => void fetchTickets(false)}
                >
                  <RefreshCw
                    size={16}
                    className={isRefreshing ? s.spinner : undefined}
                    aria-hidden="true"
                  />
                </Button>
              </div>

              <div
                className={s.filters}
                role="group"
                aria-label="Filtrar por estado"
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
                ).map((filter) => (
                  <button
                    type="button"
                    key={filter.value}
                    aria-pressed={statusFilter === filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}
                    <span>{filter.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={s.rows}>
              {loading ? (
                <div className={s.empty} role="status">
                  <Loader2 className={s.spinner} size={22} />
                  Cargando conversaciones…
                </div>
              ) : !filteredTickets.length ? (
                <div className={s.empty}>
                  <h3>
                    {searchQuery || statusFilter !== "all"
                      ? "No hay coincidencias"
                      : "Todavía no hay conversaciones"}
                  </h3>
                  <p>
                    {searchQuery || statusFilter !== "all"
                      ? "Cambia la búsqueda o el filtro para ver otros tickets."
                      : "Las consultas de soporte de los usuarios aparecerán aquí."}
                  </p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const lastMsg = ticket.lastMessage
                  const lastDate = lastMsg?.created_at || ticket.updatedAt
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      className={s.row}
                      aria-pressed={selectedTicketId === ticket.id}
                      onClick={() => handleSelectTicket(ticket)}
                    >
                      <span className={s.rowAvatar} aria-hidden="true">
                        {initials(ticket.user.name)}
                      </span>
                      <div className={s.rowBody}>
                        <div className={s.rowTop}>
                          <strong>{ticket.user.name}</strong>
                          <time dateTime={lastDate}>{dateLabel(lastDate)}</time>
                        </div>
                        <p className={s.rowSeller}>
                          {ticket.user.companyName} · {ticket.user.email}
                        </p>
                        <p className={s.rowProduct}>
                          #{ticketCode(ticket.id)} ·{" "}
                          {STATUS_LABELS[ticket.status] || "Abierto"}
                        </p>
                        <p className={s.snippet}>{formatSnippet(lastMsg)}</p>
                        <div className={s.rowFoot}>
                          <span>
                            {ticket.messages.length}{" "}
                            {ticket.messages.length === 1
                              ? "mensaje"
                              : "mensajes"}
                          </span>
                          {ticket.unreadCount > 0 && (
                            <span className={s.pending}>
                              <i aria-hidden="true" />
                              Sin revisar
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
                <h3>Selecciona una conversación</h3>
                <p>
                  Revisa los datos del usuario, el historial de soporte y envía
                  una respuesta.
                </p>
              </div>
            ) : (
              <>
                <div ref={detailHeaderRef} className={s.detailHeader}>
                  <div className={s.chatTop}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={s.back}
                      aria-label="Volver a conversaciones"
                      title="Volver a conversaciones"
                      onClick={() => setMobileOpen(false)}
                    >
                      <ArrowLeft size={18} />
                    </Button>

                    <div className={s.productIdentity}>
                      <span className={s.headerBadgeAvatar} aria-hidden="true">
                        {initials(activeTicket.user.name)}
                      </span>
                      <div>
                        <h3 title={activeTicket.user.name}>
                          {activeTicket.user.name}
                        </h3>
                        <span>
                          #{ticketCode(activeTicket.id)} ·{" "}
                          {STATUS_LABELS[activeTicket.status] || "Abierto"}
                        </span>
                      </div>
                    </div>

                    <div className={s.topControls}>
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
                          <SelectItem value="in_progress">
                            En atención
                          </SelectItem>
                          <SelectItem value="resolved">Resuelto</SelectItem>
                        </SelectContent>
                      </Select>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={s.more}
                            aria-label="Acciones de la conversación"
                            title="Acciones de la conversación"
                          >
                            <MoreHorizontal size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className={s.actionsMenu}
                          collisionPadding={12}
                        >
                          <DropdownMenuItem
                            className={s.menuItem}
                            onSelect={() =>
                              void handleToggleTicketSeen(activeTicket)
                            }
                          >
                            {activeTicket.unreadCount === 0 ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}{" "}
                            {activeTicket.unreadCount === 0
                              ? "Marcar sin revisar"
                              : "Marcar revisada"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={s.menuItem}
                            onSelect={() =>
                              void handleCopy(
                                `#${ticketCode(activeTicket.id)}`,
                                "conversation"
                              )
                            }
                          >
                            <Copy size={16} />
                            Copiar código de conversación
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={s.menuItem}
                            disabled={isRefreshing}
                            onSelect={() => void fetchTickets(false)}
                          >
                            <RefreshCw size={16} />
                            Actualizar conversaciones
                          </DropdownMenuItem>
                          {activeTicket.user.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild className={s.menuItem}>
                                <Link
                                  href={`/vendedor/${activeTicket.user.id}`}
                                >
                                  <ExternalLink size={16} />
                                  Ver perfil del usuario
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={s.participantsSummary}
                    aria-label={detailsOpen ? "Ocultar datos" : "Ver datos"}
                    aria-expanded={detailsOpen}
                    aria-controls="support-participants"
                    onClick={() => setDetailsOpen((open) => !open)}
                  >
                    <span className={s.participant}>
                      <span className={s.avatar} aria-hidden="true">
                        {initials(activeTicket.user.name)}
                      </span>
                      <span>
                        <small>Usuario</small>
                        <strong>{activeTicket.user.name}</strong>
                      </span>
                    </span>
                    <span className={s.participant}>
                      <span className={s.avatar} aria-hidden="true">
                        SA
                      </span>
                      <span>
                        <small>Contacto</small>
                        <strong>{activeTicket.user.email}</strong>
                      </span>
                    </span>
                    <span className={s.participantHint}>
                      <span>{detailsOpen ? "Ocultar datos" : "Ver datos"}</span>
                      <ChevronDown
                        size={16}
                        className={detailsOpen ? s.rotated : undefined}
                      />
                    </span>
                  </button>

                  {detailsOpen && (
                    <div
                      id="support-participants"
                      className={s.participantDetails}
                    >
                      <section aria-label="Datos del usuario">
                        <h4>Usuario</h4>
                        <dl>
                          <div>
                            <dt>Nombre</dt>
                            <dd>
                              {activeTicket.user.fullName ||
                                activeTicket.user.name}
                            </dd>
                          </div>
                          <div>
                            <dt>Empresa</dt>
                            <dd>
                              {activeTicket.user.companyName || "No indicada"}
                            </dd>
                          </div>
                          <div>
                            <dt>Código</dt>
                            <dd className={s.code}>
                              {userCode(activeTicket.user.id)}
                              {copyButton(
                                userCode(activeTicket.user.id),
                                "user-code",
                                "Copiar código del usuario"
                              )}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <section aria-label="Datos de contacto">
                        <h4>Contacto</h4>
                        <dl>
                          <div>
                            <dt>Correo</dt>
                            <dd className={s.code}>
                              <span>
                                {activeTicket.user.email || "No indicado"}
                              </span>
                              {activeTicket.user.email &&
                                copyButton(
                                  activeTicket.user.email,
                                  "email",
                                  "Copiar correo electrónico"
                                )}
                            </dd>
                          </div>
                          <div>
                            <dt>Teléfono</dt>
                            <dd className={s.code}>
                              <span>
                                {activeTicket.user.phone || "No indicado"}
                              </span>
                              {activeTicket.user.phone &&
                                activeTicket.user.phone !== "No especificado" &&
                                copyButton(
                                  activeTicket.user.phone,
                                  "phone",
                                  "Copiar teléfono"
                                )}
                            </dd>
                          </div>
                          <div>
                            <dt>Estado del ticket</dt>
                            <dd>
                              {STATUS_LABELS[activeTicket.status] || "Abierto"}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <div className={s.conversationReference}>
                        <span>Código de conversación</span>
                        <span>#{ticketCode(activeTicket.id)}</span>
                        {copyButton(
                          `#${ticketCode(activeTicket.id)}`,
                          "conversation",
                          "Copiar código de conversación"
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  ref={chatScrollRef}
                  className={s.thread}
                  role="log"
                  aria-live="off"
                  aria-label="Mensajes de la conversación"
                >
                  {!activeTicket.messages.length ? (
                    <div className={s.empty}>
                      <h4>Aún no hay mensajes</h4>
                      <p>Los mensajes de esta conversación aparecerán aquí.</p>
                    </div>
                  ) : (
                    activeTicket.messages.map((message: any, index: number) => {
                      const isAdmin = message.sender_id === adminId
                      const sender = isAdmin
                        ? "Soporte Agrilpa"
                        : activeTicket.user.name
                      const day = dateLabel(message.created_at, "day")
                      const newDay =
                        index === 0 ||
                        day !==
                          dateLabel(
                            activeTicket.messages[index - 1].created_at,
                            "day"
                          )
                      const showSender =
                        newDay ||
                        message.sender_id !==
                          activeTicket.messages[index - 1]?.sender_id
                      const cleanContent = message.content
                        ?.replace(/^📷\s*Foto adjunta$/i, "")
                        .replace(/^📎\s*Documento adjunto$/i, "")
                        .trim()

                      return (
                        <Fragment key={message.id}>
                          {newDay && day && <div className={s.day}>{day}</div>}
                          <div
                            className={s.messageRow}
                            data-side={isAdmin ? "seller" : "buyer"}
                          >
                            {showSender && (
                              <span className={s.sender}>{sender}</span>
                            )}
                            <div className={s.bubble}>
                              {message.attachment_url &&
                                (message.attachment_type === "image" ? (
                                  <button
                                    type="button"
                                    className={s.imageAttachment}
                                    aria-label="Ampliar imagen adjunta"
                                    onClick={() =>
                                      setPreviewImage(message.attachment_url)
                                    }
                                  >
                                    <img
                                      src={message.attachment_url}
                                      alt="Imagen adjunta"
                                    />
                                    <span>
                                      <Eye size={15} />
                                      Ver imagen
                                    </span>
                                  </button>
                                ) : (
                                  <div className={s.document}>
                                    <FileText size={20} aria-hidden="true" />
                                    <span>
                                      {message.attachment_type === "pdf"
                                        ? "Documento PDF"
                                        : message.attachment_type === "docx"
                                          ? "Documento Word"
                                          : "Archivo adjunto"}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className={s.fileAction}
                                      onClick={() =>
                                        void downloadAttachment(
                                          message.attachment_url,
                                          "documento-soporte"
                                        )
                                      }
                                    >
                                      <Download size={16} />
                                      Descargar
                                    </Button>
                                  </div>
                                ))}

                              {cleanContent && (
                                <p className={s.messageText}>{cleanContent}</p>
                              )}

                              <div className={s.messageMeta}>
                                <time dateTime={message.created_at}>
                                  {dateLabel(message.created_at, "time")}
                                </time>
                                <span>
                                  {message.read_at ? (
                                    <>
                                      <CheckCheck size={15} />
                                      Leído
                                    </>
                                  ) : (
                                    <>
                                      <Check size={15} />
                                      Enviado
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Fragment>
                      )
                    })
                  )}
                </div>

                <div className={s.composer}>
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setAttachment(null)}
                        aria-label="Quitar archivo adjunto"
                      >
                        <X size={16} />
                      </Button>
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
                      className={s.attachBtn}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Adjuntar archivo"
                      title="Adjuntar archivo (máximo 10 MB)"
                    >
                      <Paperclip size={16} />
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className={s.quickMenuBtn}>
                          <MessageSquare size={15} />
                          <span>Respuestas rápidas</span>
                          <ChevronDown size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className={s.actionsMenu}
                      >
                        {QUICK_REPLIES.map((reply) => (
                          <DropdownMenuItem
                            key={reply.label}
                            className={s.menuItem}
                            onSelect={() => {
                              setReplyText(reply.text)
                              requestAnimationFrame(() =>
                                replyInputRef.current?.focus()
                              )
                            }}
                          >
                            {reply.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <input
                      ref={replyInputRef}
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
                      className={s.sendBtn}
                      onClick={() => void handleSendReply()}
                      disabled={isSending || (!replyText.trim() && !attachment)}
                    >
                      <Send size={15} />
                      <span>Responder</span>
                    </button>
                  </div>

                  <footer className={s.footer}>
                    <span className={s.footerState} role="status">
                      {activeTicket.unreadCount === 0 ? (
                        <Check size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}{" "}
                      {activeTicket.unreadCount === 0
                        ? "Revisada"
                        : "Sin revisar"}
                      <span aria-hidden="true">·</span>
                      {STATUS_LABELS[activeTicket.status] || "Abierto"}
                    </span>
                    {updatedAt && (
                      <span>
                        Actualizado a las {dateLabel(updatedAt, "time")}
                      </span>
                    )}
                  </footer>
                </div>
              </>
            )}
          </div>
        </div>

        <MediaLightbox
          imageUrl={previewImage}
          onClose={() => setPreviewImage(null)}
          title="Imagen adjunta"
        />
      </section>
    </div>
  )
}
