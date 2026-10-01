# Plan del dashboard profesional de Agrilpa

Fecha: 30 de septiembre de 2026. Estado: propuesta de producto, UI y UX; pendiente de implementación. Alcance: dashboard de compradores y vendedores. El dashboard administrativo queda fuera de este rediseño.

## 1. Objetivo y regla de producto

El dashboard debe permitir entender cómo va el negocio y resolver la siguiente tarea: responder una conversación, gestionar una cotización, publicar un producto o avanzar un pedido.

**Regla acordada: la comunicación entre compradores y vendedores ocurre dentro de Agrilpa.** Aplica al dashboard y a los puntos de entrada desde el catálogo, las fichas de producto, las solicitudes, las cotizaciones y los pedidos. Los botones «Contactar», «Responder» y «Hablar con el vendedor» abrirán la conversación interna correspondiente. No se ofrecerán WhatsApp, enlaces `mailto:` ni contactos externos como alternativa para negociar.

La conversación conservará su contexto: producto, participantes y, cuando corresponda, cotización o pedido. Los contactos históricos se preservarán para compatibilidad y los datos privados necesarios para la cuenta o facturación conservarán su uso legítimo. Las notificaciones automáticas, si se mantienen, conducirán al usuario de vuelta a Agrilpa.

## 2. Vistas y navegación

- **Vender:** rendimiento de publicaciones, conversaciones recibidas, cotizaciones y pedidos de venta.
- **Comprar:** solicitudes enviadas, respuestas de proveedores y seguimiento de compras.
- **Cuenta con ambos roles:** selector «Vender / Comprar». Recordar la elección; no cambiar de vista automáticamente cuando llegue una notificación.
- **Cuenta nueva:** mostrar acciones para empezar a vender o comprar, sin gráficos vacíos ni porcentajes ficticios. La vista no dependerá únicamente de tener un producto publicado: también tendrá en cuenta el perfil y la actividad comercial.

Navegación propuesta:

| Común | Vender | Comprar |
|---|---|---|
| Resumen | Publicaciones | Solicitudes |
| Mensajes, con mensajes sin leer | Cotizaciones | Cotizaciones recibidas |
| Cuenta y ayuda | Ventas | Compras |

Reutilizar rutas y capacidades existentes. Organizar las demás funciones según su uso, sin eliminar funciones operativas para simplificar el menú.

## 3. Composición de la pantalla

1. Encabezado: «Resumen», nombre del negocio, selector de vista y acción principal. «Publicar producto» para vendedores; «Buscar productos» para compradores.
2. Selector de período: 7, 30 y 90 días. Fechas concretas y comparación con el período anterior de igual duración.
3. Cuatro indicadores principales con pequeños gráficos de tendencia y comparaciones reales. Añadir una segunda fila compacta de cuatro indicadores operativos.
4. Bloque gráfico: evolución temporal, distribución actual de pedidos y ranking de productos o proveedores. Añadir un módulo de respuesta del chat y el panel «Necesita tu atención».
5. Conversaciones recientes, con producto, interlocutor, último mensaje y acción «Responder».
6. Productos destacados por actividad para vendedores; compras y respuestas recientes para compradores.

La fecha filtra la analítica, **no oculta tareas pendientes antiguas**. La lista de atención se calcula al momento y muestra cuánto lleva esperando cada tarea.

Distribución de escritorio: navegación lateral de aproximadamente 240 px, contenido de hasta 1440 px, cuatro tarjetas de métricas y una fila central con gráfico y pendientes. En tableta las tarjetas pasan a dos columnas. En móvil la navegación se convierte en un menú, los bloques se apilan y los registros se presentan como filas o tarjetas legibles.

## 4. Métricas y definiciones

### Vendedores

