# Panel nuevo (prop/panel-chat): medidas contra la captura del dueño

Medido con el DOM (Playwright) en `/pruebalo`, en oscuro, a **1404 × 768**, que es el tamaño de ventana de `referencia-chat.webp` (2000 × 1095, escala 1.42). Las medidas de la referencia salen de dividir sus píxeles entre 1.4245.

| Pieza | Referencia | Atendel | Nota |
|---|---|---|---|
| Menú lateral | 288 px | **288 px** | borde derecho de 1 px |
| "+ Nueva conversación" | píldora de 32 px de alto, ~277 de ancho | **279 × 32** (y = 52) | 4 px de margen a cada lado |
| Opciones del menú | 32 px de alto, 35 px de paso | **32 px**, 35 px de paso | ícono de 18 px y texto de 15 px |
| Pie del menú | 50 px | **50 px** (y = 718) | raya arriba, inicial, "Ana · Max ▾" y el tema |
| Saludo, centro vertical | 295 px (38 % del alto) | **295 px** | serif Source Serif 4 de **40 px** |
| Marca junto al saludo | ~34 px | **35 px** | triangulitos de Atendel, no la chispa |
| Caja de chat | 672 × 105, arriba en y = 339 | **672 × 105**, y = 339 | radio de 20 (28 en claro) |
| Fila debajo de la caja | su centro a ~23 px de la caja | centro en y = 468 (24 px) | "Todo el equipo ▾" a la izquierda; "Max · 43 % usado" a la derecha |
| Título de las tarjetas | centro en y = 553 | **y = 553** (fila de 537 a 569) | "Pídele a tu equipo" con sus píldoras a la derecha |
| Tarjetas | 3 de 210 × 141, 15 px entre ellas, arriba en y = 577 | **210 × 141**, 15 px, y = 577 | miniatura de **85 px** (200 de ancho) |
| Lo que se agrega | — | franja "3 esperan tu visto bueno ›" (y = 496, 28 px) | cabe entre la fila y las tarjetas sin moverlas |

Una diferencia que se dejó así: en la captura, el bloque central queda unos 18 px a la derecha del centro del área de contenido; probablemente porque la ventana tenía una barra de desplazamiento o estaba recortada. En Atendel el bloque está centrado de verdad en el área de contenido (la caja empieza en x = 510, y en la captura en x = 528).

## Otros tamaños

- **Conversación (1404):** la columna de mensajes mide 720 px y la caja fija abajo, 672 × 105.
- **Secciones (1404):** la columna mide 768 px, el título es serif de 32 px y el buscador ancho con ⌘K, 44 px.
- **Claro (1404):** el menú es una tarjeta de 272 × 736 (16 px de margen y radio de 24) sobre el lienzo `#ececee`, con el resplandor tenue detrás del saludo.
- **1024:** el menú se queda en 288; la caja mide 672 y las tarjetas 210 × 141.
- **390:** el menú se vuelve un cajón; la caja ocupa 358 px (16 de margen), las tarjetas van en 2 columnas de 173 × 141 y el saludo baja a 32 px. No hay desplazamiento horizontal en Inicio, Pendientes, Estadísticas, Correo ni la conversación.

## Hojas

- `hoja-chat-oscuro-1404.jpg`: /pruebalo junto a `referencia-chat.webp`.
- `hoja-claro-luma.jpg`: el modo claro junto a `referencia-luma.webp`.
- `hoja-seccion-mercury.jpg`: Agentes en claro junto a `referencia-mercury.jpg`.
- `hoja-1024-390-conversacion.jpg`: el Inicio a 1024 y a 390, y la conversación abierta.
