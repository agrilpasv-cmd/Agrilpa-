"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProBadge } from "@/components/ui/pro-badge"
import { createClient } from "@/lib/supabase/client"
import { PRODUCT_CATEGORIES } from "@/lib/constants"
import { CountryPicker, PhoneCodePicker } from "@/components/ui/country-picker"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Loader2,
  Package,
  MapPin,
  Clock,
  Pencil,
  Trash2,
  X,
  Save,
  ImagePlus,
  Smile,
  AlertCircle,
  Calendar,
  Globe,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle2,
} from "lucide-react"

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
  "Lácteos": "🥛",
  "Carnes y mariscos": "🥩",
  "Semillas y frutos secos": "🥜",
  "Productos orgánicos": "🌿",
  "Insumos agrícolas": "🧪",
  "Otro": "📦",
}

const PRODUCT_EMOJIS: Record<string, string[]> = {
  "Frutas": ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥝", "🍐", "🥥", "🍅", "🫒"],
  "Vegetales": ["🥦", "🥬", "🥒", "🌽", "🫑", "🧅", "🧄", "🥕", "🥔", "🍆", "🌶️", "🫘", "🥜", "🫛"],
  "Granos y Cereales": ["🌾", "🌿", "🍚", "🌰", "☕", "🫘"],
  "Carnes y Mariscos": ["🥩", "🍗", "🥓", "🦐", "🦀", "🐟", "🦑", "🐄", "🐖", "🐔"],
  "Lácteos y Otros": ["🥛", "🧀", "🥚", "🍯", "🧈", "🫙"],
  "Especias y Aceites": ["🌶️", "🧂", "🫒", "🌻", "🥜"],
  "General": ["📦", "🌱", "🏭", "🚛", "🧪", "🌍", "♻️", "🏷️"],
}