Primera fila revisada: **visitas a productos, cotizaciones recibidas, pedidos completados e importe de pedidos completados**. Segunda fila: **publicaciones activas, conversaciones nuevas, pendientes de respuesta y mediana de primera respuesta**. El chat mantiene un bloque propio y acciones visibles; los importes se muestran por moneda y representan pedidos entregados, no pagos cobrados.

| Métrica | Definición | Disponibilidad y tratamiento |
|---|---|---|
| Visitas a productos | Visitas de terceros a fichas propias dentro del período | Existe un contador acumulado, pero hace falta registrar eventos con fecha para filtrar y comparar períodos |
| Conversaciones nuevas | Conversaciones comerciales cuyo primer mensaje se envió durante el período | Derivable del chat; una conversación creada sin mensajes no cuenta |
| Cotizaciones recibidas | Solicitudes de cotización creadas para el vendedor durante el período | Disponible con fechas y vendedor asociado |
| Pendientes de respuesta | Conversaciones comerciales cuyo último mensaje fue enviado por el interlocutor | Calcular como estado actual; no equivale a mensajes sin leer |
| Cotizaciones pendientes | Cotizaciones con estado pendiente que requieren respuesta | Disponible; mostrar por separado de las conversaciones |
| Tiempo de primera respuesta | Mediana del tiempo entre el primer mensaje entrante y la primera respuesta del vendedor | Derivable de mensajes; mostrar tamaño de muestra y casos aún sin respuesta por separado |
| Publicaciones activas | Total de publicaciones visibles y vigentes propias | Consultar todas, respetando visibilidad y eliminación; no usar el número de productos del ranking |
| Pedidos por etapa | Cantidad de pedidos pendientes, en preparación, en tránsito y entregados | Disponible después de unificar los estados históricos |
| Pedidos completados | Pedidos entregados dentro del período | Requiere fecha del hito de entrega; no sustituir por fecha de creación |
| Respuesta dentro de 24 horas | Conversaciones con primera respuesta dentro de 24 h / conversaciones de la cohorte que ya tienen 24 h de observación | Mostrar ventana y base; las conversaciones recientes sin suficiente observación quedan fuera |
| Productos con más interés | Ranking por visitas, conversaciones y cotizaciones del período | Separar cada medida; incluir categoría y enlace al producto |
| Importe de pedidos completados | Suma de importes de pedidos entregados, agrupados por moneda | No presentarlo como dinero cobrado sin evidencia de pago |

Las conversaciones de soporte y los mensajes del propio usuario se excluyen de las métricas comerciales. Los mensajes entrantes consecutivos forman una misma espera: no reiniciar el reloj con cada mensaje. La primera respuesta no es lo mismo que marcar un mensaje como leído.

### Compradores

Primera fila revisada: **solicitudes enviadas, solicitudes con respuesta, compras completadas e importe de compras completadas**. Segunda fila: **compras en curso, conversaciones nuevas, pendientes de respuesta y proveedores contactados dentro de Agrilpa**. Los mensajes que requieren respuesta seguirán presentes en el panel de atención.

| Métrica | Definición |
|---|---|
| Solicitudes enviadas | Cotizaciones solicitadas durante el período |
| Solicitudes con respuesta | Solicitudes del período que recibieron una decisión; distinguir aceptación y rechazo |
| Conversaciones pendientes de respuesta | Conversaciones cuyo último mensaje comercial pertenece al proveedor |
| Solicitudes sin respuesta | Solicitudes pendientes que aún requieren respuesta del proveedor, con antigüedad |
| Compras en curso | Pedidos actuales pendientes, en preparación o en tránsito |
| Compras completadas | Pedidos entregados dentro del período |
| Importe de compras completadas | Total de pedidos entregados, separado por moneda |
| Proveedores contactados | Participantes proveedores distintos en conversaciones comerciales con mensajes durante el período |

No llamar «oferta recibida» a una solicitud rechazada. Las tarjetas que muestran estado actual, como compras en curso, deben indicarlo y no aparentar estar filtradas por fecha de creación.

