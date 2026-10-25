# Auditoría UI/UX del sitio público (pase con UI/UX Pro Max)

Rama `prop/uiux`, base `0b31664` (movimiento con GSAP y Lenis). Un solo pase:
primero la auditoría y las capturas del antes; después los arreglos y la
revisión. **El estilo aprobado no cambió**: oscuro Dala, claro Vercel, Geist y
Geist Mono, un solo botón principal azul, la portada M1 y la lista de agentes M3.
No se tocó el dashboard, el chat, `/panel`, `/pruebalo` ni `componentes-pendientes/`.
No hay dependencias nuevas. No se cambió ningún precio ni plan.

## Resumen

| Gravedad | Hallazgos | Arreglados | Parcial | No arreglados (y por qué) |
|---|---|---|---|---|
| Alta | 4 | 3 | 0 | 1: el chat de demostración está fuera de este encargo |
| Media | 10 | 8 | 1 | 1: "Texto de ejemplo · revísalo" lo decide el dueño |
| Baja | 7 | 5 | 0 | 2: color de la barra del navegador (compartido con el dashboard) y el vidrio de la barra (estilo aprobado) |
| **Total** | **21** | **16** | **1** | **4** |

Lo más importante que mejoró:
- **404 propia** en español, con barra, pie, figura de fondo y atajos (antes salía la genérica de Next en inglés).
- **El foco del teclado ya no se esconde bajo la barra fija** (23 casos en 5 páginas → 0).
- **/entrar** revisa el correo antes de pedir el link y muestra el error junto al campo; ya no salen mensajes técnicos en inglés.
- **Contraste AA en todo el texto visible**: 6 fallas → 0 (4,718 textos medidos, oscuro y claro, 1440 y 390).
- **Títulos en orden** en /preguntas, **zonas de toque de 44 px** que faltaban y **Open Graph** con título y descripción por página.
- **Primera pantalla más ligera**: la figura de triangulitos arranca cuando el navegador queda libre y ScrollTrigger ya no se mide dos veces al cargar.

## Cómo se revisó

- Las 10 categorías de la skill, en su orden: accesibilidad, toque, rendimiento, diseño y responsive, tipografía y lectura, color y contraste, formularios, navegación, movimiento y contenido (`references/quick-reference.md`).
- Búsquedas de la skill usadas: `"error placement aria-describedby" --domain ux` (error junto al campo, ligado con `aria-describedby`; anunciado con `role="alert"`), `"focus not obscured sticky header" --domain ux` (WCAG 2.4.11: `scroll-padding-top` con barra fija), `"metadata open graph" --stack nextjs` (API de metadatos) y `"lazy load below fold heavy component" --stack nextjs` (cargar lo pesado después). Para la 404 no hubo resultado verificado (`"404 not found page"` devolvió temas ajenos): se usó la guía general de navegación de la skill (camino de regreso, navegación de siempre).
- **No** se usó `--design-system`: el estilo ya está aprobado.
- Scripts de Playwright (Chromium con SwiftShader):
  - `diseno/capturas/uiux/auditar.mjs`: títulos, landmarks, nombres accesibles, `alt`, campos, zonas de toque (con pantalla táctil en 390), largo de renglón y **contraste de todo el texto visible**, en 10 páginas × 2 anchos × 2 temas.
  - Teclado: Tab por cada página, foco visible, foco tapado por la barra al regresar con Shift+Tab (esperando a que termine el desplazamiento suave), menú del celular, ficha, pestañas y acordeón.
  - Rendimiento: CLS, tiempo bloqueado por tareas largas y LCP, con el procesador 4× más lento en 390.
  - La revisión automática del encargo (`revisar.mjs`).

## Hallazgos por página

