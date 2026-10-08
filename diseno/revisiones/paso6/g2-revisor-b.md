# Paso 6 · Grupo 2 (Chat de los agentes) · Revisor B

Revisé las 5 propuestas sin haber construido ninguna y sin leer al revisor A.

**Cómo lo revisé**
- De cada una leí `diseno/entregas/g2-tN.md`, miré sus capturas de `diseno/capturas/paso5/g2-tN/` y revisé el código que cambió (`git diff 1c23d2f --stat`, `chat.css`, `ChatDemo.tsx`, `ChatEnMarco.tsx`, `pruebalo/page.tsx`).
- Compilé y levanté cada una, **una por una**, en el puerto 3293. Tomé mis propias capturas en las mismas condiciones para todas: la sección del chat en el inicio y `/pruebalo`, en 1440×900 y 390×844, en oscuro y en claro.
- También probé lo básico en `/pruebalo`: escribir y enviar un mensaje a Lola, abrir el menú "/" y abrir "Nuevo grupo", en computadora y en celular (en celular, además, abrir la lista de chats).
- Están en `diseno/capturas/paso6/g2-revisor-b/` (`g2-tN-inicio-*`, `-pruebalo-*`, `-int-*` y `-vivo-*`).
- Para que la escena 3D no trabara el navegador, tomé casi todo con movimiento reducido. Además grabé una corrida con movimiento normal (`-vivo-`) para ver el guion "en vivo" del inicio de T1, T2, T4 y T5 (T3 no se reproduce solo).
- Las 5 compilan. Ninguna marcó errores en la consola y ninguna se sale de lo ancho en 390px.
- `/panel/chat` pide sesión. Ahí solo pude juzgar con las capturas de cada trabajador, que salen de una página de prueba con datos falsos.

**Dos aclaraciones antes de calificar**
- Las cinco salieron del commit 1c23d2f, antes de la decisión del dashboard del 8 de octubre. Por eso no resto puntos por el violeta en "Enviar" ni por Mona Sans a 16px: eso se ajusta al integrar. Sí califiqué qué tan bien encaja cada una como la vista **"Conversaciones"** del dashboard; esa columna va aparte y no entra al promedio.
- Criterio rector: **la prioridad número uno del dueño es que se vea como GitHub, profesional y nada genérico.** La lección que más pesa en este grupo es la 3: el chat anterior se veía feo porque eran "puros cuadrados y cajas".

## Calificaciones

| Criterio | T1 · Mesa de trabajo | T2 · Lo que quedó hecho | T3 · Línea de revisión | T4 · Hilo de trabajo | T5 · Míralo trabajar |
|---|---|---|---|---|---|
| 1. Fidelidad al estilo de GitHub (producto) | **9** | 8 | **9** | **9** | 7 |
| 2. Que no parezca hecho por IA ni genérico | **8** | **8** | 7 | **8** | 7 |
| 3. Evita los errores de CLAUDE.md | 8 | 7 | 5 | **9** | 6 |
| 4. Claridad para un dueño de clínica | **9** | **9** | 7 | 8 | **9** |
| 5. Calidad en celular | 7 | 6 | 7 | 7 | **9** |
| 6. Acabado y detalle | **9** | 7 | 7 | 8 | 8 |
| **Promedio** | **8.33** | **7.50** | **7.00** | **8.17** | **7.67** |
| *Encaje como vista "Conversaciones" del dashboard (no entra al promedio)* | *9* | *8* | *5* | *8* | *8* |

Orden: **T1 (8.33)** › T4 (8.17) › T5 (7.67) › T2 (7.50) › T3 (7.00).

## Ganadora: G2-T1 · "La mesa de trabajo de la recepción"

T1 gana por poco sobre T4. Es la que mejor se ve como **un producto de GitHub** y la que mejor sirve de base para la vista "Conversaciones" del dashboard.

**Cómo se ve**
- Tres zonas, como una página de GitHub con su barra lateral:
  - la lista de chats, con la barra de 4px en el chat abierto, contadores grises y un buscador;
  - la conversación;
  - una columna de detalles con **Integrantes**, **Lo que quedó hecho** y **Acciones**.
