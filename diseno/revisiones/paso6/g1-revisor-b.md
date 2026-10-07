# Paso 6 · Grupo 1 (Portada) · Revisor B

Revisé las 5 propuestas sin haber construido ninguna y sin leer al revisor A.
Para cada una leí `diseno/entregas/g1-tN.md`, miré todas sus capturas de
`diseno/capturas/paso5/g1-tN/` y revisé `Portada.tsx`, `portada.css` y lo que
cambió en `escena3d/` (diff contra `d4a1307`). Además construí y levanté cada una
en el puerto 3292 y tomé mis propias capturas en las mismas condiciones
(1440×900 y 390×844, oscuro y claro, arriba y a media pantalla bajando). Están en
`diseno/capturas/paso6/g1-revisor-b/` (`g1-tN-portada-*` y `g1-tN-bajando-*`).
Las 5 compilan, ninguna marca errores en consola y ninguna se desborda a lo ancho
en 390px.

Criterio rector: **la prioridad número uno del dueño es que se vea como el sitio de GitHub.**

## Calificaciones

| Criterio | T1 · Las cuatro esferas | T2 · Mensajes sin contestar | T3 · La recepción a las 23:14 | T4 · El título manda | T5 · Los cuatro te atienden |
|---|---|---|---|---|---|
| 1. Fidelidad al estilo de GitHub | 8 | 7 | 7 | **9** | **9** |
| 2. Que no parezca hecho por IA ni genérico | 6 | 5 | **8** | 6 | 7 |
| 3. Evita los errores de CLAUDE.md | 6 | 6 | 7 | **9** | 6 |
| 4. Claridad para un dueño de clínica | 7 | 6 | **9** | 8 | 8 |
| 5. Calidad en celular | 7 | 6 | 7 | **8** | 7 |
| 6. Acabado y detalle | 7 | 6 | 7 | **9** | 7 |
| **Promedio** | **6.83** | **6.00** | **7.50** | **8.17** | **7.33** |

Orden: **T4 (8.17)** › T3 (7.50) › T5 (7.33) › T1 (6.83) › T2 (6.00).

## Ganadora: G1-T4 · "El título manda"

