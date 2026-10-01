"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { isSupportConversation } from '@/lib/chat-channels'
import { ConversationProduct } from '@/types/chat'
import { playMessageNotificationSound } from '@/lib/sound'

export interface ActiveChat {
  sellerName: string;
  sellerOnline?: boolean;
  product: ConversationProduct;
  vendorId: string;
  isSupport?: boolean;
}

export interface PendingMessageNotification {
  isSupport?: boolean;
  conversationId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachmentType?: string;
  productTitle?: string;
  productImage?: string;
  created_at: string;
  otherUserId: string;
  product: ConversationProduct;
}

interface ChatContextType {
  activeChat: ActiveChat | null;
  isOpen: boolean;
  onlineUsers: Set<string>;
  currentUserId: string | null;
  unreadCount: number;
  b2bUnreadCount: number;
  supportUnreadCount: number;
  pendingNotification: PendingMessageNotification | null;
  clearPendingNotification: () => void;
  openChatForNotification: (notif?: PendingMessageNotification | null) => void;
  openSupportChat: () => Promise<void>;
  isUserOnline: (userId?: string | null) => boolean;
  setActiveChat: (chat: ActiveChat | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  openChat: (chat: ActiveChat) => void;
  refreshUnreadCount: () => Promise<void>;
  conversations: any[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [pendingNotification, setPendingNotification] = useState<PendingMessageNotification | null>(null)
  const [conversations, setConversations] = useState<any[]>([])

  const conversationMapRef = useRef<Map<string, any>>(new Map())
  const isOpenRef = useRef(isOpen)
  const activeChatRef = useRef(activeChat)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    activeChatRef.current = activeChat
  }, [activeChat])

