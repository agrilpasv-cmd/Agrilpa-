"use client"

import {useEffect, useRef, useState} from "react"
import {Maximize2, X} from "lucide-react"
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle} from "@/components/ui/dialog"

const src = "/centro-control-agrilpa-v1.mp4"
const poster = "/centro-control-agrilpa-poster.jpg"
const description = "Recorrido de 30 segundos con datos ficticios: el dashboard muestra métricas y gráficas por período; se actualiza una publicación, se revisa una cotización y se acuerdan condiciones desde Mensajes B2B. Después se presenta el perfil empresarial y se buscan proveedores en el catálogo por categoría y país."

export function ControlCenterVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    video.muted = true
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let visible = false
    const update = () => {
      if (visible && !document.hidden && !expanded && !reduced.matches) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        update()
      },
      { threshold: 0.2 }
    )
    observer.observe(video)
    document.addEventListener("visibilitychange", update)
    reduced.addEventListener("change", update)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", update)
      reduced.removeEventListener("change", update)
    }
  }, [expanded])

  return (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <video
          ref={ref}
          loop
          muted
          playsInline
          preload="metadata"
          poster={poster}
          aria-label="Recorrido por el centro de control de Agrilpa"
          aria-describedby="control-center-video-description"
          className="block h-full w-full object-cover"
        >
          <source src={src} type="video/mp4" />
          Tu navegador no admite video.
        </video>
        <div className="absolute right-2.5 top-2.5 z-10">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Ampliar video del centro de control"
            className="grid size-7 place-items-center rounded-lg border border-border/80 bg-background/90 text-foreground/80 shadow-xs backdrop-blur-sm hover:text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
          >
            <Maximize2 size={13} />
          </button>
        </div>
        <p id="control-center-video-description" className="sr-only">
          {description}
        </p>
      </div>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100vw-32px)] max-w-3xl max-h-[calc(100dvh-32px)] overflow-y-auto rounded-2xl p-0 gap-0 sm:max-w-3xl"
        >
          <DialogTitle className="sr-only">Tu centro de control agrícola</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
          {expanded && (
            <video
              controls
              autoPlay
              muted
              playsInline
              loop
              preload="metadata"
              poster={poster}
              aria-label="Recorrido ampliado por Agrilpa"
              className="block aspect-[4/3] w-full bg-background object-contain"
            >
              <source src={src} type="video/mp4" />
            </video>
          )}
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Cerrar video ampliado"
              className="absolute right-2 top-2 grid size-8 sm:size-9 place-items-center rounded-lg sm:rounded-xl border border-border bg-background/95 text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={16} />
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}
