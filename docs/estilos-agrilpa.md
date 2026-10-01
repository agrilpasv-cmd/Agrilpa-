# Continuidad visual de Agrilpa

Preferencia del usuario: los cambios futuros deben conservar la tipografía y los colores que ya usa la página.

- Fuente: heredar `font-sans` / `var(--font-sans)` del layout y de Tailwind. No añadir ni aplicar otra familia tipográfica. La configuración actual no aplica las clases de Geist importadas en el layout; no convertirlas en la fuente del sitio como parte de una modificación puntual.
- Colores: reutilizar las variables de `app/globals.css` y sus utilidades (`primary`, `background`, `foreground`, `muted`, `border`, `destructive`). Fondo blanco en el tema claro, texto oscuro, verde del sitio para acentos y botones negros donde ya se aprobaron.
- No introducir esmeralda, teal, slate, azul, ámbar u otros colores de marca alternativos. Las gráficas pueden usar matices derivados del verde global y neutros, con etiquetas y leyendas.
- Comprobar en el navegador que familia tipográfica y colores calculados coincidan con la página principal. Mantener los componentes compartidos para formularios y controles.

Estas pautas no cambian las funciones, rutas ni datos de las páginas.
