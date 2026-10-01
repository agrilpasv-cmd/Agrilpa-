"use client"

import { useEffect, useRef } from "react"

export function ProcessVideo({ src, poster, label, descriptionId, description }: {
  src: string
  poster: string
  label: string
  descriptionId: string
  description: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    // Requerido por iOS Safari y Android Chrome para permitir autoplay sin interacción
    video.muted = true
    video.defaultMuted = true

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let visible = false

    const playVideo = () => {
      if (video && !reducedMotion.matches) {
        const promise = video.play()
        if (promise !== undefined) {
          promise.catch(() => {
            // Autoplay bloqueado temporalmente por política de navegador
          })
        }
      }
    }

    const updatePlayback = () => {
      if (visible && !document.hidden && !reducedMotion.matches) {
        playVideo()
      } else if (video) {
        video.pause()
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      updatePlayback()
    }, { threshold: 0.2 })

    observer.observe(video)

    // Intento de reproducción inmediata en montaje
    playVideo()

    document.addEventListener("visibilitychange", updatePlayback)
    reducedMotion.addEventListener("change", updatePlayback)

    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", updatePlayback)
      reducedMotion.removeEventListener("change", updatePlayback)
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
      <video
        ref={ref}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        poster={poster}
        aria-label={label}
        aria-describedby={descriptionId}
        onContextMenu={(e) => e.preventDefault()}
        className="block w-full h-full object-cover border-0 outline-none bg-transparent pointer-events-none"
      >
        <source src={src} type="video/mp4" />
        Tu navegador no admite video.
      </video>
      <p id={descriptionId} className="sr-only">
        {description}
      </p>
    </div>
  )
}

export function RegistrationVideo() {
  return <ProcessVideo
    src="/registro-agrilpa-codigo-v3.mp4"
    poster="/registro-code-poster.jpg"
    label="Demostración del registro de vendedor en Agrilpa desde una interfaz Mac"
    descriptionId="registration-video-description"
    description="Demostración con datos ficticios: Carlos Mendoza escribe su nombre, correo y contraseña, selecciona Vendedor Agrícola, registra Finca El Roble en El Salvador y añade café, cacao y aguacate. Al crear la cuenta, Agrilpa pide verificar su correo electrónico."
  />
}

export function ProductPublishingVideo() {
  return <ProcessVideo
    src="/productos-agrilpa-codigo-v1.mp4"
    poster="/productos-code-poster.jpg"
    label="Demostración de cómo publicar productos en Agrilpa desde un navegador Mac"
    descriptionId="product-publishing-video-description"
    description="Demostración de 20 segundos con datos ficticios: se añaden tres fotos de café, título, categoría y origen. Se completa el embalaje, el precio y la cantidad disponible; se seleccionan mercados, se escribe una descripción y se añade una certificación. El recorrido termina con la confirmación de publicación."
  />
}

export function CatalogSearchVideo() {
  return <ProcessVideo
    src="/busqueda-agrilpa-codigo-v1.mp4"
    poster="/busqueda-code-poster.jpg"
    label="Demostración de cómo buscar productos en el catálogo real de Agrilpa"
    descriptionId="catalog-search-video-description"
    description="Recorrido de 20 segundos por el catálogo de Agrilpa: se busca café, se selecciona la categoría Café y se filtra por El Salvador y la palabra Geisha en la descripción. Se abre Café de especialidad Oro-Verde, se revisan sus fotos, descripción y certificaciones."
  />
}