### Comparaciones y conversiones

- Variación: `(valor actual - valor anterior) / valor anterior × 100`, solo si el valor anterior es mayor que cero.
- Si el período anterior tiene cero, mostrar el cambio absoluto o «Sin base de comparación».
- Si falta cobertura histórica, mostrar «Datos desde [fecha]», sin inventar registros.
- Mostrar cero para un resultado realmente vacío y «Sin datos» para información que no se pudo obtener.
- Segunda etapa: conversión de cotización a pedido confirmado. Requiere vincular la cotización al pedido, definir un evento explícito de confirmación y seguir la misma cohorte durante una ventana acordada.
- No dividir todos los pedidos del mes entre todas las cotizaciones del mes y llamarlo conversión: pueden pertenecer a cohortes diferentes.
- No sumar importes de monedas diferentes. Una cotización aceptada no prueba que exista una venta completada o un pago.

## 5. Dirección visual

Estilo: interfaz de trabajo limpia, con información priorizada y el verde de Agrilpa como identidad. Las cifras, los estados y las acciones tendrán más protagonismo que los adornos.

| Elemento | Propuesta |
|---|---|
| Fondo | Fondo actual del dashboard `#f5f7f5` y tokens actuales del tema |
| Superficies | `--card`, `--border` y `--sidebar` existentes |
| Texto principal | `--foreground` existente; conservar los negros de la página |
| Texto secundario | `--muted-foreground` existente, verificando contraste |
| Acción principal | Botones negros actuales con texto blanco; verde existente para selección y énfasis contextual |
| Identidad | `--primary` actual `oklch(0.62 0.2 135.14)` y acento `#8BC646` ya usado en el proyecto |
| Gráficos | Verdes existentes `#2D6A4F`, `#40916C`, `#74C69D`, `#95D5B2`, `#B7E4C7`; sin añadir una paleta distinta |
| Tipografía | Geist Sans existente o equivalente del sistema; cifras tabulares |
| Espaciado | Escala de 4/8 px; separación clara entre título, métricas y contenido |
| Tarjetas | Radios moderados, sin formas decorativas grandes ni rotaciones al pasar el cursor |
| Iconos | Lucide consistente, siempre acompañado de una etiqueta en acciones importantes |

Revisión solicitada: usar los colores que ya existen en Agrilpa, sin introducir el verde oscuro ni los neutros nuevos de la primera propuesta. Reutilizar o referenciar los tokens del sitio, conservando las variantes del tema oscuro. El valor CSS de `--primary` y el acento hexadecimal no son necesariamente equivalentes: conservar ambos donde corresponda. Verificar contrastes sobre el fondo real; no cambiar la paleta global para resolver el dashboard. El color no será la única señal de un estado.

El gráfico principal tendrá selector de visitas, conversaciones o cotizaciones para vendedores y de solicitudes, conversaciones o compras completadas para compradores. Comparará el período actual con el anterior mediante línea continua y discontinua. Incluir ejes, período, unidades y consulta de valores.

Otros gráficos útiles:

- **Distribución de pedidos:** anillo con total y leyenda de pendientes, preparación, tránsito y entregados. Es una fotografía del estado actual, no un embudo de conversión ni una gráfica filtrada por fecha.
- **Rendimiento:** barras horizontales con los productos más visitados; para compradores, proveedores por solicitudes del período. Cantidades y enlaces visibles.
- **Respuesta del chat:** proporción de conversaciones respondidas y sin respuesta, mediana de primera respuesta para vendedores y respuesta dentro de 24 h cuando exista una cohorte válida. No confundir estas medidas con lectura de mensajes.
- **Tendencias pequeñas:** gráficos en tarjetas solo para métricas temporales con registros suficientes; los estados actuales no tendrán tendencias inventadas.

Todos los gráficos deben tener alternativa textual/tabular y reordenarse en móvil. Eliminar el indicador de «Optimizado» y las variaciones decorativas sin base real.

