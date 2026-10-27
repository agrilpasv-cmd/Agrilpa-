"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CalendarDays, RefreshCw } from "lucide-react"
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import type {
  AdminDashboardOverview,
  AdminMetricId
} from "@/lib/admin/dashboard"
import type { DashboardDays } from "@/lib/dashboard/period"
import styles from "./dashboard.module.css"

const integer = (value: number) => new Intl.NumberFormat("es-SV").format(value)
const dayLabel = (value: string, year = false) =>
  new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" as const } : {}),
    timeZone: "America/El_Salvador"
  }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value))
const timestamp = (value: string) =>
  new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/El_Salvador"
  }).format(new Date(value))
const labels: Record<
  AdminMetricId,
  { title: string; flow: string; hint: string }
> = {
  users: {
    title: "Usuarios registrados",
    flow: "Nuevos usuarios",
    hint: "Total actual, sin administradores"
  },
  products: {
    title: "Publicaciones visibles",
    flow: "Nuevas publicaciones",
    hint: "Visibles actualmente en el catálogo"
  },
  quotations: {
    title: "Cotizaciones recibidas",
    flow: "Cotizaciones",
    hint: "Creadas en el período seleccionado"
  },
  contacts: {
    title: "Solicitudes de contacto",
    flow: "Solicitudes de contacto",
    hint: "Nuevo formulario, recibidas en el período"
  }
}
const shades = [
  "var(--primary)",
  "color-mix(in srgb, var(--primary) 65%, var(--foreground))",
  "var(--muted-foreground)",
  "color-mix(in srgb, var(--primary) 35%, var(--foreground))"
]
function comparison(current: number | null, previous: number | null) {
  if (current === null || previous === null) return "Comparación no disponible"
  const difference = current - previous
  if (difference === 0) return "Sin cambios frente al período anterior"
  if (previous === 0)
    return `${integer(difference)} más que en el período anterior`
  const percent = new Intl.NumberFormat("es-SV", {
    maximumFractionDigits: 1
  }).format((Math.abs(difference) / previous) * 100)
  return `${percent}% ${difference > 0 ? "más" : "menos"} que en el período anterior`
}
function LoadingDashboard() {
  return (
    <section
      className={styles.page}
      role="status"
      aria-label="Cargando dashboard del administrador"
    >
      <header className={styles.header}>
        <div>
          <h1>Resumen de la plataforma</h1>
          <p>Consultando la actividad de Agrilpa…</p>
        </div>
      </header>
      <div className={styles.metrics} aria-hidden="true">
        {[1, 2, 3, 4].map((value) => (
          <div
            key={value}
            className={`${styles.metric} ${styles.loadingCard}`}
          />
        ))}
      </div>
      <div
        className={`${styles.panel} ${styles.loadingChart}`}
        aria-hidden="true"
      />
    </section>
  )
}

export function AdminDashboard() {
  const [days, setDays] = useState<DashboardDays>(30)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<AdminDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [accessError, setAccessError] = useState(false)
  const lastFetch = useRef(0)
  useEffect(() => {
    const controller = new AbortController()
    let alive = true
    const timeout = setTimeout(() => controller.abort(), 30_000)
    setLoading(true)
    setError("")
    lastFetch.current = Date.now()
    fetch(`/api/admin/overview?days=${days}`, {
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) {
          if (alive)
            setAccessError(response.status === 401 || response.status === 403)
          throw new Error(
            result.error || "No pudimos consultar las métricas de Agrilpa."
          )
        }
        if (alive) {
          setData(result)
          setAccessError(false)
        }
      })
      .catch((cause) => {
        if (alive)
          setError(
            cause.name === "AbortError"
              ? "La consulta tardó más de lo esperado. Vuelve a intentarlo."
              : cause.message
          )
      })
      .finally(() => {
        clearTimeout(timeout)
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [days, revision])
  useEffect(() => {
    const refresh = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastFetch.current > 60_000
      )
        setRevision((value) => value + 1)
    }
    document.addEventListener("visibilitychange", refresh)
    return () => document.removeEventListener("visibilitychange", refresh)
  }, [])
  if (!data && loading) return <LoadingDashboard />
  if (!data || accessError)
    return (
      <section className={styles.page}>
        <div className={styles.error} role="alert">
          <h1>No pudimos cargar el dashboard</h1>
          <p>{error}</p>
          {accessError ? (
            <Link className={styles.actionLink} href="/auth?redirectTo=/admin">
              Iniciar sesión como administrador
            </Link>
          ) : (
            <Button
              className={styles.retry}
              variant="outline"
              onClick={() => setRevision((value) => value + 1)}
            >
              Volver a intentar
            </Button>
          )}
        </div>
      </section>
    )
  return (
    <AdminDashboardContent
      data={data}
      days={days}
      onDaysChange={setDays}
      onRefresh={() => setRevision((value) => value + 1)}
      loading={loading}
      error={error}
    />
  )
}

