"use client"

import { useEffect, useRef, type RefObject } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUp, Check, CheckCheck, ChevronDown, Copy, Download, ExternalLink, FileText, Headphones, Inbox, Loader2, MessageSquare, MoreHorizontal, Package, Paperclip, Search, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { isSupportConversation, type ChatChannel } from "@/lib/chat-channels"
import type { Conversation, Message } from "@/types/chat"
import { MediaLightbox } from "./media-lightbox"
import styles from "./chat-workspace.module.css"

export type ChatAttachment = { url: string; type: "image" | "pdf" | "docx" | "file"; name: string; size?: string }
interface Props {
  channel: ChatChannel
  currentUserId: string
  conversations: Conversation[]
  filteredConversations: Conversation[]
  activeConversation?: Conversation
  messages: Message[]
  searchQuery: string
  filterStatus: "all" | "unread" | "read"
  loadingConversations: boolean
  loadingMessages: boolean
  conversationError: boolean
  messageError: boolean
  sending: boolean
  inputValue: string
  attachment: ChatAttachment | null
  previewImage: string | null
  scrollRef: RefObject<HTMLDivElement>
  fileInputRef: RefObject<HTMLInputElement>
  isUserOnline: (id?: string | null) => boolean
  onSelect: (id: string | null) => void
  onSearch: (value: string) => void
  onFilter: (value: "all" | "unread" | "read") => void
  onDraft: (value: string) => void
  onSend: () => void
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveAttachment: () => void
  onPreview: (url: string | null) => void
  onDownload: (url: string, name: string) => void
  onSupport: () => void
  onCopyLink: () => void
  onRetryConversations: () => void
  onRetryMessages: () => void
}

const quickReplies = [
  { label: "Solicitar cotización", text: "Me gustaría solicitar una cotización formal para este producto." },
  { label: "Pedir ficha técnica", text: "¿Me podrías compartir la ficha técnica y los certificados de calidad?" },
  { label: "Consultar entrega y mínimos", text: "¿Cuál es el volumen mínimo de compra y el tiempo estimado de entrega?" },
]
const companyName = (conversation: Conversation) => conversation.other_user?.companyName || conversation.other_user?.name || "Contacto de Agrilpa"
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()
const isSupport = isSupportConversation
const ticketStatus = (conversation: Conversation) => ({ open: "Abierto", in_progress: "En revisión", resolved: "Resuelto" }[conversation.support_status || "open"])
const time = (value: string) => new Date(value).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" })

function dateLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return "Hoy"
  if (date.toDateString() === yesterday.toDateString()) return "Ayer"
  return date.toLocaleDateString("es-SV", { day: "numeric", month: "long", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined })
}

function ContactAvatar({ conversation, small = false }: { conversation: Conversation; small?: boolean }) {
  return <Avatar className={`${styles.avatar} ${small ? styles.smallAvatar : ""}`}>
    <AvatarImage src={conversation.other_user?.avatar_url} alt={`Foto de ${companyName(conversation)}`} className={styles.avatarImage} />
    <AvatarFallback className={styles.avatarFallback}>{isSupport(conversation) ? <Headphones aria-hidden="true" size={19} /> : initials(companyName(conversation))}</AvatarFallback>
  </Avatar>
}

