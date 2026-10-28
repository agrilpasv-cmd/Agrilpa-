"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw, X } from "lucide-react"
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

interface UserActivity {
  id: string
  user_id: string | null
  activity_type: string
  description: string
  path: string
  created_at: string
  user_email?: string
  user_name?: string
}
const eventLabels: Record<string, string> = {
  login: "Inicio de sesión",
  contact_whatsapp: "Contacto por WhatsApp",
  contact_email: "Contacto por correo",
  create_product: "Publicación creada",
  quote_request: "Solicitud de cotización",
  click: "Clic",
  page_view: "Vista de página"
}
export default function ActividadAdminPage() {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true),
    [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [type, setType] = useState("all")
  const [view, setView] = useState("events"),
    [user, setUser] = useState<{ id: string; name: string } | null>(null)
  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params =
        user && user.id !== "guest"
          ? `?userId=${encodeURIComponent(user.id)}`
          : ""
      const response = await fetch(`/api/admin/activities${params}`, {
        cache: "no-store"
      })
      const result = await response.json()
      if (!response.ok || !Array.isArray(result.activities))
        throw new Error(result.error || "No pudimos cargar la actividad.")
      setActivities(result.activities)
      setLoaded(true)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar la actividad."
      )
    } finally {
      setLoading(false)
    }
  }, [user])
  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])
  const base = user
    ? activities.filter((item) =>
        user.id === "guest" ? !item.user_id : item.user_id === user.id
      )
    : activities
  const shown = base.filter(
    (item) =>
      (type === "all" || item.activity_type === type) &&
      [
        item.description,
        item.user_name,
        item.user_email,
        item.activity_type,
        eventLabels[item.activity_type],
        item.path
      ].some((value) =>
        value
          ?.toLocaleLowerCase("es")
          .includes(query.trim().toLocaleLowerCase("es"))
      )
  )
  const summary = useMemo(() => {
    const groups = new Map<
      string,
      { id: string; name: string; email: string; count: number }
    >()
    for (const item of activities) {
      const id = item.user_id || "guest",
        value = groups.get(id) || {
          id,
          name: item.user_name || "Visitantes",
          email: item.user_id
            ? item.user_email || ""
            : "Eventos sin cuenta asociada",
          count: 0
        }
      value.count++
      groups.set(id, value)
    }
    return [...groups.values()].sort((a, b) => b.count - a.count)
  }, [activities])
  const chooseUser = (id: string, name: string) => {
    setUser({ id, name })
    setView("events")
    setQuery("")
    setType("all")
  }
  return (
    <AdminWorkspace>
      <AdminHeader
        title="Registro de actividad"
        description="Consulta las acciones y la navegación registradas en la plataforma."
        actions={
          <Button
            variant="outline"
            disabled={loading}
            onClick={fetchActivities}
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
            label: "Eventos consultados",
            value: loaded ? base.length : null,
            hint: "Registros de la consulta actual"
          },
          {
            label: "Usuarios con actividad",
            value: loaded
              ? new Set(base.map((item) => item.user_id).filter(Boolean)).size
              : null,
            hint: "Cuentas identificadas en esta lista"
          },
          {
            label: "Eventos de visitantes",
            value: loaded ? base.filter((item) => !item.user_id).length : null,
            hint: "Eventos sin usuario registrado, no personas únicas"
          }
        ]}
      />
      {user && (
        <AdminNotice>
          <div className={s.toolbar} style={{ marginBottom: 0 }}>
            <span>
              Actividad de <strong>{user.name}</strong>
            </span>
            <Button
              variant="outline"
              aria-label="Quitar filtro de usuario"
              onClick={() => setUser(null)}
            >
              <X size={16} aria-hidden="true" />
              Quitar filtro
            </Button>
          </div>
        </AdminNotice>
      )}
      <Card>
        <CardContent>
          <div className={s.tabs} aria-label="Vista del registro">
            <button
              type="button"
              aria-pressed={view === "events"}
              onClick={() => setView("events")}
            >
              Eventos
            </button>
            <button
              type="button"
              aria-pressed={view === "users"}
              onClick={() => setView("users")}
            >
              Por usuario
            </button>
          </div>
          {view === "events" && (
            <div className={s.toolbar}>
              <AdminSearch
                value={query}
                onChange={setQuery}
                label="Buscar persona, acción o página"
              />
              <AdminSelect
                value={type}
                onChange={setType}
                label="Filtrar tipo de evento"
                options={[
                  { value: "all", label: "Todos los eventos" },
                  ...Object.entries(eventLabels).map(([value, label]) => ({
                    value,
                    label
                  }))
                ]}
              />
            </div>
          )}
          <p className={s.secondary}>
            La consulta obtiene hasta 500 eventos recientes. Los filtros y
            recuentos corresponden a los registros cargados.
          </p>
        </CardContent>
        <div className={s.tableScroll}>
          {loading && !loaded ? (
            <AdminEmpty title="Cargando actividad…" />
          ) : view === "users" ? (
            !summary.length ? (
              <AdminEmpty title="Sin actividad registrada" />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Eventos en la consulta</th>
                    <th scope="col">Actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className={s.rowTitle}>{item.name}</span>
                        <span className={s.rowMeta}>{item.email}</span>
                      </td>
                      <td>{item.count}</td>
                      <td>
                        <Button
                          variant="outline"
                          onClick={() => chooseUser(item.id, item.name)}
                        >
                          Ver actividad
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : !shown.length ? (
            <AdminEmpty
              title="No hay eventos para mostrar"
              description="Prueba con otro filtro o actualiza el registro."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Persona</th>
                  <th scope="col">Acción</th>
                  <th scope="col">Descripción</th>
                  <th scope="col">Página</th>
                  <th scope="col">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          chooseUser(
                            item.user_id || "guest",
                            item.user_name || "Visitantes"
                          )
                        }
                        aria-label={`Ver actividad de ${item.user_name || "visitantes"}`}
                      >
                        <span style={{ textAlign: "left" }}>
                          <span className={s.rowTitle}>
                            {item.user_name || "Visitante"}
                          </span>
                          <span className={s.rowMeta}>
                            {item.user_email || "Sin cuenta asociada"}
                          </span>
                        </span>
                      </Button>
                    </td>
                    <td>
                      <AdminStatus>
                        {eventLabels[item.activity_type] ||
                          item.activity_type.replaceAll("_", " ")}
                      </AdminStatus>
                    </td>
                    <td
                      style={{
                        minWidth: 220,
                        maxWidth: 420,
                        overflowWrap: "anywhere"
                      }}
                    >
                      {item.description || "Sin descripción"}
                    </td>
                    <td style={{ maxWidth: 220, overflowWrap: "anywhere" }}>
                      {item.path || "Sin página"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {adminDate(item.created_at, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </AdminWorkspace>
  )
}
