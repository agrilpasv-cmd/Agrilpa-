"use client"

import { useState, useEffect, useCallback, useMemo, type KeyboardEvent } from "react"
import {
  RefreshCw,
  Loader2,
  Trash2,
  UserPlus,
  Search,
  X,
  Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProBadge } from "@/components/ui/pro-badge"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import s from "./membresias.module.css"

type PlanFilter = "todos" | "pro" | "gratis"

const DURATION_OPTIONS = [
  { label: "1 mes", value: 1 },
  { label: "3 meses", value: 3 },
  { label: "6 meses", value: 6 },
  { label: "1 año", value: 12 },
  { label: "Sin vencimiento", value: 0 },
]

const integer = (value: number) => new Intl.NumberFormat("es-SV").format(value)

const initials = (name: string) =>
  (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

export default function MembresiasPage() {
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [filter, setFilter] = useState<PlanFilter>("todos")
  const [tableQuery, setTableQuery] = useState("")
  const [isAddProOpen, setIsAddProOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedMonths, setSelectedMonths] = useState<number>(1)
  const [confirmStep, setConfirmStep] = useState(false)

  const { toast } = useToast()

  const fetchUsers = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true)
      setFetchError("")
      try {
        const response = await fetch("/api/admin/users", { cache: "no-store" })
        if (!response.ok) throw new Error("No pudimos consultar el padrón de membresías.")
        const data = await response.json()
        setAllUsers(
          Array.isArray(data) ? data.filter((u: any) => u.role !== "admin") : []
        )
        setLastUpdate(new Date())
      } catch (error: any) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los usuarios."
        setFetchError(message)
        toast({
          title: "Error al cargar",
          description: message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    void fetchUsers(true)
  }, [fetchUsers])

  const candidates = useMemo(() => {
    const q = normalize(searchQuery.trim())
    const pool = q
      ? allUsers.filter((u) =>
          [u.email, u.full_name, u.company_name].some(
            (val) => typeof val === "string" && normalize(val).includes(q)
          )
        )
      : allUsers.filter((u) => u.plan_type !== "pro")
    return pool.slice(0, 8)
  }, [searchQuery, allUsers])

  const proCount = useMemo(
    () => allUsers.filter((u) => u.plan_type === "pro").length,
    [allUsers]
  )
  const gratisCount = useMemo(
    () => allUsers.filter((u) => u.plan_type !== "pro").length,
    [allUsers]
  )
  const expiringSoonCount = useMemo(() => {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    return allUsers.filter((u) => {
      if (u.plan_type !== "pro" || !u.plan_expires_at) return false
      const exp = Date.parse(u.plan_expires_at)
      return Number.isFinite(exp) && exp > now && exp - now < sevenDays
    }).length
  }, [allUsers])

  const filteredUsers = useMemo(() => {
    const q = normalize(tableQuery.trim())
    return allUsers.filter((u) => {
      if (filter === "pro" && u.plan_type !== "pro") return false
      if (filter === "gratis" && u.plan_type === "pro") return false
      if (!q) return true
      return [u.full_name, u.email, u.company_name].some(
        (val) => typeof val === "string" && normalize(val).includes(q)
      )
    })
  }, [allUsers, filter, tableQuery])

  const callUpdatePlan = async (
    userId: string,
    planType: "pro" | "gratis",
    months?: number
  ) => {
    setIsUpdatingPlan(userId)
    try {
      const res = await fetch("/api/admin/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planType, months: months ?? 0 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error al actualizar el plan")
      toast({
        title: "Plan actualizado",
        description:
          planType === "pro"
            ? `Usuario asignado al plan Pro${
                months
                  ? ` por ${months} ${months === 1 ? "mes" : "meses"}`
                  : " sin fecha de vencimiento"
              }.`
            : "Usuario cambiado al plan Gratis.",
      })
      await fetchUsers(false)
      return true
    } catch (error: any) {
      toast({
        title: "No se pudo actualizar el plan",
        description: error.message,
        variant: "destructive",
      })
      return false
    } finally {
      setIsUpdatingPlan(null)
    }
  }

  const handleConfirmAssignPro = async () => {
    if (!selectedUser) return
    const ok = await callUpdatePlan(selectedUser.id, "pro", selectedMonths)
    if (ok) {
      closeAddProDialog()
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("No se pudo eliminar el usuario.")
      toast({
        title: "Usuario eliminado",
        description: "El registro fue eliminado correctamente.",
      })
      await fetchUsers(false)
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el usuario.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const closeAddProDialog = () => {
    setIsAddProOpen(false)
    setConfirmStep(false)
    setSelectedUser(null)
    setSearchQuery("")
    setSelectedMonths(1)
  }

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return "Sin vencimiento"
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Sin vencimiento"
    return d.toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatRegistration = (dateStr: string | null) => {
    if (!dateStr) return "Sin fecha"
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Sin fecha"
    return d.toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const order: PlanFilter[] = ["todos", "pro", "gratis"]
    const currentIndex = order.indexOf(filter)
    const next =
      event.key === "Home"
        ? order[0]
        : event.key === "End"
          ? order[order.length - 1]
          : event.key === "ArrowRight"
            ? order[(currentIndex + 1) % order.length]
            : order[(currentIndex - 1 + order.length) % order.length]
    setFilter(next)
    document.getElementById(`plan-tab-${next}`)?.focus()
  }

  return (
    <section className={s.page} aria-label="Gestión de membresías">
      <header className={s.header}>
        <div>
          <h1>Membresías</h1>
          <p>
            Administra las suscripciones activas, vigencias y asignaciones del
            plan Pro.
          </p>
        </div>
        <div className={s.headerActions}>
          {lastUpdate && (
            <span className={s.updated}>
              Actualizado a las{" "}
              {lastUpdate.toLocaleTimeString("es-SV", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
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
          <button
            type="button"
            className={s.primaryButton}
            onClick={() => {
              setConfirmStep(false)
              setSelectedUser(null)
              setIsAddProOpen(true)
            }}
          >
            <UserPlus size={16} aria-hidden="true" />
            Asignar plan Pro
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

      <dl className={s.metrics} aria-label="Resumen de planes">
        <button
          type="button"
          className={s.metric}
          aria-pressed={filter === "todos"}
          onClick={() => setFilter("todos")}
        >
          <dt>Usuarios registrados</dt>
          <dd>{integer(allUsers.length)}</dd>
          <span>Cuentas activas, sin administradores</span>
        </button>

        <button
          type="button"
          className={s.metric}
          aria-pressed={filter === "pro"}
          onClick={() => setFilter("pro")}
        >
          <dt>Con plan Pro</dt>
          <dd>{integer(proCount)}</dd>
          <span>
            {allUsers.length > 0
              ? `${Math.round((proCount / allUsers.length) * 100)}% del padrón actual`
              : "Sin suscripciones activas"}
          </span>
        </button>

        <button
          type="button"
          className={s.metric}
          aria-pressed={filter === "gratis"}
          onClick={() => setFilter("gratis")}
        >
          <dt>Con plan Gratis</dt>
          <dd>{integer(gratisCount)}</dd>
          <span>Suscripción estándar de acceso</span>
        </button>

        <div className={s.metric}>
          <dt>Por vencer en 7 días</dt>
          <dd>{integer(expiringSoonCount)}</dd>
          <span>Renovaciones próximas a revisar</span>
        </div>
      </dl>

      <div className={s.panel}>
        <div className={s.panelHead}>
          <div className={s.toolbar}>
            <div className={s.search}>
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={tableQuery}
                onChange={(e) => setTableQuery(e.target.value)}
                placeholder="Buscar por nombre, correo o empresa"
                aria-label="Buscar usuarios por nombre, correo o empresa"
                data-no-auto-caps="true"
              />
              {tableQuery && (
                <button
                  type="button"
                  className={s.clearSearch}
                  aria-label="Borrar búsqueda"
                  onClick={() => setTableQuery("")}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>
            <span className={s.resultCount}>
              {integer(filteredUsers.length)}{" "}
              {filteredUsers.length === 1 ? "usuario" : "usuarios"}
            </span>
          </div>

          <div
            className={s.tabs}
            role="tablist"
            aria-label="Filtrar por tipo de plan"
            onKeyDown={navigateTabs}
          >
            {(
              [
                { id: "todos", label: "Todos", count: allUsers.length },
                { id: "pro", label: "Plan Pro", count: proCount },
                { id: "gratis", label: "Plan Gratis", count: gratisCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`plan-tab-${tab.id}`}
                aria-selected={filter === tab.id}
                tabIndex={filter === tab.id ? 0 : -1}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
                <span>{integer(tab.count)}</span>
              </button>
            ))}
          </div>
        </div>

        {loading && allUsers.length === 0 ? (
          <div className={s.loading} role="status">
            <Loader2 size={22} className={s.spinner} aria-hidden="true" />
            <span>Cargando membresías de usuarios…</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={s.empty}>
            <h2>
              {tableQuery
                ? "No hay usuarios que coincidan con la búsqueda"
                : filter === "pro"
                  ? "Todavía no hay usuarios con el plan Pro"
                  : "No hay usuarios en esta categoría"}
            </h2>
            <p>
              {tableQuery
                ? "Prueba con otro nombre, correo electrónico o razón social."
                : filter === "pro"
                  ? "Puedes asignar una membresía Pro indicando la duración desde el botón superior."
                  : "Los usuarios registrados aparecerán en este listado."}
            </p>
            {tableQuery ? (
              <button
                type="button"
                className={s.secondaryButton}
                onClick={() => setTableQuery("")}
              >
                Limpiar búsqueda
              </button>
            ) : (
              filter === "pro" && (
                <button
                  type="button"
                  className={s.primaryButton}
                  onClick={() => setIsAddProOpen(true)}
                >
                  <UserPlus size={16} aria-hidden="true" />
                  Asignar plan Pro
                </button>
              )
            )}
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Empresa</th>
                  <th scope="col">Plan actual</th>
                  <th scope="col">Vigencia</th>
                  <th scope="col">Registro</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isPro = user.plan_type === "pro"
                  const isUpdating = isUpdatingPlan === user.id
                  const expiryDate = user.plan_expires_at
                    ? new Date(user.plan_expires_at)
                    : null
                  const isExpiringSoon =
                    expiryDate &&
                    expiryDate > new Date() &&
                    expiryDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                  const displayName = user.full_name || "Sin nombre indicado"

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className={s.userCell}>
                          <span className={s.avatar} aria-hidden="true">
                            {initials(user.full_name || user.email)}
                          </span>
                          <div className={s.userMeta}>
                            <strong>{displayName}</strong>
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Empresa">
                        {user.company_name || "Particular"}
                      </td>
                      <td data-label="Plan actual">
                        {isPro ? (
                          <ProBadge />
                        ) : (
                          <span className={s.freeBadge}>GRATIS</span>
                        )}
                      </td>
                      <td data-label="Vigencia">
                        {isPro ? (
                          <span className={s.expiry}>
                            <Calendar size={14} aria-hidden="true" />
                            {formatExpiry(user.plan_expires_at)}
                            {isExpiringSoon && (
                              <span className={s.soonTag}>Vence pronto</span>
                            )}
                          </span>
                        ) : (
                          <span className={s.expiry}>Sin vencimiento</span>
                        )}
                      </td>
                      <td data-label="Registro">
                        {formatRegistration(user.created_at)}
                      </td>
                      <td>
                        <div className={s.rowActions}>
                          {isPro ? (
                            <button
                              type="button"
                              className={s.rowButton}
                              disabled={isUpdating}
                              onClick={() =>
                                void callUpdatePlan(user.id, "gratis")
                              }
                            >
                              {isUpdating ? (
                                <Loader2
                                  size={14}
                                  className={s.spinner}
                                  aria-hidden="true"
                                />
                              ) : (
                                "Cambiar a Gratis"
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={`${s.rowButton} ${s.rowButtonPrimary}`}
                              disabled={isUpdating}
                              onClick={() => {
                                setSelectedUser(user)
                                setConfirmStep(true)
                                setIsAddProOpen(true)
                              }}
                            >
                              {isUpdating ? (
                                <Loader2
                                  size={14}
                                  className={s.spinner}
                                  aria-hidden="true"
                                />
                              ) : (
                                "Asignar Pro"
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            className={s.iconDelete}
                            aria-label={`Eliminar cuenta de ${displayName}`}
                            title="Eliminar usuario"
                            onClick={() => {
                              setUserToDelete(user)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
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

      <Dialog
        open={isAddProOpen}
        onOpenChange={(open) => {
          if (!open) closeAddProDialog()
        }}
      >
        <DialogContent className="max-w-lg">
          {!confirmStep ? (
            <>
              <DialogHeader>
                <DialogTitle>Asignar membresía Pro</DialogTitle>
                <DialogDescription>
                  Busca una cuenta por nombre, correo electrónico o empresa para
                  configurar su vigencia.
                </DialogDescription>
              </DialogHeader>

              <div className={s.dialogBody}>
                <div className={s.dialogSearch}>
                  <Search size={17} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Buscar por nombre, correo o empresa"
                    aria-label="Buscar usuario para asignar plan Pro"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-no-auto-caps="true"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className={s.clearSearch}
                      aria-label="Limpiar búsqueda"
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className={s.candidateList}>
                  {candidates.length === 0 ? (
                    <div className={s.empty}>
                      <p>
                        {searchQuery.trim()
                          ? "No se encontraron cuentas con ese criterio."
                          : "Todas las cuentas registradas ya cuentan con plan Pro."}
                      </p>
                    </div>
                  ) : (
                    candidates.map((user) => {
                      const isPro = user.plan_type === "pro"
                      return (
                        <div key={user.id} className={s.candidateRow}>
                          <div className={s.candidateInfo}>
                            <strong>
                              {user.full_name || "Sin nombre indicado"}
                            </strong>
                            <span>
                              {user.email}
                              {user.company_name
                                ? ` · ${user.company_name}`
                                : ""}
                            </span>
                          </div>
                          {isPro ? (
                            <ProBadge />
                          ) : (
                            <button
                              type="button"
                              className={`${s.rowButton} ${s.rowButtonPrimary}`}
                              onClick={() => {
                                setSelectedUser(user)
                                setConfirmStep(true)
                              }}
                            >
                              Seleccionar
                            </button>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Confirmar vigencia del plan Pro</DialogTitle>
                <DialogDescription>
                  Selecciona el período de suscripción para{" "}
                  <strong>
                    {selectedUser?.full_name || selectedUser?.email}
                  </strong>
                  .
                </DialogDescription>
              </DialogHeader>

              <div className={s.dialogBody}>
                <div className={s.selectedCard}>
                  <strong>
                    {selectedUser?.full_name || "Sin nombre indicado"}
                  </strong>
                  <span>{selectedUser?.email}</span>
                  {selectedUser?.company_name && (
                    <span>{selectedUser.company_name}</span>
                  )}
                </div>

                <div className={s.durationGroup}>
                  <label id="pro-duration-label">Duración de la membresía</label>
                  <div
                    className={s.durationGrid}
                    role="group"
                    aria-labelledby="pro-duration-label"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={s.durationOption}
                        aria-pressed={selectedMonths === opt.value}
                        onClick={() => setSelectedMonths(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {selectedMonths > 0 ? (
                    <p className={s.expiryNote}>
                      <Calendar size={15} aria-hidden="true" />
                      <span>
                        Vigencia estimada hasta el{" "}
                        <strong>
                          {new Date(
                            Date.now() +
                              selectedMonths * 30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString("es-SV", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    </p>
                  ) : (
                    <p className={s.expiryNote}>
                      <Calendar size={15} aria-hidden="true" />
                      <span>La membresía quedará activa sin fecha límite.</span>
                    </p>
                  )}
                </div>

                <div className={s.dialogFooter}>
                  <button
                    type="button"
                    className={s.secondaryButton}
                    onClick={() => {
                      setConfirmStep(false)
                      setSelectedUser(null)
                    }}
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    className={s.primaryButton}
                    onClick={() => void handleConfirmAssignPro()}
                    disabled={isUpdatingPlan === selectedUser?.id}
                  >
                    {isUpdatingPlan === selectedUser?.id ? (
                      <>
                        <Loader2
                          size={16}
                          className={s.spinner}
                          aria-hidden="true"
                        />
                        Guardando…
                      </>
                    ) : (
                      "Confirmar plan Pro"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cuenta de usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cuenta de{" "}
              <strong>
                {userToDelete?.full_name || userToDelete?.email}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteUser()
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 min-h-11"
            >
              {isDeleting ? "Eliminando…" : "Eliminar usuario"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
