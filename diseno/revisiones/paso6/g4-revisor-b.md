# Paso 6 · Grupo 4 (Informativas) · Revisor B

Revisé en modo ligero, sin levantar servidores, sin hacer build y sin tomar capturas nuevas.

- Leí `CLAUDE.md` (lecciones 1–13 y reglas anti-genéricas), `diseno/guia.md`, `diseno/github/DESIGN.md`, `diseno/plan.md` (secciones 4–7 y `/para-quien-es`), el encargo `/home/user/wt/g4-encargo.md` y la entrega de cada trabajador.
- Miré con Read todas las capturas de 390 (oscuro y claro) y las de 1440 oscuro de las tres propuestas. Las páginas completas de `/para-quien-es` las partí en tramos para poder leerlas; solo las recorté, no tomé capturas nuevas. De **G4-T2** miré las 30 que tocaban (sus 10 vistas en 390 oscuro, 390 claro y 1440 oscuro), no solo las 2 que su trabajador revisó.
- Leí el código de cada worktree contra la base `3da8ec7`: `QueEs`, `ComoFunciona`, `ParaQuien`, `Seguridad`, `src/app/para-quien-es/*` y `informativas.css`. También revisé en la base `Pestanas`, `Acordeon`, `MarcoNavegador`, `Seccion` y la regla global de foco y de movimiento reducido.
- `npm run lint` pasa sin avisos en los tres worktrees.

---

## 1. Verificaciones obligatorias

| Verificación | G4-T1 | G4-T2 | G4-T3 |
|---|---|---|---|
| Las 4 secciones **no** repiten patrón | ✅ asimétrica → línea de tiempo centrada → pestañas a la izquierda → tarjeta ancha centrada | ⚠️ **3 de 4 son "texto a un lado + marco de producto al otro"** (Qué es, Cómo funciona ×3, Seguridad en espejo) | ✅ composiciones distintas, pero las 4 llevan el mismo encabezado alineado a la izquierda y 3 son rejillas separadas por líneas (pasos 3 col., tareas 2×2, garantías 3 col.) |
| Datos reales (nada inventado) | ✅ todo sale de `detalle.ts`, `contenido.ts`, `planes.ts`; Iris sin hora ("CHAT") | ⚠️ la tarjeta **"Permisos de tu cuenta"** inventa una pantalla que no existe en el producto, con permisos por agente ("Lola · Por su cuenta", "Víctor · Te consulta primero"). Está marcada "Ejemplo", pero no es el producto real | ✅ honesto: Iris con "—" y "Sin hora" para lectores de pantalla |
| Marca de borrador en `/para-quien-es` | ✅ (y en las pestañas del inicio) | ✅ (y en el acordeón) | ✅ (y en las pestañas) |
| Enlace a `/preguntas#seguridad` | ✅ | ✅ | ✅ |
| `Seguridad.tsx` reutilizable | ✅ `variante="preguntas"` | ✅ `variante` (cambia el id del título) | ✅ `variante` + prop `id`: la más flexible |
| `Personaje.tsx` sin cambios | ✅ | ✅ | ✅ |
| Un solo botón principal azul por pantalla | ✅ (el único del inicio es "Aprobar y enviar", dentro de la muestra) | ✅ (ninguno en el inicio) | ✅ (ninguno en el inicio) |
| Tokens de la base | ✅ sin hex sueltos | ✅ sin hex sueltos | ✅ sin hex sueltos |
| No tocó archivos de otros grupos | ✅ | ✅ | ✅ |
| Legibilidad sobre las partículas | ✅ los bloques de `/para-quien-es` llevan fondo propio | ✅ fundido en `.inf-cuerpo` | ✅ fundido de 96px en `.pqe-cuerpo`. Ojo: sus capturas del inicio se tomaron **sin** la escena 3D, así que ahí no está demostrado |
| Lint | ✅ | ✅ | ✅ |

