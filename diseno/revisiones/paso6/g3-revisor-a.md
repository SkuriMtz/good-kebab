# Paso 6 · Grupo 3 (Agentes) · Revisor A

Modo ligero: califiqué con las capturas de cada trabajador (`diseno/capturas/paso5/g3-tN/`) y su código (`git diff 6a1f89e`). No levanté servidores ni hice capturas propias.

## Verificación de requisitos (las tres)

| Requisito | T1 · pestañas | T2 · perfiles | T3 · docs |
|---|---|---|---|
| Solo tocan sus archivos (nada en `src/app/panel/*`) | Sí | Sí | Sí |
| Anclas `#lola #clara #victor #iris` y `?ficha=` (FichasAgentes sin cambios) | Sí | Sí | Sí |
| 4 páginas `/agentes/[agente]` estáticas (`generateStaticParams` + `dynamicParams = false`) | Sí | Sí | Sí |
| Ficha en `<dialog>` nativo, vidrio frost, radio 24, Esc, clic afuera, foco devuelto | Sí (sale en 0.15s) | Sí (Esc y foco probados con Playwright) | Sí (sale en 0.15s) |
| API de `Personaje.tsx` sin cambios (`agente`, `className`, `avatar`) | Sí | Sí | Sí |
| Ojos que siguen al cursor + forma orgánica | Sí (el contorno cambia despacio) | Ojos sí; el contorno queda **fijo** (el ondulado de siempre) | Sí |
| Personajes sin recargar (sin saltito, sin ojos entrecerrados) | Sí. Solo ojos, una leve asomada de la cara y parpadeo | Sí. Solo ojos, asomada y parpadeo | **No.** Agrega respiración (escala), inclinación, sombra en el piso y **degradado** de color "para dar volumen" (ver `Personaje.tsx` de T3, l. 180–193 y 313–331). CLAUDE.md: "No volver a recargarlos" |
| Datos solo de `agentes.ts`, `personajes.ts`, `planes.ts`, `detalle.ts` | Sí (`planMinimo`, `sugerencias`, `PLANES`) | Sí ("Próximamente" sale de `precio: null`) | Sí (incluye los mensajes al mes 30/600/3,000) |
| Botón principal azul, uno por pantalla | Sí. En el inicio no hay ninguno; en `/agentes` uno arriba y otro en el cierre, en pantallas distintas | Sí (en el perfil va a todo lo ancho) | Sí |
| Nada de la marca GitHub | Sí | Sí ("perfil", "LÉEME" y "bot" solo como idea, sin textos ni logos) | Sí |
| Tokens de la base | Casi todo en tokens. Anchos sueltos: 480, 880, 1040, 1080, `min(56vw,240px)`, 380 (los declara como pedidos) | Lo más limpio (un solo `2px`) | Limpio (`2px` sueltos). Usa `"boton boton--fantasma"` escrito a mano en vez de `claseBotonBase` |

## Calificaciones

### G3-T1 · pestañas como la fila de funciones de la portada de GitHub

1. **Fidelidad GitHub + Apple: 9.** `inicio-agentes-1440-oscuro`: pestañas en píldora con indicador blanco y, debajo, un panel de vidrio grande con texto a la izquierda y el producto en marco a la derecha. Es literalmente la fila Code/Plan/Collaborate. La barra de píldoras pegada en `/agentes` (`agentes-lola-1440-oscuro`) es la navegación local de Apple. La ficha frost entra y sale con escala.
2. **No genérico: 8.5.** Lo mejor del grupo: **cada canal se ve como es**. WhatsApp con burbujas; Clara como **hilo de correo** con remitente, "desde tu correo" y hora (`inicio-agentes-clara-1440-oscuro`); Iris con el **adjunto `precios-laser.xlsx`**. Títulos concretos ("Así le da Víctor seguimiento a quien no agendó"). Contra: las 4 hojas de `/agentes` repiten la misma composición (con zigzag).
3. **Errores de CLAUDE.md: 8.** Los personajes no se recargaron y no hay "Menú" ni degradados. Las secciones largas van sobre fondo sólido (lección 11). Pero en los encabezados las partículas siguen cruzando el texto: hay un triángulo amarillo sobre "para ver su ficha" (`agentes-encabezado-1440-oscuro`) y triángulos sobre "ATENDEL MAX" y "Ver su ficha" en el héroe del agente (`agente-lola-completa-390-oscuro`, `agente-lola-completa-1440-oscuro`).
4. **Claridad para el dueño: 8.5.** La página del agente responde en orden "qué es, cómo habla, qué hace, qué le pido, en qué plan viene y quiénes son los otros". "Pídele algo a Lola" (con las sugerencias reales) es muy útil. "Desde aquí" marca el plan mínimo.
5. **Celular: 7.5.** En 390, la pestaña de Iris queda cortada en el borde y no hay indicio de que la fila se desliza (`inicio-agentes-390-oscuro`). La conversación va dentro de un marco dentro del panel de vidrio, con doble margen. La barra pegada en celular está bien (`agentes-lola-390-oscuro`). En la captura completa de 390 el encabezado aparece repetido al final (`agentes-completa-390-oscuro`): probablemente es un efecto de la captura, pero hay que verificarlo.
6. **Acabado: 8.5.** Estados bien pensados (hover solo con puntero fino, presión, `aria-current`, `aria-selected`) y mensajes que entran en cadena. Contras: en la ficha, la acción principal queda abajo, fuera de la vista (`ficha-lola-1440-oscuro`). El frost de la ficha se ve gris lodoso, con manchas de color de los personajes que se transparentan detrás del texto.

