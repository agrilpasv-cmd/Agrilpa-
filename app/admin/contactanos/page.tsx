"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw, Mail, Phone, Building2, Calendar, Eye, MessageSquare } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
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
  AdminMetrics,
  AdminSearch,
  AdminSelect,
  AdminNotice,
  AdminEmpty,
  AdminStatus,
  Button,
  Card,
  CardContent,
  adminStyles as s,
  adminDate
} from "@/components/admin/workspace"

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string
  company: string
  message: string
  user_type: string
  is_registered: boolean
  created_at: string
  is_read?: boolean
}

export default function ContactanosPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true),
    [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all")
  const [selectedMessage, setSelectedMessage] =
    useState<ContactSubmission | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false)

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    try {
      const response = await fetch("/api/admin/get-contact-submissions", {
        cache: "no-store"
      })
      const result = await response.json()
      if (!response.ok || result.error || !Array.isArray(result.data))
        throw new Error(result.error || "No pudimos cargar los mensajes.")
      setSubmissions(result.data)
      setLoaded(true)
      setError("")
      setSelectedIds(
        (previous) =>
          new Set(
            [...previous].filter((id) =>
              result.data.some((item: ContactSubmission) => item.id === id)
            )
          )
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar los mensajes."
      )
    } finally {
      if (initial) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(true)
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") fetchData()
    }, 30000)
    return () => clearInterval(timer)
  }, [fetchData])

  const shown = submissions.filter(
    (item) =>
      (filter === "all" ||
        (filter === "unread" && !item.is_read) ||
        (filter === "registered" && item.is_registered) ||
        (filter === "visitors" && !item.is_registered)) &&
      [item.name, item.email, item.company, item.message].some((value) =>
        value
          ?.toLocaleLowerCase("es")
          .includes(query.trim().toLocaleLowerCase("es"))
      )
  )

  const allSelected =
    shown.length > 0 && shown.every((item) => selectedIds.has(item.id))

  const toggle = (id: string, checked: boolean) =>
    setSelectedIds((previous) => {
      const next = new Set(previous)
      checked ? next.add(id) : next.delete(id)
      return next
    })

  const openMessage = async (item: ContactSubmission) => {
    setSelectedMessage(item)
    if (item.is_read) return
    try {
      const response = await fetch("/api/admin/contact-submissions/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id })
      })
      if (!response.ok)
        throw new Error("No pudimos marcar el mensaje como leído.")
      setSubmissions((previous) =>
        previous.map((row) =>
          row.id === item.id ? { ...row, is_read: true } : row
        )
      )
      window.dispatchEvent(new Event("update-contactanos-unread-count"))
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos actualizar el mensaje."
      )
    }
  }

  const bulk = async (action: "delete" | "mark-read" | "mark-unread") => {
    if (!selectedIds.size || busy) return
    setBusy(true)
    try {
      const response = await fetch(
        "/api/admin/contact-submissions/bulk-action",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [...selectedIds], action })
        }
      )
      if (!response.ok)
        throw new Error("No pudimos completar la acción. Vuelve a intentarlo.")
      setSubmissions((previous) =>
        action === "delete"
          ? previous.filter((item) => !selectedIds.has(item.id))
          : previous.map((item) =>
              selectedIds.has(item.id)
                ? { ...item, is_read: action === "mark-read" }
                : item
            )
      )
      setSelectedIds(new Set())
      setConfirmDelete(false)
      setError("")
      window.dispatchEvent(new Event("update-contactanos-unread-count"))
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos completar la acción."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminWorkspace>
      <AdminHeader
        title="Contáctanos"
        description="Revisa los mensajes recibidos desde el formulario de contacto de Agrilpa."
        actions={
          <div className="hidden sm:block">
            <Button
              variant="outline"
              onClick={() => fetchData(true)}
              disabled={loading}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Actualizar
            </Button>
          </div>
        }
      />
      {error && <AdminNotice error>{error}</AdminNotice>}
      <AdminMetrics
        items={[
          {
            label: "Mensajes recibidos",
            value: loaded ? submissions.length : null,
            hint: "Registros de este listado",
            active: filter === "all",
            onClick: () => setFilter("all")
          },
          {
            label: "Sin leer",
            value: loaded
              ? submissions.filter((item) => !item.is_read).length
              : null,
            hint: "Pendientes de revisión",
            active: filter === "unread",
            onClick: () => setFilter("unread")
          },
          {
            label: "De usuarios registrados",
            value: loaded
              ? submissions.filter((item) => item.is_registered).length
              : null,
            hint: "Personas con cuenta en Agrilpa",
            active: filter === "registered",
            onClick: () => setFilter("registered")
          }
        ]}
      />
      <Card>
        <CardContent>
          <div className={s.toolbar}>
            <AdminSearch
              value={query}
              onChange={setQuery}
              label="Buscar nombre, correo, empresa o mensaje"
            />
            <AdminSelect
              value={filter}
              onChange={setFilter}
              label="Filtrar mensajes de contacto"
              options={[
                { value: "all", label: "Todos los mensajes" },
                { value: "unread", label: "Sin leer" },
                { value: "registered", label: "Usuarios registrados" },
                { value: "visitors", label: "Visitantes" }
              ]}
            />
          </div>
          {!!selectedIds.size && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/50 rounded-xl mb-4 border border-border">
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                {selectedIds.size} {selectedIds.size === 1 ? "seleccionado" : "seleccionados"}
              </span>
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => bulk("mark-read")}
                  className="h-9 text-xs"
                >
                  Marcar leídos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => bulk("mark-unread")}
                  className="h-9 text-xs"
                >
                  Marcar sin leer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setSelectedIds(new Set())}
                  className="h-9 text-xs"
                >
                  Deseleccionar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                  className="h-9 text-xs"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          )}
          <p className={s.secondary}>
            {shown.length} {shown.length === 1 ? "mensaje" : "mensajes"} en la lista
            {filter !== "all" || query ? " filtrada" : ""}.
          </p>
        </CardContent>

        {loading && !loaded ? (
          <AdminEmpty title="Cargando mensajes…" />
        ) : !shown.length ? (
          <AdminEmpty
            title={
              submissions.length
                ? "No hay coincidencias"
                : "Sin mensajes recibidos"
            }
            description="Los mensajes del formulario de contacto aparecerán aquí."
          />
        ) : (
          <>
            {/* ── VISTA MÓVIL (TARJETAS TOUCH-FRIENDLY) ── */}
            <div className="md:hidden">
              {/* Barra rápida de selección múltiple */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-y border-border text-xs text-muted-foreground">
                <label className="flex items-center gap-2.5 font-medium text-foreground cursor-pointer select-none">
                  <Checkbox
                    aria-label="Seleccionar mensajes visibles"
                    checked={allSelected}
                    onCheckedChange={(checked) =>
                      setSelectedIds((previous) => {
                        const next = new Set(previous)
                        shown.forEach((item) =>
                          checked ? next.add(item.id) : next.delete(item.id)
                        )
                        return next
                      })
                    }
                  />
                  <span>Seleccionar todos</span>
                </label>
                <span className="font-medium text-foreground/75">
                  {shown.length} {shown.length === 1 ? "mensaje" : "mensajes"}
                </span>
              </div>

              {/* Lista de tarjetas */}
              <div className="divide-y divide-border">
                {shown.map((item) => {
                  const isChecked = selectedIds.has(item.id)
                  return (
                    <article
                      key={item.id}
                      className={`p-4 transition-colors ${
                        isChecked
                          ? "bg-primary/[0.06] border-l-4 border-l-primary"
                          : !item.is_read
                            ? "bg-primary/[0.03] border-l-2 border-l-amber-500"
                            : "bg-card"
                      }`}
                    >
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="pt-0.5">
                            <Checkbox
                              checked={isChecked}
                              aria-label={`Seleccionar mensaje de ${item.name}`}
                              onCheckedChange={(checked) =>
                                toggle(item.id, checked === true)
                              }
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">
                                {item.name}
                              </span>
                              <AdminStatus>
                                {item.is_read ? "Leído" : "Sin leer"}
                              </AdminStatus>
                            </div>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              {item.is_registered
                                ? "Usuario registrado"
                                : "Visitante"}
                              {item.user_type ? ` · ${item.user_type}` : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Datos de contacto */}
                      <div className="pl-8 sm:pl-9 mt-3 space-y-2">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                            <Mail size={13} className="shrink-0 text-muted-foreground/70" />
                            <a
                              href={`mailto:${item.email}`}
                              className="text-foreground hover:text-primary hover:underline truncate"
                            >
                              {item.email}
                            </a>
                          </div>

                          {item.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                              <Phone size={13} className="shrink-0 text-muted-foreground/70" />
                              <a
                                href={`tel:${item.phone}`}
                                className="text-foreground hover:text-primary hover:underline"
                              >
                                {item.phone}
                              </a>
                            </div>
                          )}

                          {item.company && (
                            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                              <Building2 size={13} className="shrink-0 text-muted-foreground/70" />
                              <span className="text-foreground truncate">{item.company}</span>
                            </div>
                          )}
                        </div>

                        {/* Vista previa del mensaje */}
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground/85 line-clamp-2 leading-relaxed">
                          {item.message}
                        </div>

                        {/* Pie de la tarjeta */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Calendar size={12} className="shrink-0" />
                            <span>{adminDate(item.created_at)}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 cursor-pointer"
                            onClick={() => openMessage(item)}
                          >
                            <Eye size={13} />
                            Ver mensaje
                          </Button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            {/* ── VISTA DESKTOP (TABLA CLÁSICA) ── */}
            <div className={`hidden md:block ${s.tableScroll}`}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">
                      <Checkbox
                        aria-label="Seleccionar mensajes visibles"
                        checked={allSelected}
                        onCheckedChange={(checked) =>
                          setSelectedIds((previous) => {
                            const next = new Set(previous)
                            shown.forEach((item) =>
                              checked ? next.add(item.id) : next.delete(item.id)
                            )
                            return next
                          })
                        }
                      />
                    </th>
                    <th scope="col">Persona</th>
                    <th scope="col">Contacto</th>
                    <th scope="col">Empresa</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item.id} data-selected={selectedIds.has(item.id)}>
                      <td>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          aria-label={`Seleccionar mensaje de ${item.name}`}
                          onCheckedChange={(checked) =>
                            toggle(item.id, checked === true)
                          }
                        />
                      </td>
                      <td>
                        <span className={s.rowTitle}>{item.name}</span>
                        <span className={s.rowMeta}>
                          {item.is_registered
                            ? "Usuario registrado"
                            : "Visitante"}
                          {item.user_type ? ` · ${item.user_type}` : ""}
                        </span>
                      </td>
                      <td>
                        <span>{item.email}</span>
                        <span className={s.rowMeta}>
                          {item.phone || "Sin teléfono"}
                        </span>
                      </td>
                      <td>{item.company || "Sin empresa"}</td>
                      <td>
                        <AdminStatus>
                          {item.is_read ? "Leído" : "Sin leer"}
                        </AdminStatus>
                      </td>
                      <td>{adminDate(item.created_at)}</td>
                      <td>
                        <Button
                          variant="outline"
                          onClick={() => openMessage(item)}
                        >
                          Ver mensaje
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => {
          if (!open) setSelectedMessage(null)
        }}
      >
        <DialogContent className={`${s.dialog} max-w-[92vw] sm:max-w-lg p-5 sm:p-6`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Mensaje de {selectedMessage?.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-primary font-medium">
              {selectedMessage?.email}
            </DialogDescription>
          </DialogHeader>
          <dl className={`${s.detailGrid} grid-cols-2 gap-3 text-xs sm:text-sm my-3`}>
            <div>
              <dt className="text-muted-foreground text-xs">Empresa</dt>
              <dd className="font-medium text-foreground">{selectedMessage?.company || "Sin empresa"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Teléfono</dt>
              <dd className="font-medium text-foreground">{selectedMessage?.phone || "Sin teléfono"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Tipo de usuario</dt>
              <dd className="font-medium text-foreground">{selectedMessage?.user_type || "Sin indicar"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Recibido</dt>
              <dd className="font-medium text-foreground">
                {selectedMessage && adminDate(selectedMessage.created_at, true)}
              </dd>
            </div>
          </dl>
          <div className={`${s.message} text-xs sm:text-sm max-h-56 overflow-y-auto leading-relaxed`}>
            {selectedMessage?.message}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            {selectedMessage?.email && (
              <Button asChild className="w-full sm:flex-1 h-11 text-xs sm:text-sm font-semibold">
                <a href={`mailto:${selectedMessage.email}?subject=Respuesta de Agrilpa`}>
                  <Mail size={15} className="mr-2" />
                  Responder por correo
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setSelectedMessage(null)}
              className="w-full sm:w-auto h-11 text-xs sm:text-sm"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!busy) setConfirmDelete(open)
        }}
      >
        <AlertDialogContent className={`${s.dialog} max-w-[92vw] sm:max-w-lg p-5 sm:p-6`}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {selectedIds.size} {selectedIds.size === 1 ? "mensaje" : "mensajes"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Los mensajes seleccionados se eliminarán permanentemente de la plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel disabled={busy} className="w-full sm:w-auto h-11">Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => bulk("delete")}
              className="w-full sm:w-auto h-11"
            >
              {busy ? "Eliminando…" : "Confirmar eliminación"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  )
}
