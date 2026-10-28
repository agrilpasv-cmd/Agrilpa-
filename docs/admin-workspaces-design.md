# Secciones de administración

Lectura de diseño: espacios de trabajo para administrar Agrilpa, con continuidad respecto a Mensajes y Dashboard. ENERGY 1 / RHYTHM 2 / MOTION 1. Referencias: `docs/estilos-agrilpa.md`, dashboard administrativo y conversaciones ya aprobadas.

El usuario pide retirar el sombreado verde. La propuesta conserva la tipografía y usa superficies blancas, selección gris neutra, bordes finos y sombra negra de muy baja opacidad. El verde queda en acciones y estados pertinentes, sin fondos verdes extensos. La selección de las tarjetas de Membresías adopta también el gris neutro de esta propuesta.

Alcance: reportes de bajas, newsletter, contáctanos, registro de actividad, publicaciones, cotizaciones y hero. Se conservan los destinos, endpoints y tareas existentes. Las métricas se calculan únicamente con registros cargados y se etiquetan según su alcance; no se incorporan ingresos, tasas ni actividad simulada.

Cada sección comparte cabecera, controles y tablas legibles, pero organiza su contenido según la tarea. Newsletter separa composición y revisión; Hero muestra el banner y su enlace; los listados priorizan búsqueda, filtros y acciones. Se mantienen las confirmaciones existentes para eliminación y envío. Las pruebas usan respuestas interceptadas, sin eliminar registros, subir archivos reales ni mandar correos.

## Verificación

Playwright con Edge y movimiento reducido: PASS en 40 combinaciones de sección, ancho y tema. Se revisaron las siete páginas y el ajuste de Membresías a 1600, 768, 390 y 320 px. No hay desbordamiento horizontal del documento. Las tablas mantienen su propio desplazamiento horizontal cuando necesitan más ancho.

- Bajas: búsqueda, motivos, selección de filas visibles, cancelación y confirmación de eliminación.
- Contáctanos: detalle completo con foco y Escape, marcado de lectura, filtros y acciones masivas.
- Actividad: vista por usuario, volver al conjunto, tipo de evento y búsqueda. Los visitantes cuentan eventos, no personas únicas; el máximo de 500 registros procede de la API existente.
- Publicaciones: búsqueda, categoría, enlaces de crear/editar/ver y confirmación de eliminación.
- Cotizaciones: estados, detalle, fecha de entrega sin desplazarse al día anterior, selección y eliminación. Las aceptadas se reconocen como `accepted`; no se presentan como respondidas sin esa información.
- Hero: intervalo mínimo, guardado, enlace, fallo de guardado sin mostrar éxito, subida interceptada y eliminación confirmada. Se conserva el API existente para rotación y banners.
- Newsletter: todos/seleccionados/correo específico, validación, búsqueda de destinatarios, selección, saludo, texto escapado, HTML en iframe aislado, vista previa y confirmación. El editor conserva exactamente las mayúsculas y el HTML escritos; se desactivó el formato automático solo en esos campos.
- Estados vacíos, errores de carga y reintentos mediante Actualizar. Una fuente fallida deja los KPI como No disponible; las cifras provienen de registros cargados, sin estadísticas nuevas de ejemplo.

Contraste medido: el texto secundario del contenido nuevo supera 6:1 en claro y oscuro. Se comprobó que la tipografía hereda la familia del sitio. La selección de Membresías tiene fondo neutro. Los botones y áreas de selección de las tablas tienen 44 px de interacción; los checkbox mantienen una marca visual pequeña centrada en ese espacio.

Las capturas usan datos explícitamente identificados como pruebas. Todas las llamadas de modificación se interceptan, incluidas las de tracking. Cero correos reales, cero eliminaciones reales y cero cargas reales a almacenamiento. La prueba no sustituye una auditoría del backend existente.

Evidencia: `C:/Users/mrgua/.codex/visualizations/2026/09/30/01a0efd7-1281-7922-adc1-7f22de7c50dd/admin-sections/checks.json` y capturas de cada página en escritorio, móvil y oscuro. La ruta temporal de revisión fue eliminada tras las pruebas; no forma parte de las pantallas publicadas.

Comprobaciones adicionales: detalle y confirmación en modo oscuro; enlaces a crear, editar y ver producto abiertos con Ctrl+clic. Se verificó que las rutas existen y que las privadas exigen sesión cuando no hay una cuenta autenticada en las pruebas. TypeScript: cero errores en los archivos del rediseño. La comprobación global mantiene diagnósticos ajenos a estas páginas; no se declara una compilación global aprobada. `git diff --check` no detecta errores de whitespace.

