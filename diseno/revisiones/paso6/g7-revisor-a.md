# Paso 6 · Grupo 7 (Dashboard: panel y /pruebalo) · Revisor A

Revisé las 5 propuestas contra la base `f305a7c`. En cada una leí la entrega
(`diseno/entregas/g7-tN.md`), miré las capturas de `diseno/capturas/paso5/g7-tN/` y
revisé el código cambiado: `components/dashboard/*`, `pruebalo/page.tsx`,
`lib/demo-dashboard.ts`, `panel/layout.tsx`, `panel/page.tsx`, `Panel.tsx`,
`panel/agentes/*`, `components/app/*` y `estilos/dashboard.css`. No modifiqué nada
de las propuestas ni hice commit.

**Nota sobre las capturas.** En la primera pasada, la herramienta devolvió sin imagen
casi todas las capturas de T1, T2 y T3 y las de `/pruebalo` de T4 (llegué a un límite).
Las volví a abrir así:

- **T1, T2 y T3:** las clave, unas 20 a 28 por propuesta. Cubren Resumen (pantalla y página completa), 1024, 390, oscuro y claro, los menús de perfil y "+", avisos, cajón, buscador, visto bueno, Conversaciones, Correo, Agentes y el panel (resumen, vacío, correo, agentes y chat).
- **T4:** todas las del panel y las clave de `/pruebalo`.
- **T5:** casi todas.

Las capturas que no volví a ver son duplicados de modo o de ancho de las que sí vi.

## Cómo califiqué

- **Lo primero que pesa:** que se vea como el dashboard de GitHub. Eso es barra fija con buscador, menú lateral, actividad al centro y columna derecha, con el refinamiento de Apple, acento azul, oscuro primero y nada de plantilla. Así lo pide la lección 12 y la sección "Actualización: dashboard" de la guía.
- **Lo segundo:** que el `/panel` conserve todas sus funciones y no invente nada.

**Verificado en el código de las 5:**

- Ningún `fetch` ni `/api/` en `components/dashboard/*`, `pruebalo/page.tsx` ni `demo-dashboard.ts`. `ChatDemo` no se tocó y no llama a la IA.
- **Panel:** las 5 conservan las llamadas de siempre:
  - `/api/agente-correo/prueba` y `/api/agente-correo`.
  - `signInWithOAuth` con `gmail.readonly`.
  - Los 3 `EJEMPLOS` y "Limpiar" (en T3 vive en `Correo.tsx`).
  - El historial de `resumenes_correo`.
  - El `upsert` de `agentes_elegidos` en Mis agentes.
- **Plan:** ninguna deja cambiar el plan; solo hay enlace a Precios.
- **Archivos:** ninguna tocó la API, `globals.css`, `base/*` ni `panel/chat/*`. Ninguna dejó commiteada la ruta temporal: `git status` está limpio y no hay `vista-panel-*` en el diff.
- **`npm run lint`** (`next lint --no-cache`): sin errores ni avisos en las 5. No corrí build: el revisor B está construyendo en esas carpetas.
- **Tokens en `dashboard.css`:** 0 hex y 0 `rgba` sueltos en las 5. Los px sueltos fuera de `@media` son pocos:
  - T1: unos 12, los más limpios.
  - T2: unos 50.
  - T3: unos 50.
  - T4: unos 95.
  - T5: unos 45.

  Casi todos son 2px de separación, 44px de área táctil y 3px de subrayado.
- **Lo demás:** ningún peso 700, ningún TODO y ningún botón que diga "Menú". Todas usan hamburguesa o ícono de barra lateral con `aria-label`. "GitHub" solo aparece en comentarios del código, nunca en pantalla.
- **Consultas nuevas de solo lectura (todas con RLS):**
  - T1: conteos `head: true` de conversaciones y resúmenes.
  - T2: `mensajes.creado_en` de 7 días.
  - T4: `mensajes` con `conversaciones(agente)` y `resumenes_correo` de 26 semanas, en tandas de 1,000 de forma secuencial (hasta 20 tandas en cada visita a `/panel`). Es seguro, pero pesado.
  - Las tablas tienen políticas `auth.uid() = owner_id` (`0002`, `0004`).

## Calificaciones