## 6. Flujos de UX

### Responder desde el dashboard

«Necesita tu atención» → «Responder» → conversación exacta dentro de Agrilpa → mensaje enviado → actualización del estado pendiente.

Abrir la conversación existente del mismo contexto en lugar de crear duplicados. Mantener borradores y permitir volver al resumen conservando la vista y el período. El acceso directo al chat debe funcionar tanto desde el dashboard como desde un producto, una cotización o un pedido.

### Gestionar cotizaciones y pedidos

Mostrar claramente la siguiente acción y su resultado. Una aceptación debe crear o reutilizar un único pedido: evitar duplicados al reintentar. Un pedido pasa por estados coherentes, con fecha de cada hito. Los mensajes relativos al acuerdo permanecen accesibles desde la operación.

### Estados de la interfaz

- Carga: esqueletos con tamaño estable; evitar saltos del contenido.
- Error: mensaje concreto y «Reintentar»; no dejar un spinner indefinido.
- Primera visita: explicar el siguiente paso y ofrecer una acción principal.
- Sin pendientes: estado tranquilo, con el texto «Estás al día».
- Sin actividad en un período: permitir cambiar fechas y mantener visibles las tareas operativas.
- Envío de mensaje: estado de envío, confirmación y recuperación ante error sin perder el texto.
- Móvil: acciones táctiles de al menos 44 px, texto legible y detalles sin depender del hover.
- Accesibilidad: navegación por teclado, foco visible, retorno de foco al cerrar paneles, etiquetas accesibles y alternativa tabular de los gráficos.
- Movimiento: transiciones breves y discretas; respetar la preferencia de movimiento reducido.

## 7. Datos e instrumentación

1. Crear un contrato único de métricas y agregaciones autenticadas, filtradas por el usuario de la sesión y su rol.
2. Separar totales globales, rankings limitados, series temporales y pendientes actuales. Cada dato debe declarar período, cobertura y unidad.
3. Usar eventos fechados de visita para los gráficos. Propuesta inicial de deduplicación: una visita por producto y sesión dentro de 30 minutos; excluir visitas del propietario y tráfico automatizado conocido. No atribuir fechas nuevas a contadores históricos.
4. Derivar conversaciones, última respuesta y primera respuesta desde mensajes reales. Mantener las notificaciones de lectura independientes de los pendientes de negocio.
5. Normalizar estados de cotizaciones y pedidos; registrar hitos y vínculo cotización/pedido. Definir confirmación antes de publicar una métrica de pedidos confirmados.
6. Incorporar moneda cuando falte y conservar la precisión monetaria. Si no se puede determinar la moneda, no mezclar ese importe en un total monetario presentado como fiable.
7. Obtener series completas del período; no reconstruirlas desde una lista truncada de actividad reciente.
8. Agregar consultas y compartir actualización del chat cuando sea posible; evitar una consulta por conversación o por producto.
9. Aplicar permisos por participante en lectura y escritura del chat. La identidad proviene de la sesión, no de un identificador enviado por el cliente.
10. Conservar historial y datos actuales mediante migraciones compatibles; no borrar contactos antiguos ni operaciones existentes.

## 8. Puntos de intervención identificados

