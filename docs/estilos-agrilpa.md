# Continuidad visual de Agrilpa

Preferencia del usuario: los cambios futuros deben conservar la tipografía y los colores que ya usa la página.

- Fuente: heredar `font-sans` / `var(--font-sans)` del layout y de Tailwind. No añadir ni aplicar otra familia tipográfica. La configuración actual no aplica las clases de Geist importadas en el layout; no convertirlas en la fuente del sitio como parte de una modificación puntual.
- Colores: reutilizar las variables de `app/globals.css` y sus utilidades (`primary`, `background`, `foreground`, `muted`, `border`, `destructive`). Fondo blanco en el tema claro, texto oscuro, verde del sitio para acentos y botones negros donde ya se aprobaron.
- No introducir esmeralda, teal, slate, azul, ámbar u otros colores de marca alternativos. Las gráficas pueden usar matices derivados del verde global y neutros, con etiquetas y leyendas.
- En administración, usar gris neutro para selección y superficies secundarias, con sombras negras muy suaves. Evitar sombras verdes y fondos verdes extensos en tarjetas. Conservar el verde de Agrilpa para acciones y estados pertinentes.
- Comprobar en el navegador que familia tipográfica y colores calculados coincidan con la página principal. Mantener los componentes compartidos para formularios y controles.

Estas pautas no cambian las funciones, rutas ni datos de las páginas.

- Botones verdes: texto blanco, incluido hover y tema oscuro. Preferencia explícita del usuario. En Pedidos y Solicitud de compra, usar texto de acción de 19 px y peso 700 para conservar legibilidad sobre el verde principal.

- Formularios y ventanas: usar los componentes compartidos de Agrilpa (`Input`, `Textarea`, `Button`, `CountryPicker` y `PhoneCodePicker`). Los países y prefijos llevan dropdown con búsqueda y banderas; no sustituirlos por un selector nativo o un campo de texto genérico.
- Antes de entregar una ventana, revisar todos sus controles abiertos, selección, validación, foco y cierre con teclado, móvil y tema oscuro. Comprobar que los dropdowns no queden recortados por el scroll del popup. La consistencia con Agrilpa forma parte de la implementación, sin que el usuario deba pedirla de nuevo.
- Aplicar las reglas de cada campo desde el inicio: números y teclado numérico en teléfonos, sintaxis completa en correos, límites de longitud y validación clara junto al campo. En nombres personales, admitir letras Unicode, tildes, espacios, apóstrofes y guiones. Los campos de empresa o mensajes mantienen las reglas propias de su contenido. Validar también en el servidor; no limitar la protección al navegador.
