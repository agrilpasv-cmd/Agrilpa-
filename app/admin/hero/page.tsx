"use client"

import { useCallback, useEffect, useState, type ChangeEvent } from "react"
import { RefreshCw, Trash2, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
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
  AdminNotice,
  AdminEmpty,
  AdminStatus,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  adminStyles as s
} from "@/components/admin/workspace"

interface HeroImage {
  id: string
  image_url: string
  link_url?: string
  is_active: boolean
  order_index: number
  created_at: string
}
export default function HeroAdminPage() {
  const [images, setImages] = useState<HeroImage[]>([])
  const [interval, setInterval] = useState("")
  const [loading, setLoading] = useState(true),
    [uploading, setUploading] = useState(false),
    [saving, setSaving] = useState(false)
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("")
  const [target, setTarget] = useState<HeroImage | null>(null),
    [deleting, setDeleting] = useState(false)
  const fetchImages = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/admin/hero", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok || !Array.isArray(result.images))
        throw new Error(result.error || "No pudimos cargar los banners.")
      setImages(result.images)
      setInterval(
        typeof result.interval === "number"
          ? String(result.interval / 1000)
          : ""
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar los banners."
      )
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    fetchImages()
  }, [fetchImages])
  const saveInterval = async () => {
    const seconds = Number(interval)
    if (!interval || !Number.isFinite(seconds) || seconds < 0.5) {
      setError("El intervalo debe ser de al menos 0.5 segundos.")
      return
    }
    setSaving(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/admin/hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "00000000-0000-0000-0000-000000000000",
          link_url: String(seconds * 1000)
        })
      })
      if (!response.ok)
        throw new Error("No pudimos guardar el tiempo de rotación.")
      setNotice("Tiempo de rotación actualizado.")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos guardar el intervalo."
      )
    } finally {
      setSaving(false)
    }
  }
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget,
      file = input.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen.")
      input.value = ""
      return
    }
    setUploading(true)
    setError("")
    setNotice("")
    try {
      const data = new FormData()
      data.append("file", file)
      const response = await fetch("/api/admin/hero", {
        method: "POST",
        body: data
      })
      if (!response.ok) throw new Error("No pudimos subir la imagen.")
      await fetchImages()
      setNotice("Imagen añadida al carrusel.")
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No pudimos subir la imagen."
      )
    } finally {
      setUploading(false)
      input.value = ""
    }
  }
  const updateLink = async (id: string, link: string) => {
    const value = link.trim()
    if (
      value &&
      !(value.startsWith("/") && !value.startsWith("//")) &&
      !/^https?:\/\/[^\s]+$/i.test(value)
    ) {
      setError(
        "Usa una dirección https:// o una ruta de Agrilpa, por ejemplo /productos."
      )
      return false
    }
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/admin/hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, link_url: value })
      })
      if (!response.ok) throw new Error("No pudimos guardar el enlace.")
      setImages((previous) =>
        previous.map((image) =>
          image.id === id ? { ...image, link_url: value } : image
        )
      )
      setNotice("Enlace del banner actualizado.")
      return true
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No pudimos guardar el enlace."
      )
      return false
    }
  }
  const remove = async () => {
    if (!target || deleting) return
    setDeleting(true)
    setError("")
    try {
      const response = await fetch(
        `/api/admin/hero?id=${encodeURIComponent(target.id)}&url=${encodeURIComponent(target.image_url)}`,
        { method: "DELETE" }
      )
      if (!response.ok) throw new Error("No pudimos eliminar la imagen.")
      setImages((previous) =>
        previous.filter((image) => image.id !== target.id)
      )
      setTarget(null)
      setNotice("Banner eliminado.")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos eliminar la imagen."
      )
    } finally {
      setDeleting(false)
    }
  }
  return (
    <AdminWorkspace>
      <AdminHeader
        title="Hero de inicio"
        description="Gestiona las imágenes y los enlaces del carrusel derecho de la página principal."
        actions={
          <Button
            variant="outline"
            disabled={loading || uploading}
            onClick={fetchImages}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />
      {error && <AdminNotice error>{error}</AdminNotice>}
      {notice && <AdminNotice>{notice}</AdminNotice>}
      <div className={s.split}>
        <div className={s.stack}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>
              Banners del carrusel
            </h2>
            <p className={s.secondary}>
              {images.length}{" "}
              {images.length === 1 ? "imagen cargada" : "imágenes cargadas"}{" "}
              para el carrusel.
            </p>
          </div>
          {loading ? (
            <AdminEmpty title="Cargando banners…" />
          ) : !images.length ? (
            <Card>
              <AdminEmpty
                title="Todavía no hay banners"
                description="Añade la primera imagen desde el panel de carga."
              />
            </Card>
          ) : (
            <div className={s.bannerGrid}>
              {images.map((image, index) => (
                <BannerItem
                  key={image.id}
                  image={image}
                  number={index + 1}
                  onDelete={() => setTarget(image)}
                  onUpdate={updateLink}
                />
              ))}
            </div>
          )}
        </div>
        <aside className={s.stack}>
          <Card>
            <CardHeader>
              <CardTitle>Rotación del carrusel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={s.field}>
                <label htmlFor="hero-interval">
                  Intervalo entre imágenes (segundos)
                </label>
                <Input
                  id="hero-interval"
                  type="number"
                  min=".5"
                  step=".1"
                  value={interval}
                  disabled={loading || saving}
                  onChange={(event) => setInterval(event.target.value)}
                />
                <p>Mínimo 0.5 segundos.</p>
                <Button disabled={loading || saving} onClick={saveInterval}>
                  {saving ? "Guardando…" : "Guardar intervalo"}
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className={s.upload}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Añadir imagen</h2>
            <p className={s.secondary}>
              Medida recomendada: 1920 × 1080 px, relación 16:9.
            </p>
            <label htmlFor="hero-upload" className={s.rowTitle}>
              {uploading ? "Subiendo imagen…" : "Seleccionar archivo de imagen"}
            </label>
            <input
              id="hero-upload"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={upload}
            />
            <p className={s.secondary}>
              Después de subirla podrás configurar su enlace.
            </p>
          </div>
        </aside>
      </div>
      <AlertDialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open && !deleting) setTarget(null)
        }}
      >
        <AlertDialogContent className={s.dialog}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este banner?</AlertDialogTitle>
            <AlertDialogDescription>
              La imagen se eliminará del carrusel de inicio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={remove}>
              {deleting ? "Eliminando…" : "Eliminar banner"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  )
}
function BannerItem({
  image,
  number,
  onDelete,
  onUpdate
}: {
  image: HeroImage
  number: number
  onDelete: () => void
  onUpdate: (id: string, link: string) => Promise<boolean>
}) {
  const [link, setLink] = useState(image.link_url || ""),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false)
  const save = async () => {
    if (saving) return
    setSaving(true)
    setSaved(false)
    try {
      setSaved(await onUpdate(image.id, link))
    } finally {
      setSaving(false)
    }
  }
  return (
    <Card>
      <div className={s.bannerHeading}>
        <h2>Banner {number}</h2>
        <AdminStatus>{image.is_active ? "Activo" : "Inactivo"}</AdminStatus>
        <Button
          variant="ghost"
          onClick={onDelete}
          aria-label={`Eliminar banner ${number}`}
        >
          <Trash2 size={17} />
        </Button>
      </div>
      <div className={s.bannerPreview}>
        <img
          src={image.image_url}
          alt={`Vista previa del banner ${number}`}
          loading="lazy"
        />
      </div>
      <div className={s.bannerFields}>
        <div className={s.field}>
          <label htmlFor={`banner-link-${image.id}`}>
            Enlace al hacer clic
          </label>
          <Input
            id={`banner-link-${image.id}`}
            value={link}
            placeholder="https://… o /productos"
            onChange={(event) => {
              setLink(event.target.value)
              setSaved(false)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") save()
            }}
          />
          <p>Déjalo vacío si la imagen no debe abrir una página.</p>
        </div>
        <Button variant="outline" disabled={saving} onClick={save}>
          <Save size={16} aria-hidden="true" />
          {saving ? "Guardando…" : saved ? "Guardado" : "Guardar enlace"}
        </Button>
      </div>
    </Card>
  )
}
