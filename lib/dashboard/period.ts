export type DashboardDays = 7 | 30 | 90
const DAY = 86_400_000
const OFFSET = 6 * 60 * 60 * 1000
export const dashboardToday = (now = new Date()) => new Date(now.getTime() - OFFSET).toISOString().slice(0, 10)
export function isDashboardDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function shiftDashboardDate(value: string, days: number) {
  return new Date(Date.parse(`${value}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10)
}
export function dashboardPeriod(days: DashboardDays, now = new Date(), selectedEnd = "") {
  const today = dashboardToday(now)
  if (selectedEnd && (!isDashboardDate(selectedEnd) || selectedEnd > today)) throw new Error("Fecha no válida. Elige hoy o una fecha anterior.")
  const endDate = selectedEnd || today
  const historical = endDate < today
  const lastMidnight = Date.parse(`${endDate}T00:00:00-06:00`)
  const start = lastMidnight - (days - 1) * DAY
  const end = historical ? lastMidnight + DAY : now.getTime()
  return { days, endDate, historical, start: new Date(start).toISOString(), end: new Date(end).toISOString(), previousStart: new Date(start - days * DAY).toISOString(), previousEnd: new Date(end - days * DAY).toISOString(), timezone: "America/El_Salvador" }
}
export function readDashboardFilters(value: string | null, now = new Date()): { days: DashboardDays; endDate: string } {
  try {
    const parsed = JSON.parse(value || "null")
    return { days: [7, 30, 90].includes(parsed?.days) ? parsed.days : 30, endDate: typeof parsed?.endDate === "string" && isDashboardDate(parsed.endDate) && parsed.endDate < dashboardToday(now) ? parsed.endDate : "" }
  } catch { return { days: 30, endDate: "" } }
}
