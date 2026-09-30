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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let visible = false
    let manuallyPaused = false
    const updatePlayback = () => {
      if (visible && !document.hidden && !reducedMotion.matches && !manuallyPaused) {
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    }
    const onPause = () => {
      if (visible && !document.hidden && !reducedMotion.matches) manuallyPaused = true
    }
    const onPlay = () => { manuallyPaused = false }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      updatePlayback()
    }, { threshold: 0.35 })
    observer.observe(video)
    video.addEventListener("pause", onPause)
    video.addEventListener("play", onPlay)
    document.addEventListener("visibilitychange", updatePlayback)
    reducedMotion.addEventListener("change", updatePlayback)
    return () => {
      observer.disconnect()
      video.removeEventListener("pause", onPause)
      video.removeEventListener("play", onPlay)
      document.removeEventListener("visibilitychange", updatePlayback)
      reducedMotion.removeEventListener("change", updatePlayback)
    }
  }, [])

  return (
    <>
      <video
        ref={ref}
        controls
        loop
        muted
        playsInline
        preload="none"
        poster={poster}
        aria-label={label}
        aria-describedby={descriptionId}
        className="block w-full h-full object-cover border-0 outline-none bg-transparent"
      >
        <source src={src} type="video/mp4" />
        Tu navegador no admite video. <a href={src}>Ver demostración</a>
      </video>
      <p id={descriptionId} className="sr-only">
        {description}
      </p>
    </>
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
