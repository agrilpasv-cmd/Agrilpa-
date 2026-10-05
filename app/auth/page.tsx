"use client"

import type React from "react"
import { Suspense, useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck } from "lucide-react"
import { CountryPicker, PhoneCodePicker } from "@/components/ui/country-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { AuthStorage } from "@/lib/auth-storage"
import { trackActivity } from "@/lib/track"
import { smartCapitalize } from "@/lib/text-format"

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabaseRef = useRef(createBrowserClient())
  const [isLogin, setIsLogin] = useState(true)
  const [registrationStep, setRegistrationStep] = useState(1)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    companyName: "",
    userType: "vendedor",
    userSubType: "",
    userSubTypeOther: "",
    countryCode: "",
    phoneNumber: "",
    country: "",
    state: "",
    product1: "",
    product2: "",
    product3: "",
    supplyCountry1: "",
    supplyCountry2: "",
    supplyCountry3: "",
    providerCountry1: "",
    providerCountry2: "",
    providerCountry3: "",
    hasExportCertificates: "",
    doesProvideInternationally: "false",
    volumeRange: "",
    companyWebsite: "",
    address: "",
    howHeardAboutUs: "",
    howHeardOther: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [registrationStartTime, setRegistrationStartTime] = useState<number | null>(null)
  // Show/hide password toggles
  const [showLoginPwd, setShowLoginPwd] = useState(false)
  const [showRegPwd, setShowRegPwd] = useState(false)
  const [showRegConfirmPwd, setShowRegConfirmPwd] = useState(false)
  // Resend email cooldown
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState("")

  // Password criteria verification and security scoring
  const regPassword = formData.password || ""
  const pwdChecks = {
    minLength: regPassword.length >= 8,
    hasUpper: /[A-ZÁÉÍÓÚÑ]/.test(regPassword),
    hasNumber: /[0-9]/.test(regPassword),
    hasSpecial: /[^A-Za-z0-9\s]/.test(regPassword),
    noName: (() => {
      if (!regPassword || regPassword.length < 3) return true
      const lowerPwd = regPassword.toLowerCase()
      const nameParts = (formData.fullName || "")
        .toLowerCase()
        .split(/\s+/)
        .filter((p) => p.length >= 3)
      for (const part of nameParts) {
        if (lowerPwd.includes(part)) return false
      }
      const emailPrefix = (formData.email || "").split("@")[0]?.toLowerCase()
      if (emailPrefix && emailPrefix.length >= 3 && lowerPwd.includes(emailPrefix)) {
        return false
      }
      return true
    })(),
  }

  const strengthScore = (() => {
    if (!regPassword) return 0
    let score = 0
    if (pwdChecks.minLength) score += 1
    if (regPassword.length >= 12) score += 1
    if (pwdChecks.hasUpper) score += 1
    if (pwdChecks.hasNumber) score += 1
    if (pwdChecks.hasSpecial) score += 1
    if (!pwdChecks.noName) score = Math.max(0, score - 2)
    return Math.min(score, 4)
  })()

  const getStrengthMeta = (score: number) => {
    if (!regPassword) return { label: "Ingresa una contraseña", color: "bg-gray-200", textColor: "text-muted-foreground" }
    if (score <= 1) return { label: "Muy débil", color: "bg-red-500", textColor: "text-red-600" }
    if (score === 2) return { label: "Débil", color: "bg-orange-500", textColor: "text-orange-600" }
    if (score === 3) return { label: "Media / Aceptable", color: "bg-amber-500", textColor: "text-amber-600" }
    return { label: "Muy segura", color: "bg-primary", textColor: "text-primary font-bold" }
  }

  const strengthMeta = getStrengthMeta(strengthScore)

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
        } = await supabaseRef.current.auth.getSession()

        if (session?.user) {
          const redirectTo = searchParams.get("redirectTo") || "/"
          console.log(`[Agrilpa] User already has active session, redirecting to ${redirectTo}...`)

          // If session is active, ensure AuthStorage is synced
          const { data: profile } = await supabaseRef.current
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle()
          
          const role = profile?.role || "user"
          AuthStorage.setSession(session.user.id, session.user.email || "", role)

          // If they were trying to reach admin but aren't admin, let middleware/shell handle it
          // but for now, we just push to wherever they wanted to go
          router.push(redirectTo)
        } else {
          // If no session, clear any stale local storage to avoid "ghost" panels
          AuthStorage.clearSession()
        }
      } catch (err) {
        console.error("[Agrilpa] Error checking existing session:", err)
      }
    }

    checkExistingSession()
  }, [router, searchParams])

  useEffect(() => {
    const mode = searchParams.get("mode")
    const emailParam = searchParams.get("email")
    if (mode === "register") {
      setIsLogin(false)
      if (!registrationStartTime) setRegistrationStartTime(Date.now())
    } else if (mode === "login") {
      setIsLogin(true)
      setRegistrationStep(1)
      setRegistrationStartTime(null)
      // Pre-fill email if coming from registration
      if (emailParam) {
        setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }))
      }
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Don't auto-capitalize sensitive/technical fields
    const isSensitive =
      name === "email" ||
      name === "password" ||
      name === "confirmPassword" ||
      name === "companyWebsite" ||
      name === "phoneNumber" ||
      name === "countryCode"

    // Restringir estado y dirección a solo letras, números y espacios
    if (name === "state" || name === "address") {
      const filteredValue = value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, "")
      setFormData((prev) => ({
        ...prev,
        [name]: smartCapitalize(filteredValue),
      }))
      return
    }

    const finalVal = isSensitive ? value : smartCapitalize(value)

    setFormData((prev) => ({
      ...prev,
      [name]: finalVal,
    }))
  }

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numericValue = value.replace(/[^\d]/g, "")
    setFormData({
      ...formData,
      [name]: numericValue,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isLogin && registrationStep === 1) {
      // Validate step 1 fields
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        setError("Por favor completa los datos de tu cuenta")
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }

      if (!pwdChecks.minLength) {
        setError("La contraseña debe tener al menos 8 caracteres")
        return
      }

      if (!pwdChecks.hasUpper) {
        setError("La contraseña debe incluir al menos una letra mayúscula (A-Z)")
        return
      }

      if (!pwdChecks.hasNumber) {
        setError("La contraseña debe incluir al menos un número (0-9)")
        return
      }

      if (!pwdChecks.hasSpecial) {
        setError("La contraseña debe incluir al menos un signo o símbolo especial (ej. !@#$)")
        return
      }

      if (!pwdChecks.noName) {
        setError("Por seguridad, la contraseña no debe contener tu nombre ni tu correo")
        return
      }

      // Move to step 2
      setRegistrationStep(2)
      setError("")
      return
    }

    if (!isLogin && registrationStep === 2) {
      // Validate step 2 fields
      if (
        !formData.userType ||
        !formData.userSubType ||
        (formData.userSubType === "Otra" && !formData.userSubTypeOther) ||
        !formData.companyName ||
        !formData.country ||
        !formData.state ||
        !formData.address ||
        !formData.countryCode ||
        !formData.phoneNumber
      ) {
        setError("Por favor completa todos los campos requeridos de tu perfil comercial")
        return
      }

      // Validar que estado y dirección contengan letras o números (no solo puntos/símbolos)
      const alphanumericRegex = /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/
      if (!alphanumericRegex.test(formData.state)) {
        setError("El campo Estado / Provincia debe contener letras o números")
        return
      }
      if (!alphanumericRegex.test(formData.address)) {
        setError("La dirección debe contener letras o números")
        return
      }

      // Validate export certificates field (required)
      if (formData.hasExportCertificates === "") {
        setError("Por favor indica si posees certificados para exportar")
        return
      }

      // Move to step 3
      setRegistrationStep(3)
      setError("")
      return
    }

    if (!isLogin && registrationStep === 3) {
      // Validate step 3 fields
      if (!formData.product1 && !formData.product2 && !formData.product3) {
        setError("Por favor ingresa al menos un producto de interés")
        return
      }

      if (formData.doesProvideInternationally === "true" && !formData.providerCountry1) {
        setError("Por favor ingresa al menos un país del cual te abasteces o provees")
        return
      }

      if (!formData.volumeRange) {
        setError("Por favor selecciona tu volumen de movimiento")
        return
      }

      // All validation passed, proceed with registration
      setLoading(true)

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            companyName: formData.companyName,
            phone: `+${formData.countryCode} ${formData.phoneNumber}`,
            country: formData.country,
            state: formData.state,
            userType: formData.userType,
            userSubType: formData.userSubType,
            userSubTypeOther: formData.userSubTypeOther,
            product1: formData.product1,
            product2: formData.product2,
            product3: formData.product3,
            volumeRange: formData.volumeRange,
            companyWebsite: formData.companyWebsite,
            address: formData.address,
            supplyCountry1: formData.supplyCountry1,
            supplyCountry2: formData.supplyCountry2,
            supplyCountry3: formData.supplyCountry3,
            providerCountry1: formData.doesProvideInternationally === "true" ? formData.providerCountry1 : "",
            providerCountry2: formData.doesProvideInternationally === "true" ? formData.providerCountry2 : "",
            providerCountry3: formData.doesProvideInternationally === "true" ? formData.providerCountry3 : "",
            hasExportCertificates: formData.hasExportCertificates === "true",
            howHeardAboutUs: formData.howHeardAboutUs,
            howHeardOther: formData.howHeardOther,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Error en la autenticación")
          setLoading(false)
          return
        }

        // Registration succeeded — user must verify email before logging in
        console.log("[Agrilpa] Registration successful, email verification required")
        const duration = registrationStartTime ? Date.now() - registrationStartTime : 0
        trackActivity('login', 'Registro de nuevo usuario exitoso', { 
          email: formData.email, 
          type: formData.userType,
          onboarding_duration_ms: duration
        })
        setError("")
        setLoading(false)
        // Show a full-page confirmation message (handled below in JSX via requiresVerification state)
        setRequiresVerification(true)
      } catch (err) {
        console.error("[Agrilpa] Auth error:", err)
        setError("Error de conexión. Intenta nuevamente.")
        setLoading(false)
      }
      return
    }

    // ... existing login code ...
    setLoading(true)

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden")
        setLoading(false)
        return
      }
      if (formData.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        setLoading(false)
        return
      }
    }

    try {
      if (isLogin) {
        const { data, error: loginError } = await supabaseRef.current.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (loginError) {
          console.error("[Agrilpa] Login error:", loginError)
          setError("Credenciales inválidas")
          setLoading(false)
          return
        }

        if (!data.user) {
          setError("Error al iniciar sesión")
          setLoading(false)
          return
        }

        console.log("[Agrilpa] User logged in:", data.user.id, data.user.email)

        // Consultar el rol real del usuario en la base de datos
        const { data: profile } = await supabaseRef.current
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()

        const isAdmin = profile?.role === "admin" || data.user.email === "agrilpasv@gmail.com"
        const role = isAdmin ? "admin" : (profile?.role || "user")
        AuthStorage.setSession(data.user.id, data.user.email || "", role)

        const redirectTo = searchParams.get("redirectTo") || (isAdmin ? "/admin" : "/dashboard")
        console.log(`[Agrilpa] Login successful (role: ${role}), redirecting to ${redirectTo}`)
        
        setSubmitted(true)
        trackActivity('login', 'Inicio de sesión exitoso')
        window.location.href = redirectTo
      }
    } catch (err) {
      console.error("[Agrilpa] Auth error:", err)
      setError("Error de conexión. Intenta nuevamente.")
      setLoading(false)
    }
  }

  // Resend verification email with 60s cooldown — uses our own API endpoint
  const handleResendEmail = async () => {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setResendSuccess(false)
    setVerifyError("")
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.fullName,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setVerifyError(data.error || "No se pudo reenviar el correo. Intenta de nuevo.")
      } else {
        setResendSuccess(true)
        // Start 60-second cooldown
        setResendCooldown(60)
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch {
      setVerifyError("Error de conexión. Intenta nuevamente.")
    } finally {
      setResendLoading(false)
    }
  }

  // Check if user already verified their email and redirect
  const handleAlreadyVerified = async () => {
    setVerifyLoading(true)
    setVerifyError("")
    try {
      const { data: { session }, error: sessionError } = await supabaseRef.current.auth.getSession()
      if (session?.user) {
        // User is already logged in (verified), redirect to dashboard
        const { data: profile } = await supabaseRef.current
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()
        const role = profile?.role || "user"
        AuthStorage.setSession(session.user.id, session.user.email || "", role)
        window.location.href = role === "admin" ? "/admin" : "/dashboard"
        return
      }
      // Try signing in with stored credentials
      if (formData.password) {
        const { data, error: loginError } = await supabaseRef.current.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (!loginError && data?.user) {
          const { data: profile } = await supabaseRef.current
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle()
          const role = profile?.role || "user"
          AuthStorage.setSession(data.user.id, data.user.email || "", role)
          window.location.href = role === "admin" ? "/admin" : "/dashboard"
          return
        }
        if (loginError?.message?.toLowerCase().includes("email not confirmed")) {
          setVerifyError("Aún no has verificado tu correo. Revisa tu bandeja de entrada.")
          setVerifyLoading(false)
          return
        }
      }
      // Fallback: go to login page
      setRequiresVerification(false)
      setIsLogin(true)
    } catch {
      setVerifyError("Error al verificar. Intenta nuevamente.")
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)
    try {
      const supabase = supabaseRef.current
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
    } catch (err) {
      console.error("[Agrilpa] Google sign in error:", err)
      setError("Error de conexión al iniciar sesión con Google.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* Columna Izquierda (Imagen e información) - Oculta en móviles */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden">
        {/* Capa de fondo con imagen */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-center"
          style={{ backgroundImage: 'url("/auth-bg-vineyard.jpg")', backgroundSize: '100% 100%' }}
        />
        {/* Degradado superpuesto para oscurecer la base y resaltar el texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        
        {/* Contenido superior de la columna izquierda */}
        <div className="relative z-10 p-8 xl:p-12 flex flex-col h-full justify-end">
          <Link href="/" className="absolute top-8 left-8 xl:top-12 xl:left-12 text-white hover:text-gray-200 transition">
            <ArrowLeft className="w-7 h-7" />
          </Link>
          {/* Contenido inferior de la columna izquierda */}
          <div className="mt-auto pb-12">
            <div className="flex gap-8 items-end">
              {/* Texto a la izquierda */}
              <div className="flex-1">
                <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                  {isLogin 
                    ? "Cotiza, reserva y realiza el seguimiento de tus productos en línea." 
                    : "Conecta y expande tu negocio en el mercado agrícola global."}
                </h2>
                <p className="text-lg text-gray-200 leading-relaxed">
                  {isLogin
                    ? "Gestiona todas tus necesidades comerciales en un solo lugar. Inicia sesión para disfrutar de las ventajas del comercio digital y realiza transacciones con facilidad."
                    : "Regístrate como vendedor o comprador y comienza a expandir tu negocio agrícola en el mercado global. Es rápido, seguro y totalmente gratuito."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha (Formulario) */}
      <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto bg-white">
        <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-12 xl:px-24 max-w-2xl mx-auto w-full">
          
          {/* Logo de Agrilpa */}
          <div className="flex justify-center mb-10">
            <Link href="/" className="inline-block hover:opacity-80 transition">
              <Image src="/agrilpa-logo.svg" alt="Agrilpa Logo" width={170} height={50} />
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Volver a Inicio</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {isLogin ? "Iniciar Sesión" : "Únete a Agrilpa"}
            </h1>
            {!isLogin && (
              <p className="text-muted-foreground text-sm mt-2">
                ¿Ya tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true)
                    setRegistrationStep(1)
                    setError("")
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Inicia sesión
                </button>
              </p>
            )}
          </div>

          <div className="w-full">
            {requiresVerification ? (
              // ✅ Email verification pending screen
              <div className="text-center py-6 space-y-5">
                {/* Icon */}
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">¡Revisa tu correo!</h3>
                  <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
                    Te enviamos un enlace de verificación a{" "}
                    <strong className="text-foreground">{formData.email}</strong>.
                    Haz clic en ese enlace para activar tu cuenta e iniciar sesión.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    ¿No lo ves? Revisa la carpeta de spam o correo no deseado.
                  </p>
                </div>

                {/* Error / success feedback */}
                {verifyError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-sm mx-auto text-left">
                    ⚠ {verifyError}
                  </div>
                )}
                {resendSuccess && !verifyError && (
                  <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 max-w-sm mx-auto text-left">
                    ✓ Correo reenviado. Revisa tu bandeja de entrada.
                  </div>
                )}

                {/* CTA: Already verified */}
                <button
                  type="button"
                  onClick={handleAlreadyVerified}
                  disabled={verifyLoading}
                  className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-lg hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {verifyLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Verificando...
                    </>
                  ) : (
                    <>✓ Ya verifiqué mi correo — Entrar</>
                  )}
                </button>

                {/* CTA: Resend email with visible countdown */}
                <div className="max-w-sm mx-auto w-full space-y-2">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resendCooldown > 0 || resendLoading}
                    className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3.5 rounded-lg hover:bg-primary/5 transition disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Enviando correo...
                      </>
                    ) : (
                      <>↺ Reenviar correo de verificación</>
                    )}
                  </button>

                  {/* Countdown bar — only visible during cooldown */}
                  {resendCooldown > 0 && (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${(resendCooldown / 60) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Podrás reenviar en <span className="font-semibold text-primary">{resendCooldown}s</span>
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { setRequiresVerification(false); setIsLogin(true); }}
                  className="text-muted-foreground hover:text-foreground text-sm transition"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : !submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                )}

                {!isLogin && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div className={`flex-1 h-1 rounded-full ${registrationStep >= 2 ? "bg-primary" : "bg-gray-200"}`}></div>
                      <div className="mx-3 text-xs font-semibold text-foreground bg-gray-100 px-2 py-1 rounded-full">{registrationStep}/3</div>
                      <div className={`flex-1 h-1 rounded-full ${registrationStep >= 3 ? "bg-primary" : "bg-gray-200"}`}></div>
                    </div>
                  </div>
                )}

                {isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Correo electrónico *</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="tu@email.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Contraseña *</label>
                      <div className="relative">
                        <input
                          type={showLoginPwd ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPwd(p => !p)}
                          className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showLoginPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                       <input type="checkbox" id="remember" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                       <label htmlFor="remember" className="text-sm text-foreground cursor-pointer">Acuérdate de mí</label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-white font-semibold py-3.5 rounded-md hover:bg-primary/90 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                    >
                      {loading ? "Iniciando..." : "Iniciar Sesión"} <ArrowRight className="w-5 h-5 ml-1" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(false)
                        setRegistrationStep(1)
                        setRegistrationStartTime(Date.now())
                        setError("")
                        setFormData({
                          email: "",
                          password: "",
                          confirmPassword: "",
                          fullName: "",
                          companyName: "",
                          userType: "vendedor",
                          userSubType: "",
                          userSubTypeOther: "",
                          countryCode: "",
                          phoneNumber: "",
                          country: "",
                          state: "",
                          product1: "",
                          product2: "",
                          product3: "",
                          supplyCountry1: "",
                          supplyCountry2: "",
                          supplyCountry3: "",
                          providerCountry1: "",
                          providerCountry2: "",
                          providerCountry3: "",
                          hasExportCertificates: "",
                          doesProvideInternationally: "false",
                          volumeRange: "",
                          companyWebsite: "",
                          address: "",
                          howHeardAboutUs: "",
                          howHeardOther: "",
                        })
                      }}
                      className="w-full border-2 border-primary text-primary font-semibold py-3.5 rounded-md hover:bg-primary/5 transition flex items-center justify-center gap-2 mt-3"
                    >
                      Crear Cuenta
                    </button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-muted-foreground font-medium">O continúa con</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition font-semibold text-foreground mt-3 shadow-sm"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </button>
                  
                  </>
                )}

                {!isLogin && registrationStep === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nombre Completo *</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Juan Pérez"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Correo Electrónico *</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="tu@email.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Contraseña *</label>
                      <div className="relative">
                        <input
                          type={showRegPwd ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Mínimo 8 caracteres"
                          className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPwd(p => !p)}
                          className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showRegPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Barra Dinámica de Seguridad */}
                      {formData.password && (
                        <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Seguridad de la contraseña:</span>
                            <span className={`font-semibold ${strengthMeta.textColor}`}>
                              {strengthMeta.label}
                            </span>
                          </div>

                          {/* Segmented Progress Bar */}
                          <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                            <div className={`rounded-full transition-all duration-300 ${strengthScore >= 1 ? strengthMeta.color : "bg-gray-200"}`} />
                            <div className={`rounded-full transition-all duration-300 ${strengthScore >= 2 ? strengthMeta.color : "bg-gray-200"}`} />
                            <div className={`rounded-full transition-all duration-300 ${strengthScore >= 3 ? strengthMeta.color : "bg-gray-200"}`} />
                            <div className={`rounded-full transition-all duration-300 ${strengthScore >= 4 ? strengthMeta.color : "bg-gray-200"}`} />
                          </div>

                          {/* Requirement Checklist */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 text-xs text-muted-foreground">
                            <div className={`flex items-center gap-1.5 transition-colors ${pwdChecks.minLength ? "text-primary font-medium" : ""}`}>
                              {pwdChecks.minLength ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                </div>
                              )}
                              <span>Mínimo 8 caracteres</span>
                            </div>

                            <div className={`flex items-center gap-1.5 transition-colors ${pwdChecks.hasUpper ? "text-primary font-medium" : ""}`}>
                              {pwdChecks.hasUpper ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                </div>
                              )}
                              <span>Al menos una mayúscula (A-Z)</span>
                            </div>

                            <div className={`flex items-center gap-1.5 transition-colors ${pwdChecks.hasNumber ? "text-primary font-medium" : ""}`}>
                              {pwdChecks.hasNumber ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                </div>
                              )}
                              <span>Al menos un número (0-9)</span>
                            </div>

                            <div className={`flex items-center gap-1.5 transition-colors ${pwdChecks.hasSpecial ? "text-primary font-medium" : ""}`}>
                              {pwdChecks.hasSpecial ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                </div>
                              )}
                              <span>Un signo especial (!@#$%...)</span>
                            </div>

                            <div className={`flex items-center gap-1.5 sm:col-span-2 transition-colors ${pwdChecks.noName ? (pwdChecks.minLength ? "text-primary font-medium" : "") : "text-amber-600 font-semibold"}`}>
                              {pwdChecks.noName ? (
                                pwdChecks.minLength ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                  </div>
                                )
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                              <span>No debe contener tu nombre ni correo</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Confirmar Contraseña *</label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPwd ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPwd(p => !p)}
                          className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showRegConfirmPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary text-white font-semibold py-3.5 mt-4 rounded-md hover:bg-primary/90 transition flex items-center justify-center gap-2 uppercase"
                    >
                      CONTINUAR <ArrowRight className="w-5 h-5 ml-2" />
                    </button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-muted-foreground font-medium">O continúa con</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition font-semibold text-foreground mt-3 shadow-sm"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </button>
                  
                  </>
                )}

                {!isLogin && registrationStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-4">
                        Paso 2 de 3: Información de la Empresa
                      </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tipo de Usuario *</label>
                        <Select
                          value={formData.userType}
                          onValueChange={(val) => {
                            setFormData((prev) => ({
                              ...prev,
                              userType: val,
                              userSubType: "",
                              userSubTypeOther: "",
                            }))
                          }}
                        >
                          <SelectTrigger className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md bg-white text-foreground focus:ring-2 focus:ring-primary shadow-none mb-4">
                            <SelectValue placeholder="Selecciona el tipo de usuario" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-60 bg-white shadow-lg border border-gray-200 rounded-xl z-50">
                            <SelectItem value="vendedor">Vendedor Agrícola</SelectItem>
                            <SelectItem value="comprador">Comprador/Distribuidor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {formData.userType === "vendedor" ? "¿Qué tipo de vendedor eres? *" : "¿Qué tipo de comprador eres? *"}
                        </label>
                        <Select
                          value={formData.userSubType}
                          onValueChange={(val) => {
                            setFormData((prev) => ({
                              ...prev,
                              userSubType: val,
                            }))
                          }}
                        >
                          <SelectTrigger className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md bg-white text-foreground focus:ring-2 focus:ring-primary shadow-none mb-3">
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-60 bg-white shadow-lg border border-gray-200 rounded-xl z-50">
                            {formData.userType === "vendedor" ? (
                              <>
                                <SelectItem value="Productor agrícola / Caficultor">Productor agrícola / Caficultor</SelectItem>
                                <SelectItem value="Cooperativa agrícola">Cooperativa agrícola</SelectItem>
                                <SelectItem value="Asociación de productores">Asociación de productores</SelectItem>
                                <SelectItem value="Empresa cafetalera / Agroindustria">Empresa cafetalera / Agroindustria</SelectItem>
                                <SelectItem value="Distribuidor o comercializador local">Distribuidor o comercializador local</SelectItem>
                                <SelectItem value="Otra">Otra</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="Supermercado o cadena retail">Supermercado o cadena retail</SelectItem>
                                <SelectItem value="Distribuidor / Mayorista">Distribuidor / Mayorista</SelectItem>
                                <SelectItem value="Procesadora de alimentos">Procesadora de alimentos</SelectItem>
                                <SelectItem value="Tostador o industria de café / cacao">Tostador o industria de café / cacao</SelectItem>
                                <SelectItem value="Empresa importadora / exportadora">Empresa importadora / exportadora</SelectItem>
                                <SelectItem value="Hotel, restaurante o servicio de alimentos (HORECA)">Hotel, restaurante o servicio de alimentos (HORECA)</SelectItem>
                                <SelectItem value="Otra">Otra</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {formData.userSubType === "Otra" && (
                          <div className="animate-in fade-in zoom-in duration-300">
                            <input
                              type="text"
                              name="userSubTypeOther"
                              value={formData.userSubTypeOther}
                              onChange={handleInputChange}
                              placeholder="Especifica el tipo"
                              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nombre de la Empresa *</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            placeholder="Agro Exportaciones S.A."
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">¿Posee certificados para exportar? *</label>
                        <Select
                          value={formData.hasExportCertificates}
                          onValueChange={(val) => {
                            setFormData((prev) => ({
                              ...prev,
                              hasExportCertificates: val,
                            }))
                          }}
                        >
                          <SelectTrigger className={`w-full h-12 px-4 py-3 border rounded-md transition shadow-none ${
                            formData.hasExportCertificates === "" ? "border-amber-400 bg-amber-50" : "border-gray-300 bg-white"
                          }`}>
                            <SelectValue placeholder="Selecciona una opción..." />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-60 bg-white shadow-lg border border-gray-200 rounded-xl z-50">
                            <SelectItem value="true">Sí, tengo certificados de exportación</SelectItem>
                            <SelectItem value="false">No, no tengo certificados</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.hasExportCertificates === "" && (
                          <p className="text-xs text-amber-600 mt-1">⚠ Este campo es obligatorio</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Página web (Opcional)</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="companyWebsite"
                            value={formData.companyWebsite}
                            onChange={handleInputChange}
                            placeholder="www.tuempresa.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                          />
                        </div>
                      </div>

                      <div className="w-full react-select-container">
                        <label className="block text-sm font-medium text-foreground mb-2">País *</label>
                        <CountryPicker
                          value={formData.country}
                          syncPhoneCode
                          onChange={(countryName, phoneCode) => {
                            setFormData(prev => ({
                              ...prev,
                              country: countryName,
                              ...(phoneCode ? { countryCode: phoneCode } : {}),
                            }))
                          }}
                          placeholder="Selecciona tu país"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Estado / Provincia *</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="Ej. Antioquia, Texas, San Salvador"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Dirección de la Empresa *</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Calle Principal #123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Teléfono *</label>
                        <div className="flex gap-3">
                          <PhoneCodePicker
                            value={formData.countryCode}
                            onChange={(phoneCode) =>
                              setFormData(prev => ({ ...prev, countryCode: phoneCode }))
                            }
                            className="w-36 shrink-0"
                          />
                          <div className="flex-1">
                            <div className="relative">
                              <input
                                type="text"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handlePhoneInput}
                                inputMode="numeric"
                                placeholder="00000000"
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setRegistrationStep(1)}
                        className="flex-1 bg-white border border-gray-300 text-foreground font-semibold py-3.5 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition"
                      >
                        <ArrowLeft className="w-5 h-5 mr-1" /> ATRÁS
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !formData.userType ||
                            !formData.userSubType ||
                            (formData.userSubType === "Otra" && !formData.userSubTypeOther) ||
                            !formData.companyName ||
                            !formData.country ||
                            !formData.state ||
                            !formData.address ||
                            !formData.countryCode ||
                            !formData.phoneNumber
                          ) {
                            setError("Por favor completa los campos requeridos antes de continuar")
                            return
                          }
                          if (formData.hasExportCertificates === "") {
                            setError("Por favor indica si posees certificados para exportar")
                            return
                          }
                          setError("")
                          setRegistrationStep(3)
                        }}
                        className="flex-[2] bg-primary text-white font-semibold py-3.5 rounded-md flex items-center justify-center gap-2 hover:bg-primary/90 transition uppercase"
                      >
                        SIGUIENTE<span className="hidden sm:inline"> PASO</span> <ArrowRight className="w-5 h-5 ml-1" />
                      </button>
                    </div>
                  </div>
                )}

                {!isLogin && registrationStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-4">
                        Paso 3 de 3: Intereses y Volumen
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {formData.userType === 'vendedor' 
                          ? "Productos que Ofreces / Cultivas *" 
                          : "Productos que Buscas Comprar *"} 
                        <span className="text-muted-foreground font-normal"> (Ingresa al menos 1)</span>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          name="product1"
                          value={formData.product1}
                          onChange={handleInputChange}
                          placeholder="ej. Algodón"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                        <input
                          type="text"
                          name="product2"
                          value={formData.product2}
                          onChange={handleInputChange}
                          placeholder="ej. Mangos"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                        <input
                          type="text"
                          name="product3"
                          value={formData.product3}
                          onChange={handleInputChange}
                          placeholder="ej. Fertilizantes"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Países de interés comercial (Opcional)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          name="supplyCountry1"
                          value={formData.supplyCountry1}
                          onChange={handleInputChange}
                          placeholder="ej. México"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                        <input
                          type="text"
                          name="supplyCountry2"
                          value={formData.supplyCountry2}
                          onChange={handleInputChange}
                          placeholder="ej. Colombia"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                        <input
                          type="text"
                          name="supplyCountry3"
                          value={formData.supplyCountry3}
                          onChange={handleInputChange}
                          placeholder="ej. Guatemala"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">¿Abastecen o proveen productos de algún país? *</label>
                      <Select
                        value={formData.doesProvideInternationally}
                        onValueChange={(val) => {
                          setFormData((prev) => ({
                            ...prev,
                            doesProvideInternationally: val,
                          }))
                        }}
                      >
                        <SelectTrigger className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md bg-white text-foreground focus:ring-2 focus:ring-primary shadow-none mb-3">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 bg-white shadow-lg border border-gray-200 rounded-xl z-50">
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Sí</SelectItem>
                        </SelectContent>
                      </Select>

                      {formData.doesProvideInternationally === "true" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in zoom-in duration-300">
                          <input
                            type="text"
                            name="providerCountry1"
                            value={formData.providerCountry1}
                            onChange={handleInputChange}
                            placeholder="Ej. México *"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                            required={formData.doesProvideInternationally === "true"}
                          />
                          <input
                            type="text"
                            name="providerCountry2"
                            value={formData.providerCountry2}
                            onChange={handleInputChange}
                            placeholder="Ej. Colombia (Opcional)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                          />
                          <input
                            type="text"
                            name="providerCountry3"
                            value={formData.providerCountry3}
                            onChange={handleInputChange}
                            placeholder="Ej. Guatemala (Opcional)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Volumen de Movimiento Anual * <span className="text-muted-foreground font-normal">(USD $)</span>
                      </label>
                      <Select
                        value={formData.volumeRange}
                        onValueChange={(val) => {
                          setFormData((prev) => ({
                            ...prev,
                            volumeRange: val,
                          }))
                        }}
                      >
                        <SelectTrigger className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md bg-white text-foreground focus:ring-2 focus:ring-primary shadow-none">
                          <SelectValue placeholder="Selecciona un rango" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 bg-white shadow-lg border border-gray-200 rounded-xl z-50">
                          <SelectItem value="0-5000">De $0 a $5,000</SelectItem>
                          <SelectItem value="5001-50000">De $5,001 a $50,000</SelectItem>
                          <SelectItem value="50001-250000">De $50,001 a $250,000</SelectItem>
                          <SelectItem value="250001-500000">De $250,001 a $500,000</SelectItem>
                          <SelectItem value="500001-1000000">De $500,001 a $1,000,000</SelectItem>
                          <SelectItem value="1000000plus">Más de $1,000,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ¿Cómo se enteró de nosotros? *
                      </label>
                      <Select
                        value={formData.howHeardAboutUs}
                        onValueChange={(val) => {
                          setFormData((prev) => ({
                            ...prev,
                            howHeardAboutUs: val,
                          }))
                        }}
                      >
                        <SelectTrigger className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md bg-white text-foreground focus:ring-2 focus:ring-primary shadow-none mb-3">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 bg-white shadow-lg border border-gray-200 rounded-xl z-50">
                          <SelectItem value="ChatGPT">ChatGPT</SelectItem>
                          <SelectItem value="Google">Google</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                          <SelectItem value="Redes Sociales">Redes Sociales</SelectItem>
                          <SelectItem value="Recomendación">Recomendación</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>

                      {formData.howHeardAboutUs === "Otro" && (
                        <div className="animate-in fade-in zoom-in duration-300 mt-2">
                          <input
                            type="text"
                            name="howHeardOther"
                            value={formData.howHeardOther}
                            onChange={handleInputChange}
                            placeholder="Especifique cómo se enteró"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setRegistrationStep(2)}
                        className="flex-1 bg-white border border-gray-300 text-foreground font-semibold py-3.5 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition"
                      >
                        <ArrowLeft className="w-5 h-5 mr-1" /> ATRÁS
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] bg-primary text-white font-semibold py-3.5 flex items-center justify-center gap-2 rounded-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                      >
                        {loading ? "CREANDO..." : "REGISTRARSE"} <ArrowRight className="w-5 h-5 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">✓</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {isLogin ? "¡Bienvenido!" : "¡Registro Exitoso!"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {isLogin
                    ? "Sesión iniciada correctamente. Redirigiendo..."
                    : "Tu cuenta ha sido creada. Redirigiendo a inicio de sesión..."}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1 max-w-xs mx-auto overflow-hidden">
                  <div
                    className="bg-primary h-1 rounded-full animate-pulse"
                    style={{ animation: "pulse 1.5s ease-in-out infinite", width: "100%" }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black/50">
          <div className="text-white">Cargando...</div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  )
}
