"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isExpired = searchParams.get("error") === "expired"
  const supabaseRef = useRef(createBrowserClient())

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hashExpired, setHashExpired] = useState(false)
  const [error, setError] = useState(isExpired ? "El enlace ha expirado o ya ha sido utilizado." : "")
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ""))
        if (params.get("error") || params.get("error_code")) {
          setHashExpired(true)
          setError(
            params.get("error_description")?.replace(/\+/g, " ") ||
              "El enlace ha expirado o ya ha sido utilizado."
          )
        }
      }
    }

    const tokenHash = searchParams.get("token_hash")
    const type = searchParams.get("type")
    if (tokenHash && type === "recovery") {
      supabaseRef.current.auth
        .verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ error: otpError }) => {
          if (otpError) {
            setHashExpired(true)
            setError("El enlace ha expirado o ya ha sido utilizado.")
          } else {
            setHasSession(true)
          }
        })
    }

    const { data: authListener } = supabaseRef.current.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) {
          setHasSession(true)
        }
      }
    )

    async function checkAuthSession() {
      const { data } = await supabaseRef.current.auth.getSession()
      if (data?.session) {
        setHasSession(true)
      } else {
        setTimeout(async () => {
          const { data: retryData } = await supabaseRef.current.auth.getSession()
          setHasSession(!!retryData?.session)
        }, 800)
      }
    }
    checkAuthSession()

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const pwdChecks = {
    minLength: password.length >= 8,
    hasUpper: /[A-ZÁÉÍÓÚÑ]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9\s]/.test(password),
  }

  const isFormValid =
    pwdChecks.minLength &&
    pwdChecks.hasUpper &&
    pwdChecks.hasNumber &&
    pwdChecks.hasSpecial &&
    password === confirmPassword

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isFormValid) {
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.")
      } else {
        setError("Por favor cumple con todos los requisitos de seguridad para la contraseña.")
      }
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabaseRef.current.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || "Error al actualizar la contraseña. El enlace puede haber caducado.")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth?reset=success")
      }, 3500)
    } catch (err: any) {
      console.error("[Agrilpa] Reset password error:", err)
      setError("Ocurrió un error inesperado. Por favor intenta de nuevo.")
    } finally {
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

        {/* Contenido de la columna izquierda */}
        <div className="relative z-10 p-8 xl:p-12 flex flex-col h-full justify-end">
          <Link href="/" className="absolute top-8 left-8 xl:top-12 xl:left-12 text-white hover:text-gray-200 transition">
            <ArrowLeft className="w-7 h-7" />
          </Link>
          {/* Contenido inferior de la columna izquierda */}
          <div className="mt-auto pb-12">
            <div className="flex gap-8 items-end">
              <div className="flex-1">
                <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                  Tu cuenta está protegida con nosotros.
                </h2>
                <p className="text-lg text-gray-200 leading-relaxed">
                  Elige una nueva contraseña segura para seguir operando en el mercado agrícola global. Tu seguridad es nuestra prioridad.
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

          {success ? (
            <div className="space-y-6">
              <div className="bg-[#f2f8f2] border border-[#cbe5cb] rounded-2xl p-6 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-[#e1f0e2] text-primary border border-[#cbe5cb] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">¡Contraseña actualizada!</h3>
                  <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
                    Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <Link
                    href="/auth?reset=success"
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition shadow-sm text-sm"
                  >
                    Ir a Iniciar Sesión <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-xs text-muted-foreground">Redirigiendo automáticamente en unos segundos...</p>
                </div>
              </div>
            </div>
          ) : (isExpired || hashExpired) ? (
            <div className="space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Enlace expirado</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Este enlace de recuperación ha caducado o ya fue utilizado.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Por motivos de seguridad, los enlaces de recuperación tienen una vigencia de 1 hora.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <Link
                    href="/auth?mode=forgot-password"
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition shadow-sm text-sm"
                  >
                    Solicitar nuevo enlace
                  </Link>
                  <Link href="/auth" className="text-sm font-semibold text-primary hover:underline transition">
                    &larr; Volver a Iniciar Sesión
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Crear nueva contraseña</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Ingresa tu nueva contraseña para acceder a tu cuenta.
                </p>
              </div>

              {error && (
                <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                  <XCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nueva contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-muted-foreground">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground text-sm transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((p) => !p)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPwd ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirmar nueva contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-muted-foreground">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground text-sm transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((p) => !p)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirmPwd ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showConfirmPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-xs space-y-1.5 text-gray-600">
                  <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Requisitos de seguridad:
                  </p>
                  <div className={`flex items-center gap-2 ${pwdChecks.minLength ? "text-primary font-medium" : "text-gray-400"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${pwdChecks.minLength ? "text-primary" : "text-gray-300"}`} />
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pwdChecks.hasUpper ? "text-primary font-medium" : "text-gray-400"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${pwdChecks.hasUpper ? "text-primary" : "text-gray-300"}`} />
                    <span>Al menos una letra mayúscula</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pwdChecks.hasNumber ? "text-primary font-medium" : "text-gray-400"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${pwdChecks.hasNumber ? "text-primary" : "text-gray-300"}`} />
                    <span>Al menos un número</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pwdChecks.hasSpecial ? "text-primary font-medium" : "text-gray-400"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${pwdChecks.hasSpecial ? "text-primary" : "text-gray-300"}`} />
                    <span>Al menos un carácter especial (!@#$%...)</span>
                  </div>
                  {confirmPassword && (
                    <div className={`flex items-center gap-2 ${password === confirmPassword ? "text-primary font-medium" : "text-red-500"}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${password === confirmPassword ? "text-primary" : "text-red-400"}`} />
                      <span>Las contraseñas coinciden</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full bg-primary text-white font-semibold py-3.5 rounded-md hover:bg-primary/90 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm shadow-sm"
                >
                  {loading ? "Actualizando..." : "Guardar nueva contraseña"}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/auth"
                    className="text-sm font-semibold text-primary hover:underline transition cursor-pointer"
                  >
                    &larr; Volver a Iniciar Sesión
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