### Defectos comunes a las tres (vienen de la base; no los resto)
1. **Letra del sistema dentro de las muestras de producto.** `.producto` y `.t-app` usan `--font-producto` (`-apple-system… Arial`). En las capturas se ve claramente: burbujas, "Aprobar y enviar", "Dar visto bueno" y las conversaciones salen en Arial/Helvetica. La **lección 13** pide Mona Sans en todo, también en el chat. Hay que corregirlo en la base al integrar. Pesa más en G4-T2, que tiene más marcos de producto.
2. **Dos botones azules en la primera pantalla de `/para-quien-es`:** el "Pruébalo" relleno de la barra (Grupo 6) y "Habla con los agentes". Lo tiene que ajustar el Grupo 6.
3. En 390, las partículas sueltas de la escena pasan por encima del texto de la entrada de `/para-quien-es` en las tres propuestas: lo comparten con la escena de la base.

---

## 2. G4-T1 · "Ritmo de la portada de GitHub, fiel al plan"

**Qué hizo.**
- **Qué es:** columnas asimétricas. A la izquierda los 4 personajes en fila, el título y el texto. A la derecha, el panel de vidrio "Hoy en la recepción", con un sello Mono por agente ("CORREO · 09:40"), una frase y el resultado en una ficha ("Martes 17:00 · cita cambiada", `precios-laser.xlsx`).
- **Cómo funciona:** línea de tiempo vertical con números Mono. El paso 2 muestra los 4 agentes en píldoras. El paso 3 lleva una muestra **interactiva**: Víctor espera tu visto bueno, y se puede Editar (área de texto, Esc cancela), Guardar, Aprobar (estado "cargando"), ver "Enviado" y Repetir; el foco se cuida y los cambios se anuncian con `aria-live`.
- **Para quién es:** pestañas en píldora. Por negocio: la frase con su marca de borrador y el enlace; al lado, la lista dividida por 1px con personaje, área y **plan** ("Desde One", "Desde Free", "En Max", calculado de `planes.ts`).
- **Seguridad:** la tarjeta de vidrio ancha del plan, con las 3 garantías separadas por 1px y el enlace al pie.
- **`/para-quien-es`:** una barra de píldoras que se queda fija (con `aria-current` y desplazamiento sin animación si se pidió movimiento reducido). Un bloque por negocio que alterna de lado: texto y tareas de un lado; del otro, **una conversación real de `detalle.ts` en marco de navegador**, rotulada "Ejemplo con X · nombres ficticios".

**Lo mejor.** Es la única que cumple el plan pieza por pieza y la que más producto real enseña sin inventar nada. El feed de Qué es responde de un vistazo a "¿qué me resuelve?". El plan de cada agente al lado de su tarea es justo lo que un dueño se pregunta ("¿esto viene en mi plan?"). La muestra del visto bueno es la más completa en estados.

**Defectos.**
- En 390, las fichas del feed se cortan con puntos suspensivos: "Viernes 12:00 · de prospecto a…" y "Reporte de septiembre · Excel…" (`.inf-resultado` con `truncate`).
- Las fichas de resultado tienen borde y alto de control, así que en celular parecen botones, pero no hacen nada.
- En 390, la 4.ª píldora ("Negocios de servicios") queda cortada ("N…") y nada indica que la fila se desliza. En la barra fija de `/para-quien-es` pasa al revés: al moverse quedan ocultas las primeras.
- La pestaña de la conversación de Iris repite el nombre: "Iris · Chat con Iris".
- Seguridad (título centrado + 3 columnas con ícono, título y texto) es el momento más cercano al patrón genérico, aunque el plan lo pidió así y va en una sola tarjeta.
- Código: `QueEs.tsx` se vuelve componente de cliente solo por `useRevelado`; `colorAgente` está duplicado en `QueEs` y `ParaQuien`; `ComoFunciona` importa el hook desde `QueEs`.
- `/para-quien-es` mide 7,474px en 390: cuatro conversaciones completas son mucho en celular.

