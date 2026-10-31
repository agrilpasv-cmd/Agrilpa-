"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Star,
  X,
} from "lucide-react"
import styles from "./visibilidad.module.css"

interface UserProduct {
  id: string
  title: string
  category: string
  price: string
  image: string
  is_visible: boolean
  user: {
    full_name: string
    company_name: string
  }
}

type ActiveTab = "user" | "featured"
type StatusFilter = "all" | "visible" | "hidden"

export default function VisibilityPage() {
  const [userProducts, setUserProducts] = useState<UserProduct[]>([])
  const [featuredIds, setFeaturedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [savingFeatured, setSavingFeatured] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<ActiveTab>("user")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const [userRes, featuredRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/visibility/featured-products"),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUserProducts(userData || [])
      }

      if (featuredRes.ok) {
        const featuredData = await featuredRes.json()
        setFeaturedIds(featuredData.featuredProductIds || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const toggleFeatured = (productId: string) => {
    setFeaturedIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      }
      if (prev.length >= 4) {
        toast({
          title: "Límite alcanzado",
          description: "Solo puedes destacar un máximo de 4 productos en la página de inicio.",
          variant: "destructive",
        })
        return prev
      }
      return [...prev, productId]
    })
  }

  const moveFeatured = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= featuredIds.length) return

    const updated = [...featuredIds]
    const temp = updated[index]
    updated[index] = updated[nextIndex]
    updated[nextIndex] = temp
    setFeaturedIds(updated)
  }

  const saveFeaturedProducts = async () => {
    setSavingFeatured(true)
    try {
      const res = await fetch("/api/admin/visibility/featured-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featuredProductIds: featuredIds }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: "Productos destacados guardados",
          description: "Los productos destacados de la página de inicio se han actualizado correctamente.",
        })
      } else {
        throw new Error(data.error || "Error al guardar")
      }
    } catch (error: any) {
      console.error("Error saving featured products:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los productos destacados",
        variant: "destructive",
      })
    } finally {
      setSavingFeatured(false)
    }
  }

  const toggleUserProductVisibility = async (productId: string, currentVisibility: boolean) => {
    setUpdating(productId)
    try {
      const payload = {
        productId,
        isVisible: !currentVisibility,
      }

      const res = await fetch("/api/admin/visibility/user-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setUserProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, is_visible: !currentVisibility } : p)),
        )
        toast({
          title: "Visibilidad actualizada",
          description: `Producto ${!currentVisibility ? "visible" : "oculto"} correctamente`,
        })
      } else {
        throw new Error(data.error || "No se pudo actualizar")
      }
    } catch (error) {
      console.error("Error updating visibility:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la visibilidad. Verifica la configuración en Supabase.",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const matchesSearch = (product: UserProduct) => {
    if (!normalizedQuery) return true
    const seller = `${product.user?.company_name || ""} ${product.user?.full_name || ""}`.toLowerCase()
    return (
      product.title.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      seller.includes(normalizedQuery)
    )
  }

  const filteredUserProducts = useMemo(() => {
    return userProducts.filter((p) => {
      if (statusFilter === "visible" && !p.is_visible) return false
      if (statusFilter === "hidden" && p.is_visible) return false
      return matchesSearch(p)
    })
  }, [userProducts, statusFilter, normalizedQuery])

  const visibleCatalogProducts = useMemo(() => {
    return userProducts.filter((p) => p.is_visible && matchesSearch(p))
  }, [userProducts, normalizedQuery])

  const userVisibleCount = useMemo(() => userProducts.filter((p) => p.is_visible).length, [userProducts])
  const userHiddenCount = userProducts.length - userVisibleCount

  const getSellerLabel = (product: UserProduct) => {
    return product.user?.company_name || product.user?.full_name || "-"
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 className={styles.spin} size={28} />
          <span>Cargando catálogo y visibilidad...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Control de visibilidad</h1>
            <p>
              Administra qué publicaciones aparecen en el catálogo público y define los 4 productos destacados de la portada.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? styles.spin : undefined} />
              Actualizar
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={saveFeaturedProducts}
              disabled={savingFeatured}
            >
              {savingFeatured ? (
                <Loader2 size={15} className={styles.spin} />
              ) : (
                <Save size={15} />
              )}
              {savingFeatured ? "Guardando..." : "Guardar destacados"}
            </button>
          </div>
        </header>

        <dl className={styles.metrics}>
          <button
            type="button"
            className={styles.metric}
            aria-pressed={activeTab === "user" && statusFilter === "all"}
            onClick={() => {
              setActiveTab("user")
              setStatusFilter("all")
            }}
          >
            <dt>Publicaciones en catálogo</dt>
            <dd>{userProducts.length}</dd>
            <span>Total de productos registrados por usuarios</span>
          </button>

          <button
            type="button"
            className={styles.metric}
            aria-pressed={activeTab === "user" && statusFilter === "visible"}
            onClick={() => {
              setActiveTab("user")
              setStatusFilter("visible")
            }}
          >
            <dt>Visibles en catálogo</dt>
            <dd>{userVisibleCount}</dd>
            <span>Activos en búsquedas y listado público</span>
          </button>

          <button
            type="button"
            className={styles.metric}
            aria-pressed={activeTab === "user" && statusFilter === "hidden"}
            onClick={() => {
              setActiveTab("user")
              setStatusFilter("hidden")
            }}
          >
            <dt>Ocultos del catálogo</dt>
            <dd>{userHiddenCount}</dd>
            <span>Pausados temporalmente de la vista pública</span>
          </button>

          <button
            type="button"
            className={styles.metric}
            aria-pressed={activeTab === "featured"}
            onClick={() => setActiveTab("featured")}
          >
            <dt>Destacados en inicio</dt>
            <dd>{featuredIds.length} / 4</dd>
            <span>Espacios manuales asignados en la portada</span>
          </button>
        </dl>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.toolbar}>
              <div className={styles.search}>
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Buscar por producto, categoría o empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.clearSearch}
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className={styles.toolbarRight}>
                {activeTab === "user" ? (
                  <>
                    <div className={styles.filterGroup} role="group" aria-label="Filtrar por estado de visibilidad">
                      <button
                        type="button"
                        className={styles.filterBtn}
                        aria-pressed={statusFilter === "all"}
                        onClick={() => setStatusFilter("all")}
                      >
                        Todos ({userProducts.length})
                      </button>
                      <button
                        type="button"
                        className={styles.filterBtn}
                        aria-pressed={statusFilter === "visible"}
                        onClick={() => setStatusFilter("visible")}
                      >
                        Visibles ({userVisibleCount})
                      </button>
                      <button
                        type="button"
                        className={styles.filterBtn}
                        aria-pressed={statusFilter === "hidden"}
                        onClick={() => setStatusFilter("hidden")}
                      >
                        Ocultos ({userHiddenCount})
                      </button>
                    </div>
                    <span className={styles.resultCount}>
                      {filteredUserProducts.length} de {userProducts.length} publicaciones
                    </span>
                  </>
                ) : (
                  <span className={styles.resultCount}>
                    {visibleCatalogProducts.length} productos visibles disponibles
                  </span>
                )}
              </div>
            </div>

            <div className={styles.tabs} role="tablist" aria-label="Secciones de visibilidad">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "user"}
                onClick={() => setActiveTab("user")}
              >
                Productos de usuarios
                <span>{userProducts.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "featured"}
                onClick={() => setActiveTab("featured")}
              >
                Destacados en inicio
                <span>{featuredIds.length}/4</span>
              </button>
            </div>
          </div>

          {activeTab === "user" ? (
            <div className={styles.tableWrap}>
              {filteredUserProducts.length === 0 ? (
                <div className={styles.empty}>
                  <p>No se encontraron publicaciones</p>
                  <span>
                    {searchQuery || statusFilter !== "all"
                      ? "Prueba ajustando la búsqueda o el filtro de estado."
                      : "Todavía no hay productos registrados por usuarios."}
                  </span>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Vendedor / Empresa</th>
                      <th>Portada</th>
                      <th>Estado</th>
                      <th>Visibilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUserProducts.map((product) => {
                      const featuredRank = featuredIds.indexOf(product.id)
                      const isUpdating = updating === product.id

                      return (
                        <tr key={product.id}>
                          <td>
                            <div className={styles.productCell}>
                              <div className={styles.thumb}>
                                <img
                                  src={`/api/products/${product.id}/thumb`}
                                  alt={product.title}
                                  loading="lazy"
                                />
                              </div>
                              <div className={styles.productMeta}>
                                <Link
                                  href={`/producto/${product.id}`}
                                  target="_blank"
                                  className={styles.productTitle}
                                >
                                  <span>{product.title}</span>
                                  <ExternalLink size={13} />
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={styles.categoryBadge}>{product.category}</span>
                          </td>
                          <td className={styles.priceCell}>{product.price}</td>
                          <td className={styles.sellerCell} title={getSellerLabel(product)}>
                            {getSellerLabel(product)}
                          </td>
                          <td>
                            {featuredRank !== -1 ? (
                              <span className={styles.rankBadge}>
                                <Star size={12} />
                                Destacado #{featuredRank + 1}
                              </span>
                            ) : (
                              <span className={styles.mutedDash}>-</span>
                            )}
                          </td>
                          <td>
                            {product.is_visible ? (
                              <span className={`${styles.statusBadge} ${styles.statusVisible}`}>
                                <Eye size={13} />
                                Visible
                              </span>
                            ) : (
                              <span className={`${styles.statusBadge} ${styles.statusHidden}`}>
                                <EyeOff size={13} />
                                Oculto
                              </span>
                            )}
                          </td>
                          <td>
                            <div className={styles.visibilityControl}>
                              <Switch
                                checked={product.is_visible}
                                onCheckedChange={() =>
                                  toggleUserProductVisibility(product.id, product.is_visible)
                                }
                                disabled={isUpdating}
                                aria-label={`Cambiar visibilidad de ${product.title}`}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div>
              <div className={styles.featuredWorkspace}>
                <div className={styles.subCard}>
                  <div className={styles.subCardHead}>
                    <div>
                      <h2>Productos destacados en inicio ({featuredIds.length} de 4)</h2>
                      <p>
                        Ordena hasta 4 publicaciones visibles para mostrarlas en la portada principal.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={saveFeaturedProducts}
                      disabled={savingFeatured}
                    >
                      {savingFeatured ? (
                        <Loader2 size={15} className={styles.spin} />
                      ) : (
                        <Save size={15} />
                      )}
                      {savingFeatured ? "Guardando..." : "Guardar destacados"}
                    </button>
                  </div>

                  {featuredIds.length === 0 ? (
                    <div className={styles.empty}>
                      <p>Sin productos destacados configurados</p>
                      <span>
                        No hay publicaciones fijadas manualmente. La portada mostrará las últimas publicaciones visibles por defecto.
                      </span>
                    </div>
                  ) : (
                    <div className={styles.featuredList}>
                      {featuredIds.map((id, index) => {
                        const product = userProducts.find((p) => p.id === id)
                        if (!product) return null

                        return (
                          <div key={id} className={styles.featuredRow}>
                            <div className={styles.featuredMain}>
                              <span className={styles.rankNumber}>{index + 1}</span>
                              <div className={styles.thumb}>
                                <img
                                  src={`/api/products/${product.id}/thumb`}
                                  alt={product.title}
                                  loading="lazy"
                                />
                              </div>
                              <div className={styles.featuredDetails}>
                                <strong>{product.title}</strong>
                                <div className={styles.featuredSub}>
                                  <span>{product.category}</span>
                                  <span>·</span>
                                  <span>{product.price}</span>
                                  <span>·</span>
                                  <span>{getSellerLabel(product)}</span>
                                </div>
                              </div>
                            </div>

                            <div className={styles.featuredActions}>
                              <button
                                type="button"
                                className={styles.iconAction}
                                onClick={() => moveFeatured(index, "up")}
                                disabled={index === 0}
                                aria-label={`Subir ${product.title}`}
                                title="Subir posición"
                              >
                                <ArrowUp size={15} />
                              </button>
                              <button
                                type="button"
                                className={styles.iconAction}
                                onClick={() => moveFeatured(index, "down")}
                                disabled={index === featuredIds.length - 1}
                                aria-label={`Bajar ${product.title}`}
                                title="Bajar posición"
                              >
                                <ArrowDown size={15} />
                              </button>
                              <button
                                type="button"
                                className={styles.removeAction}
                                onClick={() => toggleFeatured(id)}
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <aside className={styles.subCard}>
                  <div className={styles.subCardHead}>
                    <div>
                      <h2>Funcionamiento de la portada</h2>
                      <p>Criterios aplicados a los espacios destacados del inicio.</p>
                    </div>
                  </div>
                  <div className={styles.guideBody}>
                    <div className={styles.guideItem}>
                      <strong>Carga directa</strong>
                      <p>
                        Al fijar manualmente hasta 4 publicaciones, la página principal consulta directamente la selección configurada.
                      </p>
                    </div>
                    <div className={styles.guideItem}>
                      <strong>Orden manual</strong>
                      <p>
                        Usa las flechas de posición para definir en qué orden aparecen las tarjetas dentro de la portada.
                      </p>
                    </div>
                    <div className={styles.guideItem}>
                      <strong>Requisito de visibilidad</strong>
                      <p>
                        Solo se muestran productos con visibilidad activa. Si ocultas una publicación en el catálogo, deja de mostrarse en el inicio.
                      </p>
                    </div>
                  </div>
                </aside>
              </div>

              <div className={styles.catalogSectionHead}>
                <div>
                  <h2>Seleccionar productos visibles del catálogo</h2>
                  <p>
                    Elige hasta 4 publicaciones activas para incluirlas en la portada principal.
                  </p>
                </div>
                <span className={styles.resultCount}>
                  {featuredIds.length} de 4 seleccionados
                </span>
              </div>

              <div className={styles.tableWrap}>
                {visibleCatalogProducts.length === 0 ? (
                  <div className={styles.empty}>
                    <p>No hay productos visibles disponibles</p>
                    <span>
                      {searchQuery
                        ? "Ningún producto visible coincide con la búsqueda actual."
                        : "Activa la visibilidad de algún producto en la pestaña Productos de usuarios."}
                    </span>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Vendedor / Empresa</th>
                        <th>Posición en inicio</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCatalogProducts.map((product) => {
                        const featuredRank = featuredIds.indexOf(product.id)
                        const isFeatured = featuredRank !== -1

                        return (
                          <tr
                            key={product.id}
                            data-selected={isFeatured ? "true" : undefined}
                          >
                            <td>
                              <div className={styles.productCell}>
                                <div className={styles.thumb}>
                                  <img
                                    src={`/api/products/${product.id}/thumb`}
                                    alt={product.title}
                                    loading="lazy"
                                  />
                                </div>
                                <div className={styles.productMeta}>
                                  <Link
                                    href={`/producto/${product.id}`}
                                    target="_blank"
                                    className={styles.productTitle}
                                  >
                                    <span>{product.title}</span>
                                    <ExternalLink size={13} />
                                  </Link>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={styles.categoryBadge}>{product.category}</span>
                            </td>
                            <td className={styles.priceCell}>{product.price}</td>
                            <td className={styles.sellerCell} title={getSellerLabel(product)}>
                              {getSellerLabel(product)}
                            </td>
                            <td>
                              {isFeatured ? (
                                <span className={styles.rankBadge}>
                                  <Star size={12} />
                                  Posición #{featuredRank + 1}
                                </span>
                              ) : (
                                <span className={styles.mutedDash}>-</span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`${styles.rowAction} ${isFeatured ? styles.rowActionActive : ""}`}
                                onClick={() => toggleFeatured(product.id)}
                              >
                                {isFeatured ? (
                                  <>
                                    <Check size={14} />
                                    Destacado
                                  </>
                                ) : (
                                  <>
                                    <Star size={14} />
                                    Destacar
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
