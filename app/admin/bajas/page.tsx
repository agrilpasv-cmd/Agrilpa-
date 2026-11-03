"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw, Trash2, Calendar, AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
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

interface DeletionReport {
  id: string
  user_email: string
  reason: string
  custom_reason: string | null
  deleted_at: string
}

export default function BajasPage() {
  const [reports, setReports] = useState<DeletionReport[]>([])
  const [loading, setLoading] = useState(true),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false)
  const [query, setQuery] = useState(""),
    [reason, setReason] = useState("all"),
    [daysFilter, setDaysFilter] = useState<"all" | 7 | 30>("all"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set()),
    [targetIds, setTargetIds] = useState<string[]>([])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/admin/deletion-reports", {
        cache: "no-store"
      })
      const result = await response.json()
      if (!response.ok || !Array.isArray(result.reports))
        throw new Error(
          result.error || "No pudimos cargar los reportes de bajas."
        )
      setReports(result.reports)
      setLoaded(true)
      setSelected(
        (previous) =>
          new Set(
            [...previous].filter((id) =>
              result.reports.some((item: DeletionReport) => item.id === id)
            )
          )
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar los reportes de bajas."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const reasons = [
    ...new Set(reports.map((item) => item.reason).filter(Boolean))
  ].sort()

  const shown = reports.filter((item) => {
    if (daysFilter !== "all") {
      const elapsed = Date.now() - Date.parse(item.deleted_at)
      if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= daysFilter * 86400000) {
        return false
      }
    }
    return (
      (reason === "all" || item.reason === reason) &&
      [item.user_email, item.reason, item.custom_reason].some((value) =>
        value
          ?.toLocaleLowerCase("es")
          .includes(query.trim().toLocaleLowerCase("es"))
      )
    )
  })

  const counts = new Map<string, number>()
  reports.forEach((item) => {
    if (item.reason) counts.set(item.reason, (counts.get(item.reason) || 0) + 1)
  })
  const topReason = [...counts].sort((a, b) => b[1] - a[1])[0]

  const recent = (days: number) =>
    reports.filter((item) => {
      const elapsed = Date.now() - Date.parse(item.deleted_at)
      return (
        Number.isFinite(elapsed) && elapsed >= 0 && elapsed < days * 86400000
      )
    }).length

  const toggle = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const allSelected =
    shown.length > 0 && shown.every((item) => selected.has(item.id))

  const remove = async () => {
    if (!targetIds.length || busy) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/admin/deletion-reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          targetIds.length === 1 ? { id: targetIds[0] } : { ids: targetIds }
        )
      })
      const result = await response.json()
      if (!response.ok || !result.success)
        throw new Error(result.error || "No pudimos eliminar los reportes.")
      setReports((previous) =>
        previous.filter((item) => !targetIds.includes(item.id))
      )
      setSelected(
        (previous) =>
          new Set([...previous].filter((id) => !targetIds.includes(id)))
      )
      setTargetIds([])
      setNotice("Reportes seleccionados eliminados.")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos eliminar los reportes."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminWorkspace>
      <AdminHeader
        title="Reportes de bajas"
        description="Consulta los motivos declarados al eliminar una cuenta y gestiona sus reportes."
        actions={
          <Button variant="outline" onClick={fetchReports} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw size={16} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />
      {error && <AdminNotice error>{error}</AdminNotice>}
      {notice && <AdminNotice>{notice}</AdminNotice>}
      <AdminMetrics
        items={[
          {
            label: "Bajas registradas",
            value: loaded ? reports.length : null,
            hint: "Reportes de este listado",
            active: daysFilter === "all",
            onClick: () => setDaysFilter("all")
          },
          {
            label: "Últimos 7 días",
            value: loaded ? recent(7) : null,
            hint: "Según la fecha de eliminación",
            active: daysFilter === 7,
            onClick: () => setDaysFilter(7)
          },
          {
            label: "Últimos 30 días",
            value: loaded ? recent(30) : null,
            hint: "Según la fecha de eliminación",
            active: daysFilter === 30,
            onClick: () => setDaysFilter(30)
          }
        ]}
      />
      {topReason && (
        <AdminNotice>
          <span className={s.secondary}>
            Motivo más frecuente en el listado
          </span>
          <p>
            <strong>{topReason[0]}</strong> · {topReason[1]} reportes
          </p>
        </AdminNotice>
      )}
      <Card>
        <CardContent>
          <div className={s.toolbar}>
            <AdminSearch
              value={query}
              onChange={setQuery}
              label="Buscar correo, motivo o detalle"
            />
            <AdminSelect
              value={reason}
              onChange={setReason}
              label="Filtrar motivo de baja"
              options={[
                { value: "all", label: "Todos los motivos" },
                ...reasons.map((value) => ({ value, label: value }))
              ]}
            />
          </div>
          {!!selected.size && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/50 rounded-xl mb-4 border border-border">
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                {selected.size} {selected.size === 1 ? "reporte seleccionado" : "reportes seleccionados"}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setSelected(new Set())}
                  className="flex-1 sm:flex-none h-9 text-xs"
                >
                  Deseleccionar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={() => setTargetIds([...selected])}
                  className="flex-1 sm:flex-none h-9 text-xs"
                >
                  Eliminar seleccionados
                </Button>
              </div>
            </div>
          )}
          <p className={s.secondary}>
            {shown.length} reportes en la lista
            {reason !== "all" || query ? " filtrada" : ""}.
          </p>
        </CardContent>

        {loading && !loaded ? (
          <AdminEmpty title="Cargando reportes…" />
        ) : !shown.length ? (
          <AdminEmpty
            title={
              reports.length
                ? "No hay coincidencias"
                : "No hay bajas registradas"
            }
            description={
              reports.length
                ? "Cambia la búsqueda o el motivo seleccionado."
                : "Los reportes aparecerán cuando los usuarios eliminen su cuenta."
            }
          />
        ) : (
          <>
            {/* ── VISTA MÓVIL (TARJETAS TOUCH-FRIENDLY) ── */}
            <div className="md:hidden">
              {/* Barra rápida de selección múltiple */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-y border-border text-xs text-muted-foreground">
                <label className="flex items-center gap-2.5 font-medium text-foreground cursor-pointer select-none">
                  <Checkbox
                    aria-label="Seleccionar todos los reportes visibles"
                    checked={allSelected}
                    onCheckedChange={(checked) =>
                      setSelected((previous) => {
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
                  {shown.length} {shown.length === 1 ? "resultado" : "resultados"}
                </span>
              </div>

              {/* Lista de tarjetas */}
              <div className="divide-y divide-border">
                {shown.map((item) => {
                  const isChecked = selected.has(item.id)
                  return (
                    <article
                      key={item.id}
                      className={`p-4 transition-colors ${
                        isChecked
                          ? "bg-primary/[0.06] border-l-4 border-l-primary"
                          : "bg-card"
                      }`}
                    >
                      {/* Cabecera de la tarjeta: Checkbox + Correo + Botón de eliminar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="pt-0.5">
                            <Checkbox
                              aria-label={`Seleccionar reporte de ${item.user_email}`}
                              checked={isChecked}
                              onCheckedChange={() => toggle(item.id)}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-sm text-foreground break-all leading-snug block">
                              {item.user_email}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                              <Calendar size={13} className="shrink-0 text-muted-foreground/70" />
                              <span>{adminDate(item.deleted_at, true)}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Eliminar reporte de ${item.user_email}`}
                          onClick={() => setTargetIds([item.id])}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      {/* Motivo y Detalle declarado */}
                      <div className="pl-8 sm:pl-9 mt-3 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">Motivo:</span>
                          <AdminStatus>{item.reason || "Sin motivo"}</AdminStatus>
                        </div>

                        {item.custom_reason ? (
                          <div className="p-3 rounded-xl bg-muted/50 border border-border/70 text-xs text-foreground/90 break-words leading-relaxed">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                              <AlertCircle size={12} className="text-muted-foreground/80 shrink-0" />
                              <span>Detalle declarado</span>
                            </div>
                            <p className="whitespace-pre-wrap">{item.custom_reason}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/80 italic">
                            Sin detalle adicional declarado.
                          </p>
                        )}
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
                        aria-label="Seleccionar todos los reportes visibles"
                        checked={allSelected}
                        onCheckedChange={(checked) =>
                          setSelected((previous) => {
                            const next = new Set(previous)
                            shown.forEach((item) =>
                              checked ? next.add(item.id) : next.delete(item.id)
                            )
                            return next
                          })
                        }
                      />
                    </th>
                    <th scope="col">Correo</th>
                    <th scope="col">Motivo</th>
                    <th scope="col">Detalle declarado</th>
                    <th scope="col">Fecha de baja</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item.id} data-selected={selected.has(item.id)}>
                      <td>
                        <Checkbox
                          aria-label={`Seleccionar reporte de ${item.user_email}`}
                          checked={selected.has(item.id)}
                          onCheckedChange={() => toggle(item.id)}
                        />
                      </td>
                      <td style={{ overflowWrap: "anywhere" }}>
                        {item.user_email}
                      </td>
                      <td>
                        <AdminStatus>{item.reason || "Sin motivo"}</AdminStatus>
                      </td>
                      <td
                        style={{
                          minWidth: 180,
                          maxWidth: 360,
                          overflowWrap: "anywhere"
                        }}
                      >
                        {item.custom_reason || "Sin detalle adicional"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {adminDate(item.deleted_at, true)}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          aria-label={`Eliminar reporte de ${item.user_email}`}
                          onClick={() => setTargetIds([item.id])}
                        >
                          <Trash2 size={17} />
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

      <AlertDialog
        open={!!targetIds.length}
        onOpenChange={(open) => {
          if (!open && !busy) setTargetIds([])
        }}
      >
        <AlertDialogContent className={`${s.dialog} max-w-[92vw] sm:max-w-lg p-5 sm:p-6`}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetIds.length === 1
                ? "¿Eliminar reporte de baja?"
                : `¿Eliminar ${targetIds.length} reportes de baja?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción elimina los reportes seleccionados de forma
              permanente. No se podrán recuperar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel disabled={busy} className="w-full sm:w-auto h-11">Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={busy} onClick={remove} className="w-full sm:w-auto h-11">
              {busy ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  )
}
