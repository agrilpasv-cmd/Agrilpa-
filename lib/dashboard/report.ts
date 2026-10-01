import type { DashboardOverview, DashboardRole } from "./overview"
import { shiftDashboardDate } from "./period"

// Quote all cells and neutralize spreadsheet formulas in user-provided text.
const cell = (value: string | number | null) => `"${String(value === null ? "Sin datos" : typeof value === "string" && /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`
export function dashboardReport(data: DashboardOverview, role: DashboardRole) {
  const view = data.views[role]
  const rows: (string | number | null)[][] = [
    ["Agrilpa · Informe de actividad", data.companyName],
    ["Vista", role === "seller" ? "Vendedor" : "Comprador"],
    ["Período", data.period.start, data.period.end, "Fin exclusivo"],
    ["Comparación", data.period.previousStart, data.period.previousEnd, "Fin exclusivo"],
    ["Generado", data.generatedAt, data.period.timezone],
    ["Nota", "Los estados, visitas y publicaciones son actuales. Los eventos se agrupan por fecha de creación. Importes separados por moneda; no representan cobros confirmados."],
    [], ["Tipo", "Indicador", "Unidad", "Actual", "Anterior", "Fecha actual", "Fecha anterior"],
  ]
  for (const metric of view.metrics) {
    if (metric.id === "amount") {
      const currencies = [...new Set([...Object.keys(view.money.current), ...Object.keys(view.money.previous)])].sort()
      for (const currency of currencies) rows.push(["Importe", metric.label, currency, view.money.current[currency] || 0, view.money.previous[currency] || 0])
      rows.push(["Importe", "Pedidos sin importe o moneda", "pedidos", view.money.unknownCurrent, view.money.unknownPrevious])
    } else rows.push(["Métrica", metric.label, "cantidad", metric.value, metric.previous])
  }
  for (const metric of view.secondary) rows.push(["Métrica secundaria", metric.label, metric.id === "responseTime" ? "minutos" : "cantidad", metric.value, metric.previous])
  for (const order of view.orders) rows.push(["Estado actual", order.label, "pedidos", order.value])
  for (const series of view.series) for (const point of series.points) rows.push(["Serie diaria", series.label, "cantidad", point.current, point.previous, point.date, shiftDashboardDate(point.date, -data.period.days)])
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n")
}