- Lo que dice el agente va **sin caja**: personaje, nombre, su área en una etiqueta con borde, la hora en Mono y el texto debajo.
- Lo tuyo va en una burbuja neutra. La única caja del hilo es la que trae un resultado: "CITA CONFIRMADA" o "CITA CAMBIADA". Así resuelve la lección 3 sin perder estructura.

**Por qué es clara para el dueño**
- La columna "Lo que quedó hecho" tiene estados (Hecho · Programado · Espera tu visto bueno) y le dice al dueño de la clínica, sin leer el hilo, qué dejaron resuelto sus agentes.

**Por qué es la mejor base para el dashboard**
- Las columnas aparecen según el ancho del propio chat (consultas de contenedor), no según la ventana. Dentro del dashboard, con el menú lateral ocupando 240–272px, el chat se acomoda solo: debajo de 1080px esconde los detalles y debajo de 720px deja solo la conversación.
- Usa los tokens de la base, así que al pasar al tamaño de producto (14px) se adapta con el ámbito de tokens del dashboard.

**Acabado**
- Es la más cuidada:
  - buscador con estado vacío;
  - menú "/" con título en Mono y una barra en la opción elegida;
  - foco visible;
  - números tabulares.
- En el inicio, el guion se reproduce solo (`g2-t1-vivo-a-1440-oscuro.jpg`): Sofía escribe → "Lola está escribiendo…" en la lista y en la cabecera → aparece la cita confirmada → a la derecha se va llenando "Lo que quedó hecho". Si la persona toca el chat, el guion se completa y el chat queda listo para escribir.

**Sus puntos débiles**
- Hay información repetida: las acciones aparecen tres veces.
- En celular hay dos íconos de hamburguesa juntos.
- En celular el chat queda como una cajita dentro de la página.
- Todo está en "Problemas que la ganadora debe corregir".

**Por qué no T4:** T4 es igual de profesional y más tranquila, y sale mejor en la lista de errores de CLAUDE.md. Pero tiene dos columnas, se acomoda según la ventana y no según su contenedor, y no tiene un lugar que resuma lo que quedó hecho. Para la vista del dashboard habría que construirle justo lo que T1 ya trae. Sus mejores ideas (la línea de tiempo y los relevos entre agentes) se le pueden pasar a T1 solo con estilos.

## Justificación por propuesta

### G2-T1 · La mesa de trabajo — 8.33
- **GitHub (9):** reúne el vocabulario de producto de GitHub:
  - fila elegida con la barra de 4px;
  - contador redondo gris ("GRUPOS 2", "AGENTES 4");
  - etiqueta con borde para el área ("Clientes", "Atención"), como "Owner";
  - barra lateral de detalles como la de un issue;
  - horas en Mono y bordes de 1px.

  Se nota en `g2-t1-pruebalo-b-1440-oscuro.jpg`. Le falta la barra de dirección en el marco: solo tiene los tres puntos y las pestañas.
- **No genérico (8):** "Lo que quedó hecho" con estados y "Espera tu visto bueno" es propio de Atendel, no un adorno. Las pestañas del marco ("Lola · WhatsApp"…) sí abren el chat de cada agente. No hay tarjetas en serie ni íconos en círculos.
- **CLAUDE.md (8):**
  - Cumple lo importante: resuelve la lección 3, encabezado con el personaje de Lola, un solo violeta (en "Enviar"), nada inventado (las cifras salen del guion de 1c23d2f), nada quitado y "deslizar para borrar" recuperado en el panel.
  - Resto por la información repetida: `/agendar`, `/confirmar`… salen como sugerencias, en la columna "Acciones" y en el menú "/". Es la clase de cosa que hace sentir "cajas sin intención".