**Promedio T1: 8.33**

### G3-T2 · cada agente como perfil de GitHub

1. **Fidelidad GitHub + Apple: 8.5.** El perfil (`perfil-lola-1440-oscuro`) se reconoce al instante: columna de ¼ con avatar redondo grande, nombre, "usuario", bio, botón a lo ancho, datos con íconos, "Trabaja con" y pestañas con contador. La conversación como **hilo de issue** (línea vertical, avatar, sello "Agente", evento final con ícono) es muy GitHub.
2. **No genérico: 7.5.** El concepto es fuerte y distinto. Pero el hilo es igual para WhatsApp, correo y chat (se pierde lo de cada canal), y `/agentes` repite cuatro veces la misma sección sin variación (`agentes-completa-1440-oscuro`).
3. **Errores de CLAUDE.md: 6.5.** **Lección 11 rota de forma visible:** las partículas corren detrás de todo el contenido de `/agentes` y del perfil, y hay triángulos encima del título "Clara", de la lista y de las píldoras "Lo que hace" y "Ejemplo" (`agentes-indice-clara-1440-oscuro`, `perfil-victor-plan-1440-oscuro`, `perfil-lola-390-oscuro`). El trabajador lo avisó, pero no lo resolvió en sus páginas. Además, `TarjetasAgentes` deja de usarse (lo avisó) y el h1 de `/agentes` es una oración larga a 48px.
4. **Claridad para el dueño: 7.** En el perfil, la conversación de ejemplo y el plan quedan **escondidos detrás de pestañas**: un dueño de clínica que entra a "Lola" no ve cómo habla sin un clic más. El perfil se ve vacío (más de 300px sin nada bajo las cajas en `perfil-lola-1440-oscuro`). A favor: "Ya se conecta a tu correo" / "Por ahora, la pruebas en el chat" es honesto y claro, y la ficha pone sus acciones arriba.
5. **Celular: 7.5.** El perfil en 390 se vuelve una buena cabecera (retrato junto al nombre, botones a lo ancho; `perfil-iris-390-oscuro`). En el inicio, la pestaña de Iris queda cortada, y la tarjeta y el marco apilados hacen la sección muy larga (`inicio-agentes-390-oscuro`).
6. **Acabado: 7.5.** El índice pegado con FLIP está bien hecho y el motor de mirada compartido se detiene en reposo (lo más eficiente de las tres). Pero quedan huecos vacíos en el perfil, partículas cruzando controles y el contorno del personaje no cambia (la forma orgánica es estática).

**Promedio T2: 7.42**

### G3-T3 · `/agentes` como GitHub Docs

1. **Fidelidad GitHub + Apple: 8.5.** `agentes-tabla-1440-oscuro`: índice lateral con la línea azul de 4px de Primer y relleno sutil, títulos con línea fina, tabla comparativa y aviso "Para empezar" con borde izquierdo. Es GitHub Docs. La sección del inicio, en cambio, es casi igual a la de T1 (pestañas + panel de vidrio + marco).
2. **No genérico: 8.5.** La tabla **"Quién hace qué"** (4 agentes × 3 planes, con los mensajes al mes) es la idea más útil y menos "de plantilla" del grupo. También suman la página del agente con "Todo lo que hace" como tabla de referencia, anterior/siguiente y el sello de "lo que quedó hecho" ("✓ DE PROSPECTO A CITA AGENDADA", `agentes-ficha-1440-oscuro`).
3. **Errores de CLAUDE.md: 6.** **Personajes recargados:** respiran, se inclinan, tienen sombra en el piso y llevan degradado (se nota en `agentes-cabeza-1440-claro`). Es justo lo que el dueño ya quitó ("menos adornos"; "no volver a recargarlos"). El degradado choca además con "degradados solo como atmósfera". A favor: la "banda lisa" deja el texto largo sin partículas (lección 11 bien resuelta en el cuerpo, no en la cabeza: `agente-lola-cabeza-390-oscuro`).
4. **Claridad para el dueño: 9.** La tabla contesta de un vistazo quién hace qué y con qué plan. El aviso dice cómo empezar ("Con Atendel Free empiezas gratis con Clara…"). En la página del agente, el índice deja saltar a "En qué plan está" o a "Pídele algo así". Las tarjetas de plan muestran los mensajes al mes, con borde #8c93fb en el plan mínimo (`agente-lola-plan-1440-oscuro`).
5. **Celular: 6.5.** **Defecto visible en `agentes-tabla-390-oscuro`:** la fila "Mensajes al mes" sale desalineada: "30" queda bajo ONE, "600" bajo MAX y "3,000" no aparece. Un dueño leería que Max trae 600 mensajes, un dato equivocado. En el código la celda de "Qué hace" se oculta igual en el pie, así que hay que revisar la causa (el ancho del `th` del pie o un desborde). También aquí la fila de píldoras pegada corta a Víctor e Iris, y en el inicio la pestaña de Iris queda cortada.
6. **Acabado: 8.** Tablas accesibles (`caption`, `scope`), ancla "#" al pasar el cursor, transición con dirección en el inicio, ficha frost más limpia que la de T1 y botón de cerrar que flota al bajar. Contras: botones con clases escritas a mano y el desalineo de la tabla.

