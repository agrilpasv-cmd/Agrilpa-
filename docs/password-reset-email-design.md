# Correo de recuperación de Agrilpa

Nueva propuesta integrada en `sendPasswordResetEmail`, con el mismo destinatario, nombre y enlace que recibe la función actual. No se modifica la generación, validación ni caducidad del enlace de Supabase.

## Dominio de recuperación

`/api/auth/forgot-password` construye el enlace mediante `lib/auth-email-url.ts`. Usa una URL pública HTTPS de `SITE_URL` o `NEXT_PUBLIC_SITE_URL`; si no existe una configuración válida, usa `https://agrilpa.com`. Nunca toma el encabezado Origin de la petición ni utiliza localhost como alternativa.

Configuración recomendada al publicar:

```env
SITE_URL=https://agrilpa.com
```

También deben estar publicados `/auth/callback` y `/auth/reset-password`. El 16 de octubre de 2026, una comprobación pública sin tokens devolvió 404 para `/auth/reset-password` y `/api/auth/forgot-password`; cambiar el dominio del enlace no publica esas rutas. Los correos antiguos conservan el enlace con el que se enviaron.

`node scripts/check-auth-email-url.cjs` verifica el dominio público desde solicitudes locales, el descarte de configuraciones locales o inválidas, la conservación del token y que Origin no pueda cambiar el destino. No genera tokens reales ni envía correos.

## Dirección aplicada

Correo transaccional para usuarios de Agrilpa, con el lenguaje visual blanco y verde de la web. ENERGY 1 / RHYTHM 2 / MOTION 1: una sola acción principal, separación entre la acción y la ayuda, sin animaciones.

- Color: `#489e00` corresponde al `oklch(0.62 0.2 135.14)` de `app/globals.css`, convertido a sRGB para clientes de correo. El verde del símbolo original se conserva.
- Logo: procede de `public/agrilpa-logo.svg`. Se rasteriza sobre blanco y se incluye como imagen CID, sin peticiones a un dominio de pruebas ni el antiguo fondo negro.
- Composición: encabezado y cuerpo alineados a la izquierda; botón antes de la información secundaria. El correo existe para recuperar el acceso, sin bloques promocionales.
- Tipografía: Arial y Helvetica por su disponibilidad en clientes de correo; texto principal de 16 px y separación suficiente entre párrafos.
- Botón: texto oscuro sobre el verde de la web, contraste calculado de 5.02:1 y altura de 56 px. Blanco sobre ese verde no alcanza AA para texto normal.
- Compatibilidad: tablas de presentación, estilos esenciales inline, ancho máximo de 600 px y adaptación a pantallas estrechas. Se incluye una versión de texto plano.

## Evidencia de verificación

`node scripts/check-password-reset-email.cjs` comprueba sin enviar correos: saludo, datos escapados, URL original en las dos acciones, texto plano, imagen inline y contrato de éxito/error del proveedor. TypeScript no reporta errores en los archivos modificados.

La vista previa se ejecutó en Edge sin ventana a 320, 375, 480 y 720 px, también a 200% de zoom, con nombre largo, enlace largo y CSS del encabezado eliminado. Sin desbordamiento horizontal ni errores de página. Se probaron Tab, foco visible y ambos enlaces con una respuesta HTTP simulada. El token de la vista previa es `TEST_ONLY`.

No se enviaron correos reales ni se usaron tokens de recuperación reales. Esta revisión no sustituye una prueba de entrega en Gmail, Outlook o Apple Mail.

## Delivery Gate

### Hard Gate

