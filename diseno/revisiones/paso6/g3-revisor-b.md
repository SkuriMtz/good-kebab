# Paso 6 · Grupo 3 (Agentes) · Revisor B

Lo revisé en modo ligero: leí las entregas, vi las capturas de `diseno/capturas/paso5/g3-tN/` (todas las de 390 en oscuro y claro de T1 y T3, y las representativas de T2; las de 1440 en oscuro de las tres) y el código (`git diff 6a1f89e`). Corrí `npm run lint` en cada worktree. No levanté servidores, no hice build ni capturas propias.
Me fijé sobre todo en dos cosas: qué ve un dueño de clínica que entra por primera vez desde el celular, y si el código está sano (accesibilidad, estados, movimiento reducido y que no se rompa nada del resto del sitio).

## Resultado

| Criterio | T1 · pestañas de la portada de GitHub | T2 · perfil de GitHub | T3 · GitHub Docs |
|---|:-:|:-:|:-:|
| 1. Fidelidad a GitHub (afinado con Apple) | 9 | 8 | 8.5 |
| 2. Que no parezca hecho por IA ni genérico | 8 | 8.5 | 8 |
| 3. Evita los errores de CLAUDE.md | 8 | 7.5 | 6.5 |
| 4. Claridad para un dueño de clínica | 8.5 | 7.5 | 8 |
| 5. Calidad en celular | 8 | 8 | 7.5 |
| 6. Acabado y detalle | 8.5 | 8 | 7.5 |
| **Promedio** | **8.33** | **7.92** | **7.67** |

**Ganadora: G3-T1.** Es la que más se parece al sitio público de GitHub (fila de pestañas + un solo panel de vidrio + el producto dentro de una ventana). Además es la más clara para el dueño ("Así contesta Lola un WhatsApp", "En qué plan viene Lola", "Pídele algo a Lola") y la que menos rompe las lecciones. Las otras dos tienen ideas muy buenas que conviene pasarle (ver abajo).

## Lista obligatoria (las tres)

| Punto | T1 | T2 | T3 |
|---|:-:|:-:|:-:|
| Anclas `#lola #clara #victor #iris` | ✓ (`HojaAgente`) | ✓ | ✓ |
| `?ficha=` (FichasAgentes sin tocar) | ✓ | ✓ | ✓ |
| 4 páginas `/agentes/[agente]` estáticas (`generateStaticParams` + `dynamicParams = false` + `notFound`) | ✓ | ✓ | ✓ |
| Ficha frost con radio 24, cierre con Esc (`onCancel`) y foco devuelto (`<dialog>` nativo + `close()`) | ✓ | ✓ (probado con Playwright) | ✓ |
| Ojos que siguen al cursor y forma orgánica | ✓ (el contorno cambia despacio) | ✓ (contorno fijo ondulado) | ✓ pero **recargado** (ver T3) |
| API de `Personaje.tsx` igual (`agente`, `className`, `avatar`, mismo viewBox) | ✓ | ✓ | ✓ |
| No tocan `src/app/panel/*`, `globals.css`, `base/`, `src/lib/*`, `detalle.ts` ni `FichasAgentes` | ✓ | ✓ | ✓ |
| Datos solo de `agentes.ts`, `personajes.ts`, `planes.ts` y `detalle.ts` | ✓ | ✓ | ✓ casi (una nota "Para empezar" escrita a mano; dice lo mismo que los datos, pero se desfasa si cambian los planes) |
| Botón principal azul, uno por pantalla | ✓ | ✓ | ✓ |
| Nada de la marca GitHub | ✓ | ✓ | ✓ |
| Tokens de la base (0 colores hex sueltos en `agentes.css`) | ✓ | ✓ | ✓ |
| Movimiento reducido | ✓ (personaje quieto + regla global de la base) | ✓ | ✓ |
| `npm run lint` | ✓ | ✓ | ✓ |

Nota para el integrador (no es culpa del Grupo 3): en las tres, la barra trae "Pruébalo" como botón azul relleno. Entonces casi todas las pantallas con botón principal propio muestran dos azules. El plan pide "Pruébalo" en estilo sutil; eso le toca al Grupo 6.

---

