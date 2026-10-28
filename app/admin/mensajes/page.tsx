"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Loader2 } from "lucide-react"
import { PlatformConversationsPanel } from "@/components/admin/platform-conversations"
import { ProductContactInbox } from "@/components/admin/product-contact-inbox"
import type { ProductContactMode } from "@/lib/contact/types"
import s from "@/components/admin/product-contacts.module.css"

export default function AdminMensajesPage() {
  const [tab, setTab] = useState("chats")
  const initialMode = useRef(true)
  const [settings, setSettings] = useState<{
    mode: ProductContactMode
    ready: boolean
    preview?: boolean
    updatedAt: string | null
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [unread, setUnread] = useState<number | null>(null)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    fetch("/api/admin/contact-mode", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok)
          throw new Error(
            result.error || "No pudimos cargar el modo de contacto."
          )
        if (active) {
          setSettings(result)
          if (result.preview) setNotice("Vista previa local: puedes probar ambos modos, pero las solicitudes todavía no se guardan ni envían avisos.")
          setError(result.ready ? "" : "Falta aplicar la migración de contactos en Supabase para activar el formulario y recibir solicitudes.")
          if (initialMode.current) {
            const requestedTab = new URLSearchParams(window.location.search).get("tab")
            setTab(requestedTab === "solicitudes" || result.mode === "admin_form" ? "contacts" : "chats")
            initialMode.current = false
          }
        }
      })
      .catch((error) => {
        if (active) setError(error.message)
      })
    return () => {
      active = false
    }
  }, [retry])
  async function toggle() {
    if (!settings?.ready || saving) return
    setSaving(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/admin/contact-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: settings.mode === "admin_form" ? "chat" : "admin_form",
          updatedAt: settings.updatedAt || new Date().toISOString()
        })
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 409) setRetry((n) => n + 1)
        throw new Error(result.error || "No pudimos guardar el cambio.")
      }
      setSettings(result)
      setTab(result.mode === "admin_form" ? "contacts" : "chats")
      setNotice(
        result.preview
          ? "Modo actualizado en la vista previa local. Los envíos reales siguen deshabilitados."
          : result.mode === "admin_form"
          ? "Modo formulario activado para todos los contactos nuevos."
          : "Modo chat con registro activado para los contactos nuevos."
      )
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "No pudimos guardar el cambio."
      )
    } finally {
      setSaving(false)
    }
  }
  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const next =
      event.key === "Home"
        ? "contacts"
        : event.key === "End"
          ? "chats"
          : tab === "contacts"
            ? "chats"
            : "contacts"
    setTab(next)
    document.getElementById(`${next}-tab`)?.focus()
  }
  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerIntro}>
          <h1>Mensajes</h1>
          <p>
            Gestiona las consultas de los productos y consulta los chats entre
            usuarios.
          </p>
        </div>
        <section
          className={s.mode}
          aria-label="Modo de contacto de la plataforma"
        >
          <div className={s.modeCopy}>
            <h2 id="contact-mode-label">
              Recibir contactos mediante formulario
            </h2>
            <p id="contact-mode-help">
              {settings?.mode === "admin_form"
                ? "Las consultas de productos se reciben en Solicitudes de contacto."
                : "Al contactar un producto se abre el chat directo entre usuarios."}
            </p>
          </div>
          <div className={s.modeControl}>
            <span>
              {saving
                ? "Guardando…"
                : settings
                  ? settings.mode === "admin_form"
                    ? "Formulario activo"
                    : "Chat con registro"
                  : "Cargando…"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings?.mode === "admin_form"}
              aria-labelledby="contact-mode-label"
              aria-describedby="contact-mode-help"
              disabled={!settings?.ready || saving}
              onClick={toggle}
              className={s.switch}
            >
              {saving ? (
                <Loader2 size={22} className={s.spinner} />
              ) : (
                <span className={s.track}>
                  <i />
                </span>
              )}
            </button>
          </div>
        </section>
      </header>
      {error && (
        <div className={s.notice} role="alert">
          {error}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>Reintentar</button>
        </div>
      )}
      {notice && (
        <p className={s.noticeStatus} role="status">
          {notice}
        </p>
      )}
      <div
        className={s.tabs}
        role="tablist"
        aria-label="Bandejas de mensajes"
        onKeyDown={navigateTabs}
      >
        <button
          role="tab"
          id="contacts-tab"
          aria-controls="contacts-panel"
          aria-selected={tab === "contacts"}
          tabIndex={tab === "contacts" ? 0 : -1}
          onClick={() => setTab("contacts")}
        >
          Solicitudes de contacto{" "}
          {unread != null && unread > 0 && (
            <span aria-label={`${unread} sin revisar`}>{unread}</span>
          )}
        </button>
        <button
          role="tab"
          id="chats-tab"
          aria-controls="chats-panel"
          aria-selected={tab === "chats"}
          tabIndex={tab === "chats" ? 0 : -1}
          onClick={() => setTab("chats")}
        >
          Chats entre usuarios
        </button>
      </div>
      <div
        className={s.tabpanel}
        role="tabpanel"
        id={tab === "contacts" ? "contacts-panel" : "chats-panel"}
        aria-labelledby={tab === "contacts" ? "contacts-tab" : "chats-tab"}
      >
        {tab === "contacts" ? (
          <ProductContactInbox
            onUnread={setUnread}
            mode={settings?.mode || "chat"}
          />
        ) : (
          <PlatformConversationsPanel />
        )}
      </div>
    </div>
  )
}
