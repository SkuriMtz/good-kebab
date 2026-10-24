# Paso 6 · Grupo 2 (Chat de los agentes) · Revisor A

Revisé las 5 propuestas: su entrega (`diseno/entregas/g2-tN.md`), **todas** las
capturas de `diseno/capturas/paso5/g2-tN/` (una por una: 23 + 30 + 33 + 38 + 22) y el
código contra `1c23d2f` (`ChatDemo`, `PromptBar`, `chat/*`, `inicio/ChatEnMarco`,
`pruebalo`, `panel/chat`, `estilos/chat.css`). No modifiqué nada de las propuestas.

Cómo califiqué:
- La prioridad número uno es que se vea como el **producto** de GitHub, profesional y
  nada genérico. Después pesan la lección 3 ("el chat eran puros cuadrados y cajas") y
  las demás lecciones de `CLAUDE.md`.
- Las 5 se hicieron **antes** de la decisión del 8 de octubre (dashboard, acento azul,
  fuente del sistema). Por eso no castigo el violeta del botón de enviar ni el de
  "Crear grupo". Lo que sí cuento es qué tan fácil es meter cada chat como la vista
  **"Conversaciones"** del dashboard.
- El botón "Pruébalo" violeta de la barra es del Grupo 6 y sale igual en las 5. Tampoco
  lo conté.
- **Verificación en vivo:** en la captura `inicio-envivo-1440-claro` de T1, la lista y el
  hilo no coincidían. Levanté T1 en una copia aparte (no en su worktree) y revisé el guion
  en modo claro a los 0, 3, 12 y 20 segundos. **Funciona bien:** la lista y el hilo
  coinciden en todo momento. Lo que falló fue la captura, no el producto.

Funciones que deben seguir, verificadas en el código de las 5: grupos y "Nuevo grupo";
PromptBar con `/` y `@`, enviar que se vuelve detener; "escribiendo…"; `?con=`; el demo
no llama a la IA (ningún `fetch` ni `/api/` en `ChatDemo`, `ChatEnMarco`, `pruebalo`,
`EnVivo` ni `guion`). En el panel siguen `/api/chat`, el streaming, las voces del
grupo, los comandos y el límite del plan. **Deslizar para borrar** volvió en las 5
(T1 y T5 solo en el panel; T2 y T3 en el panel; T4 en el panel y también en el demo).

## Calificaciones

| Criterio | T1 · Mesa de trabajo (3 columnas) | T2 · Canal + panel "Resultado" | T3 · Línea de revisión con comentarios en caja | T4 · Hilo de trabajo (línea de tiempo) | T5 · "Míralo trabajar" + chat estilo Copilot |
|---|:-:|:-:|:-:|:-:|:-:|
| 1. Fidelidad al estilo de GitHub (producto) | 9 | 8 | 9 | 9 | 8 |
| 2. Que no parezca hecho por IA ni genérico | 8 | 9 | 6 | 8 | 8 |
| 3. Evita los errores de CLAUDE.md | 8 | 7 | 5 | 9 | 7 |
| 4. Claridad para un dueño de clínica | 8 | 9 | 8 | 8 | 9 |
| 5. Calidad en celular | 7 | 6 | 6 | 8 | 8 |
| 6. Acabado y detalle | 8 | 6 | 6 | 8 | 8 |
| **Promedio** | **8.00** | **7.50** | **6.67** | **8.33** | **8.00** |

Orden: **T4 (8.33)** > T1 (8.00) = T5 (8.00) > T2 (7.50) > T3 (6.67).

---

## G2-T1 · "La mesa de trabajo de la recepción" (8.00)

1. **Fidelidad, 9.** Es lo más parecido a una pantalla de producto de GitHub
   (`pruebalo-chat-1440-oscuro`, `panel-chat-1440-oscuro`). A la izquierda, una lista
   con la barra de 4px en la fila elegida y contadores grises ("GRUPOS 2"). Al centro,
   el hilo. A la derecha, una barra de detalles como la de un issue ("Integrantes",
   "Lo que quedó hecho", "Acciones"). Las etiquetas del área ("Atención", "Clientes") van
   con borde, como "Owner".
