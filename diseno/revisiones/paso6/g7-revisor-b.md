# Paso 6 · Grupo 7 (Dashboard: panel y /pruebalo) · Revisor B

Revisé las 5 propuestas sin haber construido ninguna y sin leer al revisor A.

**Cómo lo revisé**
- De cada una leí su entrega (`diseno/entregas/g7-tN.md`), miré sus capturas de `diseno/capturas/paso5/g7-tN/` (sobre todo las del panel, que pide sesión) y revisé el código que cambió (`git diff f305a7c --stat`, `dashboard.css`, `Panel.tsx`, `MisAgentes.tsx`, `ArmazonPanel`, la página de `/pruebalo`).
- Compilé y levanté cada una, **una por una**, en el puerto 3293. Tomé mis propias capturas de `/pruebalo` en las mismas condiciones para todas: 1440×900, 1024×768 y 390×844 (como teléfono táctil), en oscuro y en claro.
- Probé la interacción con un mismo guion para las cinco (Playwright, `/tmp/rev-g7b/captura.mjs`):
  - abrir el menú del avatar y cerrarlo con Esc (revisando que el foco regrese al botón) y con un clic afuera;
  - abrir el menú "+" y los avisos;
  - la tecla "/";
  - 14 pasos con Tab, midiendo el anillo de foco;
  - ir a Conversaciones (revisando que no recargue la página), escribir y enviar un mensaje en el PromptBar, abrir su menú "/" y "Nuevo grupo";
  - volver a Resumen y cambiar de pestaña;
  - en 390: abrir el cajón y cerrarlo con Esc y con ✕, y abrir perfil, "+", avisos y Conversaciones.
- Revisé que el inicio (`/`) cargue en cada rama y anoté la consola de `/pruebalo` y de `/`.
- **Consola:** en las 5, `/pruebalo` dio **cero errores y cero advertencias** en todos los anchos y modos, sin errores de hidratación. En `/` solo sale la advertencia de rendimiento de WebGL del Chromium sin GPU ("GPU stall due to ReadPixels"), que no es de las propuestas.
- **Ancho:** ninguna se sale de lo ancho en 390, 1024 ni 1440.
- **Panel:** `/panel` pide sesión. Lo juzgué con las capturas de la vista temporal de cada trabajador y con el código. No creé rutas temporales; al terminar cada propuesta, `git status` quedó limpio y borré `.next`.
- **Lo que las cinco cumplen en el código:** ninguna tocó `globals.css`, `base/*`, `ChatDemo`, `PromptBar` ni `panel/chat/*`. Ninguna usa colores sueltos (cero hex/rgba en `dashboard.css`), peso 700 ni `transition: all`.
- **Lo que las cinco conservan en el panel:** el modo de prueba de Clara (con la misma llamada a `/api/agente-correo/prueba` y los 3 correos de ejemplo), Gmail, el historial, el uso del plan y "Mis agentes" guardando en `agentes_elegidos`. **Ninguna deja al usuario cambiar su plan**: solo hay enlaces a precios.

**Un hallazgo que separa a las propuestas (menús transparentes)**
- En **T2, T3 y T5**, los menús desplegables (perfil, "+", avisos y resultados de búsqueda) dejan **leer el contenido de atrás a través del panel**, sobre todo en modo claro y en celular.
  - Ejemplos: `g7-t2-perfil-390-claro`, `g7-t3-avisos-390-claro`, `g7-t5-perfil-390-claro`, `g7-t2-buscador-lola-1440-oscuro` y `g7-t5-avisos-1440-oscuro`.
- **T1 y T4** lo detectaron y lo corrigieron, y explican la causa en su entrega:
  - un menú con desenfoque (`backdrop-filter`) metido dentro de la barra, que también lleva desenfoque, en Chrome ya no desenfoca la página de atrás;
  - T1 pone sólidos los menús de la barra; T4 lleva el vidrio de la barra a un `::before`.
- En mis capturas sus menús se leen limpios.
- **Ojo:** mi Chromium corre sin GPU, así que conviene confirmarlo en un navegador normal. Aun así, el arreglo de T1/T4 lo quita de raíz y la base lo necesita: la composición de `/base` tiene el mismo problema.

## Calificaciones

