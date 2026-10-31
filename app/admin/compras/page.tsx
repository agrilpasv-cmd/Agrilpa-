"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AdminWorkspace,
  AdminHeader,
  AdminMetrics,
  AdminSearch,
  AdminSelect,
  AdminEmpty,
  Button,
  Card,
  CardContent,
  adminStyles as s,
  adminDate,
} from "@/components/admin/workspace"

interface Purchase {
  id: string
  full_name: string
  email: string
  product_name: string
  quantity_kg: number
  price_usd: number
  address: string
  city: string
  state: string
  country: string
  created_at: string
  user_id: string
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState("")
  const [countryFilter, setCountryFilter] = useState("all")
  const [detail, setDetail] = useState<Purchase | null>(null)

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const { createBrowserClient } = await import("@/lib/supabase/client")
      const supabase = createBrowserClient()

      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setPurchases(data || [])
      setLoaded(true)
    } catch (error) {
      console.error("[Agrilpa] Error fetching purchases:", error)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(true)
    const interval = setInterval(() => fetchData(false), 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const countries = useMemo(
    () =>
      [
        ...new Set(
          purchases.map((item) => item.country?.trim()).filter(Boolean),
        ),
      ].sort(),
    [purchases],
  )

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es")
    return purchases.filter((item) => {
      if (countryFilter !== "all" && item.country !== countryFilter) {
        return false
      }
      if (!q) return true
      return [
        item.full_name,
        item.email,
        item.product_name,
        item.city,
        item.state,
        item.country,
      ].some((val) => val?.toLocaleLowerCase("es").includes(q))
    })
  }, [purchases, countryFilter, query])

  const totalRevenue = useMemo(
    () => shown.reduce((sum, p) => sum + (Number(p.price_usd) || 0), 0),
    [shown],
  )

  const totalQuantity = useMemo(
    () => shown.reduce((sum, p) => sum + (Number(p.quantity_kg) || 0), 0),
    [shown],
  )

  return (
    <AdminWorkspace>
      <AdminHeader
        title="Compras"
        description="Consulta las órdenes de compra registradas, los volúmenes solicitados y los datos de entrega."
        actions={
          <Button
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={loading}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />

      <AdminMetrics
        items={[
          {
            label: "Compras registradas",
            value: loaded ? purchases.length : null,
            hint: "Órdenes totales en la plataforma",
            active: countryFilter === "all" && !query,
            onClick: () => {
              setCountryFilter("all")
              setQuery("")
            },
          },
          {
            label: "Ingresos acumulados",
            value: loaded ? formatUsd(totalRevenue) : null,
            hint:
              countryFilter !== "all" || query
                ? "Suma en USD de la lista filtrada"
                : "Suma total en USD de las órdenes",
          },
          {
            label: "Volumen total",
            value: loaded
              ? `${new Intl.NumberFormat("es-SV").format(totalQuantity)} kg`
              : null,
            hint: "Cantidad acumulada en kilogramos",
          },
        ]}
      />

      <Card>
        <CardContent>
          <div className={s.toolbar}>
            <AdminSearch
              value={query}
              onChange={setQuery}
              label="Buscar comprador, correo, producto o ciudad"
            />
            <AdminSelect
              value={countryFilter}
              onChange={setCountryFilter}
              label="Filtrar por país"
              options={[
                { value: "all", label: "Todos los países" },
                ...countries.map((value) => ({ value, label: value })),
              ]}
            />
          </div>
          <p className={s.secondary}>
            {shown.length} {shown.length === 1 ? "compra" : "compras"} en la
            lista
            {query || countryFilter !== "all" ? " filtrada" : ""}.
          </p>
        </CardContent>

        <div className={s.tableScroll}>
          {loading && !loaded ? (
            <AdminEmpty title="Cargando compras…" />
          ) : shown.length === 0 ? (
            <AdminEmpty
              title={
                purchases.length
                  ? "No hay coincidencias"
                  : "Todavía no hay compras registradas"
              }
              description="Las órdenes completadas por los compradores aparecerán en esta sección."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Comprador</th>
                  <th>Correo</th>
                  <th>Producto</th>
                  <th>Cantidad (kg)</th>
                  <th>Monto (USD)</th>
                  <th>Ubicación</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((purchase) => {
                  const location = [
                    purchase.city,
                    purchase.state,
                    purchase.country,
                  ]
                    .filter(Boolean)
                    .join(", ")

                  return (
                    <tr key={purchase.id}>
                      <td>
                        <span className={s.rowTitle}>
                          {purchase.full_name || "-"}
                        </span>
                      </td>
                      <td>{purchase.email || "-"}</td>
                      <td>
                        <span className={s.rowTitle}>
                          {purchase.product_name || "-"}
                        </span>
                      </td>
                      <td>
                        {new Intl.NumberFormat("es-SV").format(
                          Number(purchase.quantity_kg) || 0,
                        )}{" "}
                        kg
                      </td>
                      <td>{formatUsd(Number(purchase.price_usd) || 0)}</td>
                      <td>{location || "-"}</td>
                      <td>
                        {purchase.created_at
                          ? adminDate(purchase.created_at)
                          : "-"}
                      </td>
                      <td>
                        <div className={s.actions}>
                          <Button
                            variant="outline"
                            onClick={() => setDetail(purchase)}
                          >
                            Ver detalle
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
      >
        <DialogContent className={s.dialog}>
          <DialogHeader>
            <DialogTitle>
              {detail?.product_name || "Detalle de compra"}
            </DialogTitle>
            <DialogDescription>
              Orden registrada el{" "}
              {detail?.created_at ? adminDate(detail.created_at, true) : "-"}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <dl className={s.detailGrid}>
              <div>
                <dt>Comprador</dt>
                <dd>{detail.full_name || "-"}</dd>
              </div>
              <div>
                <dt>Correo electrónico</dt>
                <dd>{detail.email || "-"}</dd>
              </div>
              <div>
                <dt>Producto</dt>
                <dd>{detail.product_name || "-"}</dd>
              </div>
              <div>
                <dt>Cantidad solicitada</dt>
                <dd>
                  {new Intl.NumberFormat("es-SV").format(
                    Number(detail.quantity_kg) || 0,
                  )}{" "}
                  kg
                </dd>
              </div>
              <div>
                <dt>Monto total (USD)</dt>
                <dd>{formatUsd(Number(detail.price_usd) || 0)}</dd>
              </div>
              <div>
                <dt>País</dt>
                <dd>{detail.country || "-"}</dd>
              </div>
              <div>
                <dt>Estado / Provincia</dt>
                <dd>{detail.state || "-"}</dd>
              </div>
              <div>
                <dt>Ciudad</dt>
                <dd>{detail.city || "-"}</dd>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <dt>Dirección de entrega</dt>
                <dd>{detail.address || "-"}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </AdminWorkspace>
  )
}
