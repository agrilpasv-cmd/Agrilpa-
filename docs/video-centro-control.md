# Video: Tu centro de control agrícola

Integrado en la página de inicio mediante `components/control-center-video.tsx` y `components/about.tsx`.

- Archivo: `public/centro-control-agrilpa-v1.mp4`.
- Portada: `public/centro-control-agrilpa-poster.jpg`.
- Duración: 30 segundos; 1920 × 1440; 30 fps; H.264/yuv420p; 5.9 MB.
- Composición editable: `my-video/src/CodeControlCenter.tsx`, `AgrilpaControlCenter`.
- Animación determinista con React/Remotion. Las imágenes son fotos de productos y logos del repositorio; la interfaz no usa capturas de pantalla.
- Navegador con apariencia de macOS, fondo blanco y sin franjas negras ni zooms. Tipografía y colores proceden del sitio.

El recorrido empieza en el dashboard con contadores y gráficas animados, pasa por publicaciones y edición de inventario, muestra una nueva cotización y sus detalles, negocia desde Mensajes B2B y termina con el perfil empresarial y los filtros del catálogo de proveedores.

Los datos son de demostración y se identifican en el video. Las métricas se calculan con `buildOverview`, la misma función del dashboard, para mantener coherencia entre totales, comparaciones y gráficas. No se crean cuentas, publicaciones, pedidos ni mensajes reales.

El dashboard, el menú, el formulario de edición, el detalle de cotizaciones y el perfil empresarial reutilizan copias de la presentación actual. Las listas reutilizan los componentes y estilos de comercio de la aplicación. `my-video/scripts/sync-control-center.cjs` actualiza las copias de presentación y los tokens desde sus fuentes, sin incluir consultas ni mutaciones de cuentas.

Desde `my-video`, para actualizar y exportar:

```powershell
node scripts/sync-control-center.cjs
npx remotion render AgrilpaControlCenter ../public/centro-control-agrilpa-v1.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=4
```

Cada escena también tiene una composición independiente en la carpeta «Centro-de-control» de Remotion Studio.

El reproductor reserva la relación 4:3, permite pausar y ampliar, detiene la reproducción fuera de pantalla o al ocultar la pestaña y respeta la preferencia de movimiento reducido. La reproducción ampliada usa controles nativos.

Verificación: fotogramas revisados de las seis escenas; metadatos comprobados con ffprobe; reproducción, pausa y ampliación verificadas en navegador; sin desbordamiento horizontal a 390 px; compilación de Next.js completada. La configuración existente de Next.js omite la validación de tipos durante el build.
