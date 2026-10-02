// Small OOXML writer for dashboard exports. Charts stay editable in Excel and
// refer to worksheet cells. Inline strings keep user text out of formulas.
export const xml = (value: unknown) => String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
const rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
export const column = (index: number): string => index < 26 ? String.fromCharCode(65 + index) : column(Math.floor(index / 26) - 1) + column(index % 26)
export type ReportCell = string | number | null | { value: string | number; style?: number; formula?: string }
export interface ReportSheet {
  name: string; rows: ReportCell[][]; widths: number[]; merges?: string[]; heights?: Record<number, number>; freeze?: number; filter?: string
}
export interface ReportChart {
  title: string; kind: "line" | "bar"; row: number; categoryRange: string; categories: string[]
  series: { name: string; range: string; values: number[]; color: string }[]
}

// ZIP STORE is sufficient for these small reports (no compression dependency,
// workers or network calls). Both local and central records include CRC-32.
function zip(files: Record<string, string>) {
  const encoder = new TextEncoder(), locals: Uint8Array[] = [], centrals: Uint8Array[] = []
  let offset = 0, centralSize = 0
  const crcTable = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c }
  for (const [path, content] of Object.entries(files)) {
    const name = encoder.encode(path), data = encoder.encode(content)
    let crc = 0xffffffff
    for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8)
    crc = (crc ^ 0xffffffff) >>> 0
    const local = new Uint8Array(30 + name.length + data.length), l = new DataView(local.buffer)
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true); l.setUint16(12, 33, true)
    l.setUint32(14, crc, true); l.setUint32(18, data.length, true); l.setUint32(22, data.length, true); l.setUint16(26, name.length, true)
    local.set(name, 30); local.set(data, 30 + name.length); locals.push(local)
    const central = new Uint8Array(46 + name.length), c = new DataView(central.buffer)
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true); c.setUint16(14, 33, true)
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true)
    central.set(name, 46); centrals.push(central); offset += local.length; centralSize += central.length
  }
  const end = new Uint8Array(22), e = new DataView(end.buffer), count = centrals.length
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, count, true); e.setUint16(10, count, true); e.setUint32(12, centralSize, true); e.setUint32(16, offset, true)
  const result = new Uint8Array(offset + centralSize + end.length)
  let cursor = 0
  for (const part of [...locals, ...centrals, end]) { result.set(part, cursor); cursor += part.length }
  return result
}