2. **No genérico, 8.** Junta la conversación con lo que quedó hecho. En
   `inicio-envivo-1440-oscuro`, la columna derecha se va llenando ("Cita de Sofía Ramírez ·
   Hecho", "Preguntarle cómo le fue · Programado", "Espera tu visto bueno" con ícono de
   mano). Eso solo lo tiene Atendel. Le resta que las acciones salen **tres veces**: en la
   barra derecha, en las píldoras de abajo y en el menú `/`.
3. **CLAUDE.md, 8.** Los agentes escriben sin caja. La única caja del hilo es la tarjeta
   "CITA CONFIRMADA" (`inicio-envivo-escribiendo-1440-oscuro`), y tiene razón de estar.
   Los estados están diseñados: búsqueda sin resultados con "Borrar la búsqueda"
   (`pruebalo-busqueda-vacia`), "escribiendo" en la lista, la cabecera y el hilo, y
   "Crear grupo" deshabilitado con su motivo. Le resta que en `panel-chat-390-*` hay
   **dos íconos de hamburguesa** juntos (el de la barra del sitio y el de la lista).
4. **Claridad, 8.** "Lo que quedó hecho", con Hecho / Programado / Espera tu visto bueno,
   se entiende sin explicación. Pero hay mucha información a la vez: tres columnas, más
   las acciones repetidas.
