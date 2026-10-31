"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { ProBadge } from "@/components/ui/pro-badge"
import { createClient } from "@/lib/supabase/client"
import { PRODUCT_CATEGORIES } from "@/lib/constants"
import { CountryPicker, PhoneCodePicker } from "@/components/ui/country-picker"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  adminDate,
} from "@/components/admin/workspace"
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  Save,
  Smile,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react"
import localStyles from "./solicitudes.module.css"

interface PurchaseRequest {
  id: string
  product_name: string
  category: string
  quantity: string
  unit: string
  desired_date: string | null
  country: string | null
  delivery_state: string | null
  delivery_address: string | null
  description: string | null
  budget: string | null
  specs: string | null
  source_type: string
  contact_method: string
  contact_value: string | null
  image_url: string | null
  status: string
  expires_at: string
  created_at: string
}

const CATEGORY_ICONS: Record<string, string> = {
  "Granos y cereales": "🌾",
  "Frutas y vegetales": "🍎",
  "Café y cacao": "☕",
  "Especias y condimentos": "🌶️",
  "Aceites y grasas": "🫒",
  "Azúcar y endulzantes": "🍯",
  Lácteos: "🥛",
  "Carnes y mariscos": "🥩",
  "Semillas y frutos secos": "🥜",
  "Productos orgánicos": "🌿",
  "Insumos agrícolas": "🧪",
  Otro: "📦",
}

const PRODUCT_EMOJIS: Record<string, string[]> = {
  Frutas: ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥝", "🍐", "🥥", "🍅", "🫒"],
  Vegetales: ["🥦", "🥬", "🥒", "🌽", "🫑", "🧅", "🧄", "🥕", "🥔", "🍆", "🌶️", "🫘", "🥜", "🫛"],
  "Granos y Cereales": ["🌾", "🌿", "🍚", "🌰", "☕", "🫘"],
  "Carnes y Mariscos": ["🥩", "🍗", "🥓", "🦐", "🦀", "🐟", "🦑", "🐄", "🐖", "🐔"],
  "Lácteos y Otros": ["🥛", "🧀", "🥚", "🍯", "🧈", "🫙"],
  "Especias y Aceites": ["🌶️", "🧂", "🫒", "🌻", "🥜"],
  General: ["📦", "🌱", "🏭", "🚛", "🧪", "🌍", "♻️", "🏷️"],
}

const SOURCE_LABELS: Record<string, string> = {
  cualquiera: "Cualquiera",
  local: "Local",
  importado: "Importado",
}

type StatusFilter = "all" | "active" | "expired"

