"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  User, Mail, Phone, Building2, Globe, MapPin, FileText,
  Edit2, Save, X, Loader, CheckCircle2, AlertCircle,
  Package, ShoppingCart, Star, TrendingUp, Calendar, Link as LinkIcon, Camera,
  ShieldCheck, Ship, Award, Trash2, Upload, ExternalLink
} from "lucide-react"

type Status = { type: "success" | "error"; message: string } | null

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<Status>(null)
  const [originalData, setOriginalData] = useState<any>(null)
  const [stats, setStats] = useState({ products: 0, purchases: 0, quotations: 0 })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    companyLink: "",
    country: "",
    address: "",
    bio: "",
  })
  const [memberSince, setMemberSince] = useState("")
  const [isPro, setIsPro] = useState(false)
  const [exportHistory, setExportHistory] = useState<any[]>([])
  const [exportForm, setExportForm] = useState({ url: "", type: "container_photo", label: "" })
  const [uploadingExport, setUploadingExport] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile")
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setProfileId(data.user.id)
            const userData = {
              fullName: data.user.full_name || "",
              email: data.user.email || "",
              phone: data.user.phone || "",
              company: data.user.company_name || "",
              companyLink: data.user.company_website || "",
              country: data.user.country || "",
              address: data.user.address || "",
              bio: data.user.bio || "",
            }
            setFormData(userData)
            setOriginalData(userData)
            if (data.user.avatar_url) setAvatarUrl(data.user.avatar_url)

            if (data.user.created_at) {
              const date = new Date(data.user.created_at)
              setMemberSince(
                date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
              )
            }

            // Check Pro status
            if (data.user.plan_type === "pro") {
              const isExpired = data.user.plan_expires_at && new Date(data.user.plan_expires_at) < new Date()
              setIsPro(!isExpired)
            }
            if (data.user.export_history) {
              setExportHistory(data.user.export_history)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats")
        if (res.ok) {
          const data = await res.json()
          setStats({
            products: data.activeProducts || 0,
            purchases: data.totalTransactions || 0,
            quotations: data.quotationsCount || 0,
          })
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchProfile()
    fetchStats()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setSaveStatus(null)
  }

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData)
    }
    setIsEditing(false)
    setSaveStatus(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus(null)
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSaveStatus({ type: "success", message: "¡Perfil actualizado correctamente!" })
        setOriginalData({ ...formData })
        setIsEditing(false)
      } else {
        setSaveStatus({ type: "error", message: data.details || data.error || "Error al guardar los cambios." })
      }
    } catch {
      setSaveStatus({ type: "error", message: "Error de conexión. Intenta nuevamente." })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAvatarClick = () => {
    document.getElementById("avatar-upload-input")?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append("avatar", file)
      const res = await fetch("/api/user/upload-avatar", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok && data.avatarUrl) {
        setAvatarUrl(data.avatarUrl)
        if (data.dbWarning) {
          setSaveStatus({ type: "error", message: "⚠️ Foto visible solo en esta sesión. Para guardarla permanentemente, ejecuta en Supabase SQL Editor: ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;" })
        } else {
          setSaveStatus({ type: "success", message: "¡Foto de perfil actualizada!" })
        }
      } else {
        setSaveStatus({ type: "error", message: data.error || "Error al subir la imagen" })
      }
    } catch {
      setSaveStatus({ type: "error", message: "Error de conexión al subir la imagen" })
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">

      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y profesional</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profileId && !isEditing && (
            <Button variant="outline" asChild className="gap-2">
              <Link href={`/vendedor/${profileId}`}>
                <ExternalLink className="w-4 h-4" aria-hidden="true" /> Ver perfil público
              </Link>
            </Button>
          )}
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : (
                  <><Save className="w-4 h-4" /> Guardar Cambios</>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="w-4 h-4" /> Editar Perfil
            </Button>
          )}
        </div>
      </div>

      {/* ── Status message ───────────────────────────────────── */}
      {saveStatus && (
        <div
          className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${saveStatus.type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
            }`}
        >
          {saveStatus.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          {saveStatus.message}
        </div>
      )}

      {/* ── Profile Header Card ──────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick} title="Cambiar foto de perfil">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Foto de perfil" className="object-cover" />
                ) : null}
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {getInitials(formData.fullName || "U")}
                </AvatarFallback>
              </Avatar>
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <Loader className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
              {/* Green dot */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              {/* Hidden file input */}
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-foreground">{formData.fullName || "Sin nombre"}</h2>
              <p className="text-muted-foreground mt-0.5">{formData.company || "Sin empresa"}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Verificado
                </span>
                {formData.country && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    <Globe className="w-3 h-3" /> {formData.country}
                  </span>
                )}
                {memberSince && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                    <Calendar className="w-3 h-3" /> Miembro desde {memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.products}</p>
              <p className="text-sm text-muted-foreground">Publicaciones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.purchases}</p>
              <p className="text-sm text-muted-foreground">Compras</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.quotations}</p>
              <p className="text-sm text-muted-foreground">Cotizaciones</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Personal Information Card ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Tu nombre y datos de contacto principales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Nombre Completo
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Correo Electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">El correo no se puede cambiar desde aquí</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                Teléfono
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="+503 0000 0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                País
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Tu país"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Business Information Card ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Información Empresarial
          </CardTitle>
          <CardDescription>
            Datos de tu empresa o negocio agrícola
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                Nombre de la Empresa
              </Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Nombre de tu empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyLink" className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                Sitio Web
              </Label>
              <Input
                id="companyLink"
                name="companyLink"
                value={formData.companyLink}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="www.tuempresa.com"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address" className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Dirección
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Dirección de tu empresa o finca"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bio / About Card ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Acerca de Ti
          </CardTitle>
          <CardDescription>
            Cuéntale a tus clientes y socios sobre ti y tu experiencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              disabled={!isEditing}
              rows={4}
              placeholder="Describe tu experiencia, los productos que ofreces y lo que te diferencia..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none bg-background disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 caracteres
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Export History (Pro Only) ───────────────────────────── */}
      <Card className={!isPro ? "opacity-60" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-primary" />
            Historial de Exportación
            {isPro ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                PRO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-[10px] font-bold">
                🔒 Requiere Plan Pro
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {isPro
              ? "Sube fotos de tus contenedores y certificados de calidad para mostrarlos en tu perfil público."
              : "Actualiza a Plan Pro para desbloquear esta función exclusiva."}
          </CardDescription>
        </CardHeader>
        {isPro && (
          <CardContent className="space-y-6">
            {/* Upload Form */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Agregar nuevo elemento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="export-type" className="text-xs">Tipo</Label>
                  <select
                    id="export-type"
                    value={exportForm.type}
                    onChange={(e) => setExportForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="container_photo">📦 Foto de Contenedor</option>
                    <option value="certificate">🏅 Certificado de Calidad</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="export-label" className="text-xs">Descripción</Label>
                  <Input
                    id="export-label"
                    placeholder={exportForm.type === "certificate" ? "Ej: Global GAP, Orgánico USDA" : "Ej: Contenedor FCL a USA"}
                    value={exportForm.label}
                    onChange={(e) => setExportForm(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="export-url" className="text-xs">URL de la imagen/documento</Label>
                  <Input
                    id="export-url"
                    placeholder="https://..."
                    value={exportForm.url}
                    onChange={(e) => setExportForm(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!exportForm.url || !exportForm.label) return
                  setUploadingExport(true)
                  try {
                    const res = await fetch("/api/user/upload-export-history", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(exportForm)
                    })
                    const data = await res.json()
                    if (data.success) {
                      setExportHistory(data.export_history)
                      setExportForm({ url: "", type: "container_photo", label: "" })
                      setSaveStatus({ type: "success", message: "¡Elemento agregado al historial de exportación!" })
                    } else {
                      setSaveStatus({ type: "error", message: data.error || "Error al agregar" })
                    }
                  } catch {
                    setSaveStatus({ type: "error", message: "Error de conexión" })
                  } finally {
                    setUploadingExport(false)
                  }
                }}
                disabled={uploadingExport || !exportForm.url || !exportForm.label}
                className="gap-2"
                size="sm"
              >
                {uploadingExport ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Agregar</>
                )}
              </Button>
            </div>

            {/* Existing Items */}
            {exportHistory.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Elementos actuales ({exportHistory.length})</h3>
                {exportHistory.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background">
                    <div className="shrink-0">
                      {item.type === "certificate" ? (
                        <Award className="w-5 h-5 text-green-500" />
                      ) : (
                        <Ship className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === "certificate" ? "Certificado" : "Foto de contenedor"}
                        {item.uploaded_at && ` • ${new Date(item.uploaded_at).toLocaleDateString("es-ES")}`}
                      </p>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Ver
                    </a>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/user/delete-export-history", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ index })
                          })
                          const data = await res.json()
                          if (data.success) {
                            setExportHistory(data.export_history)
                            setSaveStatus({ type: "success", message: "Elemento eliminado" })
                          }
                        } catch {
                          setSaveStatus({ type: "error", message: "Error al eliminar" })
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Ship className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No tienes elementos en tu historial de exportación.</p>
                <p className="text-xs mt-1">Agrega fotos de contenedores o certificados para mostrarlos en tu perfil público.</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