## G3-T1 · La fila de funciones de la portada de GitHub — 8.33

**1. Fidelidad (9).** En el inicio está la composición más reconocible de GitHub: píldoras con relleno blanco cuando están activas, un solo panel de vidrio con halo que no se mueve, el texto a la izquierda y el producto en la ventana con los tres puntos a la derecha. En `/agentes`, la barra local translúcida que se queda pegada es la de Apple. En la página de cada agente: display 64/425, etiquetas en Mono y planes en una tarjeta ancha con divisiones. Se ve como el sitio de GitHub, no como un dashboard.

**2. No genérico (8).** Cada canal se ve como lo que es: WhatsApp en burbujas, Clara como **hilo de correo** (remitente, "desde tu correo", hora) y la entrega de Iris como **adjunto** (`precios-laser.xlsx`). Es el detalle más "de Atendel" de las tres propuestas. `/agentes` va en zigzag y la página del agente cambia de formato en cada bloque. Le resta que "Los otros tres agentes" son tres tarjetas iguales, y que el inicio es casi idéntico al de T3, o sea que la idea base no es exclusiva.

**3. Errores de CLAUDE.md (8).** Los personajes no se recargaron: sin saltito, sin sombra, sin respiración, solo ojos, parpadeo y contorno lento. Las secciones largas llevan fondo liso (lección 11). Nada dice "Menú". Pero en el encabezado de `/agentes` y en el héroe de cada agente las partículas pasan **encima del texto**: un triángulo sobre "para ver su ficha" en 1440, un tetraedro sobre el lema y sobre "ATENDEL MAX" en 390, y un triángulo sobre el botón "Ver su ficha" en la página de Lola en 1440.

**4. Claridad (8.5).** Es la que mejor contesta lo que pregunta el dueño. El inicio dice qué hace, en qué plan viene y lleva a la ficha o a su página. En la página del agente, el botón azul "Háblale a Lola" se ve sin bajar, y "Pídele algo a Lola" (con las sugerencias reales) lo lleva al chat.

**5. Celular (8).** La barra de píldoras pegada funciona bien y la ✕ de la ficha mide 44px. En contra:
- El encabezado de `/agentes` pone a los cuatro personajes grandes en 2×2 y ocupa unos 800px antes del primer contenido.
- En el inicio, la ficha corta y la conversación van en el mismo panel, así que el panel mide unos 1500px de alto.
- La fila de píldoras corta a "Iris" en el borde sin ninguna señal de que se puede deslizar.

**6. Acabado (8.5).** Los estados se ven cuidados: hover solo con puntero fino, presión con escala y salida de la ficha más rápida que la entrada. La ficha frost es tan transparente que los colores de los personajes de atrás se ven como manchas detrás del texto, en 390 y en 1440.

**Código:**
- `VitrinaAgentes` usa `Pestanas` en modo controlado con su propio `role="tabpanel"`, pero las pestañas no lo enlazan (`aria-controls`). Ya lo pidió a la base (pedido 5).
- `NavAgentes` usa `aria-current="true"`; lo indicado aquí es `"location"`.
- Cada personaje de 44px o más corre su propio `requestAnimationFrame`, sin parar mientras se ve. T2 y T3 usan un solo ciclo para todos.
- En las capturas, la píldora pegada se lee "Victor". El código usa `a.nombre` ("Víctor"), así que puede ser solo la compresión del JPEG, pero hay que confirmarlo en pantalla.

## G3-T2 · Cada agente como perfil de GitHub — 7.92

**1. Fidelidad (8).** El perfil es fiel al de GitHub: retrato grande con filo, nombre 40/460, "bio", botón a todo lo ancho, datos con íconos, "Trabaja con" como organizaciones y pestañas con contador ("Lo que hace 5"). Pero es una pantalla del **producto** de GitHub, no de su sitio público. La guía pide que el sitio público siga la portada de GitHub.

**2. No genérico (8.5).** Es la idea más original. El hilo de conversación con avatar, sello **"Agente"** (como el sello "bot") y el evento final sobre la línea del hilo se siente producto de verdad. "Ya se conecta a tu correo" (Clara) contra "Por ahora, la pruebas en el chat" sale del dato `conectado` y es honesto. En contra: las cuatro secciones de `/agentes` repiten exactamente la misma estructura.