| Criterio | T1 · Fiel al dashboard de GitHub + acabado Apple | T2 · "El GitHub que respira" | T3 · "Pendientes primero" (caja de merge) | T4 · Cuadrícula de actividad | T5 · Teclado y pulgar (paleta + hojas) |
|---|:-:|:-:|:-:|:-:|:-:|
| 1. Fidelidad al dashboard de GitHub con refinamiento de Apple | 9 | 8 | 8 | 7 | 9 |
| 2. Que no parezca hecho por IA ni genérico | 9 | 7 | 9 | 6 | 8 |
| 3. Evita los errores de CLAUDE.md | 8 | 7 | 8 | 6 | 7 |
| 4. Claridad para un dueño de clínica | 9 | 8 | 9 | 6 | 8 |
| 5. Calidad en celular y tableta | 8 | 8 | 7 | 7 | 9 |
| 6. Acabado y detalle (estados, menús, claro/oscuro) | 9 | 7 | 8 | 8 | 9 |
| **Promedio** | **8.67** | **7.50** | **8.17** | **6.67** | **8.33** |

**Ganadora: G7-T1.** Segunda T5, tercera T3.

---

## G7-T1 · El más fiel al dashboard de GitHub, con acabado de Apple (8.67)

**1. Fidelidad: 9.** Es la que más se parece al dashboard de GitHub con sesión iniciada, y no por copiarlo.

- **Barra:** muestra la miga "Atendel / Resumen", el buscador en píldora con "/" y los botones con contorno: "+ ▾", la campana y el avatar.
- **Lateral:** funciona como "Top repositories". Tiene secciones con activo relleno y una marquita azul, "Tus agentes" con "Ver todos" y "Grupos" con botón "Nuevo".
- **Centro:** es un feed de verdad. Cada evento lleva quién, verbo, **objeto en negritas**, hora relativa y el objeto incrustado en tarjeta (la cita, el mensaje, el Excel). Los eventos iguales se agrupan y se despliegan ("Ver cómo contestaron 6"), como "starred 3 repositories".
- **Columna derecha:** "Novedades" imita "Latest changes" con fechas reales del historial (30 sep, 2 oct, 3 oct, 8 oct).

Capturas: `pruebalo-resumen-completa-1440-oscuro`, `pruebalo-agrupado-abierto-1440-*`.

Lo de Apple se ve en el aire, la barra translúcida y el claro en #f5f5f7 con tarjetas blancas (`pruebalo-resumen-completa-1440-claro`). No le pongo 10 porque la columna derecha es un poco densa en 1440: plan, citas de mañana, semana, novedades, consejos y dudas, todo seguido.

**2. No genérica: 9.**

- **Sin fila de KPIs arriba.** La bienvenida tiene "Tu día" en tres renglones accionables: 12 citas mañana, 23 correos leídos con 1 urgente, y 3 cosas que esperan tu visto bueno.
- **Los datos cuentan la misma historia que `ChatDemo`:** Sofía Ramírez, Carla Díaz, Rosa Peña, Insumos Médicos del Bajío, el reporte de septiembre. Cada evento abre su chat exacto (`?con=`).
- **Horas relativas a quien mira**, así que la demo nunca se ve vieja.
- **Estados vacíos del panel con personaje y siguiente paso:** "Tu agenda vivirá aquí", "Todavía no hablas con tu equipo".

**3. Errores de CLAUDE.md: 8.**

Lo que hace bien:
- La demo está marcada en 3 lugares: la franja de arriba, la insignia del saludo y el encabezado de cada vista.
- El correo de ejemplo usa el dominio `.example`.
- Lo que no existe dice "Pronto": Citas, Clientes, Reportes, Configuración, Perfil, Mi negocio, Importar contactos, Destacados en el panel y Gmail sin Google.
- En el panel no se ve nada que no salga de la cuenta.
- Es la más limpia en tokens.

Lo que le baja puntos:
- Quitó `FichasAgentes` de `/pruebalo`. Lo avisa, pero es un mueble.
- `NavApp` queda en `null`.
- `ArmazonPanel` conserva una prop `vista` que solo sirve para vistas previas.

**4. Claridad: 9.**

