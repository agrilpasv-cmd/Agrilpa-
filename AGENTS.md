# Interfaces de Agrilpa

Antes de crear o modificar una interfaz, leer `docs/estilos-agrilpa.md` y revisar los componentes equivalentes existentes. El usuario exige continuidad visual por defecto: tipografía, colores, controles y comportamiento deben corresponder a Agrilpa sin recordatorios posteriores.

Usar los componentes compartidos de `components/ui`. Para países y prefijos, usar `CountryPicker` y `PhoneCodePicker` con búsqueda y banderas. No reemplazarlos por selectores nativos o campos genéricos. Reutilizar los activos de marca existentes.

Antes de entregar un popup, comprobar los dropdowns abiertos, búsqueda, selección, prefijo y número telefónico, validación, foco, Escape, scroll, móvil y tema oscuro. Los menús no deben quedar recortados ni el foco salir del modal.

Respetar las instrucciones globales del usuario sobre apple-design y anti-slop. Para pruebas del frontend local, no cambiar el modo de producción ni enviar solicitudes reales sin autorización.
