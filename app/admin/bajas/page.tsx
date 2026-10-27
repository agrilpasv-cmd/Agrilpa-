"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useToast } from "@/hooks/use-toast"
import {
    UserX,
    TrendingDown,
    FileText,
    Calendar,
    Trash2,
    RefreshCw,
    Search,
    Loader2,
    CheckCircle2
} from "lucide-react"

interface DeletionReport {
    id: string
    user_email: string
    reason: string
    custom_reason: string | null
    deleted_at: string
}

interface Stats {
    total: number
    last7: number
    last30: number
    topReason: string
}

function calculateStats(list: DeletionReport[]): Stats {
    const now = Date.now()
    const last7 = list.filter(r => now - new Date(r.deleted_at).getTime() < 7 * 86400000).length
    const last30 = list.filter(r => now - new Date(r.deleted_at).getTime() < 30 * 86400000).length

    const freq: Record<string, number> = {}
    list.forEach(r => { freq[r.reason] = (freq[r.reason] || 0) + 1 })
    const topReason = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"

    return { total: list.length, last7, last30, topReason }
}

export default function BajasPage() {
    const { toast } = useToast()
    const [reports, setReports] = useState<DeletionReport[]>([])
    const [stats, setStats] = useState<Stats>({ total: 0, last7: 0, last30: 0, topReason: "—" })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Search and filters
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedReasonFilter, setSelectedReasonFilter] = useState("all")

    // Selection for bulk delete
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Delete dialog states
    const [dialogOpen, setDialogOpen] = useState(false)
    const [reportToDelete, setReportToDelete] = useState<DeletionReport | null>(null)
    const [isBulkDelete, setIsBulkDelete] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchReports = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const res = await fetch("/api/admin/deletion-reports")
            if (!res.ok) throw new Error("Error al obtener reportes")
            const data = await res.json()
            const list: DeletionReport[] = data.reports || []
            setReports(list)
            setStats(calculateStats(list))
        } catch (err: any) {
            console.error("Error cargando reportes:", err)
            toast({
                title: "Error al cargar",
                description: err.message || "No se pudieron obtener los reportes de bajas",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [toast])

    useEffect(() => {
        fetchReports()
    }, [fetchReports])

    // Distinct reasons for filter pills
    const availableReasons = useMemo(() => {
        const set = new Set<string>()
        reports.forEach(r => {
            if (r.reason) set.add(r.reason)
        })
        return Array.from(set)
    }, [reports])

    // Filtered reports
    const filteredReports = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return reports.filter(r => {
            const matchesQuery =
                !query ||
                r.user_email.toLowerCase().includes(query) ||
                r.reason.toLowerCase().includes(query) ||
                (r.custom_reason && r.custom_reason.toLowerCase().includes(query))

            const matchesReason =
                selectedReasonFilter === "all" || r.reason === selectedReasonFilter

            return matchesQuery && matchesReason
        })
    }, [reports, searchQuery, selectedReasonFilter])

    // Toggle selection of single row
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    // Toggle select all filtered rows
    const handleToggleSelectAll = () => {
        const filteredIds = filteredReports.map(r => r.id)
        const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id))

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)))
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])))
        }
    }

    // Trigger single delete dialog
    const handleOpenSingleDelete = (report: DeletionReport) => {
        setReportToDelete(report)
        setIsBulkDelete(false)
        setDialogOpen(true)
    }

    // Trigger bulk delete dialog
    const handleOpenBulkDelete = () => {
        if (selectedIds.length === 0) return
        setReportToDelete(null)
        setIsBulkDelete(true)
        setDialogOpen(true)
    }

    // Confirm and execute delete in the database
    const handleConfirmDelete = async () => {
        const idsToDelete = isBulkDelete
            ? selectedIds
            : reportToDelete
            ? [reportToDelete.id]
            : []

        if (idsToDelete.length === 0) return

        setIsDeleting(true)
        try {
            const response = await fetch("/api/admin/deletion-reports", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: idsToDelete }),
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || "Error al eliminar de la base de datos")
            }

            // Remove from state immediately
            const updated = reports.filter(r => !idsToDelete.includes(r.id))
            setReports(updated)
            setStats(calculateStats(updated))
            setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)))

            toast({
                title: isBulkDelete ? "Reportes eliminados" : "Reporte eliminado",
                description: isBulkDelete
                    ? `${idsToDelete.length} registros eliminados correctamente de la base de datos.`
                    : "El reporte de baja ha sido eliminado correctamente de la base de datos.",
            })

            setDialogOpen(false)
        } catch (err: any) {
            console.error("Error eliminando reportes de baja:", err)
            toast({
                title: "Error al eliminar",
                description: err.message || "No se pudo eliminar el registro de la base de datos",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
            setReportToDelete(null)
            setIsBulkDelete(false)
        }
    }

    const statCards = [
        { label: "Total de bajas", value: stats.total, icon: UserX, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
        { label: "Últimos 7 días", value: stats.last7, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/40" },
        { label: "Últimos 30 días", value: stats.last30, icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
    ]

    const allFilteredSelected =
        filteredReports.length > 0 &&
        filteredReports.every(r => selectedIds.includes(r.id))

    return (
        <div className="space-y-6 p-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reportes de Bajas</h1>
                    <p className="text-muted-foreground">
                        Motivos por los que los usuarios eliminaron su cuenta. Puedes gestionar y eliminar estos registros de la base de datos.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchReports(true)}
                        disabled={refreshing || loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
                        <span>{refreshing ? "Actualizando..." : "Actualizar"}</span>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {statCards.map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={`${s.bg} p-3 rounded-lg`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{s.value}</p>
                                <p className="text-sm text-muted-foreground">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Top reason */}
            {stats.topReason !== "—" && (
                <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="p-4 flex items-start gap-3">
                        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Motivo más frecuente</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{stats.topReason}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search, Filter & Bulk Actions Bar */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Historial de eliminaciones</CardTitle>
                            <CardDescription>
                                Registros de todas las cuentas eliminadas con su motivo declarado ({reports.length} en total)
                            </CardDescription>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por correo o motivo..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                    </div>

                    {/* Filter Pills */}
                    {availableReasons.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-3">
                            <span className="text-xs text-muted-foreground font-medium">Filtrar motivo:</span>
                            <Button
                                variant={selectedReasonFilter === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedReasonFilter("all")}
                                className="h-7 text-xs px-2.5 rounded-full"
                            >
                                Todos ({reports.length})
                            </Button>
                            {availableReasons.map(reason => {
                                const count = reports.filter(r => r.reason === reason).length
                                return (
                                    <Button
                                        key={reason}
                                        variant={selectedReasonFilter === reason ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedReasonFilter(reason)}
                                        className="h-7 text-xs px-2.5 rounded-full"
                                    >
                                        {reason} ({count})
                                    </Button>
                                )
                            })}
                        </div>
                    )}

                    {/* Bulk Selection Banner */}
                    {selectedIds.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 mt-3 bg-muted/60 border rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                <span>
                                    {selectedIds.length} {selectedIds.length === 1 ? "reporte seleccionado" : "reportes seleccionados"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedIds([])}
                                    className="h-8 text-xs"
                                >
                                    Deseleccionar
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleOpenBulkDelete}
                                    className="h-8 text-xs gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Eliminar seleccionados ({selectedIds.length})</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-sm">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p>Cargando reportes de bajas...</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                            <UserX className="w-12 h-12 opacity-40" />
                            <p className="text-base font-medium">No hay bajas registradas en la base de datos</p>
                            <p className="text-xs">Los registros aparecerán aquí cuando los usuarios eliminen su cuenta.</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                            <Search className="w-10 h-10 opacity-40" />
                            <p className="text-sm font-medium">No se encontraron reportes con ese criterio de búsqueda</p>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => { setSearchQuery(""); setSelectedReasonFilter("all") }}
                                className="text-xs"
                            >
                                Limpiar filtros
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-3 px-3 w-10 text-center">
                                            <Checkbox
                                                checked={allFilteredSelected}
                                                onCheckedChange={handleToggleSelectAll}
                                                aria-label="Seleccionar todos los reportes visibles"
                                            />
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Correo</th>
                                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Motivo</th>
                                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Detalle</th>
                                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Fecha</th>
                                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map(r => {
                                        const isSelected = selectedIds.includes(r.id)
                                        return (
                                            <tr
                                                key={r.id}
                                                className={`border-b last:border-0 transition-colors ${
                                                    isSelected
                                                        ? "bg-primary/5 hover:bg-primary/10"
                                                        : "hover:bg-muted/30"
                                                }`}
                                            >
                                                <td className="py-3 px-3 text-center">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => handleToggleSelect(r.id)}
                                                        aria-label={`Seleccionar reporte de ${r.user_email}`}
                                                    />
                                                </td>
                                                <td className="py-3 px-4 font-medium break-all max-w-xs">{r.user_email}</td>
                                                <td className="py-3 px-4">
                                                    <Badge
                                                        variant="destructive"
                                                        className="font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300 border-none"
                                                    >
                                                        {r.reason}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground max-w-xs break-words">
                                                    {r.custom_reason || <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                                                    {new Date(r.deleted_at).toLocaleString("es-SV", {
                                                        dateStyle: "medium",
                                                        timeStyle: "short",
                                                    })}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenSingleDelete(r)}
                                                        title="Eliminar de la base de datos"
                                                        aria-label={`Eliminar reporte de ${r.user_email}`}
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-md"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Dialog de confirmación para eliminar de la BD ── */}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-destructive" />
                            {isBulkDelete
                                ? `¿Eliminar ${selectedIds.length} reportes de baja?`
                                : "¿Eliminar reporte de baja de la base de datos?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2 pt-1 text-sm text-muted-foreground">
                            {isBulkDelete ? (
                                <>
                                    Estás a punto de eliminar permanentemente los{" "}
                                    <span className="font-semibold text-foreground">
                                        {selectedIds.length} reportes seleccionados
                                    </span>{" "}
                                    de la base de datos.
                                </>
                            ) : (
                                <>
                                    Estás a punto de eliminar permanentemente el reporte de baja del usuario{" "}
                                    <span className="font-semibold text-foreground">
                                        {reportToDelete?.user_email}
                                    </span>
                                    {reportToDelete?.reason ? (
                                        <>
                                            {" "}
                                            (motivo: <em>{reportToDelete.reason}</em>)
                                        </>
                                    ) : null}
                                    .
                                </>
                            )}
                            <span className="block font-medium text-destructive mt-2">
                                Esta acción es irreversible y los registros no podrán ser recuperados.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={e => {
                                e.preventDefault()
                                handleConfirmDelete()
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-white hover:bg-destructive/90 gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Eliminando...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    <span>Eliminar definitivamente</span>
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
