"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Conversation, Message } from '@/types/chat'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'
import { playMessageNotificationSound } from '@/lib/sound'
import { downloadAttachment } from '@/lib/download'
import { ChatWorkspace, type ChatAttachment } from './chat-workspace'
import { conversationPath, isSupportConversation, type ChatChannel } from '@/lib/chat-channels'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGlobalChat } from '@/components/chat/chat-context'
import { Toaster as SileoToaster, sileo } from 'sileo'
import 'sileo/styles.css'

interface ChatDashboardProps {
  currentUserId: string;
  channel?: ChatChannel;
}

export function ChatDashboard({ currentUserId, channel = "b2b" }: ChatDashboardProps) {
  const router = useRouter()
  const inChannel = (conversation: Conversation) => isSupportConversation(conversation) === (channel === "support")
  const selectIncoming = (conversation: Conversation) => {
    if (inChannel(conversation)) setActiveConversationId(conversation.id)
    else router.push(conversationPath(conversation))
  }
  const requestedConversation = useSearchParams().get('conversation')
  const requestedConversationRef = useRef(requestedConversation)
  requestedConversationRef.current = requestedConversation
  const selectedRequestRef = useRef<string | null>(null)
  const { isUserOnline, refreshUnreadCount } = useGlobalChat()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all")

  const [isLoadingConvos, setIsLoadingConvos] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [conversationError, setConversationError] = useState(false)
  const [messageError, setMessageError] = useState(false)
  const [messagesRetry, setMessagesRetry] = useState(0)
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
  const draftsRef = useRef<Record<string, { text: string; attachment: ChatAttachment | null }>>({})
  const currentDraftRef = useRef({ text: inputValue, attachment })
  currentDraftRef.current = { text: inputValue, attachment }
  const previousDraftConversation = useRef<string | null>(null)

  useEffect(() => {
    const previousId = previousDraftConversation.current
    if (previousId) draftsRef.current[previousId] = currentDraftRef.current
    const next = activeConversationId ? draftsRef.current[activeConversationId] : null
    setInputValue(next?.text || "")
    setAttachment(next?.attachment || null)
    setPreviewImage(null)
    previousDraftConversation.current = activeConversationId
  }, [activeConversationId])

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
      if (!res.ok || !Array.isArray(data.conversations)) throw new Error("Conversations unavailable")
      const requested = data.conversations.find((c: Conversation) => c.id === requestedConversationRef.current)
      if (requested && !inChannel(requested)) { router.replace(conversationPath(requested)); return }
      setConversationError(false)
      if (data.conversations) {
        setConversations(data.conversations.filter(inChannel))
        
        // Solo autoseleccionar en la carga inicial de pantalla grande (escritorio >= 1024px).
        // En teléfonos móviles o en las actualizaciones en segundo plano (cada 8s), NUNCA
        // forzar la apertura de un chat si el usuario está en la bandeja de entrada.
        if (!hasInitiallySelectedRef.current) {
          hasInitiallySelectedRef.current = true
          const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
          if (isDesktop && !requestedConversationRef.current && !activeConversationIdRef.current && data.conversations.filter(inChannel).length > 0) {
            setActiveConversationId(data.conversations.find(inChannel).id)
          }
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setConversationError(true)
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
                  setConversations(convList.filter(inChannel))
                  playMessageNotificationSound()
                  const sender = found.other_user?.companyName || found.other_user?.name || "Usuario de Agrilpa"
                  sileo.action({
                    title: `Mensaje de ${sender}`,
                    description: incomingMsg.content || "Has recibido un archivo adjunto",
                    position: "top-right",
                    button: {
                      title: "Ver chat",
                      onClick: () => selectIncoming(found)
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
          if (incomingMsg.conversation_id === activeConversationIdRef.current && document.visibilityState === "visible") {
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
                onClick: () => selectIncoming(targetConv)
              }
            })
          }

          // Update last_message in conversations list
          setConversations(prev => prev.map(c => 
            c.id === incomingMsg.conversation_id 
              ? { 
                  ...c, 
                  last_message: incomingMsg, 
                  unread_count: incomingMsg.conversation_id === activeConversationIdRef.current && document.visibilityState === "visible" ? 0 : (c.unread_count || 0) + 1
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
  }, [currentUserId, channel])

  // 2. Fetch messages & mark as read when active conversation changes, with 2.5s real-time sync guarantee
  useEffect(() => {
    if (!activeConversationId) return

    let isMounted = true
    setMessages([])
    setIsLoadingMessages(true)
    setMessageError(false)
    const supabase = createClient()
    let channel: any = null

    const loadMessages = async () => {
      try {
        const { data: msgs, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', activeConversationId)
          .order('created_at', { ascending: true })

        if (error) throw error
        if (!isMounted) return
        if (msgs) {
          setMessages(msgs as Message[])
          setMessageError(false)
        }

        // Mark as read in DB
        if (currentUserId && document.visibilityState === "visible") {
          await fetch('/api/chat/mark-as-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId: activeConversationId, userId: currentUserId })
          }).catch(console.error)
          void refreshUnreadCount()
        }

        // Update unread count locally
        if (isMounted) {
          setConversations(prev => prev.map(c => 
            c.id === activeConversationId ? { ...c, unread_count: 0 } : c
          ))
        }
      } catch (err) {
        console.error("Error loading messages:", err)
        if (isMounted) setMessageError(true)
      } finally {
        if (isMounted) setIsLoadingMessages(false)
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

            if (currentUserId && document.visibilityState === "visible") {
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
          setConversations(prev => prev.map(c => c.last_message?.id === updatedMsg.id ? { ...c, last_message: updatedMsg } : c))
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
          const latestMessage = msgs[msgs.length - 1]
          if (latestMessage) setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, last_message: latestMessage } : c))
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
                if (currentUserId && document.visibilityState === "visible") {
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
    const handleVisibility = () => { if (document.visibilityState === 'visible') handleWindowFocus() }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isMounted = false
      clearInterval(syncInterval)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [activeConversationId, currentUserId, messagesRetry])

  // Scroll to bottom when messages or attachment change
  useEffect(() => {
    if (scrollRef.current && !isLoadingMessages) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, attachment, isLoadingMessages])

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
      if (activeConversationIdRef.current === activeConversationId) {
        if (!presetText) setInputValue(content)
        setAttachment(currentAttachment)
      } else {
        draftsRef.current[activeConversationId] = { text: content, attachment: currentAttachment }
      }
    } finally {
      setIsSending(false)
    }
  }

  // Derived filtered conversations
  const filteredConversations = conversations.filter(c => {
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    const q = normalize(searchQuery.trim())
    const otherName = normalize(c.other_user?.companyName || c.other_user?.name || "")
    const prodTitle = normalize(c.product?.title || "")
    const matchesSearch = otherName.includes(q) || prodTitle.includes(q) || (channel === "support" && normalize(`ticket #${c.id} ${{ open: "Abierto", in_progress: "En revisión", resolved: "Resuelto" }[c.support_status || "open"]}`).includes(q))
    
    let matchesStatus = true
    if (filterStatus === "unread") {
      matchesStatus = (c.unread_count || 0) > 0
    } else if (filterStatus === "read") {
      matchesStatus = (c.unread_count || 0) === 0
    }

    return matchesSearch && matchesStatus
  })

  const handleOpenSupport = async () => {
    if (channel !== "support") { router.push("/dashboard/soporte"); return }
    let adminId = '57b0c950-5397-42c9-b560-1459b21f8d8f'
    try {
      const res = await fetch('/api/chat/support/info')
      if (res.ok) {
        const d = await res.json()
        if (d.adminId) adminId = d.adminId
      }
    } catch (e) {}

    const existingSupport = conversations.find(
      (c) => isSupportConversation(c) || c.other_user?.id === adminId
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
        if (!res.ok) throw new Error(d.error || "Support unavailable")
        if (d.conversationId) {
          await fetchConversations()
          setActiveConversationId(d.conversationId)
        }
      } catch (err) {
        console.error('Error starting support conversation:', err)
        sileo.error({ title: 'No pudimos abrir tu solicitud', description: 'Inténtalo de nuevo.', position: 'top-right' })
      }
    }
  }

  const copyConversationLink = async () => {
    if (!activeConversationId) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('conversation', activeConversationId)
      url.pathname = channel === "support" ? "/dashboard/soporte" : "/dashboard/mensajes"
      await navigator.clipboard.writeText(url.href)
      sileo.success({ title: "Enlace copiado", description: "Puedes volver directamente a esta conversación.", position: "top-right" })
    } catch {
      sileo.error({ title: "No pudimos copiar el enlace", description: "Inténtalo de nuevo desde tu navegador.", position: "top-right" })
    }
  }

  return (
    <>
      <SileoToaster position="top-right" theme="light" />
      <ChatWorkspace
        channel={channel}
        currentUserId={currentUserId}
        conversations={conversations}
        filteredConversations={filteredConversations}
        activeConversation={activeConversation}
        messages={messages}
        searchQuery={searchQuery}
        filterStatus={filterStatus}
        loadingConversations={isLoadingConvos}
        loadingMessages={isLoadingMessages}
        conversationError={conversationError}
        messageError={messageError}
        sending={isSending}
        inputValue={inputValue}
        attachment={attachment}
        previewImage={previewImage}
        scrollRef={scrollRef}
        fileInputRef={fileInputRef}
        isUserOnline={isUserOnline}
        onSelect={setActiveConversationId}
        onSearch={setSearchQuery}
        onFilter={setFilterStatus}
        onDraft={setInputValue}
        onSend={() => void handleSend()}
        onFileSelect={handleFileSelect}
        onRemoveAttachment={() => setAttachment(null)}
        onPreview={setPreviewImage}
        onDownload={downloadAttachment}
        onSupport={() => void handleOpenSupport()}
        onCopyLink={() => void copyConversationLink()}
        onRetryConversations={() => void fetchConversations()}
        onRetryMessages={() => setMessagesRetry(value => value + 1)}
      />
    </>
  )
}