| Área | Archivos principales | Trabajo |
|---|---|---|
| Dashboard de usuarios | `app/dashboard/components/user-dashboard.tsx` | Nueva composición, selector de rol, estados y métricas correctas |
| Agregaciones | `app/api/dashboard/dynamic-data/route.ts` | Contrato de métricas, totales completos, filtros y series reales |
| API anterior | `app/api/dashboard/stats/route.ts` | Revisar consumidores y unificar definiciones para evitar cifras contradictorias |
| Chat compartido | `components/chat/chat-context.tsx`, `chat-dashboard.tsx`, `chat-widget.tsx` | Accesos directos, actualización de pendientes y continuidad de conversación |
| API de chat | `app/api/chat/conversations/route.ts`, `send-message/route.ts` | Agregación eficiente y permisos basados en sesión |
| Catálogo y detalle | `app/productos/page.tsx`, `app/producto/[slug]/page.tsx`, `components/product-hero.tsx` | Todas las acciones comerciales abren el chat interno |
| Solicitudes y cotizaciones | Pantallas de cotizaciones y `app/dashboard/mis-solicitudes/page.tsx` | Retirar preferencias/atajos externos del nuevo flujo comercial |
| Aceptación de cotización | `app/api/quotations/update-status/route.ts` | Vinculación e idempotencia al generar pedido |
| Pedidos | `app/api/user/orders/[id]/route.ts` y consultas de compras/ventas | Estados, hitos y seguimiento consistente |
| Diseño | Componentes del dashboard y estilos acotados | Reutilizar shadcn, Recharts, Lucide y tipografía existente |

Corregir también enlaces de acciones pendientes que actualmente pueden conducir a rutas diferentes de las pantallas reales de compras o ventas. Confirmar las rutas durante la implementación.

## 9. Plan de ejecución

| Fase | Entregable | Criterio para avanzar |
|---|---|---|
| 1. Base de producto y datos | Diccionario de métricas, mapa de roles y auditoría de entradas al chat | Cada indicador tiene fuente, definición, período y tratamiento de datos faltantes |
| 2. UI y UX | Prototipo de vendedor, comprador, móvil y estados vacíos/error | Se entiende qué ocurre y qué acción sigue; identidad visual consistente |
| 3. Datos y comunicación | Agregaciones autenticadas, eventos de visita y entradas internas al chat | Cifras contrastadas y ningún atajo externo en los flujos comerciales intervenidos |
| 4. Dashboard conectado | Componentes responsive y estados completos con datos reales | Selector de roles, filtros y accesos directos funcionan sin datos decorativos |
| 5. Verificación y entrega | Pruebas de permisos, métricas, flujos y revisión visual | Se cumplen los criterios de aceptación siguientes |

La primera entrega incluye el resumen de ambos roles, mensajes, pendientes, cotizaciones, publicaciones y etapas de pedidos. Las visitas por período se habilitan con su cobertura real desde el inicio de instrumentación. La conversión por cohortes y los importes confirmados se incorporan después de validar los hitos y los datos necesarios.

## 10. Criterios de aceptación

- Un vendedor, un comprador y una cuenta mixta ven información correspondiente a su actividad y pueden ejecutar su siguiente tarea.
- La comunicación comprador/vendedor se mantiene dentro de Agrilpa desde catálogo, productos, dashboard, cotizaciones y pedidos.
- «Responder» abre el interlocutor y contexto correctos; enviar un mensaje actualiza los pendientes sin duplicar la conversación.
- «Sin leer» y «Pendiente de respuesta» muestran conceptos distintos y correctos.
- Los indicadores coinciden con consultas de referencia; los rankings limitados no se usan como totales.
- Los períodos y sus comparaciones respetan fechas, zona horaria y cobertura; no existen porcentajes fijos o históricos inventados.
- Aceptar dos veces una cotización no duplica un pedido.
- Ningún usuario accede a conversaciones, pedidos o métricas privadas ajenas.
- Estados vacíos, fallos de red, carga y reintentos permiten continuar.
- Revisar a 360, 768, 1024 y 1440 px, con teclado, foco visible y movimiento reducido.
- Las cifras de pagos o ingresos no se publican sin evidencia suficiente; las monedas no se mezclan.
- El dashboard administrativo y las funciones públicas ajenas al cambio mantienen su funcionamiento.

## Referencia visual

La referencia visual presentada junto a este plan utiliza datos ilustrativos para evaluar distribución, jerarquía y navegación. No representa estadísticas reales ni supone que el dashboard de producción ya haya cambiado.