- "Espera tu visto bueno" funciona en la demo con Aprobar, "Cambiar algo" y Deshacer. El contador, el saludo y "Tu día" se actualizan (`pruebalo-visto-bueno-1440-oscuro`).
- En el panel, "Para hoy" dice qué hacer: "Conecta tu Gmail" o "2 agentes en tu equipo" (`panel-resumen-completa-1440-oscuro`).

**5. Celular y tableta: 8.**

Lo que hace bien:
- **1024:** muestra lateral y centro, con la columna derecha debajo, como pide la guía.
- **390:** el lateral vive en el cajón; el buscador ocupa la barra con "Cancelar"; los avisos se abren a lo ancho (`pruebalo-avisos-390-claro`); los botones van a ancho completo.

Lo que falla:
- La franja de demo se corta: "Demostración con datos de ejem…".
- El Resumen mide 5,822px en celular: "Tu día" va dentro de la bienvenida y la columna derecha completa queda al final.

**6. Acabado: 9.**

- **Es de las dos que resolvió el `backdrop-filter` anidado.** Los menús y avisos dentro de la barra van sólidos, y en las capturas no se transparenta nada (`pruebalo-menu-perfil-1440-oscuro`). En T2, T3 y T5 sí se lee el texto de atrás.
- Tiene esqueleto del historial, 8 estados vacíos, un despliegue con `grid-template-rows`, foco por dentro en listas y "Ver actividad anterior" con estado cargando.
- El modo se cambia desde el menú de perfil, con texto de qué modo está activo.

## G7-T5 · Teclado y pulgar: paleta de comandos y hojas (8.33)

**1. Fidelidad: 9.** El armazón es muy fiel.

- **Barra y búsqueda:** el buscador de la barra abre una paleta flotante, como la búsqueda de GitHub.
- **Feed:** tarjetas anidadas con insignias de estado.
- **Agentes fijados:** con alfiler.
- **Columna derecha:** "Novedades" con puntos y, como en GitHub, el pie dentro de la columna derecha.
- **Acabado de Apple:** el filo de la barra aparece solo cuando hay contenido debajo y las hojas tienen manija.

Capturas: `pruebalo-resumen-completa-1440-*`, `pruebalo-paleta-1440-*`.

**2. No genérica: 8.** El día de una recepción, bien contado:

- El mensaje por aprobar se ve como una burbuja.
- La tabla de facturas en Correo.
- "Septiembre en números", que sale del reporte de Iris.

Le resta que los atajos ("Pulsa Ctrl K… o ? para ver todos los atajos", dentro de la bienvenida) son de herramienta de programadores, no de dueño de clínica.

**3. Errores: 7.**

- No avisa en su entrega que `/pruebalo` dejó la barra pública, el pie y las partículas.
- "Su ficha" saca de la demo (`/agentes#id`).
- Para abrir un chat desde el dashboard busca el botón `.chat-app__conv` por nombre y le hace clic. Es frágil.
- Deja props "solo para pruebas" (`vistaForzada`, `historialInicial`).
- Los menús se transparentan (`pruebalo-menu-perfil-1440-oscuro`: se lee "Clínica Luna" detrás).

**4. Claridad: 8.** El botón azul "Revisar 2 pendientes" lleva a lo importante (`pruebalo-visto-bueno-1440-*`). En el panel, "Clara resumió el correo de Laura Méndez" muestra Resumen y Qué hacer: clarísimo (`panel-resumen-completa-1440-oscuro`).

**5. Celular: 9.** Es la mejor en celular:

- Barra inferior con Resumen, Chats, +, Agentes y Avisos, con áreas de 44px.
- "+" y avisos como hoja que se cierra jalando (`pruebalo-menu-crear-390-*`, `pruebalo-avisos-390-*`).
- Paleta a pantalla completa con "Cancelar" (`pruebalo-paleta-390-*`).

No le pongo 10 porque en celular hay tres navegaciones a la vez (barra superior, cajón y barra inferior). Además, la barra inferior tapa el final de las tarjetas: en `pruebalo-visto-bueno-390-*` "Aprobar" queda debajo.

**6. Acabado: 9.** Paleta con búsqueda sin acentos, hoja de atajos, esqueletos que respiran, giros en los botones y tarjetas seleccionadas con borde azul en Agentes (`panel-agentes-1440-*`).

## G7-T3 · "Pendientes primero" (8.17)

**1. Fidelidad: 8.**