**Notas**
1. **Fidelidad a GitHub + Apple: 9.** Vidrio de 24px, halo suave, encabezados de sección, píldoras, marcos de producto y sellos Mono como en la portada de GitHub, con el aire de Apple. Lo que falla es la letra de sistema en las muestras, que viene de la base.
2. **No genérico: 8.** Todo el contenido es concreto (Andrea, Mariana, Paola, el reporte de septiembre) y el ritmo alterna izquierda, centro, izquierda, centro. Le resto por la Seguridad casi de plantilla.
3. **Errores de CLAUDE.md: 8.** Respeta aire, modo claro con #f6f8fa, legibilidad y "un protagonista". Le resto por las fichas cortadas y con apariencia de botón, por algo de caja dentro de caja en el feed y por tener dos halos más vidrio (bien dosificados, pero hay que vigilarlos con la lección 13).
4. **Claridad para el dueño: 9.** Lo que pasa hoy, en qué plan está cada agente, el visto bueno que puede probar y una conversación por tipo de negocio. Es la más fácil de entender.
5. **Celular: 8.** La línea de tiempo y la tarjeta apilada funcionan bien y la barra fija ayuda. Le resto por las fichas cortadas, la píldora escondida y la página larga.
6. **Acabado: 8.** Estados completos en la muestra (cargando, deshabilitado, Esc, foco, aria-live), `aria-current` y movimiento reducido. Le resto por los detalles de código y el rótulo duplicado.

**Promedio G4-T1: 8.3**

---

## 3. G4-T2 · "El producto explica cada sección"

**Qué hizo.**
- **Qué es:** a la izquierda Lola y el texto; a la derecha, un marco `atendel.mx/panel` con pestañas Actividad / Pendientes / Citas y una bitácora con insignias de color ("Correo enviado", "Cita creada", "De prospecto a cita", "Reporte listo").
- **Cómo funciona:** los 3 pasos, **cada uno con su miniatura** (Entrar con correo y "Link enviado"; "Tu equipo" con "En tu equipo" y "+ Agregar"; la respuesta de Lola "sin enviar" con Enviar / Editar). Son textos reales del login y de MisAgentes.
- **Para quién es:** acordeón dentro de una tarjeta de vidrio, con los 4 personajes encimados en cada fila. Al abrir, una caja interna con las tareas y "Desde X".
- **Seguridad:** el marco "Permisos de tu cuenta" a la izquierda y las garantías en lista a la derecha.
- **`/para-quien-es`:** bloques alternados de texto con un marco "Tu equipo · X" que repite las mismas tareas del inicio.

**Lo mejor.** La idea de que cada paso se vea en pantalla le habla bien a un dueño: el paso 1 muestra el login real con "Revisa tu correo. Sin contraseñas.". El acordeón deja ver los 4 negocios a la vez en celular, y la frase "Abre tu tipo de negocio y mira qué le toca a cada agente" orienta.

**Defectos.** Revisé las 30 capturas: no hay nada roto, pero sí problemas de fondo.
- **Patrón repetido:** "texto + marco de producto" en Qué es, en los 3 pasos y en Seguridad (en espejo). Es justo lo que el encargo prohibía: "no repitas el mismo patrón". En Cómo funciona compiten **tres marcos**: no hay un solo protagonista.
- **Muchas cajas, y cajas dentro de cajas** (lecciones 3 y 13). Para quién es apila tarjeta de vidrio → acordeón → caja interna → renglones. En 390 eso deja la columna de texto en unos 230px, con tareas de 4 a 5 líneas. "Negocios de servicios" se parte en dos líneas.
- **Controles falsos.** Los botones de las miniaturas ("+ Agregar", "Enviar", "Editar", el campo "tu@correo.com") son `<span>`, y las pestañas "Pendientes" y "Citas" del marco de Qué es no hacen nada. Un dueño que las toca en el celular no obtiene respuesta. Ninguna muestra es interactiva.
- **La pantalla de permisos no existe** en el producto (ver la tabla de verificaciones).
- **"Desde Max"** para Víctor e Iris: Max es el plan más alto, así que "En Max" es más preciso (así lo resolvió T1).
- **Largo en 390:** Cómo funciona mide 1,883px y Seguridad 1,623px; las 4 secciones suman unos 6,700px, contra unos 5,100 de T1 y unos 4,860 de T3.
- `/para-quien-es` repite tal cual el contenido del acordeón del inicio cuatro veces, sin ejemplo propio de cada negocio.
- Muchas insignias de color (verde, azul, ámbar, gris) en dos secciones: se pasa del "nada muy exagerado".
- Código: `components/inicio/*` importa `Revelar` desde `app/para-quien-es/` (dependencia al revés). La letra de sistema de los marcos pesa más aquí.

