# Contacto de productos: chat o formulario

El interruptor global está en **Administración → Mensajes**.

| Estado | Al pulsar Contactar en un producto |
| --- | --- |
| Apagado: Chat con registro | Las personas con cuenta abren el chat con el vendedor. Los visitantes reciben la opción de iniciar sesión o registrarse. |
| Encendido: Formulario activo | Todas las personas, con o sin cuenta, envían una solicitud al administrador. No se abre una conversación nueva con el vendedor desde ese botón. |

El formulario solicita nombre, país, correo y WhatsApp. El mensaje es opcional. El país prepara el prefijo telefónico y una cuenta iniciada permite completar los datos disponibles del perfil. El producto y el vendedor se incorporan desde la base de datos, sin pedirlos de nuevo.

Las pestañas **Solicitudes de contacto** y **Chats entre usuarios** permanecen disponibles en ambos modos. Cambiar el interruptor no elimina solicitudes ni conversaciones anteriores. Los chats existentes y el soporte siguen funcionando.

En las solicitudes se puede buscar, filtrar, copiar los datos, abrir la publicación, marcar como revisada y marcar como contactada. Los enlaces de correo y WhatsApp para contactar al visitante solo se abren al pulsarlos. El aviso a los administradores se envía automáticamente después de guardar la solicitud.

## Avisos por correo a los administradores

Cada solicitud guardada en el modo formulario programa un aviso mediante Resend. Los destinatarios se obtienen de `users` con `role = 'admin'`, usando su correo registrado. Se omiten direcciones vacías o inválidas y se unifican los correos repetidos. Cada dirección recibe su propio mensaje, sin exponer las de los demás.

El correo reutiliza el diseño de las notificaciones existentes de Agrilpa: cabecera con la marca, contenido blanco, datos ordenados y botón verde. El logotipo se muestra al doble del tamaño inicial (240 px) y el botón usa el verde principal exacto de la web, `#489e00`, con texto blanco por preferencia expresa del usuario. Incluye producto, vendedor, persona interesada, país, correo, WhatsApp, mensaje opcional y referencia. El botón abre **Mensajes → Solicitudes de contacto**, incluso si después se cambia el interruptor al modo chat.

El envío se ejecuta con `after()` después de responder al formulario. Un fallo de correo no revierte la solicitud. Los errores temporales se reintentan hasta tres veces; los definitivos quedan registrados sin incluir los datos personales del contacto en el log. No se incorpora una cola persistente ni confirmación de entrega mediante webhooks en este cambio.