**3. Errores de CLAUDE.md (7.5).** Las partículas pasan **detrás de todo el texto de lectura**: en la columna del perfil hay un triángulo sobre "Viene con Atendel One", y lo mismo en las secciones de `/agentes` y en el lema del perfil en 390. El propio trabajador lo reconoce y lo deja (pedido 3). Rompe la lección 11 en las páginas más largas. Los personajes, en cambio, están bien cuidados: pupilas, parpadeo y nada más.

**4. Claridad (7.5).** Ver el perfil se entiende sin explicación. Pero en `/agentes/lola` la conversación, que es lo que más convence, queda escondida en la pestaña "Ejemplo", y los planes en "Plan". Un dueño que no toca las pestañas no ve a Lola trabajar. En 1440, las pestañas cortas dejan media pantalla vacía.

**5. Celular (8).** La cabecera del perfil es compacta, con los botones a todo lo ancho. En la ficha, **las acciones van arriba**, justo después del lema, con la nota de "llega con One; mientras, Clara gratis". Es la mejor ficha en celular de las tres. El índice pegado desliza bien. Lo que la baja son las partículas sobre el texto.

**6. Acabado (8).** El hilo, las insignias y los íconos son finos. En modo claro, la tarjeta del inicio es blanco sobre blanco con un borde, muy plana (lección 9). `TarjetasAgentes` y `CarruselEquipo` quedan sin uso. No se borraron, bien, pero el integrador tiene que decidir qué hacer con ellos.

## G3-T3 · `/agentes` como GitHub Docs — 7.67

**1. Fidelidad (8.5).** Es GitHub Docs muy bien hecho: índice lateral con la línea azul de 4px de Primer, títulos con línea fina, nota con borde izquierdo y anterior/siguiente. Se ve profesional. Pero es la documentación de GitHub, no su portada.

**2. No genérico (8).** La tabla "Quién hace qué" (4 agentes × 3 planes + mensajes al mes) y el índice que abre las subsecciones del agente actual son estructuras propias, nada de plantilla. En contra:
- La conversación de Clara se ve como burbujas de chat, no como correo.
- Hay rótulos repetidos: "Conversación de ejemplo" como título, luego un subtítulo y luego "CONVERSACIÓN DE EJEMPLO · WHATSAPP" dentro del marco.
- El inicio es prácticamente el mismo de T1.

**3. Errores de CLAUDE.md (6.5).** Los personajes **se recargaron**: respiran, se inclinan, tienen sombra elíptica y un **degradado** de color "para dar volumen". El historial dice que se simplificaron ("menos adornos, más personalidad en el movimiento"), y la guía dice que los degradados son solo atmósfera. En modo claro, la sombra gris bajo Lola e Iris se ve sucia. Además, en tres capturas Lola sale con los **ojos cerrados** (`agentes-cabeza-390` claro y oscuro, `agente-lola-cabeza-390-claro`). Probablemente es el parpadeo cazado en la foto, pero se lee como los ojos entrecerrados que el dueño rechazó. Y las partículas siguen encima del texto del encabezado, igual que en T1.

**4. Claridad (8).** La tabla responde de un vistazo "¿con qué plan tengo a quién?", y la nota "Para empezar" lo resume. Es lo más útil para decidir de las tres propuestas. Pero hay mucho texto tipo manual y el tono es más técnico.

**5. Celular (7.5).** El encabezado compacto, con los 4 personajes en fila y el botón visible sin bajar, es lo mejor de las tres en celular. La fila de píldoras pegada centra la sección activa. Pero **en `agentes-tabla-390` la fila de "Mensajes al mes" se ve corrida**: "30" queda bajo One, "600" bajo Max y "3,000" no aparece. En el código, la celda oculta `tabla-ag__que` del pie parece correcta, así que hay que verificarlo en pantalla. Tal como está la captura, le da un dato falso al dueño.

**6. Acabado (7.5).** Las tablas son accesibles (caption, `scope`, texto para lectores en palomitas y rayas) y el índice usa `aria-current` bien puesto. En contra: el ciclo de animación nunca se detiene mientras hay un personaje grande a la vista, porque redibuja el contorno en cada cuadro, y eso gasta batería en el celular. También están los rótulos repetidos y el texto de planes escrito a mano.

