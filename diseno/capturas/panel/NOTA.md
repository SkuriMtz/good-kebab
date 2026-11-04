# Panel nuevo: capturas y prueba de clics (4 nov)

Rama `prop/panel`. Todas las capturas son de `/pruebalo` (datos de ejemplo, con su aviso), servido con `next start` en modo producción.

## Hojas
- `hoja-1-resumen-1440.jpg`: el Inicio en claro y en oscuro, a 1440 px y página completa. Orden: el chat (el negocio en grande, el aviso que se cierra y la caja para pedir), luego el equipo (los 4 agentes con su personaje y lo que hicieron) y luego los pendientes, con las estadísticas en pequeño.
- `hoja-2-vistas-1440.jpg`: Agentes en oscuro (con `?agente=victor` marcado), Chat en oscuro, el menú encogido a solo íconos con Pendientes en claro, y Estadísticas en claro. Por ahora Estadísticas solo muestra un marcador: la vista completa la conecta el otro trabajador.
- `hoja-3-tableta-1024.jpg`: a 1024 px el menú se vuelve un riel de íconos. Se ven el Inicio en claro, Agentes en oscuro y el Chat en claro.
- `hoja-4-celular-390.jpg`: a 390 px, el Inicio en claro y en oscuro, el cajón abierto, Agentes, el Chat y Pendientes.

## Prueba de clics
Se hizo en Chromium con Playwright, a 1440 px y a 390 px, con las transiciones encendidas. La última corrida, después de las rondas del revisor y del inspector, dio 65 de 65 bien y la consola no marcó ningún error. A 1024 px, cada ícono del riel tiene su nombre para lectores de pantalla y su globo sale por fuera sin recortarse.

| Qué se pica | A dónde lleva | Atrás regresa |
| --- | --- | --- |
| La tarjeta de un agente en el Inicio | `?vista=agentes&agente=lola` (esa tarjeta queda marcada y a la vista) | Sí |
| La caja "8 pendientes ›" y "Ver todos los pendientes" | `?vista=pendientes` | Sí |
| Una fila de correo en Pendientes | `?vista=correo&de=<remitente>` (solo los correos de esa persona; la ✕ quita el filtro) | Sí |
| Una fila de visto bueno | `?vista=pendientes&tipo=visto-bueno` | Sí |
| Una fila sin leer | El chat con ese agente o grupo | Sí |
| Un dato de la semana en la ficha de un agente | Su chat (el de Clara lleva a Correo) | Sí |
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

En `/panel` los enlaces son de verdad (`href`) y siguen el mismo mapa: `/panel?vista=pendientes&tipo=correos|pasos&de=…`, `/panel?vista=correo&de=…#historial` (el historial solo con ese remitente), `/panel?vista=actividad&hora=10`, `/panel?vista=estadisticas`, `/panel/agentes?agente=lola` y `/panel/chat?c=…`. Los pendientes se cuentan igual en el menú, el Inicio y la vista Pendientes (`src/lib/pendientes.ts`). Entre las vistas de `?vista=`, que son la misma página, la transición la arranca `ArmazonPanel`. No se pudo probar con una cuenta real porque en este entorno no hay sesión de Supabase.

## Ronda del inspector (destinos nuevos)
- **Pendientes** acepta `&accion=` (se compara con `normalizar()` de Estadísticas, con un chip para quitarlo y un estado vacío si no hay correos), además de `&tipo=` y `&de=`.
- **Actividad** acepta `&agente=`, `&hora=` y `&dia=`, en la hora de México, cada uno con su chip. Ya no tiene la pestaña única "Todo".
- **Correo** con `&de=` de un remitente sin correos muestra "Hoy no hay correos de …" con el botón "Ver todos los correos". Cada fila se abre: la acción sugerida lleva a Pendientes con esa acción y "Pedirle a Clara que lo vea" abre su chat (guion local, sin IA).
- **Números de "7 días"** del Inicio y de Agentes: salen del mismo resumen que Estadísticas (`resumenSemanaEjemplo` en el ejemplo, `resumenDe` en /panel) y llevan a `?vista=estadisticas&periodo=7d&metrica=…` (con `&agente=` en los de cada agente). El uso del plan lleva a `&periodo=mes&metrica=uso`.
- **Chat:** elegir una conversación en la lista cambia `con=`; atrás y recargar lo respetan.
- **Entrada directa:** `/pruebalo?vista=…` se pinta desde el servidor con la vista pedida, sin mostrar antes el Inicio.
- **Botón flotante:** de 48 px y en su propia franja a la derecha. A 1440 el contenido termina en 1360 y el botón empieza en 1376; a 1024, en 944 y en 960. En celular, el botón pasa a la barra de arriba.
- **Ajustes** es una vista dentro del panel: el plan (solo para ver, con "Ver los planes" y "Para cambiar de plan, escríbenos"), la apariencia claro/oscuro, el correo, el equipo y tus datos.
- **Otros arreglos:**
  - la campana lleva a Correo filtrado;
  - Sofía abre el chat con Lola;
  - el círculo dice "50%";
  - las letras de los remitentes van en cuadros de color;
  - las horas usan la misma letra en todas las vistas;
  - el pie de versión pasa AA;
  - el logo del cajón lo cierra;
  - en celular, los fragmentos del saludo van arriba, sin tapar la fecha.
- **Sin cambio:** el botón lleno "Mejorar plan" sigue sin verse en /pruebalo, porque el ejemplo es Max. Pasarlo a One rompería los números de ejemplo: One trae 600 mensajes y 2 agentes, y el ejemplo usa 1,284 mensajes y 4 agentes.