function worksheet(sheet: ReportSheet, drawing: boolean) {
  const rows = sheet.rows.map((row, i) => `<row r="${i + 1}" ht="${sheet.heights?.[i + 1] || 30}" customHeight="1">${row.map((input, j) => {
    const cell: {value: string | number | null; style?: number; formula?: string} = typeof input === "object" && input !== null ? input : { value: input }
    const value = cell.value ?? "Sin datos", ref = `${column(j)}${i + 1}`
    if (cell.formula) return `<c r="${ref}" s="${cell.style || 0}"${typeof value === "string" ? ' t="str"' : ""}><f>${xml(cell.formula)}</f><v>${xml(value)}</v></c>`
    return typeof value === "number" && Number.isFinite(value) ? `<c r="${ref}" s="${cell.style || 0}"><v>${value}</v></c>` : `<c r="${ref}" s="${cell.style || 0}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`
  }).join("")}</row>`).join("")
  return `${declaration}<worksheet xmlns="${main}" xmlns:r="${rel}"><dimension ref="A1:${column(sheet.widths.length - 1)}${sheet.rows.length}"/><sheetViews><sheetView showGridLines="0" workbookViewId="0">${sheet.freeze ? `<pane ySplit="${sheet.freeze}" topLeftCell="A${sheet.freeze + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${sheet.freeze + 1}" sqref="A${sheet.freeze + 1}"/>` : ""}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="30"/><cols>${sheet.widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join("")}</cols><sheetData>${rows}</sheetData>${sheet.filter ? `<autoFilter ref="${sheet.filter}"/>` : ""}${sheet.merges?.length ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map(ref => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>` : ""}<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>${drawing ? '<drawing r:id="drawing"/>' : ""}</worksheet>`
}

function styles(accent: string, font: string) {
  const fonts = [
    `<font><sz val="11"/><color rgb="FF171717"/><name val="${xml(font)}"/></font>`,
    `<font><b/><sz val="23"/><color rgb="FF171717"/><name val="${xml(font)}"/></font>`,
    `<font><b/><sz val="11"/><color rgb="FF171717"/><name val="${xml(font)}"/></font>`,
    `<font><sz val="10"/><color rgb="FF626A65"/><name val="${xml(font)}"/></font>`,
  ]
  const fills = ["<fill><patternFill patternType=\"none\"/></fill>", '<fill><patternFill patternType="gray125"/></fill>', `<fill><patternFill patternType="solid"><fgColor rgb="FF${accent}"/><bgColor indexed="64"/></patternFill></fill>`, '<fill><patternFill patternType="solid"><fgColor rgb="FFF4F7F4"/><bgColor indexed="64"/></patternFill></fill>']
  // Indices: text, title, heading, alternating text, integer, alternating integer,
  // decimal, percent, date, note, section, total, total integer, signed, signed decimal.
  const defs = [[0,0,0],[1,0,0],[2,2,0],[0,3,0],[0,0,3],[0,3,3],[0,0,4],[0,0,10],[0,0,164],[3,0,0],[2,3,0],[2,3,0],[2,3,3],[0,0,165],[0,0,166]]
  return `${declaration}<styleSheet xmlns="${main}"><numFmts count="3"><numFmt numFmtId="164" formatCode="dd mmm yyyy"/><numFmt numFmtId="165" formatCode="+0;-0;0"/><numFmt numFmtId="166" formatCode="+#,##0.00;-#,##0.00;0.00"/></numFmts><fonts count="${fonts.length}">${fonts.join("")}</fonts><fills count="4">${fills.join("")}</fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${defs.length}">${defs.map(([fontId,fillId,numFmtId],i) => `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center" horizontal="${[4,5,6,7,12,13,14].includes(i) ? "right" : "left"}" wrapText="1" indent="1"/></xf>`).join("")}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
}

function chartXml(chart: ReportChart, font: string) {
  const points = (values: (string | number)[]) => `<c:ptCount val="${values.length}"/>${values.map((v, i) => `<c:pt idx="${i}"><c:v>${xml(v)}</c:v></c:pt>`).join("")}`
  const series = chart.series.map((s, i) => `<c:ser><c:idx val="${i}"/><c:order val="${i}"/><c:tx><c:v>${xml(s.name)}</c:v></c:tx><c:spPr>${chart.kind === "bar" ? `<a:solidFill><a:srgbClr val="${s.color}"/></a:solidFill>` : ""}<a:ln w="25400"><a:solidFill><a:srgbClr val="${s.color}"/></a:solidFill>${i ? '<a:prstDash val="dash"/>' : ""}</a:ln></c:spPr>${chart.kind === "line" ? '<c:marker><c:symbol val="none"/></c:marker>' : ""}<c:cat><c:strRef><c:f>${xml(chart.categoryRange)}</c:f><c:strCache>${points(chart.categories)}</c:strCache></c:strRef></c:cat><c:val><c:numRef><c:f>${xml(s.range)}</c:f><c:numCache><c:formatCode>0</c:formatCode>${points(s.values)}</c:numCache></c:numRef></c:val>${chart.kind === "line" ? '<c:smooth val="0"/>' : ""}</c:ser>`).join("")
  const horizontal = chart.kind === "bar"
  const plot = horizontal ? `<c:barChart><c:barDir val="bar"/><c:grouping val="clustered"/>${series}<c:dLbls><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/></c:dLbls><c:gapWidth val="65"/><c:axId val="10"/><c:axId val="20"/></c:barChart>` : `<c:lineChart><c:grouping val="standard"/>${series}<c:axId val="10"/><c:axId val="20"/></c:lineChart>`
  const text = `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1100"><a:latin typeface="${xml(font)}"/></a:defRPr></a:pPr><a:endParaRPr lang="es-SV"/></a:p></c:txPr>`
  return `${declaration}<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:lang val="es-SV"/><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="es-SV" sz="1400" b="1"><a:latin typeface="${xml(font)}"/></a:rPr><a:t>${xml(chart.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>${plot}<c:catAx><c:axId val="10"/><c:scaling><c:orientation val="${horizontal ? "maxMin" : "minMax"}"/></c:scaling><c:delete val="0"/><c:axPos val="${horizontal ? "l" : "b"}"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${text}<c:crossAx val="20"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/>${!horizontal ? `<c:tickLblSkip val="${Math.max(1,Math.ceil(chart.categories.length / 7))}"/>` : ""}</c:catAx><c:valAx><c:axId val="20"/><c:scaling><c:orientation val="minMax"/><c:min val="0"/>${chart.series.every(s => s.values.every(v => v === 0)) ? '<c:max val="1"/>' : ""}</c:scaling><c:delete val="0"/><c:axPos val="${horizontal ? "b" : "l"}"/><c:majorGridlines><c:spPr><a:ln><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${text}<c:crossAx val="10"/><c:crosses val="autoZero"/><c:crossBetween val="between"/><c:majorUnit val="${Math.max(1,Math.ceil(Math.max(0,...chart.series.flatMap(s => s.values))/5))}"/></c:valAx></c:plotArea>${chart.series.length > 1 ? `<c:legend><c:legendPos val="b"/><c:overlay val="0"/>${text}</c:legend>` : ""}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/><c:showDLblsOverMax val="0"/></c:chart><c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:chartSpace>`
}

export function createReportWorkbook(sheets: ReportSheet[], charts: ReportChart[], accent = "8BC646", font = "Segoe UI") {
  accent = /^[0-9a-f]{6}$/i.test(accent) ? accent : "8BC646"
  const relationship = (id: string, type: string, target: string) => `<Relationship Id="${id}" Type="${rel}/${type}" Target="${target}"/>`
  const relationships = (content: string) => `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${content}</Relationships>`
  const files: Record<string,string> = {
    "_rels/.rels": relationships(relationship("workbook","officeDocument","xl/workbook.xml")),
    "xl/workbook.xml": `${declaration}<workbook xmlns="${main}" xmlns:r="${rel}"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${sheets.map((s,i) => `<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="sheet${i+1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
    "xl/_rels/workbook.xml.rels": relationships(sheets.map((_,i) => relationship(`sheet${i+1}`,"worksheet",`worksheets/sheet${i+1}.xml`)).join("") + relationship("styles","styles","styles.xml")),
    "xl/styles.xml": styles(accent,font),
  }
  sheets.forEach((s,i) => { files[`xl/worksheets/sheet${i+1}.xml`] = worksheet(s,i === 1 && charts.length > 0) })
  if (charts.length) {
    files["xl/worksheets/_rels/sheet2.xml.rels"] = relationships(relationship("drawing","drawing","../drawings/drawing1.xml"))
    files["xl/drawings/_rels/drawing1.xml.rels"] = relationships(charts.map((_,i) => relationship(`chart${i+1}`,"chart",`../charts/chart${i+1}.xml`)).join(""))
    files["xl/drawings/drawing1.xml"] = `${declaration}<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${charts.map((chart,i) => `<xdr:twoCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>8</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.row+15}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i+1}" name="${xml(chart.title)}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="${rel}" r:id="chart${i+1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`).join("")}</xdr:wsDr>`
    charts.forEach((c,i) => { files[`xl/charts/chart${i+1}.xml`] = chartXml(c,font) })
  }
  const override = (path: string,type: string) => `<Override PartName="/${path}" ContentType="application/vnd.openxmlformats-officedocument.${type}+xml"/>`
  files["[Content_Types].xml"] = `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${override("xl/workbook.xml","spreadsheetml.sheet.main")}${override("xl/styles.xml","spreadsheetml.styles")}${sheets.map((_,i) => override(`xl/worksheets/sheet${i+1}.xml`,"spreadsheetml.worksheet")).join("")}${charts.length ? override("xl/drawings/drawing1.xml","drawing") : ""}${charts.map((_,i) => override(`xl/charts/chart${i+1}.xml`,"drawingml.chart")).join("")}</Types>`
  return zip(files)
}
