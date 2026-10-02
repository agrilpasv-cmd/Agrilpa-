"use client"

import { useState, useEffect, type FormEvent } from "react"
import Link from "next/link"
import { Loader2, LockKeyhole, ShieldCheck, Trash2, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ProBadge } from "@/components/ui/pro-badge"
import { CommercePage, InlineNotice, LoadingState, commerceStyles as c } from "@/components/dashboard/commerce-ui"
import { AccountSection, PasswordField, accountStyles as s } from "@/components/dashboard/account-ui"

type Status = { type: "success" | "error"; message: string } | null

export default function ConfiguracionPage() {
    const [isOAuthUser, setIsOAuthUser] = useState(false)

    const [checkingAccess, setCheckingAccess] = useState(true)
    const [accessError, setAccessError] = useState(false)
    const [providerName, setProviderName] = useState("Correo y contraseña")
    const [account, setAccount] = useState<{name: string; email: string; pro: boolean} | null>(null)
    const [retry, setRetry] = useState(0)
    useEffect(() => {
        let active = true
        setCheckingAccess(true); setAccessError(false)
        createClient().auth.getUser().then(({data: {user}, error}) => {
            if (error || !user) throw new Error("User unavailable")
            if (!active) return
            const provider = user.app_metadata?.provider
            const providers: string[] = user.app_metadata?.providers || []
            const oauth = Boolean((provider && provider !== "email") || (!providers.includes("email") && providers.length > 0))
            setIsOAuthUser(oauth)
            const source = provider || providers[0] || ""
            setProviderName(oauth ? ({google: "Google", apple: "Apple", facebook: "Facebook", github: "GitHub"} as Record<string,string>)[source] || "Proveedor externo" : "Correo y contraseña")
        }).catch(() => { if (active) setAccessError(true) }).finally(() => { if (active) setCheckingAccess(false) })
        fetch("/api/user/profile", {cache: "no-store"}).then(async response => {
            if (!response.ok) return
            const data = await response.json()
            if (active && data.user) setAccount({name: data.user.company_name || data.user.full_name || "Tu cuenta", email: data.user.email || "", pro: data.user.plan_type === "pro" && (!data.user.plan_expires_at || new Date(data.user.plan_expires_at) >= new Date())})
        }).catch(() => {})
        return () => { active = false }
    }, [retry])

    // ── Change Password ────────────────────────────────────────────
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [pwdLoading, setPwdLoading] = useState(false)
    const [pwdStatus, setPwdStatus] = useState<Status>(null)
    const [currentPwdError, setCurrentPwdError] = useState(false)

    const strengthLevel = (pwd: string) => {
        if (pwd.length < 6) return 0
        let score = 0
        if (pwd.length >= 6) score++
        if (pwd.length >= 10) score++
        if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++
        if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 14) score++
        return score
    }
    const strengthLabels = ["Muy corta", "Débil", "Media", "Buena", "Fuerte"]
    const level = strengthLevel(newPassword)

    const handleChangePassword = async () => {
        if (pwdLoading || checkingAccess || accessError || isOAuthUser) return
        setPwdStatus(null)
        setCurrentPwdError(false)
        if (!currentPassword) {
            setPwdStatus({ type: "error", message: "Ingresa tu contraseña actual." })
            setCurrentPwdError(true)
            return
        }
        if (!newPassword || newPassword.length < 6) {
            setPwdStatus({ type: "error", message: "La nueva contraseña debe tener al menos 6 caracteres." })
            return
        }
        if (newPassword !== confirmPassword) {
            setPwdStatus({ type: "error", message: "Las contraseñas nuevas no coinciden." })
            return
        }
        setPwdLoading(true)
        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setPwdStatus({ type: "success", message: "¡Contraseña actualizada correctamente!" })
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                if (data.field === "current") setCurrentPwdError(true)
                setPwdStatus({ type: "error", message: data.error || "Error al cambiar la contraseña." })
            }
        } catch {
            setPwdStatus({ type: "error", message: "Error de conexión. Intenta nuevamente." })
        } finally {
            setPwdLoading(false)
        }
    }

    // ── Delete Account ─────────────────────────────────────────────
    const [showDeleteZone, setShowDeleteZone] = useState(false)
    const [deleteReason, setDeleteReason] = useState("")
    const [deleteCustomReason, setDeleteCustomReason] = useState("")
    const [deletePassword, setDeletePassword] = useState("")
    const [showDeletePwd, setShowDeletePwd] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteStatus, setDeleteStatus] = useState<Status>(null)
    const [deletePwdError, setDeletePwdError] = useState(false)

    const DELETE_REASONS = [
        "Ya no necesito el servicio",
        "Encontré otra plataforma que me conviene más",
        "Tengo problemas técnicos o con mi cuenta",
        "No estoy obteniendo los resultados esperados",
        "Preocupaciones de privacidad o seguridad",
        "Otra razón",
    ]

    const handleDeleteAccount = async () => {
        if (deleteLoading || checkingAccess || accessError) return
        setDeleteStatus(null)
        setDeletePwdError(false)
        if (!deleteReason) {
            setDeleteStatus({ type: "error", message: "Por favor selecciona el motivo de eliminación." })
            return
        }
        if (!isOAuthUser && !deletePassword) {
            setDeleteStatus({ type: "error", message: "Ingresa tu contraseña para confirmar." })
            setDeletePwdError(true)
            return
        }
        if (deleteConfirmText !== "ELIMINAR") {
            setDeleteStatus({ type: "error", message: "Escribe ELIMINAR en mayúsculas para confirmar." })
            return
        }
        setDeleteLoading(true)
        try {
            const res = await fetch("/api/user/delete-account", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    password: isOAuthUser ? undefined : deletePassword, 
                    reason: deleteReason, 
                    customReason: deleteCustomReason 
                }),
            })
            const data = await res.json()
            if (res.ok && data.success) {
                // Clear client-side storage
                localStorage.clear()
                sessionStorage.clear()
                // Clear server-side HttpOnly session cookies via logout API
                await fetch("/api/auth/logout", { method: "POST" }).catch(() => { })
                // Replace (not push) so the user can't go back to a deleted session
                window.location.replace("/")
            } else {
                if (data.field === "password") setDeletePwdError(true)
                setDeleteStatus({ type: "error", message: data.error || "Error al eliminar la cuenta." })
                setDeleteLoading(false)
            }
        } catch {
            setDeleteStatus({ type: "error", message: "Error de conexión. Intenta nuevamente." })
            setDeleteLoading(false)
        }
    }

    const resetDelete = () => {
        setShowDeleteZone(false); setDeleteReason(""); setDeleteCustomReason(""); setDeletePassword(""); setDeleteConfirmText(""); setDeleteStatus(null); setDeletePwdError(false)
    }
    const submitPassword = (event: FormEvent) => { event.preventDefault(); void handleChangePassword() }
    const submitDelete = (event: FormEvent) => { event.preventDefault(); void handleDeleteAccount() }

    return <CommercePage title="Configuración" description="Administra el acceso y la seguridad de tu cuenta." action={<Link href="/dashboard/perfil" className={c.secondaryButton}>Ver mi perfil<ExternalLink size={17} aria-hidden="true" /></Link>}>
        <div className={s.layout}>
            <aside className={s.sidebar} aria-label="Información de la cuenta"><div className={s.securitySummary}><div className={s.securityIcon}><ShieldCheck size={24} aria-hidden="true" /></div><h2>Tu cuenta en Agrilpa</h2><p>{account?.name || "Gestiona tu acceso y tus datos desde un solo lugar."}</p><dl className={s.accountFacts}>{account?.email && <div><dt>Correo de acceso</dt><dd>{account.email}</dd></div>}<div><dt>Método de acceso</dt><dd>{checkingAccess ? "Comprobando…" : accessError ? "No disponible" : providerName}</dd></div>{account && <div><dt>Membresía</dt><dd>{account.pro ? <ProBadge /> : "Plan gratuito"}</dd></div>}</dl></div><div className={s.sidebarNote}><h3>¿Necesitas ayuda con tu cuenta?</h3><p>El equipo de soporte puede orientarte sobre tu acceso, información del perfil y membresía.</p><Link href="/dashboard/soporte">Ir a soporte<ExternalLink size={15} aria-hidden="true" /></Link></div></aside>
            <div className={s.content}>
                <AccountSection id="seguridad" title="Acceso y contraseña" description="Controla cómo inicias sesión en Agrilpa.">
                    {checkingAccess ? <LoadingState label="Comprobando tu método de acceso…" /> : accessError ? <InlineNotice error>No pudimos comprobar tu acceso. <button className={c.textButton} onClick={() => setRetry(value => value + 1)}>Reintentar</button></InlineNotice> : isOAuthUser ? <div className={s.oauth}><LockKeyhole size={25} aria-hidden="true" /><div><strong>Inicias sesión con {providerName}</strong><p>Tu contraseña se administra desde tu cuenta de {providerName}. Puedes cambiarla en la configuración de ese servicio.</p><p>Agrilpa no guarda una contraseña independiente para este método de acceso.</p></div></div> : <form className={s.passwordForm} onSubmit={submitPassword}>
                        <PasswordField id="current-password" label="Contraseña actual" value={currentPassword} onChange={value => {setCurrentPassword(value); setPwdStatus(null); setCurrentPwdError(false)}} shown={showCurrent} onToggle={() => setShowCurrent(value => !value)} autoComplete="current-password" disabled={pwdLoading} error={currentPwdError ? currentPassword ? "Revisa tu contraseña actual." : "Ingresa tu contraseña actual." : undefined} />
                        <div><PasswordField id="new-password" label="Nueva contraseña" value={newPassword} onChange={value => {setNewPassword(value); setPwdStatus(null)}} shown={showNew} onToggle={() => setShowNew(value => !value)} autoComplete="new-password" disabled={pwdLoading} hint="Usa al menos 6 caracteres. Puedes combinar palabras, números y símbolos." />{newPassword && <div className={s.strength} role="status" aria-label={`Fortaleza de la contraseña: ${strengthLabels[level]}`}><div aria-hidden="true">{[1,2,3,4].map(index => <i key={index} data-filled={level >= index} />)}</div><span>{strengthLabels[level]}</span></div>}</div>
                        <PasswordField id="confirm-password" label="Confirmar nueva contraseña" value={confirmPassword} onChange={value => {setConfirmPassword(value); setPwdStatus(null)}} shown={showConfirm} onToggle={() => setShowConfirm(value => !value)} autoComplete="new-password" disabled={pwdLoading} error={confirmPassword && newPassword !== confirmPassword ? "Las contraseñas todavía no coinciden." : undefined} hint={confirmPassword && newPassword === confirmPassword ? "Las contraseñas coinciden." : undefined} />
                        {pwdStatus && <InlineNotice error={pwdStatus.type === "error"}>{pwdStatus.message}</InlineNotice>}
                        <div className={s.buttonRow}><button type="submit" className={c.primaryButton} disabled={pwdLoading}>{pwdLoading ? <Loader2 size={17} className={c.spinner} aria-hidden="true" /> : <LockKeyhole size={17} aria-hidden="true" />}{pwdLoading ? "Actualizando…" : "Actualizar contraseña"}</button></div>
                    </form>}
                </AccountSection>
                <AccountSection id="gestion-cuenta" title="Gestión de la cuenta" description="Opciones relacionadas con la permanencia de tus datos en Agrilpa." danger>
                    {!showDeleteZone ? <div className={s.dangerRow}><div><strong>Eliminar mi cuenta</strong><p>Se eliminarán tu cuenta, publicaciones y datos asociados. Esta acción es permanente y no se puede deshacer.</p></div><button type="button" className={s.dangerButton} disabled={checkingAccess || accessError} onClick={() => setShowDeleteZone(true)}>Eliminar cuenta</button></div> : <form className={s.deleteFlow} onSubmit={submitDelete}>
                        <p className={s.hint}>Antes de continuar, confirma el motivo y tu identidad. La eliminación es permanente.</p>
                        <fieldset disabled={deleteLoading}><legend>¿Por qué quieres eliminar tu cuenta?</legend><div className={s.reasons}>{DELETE_REASONS.map(reason => <label key={reason}><input type="radio" name="deleteReason" value={reason} checked={deleteReason === reason} onChange={() => {setDeleteReason(reason); setDeleteCustomReason(""); setDeleteStatus(null)}} /><span>{reason}</span></label>)}</div></fieldset>
                        {deleteReason === "Otra razón" && <div className={s.field}><label htmlFor="delete-custom-reason">Cuéntanos más (opcional)</label><textarea id="delete-custom-reason" rows={3} value={deleteCustomReason} disabled={deleteLoading} onChange={event => setDeleteCustomReason(event.target.value)} /></div>}
                        {!isOAuthUser && <PasswordField id="delete-password" label="Confirma tu contraseña actual" value={deletePassword} onChange={value => {setDeletePassword(value); setDeleteStatus(null); setDeletePwdError(false)}} shown={showDeletePwd} onToggle={() => setShowDeletePwd(value => !value)} autoComplete="current-password" disabled={deleteLoading} error={deletePwdError ? "Revisa tu contraseña actual." : undefined} />}
                        <div className={s.field}><label htmlFor="delete-confirm">Escribe <code>ELIMINAR</code> para confirmar</label><input id="delete-confirm" type="text" data-no-auto-caps="true" autoComplete="off" value={deleteConfirmText} onChange={event => {setDeleteConfirmText(event.target.value); setDeleteStatus(null)}} disabled={deleteLoading} /></div>
                        {deleteStatus && <InlineNotice error>{deleteStatus.message}</InlineNotice>}
                        <div className={s.buttonRow}><button type="button" className={c.secondaryButton} onClick={resetDelete} disabled={deleteLoading}>Conservar mi cuenta</button><button type="submit" className={s.dangerConfirm} disabled={deleteLoading || deleteConfirmText !== "ELIMINAR" || !deleteReason || (!isOAuthUser && !deletePassword)}>{deleteLoading ? <Loader2 size={17} className={c.spinner} aria-hidden="true" /> : <Trash2 size={17} aria-hidden="true" />}{deleteLoading ? "Eliminando…" : "Eliminar cuenta definitivamente"}</button></div>
                    </form>}
                </AccountSection>
            </div>
        </div>
    </CommercePage>
}
