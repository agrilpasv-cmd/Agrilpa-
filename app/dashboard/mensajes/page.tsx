"use client"

import React, { Suspense, useEffect, useState } from 'react'
import { ChatDashboard } from '@/components/chat/chat-dashboard'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function MensajesPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id)
      } else {
        router.push('/auth?redirectTo=/dashboard/mensajes')
      }
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground text-sm">Cargando tus mensajes...</p>
      </div>
    )
  }

  if (!currentUserId) {
    return null
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-6">
      <Suspense fallback={<p role="status">Cargando conversaciones…</p>}>
        <ChatDashboard currentUserId={currentUserId} />
      </Suspense>
    </div>
  )
}