Lo fiel: la barra, el lateral y la columna derecha son los del dashboard. "Esta semana" lleva cifras con cambio y "Novedades" lleva fechas.

Lo que se aparta: el centro toma la página de un pull request más que el feed. La pestaña por defecto es "Espera tu visto bueno", con la primera fila abierta y una caja de "merge":

- "Listo para enviar".
- Palomitas de revisión.
- "Aprobar y enviar".
- A un lado, "Cómo llegó aquí", con los relevos Iris → Víctor → Lola.

Capturas: `pruebalo-resumen-1440-oscuro` y `-claro`.

Es GitHub, pero no es "actividad al centro" como pide la guía.

**2. No genérica: 9.** Es el concepto más propio de Atendel: "Nada sale a tus clientes sin tu permiso". Eso se convierte en pantalla, con la forma real de cada cosa: la burbuja de WhatsApp con destinatarios, el correo con Para/Asunto y el Excel.

**3. Errores: 8.**

Lo que hace bien:
- Es la única que **conservó `FichasAgentes`** en `/pruebalo`.
- Avisa que quitó `Sitio`.
- Su Correo de demo resume los 3 ejemplos con guion, sin IA (`pruebalo-correo-1440-oscuro`).

Lo que falla:
- Inconsistencias de texto en el panel: "Lo que **Atendel** ya leyó" y "**Atendel** te dice de qué trata" (`panel-correo-1440-oscuro`), cuando quien lee es Clara.
- Los menús se transparentan (`pruebalo-menu-perfil-1440-oscuro` y `pruebalo-avisos-1440-claro`).

**4. Claridad: 9.** "4 cosas esperan tu visto bueno" responde de inmediato "¿qué tengo que decidir hoy?". En el panel real usa las sugerencias de Clara como "Por revisar", con "Ya lo atendí" y "Ver en Correo" (`panel-resumen-1440-oscuro`).

**5. Celular: 7.**

- La fila abierta ocupa casi dos pantallas, y el Resumen mide 4,770px (`pruebalo-resumen-390-*`).
- En 1440 claro, el chat de Conversaciones queda cortado por abajo: el compositor sale de la pantalla (`pruebalo-conversaciones-1440-claro`).
- El cajón y los menús están bien (`pruebalo-cajon-390-oscuro`).

**6. Acabado: 8.** "Enviando…" con giro, Descartar con Deshacer, Editar con campo, búsqueda en vivo agrupada y estados vacíos con acción (`panel-vacio-1440-claro`). Le resta el transparentado de los menús.

## G7-T2 · "El GitHub que respira" (7.50)

**1. Fidelidad: 8.**

Lo fiel:
- La estructura correcta y la más calmada.
- La columna derecha va sin cajas.
- La bienvenida trae un filtro "Todos los agentes" sobre las pestañas.
- La actividad empieza con un evento "ahora", "Lola está contestando a Valeria Núñez", con el "escribiendo…" de la base (`pruebalo-resumen-1440-oscuro`).

Lo que se acerca a la analítica genérica: la banda de tres cifras de la bienvenida, la gráfica de barras "Esta semana" y el carrusel "Para ti".

**2. No genérica: 7.** Los relevos ("Relevo de Lola a Víctor") y los estados vacíos firmados por el agente se sienten de Atendel. La banda de KPIs, las barras y el control de páginas se sienten de plantilla de dashboard.

**3. Errores: 7.**

- No avisa en su entrega que `/pruebalo` dejó `Sitio`.
- Pequeños defectos de texto, como "tu negocio" en minúscula (`panel-vacio-1440-claro`).
- Unos 50 px sueltos.
- Los menús se transparentan (`pruebalo-avisos-1440-oscuro`: se lee "Mensajes de octubre 1,284/3,000" detrás).

A favor: "Agendar cita" va marcado "Pronto" en el menú "+".

**4. Claridad: 8.** "¿Cómo leo esto?" es una ayuda contextual que ninguna otra trae. El botón "Entrar" en la barra de la demo es un camino claro.

**5. Celular: 8.** Correcto: cajón, contenido apilado, pestañas que se deslizan y avisos a lo ancho (`pruebalo-avisos-390-claro`).

**6. Acabado: 7.** Le restan el transparentado y unas capturas del panel con la miga equivocada ("Resumen" en Agentes, por la ruta temporal). A favor: `cache()` reparte las lecturas entre el layout y la página.

