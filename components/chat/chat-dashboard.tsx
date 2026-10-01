"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Search, Paperclip, Send, Check, CheckCheck, FileText, Download,
  Box, Eye, X, MessageSquare, Loader, ExternalLink, Inbox, Circle, MoreVertical,
  Copy, Info, Bell, Headphones, ArrowLeft
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Conversation, Message } from '@/types/chat'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'
import { playMessageNotificationSound } from '@/lib/sound'
import { downloadAttachment } from '@/lib/download'
import { MediaLightbox } from './media-lightbox'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useGlobalChat } from '@/components/chat/chat-context'
import { Toaster as SileoToaster, sileo } from 'sileo'
import 'sileo/styles.css'

interface ChatDashboardProps {
  currentUserId: string;
}

export function ChatDashboard({ currentUserId }: ChatDashboardProps) {
  const requestedConversation = useSearchParams().get('conversation')
  const requestedConversationRef = useRef(requestedConversation)
  requestedConversationRef.current = requestedConversation
  const selectedRequestRef = useRef<string | null>(null)
  const { isUserOnline } = useGlobalChat()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all")

  const [isLoadingConvos, setIsLoadingConvos] = useState(true)
  const [isSending, setIsSending] = useState(false)
  
  // Attachments
  const [attachment, setAttachment] = useState<{
    url: string;
    type: 'image' | 'pdf' | 'docx' | 'file';
    name: string;
    size?: string;
  } | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeConversationIdRef = useRef<string | null>(activeConversationId)
  const conversationsRef = useRef<Conversation[]>(conversations)
  const hasInitiallySelectedRef = useRef(false)

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  useEffect(() => {
    if (!requestedConversation) { selectedRequestRef.current = null; return }
    const target = conversations.find(c => c.id === requestedConversation && (c.buyer_id === currentUserId || c.seller_id === currentUserId))
    if (target && selectedRequestRef.current !== requestedConversation) {
      selectedRequestRef.current = requestedConversation
      hasInitiallySelectedRef.current = true
      setActiveConversationId(target.id)
    }
  }, [requestedConversation, conversations, currentUserId])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/chat/conversations?userId=${currentUserId}&_t=${Date.now()}`, {
        cache: 'no-store'
      })
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
        
        // Solo autoseleccionar en la carga inicial de pantalla grande (escritorio >= 768px).
        // En teléfonos móviles o en las actualizaciones en segundo plano (cada 8s), NUNCA
        // forzar la apertura de un chat si el usuario está en la bandeja de entrada.
        if (!hasInitiallySelectedRef.current) {
          hasInitiallySelectedRef.current = true
          const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
          if (isDesktop && !requestedConversationRef.current && !activeConversationIdRef.current && data.conversations.length > 0) {
            setActiveConversationId(data.conversations[0].id)
          }
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err)
    } finally {
      setIsLoadingConvos(false)
    }
  }

  // Global listener for all incoming messages for this user (never tears down on chat switch)
  useEffect(() => {
    if (!currentUserId) return
    let isMounted = true
    fetchConversations()

    const supabase = createClient()
    const channelName = `dash-global-${currentUserId}-${Date.now()}`
    const globalChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (!isMounted) return
          const incomingMsg = payload.new as Message
          if (!incomingMsg || incomingMsg.sender_id === currentUserId) return

          // Check if the message belongs to a conversation of this user
          const targetConv = conversationsRef.current.find(c => c.id === incomingMsg.conversation_id)

          if (!targetConv) {
            // If not found in current conversations, check if it's a new conversation specifically for this user
            fetch(`/api/chat/conversations?userId=${currentUserId}&_t=${Date.now()}`, { cache: 'no-store' })
              .then(res => res.json())
              .then(data => {
                if (!isMounted) return
                const convList: Conversation[] = data.conversations || []
                const found = convList.find(c => c.id === incomingMsg.conversation_id)
                if (found && (found.buyer_id === currentUserId || found.seller_id === currentUserId)) {
                  setConversations(convList)
                  playMessageNotificationSound()
                  const sender = found.other_user?.companyName || found.other_user?.name || "Usuario de Agrilpa"
                  sileo.action({
                    title: `Mensaje de ${sender}`,
                    description: incomingMsg.content || "Has recibido un archivo adjunto",
                    position: "top-right",
                    button: {
                      title: "Ver chat",
                      onClick: () => setActiveConversationId(incomingMsg.conversation_id)
                    }
                  })
                }
              })
              .catch(console.error)
            return
          }

          // Strict ownership check
          if (targetConv.buyer_id !== currentUserId && targetConv.seller_id !== currentUserId) {
            return
          }

          // If incoming message is for the currently open conversation:
          if (incomingMsg.conversation_id === activeConversationIdRef.current) {
            setMessages(prev => {
              if (prev.some(m => m.id === incomingMsg.id)) return prev
              return [...prev, incomingMsg]
            })
            playMessageNotificationSound()
            fetch('/api/chat/mark-as-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId: incomingMsg.conversation_id, userId: currentUserId })
            }).catch(console.error)
          } else {
            // Incoming message is for another conversation belonging to this user:
            playMessageNotificationSound()
            const sender = targetConv.other_user?.companyName || targetConv.other_user?.name || "Usuario de Agrilpa"
            sileo.action({
              title: `Mensaje de ${sender}`,
              description: incomingMsg.content || "Has recibido un archivo adjunto",
              position: "top-right",
              button: {
                title: "Ver chat",
                onClick: () => setActiveConversationId(incomingMsg.conversation_id)
              }
            })
          }

          // Update last_message in conversations list
          setConversations(prev => prev.map(c => 
            c.id === incomingMsg.conversation_id 
              ? { 
                  ...c, 
                  last_message: incomingMsg, 
                  unread_count: incomingMsg.conversation_id === activeConversationIdRef.current ? 0 : (c.unread_count || 0) + 1 
                } 
              : c
          ))
        }
      )
      .subscribe()

    // Light background sync every 8 seconds for conversations list
    const convoSyncTimer = setInterval(() => {
      if (isMounted) fetchConversations()
    }, 8000)

    return () => {
      isMounted = false
      clearInterval(convoSyncTimer)
      supabase.removeChannel(globalChannel)
    }
  }, [currentUserId])

  // 2. Fetch messages & mark as read when active conversation changes, with 2.5s real-time sync guarantee
  useEffect(() => {
    if (!activeConversationId) return

    let isMounted = true
    const supabase = createClient()
    let channel: any = null

    const loadMessages = async () => {
      try {
        const { data: msgs, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', activeConversationId)
          .order('created_at', { ascending: true })

        if (isMounted && msgs && !error) {
          setMessages(msgs as Message[])
        }

        // Mark as read in DB
        if (currentUserId) {
          await fetch('/api/chat/mark-as-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId: activeConversationId, userId: currentUserId })
          }).catch(console.error)
        }

        // Update unread count locally
        if (isMounted) {
          setConversations(prev => prev.map(c => 
            c.id === activeConversationId ? { ...c, unread_count: 0 } : c
          ))
        }
      } catch (err) {
        console.error("Error loading messages:", err)
      }
    }

    loadMessages()

    // Setup Realtime subscription with unique channel name
    const channelName = `dash-msgs-${activeConversationId}-${Date.now()}`
    channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          if (!isMounted) return
          const newMsg = payload.new as Message
          if (!newMsg) return

          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          // If incoming from the other user, mark as read immediately and play sound
          if (newMsg.sender_id !== currentUserId) {
            playMessageNotificationSound()
            const currentConv = conversationsRef.current.find(c => c.id === activeConversationId)
            sileo.show({
              title: currentConv?.other_user?.companyName || currentConv?.other_user?.name || "Nuevo mensaje",
              description: newMsg.content || (newMsg.attachment_type === 'image' ? "📷 Foto adjunta" : "📎 Documento adjunto"),
              type: "info",
              position: "top-right"
            })

            if (currentUserId) {
              fetch('/api/chat/mark-as-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: activeConversationId, userId: currentUserId })
              }).catch(console.error)
            }
          }

          // Update conversation last message in list
          setConversations(prev => prev.map(c => 
            c.id === activeConversationId ? { ...c, last_message: newMsg, unread_count: 0 } : c
          ))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          if (!isMounted) return
          const updatedMsg = payload.new as Message
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m))
        }
      )
      .subscribe()

    // 2.5-second sync loop as reliable real-time guarantee
    const syncInterval = setInterval(() => {
      if (!isMounted) return
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true })
        .then(({ data: msgs, error }) => {
          if (!isMounted || !msgs || error) return
          setMessages(prev => {
            const prevIds = new Set(prev.map(m => m.id))
            const hasNew = msgs.some(m => !prevIds.has(m.id))
            const hasStatusChange = msgs.some(m => {
              const existing = prev.find(p => p.id === m.id)
              return existing && existing.read_at !== m.read_at
            })
            if (hasNew || hasStatusChange) {
              const newFromOther = msgs.filter(m => !prevIds.has(m.id) && m.sender_id !== currentUserId)
              if (newFromOther.length > 0) {
                playMessageNotificationSound()
                if (currentUserId) {
                  fetch('/api/chat/mark-as-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversationId: activeConversationId, userId: currentUserId })
                  }).catch(console.error)
                }
              }
              return msgs as Message[]
            }
            return prev
          })
        })
    }, 2500)

    // Window focus listener: immediately refresh if tab becomes active
    const handleWindowFocus = () => {
      if (isMounted) {
        loadMessages()
        fetchConversations()
      }
    }
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      isMounted = false
      clearInterval(syncInterval)
      window.removeEventListener('focus', handleWindowFocus)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [activeConversationId, currentUserId])

  // Scroll to bottom when messages or attachment change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, attachment])

  // File select handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      sileo.warning({
        title: "Archivo muy pesado",
        description: "El archivo no debe superar los 10 MB.",
        position: "top-right"
      })
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
        sileo.success({
          title: "Imagen lista",
          description: `${file.name} comprimida y adjuntada`,
          position: "top-right"
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
          sileo.success({
            title: "Documento adjuntado",
            description: `${file.name} listo para enviar`,
            position: "top-right"
          })
        }
        reader.readAsDataURL(file)
      }
    } catch (err) {
      console.error("Error loading attachment:", err)
      sileo.error({
        title: "Error al cargar",
        description: "No se pudo procesar el archivo.",
        position: "top-right"
      })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Send message
  const handleSend = async (presetText?: string) => {
    const textToSend = presetText || inputValue
    if ((!textToSend.trim() && !attachment) || !activeConversationId || isSending) return

    const content = textToSend.trim()
    const currentAttachment = attachment
    setIsSending(true)

    const tempId = `temp-${Date.now()}`
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: activeConversationId,
      sender_id: currentUserId,
      content: content || (currentAttachment?.type === 'image' ? "📷 Foto adjunta" : "📎 Documento adjunto"),
      attachment_url: currentAttachment?.url || undefined,
      attachment_type: (currentAttachment?.type as any) || undefined,
      read_at: undefined,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMsg])
    if (!presetText) setInputValue("")
    setAttachment(null)

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content,
          senderId: currentUserId,
          attachmentUrl: currentAttachment?.url,
          attachmentType: currentAttachment?.type
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      if (data.message) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m))
        setConversations(prev => prev.map(c => 
          c.id === activeConversationId ? { ...c, last_message: data.message } : c
        ))
      }
    } catch (err) {
      console.error("Error sending message:", err)
      sileo.error({
        title: "Error al enviar",
        description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
        position: "top-right"
      })
      setMessages(prev => prev.filter(m => m.id !== tempId))
      if (!presetText) setInputValue(content)
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

  // Derived filtered conversations
  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase()
    const otherName = (c.other_user?.companyName || c.other_user?.name || "").toLowerCase()
    const prodTitle = (c.product?.title || "").toLowerCase()
    const matchesSearch = otherName.includes(q) || prodTitle.includes(q)
    
    let matchesStatus = true
    if (filterStatus === "unread") {
      matchesStatus = (c.unread_count || 0) > 0
    } else if (filterStatus === "read") {
      matchesStatus = (c.unread_count || 0) === 0
    }

    return matchesSearch && matchesStatus
  })

  const handleOpenSupport = async () => {
    let adminId = '57b0c950-5397-42c9-b560-1459b21f8d8f'
    try {
      const res = await fetch('/api/chat/support/info')
      if (res.ok) {
        const d = await res.json()
        if (d.adminId) adminId = d.adminId
      }
    } catch (e) {}

    const existingSupport = conversations.find(
      (c) => !c.product_id || (c as any).is_support || c.other_user?.id === adminId
    )

    if (existingSupport) {
      setActiveConversationId(existingSupport.id)
    } else {
      try {
        const res = await fetch('/api/chat/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: null,
            buyerId: currentUserId,
            sellerId: adminId,
            senderId: currentUserId,
            content: 'Hola, solicito asistencia y soporte técnico.',
          }),
        })
        const d = await res.json()
        if (d.conversationId) {
          await fetchConversations()
          setActiveConversationId(d.conversationId)
        }
      } catch (err) {
        console.error('Error starting support conversation:', err)
      }
    }
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-6 py-6 w-full">
      <SileoToaster position="top-right" theme="light" />
      {/* HEADER SECTION (Like Cotizaciones) */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Centro de Mensajes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus contactos, dudas de compradores y negociaciones directas.
          </p>
        </div>
        <Button
          onClick={handleOpenSupport}
          className="rounded-xl gap-2 bg-white hover:bg-emerald-50 text-foreground border border-border shadow-xs hover:text-primary font-semibold text-xs h-10 px-4"
        >
          <Headphones className="w-4 h-4 text-primary" />
          <span>Contactar a Soporte</span>
        </Button>
      </div>

      {/* SEARCH AND FILTERS */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, comprador o producto..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className={filterStatus === "all" ? "bg-primary text-white" : ""}
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === "unread" ? "default" : "outline"}
                onClick={() => setFilterStatus("unread")}
                className={filterStatus === "unread" ? "bg-primary text-white" : ""}
              >
                No Leídos
              </Button>
              <Button
                variant={filterStatus === "read" ? "default" : "outline"}
                onClick={() => setFilterStatus("read")}
                className={filterStatus === "read" ? "bg-primary text-white" : ""}
              >
                Leídos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CHAT INTERFACE - FULL WIDTH CARD */}
      <Card className="border-border/60 shadow-md overflow-hidden bg-white">
        <div className="flex h-[calc(100vh-320px)] min-h-[600px]">
          
          {/* LEFT SIDEBAR - CONVERSATIONS LIST */}
          <div className={`w-full md:w-80 lg:w-[400px] border-r border-border/50 flex-col bg-gray-50/40 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border/50 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Historial de Chats</h2>
              <Badge variant="outline" className="bg-white">{filteredConversations.length}</Badge>
            </div>

            <ScrollArea className="flex-1">
              {isLoadingConvos ? (
                <div className="p-12 text-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Cargando tus mensajes...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Inbox className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Sin resultados</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || filterStatus !== 'all' 
                      ? "No hay conversaciones que coincidan con los filtros." 
                      : "Aún no tienes conversaciones. Los mensajes aparecerán aquí."}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = activeConversationId === conv.id;
                  const isUnread = (conv.unread_count || 0) > 0;

                  return (
                    <div 
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`p-4 border-b border-border/40 cursor-pointer transition-all hover:bg-slate-50 ${isActive ? 'bg-slate-50 border-l-[6px] border-l-primary' : 'border-l-[6px] border-l-transparent bg-white'}`}
                    >
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          <Avatar className="w-12 h-12 border border-border shadow-xs">
                            <AvatarImage src={conv.other_user?.avatar_url} />
                            <AvatarFallback className="bg-primary text-white font-bold text-sm">
                              {(conv.other_user?.name || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white transition-colors duration-200 ${
                              isUserOnline(conv.other_user?.id) ? 'bg-emerald-500 shadow-xs' : 'bg-slate-300'
                            }`}
                            title={isUserOnline(conv.other_user?.id) ? 'En línea' : 'Desconectado'}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`font-bold text-sm truncate pr-2 ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                              {conv.other_user?.companyName || conv.other_user?.name}
                            </h4>
                            <span className={`text-[11px] whitespace-nowrap ${isUnread ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                              {formatMessageTime(conv.last_message?.created_at || conv.updated_at)}
                            </span>
                          </div>
                          {conv.product && (
                            <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/60 rounded-lg px-2 py-1 mb-1.5 max-w-full">
                              {conv.product.image ? (
                                <img
                                  src={conv.product.image}
                                  alt=""
                                  className="w-4 h-4 rounded object-cover shrink-0 border border-emerald-200/50"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <Box className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              )}
                              <span className="text-[11px] text-emerald-900 font-bold truncate">
                                {conv.product.title}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center gap-2">
                            <p className={`text-xs truncate flex-1 ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                              {conv.last_message?.attachment_type === 'image' 
                                ? "📷 Imagen adjunta" 
                                : conv.last_message?.attachment_type 
                                ? "📎 Documento adjunto" 
                                : (conv.last_message?.content || "Nueva conversación")}
                            </p>
                            {isUnread && (
                              <Badge className="bg-primary text-white rounded-full min-w-[20px] h-5 flex items-center justify-center p-0 px-1.5 text-[10px] font-bold shrink-0 shadow-sm">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </ScrollArea>
          </div>

          {/* RIGHT SIDE - CHAT AREA */}
          {activeConversation ? (
            <div className="flex-1 flex flex-col bg-[#fdfcf9] relative min-w-0">
              
              {/* Chat Header */}
              <div className="h-16 border-b border-border/50 bg-white flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm z-10 relative gap-2">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden h-8 w-8 -ml-1 text-muted-foreground hover:bg-slate-100 rounded-full"
                    onClick={() => setActiveConversationId(null)}
                    title="Volver a la lista de mensajes"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="relative shrink-0">
                    <Avatar className="w-10 h-10 border border-border/50 shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(activeConversation.other_user?.name || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white transition-colors duration-200 ${
                        isUserOnline(activeConversation.other_user?.id) ? 'bg-emerald-500 shadow-xs' : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground text-base leading-tight truncate">
                      {activeConversation.other_user?.companyName || activeConversation.other_user?.name}
                    </h3>
                    {isUserOnline(activeConversation.other_user?.id) ? (
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        En línea
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        Desconectado
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                  {activeConversation.product && (
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs font-medium bg-primary/5 text-primary hover:bg-primary/10 border-primary/20 px-2 sm:px-3">
                      <Link href={`/producto/${activeConversation.product.id}`}>
                        <span className="hidden sm:inline">Ver Producto</span> <ExternalLink className="w-3.5 h-3.5 sm:ml-1.5" />
                      </Link>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-slate-100 rounded-full">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem 
                        onClick={() => {
                          if (navigator?.clipboard) {
                            navigator.clipboard.writeText(window.location.href)
                            sileo.success({
                              title: "Enlace copiado",
                              description: "Enlace de la conversación copiado al portapapeles.",
                              position: "top-right"
                            })
                          }
                        }}
                        className="cursor-pointer gap-2"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                        <span>Copiar enlace de chat</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => {
                          const isOnline = isUserOnline(activeConversation.other_user?.id)
                          sileo.show({
                            title: activeConversation.other_user?.companyName || activeConversation.other_user?.name || "Usuario",
                            description: isOnline ? "Está activo y en línea ahora mismo." : "No está conectado en este momento.",
                            type: isOnline ? "success" : "info",
                            position: "top-right"
                          })
                        }}
                        className="cursor-pointer gap-2"
                      >
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span>Ver estado de usuario</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => {
                          sileo.action({
                            title: "Notificaciones Sileo",
                            description: "Las alertas en tiempo real están activas.",
                            position: "top-right",
                            button: {
                              title: "Entendido",
                              onClick: () => {}
                            }
                          })
                        }}
                        className="cursor-pointer gap-2"
                      >
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <span>Probar notificación Sileo</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Contextual Sticky Product Banner - Clickable to Product Page */}
              {activeConversation.product && (
                <Link
                  href={`/producto/${activeConversation.product.id}`}
                  target="_blank"
                  className="group bg-slate-50 hover:bg-emerald-50/60 px-6 py-3 border-b border-border/40 shrink-0 flex items-center justify-between z-0 transition-colors cursor-pointer"
                  title="Ver página de este producto en una pestaña nueva"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-border shadow-xs group-hover:scale-105 transition-transform">
                      {activeConversation.product.image ? (
                        <img src={activeConversation.product.image} alt={activeConversation.product.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <Box className="w-6 h-6 m-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        Producto de Interés
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors opacity-70" />
                      </p>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {activeConversation.product.title}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded-lg border border-border/50 shadow-xs group-hover:border-primary/40 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase mb-0.5 font-semibold">Precio / Vol.</p>
                    <p className="font-bold text-primary text-sm leading-tight">
                      {activeConversation.product.price} {activeConversation.product.currency} 
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        / {activeConversation.product.quantity}
                      </span>
                    </p>
                  </div>
                </Link>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5" ref={scrollRef}>
                 <div className="flex justify-center my-4">
                   <span className="bg-border/40 text-muted-foreground text-xs font-semibold px-4 py-1.5 rounded-full shadow-xs">
                     Historial de mensajes
                   </span>
                 </div>

                 {messages.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-[200px] opacity-70">
                     <MessageSquare className="w-12 h-12 text-primary/40 mb-3" />
                     <p className="text-sm font-medium text-foreground">El inicio de la negociación</p>
                     <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
                       Envía un mensaje para concretar detalles de compra, precios o documentación.
                     </p>
                   </div>
                 ) : (
                   messages.map((msg, idx) => {
                     const isMe = msg.sender_id === currentUserId
                     return (
                       <div key={msg.id} className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                         <div className={`rounded-2xl p-4 text-sm shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-border text-foreground rounded-tl-sm'}`}>
                           
                           {/* Image attachment */}
                           {msg.attachment_url && msg.attachment_type === 'image' && (
                             <div className="mb-3 relative group rounded-xl overflow-hidden border border-black/10 bg-black/5">
                               <div 
                                 className="cursor-pointer max-h-64 overflow-hidden"
                                 onClick={() => setPreviewImage(msg.attachment_url || null)}
                                 title="Hacer clic para ampliar y dar zoom"
                               >
                                 <img src={msg.attachment_url} alt="Adjunto" loading="lazy" decoding="async" className="w-full h-auto object-cover rounded-xl transition-transform duration-300 group-hover:scale-105" />
                                 <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white backdrop-blur-[2px]">
                                   <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium shadow-md">
                                     <Eye className="w-4 h-4" /> Ampliar y dar zoom
                                   </span>
                                 </div>
                               </div>

                               {/* Quick download button */}
                               <button
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   downloadAttachment(msg.attachment_url!, 'imagen-chat.jpg')
                                   sileo.success({
                                     title: "Descarga iniciada",
                                     description: "Descargando imagen a tu dispositivo...",
                                     position: "top-right"
                                   })
                                 }}
                                 className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md active:scale-95"
                                 title="Descargar imagen"
                               >
                                 <Download className="w-4 h-4" />
                               </button>
                             </div>
                           )}

                           {/* Document attachment */}
                           {msg.attachment_url && msg.attachment_type !== 'image' && (
                             <div 
                               onClick={() => {
                                 downloadAttachment(msg.attachment_url!, `documento-${msg.attachment_type || 'adjunto'}`)
                                 sileo.success({
                                   title: "Descarga iniciada",
                                   description: "Descargando documento a tu dispositivo...",
                                   position: "top-right"
                                 })
                               }}
                               className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl mb-3 transition-all hover:opacity-95 active:scale-[0.99] ${
                                 isMe ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-gray-50 hover:bg-gray-100 text-foreground border border-border/60'
                               }`}
                               title="Hacer clic para descargar documento"
                             >
                               <div className={`p-2.5 rounded-lg ${isMe ? 'bg-white/20' : 'bg-primary/10 text-primary shadow-xs'}`}>
                                 <FileText className="w-5 h-5" />
                               </div>
                               <div className="min-w-0 flex-1 pr-2">
                                 <p className="font-semibold text-sm truncate">Documento adjunto</p>
                                 <p className="text-xs opacity-80 uppercase font-medium">{msg.attachment_type || 'archivo'}</p>
                               </div>
                               <button
                                 type="button"
                                 className={`p-2 rounded-full transition-colors ${isMe ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                                 title="Descargar archivo"
                               >
                                 <Download className="w-4 h-4" />
                               </button>
                             </div>
                           )}

                           {/* Content */}
                           {msg.content && (
                             <p className="leading-relaxed whitespace-pre-wrap break-words break-all sm:break-normal">{msg.content}</p>
                           )}

                           {/* Footer with Timestamp and Read Receipt Checkmarks */}
                           <div className={`flex items-center gap-1.5 mt-2 text-[10px] ${isMe ? 'justify-end text-white/80' : 'justify-start text-muted-foreground'}`}>
                             <span className="font-medium">{formatMessageTime(msg.created_at)}</span>
                             {isMe && (() => {
                               const isSeen = Boolean(
                                 msg.read_at ||
                                 messages.slice(idx).some(other => (other.sender_id === currentUserId) && other.read_at)
                               )
                               return (
                                 <span title={isSeen ? "Visto" : "Enviado"}>
                                   {isSeen ? (
                                     <CheckCheck className="w-4 h-4 text-sky-300 drop-shadow-sm" />
                                   ) : (
                                     <CheckCheck className="w-4 h-4 text-white/50" />
                                   )}
                                 </span>
                               )
                             })()}
                           </div>
                         </div>
                       </div>
                     )
                   })
                 )}
              </div>

              {/* Quick Actions (B2B Suggestions) */}
              <div className="px-6 py-3 flex gap-2.5 overflow-x-auto no-scrollbar shrink-0 border-t border-border/40 bg-white/50 backdrop-blur-sm">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => handleSend("Me gustaría solicitar una cotización formal para este producto.")}
                   className="rounded-full bg-white h-8 text-xs font-medium border-primary/20 text-primary hover:bg-primary/5 shadow-xs"
                 >
                    Solicitar Cotización
                 </Button>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => handleSend("¿Me podrías compartir la ficha técnica y certificados de calidad?")}
                   className="rounded-full bg-white h-8 text-xs font-medium border-primary/20 text-primary hover:bg-primary/5 shadow-xs"
                 >
                    Pedir Ficha Técnica
                 </Button>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => handleSend("¿Cuál es el volumen mínimo de compra y tiempos estimados de entrega?")}
                   className="rounded-full bg-white h-8 text-xs font-medium border-primary/20 text-primary hover:bg-primary/5 shadow-xs"
                 >
                    Consultar Mínimos y Tiempos
                 </Button>
              </div>

              {/* Attachment Preview Chip */}
              {attachment && (
                <div className="px-6 py-3 bg-gray-50 border-t border-border/50 flex items-center justify-between shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)] z-10 relative">
                  <div className="flex items-center gap-3 min-w-0">
                    {attachment.type === 'image' ? (
                      <img src={attachment.url} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-border shadow-sm shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{attachment.size || attachment.type}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    onClick={() => setAttachment(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {/* Input Area */}
              <div className="p-5 bg-white border-t border-border shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.05)] shrink-0 relative z-10">
                
                {/* Hidden file input */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="hidden"
                />

                <div className="flex items-end gap-3 bg-gray-50/80 border border-border rounded-2xl p-2.5 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all shadow-inner">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10"
                    title="Adjuntar archivo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <textarea 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={attachment ? "Añade un mensaje (opcional)..." : "Escribe tu mensaje B2B aquí..."}
                    className="w-full max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-2.5 px-2 text-sm text-foreground font-medium placeholder:text-muted-foreground/70"
                    rows={1}
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    onClick={() => handleSend()} 
                    disabled={isSending || (!inputValue.trim() && !attachment)}
                    size="icon" 
                    className="shrink-0 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md h-11 w-11 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                  >
                    {isSending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-3 font-medium flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Mensajería segura y encriptada por Agrilpa.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gray-50/50 p-8 text-center relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
              
              <div className="w-24 h-24 bg-white shadow-lg rounded-2xl flex items-center justify-center mb-6 text-primary border border-primary/10 rotate-3 transition-transform hover:rotate-0">
                <MessageSquare className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Selecciona una conversación</h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Elige un chat del menú lateral para ver el historial de mensajes, documentos adjuntos y continuar tu negociación.
              </p>
            </div>
          )}

          {/* Interactive Zoomable & Downloadable Lightbox */}
          <MediaLightbox
            imageUrl={previewImage}
            onClose={() => setPreviewImage(null)}
            title={activeConversation?.other_user?.companyName || activeConversation?.other_user?.name || "Foto adjunta"}
          />
        </div>
      </Card>
    </div>
  )
}

