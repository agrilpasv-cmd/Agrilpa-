"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Download,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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

const formatLastSignIn = (dateString?: string | null) => {
  if (!dateString) {
    return <span className="text-muted-foreground text-xs italic">Nunca</span>
  }
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return <span className="text-muted-foreground text-xs italic">Nunca</span>
  }

  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  const isRecent = diffHours <= 24

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      {isRecent && (
        <span
          className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
          title="Inició sesión en las últimas 24 horas"
        />
      )}
      <div className="flex flex-col">
        <span className="text-xs font-medium text-foreground">
          {date.toLocaleDateString("es-ES")}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  )
}

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const { toast } = useToast()

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Admin Role Toggle Modal State
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [userForAdminDialog, setUserForAdminDialog] = useState<User | null>(null)
  const [adminAction, setAdminAction] = useState<"grant" | "revoke">("grant")
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false)

  const fetchUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)

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
        throw new Error(errorData.error || "Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data || [])
      setLastUpdate(new Date())
    } catch (error: any) {
      console.error("[Agrilpa] Admin Users Page error:", error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers(true)

    // Reduced polling frequency for mobile performance
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const intervalTime = isMobile ? 60000 : 30000 // 1min mobile, 30s desktop

    const intervalId = setInterval(() => {
      fetchUsers(false)
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
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar el rol")

      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido actualizado a "${newRole}" exitosamente`,
      })

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      await fetchUsers(false)
    } catch (error: any) {
      console.error("Error updating role:", error)
      toast({
        title: "Error al actualizar rol",
        description: error.message || "No se pudo actualizar el rol del usuario",
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
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar los permisos")

      toast({
        title: adminAction === "grant" ? "¡Nuevo Administrador asignado!" : "Permisos revocados",
        description:
          adminAction === "grant"
            ? `${userForAdminDialog.full_name} ahora tiene acceso completo como Administrador.`
            : `Se han quitado los permisos de Administrador a ${userForAdminDialog.full_name}.`,
      })

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userForAdminDialog.id ? { ...u, role: newRole } : u))
      )
      setAdminDialogOpen(false)
      setUserForAdminDialog(null)
      await fetchUsers(false)
    } catch (error: any) {
      console.error("Error changing admin status:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado de administrador",
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

      if (!response.ok) throw new Error(result.error || "Error al eliminar usuario")

      toast({
        title: "Usuario eliminado",
        description: `El usuario ${userToDelete.full_name} fue eliminado correctamente.`,
      })

      setDeleteDialogOpen(false)
      setUserToDelete(null)
      setDeleteConfirmText("")
      await fetchUsers(false)
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleManualRefresh = () => {
    fetchUsers(true)
  }

  const handleExportCSV = () => {
    if (users.length === 0) return

    const headers = [
      "Nombre", "Email", "Empresa", "Web/Link", "Teléfono", "País", "Estado",
      "Dirección", "Certificados", "Productos de Interés", "Países Destino",
      "Países Proveedores", "Volumen Anual", "Tipo", "Sub Tipo", "¿Cómo supo de Agrilpa?", "Rol", "Registro", "Último Inicio de Sesión"
    ]

    const csvContent = [
      headers.join(";"),
      ...users.map((u: any) => {
        return [
          `"${(u.full_name || "").replace(/"/g, '""')}"`,
          `"${(u.email || "").replace(/"/g, '""')}"`,
          `"${(u.company_name || "").replace(/"/g, '""')}"`,
          `"${(u.company_website || "").replace(/"/g, '""')}"`,
          `"${(u.phone || "").replace(/"/g, '""')}"`,
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
          `"${u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Nunca"}"`
        ].join(";")
      })
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `agrilpa_usuarios_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter users by search term and role
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role filter
      if (roleFilter !== "all") {
        if (roleFilter === "admin" && user.role !== "admin") return false
        if (roleFilter === "vendedor" && user.role !== "vendedor") return false
        if (roleFilter === "comprador" && user.role !== "comprador") return false
        if (roleFilter === "user" && user.role !== "user" && user.role) return false
      }

      // Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchName = user.full_name?.toLowerCase().includes(query)
        const matchEmail = user.email?.toLowerCase().includes(query)
        const matchCompany = user.company_name?.toLowerCase().includes(query)
        const matchCountry = user.country?.toLowerCase().includes(query)
        return matchName || matchEmail || matchCompany || matchCountry
      }

      return true
    })
  }, [users, roleFilter, searchTerm])

  const adminCount = useMemo(() => users.filter((u) => u.role === "admin").length, [users])

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios registrados y los roles de administrador</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={loading || users.length === 0}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Usuarios Registrados</CardTitle>
              <CardDescription>
                Mostrando {filteredUsers.length} de {users.length} usuarios ({adminCount} administradores)
              </CardDescription>
            </div>

            {/* Quick search and filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, país..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setRoleFilter("all")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    roleFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("admin")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                    roleFilter === "admin"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-purple-700 hover:text-purple-800"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admins ({adminCount})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("vendedor")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    roleFilter === "vendedor" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Vendedores
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("comprador")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    roleFilter === "comprador" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Compradores
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {users.length === 0 ? "No hay usuarios registrados" : "No se encontraron usuarios con los filtros aplicados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Nombre</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Empresa</th>
                    <th className="text-left p-4 font-medium">Web/Link</th>
                    <th className="text-left p-4 font-medium">Teléfono</th>
                    <th className="text-left p-4 font-medium">País</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium">Dirección</th>
                    <th className="text-left p-4 font-medium">Certificados</th>
                    <th className="text-left p-4 font-medium">Productos de Interés</th>
                    <th className="text-left p-4 font-medium">Países de Interés</th>
                    <th className="text-left p-4 font-medium">Países P.</th>
                    <th className="text-left p-4 font-medium">Volumen Anual</th>
                    <th className="text-left p-4 font-medium">Tipo</th>
                    <th className="text-left p-4 font-medium">¿Cómo supo de Agrilpa?</th>
                    <th className="text-left p-4 font-medium">Rol</th>
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-left p-4 font-medium">Registro</th>
                    <th className="text-left p-4 font-medium">Última Sesión</th>
                    <th className="text-left p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b hover:bg-muted/50 ${
                        user.role === "admin" ? "bg-purple-50/40 dark:bg-purple-950/20" : ""
                      }`}
                    >
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          {user.role === "admin" && (
                            <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          )}
                          <span>{user.full_name}</span>
                        </div>
                      </td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">{user.company_name || "-"}</td>
                      <td className="p-4">
                        {user.company_website ? (
                          <a
                            href={user.company_website.startsWith("http") ? user.company_website : `https://${user.company_website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm truncate max-w-[150px] inline-block"
                          >
                            Visitar sitio
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {user.country_code && user.metadata_phone_number
                          ? `+${user.country_code} ${user.metadata_phone_number}`
                          : user.phone
                            ? (user.phone.startsWith("+") ? user.phone : `+${user.phone}`)
                            : "-"
                        }
                      </td>
                      <td className="p-4">{user.country || "-"}</td>
                      <td className="p-4">{user.state || "-"}</td>
                      <td className="p-4 min-w-[200px] whitespace-normal break-words">{user.address || "-"}</td>
                      <td className="p-4">
                        {(() => {
                          const CERT_QUESTION_DATE = new Date("2026-04-10T00:00:00Z")
                          const userCreatedAt = new Date(user.created_at)
                          const wasAsked = userCreatedAt >= CERT_QUESTION_DATE

                          if (user.has_export_certificates === true) {
                            return (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 shadow-sm flex items-center w-fit gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Sí
                              </span>
                            )
                          }
                          if (user.has_export_certificates === false && wasAsked) {
                            return (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 shadow-sm flex items-center w-fit gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> No
                              </span>
                            )
                          }
                          return <span className="text-muted-foreground text-xs">Sin respuesta</span>
                        })()}
                      </td>
                      <td className="p-4 max-w-xs">
                        {user.products_of_interest && user.products_of_interest.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.products_of_interest.map((product, idx) => (
                              <span key={idx} className="text-xs font-medium text-foreground bg-secondary/50 px-2 py-1 rounded">
                                {product}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 max-w-xs">
                        {user.supply_countries && user.supply_countries.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.supply_countries.map((country, idx) => (
                              <span key={idx} className="text-xs font-medium text-foreground bg-green-100 text-green-800 px-2 py-1 rounded">
                                {country}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 max-w-xs">
                        {user.provider_countries && user.provider_countries.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.provider_countries.map((country, idx) => (
                              <span key={idx} className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-1 rounded border border-amber-200 shadow-sm">
                                {country}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {user.annual_volume ? (
                          <span className="text-sm font-medium">{user.annual_volume}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {user.user_type || "Usuario"}
                        </span>
                      </td>
                      <td className="p-4 min-w-[160px]">
                        {user.how_heard_about_us ? (
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 w-fit">
                              {HOW_HEARD_LABELS[user.how_heard_about_us] || user.how_heard_about_us}
                            </span>
                            {user.how_heard_about_us === "Otro" && user.how_heard_other && (
                              <span className="text-xs text-muted-foreground italic">{user.how_heard_other}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin respuesta</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                          {user.role === "admin" ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm flex items-center w-fit gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Administrador
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-medium text-muted-foreground w-fit">
                              {user.role === "vendedor"
                                ? "Vendedor"
                                : user.role === "comprador"
                                  ? "Comprador"
                                  : "Usuario estándar"}
                            </span>
                          )}
                          <Select value={user.role || "user"} onValueChange={(value) => handleRoleChange(user.id, value)}>
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuario</SelectItem>
                              <SelectItem value="vendedor">Vendedor</SelectItem>
                              <SelectItem value="comprador">Comprador</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.plan_type === "pro" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                          {(user.plan_type || "gratis").toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {formatLastSignIn(user.last_sign_in_at)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {user.email === "agrilpasv@gmail.com" ? (
                            <span
                              className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded px-2 py-1 flex items-center gap-1 shadow-sm"
                              title="Administrador Principal protegido"
                            >
                              <Shield className="w-3 h-3" /> Principal
                            </span>
                          ) : user.role === "admin" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAdminModal(user, "revoke")}
                              className="text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800 h-8 px-2 text-xs flex items-center gap-1 font-medium"
                              title="Quitar rol de Administrador"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Quitar Admin</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAdminModal(user, "grant")}
                              className="text-purple-700 border-purple-300 hover:bg-purple-50 hover:text-purple-800 h-8 px-2 text-xs flex items-center gap-1 font-medium"
                              title="Hacer Administrador a este usuario"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Hacer Admin</span>
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Privilege Dialog (Grant / Revoke) */}
      <Dialog
        open={adminDialogOpen}
        onOpenChange={(open) => {
          if (!isUpdatingAdmin) {
            setAdminDialogOpen(open)
            if (!open) setUserForAdminDialog(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-3 rounded-full ${
                  adminAction === "grant"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {adminAction === "grant" ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <DialogTitle className="text-xl">
                {adminAction === "grant"
                  ? "Hacer Administrador"
                  : "Quitar rol de Administrador"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base space-y-2">
              {adminAction === "grant" ? (
                <>
                  <p>
                    ¿Estás seguro de que deseas otorgar permisos de{" "}
                    <span className="font-semibold text-purple-700">Administrador</span> a:
                  </p>
                  <div className="bg-muted rounded-lg p-3 mt-2">
                    <p className="font-bold text-foreground">{userForAdminDialog?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{userForAdminDialog?.email}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Este usuario tendrá acceso completo a todas las secciones del panel de
                    administración, incluyendo usuarios, pedidos, productos y configuraciones.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    ¿Estás seguro de que deseas quitar los permisos de{" "}
                    <span className="font-semibold text-amber-700">Administrador</span> a:
                  </p>
                  <div className="bg-muted rounded-lg p-3 mt-2">
                    <p className="font-bold text-foreground">{userForAdminDialog?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{userForAdminDialog?.email}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    El usuario pasará a ser un usuario estándar y ya no podrá ingresar al panel de
                    administración.
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setAdminDialogOpen(false)
                setUserForAdminDialog(null)
              }}
              disabled={isUpdatingAdmin}
            >
              Cancelar
            </Button>
            <Button
              variant={adminAction === "grant" ? "default" : "destructive"}
              className={adminAction === "grant" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
              onClick={handleConfirmAdminChange}
              disabled={isUpdatingAdmin}
            >
              {isUpdatingAdmin ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : adminAction === "grant" ? (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Sí, hacer Administrador
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Sí, quitar Administrador
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDeleteDialogOpen(open)
            if (!open) setDeleteConfirmText("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl text-destructive">Eliminar Usuario</DialogTitle>
            </div>
            <DialogDescription className="text-base space-y-2">
              <p>Estás a punto de eliminar permanentemente la cuenta de:</p>
              <div className="bg-muted rounded-lg p-3 mt-2">
                <p className="font-bold text-foreground">{userToDelete?.full_name}</p>
                <p className="text-sm text-muted-foreground">{userToDelete?.email}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Esta acción <span className="font-semibold text-destructive">no se puede deshacer</span>. Se eliminará el acceso, perfil y todos los datos asociados.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm font-medium text-foreground">
              Escribe <span className="font-bold text-destructive">ELIMINAR</span> para confirmar:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="border-destructive/30 focus-visible:ring-destructive"
              disabled={isDeleting}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmText("")
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteConfirmText.toUpperCase() !== "ELIMINAR" || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
