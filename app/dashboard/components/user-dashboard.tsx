"use client"

import { useEffect, useId, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Download, MessageSquare, Plus, RefreshCw, ShoppingBag, Store, TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { DashboardDays, DashboardMetric, DashboardOverview, DashboardRole } from "@/lib/dashboard/overview"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dashboardToday, isDashboardDate, readDashboardFilters, shiftDashboardDate } from "@/lib/dashboard/period"
import { dashboardReport } from "@/lib/dashboard/report"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"
import styles from "./user-dashboard.module.css"

const number = (value: number) => new Intl.NumberFormat("es-SV", { maximumFractionDigits: 1 }).format(value)
const duration = (minutes: number | null) => minutes === null ? "Sin datos" : minutes < 1 ? "< 1 min" : minutes < 60 ? `${number(minutes)} min` : minutes < 1440 ? `${number(minutes / 60)} h` : `${number(minutes / 1440)} días`
const timestamp = (value: string) => new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/El_Salvador" }).format(new Date(value)).replace(/[\u00a0\u202f]/g, " ")
const date = (value: string) => new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "short", timeZone: "America/El_Salvador" }).format(new Date(value))
const dateWithYear = (value: string) => new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "short", year: "numeric", timeZone: "America/El_Salvador" }).format(new Date(value))
const colors = ["color-mix(in srgb,var(--primary) 25%,var(--background))", "color-mix(in srgb,var(--primary) 60%,var(--background))", "var(--primary)", "color-mix(in srgb,var(--primary) 75%,var(--foreground))", "var(--muted-foreground)", "var(--border)"]
function DashboardSelect({ label, value, onValueChange, options, disabled, className = "" }: { label: string; value: string; onValueChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean; className?: string }) {
  return <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger aria-label={label} className={`${styles.selectTrigger} h-11 bg-transparent rounded-xl ${className}`}><SelectValue /></SelectTrigger>
    <SelectContent position="popper" className="max-h-60">{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
  </Select>
}
function compare(value: number | null, previous: number | null) {
  if (value === null || previous === null) return null
  if (previous === 0) return value === 0 ? "Sin cambios" : `+${number(value)} respecto al período anterior`
  const change = (value - previous) / previous * 100
  return `${change > 0 ? "+" : ""}${number(change)}% respecto al período anterior`
}
function Sparkline({ values }: { values: number[] }) {
  return <div className={styles.sparkline} aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><AreaChart data={values.map(value => ({ value }))}><Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={1.5} fill="color-mix(in srgb,var(--primary) 8%,var(--background))" isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>
}
function Skeleton() {
  return <div className={styles.dashboard} role="status" aria-label="Cargando dashboard"><div className={styles.skeletonTitle} /><div className={styles.kpis}>{[1, 2, 3, 4].map(i => <div key={i} className={`${styles.skeleton} ${styles.kpi}`} />)}</div><div className={styles.columns}><div className={`${styles.skeleton} ${styles.skeletonChart}`} /><div className={`${styles.skeleton} ${styles.skeletonChart}`} /></div><span className="sr-only">Cargando tus métricas…</span></div>
}

export function UserDashboard() {
  const [days, setDays] = useState<DashboardDays>(30)
  const [endDate, setEndDate] = useState("")
  const [settingsUserId, setSettingsUserId] = useState("")
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [unauthorized, setUnauthorized] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let alive = true
    const timeout = setTimeout(() => controller.abort(), 25000)
    setLoading(true); setError(""); setUnauthorized(false)
    const params = new URLSearchParams({ days: String(days) })
    if (endDate) params.set("endDate", endDate)
    fetch(`/api/dashboard/overview?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const result = await response.json()
        if (!response.ok) { if (alive) setUnauthorized(response.status === 401); throw new Error(result.error || "No pudimos cargar las métricas.") }
        if (alive) setData(result)
      })
      .catch(cause => { if (alive) setError(cause.name === "AbortError" ? "La consulta tardó más de lo esperado. Vuelve a intentarlo." : cause.message) })
      .finally(() => { clearTimeout(timeout); if (alive) setLoading(false) })
    return () => { alive = false; clearTimeout(timeout); controller.abort() }
  }, [days, endDate, revision])
  const userId = data?.userId
  useEffect(() => {
    if (!userId) return
    try {
      const filters = readDashboardFilters(localStorage.getItem(`agrilpa-dashboard-filters:${userId}`))
      setDays(filters.days); setEndDate(filters.endDate)
    } catch { /* Browsing without storage still supports all filters. */ }
    setSettingsUserId(userId)
  }, [userId])
  useEffect(() => {
    if (!userId || settingsUserId !== userId) return
    try { localStorage.setItem(`agrilpa-dashboard-filters:${userId}`, JSON.stringify({ days, endDate })) } catch { /* Storage is optional. */ }
  }, [userId, settingsUserId, days, endDate])
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") setRevision(value => value + 1) }
    document.addEventListener("visibilitychange", refresh)
    return () => document.removeEventListener("visibilitychange", refresh)
  }, [])
  if (!data && loading) return <Skeleton />
  if (!data || unauthorized) return <div className={styles.dashboard}><div className={styles.error} role="alert"><h1>No pudimos cargar tu dashboard</h1><p>{error}</p>{unauthorized ? <Link className={styles.blackButton} href="/auth?redirectTo=/dashboard">Iniciar sesión</Link> : <button className={styles.blackButton} onClick={() => setRevision(value => value + 1)}>Volver a intentar</button>}</div></div>
  return <DashboardContent data={data} days={days} endDate={endDate} onDaysChange={setDays} onEndDateChange={setEndDate} onRefresh={() => setRevision(value => value + 1)} loading={loading} error={error} />
}

/** Separate presentation allows visual QA without changing account records. */
export function DashboardContent({ data, days, endDate = "", onDaysChange, onEndDateChange, onRefresh, loading = false, error = "" }: { data: DashboardOverview; days: DashboardDays; endDate?: string; onDaysChange: (days: DashboardDays) => void; onEndDateChange?: (endDate: string) => void; onRefresh: () => void; loading?: boolean; error?: string }) {
  const [role, setRole] = useState<DashboardRole>(data.defaultRole)
  const [seriesId, setSeriesId] = useState("quotes")
  const [currencyChoice, setCurrencyChoice] = useState("USD")
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [dateDraft, setDateDraft] = useState("")
  const gradientId = `activity-${useId().replace(/:/g, "")}`
  useEffect(() => {
    try { const stored = localStorage.getItem(`agrilpa-dashboard-mode:${data.userId}`); setRole(stored === "seller" || stored === "buyer" ? stored : data.defaultRole) } catch { setRole(data.defaultRole) }
  }, [data.userId, data.defaultRole])
  const changeRole = (next: DashboardRole) => { setRole(next); try { localStorage.setItem(`agrilpa-dashboard-mode:${data.userId}`, next) } catch { /* Storage may be unavailable. */ } }
  const view = data.views[role]
  const currencies = Array.from(new Set([...Object.keys(view.money.current), ...Object.keys(view.money.previous)])).sort()
  const currency = currencies.includes(currencyChoice) ? currencyChoice : currencies[0]
  const monetaryValue = currency ? view.money.current[currency] || 0 : view.money.unknownCurrent ? null : 0
  const monetaryPrevious = currency ? view.money.previous[currency] || 0 : view.money.unknownPrevious ? null : 0
  const formatMoney = (value: number) => currency ? new Intl.NumberFormat("es-SV", { style: "currency", currency, maximumFractionDigits: 2 }).format(value) : "Sin pedidos"
  const series = view.series.find(item => item.id === seriesId) || view.series[0]
  const currentTotal = series.points.reduce((total, point) => total + point.current, 0)
  const previousTotal = series.points.reduce((total, point) => total + point.previous, 0)
  const orderTotal = view.orders.reduce((total, item) => total + item.value, 0)
  const rankingMax = Math.max(...view.ranking.map(item => item.value), 1)
  const actionHref = role === "seller" ? "/dashboard/mis-publicaciones/nueva" : "/productos"
  const today = dashboardToday()
  const selectedEnd = endDate || today
  const displayEnd = data.period.historical ? new Date(new Date(data.period.end).getTime() - 1).toISOString() : data.period.end
  const changeEndDate = (value: string) => { onEndDateChange?.(value >= today ? "" : value); setDatePickerOpen(false) }
  const matchesSelection = data.period.days === days && data.period.endDate === selectedEnd
  const exportReport = () => {
    const url = URL.createObjectURL(new Blob([dashboardReport(data, role)], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url; link.download = `agrilpa-${role === "seller" ? "ventas" : "compras"}-${data.period.days}dias-${data.period.endDate}.csv`
    document.body.appendChild(link); link.click(); link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const metricCard = (metric: DashboardMetric) => {
    const money = metric.id === "amount", value = money ? monetaryValue : metric.value, previous = money ? monetaryPrevious : metric.previous
    const delta = money && (view.money.unknownCurrent || view.money.unknownPrevious) ? null : money && previous === 0 && value !== null && value > 0 ? `+${formatMoney(value)} respecto al período anterior` : compare(value, previous)
    return <article key={metric.id} className={styles.kpi}>
      <div className={styles.metricHeading}><h2>{metric.label}</h2>{money && currencies.length > 1 && <DashboardSelect label="Moneda de los importes" value={currency} onValueChange={setCurrencyChoice} options={currencies.map(code => ({ value: code, label: code }))} className={styles.currencySelect} />}</div>
      <div className={`${styles.metricValue} ${money ? styles.moneyValue : ""}`}>{value === null ? "Sin datos" : money ? formatMoney(value) : number(value)}</div>
      <p className={styles.metricDetail}>{money && currency ? `${currency} · ${metric.detail}` : metric.detail}</p>
      {money && view.money.unknownCurrent > 0 && <p className={styles.moneyNote}>{view.money.unknownCurrent} pedido(s) sin importe o moneda registrados</p>}
      <div className={styles.metricBottom}><span className={styles.comparison}>{delta || (metric.id === "visits" ? "Total histórico" : money ? "Importes registrados" : "")}</span>{metric.history && <Sparkline values={metric.history} />}</div>
    </article>
  }
  return <div className={styles.dashboard} aria-busy={loading}>
    <header className={styles.header}>
      <div><div className={styles.eyebrow}>MI DASHBOARD</div><h1>Resumen de tu negocio</h1><div className={styles.profileIdentity}><Link href="/dashboard/perfil" aria-label="Ver mi perfil"><Avatar className="h-11 w-11"><AvatarImage src={data.avatarUrl || undefined} alt={`Foto de perfil de ${data.companyName}`} className="object-cover" /><AvatarFallback className="bg-muted text-sm text-foreground">{data.companyName.trim().slice(0, 2).toUpperCase()}</AvatarFallback></Avatar></Link><p>{data.companyName} <span className={styles.dot}>·</span> Tu actividad comercial en Agrilpa</p></div></div>
      <Link href={actionHref} className={styles.blackButton}>{role === "seller" ? <Plus size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}{role === "seller" ? "Publicar producto" : "Explorar productos"}</Link>
    </header>
    <div className={styles.toolbar}>
      <div className={styles.roles} role="group" aria-label="Actividad del dashboard"><button aria-pressed={role === "seller"} onClick={() => changeRole("seller")} className={role === "seller" ? styles.selectedRole : ""}><Store size={18} aria-hidden="true" />Vender</button><button aria-pressed={role === "buyer"} onClick={() => changeRole("buyer")} className={role === "buyer" ? styles.selectedRole : ""}><ShoppingBag size={18} aria-hidden="true" />Comprar</button></div>
      <div className={styles.dateControls}><DashboardSelect label="Período de las métricas" value={String(days)} onValueChange={value => onDaysChange(Number(value) as DashboardDays)} disabled={loading} options={[7, 30, 90].map(value => ({ value: String(value), label: `${endDate ? "Período de" : "Últimos"} ${value} días` }))} /><button className={styles.refreshButton} onClick={onRefresh} disabled={loading} aria-label="Actualizar métricas" title="Actualizar métricas"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button></div>
    </div>
    <div className={styles.historyToolbar}>
      <div className={styles.historyControls}>
        <button className={styles.refreshButton} disabled={loading || !onEndDateChange} aria-label="Consultar período anterior" onClick={() => changeEndDate(shiftDashboardDate(selectedEnd, -days))}><ArrowLeft size={18} /></button>
        <Popover open={datePickerOpen} onOpenChange={open => { setDatePickerOpen(open); if (open) setDateDraft(selectedEnd) }}><PopoverTrigger asChild><button className={styles.dateRangeButton} disabled={loading || !onEndDateChange} aria-label="Elegir fecha final del período"><CalendarDays size={18} aria-hidden="true" />{date(data.period.start)} — {dateWithYear(displayEnd)}</button></PopoverTrigger><PopoverContent align="start" className="w-[336px] max-w-[calc(100vw-32px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-xl p-2"><p className="mb-2 px-2 text-sm font-medium">Fecha final del período</p><DayPicker mode="single" locale={es} defaultMonth={new Date(`${selectedEnd}T12:00:00`)} selected={dateDraft ? new Date(`${dateDraft}T12:00:00`) : undefined} onSelect={value => { if (value) setDateDraft(`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`) }} toDate={new Date(`${today}T12:00:00`)} disabled={{ after: new Date(`${today}T12:00:00`) }} labels={{ labelPrevious: () => "Mes anterior", labelNext: () => "Mes siguiente", labelDay: value => new Intl.DateTimeFormat("es", { day:"numeric",month:"long",year:"numeric" }).format(value) }} classNames={{ months:"flex flex-col", month:"space-y-2", caption:"flex items-center justify-between relative h-11", caption_label:"absolute inset-x-11 text-center text-sm font-medium capitalize", nav:"flex w-full justify-between", nav_button:"flex h-11 w-11 items-center justify-center rounded-xl border hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-30", table:"w-full border-collapse", head_cell:"h-9 w-11 text-xs font-normal text-muted-foreground", cell:"p-0 text-center", day:"h-11 w-11 rounded-xl text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary", day_selected:"bg-foreground text-background hover:bg-foreground/90", day_disabled:"opacity-30", day_today:"font-bold underline underline-offset-4" }} /><p className="mt-3 text-sm text-muted-foreground">Se consultan los {days} días que terminan en la fecha elegida, comparados con los {days} días anteriores.</p><button className={`${styles.blackButton} sticky bottom-0 mt-4 w-full`} disabled={!isDashboardDate(dateDraft) || dateDraft > today} onClick={() => changeEndDate(dateDraft)}>Aplicar fecha</button></PopoverContent></Popover>
        <button className={styles.refreshButton} disabled={loading || !onEndDateChange || !endDate} aria-label="Consultar período siguiente" onClick={() => changeEndDate(shiftDashboardDate(selectedEnd, days))}><ArrowRight size={18} /></button>
        {endDate && <button className={styles.outlineButton} disabled={loading} onClick={() => changeEndDate("")}>Volver a hoy</button>}
      </div>
      <button className={styles.outlineButton} disabled={loading || !matchesSelection || !!error} onClick={exportReport}><Download size={16} aria-hidden="true" />Descargar informe</button>
    </div>
    <p className={styles.periodNote}>Comparación: {date(data.period.previousStart)} — {dateWithYear(data.period.historical ? new Date(new Date(data.period.previousEnd).getTime() - 1).toISOString() : data.period.previousEnd)}. Estados y visitas acumuladas: situación actual.</p>
    {error && <div className={styles.inlineError} role="alert">{error} Se conserva la última consulta. <button onClick={onRefresh}>Reintentar</button></div>}
    {loading && <p className={styles.updateStatus} role="status">Actualizando métricas…</p>}
    {!matchesSelection && !loading && <p className={styles.updateStatus}>La consulta seleccionada no se completó; se muestran los datos de {data.period.days} días hasta {date(displayEnd)}.</p>}
    {data.chatUnavailable && <p className={styles.inlineError} role="status">Las métricas de mensajes no están disponibles en este momento.</p>}
    {data.isEmpty && <div className={styles.welcome}><div><strong>Tu próxima oportunidad empieza aquí</strong><p>{role === "seller" ? "Publica tu primer producto y empieza a recibir solicitudes dentro de Agrilpa." : "Explora el catálogo y conversa con los productores dentro de Agrilpa."}</p></div><Link href={actionHref}>Comenzar <ArrowRight size={16} /></Link></div>}
    <div className={styles.kpis}>{view.metrics.map(metricCard)}</div>
    <div className={styles.secondary}>{view.secondary.map(metric => <div key={metric.id}><span>{metric.label}</span><strong>{metric.id === "responseTime" ? duration(metric.value) : metric.value === null ? "Sin datos" : number(metric.value)}</strong><small>{metric.detail}</small></div>)}</div>
    <div className={styles.columns}>
      <section className={styles.panel} aria-labelledby="activity-heading">
        <div className={styles.panelHeader}><div><h2 id="activity-heading">Actividad de tu negocio</h2><p>Compara con el período anterior de igual duración</p></div><DashboardSelect label="Métrica de la gráfica" value={series.id} onValueChange={setSeriesId} options={view.series.map(item => ({ value: item.id, label: item.label }))} /></div>
        <div className={styles.chartSummary}><strong>{number(currentTotal)}</strong><span>{series.label.toLowerCase()}</span><small>{compare(currentTotal, previousTotal)}</small></div>
        <div className={styles.legend}><span><i style={{ background: "var(--primary)" }} />Período actual</span><span><i style={{ background: "var(--muted-foreground)" }} />Período anterior</span></div>
        <div className={styles.activityChart} role="img" aria-label={`${series.label}: ${currentTotal} en el período actual; ${previousTotal} en el anterior. Consulta los valores diarios en la tabla.`}>
          <ResponsiveContainer width="100%" height="100%"><ComposedChart data={series.points} margin={{ top: 12, right: 10, bottom: 0, left: -25 }}>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 13, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={42} /><YAxis allowDecimals={false} tick={{ fontSize: 13, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)", fontFamily: "inherit", borderRadius: 12, fontSize: 14 }} formatter={(value: number, name: string) => [number(value), name]} />
            <Area name="Período actual" type="monotone" dataKey="current" stroke="var(--primary)" strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive={false} /><Line name="Período anterior" type="monotone" dataKey="previous" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
          </ComposedChart></ResponsiveContainer>
        </div>
        {currentTotal === 0 && previousTotal === 0 && <p className={styles.chartEmpty}>Todavía no hay actividad para esta métrica en los períodos comparados.</p>}
        <details className={styles.dataTable}><summary>Consultar datos de la gráfica</summary><div><table><caption>{series.label} · {data.period.timezone}</caption><thead><tr><th scope="col">Día actual</th><th scope="col">Actual</th><th scope="col">Día anterior</th><th scope="col">Anterior</th></tr></thead><tbody>{series.points.map(point => <tr key={point.date}><th scope="row">{point.label}</th><td>{point.current}</td><td>{date(new Date(new Date(`${point.date}T12:00:00-06:00`).getTime() - data.period.days * 86400000).toISOString())}</td><td>{point.previous}</td></tr>)}</tbody></table></div></details>
        <p className={styles.caption}>{data.period.historical ? "Se comparan períodos completos de igual duración." : "Hoy se compara hasta la misma hora."} Los pedidos entregados se agrupan por su fecha de creación.</p>
      </section>
      <section className={styles.panel} aria-labelledby="orders-heading"><div className={styles.panelHeader}><div><h2 id="orders-heading">Estado de {role === "seller" ? "tus pedidos" : "tus compras"}</h2><p>Todos los pedidos · estado actual</p></div><ShoppingBag size={18} className={styles.mutedIcon} aria-hidden="true" /></div>
        <div className={styles.donut}><div className={styles.donutChart} aria-hidden="true">{orderTotal > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={view.orders} dataKey="value" nameKey="label" innerRadius={82} outerRadius={106} paddingAngle={orderTotal > 1 ? 2 : 0} stroke="var(--background)" isAnimationActive={false}>{view.orders.map((item, index) => <Cell key={item.id} fill={colors[index]} />)}</Pie></PieChart></ResponsiveContainer> : <div className={styles.emptyRing} />}</div><div className={styles.donutCenter}><strong>{number(orderTotal)}</strong><span>{orderTotal ? "pedidos" : "Sin pedidos"}</span></div></div>
        <ul className={styles.orderLegend}>{view.orders.map((item, index) => <li key={item.id}><span><i style={{ background: colors[index] }} />{item.label}</span><strong>{number(item.value)}</strong></li>)}</ul><Link className={styles.textLink} href={role === "seller" ? "/dashboard/ventas" : "/dashboard/compras"}>Ver {role === "seller" ? "mis ventas" : "mis compras"}<ArrowUpRight size={16} /></Link>
      </section>
    </div>
    <div className={styles.bottomColumns}>
      <section className={styles.panel}><div className={styles.panelHeader}><div><h2>{view.rankingLabel}</h2><p>{view.rankingDetail}</p></div><TrendingUp size={18} className={styles.mutedIcon} aria-hidden="true" /></div><div className={styles.ranking}>{view.ranking.length ? view.ranking.map((item, index) => <Link key={item.id} href={item.href}><span className={styles.rankIndex}>{String(index + 1).padStart(2, "0")}</span><div><div className={styles.rankLabel}><span title={item.label}>{item.label}</span><strong>{number(item.value)}</strong></div><div className={styles.barTrack}><div style={{ width: `${item.value / rankingMax * 100}%` }} /></div></div></Link>) : <p className={styles.empty}>Aquí verás {role === "seller" ? "tus productos cuando publiques el primero" : "los proveedores cuando envíes solicitudes"}.</p>}</div></section>
      <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Conversaciones B2B</h2><p>Primera respuesta · conversaciones recibidas en el período</p></div><MessageSquare size={18} className={styles.mutedIcon} aria-hidden="true" /></div>{view.chat.available ? <><div className={styles.responseOverview}><div><strong>{duration(view.chat.medianMinutes)}</strong><span>Tiempo de respuesta · mediana</span></div><div><strong>{view.chat.response24h === null ? "—" : `${number(view.chat.response24h)}%`}</strong><span>Respondidas en 24 h</span></div></div><div className={styles.responseProgress} role="img" aria-label={view.chat.response24h === null ? "Sin muestra para medir respuestas en 24 horas" : `${number(view.chat.response24h)} por ciento de respuestas dentro de 24 horas`}><div style={{ width: `${view.chat.response24h || 0}%` }} /></div><p className={styles.caption}>{view.chat.sample24h ? `${view.chat.sample24h} conversaciones con al menos 24 h de seguimiento` : "La tasa aparece cuando hay conversaciones con 24 h de seguimiento"}</p><div className={styles.responseCounts}><span><strong>{view.chat.responded}</strong> con primera respuesta</span><span><strong>{view.chat.unanswered}</strong> sin primera respuesta</span></div></> : <p className={styles.empty}>No pudimos consultar las métricas del chat.</p>}<Link href="/dashboard/mensajes" className={styles.textLink}>Abrir mensajes<ArrowUpRight size={16} /></Link></section>
      <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Por atender</h2><p>Prioriza tus próximas acciones</p></div><span className={styles.countBadge}>{view.pendingCount}</span></div><div className={styles.actions}>{view.actions.length ? view.actions.map(action => <Link key={action.id} href={action.href}><div><strong>{action.title}</strong><span>{action.detail}</span></div><ArrowUpRight size={18} aria-hidden="true" /></Link>) : <div className={styles.empty}><strong>Todo al día</strong><p>No hay acciones pendientes registradas{view.chat.available ? "." : "; el chat está sin consultar."}</p></div>}</div>{view.pendingCount > 5 && <p className={styles.caption}>Mostrando las 5 acciones más antiguas. Consulta cada sección para ver todas.</p>}</section>
    </div>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Conversaciones recientes</h2><p>Continúa tus negociaciones dentro de Agrilpa</p></div><Link href="/dashboard/mensajes" className={styles.textLink}>Ver todas<ArrowRight size={16} /></Link></div><div className={styles.recent}>{view.conversations.length ? view.conversations.map(conversation => <div key={conversation.id} className={styles.conversation}><div className={styles.avatar} aria-hidden="true">{conversation.name.slice(0, 2).toUpperCase()}</div><div className={styles.conversationText}><strong>{conversation.name}</strong><span>{conversation.product} · {conversation.content}</span></div><div className={styles.conversationMeta}><time dateTime={conversation.time}>{timestamp(conversation.time)}</time>{conversation.pending && <span className={styles.pendingTag}>Por responder</span>}</div><Link href={conversation.href} aria-label={`${conversation.pending ? "Responder a" : "Ver conversación con"} ${conversation.name}`} className={styles.outlineButton}>{conversation.pending ? "Responder" : "Ver chat"}<ArrowUpRight size={16} /></Link></div>) : <p className={styles.empty}>{view.chat.available ? "Tus conversaciones comerciales aparecerán aquí cuando intercambies mensajes." : "Las conversaciones no están disponibles. Puedes consultar la sección Mensajes."}</p>}</div></section>
    <footer className={styles.footer}>Actualizado {timestamp(data.generatedAt)} · Horario de El Salvador · Datos de tu cuenta</footer>
  </div>
}