---

## Mejores ideas de las demás para pasar a T1

**De T2:**
1. **Acciones arriba en la ficha**, en celular y en escritorio: el principal "Empezar gratis" o "Probar a Clara gratis", "Su página" y "Ver precios", con la nota "llega con …" justo debajo del lema. En T1 hay que bajar hasta el final para actuar.
2. **Sello "Agente"** junto al nombre del agente en las burbujas, con avatar del personaje y hora en Mono, como el sello "bot" de GitHub. Combina bien con los canales que T1 ya distingue.
3. **Datos honestos con íconos de contorno** en la cabecera de cada agente y en la ficha: canal; "Viene con Atendel One"; "Ya se conecta a tu correo" (solo Clara, dato `conectado`) o "Por ahora, la pruebas en el chat".
4. **Los cuatro personajes encimados**, como el grupo de avatares de un equipo, arriba del título del inicio.
5. En "En qué plan viene": la lista "Lo que trae Atendel Max" sacada de `planes.ts` y el "Próximamente" donde todavía no hay precio.
6. Debajo de la conversación: "¿Quieres ver cómo contesta a lo que tú le escribes? **Escríbele en el chat →**".

**De T3:**
1. La **tabla "Quién hace qué"** (agentes × planes + mensajes al mes) en `/agentes`, entre el encabezado y la primera sección, revisando que la fila del pie quede alineada en 390.
2. La **nota "Para empezar"** con borde izquierdo, generada desde `PLANES` y no escrita a mano.
3. **Encabezado compacto en celular**: los 4 personajes en una fila de ~64px con "Toca a cualquiera para abrir su ficha", en lugar del 2×2 grande.
4. **Anterior / siguiente** al final de la página de cada agente, junto a "Los otros tres agentes" o en su lugar.
5. **Transición con dirección** en el panel del inicio: entra desde el lado de la pestaña elegida (8px + opacidad, 0.4s, curva de entrada).
6. La píldora "Desde Atendel One" junto al nombre de cada sección, y el ancla "#" al pasar el cursor por los títulos.

## Lo que T1 debe corregir antes de integrarse

1. **Partículas sobre el texto** en el encabezado de `/agentes` y en el héroe de `/agentes/[agente]` (lección 11). Hay que bajar la densidad ahí, o dejar una zona limpia o un velo suave detrás del bloque de texto y de los botones.
2. **Encabezado de `/agentes` en celular**: pasar de 2×2 grandes a una fila compacta (idea 3 de T3) para que el contenido llegue antes.
3. **Ficha**:
   - Subir la opacidad o el desenfoque del frost para que los colores de atrás no manchen el texto, con contraste AA asegurado.
   - Subir las acciones (idea 1 de T2).
4. **Inicio en celular**:
   - Agregar un desvanecido en el borde de la fila de píldoras para que se note que se desliza.
   - Acortar el panel, por ejemplo con la conversación primero o las capacidades más compactas.
5. **Accesibilidad**:
   - Enlazar las pestañas del inicio con su panel (`aria-controls` y `aria-labelledby`, pedido 5 a la base).
   - Cambiar `aria-current="true"` por `"location"` en `NavAgentes`.
6. **Rendimiento de los personajes**: un solo ciclo de animación para todos que se detenga cuando no hay nada que mover, como en T2. `/agentes` llega a tener 8 o más personajes animados.
7. Confirmar en pantalla que la píldora pegada dice **"Víctor"** con acento.
8. En las capturas completas de 390 (también en T2), el encabezado de la página aparece repetido al final. Seguramente es un error de la captura, pero conviene confirmar en un teléfono que nada se duplica con el fondo fijo y el scroll suave.
9. Al integrar:
   - Borrar las reglas viejas `.ficha*` de `globals.css`.
   - Crear los tokens que pidió (tamaños de personaje, `--ancho-lectura`, `--ancho-ventana`, escalas de entrada y de presión).
   - Coordinar con el Grupo 6 que "Pruébalo" de la barra quede en estilo sutil, para que haya un solo azul por pantalla.