## G7-T4 · Cuadrícula de actividad (6.67)

**1. Fidelidad: 7.** Es muy reconocible como GitHub, pero toma su protagonista del **perfil** (la cuadrícula de contribuciones, con "Menos ■■■■ Más"), no del dashboard. Además, la actividad del centro queda muy abajo: empieza hacia los 1,300px, después de la cuadrícula y de los fijados (`pruebalo-resumen-completa-1440-oscuro`).

Copiar casi literal un componente firma de GitHub roza la regla "nada de sus ilustraciones; se toma solo el estilo".

**2. No genérica: 6.** Cuadrícula, mini gráficas por agente y cifras de 30 días con sparklines se sienten a tablero de analítica. "5,998 tareas" no le dice nada a una recepcionista.

**3. Errores: 6.**

- La vista **Citas de la demo muestra una agenda completa** ("Hoy hay 6 citas y mañana 12", con estados Atendida, No vino y Confirmada). Es una función que no existe: en el panel, Citas dice "Pronto". Es fingir que funciona.
- La fecha de la demo está fija ("Jueves 8 de octubre") y se ve vieja.
- La consulta de 26 semanas de mensajes se hace en cada visita.
- Tiene unos 95 px sueltos.

**4. Claridad: 6.** En una cuenta nueva, el protagonista es una cuadrícula vacía de 26 semanas (`panel-vacio-completa-390-claro`). En una cuenta con dos semanas de uso son 24 semanas de cuadros grises (`panel-resumen-1440-*`).

**5. Celular: 7.** Funciona, pero la cuadrícula queda diminuta, los filtros se salen por la derecha y las tres cifras van apretadas (`pruebalo-resumen-390-claro`).

**6. Acabado: 8.** Lo hace bien:

- **Menús sólidos:** igual que T1, resolvió el vidrio dentro de la barra.
- **"Ver como tabla":** la tabla gemela, accesible.
- **La cuadrícula:** el globo por día, recorrible con flechas.
- **Avisos del panel:** honestos ("Por ahora no hay avisos", sin contador inventado).

---

## `/pruebalo` sin barra pública, pie ni partículas: ¿rompe los muebles?

Las 5 quitaron `Sitio` de `/pruebalo`. Con eso se fueron la barra pública, el pie de 4 columnas, el fondo de partículas 2D (`Escena`) y, salvo en T3, `FichasAgentes`.

**Está justificado** por la dirección del 8 de octubre: "`/pruebalo` lo muestra con datos de ejemplo" como dashboard, con su propia barra fija. Dos barras serían un error, y las partículas detrás de un dashboard calmado irían contra las lecciones 7 y 11. **No se pierde ningún mueble del sitio:** la escena 3D y las partículas siguen en la portada y las páginas públicas.

Lo que sí falta, y lo debe resolver la integración:

1. **Volver a montar `FichasAgentes` en `/pruebalo`**, como T3, para que "Ver ficha" se abra ahí mismo sin sacar al visitante de la demo.
2. **Un camino visible de vuelta al sitio:** logo → inicio, "Salir de la demostración" y el pie mínimo con Inicio, Agentes, Precios y Preguntas. T1 ya lo tiene.
3. **Avisarle al dueño** en el resultado que `/pruebalo` ya no lleva la barra pública ni el fondo de partículas, como pide CLAUDE.md ("si algo no encaja, se avisa"). T1, T3 y T4 lo anotaron; T2 y T5 no.

## Ganadora: G7-T1

Es la que mejor cumple la prioridad del dueño ("literalmente GitHub, profesional, no genérico, como el GitHub dashboard"), con el refinamiento de Apple y sin perder ninguna función. Además:

- Su feed es el más parecido al de GitHub, sin copiar nada de su marca.
- Cuenta el día de una clínica con los mismos datos que el chat.
- Su panel real tiene los mejores estados vacíos.
- Es la más limpia en tokens.
- Es una de las dos que resolvió los menús transparentes.

## Mejores ideas de las demás para incorporar a T1

**De T3:**

