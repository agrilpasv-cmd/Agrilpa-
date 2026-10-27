# Dashboard del administrador

## Dirección

Lectura de diseño: panel operativo para administradores de Agrilpa, con el lenguaje del dashboard de usuarios. ENERGY 1 / RHYTHM 2 / MOTION 1. La referencia son `app/dashboard/components/user-dashboard.tsx`, su CSS y `docs/estilos-agrilpa.md`.

Las cuatro tarjetas de resumen conservan borde fino, fondo blanco, etiquetas legibles y números destacados. Separan el inventario actual de los flujos del período. La gráfica de evolución es el foco principal; los pendientes tienen enlaces directos a su gestión. Las distribuciones explican los registros existentes sin inventar objetivos, ingresos ni conversiones.

La fuente tipográfica y los colores se heredan del sitio. El verde representa la serie actual; la comparación usa un trazo neutro discontinuo. No hay nuevas ilustraciones, degradados, colores de marca, animaciones de entrada ni iconos decorativos en los KPI. Los iconos de calendario y actualización identifican controles existentes.

## Contrato de los datos

- Consultas exclusivas para administradores con sesión y rol comprobados en el servidor.
- Fechas en `America/El_Salvador`, períodos de 7, 30 y 90 días, comparación con las mismas horas del período anterior.
- Usuarios y publicaciones muestran explícitamente cuándo el dato es histórico o corresponde al estado actual. Las variaciones comparan altas reales entre períodos, nunca un inventario actual con uno histórico inexistente.
- Las altas de cotizaciones y solicitudes se agrupan por fecha de creación. La distribución de estados de cotizaciones incluye todas las existentes, según su estado actual, para mostrar la demanda pendiente aunque no se haya creado recientemente. Su título distingue esta vista del KPI de cotizaciones creadas en el período.
- Cero significa consulta correcta sin registros. Una fuente ausente o fallida produce `null` y un aviso, no cero ni una curva inventada.
- Sin montos de ventas: las fuentes actuales no aportan una moneda consistente para agregarlos.
- Las solicitudes del nuevo modo dependen de la tabla prevista en la migración de contactos existente. No se cambia el modo de contacto ni se escribe en la base al consultar el dashboard.
- Las consultas paginan sus registros para evitar el límite implícito de Supabase; no se publican resultados truncados como totales.

## Verificación ejecutada

- `node scripts/check-admin-dashboard.cjs`: PASS. Prueba medianoche de El Salvador, fin exclusivo, comparación parcial, exclusión de administradores, estados desconocidos, snapshots frente a altas, cero frente a `null`, fuentes fallidas, paginación de 2.500 registros y servidor limitado a 350 registros por página, deduplicación de tickets y controles 401/403/400. No utiliza red ni escribe datos.
- Playwright con Edge sobre el componente y el layout reales: PASS. Anchos 320, 390, 768, 1024, 1366 y 1600, sin desbordamiento del documento. Filtros 7/30/90, cuatro series, tabla diaria, actualización, persistencia de la serie al cambiar período, carga, vacío, error inicial, fallo de actualización y acceso revocado.
- Selectores con Enter y Escape, devolución del foco e indicador visible. Los seis enlaces de gestión se pulsaron y apuntan a rutas existentes de mensajes, cotizaciones, soporte y usuarios; la navegación sin sesión exige autenticación. Las API se interceptaron y los estados fallidos/vacíos usaron fixtures aislados. Los POST de tracking del layout también se interceptaron. Cero escrituras reales.
- Las capturas principales utilizan agregados reales leídos de Agrilpa, sin correos ni datos personales. No se enviaron notificaciones ni se cambió el modo de contacto.
- Contraste del contenido nuevo: texto secundario 6,00:1 en claro y 9,02:1 en oscuro; texto principal y acción superan 17:1. Gráficas sin animación, con etiquetas y datos numéricos alternativos.
- Cero excepciones de página y cero avisos de dimensiones de Recharts en las pruebas. Comprobación TypeScript de los archivos del cambio: cero errores. La comprobación global detecta 239 errores preexistentes fuera del cambio; no se presenta como compilación global aprobada.
- `/api/admin/overview` real en local devuelve 401 sin sesión. `git diff --check` no detecta errores de whitespace.

Evidencia local: `C:/Users/mrgua/.codex/visualizations/2026/09/30/01a0efd7-1281-7922-adc1-7f22de7c50dd/admin-dashboard/checks.json`, capturas y archivos `data-7.json`, `data-30.json`, `data-90.json`. La ruta temporal de revisión fue eliminada tras las pruebas.

## Delivery Gate anti-slop

Alcance: dashboard nuevo, agregación y consultas asociadas. No es una auditoría de todas las pantallas anteriores del sitio.

