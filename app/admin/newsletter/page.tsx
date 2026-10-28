"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { validContactEmail } from "@/lib/contact/types"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
  AdminWorkspace,
  AdminHeader,
  AdminSearch,
  AdminNotice,
  AdminEmpty,
  AdminStatus,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  adminStyles as s
} from "@/components/admin/workspace"

interface UserRecord {
  id: string
  email: string
  full_name?: string
  company_name?: string
  role?: string
}
type RecipientMode = "all" | "selected" | "specific"
interface SendResult {
  success: boolean
  sent?: number
  failed?: number
  totalUsers?: number
  error?: string
}
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
export default function NewsletterPage() {
  const [subject, setSubject] = useState(""),
    [content, setContent] = useState("")
  const [contentMode, setContentMode] = useState<"text" | "html">("text"),
    [preview, setPreview] = useState(false)
  const [greeting, setGreeting] = useState(true),
    [recipientMode, setRecipientMode] = useState<RecipientMode>("all"),
    [email, setEmail] = useState("")
  const [users, setUsers] = useState<UserRecord[]>([]),
    [loadedUsers, setLoadedUsers] = useState(false),
    [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false),
    [confirming, setConfirming] = useState(false),
    [result, setResult] = useState<SendResult | null>(null)
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    setUsersError("")
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data))
        throw new Error(data.error || "No pudimos cargar los destinatarios.")
      setUsers(data)
      setLoadedUsers(true)
    } catch (cause) {
      setUsersError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar los destinatarios."
      )
    } finally {
      setLoadingUsers(false)
    }
  }, [])
  useEffect(() => {
    if (recipientMode === "selected" && !loadedUsers) loadUsers()
  }, [recipientMode, loadedUsers, loadUsers])
  const filtered = users.filter((user) =>
    [user.email, user.full_name, user.company_name].some((value) =>
      value
        ?.toLocaleLowerCase("es")
        .includes(search.trim().toLocaleLowerCase("es"))
    )
  )
  const recipients = users.filter((user) => selected.has(user.id))
  const summary =
    recipientMode === "all"
      ? "Todos los usuarios registrados"
      : recipientMode === "specific"
        ? email.trim() || "Correo sin completar"
        : `${selected.size} ${selected.size === 1 ? "usuario seleccionado" : "usuarios seleccionados"}`
  const canSend =
    !!subject.trim() &&
    !!content.trim() &&
    (recipientMode === "all" ||
      (recipientMode === "specific" && validContactEmail(email)) ||
      (recipientMode === "selected" && selected.size > 0)) &&
    !sending
  const contentHtml =
    contentMode === "html"
      ? content
      : escapeHtml(content).replaceAll("\n", "<br>")
  const previewDocument = useMemo(
    () =>
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'"><style>body{font-family:Arial,sans-serif;margin:24px;color:#202020;font-size:16px;line-height:1.65;overflow-wrap:anywhere}img{max-width:100%;height:auto}</style></head><body>${greeting ? "<p>Hola {{nombre_del_usuario}},</p>" : ""}<div>${contentHtml}</div></body></html>`,
    [contentHtml, greeting]
  )
  const toggle = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setConfirming(false)
  }
  const send = async () => {
    if (!canSend) return
    setConfirming(false)
    setSending(true)
    setResult(null)
    const body: Record<string, unknown> = {
      subject: subject.trim(),
      content: contentHtml,
      rawHtml: contentMode === "html",
      includeGreeting: greeting
    }
    if (recipientMode === "specific") body.specificEmail = email.trim()
    if (recipientMode === "selected")
      body.selectedEmails = recipients.map((user) => ({
        email: user.email,
        name: user.company_name || user.full_name || "Usuario"
      }))
    try {
      const response = await fetch("/api/admin/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const data = await response.json()
      if (!response.ok || !data.success)
        throw new Error(data.error || "No pudimos completar el envío.")
      setResult({
        success: true,
        sent: data.sent,
        failed: data.failed,
        totalUsers: data.totalUsers,
        error:
          Array.isArray(data.errors) && data.errors.length
            ? "Algunos destinatarios no recibieron el correo."
            : undefined
      })
    } catch (cause) {
      setResult({
        success: false,
        error:
          cause instanceof Error
            ? cause.message
            : "No pudimos enviar el correo."
      })
    } finally {
      setSending(false)
    }
  }
  return (
    <AdminWorkspace>
      <AdminHeader
        title="Newsletter"
        description="Prepara el contenido, elige los destinatarios y revisa el correo antes de enviarlo."
      />
      {result && (
        <AdminNotice error={!result.success || !!result.failed}>
          {result.success ? (
            <>
              <strong>Envío procesado.</strong>
              {typeof result.sent === "number" && (
                <p>
                  {result.sent} correos enviados
                  {typeof result.failed === "number"
                    ? `, ${result.failed} fallidos`
                    : ""}
                  .
                </p>
              )}
              {result.error && <p>{result.error}</p>}
            </>
          ) : (
            result.error
          )}
        </AdminNotice>
      )}
      <div className={s.split}>
        <div className={s.stack}>
          <Card>
            <CardHeader>
              <CardTitle>Contenido del correo</CardTitle>
              <CardDescription>
                El saludo y la plantilla de Agrilpa se añaden al realizar el
                envío.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={s.fields}>
                <div className={s.field}>
                  <label htmlFor="newsletter-subject">Asunto</label>
                  <Input
                    id="newsletter-subject"
                    data-no-auto-caps="true"
                    placeholder="Escribe el asunto del correo"
                    value={subject}
                    disabled={sending}
                    onChange={(event) => {
                      setSubject(event.target.value)
                      setConfirming(false)
                    }}
                  />
                </div>
                <div className={s.field}>
                  <label htmlFor="newsletter-content">Mensaje</label>
                  <div className={s.tabs} aria-label="Formato del mensaje">
                    <button
                      type="button"
                      aria-pressed={contentMode === "text"}
                      disabled={sending}
                      onClick={() => {
                        setContentMode("text")
                        setPreview(false)
                        setConfirming(false)
                      }}
                    >
                      Texto
                    </button>
                    <button
                      type="button"
                      aria-pressed={contentMode === "html"}
                      disabled={sending}
                      onClick={() => {
                        setContentMode("html")
                        setConfirming(false)
                      }}
                    >
                      HTML
                    </button>
                    <button
                      type="button"
                      aria-pressed={preview}
                      disabled={!content}
                      onClick={() => setPreview((previous) => !previous)}
                    >
                      {preview ? "Volver a editar" : "Vista previa"}
                    </button>
                  </div>
                  {preview ? (
                    <>
                      <p className={s.previewNote}>
                        Vista previa del contenido. El nombre se reemplaza por
                        el destinatario al enviar.
                      </p>
                      <iframe
                        title="Vista previa del contenido del newsletter"
                        className={s.previewFrame}
                        sandbox=""
                        srcDoc={previewDocument}
                      />
                    </>
                  ) : (
                    <Textarea
                      className={s.editor}
                      id="newsletter-content"
                      data-no-auto-caps="true"
                      rows={15}
                      value={content}
                      disabled={sending}
                      placeholder={
                        contentMode === "html"
                          ? "Escribe o pega el HTML de tu mensaje"
                          : "Escribe tu mensaje"
                      }
                      onChange={(event) => {
                        setContent(event.target.value)
                        setConfirming(false)
                      }}
                      style={{ resize: "vertical", fontFamily: "inherit" }}
                    />
                  )}
                </div>
                <label className={s.choice}>
                  <input
                    type="checkbox"
                    checked={greeting}
                    disabled={sending}
                    onChange={(event) => {
                      setGreeting(event.target.checked)
                      setConfirming(false)
                    }}
                  />
                  <span>
                    Incluir saludo automático con el nombre del destinatario
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
        <aside className={s.stack}>
          <Card>
            <CardHeader>
              <CardTitle>Destinatarios</CardTitle>
            </CardHeader>
            <CardContent>
              <fieldset disabled={sending} className={s.field}>
                <legend className="sr-only">
                  Elegir destinatarios del newsletter
                </legend>
                {(
                  [
                    { value: "all", label: "Todos los usuarios registrados" },
                    { value: "selected", label: "Seleccionar usuarios" },
                    { value: "specific", label: "Un correo específico" }
                  ] as { value: RecipientMode; label: string }[]
                ).map((option) => (
                  <label className={s.choice} key={option.value}>
                    <input
                      type="radio"
                      name="newsletter-recipients"
                      value={option.value}
                      checked={recipientMode === option.value}
                      onChange={() => {
                        setRecipientMode(option.value)
                        setConfirming(false)
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
                {recipientMode === "specific" && (
                  <div className={s.field}>
                    <label htmlFor="newsletter-email">
                      Correo del destinatario
                    </label>
                    <Input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setConfirming(false)
                      }}
                      placeholder="nombre@empresa.com"
                      aria-invalid={!!email && !validContactEmail(email)}
                    />
                    {!!email && !validContactEmail(email) && (
                      <p>Escribe un correo completo con dominio válido.</p>
                    )}
                  </div>
                )}
                {recipientMode === "selected" && (
                  <div>
                    {usersError && (
                      <AdminNotice error>
                        {usersError}
                        <Button variant="outline" onClick={loadUsers}>
                          Reintentar destinatarios
                        </Button>
                      </AdminNotice>
                    )}
                    {loadingUsers ? (
                      <p role="status">Cargando usuarios…</p>
                    ) : (
                      <>
                        <AdminSearch
                          value={search}
                          onChange={setSearch}
                          label="Buscar destinatarios"
                        />
                        <div className={s.filters} style={{ marginTop: 12 }}>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setSelected(
                                (previous) =>
                                  new Set([
                                    ...previous,
                                    ...filtered
                                      .filter((user) =>
                                        validContactEmail(user.email || "")
                                      )
                                      .map((user) => user.id)
                                  ])
                              )
                            }
                          >
                            Seleccionar visibles
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setSelected(new Set())}
                            disabled={!selected.size}
                          >
                            Limpiar selección
                          </Button>
                        </div>
                        <div className={s.userList}>
                          {!filtered.length ? (
                            <AdminEmpty title="No hay coincidencias" />
                          ) : (
                            filtered.map((user) => (
                              <label key={user.id}>
                                <input
                                  type="checkbox"
                                  checked={selected.has(user.id)}
                                  disabled={
                                    !validContactEmail(user.email || "")
                                  }
                                  onChange={() => toggle(user.id)}
                                  aria-label={`Seleccionar ${user.email}`}
                                />
                                <span>
                                  <span className={s.rowTitle}>
                                    {user.company_name ||
                                      user.full_name ||
                                      "Sin nombre"}
                                  </span>
                                  <span className={s.rowMeta}>
                                    {user.email || "Sin correo"}
                                  </span>
                                </span>
                                {user.role === "admin" && (
                                  <AdminStatus>Admin</AdminStatus>
                                )}
                              </label>
                            ))
                          )}
                        </div>
                        <p className={s.secondary} style={{ paddingTop: 12 }}>
                          {selected.size}{" "}
                          {selected.size === 1
                            ? "usuario seleccionado"
                            : "usuarios seleccionados"}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </fieldset>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revisión del envío</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={s.fields}>
                <div>
                  <span className={s.secondary}>Destinatarios</span>
                  <p className={s.rowTitle}>{summary}</p>
                </div>
                <div>
                  <span className={s.secondary}>Asunto</span>
                  <p className={s.rowTitle}>
                    {subject.trim() || "Sin completar"}
                  </p>
                </div>
                <p className={s.secondary}>
                  Se solicitará confirmación antes de enviar el correo.
                </p>
                <Button
                  disabled={!canSend}
                  onClick={() => {
                    setResult(null)
                    setConfirming(true)
                  }}
                >
                  {sending ? "Enviando…" : "Revisar y enviar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className={s.dialog}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envío del newsletter</AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará “{subject}” a {summary.toLocaleLowerCase("es")}. Revisa
              el contenido y los destinatarios antes de confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver a editar</AlertDialogCancel>
            <Button disabled={!canSend} onClick={send}>
              Confirmar envío
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  )
}
