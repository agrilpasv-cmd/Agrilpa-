"use client"

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode
} from "react"
import Link from "next/link"
import { Loader2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog"
import { COUNTRIES } from "@/lib/countries"
import { CountryPicker, PhoneCodePicker } from "@/components/ui/country-picker"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  emptyContactDraft,
  contactPhoneDigits,
  validateContact,
  type ContactDraft,
  type ContactErrors
} from "@/lib/contact/types"
import type { ActiveChat } from "@/components/chat/chat-context"
import s from "./product-contact.module.css"

const dialCode = (countryCode: string) =>
  COUNTRIES.find((country) => country.code === countryCode)?.phoneCode.replace(
    /\D/g,
    ""
  ) || "503"
function nationalPhone(phone: string, countryCode: string) {
  const prefix = `+${dialCode(countryCode)}`
  return phone.startsWith(prefix)
    ? contactPhoneDigits(phone.slice(prefix.length))
    : contactPhoneDigits(phone)
}
function countryForPhone(phone: string, preferred?: string) {
  const digits = phone.replace(/[^+\d]/g, "")
  if (preferred && digits.startsWith(`+${dialCode(preferred)}`))
    return preferred
  return (
    [...COUNTRIES]
      .sort(
        (a, b) =>
          b.phoneCode.replace(/\D/g, "").length -
          a.phoneCode.replace(/\D/g, "").length
      )
      .find((country) =>
        digits.startsWith(`+${country.phoneCode.replace(/\D/g, "")}`)
      )?.code ||
    preferred ||
    "SV"
  )
}

