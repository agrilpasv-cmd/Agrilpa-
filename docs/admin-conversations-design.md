# Conversaciones del administrador

Dirección acordada: conservar colores, tipografía y controles de Agrilpa; simplificar la vista de chats de la captura del usuario. ENERGY 1 / RHYTHM 2 / MOTION 1.

El foco es la conversación. La lista identifica producto y participantes, con búsqueda y filtros. El encabezado presenta el producto sin otra tarjeta anidada; los datos de comprador y vendedor se consultan mediante un detalle desplegable. Se reducen etiquetas decorativas y códigos repetidos, manteniendo sus acciones de copia donde ayudan a identificar el registro.

Se reutilizan los datos recibidos de las API existentes. No se añaden métricas, actividad, estados en línea, testimonios, fotografías ni identidades inventadas. Los filtros y contadores corresponden a las conversaciones cargadas. Los mensajes conservan su contenido, adjuntos, fechas y estado de lectura.

El verde identifica selección y mensajes del vendedor. La vista sigue siendo de consulta: no incorpora un formulario para enviar mensajes como un usuario. En pantallas estrechas, la lista y el detalle se muestran por separado con un botón para volver.

El encabezado compacto agrupa foto y nombre en un solo enlace al producto, sin botón Ver producto. La fila completa de participantes abre y cierra sus datos. Revisar, copiar el código, actualizar y acceder a soporte se agrupan en el menú de tres puntos. La actualización rápida se sitúa junto al buscador, y el estado de revisión pasa al pie del chat. El listado es ligeramente más estrecho para dar más espacio al hilo, conservando la tipografía y los colores aprobados.

## Verificación

Se ejecutó el componente real en el servidor local con API interceptada y registros identificados como datos de prueba. No se escribieron datos reales ni se enviaron mensajes o correos. La ruta temporal de revisión se retira al terminar.

Comprobaciones aprobadas: búsqueda sin distinguir tildes, filtros, resultados vacíos, chat vacío, errores al cargar y al guardar revisión, copia de códigos, datos desplegables, apertura de imágenes, descarga de PDF, destino del enlace de producto y vuelta a la lista. El estado marcado como pendiente se conserva tras actualizar. La aplicación solo cambia el estado visible cuando el servidor confirma el guardado.

La revisión visual cubrió anchos de 320, 390, 768, 1024 y 1600 px, modo claro y oscuro, activación de la conversación con teclado y contraste de textos secundarios y mensajes verdes. Las mediciones fueron iguales o superiores a 4.5:1. No se detectaron desbordamientos horizontales ni errores de página en esos escenarios. TypeScript se comprueba en los archivos afectados, sin certificar todo el repositorio.

El ajuste compacto pasó un nuevo recorrido: clic en la foto y en el nombre, apertura y cierre del menú con teclado, copia y revisión desde el menú, consulta de participantes y navegación móvil. En los registros de prueba, el hilo ocupa el 79% de la altura del panel a 1600 px y el 74% a 390 px; a 320 px ocupa el 68%. Se comprobaron también los límites del menú en las pantallas estrechas. Estas cifras describen el montaje local de prueba, no una métrica de uso de la plataforma.

## Delivery Gate

| Regla | Resultado y evidencia |
| --- | --- |
| R-01 | PASS: sin gradientes ni brillos; el verde marca selección y vendedor. |
| R-02 | PASS: textos nuevos sin rayas largas; los mensajes originales se conservan. |
| R-03 | PASS: sin desbordamiento a 320, 390, 768, 1024 y 1600 px. |
| R-04 | PASS: iconos compartidos de buscar, copiar, revisar, adjuntar y navegar, ligados a acciones reales. |
| R-05 | PASS: lista, contexto y conversación responden al contenido; se retiró la fila de tarjetas de métricas. |
| R-06 | PASS: fuente heredada de Agrilpa, mensajes a 15 px y metadatos de al menos 12 px. |
| R-07 | PASS: sin patrones de fondo decorativos. |
| R-08 | PASS: flechas limitadas a volver y abrir el producto en otra pestaña. |
| R-09 | PASS: estados expresados con texto e icono; sin cápsulas decorativas ni etiquetas de colores por rol. |
| R-10 | PASS: sin capas de cristal o desenfoque añadido. |
| R-11 | PASS: radios distintos para panel, controles, producto, avatar de iniciales y mensajes. |
| R-12 | PASS: sin sombras grandes ni tarjetas flotantes anidadas. |
| R-13 | PASS: sin resplandores. |
| R-14 | PASS: no hay cuadrícula de tarjetas genéricas; los detalles corresponden a comprador y vendedor. |
| R-15 | PASS: acciones concretas en el menú y el detalle; foto y nombre enlazan directamente al producto. |
| R-16 | PASS: texto operativo sin reclamos comerciales ni jerga promocional. |
| R-17 | PASS: contadores proceden de las conversaciones y mensajes recibidos de la API. |
| R-18 | PASS: no hay testimonios. |
| R-19 | PASS: únicamente indicador de carga; respeta movimiento reducido. |
| R-20 | PASS: la composición se organiza alrededor del producto y de sus dos participantes. |
| R-21 | PASS: respeta las variables de tema de la plataforma, sin forzar modo oscuro. |
| R-22 | PASS: sin ilustraciones genéricas añadidas. |
| R-23 | PASS: imágenes existentes del producto o adjunto; iniciales calculadas del nombre, sin fotografías inventadas. |
| R-24 | PASS: enlaces a rutas existentes de producto y soporte; producto ausente no genera enlace. |
| R-25 | PASS: contraste medido de textos secundarios y mensajes del vendedor en claro y oscuro, al menos 4.5:1. |
| R-26 | PASS: controles comprobados, incluidos menú, copiar, revisar, foto y nombre del producto, adjuntos y volver. |
| R-27 | PASS: carga, vacío, búsqueda sin resultados y errores visibles comprobados. |
| R-28 | PASS: no hay FAQ ni contenido ajeno a la conversación. |
| R-29 | PASS: neutros y verde de Agrilpa; retirados acentos azul, rojo, púrpura y esmeralda de la vista anterior. |
| R-30 | PASS: se reutilizan los controles del proyecto, sin adoptar otra identidad de producto. |
| R-31 | PASS: la jerarquía y el detalle desplegable tienen su propósito documentado arriba. |
| R-32 | PASS: botones nativos, foco visible y apertura con Enter; lightbox cierra con Escape. |
| R-33 | PASS: implementación mediante edición de fuente y CSS; formato con la herramienta habitual. |
| R-34 | PASS: vista clara y oscura revisadas en el navegador. |
| R-35 | PASS: recorrido registrado de controles en el servidor local; `checks.json` guarda el resultado de la prueba. |
| R-36 | PASS: sin promesas nuevas de seguridad, disponibilidad o rendimiento. |
| R-37 | PASS: dirección y niveles ENERGY/RHYTHM/MOTION declarados antes de implementar. |
| R-38 | PASS: datos de ejemplo solo en la prueba interceptada; producción usa la API existente. |
| C-1 | PASS: tamaño, agrupación y color apoyan lectura y revisión del chat. |
| C-2 | PASS: navegación, filtros, copia, revisión y adjuntos funcionan en el recorrido probado. |
| C-3 | PASS: se muestra producto, participantes y mensajes existentes; sin secciones de relleno. |
| C-4 | PASS: estados y tamaños documentados arriba, con adaptación por anchura disponible del componente. |
| C-5 | PASS: sin estadísticas, identidades ni actividad inventadas. |
