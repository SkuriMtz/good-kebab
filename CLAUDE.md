# Atendel — instrucciones para Claude

Atendel es una suscripción de agentes de IA para microempresas mexicanas
(clínicas, consultorios, estéticas y negocios de servicios). Cuatro agentes:
**Lola** (Atención, WhatsApp y citas), **Clara** (Correo), **Víctor** (Clientes)
e **Iris** (Oficina). Stack: Next.js 14 (App Router), TypeScript, Tailwind v3,
Supabase. El dueño del proyecto no es técnico y habla español: explica todo en
español sencillo.

## Reglas que nunca se rompen

- Nunca pedir que se pegue la clave de Anthropic: va solo en Vercel como `ANTHROPIC_API_KEY`.
- Nunca poner la service role key de Supabase en el código.
- Nada inventado: ni testimonios, ni cifras, ni clientes, ni logos de clientes, ni certificaciones.
- El usuario no puede cambiar su propio plan.
- El chat de demostración del sitio público no llama a la API de IA (es guion local).
- No borrar nada de `componentes-pendientes/`.
- Nada de la marca GitHub: ni su logo, ni el Octocat, ni sus mascotas, ni su nombre, ni sus textos o ilustraciones. Se toma solo el estilo.
- Todo rediseño conserva los "muebles": páginas, contenido, los 4 agentes, sus personajes (blobs), el chat con grupos y PromptBar, formularios, navegación, modo claro/oscuro y la escena 3D de partículas. Si algo no encaja, se avisa en lugar de quitarlo.

## Guía de estilo vigente

**Prioridad del dueño: que se vea como el sitio de GitHub.** El estilo se respeta tal cual; lo propio de Atendel es el contenido (agentes, conversaciones, personajes).

La casa actual es el estilo de GitHub: `diseno/github/` (DESIGN.md, tokens.json,
theme.css, variables.css) y el resumen con contradicciones resueltas en
`diseno/guia.md`. **Léelos antes de tocar cualquier cosa visual.** El plan de
cada página está en `diseno/plan.md`. No se inventan colores, tamaños ni
componentes fuera de la base común (`src/app/globals.css` + `src/components/base/`);
si falta algo, se agrega a la base.

## Lecciones de diseño

Cada vez que el dueño rechace algo, agrega aquí la lección.

### Lo que no le gustó (dicho por él)
1. El sitio se veía **apretado**, con poco espacio entre elementos. → Respeta la separación de 64–96px entre secciones y 16–24px entre elementos; ante la duda, más aire.
2. Un botón o cartel que decía **"Menú"** se veía feo y fuera de lugar. → Nunca un botón con la palabra "Menú"; en celular, ícono de hamburguesa con `aria-label`.
3. El **chat con la IA se veía feo: puros cuadrados y cajas.** → Cada elemento del chat con jerarquía, aire y estados; nada de cajas sin intención.
4. Una versión se veía claramente **"hecha por IA"** y genérica.
5. Un rediseño a partir de un archivo de diseño **se sentía como plantilla.** → El archivo de estilo es materia prima, no un molde: la composición tiene que ser propia de Atendel.
6. Al replicar un video de referencia, quedó parecido pero **sin precisión en el movimiento.** → Medir tiempos, curvas y posiciones cuadro por cuadro; no aproximar.
7. **Las partículas brillaban demasiado.** → Brillo bajo, opacidad 0.5–0.8, sin bloom, pocos blancos.
8. Faltaba el **fondo fijo** mientras solo se mueve el contenido con el scroll.
9. El **modo claro era solo blanco y negro**, sin matices. → Usar grises cálidos y superficies secundarias (#f6f8fa), no solo #fff y #000.
10. (Escena 3D) Transiciones entre figuras que **cruzaban la pantalla en desorden** y un **"agujero negro"/círculo** visible. → Morphs cortos y ordenados espacialmente; nada de cascarones de polvo con hueco.
11. (Escena 3D) **Demasiados fragmentos opacaban la pantalla.** → Pocas partículas sueltas; el texto siempre legible.

### Lo que se aprendió del historial (git log)
- Hubo más de 10 rediseños (editorial "título de cine", "cuarto oscuro" nogal y crema, cuaderno de papel cálido, Dala negro/violeta/ámbar, escena 3D). Los que se rechazaron cambiaban el estilo pero no la composición: se sentían como la misma página con otra piel.
- Efectos de adorno se quitaron por estorbar: fondo FlowField de la portada, el Dock, el menú lateral de ramas, nombres con TrueFocus. Están en `componentes-pendientes/`. → Un solo momento protagonista por pantalla.
- Los personajes se simplificaron ("menos adornos, más personalidad en el movimiento"; sin saltito ni ojos entrecerrados). → No volver a recargarlos.
- La versión 7 (escena estilo Dala) fue la que más le gustó; su respaldo está en la rama `respaldo-version-7`.

### Reglas anti-genéricas (que no parezca hecho por IA)
- No repetir el mismo patrón en todas las secciones (título centrado + 3 tarjetas con ícono). Variar: pestañas, columnas asimétricas, el producto en grande, listas, acordeones.
- Nada de íconos dentro de círculos de colores en cada tarjeta, ni emojis como íconos.
- Nada de texto con degradado, brillos o destellos sin propósito, ni muchos efectos compitiendo. Un solo momento protagonista por pantalla.
- Nada de frases de marketing genéricas ("revoluciona tu negocio", "lleva tu negocio al siguiente nivel", "la solución todo en uno", "descubre el poder de la IA", "potencia tu productividad"). Textos concretos para clínicas, estéticas y consultorios, en español natural de México.
- Mostrar el producto real (el chat, conversaciones de los agentes, citas agendadas, correos resumidos), no ilustraciones abstractas.
- Ningún componente con el aspecto por defecto de una librería sin personalizar.
- Ningún dato inventado.
- Cuidar el detalle: `text-wrap: balance` en títulos (sin palabras sueltas), líneas de máximo ~70 caracteres, espaciados de la escala de 4px, alineación a la rejilla.
- Todo elemento interactivo con estados diseñados: hover, foco visible, activo, deshabilitado y cargando.

## Cómo trabajar

- `npm run lint` y `npm run build` deben pasar antes de cada commit.
- Para revisar visualmente: `npx next start -p <puerto>` y capturas con Playwright
  (Chromium ya instalado en `/opt/pw-browsers`; no correr `playwright install`).
  Para WebGL en headless: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
- Revisar siempre en 1440px y 390px, modo oscuro y claro.
- Commits en español, describiendo el cambio.
