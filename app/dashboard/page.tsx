"use client"

import { useEffect, useState } from "react"
import { UserDashboard } from "./components/user-dashboard"
import { AuthStorage } from "@/lib/auth-storage"

const ADMIN_EMAIL = "agrilpasv@gmail.com"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const localSession = AuthStorage.getSession()
    if (localSession?.role === "admin" || localSession?.email === ADMIN_EMAIL) {
      window.location.replace("/admin")
      return
    }

    const verify = async () => {
      try {
        const { createBrowserClient } = await import("@/lib/supabase/client")
        const supabase = createBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
          const role = profile?.role || (user.email === ADMIN_EMAIL ? "admin" : "user")
          
          if (role === "admin") {
            AuthStorage.setSession(user.id, user.email || "", "admin")
            window.location.replace("/admin")
            return
          }
          
          AuthStorage.setSession(user.id, user.email || "", role)
        } else {
          // If explicitly no user, and we were loading based on localSession, clear it
          AuthStorage.clearSession()
        }
      } catch (err) {
        console.warn("[DashboardPage] Verification failed:", err)
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return <UserDashboard />
}

