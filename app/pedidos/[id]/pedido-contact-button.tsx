"use client"

import { useEffect } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGlobalChat, type ActiveChat } from "@/components/chat/chat-context"
import { createClient } from "@/lib/supabase/client"

interface PedidoContactButtonProps {
  requestId: string
  productName: string
  quantityLabel: string
  budgetLabel: string
  imageUrl: string | null
  buyerId: string | null
  buyerName: string
  directContactHref: string | null
}

export function PedidoContactButton({
  requestId,
  productName,
  quantityLabel,
  budgetLabel,
  imageUrl,
  buyerId,
  buyerName,
  directContactHref,
}: PedidoContactButtonProps) {
  const { setActiveChat, requestProductContact, currentUserId } = useGlobalChat()

  const chatTarget: ActiveChat = {
    sellerName: buyerName,
    vendorId: buyerId || "",
    isPurchaseRequest: true,
    directContactHref,
    product: {
      id: requestId,
      title: productName,
      price: budgetLabel,
      currency: "USD",
      image: imageUrl || "/placeholder.svg",
      quantity: quantityLabel,
    },
  }

  useEffect(() => {
    setActiveChat(chatTarget)
  }, [
    requestId,
    productName,
    quantityLabel,
    budgetLabel,
    imageUrl,
    buyerId,
    buyerName,
    directContactHref,
    setActiveChat,
  ])

  const trackClick = async () => {
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user?.id) return

      await fetch("/api/products/track-contact-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        keepalive: true,
        body: JSON.stringify({
          productId: requestId,
          productTitle: `Pedido: ${productName}`,
          sellerId: buyerId || requestId,
          clickType: "chat",
          userId: session.user.id,
        }),
      })
    } catch {
      // Non-blocking tracking
    }
  }

  const handleClick = () => {
    requestProductContact(chatTarget)
    if (currentUserId) {
      setTimeout(() => {
        void trackClick()
      }, 0)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg cursor-pointer"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Contactar comprador
    </Button>
  )
}