| Criterio | T1 · Fiel a GitHub | T2 · El GitHub que respira | T3 · Pendientes primero | T4 · El negocio en cuadritos | T5 · Teclado o pulgar |
|---|---|---|---|---|---|
| 1. Fidelidad al dashboard de GitHub + refinamiento de Apple | **9** | 8 | 8 | **9** | **9** |
| 2. Que no parezca hecho por IA ni genérico | 8 | 7 | **9** | 7 | 8 |
| 3. Evita los errores de CLAUDE.md | 8 | 7 | **8** | **8** | 7 |
| 4. Claridad para un dueño de clínica | **9** | 8 | **9** | 7 | 8 |
| 5. Calidad en celular y tableta | 8 | 7 | 7 | 7 | **9** |
| 6. Acabado y detalle (estados, menús, claro/oscuro) | **9** | 6 | 7 | 8 | 7 |
| **Promedio** | **8.50** | **7.17** | **8.00** | **7.67** | **8.00** |

Orden: **T1 (8.50)** › T3 (8.00) = T5 (8.00) › T4 (7.67) › T2 (7.17).

### Pruebas de interacción (mismo guion para las 5)

| Prueba | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| Perfil: abre, Esc cierra y el foco vuelve al avatar, clic afuera cierra | ✔ | ✔ | ✔ | ✔ | ✔ |
| Menú "+" | ✔ (con ▾ y contorno) | ✔ | ✔ | ✔ | ✔ (en 390 sube como hoja) |
| Avisos | ✔ | ✔ | ✔ | ✔ | ✔ (en 390, hoja) |
| ¿El menú tapa bien lo de atrás? | **Sí** | **No** | **No** | **Sí** | **No** |
| "/" | Enfoca el buscador | Enfoca el buscador | Enfoca el buscador | Enfoca el buscador | Abre la paleta de comandos |
| Foco visible con Tab (anillo azul de 2px) y "Saltar al contenido" primero | ✔ | ✔ | ✔ | ✔ | ✔ |
| Conversaciones sin recargar la página | ✔ `#conversaciones` | ✔ `?vista=` | ✔ `#` | ✔ `#` | ✔ `?vista=` |
| PromptBar: enviar, respuesta de guion, menú "/" | ✔ | ✔ | ✔ | ✔ | ✔ |
| "Nuevo grupo" del chat | ✔ | ✔ | ✔ | ✔ | ✔ |
| Atajo "Nuevo grupo" del lateral o del "+" | Abre el chat de Recepción, no el diálogo | El "+" dice "Se arma desde Conversaciones" (honesto) | Solo lleva a Conversaciones | Solo lleva a Conversaciones | **Abre el diálogo de verdad** |
| ¿El chat cabe en 1440×900? | Sí | Sí | **No** (la página baja 213px y el PromptBar queda cortado) | Sí | Sí, exacto |
| Cambiar de pestaña en Resumen | ✔ | ✔ | ✔ | ✔ | ✔ |
| Cajón en 390: abre, Esc cierra con foco de vuelta, ✕ cierra | ✔ | ✔ | ✔ | ✔ | ✔ |
| Errores de consola en `/pruebalo` e inicio sin errores | 0 / ✔ | 0 / ✔ | 0 / ✔ | 0 / ✔ | 0 / ✔ |

## Justificación por propuesta

### G7-T1 · "La más fiel a la estructura del dashboard de GitHub" — 8.50

1. **Fidelidad: 9.** Es la que más se lee como el dashboard de GitHub con sesión iniciada (`g7-t1-resumen-1440-oscuro`, `-resumen-completa-1440-oscuro`):
   - la miga "Atendel / Resumen";
   - el buscador en píldora con "/";
   - "+ ▾" y la campana con contorno, como en GitHub;
   - el lateral con la marquita azul en la sección activa, "Tus agentes" con su estado y "Grupos" con "Nuevo";
   - el feed con quién, verbo, **objeto en negritas** y hora relativa, y el objeto incrustado debajo (la cita, el mensaje, el archivo);
   - los eventos iguales agrupados y desplegables ("Ver cómo contestaron 6");
   - "Agentes fijados", con el nombre en azul y su área en etiqueta, como los repositorios fijados;
   - las novedades en línea de puntos con fechas, y un pie mínimo.

   Lo de Apple se nota en el aire, los radios de 12 y 16px, el saludo grande, las tarjetas blancas sobre #f5f5f7 en claro (`-resumen-1440-claro`) y la sombra solo en lo que flota.