Se usa una clave estable por solicitud y dirección para evitar duplicados. Como [Resend conserva las claves de idempotencia durante 24 horas](https://resend.com/docs/dashboard/emails/idempotency-keys), los reintentos automáticos de estas notificaciones se limitan a solicitudes de menos de 23 horas. Una solicitud antigua no vuelve a notificar por repetir el envío del formulario.

Esta ampliación no añade tablas ni columnas: no requiere SQL adicional. Sigue siendo necesaria la migración inicial del modo de contacto. La previsualización local permanece sin guardar solicitudes ni enviar correos reales. Las pruebas de destinatarios, diseño, reintentos y permisos usan datos simulados.

Verificación del correo: `node scripts/check-product-contact-notifications.cjs` comprueba destinatarios administrativos, paginación de más de 250 cuentas, direcciones duplicadas, contenido escapado, reintentos, claves estables y errores del proveedor. Las pruebas de API comprueban que se programe tras el guardado y nunca en la previsualización local. La plantilla se revisó en navegador a 1280 y 390 px, sin desbordamiento horizontal y con botón de al menos 44 px. No se realizaron envíos a destinatarios reales ni pruebas en las aplicaciones de Gmail u Outlook.

Delivery Gate del correo: **PASS** en el alcance local verificado. Dirección **ENERGY 1 / RHYTHM 1 / MOTION 1**: plantilla existente de notificaciones, datos agrupados por solicitud y un único botón principal. Marca y colores reutilizados, texto alternativo y estructura de encabezados, versión de texto plano y datos de prueba explícitos. El fondo oscuro pertenece a la cabecera de las notificaciones existentes; la ampliación conserva ese diseño.

## Activación en Agrilpa

Corrección del interruptor: se eliminó el almacenamiento en `globalThis`, que podía divergir entre las rutas del administrador y del visitante. En producción, las dos rutas consultan la misma fila de Supabase y nunca simulan un guardado cuando faltan las tablas. La previsualización local explícita (`NODE_ENV=development` y `AGRILPA_LOCAL_CONTACT_MODE=admin_form`) comparte un archivo privado ignorado por Git, `data/.product-contact-mode.local.json`, que conserva el modo al recargar. La administración identifica esa vista previa y avisa que no guarda solicitudes ni envía correos. Sin esa bandera, el servidor local usa la configuración de Supabase, igual que producción.

Verificado: prueba de instancias independientes del módulo, control de cambios simultáneos por versión, pérdida de tablas sin éxito falso y prueba de navegador sobre un producto real. Cambiar de chat a formulario funciona sin recargar la ficha; el formulario vuelve a abrirse después de recargar. Las llamadas de tracking de la prueba se interceptaron y no se enviaron solicitudes ni correos.

1. En el proyecto **Agrilpa** de Supabase, abrir **SQL Editor** y ejecutar el contenido completo de `supabase/migrations/20261026173941_product_contact_modes.sql`.
2. Publicar esta versión del código mediante el flujo habitual del proyecto.
3. Entrar como administrador en `/admin/mensajes` y activar **Recibir contactos mediante formulario**.
4. Para volver al contacto por chat, apagar ese mismo interruptor.

La migración crea el modo inicial `chat`. Si se ejecuta nuevamente, conserva el modo guardado. Antes de aplicarla, el nuevo código conserva el chat y deshabilita el interruptor con una explicación. El formulario solo se habilita después de que un administrador guarde el cambio.

**Estado al entregar:** código preparado y probado localmente; migración no ejecutada en la base de Agrilpa y versión no desplegada. La comprobación remota fue de solo lectura: las columnas usadas de `users` y `user_products` existen y las dos tablas nuevas todavía no existen. La conexión de gestión disponible correspondía a otro proyecto y no se utilizó para modificar datos.

## Datos y permisos

### Previsualización local sin acceso de administrador

En `.env.local`, `AGRILPA_LOCAL_CONTACT_MODE=admin_form` permite abrir el formulario desde `localhost` durante `next dev`, aunque la base siga en modo chat. No habilita acceso al panel administrativo. En esta previsualización no se guardan ni se envían solicitudes: el botón de envío lo explica y conserva los datos escritos. Para volver a consultar el modo real, quitar la variable o cambiar su valor. La variable se ignora en producción y en dominios externos.

- Tablas nuevas: `product_contact_settings` y `product_contact_requests`.
- Las API administrativas comprueban la sesión y el rol `admin` en el servidor. RLS está activado y se revocan permisos directos a `anon` y `authenticated`.
- El servidor toma el producto y el vendedor reales. Guarda también sus nombres e imagen como referencia, aunque después se elimine la publicación.
- Los reintentos con la misma clave no duplican la solicitud.
- Límites por 15 minutos: 10 solicitudes por origen de red y 5 por correo. La dirección de red se representa con un HMAC; no se guarda la IP sin transformar. Estos límites y el campo oculto reducen envíos repetidos; no equivalen a una protección completa contra bots.
- El interruptor comprueba la versión de la configuración para evitar sobrescribir un cambio simultáneo de otro administrador.

## Verificación

Los campos del popup validan al perder el foco y antes del envío. El teléfono muestra solo dígitos, conserva el prefijo separado y admite pegar un número internacional con formato. El correo exige una dirección completa con dominio, sin espacios, etiquetas vacías ni puntos repetidos; admite alias con `+` y dominios empresariales. El nombre personal admite caracteres internacionales y rechaza números y caracteres ajenos al nombre. País, límites y mensaje opcional conservan sus reglas. La API vuelve a validar esos datos y rechaza entradas incorrectas con 400 antes de llamar a la base de datos.

Se ejecutaron pruebas de API con dependencias simuladas y pruebas SQL con PostgreSQL local aislado (PGlite). No escriben en Supabase.

```powershell
node scripts/check-product-contact-api.cjs
$env:AGRILPA_PGLITE_MODULE = 'ruta/al/modulo/@electric-sql/pglite'
node scripts/check-product-contact-database.cjs
```

Resultados: validación, identidad verificada, permisos 401/403, cambio de modo, conflicto y límites, referencias del producto, reintentos, RLS, ejecución repetida de la migración y conservación de referencias tras eliminar el producto.

La prueba de navegador utilizó las páginas reales con respuestas API simuladas y datos identificados como de prueba. Verificó los dos modos para visitantes y cuentas iniciadas, errores de envío y guardado, conservación del formulario, confirmación, pestañas separadas, persistencia al recargar y navegación móvil a 390 px. No creó solicitudes reales ni envió correos o mensajes. La comprobación de TypeScript se limitó a los archivos afectados; no certifica una compilación completa de las partes anteriores del repositorio.

## Revisión de diseño

El popup usa los activos de marca de Agrilpa y los componentes compartidos `Input`, `Textarea`, `Button`, `CountryPicker` y `PhoneCodePicker`. País y prefijo tienen búsqueda, banderas y selección por teclado. El prefijo se muestra separado del número, mientras la API sigue recibiendo el teléfono internacional completo. No se añadieron campos a la base de datos para esta corrección.

La revisión del popup corrigió el foco de los menús dentro del modal y verificó que Escape cierre primero el dropdown. Pruebas de navegador aprobadas a 320, 390, 768 y 1280 px, en claro y oscuro, incluyendo resultados vacíos, borrado del país sin perder el teléfono, pegado de un número internacional, error con datos conservados y confirmación simulada. El botón principal cumple un contraste medido de al menos 4.5:1 en ambos temas. Se comprobó además la sincronización de país y prefijo en el formulario existente de Contacto. Estos envíos de prueba fueron interceptados, sin crear solicitudes reales.

Dirección: mantener el verde, tipografía y componentes de Agrilpa. **ENERGY 1 / RHYTHM 2 / MOTION 1**. El formulario da prioridad a una sola acción; la bandeja combina lista y detalle para revisar solicitudes sin perder contexto. En móvil pasa a una vista a la vez. El verde identifica la acción principal, el modo activo y la selección; los bordes separan contenido sin sombras decorativas.

Delivery Gate de anti-slop, limitado a las interfaces nuevas:

| Bloque | Resultado y evidencia |
| --- | --- |
| Hard Gate | PASS: controles conectados, estados de carga/vacío/error, foco visible, campos etiquetados y navegación por teclado. Se reutilizan imágenes y marca existentes; las capturas contienen datos de prueba explícitos. |
| Purpose Gate | PASS: iconos con función de buscar, copiar, actualizar o abrir contacto. La flecha de publicación identifica navegación externa. El estado Pendiente/Contactada representa datos reales; sin métricas, testimonios ni adornos inventados. |
| Liveliness | PASS: jerarquía producto → datos → envío en el formulario; lista → persona → producto → seguimiento en administración. Acento verde y contexto agrícola de la publicación. |
| Craftsmanship | PASS en los escenarios locales registrados: ambos modos, errores, carga, vacío y adaptación móvil. Se mantiene el sistema de color mediante variables, con movimiento reducido. La activación en producción requiere los pasos anteriores. |