- **Claridad (9):** la columna derecha le explica al dueño el valor del producto en una mirada (cita hecha, reseña programada, nota en la ficha). El título es concreto: "Les escribes como a tu recepcionista y se reparten el trabajo". Lo único que resta claridad es que en el inicio las tres columnas son mucha información junta.
- **Celular (7):** funciona. La lista entra como cajón, el menú "/" y "Nuevo grupo" caben (`g2-t1-int-*-390-*`). Lo que no está bien:
  - el botón de la lista es **otra hamburguesa** al lado de la del sitio;
  - el chat queda en un marco de ~590px dentro de la página, con el encabezado arriba;
  - las pestañas se cortan ("Clara · Co");
  - en "Nuevo grupo" el pie se trunca ("Elige a d…").
- **Acabado (9):** estados de hover, foco, presionado, deshabilitado, cargando, vacío (buscador sin resultados) y error (en el panel). Además: consultas de contenedor, diálogo con foco atrapado, `role="log"` en el hilo y transiciones de 0.2s con las curvas de la base.
- **Encaje en el dashboard (9):** es la única pensada para vivir en un contenedor de cualquier ancho, y su columna de detalles es el patrón exacto de GitHub para una vista de detalle.

### G2-T2 · Ellos contestan, tú ves lo que quedó hecho — 7.50
- **GitHub (8):** marco con barra de dirección (`atendel.mx/panel/chat`), lista con barra de selección y contadores, agente sin caja y burbuja neutra. Se ve más apretado que T1: el texto del hilo va a 14px y los personajes del hilo son muy chicos (~24px) (`g2-t2-pruebalo-1440-oscuro.jpg`).
- **No genérico (8):** la mejor idea de todo el grupo:
  - el panel **Resultado** con la tarjeta de la cita ("VIE 10:00"), la bandeja resumida o el mensaje por aprobar;
  - un botón **"Dar visto bueno"** que vuelve acción la promesa de Atendel (`g2-t2-pruebalo-accion-1440-oscuro.jpg`, del trabajador);
  - la pestaña "Así lo ve tu paciente", donde el visitante le escribe a Lola como si fuera paciente.
- **CLAUDE.md (7):**
  - El encabezado del inicio no lleva personaje (la guía lo pide).
  - El inicio ya no monta el chat con grupos: es un componente aparte (`EnVivo.tsx`) y los grupos quedan solo en `/pruebalo`. Lo avisa, pero son dos chats que mantener.
  - En celular, "Nuevo grupo" se corta (abajo).
- **Claridad (9):** "Ellos contestan. Tú ves lo que quedó hecho." más una tarjeta de resultado es lo más fácil de entender para un dueño de clínica.
- **Celular (6):**
  - En 390, la ventana "Nuevo grupo" queda encerrada en el marco y **no se ven los botones Cancelar/Crear grupo**. Pasa en mi captura (`g2-t2-int-nuevogrupo-390-claro.jpg`) y en la del propio trabajador (`pruebalo-grupo-390-claro.jpg`).
  - El texto de ayuda del campo se corta ("…escríbele a Lola como si").
  - Lo que sí queda bien: en el inicio, el panel Resultado baja debajo de la conversación.
- **Acabado (7):**
  - La columna Resultado deja mucho espacio vacío bajo la tarjeta.
  - "Ver de nuevo" queda suelto al pie.
  - A favor: el gris cálido de la burbuja en claro (lección 9) y la ventana de grupo con los cuatro personajes ("¿Quiénes trabajan juntos?").
- **Encaje en el dashboard (8):** el panel Resultado y "Dar visto bueno" conectan directo con la pestaña "Pendientes de tu visto bueno" del dashboard. Las columnas dependen sobre todo de la ventana.

