# Paso 6 · Grupo 4 (Informativas) · Revisor A

Califiqué en modo ligero: las capturas de `diseno/capturas/paso5/g4-tN/` (todas las de
1440 y 390 en oscuro, y al menos una en claro por sección), la entrega de cada trabajador
y su código (`git diff 3da8ec7`). No levanté servidores ni hice capturas propias.

## Resultado

| Criterio | G4-T1 (ritmo GitHub, fiel al plan) | G4-T2 (el producto explica) | G4-T3 (GitHub con calma de Apple) |
|---|:-:|:-:|:-:|
| 1. Fidelidad al estilo GitHub (afinado con Apple) | 8 | 7 | 9 |
| 2. Que NO parezca hecho por IA ni genérico | 7 | 6 | 8 |
| 3. Evita los errores de CLAUDE.md | 7 | 6 | 8 |
| 4. Claridad para un dueño de clínica | 9 | 8 | 8 |
| 5. Calidad en celular | 8 | 7 | 9 |
| 6. Acabado y detalle | 8 | 7 | 9 |
| **Promedio** | **7.83** | **6.83** | **8.50** |

**Ganadora: G4-T3.** Es la más sobria y la más parecida a GitHub de hoy, y es la que
mejor sigue la lección 13 ("nada muy exagerado, minimalismo"). Usa líneas de 1px y pocas
cajas, y es la más limpia en celular. Antes de integrarla le faltan cosas que sí tienen
G4-T1 (el plan de cada agente, muestras del producto en `/para-quien-es`, la línea de
agentes en el paso 2) y hay que corregir los puntos de abajo.

---

## Revisión común (lo que pidió el encargo)

| Revisión | T1 | T2 | T3 |
|---|---|---|---|
| Las 4 secciones no repiten el patrón | Sí: columnas asimétricas, línea de tiempo vertical, pestañas + lista y tarjeta ancha dividida. Dos de las cuatro llevan encabezado centrado (Cómo funciona y Seguridad). | **A medias.** La composición cambia, pero el lenguaje es el mismo en 3 de 4 secciones: texto + marco de navegador (Qué es, Cómo funciona con 3 marcos, Seguridad). En `/para-quien-es` hay 4 marcos iguales más. | Sí: frase grande + lista con horas, pasos en fila con la muestra, pestañas + rejilla 2×2, y banda con columnas. Hay un eco: Cómo funciona y Seguridad son "3 columnas con línea y una marca arriba". |
| `PASOS`, `SEGMENTOS`, `GARANTIAS` reales | Sí, se importan de `contenido.ts`. Las horas (09:40, 10:44, 11:20) salen de `detalle.ts`. A Iris no le inventa hora. | Sí. Iris va con "Hoy" en lugar de una hora. **Pero** el panel "Permisos de tu cuenta" (Seguridad) muestra una pantalla que no existe en `/panel`, con estados como "Víctor · Te consulta primero" o "Lola · Por su cuenta". Dice "Ejemplo", pero presenta como producto una configuración que no existe. | Sí. A Iris no le pone hora: va "—" y, para lectores de pantalla, "Sin hora". Es la más honesta. |
| Marca de "borrador" en `/para-quien-es` | Se conserva (`<Borrador />` en cada bloque y en el inicio) | Se conserva | Se conserva |
| Enlace a `/preguntas#seguridad` | Sí | Sí (botón fantasma) | Sí (enlace a la derecha del título) |
| `Seguridad.tsx` reutilizable | `variante="preguntas"` | `variante="preguntas"`, cambia el id del título | `variante="preguntas"` y además la prop `id` |
| `Personaje.tsx` sin cambios | Sí | Sí | Sí |
| Un solo botón principal azul por pantalla | **No.** "Aprobar y enviar" de la muestra es azul (`principal`). Con la barra fija, que también lleva "Pruébalo" en azul, quedan dos azules a la vista. | Sí en el inicio (botones neutros en las muestras) | Sí en el inicio ("Dar visto bueno" es sutil) |
| Textos en español de México, concretos | Sí. Agrega "Tres pasos y ya están trabajando", que está bien. | Sí. Agrega "Así se ve cada paso" y "Abre tu tipo de negocio…". | Sí. Respeta los textos de la base y recupera los 3 párrafos de "Qué es". |
| Tokens de la base | Sí: ningún color, radio ni tamaño fuera de tokens en `informativas.css` | Sí | Sí |
| Archivos de otros grupos | No tocó ninguno | No tocó ninguno | No tocó ninguno; **`globals.css` no se tocó** (lo confirma el diff). Solo avisa del choque con la clase `.equipo`. |
| Legibilidad sobre las partículas | Las capturas del inicio se tomaron sin la escena. En `/para-quien-es` la lectura va sobre fondo liso (`seccion--fondo`). | Igual: `.inf-cuerpo` lleva un fundido a fondo liso | Igual: `.pqe-cuerpo` lleva un fundido de 96px |

