"use client"

import {
  Fragment,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Search,
  RefreshCw,
  MoreHorizontal,
  FileText,
  Download,
  Eye,
  EyeOff,
  Headphones,
  Check,
  CheckCheck,
  Copy,
  ArrowLeft,
  ChevronDown,
  Loader2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { downloadAttachment } from "@/lib/download"
import { MediaLightbox } from "@/components/chat/media-lightbox"
import s from "./platform-conversations.module.css"

interface PlatformConversation {
  id: string
  code?: string
  product_id: string | null
  buyer_id: string
  seller_id: string
  created_at: string
  updated_at: string
  is_support: boolean
  is_seen?: boolean
  messages_count: number
  last_message: any
  messages: any[]
  buyer: {
    id: string
    code?: string
    name: string
    fullName: string
    companyName: string
    email: string
    phone: string
    role: string
  }
  seller: {
    id: string
    code?: string
    name: string
    fullName: string
    companyName: string
    email: string
    phone: string
    role: string
  }
  product: {
    id: string
    title: string
    price: string
    currency: string
    image: string
    unit?: string
    packaging?: string
    minOrder?: string
  } | null
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
const chatCode = (conversation: PlatformConversation) =>
  conversation.code ||
  `CHAT-${conversation.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`
const userCode = (user: PlatformConversation["buyer"]) =>
  user.code || `USR-${user.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
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
        : { day: "numeric", month: "short" })
  }).format(new Date(value))
}
function productPrice(product: PlatformConversation["product"]) {
  if (!product?.price) return ""
  if (/cotiz|quote|acordar/i.test(product.price)) return product.price
  return `${product.currency || ""} ${product.price}${product.unit ? ` / ${product.unit}` : ""}`.trim()
}
function attachmentUrl(value: string | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export function PlatformConversationsPanel() {
  const [conversations, setConversations] = useState<PlatformConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "unseen" | "seen">(
    "all"
  )
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState("")
  const [actionError, setActionError] = useState("")
  const [reviewBusy, setReviewBusy] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [updatedAt, setUpdatedAt] = useState("")
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const detailHeading = useRef<HTMLHeadingElement>(null)
  const productLinkRef = useRef<HTMLAnchorElement>(null)
  const detailHeaderRef = useRef<HTMLDivElement>(null)
  const selectedIdRef = useRef(selectedId)
  const conversationsRef = useRef(conversations)
  const mounted = useRef(true)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [])
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const persistReview = useCallback(async (id: string, seen: boolean) => {
    setReviewBusy(id)
    setActionError("")
    try {
      const response = await fetch("/api/admin/conversations/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id, seen })
      })
      if (!response.ok) throw Error("review")
      if (!mounted.current) return
      setConversations((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, is_seen: seen } : item
        )
      )
      window.dispatchEvent(new Event("update-mensajes-unread-count"))
      window.dispatchEvent(new Event("update-support-unread-count"))
    } catch {
      if (mounted.current)
        setActionError(
          "No pudimos guardar el estado de revisión. Vuelve a intentarlo."
        )
    } finally {
      if (mounted.current) setReviewBusy(null)
    }
  }, [])
  const fetchConversations = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true)
      try {
        const response = await fetch(
          `/api/admin/conversations?t=${Date.now()}`,
          { cache: "no-store" }
        )
        if (!response.ok) throw Error("fetch")
        const data = await response.json()
        if (!Array.isArray(data.conversations)) throw Error("format")
        if (!mounted.current) return
        setConversations(data.conversations)
        setFetchError("")
        setUpdatedAt(new Date().toISOString())
        if (!selectedIdRef.current && data.conversations.length) {
          const first = data.conversations[0]
          selectedIdRef.current = first.id
          setSelectedId(first.id)
          if (!first.is_seen) void persistReview(first.id, true)
        }
      } catch {
        if (mounted.current)
          setFetchError(
            "No pudimos actualizar las conversaciones. Reintenta o comprueba tu sesión."
          )
      } finally {
        if (mounted.current) {
          setLoading(false)
          if (!silent) setIsRefreshing(false)
        }
      }
    },
    [persistReview]
  )
  useEffect(() => {
    void fetchConversations()
    const timer = setInterval(() => void fetchConversations(true), 6000)
    return () => clearInterval(timer)
  }, [fetchConversations])
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("admin-platform-messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as any
          if (!message?.conversation_id) return
          if (
            !conversationsRef.current.some(
              (item) => item.id === message.conversation_id
            )
          ) {
            void fetchConversations(true)
            return
          }
          const active = selectedIdRef.current === message.conversation_id
          setConversations((previous) =>
            previous.map((item) => {
              if (item.id !== message.conversation_id) return item
              const messages = [
                ...item.messages.filter((entry) => entry.id !== message.id),
                message
              ]
              return {
                ...item,
                messages,
                messages_count: messages.length,
                last_message: message,
                is_seen: active ? item.is_seen : false,
                updated_at: message.created_at || item.updated_at
              }
            })
          )
          if (active) void persistReview(message.conversation_id, true)
          else window.dispatchEvent(new Event("update-mensajes-unread-count"))
        }
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchConversations, persistReview])
  const activeConv = useMemo(
    () => conversations.find((item) => item.id === selectedId) || null,
    [conversations, selectedId]
  )
  const messages = useMemo(
    () =>
      [...(activeConv?.messages || [])].sort(
        (a, b) =>
          (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0)
      ),
    [activeConv?.messages]
  )
  useEffect(() => {
    if (messagesScrollRef.current)
      messagesScrollRef.current.scrollTop =
        messagesScrollRef.current.scrollHeight
  }, [selectedId, messages.length])
  const totalUnseen = conversations.filter((item) => !item.is_seen).length
  const filteredConversations = useMemo(() => {
    const query = normalize(searchQuery.trim()).replace(/^#/, "")
    return conversations.filter((item) => {
      if (statusFilter === "unseen" && item.is_seen) return false
      if (statusFilter === "seen" && !item.is_seen) return false
      return (
        !query ||
        [
          item.id,
          chatCode(item),
          item.buyer.id,
          userCode(item.buyer),
          item.buyer.name,
          item.buyer.fullName,
          item.buyer.companyName,
          item.buyer.email,
          item.seller.id,
          userCode(item.seller),
          item.seller.name,
          item.seller.fullName,
          item.seller.companyName,
          item.seller.email,
          item.product?.title,
          ...item.messages.map((message) => message.content)
        ].some(
          (value) =>
            typeof value === "string" && normalize(value).includes(query)
        )
      )
    })
  }, [conversations, statusFilter, searchQuery])
  async function handleCopy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      setActionError("")
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      setActionError(
        "No pudimos copiar el dato. Puedes seleccionarlo y copiarlo directamente."
      )
    }
  }
  function selectConversation(item: PlatformConversation) {
    selectedIdRef.current = item.id
    setSelectedId(item.id)
    setDetailsOpen(false)
    setMobileOpen(true)
    setActionError("")
    if (!item.is_seen) void persistReview(item.id, true)
    requestAnimationFrame(() => {
      if (detailHeaderRef.current) detailHeaderRef.current.scrollTop = 0
      ;(productLinkRef.current || detailHeading.current)?.focus({
        preventScroll: true
      })
    })
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
  function toggleDetails() {
    setDetailsOpen((open) => !open)
    if (detailsOpen)
      requestAnimationFrame(() => {
        if (detailHeaderRef.current) detailHeaderRef.current.scrollTop = 0
      })
  }
  return (
    <section className={s.panel} aria-label="Conversaciones entre usuarios">
      <header className={s.heading}>
        <div>
          <h2>Conversaciones</h2>
          <p>
            {loading
              ? "Cargando conversaciones…"
              : fetchError && !conversations.length
                ? "No se pudo cargar la bandeja."
                : `${conversations.length} ${conversations.length === 1 ? "conversación" : "conversaciones"} · ${totalUnseen} sin revisar`}
          </p>
        </div>
      </header>
      {fetchError && (
        <div role="alert" className={s.notice}>
          {fetchError}
          <Button variant="outline" onClick={() => void fetchConversations()}>
            Reintentar
          </Button>
        </div>
      )}
      {actionError && (
        <p role="alert" className={s.notice}>
          {actionError}
        </p>
      )}
      <span className="sr-only" role="status">
        {copiedKey ? "Dato copiado" : ""}
      </span>
      <div className={s.workspace} data-mobile-open={mobileOpen}>
        <aside className={s.list} aria-label="Listado de conversaciones">
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
                onClick={() => void fetchConversations()}
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
              aria-label="Filtrar por revisión"
            >
              {(
                [
                  { value: "all", label: "Todos", count: conversations.length },
                  { value: "unseen", label: "Sin revisar", count: totalUnseen },
                  {
                    value: "seen",
                    label: "Revisados",
                    count: conversations.length - totalUnseen
                  }
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
          <div ref={listRef} className={s.rows}>
            {loading ? (
              <div className={s.empty} role="status">
                <Loader2 className={s.spinner} size={22} />
                Cargando conversaciones…
              </div>
            ) : !filteredConversations.length ? (
              <div className={s.empty}>
                <h3>
                  {searchQuery || statusFilter !== "all"
                    ? "No hay coincidencias"
                    : "Todavía no hay conversaciones"}
                </h3>
                <p>
                  {searchQuery || statusFilter !== "all"
                    ? "Cambia la búsqueda o el filtro para ver otros chats."
                    : "Los chats entre compradores y vendedores aparecerán aquí."}
                </p>
              </div>
            ) : (
              filteredConversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={s.row}
                  aria-pressed={selectedId === item.id}
                  onClick={() => selectConversation(item)}
                >
                  <img
                    src={item.product?.image || "/placeholder.svg"}
                    alt=""
                    loading="lazy"
                  />
                  <div className={s.rowBody}>
                    <div className={s.rowTop}>
                      <strong>{item.buyer.name}</strong>
                      <time dateTime={item.updated_at}>
                        {dateLabel(item.updated_at)}
                      </time>
                    </div>
                    <p className={s.rowSeller}>con {item.seller.name}</p>
                    <p className={s.rowProduct}>
                      {item.product?.title || "Publicación no disponible"}
                    </p>
                    <p className={s.snippet}>
                      {item.last_message?.content ||
                        (item.last_message?.attachment_url
                          ? "Archivo adjunto"
                          : "Sin mensajes")}
                    </p>
                    <div className={s.rowFoot}>
                      <span>
                        {item.messages_count}{" "}
                        {item.messages_count === 1 ? "mensaje" : "mensajes"}
                      </span>
                      {!item.is_seen && (
                        <span className={s.pending}>
                          <i aria-hidden="true" />
                          Sin revisar
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
        <div className={s.detail}>
          {!activeConv ? (
            <div className={s.empty}>
              <h3>Selecciona una conversación</h3>
              <p>
                Revisa los participantes, el producto y los mensajes
                intercambiados.
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
                    onClick={() => {
                      setMobileOpen(false)
                      requestAnimationFrame(() =>
                        listRef.current
                          ?.querySelector<HTMLElement>('[aria-pressed="true"]')
                          ?.focus()
                      )
                    }}
                  >
                    <ArrowLeft size={18} />
                  </Button>
                  {activeConv.product ? (
                    <Link
                      ref={productLinkRef}
                      className={s.productIdentity}
                      href={`/producto/${activeConv.product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir producto: ${activeConv.product.title}`}
                    >
                      <img
                        src={activeConv.product.image || "/placeholder.svg"}
                        alt=""
                      />
                      <div>
                        <h3 title={activeConv.product.title}>
                          {activeConv.product.title}
                        </h3>
                        <span>{productPrice(activeConv.product)}</span>
                      </div>
                    </Link>
                  ) : (
                    <h3
                      ref={detailHeading}
                      tabIndex={-1}
                      className={s.missingProduct}
                    >
                      Publicación no disponible
                    </h3>
                  )}
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
                        disabled={reviewBusy === activeConv.id}
                        onSelect={() =>
                          void persistReview(activeConv.id, !activeConv.is_seen)
                        }
                      >
                        {activeConv.is_seen ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}{" "}
                        {activeConv.is_seen
                          ? "Marcar sin revisar"
                          : "Marcar revisada"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={s.menuItem}
                        onSelect={() =>
                          void handleCopy(chatCode(activeConv), "conversation")
                        }
                      >
                        <Copy size={16} />
                        Copiar código de conversación
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={s.menuItem}
                        disabled={isRefreshing}
                        onSelect={() => void fetchConversations()}
                      >
                        <RefreshCw size={16} />
                        Actualizar conversaciones
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className={s.menuItem}>
                        <Link href="/admin/soporte">
                          <Headphones size={16} />
                          Ir a soporte
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <button
                  type="button"
                  className={s.participantsSummary}
                  aria-label={detailsOpen ? "Ocultar datos" : "Ver datos"}
                  aria-expanded={detailsOpen}
                  aria-controls="conversation-participants"
                  onClick={toggleDetails}
                >
                  <span className={s.participant}>
                    <span className={s.avatar} aria-hidden="true">
                      {initials(activeConv.buyer.name)}
                    </span>
                    <span>
                      <small>Comprador</small>
                      <strong>{activeConv.buyer.name}</strong>
                    </span>
                  </span>
                  <span className={s.participant}>
                    <span className={s.avatar} aria-hidden="true">
                      {initials(activeConv.seller.name)}
                    </span>
                    <span>
                      <small>Vendedor</small>
                      <strong>{activeConv.seller.name}</strong>
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
                    id="conversation-participants"
                    className={s.participantDetails}
                  >
                    {[
                      {
                        person: activeConv.buyer,
                        role: "Comprador",
                        key: "buyer"
                      },
                      {
                        person: activeConv.seller,
                        role: "Vendedor",
                        key: "seller"
                      }
                    ].map(({ person, role, key }) => (
                      <section
                        key={key}
                        aria-label={`Datos del ${role.toLowerCase()}`}
                      >
                        <h4>{role}</h4>
                        <dl>
                          <div>
                            <dt>Nombre</dt>
                            <dd>{person.fullName || person.name}</dd>
                          </div>
                          <div>
                            <dt>Empresa</dt>
                            <dd>{person.companyName || "No indicada"}</dd>
                          </div>
                          <div>
                            <dt>Correo</dt>
                            <dd>{person.email || "No indicado"}</dd>
                          </div>
                          <div>
                            <dt>Teléfono</dt>
                            <dd>{person.phone || "No indicado"}</dd>
                          </div>
                          <div>
                            <dt>Código</dt>
                            <dd className={s.code}>
                              {userCode(person)}
                              {copyButton(
                                userCode(person),
                                key,
                                `Copiar código del ${role.toLowerCase()}`
                              )}
                            </dd>
                          </div>
                        </dl>
                      </section>
                    ))}
                    <div className={s.conversationReference}>
                      <span>Código de conversación</span>
                      <span>{chatCode(activeConv)}</span>
                      {copyButton(
                        chatCode(activeConv),
                        "conversation",
                        "Copiar código de conversación"
                      )}
                    </div>
                    <div className={s.fullReference}>
                      <span>Identificador de la conversación</span>
                      <span>{activeConv.id}</span>
                      {copyButton(
                        activeConv.id,
                        "uuid",
                        "Copiar identificador completo"
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div
                ref={messagesScrollRef}
                className={s.thread}
                role="log"
                aria-live="off"
                aria-label="Mensajes de la conversación"
              >
                {!messages.length ? (
                  <div className={s.empty}>
                    <h4>Aún no hay mensajes</h4>
                    <p>Los mensajes de esta conversación aparecerán aquí.</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const fromBuyer = message.sender_id === activeConv.buyer_id,
                      fromSeller = message.sender_id === activeConv.seller_id
                    const sender = fromBuyer
                      ? activeConv.buyer.name
                      : fromSeller
                        ? activeConv.seller.name
                        : "Participante"
                    const day = dateLabel(message.created_at, "day"),
                      newDay =
                        index === 0 ||
                        day !== dateLabel(messages[index - 1].created_at, "day")
                    const showSender =
                      newDay ||
                      message.sender_id !== messages[index - 1]?.sender_id
                    const url = attachmentUrl(message.attachment_url)
                    return (
                      <Fragment key={message.id}>
                        {newDay && day && <div className={s.day}>{day}</div>}
                        <div
                          className={s.messageRow}
                          data-side={fromSeller ? "seller" : "buyer"}
                        >
                          {showSender && (
                            <span className={s.sender}>{sender}</span>
                          )}
                          <div className={s.bubble}>
                            {url &&
                              (message.attachment_type === "image" ? (
                                <button
                                  type="button"
                                  className={s.imageAttachment}
                                  aria-label="Ampliar imagen adjunta"
                                  onClick={() => setPreviewImage(url)}
                                >
                                  <img src={url} alt="Imagen adjunta" />
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
                                        url,
                                        "documento-chat"
                                      )
                                    }
                                  >
                                    <Download size={16} />
                                    Descargar
                                  </Button>
                                </div>
                              ))}
                            {message.attachment_url && !url && (
                              <p>Archivo no disponible</p>
                            )}
                            {message.content && (
                              <p className={s.messageText}>{message.content}</p>
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
              <footer className={s.footer}>
                <span className={s.footerState} role="status">
                  {reviewBusy === activeConv.id ? (
                    <Loader2 size={14} className={s.spinner} />
                  ) : activeConv.is_seen ? (
                    <Check size={14} />
                  ) : (
                    <EyeOff size={14} />
                  )}{" "}
                  {activeConv.is_seen ? "Revisada" : "Sin revisar"}
                  <span aria-hidden="true">·</span>Solo lectura
                </span>
                {updatedAt && (
                  <span>Actualizado a las {dateLabel(updatedAt, "time")}</span>
                )}
              </footer>
            </>
          )}
        </div>
      </div>
      {previewImage && (
        <MediaLightbox
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage}
          title="Imagen adjunta"
        />
      )}
    </section>
  )
}