| Regla | Resultado y evidencia |
| --- | --- |
| R-01 | PASS: sin degradados ni resplandores; relleno plano tenue únicamente en la serie actual. |
| R-02 | PASS: textos breves en español, sin guiones largos. |
| R-03 | PASS: seis anchos comprobados; controles de 44 px y columnas que se reorganizan. |
| R-04 | PASS: calendario y actualización describen acciones concretas; Lucide es el sistema existente. Sin iconos decorativos en las métricas. |
| R-05 | PASS: resumen, evolución temporal, pendientes y distribuciones responden a preguntas distintas del administrador. |
| R-06 | PASS: tipografía heredada de Agrilpa; sin fuentes adicionales ni etiquetas con espaciado artificial. |
| R-07 | PASS: sin patrones decorativos. Las líneas de la gráfica permiten leer la escala. |
| R-08 | PASS: sin flechas decorativas en botones. |
| R-09 | PASS: sin cápsulas promocionales ni insignias de estado inventadas. |
| R-10 | PASS: sin superficies de cristal añadidas. Selectores compartidos del sitio. |
| R-11 | PASS: tarjetas de 12 px y controles de 8 px; sin redondear todos los elementos como píldoras. |
| R-12 | PASS: sin sombras grandes en tarjetas; elevación pequeña únicamente en tooltip. |
| R-13 | PASS: sin glow. |
| R-14 | PASS: las cuatro tarjetas comparables conservan el patrón solicitado por el usuario; los demás bloques tienen composición propia. |
| R-15 | PASS: acciones concretas, como Actualizar, Ver datos diarios y Gestionar cotizaciones. |
| R-16 | PASS: sin vocabulario promocional o afirmaciones grandilocuentes. |
| R-17 | PASS: fuentes de Supabase verificadas; pruebas de ceros, ausencias y paginación. Sin cifras de relleno. |
| R-18 | PASS: sin testimonios ni identidades ficticias. |
| R-19 | PASS: gráficas sin animación; no hay entradas, rebotes ni efectos de presentación. |
| R-20 | PASS: conserva el patrón del dashboard de usuarios, verde, tipografía y tareas comerciales de Agrilpa. |
| R-21 | PASS: respeta el tema existente sin imponer modo oscuro. |
| R-22 | PASS: sin ilustraciones nuevas. |
| R-23 | PASS: no se crearon activos visuales nuevos; las métricas solicitadas tienen fuentes reales. |
| R-24 | PASS: destinos de usuarios, mensajes, cotizaciones y soporte existentes. |
| R-25 | PASS: contraste del texto medido en navegador en ambos temas; valores y leyendas acompañan los gráficos. |
| R-26 | PASS: filtros consultan datos; serie cambia la gráfica; tabla se abre; actualizar consulta; enlaces llevan a gestión. |
| R-27 | PASS: carga, error, fuente no disponible, cero real y datos anteriores tras fallo de actualización comprobados. |
| R-28 | PASS: no se añadió FAQ. |
| R-29 | PASS: tokens neutros del sitio y un único verde, con matices derivados para distribuciones. |
| R-30 | PASS: continuidad con el producto existente, sin copiar una interfaz de otra marca. |
| R-31 | PASS: decisiones y propósito documentados en Dirección y Contrato de los datos. |
| R-32 | PASS: selectores por teclado, Escape, foco visible, enlaces nativos y tabla semántica de valores. |
| R-33 | PASS: cambios implementados con parches nativos de código fuente; Prettier se usó solo para formato. |
| R-34 | PASS: contenido nuevo y contrastes revisados en claro y oscuro. |
| R-35 | PASS: aplicación local ejecutada, pruebas de controles y enlaces, capturas revisadas y consola sin excepciones. |
| R-36 | PASS: sin ingresos inferidos, conversiones, retención o garantías inventadas. |
| R-37 | PASS: dirección declarada antes de implementar, basada en la referencia solicitada por el usuario. |
| R-38 | PASS: capturas principales con datos agregados reales; fixtures solo para pruebas aisladas de vacío y errores. |

| Criterio | Resultado y evidencia |
| --- | --- |
| Diales explícitos | PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 declarados antes de implementar. |
| Coherencia con los diales | PASS: jerarquía sobria, variación por función y gráficos estáticos. |
| Foco visual | PASS: números principales y evolución temporal, sin ilustraciones competidoras. |
| Espacio estructural | PASS: separación de filtros, resumen y áreas de gestión; móvil reorganiza columnas. |
| Acento deliberado | PASS: verde de Agrilpa en datos y trazos, neutros en controles y textos. |
| Identidad repetida | PASS: bordes, tipografía y tratamiento numérico del dashboard de usuarios. |
| Design Read previo | PASS: Dirección se escribió antes de la implementación de la interfaz. |
| C-1 | PASS: decisiones ligadas a tareas y componentes existentes, documentadas arriba. |
| C-2 | PASS: controles y enlaces con acciones verificadas. |
| C-3 | PASS: cada bloque explica usuarios, catálogo, demanda o trabajo pendiente. |
| C-4 | PASS: pruebas responsive, teclado, ambos temas y fallos de consulta. |
| C-5 | PASS: sin estadísticas ficticias; las fuentes ausentes permanecen sin valor. |
