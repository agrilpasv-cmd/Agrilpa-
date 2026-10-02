import type { DashboardOverview, DashboardRole } from "./overview"
import { shiftDashboardDate } from "./period"
import { createReportWorkbook, type ReportCell, type ReportChart, type ReportSheet } from "./xlsx"

const styled = (value: string | number | null, style: number): ReportCell => ({ value: value ?? "Sin datos", style })
const formula = (expression: string, value: string | number, style = 4): ReportCell => ({ formula: expression, value, style })
const excelDate = (value: string) => Date.parse(`${value}T00:00:00Z`) / 86400000 + 25569
const dateText = (value: string) => new Intl.DateTimeFormat("es-SV", {day:"numeric",month:"short",year:"numeric",timeZone:"America/El_Salvador"}).format(new Date(value))

export function dashboardExcelReport(data: DashboardOverview, role: DashboardRole, accent = "8BC646", font = "Segoe UI") {
  accent = /^[0-9a-f]{6}$/i.test(accent) ? accent : "8BC646"
  const view = data.views[role], period = data.period
  const currentEnd = period.historical ? new Date(Date.parse(period.end) - 1).toISOString() : period.end
  const previousEnd = period.historical ? new Date(Date.parse(period.previousEnd) - 1).toISOString() : period.previousEnd
  const subtitle = `${data.companyName} · ${role === "seller" ? "Vendedor" : "Comprador"}`
  const currentRange = `${dateText(period.start)} — ${dateText(currentEnd)}`
  const previousRange = `${dateText(period.previousStart)} — ${dateText(previousEnd)}`
  const stamp = new Intl.DateTimeFormat("es-SV", {dateStyle:"medium",timeStyle:"short",timeZone:period.timezone}).format(new Date(data.generatedAt))
  const charts: ReportChart[] = []
  const graphRows: ReportCell[][] = [[styled("Agrilpa · Gráficos",1)],[styled(subtitle,9)],[styled(`Actual: ${currentRange}`,9)],[styled(`Anterior: ${previousRange}`,9)],[styled("Compara el mismo día relativo de ambos períodos. Las fechas exactas están en Actividad diaria.",9)]]
  const graphMerges = ["A1:H1","A2:H2","A3:H3","A4:H4","A5:H5"]
  const graphHeights: Record<number,number> = {1:42,5:38}
  const addChart = (chart: Omit<ReportChart,"row">, note: string) => {
    const row = graphRows.length + 2
    while (graphRows.length < row + 15) { graphRows.push([]); graphHeights[graphRows.length] = 21 }
    charts.push({...chart,row})
    graphRows.push([styled(note,9)]); graphMerges.push(`A${graphRows.length}:H${graphRows.length}`); graphHeights[graphRows.length] = 36
  }
  const activityRows: ReportCell[][] = [
    [styled("Agrilpa · Actividad diaria",1)], [styled(subtitle,9)],
    [styled(`Actual: ${currentRange}. Anterior: ${previousRange}. Zona horaria: ${period.timezone}.`,9)],
    [styled(period.historical ? "Períodos completos. Pedidos entregados agrupados por fecha de creación." : "El último día se compara hasta la misma hora. Pedidos entregados agrupados por fecha de creación.",9)],
    ["Indicador","Fecha actual","Actual","Fecha anterior","Anterior","Día comparado"].map(v => styled(v,2)),
  ]
  const activityTotals: ReportCell[][] = [[styled("Agrilpa · Totales de actividad",1)],[styled(subtitle,9)],[styled("Totales calculados a partir de Actividad diaria. Las visitas y los estados actuales se muestran en Resumen.",9)],[],["Indicador","Actual","Anterior"].map(v => styled(v,2))]
  for (const series of view.series) {
    const unavailable = series.id === "conversations" && !view.chat.available
    const start = activityRows.length + 1
    series.points.forEach((point,i) => activityRows.push([
      styled(series.label,i % 2 ? 3 : 0),styled(excelDate(point.date),8),styled(unavailable ? null : point.current,i % 2 ? 5 : 4),
      styled(excelDate(shiftDashboardDate(point.date,-period.days)),8),styled(unavailable ? null : point.previous,i % 2 ? 5 : 4),`Día ${i+1}`,
    ]))
    const end = activityRows.length
    const actual = series.points.reduce((sum,p) => sum+p.current,0), previous = series.points.reduce((sum,p) => sum+p.previous,0)
    activityTotals.push([series.label,unavailable ? "Sin datos" : formula(`SUM('Actividad diaria'!C${start}:C${end})`,actual),unavailable ? "Sin datos" : formula(`SUM('Actividad diaria'!E${start}:E${end})`,previous)])
    if (!unavailable && end >= start) addChart({title:series.label,kind:"line",categoryRange:`'Actividad diaria'!$F$${start}:$F$${end}`,categories:series.points.map((_,i) => `Día ${i+1}`),series:[
      {name:"Período actual",range:`'Actividad diaria'!$C$${start}:$C$${end}`,values:series.points.map(p=>p.current),color:accent},
      {name:"Período anterior",range:`'Actividad diaria'!$E$${start}:$E$${end}`,values:series.points.map(p=>p.previous),color:"7B827D"},
    ]},actual === 0 && previous === 0 ? "Sin actividad registrada en los períodos comparados." : `${actual} en el período actual; ${previous} en el período anterior.`)
  }
  const summary: ReportSheet = {
    name:"Resumen",widths:[40,14,18,18,18,18,48],merges:["A1:G1","A2:G2","A3:B3","C3:G3","A4:B4","C4:G4","A5:B5","C5:G5","A6:G6","A7:G7","A8:G8"],heights:{1:44,2:30,6:40,7:40,8:40},freeze:10,
    rows:[
      [styled("Agrilpa · Informe de actividad",1)], [styled(subtitle,9)],
      [styled(`Período actual · ${period.days} días`,10),"",currentRange],
      [styled("Período de comparación",10),"",previousRange],
      [styled("Descargado",10),"",`${stamp} · Horario de El Salvador`],
      [styled("Actividad del período: eventos agrupados por fecha de creación. Visitas, publicaciones y estados de pedidos: situación actual al descargar.",9)],
      [styled("Importes separados por moneda. Corresponden a pedidos entregados creados en cada período y no representan cobros confirmados.",9)],
      [styled("Sin datos: información no disponible. —: comparación no aplicable. Sin base: período anterior con valor cero. Consulta las otras hojas para ver los gráficos y el detalle.",9)],[],
      ["Indicador","Unidad","Actual","Anterior","Diferencia","Variación %","Alcance"].map(v => styled(v,2)),
    ],
  }
  const addMetric = (label: string,unit: string,current: number|null,previous: number|null,detail: string,money=false,comparable=true) => {
    const row=summary.rows.length+1, numericStyle=money || unit === "minutos" ? 6 : 4
    const delta=comparable && current !== null && previous !== null ? current-previous : null
    const rate=delta !== null && previous !== null && previous !== 0 ? delta/previous : null
    const noRate = delta === null ? "—" : previous === 0 && current === 0 ? "Sin cambios" : "Sin base"
    summary.rows.push([label,unit,styled(current,numericStyle),previous === null ? "—" : styled(previous,numericStyle),delta === null ? "—" : formula(`C${row}-D${row}`,delta,money ? 14 : 13),rate === null ? noRate : formula(`(C${row}-D${row})/D${row}`,rate,7),detail]);summary.heights![row]=46
  }
  for (const metric of view.metrics) {
    if (metric.id === "amount") {
      const codes=[...new Set([...Object.keys(view.money.current),...Object.keys(view.money.previous)])].sort()
      const complete = !view.money.unknownCurrent && !view.money.unknownPrevious
      codes.forEach(code => addMetric(metric.label,code,view.money.current[code] || 0,view.money.previous[code] || 0,`${metric.detail}${complete ? "" : ". Importes parciales: hay pedidos sin importe o moneda."}`,true,complete))
      if (!codes.length) addMetric(metric.label,"Moneda",null,null,"Sin importes con moneda registrados en los períodos comparados.",true)
      if (view.money.unknownCurrent || view.money.unknownPrevious) addMetric("Pedidos sin importe o moneda","pedidos",view.money.unknownCurrent,view.money.unknownPrevious,"Pedidos entregados del período excluidos de los importes.")
    } else addMetric(metric.label,"cantidad",metric.value,metric.previous,metric.detail)
  }
  for (const metric of view.secondary) addMetric(metric.label,metric.id === "responseTime" ? "minutos" : "cantidad",metric.value,metric.previous,metric.detail)
  summary.rows.push([],[styled("Conversaciones B2B",10)]);summary.merges!.push(`A${summary.rows.length}:G${summary.rows.length}`)
  if (!view.secondary.some(metric => metric.id === "responseTime")) addMetric("Primera respuesta · mediana","minutos",view.chat.available ? view.chat.medianMinutes : null,null,"Conversaciones recibidas en el período seleccionado.")
  addMetric("Respondidas en 24 horas","proporción",view.chat.available && view.chat.response24h !== null ? view.chat.response24h/100 : null,null,`${view.chat.available ? view.chat.sample24h : "Sin datos"} conversaciones con al menos 24 h de seguimiento.`)
  const responseRateRow=summary.rows.length
  summary.rows[responseRateRow-1][2]=styled(view.chat.available && view.chat.response24h !== null ? view.chat.response24h/100 : null,7)
  addMetric("Con primera respuesta","conversaciones",view.chat.available ? view.chat.responded : null,null,"Conversaciones recibidas en el período.")
  addMetric("Sin primera respuesta","conversaciones",view.chat.available ? view.chat.unanswered : null,null,"Conversaciones recibidas en el período.")
  addMetric("Acciones pendientes","acciones",view.pendingCount,null,view.chat.available ? "Situación actual al descargar." : "Situación actual; mensajes sin consultar.")
  if (!view.chat.available) {summary.rows.push([styled("Las métricas de mensajes no estaban disponibles al descargar este informe.",9)]);summary.merges!.push(`A${summary.rows.length}:G${summary.rows.length}`)}
  summary.rows.push([],[styled("Fuente: dashboard de tu cuenta en Agrilpa. Datos consultados al descargar; pueden cambiar cuando se actualizan pedidos o conversaciones.",9)])
  summary.merges!.push(`A${summary.rows.length}:G${summary.rows.length}`);summary.heights![summary.rows.length]=40

  const orderRows: ReportCell[][] = [[styled("Agrilpa · Estado de pedidos",1)],[styled(subtitle,9)],[styled(`Todos los pedidos, situación actual al ${stamp}. Esta distribución no está filtrada por el período elegido.`,9)],[],["Estado","Pedidos","Participación"].map(v=>styled(v,2))]
  const totalOrders=view.orders.reduce((sum,o)=>sum+o.value,0), orderEnd=5+view.orders.length
  view.orders.forEach((o,i) => {const row=orderRows.length+1;orderRows.push([styled(o.label,i%2?3:0),styled(o.value,i%2?5:4),formula(`IF($B$${orderEnd+1}=0,0,B${row}/$B$${orderEnd+1})`,totalOrders?o.value/totalOrders:0,7)])})
  orderRows.push([styled("Total de pedidos",11),formula(`SUM(B6:B${orderEnd})`,totalOrders,12),totalOrders?styled(1,7):styled(0,7)])
  if (view.orders.length) addChart({title:"Estado actual de pedidos",kind:"bar",categoryRange:`'Pedidos'!$A$6:$A$${orderEnd}`,categories:view.orders.map(o=>o.label),series:[{name:"Pedidos",range:`'Pedidos'!$B$6:$B$${orderEnd}`,values:view.orders.map(o=>o.value),color:accent}]},totalOrders ? `${totalOrders} pedidos en total. Situación actual; sin filtro de fecha.` : "No hay pedidos registrados. Situación actual; sin filtro de fecha.")
  const rankingRows: ReportCell[][] = [[styled(`Agrilpa · ${view.rankingLabel}`,1)],[styled(subtitle,9)],[styled(view.rankingDetail,9)],[styled("Se incluyen los elementos destacados que muestra el dashboard; esta lista no equivale al catálogo completo.",9)],["Posición",role === "seller" ? "Producto" : "Proveedor",role === "seller" ? "Visitas" : "Solicitudes"].map(v=>styled(v,2))]
  view.ranking.forEach((item,i)=>rankingRows.push([i+1,item.label,styled(item.value,4)]))
  if (!view.ranking.length) {rankingRows.push([styled("Sin elementos para mostrar.",9)])}
  if (view.ranking.length) addChart({title:view.rankingLabel,kind:"bar",categoryRange:`'Clasificación'!$B$6:$B$${rankingRows.length}`,categories:view.ranking.map(o=>o.label),series:[{name:role === "seller" ? "Visitas" : "Solicitudes",range:`'Clasificación'!$C$6:$C$${rankingRows.length}`,values:view.ranking.map(o=>o.value),color:accent}]},view.rankingDetail)
  const sheets: ReportSheet[]=[summary,
    {name:"Gráficos",rows:graphRows,widths:Array(8).fill(14),merges:graphMerges,heights:graphHeights},
    {name:"Actividad diaria",rows:activityRows,widths:[32,23,17,23,17,19],merges:["A1:F1","A2:F2","A3:F3","A4:F4"],heights:{1:44,3:40,4:40},freeze:5,filter:`A5:F${activityRows.length}`},
    {name:"Totales",rows:activityTotals,widths:[48,25,25],merges:["A1:C1","A2:C2","A3:C3"],heights:{1:44,3:44},freeze:5},
    {name:"Pedidos",rows:orderRows,widths:[48,25,25],merges:["A1:C1","A2:C2","A3:C3"],heights:{1:44,3:44},freeze:5,filter:`A5:C${orderEnd}`},
    {name:"Clasificación",rows:rankingRows,widths:[16,64,18],merges:["A1:C1","A2:C2","A3:C3","A4:C4"],heights:{1:52,3:40,4:40},freeze:5,...(view.ranking.length ? {filter:`A5:C${rankingRows.length}`} : {merges:["A1:C1","A2:C2","A3:C3","A4:C4","A6:C6"]})},
  ]
  return createReportWorkbook(sheets,charts,accent,font)
}
