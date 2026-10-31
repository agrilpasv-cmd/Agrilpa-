"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { RefreshCw, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  adminDate,
} from "@/components/admin/workspace"

interface Subscription {
  id: string
  email: string
  subscribed_at: string | null
  is_active: boolean
  source: string | null
}

type StatusFilter = "all" | "active" | "inactive"

export default function SuscripcionesPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [targetDelete, setTargetDelete] = useState<Subscription | null>(null)

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  )

  const fetchSubscriptions = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true)

      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .order("subscribed_at", { ascending: false })

        if (error) {
          console.error("Error fetching subscriptions:", error)
          return
        }

        setSubscriptions(data || [])
        setLoaded(true)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  useEffect(() => {
    fetchSubscriptions(true)
    const interval = setInterval(() => fetchSubscriptions(false), 10000)
    return () => clearInterval(interval)
  }, [fetchSubscriptions])

  const confirmDelete = async () => {
    if (!targetDelete || busy) return
    setBusy(true)
    setNotice("")
    try {
      const response = await fetch("/api/admin/delete-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: targetDelete.id }),
      })

      if (!response.ok) {
        console.error("Error deleting subscription:", await response.text())
        return
      }

      setSubscriptions((prev) => prev.filter((item) => item.id !== targetDelete.id))
      setTargetDelete(null)
      setNotice("Suscripción eliminada correctamente.")
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setBusy(false)
    }
  }

  const activeCount = useMemo(
    () => subscriptions.filter((item) => item.is_active).length,
    [subscriptions],
  )
  const inactiveCount = subscriptions.length - activeCount

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es")
    return subscriptions.filter((item) => {
      if (statusFilter === "active" && !item.is_active) return false
      if (statusFilter === "inactive" && item.is_active) return false
      if (!q) return true
      return [item.email, item.source].some((val) =>
        val?.toLocaleLowerCase("es").includes(q),
      )
    })
  }, [subscriptions, statusFilter, query])

  return (
    <AdminWorkspace>
      <AdminHeader
        title="Suscripciones"
        description="Gestiona los correos registrados en el boletín y consulta el origen de cada alta."
        actions={
          <Button
            variant="outline"
            onClick={() => fetchSubscriptions(true)}
            disabled={loading}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />

      {notice && <AdminNotice>{notice}</AdminNotice>}

      <AdminMetrics
        items={[
          {
            label: "Suscriptores registrados",
            value: loaded ? subscriptions.length : null,
            hint: "Total de correos en el boletín",
            active: statusFilter === "all",
            onClick: () => setStatusFilter("all"),
          },
          {
            label: "Activos",
            value: loaded ? activeCount : null,
            hint: "Habilitados para recibir envíos",
            active: statusFilter === "active",
            onClick: () => setStatusFilter("active"),
          },
          {
            label: "Inactivos",
            value: loaded ? inactiveCount : null,
            hint: "Con baja o recepción pausada",
            active: statusFilter === "inactive",
            onClick: () => setStatusFilter("inactive"),
          },
        ]}
      />

      <Card>
        <CardContent>
          <div className={s.toolbar}>
            <AdminSearch
              value={query}
              onChange={setQuery}
              label="Buscar por correo electrónico o fuente"
            />
            <AdminSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as StatusFilter)}
              label="Filtrar estado de suscripción"
              options={[
                { value: "all", label: "Todos los estados" },
                { value: "active", label: "Activos" },
                { value: "inactive", label: "Inactivos" },
              ]}
            />
          </div>
          <p className={s.secondary}>
            {shown.length}{" "}
            {shown.length === 1 ? "suscriptor" : "suscriptores"} en la lista
            {query || statusFilter !== "all" ? " filtrada" : ""}.
          </p>
        </CardContent>

        <div className={s.tableScroll}>
          {loading && !loaded ? (
            <AdminEmpty title="Cargando suscriptores…" />
          ) : shown.length === 0 ? (
            <AdminEmpty
              title={
                subscriptions.length
                  ? "No hay coincidencias"
                  : "Todavía no hay suscriptores"
              }
              description="Los correos registrados desde el formulario del boletín aparecerán en esta tabla."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Correo electrónico</th>
                  <th>Fecha de suscripción</th>
                  <th>Estado</th>
                  <th>Fuente</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>
                      <span className={s.rowTitle}>{subscription.email}</span>
                    </td>
                    <td>
                      {subscription.subscribed_at
                        ? adminDate(subscription.subscribed_at)
                        : "-"}
                    </td>
                    <td>
                      <AdminStatus>
                        {subscription.is_active ? "Activo" : "Inactivo"}
                      </AdminStatus>
                    </td>
                    <td>{subscription.source || "Sitio web"}</td>
                    <td>
                      <div className={s.actions}>
                        <Button
                          variant="destructive"
                          disabled={busy}
                          onClick={() => setTargetDelete(subscription)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <AlertDialog
        open={Boolean(targetDelete)}
        onOpenChange={(open) => !open && setTargetDelete(null)}
      >
        <AlertDialogContent className={s.dialog}>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar suscripción</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el correo{" "}
              <strong>{targetDelete?.email}</strong> de la lista de
              suscriptores. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={busy}>
                Cancelar
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={confirmDelete}
            >
              {busy ? "Eliminando…" : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  )
}