**Problema común a las tres (hay que resolverlo al integrar, no es de un trabajador):**
1. **Fuente del sistema dentro de las muestras.** La base trae `.producto` con
   `--font-producto` (la pila del sistema), y la lección 13 llegó después (ya no se usa la
   pila del sistema). T1 (`VistoBueno`, `Conversacion`) y T3 (la muestra del visto bueno)
   usan `.producto`, y en las capturas esas burbujas se ven en Arial. T2 no la usa y se
   queda en Mona Sans. → El integrador debe cambiar `--font-producto` a Mona Sans en la
   base.
2. **En la barra, "Pruébalo" va como botón principal azul.** El plan lo pide "sutil". En
   `/para-quien-es` las tres ponen además "Habla con los agentes" en azul en el
   encabezado, así que hay dos azules en la primera pantalla. → Es del Grupo 6 o de la base.
3. **Partículas sobre el encabezado de `/para-quien-es`.** En T3 (1440) un fragmento 3D
   tapa parte de la etiqueta "PARA QUIÉN ES · NEGOCIOS…". En T2 (390), los fragmentos
   pasan por encima del texto de la intro. La escena es común (lección 11): que el
   integrador deje despejada la zona del texto.

---

## G4-T1 · Ritmo de secciones de la portada de GitHub · promedio 7.83

