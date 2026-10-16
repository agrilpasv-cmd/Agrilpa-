"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AuthStorage } from "@/lib/auth-storage"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { ProductPreview } from "@/components/product-preview"
import { ForBuyers } from "@/components/for-buyers"
import { ForProducers } from "@/components/for-producers"
import { Products } from "@/components/products"
import { SuccessStories } from "@/components/success-stories"
import { Newsletter } from "@/components/newsletter"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function ComingSoon() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false) // Disabled per user request
  const router = useRouter()

  useEffect(() => {
    window.scrollTo(0, 0)

    // Intercept password recovery links that Supabase may redirect to the home page
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      router.push(`/auth/reset-password${window.location.hash}`)
      return
    }

    const supabase = createBrowserClient()
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/auth/reset-password")
      }
    })

    const checkAuth = async () => {
      try {
        const localSession = AuthStorage.getSession()
        if (localSession) {
          console.log("[Agrilpa] Local session found")
          // Removed automatic redirect for admins to allow viewing home page
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          console.log("[Agrilpa] Supabase session found, checking profile...")

          const { data: profile } = await supabase.from("users").select("role").eq("id", session.user.id).maybeSingle()

          const role = profile?.role || "user"
          AuthStorage.setSession(session.user.id, session.user.email || "", role)

          // Removed automatic redirect for admins to allow viewing home page
        }
      } catch (err) {
        console.error("[Agrilpa] Error checking auth:", err)
      }
    }

    checkAuth()

    const checkSubscription = async () => {
      const savedEmail = localStorage.getItem("agrilpa_subscribed_email")
      if (savedEmail) {
        try {
          const response = await fetch(`/api/newsletter/subscribe?email=${encodeURIComponent(savedEmail)}`)
          const data = await response.json()
          if (data.subscribed) {
            setShowModal(false)
          }
        } catch (err) {
          console.error("[Agrilpa] Error checking subscription:", err)
        }
      }
    }
    checkSubscription()

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    console.log("[Agrilpa] Email submitted:", email)

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "landing_page",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setError("Este correo ya está registrado")
          localStorage.setItem("agrilpa_subscribed", "true")
          localStorage.setItem("agrilpa_subscribed_email", email)
          setTimeout(() => {
            setShowModal(false)
          }, 2000)
          return
        }
        throw new Error(data.error || "Error al procesar la suscripción")
      }

      setSubmitted(true)
      localStorage.setItem("agrilpa_subscribed", "true")
      localStorage.setItem("agrilpa_subscribed_email", email)

      setTimeout(() => {
        setShowModal(false)
      }, 2000)
    } catch (err) {
      console.error("[Agrilpa] Subscription error:", err)
      setError(err instanceof Error ? err.message : "Error al procesar la suscripción")
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  return (
    <div className="relative min-h-screen">
      <div className={`${showModal ? "blur-[2px] pointer-events-none" : ""} transition-all duration-500`}>
        <Navbar />
        <main>
          <Hero />
          <ProductPreview />
          <About />
          <ForBuyers />
          <ForProducers />
          <Products />
          <SuccessStories />
          <Newsletter />
        </main>
        <Footer />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseModal} />

          {/* Modal content */}
          <div className="relative z-10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
            {/* Background image */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/agricultural-field-sprayer.jpg"
                alt="Agricultural field background"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-green-800/70 to-emerald-900/80" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center px-6 py-12 md:px-12 md:py-16">
              {/* Close button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-8 w-8 text-white hover:text-white/80 transition-colors cursor-pointer" />
              </button>

              {/* Logo */}
              <div className="mb-8">
                <Image src="/agrilpa-logo-white.svg" alt="Agrilpa Logo" width={100} height={100} priority />
              </div>

              {/* Main Content */}
              <div className="text-center space-y-6">
                <div className="text-sm md:text-base font-semibold text-white/80 tracking-[0.3em] uppercase">
                  PRÓXIMAMENTE
                </div>

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  La plataforma que optimiza el <span className="text-foreground">abastecimiento agrícola</span> mundial
                </h1>

                <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl mx-auto">
                  Negocia, cotiza y cierra acuerdos en un entorno seguro y transparente.
                  <br />
                  Regístrate con tu correo y obtén acceso anticipado.
                </p>

                <form onSubmit={handleSubmit} className="max-w-xl mx-auto mt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 sm:border-2 sm:border-white/30 sm:rounded-full overflow-hidden bg-white/5 backdrop-blur-sm">
                    <Input
                      type="email"
                      placeholder="Ingresa tu correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 h-12 bg-transparent border-2 sm:border-0 border-white/30 rounded-full sm:rounded-none text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0 px-6"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitted}
                      className="w-full sm:w-auto h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full sm:m-1 whitespace-nowrap"
                    >
                      {submitted ? "¡Registrado!" : "Reserva tu lugar"}
                    </Button>
                  </div>
                  {error && (
                    <div className="mt-3 text-center text-red-300 text-sm bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg px-4 py-2">
                      {error}
                    </div>
                  )}
                </form>

                {/* Success Message */}
                {submitted && (
                  <div className="animate-fadeIn bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-6 py-3 text-white mt-4">
                    ¡Gracias! Te notificaremos cuando estemos listos para lanzar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