2. **No genérico: 8.** No hay fila de KPIs arriba. La bienvenida tiene un único botón azul y "Tu día" en tres renglones que llevan a resolver algo. Los datos cuentan la misma historia que el chat de ejemplo (Sofía Ramírez, Carla Díaz, Insumos Médicos del Bajío). Es la más "correcta", pero también la menos atrevida: su fuerza es la ejecución, no una idea nueva.
3. **CLAUDE.md: 8.**
   - **Cumple:** un solo botón principal por pantalla; nada dice "Menú"; los datos de ejemplo están marcados en 3 lugares; las novedades salen del historial real; "Pronto" donde algo no existe; y avisó que quitó `Sitio`.
   - **Le resto** porque también quitó `FichasAgentes` de `/pruebalo`, que es un mueble.
   - **También:** en el panel, la novedad "2 oct · Con Atendel Max decides qué agentes trabajan contigo" no coincide con la lógica, que también deja elegir en One.
4. **Claridad: 9.** "12 citas mañana · 23 correos leídos · 3 cosas esperan tu visto bueno" se entiende de un vistazo. En "Espera tu visto bueno" (`-pestana2-1440-oscuro`) cada borrador dice qué pasa al aprobar ("Al aprobar: Víctor lo manda hoy a mediodía…"), con Aprobar y Deshacer.
5. **Celular y tableta: 8.**
   - **Bien:** el cajón (`-cajon-390-oscuro`) funciona con Esc, ✕ y foco de vuelta; el buscador se abre a lo ancho; los avisos bajan a lo ancho (`-avisos-390-oscuro`); los botones van a ancho completo; en 1024 la columna derecha baja en dos columnas.
   - **Falta:**
     - las pestañas en 390 se cortan ("Destacados" queda a la mitad) y nada indica que se deslizan;
     - en 1024, Conversaciones queda apretada: lateral + lista de chats + conversación (`-conversaciones-1024-oscuro`).
6. **Acabado: 9.**
   - Es una de las dos que tiene los **menús sólidos y legibles** en los dos modos (`-perfil-1440-oscuro`, `-crear-1440-claro`, `-avisos-1440-oscuro`).
   - El buscador agrupa sus resultados (`-buscador-lola-1440-oscuro`).
   - Hay esqueletos de carga, 8 estados vacíos y evento agrupado con despliegue.
   - En el panel: plan Free vacío bien resuelto (`paso5/g7-t1/panel-vacio-completa-1440-claro`), modo de prueba de Clara completo (`panel-correo-1440-oscuro`) y el chat real dentro del armazón en 1440 y 390.

### G7-T2 · "El GitHub que respira" — 7.17

1. **Fidelidad: 8.** La estructura es correcta (`g7-t2-resumen-1440-oscuro`). Pero puso un botón **"Entrar"** en la barra del dashboard, que es de página de marketing y no de app. El "+" no lleva contorno ni flecha, y los títulos del lateral quedan en gris chico, con poca jerarquía.
2. **No genérico: 7.** La banda de tres cifras en la bienvenida (10 de 12 · 23 · 19) y la gráfica de barras de la semana se acercan al "tablero de métricas" de plantilla. Lo bueno: los estados vacíos los "firma" el agente y el "Para ti" muestra un consejo a la vez.
3. **CLAUDE.md: 7.** Datos marcados ("Datos de ejemplo" junto a la sección y "Esto es un ejemplo" en el lateral). Pero la entrega **no avisa** que `/pruebalo` perdió la barra pública, el pie y las partículas, y en el "+" "Agendar cita" queda como "Pronto" en la demo.
4. **Claridad: 8.** "Revisar lo pendiente" como botón principal y "¿Cómo leo esto?" ayudan. La frase "Esta mañana tu equipo…" junto a "Buenas noches" confunde un poco.
5. **Celular y tableta: 7.** El cajón y el apilado están bien (`-resumen-390-oscuro`). Pero el menú de perfil en claro deja leer la bienvenida a través (`-perfil-390-claro`), y las pestañas se cortan.
6. **Acabado: 6.**
   - Los menús son transparentes en los dos modos: perfil (`-perfil-1440-oscuro`: se lee "Clínica Alba" detrás), "+" (`-crear-1440-oscuro`), avisos (`-avisos-1440-claro`) y resultados de búsqueda (`-buscador-lola-1440-oscuro`).
   - En claro, el contador de la pestaña activa casi no se ve (`-pestana2-1440-claro`).