## Delivery Gate

Alcance: las páginas rediseñadas, sus controles compartidos y el resaltado neutro de Membresías.

| Regla | Resultado y evidencia |
| --- | --- |
| R-01 | PASS: sin degradados; sombra negra mínima en paneles. |
| R-02 | PASS: copia en español, sin guiones largos. |
| R-03 | PASS: anchos 320/390/768/1600, controles y selección táctil de 44 px. |
| R-04 | PASS: iconos existentes para buscar, guardar, actualizar y eliminar. |
| R-05 | PASS: listas, composición de correo y galería según cada tarea. |
| R-06 | PASS: tipografía heredada; el iframe reproduce contenido de correo. |
| R-07 | PASS: sin patrones decorativos ni fondos de rejilla. |
| R-08 | PASS: sin flechas decorativas en los controles. |
| R-09 | PASS: etiquetas describen estados reales, sin cápsulas promocionales. |
| R-10 | PASS: no se añadieron superficies de cristal. |
| R-11 | PASS: paneles de 12 px y controles de 8 px, sin convertir todo en píldoras. |
| R-12 | PASS: sombra de panel de opacidad mínima; separación por borde. |
| R-13 | PASS: sin resplandores ni sombras verdes. |
| R-14 | PASS: KPI comparables uniformes; galería y editor tienen composición específica. |
| R-15 | PASS: acciones nombran su tarea: Guardar enlace, Ver detalle, Revisar y enviar. |
| R-16 | PASS: sin promesas promocionales o lenguaje de IA. |
| R-17 | PASS: recuentos derivados de respuestas de las API y alcance indicado. |
| R-18 | PASS: sin testimonios ni personas ficticias en el código de producto. |
| R-19 | PASS: sin animaciones de entrada nuevas; movimiento reducido respetado. |
| R-20 | PASS: conserva marca, tipografía, componentes y tareas de Agrilpa. |
| R-21 | PASS: respeta ambos temas existentes; no fuerza oscuro. |
| R-22 | PASS: no se crearon ilustraciones ni imágenes decorativas. |
| R-23 | PASS: se reutilizan imágenes de publicaciones y banners proporcionados por usuarios. |
| R-24 | PASS: destinos existentes de producto, creación y edición. |
| R-25 | PASS: texto secundario medido por encima de 6:1; controles con foco visible. |
| R-26 | PASS: búsqueda, filtros, detalles, guardado y confirmaciones conectados a las API existentes. |
| R-27 | PASS: carga, vacío, error, datos ausentes y fallo al guardar probados. |
| R-28 | PASS: no se añadió FAQ. |
| R-29 | PASS: neutros del sitio, marca conservada y rojo semántico para eliminación/error. |
| R-30 | PASS: continuidad con el dashboard y mensajes aprobados, no con otra marca. |
| R-31 | PASS: dirección y decisiones documentadas al inicio. |
| R-32 | PASS: etiquetas, encabezados, tablas semánticas, Enter, Escape y foco. |
| R-33 | PASS: código y CSS escritos mediante parches nativos; Prettier solo formatea. |
| R-34 | PASS: páginas en claro/oscuro y controles compartidos con variables del tema. |
| R-35 | PASS: aplicación ejecutada, capturas revisadas y controles probados con API interceptadas. |
| R-36 | PASS: no se inventan conversiones, ingresos ni actividad en tiempo real. |
| R-37 | PASS: dirección previa basada en la referencia y preferencia del usuario. |
| R-38 | PASS: fixtures solo en las pruebas temporales; ninguna cifra simulada en las páginas. |
| Diales | PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 declarados antes de implementar. |
| Jerarquía | PASS: títulos y tarea principal visibles, con espacio entre filtros y datos. |
| Identidad | PASS: marca Agrilpa, mismos controles, neutros y tratamiento numérico del panel. |
| C-1 | PASS: composición y color elegidos por su función. |
| C-2 | PASS: controles con comportamiento comprobado. |
| C-3 | PASS: cada bloque corresponde a una tarea o datos existentes. |
| C-4 | PASS: móvil, temas, errores y teclado comprobados. |
| C-5 | PASS: datos reales en producto; pruebas claramente identificadas. |