### G2-T3 · La conversación como línea de tiempo de revisión — 7.00
- **GitHub (9):** es la más literal. Es la conversación de un pull request: comentarios con cabecera #151a22, eventos sobre la línea vertical, tu avatar junto al campo de escribir y la dirección que cambia con `?con=lola` (`g2-t3-int-respuesta-1440-oscuro.jpg`).
- **No genérico (7):** los eventos ("**Lola** movió la cita de **Carla Díaz** · MAÑANA · 16:00 → 17:00") cuentan el trabajo real. Pero la composición es el molde de GitHub copiado tal cual. La fila de "tres claves" bajo el marco es el patrón de 3 columnas con ícono en círculo.
- **CLAUDE.md (5):**
  - Es la que más arriesga la lección 3: **cada mensaje es una caja con cabecera.** Con jerarquía, sí, pero el dueño ya rechazó los "puros cuadrados y cajas" (`g2-t3-pruebalo-b-1440-claro.jpg`).
  - El evento de cita es un **ícono dentro de un círculo verde relleno**.
  - En la lista, la vista previa **se corta en seco, sin puntos suspensivos** ("…para que no le ll", "3 ya contestarc"). La regla `text-overflow: ellipsis` está en `.charla__conv-vista`, que es `display: flex`, y ahí no aplica.
- **Claridad (7):** los eventos explican bien qué hizo cada agente. Pero la metáfora de "revisión de código" y tanta caja hacen pesada la lectura para alguien que no es técnico.
- **Celular (7):** las cajas caben. La lista se abre con un ícono de panel lateral (no otra hamburguesa). En "Nuevo grupo" los botones quedan medio cortados abajo (`g2-t3-int-nuevogrupo-390-*`).
- **Acabado (7):** limpia y con tokens. Resto por:
  - el corte de la vista previa;
  - casillas casi nativas en "Nuevo grupo";
  - la ruta de prueba `pruebalo/vista-panel` que se queda en el código (solo responde con `VISTA_PANEL=1`).
- **Encaje en el dashboard (5):** como vista "Conversaciones", un hilo de revisión se siente más gestor de tareas que conversación. Lo que vale la pena llevarse son los eventos.

### G2-T4 · El hilo de trabajo — 8.17
- **GitHub (9):**
  - Línea de tiempo de 2px con los personajes y los eventos encima.
  - Etiquetas de estado de Primer en las tarjetas ("✓ Confirmada" en verde, "Espera tu visto bueno").
  - Teclas `Enter`, `Shift Enter`, `@`, `/` bajo el campo, como en GitHub.
  - Barra de dirección y pestañas en el marco.

  Se ve en `g2-t4-inicio-b-1440-oscuro.jpg` y `g2-t4-vivo-a-1440-oscuro.jpg`.
- **No genérico (8):** el relevo "**Lola** le pasa el seguimiento a **Víctor**" cuenta lo que hace distinto a Atendel: los agentes se pasan el trabajo. Además, la tarjeta del WhatsApp programado cita el mensaje textual.
- **CLAUDE.md (9):** la más limpia del grupo:
  - encabezado con los cuatro personajes arriba (como pide la guía);
  - agentes sin caja; solo los resultados en tarjeta;
  - nada quitado: el fondo de partículas se conserva en `/pruebalo`;
  - "deslizar para borrar" vuelve, también para grupos;
  - en celular usa un ícono de mensaje, no una segunda hamburguesa;
  - nada inventado.
- **Claridad (8):** la historia se entiende (Sofía escribe → Lola agenda → Víctor da seguimiento → tú das el visto bueno) y abajo hay una línea en Mono "01 Lola agenda · 02 Víctor da seguimiento · 03 Tú das el visto bueno". Le falta un resumen de resultados como el de T1 o T2: hay que leer el hilo.
- **Celular (7):** funciona y la ventana de grupo se puede desplazar. Pero el chat sigue encerrado en el marco dentro de la página, la etiqueta de la tarjeta se trunca ("WHATSAPP…") y las sugerencias se salen por la derecha.
- **Acabado (8):**
  - Los dos personajes de la pestaña "Recepción" quedan pegados al texto.
  - El menú "/" es una lista simple, sin título.
  - El título de `/pruebalo` (24px/600) queda más chico que en el resto del sitio, aunque le sirve al dashboard.
- **Encaje en el dashboard (8):** dos columnas, fácil de meter. Pero se acomoda según la ventana, no según su contenedor.

