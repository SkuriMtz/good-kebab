# Atendel: reglas propias del panel. MANDAN sobre MASTER.md y pages/*

MASTER.md es la salida genérica de UI UX Pro Max. De ahí se toma:
- el estilo **Minimalism & Swiss** (limpio, mucho aire, contraste alto, cuadrícula);
- las reglas de accesibilidad, movimiento y entrega.

**No** se usan su paleta índigo ni Poppins/Open Sans: chocan con la referencia del dueño y con la marca. Manda lo de aquí abajo.

## Referencias (en `diseno/capturas/panel-chat/`)
1. **`referencia-chat.webp`**, la principal: la app de chat que mandó el dueño. Se copian la DISTRIBUCIÓN, las proporciones y los tamaños. NO se copian su nombre, su logo de chispa ni sus fuentes.
2. **`referencia-mercury.jpg`**, solo inspiración para las secciones (Pendientes, Estadísticas, Citas y Ajustes), sobre todo en modo claro. De ahí se toman:
   - el menú con grupos (▾) y un contador en una pastilla;
   - el buscador ancho arriba de cada sección, con el atajo ⌘K;
   - "Bienvenida, Ana" en grande;
   - una fila de acciones en píldoras (la principal llena y en azul, las demás en gris suave);
   - tarjetas blancas con borde fino y una gráfica de área suave;
   - una tarjeta de "pruébalo" con pestañas y filas que llevan ›;
   - un botón redondo abajo a la derecha.

## Medidas (de la captura de 2000×1095; escala 1.42 en una ventana de 1404 px)
| Pieza | Medida |
|---|---|
| Menú lateral | **288 px**, fondo `#1f1f1f`, borde derecho 1 px `#2d2d2d` |
| Lienzo | `#181818` |
| "+ Nueva conversación" | píldora de 32 px de alto, fondo `#404040` y casi todo el ancho del menú (4 px de margen) |
| Opciones del menú | 32 px de alto, ícono de 18 px, texto de 15 px en `#e8e8e8` |
| Títulos de sección ("Fijados", "Recientes") | 13 px, `#979797` |
| Pie del menú | 50 px, raya arriba `#393939`: inicial en círculo, "Nombre · Plan ▾" e ícono |
| Saludo | centrado, su centro a ~38 % del alto; marca de ~35 px + serif de ~40 px en `#e8e8e8` |
| Caja de chat | **672 px** de ancho (máximo; al 100 % con 16 px de margen en celular), ~105 px de alto mínimo, fondo `#303030`, borde 1 px `#404040`, radio 20 px; abajo "+" a la izquierda, y micrófono y voz a la derecha |
| Fila de abajo de la caja | 23 px debajo: selector a la izquierda, dos textos tenues a la derecha |
| Tarjetas | título de sección ~110 px más abajo, con "Ver todo" a la derecha; 3 tarjetas de 210 × 141 px con 15 px de separación, fondo `#1f1f1f`, radio 12 px, miniatura de 85 px en `#0f0f0f`, título de 15 px y fecha en `#979797` |

## Colores (tokens semánticos, nunca hex sueltos en los componentes)
- **Oscuro (por defecto, como la captura):**
  - lienzo `#181818`, menú `#1f1f1f`, superficie `#303030`, borde `#404040`, división `#2d2d2d`;
  - texto `#e8e8e8`, texto 2 `#a3a3a3`. El `#979797` de la captura se ajusta a ≥4.5:1 sobre `#1f1f1f`, así que usar `#a3a3a3` o el que lo cumpla.
- **Claro:** lienzo `#ffffff`, menú `#f7f7f8`, superficie `#ffffff`, borde `#e5e5e5`, texto `#1f1f1f` y texto 2 `#5f5f5f`.
- **Acento de acción:** el azul de Atendel que ya existe en el proyecto. Se usa en el botón principal, el foco y los enlaces.
- **Fragmentos y marca:** `#ffb829`, `#8052ff`, `#15846e`, `#23d9b5`, `#e040fb` y `#3d7bff`. Son triangulitos de contorno de 1–2 px, sin grises.

## Letra
- **UI:** Geist, la que ya carga el proyecto.
- **Saludo y títulos de sección grandes:** una serif con licencia OFL, guardada en `src/fonts/` con su licencia, porque la CSP solo permite fuentes de 'self'. Elígela con `search.py "<consulta>" --domain google-fonts`, por ejemplo Source Serif 4 o Newsreader. Que sea sobria, no de lujo.
- **Escala:** 13 / 15 / 16 / 20 / 32 / 40. Cifras tabulares en los números.

## Movimiento
- Las reglas de Emil y UI UX Pro Max: de 150 a 220 ms, solo transform y opacity.
- La salida dura ~65 % de la entrada.
- Entrada escalonada de 30 a 50 ms por elemento, sin rebote en datos.
- Respuestas en streaming (el texto aparece conforme llega) y puntitos de "escribiendo…".
- Con reducir movimiento, todo se queda quieto.

## Íconos
Los del proyecto (`@/components/base/Iconos`): un solo juego, de trazo consistente. Sin emojis como íconos.

## Más referencias (5 nov)
- **`referencia-luma.webp`, para el modo claro:**
  - el menú como TARJETA flotante (margen de 16 px, radio de 24 px y fondo blanco) sobre un lienzo gris claro (`#ececee`);
  - un **resplandor suave** detrás del saludo y de la caja: un degradado radial muy tenue con los colores de los fragmentos, sobre todo azul y violeta;
  - la caja de chat blanca con radio de 28–32 px, con adjuntar, micrófono y un botón redondo de enviar;
  - debajo de la caja, una **fila de píldoras**: "Todo" (la activa, llena en negro o azul), "Citas", "Correo", "Clientes" y "Oficina". Filtran una **cuadrícula de 4 columnas "Pídele a tu equipo"**: cada tarjeta lleva una miniatura (los fragmentos con el personaje del agente), un título en negritas, dos líneas de descripción y ›. Al picarla, abre el chat con ese pedido ya escrito;
  - en el menú, la opción activa va como píldora llena;
  - al pie, una píldora con el uso del plan ("57 % de tus mensajes del mes disponibles").
- **Modo oscuro:** la captura del chat (`referencia-chat.webp`), con la misma fila de píldoras y la misma cuadrícula.
- **Pendientes en el Inicio:** una franja chica arriba de las píldoras ("3 esperan tu visto bueno ›"), además del número en el menú.
- **Animaciones:** ver `ANIMACIONES.md`.
