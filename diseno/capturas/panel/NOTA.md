# Panel nuevo: capturas y prueba de clics (4 nov)

Rama `prop/panel`. Todas las capturas son de `/pruebalo` (datos de ejemplo, con su aviso), servido con `next start` en modo producción.

## Hojas
- `hoja-1-resumen-1440.jpg`: el Inicio en claro y en oscuro, a 1440 px y página completa. Orden: el chat (el negocio en grande, el aviso que se cierra y la caja para pedir), luego el equipo (los 4 agentes con su personaje y lo que hicieron) y luego los pendientes, con las estadísticas en pequeño.
- `hoja-2-vistas-1440.jpg`: Agentes en oscuro (con `?agente=victor` marcado), Chat en oscuro, el menú encogido a solo íconos con Pendientes en claro, y Estadísticas en claro. Por ahora Estadísticas solo muestra un marcador: la vista completa la conecta el otro trabajador.
- `hoja-3-tableta-1024.jpg`: a 1024 px el menú se vuelve un riel de íconos. Se ven el Inicio en claro, Agentes en oscuro y el Chat en claro.
- `hoja-4-celular-390.jpg`: a 390 px, el Inicio en claro y en oscuro, el cajón abierto, Agentes, el Chat y Pendientes.

## Prueba de clics
Se hizo en Chromium con Playwright, a 1440 px y a 390 px, con las transiciones encendidas. Salieron 39 de 39 bien y la consola no marcó ningún error.

| Qué se pica | A dónde lleva | Atrás regresa |
| --- | --- | --- |
| La tarjeta de un agente en el Inicio | `?vista=agentes&agente=lola` (esa tarjeta queda marcada y a la vista) | Sí |
| La caja "8 pendientes ›" y "Ver todos los pendientes" | `?vista=pendientes` | Sí |
| Una fila de correo en Pendientes | `?vista=correo&de=<remitente>` (solo los correos de esa persona; la ✕ quita el filtro) | Sí |
| Una fila de visto bueno | `?vista=pendientes&tipo=visto-bueno` | Sí |
| Una fila sin leer | El chat con ese agente o grupo | Sí |
| Estadísticas: "Ver todo", la dona del plan y cada número | `?vista=estadisticas` ("Esperan tu visto bueno" lleva a sus pendientes) | Sí |
| Los filtros de Pendientes (Todos, Visto bueno, Correos, Sin leer) | `&tipo=…` | Sí |
| El menú: Inicio, Pendientes, Estadísticas, Correo; Chat › grupo; Agentes › agente | Su vista, ya filtrada | Sí |
| Novedades (las 3 filas) | Estadísticas, el grupo Recepción y Correo | Sí |
| El círculo de Primeros pasos, en cada paso | Donde se hace ese paso | Sí |
| El aviso "Ver estadísticas" | `?vista=estadisticas` | Sí |
| El botón de chat flotante | El chat (en el chat, el botón no se muestra) | Sí |
| Escribir en la caja del Inicio y Enter | El chat de ejemplo, que manda el texto con el guion local, sin IA | Sí |
| El botón del menú en escritorio | Encoge el menú a íconos y lo recuerda en este navegador | — |
| El botón del menú en celular | Abre el cajón; al elegir algo se cierra | Sí |

En `/panel` los enlaces son de verdad (`href`) y siguen el mismo mapa: `/panel?vista=pendientes&tipo=correos|pasos&de=…`, `/panel?vista=estadisticas`, `/panel/agentes?agente=lola` y `/panel/chat?c=…`. Entre las vistas de `?vista=`, que son la misma página, la transición la arranca `ArmazonPanel`. No se pudo probar con una cuenta real porque en este entorno no hay sesión de Supabase.
