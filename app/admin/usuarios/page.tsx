"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProBadge } from "@/components/ui/pro-badge"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  RefreshCw,
  Trash2,
  Download,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  X,
  ExternalLink,
} from "lucide-react"
import s from "./usuarios.module.css"

interface User {
  id: string
  full_name: string
  email: string
  company_name: string
  phone: string
  country: string
  state?: string
  user_type: string
  user_sub_type?: string
  role: string
  created_at: string
  products_of_interest?: string[]
  supply_countries?: string[]
  provider_countries?: string[]
  has_export_certificates?: boolean
  address?: string
  annual_volume?: string
  country_code?: string
  metadata_phone_number?: string
  company_website?: string
  how_heard_about_us?: string
  how_heard_other?: string
  last_sign_in_at?: string | null
  plan_type?: string
}

type RoleFilter = "all" | "admin" | "vendedor" | "comprador"

const HOW_HEARD_LABELS: Record<string, string> = {
  TikTok: "TikTok",
  Instagram: "Instagram",
  Facebook: "Facebook",
  LinkedIn: "LinkedIn",
  Reddit: "Reddit",
  Correo: "Correo electrónico",
  "Recomendación de un amigo/colega": "Recomendación",
  Internet: "Internet / Google",
  Otro: "Otro",
}