**Lo que vi:**
- **Qué es:** a la izquierda, los 4 personajes encimados, el título de 40px y el texto. A
  la derecha, una tarjeta de vidrio "Hoy en la recepción". Cada fila lleva el personaje,
  el canal y la hora en Mono, una frase y el resultado en una ficha ("Martes 17:00 · cita
  cambiada", `precios-laser.xlsx`). Al pie, "Ver el panel de ejemplo →". Es concreto y muy
  de producto.
- **Cómo funciona:** encabezado centrado y línea de tiempo vertical con nodos 01–03, tal
  como pide el plan. El paso 2 muestra a los 4 agentes en píldoras (nombre + área en
  Mono): muy claro. El paso 3 trae una muestra completa de Víctor → Paola: Editar con área
  de texto, Guardar/Cancelar, estado de "cargando", "Enviado" con doble palomita, "Repetir
  ejemplo", `aria-live` y manejo del foco. Es la muestra más trabajada de las tres.
- **Para quién es:** pestañas en píldora a la izquierda. De un lado la frase del negocio
  con la marca de borrador y "Más sobre clínicas →"; del otro, la lista de agentes con
  personaje, área en azul cielo y plan ("DESDE ONE / DESDE FREE / EN MAX", sacado de
  `planMinimo`). Es la información más útil para decidir.
- **Seguridad:** encabezado centrado, una tarjeta ancha con las 3 garantías divididas por
  1px, íconos de contorno en azul cielo y el enlace al pie. Es justo lo que pide el plan.
  Agrega la intro "No vendemos tu información a nadie", que tiene respaldo en
  `contenido.ts` (la respuesta de preguntas).
- **`/para-quien-es`:** encabezado con la burbuja de partículas, una barra de píldoras fija
  (01–04) que marca el negocio actual y en celular se desliza sola, y bloques alternados.
  De un lado van el texto y las tareas con su plan; del otro, **una conversación real de
  `detalle.ts` en un marco de navegador** (Iris en Clínicas, Víctor en Estéticas, Clara en
  Consultorios y Lola en Servicios). Es la página con más prueba de producto.

**Calificaciones:**
1. **Fidelidad 8:** sigue el ritmo de GitHub (encabezado de sección, vidrio, pestañas en
   píldora, línea de tiempo como la conversación de un pull request). Le falta algo de la
   calma de Apple: halos dobles (`Seccion halo` + `<Halo>`) en Qué es y Seguridad, y cajas
   anidadas (fichas dentro de la tarjeta).
2. **Anti-genérico 7:** el feed con resultados y la muestra interactiva son muy de
   Atendel. Pero Seguridad (encabezado centrado + 3 columnas con ícono en una tarjeta) es
   lo más cercano al patrón genérico de "3 tarjetas con ícono", y dos de las cuatro
   secciones abren con encabezado centrado.
3. **Errores de CLAUDE.md 7:** hay un botón azul principal dentro de una muestra que no
   hace nada real, y suman dos azules con la barra. Usa la fuente del sistema en las
   muestras (contra la lección 13). Hay cajas dentro de cajas en el feed. Lo demás está
   limpio: nada inventado y la marca de borrador se conserva.
4. **Claridad 9:** es la que mejor explica. Se entiende qué hace cada agente, en qué plan
   viene, qué resultado entrega y que nada sale sin tu visto bueno.
5. **Celular 8:** se apila bien y las píldoras tienen 44px. En "Qué es", las fichas se
   cortan con puntos suspensivos ("de prospecto a…", "Reporte de septiembre · Excel…") y
   se pierde información. La fila de pestañas se corta en "N" sin una pista de que se
   desliza.
6. **Acabado 8:** las interacciones están muy completas (estados, foco, `aria-live`,
   subbarra con `aria-current`). Detalles: `colorAgente` está duplicado, `QueEs` es
   "use client" solo por el revelado, e importa de un componente a otro (`ComoFunciona`
   toma de `QueEs`).

## G4-T2 · El producto explica cada sección · promedio 6.83

**Lo que vi:**
- **Qué es:** a la izquierda Lola y el texto; a la derecha un marco de navegador
  (`atendel.mx/panel`, pestañas Actividad/Pendientes/Citas) con una bitácora en línea de
  tiempo. Cada fila lleva una insignia de estado ("Correo enviado", "Cita creada", "De
  prospecto a cita", "Reporte listo") y la de Iris trae las cifras de su ejemplo (342
  citas, 47 nuevos, 21 faltas). Es muy de producto.
- **Cómo funciona:** línea vertical con **un marco de navegador por paso**. El paso 1
  copia los textos reales de `Login.tsx` ("Tu correo", "Link enviado"). El paso 2 copia
  "En tu equipo / + Agregar" de `MisAgentes.tsx`. El paso 3 es la respuesta de Lola "sin
  enviar", con borde punteado. La idea es buena y los textos salen del producto, pero
  suma 3 cajas más en una sola sección (lección 3: "puros cuadrados y cajas").
- **Para quién es:** encabezado centrado con Víctor y un **acordeón dentro de una tarjeta
  de vidrio**. Cada fila trae los 4 personajes encimados (el mismo adorno 4 veces) y, al
  abrir, otra caja interna (`inf-tareas--caja`) con las filas: son tres niveles de caja.
- **Seguridad:** a la izquierda el panel "Permisos de tu cuenta"; a la derecha el escudo
  grande, el título y las 3 garantías en lista. El panel **repite lo que dicen las
  garantías** y retrata una pantalla de configuración que el producto no tiene. En celular
  la sección mide unos 1600px.
- **`/para-quien-es`:** bloques alternados, cada uno con el mismo marco "Tu equipo ·
  {negocio}" y las mismas 4 filas que ya salen en el acordeón del inicio. Repite el inicio
  y no hay conversaciones. El cierre está bien.

**Calificaciones:**
1. **Fidelidad 7:** "el producto como prueba" es muy de GitHub, pero el resultado es más
   denso que la portada de GitHub y tiene poco de la calma de Apple.
2. **Anti-genérico 6:** el marco de navegador se vuelve plantilla: hay unos 5 en el
   inicio y 4 más en `/para-quien-es`. Los avatares encimados se repiten en cada fila del
   acordeón como adorno.
3. **Errores de CLAUDE.md 6:** cajas dentro de cajas (lección 3). La pantalla de permisos
   no existe (choca con "nada inventado" y con "mostrar el producto real"). Los botones de
   las miniaturas ("+ Agregar", "Enviar", "Editar") parecen tocables pero son `span` sin
   estados. A favor: mantiene Mona Sans en todo.
4. **Claridad 8:** "así se ve cada paso" se entiende muy bien. Pierde puntos por lo largo
   y por la redundancia de Seguridad.
5. **Celular 7:** se ve ordenado y el acordeón funciona bien en celular, pero es la más
   larga. Cómo funciona mide unos 1900px y Seguridad repite su contenido.
6. **Acabado 7:** visualmente pareja. En el código, `Revelar` vive en `app/para-quien-es`
   y lo importan componentes del inicio, "Paso N de 3" está escrito a mano y a
   `/para-quien-es` le falta la descripción en `metadata`.

## G4-T3 · GitHub con la calma de Apple, pocas cajas · promedio 8.50

**Lo que vi:**
- **Qué es:** frase grande (48px) a lo ancho con un halo suave. Debajo, en 5/7: los tres
  párrafos originales (recuperados del historial) y "Un día en la recepción" sin caja: la
  hora en Mono guía la lectura, luego el personaje, el nombre con el canal en Mono y lo
  que resolvió, con líneas de 1px. Es elegante y se lee de un vistazo.
- **Cómo funciona:** encabezado partido (título a la izquierda, intro a la derecha, como
  las secciones de GitHub con enlace a la derecha). Los 3 pasos van en fila con el número
  en Mono sobre una línea que corre al siguiente. El paso 3 es el doble de ancho y lleva la
  muestra "Pendientes de tu visto bueno" (Lola → Mariana, borrador con borde punteado,
  insignia ámbar). Se puede probar: "Dar visto bueno" la pasa a "Enviado" con palomitas y
  "Ver de nuevo", con `aria-live` y el foco cuidado.
  **Defecto:** en 1440 queda un vacío de unos 350px debajo de los pasos 1 y 2, a la
  izquierda de la muestra, y la composición se ve coja. Además, el plan pedía una línea de
  tiempo **vertical**; T3 la hizo horizontal (es defendible, pero se aparta del plan).
- **Para quién es:** pestañas en píldora a la izquierda; la frase con borrador y un botón
  fantasma "Todo sobre clínicas →"; a la derecha una rejilla 2×2 con líneas y el personaje
  arriba de cada tarea. No dice en qué plan está cada agente.
- **Seguridad:** banda con el fondo secundario y bordes arriba y abajo, la frase grande
  "Cada negocio ve solo lo suyo." y "Cómo cuidamos tus datos →" a la derecha. Debajo, las 3
  garantías en columnas separadas por líneas, con íconos de contorno en azul cielo. En modo
  claro usa #f6f8fa, con matiz (lección 9).
- **`/para-quien-es`:** usa el `EncabezadoPagina` de la base (con su revelado). Tiene un
  índice fijo "En esta página" que marca el negocio actual y, en celular, se vuelve
  píldoras. Cada bloque lleva el número en Mono, el nombre, la intro con borrador, **el
  agente "al frente" con su personaje en grande** (cambia de lado en cada bloque, como las
  mascotas de GitHub) y el resto del equipo en lista. Es bonita y con personalidad, pero
  **no trae ninguna muestra de producto**. Además, el "agente al frente" es una decisión
  editorial (Clínicas → Clara, Consultorios → Iris…) que el dueño tiene que confirmar.

**Calificaciones:**
1. **Fidelidad 9:** es lo más parecido a GitHub actual: encabezados partidos con enlace a
   la derecha, líneas en lugar de tarjetas, Mono como sello y el producto en un marco. El
   aire es de Apple.
2. **Anti-genérico 8:** la composición es propia y lo de "Sin hora" para Iris es un
   detalle fino. Le resto porque Seguridad (3 columnas con ícono) y Cómo funciona (3
   columnas con número) hablan el mismo idioma visual, y porque Qué es y Seguridad
   repiten la "frase grande".
3. **Errores de CLAUDE.md 8:** nada inventado y un solo azul por pantalla en el inicio.
   En contra: la fuente del sistema en la muestra (`classNameCuerpo="producto …"`) y
   ningún personaje en los encabezados de sección (lo pide la guía, "Acomodo" punto 4).
4. **Claridad 8:** se entiende, pero da menos datos que T1. No dice el plan de cada
   agente, los pasos 1 y 2 son solo texto y `/para-quien-es` no enseña el producto.
5. **Celular 9:** es la más limpia y la más corta. La muestra cabe completa. La única
   falla es que la fila de pestañas se corta en "N" sin una pista de que se desliza (igual
   que T1).
6. **Acabado 9:** cuidó el detalle: anchos en `ch`, prefijo `pqe-` para no chocar con
   `.equipo`, revelado sin JavaScript que respeta el movimiento reducido, estados del
   índice y pedidos a la base bien explicados. El vacío de Cómo funciona en 1440 le quita
   el 10.

---

## Mejores ideas de las otras propuestas para pasar a la ganadora (T3)

**De G4-T1:**
1. **El plan de cada agente** en Para quién es y en `/para-quien-es`: una etiqueta Mono
   tenue "DESDE FREE / DESDE ONE / EN MAX" con `planMinimo` (`planCorto()` de T1). Es
   información real y le sirve al dueño para decidir.
2. **Las píldoras de los 4 agentes en el paso 2** ("Lola ATENCIÓN", "Clara CORREO"…).
   Llenan parte del vacío bajo los pasos 1 y 2 y dicen algo útil.
3. **Una conversación real por negocio en `/para-quien-es`** (`Conversacion.tsx` de T1:
   marco de navegador + `detalle.ts`, con "Ejemplo con X · nombres ficticios"). Conviene
   ponerla junto al agente "al frente" y usar la conversación de **ese** agente: así el
   bloque grande también enseña el producto.
4. **El resultado concreto de cada fila de "Un día en la recepción"**, sin cajas: una
   línea Mono tenue ("MARTES 17:00 · CITA CAMBIADA", `PRECIOS-LASER.XLSX`) en lugar de las
   fichas con borde de T1.
5. **"Ver el panel de ejemplo →"** al pie de "Un día en la recepción", que lleva a
   `/pruebalo` (el dashboard).
6. **La intro de Seguridad** "Los datos de tus pacientes y clientes son tuyos. No
   vendemos tu información a nadie." Tiene respaldo en `contenido.ts`.
7. **El camino "Editar" de la muestra** (área de texto, Guardar/Cancelar, Esc), siempre
   con botones sutiles o fantasma, **nunca azul**.
8. En celular, **que la fila del índice se deslice sola hasta el negocio actual**
   (`Navegacion.tsx` de T1).

**De G4-T2:**
1. **Una línea de producto real en los pasos 1 y 2**, sin marco: los textos de
   `Login.tsx` ("Link enviado · Revisa tu correo") y de `MisAgentes.tsx` ("En tu equipo /
   + Agregar") como etiqueta pequeña. Termina de equilibrar el vacío sin sumar cajas.
2. **Las cifras de Iris** en su fila del día: "342 citas, 47 clientes nuevos y 21 faltas"
   (de `detalle.ts`, ya marcado como ejemplo). Es más concreto que "dejó el reporte listo".
3. Opcional y con mesura: **un estado** en las filas del día ("Cita creada", "Correo
   enviado") como texto Mono en verde o ámbar, sin píldoras de color.

## Lo que la ganadora debe corregir antes de integrarse

1. **Mona Sans en la muestra del visto bueno** (lección 13). La muestra usa `.producto`,
   que hoy toma la fuente del sistema. Hay que arreglarlo en la base (`--font-producto` →
   Mona Sans) o, mientras tanto, forzar Mona Sans en `.visto__cuerpo`.
2. **El vacío en Cómo funciona (1440):** llenar los pasos 1 y 2 con contenido útil (ideas
   T1-2 y T2-1) o reacomodarlos para que la muestra no deje la esquina inferior izquierda
   vacía. Decidir con el dueño si se queda horizontal o vuelve a la vertical del plan.
3. **El personaje en los encabezados** (guía, "Acomodo" punto 4): al menos los 4
   personajes pequeños sobre "Qué es Atendel", como en T1, o el personaje que corresponda
   en Para quién es. Sin recargar.
4. **El plan de cada agente** en Para quién es (idea T1-1).
5. **Producto real en `/para-quien-es`** (idea T1-3) y **confirmar `AL_FRENTE` con el
   dueño**: es una decisión editorial sobre qué agente "importa más" en cada negocio.
6. **El revelado atado al scroll** (`animation-timeline: view()`): las filas se quedan a
   medio aparecer mientras uno baja despacio, y en `.paso` el efecto toca la muestra que
   tiene un botón. La guía pide revelados de 0.4s con `cubic-bezier(0.16, 1, 0.3, 1)`, una
   sola vez. Conviene pasarlo al `[data-revela]` de la base o a un IntersectionObserver de
   una sola vez, y quitárselo a la muestra interactiva.
7. **Las pestañas en celular:** "Negocios de servicios" queda cortada sin pista de que la
   fila se desliza. Hay que agregar un desvanecido en el borde o permitir que la fila
   salte de línea.
8. **Puntos finales en los títulos** ("…personas.", "…lo suyo.", "…servicios."): que el
   integrador decida una sola regla para todo el sitio. Hoy los demás grupos no los usan.
9. **Para el integrador (no es de T3):** quitar o renombrar la clase `.equipo` de
   `globals.css`, que es del carrusel viejo y choca. Poner "Pruébalo" de la barra como
   botón sutil para que no haya dos azules. Despejar la zona del texto en la escena del
   encabezado de `/para-quien-es`. Usar `<Seguridad variante="preguntas" />` en
   `/preguntas#seguridad`.