### G7-T3 · "Pendientes primero" — 8.00

1. **Fidelidad: 8.**
   - Barra, lateral y columna derecha están como en GitHub.
   - En el centro, la bandeja "Espera tu visto bueno" usa la página de un pull request (`g7-t3-resumen-1440-oscuro`):
     - "Lo que preparó Víctor" con la forma real del mensaje;
     - "Cómo llegó aquí", con los relevos Iris → Víctor → Lola en una línea de tiempo;
     - la caja de "merge" con revisiones con palomita y "Aprobar y enviar".
   - Es muy GitHub, pero de la parte de "pull request" más que de la del dashboard: el feed de actividad queda en la segunda pestaña.
2. **No genérico: 9.** Es la más propia de Atendel. Convierte la promesa "nada sale sin tu visto bueno" en la pantalla principal y enseña que los agentes son un **equipo** que se pasa el trabajo. La actividad con filtros por agente y "Relevos" (`-pestana2-1440-oscuro`) también es propia.
3. **CLAUDE.md: 8.**
   - Es la única que **conservó `FichasAgentes`** en `/pruebalo`.
   - Avisó la quita de `Sitio`.
   - Tiene un solo botón principal: la bienvenida usa dos sutiles y el azul queda en "Aprobar y enviar".
   - Marca "Datos de ejemplo" en barra, tarjeta y pie.
   - Le resto porque el "+" de Grupos del lateral promete "Nuevo grupo" y solo cambia de vista.
4. **Claridad: 9.** Para un dueño de clínica es la que mejor responde "¿qué tengo que decidir hoy?". En el panel real, "Por revisar" con las sugerencias de Clara y "Ya lo atendí" es muy útil (`paso5/g7-t3/panel-resumen-1440-oscuro`).
5. **Celular y tableta: 7.**
   - Apila bien y el cajón funciona (`-resumen-390-oscuro`).
   - Pero en 390 los avisos en claro dejan leer "Buenos días, Paulina" a través del menú (`-avisos-390-claro`).
   - La bandeja abierta queda larga y la burbuja casi pega a la orilla.
   - En 1024 el bloque "Cómo llegó aquí" queda muy angosto (`-resumen-1024-oscuro`).
6. **Acabado: 7.**
   - Tiene estados muy completos ("Enviando…", Deshacer, editar).
   - Pero los menús son transparentes (`-perfil-1440-claro`, `-avisos-1440-oscuro`).
   - En Conversaciones el chat **no cabe** en 1440×900: la página baja 213px y el PromptBar queda cortado abajo (`-conversaciones-1440-oscuro`, `-chat-slash-1440-oscuro`).

### G7-T4 · "El negocio en cuadritos" — 7.67

1. **Fidelidad: 9.** La cuadrícula de actividad de 26 semanas con "Menos ■■■■ Más" y el filtro por agente (`g7-t4-resumen-1440-oscuro`) es lo más reconocible de GitHub. Todo lo demás también está en su lugar, con menús sólidos (`-perfil-1440-claro`, `-avisos-1440-oscuro`). Pero la cuadrícula viene del **perfil** de GitHub, no del dashboard.
2. **No genérico: 7.** La cuadrícula se arriesga a ser "piel de GitHub" más que algo útil para una clínica. Las minigráficas de "En 30 días" y las cifras por todos lados se sienten de tablero de plantilla. Además compiten tres cosas arriba: la franja azul de demostración, la bienvenida con su botón azul y la cuadrícula. No hay un solo protagonista.
3. **CLAUDE.md: 8.**
   - **Bien:** avisa que quitó las partículas y marca los datos de ejemplo.
   - **La fecha fija** ("Jueves 8 de octubre", para cuadrar con el guion) hace que la demo se vea vieja cualquier otro día, y no cuadra con el saludo, que sí usa la hora real.
   - **En una cuenta nueva** (`paso5/g7-t4/panel-vacio-completa-1440-claro`), la protagonista es una cuadrícula gris vacía que dice "0 tareas".
