"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { Award, Camera, CalendarDays, ExternalLink, Loader2, LockKeyhole, MapPin, Pencil, Save, Ship, Trash2, Upload } from "lucide-react"
import { ProBadge } from "@/components/ui/pro-badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CommercePage, InlineNotice, LoadingState, commerceStyles as c } from "@/components/dashboard/commerce-ui"
import { AccountSection, ProfileField, accountStyles as s } from "@/components/dashboard/account-ui"
import { publicWebUrl } from "@/lib/public-company-profile"
import { shortDate } from "@/lib/dashboard/commerce"

type ProfileData = { fullName: string; email: string; phone: string; company: string; companyLink: string; country: string; address: string; bio: string }
type ExportItem = { url: string; type: string; label: string; uploaded_at?: string }
const emptyProfile: ProfileData = { fullName: "", email: "", phone: "", company: "", companyLink: "", country: "", address: "", bio: "" }

export default function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{fullName?: string; companyLink?: string}>({})
  const [notice, setNotice] = useState<{text: string; error?: boolean} | null>(null)
  const [profileId, setProfileId] = useState("")
  const [form, setForm] = useState<ProfileData>(emptyProfile)
  const [original, setOriginal] = useState<ProfileData>(emptyProfile)
  const [stats, setStats] = useState<{products: number; purchases: number; quotations: number} | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [uploading, setUploading] = useState(false)
  const uploadInput = useRef<HTMLInputElement>(null)
  const [memberSince, setMemberSince] = useState("")
  const [pro, setPro] = useState(false)
  const [history, setHistory] = useState<ExportItem[]>([])
  const [exportForm, setExportForm] = useState({url: "", type: "container_photo", label: ""})
  const [exportBusy, setExportBusy] = useState(false)
  const [exportNotice, setExportNotice] = useState<{text: string; error?: boolean} | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true); setLoadError(false)
    fetch("/api/user/profile", {cache: "no-store"}).then(async response => {
      if (!response.ok) throw new Error("Profile unavailable")
      const data = await response.json()
      if (!data.user) throw new Error("Profile missing")
      if (!active) return
      const user = data.user
      const values: ProfileData = {fullName: user.full_name || "", email: user.email || "", phone: user.phone || "", company: user.company_name || "", companyLink: user.company_website || "", country: user.country || "", address: user.address || "", bio: user.bio || ""}
      setForm(values); setOriginal(values); setProfileId(user.id || ""); setAvatar(user.avatar_url || null); setAvatarFailed(false)
      setMemberSince(user.created_at ? new Date(user.created_at).toLocaleDateString("es-SV", {month: "long", year: "numeric"}) : "")
      setPro(user.plan_type === "pro" && (!user.plan_expires_at || new Date(user.plan_expires_at) >= new Date()))
      setHistory(Array.isArray(user.export_history) ? user.export_history : [])
    }).catch(() => { if (active) setLoadError(true) }).finally(() => { if (active) setLoading(false) })
    fetch("/api/dashboard/stats").then(async response => {
      if (!response.ok) return
      const data = await response.json()
      if (active) setStats({products: data.activeProducts || 0, purchases: data.totalTransactions || 0, quotations: data.quotationsCount || 0})
    }).catch(() => {})
    return () => { active = false }
  }, [retry])

  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setForm(previous => ({...previous, [event.target.name]: event.target.value})); setNotice(null); setFieldErrors(previous => ({...previous, [event.target.name]: undefined})) }
  const cancel = () => { setForm(original); setEditing(false); setNotice(null); setFieldErrors({}) }
  const save = async () => {
    if (saving) return
    if (!form.fullName.trim()) { setFieldErrors({fullName: "Añade tu nombre completo."}); document.getElementById("fullName")?.focus(); return }
    if (form.companyLink && !publicWebUrl(form.companyLink)) { setFieldErrors({companyLink: "Usa una dirección web válida."}); document.getElementById("companyLink")?.focus(); return }
    setSaving(true); setNotice(null)
    try {
      const response = await fetch("/api/user/update-profile", {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(form)})
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error("Save failed")
      setOriginal({...form}); setEditing(false); setNotice({text: "Tu perfil se actualizó correctamente."})
    } catch { setNotice({text: "No pudimos guardar los cambios. Tus datos siguen aquí para volver a intentarlo.", error: true}) }
    finally { setSaving(false) }
  }
  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) { setNotice({text: "Elige una imagen JPG, PNG o WebP de hasta 2 MB.", error: true}); return }
    setUploading(true); setNotice(null)
    try {
      const body = new FormData(); body.append("avatar", file)
      const response = await fetch("/api/user/upload-avatar", {method: "POST", body})
      const data = await response.json()
      if (!response.ok || !data.avatarUrl) throw new Error("Upload failed")
      setAvatar(data.avatarUrl); setAvatarFailed(false)
      setNotice(data.dbWarning ? {text: "La foto se muestra en esta sesión, pero no pudimos guardarla en tu perfil. Contacta a soporte.", error: true} : {text: "Tu foto de perfil se actualizó."})
    } catch { setNotice({text: "No pudimos subir la foto. Inténtalo de nuevo.", error: true}) }
    finally { setUploading(false) }
  }
  const addExport = async () => {
    if (exportBusy) return
    if (!exportForm.label.trim() || !publicWebUrl(exportForm.url)) { setExportNotice({text: "Añade una descripción y una dirección web válida para el documento.", error: true}); return }
    setExportBusy(true); setExportNotice(null)
    try {
      const response = await fetch("/api/user/upload-export-history", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({...exportForm, url: publicWebUrl(exportForm.url)})})
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error("Export failed")
      setHistory(data.export_history); setExportForm({url: "", type: "container_photo", label: ""}); setExportNotice({text: "El documento se agregó a tu perfil público."})
    } catch { setExportNotice({text: "No pudimos agregar el documento. Inténtalo de nuevo.", error: true}) }
    finally { setExportBusy(false) }
  }
  const deleteExport = async () => {
    if (deleteIndex === null || exportBusy) return
    const index = deleteIndex; setDeleteIndex(null); setExportBusy(true)
    try {
      const response = await fetch("/api/user/delete-export-history", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({index})})
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error("Delete failed")
      setHistory(data.export_history); setExportNotice({text: "El documento se retiró de tu perfil."})
    } catch { setExportNotice({text: "No pudimos retirar el documento. Inténtalo de nuevo.", error: true}) }
    finally { setExportBusy(false) }
  }
  const initials = (original.fullName || "Usuario").trim().split(/\s+/).map(word => word[0]).slice(0,2).join("").toUpperCase()
  const actions = editing ? <><button className={c.secondaryButton} onClick={cancel} disabled={saving}>Cancelar</button><button className={c.primaryButton} onClick={() => void save()} disabled={saving}>{saving ? <Loader2 size={17} className={c.spinner} /> : <Save size={17} />} {saving ? "Guardando…" : "Guardar cambios"}</button></> : <>{profileId && <Link className={c.secondaryButton} href={`/vendedor/${profileId}`}><ExternalLink size={17} aria-hidden="true" />Ver perfil público</Link>}<button className={c.primaryButton} onClick={() => setEditing(true)}><Pencil size={17} aria-hidden="true" />Editar perfil</button></>

  return <CommercePage title="Mi perfil" description="La información que representa a tu empresa en Agrilpa." action={!loading && !loadError ? actions : undefined}>
    {notice && <InlineNotice error={notice.error} onClose={() => setNotice(null)}>{notice.text}</InlineNotice>}
    {loading ? <LoadingState label="Cargando tu perfil…" /> : loadError ? <InlineNotice error>No pudimos cargar tu perfil. <button className={c.textButton} onClick={() => setRetry(value => value + 1)}>Reintentar</button></InlineNotice> : <>
      <nav className={s.sectionNav} aria-label="Información del perfil"><a href="#personal">Datos personales</a><a href="#empresa">Información empresarial</a><a href="#exportacion">Exportación y certificados</a></nav>
      <div className={s.layout}>
        <aside className={s.sidebar} aria-label="Resumen de tu perfil"><div className={s.identity}><div className={s.identityTop} /><div className={s.identityBody}>
          <div className={s.photo}>{avatar && !avatarFailed ? <img src={avatar} alt={`Foto de ${original.fullName || "tu perfil"}`} onError={() => setAvatarFailed(true)} /> : initials}</div>
          <button type="button" className={s.photoAction} disabled={uploading} onClick={() => uploadInput.current?.click()}>{uploading ? <Loader2 size={16} className={c.spinner} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}{uploading ? "Subiendo foto…" : "Cambiar foto"}</button>
          <input ref={uploadInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Subir foto de perfil" onChange={uploadAvatar} />
          <p className={s.hint}>JPG, PNG o WebP · Hasta 2 MB</p>
          <div className={s.identityName}><h2>{original.fullName || "Tu nombre"}</h2>{pro && <ProBadge />}</div><p className={s.company}>{original.company || "Añade el nombre de tu empresa"}</p>
          <div className={s.identityDetails}>{original.country && <span><MapPin size={16} aria-hidden="true" />{original.country}</span>}{memberSince && <span><CalendarDays size={16} aria-hidden="true" />Miembro desde {memberSince}</span>}</div>
          {stats && <dl className={s.activity}><div><dt>Productos</dt><dd>{stats.products}</dd></div><div><dt>Compras</dt><dd>{stats.purchases}</dd></div><div><dt>Cotizaciones pendientes</dt><dd>{stats.quotations}</dd></div></dl>}
        </div></div><div className={s.sidebarNote}><h3>Haz que te conozcan</h3><p>Una foto y una descripción clara ayudan a los compradores a identificar tu negocio antes de conversar contigo.</p>{profileId && <Link href={`/vendedor/${profileId}`}>Ver mi perfil público<ExternalLink size={15} aria-hidden="true" /></Link>}</div></aside>
        <div className={s.content}>
          <AccountSection id="personal" title="Datos personales" description="Tu nombre y los datos de contacto de tu cuenta."><div className={s.fieldGrid}>
            <ProfileField id="fullName" error={fieldErrors.fullName} label="Nombre completo" value={form.fullName} editing={editing} disabled={saving} onChange={change} />
            <ProfileField id="email" label="Correo electrónico" value={form.email} editing={false} onChange={change} hint="Tu correo de acceso. Contacta a soporte si necesitas ayuda con él." />
            <ProfileField id="phone" label="Teléfono" type="tel" value={form.phone} editing={editing} disabled={saving} onChange={change} />
            <ProfileField id="country" label="País" value={form.country} editing={editing} disabled={saving} onChange={change} />
          </div></AccountSection>
          <AccountSection id="empresa" title="Información empresarial" description="Presenta tu negocio y facilita que otros usuarios te conozcan."><div className={s.fieldGrid}>
            <ProfileField id="company" label="Nombre de la empresa" value={form.company} editing={editing} disabled={saving} onChange={change} />
            <ProfileField id="companyLink" error={fieldErrors.companyLink} label="Sitio web" value={form.companyLink} editing={editing} disabled={saving} onChange={change} hint={editing ? "Por ejemplo, https://tuempresa.com" : undefined} />
            <ProfileField id="address" label="Dirección" value={form.address} editing={editing} disabled={saving} onChange={change} wide />
            <div className={s.wideField}><label htmlFor={editing ? "bio" : undefined}>Acerca de tu empresa</label>{editing ? <><textarea id="bio" name="bio" disabled={saving} value={form.bio} onChange={change} maxLength={500} rows={5} aria-describedby="bio-hint" placeholder="Cuenta qué produces, tu experiencia y cómo trabajas." /><p id="bio-hint" className={s.hint}>{form.bio.length} de 500 caracteres · Se muestra en tu perfil público.</p></> : <p className={s.fieldValue}>{form.bio || <span className={s.missing}>Añade una descripción de tu empresa y de los productos que ofreces.</span>}</p>}</div>
          </div></AccountSection>
          {editing && <div className={s.editFooter}><p>Revisa tu información antes de guardar.</p><div className={s.buttonRow}>{actions}</div></div>}
          <AccountSection id="exportacion" title="Exportación y certificados" description="Documentos y fotos que respaldan la experiencia de tu empresa." accessory={<ProBadge />}>
            {exportNotice && <InlineNotice error={exportNotice.error} onClose={() => setExportNotice(null)}>{exportNotice.text}</InlineNotice>}
            {pro ? <><div className={s.exportForm}><h3>Agregar un documento</h3><div className={s.fieldGrid}><div className={s.field}><label htmlFor="export-type">Tipo de documento</label><select disabled={exportBusy} id="export-type" value={exportForm.type} onChange={event => setExportForm(previous => ({...previous,type: event.target.value}))}><option value="container_photo">Foto de contenedor</option><option value="certificate">Certificado de calidad</option></select></div><div className={s.field}><label htmlFor="export-label">Descripción</label><input disabled={exportBusy} id="export-label" value={exportForm.label} onChange={event => setExportForm(previous => ({...previous,label: event.target.value}))} placeholder="Ej. Certificación orgánica" /></div><div className={s.wideField}><label htmlFor="export-url">Enlace de la imagen o documento</label><input disabled={exportBusy} id="export-url" type="url" data-no-auto-caps="true" value={exportForm.url} onChange={event => setExportForm(previous => ({...previous,url: event.target.value}))} placeholder="https://…" /><p className={s.hint}>Usa un enlace público para que los compradores puedan consultarlo.</p></div></div><div className={s.buttonRow}><button className={c.primaryButton} disabled={exportBusy || !exportForm.label.trim() || !exportForm.url.trim()} onClick={() => void addExport()}>{exportBusy ? <Loader2 size={17} className={c.spinner} aria-hidden="true" /> : <Upload size={17} aria-hidden="true" />}Agregar documento</button></div></div>
              {history.length ? <div className={s.exportList}>{history.map((item,index) => <div key={`${item.url}-${index}`} className={s.exportItem}>{item.type === "certificate" ? <Award size={24} aria-hidden="true" /> : <Ship size={24} aria-hidden="true" />}<div><strong>{item.label}</strong><span>{item.type === "certificate" ? "Certificado" : "Foto de contenedor"}{item.uploaded_at ? ` · ${shortDate(item.uploaded_at)}` : ""}</span></div>{publicWebUrl(item.url) && <a href={publicWebUrl(item.url)!} target="_blank" rel="noopener noreferrer" className={c.detailLink} aria-label={`Ver ${item.label}`}>Ver<ExternalLink size={16} aria-hidden="true" /></a>}<button className={c.iconButton} data-danger="true" disabled={exportBusy} aria-label={`Retirar ${item.label}`} onClick={() => setDeleteIndex(index)}><Trash2 size={17} aria-hidden="true" /></button></div>)}</div> : <div className={s.exportEmpty}><Ship size={25} aria-hidden="true" /><div><strong>Tu experiencia, a la vista</strong><p>Agrega tus primeros certificados o fotos de contenedores para mostrarlos en tu perfil público.</p></div></div>}</> : <div className={s.lockedFeature}><LockKeyhole size={24} aria-hidden="true" /><div><strong>Una función de Agrilpa Pro</strong><p>Con una membresía Pro puedes mostrar tus certificados y fotos de exportación en el perfil de tu empresa.</p><Link href="/dashboard/soporte" className={c.textButton}>Consultar con soporte<ExternalLink size={15} aria-hidden="true" /></Link></div></div>}
          </AccountSection>
        </div>
      </div>
    </>}
    <AlertDialog open={deleteIndex !== null} onOpenChange={open => { if (!open) setDeleteIndex(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Retirar este documento?</AlertDialogTitle><AlertDialogDescription>«{deleteIndex === null ? "" : history[deleteIndex]?.label}» dejará de aparecer en tu perfil público.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Conservar documento</AlertDialogCancel><AlertDialogAction onClick={() => void deleteExport()} className="bg-destructive text-white hover:bg-destructive/90">Retirar documento</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </CommercePage>
}