  // Function to refresh conversations and calculate unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!currentUserId) {
      setUnreadCount(0)
      setPendingNotification(null)
      return
    }
    try {
      const res = await fetch(`/api/chat/conversations?userId=${currentUserId}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      })
      if (!res.ok) return
      const data = await res.json()
      const convList: any[] = data.conversations || []
      setConversations(convList)

      const map = new Map<string, any>()
      let totalUnread = 0
      let latestUnreadConvo: any = null

      convList.forEach((c) => {
        map.set(c.id, c)
        const unread = Number(c.unread_count) || 0
        totalUnread += unread
        if (unread > 0 && !latestUnreadConvo) {
          latestUnreadConvo = c
        }
      })

      conversationMapRef.current = map
      setUnreadCount(totalUnread)

      // If user has 0 unread messages, ensure pendingNotification is cleared completely
      if (totalUnread === 0) {
        setPendingNotification(null)
      } else if (latestUnreadConvo && !isOpenRef.current) {
        // ONLY if user genuinely has unread messages, prepare the pending notification
        const lastMsg = latestUnreadConvo.last_message
        setPendingNotification((prev) => {
          if (prev && prev.conversationId === latestUnreadConvo.id) return prev
          return {
            conversationId: latestUnreadConvo.id,
            senderName: latestUnreadConvo.other_user?.companyName || latestUnreadConvo.other_user?.name || "Usuario de Agrilpa",
            senderAvatar: latestUnreadConvo.other_user?.avatar_url,
            isSupport: isSupportConversation(latestUnreadConvo),
            content: lastMsg?.content || (lastMsg?.attachment_type === 'image' ? "📷 Foto adjunta" : "Tienes mensajes pendientes"),
            attachmentType: lastMsg?.attachment_type,
            productTitle: latestUnreadConvo.product?.title || "Producto",
            productImage: latestUnreadConvo.product?.image,
            created_at: lastMsg?.created_at || latestUnreadConvo.updated_at,
            otherUserId: latestUnreadConvo.other_user?.id,
            product: latestUnreadConvo.product || {
              id: 'generic',
              title: 'Negociación',
              price: '',
              currency: '$',
              image: '/placeholder.svg',
              quantity: ''
            }
          }
        })
      }
    } catch (err) {
      console.error('[ChatContext] Error refreshing conversations:', err)
    }
  }, [currentUserId])

  // Presence and Auth Tracking
  useEffect(() => {
    let isMounted = true
    let presenceChannel: any = null

    const initPresence = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!isMounted) return

        const uid = user?.id || null
        setCurrentUserId(uid)

        // 2. Setup channel for global presence
        const channelName = 'agrilpa-global-presence'
        presenceChannel = supabase.channel(channelName, {
          config: {
            presence: {
              key: uid || `anon-${Math.random().toString(36).substring(2, 9)}`,
            },
          },
        })

        const updateOnlineUsers = () => {
          if (!presenceChannel) return
          try {
            const state = presenceChannel.presenceState()
            const onlineSet = new Set<string>()
            
            Object.entries(state).forEach(([key, presences]) => {
              if (key && !key.startsWith('anon-') && key !== 'undefined') {
                onlineSet.add(key)
              }
              if (Array.isArray(presences)) {
                presences.forEach((p: any) => {
                  if (p?.user_id && !String(p.user_id).startsWith('anon-')) {
                    onlineSet.add(p.user_id)
                  }
                })
              }
            })

            if (isMounted) {
              setOnlineUsers(onlineSet)
            }
          } catch (err) {
            console.error('[Presence] Error syncing presence state:', err)
          }
        }

        presenceChannel
          .on('presence', { event: 'sync' }, updateOnlineUsers)
          .on('presence', { event: 'join' }, updateOnlineUsers)
          .on('presence', { event: 'leave' }, updateOnlineUsers)
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED' && uid) {
              try {
                await presenceChannel.track({
                  user_id: uid,
                  online_at: new Date().toISOString(),
                })
              } catch (trackErr) {
                console.error('[Presence] Error tracking user:', trackErr)
              }
            }
          })

        // Listen for user login/logout
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
          const newUid = session?.user?.id || null
          if (newUid !== uid && isMounted) {
            setCurrentUserId(newUid)
            conversationMapRef.current.clear()
            setConversations([])
            setActiveChat(null)
            setPendingNotification(null)
            setUnreadCount(0)
            if (presenceChannel && newUid) {
              try {
                await presenceChannel.track({
                  user_id: newUid,
                  online_at: new Date().toISOString(),
                })
              } catch (e) {}
            }
          }
        })

        // Re-track periodically to ensure presence doesn't drop
        const presenceInterval = setInterval(async () => {
          if (!isMounted || !presenceChannel) return
          
          // Check if connection is actually joined
          if (presenceChannel.state !== 'joined') return
          
          const { data: { session } } = await supabase.auth.getSession()
          const activeUid = session?.user?.id
          
          if (activeUid) {
            try {
              await presenceChannel.track({
                user_id: activeUid,
                online_at: new Date().toISOString(),
              })
            } catch (e) {}
          }
        }, 30000)

        return () => {
          authListener?.subscription?.unsubscribe()
          clearInterval(presenceInterval)
        }
      } catch (err) {
        console.error('[Presence] Setup error:', err)
      }
    }

    const cleanupPromise = initPresence()

    return () => {
      isMounted = false
      cleanupPromise.then((cleanFn) => cleanFn && cleanFn())
      if (presenceChannel) {
        try {
          presenceChannel.untrack()
          import('@/lib/supabase/client').then(({ createClient }) => {
            createClient().removeChannel(presenceChannel)
          })
        } catch (e) {}
      }
    }
  }, [])

  // Initial load of unread count and periodic sync
  useEffect(() => {
    if (!currentUserId) return
    refreshUnreadCount()

    // Light periodic sync every 10 seconds
    const timer = setInterval(() => {
      refreshUnreadCount()
    }, 10000)

    return () => clearInterval(timer)
  }, [currentUserId, refreshUnreadCount])

  // HTTP Presence Heartbeat: Keeps server informed that user is online on platform
  // (Prevents email spam when recipient is actively browsing or in chat)
  useEffect(() => {
    if (!currentUserId) return

    const sendHeartbeat = async () => {
      try {
        const inMessagesPage = 
          (typeof window !== 'undefined' && (window.location.pathname.startsWith('/dashboard/mensajes') || window.location.pathname.startsWith('/dashboard/soporte'))) ||
          isOpenRef.current
        
        await fetch('/api/chat/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            inMessagesPage: Boolean(inMessagesPage)
          }),
        })
      } catch (err) {
        // silent fail on network blip
      }
    }

    sendHeartbeat()
    const heartbeatInterval = setInterval(sendHeartbeat, 25000)

    const handleActivity = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat()
      }
    }

    window.addEventListener('focus', handleActivity)
    document.addEventListener('visibilitychange', handleActivity)

    return () => {
      clearInterval(heartbeatInterval)
      window.removeEventListener('focus', handleActivity)
      document.removeEventListener('visibilitychange', handleActivity)
    }
  }, [currentUserId])

  // Real-time listener for incoming messages across the entire site
  useEffect(() => {
    if (!currentUserId) return

    let isMounted = true
    let msgChannel: any = null

    const setupRealtimeMessages = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      msgChannel = supabase
        .channel('agrilpa-global-incoming-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            if (!isMounted) return
            const newMsg = payload.new as any
            if (!newMsg) return

            // If sent by the current logged-in user, ignore
            if (newMsg.sender_id === currentUserId) return

            // Check if conversation belongs to this user
            let conv = conversationMapRef.current.get(newMsg.conversation_id)
            if (!conv) {
              // Might be a brand new conversation created by another user!
              try {
                const res = await fetch(`/api/chat/conversations?userId=${currentUserId}&_t=${Date.now()}`, {
                  cache: 'no-store'
                })
                if (res.ok) {
                  const data = await res.json()
                  const convList: any[] = data.conversations || []
                  setConversations(convList)
                  conversationMapRef.current.clear()
                  convList.forEach((c) => conversationMapRef.current.set(c.id, c))
                  conv = conversationMapRef.current.get(newMsg.conversation_id)
                }
              } catch (e) {}
            }

            // STRICT PARTICIPATION CHECK:
            // If it's not a conversation for current user, ignore completely!
            if (!conv || (conv.buyer_id !== currentUserId && conv.seller_id !== currentUserId)) {
              return
            }

            // IT'S FOR THIS USER:
            // 1. Play audio chime!
            playMessageNotificationSound()

            // 2. Increment unread count
            setUnreadCount((c) => c + 1)
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message: newMsg } : c))

            // 3. If chat widget is already open and showing this specific vendor/product, don't show the floating notification card
            if (isOpenRef.current && activeChatRef.current?.vendorId === conv.other_user?.id) {
              return
            }

            // 4. Populate pending notification card
            const notificationItem: PendingMessageNotification = {
              conversationId: conv.id,
              senderName: conv.other_user?.companyName || conv.other_user?.name || "Nuevo mensaje",
              senderAvatar: conv.other_user?.avatar_url,
              isSupport: isSupportConversation(conv),
              content: newMsg.content || (newMsg.attachment_type === 'image' ? "📷 Foto adjunta" : "📎 Archivo adjunto"),
              attachmentType: newMsg.attachment_type,
              productTitle: conv.product?.title || "Producto",
              productImage: conv.product?.image,
              created_at: newMsg.created_at || new Date().toISOString(),
              otherUserId: conv.other_user?.id || (conv.buyer_id === currentUserId ? conv.seller_id : conv.buyer_id),
              product: conv.product || {
                id: 'generic',
                title: 'Negociación',
                price: '',
                currency: '$',
                image: '/placeholder.svg',
                quantity: ''
              }
            }

            setPendingNotification(notificationItem)
          }
        )
        .subscribe()
    }

    setupRealtimeMessages()

    return () => {
      isMounted = false
      if (msgChannel) {
        import('@/lib/supabase/client').then(({ createClient }) => {
          createClient().removeChannel(msgChannel)
        })
      }
    }
  }, [currentUserId])

  const isUserOnline = useCallback((userId?: string | null): boolean => {
    if (!userId) return false
    return onlineUsers.has(userId)
  }, [onlineUsers])

  const openChat = useCallback((chat: ActiveChat) => {
    setActiveChat(chat)
    setIsOpen(true)
    setPendingNotification(null)
  }, [])

  const clearPendingNotification = useCallback(() => {
    setPendingNotification(null)
  }, [])

  const openChatForNotification = useCallback((notif?: PendingMessageNotification | null) => {
    const target = notif || pendingNotification
    if (target) {
      setActiveChat({
        sellerName: target.senderName,
        sellerOnline: onlineUsers.has(target.otherUserId),
        isSupport: target.isSupport,
        product: target.product,
        vendorId: target.otherUserId
      })
      setIsOpen(true)
      setPendingNotification(null)
      setUnreadCount((c) => Math.max(0, c - 1))
    } else if (conversationMapRef.current.size > 0) {
      const firstConvo = Array.from(conversationMapRef.current.values())[0]
      setActiveChat({
        sellerName: firstConvo.other_user?.companyName || firstConvo.other_user?.name || "Chat",
        sellerOnline: onlineUsers.has(firstConvo.other_user?.id),
        product: firstConvo.product || {
          id: 'generic',
          title: 'Negociación',
          price: '',
          currency: '$',
          image: '/placeholder.svg',
          quantity: ''
        },
        isSupport: isSupportConversation(firstConvo),
        vendorId: firstConvo.other_user?.id
      })
      setIsOpen(true)
      setUnreadCount((c) => Math.max(0, c - 1))
    }
  }, [pendingNotification, onlineUsers])

  const openSupportChat = useCallback(async () => {
    let adminId = '57b0c950-5397-42c9-b560-1459b21f8d8f'
    try {
      const res = await fetch('/api/chat/support/info')
      if (res.ok) {
        const data = await res.json()
        if (data.adminId) adminId = data.adminId
      }
    } catch (e) {}

    const supportChat: ActiveChat = {
      sellerName: "Soporte Agrilpa",
      sellerOnline: true,
      vendorId: adminId,
      isSupport: true,
      product: {
        id: 'support',
        title: 'Asistencia y Soporte Agrilpa',
        price: 'Atención Oficial',
        currency: '',
        image: '/agrilpa-logo.svg',
        quantity: '24/7'
      }
    }

    setActiveChat(supportChat)
    setIsOpen(true)
    setPendingNotification(null)
  }, [])

  return (
    <ChatContext.Provider
      value={{
        activeChat,
        isOpen,
        onlineUsers,
        currentUserId,
        unreadCount,
        b2bUnreadCount: conversations.reduce((n, c) => n + (isSupportConversation(c) ? 0 : Number(c.unread_count) || 0), 0),
        supportUnreadCount: conversations.reduce((n, c) => n + (isSupportConversation(c) ? Number(c.unread_count) || 0 : 0), 0),
        pendingNotification,
        clearPendingNotification,
        openChatForNotification,
        openSupportChat,
        isUserOnline,
        setActiveChat,
        setIsOpen,
        openChat,
        refreshUnreadCount,
        conversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useGlobalChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useGlobalChat must be used within a ChatProvider')
  }
  return context
}