4. **Claridad: 7.** "5,998 tareas en las últimas 26 semanas" no le dice al dueño qué hacer hoy. Lo que pide acción ("Espera tu visto bueno") queda abajo, después de la gráfica y los fijados (`-resumen-completa-1440-claro`).
5. **Celular y tableta: 7.** El cajón y los menús sólidos funcionan en 390 (`-crear-390-claro`), pero la página mide **5,630px** de alto en celular (`-resumen-completa-390-oscuro`) y la cuadrícula se vuelve una tira que se desliza.
6. **Acabado: 8.** Menús sólidos, la gráfica con navegación por teclado y una tabla gemela ("Ver como tabla"), buenos estados vacíos y cero errores. El "Nuevo grupo" del lateral solo cambia de vista (`-lateral-nuevo-grupo-1440-oscuro`).

### G7-T5 · "Se maneja con el teclado o con el pulgar" — 8.00

1. **Fidelidad: 9.** Tiene la estructura del dashboard, más la búsqueda que abre una **paleta de comandos** al centro, como la búsqueda de GitHub (`g7-t5-buscador-lola-1440-oscuro`): resultados agrupados y teclas visibles. El feed tiene íconos de tipo sobre el personaje y el pie va en la columna derecha, como en GitHub. A las novedades les faltan las fechas.
2. **No genérico: 8.** Lo que la distingue es la capa de manejo: Ctrl K, atajos G+letra, "?", la barra inferior y las hojas en celular. El contenido se parece mucho al de T1.
3. **CLAUDE.md: 7.**
   - **Bien:** un solo botón principal ("Revisar 2 pendientes") y la demo marcada ("Demostración" junto a la sección, "Datos de ejemplo" y el aviso del lateral).
   - **Mal:** la entrega **no avisa** que quitó la barra pública, el pie y las partículas de `/pruebalo`.
   - **También:** dejó en el código dos props "solo para pruebas" (`vistaForzada` en `TableroPanel` e `historialInicial` en `Panel`).
   - **Y:** la línea "Pulsa Ctrl K…" dentro de la bienvenida mete jerga técnica a la vista principal de un dueño no técnico.
4. **Claridad: 8.** Se entiende bien qué pasó y qué falta. Los atajos agregan ruido para quien no usa teclado.
5. **Celular y tableta: 9.** Es la mejor en celular (`-resumen-390-oscuro`, `-crear-390-claro`):
   - barra inferior con Resumen, Chats, +, Agentes y Avisos;
   - "+" y avisos como hojas con manija;
   - el chat esconde la barra inferior para dejar sitio (`-chat-enviado-390-oscuro`).

   Pero el menú de perfil en claro deja leer la bienvenida a través (`-perfil-390-claro`).
6. **Acabado: 7.**
   - **Lo mejor:** la paleta, el "Nuevo grupo" del lateral abre el diálogo de verdad (`-lateral-nuevo-grupo-1440-oscuro`) y el chat cabe exacto en la pantalla.
   - **Lo que resta:** perfil y avisos son transparentes en los dos modos (`-perfil-1440-claro`, `-avisos-1440-oscuro`); la barra inferior también deja ver el contenido detrás.

## Ganadora: G7-T1

Gana T1 por medio punto. Es la que mejor cumple la prioridad número uno del dueño, **"literalmente GitHub, profesional, no genérico, como el GitHub dashboard"**, y la que llega más lista para integrarse:
- es la arquitectura del dashboard de GitHub sin rodeos;
- tiene un solo momento protagonista (la bienvenida con "Tu día");
- el feed incrusta los objetos reales de la clínica;
- de las dos que tienen los menús sólidos, es la que tiene la composición más clara.

T3 y T5 empatan en segundo lugar. T3 tiene la mejor idea de producto y T5 el mejor celular. Las dos fallan en el acabado de los menús, y T3 además en el alto del chat.

## Mejores ideas de las demás para sumar a T1