### Todo el sitio: barra, pie y marco

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 1 | Al regresar con Shift+Tab, el foco quedaba **escondido bajo la barra fija** (y en /agentes bajo la fila pegada de los agentes): 23 controles en 5 páginas. | Accesibilidad | Alta | `scroll-padding-top` en `<html>` (barra + 16 px; en /agentes también la fila de agentes). El margen propio de cada ancla baja lo mismo, así las anclas quedan donde estaban. `landing.css` §5. | Arreglado: 0 tapados. En /contacto dos campos quedan 6 px bajo la barra, visibles (cumple AA). |
| 2 | Ninguna página tenía **Open Graph**; /para-quien-es y /entrar no tenían descripción propia; la descripción general solo hablaba del correo. | Contenido (SEO) | Media | `src/lib/seo.ts`: título, descripción y Open Graph/Twitter básicos por página. La descripción general usa la frase de la portada (los 4 agentes). Sin imagen para compartir: no hay una aprobada y no se inventa. | Arreglado |
| 3 | "Saltar al contenido" medía 39 px de alto. | Toque | Baja | 44 px de alto. | Arreglado |
| 4 | Al cargar, **ScrollTrigger se volvía a medir dos veces**: `movimiento.ts` lo pedía en `load` y ScrollTrigger ya lo hace solo. Cada medida recalcula el diseño de toda la página. | Rendimiento | Media | Se quita el duplicado (se conserva el de las letras cargadas). | Arreglado |
| 5 | La **figura de triangulitos** se formaba al montar la página y competía con la primera pantalla (en computadora, ~700 ms de tareas largas). | Rendimiento | Media | Arranca cuando el navegador queda libre (`requestIdleCallback`, espera máxima 600 ms). Con "reducir movimiento" igual: se dibuja quieta. | Arreglado |
| 6 | El color de la barra del navegador (`theme-color` #0d1117) no es el fondo del sitio (#000 / #fafafa). | Color | Baja | — | No: vive en `src/lib/tema.ts` y lo comparte el dashboard; casi no se nota. |
| 7 | La barra translúcida no desenfoca: al bajar, el texto que pasa detrás se alcanza a ver (20 %). | Lectura | Baja | Propuesta: subir el fondo de la barra a ~92 % si molesta. | No: es el vidrio del estilo aprobado. |

Revisado y bien: un solo `h1` por página; `lang="es"`; landmarks (barra, `nav`, `main`, pie); el zoom no está bloqueado; zona segura (notch) en barra, hoja del celular y pie; menú del celular con teclado (Esc cierra, el foco no se sale y regresa a la hamburguesa); hamburguesa con `aria-label` (nunca "Menú"); botón y selector de tema accesibles; enlaces del pie y botones de la barra con 44 px en táctil; foco visible en todo lo que se puede enfocar del sitio.

### Inicio

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 8 | Chat de demostración: el cuadro para escribir **no tiene etiqueta** ni anillo de foco propio, un ícono sin `aria-hidden`, y pestañas, sugerencias y "Enviar" de 36–40 px en celular. | Accesibilidad / Toque | Alta | Propuesta: `aria-label="Escríbele a tu equipo"` en el cuadro, `aria-hidden` en el ícono y una capa de 44 px en esos botones. | No: `ChatDemo`, `PromptBar` y `chat.css` están fuera de este encargo. |
| 9 | En "Para quién es" se ve el aviso **"Texto de ejemplo · revísalo"**. | Contenido | Media | — | No: es la marca del dueño para los textos de ejemplo; él decide si se queda o se reescribe. |
| 10 | El contador de preguntas por tema quedaba en **3.7:1** en modo claro. | Color | Media | Gris del sistema sin opacidad (5.5:1 en claro, 7.5:1 en oscuro); el tema marcado se queda como estaba. | Arreglado |

Revisado y bien: portada M1 y "Tu equipo" con teclado (Enter abre la ficha, la banda sigue al foco), un solo botón principal azul por pantalla, formulario de la lista (etiqueta, `autocomplete="email"`, `inputmode="email"`, 16 px, error junto al campo, "Anotando…" sin doble envío), pestañas de negocios con flechas, acordeón con `aria-expanded`. Las pestañas marcaban 1.1:1 en la medición automática, pero era falso: el fondo es el indicador que se desliza (medido aparte: bien).

### /agentes

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 11 | La fila pegada de agentes (Lola, Clara, Víctor, Iris) medía 36 px en celular. | Toque | Media | Capa invisible de 44 px (nada se mueve). | Arreglado |

El foco tapado por esa fila está en el hallazgo 1.

### /agentes/[agente] (página de cada agente)

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 12 | El enlace de la ruta ("Agentes / Lola") medía 18 px de alto en celular. | Toque | Media | Capa invisible de 44 px. | Arreglado |

### Ficha del agente

Sin hallazgos: es un `<dialog>` nativo; se abre con Enter, el foco entra, Esc o tocar afuera la cierran y el foco regresa a la fila que la abrió; botón de cerrar de 44 px con `aria-label`; título ligado con `aria-labelledby`.

### /precios

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 13 | Las respuestas de las preguntas llegaban a ~90 caracteres por renglón. | Lectura | Baja | Ancho máximo de 33 em (~70 caracteres) en las respuestas del acordeón. | Arreglado |

Precios y planes sin cambios.

### /preguntas

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 14 | Los títulos **saltaban de h1 a h3** (los temas). | Accesibilidad | Media | `GrupoPreguntas` acepta `nivel`: en /preguntas los temas son h2 y las preguntas h3; en el inicio sigue h2 → h3 → h4. | Arreglado |

El contador de temas está en el hallazgo 10. "Posibles preguntas" se queda así.

### /para-quien-es

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 15 | El índice de negocios medía 40 px en celular. | Toque | Baja | Capa invisible de 44 px. | Arreglado |

La descripción propia está en el hallazgo 2.

### /lista y /contacto

Sin hallazgos nuevos: cada campo con `label` de verdad, `autocomplete` (`email`, `name`, `organization`), `inputmode="email"`, letra de 16 px, error en español junto al campo con `aria-describedby` y `aria-invalid`, el foco va al primer error, "Anotando…" / "Enviando…" evitan el doble envío y los campos quedan de solo lectura mientras se envía.

### /entrar

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 16 | El correo **no se revisaba antes de pedir el link**: el error salía en un aviso arriba, sin ligarse al campo (sin `aria-invalid` ni `aria-describedby`), o con el globo del navegador. | Formularios | Alta | Se revisa al enviar, en español; el error va junto al campo (`aria-invalid`, `aria-describedby`, `role="alert"`) y el foco regresa al campo. | Arreglado |
| 17 | Errores técnicos en inglés: "No se pudo enviar el link: Failed to fetch". | Contenido / Formularios | Media | Mensajes en español con qué hacer ("No hay conexión. Revisa tu internet…"); nunca el texto técnico. | Arreglado |
| 18 | Si la petición fallaba con excepción, el botón se quedaba girando. | Formularios | Baja | Regresa con aviso. | Arreglado |
| 19 | El correo se podía editar mientras se enviaba; "Enviando" sin puntos suspensivos. | Formularios | Baja | Solo lectura mientras envía; "Enviando…". | Arreglado |

### Página 404 (nueva)

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 20 | **No existía**: salía la página genérica de Next en inglés ("This page could not be found"), sin barra, pie, landmarks ni "Saltar al contenido". | Navegación | Alta | `src/app/not-found.tsx` con el estilo del sitio: etiqueta "Error 404" en Mono, título grande "Esta página no existe", la burbuja de triangulitos a la derecha, un solo botón azul "Volver al inicio" y atajos (Agentes, Precios, Posibles preguntas, Pruébalo). Título "Página no encontrada · Atendel", `noindex`. | Arreglado |

### Rendimiento general

| # | Hallazgo | Categoría | Gravedad | Arreglo | Estado |
|---|---|---|---|---|---|
| 21 | El inicio en celular (procesador 4× más lento) suma ~3.7 s de tareas largas. Lo pesado: la entrada del texto (Revela y ScrollTrigger), el chat de demostración y React. | Rendimiento | Media | Los hallazgos 4 y 5. Propuesta para después: no crear Lenis en pantallas solo táctiles (ahí no suaviza nada y lee el scroll en cada cuadro). | Parcial: lo demás es el movimiento aprobado o el chat, que no se tocan aquí. |

## Revisión automática (`revisar.mjs`)

44 vistas (inicio, 7 páginas y /pruebalo, en 1440 y 390, oscuro y claro): **sin desbordes, sin texto cortado y sin errores**. Solo quedan los avisos de `.sr-only` (texto para lector de pantalla, a propósito) y el error de red de /entrar (aquí no hay Supabase), que el encargo pide ignorar.

## Revisión de contraste

Todo el texto visible de cada página (después de bajar hasta el final para que todo entre), con la mezcla real de color, opacidad y fondo. Mínimo AA: 4.5:1 en texto normal y 3:1 en texto grande (24 px o más, o 18.7 px en negritas). Total: **4,718 textos medidos, 0 fallas** (antes: 6 fallas).

| Página | Ancho | Oscuro: textos · fallas antes → después | Claro: textos · fallas antes → después |
|---|---|---|---|
| inicio | 1440 | 371 · 0 → **0** | 371 · 3 → **0** |
| inicio | 390 | 329 · 0 → **0** | 329 · 0 → **0** |
| agentes | 1440 | 199 · 0 → **0** | 199 · 0 → **0** |
| agentes | 390 | 198 · 0 → **0** | 198 · 0 → **0** |
| agentes/lola | 1440 | 106 · 0 → **0** | 106 · 0 → **0** |
| agentes/lola | 390 | 101 · 0 → **0** | 101 · 0 → **0** |
| precios | 1440 | 119 · 0 → **0** | 119 · 0 → **0** |
| precios | 390 | 114 · 0 → **0** | 114 · 0 → **0** |
| preguntas | 1440 | 78 · 0 → **0** | 78 · 3 → **0** |
| preguntas | 390 | 73 · 0 → **0** | 73 · 0 → **0** |
| para-quien-es | 1440 | 145 · 0 → **0** | 145 · 0 → **0** |
| para-quien-es | 390 | 140 · 0 → **0** | 140 · 0 → **0** |
| lista | 1440 | 51 · 0 → **0** | 51 · 0 → **0** |
| lista | 390 | 46 · 0 → **0** | 46 · 0 → **0** |
| contacto | 1440 | 51 · 0 → **0** | 51 · 0 → **0** |
| contacto | 390 | 46 · 0 → **0** | 46 · 0 → **0** |
| entrar | 1440 | 38 · 0 → **0** | 38 · 0 → **0** |
| entrar | 390 | 33 · 0 → **0** | 33 · 0 → **0** |
| 404 (nueva) | 1440 | 63 · **0** | 63 · **0** |
| 404 (nueva) | 390 | 58 · **0** | 58 · **0** |

Ningún gris del estilo se cambió: el único ajuste fue quitarle la opacidad al contador de temas y usar el gris tenue que ya existía (`--c-tenue`).

## Teclado

| Prueba | Antes | Después |
|---|---|---|
| Foco tapado por la barra al regresar con Shift+Tab (inicio, /agentes, /preguntas, /precios, /contacto) | 23 casos (4 · 12 · 3 · 3 · 1) | 0 tapados (2 campos de /contacto quedan 6 px bajo la barra, visibles) |
| Primer Tab | "Saltar al contenido" | igual |
| Menú del celular: Enter abre, Tab se queda dentro, Esc cierra y el foco regresa | bien | bien |
| Ficha: Enter abre, foco dentro, Esc cierra y el foco regresa a la fila | bien | bien |
| Pestañas con flechas y acordeón con Enter | bien | bien |
| Elementos sin anillo de foco | 1 (cuadro del chat, fuera del encargo) | igual |

## Rendimiento (Chromium sin GPU, cifras orientativas)

CLS en 0 en todas las páginas antes y después (una corrida dio 0.01 en el inicio en celular; el límite es 0.1). La medición con SwiftShader varía bastante entre corridas: las diferencias chicas son ruido.

| Página | Ancho | Tiempo bloqueado antes | Después (2 corridas) | LCP antes | LCP después |
|---|---|---|---|---|---|
| / | 1440 | 942 ms | 788 · 930 ms | 1,828 ms | 1,596 · 1,564 ms |
| /para-quien-es | 1440 | 574 ms | 587 · 598 ms | 1,396 ms | 1,296 · 1,136 ms |
| / | 390 (CPU 4×) | 3,720 ms | 3,659 · 4,081 ms | 4,252 ms | 3,708 · 428 ms |
| /para-quien-es | 390 (CPU 4×) | 1,289 ms | 1,126 · 1,073 ms | 2,252 ms | 548 · 1,784 ms |

En computadora el contenido principal aparece ~13 % antes. En celular el peso viene sobre todo de la entrada del texto y del chat (hallazgo 21).

Letras: Geist y Geist Mono ya se sirven con `next/font` (`display: swap` y respaldo ajustado): sin saltos al cargar.

## Capturas de antes y después

En esta carpeta, lado a lado (izquierda antes, derecha después), en 1440 y 390, oscuro y claro:
- `antes-despues-404-*`: la 404 nueva.
- `antes-despues-entrar-error-*`: /entrar con un correo incompleto.
- `antes-despues-preguntas-*`: /preguntas (renglones de las respuestas y contador de temas).
- `antes-despues-inicio-preguntas-*`: "Posibles preguntas" del inicio.

Los demás arreglos no cambian lo que se ve (orden de títulos, foco, zonas de toque, metadatos y rendimiento).

## Archivos que cambiaron

- `src/app/not-found.tsx` (nuevo): la 404.
- `src/lib/seo.ts` (nuevo) y los `metadata` de `layout.tsx`, `agentes`, `agentes/[agente]`, `precios`, `preguntas`, `para-quien-es`, `lista`, `contacto` y `entrar`.
- `src/app/entrar/Login.tsx`: revisión del correo y errores en español.
- `src/components/Preguntas.tsx` y `src/app/preguntas/page.tsx`: orden de títulos.
- `src/estilos/landing.css` §5: foco libre de la barra, "Saltar al contenido", contador de temas, renglones del acordeón, zonas de toque y atajos de la 404 (todo dentro de `.sitio`).
- `src/components/escena/Escena.tsx`: la figura arranca en reposo.
- `src/lib/movimiento.ts`: sin la medida duplicada al cargar.
- `.gitignore`: `__pycache__/` (lo crea el buscador de la skill).

## Lo que no se hizo

- **Chat de demostración** (hallazgo 8): etiqueta del cuadro de escribir, ícono y zonas de toque. Sus archivos están fuera de este encargo; el arreglo propuesto está en la tabla.
- **"Texto de ejemplo · revísalo"** (hallazgo 9): lo decide el dueño.
- **Color de la barra del navegador** (hallazgo 6): se comparte con el dashboard.
- **Vidrio de la barra** (hallazgo 7): es el estilo aprobado.
- **Rendimiento del inicio en celular** (hallazgo 21): lo que queda es el movimiento aprobado y el chat.