export function ChatWorkspace(props: Props) {
  const { activeConversation: active, conversations, filteredConversations, messages, currentUserId } = props
  const supportInbox = props.channel === "support"
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`
  }, [props.inputValue, active?.id])
  const unreadCount = conversations.filter(conversation => (conversation.unread_count || 0) > 0).length
  const product = active && !isSupport(active) ? active.product : undefined

  return <section className={styles.page} aria-label={supportInbox ? "Soporte de Agrilpa" : "Mensajes de Agrilpa"}>
    <header className={styles.pageHeader}>
      <div><h1>{supportInbox ? "Soporte" : "Mensajes"}</h1><p>{supportInbox ? "Consulta tus solicitudes y conversa con el equipo de Agrilpa." : "Conecta con tus contactos y continúa tus negocios."}</p></div>
      <button type="button" className={styles.supportButton} onClick={props.onSupport}><Headphones size={17} aria-hidden="true" /><span>{supportInbox ? "Solicitar ayuda" : "Contactar soporte"}</span></button>
    </header>

    <div className={styles.workspace}>
      <aside className={`${styles.inbox} ${active ? styles.inboxHidden : ""}`} aria-label={supportInbox ? "Bandeja de tickets de soporte" : "Bandeja de conversaciones"}>
        <div className={styles.inboxHeader}>
          <div className={styles.inboxTitle}><h2>{supportInbox ? "Tus tickets" : "Conversaciones"}</h2><span aria-label={`${conversations.length} ${supportInbox ? conversations.length === 1 ? "ticket" : "tickets" : conversations.length === 1 ? "conversación" : "conversaciones"}`}>{conversations.length}</span></div>
          <div className={styles.search}>
            <Search size={17} aria-hidden="true" /><input type="search" aria-label={supportInbox ? "Buscar tickets" : "Buscar conversaciones"} data-no-auto-caps="true" value={props.searchQuery} onChange={event => props.onSearch(event.target.value)} placeholder={supportInbox ? "Buscar en tus tickets" : "Buscar empresa o producto"} />
            {props.searchQuery && <button type="button" aria-label="Borrar búsqueda" onClick={() => props.onSearch("")}><X size={15} aria-hidden="true" /></button>}
          </div>
          <div className={styles.filters} aria-label="Filtrar conversaciones">
            {([{ value: "all", label: "Todas" }, { value: "unread", label: "No leídas" }, { value: "read", label: "Leídas" }] as const).map(filter => <button key={filter.value} type="button" aria-pressed={props.filterStatus === filter.value} onClick={() => props.onFilter(filter.value)}>{filter.label}{filter.value === "unread" && unreadCount > 0 && <span>{unreadCount}</span>}</button>)}
          </div>
        </div>
        {props.conversationError && <div role="alert" className={styles.error}>No pudimos actualizar las conversaciones. <button onClick={props.onRetryConversations}>Reintentar</button></div>}
        <div className={styles.conversationList}>
          {props.loadingConversations ? <div role="status" aria-label="Cargando conversaciones" className={styles.listSkeleton}>{[1, 2, 3, 4].map(key => <div key={key}><span /><div><span /><span /></div></div>)}</div> : filteredConversations.length === 0 ? <div className={styles.listEmpty}><Inbox size={28} aria-hidden="true" /><h3>{conversations.length ? "Sin coincidencias" : supportInbox ? "Aún no tienes tickets" : "Tu bandeja está lista"}</h3><p>{conversations.length ? "Prueba otra búsqueda o cambia el filtro." : supportInbox ? "Si necesitas ayuda con tu cuenta o tus operaciones, envíanos una solicitud." : "Aquí encontrarás las conversaciones con tus compradores y proveedores."}</p>{conversations.length > 0 ? <button onClick={() => { props.onSearch(""); props.onFilter("all") }}>Limpiar filtros</button> : supportInbox ? <button type="button" onClick={props.onSupport}><Headphones size={15} aria-hidden="true" />Solicitar ayuda</button> : <Link href="/productos">Explorar productos <ExternalLink size={14} aria-hidden="true" /></Link>}</div> : <ul>
            {filteredConversations.map(conversation => {
              const unread = (conversation.unread_count || 0) > 0
              const lastMessage = conversation.last_message
              const lastDate = lastMessage?.created_at || conversation.updated_at
              return <li key={conversation.id}>
                <button type="button" aria-pressed={conversation.id === active?.id} onClick={() => props.onSelect(conversation.id)} className={`${styles.conversation} ${unread ? styles.unread : ""}`}>
                  <ContactAvatar conversation={conversation} />
                  <span className={styles.conversationDetails}>
                    <span className={styles.conversationTop}><strong>{companyName(conversation)}</strong><time dateTime={lastDate}>{lastDate ? dateLabel(lastDate) === "Hoy" ? time(lastDate) : new Date(lastDate).toLocaleDateString("es-SV", { day: "numeric", month: "short" }) : ""}</time></span>
                    <span className={styles.conversationPreview}>{lastMessage?.sender_id === currentUserId && (lastMessage.read_at ? <CheckCheck size={14} data-status="read" aria-label="Leído" /> : <Check size={14} aria-label="Enviado" />)}{lastMessage?.attachment_type ? <><Paperclip size={13} aria-hidden="true" />{lastMessage.attachment_type === "image" ? "Imagen adjunta" : "Documento adjunto"}</> : <span>{lastMessage?.content || "Inicia la conversación"}</span>}{unread && <span className={styles.unreadBadge} aria-label={`${conversation.unread_count} mensajes no leídos`}>{conversation.unread_count}</span>}</span>
                    <span className={styles.conversationProduct}>{isSupport(conversation) ? <Headphones size={12} aria-hidden="true" /> : <Package size={12} aria-hidden="true" />}<span>{isSupport(conversation) ? `Ticket #${conversation.id.slice(0, 8).toUpperCase()} · ${ticketStatus(conversation)}` : conversation.product?.title || "Conversación comercial"}</span></span>
                  </span>
                </button>
              </li>
            })}
          </ul>}
        </div>
        <div className={styles.inboxFooter}><MessageSquare size={14} aria-hidden="true" /><span>{supportInbox ? "El seguimiento de tus solicitudes, aquí." : "Tu red de negocios, en un solo lugar."}</span></div>
      </aside>

      {active ? <section className={styles.chat} aria-label={`Conversación con ${companyName(active)}`}>
        <header className={styles.chatHeader}>
          <button type="button" className={`${styles.iconButton} ${styles.backButton}`} aria-label="Volver a conversaciones" onClick={() => props.onSelect(null)}><ArrowLeft size={20} aria-hidden="true" /></button>
          <ContactAvatar conversation={active} small />
          <div className={styles.contactIdentity}><h2>{companyName(active)}</h2><p><span className={props.isUserOnline(active.other_user?.id) ? styles.online : styles.offline} />{props.isUserOnline(active.other_user?.id) ? "En línea" : "No está en línea"}{isSupport(active) && <span className={styles.supportLabel} data-status={active.support_status || "open"}>{ticketStatus(active)}</span>}</p></div>
          <div className={styles.headerActions}>
            {!isSupport(active) && active.other_user?.id && <Link href={`/vendedor/${active.other_user.id}`} className={styles.profileLink}>Ver perfil <ExternalLink size={14} aria-hidden="true" /></Link>}
            <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className={styles.iconButton} aria-label="Opciones de conversación"><MoreHorizontal size={21} aria-hidden="true" /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={props.onCopyLink}><Copy size={16} aria-hidden="true" />Copiar enlace de conversación</DropdownMenuItem>{!isSupport(active) && active.other_user?.id && <DropdownMenuItem asChild><Link href={`/vendedor/${active.other_user.id}`}><ExternalLink size={16} aria-hidden="true" />Ver perfil empresarial</Link></DropdownMenuItem>}{product && <DropdownMenuItem asChild><Link href={`/producto/${product.id}`}><Package size={16} aria-hidden="true" />Ver producto</Link></DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem onClick={props.onSupport}><Headphones size={16} aria-hidden="true" />Contactar soporte</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          </div>
        </header>
        {product && <Link href={`/producto/${product.id}`} className={styles.productContext}>
          <div className={styles.productImage}>{product.image ? <img src={product.image} alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/placeholder.svg" }} /> : <Package size={20} aria-hidden="true" />}</div>
          <div className={styles.productIdentity}><span>Sobre este producto</span><strong>{product.title}</strong></div>
          <div className={styles.productPrice}>{product.price && !/cotiz/i.test(product.price) ? <><strong>{product.currency} {product.price}</strong>{product.quantity && <span> / {product.quantity}</span>}</> : <strong>Precio a cotizar</strong>}</div>
          <ExternalLink size={15} aria-hidden="true" />
        </Link>}

        {props.messageError && <div role="alert" className={styles.error}>No pudimos cargar los mensajes. <button onClick={props.onRetryMessages}>Reintentar</button></div>}
        <div ref={props.scrollRef} className={styles.messageScroll} aria-busy={props.loadingMessages}>
          {props.loadingMessages ? <div className={styles.chatEmpty} role="status"><Loader2 size={22} className={styles.spinner} aria-hidden="true" /><p>Cargando conversación…</p></div> : messages.length === 0 ? <div className={styles.chatEmpty}><MessageSquare size={28} aria-hidden="true" /><h3>{isSupport(active) ? "¿En qué podemos ayudarte?" : "Todo empieza con una conversación"}</h3><p>{isSupport(active) ? "Cuéntanos qué necesitas y el equipo de Agrilpa te responderá aquí." : "Consulta disponibilidad, condiciones de compra o documentación del producto."}</p></div> : <div className={styles.messages}>
            {messages.map((message, index) => {
              const mine = message.sender_id === currentUserId
              const previous = messages[index - 1]
              const newDay = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString()
              const grouped = !newDay && previous?.sender_id === message.sender_id && new Date(message.created_at).getTime() - new Date(previous.created_at).getTime() < 300000
              const pending = message.id.startsWith("temp-")
              return <div key={message.id}>
                {newDay && <div className={styles.dateDivider}><span>{dateLabel(message.created_at)}</span></div>}
                <div className={`${styles.messageRow} ${mine ? styles.mine : ""} ${grouped ? styles.grouped : ""}`}>
                  <div className={styles.messageBubble}>
                    {message.attachment_url && message.attachment_type === "image" && <div className={styles.imageAttachment}><button type="button" aria-label="Ampliar imagen adjunta" onClick={() => props.onPreview(message.attachment_url!)}><img src={message.attachment_url} alt="Imagen compartida en la conversación" loading="lazy" /></button><button type="button" className={styles.downloadImage} onClick={() => props.onDownload(message.attachment_url!, "imagen-chat.jpg")}><Download size={14} aria-hidden="true" />Descargar imagen</button></div>}
                    {message.attachment_url && message.attachment_type !== "image" && <button type="button" className={styles.documentAttachment} onClick={() => props.onDownload(message.attachment_url!, message.attachment_type === "pdf" ? "documento-adjunto.pdf" : message.attachment_type === "docx" ? "documento-adjunto.docx" : "archivo-adjunto")}><FileText size={24} aria-hidden="true" /><span><strong>Documento adjunto</strong><small>{message.attachment_type?.toUpperCase() || "ARCHIVO"} · Descargar</small></span><Download size={16} aria-hidden="true" /></button>}
                    {message.content && !(/^(📷 Foto adjunta|📎 Documento adjunto)$/.test(message.content) && message.attachment_url) && <p className={styles.messageText}><MessageText content={message.content} /></p>}
                    <div className={styles.messageMeta}><time dateTime={message.created_at}>{time(message.created_at)}</time>{mine && <span data-status={pending ? "pending" : message.read_at ? "read" : "sent"} aria-label={pending ? "Enviando" : message.read_at ? "Leído" : "Enviado"} title={pending ? "Enviando" : message.read_at ? "Leído" : "Enviado"}>{pending ? <Loader2 size={13} className={styles.spinner} aria-hidden="true" /> : message.read_at ? <CheckCheck size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}</span>}</div>
                  </div>
                </div>
              </div>
            })}
          </div>}
        </div>

        <footer className={styles.composer}>
          {!isSupport(active) && <div className={styles.composerToolbar}><DropdownMenu><DropdownMenuTrigger asChild><button type="button" className={styles.quickReplies}><MessageSquare size={14} aria-hidden="true" />Respuestas rápidas<ChevronDown size={13} aria-hidden="true" /></button></DropdownMenuTrigger><DropdownMenuContent align="start">{quickReplies.map(reply => <DropdownMenuItem key={reply.label} onClick={() => { props.onDraft(reply.text); requestAnimationFrame(() => textareaRef.current?.focus()) }}>{reply.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div>}
          {props.attachment && <div className={styles.attachmentPreview}>{props.attachment.type === "image" ? <img src={props.attachment.url} alt="Imagen lista para enviar" /> : <FileText size={22} aria-hidden="true" />}<div><strong>{props.attachment.name}</strong><span>{props.attachment.size || props.attachment.type} · Listo para enviar</span></div><button type="button" className={styles.iconButton} aria-label="Quitar archivo adjunto" onClick={props.onRemoveAttachment}><X size={17} aria-hidden="true" /></button></div>}
          <div className={styles.inputBox}>
            <input type="file" ref={props.fileInputRef} onChange={props.onFileSelect} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" aria-label="Seleccionar archivo adjunto" />
            <textarea ref={textareaRef} value={props.inputValue} aria-label="Escribir mensaje" data-no-auto-caps="true" onChange={event => props.onDraft(event.target.value)} placeholder={props.attachment ? "Añade un mensaje al archivo…" : "Escribe un mensaje…"} rows={1} disabled={props.sending || props.loadingMessages || props.messageError} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); props.onSend() } }} />
            <div className={styles.inputTools}><button type="button" className={styles.iconButton} aria-label="Adjuntar archivo" title="Adjuntar archivo (máximo 10 MB)" disabled={props.sending} onClick={() => props.fileInputRef.current?.click()}><Paperclip size={19} aria-hidden="true" /></button><button type="button" className={styles.sendButton} aria-label="Enviar mensaje" disabled={props.sending || props.loadingMessages || props.messageError || (!props.inputValue.trim() && !props.attachment)} onClick={props.onSend}>{props.sending ? <Loader2 size={19} className={styles.spinner} aria-hidden="true" /> : <ArrowUp size={21} aria-hidden="true" />}</button></div>
          </div>
          <div className={styles.composerHint}><span>Adjunta imágenes o documentos de hasta 10 MB.</span><span>Enter para enviar · Shift + Enter para una nueva línea</span></div>
        </footer>
      </section> : <div className={styles.noConversation}><div className={styles.emptyIllustration}><MessageSquare size={32} strokeWidth={1.4} aria-hidden="true" /></div><h2>{supportInbox ? "Estamos para ayudarte" : "Un espacio para tus negocios"}</h2><p>{supportInbox ? "Selecciona un ticket para ver su estado y continuar con el equipo de soporte." : "Selecciona una conversación para consultar los detalles y continuar donde lo dejaste."}</p></div>}
    </div>
    <MediaLightbox imageUrl={props.previewImage} onClose={() => props.onPreview(null)} title={active ? companyName(active) : "Imagen adjunta"} />
  </section>
}

function MessageText({ content }: { content: string }) {
  return <>{content.split(/(https?:\/\/[^\s]+)/gi).map((part, index) => /^https?:\/\//i.test(part) ? <a key={index} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : part)}</>
}
