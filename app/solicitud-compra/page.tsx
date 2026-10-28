"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type FormEvent
} from "react"
import Link from "next/link"
import { ArrowLeft, Check, MapPin, Package, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  CountryPicker,
  PhoneCodePicker,
  COUNTRIES
} from "@/components/ui/country-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { PRODUCT_CATEGORIES } from "@/lib/constants"
import { normalizeContactPhone } from "@/lib/contact/types"
import {
  emptyPurchaseDraft,
  PURCHASE_STEPS,
  PURCHASE_UNITS,
  purchaseToday,
  validatePurchaseDraft,
  type PurchaseDraft,
  type PurchaseErrors
} from "@/lib/purchase-requests/form"
import s from "./solicitud-compra.module.css"

const originLabels: Record<string, string> = {
  cualquiera: "Local o importado",
  local: "Solo producto local",
  importado: "Solo producto importado"
}
function deliveryDate(value: string) {
  return value
    ? new Date(`${value}T12:00:00Z`).toLocaleDateString("es-SV", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/El_Salvador"
      })
    : "Fecha por definir"
}
function Field({
  id,
  label,
  error,
  hint,
  children
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className={s.field}>
      <label htmlFor={id}>
        {label} <span aria-hidden="true">*</span>
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={s.fieldError} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={s.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default function SolicitudCompraPage() {
  const supabase = useMemo(() => createClient(), [])
  const [draft, setDraft] = useState<PurchaseDraft>({ ...emptyPurchaseDraft })
  const [step, setStep] = useState(0)
  const [visited, setVisited] = useState(0)
  const [errors, setErrors] = useState<PurchaseErrors>({})
  const [account, setAccount] = useState<
    "loading" | "guest" | "ready" | "error" | "limit"
  >("loading")
  const [accountMessage, setAccountMessage] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [profilePhone, setProfilePhone] = useState("")
  const [phoneCode, setPhoneCode] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [success, setSuccess] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const submittingRef = useRef(false)

  function change(key: keyof PurchaseDraft, value: string) {
    setDraft((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setSubmitError("")
  }
  function splitPhone(value: string) {
    const digits = value.replace(/\D/g, "")
    const match = [...COUNTRIES]
      .sort(
        (a, b) =>
          b.phoneCode.replace(/\D/g, "").length -
          a.phoneCode.replace(/\D/g, "").length
      )
      .find((country) =>
        digits.startsWith(country.phoneCode.replace(/\D/g, ""))
      )
    const prefix = match?.phoneCode || ""
    return {
      prefix,
      number: prefix ? digits.slice(prefix.replace(/\D/g, "").length) : digits
    }
  }
  async function loadAccount() {
    setAccount("loading")
    try {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) {
        setAccount("guest")
        return
      }
      const response = await fetch("/api/mis-solicitudes", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store"
      })
      if (response.status === 401) {
        setAccount("guest")
        return
      }
      if (!response.ok) throw new Error("account_unavailable")
      const limits = await response.json()
      if (typeof limits.can_create !== "boolean")
        throw new Error("invalid_limits")
      const { data: profile } = await supabase
        .from("users")
        .select("email, phone")
        .eq("id", session.user.id)
        .single()
      const email = profile?.email || session.user.email || ""
      const phone = profile?.phone || ""
      setProfileEmail(email)
      setProfilePhone(phone)
      setDraft((previous) =>
        previous.contactValue ? previous : { ...previous, contactValue: email }
      )
      const parsed = splitPhone(phone)
      setPhoneCode((previous) => previous || parsed.prefix)
      setPhoneNumber((previous) => previous || parsed.number)
      if (!limits.can_create) {
        setAccountMessage(
          `Ya tienes ${limits.active_count} de ${limits.max_requests} solicitudes activas permitidas en tu plan. Revisa tus solicitudes antes de publicar otra.`
        )
        setAccount("limit")
      } else setAccount("ready")
    } catch {
      setAccount("error")
    }
  }
  useEffect(() => {
    void loadAccount()
  }, [])

  function focusStep(index: number) {
    setStep(index)
    requestAnimationFrame(() => {
      heading.current?.focus()
      heading.current?.scrollIntoView({ behavior: "instant", block: "start" })
    })
  }
  function goTo(index: number) {
    if (index <= step) {
      setErrors({})
      focusStep(index)
      return
    }
    const all = validatePurchaseDraft(draft)
    for (let current = 0; current < index; current++) {
      const invalid = PURCHASE_STEPS[current].keys.find((key) => all[key])
      if (invalid) {
        setErrors(all)
        setStep(current)
        requestAnimationFrame(() => document.getElementById(invalid)?.focus())
        return
      }
    }
    setErrors({})
    setVisited((previous) => Math.max(previous, index))
    focusStep(index)
  }
  function chooseContact(method: string) {
    change("contactMethod", method)
    if (method === "email") change("contactValue", profileEmail)
    else {
      const parsed = splitPhone(profilePhone)
      setPhoneCode(parsed.prefix)
      setPhoneNumber(parsed.number)
      change(
        "contactValue",
        `+${parsed.prefix.replace(/\D/g, "")}${parsed.number}`
      )
    }
  }
  function phoneChange(code: string, number: string) {
    setPhoneCode(code)
    setPhoneNumber(number)
    change("contactValue", `+${code.replace(/\D/g, "")}${number}`)
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submittingRef.current) return
    if (step < 3) {
      goTo(step + 1)
      return
    }
    const all = validatePurchaseDraft(draft)
    if (Object.keys(all).length) {
      setErrors(all)
      const index = PURCHASE_STEPS.findIndex((item) =>
        item.keys.some((key) => all[key])
      )
      focusStep(Math.max(index, 0))
      return
    }
    if (account !== "ready") return
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError("")
    try {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()
      if (error || !session) {
        setAccount("guest")
        setSubmitError("Tu sesión terminó. Inicia sesión antes de publicar.")
        return
      }
      const form = new FormData()
      for (const [key, value] of Object.entries(draft))
        form.append(
          key,
          key === "contactValue" && draft.contactMethod === "whatsapp"
            ? normalizeContactPhone(value)
            : value.trim()
        )
      const response = await fetch("/api/solicitud-compra", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        if (response.status === 401) setAccount("guest")
        throw new Error(
          result.error ||
            "No pudimos publicar tu pedido. Tus datos siguen aquí para reintentar."
        )
      }
      setSuccess(true)
      requestAnimationFrame(() => heading.current?.focus())
    } catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? cause.message
          : "No pudimos publicar tu pedido. Intenta de nuevo."
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }
  function props(key: keyof PurchaseDraft, hint = false) {
    return {
      id: key,
      "aria-invalid": !!errors[key],
      "aria-describedby": errors[key]
        ? `${key}-error`
        : hint
          ? `${key}-hint`
          : undefined
    }
  }
  function textInput(
    key: keyof PurchaseDraft,
    placeholder: string,
    maxLength: number,
    type = "text"
  ) {
    return (
      <Input
        {...props(key)}
        type={type}
        value={draft[key]}
        onChange={(event) => change(key, event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={s.input}
        required
        data-no-auto-caps="true"
      />
    )
  }
  function select(
    key: keyof PurchaseDraft,
    placeholder: string,
    options: Record<string, string>
  ) {
    return (
      <Select value={draft[key]} onValueChange={(value) => change(key, value)}>
        <SelectTrigger {...props(key)} className={s.input}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  function review(title: string, index: number, items: [string, string][]) {
    return (
      <section className={s.reviewSection}>
        <div className={s.reviewHeading}>
          <h3>{title}</h3>
          <Button
            type="button"
            variant="ghost"
            onClick={() => goTo(index)}
            aria-label={`Editar ${title.toLowerCase()}`}
            disabled={submitting}
          >
            Editar
          </Button>
        </div>
        <dl>
          {items.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd title={value}>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    )
  }

  if (success)
    return (
      <main className={s.page}>
        <section className={s.success}>
          <Check size={34} aria-hidden="true" />
          <h1 tabIndex={-1} ref={heading}>
            Tu pedido ya está publicado
          </h1>
          <p>
            La solicitud de <strong>{draft.productName}</strong> se guardó
            correctamente. Tendrá una vigencia de 90 días desde su publicación.
          </p>
          <div className={s.successActions}>
            <Button asChild className={s.primary}>
              <Link href="/dashboard/mis-solicitudes">Ver mis solicitudes</Link>
            </Button>
            <Button asChild variant="outline" className={s.secondary}>
              <Link href="/pedidos">Volver a pedidos</Link>
            </Button>
          </div>
        </section>
      </main>
    )

  return (
    <main className={s.page}>
      <div className={s.container} data-purchase-step={step}>
        <Link href="/pedidos" className={s.back}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a pedidos
        </Link>
        <header className={s.header}>
          <div>
            <h1>Nueva solicitud de compra</h1>
            <p>
              Describe lo que necesitas y revisa tu pedido antes de publicarlo.
            </p>
          </div>
          <span className={s.stepCount}>Paso {step + 1} de 4</span>
        </header>
        <nav aria-label="Pasos de la solicitud" className={s.steps}>
          <ol>
            {PURCHASE_STEPS.map((item, index) => (
              <li key={item.title}>
                <button
                  type="button"
                  aria-current={step === index ? "step" : undefined}
                  disabled={index > visited || submitting}
                  onClick={() => goTo(index)}
                >
                  <span className={s.stepNumber}>
                    {index < step ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        {account === "loading" && (
          <p className={s.notice} role="status">
            Estamos revisando tu cuenta y tus solicitudes activas.
          </p>
        )}
        {account === "guest" && (
          <div className={s.notice}>
            <p>
              Puedes preparar y revisar tu pedido. Necesitas iniciar sesión para
              publicarlo.
            </p>
            <Button asChild variant="outline" className={s.secondary}>
              <Link href="/auth?redirectTo=%2Fsolicitud-compra">
                Iniciar sesión
              </Link>
            </Button>
          </div>
        )}
        {account === "error" && (
          <div className={s.notice} role="alert">
            <p>
              No pudimos comprobar tu cuenta. Puedes completar los datos
              mientras reintentamos la consulta.
            </p>
            <Button
              type="button"
              variant="outline"
              className={s.secondary}
              onClick={() => void loadAccount()}
            >
              Volver a comprobar
            </Button>
          </div>
        )}
        {account === "limit" && (
          <div className={s.notice} role="alert">
            <p>{accountMessage}</p>
            <Button asChild variant="outline" className={s.secondary}>
              <Link href="/dashboard/mis-solicitudes">Ver mis solicitudes</Link>
            </Button>
          </div>
        )}
        <div className={s.workspace}>
          <form onSubmit={submit} noValidate className={s.form}>
            <div className={s.formHeading}>
              <span>Paso {step + 1}</span>
              <h2 ref={heading} tabIndex={-1}>
                {
                  [
                    "¿Qué producto necesitas?",
                    "¿Dónde lo necesitas?",
                    "Define las condiciones",
                    "Revisa tu solicitud"
                  ][step]
                }
              </h2>
              <p>
                {
                  [
                    "Indica el producto, el volumen y las características que debe cumplir.",
                    "Comparte el destino y la fecha para que los proveedores evalúen la entrega.",
                    "Indica tu presupuesto y cómo pueden contactarte.",
                    "Confirma los detalles. Puedes editar cualquier sección antes de publicar."
                  ][step]
                }
              </p>
            </div>
            <p className={s.requiredNote}>
              {step < 3
                ? "Los campos con * son obligatorios."
                : "Tu solicitud tendrá una vigencia de 90 días."}
            </p>
            {step === 0 && (
              <div className={s.fields}>
                <Field
                  id="productName"
                  label="Nombre del producto"
                  error={errors.productName}
                  hint={`${draft.productName.trim().length}/50 caracteres. Mínimo 15.`}
                >
                  <Input
                    {...props("productName", true)}
                    value={draft.productName}
                    onChange={(event) =>
                      change("productName", event.target.value)
                    }
                    placeholder="Producto, variedad y presentación"
                    minLength={15}
                    maxLength={50}
                    className={s.input}
                    required
                    data-no-auto-caps="true"
                  />
                </Field>
                <Field id="category" label="Categoría" error={errors.category}>
                  {select(
                    "category",
                    "Selecciona una categoría",
                    Object.fromEntries(
                      PRODUCT_CATEGORIES.map((value) => [value, value])
                    )
                  )}
                </Field>
                <div className={s.twoColumns}>
                  <Field
                    id="quantity"
                    label="Cantidad solicitada"
                    error={errors.quantity}
                  >
                    <Input
                      {...props("quantity")}
                      value={draft.quantity}
                      onChange={(event) => {
                        const value = event.target.value.replace(/[^0-9.]/g, "")
                        if (/^\d*\.?\d*$/.test(value)) change("quantity", value)
                      }}
                      inputMode="decimal"
                      placeholder="Cantidad"
                      maxLength={20}
                      className={s.input}
                      required
                    />
                  </Field>
                  <Field id="unit" label="Unidad de medida" error={errors.unit}>
                    {select("unit", "Unidad", PURCHASE_UNITS)}
                  </Field>
                </div>
                <Field
                  id="description"
                  label="Descripción del pedido"
                  error={errors.description}
                >
                  <Textarea
                    {...props("description")}
                    value={draft.description}
                    onChange={(event) =>
                      change("description", event.target.value)
                    }
                    placeholder="Explica el uso, la calidad o la presentación que buscas."
                    maxLength={3000}
                    rows={4}
                    className={s.textarea}
                    required
                    data-no-auto-caps="true"
                  />
                </Field>
                <Field
                  id="specs"
                  label="Especificaciones técnicas"
                  error={errors.specs}
                hint="Indica calidad, empaque o certificaciones. Si no aplica, indícalo."
                >
                  <Textarea
                    {...props("specs", true)}
                    value={draft.specs}
                    onChange={(event) => change("specs", event.target.value)}
                    placeholder="Requisitos que el producto debe cumplir"
                    maxLength={2000}
                    rows={3}
                    className={s.textarea}
                    required
                    data-no-auto-caps="true"
                  />
                </Field>
              </div>
            )}
            {step === 1 && (
              <div className={s.fields}>
                <Field
                  id="country"
                  label="País de destino"
                  error={errors.country}
                >
                  <CountryPicker
                    id="country"
                    value={draft.country}
                    onChange={(value) => change("country", value)}
                    error={!!errors.country}
                    describedBy={errors.country ? "country-error" : undefined}
                  />
                </Field>
                <Field
                  id="deliveryState"
                  label="Estado o provincia"
                  error={errors.deliveryState}
                >
                  {textInput(
                    "deliveryState",
                    "Estado, departamento o provincia",
                    100
                  )}
                </Field>
                <Field
                  id="deliveryAddress"
                  label="Dirección de entrega"
                  error={errors.deliveryAddress}
                >
                  {textInput(
                    "deliveryAddress",
                    "Dirección o punto de entrega",
                    300
                  )}
                </Field>
                <Field
                  id="desiredDate"
                  label="Fecha deseada de entrega"
                  error={errors.desiredDate}
                >
                  <Input
                    {...props("desiredDate")}
                    type="date"
                    min={purchaseToday()}
                    value={draft.desiredDate}
                    onChange={(event) =>
                      change("desiredDate", event.target.value)
                    }
                    className={s.input}
                    required
                  />
                </Field>
              </div>
            )}
            {step === 2 && (
              <div className={s.fields}>
                <Field
                  id="budget"
                  label="Presupuesto estimado en USD"
                  error={errors.budget}
                  hint="Puedes indicar un monto, un rango o escribir A convenir."
                >
                  <Input
                    {...props("budget", true)}
                    value={draft.budget}
                    onChange={(event) => change("budget", event.target.value)}
                    placeholder="Monto, rango o A convenir"
                    maxLength={120}
                    className={s.input}
                    required
                    data-no-auto-caps="true"
                  />
                </Field>
                <Field
                  id="sourceType"
                  label="Origen del producto"
                  error={errors.sourceType}
                >
                  {select("sourceType", "Selecciona el origen", originLabels)}
                </Field>
                <Field
                  id="contactMethod"
                  label="Medio de contacto"
                  error={errors.contactMethod}
                >
                  <Select
                    value={draft.contactMethod}
                    onValueChange={chooseContact}
                  >
                    <SelectTrigger
                      {...props("contactMethod")}
                      className={s.input}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Correo electrónico</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {draft.contactMethod === "email" ? (
                  <Field
                    id="contactValue"
                    label="Correo electrónico"
                    error={errors.contactValue}
                  >
                    {textInput(
                      "contactValue",
                      "nombre@empresa.com",
                      254,
                      "email"
                    )}
                  </Field>
                ) : (
                  <Field
                    id="contactValue"
                    label="Número de WhatsApp"
                    error={errors.contactValue}
                    hint="Solo números, con el prefijo de tu país."
                  >
                    <div className={s.phone}>
                      <PhoneCodePicker
                        value={phoneCode}
                        onChange={(code) => phoneChange(code, phoneNumber)}
                        label="Prefijo de WhatsApp"
                      />
                      <Input
                        {...props("contactValue", true)}
                        type="tel"
                        inputMode="numeric"
                        value={phoneNumber}
                        onChange={(event) =>
                          phoneChange(
                            phoneCode,
                            event.target.value.replace(/\D/g, "")
                          )
                        }
                        placeholder="Número de teléfono"
                        maxLength={15}
                        className={s.input}
                        required
                      />
                    </div>
                  </Field>
                )}
              </div>
            )}
            {step === 3 && (
              <div className={s.review}>
                {review("Producto", 0, [
                  ["Nombre", draft.productName],
                  ["Categoría", draft.category],
                  [
                    "Cantidad",
                    `${draft.quantity} ${PURCHASE_UNITS[draft.unit as keyof typeof PURCHASE_UNITS]}`
                  ],
                  ["Descripción", draft.description],
                  ["Especificaciones", draft.specs]
                ])}
                {review("Entrega", 1, [
                  ["País", draft.country],
                  ["Estado o provincia", draft.deliveryState],
                  ["Dirección", draft.deliveryAddress],
                  ["Fecha deseada", deliveryDate(draft.desiredDate)]
                ])}
                {review("Condiciones", 2, [
                  ["Presupuesto (USD)", draft.budget],
                  ["Origen", originLabels[draft.sourceType]],
                  [
                    draft.contactMethod === "email"
                      ? "Correo electrónico"
                      : "WhatsApp",
                    draft.contactValue
                  ]
                ])}
              </div>
            )}
            {submitError && (
              <div className={s.submitError} role="alert">
                {submitError}
              </div>
            )}
            <div className={s.actions}>
              <Button
                type="button"
                variant="outline"
                className={s.secondary}
                onClick={() => goTo(step - 1)}
                disabled={step === 0 || submitting}
              >
                Anterior
              </Button>
              {step < 3 ? (
                <Button
                  type="submit"
                  className={s.primary}
                  disabled={submitting}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  type="submit"
                  className={s.primary}
                  disabled={submitting || account !== "ready"}
                >
                  {submitting ? "Publicando…" : "Publicar pedido"}
                </Button>
              )}
            </div>
          </form>
          <aside className={s.preview} aria-label="Vista previa del pedido">
            <div className={s.previewHeading}>
              <h2>Vista previa</h2>
              <span>Se actualiza al escribir</span>
            </div>
            <div className={s.previewBody}>
              <div className={s.previewIcon}>
                <Package size={30} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <span className={s.previewCategory}>
                {draft.category || "Categoría por definir"}
              </span>
              <h3>{draft.productName || "Nombre del producto"}</h3>
              <p className={s.previewSpecs}>
                {draft.specs ||
                  draft.description ||
                  "Las características de tu pedido aparecerán aquí."}
              </p>
              <p className={s.previewDestination}>
                <MapPin size={16} aria-hidden="true" />
                {[draft.country, draft.deliveryState]
                  .filter(Boolean)
                  .join(", ") || "Destino por definir"}
              </p>
              <p className={s.previewDestination}>
                <CalendarDays size={16} aria-hidden="true" />
                {deliveryDate(draft.desiredDate)}
              </p>
              <div className={s.previewQuantity}>
                <span>Cantidad solicitada</span>
                <strong>
                  {draft.quantity || "Por definir"}
                  {draft.quantity && (
                    <small>
                      {" "}
                      {
                        PURCHASE_UNITS[
                          draft.unit as keyof typeof PURCHASE_UNITS
                        ]
                      }
                    </small>
                  )}
                </strong>
              </div>
            </div>
            <p className={s.previewNote}>
              Así se presentará tu pedido en el listado. Revisa todos los
              detalles en el último paso.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
