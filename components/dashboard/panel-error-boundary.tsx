"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

const RELOAD_KEY = "agrilpa_panel_error_reloaded"

function isRecoverableNavError(error: Error & { digest?: string }): boolean {
  const msg = `${error?.name || ""} ${error?.message || ""}`.toLowerCase()
  return (
    msg.includes("chunkloaderror") ||
    msg.includes("loading chunk") ||
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("removechild") ||
    msg.includes("insertbefore")
  )
}

export function PanelErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [reloading, setReloading] = useState(false)

  useEffect(() => {
    console.error("[PanelErrorBoundary]", error)
    if (isRecoverableNavError(error)) {
      try {
        const key = `${RELOAD_KEY}:${window.location.pathname}`
        const last = Number(sessionStorage.getItem(key) || "0")
        if (Date.now() - last > 15000) {
          sessionStorage.setItem(key, String(Date.now()))
          setReloading(true)
          window.location.reload()
          return
        }
      } catch {
        // sessionStorage unavailable
      }
    }
  }, [error])

  if (reloading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Actualizando sección…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          No se pudo cargar esta sección
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocurrió un problema temporal al cambiar de vista. Puedes reintentar o recargar la página.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={() => reset()}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Reintentar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Recargar página
          </Button>
        </div>
      </div>
    </div>
  )
}