**Notas**
1. **Fidelidad a GitHub + Apple: 7.** Los marcos de producto son de GitHub, pero tantos juntos hacen que se lea como un dashboard y no como la portada. Hay poco aire de Apple.
2. **No genérico: 6.** El contenido es concreto, pero llenar cada sección de pantallas de mentira es un recurso muy visto en páginas hechas con IA, y el patrón se repite.
3. **Errores de CLAUDE.md: 5.** Choca con la lección 3 (cajas), con la 13 (minimalismo y Mona Sans en el producto), con "un protagonista por pantalla", con "no repetir patrón", con "producto real" (permisos inventados) y con "estados en todo lo interactivo" (controles que parecen tocables y no responden).
4. **Claridad para el dueño: 7.** Las miniaturas explican bien los pasos, pero la densidad, los controles muertos y "Desde Max" confunden.
5. **Celular: 6.** Es larga, con texto angosto por las cajas anidadas y muchos marcos seguidos.
6. **Acabado: 6.** El revelado y el movimiento reducido están bien hechos y el acordeón es el accesible de la base. Le resto por la dependencia invertida, los controles dibujados y que el trabajador no revisó sus capturas.

**Promedio G4-T2: 6.2**

---

## 4. G4-T3 · "GitHub con la calma de Apple, pocas cajas"

**Qué hizo.**
- **Qué es:** frase de 48px a lo ancho, con halo; abajo, los 3 párrafos originales y la lista "Un día en la recepción" con la hora en Mono como guía, separada por líneas, sin tarjeta.
- **Cómo funciona:** encabezado partido y los 3 pasos **en fila** en escritorio (número Mono sobre una línea). El paso 3 ocupa doble ancho con la muestra "Pendientes de tu visto bueno": el borrador de Lola con contorno punteado y "Dar visto bueno" ↔ "Ver de nuevo", con el foco cuidado y `aria-live`.
- **Para quién es:** pestañas a la izquierda y una rejilla 2×2 separada por líneas.
- **Seguridad:** banda #151a22 con la declaración a la izquierda, el enlace a la derecha y las 3 garantías en columnas.
- **`/para-quien-es`:** índice "En esta página" fijo a la izquierda (`aria-current`); en celular, píldoras que se acomodan en dos filas y se ven las 4. Cada negocio pone "un agente al frente" con su personaje grande y su tarea como frase, alternando de lado, y abajo el resto del equipo.

**Lo mejor.** Es la más sobria y la que mejor responde al "minimalismo, nada exagerado" del 16 oct. La lectura en celular es la más limpia y la más corta. Los revelados al bajar van solo en CSS (`animation-timeline: view()` dentro de `@supports` y `no-preference`). Es honesta con la hora de Iris. La entrega es la más cuidadosa (pedidos a la base, choque con `.equipo`, `id` en Seguridad).

**Defectos.**
- **Se aparta del plan aprobado:**
  - Cómo funciona va en fila horizontal, no en "línea de tiempo vertical".
  - Qué es no tiene el panel de vidrio ni el personaje en el encabezado.
  - Seguridad es una banda, no "una sola tarjeta de vidrio ancha".

  Puede convencer, pero el dueño pidió "literalmente GitHub", y sin las tarjetas de vidrio se parece más a Apple o Linear que a la portada de GitHub.