export function AdminDashboardContent({
  data,
  days,
  onDaysChange,
  onRefresh,
  loading = false,
  error = ""
}: {
  data: AdminDashboardOverview
  days: DashboardDays
  onDaysChange: (days: DashboardDays) => void
  onRefresh: () => void
  loading?: boolean
  error?: string
}) {
  const [selected, setSelected] = useState<AdminMetricId>("users")
  const points = data.series[selected]
  const total = points?.reduce((sum, point) => sum + point.current, 0) ?? null
  const previous =
    points?.reduce((sum, point) => sum + point.previous, 0) ?? null
  const hasActivity = points?.some(
    (point) => point.current > 0 || point.previous > 0
  )
  const quoteTotal =
    data.quotationStatuses?.reduce((sum, item) => sum + item.value, 0) ?? null
  return (
    <section
      className={styles.page}
      aria-label="Dashboard del administrador"
      aria-busy={loading}
    >
      <header className={styles.header}>
        <div>
          <h1>Resumen de la plataforma</h1>
          <p>Usuarios, catálogo y oportunidades de negocio en Agrilpa.</p>
        </div>
        <p className={styles.updated}>
          Actualizado el {timestamp(data.generatedAt)}
        </p>
      </header>
      <div className={styles.toolbar}>
        <div className={styles.period}>
          <CalendarDays size={18} aria-hidden="true" />
          <span>
            {dayLabel(data.period.start)} al {dayLabel(data.period.end, true)}
          </span>
        </div>
        <div className={styles.controls}>
          <Select
            value={String(days)}
            onValueChange={(value) =>
              onDaysChange(Number(value) as DashboardDays)
            }
          >
            <SelectTrigger
              className={styles.periodSelect}
              aria-label="Período de las métricas"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[7, 30, 90].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  Últimos {value} días
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className={styles.refresh}
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Actualizar métricas"
          >
            <RefreshCw size={17} aria-hidden="true" />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>
      <p className={styles.periodNote}>
        Las altas se comparan con los {data.period.days} días anteriores, hasta
        la misma hora. Fechas de El Salvador.
      </p>
      {loading && (
        <p role="status" className={styles.notice}>
          {data.period.days === days
            ? "Actualizando métricas…"
            : `Consultando los últimos ${days} días. Mientras tanto, se muestran los datos de ${data.period.days} días indicados arriba.`}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.errorNotice}>
          {error} Se conservan los datos del {timestamp(data.generatedAt)}.
        </p>
      )}
      {!!data.warnings.length && (
        <div className={styles.notice} role="status">
          <strong>Algunos datos no están disponibles.</strong>
          <ul>
            {data.warnings.map((item) => (
              <li key={item.source}>{item.message}</li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.metrics}>
        {data.metrics.map((metric) => (
          <article
            className={styles.metric}
            key={metric.id}
            data-metric={metric.id}
          >
            <h2>{labels[metric.id].title}</h2>
            <p
              className={styles.metricValue}
              data-unavailable={metric.value === null}
            >
              {metric.value === null ? "No disponible" : integer(metric.value)}
            </p>
            <p className={styles.metricHint}>{labels[metric.id].hint}</p>
            <div className={styles.metricBottom}>
              <div>
                {(metric.id === "users" || metric.id === "products") &&
                  metric.current !== null && (
                    <p className={styles.newCount}>
                      {integer(metric.current)}{" "}
                      {metric.id === "users"
                        ? metric.current === 1
                          ? "alta"
                          : "altas"
                        : metric.current === 1
                          ? "creada"
                          : "creadas"}{" "}
                      en el período
                    </p>
                  )}
                <p className={styles.comparison}>
                  {comparison(metric.current, metric.previous)}
                </p>
              </div>
              {metric.history && metric.history.length > 1 && (
                <div className={styles.sparkline} aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={metric.history.map((value) => ({ value }))}
                    >
                      <Line
                        dataKey="value"
                        stroke="var(--primary)"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className={styles.mainColumns}>
        <article
          className={styles.panel}
          aria-labelledby="admin-activity-title"
        >
          <div className={styles.panelHeader}>
            <div>
              <h2 id="admin-activity-title">Evolución de la actividad</h2>
              <p>Registros diarios, comparados con el período anterior.</p>
            </div>
            <Select
              value={selected}
              onValueChange={(value) => setSelected(value as AdminMetricId)}
            >
              <SelectTrigger
                className={styles.seriesSelect}
                aria-label="Métrica de la gráfica"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(labels).map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label.flow}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={styles.chartSummary}>
            <strong>{total === null ? "No disponible" : integer(total)}</strong>
            <span>
              {labels[selected].flow.toLocaleLowerCase("es")} en el período
            </span>
          </div>
          <p className={styles.comparison}>{comparison(total, previous)}</p>
          {points && hasActivity ? (
            <>
              <div className={styles.legend}>
                <span>
                  <i />
                  Período seleccionado
                </span>
                <span>
                  <i className={styles.previousKey} />
                  Período anterior
                </span>
              </div>
              <div
                className={styles.activityChart}
                aria-label={`Gráfica de ${labels[selected].flow.toLocaleLowerCase("es")}. Los valores completos están en Ver datos diarios.`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={points}
                    accessibilityLayer
                    margin={{ top: 12, right: 12, bottom: 0, left: -18 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="3 4"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => dayLabel(value)}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={34}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickMargin={12}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        const point = payload?.[0]?.payload as
                          | NonNullable<typeof points>[number]
                          | undefined
                        return active && point ? (
                          <div className={styles.tooltip}>
                            <strong>{dayLabel(point.date, true)}</strong>
                            <p>Seleccionado: {integer(point.current)}</p>
                            <p>
                              {dayLabel(point.previousDate)}:{" "}
                              {integer(point.previous)}
                            </p>
                          </div>
                        ) : null
                      }}
                    />
                    <Area
                      dataKey="current"
                      name="Período seleccionado"
                      fill="color-mix(in srgb, var(--primary) 7%, transparent)"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      isAnimationActive={false}
                    />
                    <Line
                      dataKey="previous"
                      name="Período anterior"
                      stroke="var(--muted-foreground)"
                      strokeDasharray="5 5"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className={styles.chartEmpty}>
              <h3>
                {points
                  ? "Sin actividad en estos períodos"
                  : "Esta métrica no está disponible"}
              </h3>
              <p>
                {points
                  ? "Prueba con un período más amplio para revisar otros registros."
                  : "Los datos aparecerán cuando se pueda consultar esta fuente."}
              </p>
            </div>
          )}
          {points && (
            <details className={styles.dataTable}>
              <summary>Ver datos diarios</summary>
              <div>
                <table>
                  <caption>{labels[selected].flow}: comparación diaria</caption>
                  <thead>
                    <tr>
                      <th scope="col">Fecha</th>
                      <th scope="col">Registros</th>
                      <th scope="col">Fecha anterior</th>
                      <th scope="col">Registros anteriores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((point) => (
                      <tr key={point.date}>
                        <th scope="row">{dayLabel(point.date)}</th>
                        <td>{integer(point.current)}</td>
                        <td>{dayLabel(point.previousDate)}</td>
                        <td>{integer(point.previous)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </article>
        <aside
          className={`${styles.panel} ${styles.pending}`}
          aria-labelledby="admin-pending-title"
        >
          <div className={styles.panelHeader}>
            <div>
              <h2 id="admin-pending-title">Pendientes de atención</h2>
              <p>Estado actual, sin filtro de fecha.</p>
            </div>
          </div>
          <div className={styles.pendingList}>
            {data.pending.map((item) => (
              <Link
                href={item.href}
                key={item.id}
                className={styles.pendingLink}
              >
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <span className={styles.pendingCount}>
                  {item.value === null ? (
                    <small>No disponible</small>
                  ) : (
                    integer(item.value)
                  )}
                </span>
              </Link>
            ))}
          </div>
          <div className={styles.pendingFooter}>
            <p>Revisa las solicitudes y conversaciones desde tu bandeja.</p>
            <Link className={styles.actionLink} href="/admin/mensajes">
              Ir a mensajes
            </Link>
          </div>
        </aside>
      </div>
      <div className={styles.distributions}>
        <article className={styles.panel} aria-labelledby="admin-quotes-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="admin-quotes-title">Cotizaciones en la plataforma</h2>
              <p>Todas las registradas, según su estado actual.</p>
            </div>
          </div>
          {quoteTotal !== null && quoteTotal > 0 && data.quotationStatuses ? (
            <>
              <div className={styles.donut}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.quotationStatuses}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={74}
                      outerRadius={98}
                      paddingAngle={0}
                      stroke="var(--background)"
                      strokeWidth={3}
                      isAnimationActive={false}
                    >
                      {data.quotationStatuses.map((item, index) => (
                        <Cell
                          key={item.label}
                          fill={shades[index % shades.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.donutCenter}>
                  <strong>{integer(quoteTotal)}</strong>
                  <span>cotizaciones</span>
                </div>
              </div>
              <ul className={styles.statusList}>
                {data.quotationStatuses.map((item, index) => (
                  <li key={item.label}>
                    <span>
                      <i
                        style={{ background: shades[index % shades.length] }}
                        aria-hidden="true"
                      />
                      {item.label}
                    </span>
                    <strong>{integer(item.value)}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.empty}>
              {quoteTotal === null
                ? "No se pudieron consultar las cotizaciones."
                : "Todavía no hay cotizaciones registradas."}
            </p>
          )}
          <Link href="/admin/cotizaciones" className={styles.textLink}>
            Gestionar cotizaciones
          </Link>
        </article>
        <Distribution
          title="La comunidad de Agrilpa"
          description="Tipo de cuenta declarado por los usuarios actuales."
          items={data.community}
          href="/admin/usuarios"
          linkLabel="Gestionar usuarios"
          unavailable="No se pudieron consultar los tipos de cuenta."
        />
        <Distribution
          title="Origen de los registros"
          description="Cómo conocieron Agrilpa, según su perfil."
          items={data.acquisition}
          unavailable="No se pudieron consultar los orígenes de los registros."
        />
      </div>
      <p className={styles.footerNote}>
        Fuente: registros guardados en Agrilpa. Usuarios y comunidad excluyen
        cuentas de administrador. Las publicaciones se cuentan aunque después se
        oculten; el total visible refleja el catálogo actual.
      </p>
    </section>
  )
}

function Distribution({
  title,
  description,
  items,
  href,
  linkLabel,
  unavailable
}: {
  title: string
  description: string
  items: { label: string; value: number }[] | null
  href?: string
  linkLabel?: string
  unavailable: string
}) {
  const sorted = items ? [...items].sort((a, b) => b.value - a.value) : null
  const shown =
    sorted && sorted.length > 5
      ? [
          ...sorted.slice(0, 5),
          {
            label: "Otros orígenes",
            value: sorted.slice(5).reduce((sum, item) => sum + item.value, 0)
          }
        ]
      : sorted
  const max = Math.max(...(shown || []).map((item) => item.value), 1)
  const total = sorted?.reduce((sum, item) => sum + item.value, 0) ?? null
  return (
    <article className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {shown && total ? (
        <>
          <p className={styles.distributionTotal}>
            {integer(total)} <span>usuarios</span>
          </p>
          <ul className={styles.barList}>
            {shown.map((item) => (
              <li key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{integer(item.value)}</strong>
                </div>
                <div className={styles.barTrack} aria-hidden="true">
                  <div style={{ width: `${(item.value / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.empty}>
          {shown ? "Todavía no hay usuarios registrados." : unavailable}
        </p>
      )}
      {href && (
        <Link href={href} className={styles.textLink}>
          {linkLabel}
        </Link>
      )}
      {!href && (
        <p className={styles.caption}>
          “Sin indicar” incluye a quienes no completaron este dato.
        </p>
      )}
    </article>
  )
}