1. **De T3 — el visto bueno como pull request.** En la pestaña "Espera tu visto bueno" de T1, al abrir un borrador, mostrar:
   - "Lo que preparó" con su forma real;
   - **"Cómo llegó aquí"**, con los relevos entre agentes en una línea de tiempo;
   - una caja tipo "merge", con revisiones con palomita y "Aprobar y enviar".

   También la línea "Nada sale a tus clientes sin tu permiso", "Descartar" con **Deshacer**, y los filtros en píldora por agente y "Relevos" en Actividad.
2. **De T3 — conservar `FichasAgentes` en `/pruebalo`** (el mueble de las fichas, con `?ficha=`).
3. **De T5 — en celular:**
   - barra inferior (Resumen · Chats · + · Agentes · Avisos);
   - "+" y avisos como **hojas** que se cierran deslizando;
   - esconder la barra inferior dentro del chat.

   Antes hay que arreglar la transparencia de esa barra.
4. **De T5 — la paleta de comandos** (Ctrl K, sin acentos, agrupada) como capa opcional encima del buscador de T1, y "Atajos de teclado" en el menú de perfil. Las teclas solo con puntero fino y **fuera** de la tarjeta de bienvenida.
5. **De T5 — que los atajos a "Nuevo grupo"** (lateral y "+") abran el diálogo del chat de verdad. Lo ideal es pedir al Grupo 2 una prop `nuevoGrupo`/`inicial` en el chat ganador, en lugar del clic simulado de T5.
6. **De T5 — que Conversaciones llene la pantalla exacto** (alto del documento = alto de la ventana).
7. **De T4 — la técnica del vidrio en `::before`** para la barra, o el `menu--solido` de T1: pasarlo a la base para que ningún menú vuelva a quedar transparente. Y, si se quiere la cuadrícula de actividad, ponerla en la vista **Agentes** o en Reportes, no como protagonista de Resumen, y con "Ver como tabla".
8. **De T2:**
   - la insignia "Datos de ejemplo" junto al nombre de la sección en la miga;
   - estados vacíos "firmados" por el agente que se va a encargar;
   - que el buscador también encuentre citas y actividad;
   - la dirección con `?vista=` (sirve para atrás y adelante, y para enlazar directo a una vista).

## Lo que T1 debe corregir antes de integrarse

1. **Pestañas en 390:** "Destacados" se corta (`g7-t1-resumen-390-oscuro`). Hay que avisar que se deslizan (difuminado en la orilla) o hacerlas caber.
2. **Atajos de "Nuevo grupo":** el "Nuevo" del lateral y "Nuevo grupo" del "+" abren el chat de Recepción, no el diálogo. Hay que conectarlos al diálogo del chat (ver idea 5) o cambiar el texto para que no prometa otra cosa.
3. **Conversaciones en 1024** queda apretada (lateral de 256 + lista de chats + conversación; `-conversaciones-1024-oscuro`). En tableta: plegar el lateral a íconos o mandar la lista de chats a su botón.
4. **Devolver `FichasAgentes`** a `/pruebalo` (ver la nota de los muebles abajo).
5. **Texto del panel que choca con la lógica:** la novedad "2 oct · Elige a tu equipo: con Atendel Max decides…", cuando el código deja elegir también en One. Además, el encargo decía "solo en Max": que el dueño decida y que texto y lógica digan lo mismo.
6. **Novedades:** "8 oct · Tu panel nuevo" debe llevar la fecha en que de verdad se publique.
7. **Saludo por hora:** usa la hora del navegador. A las 2:14 dijo "Buenos días": revisar los rangos (madrugada → "Buenas noches").
8. **Pedido a la base:** subir el arreglo de menús sólidos dentro de la barra con vidrio (`menu--solido` o vidrio en `::before`) y corregir también la composición de `/base`, que tiene el mismo problema.
9. **Con el chat ganador del Grupo 2 (G2-T4):**
   - quitar la llamada a `NavApp` (hoy devuelve `null`);
   - que el chat llene su contenedor en lugar de `position: fixed` + `contain: layout`;
   - en celular, que no queden dos botones de "lista" seguidos (el del cajón y el de chats, `paso5/g7-t1/panel-conversaciones-390-oscuro`).
10. **Probar en un iPhone real:** el arrastre del cajón, el desenfoque de la barra, la letra del sistema y el área táctil de 44px. Ningún trabajador ni yo pudimos probarlos.