5. **Celular, 7.** El cajón de la lista funciona y las conversaciones se leen bien
   (`pruebalo-lista-390-*`, `inicio-envivo-390-*`). Pero la idea central de T1 ("Lo que
   quedó hecho") **desaparece** debajo de 1080px y no se puede abrir de ninguna forma
   (`.conversa__detalles` no tiene cajón). Las pestañas del marco se cortan ("Clara · Co")
   y en el panel están las dos hamburguesas.
6. **Acabado, 8.** Usa solo tokens: ningún color en hexadecimal y un solo radio suelto.
   Las horas van con números tabulares y la vista previa con "…". El guion se detiene en
   cuanto tocas el chat. En `/pruebalo` el marco no cabe en 1440×900 (la lista de
   "Acciones" queda cortada abajo).

**Como vista "Conversaciones":** es la que mejor encaja por arquitectura. Las columnas
cambian según el **ancho del propio chat** (container queries), no según el de la
ventana. Así se acomoda sola dentro del dashboard, con el menú lateral, sin reescribir
nada.

## G2-T2 · "Ellos contestan. Tú ves lo que quedó hecho." (7.50)

1. **Fidelidad, 8.** Tiene lenguaje de producto: pestañas por canal, sellos en Mono
   ("WHATSAPP · 23:14") y un panel lateral "RESULTADO" con estado "Listo" en verde
   (`inicio-envivo-1440-oscuro`). En el inicio el texto es chico (14px) y deja mucho vacío.
   Al empezar, el marco es un rectángulo negro casi vacío (`inicio-encabezado-1440-oscuro`).
2. **No genérico, 9.** Tiene la idea más original del grupo. En la pestaña de Lola ves la
   conversación **"Así lo ve tu paciente en WhatsApp"**, y luego **tú escribes como
   paciente** y Lola te aparta la cita: el panel cambia a "JUE 16:30 · Paciente de prueba
   · desde esta página" (`inicio-envivo-paciente-1440-claro`). Las tarjetas de resultado
   son producto de verdad: el bloque de fecha "VIE 10:00", la bandeja con
   URGENTE/HOY/ESTA SEMANA y el reporte SEP/AGO en tabla (`inicio-envivo-iris-1440-oscuro`).
3. **CLAUDE.md, 7.** Los agentes escriben en texto corrido y tu burbuja es neutra. Le
   resta que el estado vacío de "Resultado" usa **barras grises de "esqueleto"** (se ve a
   plantilla) y que hay fallas visibles (ver 6).
4. **Claridad, 9.** Es la que mejor responde "¿y esto qué me deja hecho?". Tiene un botón
   **"Dar visto bueno"** (`pruebalo-accion-1440-oscuro`) que muestra la regla de Atendel.
5. **Celular, 6.** El marco del inicio es bajo y el "Resultado" queda debajo
   (`inicio-envivo-390-*`). El texto de ayuda se corta ("Ahora tú: escríbele a Lola como
   si"). En `pruebalo-grupo-390-claro` la ventana "Nuevo grupo" queda **cortada dentro del
   marco** y no se ven sus botones. El cajón de "Resultado" sí está bien hecho
   (`pruebalo-resultado-390-claro`).
6. **Acabado, 6.** En `pruebalo-accion-1440-oscuro` la fila de sugerencias se sale de su
   columna ("imiento" queda encima del borde de la lista). En `panel-chat-1440-*`, a la
   orilla derecha de cada fila de conversación se asoman **rayitas** (el fondo de
   "Borrar"), y los títulos se cortan antes de tiempo ("Factura de Ins…").

**Como vista "Conversaciones":** el panel "Resultado" encaja muy bien como columna
derecha. Pero el inicio usa otro componente (`EnVivo` + `guion.ts`), así que hay dos
caminos de código que mantener.

## G2-T3 · "Línea de tiempo de revisión" (6.67)

1. **Fidelidad, 9.** Es, literalmente, la conversación de un pull request: cada mensaje
   es un comentario con cabecera #151a22, la hora en Mono y la etiqueta del área a la
   derecha. Los eventos van sobre la línea vertical y "Tú" lleva la cabecera azul
   (`inicio-marco-1440-*`, `panel-hilo-1440-*`). Es lo más reconocible de GitHub.
2. **No genérico, 6.** Es tan literal que se siente **molde, no materia prima**
   (lección 5). Debajo del marco, "las tres claves" son el patrón de tres columnas con
   ícono en círculo y título (`inicio-claves-1440-*`), aunque estén separadas por rayas.
   Lo propio, y bueno, son los eventos: "**Lola** envió **12 recordatorios** por WhatsApp
   · 10 CONFIRMARON · 1 PIDE CAMBIO · 1 SIN RESPUESTA" (`pruebalo-evento-1440-claro`).
3. **CLAUDE.md, 5.** Choca de frente con la lección 3: **cada mensaje va en una caja con
   borde**. En celular el hilo es una pila de cajas de lado a lado (`panel-hilo-390-*`,
   `inicio-marco-390-*`). Las cajas tienen intención (cabecera y cuerpo), pero el dueño ya
   dijo que eso no le gusta.
4. **Claridad, 8.** Los eventos explican qué pasó ("Víctor programó el mensaje de reseña
   para Sofía Ramírez · SÁBADO · WHATSAPP"). La barra de dirección con
   `?con=recepcion` sobra para un dueño de clínica.
5. **Celular, 6.** El cajón y las pestañas funcionan. Pero en `pruebalo-nuevogrupo-390-claro`
   la ventana "Nuevo grupo" es **translúcida** y el texto de la lista se ve encimado debajo
   de las tarjetas de los agentes.
6. **Acabado, 6.** Dice "**Lolaestá** escribiendo" sin espacio (`pruebalo-escribiendo-1440-oscuro`:
   el espacio se pierde en el contenedor flex). Las vistas previas de la lista se cortan
   en seco, sin "…" ("venc", "contestarc", "lás"). Además dejó una ruta de prueba en el
   código (`src/app/pruebalo/vista-panel/page.tsx`, apagada con variable de entorno), que
   hay que borrar.

**Como vista "Conversaciones":** usa container queries (bien), pero el lenguaje de "cajas
de comentario" es justo lo que el dueño rechazó.

## G2-T4 · "El hilo de trabajo" (8.33) · GANADORA

1. **Fidelidad, 9.** Toma la línea de tiempo del pull request **sin copiar sus cajas**.
   Una línea de 2px une a los personajes y los eventos ("**Lola** le pasa el seguimiento
   a **Víctor** · 10:03"). Los agentes escriben sin marco; el área va en Mono mayúsculas
   y la hora en Mono. Usa etiquetas de Primer con borde ("Confirmada" en verde, "Espera
   tu visto bueno" en azul), teclas `kbd` y el indicador de 4px en la lista
   (`inicio-chat-1440-oscuro`, `pruebalo-chat-1440-*`).
2. **No genérico, 8.** Cuenta lo que hace distinto a Atendel: **que los agentes se pasan
   el trabajo**. Las únicas cajas son trabajo terminado: la cita con
   Paciente/Cuándo/Dura (`inicio-encabezado-1440-oscuro`) y el WhatsApp programado con la
   cita textual. Debajo del marco, una sola línea en Mono "01 LOLA AGENDA · 02 VÍCTOR DA
   SEGUIMIENTO · 03 TÚ DAS EL VISTO BUENO" en vez de tres tarjetas (`inicio-pie-1440-*`).
3. **CLAUDE.md, 9.** Es la que mejor cumple la lección 3. Tiene todos los estados:
   escribiendo en cabecera, lista e hilo (`pruebalo-escribiendo-*`), menús `/` y `@`
   (`pruebalo-comandos-*`, `pruebalo-mencion-*`), "Crear grupo" deshabilitado, la ✕ al
   pasar el cursor en el panel (`panel-borrar-hover-*`) y deslizar para borrar
   (`pruebalo-deslizar-390-*`). En celular **evitó a propósito la segunda hamburguesa**
   (usa el ícono de mensaje). En modo claro usa gris cálido en la fila elegida.
4. **Claridad, 8.** La historia del inicio se entiende sola ("Una paciente escribe y tu
   equipo se pasa el trabajo"), y "Espera tu visto bueno" se ve donde importa. Le falta
   un lugar que junte "lo que quedó hecho", como en T1, T2 y T5.
5. **Celular, 8.** El cajón de la lista con contadores, deslizar para borrar (capturado),
   la línea de tiempo que sí cabe en 390 y textos de 16px (`inicio-chat-390-*`,
   `pruebalo-*-390-*`). Le resta que en la cabecera de las tarjetas el texto se corta
   ("WHATSAPP…", "CITA · WHATSA…") y que "Nuevo grupo" vive dentro del marco y hay que
   bajar para ver sus botones.
6. **Acabado, 8.** `/pruebalo` cabe completo en 1440×900. Solo tokens (ningún hex en
   `chat.css`). Detalles: en la pestaña "Recepción" las caritas quedan **pegadas** al
   texto; después de crear un grupo ninguna pestaña queda activa (`pruebalo-grupocreado-1440-oscuro`);
   las ideas del panel vacío son botones con borde, centrados y de anchos distintos.
   No hay captura del hilo del panel con mensajes reales.

**Como vista "Conversaciones":** las dos columnas (lista + hilo) entran sin trabajo extra
en el centro del dashboard. Pero usa **media queries de la ventana**, no del contenedor,
y eso hay que cambiarlo (ver problemas).

## G2-T5 · "Míralo trabajar" (8.00)

1. **Fidelidad, 8.** `/pruebalo` y el panel son muy de producto: respuestas sin caja,
   burbuja neutra y una barra para escribir con "/ Acciones" y "@ Mencionar" a la vista
   (`pruebalo-chat-1440-*`, `panel-chat-1440-*`). En el inicio, en cambio, la escena usa
   **burbujas grises a los dos lados**, como WhatsApp (`inicio-envivo-1440-*`). Se aleja
   del lenguaje de GitHub y de su propia regla de "sin caja".
2. **No genérico, 8.** El momento protagonista es muy de Atendel: la cita **cae en el
   hueco "Libre" de las 10:00** de la agenda ("Sofía Ramírez · Confirmada por Lola").
   Clara deja la factura en "Pendientes · esta semana" con montos, e Iris deja la tabla de
   septiembre. Le resta que el acomodo del inicio (pasos con círculos azules llenos junto
   a una demo) es un patrón común de páginas de software.
3. **CLAUDE.md, 7.** En el inicio quedan las burbujas en caja. Además, en `/pruebalo`
   **quitó el fondo de partículas** (`<Sitio fondo="ninguno">`) sin avisarlo en la entrega,
   y la regla dice que se avisa en lugar de quitar. A cambio, agregó controles de
   **Pausar / Repetir / Desde el inicio** para la escena que corre sola (bien hecho).
4. **Claridad, 9.** La agenda con Ocupado / Libre / la cita que llega es la imagen más
   clara de todo el grupo sobre lo que el dueño gana. Junto al botón dice "Entras con tu
   correo, sin contraseña."
5. **Celular, 8.** En `/pruebalo` y el panel, la mejor de las 5: el chat va de orilla a
   orilla, la lista es otra pantalla con "‹ 3" (los sin leer) para regresar, "Nuevo grupo"
   es una hoja que sube y respeta la zona segura (`pruebalo-chat-390-*`,
   `pruebalo-lista-390-claro`, `pruebalo-nuevogrupo-390-oscuro`, `panel-deslizar-390-oscuro`).
   Pero en el inicio, en celular, el hilo queda reducido a una tira ("23:15") y la agenda
   se come el marco (`inicio-envivo-390-*`).
6. **Acabado, 8.** Hay movimiento con propósito y la escena se pausa si no se ve. Detalles:
   la pestaña dice "Lola  · WhatsApp" con espacio raro; en la escena de Iris la cabecera
   dice "Tú · OFICINA" con un círculo "Tú"; y el "+" de la PromptBar se cambió por los
   atajos (está bien, pero es un cambio a un mueble).

**Como vista "Conversaciones":** su versión de celular es la que conviene copiar para el
dashboard. Pero usa media queries de la ventana, y el inicio no usa `ChatDemo` (no tiene
PromptBar ni grupos).

---

## Ganadora: **G2-T4**

Es la que mejor resuelve el pedido principal (que se vea como GitHub) **sin caer en la
lección 3**. Toma la línea de tiempo del pull request, deja a los agentes hablar sin
caja y reserva las cajas para el trabajo terminado. Su historia ("se pasan el trabajo")
es propia de Atendel. Es la más pareja en los 6 criterios (ninguno baja de 8) y la que
tiene menos fallas visibles en las capturas. T1 y T5 quedan muy cerca. De ellas hay que
tomar dos cosas clave para el dashboard: las container queries y "Lo que quedó hecho"
de T1, y la versión de celular de T5.

## Mejores ideas concretas de las demás para incorporar

**De T1**
1. **Container queries** (`@container conversa (min-width: 720px / 1080px)`): las
   columnas dependen del ancho del chat, no de la ventana. Es indispensable para que el
   chat viva dentro del dashboard con el menú lateral de 240–272px.
2. **"Lo que quedó hecho"** como columna derecha de la vista Conversaciones: lista con
   ícono de estado y los estados **Hecho / Programado / Espera tu visto bueno**, más
   "Integrantes" del grupo. Debajo de ~1280px, que se abra como cajón (ver idea 6).
3. **Buscador de chats** en la lista con su estado vacío: "Ningún chat coincide con
   «dentista». Borrar la búsqueda".
4. **Contadores** junto a cada sección de la lista ("GRUPOS 2", "AGENTES 4"), como el
   Counter de Primer.

**De T2**
5. **"Así lo ve tu paciente en WhatsApp"** en la pestaña de Lola del inicio: el visitante
   escribe como paciente y la cita le queda apartada ("Paciente de prueba · desde esta
   página"). Es la mejor demostración de valor del grupo.
6. **Tarjetas de resultado ricas:** bloque de fecha "VIE 10:00", bandeja con
   URGENTE/HOY/ESTA SEMANA, reporte SEP/AGO en tabla con números tabulares, y el botón
   **"Dar visto bueno"** en lo que espera aprobación. También su cajón de "Resultado"
   con punto azul de "hay algo nuevo" en pantallas angostas.
7. **"Nuevo grupo" con las cuatro tarjetas de personaje** (la elegida con borde
   #8c93fb): es más de Atendel que la lista de casillas de T4. Se puede usar en celular
   dentro de la hoja que sube de T5.

**De T3**
8. **Resumen del evento en una línea Mono:** "10 CONFIRMARON · 1 PIDE CAMBIO · 1 SIN
   RESPUESTA". Y eventos con color de estado solo en el círculo: verde para la cita
   confirmada, contorno rojo para "marcó como urgente".
9. **Eventos en vivo** que generan `/confirmar`, `/resumir-correos` y `/reporte` (T4
   solo tiene el evento de "le pasa el seguimiento").

**De T5**
10. **Celular tipo app:** chat de orilla a orilla con `100dvh`, la lista como pantalla
    aparte con "‹ 3" (sin leer) para regresar, "Nuevo grupo" como **hoja que sube**, y
    zona segura abajo. Es lo que necesita el dashboard en celular.
11. **Atajos visibles en la barra de escribir:** "/ Acciones" y "@ Mencionar" con su
    tecla, en lugar del "+" que no explica nada (dejando el "+" si se quiere conservar
    el mueble).
12. **Pausar / Repetir** para el guion que corre solo en el inicio, y que se detenga si
    no se ve (IntersectionObserver y pestaña oculta).
13. **La cita que cae en el hueco libre de la agenda** (Ocupado / Libre / Sofía Ramírez):
    sirve para "Próximas citas" del dashboard o como tarjeta de resultado de `/agendar`.

## Problemas que la ganadora (T4) debe corregir

1. **Media queries → container queries.** Hoy las columnas cambian según la ventana. Dentro
   del dashboard (1440 − 256 de menú ≈ 1184px de contenido, y en tableta menos) la lista y
   el hilo se van a apretar. Hay que pasar a `@container`, como T1.
2. **Adaptarlo a la actualización del 8 de octubre** para la vista Conversaciones:
   - azul #0071e3 en enviar, "Crear grupo" y casillas (hoy violeta);
   - fuente del sistema y cuerpo de 14px/1.43 en producto (hoy Mona Sans y 16px en el
     texto de los agentes);
   - tarjetas y paneles de 12–16px (hoy las tarjetas de resultado van a 6px), botones de
     8px y menús de 14px;
   - sombra suave solo en lo que flota (menús `/` y `@`, ventana de grupo);
   - **sin marco de navegador** dentro del dashboard (los tres puntos y la barra de
     dirección quedan solo para el inicio).
3. **Agregar el panel "Lo que quedó hecho"** (idea 2) como columna derecha en pantallas
   anchas y como cajón en angostas. Hoy el único resumen de resultados está regado en el
   hilo.
4. **Pestañas del marco:** dejar espacio entre las caritas y el texto en "Recepción", y que
   al crear un grupo haya una pestaña activa coherente (hoy ninguna queda marcada).
5. **Celular:** que la cabecera de las tarjetas no corte el texto ("WHATSAPP…", "CITA ·
   WHATSA…"): que baje de línea o se acorte. Poner "Nuevo grupo" como hoja que sube
   (T5) en vez de una ventana dentro del marco. Indicar que las píldoras de sugerencias
   se pueden deslizar (hoy se cortan en la orilla).
6. **Panel vacío:** las ideas para empezar son botones con borde, centrados y de anchos
   distintos. Se ven como cajas sueltas. Mejor una lista con divisiones y flecha (como en
   T1 o T5), alineada a la izquierda.
7. **Ayudas repetidas:** la fila de teclas bajo la barra, el texto de ayuda "@ para
   mencionar" y las píldoras dicen lo mismo. Hay que dejar una sola forma (idea 11).
8. **Verificar el panel con sesión real:** no hay captura del hilo del panel con mensajes
   (streaming, voces del grupo con `partirIntervenciones`, botón Copiar, aviso de límite,
   error de red). El integrador debe revisarlo logueado.
9. **Pedidos a la base pendientes:** tamaños de avatar (hoy en px en `chat.css`), anchos
   del chat como tokens, y borrar el bloque `.chat-app*` sin uso de `globals.css`
   (cuidando `.chat-app__puntos` de `ConversacionEnVivo` y el selector de `ScrollSuave`).

## Notas para el integrador (de todas las propuestas)

- T3 dejó una ruta de prueba en `src/app/pruebalo/vista-panel/page.tsx`. Si se toma algo
  de T3, no hay que traerla.
- T5 apagó el fondo de partículas en `/pruebalo` sin avisarlo. Como `/pruebalo` será
  dashboard, quizá esté bien, pero lo debe decidir el dueño.
- T2, T3, T4 y T5 muestran "atendel.mx/…" en la barra de dirección. Si ese dominio no es
  de Atendel, conviene no mostrarlo (cuenta como dato inventado).
- Ninguna usa la marca GitHub en textos visibles (solo aparece en comentarios del CSS).