- R-02 PASS: textos nuevos sin raya larga ni fórmulas promocionales.
- R-03 PASS: sin desbordamiento a 320, 375, 480 y 720 px; botón de 56 px.
- R-17 PASS: sin estadísticas; año del pie calculado desde la fecha.
- R-18 PASS: sin testimonios ni identidades inventadas.
- R-23 PASS: se reutiliza el logo original; no se crea una identidad nueva.
- R-24 PASS: sin navegación añadida; solo las dos acciones de recuperación.
- R-25 PASS: contraste calculado mínimo de 5.02:1 en el texto visible.
- R-26 PASS: botón y enlace alternativo abren el mismo callback con token y tipo originales, verificados con navegación simulada.
- R-27 PASS: contenido estático; se conserva el manejo de errores del envío y se prueba su respuesta.
- R-28 PASS: sin sección de preguntas frecuentes.
- R-32 PASS: ambas acciones accesibles con Tab y foco visible en navegador.
- R-33 PASS: plantilla escrita directamente en su módulo; integración mediante apply_patch. Los scripts exportan y prueban la plantilla, sin modificar su código.
- R-34 PASS: no se añade un selector de tema; el correo declara su presentación clara.
- R-35 PASS: plantilla ejecutada y renderizada; ruta compilada con GET 405 sin envío; enlaces y teclado probados.
- R-36 PASS: no se afirma una duración de una hora ni una garantía de seguridad sin comprobarla.
- R-37 PASS: se aplica la dirección expresa del usuario, colores y logo de la web.
- R-38 PASS: nombre de vista previa tomado de la referencia; URL y token de prueba identificados como simulados.

### Purpose Gate

- R-01 PASS: color de acción tomado del CSS de Agrilpa; sin degradados ni resplandores.
- R-04 PASS: sin iconos ni emojis decorativos.
- R-06 PASS: tipografía elegida por legibilidad y disponibilidad en correo.
- R-07 PASS: fondo neutro para separar el mensaje de la superficie del lector de correo.
- R-08 PASS: botón sin flecha decorativa.
- R-09 PASS: sin insignias ni etiquetas redundantes.
- R-10 PASS: sin transparencias ni desenfoque.
- R-12 PASS: sin sombras que simulen elevación.
- R-13 PASS: sin resplandores.
- R-14 PASS: sin cuadrícula de tarjetas; un único documento transaccional.
- R-19 PASS: sin animaciones, consistente con el carácter del correo.
- R-22 PASS: sin ilustraciones añadidas.

### Liveliness

- Diales PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 aplicados al correo.
- Consistencia PASS: contenido sobrio, ayuda separada por jerarquía y sin movimiento.
- Foco PASS: el botón verde es la acción principal.
- Espaciado PASS: separa saludo, acción y ayuda; no crea un encabezado ornamental alto.
- Acento PASS: el verde de Agrilpa destaca la acción, además de su presencia en el logo original.
- Identidad PASS: logo original y color de acción extraído de la plataforma.
- Dirección PASS: correo transaccional de Agrilpa, según la petición y la referencia del usuario.

### Craftsmanship y consistencia

- C-1 PASS: decisiones principales justificadas en Dirección aplicada.
- C-2 PASS: las dos acciones tienen destino comprobado con respuesta simulada.
- C-3 PASS: cada bloque explica la recuperación o ayuda a completarla.
- C-4 PASS: verificados texto largo, enlaces largos, CSS limitado, teclado y zoom.
- C-5 PASS: sin afirmaciones comerciales ni garantías inventadas.
- R-05 PASS: estructura determinada por recuperación, confirmación de solicitud y enlace alternativo.
- R-11 PASS: radio de 12 px en el documento y 8 px en el botón, sin formas de cápsula.
- R-15 PASS: CTA específico, «Restablecer contraseña».
- R-16 PASS: sin vocabulario promocional ni términos de moda.
- R-20 PASS: identidad de Agrilpa mediante sus propios activos y colores.
- R-21 PASS: tema claro elegido para este correo; no se introduce una interfaz de temas.
- R-29 PASS: verdes propios de la marca y neutros, sin colores ornamentales adicionales.
- R-30 PASS: no se reproduce el diseño de otro producto.
- R-31 PASS: color, composición, tipografía, espaciado, imagen y botón tienen una razón escrita.