export default function MisSolicitudesPage() {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [maxRequests, setMaxRequests] = useState(1)
  const [activeCount, setActiveCount] = useState(0)
  const [canCreate, setCanCreate] = useState(false)

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [detail, setDetail] = useState<PurchaseRequest | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [editEmoji, setEditEmoji] = useState("")
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)

  const [editWhatsappCode, setEditWhatsappCode] = useState("")
  const [editWhatsappNumber, setEditWhatsappNumber] = useState("")

  const fetchRequests = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch("/api/mis-solicitudes", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (res.ok) {
          const data = await res.json()
          setRequests(data.requests || [])
          setIsPro(Boolean(data.is_pro))
          setMaxRequests(data.max_requests ?? 1)
          setActiveCount(data.active_count ?? 0)
          setCanCreate(Boolean(data.can_create))
          setLoaded(true)
        }
      } catch (error) {
        console.error("Error fetching solicitudes:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [supabase],
  )

  useEffect(() => {
    fetchRequests(true)
  }, [fetchRequests])

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    return Math.max(
      0,
      Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    )
  }

  const isExpired = useCallback((req: PurchaseRequest) => {
    return req.status !== "active" || new Date(req.expires_at) <= new Date()
  }, [])

  const startEdit = (req: PurchaseRequest) => {
    setEditingId(req.id)
    setEditData({
      productName: req.product_name,
      category: req.category,
      quantity: req.quantity,
      unit: req.unit,
      desiredDate: req.desired_date || "",
      country: req.country || "",
      deliveryState: req.delivery_state || "",
      deliveryAddress: req.delivery_address || "",
      description: req.description || "",
      budget: req.budget || "",
      specs: req.specs || "",
      sourceType: req.source_type || "cualquiera",
      contactMethod: req.contact_method || "email",
      contactValue: req.contact_value || "",
    })
    setEditEmoji(req.image_url || "")
    setShowEditEmojiPicker(false)

    if (req.contact_method === "whatsapp" && req.contact_value) {
      const match = req.contact_value.match(/^\+(\d+[\-]?\d*)\s+(.*)/)
      if (match) {
        setEditWhatsappCode(match[1])
        setEditWhatsappNumber(match[2])
      } else {
        setEditWhatsappCode("")
        setEditWhatsappNumber("")
      }
    } else {
      setEditWhatsappCode("")
      setEditWhatsappNumber("")
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({})
    setEditEmoji("")
    setShowEditEmojiPicker(false)
  }

  const saveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const formData = new FormData()
      formData.append("requestId", editingId)
      formData.append("productName", editData.productName)
      formData.append("category", editData.category)
      formData.append("quantity", editData.quantity)
      formData.append("unit", editData.unit)
      formData.append("desiredDate", editData.desiredDate || "")
      formData.append("country", editData.country)
      formData.append("deliveryState", editData.deliveryState)
      formData.append("deliveryAddress", editData.deliveryAddress)
      formData.append("description", editData.description)
      formData.append("budget", editData.budget)
      formData.append("specs", editData.specs)
      formData.append("sourceType", editData.sourceType)
      formData.append("contactMethod", editData.contactMethod)

      const finalContactValue =
        editData.contactMethod === "whatsapp"
          ? `+${editWhatsappCode} ${editWhatsappNumber}`
          : editData.contactValue
      formData.append("contactValue", finalContactValue)
      formData.append("emoji", editEmoji)

      const res = await fetch("/api/mis-solicitudes", {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })

      if (res.ok) {
        toast({
          title: "Solicitud actualizada",
          description: "Los cambios se guardaron correctamente.",
        })
        cancelEdit()
        fetchRequests(false)
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "No se pudo actualizar",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!requestToDelete) return
    setDeletingId(requestToDelete)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/mis-solicitudes?id=${requestToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.ok) {
        toast({ title: "Solicitud eliminada" })
        if (detail?.id === requestToDelete) setDetail(null)
        if (editingId === requestToDelete) cancelEdit()
        fetchRequests(false)
      }
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" })
    } finally {
      setDeletingId(null)
      setRequestToDelete(null)
    }
  }

  const activeListCount = useMemo(
    () => requests.filter((req) => !isExpired(req)).length,
    [requests, isExpired],
  )
  const expiredListCount = requests.length - activeListCount

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es")
    return requests.filter((req) => {
      const expired = isExpired(req)
      if (statusFilter === "active" && expired) return false
      if (statusFilter === "expired" && !expired) return false
      if (!q) return true
      return [
        req.product_name,
        req.category,
        req.country,
        req.delivery_state,
        req.description,
      ].some((val) => val?.toLocaleLowerCase("es").includes(q))
    })
  }, [requests, statusFilter, query, isExpired])

  return (
    <AdminWorkspace>
      <AdminHeader
        title="Solicitudes de compra"
        description="Publica tus requerimientos de abastecimiento y gestiona las condiciones de entrega y contacto para tus proveedores."
        actions={
          <>
            {isPro && <ProBadge />}
            <Button
              variant="outline"
              onClick={() => fetchRequests(true)}
              disabled={isLoading}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Actualizar
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/solicitud-compra">
                  <Plus size={16} aria-hidden="true" />
                  Nueva solicitud
                </Link>
              </Button>
            ) : (
              <Button disabled>
                <Plus size={16} aria-hidden="true" />
                Nueva solicitud
              </Button>
            )}
          </>
        }
      />

      {loaded && !canCreate && (
        <AdminNotice>
          Has alcanzado el límite de {maxRequests}{" "}
          {maxRequests === 1 ? "solicitud activa" : "solicitudes activas"} de tu
          plan.
          {!isPro &&
            " Actualiza al Plan Pro para mantener hasta 5 solicitudes activas simultáneamente."}{" "}
          Puedes editar o eliminar una solicitud existente.
        </AdminNotice>
      )}

      <AdminMetrics
        items={[
          {
            label: "Solicitudes registradas",
            value: loaded ? requests.length : null,
            hint: "Total en tu historial",
            active: statusFilter === "all",
            onClick: () => setStatusFilter("all"),
          },
          {
            label: "Activas",
            value: loaded ? activeListCount : null,
            hint: "Visibles para proveedores",
            active: statusFilter === "active",
            onClick: () => setStatusFilter("active"),
          },
          {
            label: "Expiradas",
            value: loaded ? expiredListCount : null,
            hint: "Con plazo finalizado",
            active: statusFilter === "expired",
            onClick: () => setStatusFilter("expired"),
          },
          {
            label: "Cupo del plan",
            value: loaded ? `${activeCount} / ${maxRequests}` : null,
            hint: isPro
              ? "Plan Pro (hasta 5 activas)"
              : "Plan Estándar (1 solicitud activa)",
          },
        ]}
      />

      {editingId && (
        <section
          className={localStyles.editPanel}
          aria-label="Editar solicitud de compra"
        >
          <div className={localStyles.editHead}>
            <div>
              <h2>Editar solicitud de compra</h2>
              <p>
                Actualiza el producto, volumen, ubicación de entrega o datos de
                contacto.
              </p>
            </div>
            <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>
              <X size={16} aria-hidden="true" />
              Cerrar
            </Button>
          </div>

          <div className={localStyles.editBody}>
            <div className={localStyles.grid2}>
              <div className={localStyles.field}>
                <label htmlFor="edit-product-name">Producto *</label>
                <input
                  id="edit-product-name"
                  type="text"
                  className={localStyles.input}
                  value={editData.productName || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, productName: e.target.value })
                  }
                />
              </div>
              <div className={localStyles.field}>
                <label htmlFor="edit-category">Categoría *</label>
                <select
                  id="edit-category"
                  className={localStyles.select}
                  value={editData.category || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, category: e.target.value })
                  }
                >
                  <option value="">Selecciona una categoría</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={localStyles.grid3}>
              <div className={localStyles.field}>
                <label htmlFor="edit-quantity">Cantidad *</label>
                <div className={localStyles.inlineGroup}>
                  <input
                    id="edit-quantity"
                    type="number"
                    className={localStyles.input}
                    value={editData.quantity || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, quantity: e.target.value })
                    }
                  />
                  <select
                    aria-label="Unidad de medida"
                    className={`${localStyles.select} ${localStyles.unitSelect}`}
                    value={editData.unit || "kg"}
                    onChange={(e) =>
                      setEditData({ ...editData, unit: e.target.value })
                    }
                  >
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                    <option value="lb">lb</option>
                    <option value="quintales">qq</option>
                    <option value="unidades">uds</option>
                    <option value="contenedores">cont.</option>
                  </select>
                </div>
              </div>

              <div className={localStyles.field}>
                <label htmlFor="edit-desired-date">Fecha deseada</label>
                <input
                  id="edit-desired-date"
                  type="date"
                  className={localStyles.input}
                  value={editData.desiredDate || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, desiredDate: e.target.value })
                  }
                />
              </div>

              <div className={localStyles.field}>
                <label htmlFor="edit-source-type">Origen preferido</label>
                <select
                  id="edit-source-type"
                  className={localStyles.select}
                  value={editData.sourceType || "cualquiera"}
                  onChange={(e) =>
                    setEditData({ ...editData, sourceType: e.target.value })
                  }
                >
                  <option value="cualquiera">Cualquiera</option>
                  <option value="local">Local</option>
                  <option value="importado">Importado</option>
                </select>
              </div>
            </div>

            <div className={localStyles.grid3}>
              <div className={localStyles.field}>
                <label>País destino</label>
                <CountryPicker
                  value={editData.country || ""}
                  onChange={(v) => setEditData({ ...editData, country: v })}
                  placeholder="Seleccionar país"
                />
              </div>
              <div className={localStyles.field}>
                <label htmlFor="edit-state">Estado / Provincia</label>
                <input
                  id="edit-state"
                  type="text"
                  className={localStyles.input}
                  value={editData.deliveryState || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, deliveryState: e.target.value })
                  }
                />
              </div>
              <div className={localStyles.field}>
                <label htmlFor="edit-address">Dirección de entrega</label>
                <input
                  id="edit-address"
                  type="text"
                  className={localStyles.input}
                  value={editData.deliveryAddress || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      deliveryAddress: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className={localStyles.grid2}>
              <div className={localStyles.field}>
                <label htmlFor="edit-description">Descripción</label>
                <textarea
                  id="edit-description"
                  className={localStyles.textarea}
                  rows={3}
                  value={editData.description || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                />
              </div>
              <div className={localStyles.field}>
                <label htmlFor="edit-specs">Especificaciones técnicas</label>
                <textarea
                  id="edit-specs"
                  className={localStyles.textarea}
                  rows={3}
                  placeholder="Humedad al 12%, grano limpio..."
                  value={editData.specs || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, specs: e.target.value })
                  }
                />
              </div>
            </div>

            <div className={localStyles.grid2}>
              <div className={localStyles.field}>
                <label htmlFor="edit-budget">Presupuesto estimado (USD)</label>
                <input
                  id="edit-budget"
                  type="text"
                  className={localStyles.input}
                  placeholder="Ej. USD 2,000 - 5,000"
                  value={editData.budget || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, budget: e.target.value })
                  }
                />
              </div>

              <div className={localStyles.field}>
                <label>Medio de contacto</label>
                <div className={localStyles.contactToggle}>
                  <button
                    type="button"
                    className={localStyles.methodBtn}
                    aria-pressed={editData.contactMethod === "email"}
                    onClick={() =>
                      setEditData({ ...editData, contactMethod: "email" })
                    }
                  >
                    <Mail size={15} aria-hidden="true" />
                    Correo electrónico
                  </button>
                  <button
                    type="button"
                    className={localStyles.methodBtn}
                    aria-pressed={editData.contactMethod === "whatsapp"}
                    onClick={() =>
                      setEditData({ ...editData, contactMethod: "whatsapp" })
                    }
                  >
                    <Phone size={15} aria-hidden="true" />
                    WhatsApp
                  </button>
                </div>

                {editData.contactMethod === "email" ? (
                  <input
                    type="email"
                    className={localStyles.input}
                    placeholder="tu@correo.com"
                    value={editData.contactValue || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, contactValue: e.target.value })
                    }
                  />
                ) : (
                  <div className={localStyles.phoneRow}>
                    <div className={localStyles.phoneCode}>
                      <PhoneCodePicker
                        value={editWhatsappCode}
                        onChange={setEditWhatsappCode}
                      />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={localStyles.input}
                      placeholder="70000000"
                      value={editWhatsappNumber}
                      onChange={(e) =>
                        setEditWhatsappNumber(
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={localStyles.field}>
              <label>Ícono del producto</label>
              <div className={localStyles.emojiRow}>
                {editEmoji && (
                  <button
                    type="button"
                    className={localStyles.emojiPreview}
                    onClick={() =>
                      setShowEditEmojiPicker(!showEditEmojiPicker)
                    }
                    title="Cambiar ícono"
                  >
                    {editEmoji}
                  </button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                >
                  <Smile size={16} aria-hidden="true" />
                  {editEmoji ? "Cambiar ícono" : "Elegir ícono"}
                </Button>
                {editEmoji && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditEmoji("")}
                  >
                    Quitar ícono
                  </Button>
                )}
              </div>

              {showEditEmojiPicker && (
                <div className={localStyles.emojiDrawer}>
                  {Object.entries(PRODUCT_EMOJIS).map(([group, emojis]) => (
                    <div key={group}>
                      <p className={localStyles.emojiGroupTitle}>{group}</p>
                      <div className={localStyles.emojiGrid}>
                        {emojis.map((emoji, i) => (
                          <button
                            key={`${group}-${i}`}
                            type="button"
                            className={localStyles.emojiOption}
                            aria-pressed={editEmoji === emoji}
                            onClick={() => {
                              setEditEmoji(emoji)
                              setShowEditEmojiPicker(false)
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={localStyles.editFooter}>
              <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={saveEdit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                {isSaving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </section>
      )}

      <Card>
        <CardContent>
          <div className={s.toolbar}>
            <AdminSearch
              value={query}
              onChange={setQuery}
              label="Buscar por producto, categoría o destino"
            />
            <AdminSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as StatusFilter)}
              label="Filtrar estado de solicitud"
              options={[
                { value: "all", label: "Todos los estados" },
                { value: "active", label: "Activas" },
                { value: "expired", label: "Expiradas" },
              ]}
            />
          </div>
          <p className={s.secondary}>
            {shown.length}{" "}
            {shown.length === 1 ? "solicitud" : "solicitudes"} en la lista
            {query || statusFilter !== "all" ? " filtrada" : ""}.
          </p>
        </CardContent>

        <div className={s.tableScroll}>
          {isLoading && !loaded ? (
            <AdminEmpty title="Cargando solicitudes…" />
          ) : shown.length === 0 ? (
            <AdminEmpty
              title={
                requests.length
                  ? "No hay coincidencias"
                  : "Todavía no tienes solicitudes de compra"
              }
              description={
                requests.length
                  ? "Prueba ajustando la búsqueda o el filtro de estado."
                  : "Publica tu primera solicitud para que los proveedores de Agrilpa puedan contactarte."
              }
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Volumen requerido</th>
                  <th>Destino</th>
                  <th>Presupuesto</th>
                  <th>Contacto</th>
                  <th>Vigencia</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((req) => {
                  const expired = isExpired(req)
                  const daysLeft = getDaysRemaining(req.expires_at)
                  const destination = [req.delivery_state, req.country]
                    .filter(Boolean)
                    .join(", ")

                  return (
                    <tr key={req.id}>
                      <td>
                        <div className={localStyles.productCell}>
                          <div
                            className={localStyles.iconBox}
                            aria-hidden="true"
                          >
                            {req.image_url ||
                              CATEGORY_ICONS[req.category] ||
                              "📦"}
                          </div>
                          <div>
                            <span className={s.rowTitle}>
                              {req.product_name}
                            </span>
                            <span className={s.rowMeta}>
                              Creada el {adminDate(req.created_at)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{req.category || "-"}</td>
                      <td>
                        <span className={s.rowTitle}>
                          {req.quantity} {req.unit}
                        </span>
                      </td>
                      <td>{destination || "-"}</td>
                      <td>{req.budget || "A convenir"}</td>
                      <td>
                        <span className={s.rowTitle}>
                          {req.contact_method === "whatsapp"
                            ? "WhatsApp"
                            : "Correo"}
                        </span>
                        {req.contact_value && (
                          <span className={s.rowMeta}>{req.contact_value}</span>
                        )}
                      </td>
                      <td>
                        {expired
                          ? "Finalizada"
                          : `${daysLeft} ${daysLeft === 1 ? "día restante" : "días restantes"}`}
                      </td>
                      <td>
                        <span
                          className={`${localStyles.statusBadge} ${
                            expired
                              ? localStyles.statusExpired
                              : localStyles.statusActive
                          }`}
                        >
                          {expired ? "Expirada" : "Activa"}
                        </span>
                      </td>
                      <td>
                        <div className={s.actions}>
                          <Button
                            variant="outline"
                            onClick={() => setDetail(req)}
                          >
                            Ver detalle
                          </Button>
                          {!expired && (
                            <Button
                              variant="outline"
                              onClick={() => startEdit(req)}
                            >
                              <Pencil size={15} aria-hidden="true" />
                              Editar
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            disabled={deletingId === req.id}
                            onClick={() => setRequestToDelete(req.id)}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                            Eliminar
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
            <DialogTitle>{detail?.product_name}</DialogTitle>
            <DialogDescription>
              {detail?.category || "Sin categoría"} · Publicada el{" "}
              {detail?.created_at ? adminDate(detail.created_at, true) : "-"}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <>
              <dl className={s.detailGrid}>
                <div>
                  <dt>Volumen requerido</dt>
                  <dd>
                    {detail.quantity} {detail.unit}
                  </dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{isExpired(detail) ? "Expirada" : "Activa"}</dd>
                </div>
                <div>
                  <dt>Presupuesto estimado</dt>
                  <dd>{detail.budget || "A convenir"}</dd>
                </div>
                <div>
                  <dt>Origen preferido</dt>
                  <dd>
                    {SOURCE_LABELS[detail.source_type] ||
                      detail.source_type ||
                      "Cualquiera"}
                  </dd>
                </div>
                <div>
                  <dt>Fecha deseada</dt>
                  <dd>{detail.desired_date || "No especificada"}</dd>
                </div>
                <div>
                  <dt>Vencimiento de publicación</dt>
                  <dd>{adminDate(detail.expires_at)}</dd>
                </div>
                <div>
                  <dt>País destino</dt>
                  <dd>{detail.country || "-"}</dd>
                </div>
                <div>
                  <dt>Estado / Provincia</dt>
                  <dd>{detail.delivery_state || "-"}</dd>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <dt>Dirección de entrega</dt>
                  <dd>{detail.delivery_address || "-"}</dd>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <dt>Medio de contacto</dt>
                  <dd>
                    {detail.contact_method === "whatsapp"
                      ? "WhatsApp"
                      : "Correo electrónico"}
                    {detail.contact_value ? `: ${detail.contact_value}` : ""}
                  </dd>
                </div>
              </dl>

              {detail.description && (
                <div>
                  <p className={s.secondary} style={{ marginBottom: 6 }}>
                    Descripción
                  </p>
                  <div className={s.message}>{detail.description}</div>
                </div>
              )}

              {detail.specs && (
                <div style={{ marginTop: 12 }}>
                  <p className={s.secondary} style={{ marginBottom: 6 }}>
                    Especificaciones técnicas
                  </p>
                  <div className={s.message}>{detail.specs}</div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(requestToDelete)}
        onOpenChange={(open) => !open && setRequestToDelete(null)}
      >
        <AlertDialogContent className={s.dialog}>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar solicitud de compra</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente tu
              solicitud de compra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={Boolean(deletingId)}>
                Cancelar
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={Boolean(deletingId)}
              onClick={confirmDelete}
            >
              {deletingId ? "Eliminando…" : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  )
}