export function ProductContactDialog({
  target,
  onClose,
  onLegacy,
  currentUserId
}: {
  target: ActiveChat
  onClose: () => void
  onLegacy: () => void
  currentUserId: string | null
}) {
  const [phase, setPhase] = useState<"loading" | "form" | "error" | "auth">(
    "loading"
  )
  const [retry, setRetry] = useState(0)
  const [draft, setDraft] = useState<ContactDraft>({ ...emptyContactDraft })
  const [phoneCountry, setPhoneCountry] = useState("SV")
  const [errors, setErrors] = useState<ContactErrors>({})
  const [failure, setFailure] = useState("")
  const [modeChanged, setModeChanged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState("")
  const [submissionKey] = useState(() => crypto.randomUUID())
  const form = useRef<HTMLFormElement>(null)
  const touched = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    setPhase("loading")
    setFailure("")
    fetch("/api/contact/mode", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !["chat", "admin_form"].includes(result.mode))
          throw new Error("No pudimos comprobar el método de contacto.")
        if (controller.signal.aborted) return
        if (result.mode === "chat") {
          if (currentUserId) onLegacy()
          else setPhase("auth")
        } else {
          setPhase("form")
          setModeChanged(false)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setPhase("error")
          setFailure(error.message)
        }
      })
    return () => controller.abort()
  }, [retry, onLegacy, currentUserId])
  useEffect(() => {
    if (!currentUserId) return
    let active = true
    fetch("/api/user/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((result) => {
        if (!active || touched.current || !result?.user) return
        const user = result.user
        const country = COUNTRIES.find(
          (country) =>
            country.name.toLowerCase() ===
            String(user.country || "").toLowerCase()
        )
        let phone = String(user.phone || user.phone_number || "")
        if (phone && !phone.startsWith("+") && country)
          phone = `+${country.phoneCode.replace(/\D/g, "")} ${phone}`
        setPhoneCountry(countryForPhone(phone, country?.code))
        setDraft((previous) => ({
          ...previous,
          fullName: user.full_name || user.company_name || "",
          email: user.email || "",
          countryCode: country?.code || "",
          phone
        }))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [currentUserId])
  function update(key: keyof ContactDraft, value: string) {
    touched.current = true
    if (key === "countryCode" && value) setPhoneCountry(value)
    setDraft((previous) => {
      if (key === "countryCode") {
        const number = nationalPhone(previous.phone, phoneCountry)
        return {
          ...previous,
          countryCode: value,
          phone: value
            ? number
              ? `+${dialCode(value)} ${number}`
              : ""
            : previous.phone
        }
      }
      return { ...previous, [key]: value }
    })
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setFailure("")
  }
  function changePhoneCountry(countryCode: string) {
    const number = nationalPhone(draft.phone, phoneCountry)
    setPhoneCountry(countryCode)
    update("phone", number ? `+${dialCode(countryCode)} ${number}` : "")
  }
  function changePhone(value: string) {
    if (value.trim().startsWith("+")) {
      const international = `+${contactPhoneDigits(value)}`
      const countryCode = countryForPhone(international, phoneCountry)
      const prefix = dialCode(countryCode)
      if (!international.startsWith(`+${prefix}`)) {
        setErrors((previous) => ({
          ...previous,
          phone:
            "Selecciona el prefijo correcto y escribe solo los números del teléfono."
        }))
        return
      }
      const number = contactPhoneDigits(
        international.slice(prefix.length + 1)
      ).slice(0, 15 - prefix.length)
      setPhoneCountry(countryCode)
      update("phone", number ? `+${prefix}${number}` : "")
    } else {
      const prefix = dialCode(phoneCountry)
      const number = contactPhoneDigits(value).slice(0, 15 - prefix.length)
      update("phone", number ? `+${prefix}${number}` : "")
    }
  }
  function field(
    key: keyof ContactDraft,
    label: string,
    input: ReactNode,
    full = false,
    hint?: string
  ) {
    return (
      <div className={`${s.field} ${full ? s.full : ""}`}>
        <label htmlFor={`product-contact-${key}`}>{label}</label>
        {input}
        {hint && <small id={`product-contact-${key}-hint`}>{hint}</small>}
        {errors[key] && (
          <small
            id={`product-contact-${key}-error`}
            className={s.error}
            role="alert"
          >
            {errors[key]}
          </small>
        )}
      </div>
    )
  }
  const attributes = (key: keyof ContactDraft) => ({
    id: `product-contact-${key}`,
    name: key,
    disabled: busy,
    "aria-invalid": !!errors[key],
    required: key !== "message",
    onBlur: () =>
      setErrors((previous) => ({
        ...previous,
        [key]: validateContact(draft)[key]
      })),
    "aria-describedby":
      [
        key === "phone" ? "product-contact-phone-hint" : "",
        errors[key] ? `product-contact-${key}-error` : ""
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    "data-no-auto-caps": "true"
  })
  function focusError() {
    requestAnimationFrame(() =>
      form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()
    )
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const validation = validateContact(draft)
    setErrors(validation)
    if (Object.keys(validation).length) {
      focusError()
      return
    }
    setBusy(true)
    setFailure("")
    try {
      const response = await fetch("/api/contact/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          productId: target.product.id,
          submissionKey,
          website: new FormData(form.current!).get("website") || ""
        })
      })
      const result = await response.json()
      if (!response.ok || !result.id) {
        if (result.fields) {
          setErrors(result.fields)
          focusError()
        }
        if (result.code === "MODE_CHANGED") setModeChanged(true)
        throw new Error(
          result.error || "No pudimos enviar la consulta. Inténtalo de nuevo."
        )
      }
      setReceipt(result.id)
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "No pudimos conectar. Tus datos siguen aquí para volver a intentarlo."
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={s.dialog}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault()
        }}
      >
        <header className={s.header}>
          <div className={s.brand}>
            <img
              src="/agrilpa-logo.svg"
              alt="Agrilpa"
              width="111"
              height="34"
              className={s.logoLight}
            />
            <img
              src="/agrilpa-logo-white.svg"
              alt="Agrilpa"
              width="111"
              height="34"
              className={s.logoDark}
            />
          </div>
          <DialogTitle className={s.title}>
            {receipt
              ? "Solicitud recibida"
              : phase === "auth"
                ? "Inicia sesión para conversar"
                : "Consulta por este producto"}
          </DialogTitle>
          <DialogDescription className={s.description}>
            {receipt
              ? "El equipo de Agrilpa ya puede revisar tu consulta."
              : phase === "auth"
                ? "Usa tu cuenta de Agrilpa para hablar directamente con el vendedor."
                : "Déjanos tus datos para que el equipo de Agrilpa gestione tu consulta."}
          </DialogDescription>
          <button
            type="button"
            className={s.close}
            aria-label="Cerrar solicitud de contacto"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {phase === "loading" ? (
          <div className={s.loading} role="status">
            <Loader2 size={22} className={s.spinner} />
            <p>Preparando el contacto…</p>
          </div>
        ) : phase === "auth" ? (
          <div className={s.success}>
            <p>
              Podrás consultar por {target.product.title} y continuar la
              conversación desde Mensajes B2B.
            </p>
            <Link
              href={`/auth?redirectTo=${encodeURIComponent(`/producto/${target.product.id}`)}`}
              className={s.submit}
              onClick={onClose}
            >
              Iniciar sesión
            </Link>
            <p style={{ marginTop: 18, marginBottom: 0 }}>
              <Link
                href={`/auth?mode=register&redirectTo=${encodeURIComponent(`/producto/${target.product.id}`)}`}
                onClick={onClose}
              >
                Crear una cuenta
              </Link>
            </p>
          </div>
        ) : phase === "error" ? (
          <div className={s.body}>
            <div className={s.notice} role="alert">
              {failure}
            </div>
            <Button className={s.submit} onClick={() => setRetry((n) => n + 1)}>
              Reintentar
            </Button>
          </div>
        ) : receipt ? (
          <div className={s.success} role="status">
            <h3>Tu consulta sobre {target.product.title} está enviada.</h3>
            <p>
              El equipo de Agrilpa revisará los datos y podrá contactarte por
              correo o WhatsApp.
            </p>
            <div className={s.reference}>
              Referencia: SOL-{receipt.slice(0, 8).toUpperCase()}
            </div>
            <Button className={s.submit} onClick={onClose}>
              Listo
            </Button>
          </div>
        ) : (
          <form ref={form} className={s.form} onSubmit={submit} noValidate>
            <div className={s.body}>
              <div className={s.product}>
                <img src={target.product.image || "/placeholder.svg"} alt="" />
                <div>
                  <span>Producto de interés</span>
                  <strong>{target.product.title}</strong>
                  <span>{target.sellerName}</span>
                </div>
              </div>
              <div className={s.grid}>
                {field(
                  "fullName",
                  "Tu nombre *",
                  <Input
                    {...attributes("fullName")}
                    autoComplete="name"
                    maxLength={120}
                    value={draft.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                  />
                )}
                {field(
                  "countryCode",
                  "País *",
                  <CountryPicker
                    id="product-contact-countryCode"
                    value={
                      COUNTRIES.find(
                        (country) => country.code === draft.countryCode
                      )?.name || ""
                    }
                    onChange={(name) =>
                      update(
                        "countryCode",
                        COUNTRIES.find((country) => country.name === name)
                          ?.code || ""
                      )
                    }
                    error={!!errors.countryCode}
                    describedBy={
                      errors.countryCode
                        ? "product-contact-countryCode-error"
                        : undefined
                    }
                    disabled={busy}
                  />
                )}
                {field(
                  "email",
                  "Correo electrónico *",
                  <Input
                    {...attributes("email")}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="nombre@empresa.com"
                    maxLength={254}
                    value={draft.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                )}
                {field(
                  "phone",
                  "WhatsApp *",
                  <div className={s.phoneRow}>
                    <PhoneCodePicker
                      label={`Prefijo de WhatsApp: ${COUNTRIES.find((country) => country.code === phoneCountry)?.name || "seleccionar país"}`}
                      value={
                        COUNTRIES.find(
                          (country) => country.code === phoneCountry
                        )?.phoneCode || "503"
                      }
                      countryCode={phoneCountry}
                      onChange={(_, countryCode) =>
                        changePhoneCountry(countryCode)
                      }
                      disabled={busy}
                      describedBy={
                        errors.phone ? "product-contact-phone-error" : undefined
                      }
                    />
                    <Input
                      {...attributes("phone")}
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      pattern="[0-9]+"
                      maxLength={32}
                      value={nationalPhone(draft.phone, phoneCountry)}
                      onChange={(e) => changePhone(e.target.value)}
                      placeholder="70000000"
                    />
                  </div>,
                  false,
                  "Solo números. Selecciona el prefijo a la izquierda."
                )}
                {field(
                  "message",
                  "¿Qué necesitas? (opcional)",
                  <Textarea
                    {...attributes("message")}
                    value={draft.message}
                    onChange={(e) => update("message", e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Cantidad, destino o alguna duda sobre el producto."
                  />,
                  true
                )}
              </div>
              <div className={s.honeypot} aria-hidden="true">
                <label htmlFor="product-contact-website">Sitio web</label>
                <input
                  id="product-contact-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              {failure && (
                <div role="alert" className={s.notice}>
                  {failure}
                  {modeChanged && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setRetry((n) => n + 1)}
                      >
                        Revisar método de contacto
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <footer className={s.footer}>
              <p>
                Usaremos estos datos para gestionar esta consulta.{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacidad
                </Link>
              </p>
              <Button
                type="submit"
                className={s.submit}
                disabled={busy || modeChanged}
              >
                {busy && <Loader2 size={17} className={s.spinner} />}{" "}
                {busy ? "Enviando…" : "Enviar consulta"}
              </Button>
            </footer>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