### G2-T5 · Míralo trabajar — 7.67
- **GitHub (7):** `/pruebalo` está muy bien: estilo de chat de asistente de GitHub, agente sin caja, burbuja neutra con la hora dentro (`g2-t5-pruebalo-b-1440-oscuro.jpg`). Pero el momento protagonista, la escena del inicio, es un **chat con burbujas tipo WhatsApp**, y la composición "texto a la izquierda + pasos con palomitas + maqueta a la derecha" es de página de aterrizaje SaaS más que de GitHub (`g2-t5-inicio-1440-oscuro.jpg`).
- **No genérico (7):** la cita que **cae en el hueco de las 10:00 de la agenda** es muy de Atendel. Pero el acomodo general del inicio es un patrón muy visto, y las palomitas van en círculos celestes rellenos.
- **CLAUDE.md (6):**
  - **Quitó el fondo de partículas de `/pruebalo`** (`<Sitio fondo="ninguno">`) y no lo avisa en su entrega. Es un mueble.
  - El inicio ya no lleva el chat con grupos (eso sí lo avisa).
  - La escena del inicio vuelve a las burbujas en caja.
  - Agrega huecos "Ocupado" en la agenda que no estaban en el guion. Son relleno de demostración, pero son datos nuevos.
- **Claridad (9):** los tres pasos sincronizados con la escena ("Sofía escribe por WhatsApp → Lola le contesta → La cita queda en tu agenda") y la agenda son lo más claro para alguien que nunca ha usado algo así. En el campo de escribir se ven **"/ Acciones" y "@ Mencionar"** como botones: no hay que adivinar los atajos.
- **Celular (9):** la mejor del grupo:
  - en `/pruebalo` el marco desaparece y el chat ocupa la pantalla como una app;
  - la lista es una pantalla aparte que regresa con "‹ 3";
  - "Nuevo grupo" es una hoja que sube desde abajo;
  - respeta la zona segura de abajo.

  Un detalle: la hoja se ancla al chat y no a la pantalla, así que si el chat no está a la vista, sale a medias (`g2-t5-int-nuevogrupo-390-claro.jpg`).
- **Acabado (8):**
  - A favor: controles Pausar / Seguir / Repetir (necesarios para contenido que se mueve solo); "Crear grupo" deshabilitado con el motivo ("Falta el nombre del grupo"); buena accesibilidad.
  - En contra: al empezar, la escena deja un gran hueco vacío arriba del primer mensaje (`g2-t5-inicio-b-390-oscuro.jpg`), y en la pestaña sobra un espacio ("Lola ·WhatsApp").
- **Encaje en el dashboard (8):** en computadora, dos columnas limpias. Su manera de hacer el celular es justo lo que el dashboard necesita.

## Mejores ideas concretas de las demás (para pasarle a T1)

**De T4**
1. **La línea de tiempo vertical** de 2px con los personajes como nodos, en vez de personajes sueltos. Le da a T1 el sello de GitHub sin agregar cajas.
2. **Los eventos de relevo** sobre la línea: "**Lola** le pasa el seguimiento a **Víctor** · 10:03".
3. **Etiquetas de estado de Primer en las tarjetas de resultado:** "✓ Confirmada" (éxito), "Espera tu visto bueno" (atención) y "Listo". Ya existen en la base los colores de estado del dashboard.
4. **La tarjeta del mensaje programado** que cita el WhatsApp textual con una raya a la izquierda y el sello "WHATSAPP · SÁBADO".
5. **El encabezado del inicio con los cuatro personajes** en fila (T1 solo pone a Lola).
6. **El ícono de mensaje** para abrir la lista en celular, en lugar de una segunda hamburguesa.

**De T2**

7. **Un botón "Dar visto bueno"** en lo que espera aprobación, dentro de "Lo que quedó hecho". En el dashboard se conecta con la pestaña "Pendientes de tu visto bueno".
8. **"Así lo ve tu paciente"**: en la pestaña de Lola del inicio, dejar que el visitante le escriba como paciente.
9. **Un punto azul de "resultado nuevo"** en el botón que abre los detalles cuando la columna está escondida.
10. **La tarjeta de cita con bloque de fecha** ("VIE / 10:00") y "Lo hizo Lola · Atención" al pie.
11. **La barra de dirección** `atendel.mx/panel/chat` en el marco.

