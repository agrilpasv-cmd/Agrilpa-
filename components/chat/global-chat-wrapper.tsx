"use client"

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, X, Box } from 'lucide-react'
import { ChatWidget } from './chat-widget'
import { useGlobalChat } from './chat-context'
import { Button } from '@/components/ui/button'

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+50374899726"
const WHATSAPP_DIGITS = WHATSAPP_NUMBER.replace(/\D/g, "")
const WHATSAPP_MESSAGE = "¡Hola Agrilpa! Me gustaría recibir asistencia técnica o información."

export function GlobalChatWrapper() {
  const {
    activeChat,
    setActiveChat,
    isOpen,
    setIsOpen,
    currentUserId,
    isAdmin,
    unreadCount,
    pendingNotification,
    clearPendingNotification,
    openChatForNotification,
    requestProductContact,
    isUserOnline,
    conversations
  } = useGlobalChat()
  const pathname = usePathname()
  const router = useRouter()
  const [lang, setLang] = useState<"es" | "en">("es")

  useEffect(() => {
    const readCurrentLang = (): "es" | "en" => {
      try {
        const saved = localStorage.getItem("agrilpa_language") as "es" | "en" | null
        if (saved === "en" || saved === "es") return saved
        const match = document.cookie.match(/googtrans=\/es\/(en|es)/)
        if (match && match[1]) return match[1] as "es" | "en"
      } catch {}
      return "es"
    }

    setLang(readCurrentLang())

    const handleLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<"es" | "en">
      if (customEvent.detail && (customEvent.detail === "es" || customEvent.detail === "en")) {
        setLang(customEvent.detail)
      } else {
        setLang(readCurrentLang())
      }
    }

    window.addEventListener("agrilpa:language_change", handleLangChange)
    window.addEventListener("storage", handleLangChange)
    return () => {
      window.removeEventListener("agrilpa:language_change", handleLangChange)
      window.removeEventListener("storage", handleLangChange)
    }
  }, [])

  const isEn = lang === "en"

  // STRICT REQUIREMENT: Do not show on the full messages page (/dashboard/mensajes), admin panel (/admin), or auth pages (/auth)
  if (pathname?.startsWith('/dashboard/mensajes') || pathname?.startsWith('/dashboard/soporte') || pathname?.startsWith('/admin') || pathname?.startsWith('/auth')) {
    return null
  }

  // Handle clicking the floating button when widget is closed
  const handleFloatingButtonClick = () => {
    if (pendingNotification) {
      openChatForNotification(pendingNotification)
    } else if (activeChat && !activeChat.isSupport) {
      // If there is an active regular product or pedido chat, open it via contact mode check
      if (pathname?.startsWith('/producto/') || pathname?.startsWith('/pedidos/')) requestProductContact(activeChat)
      else setIsOpen(true)
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

          {/* Quick Help WhatsApp Circular Button with label below - Hidden for admin users */}
          {!isAdmin && (
            <a
              href={`https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(
                isEn
                  ? "Hello Agrilpa! I would like to get technical assistance or information."
                  : WHATSAPP_MESSAGE
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`pointer-events-auto flex flex-col items-center gap-1 group transition-transform ${
                unreadCount > 0 ? 'mb-3' : 'mb-0'
              }`}
              title={isEn ? "Contact Support on WhatsApp" : "Contactar a Ayuda por WhatsApp"}
              aria-label={isEn ? "Contact Support on WhatsApp" : "Contactar a Ayuda por WhatsApp"}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xl shadow-[#25D366]/30 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-white">
                <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white transition-transform group-hover:scale-110" />
              </div>
              <span
                className="notranslate text-[10px] sm:text-[11px] font-bold text-foreground/90 bg-white/95 dark:bg-card/95 px-2 py-0.5 rounded-full shadow-sm border border-border/60 group-hover:text-[#25D366] transition-colors tracking-tight select-none"
                translate="no"
              >
                {isEn ? "Help" : "Ayuda"}
              </span>
            </a>
          )}

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
