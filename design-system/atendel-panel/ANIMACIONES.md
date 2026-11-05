# Animaciones del panel: copiar las del video del dueño

Video: `/root/.claude/uploads/0c181d99-e3a6-5247-afc9-61504d38ed05/81c36a0a-Screen_Recording_2026-11-04_at_10.42.00p.m..mov`, 14 s a 60 fps. Muestra un dashboard claro de analítica con tres vistas: analítica, equipo y recepción.

Cuadros clave en `diseno/capturas/panel-chat/video/`:
- `hoja-completa.jpg`: 2 cuadros por segundo;
- `1-cambio-de-vista-y-numeros.jpg`: de 0.3 a 1.9 s, a 10 cuadros por segundo;
- `2-tarjetas-hover.jpg`;
- `3-arrastrar-y-modal.jpg`.

Ojo: el acercamiento de cámara que se ve en el video lo hace la grabadora, NO la interfaz. **No se copia.**

Se hacen en **CSS** siempre que se pueda: `transition`, `@keyframes`, `@starting-style`, `stroke-dashoffset` y `view-transition`. JS solo cuando haga falta interrumpir o seguir el puntero. Siempre se usan las skills `animate`, `choreograph`, `emil-design-eng`, `animation-performance` y `review-animations`, junto con UI UX Pro Max (`search.py "<consulta>" --domain ux` y `--domain gsap`). Solo se anima `transform`, `opacity`, `filter` (con poco blur) y `stroke-dashoffset`. Con `prefers-reduced-motion`, todo queda en su estado final al instante.

| # | Qué se ve en el video | Nombre (animation-vocabulary) | Cómo en Atendel | Medidas |
|---|---|---|---|---|
| 1 | Al cambiar de pestaña o vista, lo viejo se desvanece y el título se cruza con el nuevo (se ven los dos un instante, el nuevo ~6 px más abajo). Queda un "blanco" breve y entra lo nuevo. | Crossfade, con un deslizamiento corto | Cambio entre secciones del menú y de periodo en Estadísticas. Usar la transición entre vistas que ya existe (`src/components/TransicionPaginas.tsx` y `src/lib/transiciones.ts`) o una View Transition. | salida 120–150 ms con ease-in; entrada 200–240 ms con ease-out, `translateY(6px→0)` + opacity |
| 2 | Las tarjetas de números aparecen una tras otra. | Entrada escalonada (stagger fade-up) | Tarjetas de Estadísticas, la cuadrícula "Pídele a tu equipo", las tarjetas de Agentes y las de Pendientes. | 40 ms entre tarjetas, 220 ms cada una, `translateY(8px)` + opacity, sin rebote |
| 3 | Las cifras "ruedan" dígito por dígito: "$1₈" → "$18₄" → "$184K"; cada dígito nuevo sube desde abajo. | Odómetro de dígitos que ruedan (rolling digits / number ticker) | TODAS las cifras grandes: Estadísticas, Inicio y uso del plan. Cada dígito es una columna de 0–9 que se mueve con `translateY` en CSS, escalonada de izquierda a derecha, con `font-variant-numeric: tabular-nums`. Con aria-label en el número completo. | 500–700 ms por dígito, 40 ms de escalón, curva `cubic-bezier(.2,.8,.2,1)` |
| 4 | La línea de la gráfica se dibuja de izquierda a derecha y luego aparece el relleno suave. | Trazo que se dibuja (line draw) + fundido del área | Gráfica de Estadísticas: `stroke-dasharray`/`stroke-dashoffset` y el área con opacity al final. | ~800 ms la línea con ease-out; el área a +200 ms en 250 ms |
| 5 | Al pasar el cursor por la gráfica: una línea vertical punteada, puntos en cada serie y una burbuja oscura con fecha y valores que sigue al cursor. | Cruz de lectura con tooltip que sigue al puntero (crosshair scrubbing) | Gráfica de Estadísticas, también con teclado (flechas) y con el dedo. | la burbuja se mueve con transform, 80–120 ms; aparece en 120 ms |
| 6 | Tarjetas de persona en cuadrícula: al pasar el cursor, se marca el botón y la tarjeta reacciona apenas. | Hover y press sutil | Tarjetas de agentes, de pendientes y de "Pídele a tu equipo": borde más claro en hover y `scale(.98)` al presionar. | 150 ms; hover solo con `@media (hover:hover)` |
| 7 | Tablero de recepción: una tarjeta se arrastra a otra columna (se levanta con sombra, las demás se recorren) y otra sale de su columna y la lista se cierra. | Arrastrar con levantar y soltar, reacomodo animado (FLIP) | Pendientes como tablero: Por revisar → Aprobado → Enviado. Arrastrar es OPCIONAL; siempre debe haber botones de "Aprobar" y "Cambiar algo" que hagan lo mismo (accesible con teclado). Al aprobar, la tarjeta se va a su columna con FLIP. | levantar 150 ms (`scale(1.02)` + sombra); reacomodo 220 ms |
| 8 | "Nueva cita": el fondo se oscurece y se desenfoca, y la ventana aparece al centro, creciendo un poco. | Modal que aparece con fondo desenfocado (pop-in + backdrop blur) | "Nueva cita", "Nuevo grupo", "Cambiar algo" y el buscador ⌘K. `dialog` nativo con `@starting-style`: `scale(.96→1)` + opacity; fondo en `rgba(0,0,0,.35)` con `backdrop-filter: blur(4px)`. El foco queda atrapado y Esc cierra. | entra en 200 ms, sale en 140 ms |

Además, del chat:
- respuestas en streaming (el texto aparece conforme llega);
- los puntitos de "escribiendo…";
- el mensaje nuevo entra con `translateY(6px)` + opacity en 180 ms.

Tope: 1 o 2 animaciones protagonistas por vista. Nada decorativo que se repita sin fin, salvo los fragmentos, que se mueven muy lento y se detienen con reducir movimiento.