- **Uniforme:** las 4 secciones abren igual (etiqueta y título grande a la izquierda) y 3 son rejillas separadas por líneas. Por separado son distintas; seguidas se sienten del mismo molde.
- **Menos producto:** `/para-quien-es` no enseña ninguna conversación ni muestra del producto, y no dice en qué plan está cada agente (le falta información útil para el dueño).
- **"Agente al frente"** (Clara en clínicas, Víctor en estéticas, Iris en consultorios, Lola en servicios) es una interpretación editorial. No inventa datos, pero el dueño la tiene que aprobar.
- Agrega punto final a los títulos ("…personas.", "…lo suyo.", "…servicios."): cambia el texto de siempre, aunque sea por estilo.
- **Nombres de clase cortos sin prefijo** (`.dia`, `.paso`, `.pasos`, `.visto`, `.negocio`, `.tarea`, `.tareas`, `.garantia`): hoy no chocan con las ganadoras de G1, G2, G3 ni G7 (G7-T5 sí usaba `.negocio__*`), pero son un riesgo con lo que falta (G5, G6).
- Sus capturas del inicio se tomaron sin la escena 3D: no demuestran legibilidad sobre las partículas.

**Notas**
1. **Fidelidad a GitHub + Apple: 7.** Usa bien los materiales de GitHub (Mono, píldoras, marco, halo, líneas de 1px), pero renuncia al vidrio y a los encabezados de sección. Le sobra Apple y le falta GitHub.
2. **No genérico: 8.** Es sobria, tipográfica y propia. Le resto por la uniformidad de las aperturas y por el punto final, un gesto muy de plantilla Apple.
3. **Errores de CLAUDE.md: 8.** Cumple aire, minimalismo, modo claro, legibilidad y "un protagonista". Le resto por la letra de sistema en la muestra (base), la falta de prueba con partículas y la menor densidad útil (lección 12).
4. **Claridad para el dueño: 8.** Se lee muy fácil, pero le falta el plan por agente y un ejemplo de producto por negocio.
5. **Celular: 9.** Es la más limpia y corta, con las 4 píldoras del índice a la vista. Solo la pestaña 4 del inicio queda cortada, como en T1.
6. **Acabado: 8.** Revelado sin JavaScript, foco, `aria-current` y `aria-live` bien resueltos. Le resto por los nombres sin prefijo y por los cambios al plan sin consultar.

**Promedio G4-T3: 8.0**

---

## 5. Calificaciones

| Criterio | G4-T1 | G4-T2 | G4-T3 |
|---|---|---|---|
| 1. Fidelidad a GitHub (afinado con Apple) | 9 | 7 | 7 |
| 2. Que no parezca hecho por IA ni genérico | 8 | 6 | 8 |
| 3. Evita los errores de CLAUDE.md | 8 | 5 | 8 |
| 4. Claridad para un dueño de clínica | 9 | 7 | 8 |
| 5. Calidad en celular | 8 | 6 | 9 |
| 6. Acabado y detalle | 8 | 6 | 8 |
| **Promedio** | **8.3** | **6.2** | **8.0** |

## 6. Ganadora: **G4-T1**

Por poco sobre T3. Es la que cumple el plan pieza por pieza, la más parecida a GitHub y la que mejor le explica a un dueño de clínica qué hace Atendel con datos reales: el feed del día, el plan de cada agente, el visto bueno que se puede probar y una conversación real por tipo de negocio. T3 es más sobria y mejor en celular, pero se aparta del plan y enseña menos producto. T2 queda atrás por las cajas, los controles falsos y el patrón repetido.

## 7. Mejores ideas concretas de las demás (para llevar a G4-T1)

