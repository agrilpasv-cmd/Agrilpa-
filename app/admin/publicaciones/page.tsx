"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  AdminWorkspace,
  AdminHeader,
  AdminMetrics,
  AdminSearch,
  AdminSelect,
  AdminNotice,
  AdminEmpty,
  Button,
  Card,
  CardContent,
  adminStyles as s,
  adminDate
} from "@/components/admin/workspace"

interface Product {
  id: string
  title: string
  category: string
  price: string | number
  price_type?: string
  currency?: string
  unit?: string
  created_at: string
  user_id: string
  user?: { full_name?: string; email?: string; company_name?: string }
}
export default function AdminPublicationsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [deleting, setDeleting] = useState(false)
  const [target, setTarget] = useState<Product | null>(null)
  const { toast } = useToast()
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok || !Array.isArray(result))
        throw new Error(result.error || "No pudimos cargar las publicaciones.")
      setProducts(result)
      setLoaded(true)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar las publicaciones."
      )
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])
  const categories = [
    ...new Set(products.map((product) => product.category).filter(Boolean))
  ].sort()
  const shown = products.filter(
    (product) =>
      (category === "all" || product.category === category) &&
      [
        product.title,
        product.category,
        product.user?.full_name,
        product.user?.company_name,
        product.user?.email
      ].some((value) =>
        value
          ?.toLocaleLowerCase("es")
          .includes(query.trim().toLocaleLowerCase("es"))
      )
  )
  const remove = async () => {
    if (!target || deleting) return
    setDeleting(true)
    try {
      const response = await fetch("/api/admin/products/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id })
      })
      if (!response.ok) throw new Error("No pudimos eliminar la publicación.")
      setProducts((previous) =>
        previous.filter((product) => product.id !== target.id)
      )
      setTarget(null)
      toast({ title: "Publicación eliminada" })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos eliminar la publicación."
      )
    } finally {
      setDeleting(false)
    }
  }
  return (
    <AdminWorkspace>
      <AdminHeader
        title="Publicaciones"
        description="Consulta los productos publicados y gestiona su información."
        actions={
          <>
            <Button
              variant="outline"
              onClick={fetchProducts}
              disabled={loading}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Actualizar
            </Button>
            <Button asChild>
              <Link href="/admin/publicaciones/nueva">
                <Plus size={16} aria-hidden="true" />
                Nueva publicación
              </Link>
            </Button>
          </>
        }
      />
      {error && <AdminNotice error>{error}</AdminNotice>}
      <AdminMetrics
        items={[
          {
            label: "Publicaciones consultadas",
            value: loaded ? products.length : null,
            hint: "Registros de este listado"
          },
          {
            label: "Vendedores",
            value: loaded
              ? new Set(
                  products.map((product) => product.user_id).filter(Boolean)
                ).size
              : null,
            hint: "Con publicaciones en este listado"
          },
          {
            label: "Categorías",
            value: loaded ? categories.length : null,
            hint: "Con productos registrados"
          }
        ]}
      />
      <Card>
        <CardContent>
          <div className={s.toolbar}>
            <AdminSearch
              value={query}
              onChange={setQuery}
              label="Buscar producto, vendedor o empresa"
            />
            <AdminSelect
              value={category}
              onChange={setCategory}
              label="Filtrar categoría"
              options={[
                { value: "all", label: "Todas las categorías" },
                ...categories.map((value) => ({ value, label: value }))
              ]}
            />
          </div>
          <p className={s.secondary}>
            {shown.length} publicaciones en la lista
            {query || category !== "all" ? " filtrada" : ""}.
          </p>
        </CardContent>
        <div className={s.tableScroll}>
          {loading && !loaded ? (
            <AdminEmpty title="Cargando publicaciones…" />
          ) : shown.length === 0 ? (
            <AdminEmpty
              title={
                products.length ? "No hay coincidencias" : "Sin publicaciones"
              }
              description={
                products.length
                  ? "Prueba con otro término o categoría."
                  : "Aquí aparecerán los productos registrados."
              }
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Precio publicado</th>
                  <th scope="col">Vendedor</th>
                  <th scope="col">Registro</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link
                        href={`/producto/${product.id}`}
                        className={s.productLink}
                      >
                        <img
                          className={s.thumb}
                          src={`/api/products/${product.id}/thumb`}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null
                            event.currentTarget.src = "/placeholder.svg"
                          }}
                        />
                        <span className={s.rowTitle}>{product.title}</span>
                      </Link>
                    </td>
                    <td>{product.category || "Sin categoría"}</td>
                    <td>
                      {product.price_type === "quote" ||
                      product.price === "" ||
                      product.price == null ||
                      product.price === "Por Cotizar" ? (
                        "Por cotizar"
                      ) : (
                        <>
                          {product.price} {product.currency || ""} /{" "}
                          {product.unit || "kg"}
                          {!product.currency && (
                            <small className={s.rowMeta}>
                              Moneda no indicada
                            </small>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      <span className={s.rowTitle}>
                        {product.user?.company_name ||
                          product.user?.full_name ||
                          "Sin nombre"}
                      </span>
                      <span className={s.rowMeta}>{product.user?.email}</span>
                    </td>
                    <td>{adminDate(product.created_at)}</td>
                    <td>
                      <div className={s.actions}>
                        <Button
                          asChild
                          variant="ghost"
                          aria-label={`Editar ${product.title}`}
                        >
                          <Link
                            href={`/admin/publicaciones/${product.id}/editar`}
                          >
                            <Pencil size={17} />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          aria-label={`Ver ${product.title}`}
                        >
                          <Link href={`/producto/${product.id}`}>
                            <Eye size={17} />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label={`Eliminar ${product.title}`}
                          onClick={() => setTarget(product)}
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
      <AlertDialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open && !deleting) setTarget(null)
        }}
      >
        <AlertDialogContent className={s.dialog}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará “{target?.title}” permanentemente del catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={remove}>
              {deleting ? "Eliminando…" : "Eliminar publicación"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  )
}