Es la portada que más se parece a la de GitHub: lienzo negro, halo morado
difuminado, título 64/425 centrado, intro gris perla, formulario en línea, línea
Mono y un polvo de estrellas casi imperceptible. Además, es la única de las cinco que
**no comete ningún error de las lecciones del dueño**: las partículas nunca pasan
por el texto, no brillan, el fondo se queda fijo y abajo se funde con la sección
siguiente sin dejar corte (en las demás, menos T1, se ve una línea dura entre el
negro de la portada y el #0d1117 de la página). El trabajo de detalle es el mejor:
cortes de línea del título decididos a mano en los dos anchos, tracking ajustado
en celular, nombres de los agentes en peso 500 dentro de la intro, condiciones
sacadas de `planes.ts` y todos los valores de los tokens. Su punto débil es que
corre el riesgo de sentirse como plantilla (ver "Problemas").

## Justificación por propuesta

### G1-T1 · Las cuatro esferas — 6.83
- **GitHub (8):** la estructura es la de GitHub (centrado, halo, formulario, Mono). Pero las dos esferas grandes de partículas detrás del título pesan más que la atmósfera de GitHub (`g1-t1-portada-1440-oscuro.jpg`).
- **No genérico (6):** el "logo hecho de partículas detrás del hero" es un recurso muy visto. Lo que sí es propio de Atendel es la leyenda en Mono con un punto de color y el nombre de cada agente, que abre su ficha.
- **Lecciones (6):** en oscuro, las partículas cruzan la intro y la línea "ENTRAS CON TU CORREO, SIN CONTRASEÑA" (lección 11, que el texto siempre se lea). En claro, los tetraedros grises se ven como polvo o mugre sobre el gris cálido (`-1440-claro`). A favor: es la única, junto con T4, que funde la orilla de abajo con `--c-fondo`.
- **Claridad (7):** el título es concreto ("Tu recepción sigue contestando mientras tú atiendes") y la intro menciona el "le escriben a quien faltó a su cita". La leyenda presenta a los cuatro.
- **Celular (7):** la leyenda de dos por dos queda bien. Las esferas no se reconocen a 390px; solo ensucian el fondo.
- **Acabado (7):** entrada escalonada, estados de hover, foco y presionado en la leyenda, área táctil de 44px.

### G1-T2 · Los mensajes sin contestar — 6.00
- **GitHub (7):** arriba se ve un campo de estrellas con halo, cercano a GitHub. La "bandeja" de renglones punteados no tiene equivalente en GitHub.
- **No genérico (5):** en reposo es un fondo de estrellas genérico. La idea de "desorden → orden" no se lee: los renglones parecen líneas punteadas sueltas (`g1-t2-bajando-1440-oscuro.jpg`, `ordenada-390-*`). Un dueño no entendería que eso es una bandeja de entrada.
- **Lecciones (6):** corte duro entre la portada y la sección siguiente, con los puntos cortados en seco. En claro, los puntos grises se ven como suciedad, y en 390 un punto cae sobre la línea Mono ("GORREO" en `bajando-390-claro`). Deja de usar el motor de tetraedros de la escena (el sello de la versión 7) y lo cambia por discos lisos.
- **Claridad (6):** el texto es bueno; la escena no le dice nada al dueño.
- **Celular (6):** deja 192px vacíos al fondo de la primera pantalla. El título termina la primera línea en "se".
- **Acabado (6):** es la más disciplinada con los tokens. Es la única que capturó el estado de error del formulario, recolorea al cambiar de tema con evento + MutationObserver y despeja la columna del texto en el shader. Pero el resultado visual no lo refleja.

### G1-T3 · La recepción a las 23:14 — 7.50
- **GitHub (7):** usa el producto como prueba, que es muy de GitHub. La tarjeta de vidrio de 24px es correcta, pero la muestra no va dentro de un marco de navegador. Los tetraedros son más grandes y más visibles que la atmósfera de GitHub, con algunos muy desenfocados en las orillas (`g1-t3-portada-1440-oscuro.jpg`).
- **No genérico (8):** la más específica de Atendel: Mariana a las 23:14, limpieza facial de $850 (sacada de `detalle.ts`), "Cita apartada · jueves 16:30" en Mono y la leyenda honesta "Viene en Atendel One y Atendel Max" (sacada de `PLANES`).
- **Lecciones (7):** muestra el producto real y no inventa datos. Pero deja un corte duro al final de la portada: su `::after` funde hacia `--c-portada`, el mismo color que ya tiene, así que no hace nada (`bajando-1440-claro`: línea dura entre gris cálido y blanco). Hay tetraedros cerca de la intro en 390.
- **Claridad (9):** la mejor. El dueño ve en 5 segundos exactamente qué pasa con un WhatsApp de noche.
- **Celular (7):** la tarjeta se lee bien. Mientras Lola "escribe", la tarjeta queda medio vacía por el espacio reservado (`inicio-muestra-escribiendo-390-oscuro.jpg`). La muestra no entra en la primera pantalla.
- **Acabado (7):** secuencia "escribiendo → respuesta → cita", rescate sin JavaScript, `figure`/`figcaption`/`time`, enlace "Escríbele tú" con estados. En contra: duplica el chat que viene justo debajo (Grupo 2), así que quedan dos conversaciones seguidas.

### G1-T4 · El título manda — 8.17 (ganadora)
- **GitHub (9):** es la más parecida a github.com: estrellas finas, halo, título 64/425, formulario en línea, Mono 12px. Nada sobra.
- **No genérico (6):** la tipografía está trabajada con oficio (cortes a mano, entrada palabra por palabra, nombres en peso 500), pero la composición en sí es el hero centrado de siempre. Es justo lo que la lección 5 advierte ("se sentía como plantilla"). Le falta un objeto propio de Atendel.
- **Lecciones (9):** partículas pocas y lejos del texto (lecciones 7 y 11), fondo fijo (8), modo claro en gris cálido con polvo lavanda y no gris sucio (9), sin morphs (10), un solo protagonista, transición suave a la sección siguiente en los dos modos (`g1-t4-bajando-*`).
- **Claridad (8):** la intro dice qué hace cada agente por nombre. La línea "ATENDEL FREE · GRATIS · 30 MENSAJES AL MES · ENTRAS CON TU CORREO" da datos reales y útiles.
- **Celular (8):** título en tres líneas parejas ("Que ningún / cliente se quede / sin respuesta") con tracking más abierto. Botones apilados a lo ancho. Un detalle: la línea Mono termina en "MES ·", con el punto colgando al final del renglón.
- **Acabado (9):** todo con tokens, entrada solo con transform y opacity, versión de movimiento reducido, halo que "respira" en 24s, sin corte al pie.

### G1-T5 · Los cuatro te atienden — 7.33
- **GitHub (9):** las mascotas alrededor del título y el horizonte de puntos remiten directo a la portada de GitHub (mascotas y globo). Es la que más "se siente" GitHub a primera vista.
- **No genérico (7):** los personajes hacen trabajo (miran el título y voltean al formulario) y abren su ficha. Aun así, "avatares flotando a los lados del hero" es un recurso común, y el efecto de la mirada casi no se nota en las capturas de foco.
- **Lecciones (6):** compite con el protagonista: cuatro personajes de color, más el título, más un horizonte denso de unos 10,800 puntos (contra la lección 11, "pocas partículas"). Al bajar, el horizonte desaparece y queda un corte duro del negro o gris cálido al fondo de la página (`g1-t5-bajando-1440-claro.jpg`). Usa valores sueltos fuera de los tokens (160ms, 8.5s, 6.2s, 720px), cosa que las instrucciones prohíben. Los personajes no se modificaron (bien).
- **Claridad (8):** presenta al equipo con nombre y oficio; el título "Tu recepción, atendida mientras tú atiendes" juega bien con el nombre Atendel.
- **Celular (7):** la fila de los cuatro arriba del título queda muy bien (foto de equipo). Pero el formulario baja a ~600px y el horizonte casi no se ve.
- **Acabado (7):** hover con el nombre en Mono, foco visible, `aria-label` completo en cada personaje. Pero tiene un ciclo de `getBoundingClientRect` en cada cuadro, valores sueltos y el corte al pie.

## Mejores ideas de las que no ganaron (para incorporar a T4)

1. **T1 · Leyenda de los agentes** bajo el formulario: punto de color de 8px + "LOLA · ATENCIÓN" en Mono, cada uno abre su ficha (área táctil de 44px; en celular, dos por dos). Es el objeto propio de Atendel que le falta a T4 y no compite con el título.
2. **T5 · Fila de los cuatro personajes en celular** arriba del rótulo (y opcionalmente en computadora, chicos, en lugar de flotando a los lados). Si se usa, sin el horizonte denso y con los tiempos en tokens.
3. **T3 · Sello en Mono con dato real** del tipo "CITA APARTADA · JUEVES 16:30" y el enlace "Escríbele tú ↓" al `#en-vivo` del chat: une la portada con la sección siguiente sin duplicar el chat. Recomiendo usar solo el enlace (o una línea de sello), no la tarjeta completa, porque el Grupo 2 ya muestra la conversación justo debajo.
4. **T2 · Recolorear con el evento `EVENTO_TEMA` + MutationObserver** y despejar en el shader la columna del texto (`uColumna`): es una buena protección por si las partículas se acercan al texto en anchos intermedios.
5. **T2 · Captura del estado de error del formulario** sobre la escena: agregarla a la revisión final de T4.
6. **T5 · Título alternativo** "Tu recepción, atendida mientras tú atiendes" o el de T1, "Tu recepción sigue contestando mientras tú atiendes", por si el dueño quiere que el título hable de la recepción. El de T4 ("Que ningún cliente se quede sin respuesta") también es concreto; que lo decida el dueño.

## Problemas que T4 debe corregir al integrarse

1. **Riesgo de plantilla (lección 5):** agregar un solo elemento propio de Atendel que no compita con el título (la leyenda de T1 o la fila de personajes de T5), sin que se vuelva un segundo protagonista.
2. **Línea Mono en celular:** el separador "·" queda colgando al final del renglón ("…30 MENSAJES AL MES ·"). Hay que meter el separador dentro de la pieza que no se corta o esconderlo cuando la línea se parte.
3. **Accesibilidad del título partido en palabras:** al tener un `span` por palabra y `<br>`, hay que confirmar con lector de pantalla que el `h1` se lee como una sola frase (si no, `aria-label` en el `h1` y `aria-hidden` en las piezas).
4. **Halo que respira:** escalar en bucle infinito un elemento con `filter: blur(60px)` cuesta rendimiento. Hay que pausarlo cuando la portada sale de pantalla, o pedir a la base el token `--dur-respiro` y `will-change` controlado. Con movimiento reducido ya se detiene (bien).
5. **Pedidos a la base** de su entrega: `--dur-respiro`, `.halo` con `z-index: var(--halo-z, -1)` y borrar `.escena3d--tenue` de `globals.css` si ya nadie la usa.
6. **Dos violetas en la primera pantalla:** el "Pruébalo" de la barra (Grupo 6) sigue en violeta. No es culpa de T4, pero la portada no cumple "un solo botón principal" hasta que el Grupo 6 lo cambie.
7. **Revisar en una GPU real** el parallax con el mouse y que el polvo no se vuelva invisible en claro (en SwiftShader se ve bien, pero muy tenue).
