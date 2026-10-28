"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
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
          <Button
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={loading}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />
      {error && <AdminNotice error>{error}</AdminNotice>}
      <AdminMetrics
        items={[
          {
            label: "Mensajes recibidos",
            value: loaded ? submissions.length : null,
            hint: "Registros de este listado"
          },
          {
            label: "Sin leer",
            value: loaded
              ? submissions.filter((item) => !item.is_read).length
              : null,
            hint: "Pendientes de revisión"
          },
          {
            label: "De usuarios registrados",
            value: loaded
              ? submissions.filter((item) => item.is_registered).length
              : null,
            hint: "Personas con cuenta en Agrilpa"
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
            <div className={s.toolbar}>
              <span>{selectedIds.size} seleccionados</span>
              <div className={s.filters}>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => bulk("mark-read")}
                >
                  Marcar leídos
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => bulk("mark-unread")}
                >
                  Marcar sin leer
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setSelectedIds(new Set())}
                >
                  Deseleccionar
                </Button>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                >
                  Eliminar seleccionados
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <div className={s.tableScroll}>
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
          )}
        </div>
      </Card>
      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => {
          if (!open) setSelectedMessage(null)
        }}
      >
        <DialogContent className={s.dialog}>
          <DialogHeader>
            <DialogTitle>Mensaje de {selectedMessage?.name}</DialogTitle>
            <DialogDescription>{selectedMessage?.email}</DialogDescription>
          </DialogHeader>
          <dl className={s.detailGrid}>
            <div>
              <dt>Empresa</dt>
              <dd>{selectedMessage?.company || "Sin empresa"}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{selectedMessage?.phone || "Sin teléfono"}</dd>
            </div>
            <div>
              <dt>Tipo de usuario</dt>
              <dd>{selectedMessage?.user_type || "Sin indicar"}</dd>
            </div>
            <div>
              <dt>Recibido</dt>
              <dd>
                {selectedMessage && adminDate(selectedMessage.created_at, true)}
              </dd>
            </div>
          </dl>
          <div className={s.message}>{selectedMessage?.message}</div>
          <Button variant="outline" onClick={() => setSelectedMessage(null)}>
            Cerrar mensaje
          </Button>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!busy) setConfirmDelete(open)
        }}
      >
        <AlertDialogContent className={s.dialog}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {selectedIds.size} mensajes?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Los mensajes seleccionados se eliminarán permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => bulk("delete")}
            >
              {busy ? "Eliminando…" : "Confirmar eliminación"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  )
}
