# Cotizaciones: activación del nuevo diseño

1. Abre `supabase/migrations/20261001_quotation_workspace.sql`.
2. Copia el archivo completo en **Supabase → SQL Editor → New query** y ejecútalo.
3. Recarga la web. Desde un producto de otro vendedor, abre **Solicitar cotización**.

La migración conserva los registros existentes y se puede volver a ejecutar. Requiere las tablas `quotations`, `orders`, `user_products` y la autenticación Supabase que usa el proyecto. No se ejecutó contra la base de datos remota durante el desarrollo.

Los nuevos datos son unidad de cantidad, ciudad o puerto, envío o recogida, frecuencia de compra y flexibilidad de fecha. El presupuesto y el incoterm siguen siendo opcionales. La solicitud toma la identidad de la sesión y usa Mensajes B2B.

El detalle es visible para el comprador y el vendedor de la solicitud. Solo el vendedor puede responder. Al aceptar, debe introducir el precio acordado y su moneda; el presupuesto del comprador no se convierte automáticamente en un precio final. La función SQL guarda la decisión y el pedido en una misma transacción, bloqueando la cotización para evitar pedidos duplicados por dos aceptaciones simultáneas.

Las solicitudes anteriores siguen mostrando sus datos disponibles. Una solicitud sin `buyer_id` puede revisarse, pero no crear un pedido hasta tener una cuenta de comprador vinculada. No se vinculan cuentas por coincidencias de nombre o correo.

Verificación realizada: formulario y detalle en escritorio y móvil; errores por campo, conservación del formulario tras un fallo y confirmación de envío con respuestas simuladas; cotización real de un producto en libras y otro por contenedores sin enviar solicitudes; pruebas de identidad, autorización, cantidades y presupuesto; TypeScript en los archivos modificados. El guardado remoto y la función SQL quedan pendientes de ejecutar la migración.

Pruebas locales sin acceso a la base de datos:

```sh
node scripts/test-quotation-workspace.cjs
```
