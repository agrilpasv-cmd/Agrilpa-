"use client"

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, X, Box, Headphones } from 'lucide-react'
import { ChatWidget } from './chat-widget'
import { useGlobalChat } from './chat-context'
import { Button } from '@/components/ui/button'

export function GlobalChatWrapper() {
  const {
    activeChat,
    setActiveChat,
    isOpen,
    setIsOpen,
    currentUserId,
    unreadCount,
    pendingNotification,
    clearPendingNotification,
    openChatForNotification,
    openSupportChat,
    isUserOnline,
    conversations
  } = useGlobalChat()
  const pathname = usePathname()
  const router = useRouter()

  // STRICT REQUIREMENT: Do not show on the full messages page (/dashboard/mensajes) or auth pages (/auth)
  if (pathname?.startsWith('/dashboard/mensajes') || pathname?.startsWith('/dashboard/soporte') || pathname?.startsWith('/auth')) {
    return null
  }

  // Handle clicking the floating button when widget is closed
  const handleFloatingButtonClick = () => {
    if (pendingNotification) {
      openChatForNotification(pendingNotification)
    } else if (activeChat && !activeChat.isSupport) {
      // If there is an active regular product chat, open it
      setIsOpen(true)
    } else {
      // Find the latest regular product conversation
      const regularConvo = conversations?.find((c) => c.product_id && !c.is_support)
      if (regularConvo) {
        setActiveChat({
          sellerName: regularConvo.other_user?.companyName || regularConvo.other_user?.name || "Chat",
          sellerOnline: regularConvo.other_user?.id ? isUserOnline(regularConvo.other_user.id) : false,
          product: regularConvo.product || {
            id: 'generic',
            title: 'Negociación',
            price: '',
            currency: '$',
            image: '/placeholder.svg',
            quantity: ''
          },
          vendorId: regularConvo.other_user?.id,
          isSupport: false
        })
        setIsOpen(true)
      } else if (conversations && conversations.length > 0) {
        openChatForNotification()
      } else {
        router.push('/dashboard/mensajes')
      }
    }
  }

  return (
    <>
      {/* 1. When chat popup is open with an active conversation, render the widget */}
      {isOpen && activeChat && (
        <ChatWidget
          key={`widget-${currentUserId || 'guest'}-${activeChat.vendorId || 'novendor'}-${activeChat.product?.id || 'noproduct'}-${activeChat.isSupport ? 'support' : 'regular'}`}
          sellerName={activeChat.sellerName}
          sellerOnline={activeChat.sellerOnline}
          product={activeChat.product}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          buyerId={currentUserId}
          vendorId={activeChat.vendorId}
          isSupport={activeChat.isSupport}
        />
      )}

      {/* 2. When popup is closed, render the real-time notification alert and floating trigger button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
          
          {/* Real-time Floating Message Alert Card matching ChatWidget design - ONLY when there are unread messages */}
          {pendingNotification && unreadCount > 0 && (
            <div className="pointer-events-auto w-[340px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-border/70 overflow-hidden mb-3.5 animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col">
              
              {/* Header - Sleek & Compact */}
              <div className="bg-primary px-3.5 py-2.5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0 border border-white/30">
                    {pendingNotification.senderName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs leading-none truncate">
                      {pendingNotification.senderName}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                      <span className="text-[10px] text-white/90">Nuevo mensaje</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-6 w-6 rounded-full shrink-0"
                  onClick={clearPendingNotification}
                  title="Cerrar notificación"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Product Mini Pill (If linked to a product) */}
              {pendingNotification.productTitle && (
                <div className="bg-emerald-50/50 hover:bg-emerald-50/80 px-3 py-1.5 border-b border-border/50 flex items-center gap-2 shrink-0 transition-colors">
                  <div className="w-7 h-7 rounded-md bg-white overflow-hidden border border-border/60 shrink-0 flex items-center justify-center">
                    {pendingNotification.productImage ? (
                      <img
                        src={pendingNotification.productImage}
                        alt={pendingNotification.productTitle}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Box className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-foreground truncate">
                      {pendingNotification.productTitle}
                    </p>
                    <p className="text-[10px] text-primary font-medium truncate">
                      {pendingNotification.product?.price ? (
                        <>
                          {pendingNotification.product.price} {pendingNotification.product.currency || '$'}
                          <span className="text-muted-foreground font-normal">/{pendingNotification.product.quantity || 'ud'}</span>
                        </>
                      ) : (
                        "Consulta de producto"
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Message Bubble - Styled exactly like the chat popup card */}
              <div 
                onClick={() => openChatForNotification(pendingNotification)}
                className="p-3 bg-gray-50/60 cursor-pointer hover:bg-gray-100/60 transition-colors group"
                title="Clic para abrir y responder"
              >
                <div className="bg-white border border-border/80 group-hover:border-primary/40 rounded-xl rounded-tl-xs p-2.5 text-xs text-foreground shadow-2xs transition-all">
                  <p className="leading-relaxed whitespace-pre-wrap break-words line-clamp-3 text-xs text-foreground/90">
                    {pendingNotification.content}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 text-[9px] text-muted-foreground border-t border-border/40">
                    <span className="font-medium text-primary truncate">{pendingNotification.senderName}</span>
                    <span className="shrink-0">Ahora</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions - Sleek & Compact */}
              <div className="px-3 py-2 bg-white border-t border-border/50 flex items-center gap-1.5">
                <Button
                  onClick={() => openChatForNotification(pendingNotification)}
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs font-medium h-8 rounded-lg shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Responder
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-lg"
                  onClick={() => clearPendingNotification()}
                >
                  <Link href={pendingNotification.isSupport ? `/dashboard/soporte?conversation=${pendingNotification.conversationId}` : `/dashboard/mensajes?conversation=${pendingNotification.conversationId}`}>
                    Bandeja
                  </Link>
                </Button>
              </div>

            </div>
          )}

          {/* Quick Help / Support Pill */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              openSupportChat()
            }}
            className={`pointer-events-auto flex items-center gap-2 bg-white hover:bg-emerald-50/40 text-foreground px-3.5 py-1.5 rounded-full shadow-md border border-primary text-xs font-semibold backdrop-blur-sm transition-all hover:scale-105 active:scale-95 group hover:shadow-lg ${
              unreadCount > 0 ? 'mb-2.5' : 'mb-0'
            }`}
            title="Pedir ayuda o asistencia técnica a Soporte Agrilpa"
          >
            <Headphones className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] sm:text-xs font-medium">¿Ayuda o Soporte?</span>
          </button>

          {/* Floating Trigger Button (Bottom-Right) - Only visible when another user sends a new unread message */}
          {unreadCount > 0 && (
            <Button 
              onClick={handleFloatingButtonClick}
              className="pointer-events-auto w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 flex items-center justify-center relative transition-transform hover:scale-105 active:scale-95 animate-in zoom-in-75 duration-200"
              aria-label="Abrir chat"
            >
              <MessageCircle className="w-6 h-6" />

              {/* Unread badge indicator */}
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-lg ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </Button>
          )}
        </div>
      )}
    </>
  )
}
