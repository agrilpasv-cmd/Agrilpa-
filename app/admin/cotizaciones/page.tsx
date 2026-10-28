"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { RefreshCw, Trash2 } from "lucide-react"
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
  CardHeader,
  CardTitle,
  adminStyles as s,
  adminDate
} from "@/components/admin/workspace"

interface Person {
  company_name: string | null
  full_name: string | null
  email: string
}
interface Quotation {
  id: string
  product_id: string
  product_title: string
  product_image?: string
  buyer_name: string
  contact_method?: string
  country_code?: string | null
  phone_number?: string | null
  email?: string | null
  quantity: number
  destination_country: string
  estimated_date?: string
  notes?: string | null
  target_price?: number | null
  incoterm?: string | null
  currency?: string
  status: string
  created_at: string
  seller?: Person
  buyer?: Person
}
const statuses: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  replied: "Respondida",
  rejected: "Rechazada"
}
export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false)
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all")
  const [selected, setSelected] = useState<Set<string>>(new Set()),
    [targetIds, setTargetIds] = useState<string[]>([])
  const [detail, setDetail] = useState<Quotation | null>(null)
  const fetchQuotations = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/admin/quotations", {
        cache: "no-store"
      })
      const result = await response.json()
      if (!response.ok || !Array.isArray(result.quotations))
        throw new Error(result.error || "No pudimos cargar las cotizaciones.")
      setQuotations(result.quotations)
      setLoaded(true)
      setSelected(
        (previous) =>
          new Set(
            [...previous].filter((id) =>
              result.quotations.some((item: Quotation) => item.id === id)
            )
          )
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar las cotizaciones."
      )
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])
  const shown = quotations.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      [
        item.product_title,
        item.buyer_name,
        item.buyer?.company_name,
        item.seller?.company_name,
        item.seller?.full_name,
        item.destination_country
      ].some((value) =>
        value
          ?.toLocaleLowerCase("es")
          .includes(query.trim().toLocaleLowerCase("es"))
      )
  )
  const allSelected =
    shown.length > 0 && shown.every((item) => selected.has(item.id))
  const ranking = new Map<
    string,
    { id: string; title: string; count: number }
  >()
  quotations.forEach((item) => {
    if (item.product_id) {
      const row = ranking.get(item.product_id) || {
        id: item.product_id,
        title: item.product_title || "Producto sin título",
        count: 0
      }
      row.count++
      ranking.set(item.product_id, row)
    }
  })
  const top = [...ranking.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const remove = async () => {
    if (!targetIds.length || busy) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const params = new URLSearchParams(
        targetIds.length === 1
          ? { id: targetIds[0] }
          : { ids: targetIds.join(",") }
      )
      const response = await fetch(`/api/admin/quotations?${params}`, {
        method: "DELETE"
      })
      if (!response.ok)
        throw new Error("No pudimos eliminar las cotizaciones seleccionadas.")
      setQuotations((previous) =>
        previous.filter((item) => !targetIds.includes(item.id))
      )
      setSelected(
        (previous) =>
          new Set([...previous].filter((id) => !targetIds.includes(id)))
      )
      if (detail && targetIds.includes(detail.id)) setDetail(null)
      setTargetIds([])
      setNotice("Registros de cotización eliminados.")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos eliminar los registros."
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <AdminWorkspace>
      <AdminHeader
        title="Cotizaciones"
        description="Revisa las solicitudes de compra, sus participantes y las condiciones solicitadas."
        actions={
          <Button
            variant="outline"
            disabled={loading}
            onClick={fetchQuotations}
          >
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
            label: "Cotizaciones consultadas",
            value: loaded ? quotations.length : null,
            hint: "Registros de este listado"
          },
          {
            label: "Pendientes",
            value: loaded
              ? quotations.filter((item) => item.status === "pending").length
              : null,
            hint: "Con estado pendiente"
          },
          {
            label: "Aceptadas",
            value: loaded
              ? quotations.filter((item) => item.status === "accepted").length
              : null,
            hint: "Con estado aceptado"
          },
          {
            label: "Rechazadas",
            value: loaded
              ? quotations.filter((item) => item.status === "rejected").length
              : null,
            hint: "Con estado rechazado"
          }
        ]}
      />
      <Card>
        <CardContent>
          <div className={s.toolbar}>
            <AdminSearch
              value={query}
              onChange={setQuery}
              label="Buscar producto, comprador, vendedor o destino"
            />
            <AdminSelect
              value={status}
              onChange={setStatus}
              label="Filtrar estado de cotización"
              options={[
                { value: "all", label: "Todos los estados" },
                ...Object.entries(statuses).map(([value, label]) => ({
                  value,
                  label
                }))
              ]}
            />
          </div>
          {!!selected.size && (
            <div className={s.toolbar}>
              <span>{selected.size} cotizaciones seleccionadas</span>
              <div className={s.filters}>
                <Button
                  variant="outline"
                  onClick={() => setSelected(new Set())}
                  disabled={busy}
                >
                  Deseleccionar
                </Button>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => setTargetIds([...selected])}
                >
                  Eliminar seleccionadas
                </Button>
              </div>
            </div>
          )}
          <p className={s.secondary}>
            {shown.length} cotizaciones en la lista
            {status !== "all" || query ? " filtrada" : ""}.
          </p>
        </CardContent>
        <div className={s.tableScroll}>
          {loading && !loaded ? (
            <AdminEmpty title="Cargando cotizaciones…" />
          ) : !shown.length ? (
            <AdminEmpty
              title={
                quotations.length
                  ? "No hay coincidencias"
                  : "Todavía no hay cotizaciones"
              }
              description="Las solicitudes de los compradores aparecerán en esta sección."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    <Checkbox
                      aria-label="Seleccionar cotizaciones visibles"
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
                  <th scope="col">Producto</th>
                  <th scope="col">Comprador</th>
                  <th scope="col">Vendedor</th>
                  <th scope="col">Cantidad y destino</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id} data-selected={selected.has(item.id)}>
                    <td>
                      <Checkbox
                        aria-label={`Seleccionar cotización ${item.id}`}
                        checked={selected.has(item.id)}
                        onCheckedChange={(checked) =>
                          setSelected((previous) => {
                            const next = new Set(previous)
                            checked ? next.add(item.id) : next.delete(item.id)
                            return next
                          })
                        }
                      />
                    </td>
                    <td>
                      <Link
                        href={`/producto/${item.product_id}`}
                        className={s.productLink}
                      >
                        {item.product_image && (
                          <img
                            className={s.thumb}
                            src={item.product_image}
                            alt=""
                            loading="lazy"
                          />
                        )}
                        <span className={s.rowTitle}>{item.product_title}</span>
                      </Link>
                    </td>
                    <td>
                      <span className={s.rowTitle}>
                        {item.buyer_name ||
                          item.buyer?.full_name ||
                          "Sin nombre"}
                      </span>
                      <span className={s.rowMeta}>
                        {item.buyer?.company_name}
                      </span>
                    </td>
                    <td>
                      {item.seller?.company_name ||
                        item.seller?.full_name ||
                        "Sin nombre"}
                    </td>
                    <td>
                      <span className={s.rowTitle}>{item.quantity}</span>
                      <span className={s.rowMeta}>
                        {item.destination_country || "Sin indicar"}
                      </span>
                    </td>
                    <td>
                      <AdminStatus>
                        {statuses[item.status] || item.status || "Sin estado"}
                      </AdminStatus>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {adminDate(item.created_at)}
                    </td>
                    <td>
                      <div className={s.actions}>
                        <Button
                          variant="outline"
                          onClick={() => setDetail(item)}
                        >
                          Ver detalle
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label={`Eliminar cotización ${item.id}`}
                          onClick={() => setTargetIds([item.id])}
                        >
                          <Trash2 size={17} />
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
      {!!top.length && (
        <Card style={{ marginTop: 20 }}>
          <CardHeader>
            <CardTitle>Productos más solicitados</CardTitle>
            <p className={s.secondary}>
              Según las cotizaciones de este listado.
            </p>
          </CardHeader>
          <CardContent>
            <div className={s.fields}>
              {top.map((item) => (
                <Link
                  className={s.productLink}
                  key={item.id}
                  href={`/producto/${item.id}`}
                >
                  <span className={s.rowTitle}>{item.title}</span>
                  <AdminStatus>
                    {item.count}{" "}
                    {item.count === 1 ? "solicitud" : "solicitudes"}
                  </AdminStatus>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
      >
        <DialogContent className={`${s.dialog} sm:max-w-3xl`}>
          <DialogHeader>
            <DialogTitle>Detalle de cotización</DialogTitle>
            <DialogDescription>
              Recibida {detail && adminDate(detail.created_at, true)}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <div className={s.toolbar}>
                <Link
                  className={s.productLink}
                  href={`/producto/${detail.product_id}`}
                >
                  {detail.product_image && (
                    <img
                      className={s.thumb}
                      src={detail.product_image}
                      alt=""
                    />
                  )}
                  <span className={s.rowTitle}>{detail.product_title}</span>
                </Link>
                <AdminStatus>
                  {statuses[detail.status] || detail.status}
                </AdminStatus>
              </div>
              <dl className={s.detailGrid}>
                <div>
                  <dt>Comprador</dt>
                  <dd>
                    {detail.buyer_name ||
                      detail.buyer?.full_name ||
                      "Sin nombre"}
                    {detail.buyer?.company_name && (
                      <p>{detail.buyer.company_name}</p>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Vendedor</dt>
                  <dd>
                    {detail.seller?.company_name ||
                      detail.seller?.full_name ||
                      "Sin nombre"}
                    {detail.seller?.email && <p>{detail.seller.email}</p>}
                  </dd>
                </div>
                <div>
                  <dt>Cantidad solicitada</dt>
                  <dd>{detail.quantity}</dd>
                </div>
                <div>
                  <dt>Destino</dt>
                  <dd>{detail.destination_country || "Sin indicar"}</dd>
                </div>
                <div>
                  <dt>Entrega estimada</dt>
                  <dd>
                    {detail.estimated_date
                      ? adminDate(detail.estimated_date)
                      : "Sin indicar"}
                  </dd>
                </div>
                <div>
                  <dt>Precio objetivo</dt>
                  <dd>
                    {detail.target_price == null
                      ? "Sin indicar"
                      : `${detail.target_price} ${detail.currency || "(moneda no indicada)"}`}
                  </dd>
                </div>
                <div>
                  <dt>Incoterm solicitado</dt>
                  <dd>{detail.incoterm || "Sin definir"}</dd>
                </div>
                <div>
                  <dt>Correo registrado</dt>
                  <dd>
                    {detail.email || detail.buyer?.email || "Sin indicar"}
                  </dd>
                </div>
                <div>
                  <dt>Teléfono registrado</dt>
                  <dd>
                    {detail.phone_number
                      ? `${detail.country_code || ""} ${detail.phone_number}`.trim()
                      : "Sin indicar"}
                  </dd>
                </div>
                <div>
                  <dt>Canal registrado en la solicitud</dt>
                  <dd>{detail.contact_method || "Sin indicar"}</dd>
                </div>
              </dl>
              <div>
                <h3 className={s.rowTitle} style={{ marginBottom: 10 }}>
                  Notas del comprador
                </h3>
                <div className={s.message}>
                  {detail.notes || "Sin notas adicionales."}
                </div>
              </div>
              <p className={s.secondary}>Referencia: {detail.id}</p>
              <Button variant="outline" onClick={() => setDetail(null)}>
                Cerrar detalle
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!targetIds.length}
        onOpenChange={(open) => {
          if (!open && !busy) setTargetIds([])
        }}
      >
        <AlertDialogContent className={s.dialog}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetIds.length === 1
                ? "¿Eliminar esta cotización?"
                : `¿Eliminar ${targetIds.length} cotizaciones?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán los registros seleccionados de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={busy} onClick={remove}>
              {busy ? "Eliminando…" : "Confirmar eliminación"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  )
}
