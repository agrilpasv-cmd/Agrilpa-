# Dashboard y navegación implementados

Se reemplazó el dashboard de usuarios por el diseño aprobado: fondo blanco, verde Agrilpa, vistas de vendedor/comprador, cuatro indicadores principales, cuatro indicadores secundarios, comparación por períodos, estado de pedidos, ranking, conversaciones y acciones pendientes. Los accesos a comunicación del nuevo dashboard llevan al chat interno.

El componente compartido `components/dashboard/panel-sidebar.tsx` aplica el mismo diseño al menú de usuarios, al menú administrativo dentro de `/dashboard` y al menú de `/admin`. Conserva las 12 opciones de usuario, 19 opciones del administrador dentro de `/dashboard` y 21 opciones de `/admin`, con sus enlaces y contadores. Mi Perfil/Configuración y Soporte, cuando ya existían, se colocan al pie. El resumen administrativo mantiene su contenido.

## Datos y definiciones

- El dashboard consulta `/api/dashboard/overview?days=7|30|90`. La sesión se verifica con `auth.getUser()` y las consultas filtran por el usuario autenticado. No acepta un identificador de usuario proporcionado por el cliente.
- Los totales se calculan sobre todos los registros paginados. El ranking de cinco elementos nunca se utiliza para obtener totales.
- Los períodos incluyen el día actual en horario de El Salvador y comparan el mismo tiempo transcurrido en el período anterior.
- Las visitas son acumuladas. No hay serie diaria porque la base actual solo tiene un contador por producto.
- Los pedidos completados son pedidos creados en el período que actualmente tienen estado entregado. No se interpreta `updated_at` como fecha de entrega.
- Los importes corresponden a esos pedidos entregados y se separan por moneda. No se presentan como pagos cobrados ni ingresos confirmados. Los pedidos sin importe/moneda se señalan como incompletos; el campo histórico `price_usd` identifica explícitamente USD.
- La tabla histórica `purchases` no tiene `seller_id` ni `status` en el esquema verificado. Se consultan sus compras por `user_id`; no se inventa un vendedor ni un estado. Sus registros sin estado aparecen en «Sin estado / otros».
- Conversación nueva significa primer mensaje comercial en el período. Se excluyen conversaciones vacías, soporte sin producto e interlocutores administradores.
- Pendiente de respuesta significa que el último mensaje es del interlocutor. Haberlo leído no cuenta como responder.
- La mediana de primera respuesta empieza en el primer mensaje recibido; varios mensajes consecutivos no reinician el reloj. La tasa de respuesta en 24 horas usa únicamente conversaciones con al menos 24 horas de seguimiento.
- Proveedores contactados cuenta proveedores distintos a quienes el comprador envió mensajes durante el período.
- «Responder» enlaza al identificador de conversación y la bandeja selecciona únicamente conversaciones en las que participa el usuario.

## Verificación

- Ocho pruebas de agregación: límites de períodos, totales completos, campos faltantes/ceros, pedidos/monedas, compras históricas, exclusión de conversaciones, mediana/tasa de respuesta y separación de roles.
- Comparación de los menús con los originales: se conservaron todas las etiquetas y rutas.
- Revisión visual de escritorio y móvil a 390 px: filtros, cambio de rol, menú con búsqueda, estados vacíos, tabla accesible de la gráfica, cierre con Escape y restauración de foco. Sin desbordamiento horizontal del contenido.
- Comprobación del esquema de Supabase sin recuperar registros personales y validación del filtro alternativo de compras con límite de cero filas.
- La API devuelve HTTP 401 sin sesión.
- La compilación de producción (`npm run build -- --webpack`) pasó, con la configuración existente que omite la validación de tipos. La ruta temporal de revisión no forma parte de la compilación.
- La comprobación global de TypeScript mantiene errores previos en módulos ajenos al cambio (incluidos ejemplos de Remotion, páginas administrativas y el cliente Supabase). Ningún diagnóstico corresponde a los archivos nuevos o modificados de este dashboard.

La revisión visual empleó datos aislados de prueba; su ruta temporal se retiró. No se crearon cuentas, mensajes, cotizaciones ni pedidos para las pruebas. La revisión con una sesión real en el navegador queda pendiente de iniciar sesión localmente.

## Alcance posterior