const formatPhone = (u: User) => {
  if (u.country_code && u.metadata_phone_number) {
    return `+${u.country_code} ${u.metadata_phone_number}`
  }
  if (u.phone) {
    return u.phone.startsWith("+") ? u.phone : `+${u.phone}`
  }
  return ""
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const { toast } = useToast()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [userForAdminDialog, setUserForAdminDialog] = useState<User | null>(
    null
  )
  const [adminAction, setAdminAction] = useState<"grant" | "revoke">("grant")
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false)

  const fetchUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    setFetchError("")
    try {
      const response = await fetch(`/api/admin/users?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al obtener usuarios")
      }

      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
      setLastUpdate(new Date())
    } catch (error: any) {
      setFetchError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los usuarios."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers(true)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const intervalTime = isMobile ? 60000 : 30000
    const intervalId = setInterval(() => {
      void fetchUsers(false)
    }, intervalTime)
    return () => clearInterval(intervalId)
  }, [fetchUsers])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "No se pudo actualizar el rol")

      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido cambiado a "${newRole}".`,
      })

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      await fetchUsers(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "No se pudo actualizar el rol del usuario.",
        variant: "destructive",
      })
    }
  }

  const openAdminModal = (user: User, action: "grant" | "revoke") => {
    setUserForAdminDialog(user)
    setAdminAction(action)
    setAdminDialogOpen(true)
  }

  const handleConfirmAdminChange = async () => {
    if (!userForAdminDialog) return
    const newRole = adminAction === "grant" ? "admin" : "user"
    setIsUpdatingAdmin(true)
    try {
      const response = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userForAdminDialog.id, role: newRole }),
      })

      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "No se pudo actualizar el rol")

      toast({
        title:
          adminAction === "grant"
            ? "Administrador asignado"
            : "Permisos revocados",
        description:
          adminAction === "grant"
            ? `${userForAdminDialog.full_name} ahora tiene permisos de administrador.`
            : `Se han quitado los permisos de administrador a ${userForAdminDialog.full_name}.`,
      })

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userForAdminDialog.id ? { ...u, role: newRole } : u
        )
      )
      setAdminDialogOpen(false)
      setUserForAdminDialog(null)
      await fetchUsers(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "No se pudo cambiar el estado de administrador.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingAdmin(false)
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setDeleteConfirmText("")
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete || deleteConfirmText.toUpperCase() !== "ELIMINAR") return
    setIsDeleting(true)
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete.id }),
      })

      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || "Error al eliminar usuario")

      toast({
        title: "Usuario eliminado",
        description: `El usuario ${userToDelete.full_name || userToDelete.email} ha sido eliminado.`,
      })

      setDeleteDialogOpen(false)
      setUserToDelete(null)
      setDeleteConfirmText("")
      await fetchUsers(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportCSV = () => {
    if (users.length === 0) return

    const headers = [
      "Nombre",
      "Email",
      "Empresa",
      "Web/Link",
      "Teléfono",
      "País",
      "Estado",
      "Dirección",
      "Certificados",
      "Productos de Interés",
      "Países Destino",
      "Países Proveedores",
      "Volumen Anual",
      "Tipo",
      "Sub Tipo",
      "¿Cómo supo de Agrilpa?",
      "Rol",
      "Registro",
      "Último Inicio de Sesión",
    ]

    const csvContent = [
      headers.join(";"),
      ...users.map((u: any) =>
        [
          `"${(u.full_name || "").replace(/"/g, '""')}"`,
          `"${(u.email || "").replace(/"/g, '""')}"`,
          `"${(u.company_name || "").replace(/"/g, '""')}"`,
          `"${(u.company_website || "").replace(/"/g, '""')}"`,
          `"${(formatPhone(u) || "").replace(/"/g, '""')}"`,
          `"${(u.country || "").replace(/"/g, '""')}"`,
          `"${(u.state || "").replace(/"/g, '""')}"`,
          `"${(u.address || "").replace(/"/g, '""')}"`,
          `"${u.has_export_certificates ? "Sí" : "No"}"`,
          `"${(u.products_of_interest?.join(" | ") || "").replace(/"/g, '""')}"`,
          `"${(u.supply_countries?.join(" | ") || "").replace(/"/g, '""')}"`,
          `"${(u.provider_countries?.join(" | ") || "").replace(/"/g, '""')}"`,
          `"${(u.annual_volume || "").replace(/"/g, '""')}"`,
          `"${(u.user_type || "").replace(/"/g, '""')}"`,
          `"${(u.user_sub_type || "").replace(/"/g, '""')}"`,
          `"${(u.how_heard_about_us ? HOW_HEARD_LABELS[u.how_heard_about_us] || u.how_heard_about_us : "").replace(/"/g, '""')}"`,
          `"${(u.role || "").replace(/"/g, '""')}"`,
          `"${new Date(u.created_at).toLocaleDateString()}"`,
          `"${u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Nunca"}"`,
        ].join(";")
      ),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `agrilpa_usuarios_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  )
  const sellerCount = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === "vendedor" || u.user_type?.toLowerCase() === "vendedor"
      ).length,
    [users]
  )
  const buyerCount = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === "comprador" || u.user_type?.toLowerCase() === "comprador"
      ).length,
    [users]
  )

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return users.filter((user) => {
      if (roleFilter === "admin" && user.role !== "admin") return false
      if (
        roleFilter === "vendedor" &&
        user.role !== "vendedor" &&
        user.user_type?.toLowerCase() !== "vendedor"
      )
        return false
      if (
        roleFilter === "comprador" &&
        user.role !== "comprador" &&
        user.user_type?.toLowerCase() !== "comprador"
      )
        return false

      if (!q) return true
      return (
        user.full_name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.company_name?.toLowerCase().includes(q) ||
        user.country?.toLowerCase().includes(q)
      )
    })
  }, [users, roleFilter, searchTerm])

  return (
    <section className={s.page} aria-label="Gestión de Usuarios">
      <header className={s.header}>
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra los usuarios registrados y los roles de administrador</p>
        </div>
        <div className={s.headerActions}>
          {lastUpdate && (
            <span className={s.updated}>
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            className={s.secondaryButton}
            onClick={handleExportCSV}
            disabled={loading || users.length === 0}
          >
            <Download size={16} aria-hidden="true" />
            Descargar CSV
          </button>
          <button
            type="button"
            className={s.secondaryButton}
            onClick={() => void fetchUsers(true)}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? s.spinner : undefined}
              aria-hidden="true"
            />
            Actualizar
          </button>
        </div>
      </header>

      {fetchError && (
        <div className={s.notice} role="alert">
          <span>{fetchError}</span>
          <button
            type="button"
            className={s.secondaryButton}
            onClick={() => void fetchUsers(true)}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className={s.panel}>
        <div className={s.panelHead}>
          <div className={s.panelTitle}>
            <h2>Usuarios Registrados</h2>
            <p>
              Mostrando {filteredUsers.length} de {users.length}{" "}
              {users.length === 1 ? "usuario" : "usuarios"} ({adminCount}{" "}
              {adminCount === 1 ? "administrador" : "administradores"})
            </p>
          </div>

          <div className={s.controls}>
            <div className={s.search}>
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, empresa..."
                aria-label="Buscar por nombre, email o empresa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-no-auto-caps="true"
              />
              {searchTerm && (
                <button
                  type="button"
                  className={s.clearSearch}
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className={s.filterGroup} role="group" aria-label="Filtrar usuarios">
              <button
                type="button"
                className={s.filterBtn}
                aria-pressed={roleFilter === "all"}
                onClick={() => setRoleFilter("all")}
              >
                Todos ({users.length})
              </button>
              <button
                type="button"
                className={s.filterBtn}
                aria-pressed={roleFilter === "admin"}
                onClick={() => setRoleFilter("admin")}
              >
                <ShieldCheck size={14} aria-hidden="true" />
                Admins ({adminCount})
              </button>
              <button
                type="button"
                className={s.filterBtn}
                aria-pressed={roleFilter === "vendedor"}
                onClick={() => setRoleFilter("vendedor")}
              >
                Vendedores ({sellerCount})
              </button>
              <button
                type="button"
                className={s.filterBtn}
                aria-pressed={roleFilter === "comprador"}
                onClick={() => setRoleFilter("comprador")}
              >
                Compradores ({buyerCount})
              </button>
            </div>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className={s.loading} role="status">
            <Loader2 size={22} className={s.spinner} aria-hidden="true" />
            <span>Cargando usuarios...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={s.empty}>
            <p>
              {searchTerm || roleFilter !== "all"
                ? "No se encontraron usuarios con esos filtros"
                : "No hay usuarios registrados"}
            </p>
            {(searchTerm || roleFilter !== "all") && (
              <button
                type="button"
                className={s.secondaryButton}
                onClick={() => {
                  setSearchTerm("")
                  setRoleFilter("all")
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Email</th>
                  <th scope="col">Empresa</th>
                  <th scope="col">Web/Link</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">País</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Dirección</th>
                  <th scope="col">Certificados</th>
                  <th scope="col">Productos de Interés</th>
                  <th scope="col">Países de Interés</th>
                  <th scope="col">Países P.</th>
                  <th scope="col">Volumen Anual</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">¿Cómo supo de Agrilpa?</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Plan</th>
                  <th scope="col">Registro</th>
                  <th scope="col">Última Sesión</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const CERT_QUESTION_DATE = new Date("2026-04-10T00:00:00Z")
                  const userCreatedAt = new Date(user.created_at)
                  const wasAsked = userCreatedAt >= CERT_QUESTION_DATE
                  const phoneStr = formatPhone(user)
                  const heardLabel = user.how_heard_about_us
                    ? HOW_HEARD_LABELS[user.how_heard_about_us] ||
                      user.how_heard_about_us
                    : ""
                  const lastSignDate = user.last_sign_in_at
                    ? new Date(user.last_sign_in_at)
                    : null
                  const isRecentSign =
                    lastSignDate &&
                    !isNaN(lastSignDate.getTime()) &&
                    Date.now() - lastSignDate.getTime() <= 24 * 60 * 60 * 1000

                  return (
                    <tr key={user.id} data-admin={user.role === "admin"}>
                      <td>
                        <span className={s.nameCell}>
                          {user.role === "admin" && (
                            <ShieldCheck
                              size={15}
                              className={s.adminIcon}
                              aria-hidden="true"
                            />
                          )}
                          {user.full_name || "-"}
                        </span>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        {user.company_name || (
                          <span className={s.mutedDash}>-</span>
                        )}
                      </td>

                      <td>
                        {user.company_website ? (
                          <a
                            href={
                              user.company_website.startsWith("http")
                                ? user.company_website
                                : `https://${user.company_website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={s.webLink}
                          >
                            Visitar sitio
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        ) : (
                          <span className={s.mutedDash}>-</span>
                        )}
                      </td>

                      <td>
                        {phoneStr || <span className={s.mutedDash}>-</span>}
                      </td>

                      <td>
                        {user.country || <span className={s.mutedDash}>-</span>}
                      </td>

                      <td>
                        {user.state || <span className={s.mutedDash}>-</span>}
                      </td>

                      <td className={s.addressCell} title={user.address}>
                        {user.address || <span className={s.mutedDash}>-</span>}
                      </td>

                      <td>
                        {user.has_export_certificates === true ? (
                          <span className={s.badgeYes}>
                            <span className={s.dotYes} aria-hidden="true" />
                            Sí
                          </span>
                        ) : user.has_export_certificates === false &&
                          wasAsked ? (
                          <span className={s.badgeNo}>
                            <span className={s.dotNo} aria-hidden="true" />
                            No
                          </span>
                        ) : (
                          <span className={s.badgeNeutral}>Sin respuesta</span>
                        )}
                      </td>

                      <td className={s.chipsCell}>
                        {user.products_of_interest &&
                        user.products_of_interest.length > 0 ? (
                          <div className={s.chipList}>
                            {user.products_of_interest.map((p, i) => (
                              <span key={i} className={s.chip}>
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={s.mutedDash}>-</span>
                        )}
                      </td>

                      <td className={s.chipsCell}>
                        {user.supply_countries &&
                        user.supply_countries.length > 0 ? (
                          <div className={s.chipList}>
                            {user.supply_countries.map((c, i) => (
                              <span
                                key={i}
                                className={`${s.chip} ${s.chipGreen}`}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={s.mutedDash}>-</span>
                        )}
                      </td>

                      <td className={s.chipsCell}>
                        {user.provider_countries &&
                        user.provider_countries.length > 0 ? (
                          <div className={s.chipList}>
                            {user.provider_countries.map((c, i) => (
                              <span key={i} className={s.chip}>
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={s.mutedDash}>-</span>
                        )}
                      </td>

                      <td>
                        {user.annual_volume || (
                          <span className={s.mutedDash}>-</span>
                        )}
                      </td>

                      <td>
                        <span className={s.badgeNeutral}>
                          {user.user_type || "Usuario"}
                        </span>
                      </td>

                      <td>
                        {user.how_heard_about_us ? (
                          <span className={s.badgeNeutral}>
                            {user.how_heard_about_us === "Otro" &&
                            user.how_heard_other
                              ? `Otro: ${user.how_heard_other}`
                              : heardLabel}
                          </span>
                        ) : (
                          <span className={s.mutedDash}>-</span>
                        )}
                      </td>

                      <td>
                        <Select
                          value={user.role || "user"}
                          onValueChange={(value) =>
                            void handleRoleChange(user.id, value)
                          }
                        >
                          <SelectTrigger
                            className={s.roleSelect}
                            aria-label={`Cambiar rol de ${user.full_name || user.email}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="vendedor">Vendedor</SelectItem>
                            <SelectItem value="comprador">Comprador</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td>
                        {user.plan_type === "pro" ? (
                          <ProBadge />
                        ) : (
                          <span className={s.freeBadge}>GRATIS</span>
                        )}
                      </td>

                      <td>{new Date(user.created_at).toLocaleDateString()}</td>

                      <td>
                        {lastSignDate && !isNaN(lastSignDate.getTime()) ? (
                          <span className={s.sessionInline}>
                            {isRecentSign && (
                              <span
                                className={s.recentDot}
                                title="Activo en las últimas 24 horas"
                              />
                            )}
                            <span>
                              {lastSignDate.toLocaleDateString()} ·{" "}
                              {lastSignDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                        ) : (
                          <span className={s.mutedDash}>Nunca</span>
                        )}
                      </td>

                      <td>
                        <div className={s.rowActions}>
                          {user.email === "agrilpasv@gmail.com" ? (
                            <span className={s.principalBadge}>
                              <ShieldCheck size={13} aria-hidden="true" />
                              Principal
                            </span>
                          ) : user.role === "admin" ? (
                            <button
                              type="button"
                              className={s.actionBtn}
                              onClick={() => openAdminModal(user, "revoke")}
                            >
                              <ShieldAlert size={14} aria-hidden="true" />
                              Quitar Admin
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={s.actionBtn}
                              onClick={() => openAdminModal(user, "grant")}
                            >
                              <Shield size={14} aria-hidden="true" />
                              Hacer Admin
                            </button>
                          )}

                          {user.email !== "agrilpasv@gmail.com" && (
                            <button
                              type="button"
                              className={s.deleteBtn}
                              aria-label={`Eliminar cuenta de ${user.full_name || user.email}`}
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {adminAction === "grant"
                ? "Dar permisos de Administrador"
                : "Quitar permisos de Administrador"}
            </DialogTitle>
            <DialogDescription>
              {adminAction === "grant"
                ? "El usuario tendrá acceso completo al panel de administración y podrá gestionar usuarios, productos y configuraciones."
                : "El usuario perderá el acceso al panel de administración y sus permisos especiales."}
            </DialogDescription>
          </DialogHeader>

          {userForAdminDialog && (
            <div className={s.dialogBody}>
              <div className={s.dialogUserCard}>
                <strong>{userForAdminDialog.full_name}</strong>
                <span>{userForAdminDialog.email}</span>
                {userForAdminDialog.company_name && (
                  <span>{userForAdminDialog.company_name}</span>
                )}
              </div>

              <p className={s.dialogNote}>
                {adminAction === "grant"
                  ? "Solo otorga permisos de administrador a usuarios de plena confianza."
                  : "El usuario pasará a tener rol de usuario regular."}
              </p>

              <div className={s.dialogFooter}>
                <button
                  type="button"
                  className={s.secondaryButton}
                  onClick={() => setAdminDialogOpen(false)}
                  disabled={isUpdatingAdmin}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={s.primaryButton}
                  onClick={() => void handleConfirmAdminChange()}
                  disabled={isUpdatingAdmin}
                >
                  {isUpdatingAdmin && (
                    <Loader2
                      size={15}
                      className={s.spinner}
                      aria-hidden="true"
                    />
                  )}
                  {adminAction === "grant"
                    ? "Hacer Administrador"
                    : "Quitar Permisos"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente al
              usuario y todos sus datos asociados.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className={s.dialogBody}>
              <div className={s.dialogUserCard}>
                <strong>{userToDelete.full_name || "Sin nombre"}</strong>
                <span>{userToDelete.email}</span>
                {userToDelete.company_name && (
                  <span>{userToDelete.company_name}</span>
                )}
              </div>

              <div className={s.confirmField}>
                <label htmlFor="delete-user-confirm-input">
                  Escribe <strong>ELIMINAR</strong> para confirmar:
                </label>
                <input
                  id="delete-user-confirm-input"
                  type="text"
                  className={s.confirmInput}
                  placeholder="ELIMINAR"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={isDeleting}
                />
              </div>

              <div className={s.dialogFooter}>
                <button
                  type="button"
                  className={s.secondaryButton}
                  onClick={() => {
                    setDeleteDialogOpen(false)
                    setUserToDelete(null)
                    setDeleteConfirmText("")
                  }}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={s.dangerButton}
                  onClick={() => void handleDeleteUser()}
                  disabled={
                    deleteConfirmText.toUpperCase() !== "ELIMINAR" || isDeleting
                  }
                >
                  {isDeleting && (
                    <Loader2
                      size={15}
                      className={s.spinner}
                      aria-hidden="true"
                    />
                  )}
                  {isDeleting ? "Eliminando..." : "Eliminar Usuario"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