## ¿Quitar de `/pruebalo` la barra pública, el pie y las partículas rompe "conservar los muebles"?

Las cinco sacaron `/pruebalo` de `Sitio`: ya no tiene barra pública, pie público, fondo de partículas 2D ni el scroll suave. T3 fue la única que volvió a montar `FichasAgentes`.

**Mi juicio: está justificado, pero falta cerrarlo bien.**
- **Por qué está justificado:**
  - La actualización del 8 oct de la guía dice que `/pruebalo` **es** el dashboard, con su propia barra fija. Poner la barra pública encima de la barra del dashboard rompería la arquitectura de GitHub que pidió el dueño.
  - Partículas detrás de una app chocan con "sin halos ni degradados en el producto" y con la lección 11 (fragmentos que opacan la pantalla).
  - La escena 3D y la barra pública siguen vivas en todo el sitio público. Nada se borró del proyecto.
- **Lo que sí exige la regla:** "si algo no encaja, se avisa". T1, T3 y T4 lo avisaron en su entrega; T2 y T5 no.

**Cómo lo resolvería la integración:**
1. **Avisarle al dueño explícitamente** que `/pruebalo` ya no lleva la barra pública ni las partículas, y por qué.
2. **Mantener `FichasAgentes`** montado en `/pruebalo` (como T3).
3. **Un camino visible de vuelta al sitio:**
   - "Volver al sitio" en la franja de demostración de T1 (hoy solo tiene "Probarlo de verdad");
   - el pie mínimo con los enlaces públicos (T1 ya tiene Inicio, Agentes, Precios, Preguntas y Tus datos);
   - "Salir de la demostración" en el menú del avatar (T1 ya lo tiene).
4. Que el botón "Prueba los agentes" de la portada lleve directo a `/pruebalo#conversaciones`, para cumplir la promesa de "probar los agentes" en un clic, y que el "Pruébalo" de la barra pública abra el Resumen.

## Mis capturas

En `diseno/capturas/paso6/g7-revisor-b/` (235 archivos JPEG 70). Nombre: `g7-tN-<estado>-<ancho>-<oscuro|claro>.jpg`.

| Estado | Anchos y modos (para T1–T5) |
|---|---|
| `resumen` | 1440, 1024 y 390 · oscuro y claro |
| `resumen-completa` (página entera) | 1440 y 390 · oscuro y claro |
| `perfil` (menú del avatar abierto) | 1440 y 390 · oscuro y claro; 1024 · oscuro y claro |
| `crear` (menú "+") | 1440 y 390 · oscuro y claro; 1024 · oscuro |
| `avisos` | 1440 y 390 · oscuro y claro; 1024 · oscuro |
| `buscador-lola` (después de "/" y escribir "lola") | 1440 · oscuro |
| `foco-tab1`, `foco-tab4`, `foco-tab9` (foco visible con Tab) | 1440 · oscuro |
| `conversaciones` | 1440, 1024 y 390 · oscuro y claro |
| `chat-enviado` (mensaje enviado y respuesta del guion) | 1440 y 390 · oscuro |
| `chat-slash` (menú "/" del PromptBar) | 1440 · oscuro |
| `nuevo-grupo` (primer botón "Nuevo grupo" de la página) | 1440 · oscuro. En T3 y T4 cayó en el atajo del lateral, que no abre nada; el bueno es `chat-nuevo-grupo` |
| `chat-nuevo-grupo` ("Nuevo grupo" dentro del chat) | T3, T4 y T5 · 1440 y 1024 · oscuro |
| `lateral-nuevo-grupo` (atajo del lateral) | T3, T4 y T5 · 1440 · oscuro (en T3 también 1024) |
| `pestana2` (segunda pestaña del Resumen) | 1440 · oscuro y claro |
| `cajon` (cajón en celular) | 390 · oscuro y claro |
| `inicio` (`/` con movimiento reducido) | 1440 · oscuro |

Scripts: `/tmp/rev-g7b/captura.mjs` (fases `estatico`, `escritorio`, `tableta`, `celular`, `inicio`, `extra`) y `/tmp/rev-g7b/lateral.mjs`. Registros: `/tmp/rev-g7b/log-tN-<fase>.txt`.