export default function MisSolicitudesPage() {
  const supabase = createClient()
  const { toast } = useToast()


  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [maxRequests, setMaxRequests] = useState(1)
  const [activeCount, setActiveCount] = useState(0)
  const [canCreate, setCanCreate] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [editEmoji, setEditEmoji] = useState("")
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)

  // WhatsApp edit state
  const [editWhatsappCode, setEditWhatsappCode] = useState("")
  const [editWhatsappNumber, setEditWhatsappNumber] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch("/api/mis-solicitudes", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        setIsPro(data.is_pro)
        setMaxRequests(data.max_requests)
        setActiveCount(data.active_count)
        setCanCreate(data.can_create)
      }
    } catch (error) {
      console.error("Error fetching solicitudes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    return Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const isExpired = (req: PurchaseRequest) => {
    return req.status !== "active" || new Date(req.expires_at) <= new Date()
  }

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

    // Parse whatsapp
    if (req.contact_method === "whatsapp" && req.contact_value) {
      const match = req.contact_value.match(/^\+(\d+[\-]?\d*)\s+(.*)/)
      if (match) {
        setEditWhatsappCode(match[1])
        setEditWhatsappNumber(match[2])
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
      const { data: { session } } = await supabase.auth.getSession()
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

      const finalContactValue = editData.contactMethod === "whatsapp"
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
        toast({ title: "Solicitud actualizada", description: "Los cambios se guardaron correctamente." })
        cancelEdit()
        fetchRequests()
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error || "No se pudo actualizar", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteRequest = (id: string) => {
    setRequestToDelete(id)
  }

  const confirmDelete = async () => {
    if (!requestToDelete) return
    setDeletingId(requestToDelete)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/mis-solicitudes?id=${requestToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.ok) {
        toast({ title: "Solicitud eliminada" })
        fetchRequests()
      }
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" })
    } finally {
      setDeletingId(null)
      setRequestToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Solicitudes de Compra</h1>
          <p className="text-muted-foreground">
            Gestiona tus solicitudes de productos
            {isPro && (
              <ProBadge className="ml-2" />
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {activeCount}/{maxRequests} activas
          </span>
          <Link href="/solicitud-compra">
            <Button
              disabled={!canCreate}
              className="rounded-xl gap-2 font-semibold"
            >
              <Plus className="w-4 h-4" />
              Crear una solicitud de compra
            </Button>
          </Link>
        </div>
      </div>

      {!canCreate && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Has alcanzado el límite de {maxRequests} solicitud{maxRequests > 1 ? "es" : ""} activa{maxRequests > 1 ? "s" : ""}.
              {!isPro && " Actualiza a Pro para publicar hasta 5 solicitudes."}
              {" "}Puedes editar o eliminar tus solicitudes existentes.
            </p>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">No tienes solicitudes</h3>
            <p className="text-muted-foreground mb-6">Crea tu primera solicitud para que los proveedores te contacten.</p>
            <Link href="/solicitud-compra">
              <Button className="rounded-xl gap-2 font-semibold">
                <Plus className="w-4 h-4" />
                Crear una solicitud de compra
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const expired = isExpired(req)
            const editing = editingId === req.id
            const daysLeft = getDaysRemaining(req.expires_at)

            return (
              <Card
                key={req.id}
                className={`overflow-hidden transition-all ${expired ? "opacity-60" : ""} ${editing ? "ring-2 ring-primary" : ""}`}
              >
                {editing ? (
                  /* ========== EDIT MODE ========== */
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-primary" />
                        Editando Solicitud
                      </h3>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Producto *</label>
                        <input
                          type="text"
                          value={editData.productName}
                          onChange={(e) => setEditData({ ...editData, productName: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Categoría *</label>
                        <select
                          value={editData.category}
                          onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        >
                          <option value="">Selecciona</option>
                          {PRODUCT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Cantidad *</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editData.quantity}
                            onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                          />
                          <select
                            value={editData.unit}
                            onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                            className="w-20 px-2 py-2 rounded-lg border border-border bg-background text-sm"
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
                      <div>
                        <label className="block text-sm font-semibold mb-1">Fecha deseada</label>
                        <input
                          type="date"
                          value={editData.desiredDate}
                          onChange={(e) => setEditData({ ...editData, desiredDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Origen</label>
                        <select
                          value={editData.sourceType}
                          onChange={(e) => setEditData({ ...editData, sourceType: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        >
                          <option value="cualquiera">Cualquiera</option>
                          <option value="local">Local</option>
                          <option value="importado">Importado</option>
                        </select>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">País destino</label>
                        <CountryPicker
                          value={editData.country}
                          onChange={(v) => setEditData({ ...editData, country: v })}
                          placeholder="Seleccionar"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Estado/Provincia</label>
                        <input
                          type="text"
                          value={editData.deliveryState}
                          onChange={(e) => setEditData({ ...editData, deliveryState: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Dirección</label>
                        <input
                          type="text"
                          value={editData.deliveryAddress}
                          onChange={(e) => setEditData({ ...editData, deliveryAddress: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">Descripción</label>
                      <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">Especificaciones técnicas</label>
                      <textarea
                        value={editData.specs}
                        onChange={(e) => setEditData({ ...editData, specs: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                        placeholder="Humedad al 12%, grano limpio..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Presupuesto (USD)</label>
                        <input
                          type="text"
                          value={editData.budget}
                          onChange={(e) => setEditData({ ...editData, budget: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                          placeholder="$2,000 - $5,000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Medio de contacto</label>
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setEditData({ ...editData, contactMethod: "email" })}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                              editData.contactMethod === "email"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            <Mail className="w-3 h-3" /> Email
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditData({ ...editData, contactMethod: "whatsapp" })}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                              editData.contactMethod === "whatsapp"
                                ? "border-green-500 bg-green-500/10 text-green-600"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            <Phone className="w-3 h-3" /> WhatsApp
                          </button>
                        </div>
                        {editData.contactMethod === "email" ? (
                          <input
                            type="email"
                            value={editData.contactValue}
                            onChange={(e) => setEditData({ ...editData, contactValue: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                            placeholder="tu@correo.com"
                          />
                        ) : (
                          <div className="flex gap-2">
                            <PhoneCodePicker
                              value={editWhatsappCode}
                              onChange={setEditWhatsappCode}
                              className="w-28 shrink-0"
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editWhatsappNumber}
                              onChange={(e) => setEditWhatsappNumber(e.target.value.replace(/[^0-9]/g, ""))}
                              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                              placeholder="70000000"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Emoji Picker */}
                    <div>
                      <label className="block text-sm font-semibold mb-1">Ícono del producto</label>
                      <div className="flex items-center gap-3">
                        {editEmoji ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                              className="w-16 h-16 rounded-xl border-2 border-primary/30 bg-primary/5 flex items-center justify-center text-4xl hover:border-primary transition-all"
                            >
                              {editEmoji}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditEmoji("")}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 bg-background text-sm"
                          >
                            <Smile className="w-4 h-4 text-muted-foreground" />
                            Elegir ícono
                          </button>
                        )}
                      </div>
                      {showEditEmojiPicker && (
                        <div className="mt-2 p-3 rounded-xl border border-border bg-background shadow-lg">
                          {Object.entries(PRODUCT_EMOJIS).map(([group, emojis]) => (
                            <div key={group} className="mb-2 last:mb-0">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{group}</p>
                              <div className="flex flex-wrap gap-1">
                                {emojis.map((emoji, i) => (
                                  <button
                                    key={`${group}-${i}`}
                                    type="button"
                                    onClick={() => { setEditEmoji(emoji); setShowEditEmojiPicker(false) }}
                                    className={`w-8 h-8 rounded flex items-center justify-center text-xl hover:bg-primary/10 transition-all ${
                                      editEmoji === emoji ? "bg-primary/20 ring-1 ring-primary" : ""
                                    }`}
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

                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={cancelEdit} className="gap-1">
                        <X className="w-4 h-4" /> Cancelar
                      </Button>
                      <Button onClick={saveEdit} disabled={isSaving} className="gap-1">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  /* ========== VIEW MODE ========== */
                  <div className="flex flex-col sm:flex-row">
                    {/* Emoji */}
                    <div className="relative w-full sm:w-28 h-28 sm:h-auto bg-gradient-to-br from-muted to-muted/50 shrink-0 overflow-hidden flex items-center justify-center">
                      <span className="text-5xl">
                        {req.image_url || CATEGORY_ICONS[req.category] || "📦"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={expired
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : "bg-green-500/10 text-green-600 border-green-500/20"
                          }
                        >
                          {expired ? "Expirada" : "Activa"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{req.category}</Badge>
                        {!expired && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {daysLeft}d restantes
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-foreground text-base">{req.product_name}</h3>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {req.quantity} {req.unit}
                        </span>
                        {req.country && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {req.country}{req.delivery_state ? `, ${req.delivery_state}` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center justify-end gap-2 p-4 sm:border-l border-t sm:border-t-0 border-border">
                      {!expired && (
                        <Button variant="outline" size="sm" onClick={() => startEdit(req)} className="gap-1">
                          <Pencil className="w-3 h-3" /> Editar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRequest(req.id)}
                        disabled={deletingId === req.id}
                        className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      >
                        {deletingId === req.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente tu solicitud de compra de nuestros servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
