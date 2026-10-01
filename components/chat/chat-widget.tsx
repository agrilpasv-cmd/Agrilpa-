"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MessageCircle, X, Send, Paperclip, Box, Loader, AlertCircle,
  FileText, Download, Check, CheckCheck, Eye, ExternalLink,
  Headphones, ShieldCheck, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ConversationProduct } from '@/types/chat'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'
import { playMessageNotificationSound } from '@/lib/sound'
import { downloadAttachment } from '@/lib/download'
import { MediaLightbox } from './media-lightbox'
import { useGlobalChat } from './chat-context'

interface ChatWidgetProps {
  sellerName: string;
  sellerOnline?: boolean;
  product: ConversationProduct;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  buyerId?: string | null;
  vendorId?: string;
  isSupport?: boolean;
}

interface WidgetMessage {
  id?: string;
  content: string;
  sender: 'me' | 'them';
  attachment_url?: string | null;
  attachment_type?: string | null;
  read_at?: string | null;
  created_at?: string;
}

// Fast in-memory cache to eliminate loading delay when reopening chat or switching tabs
const chatMemoryCache = new Map<string, { conversationId: string | null; messages: WidgetMessage[] }>()

export function ChatWidget({ sellerName, sellerOnline = false, product, isOpen, setIsOpen, buyerId, vendorId, isSupport }: ChatWidgetProps) {
  const router = useRouter()
  const { isUserOnline, openSupportChat, setActiveChat, refreshUnreadCount } = useGlobalChat()
  const isActualSupport = Boolean(isSupport || product?.id === 'support' || sellerName.includes('Soporte'))
  const isOnline = isActualSupport ? true : (vendorId ? isUserOnline(vendorId) : Boolean(sellerOnline))
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<WidgetMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const chatKey = `${buyerId || ''}_${vendorId || ''}_${isActualSupport ? 'support' : (product?.id || 'generic')}`
  const [isLoadingHistory, setIsLoadingHistory] = useState(() => {
    return Boolean(buyerId && vendorId && !chatMemoryCache.has(chatKey))
  })

  const convCode = conversationId ? `CHAT-${conversationId.replace(/-/g, '').slice(0, 8).toUpperCase()}` : null
  const userCode = buyerId ? `USR-${buyerId.replace(/-/g, '').slice(0, 8).toUpperCase()}` : null

  const handleCopyCode = (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }
  
  // Attachment state
  const [attachment, setAttachment] = useState<{
    url: string;
    type: 'image' | 'pdf' | 'docx' | 'file';
    name: string;
    size?: string;
  } | null>(null)
  
  // Image preview lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, attachment, isOpen])

  // Instant cache sync when chatKey changes (reopen or switch chat)
  useEffect(() => {
    if (chatMemoryCache.has(chatKey)) {
      const cached = chatMemoryCache.get(chatKey)!
      setConversationId(cached.conversationId)
      setMessages(cached.messages)
      setIsLoadingHistory(false)
    } else {
      setConversationId(null)
      setMessages([])
      setIsLoadingHistory(Boolean(buyerId && vendorId))
    }
  }, [chatKey, buyerId, vendorId])

  // 1. Resolve conversation ID & pre-fetch messages in background (instant 0ms on click)
  useEffect(() => {
    if (!buyerId || !vendorId) return

    let isMounted = true
    const checkConversation = async () => {
      try {
        const prodParam = (isActualSupport || !product?.id || product?.id === 'support') ? 'support' : product.id
        const res = await fetch(`/api/chat/resolve-conversation?buyerId=${buyerId}&sellerId=${vendorId}&productId=${prodParam}&t=${Date.now()}`)
        if (!res.ok) return
        const data = await res.json()

        if (isMounted) {
          const resolvedConvId = data.conversationId || null
          setConversationId(resolvedConvId)

          let formatted: WidgetMessage[] = []
          if (Array.isArray(data.messages)) {
            formatted = data.messages.map((m: any) => ({
              id: m.id,
              content: m.content,
              sender: m.sender_id === buyerId ? 'me' : 'them',
              attachment_url: m.attachment_url,
              attachment_type: m.attachment_type,
              read_at: m.read_at,
              created_at: m.created_at
            }))
            setMessages(formatted)
          }

          chatMemoryCache.set(chatKey, { conversationId: resolvedConvId, messages: formatted })
          setIsLoadingHistory(false)
        }
      } catch (err) {
        console.error("[ChatWidget] Error checking conversation:", err)
        if (isMounted) setIsLoadingHistory(false)
      }
    }

    checkConversation()

    // Poll to detect newly created conversation from the other user if conversationId is not yet resolved
    let checkInterval: any = null
    if (!conversationId && isOpen) {
      checkInterval = setInterval(checkConversation, 2500)
    }

    return () => {
      isMounted = false
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [buyerId, vendorId, product?.id, conversationId, isActualSupport, chatKey, isOpen])

  // 2. Fetch messages & Realtime subscription when conversationId is present
  useEffect(() => {
    if (!isOpen || !conversationId) return

    const supabase = createClient()
    let channel: any = null
    let isMounted = true

    const loadMessages = async () => {
      try {
        const { data: msgs, error } = await supabase
          .from('messages')
          .select('id, content, sender_id, attachment_url, attachment_type, read_at, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (isMounted && msgs && !error) {
          const formatted: WidgetMessage[] = msgs.map((m: any) => {
            const isMe = m.sender_id === buyerId

            return {
              id: m.id,
              content: m.content,
              sender: isMe ? 'me' : 'them',
              attachment_url: m.attachment_url,
              attachment_type: m.attachment_type,
              read_at: m.read_at,
              created_at: m.created_at
            }
          })
          setMessages(formatted)
          chatMemoryCache.set(chatKey, { conversationId, messages: formatted })
        }

        // Mark all as read in DB and trigger global unread count refresh
        if (isMounted && msgs && !error && buyerId && document.visibilityState === 'visible') {
          fetch('/api/chat/mark-as-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, userId: buyerId })
          })
            .then(() => refreshUnreadCount?.())
            .catch(console.error)
        }
      } catch (err) {
        console.error("[ChatWidget] Error loading messages:", err)
      }
    }

    loadMessages()

    // Setup Realtime subscription
    const channelName = `widget-realtime-${conversationId}-${Date.now()}`
    channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any
          if (!isMounted) return

          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev

            let updated: WidgetMessage[]
            // Replace optimistic message from 'me' if exists
            if (newMsg.sender_id === buyerId) {
              const tempIndex = prev.findIndex(m => m.id?.startsWith('temp-') && m.content === newMsg.content)
              if (tempIndex !== -1) {
                const copy = [...prev]
                copy[tempIndex] = {
                  id: newMsg.id,
                  content: newMsg.content,
                  sender: 'me',
                  attachment_url: newMsg.attachment_url,
                  attachment_type: newMsg.attachment_type,
                  read_at: newMsg.read_at,
                  created_at: newMsg.created_at
                }
                updated = copy
                chatMemoryCache.set(chatKey, { conversationId, messages: updated })
                return updated
              }
            }

            updated = [...prev, {
              id: newMsg.id,
              content: newMsg.content,
              sender: newMsg.sender_id === buyerId ? 'me' : 'them',
              attachment_url: newMsg.attachment_url,
              attachment_type: newMsg.attachment_type,
              read_at: newMsg.read_at,
              created_at: newMsg.created_at
            }]
            chatMemoryCache.set(chatKey, { conversationId, messages: updated })
            return updated
          })

          // Mark incoming as read and play sound
          if (newMsg.sender_id !== buyerId && buyerId) {
            playMessageNotificationSound()
            if (document.visibilityState === 'visible') fetch('/api/chat/mark-as-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId, userId: buyerId })
            }).catch(console.error)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as any
          if (!isMounted || !updatedMsg) return
          setMessages(prev => {
            const updated = prev.map(m => {
              if (m.id === updatedMsg.id) {
                return { ...m, read_at: updatedMsg.read_at }
              }
              return m
            })
            chatMemoryCache.set(chatKey, { conversationId, messages: updated })
            return updated
          })
        }
      )
      .subscribe()

    // 2.5-second sync loop as reliable real-time guarantee
    const syncInterval = setInterval(() => {
      if (!isMounted) return
      supabase
        .from('messages')
        .select('id, content, sender_id, attachment_url, attachment_type, read_at, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .then(({ data: msgs }) => {
          if (!isMounted || !msgs) return
          setMessages(prev => {
            const prevIds = new Set(prev.map(m => m.id))
            const hasNew = msgs.some(m => !prevIds.has(m.id))
            const hasStatusChange = msgs.some(m => {
              const existing = prev.find(p => p.id === m.id)
              return existing && existing.read_at !== m.read_at
            })
            if (hasNew || hasStatusChange) {
              const updated: WidgetMessage[] = msgs.map(m => {
                const isMe = m.sender_id === buyerId

                return {
                  id: m.id,
                  content: m.content,
                  sender: isMe ? 'me' : 'them',
                  attachment_url: m.attachment_url,
                  attachment_type: m.attachment_type,
                  read_at: m.read_at,
                  created_at: m.created_at
                }
              })
              chatMemoryCache.set(chatKey, { conversationId, messages: updated })
              return updated
            }
            return prev
          })
        })
    }, 2500)

    const handleVisibility = () => {
      if (isMounted && document.visibilityState === 'visible') void loadMessages()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isMounted = false
      clearInterval(syncInterval)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [isOpen, conversationId, buyerId])


  // File selection handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo no debe exceder los 10 MB.")
      return
    }

    try {
      if (file.type.startsWith('image/')) {
        const compressedBase64 = await compressImage(file, { maxWidth: 1200, quality: 0.85 })
        setAttachment({
          url: compressedBase64,
          type: 'image',
          name: file.name,
          size: `${(file.size / 1024).toFixed(0)} KB`
        })
      } else {
        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          let fileType: 'pdf' | 'docx' | 'file' = 'file'
          if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            fileType = 'pdf'
          } else if (file.name.match(/\.(doc|docx)$/i)) {
            fileType = 'docx'
          }
          setAttachment({
            url: dataUrl,
            type: fileType,
            name: file.name,
            size: `${(file.size / 1024).toFixed(0)} KB`
          })
        }
        reader.readAsDataURL(file)
      }
    } catch (err) {
      console.error("Error loading attachment:", err)
      alert("Error al cargar el archivo. Intenta de nuevo.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSend = async () => {
    if ((!inputValue.trim() && !attachment) || isSending) return
    
    if (!buyerId) {
      setIsAuthDialogOpen(true)
      return
    }

    if (!vendorId) {
      alert("Error: No se pudo identificar al vendedor.")
      return
    }

    const content = inputValue.trim()
    const currentAttachment = attachment
    setIsSending(true)
    
    // Add locally immediately with temporary optimistic state
    const tempId = `temp-${Date.now()}`
    const optimisticMsg: WidgetMessage = {
      id: tempId,
      content: content || (currentAttachment?.type === 'image' ? "📷 Foto adjunta" : "📎 Documento adjunto"),
      sender: 'me',
      attachment_url: currentAttachment?.url || null,
      attachment_type: currentAttachment?.type || null,
      read_at: null,
      created_at: new Date().toISOString()
    }

    setMessages(prev => {
      const updated = [...prev, optimisticMsg]
      chatMemoryCache.set(chatKey, { conversationId, messages: updated })
      return updated
    })
    setInputValue("")
    setAttachment(null)

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          productId: isActualSupport ? null : product.id,
          buyerId,
          sellerId: vendorId,
          senderId: buyerId,
          content,
          attachmentUrl: currentAttachment?.url,
          attachmentType: currentAttachment?.type
        })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      const activeConvId = data.conversationId || conversationId
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      if (data.message) {
        setMessages(prev => {
          const updated = prev.map(m => m.id === tempId ? {
            ...m,
            id: data.message.id,
            read_at: data.message.read_at,
            created_at: data.message.created_at
          } : m)
          chatMemoryCache.set(chatKey, { conversationId: activeConvId, messages: updated })
          return updated
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Error al enviar el mensaje. Intenta de nuevo.")
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInputValue(content)
      setAttachment(currentAttachment)
    } finally {
      setIsSending(false)
    }
  }

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ""
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        
        {/* Floating Widget Content */}
        {isOpen && (
          <div className="w-[340px] sm:w-[360px] h-[600px] sm:h-[620px] max-h-[86vh] bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden mb-3 animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col">
            
            {/* Header */}
            <div className="bg-primary p-3.5 sm:p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {isActualSupport && (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-none truncate">
                      {isActualSupport ? "Soporte Oficial Agrilpa" : `Negociar con ${sellerName}`}
                    </h3>
                    {isActualSupport && (
                      <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-medium shrink-0">
                        Oficial
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${isOnline || isActualSupport ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/40'}`}></span>
                    <span className="text-xs text-white/90 font-medium">
                      {isActualSupport ? "En línea • Asistencia rápida" : (isOnline ? 'En línea' : 'Desconectado')}
                    </span>
                    {convCode && (
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(convCode, 'header-conv', e)}
                        title="ID único de este chat (clic para copiar)"
                        className="ml-0.5 inline-flex items-center gap-1 text-[10px] font-mono bg-white/20 hover:bg-white/30 text-white px-1.5 py-0.5 rounded transition-all active:scale-95"
                      >
                        #{convCode}
                        {copiedKey === 'header-conv' ? (
                          <Check className="w-2.5 h-2.5 text-emerald-300" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-80" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!isActualSupport && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-7 px-2 text-xs rounded-lg gap-1"
                    onClick={() => openSupportChat()}
                    title="Pedir ayuda a Soporte Agrilpa"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Ayuda</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                  onClick={() => {
                    setIsOpen(false)
                    if (isActualSupport) {
                      setActiveChat(null)
                    }
                  }}
                  title="Cerrar chat"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Context Banner (Only shown for product negotiations, not for support to avoid repeating) */}
            {!isActualSupport && product.id && product.id !== 'generic' ? (
              <Link 
                href={`/producto/${product.id}`}
                target="_blank"
                className="group bg-gray-50 hover:bg-emerald-50/50 p-3 border-b border-border/50 flex items-center gap-3 shrink-0 transition-colors cursor-pointer"
                title="Ver página de este producto"
              >
                 <div className="w-10 h-10 rounded bg-white overflow-hidden border border-border/50 shrink-0 group-hover:scale-105 transition-transform">
                   {product.image ? (
                     <img src={product.image} alt={product.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                   ) : (
                     <Box className="w-5 h-5 m-2.5 text-muted-foreground" />
                   )}
                 </div>
                 <div className="min-w-0 flex-1">
                   <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate flex items-center gap-1">
                     {product.title}
                     <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 opacity-70" />
                   </h4>
                   <p className="text-xs text-primary font-medium">{product.price ? `${product.price} ${product.currency || '$'}` : 'Cotización abierta'} {product.quantity && <span className="text-muted-foreground font-normal">/{product.quantity}</span>}</p>
                 </div>
              </Link>
            ) : !isActualSupport && product.title && product.id !== 'generic' ? (
              <div className="bg-gray-50 p-3 border-b border-border/50 flex items-center gap-3 shrink-0">
                 <div className="w-10 h-10 rounded bg-white overflow-hidden border border-border/50 shrink-0">
                   {product.image ? (
                     <img src={product.image} alt={product.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                   ) : (
                     <Box className="w-5 h-5 m-2.5 text-muted-foreground" />
                   )}
                 </div>
                 <div className="min-w-0 flex-1">
                   <h4 className="text-xs font-bold text-foreground truncate">{product.title}</h4>
                   <p className="text-xs text-primary font-medium">{product.price ? `${product.price} ${product.currency || '$'}` : 'Cotización abierta'} {product.quantity && <span className="text-muted-foreground font-normal">/{product.quantity}</span>}</p>
                 </div>
              </div>
            ) : null}

            {/* Messages Area */}
            <div className="h-64 sm:h-72 p-4 overflow-y-auto flex flex-col gap-3 bg-[#FDFCF8] flex-1" ref={scrollRef}>
               <div className="flex justify-center">
                 <span className="bg-gray-100 text-muted-foreground text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wider">Hoy</span>
               </div>
               
               {isLoadingHistory ? (
                 <div className="flex-1 flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                   <Loader className="w-5 h-5 animate-spin text-primary" />
                   <span className="text-[11px] font-medium">Cargando conversación...</span>
                 </div>
               ) : (
                 <>
                   {/* Intro Message - Only shown when there are genuinely no messages */}
                   {messages.length === 0 && (
                     <div className="flex flex-col gap-1 max-w-[85%]">
                       <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-3 text-xs text-foreground shadow-xs">
                         <p>
                           {isActualSupport ? (
                             "¡Hola! Bienvenido al canal de soporte oficial de Agrilpa. ¿En qué te podemos asesorar o ayudar hoy?"
                           ) : (
                             <>¡Hola! Soy el vendedor de <strong>{product.title}</strong>. ¿En qué te puedo ayudar?</>
                           )}
                         </p>
                       </div>
                     </div>
                   )}

                   {/* Rendered Messages */}
                   {messages.map((msg, idx) => (
                      <div key={msg.id || idx} className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === 'me' ? 'self-end items-end' : 'self-start items-start'}`}>
                          <div className={`rounded-2xl p-3 text-xs shadow-xs ${msg.sender === 'me' ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-100 text-foreground rounded-tl-sm border border-border/40'}`}>
                          
                          {/* Image Attachment Preview */}
                          {msg.attachment_url && msg.attachment_type === 'image' && (
                            <div className="mb-2 relative group rounded-xl overflow-hidden border border-white/20 bg-black/10">
                              <div 
                                className="cursor-pointer max-h-48 overflow-hidden"
                                onClick={() => setPreviewImage(msg.attachment_url || null)}
                                title="Hacer clic para ampliar y dar zoom"
                              >
                                <img src={msg.attachment_url} alt="Adjunto" loading="lazy" decoding="async" className="w-full h-auto object-cover rounded-xl transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-medium shadow-md">
                                    <Eye className="w-3.5 h-3.5" /> Ampliar
                                  </span>
                                </div>
                              </div>
                              {/* Quick download button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  downloadAttachment(msg.attachment_url!, 'imagen-chat.jpg')
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md active:scale-95"
                                title="Descargar imagen"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Document Attachment Preview */}
                          {msg.attachment_url && msg.attachment_type !== 'image' && (
                            <div 
                              onClick={() => downloadAttachment(msg.attachment_url!, `documento-${msg.attachment_type || 'adjunto'}`)}
                              className={`cursor-pointer flex items-center gap-2.5 p-2.5 rounded-xl mb-2 transition-all hover:opacity-95 active:scale-[0.98] ${
                                msg.sender === 'me'
                                  ? 'bg-white/15 hover:bg-white/25 text-white'
                                  : 'bg-white hover:bg-gray-50 text-foreground border border-border/60'
                              }`}
                              title="Hacer clic para descargar documento"
                            >
                              <div className={`p-2 rounded-lg ${msg.sender === 'me' ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-xs truncate">Documento adjunto</p>
                                <p className="text-[10px] opacity-80 uppercase">{msg.attachment_type || 'archivo'}</p>
                              </div>
                              <button
                                type="button"
                                className={`p-1.5 rounded-full transition-colors ${msg.sender === 'me' ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                                title="Descargar archivo"
                              >
                                <Download className="w-4 h-4 shrink-0 opacity-80" />
                              </button>
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.content && (
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          )}

                          {/* Message Footer: Time + Read Receipts Status */}
                          <div className={`flex items-center gap-1.5 mt-1.5 text-[9px] ${msg.sender === 'me' ? 'justify-end text-white/80' : 'justify-start text-muted-foreground'}`}>
                            <span>{formatMessageTime(msg.created_at)}</span>
                            {msg.sender === 'me' && (() => {
                              const isSeen = Boolean(msg.read_at)
                              return (
                                <span title={isSeen ? "Visto" : "Enviado"} aria-label={isSeen ? "Leído" : "Enviado"}>
                                  {isSeen ? (
                                    <CheckCheck className="h-4 w-4 text-sky-300" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-white/90" />
                                  )}
                                </span>
                              )
                            })()}
                          </div>
                      </div>
                  </div>
               ))}
                 </>
               )}
            </div>

            {/* Attachment Preview Chip */}
            {attachment && (
              <div className="px-4 py-2 bg-gray-50 border-t border-border/40 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  {attachment.type === 'image' ? (
                    <img src={attachment.url} alt="Preview" className="w-8 h-8 rounded object-cover border border-border/60 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate max-w-[180px]">{attachment.name}</p>
                    <p className="text-[10px] text-muted-foreground">{attachment.size || attachment.type}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full text-muted-foreground hover:text-red-500"
                  onClick={() => setAttachment(null)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}


            {/* Input Area */}
            <div className="p-3 bg-white border-t border-border/50 shrink-0">
              
              {/* Hidden file input for documents and photos */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                className="hidden"
              />

              <div className="flex items-end gap-2 bg-gray-50 border border-border/70 rounded-xl p-1.5 focus-within:border-gray-300 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-200 transition-all">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-gray-200/60"
                  title="Adjuntar foto o documento"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={attachment ? "Añade un comentario (opcional)..." : "Escribe tu consulta..."}
                  className="w-full max-h-24 min-h-[32px] bg-transparent border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none resize-none py-1.5 text-xs text-foreground"
                  rows={1}
                  disabled={isSending}
                />
                <Button 
                  type="button"
                  size="icon" 
                  className="shrink-0 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-white transition-transform active:scale-95"
                  onClick={() => handleSend()}
                  disabled={isSending}
                >
                  {isSending ? <Loader className="w-3 h-3 animate-spin ml-0.5" /> : <Send className="w-3 h-3 ml-0.5" />}
                </Button>
              </div>
            </div>

          </div>
        )}

        {/* Floating Trigger Button */}
        <Button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 flex items-center justify-center relative transition-transform hover:scale-105"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </div>

      {/* Auth Prompt Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="flex flex-col items-center gap-2">
            <div className="bg-primary/10 p-3 rounded-full mb-2">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold">Inicia sesión requerida</DialogTitle>
            <DialogDescription className="text-center text-base pt-2 text-muted-foreground">
              Para poder enviar tu mensaje y contactar al vendedor de este producto, primero debes iniciar sesión o registrarte en Agrilpa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4 mt-2">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold"
              onClick={() => {
                setIsAuthDialogOpen(false)
                setIsOpen(false)
                const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
                router.push(`/auth?redirectTo=${encodeURIComponent(currentPath)}`)
              }}
            >
              Iniciar sesión
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-base font-semibold"
              onClick={() => {
                setIsAuthDialogOpen(false)
                setIsOpen(false)
                const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
                router.push(`/auth?mode=register&redirectTo=${encodeURIComponent(currentPath)}`)
              }}
            >
              Registrarse
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interactive Zoomable & Downloadable Lightbox */}
      <MediaLightbox
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
        title={`Imagen - ${sellerName}`}
      />
    </>
  )
}