- **La caja de aprobación tipo "merge"** dentro de la pestaña "Espera tu visto bueno":
  - "Listo para enviar".
  - Palomitas de revisión.
  - Un botón "Aprobar y enviar".
  - "Editar" con campo.
  - "Descartar" con Deshacer.

  Más **"Cómo llegó aquí"**, con la línea de relevos entre agentes. Va como el contenido de esa pestaña, no como vista por defecto.
- **Montar `FichasAgentes` en `/pruebalo`**, con "Ver ficha" en la vista Agentes.
- **El Correo de la demo con los 3 correos de ejemplo** y su resumen de guion (sin IA): enseña la función principal de Clara.
- **En el panel real, llenar "Espera tu visto bueno"** con lo que Clara sugirió hacer (`accion_sugerida`), con "Ya lo atendí" y "Ver en Correo", en lugar de un estado vacío permanente. T4 ("Por atender") y T5 ("Destacados") hicieron lo mismo.

**De T5:**

- **La paleta de comandos** (Ctrl K y "/", búsqueda sin acentos, resultados agrupados). En celular, la búsqueda a pantalla completa con "Cancelar".
- **Las hojas con manija** para "+" y avisos en celular (`Hoja.tsx`, candidata a la base).
- **El filo de la barra** que aparece solo al desplazar.
- **Ojo:** sin la barra inferior ni los atajos visibles en la bienvenida.

**De T2:**

- **El evento "ahora"** al principio de la actividad, "Lola está contestando…", con `<Escribiendo>`.
- **El filtro "Todos los agentes"** sobre el feed.
- **"¿Cómo leo esto?"** como ayuda contextual en la columna derecha.
- **El botón "Entrar"** en la barra de la demo.
- **Volver atrás y adelante entre vistas.** La dirección guarda la vista con `?vista=&con=&pestana=`, así que los botones Atrás y Adelante del navegador funcionan.

**De T4:**

- **"Ver como tabla"** como gemelo accesible de cualquier gráfica que se agregue.
- **La franja de demo con "Probar con mi negocio"**, bien resuelta en dos renglones en celular.

## Problemas que T1 debe corregir antes de integrarse

1. **Franja de demo en celular.** Se corta ("Demostración con datos de ejem…"). Hay que acortar el texto en 390 o pasarlo a dos renglones, como T4.
2. **`FichasAgentes`.** Volver a montarla en `/pruebalo`. Avisar al dueño que la página ya no usa `Sitio`.
3. **Largo en celular.** El Resumen mide 5,822px. Propuestas:
   - Que "Tu día" sea una fila compacta.
   - Limitar el feed a 4 o 5 eventos antes de "Ver actividad anterior".
   - En la columna derecha, poner primero el plan y las citas, y al final novedades, consejos y dudas.
4. **Densidad de la columna derecha en 1440.** Darle más aire entre bloques (32px) o quitar un bloque. Por ejemplo, unir "Te puede servir" con "¿Dudas?".
5. **Visto bueno en el panel real.** Dejar de mostrarlo siempre vacío y alimentarlo con las sugerencias de Clara (ver ideas).
6. **`/panel/chat` en celular.** Aparecen dos botones de menú: el del lateral y el de la lista del chat. Al integrar el chat ganador del Grupo 2, el chat debe llenar su contenedor (sin `position: fixed`). También hay que quitar el `import { NavApp }` de `Chat.tsx` y borrar `NavApp.tsx`.
7. **Código.** Quitar la prop `vista` de `ArmazonPanel` (solo sirve para vistas previas) o documentarla como prueba. Pasar a tokens los 2px, 3px y 6px que quedan (anillos, puntos), según sus "Pedidos a la base" 3, 8 y 9.
8. **Pedidos a la base que T1 resolvió en su CSS y conviene subir:**
   - `menu--solido` para menús dentro de la barra.
   - Un `Popover` que no sea menú.
   - `Insignia tono="contorno"`.
   - Tamaños 20, 24 y 32 de `.marca-agente`.
   - El ícono "flecha-abajo-derecha".
9. **Correo de la demo.** Agregar el modo de prueba con los 3 ejemplos (idea de T3). Hoy la demo solo enseña la lista ya ordenada.
10. **Falta probar en un teléfono real:** el arrastre del cajón, el blur de la barra, la letra del sistema en iPhone y `/panel` con una sesión real de Supabase. Ninguna de las 5 pudo hacerlo.
