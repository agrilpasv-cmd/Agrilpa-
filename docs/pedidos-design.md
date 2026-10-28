# Pedidos de compra

Design Read: catálogo de solicitudes agrícolas para proveedores, con la identidad existente de Agrilpa. ENERGY 2 / RHYTHM 2 / MOTION 1. Anti-slop during, preferencia global; Apple Design aplicado a jerarquía, respuesta inmediata y controles previsibles.

## Decisiones

- Encabezado compacto alineado a la izquierda: acerca los pedidos al primer pantallazo.
- Filas comparables: producto y destino primero, cantidad y acción a la derecha; permiten revisar solicitudes sin abrir cada una.
- Tipografía heredada del sitio: conserva la identidad y evita otra familia.
- Verde primary para publicar; superficies neutrales y separadores para mantener el foco en los productos.
- Fotografías solo si la solicitud incluye una; icono de paquete para ausencia o error, sin imágenes inventadas.
- ProBadge compartida solo cuando la API acredita un plan Pro. Se elimina la supuesta verificación de comprador, que no existe en este contrato de datos.
- Filtros y ordenación sobre la respuesta real. CountryPicker compartido con búsqueda y banderas. Destacados conserva la prioridad Pro del servidor.
- Sin progreso de vencimiento basado en 90 días arbitrarios, ni métricas decorativas.
- Espaciado distinto entre encabezado, filtros y filas; móvil reordena cantidad y acción y permite desplegar filtros.
- Search y metadatos usan iconos existentes de Agrilpa para búsqueda, ubicación y entrega; no se agregan activos gráficos.
- Sin sombras verdes, glass, fondos decorativos ni animaciones de entrada. Foco visible y controles de 44 px.

## Alcance

Se conserva `/api/pedidos`, `/pedidos/[id]` y `/solicitud-compra`. Sin cambios de esquema ni envíos reales durante QA.

## Verificación

- PASS: Edge real a 1440, 1024, 768, 390 y 320 px, claro y oscuro: diez casos sin desbordamiento horizontal.
- PASS: búsqueda sin tildes, borrar búsqueda, categoría, país con búsqueda, quitar filtros y limpiar resultados vacíos.
- PASS: tres ordenaciones, despliegue móvil, selección por teclado, Escape y retorno del foco.
- PASS: carga, vacío, error HTTP 503 y recuperación mediante reintento.
- PASS: clics en publicar, crear solicitud, foto, título y detalle con destinos interceptados en pestañas aisladas; las rutas existen en el repositorio. No se ejecutó el contador real de vistas del detalle.
- PASS: cero errores de página y cero escrituras reales. Datos de prueba identificados y limitados al contexto de Playwright.
- PASS: texto secundario medido 7.57:1 en claro y 9.03:1 en oscuro. Tras la corrección solicitada por el usuario, botones verdes con texto blanco de 19 px y peso 700, medidos a 3.41:1 para texto grande. Familia tipográfica coincide con body.
- PASS: TypeScript, cero diagnósticos en los dos archivos TS modificados. No se afirma compilación global del repositorio.
- PASS: GET real `/api/pedidos` HTTP 200, contrato requests válido y cero pedidos activos al verificar.

Evidencia: `check-pedidos-ui.cjs` y `pedidos-design/checks.json`, capturas de escritorio, móvil, oscuro, dropdown abierto y estados en el directorio de visualizaciones de esta tarea.

## Delivery Gate

- R-01 PASS: verde primary de Agrilpa con texto blanco por preferencia explícita del usuario, también en hover y oscuro.
- R-02 PASS: textos nuevos sin rayas largas.
- R-03 PASS: diez tamaños y temas sin overflow, incluyendo nombres y cantidades extensos.
- R-04 PASS: iconos existentes corresponden a búsqueda, filtros, destino, fecha y producto sin foto.
- R-05 PASS: encabezado, filtros y lista responden a comparar solicitudes, sin bloques decorativos.
- R-06 PASS: fuente heredada y jerarquía por producto, cantidad y metadatos.
- R-07 PASS: fondo liso del tema.
- R-08 PASS: botones nuevos sin flechas ornamentales.
- R-09 PASS: solo insignia Pro acreditada por API, reutilizando ProBadge.
- R-10 PASS: no se añade glass.
- R-11 PASS: radios contenidos de controles y fotografías.
- R-12 PASS: sin sombras de elevación añadidas.
- R-13 PASS: sin glow.
- R-14 PASS: filas de solicitudes comparables; no hay tarjetas de prestaciones.
- R-15 PASS: acciones específicas: publicar, filtrar, ver pedido y reintentar.
- R-16 PASS: texto explica compras y destino sin promesas comerciales.
- R-17 PASS: contador derivado de la lista real; sin estadísticas inventadas.
- R-18 PASS: sin testimonios ni personas ficticias en el producto.
- R-19 PASS: MOTION 1; sin entradas, pulsos o loops añadidos; reduced-motion local.
- R-20 PASS: prioridad visual en producto y cantidad solicitada.
- R-21 PASS: orden estable del servidor en destacados y ordenación explícita para fechas.
- R-22 PASS: sin ilustraciones inventadas.
- R-23 PASS: fotos de las solicitudes; ausencia y errores usan un icono explícito.
- R-24 PASS: rutas de publicar y detalle existentes, enlaces comprobados con destinos aislados.
- R-25 PASS: contraste medido en los dos temas y foco explícito.
- R-26 PASS: controles de búsqueda, filtro, orden, limpieza, reintento y navegación comprobados.
- R-27 PASS: estados de carga, vacío inicial, búsqueda vacía y error diferenciados.
- R-28 PASS: no hay FAQ de relleno.
- R-29 PASS: paleta de docs/estilos-agrilpa.md, sin esmeralda o ámbar nuevos.
- R-30 PASS: espaciado, tamaños y alineación consistentes; ver capturas.
- R-31 PASS: razones de diseño documentadas arriba.
- R-32 PASS: labels, foco, teclado y Escape verificados.
- R-33 PASS: fuente y CSS editados mediante apply_patch nativo; sin scripts de reescritura.
- R-34 PASS: ambos temas comprobados en cinco anchos.
- R-35 PASS: página ejecutada en Next local y recorrido Playwright grabado en checks.json.
- R-36 PASS: retirada la verificación de comprador no acreditada por el contrato.
- R-37 PASS: dirección existente de Agrilpa y diales declarados.
- R-38 PASS: solicitudes reales en producto; fixtures identificadas solo en pruebas.
- C-1 PASS: decisiones escritas por función y jerarquía.
- C-2 PASS: recorrido de controles completo y rutas conservadas.
- C-3 PASS: composición centrada en abastecer pedidos.
- C-4 PASS: estados, teclado, temas y tamaños probados.
- C-5 PASS: endpoint real comprobado; sin envíos ni métricas fabricadas.