**Promedio T3: 7.75**

## Tabla de promedios

| Propuesta | Fidelidad | No genérico | Errores CLAUDE.md | Claridad | Celular | Acabado | **Promedio** |
|---|---|---|---|---|---|---|---|
| G3-T1 · pestañas | 9 | 8.5 | 8 | 8.5 | 7.5 | 8.5 | **8.33** |
| G3-T2 · perfiles | 8.5 | 7.5 | 6.5 | 7 | 7.5 | 7.5 | **7.42** |
| G3-T3 · docs | 8.5 | 8.5 | 6 | 9 | 6.5 | 8 | **7.75** |

## Ganadora: G3-T1

Es la más fiel a la portada de GitHub y la que mejor muestra el producto real (cada canal con su forma). Respeta a los personajes sin recargarlos y es la más pareja en las tres superficies (inicio, `/agentes`, página del agente) y en la ficha.

## Mejores ideas de las demás para incorporar a T1

De **T3**:
1. **La tabla "Quién hace qué"** (`ComparativaAgentes.tsx`) más el aviso "Para empezar", en `/agentes` entre el encabezado y la barra pegada. Es lo más claro del grupo para un dueño. Se trae ya corregida en celular.
2. **La "banda lisa"** (`.docs-banda`): en T1 el texto largo ya va sobre fondo sólido; conviene aplicar la misma regla a los encabezados para que las partículas no crucen texto.
3. **Los mensajes al mes** (30 / 600 / 3,000) en la tarjeta de planes de la página del agente.
4. **Anterior / siguiente** al final de la página del agente (complementa "Los otros tres agentes").
5. En el inicio, el panel que **entra desde el lado de la pestaña elegida** (8px + opacidad, 0.4s).

De **T2**:
1. **El motor de mirada compartido** (un solo `requestAnimationFrame` para todos, que se detiene en reposo). En T1 cada personaje corre su propio ciclo continuo mientras está a la vista. Hay que conservar en T1 la forma orgánica que cambia y el umbral de 44px.
2. **La ficha con sus acciones arriba**, junto a la cabecera ("Empezar gratis", "Su página", "Ver precios", y la nota de "llega con…"). En T1 quedan fuera de la vista.
3. **`DatosAgente`**: canal, plan con el que viene y el punto de estado "Ya se conecta a tu correo" / "Por ahora, la pruebas en el chat" (dato `conectado`). Va en la página del agente y en la ficha.
4. **"Trabaja con"** como lista compacta, y la idea del **sello "Agente"** junto al nombre en las burbujas del agente (como el sello "bot"), sin perder el formato propio de cada canal de T1.
5. El borde destacado #8c93fb en el plan "Desde aquí" (T1 solo usa una etiqueta).

## Lo que T1 debe corregir antes de integrarse

1. **Partículas sobre texto en los encabezados** de `/agentes` y de `/agentes/[agente]`: triángulos sobre la intro, las píldoras de plan y "Ver su ficha" (lección 11). Hay que bajar la densidad en esa zona o darle fondo al bloque de texto.
2. **Pestañas en 390:** Iris queda cortada sin indicio de desplazamiento. Opciones: un desvanecido en el borde con desplazamiento con imán, o píldoras más compactas para que quepan las 4 (solo personaje y nombre ya está; falta ajustar el padding).
3. **Ficha:** subir las acciones (ver la idea de T2) y revisar el frost. Con los personajes detrás se ve gris con manchas de color bajo el texto; conviene más opacidad o un velo más oscuro, sin dejar de ser vidrio.
4. **Rendimiento de `Personaje.tsx`:** un ciclo compartido en lugar de uno por personaje, que se detenga cuando no hay cursor reciente ni cambio de forma visible.
5. **Valores sueltos en `agentes.css`:** 480, 880, 1040, 1080, 380 y `min(56vw,240px)` deben pasar a tokens de la base (`--ancho-lectura`, `--ancho-ventana`, `--personaje-*`), como pidió el trabajador.
6. **Base:** quitar las reglas viejas `.ficha*` de `globals.css`, porque la nueva ficha se llama igual (`className="ficha"`) y hoy depende del orden de las hojas de estilo. Agregar `idPanel` / `aria-controls` en `Pestanas`.
7. **Verificar la captura completa de `/agentes` en 390,** donde el encabezado aparece repetido al final.
8. Si se incorpora la tabla de T3, corregir antes **el desalineo de la fila "Mensajes al mes" en celular**, que hoy muestra cifras bajo el plan equivocado.