**De T5**

12. **El celular como app:** en `/pruebalo` y en el dashboard, sin marco, chat a `100dvh`, la lista como pantalla aparte con "‹ 3", "Nuevo grupo" como hoja desde abajo (anclada a la pantalla) y la zona segura.
13. **"/ Acciones" y "@ Mencionar" visibles** dentro del campo de escribir.
14. **La agenda donde "aterriza" la cita.** Sirve para la columna derecha del dashboard ("Próximas citas") o como tarjeta de "Lo que quedó hecho".
15. **Pausar / Repetir** para el guion del inicio.
16. **"Crear grupo" deshabilitado diciendo por qué** ("Falta el nombre del grupo").

**De T3**

17. **Eventos en vivo tras una acción:** al usar `/confirmar`, aparece "**Lola** envió **12 recordatorios** por WhatsApp · 10 CONFIRMARON · 1 PIDE CAMBIO · 1 SIN RESPUESTA". Es la forma más honesta de mostrar trabajo hecho.
18. **Agrupar mensajes seguidos de la misma voz** en un solo bloque, con la hora entre ellos.

## Problemas que la ganadora (T1) debe corregir

1. **Dos hamburguesas en celular.** El botón que abre la lista de chats usa el mismo ícono ≡ que el menú del sitio. Cambiarlo por el ícono de mensaje o de panel lateral (como T2, T3 y T4); dentro del dashboard, usar el cajón del propio dashboard.
2. **Acciones repetidas tres veces** (sugerencias sobre el campo, columna "Acciones" y menú "/"). Quitar la sección "Acciones" de la columna derecha o las sugerencias. En el inicio, dejar en la columna solo "Integrantes" y "Lo que quedó hecho": un solo momento protagonista.
3. **El celular como cajita.** En `/pruebalo` y en la vista del dashboard, adoptar la idea de T5: sin marco, chat a pantalla completa, lista como pantalla aparte, "Nuevo grupo" como hoja anclada a la pantalla.
4. **"Espera tu visto bueno" usa el color de enlace.** Pasarlo al tono de atención (#d29922 / #9a6700) y darle un botón "Dar visto bueno" (idea de T2).
5. **Adaptarlo a la decisión del 8 de octubre:**
   - "Enviar" y el botón principal pasan al azul (#0071e3), no al violeta;
   - dentro del dashboard, pila de letra del sistema a 14px/1.43;
   - radios de 8px en botones y 12–16px en paneles;
   - sombra solo en el menú "/" y en la ventana "Nuevo grupo";
   - el violeta queda solo en los personajes.
6. **Pequeños cortes de texto:** "Elige a d…" al pie de "Nuevo grupo" en 390, y las pestañas del marco cortadas sin indicación ("Clara · Co"): agregar un desvanecido al borde o dejar que se desplacen a la pestaña activa.
7. **Demasiadas etiquetas de "demostración":** la insignia "DEMO" en la cabecera, el recuadro "DEMOSTRACIÓN" al pie de la lista y la nota del inicio. Dejar una sola, bien puesta.
8. **Marco sin barra de dirección** en el inicio y en `/pruebalo`; las otras cuatro la tienen. No es obligatoria, pero ayuda a que se lea como "el producto real".
9. **`/panel/chat` sin probar con sesión.** Al integrar, probar con una cuenta real la respuesta que va llegando, los errores de red, el aviso del límite del plan y "deslizar para borrar" en un teléfono de verdad (el trabajador lo dice con honestidad).
10. **Limpieza al integrar:** borrar el bloque viejo `.chat-app*` de `globals.css` que ya no se usa. Conservar solo `.chat-app__puntos`, que usa `portadas/ConversacionEnVivo.tsx`.
