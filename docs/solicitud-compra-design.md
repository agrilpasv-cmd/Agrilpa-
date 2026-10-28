# Solicitud de compra por pasos

Design Read: formulario de abastecimiento agrícola para compradores de Agrilpa, inspirado en Nueva publicación. ENERGY 2 / RHYTHM 2 / MOTION 1. Apple Design y anti-slop during, preferencia global existente.

Cuatro pasos separan producto, entrega, condiciones y revisión. El indicador expresa avance real, permite editar pasos visitados y valida antes de avanzar. La vista previa muestra el contenido que se está escribiendo, con textos explícitos para datos por completar. No hay fotografías supuestas, cifras ni garantías inventadas. Se conservan campos, sesión, límites de plan, FormData y endpoint existente. El servidor seguirá autenticando cada envío.

El verde procede de primary; botones de acción con texto blanco por petición del usuario, de 19 px y peso 700 para cumplir contraste de texto grande. Superficies y sombras neutrales. Fuente heredada. Controles compartidos y países/prefijos con búsqueda y banderas. Foco explícito al cambiar de paso y validación junto a campos. Sin animaciones ornamentales ni nuevas imágenes.

## Evidencia

- PASS: cuarenta casos visuales, cuatro pasos por cinco anchos (1440, 1024, 768, 390, 320 px) y dos temas, sin scroll horizontal.
- PASS: escritura actualiza vista previa; anterior, navegación entre pasos visitados y editar desde revisión conservan valores.
- PASS: validación junto a los campos para producto, cantidad, fecha, destino, correo y WhatsApp. Las mismas reglas se ejecutan en servidor antes de insertar.
- PASS: CountryPicker y PhoneCodePicker con búsqueda, selección, Escape y foco. Prefijo abierto en móvil oscuro dentro del viewport.
- PASS: límite de plan mostrado desde la respuesta real de la cuenta; error al comprobar la cuenta y reintento; visitante sin sesión puede preparar y revisar pero no publicar.
- PASS: envío simulado verifica FormData y datos canónicos, error recuperable conserva datos, éxito solo tras respuesta positiva. Cero publicaciones y correos reales.
- PASS: botones verdes blancos en Pedidos y el wizard, también hover y oscuro; contraste medido 3.4056:1 con texto de 19 px y peso 700, suficiente para texto grande.
- PASS: TypeScript sin diagnósticos en los tres archivos TS de esta tarea. No se afirma build global.
- PASS: script `node scripts/check-purchase-request-form.cjs`: autenticación, cantidades, fechas imposibles y pasadas, unidades inválidas, correo completo, teléfono, rechazo antes de insertar y respuesta de fallo. Sin red o base real.

El recorrido visual usa `check-purchase-wizard.cjs` y deja `purchase-wizard/checks.json` y capturas en el directorio de visualizaciones de esta tarea. La sesión es ficticia y las llamadas del navegador están interceptadas. Las capturas usan textos marcados de prueba.

## Delivery Gate

Corrección posterior del usuario: restaurar el diseño exterior aprobado y limitar el ajuste al formulario. Vuelven el ancho de 1220 px, encabezado de 36 px con descripción, pasos con sus subtítulos, avisos encima del formulario y vista previa completa de 340 px con icono y nota. Solo dentro del formulario de escritorio se mantienen campos en dos columnas, áreas de texto más compactas y revisión en tres columnas. En móvil continúa el flujo original. Los textos extensos de revisión conservan title y Editar; los datos enviados no cambian.

- Restauración visual PASS: capturas de los cuatro pasos con encabezado, subtítulos e icono de vista previa originales, manteniendo el ajuste solo dentro del formulario. La comprobación anterior de altura global de una pantalla queda sustituida por esta corrección del usuario; no se afirma que la página completa quepa en 768 px con el encabezado original.
- Resiliencia PASS: cuarenta combinaciones de fase/tamaño/tema, interacción y envío simulado repetidos sin errores, sin escrituras reales. Se mantiene el Delivery Gate de abajo para el resto del flujo.

- R-01 PASS: se conserva primary, superficies de tema y blanco en las acciones por indicación explícita.
- R-02 PASS: textos nuevos sin rayas largas.
- R-03 PASS: cuarenta casos sin overflow horizontal.
- R-04 PASS: iconos existentes de paquete, destino, fecha, retorno y pasos completados, con función concreta.
- R-05 PASS: estructura de producto, entrega, condiciones y revisión, inspirada en Nueva publicación.
- R-06 PASS: fuente del sitio heredada y tamaños diferenciados por jerarquía.
- R-07 PASS: fondos lisos del tema, sin patrones ornamentales.
- R-08 PASS: flecha solo en volver a pedidos, con destino real.
- R-09 PASS: sin insignias de confianza inventadas.
- R-10 PASS: no se añade glass.
- R-11 PASS: radios de controles y paneles consistentes.
- R-12 PASS: sin sombras de elevación añadidas.
- R-13 PASS: sin glows.
- R-14 PASS: paneles agrupan formulario y vista previa, con función diferente.
- R-15 PASS: continuar, anterior, editar y publicar describen su acción.
- R-16 PASS: copy concreto de compras, sin promesas comerciales.
- R-17 PASS: número de pasos y datos del pedido proceden del estado; sin métricas inventadas.
- R-18 PASS: sin testimonios ni usuarios ficticios en el producto.
- R-19 PASS: MOTION 1; cambio inmediato de fase y foco, sin entradas decorativas.
- R-20 PASS: una fase activa reduce campos simultáneos; revisión antes de guardar.
- R-21 PASS: estado preservado entre fases y reintentos, sin cambios de datos ocultos al publicar.
- R-22 PASS: sin ilustraciones nuevas.
- R-23 PASS: vista previa sin fotos supuestas y con textos de datos por definir.
- R-24 PASS: rutas existentes para pedidos, mis solicitudes e inicio de sesión.
- R-25 PASS: blanco sobre verde medido para texto grande; texto secundario usa mezcla de foreground 70-75%; foco explícito.
- R-26 PASS: validación, navegación, edición, reintento y envío ejercitados en navegador.
- R-27 PASS: cuenta cargando, visitante, límite, error y éxito diferenciados.
- R-28 PASS: sin FAQ de relleno.
- R-29 PASS: componentes y colores compartidos de Agrilpa.
- R-30 PASS: layout adaptable, campos de 48 px y tamaños de lectura de 15-16 px.
- R-31 PASS: decisiones justificadas arriba.
- R-32 PASS: etiquetas, errores enlazados, foco al avanzar y Escape en selectores comprobados.
- R-33 PASS: fuente editada con apply_patch nativo, sin scripts de reescritura.
- R-34 PASS: claro y oscuro en cada fase y ancho.
- R-35 PASS: Next local y Edge ejecutados; cero errores de página.
- R-36 PASS: eliminadas afirmaciones previas no acreditadas de calidad garantizada y proveedores notificados.
- R-37 PASS: dirección del sitio, referencia de Nueva publicación y diales declarados.
- R-38 PASS: contenido de usuario y placeholders explícitos, fixtures solo en prueba.
- C-1 PASS: decisiones de jerarquía y color documentadas.
- C-2 PASS: controles y contrato de publicación verificados con simulación.
- C-3 PASS: formulario para preparar y revisar un pedido, sin secciones decorativas.
- C-4 PASS: estados, tamaños, temas, teclado y reintentos cubiertos.
- C-5 PASS: sin estadísticas o garantías inventadas; éxito condicionado a respuesta real del endpoint.