La instrumentación diaria de visitas, hitos de entrega/cobro, conversión por cohortes y migración completa de los flujos comerciales antiguos a chat interno siguen en el plan general. Esta entrega implementa el dashboard y la navegación solicitados, sin alterar otras secciones ni modificar el esquema de la base de datos.

## Ajustes de presentación · 30 de septiembre de 2026

- Se retiró la navegación superior de los paneles de usuario y administrador. En móvil, el menú conserva un botón de apertura independiente, cierre con Escape y restauración de foco.
- La búsqueda ya no muestra una insignia de atajo de teclado. El menú lateral mide 280–288 px en escritorio, sus opciones usan letra de 16 px e iconos de 22 px.
- El dashboard ocupa el ancho completo del contenido, sin límite máximo ni márgenes de centrado. Conserva un espaciado interior de 24 px en escritorio y 16 px en móvil. Se ampliaron títulos, métricas, tarjetas, gráficas y controles.
- Los selectores de período, métrica y moneda usan el mismo componente Radix/Select y estilo del selector de categorías de la creación de productos.
- Revisión visual con datos aislados a 2533, 1280, 768, 390 y 360 px: ancho completo, ausencia de desbordamientos, cambio de período/métrica/moneda/rol, estado vacío, menú de administración y búsqueda del menú móvil. Sin advertencias ni errores de consola. Se retiró la ruta temporal y se conservaron las 12/19/21 etiquetas y rutas originales.

## Consulta histórica, informes y perfil

- La API autenticada admite `endDate=AAAA-MM-DD`, valida fechas reales y rechaza fechas futuras. La navegación anterior/siguiente recorre bloques de 7/30/90 días; el calendario permite elegir la fecha final. Los períodos pasados incluyen el día completo y se comparan con el bloque anterior completo. Hoy conserva la comparación hasta la misma hora.
- Los eventos se reconstruyen desde cotizaciones, pedidos y mensajes persistidos. No se crean copias ficticias de estados históricos: estado de pedidos/publicaciones, pendientes y visitas acumuladas son actuales y se indican así. Los pedidos completados siguen definidos por fecha de creación y estado de entrega actual. Las cohortes históricas del chat incluyen respuestas posteriores al período seleccionado.
- Se recuerdan duración y fecha final por cuenta en este navegador, sin guardar métricas privadas en almacenamiento local. Esta preferencia no se sincroniza entre dispositivos. Volver a hoy restaura la consulta actual.
- «Descargar informe» genera CSV con los indicadores y series de ambos períodos, fecha de consulta y monedas separadas. Neutraliza fórmulas en textos proporcionados por usuarios y se deshabilita si la consulta falló o sigue cargando. El archivo conserva los resultados al momento de descargarlo; no se creó un almacén de informes históricos en el servidor.
- El encabezado usa `users.avatar_url` y muestra iniciales si falta la foto o no carga. Se mantiene compatibilidad con instalaciones que carecen de esa columna. Vender/Comprar usan negro, blanco y grises de la plataforma.
- Doce pruebas de agregación/fechas/CSV pasaron. La comprobación global de tipos mantiene errores ajenos al cambio, sin diagnósticos en estos archivos. Se revisaron cambios de 7/30/90 días, navegación histórica, calendario y aplicación de fecha, foto y diseño móvil con datos aislados. El navegador integrado no devolvió un evento de descarga; el contenido CSV se verificó con pruebas. La ruta temporal de revisión fue retirada.

## Continuidad de tipografía y colores

Se compararon los estilos calculados del catálogo, dashboard, ejes de las gráficas y perfil empresarial público: todos usan la misma familia `ui-sans-serif, system-ui, sans-serif` del sitio. No se añadió otra fuente ni se activaron las importaciones de Geist del layout. Se normalizaron los pesos personalizados del dashboard a los pesos de la página.

El dashboard, las gráficas, el menú lateral, el perfil empresarial y los detalles de color de Mi Perfil ahora reutilizan los tokens globales de `app/globals.css`. Se retiraron los verdes esmeralda y grises slate del perfil, y la paleta independiente de las gráficas. Se verificó fondo blanco, botones oscuros y acentos derivados del verde global. La preferencia para futuras modificaciones consta en `docs/estilos-agrilpa.md`. La ruta temporal de comprobación fue retirada; no se modificaron datos ni funciones comerciales.