**De G4-T3**
1. **Revelado al bajar solo con CSS** (`@supports (animation-timeline: view())` + `prefers-reduced-motion: no-preference`, en `informativas.css` de T3). Sustituye a `useRevelado`, así `QueEs.tsx` vuelve a ser componente de servidor. Ya está en los pedidos a la base de T3 (`.entra-al-bajar`).
2. **Prop `id` en `Seguridad`**, además de `variante`, para que el Grupo 5 la monte en `/preguntas` sin ids repetidos.
3. **Píldoras que se acomodan en dos filas en celular** (índice de T3): aplicarlo a la barra de `/para-quien-es` y a las pestañas del inicio en 390 para que "Negocios de servicios" no quede escondida. Otra opción es poner un desvanecido en el borde que avise que se desliza.
4. **Seguridad con la declaración a la izquierda y el enlace a la derecha** (encabezado partido) en lugar del título centrado + 3 columnas. Rompe el único momento casi de plantilla de T1 sin quitar la tarjeta de vidrio que pide el plan.
5. **Nombrar la muestra como el dashboard**: pestaña "Pendientes de tu visto bueno", igual que la pestaña del Grupo 7, para que el sitio enseñe el producto que de verdad existe.
6. Hora de Iris con `—` y "Sin hora" en `sr-only` (T1 hoy pone "CHAT" sin hora: está bien, pero conviene unificar el formato del sello).

**De G4-T2**
7. **La línea de instrucción** de Para quién es: "Abre tu tipo de negocio y mira qué le toca a cada agente.". Ponerla, adaptada a pestañas ("Elige tu tipo de negocio…"), debajo del título de T1.
8. **Microtextos reales del producto en los pasos 1 y 2** ("Revisa tu correo. Sin contraseñas.", "En tu equipo"), como un sello Mono pequeño junto al paso y **no** como marco completo, para no sumar cajas.
9. Los **estados con color solo en insignias pequeñas** ("Cita creada", "Correo enviado") como remate de cada fila del feed, en lugar de las fichas con borde que parecen botones. Usarlo con medida: una por fila.

## 8. Lo que la ganadora (G4-T1) debe corregir

1. **Mona Sans en las muestras de producto** (lección 13). La muestra del visto bueno y las conversaciones usan `.producto` / `.t-app`, que salen en la letra del sistema. Se corrige en la base (`--font-producto`); si la integración no lo hace global, forzar Mona Sans en `.inf-visto` y `.inf-chat`.
2. **Fichas del feed cortadas en 390** ("de prospecto a…", "Excel…"): quitar `truncate` y dejar que bajen de línea, o acortar el texto.
3. **Fichas que parecen botones:** quitarles el borde y el alto de control, o volverlas texto con ícono o insignia (idea 9).
4. **Pestañas y barra fija en 390:** que se vea que hay una 4.ª opción (idea 3).
5. **Seguridad:** romper la simetría título centrado + 3 columnas con íconos (idea 4) o, como mínimo, confirmarlo con el dueño.
6. **Rótulo duplicado** "Iris · Chat con Iris" → "Iris · Chat".
7. **Código:**
   - sacar `useRevelado` de `QueEs.tsx` (idea 1) para que la sección no sea de cliente;
   - dejar un solo `colorAgente`;
   - agregar la prop `id` a `Seguridad` (idea 2).
8. **`/para-quien-es` en 390** (7,474px): en celular, mostrar la conversación recortada (2 o 3 mensajes y la nota final) o plegable.
9. **"Aprobar y enviar" en azul principal:** cumple la regla (es el único del inicio y no comparte pantalla con la portada ni con Precios), pero hay que comprobarlo al integrar con la sección de Precios del Grupo 5. Si comparten pantalla en algún alto, pasarlo a `sutil`.
10. **Comprobar los dos halos y el vidrio con la escena 3D activa** (sus capturas no lo dejan claro), para que sigan discretos y el texto legible (lecciones 7, 11 y 13).

**Para la integración (cualquiera que gane):** pedir al Grupo 6 que el "Pruébalo" de la barra no sea azul relleno, porque en `/para-quien-es` hay dos botones azules en la primera pantalla. Si se rescatan piezas de T3, renombrar sus clases con prefijo (`inf-`) antes de juntarlas.
