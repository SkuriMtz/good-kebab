# Base común de Atendel (Paso 4 · arquitecto)

Todo lo visual del rediseño sale de aquí: **tokens** en `src/app/globals.css`
y **componentes** en `src/components/base/`. El muestrario vivo está en
**`/base`** (sin índice): ahí se ven todas las variantes y estados en los dos
modos. Manda `diseno/guia.md`; este documento dice cómo está hecho.

## Reglas para los trabajadores (Paso 5)

1. **Solo se usa la base.** Nada de hex, tamaños, radios, sombras, curvas ni
   duraciones sueltos. Usa `var(--c-…)`, `var(--t-…)`, `var(--spacing-…)`,
   `var(--radio-…)`, `var(--ease…)`, `var(--dur-…)`, las clases `t-*` y los
   componentes de `src/components/base/`. En Tailwind, los colores `tinta`,
   `grafito`, `tenue`, `enlace`, `borde`, `fondo`, etc. ya son tokens.
2. **Si falta algo, no lo inventes:** pídelo en el `ENTREGA.md` de tu rama
   (qué falta, para qué y qué valor propones de la guía). El integrador lo
   agrega a la base.
3. Toca **solo tus archivos** (tabla "Reparto de archivos" de `diseno/plan.md`).
   Tu CSS va en tu archivo de `src/estilos/` (ya existe y está importado).
4. **Un solo botón principal (azul desde la base 4b) por pantalla.** Lo demás: sutil o fantasma.
   El violeta #8052ff ya no es acción: es marca (`--c-marca`).
5. Nunca peso 700. Solo se anima `transform` y `opacity` (el acordeón usa
   `grid-template-rows`, ya resuelto en la base). Movimiento reducido: solo opacidad
   (ya lo hace el bloque global).
6. Todo interactivo con hover (dentro de `@media (hover: hover) and (pointer: fine)`
   o con `hover:` de Tailwind, que ya está limitado así), foco visible,
   presionado, deshabilitado y cargando.
7. Revisa en 1440 y 390, oscuro y claro. El claro se prueba con
   `localStorage.setItem("atendel-tema-v5", "claro")`.
8. Clases de la base: escríbelas completas. Igual, `tailwind.config.ts` tiene un
   *safelist* que conserva las clases de la base aunque se armen con plantillas
   (`boton--${x}`); las clases propias de tu grupo, escríbelas completas.

## Lo que se instaló

| Qué | Versión / origen | Licencia | Dónde |
|---|---|---|---|
| Mona Sans (variable, ejes `wght` 200–900 y `opsz`) | `MonaSansVF[opsz,wght].woff2`, versión 2.027, repositorio oficial github/mona-sans (commit `4bc6ba8`) | SIL OFL 1.1 | `src/fonts/MonaSansVF-opsz-wght.woff2` |
| Mona Sans Mono (variable, eje `wght` 200–900) | `MonaSansMonoVF[wght].woff2`, versión 2.027, mismo repositorio | SIL OFL 1.1 | `src/fonts/MonaSansMonoVF-wght.woff2` |
| Texto de la licencia | `OFL.txt` del repositorio | — | `src/fonts/OFL.txt` |

- Se cargan con `next/font/local` en `src/app/layout.tsx` como variables
  `--font-mona-sans` y `--font-mona-sans-mono`, servidas desde el propio
  dominio (la política de seguridad solo permite `font-src 'self'`).
- En npm existe `@fontsource-variable/mona-sans` (5.3.0) pero **no** existe
  Mona Sans Mono; por eso las dos se tomaron del repositorio oficial (mismo
  corte y versión). No hizo falta JetBrains Mono.
- Las clases de las fuentes van en `<html>` y en `<body>`: así el valor de
  next/font le gana al nombre genérico de `diseno/github/variables.css`.
- La Mono lleva `font-variant-ligatures: none` (si no, `--` se junta en un guion).
- **Se quitó** `@fontsource-variable/inter` (ya no se usaba).
- **No** se instalaron paquetes nuevos: los íconos son SVG propios (`Iconos.tsx`).
- `layout.tsx` ahora importa `diseno/github/variables.css` (antes `diseno/variables.css`).

## Tokens (`src/app/globals.css`)

Tres capas: **primitivos** (de `diseno/github/variables.css` + los de Atendel
y Primer) → **semánticos** (`--c-*`, cambian por modo) → **de componente**.
Los semánticos se aplican con `:root` / `data-tema` en `<html>`; también se
pueden aplicar a un trozo de página con `data-tema="oscuro|claro"` (el muestrario
lo usa para enseñar los dos modos lado a lado).

### Color

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--c-portada` | `#000000` | `#f7f6f3` (gris cálido) | Fondo de la portada |
| `--c-fondo` | `#0d1117` | `#ffffff` | Página |
| `--c-fondo-2` | `#151a22` | `#f6f8fa` | Franjas y superficies secundarias |
| `--c-superficie` | `#151a22` | `#ffffff` | Inputs, botones elevados, paneles |
| `--c-relleno` | `#090d0a` | `#efede8` | Relleno casi negro / matiz cálido |
| `--c-borde` | `#21262d` | `#d1d9e0` | Bordes 1px |
| `--c-borde-fuerte` | `#484f58` | `#818b98` | Divisiones marcadas |
| `--c-texto` | `#ffffff` | `#1f2328` | Títulos y texto principal |
| `--c-texto-2` | `#a4aea6` | `#59636e` | Cuerpo |
| `--c-tenue` | `#7c8980` | `#656d76` | Terciario (AA en los dos) |
| `--c-enlace` / `--c-acento` | `#8dd6ff` | `#0969da` | Enlaces y acento frío |
| `--c-accion` | `#0071e3` | `#0071e3` | Botón principal, AZUL desde la base 4b (texto blanco: 4.7:1). Antes violeta. |
| `--c-sobre-accion` | `#ffffff` | `#ffffff` | Texto sobre la acción |
| `--c-destacada` | `#8c93fb` | `#8c93fb` | Borde de lo destacado |
| `--c-foco` | `#8dd6ff` | `#0969da` | Anillo de foco |
| `--c-error` | `#f85149` | `#cf222e` | Error (claro cambió de #d1242f a #cf222e en la base 4b) |
| `--c-exito` | `#3fb950` | `#1a7f37` | Éxito (Primer) |
| `--c-vidrio` | `rgba(255,255,255,.06)` | `#ffffff` | Tarjeta de vidrio |
| `--c-vidrio-fuerte` | `rgba(255,255,255,.1)` | `#ffffff` | Vidrio más presente |
| `--c-vidrio-frost` | `rgba(255,255,255,.2)` | `rgba(255,255,255,.8)` | Ventanas flotantes |
| `--c-vidrio-borde` | `rgba(255,255,255,.1)` | `#d1d9e0` | Borde del vidrio |
| `--c-halo` | `rgba(167,162,255,.5)` | igual | Halo de la portada |
| `--halo-opacidad` | `0.6` | `0.35` | Opacidad del halo |
| `--c-scrim` | `rgba(1,4,9,.8)` | `rgba(31,35,40,.5)` | Velo detrás de ventanas |
| `--agente-lola/clara/victor/iris` | `#ff8a6b` `#7fb2ff` `#5fd09f` `#f6c64a` | igual | Identidad de los agentes (solo en personajes y marcas) |

De componente: `--c-sutil-fondo/-texto/-borde`, `--c-fantasma-texto/-borde`,
`--c-campo-fondo/-borde/-borde-hover`, `--c-placeholder`,
`--c-pildora-borde/-activa`, `--c-sobre-pildora-activa`, `--c-marco-fondo/-barra`.

Primitivos agregados: `--color-violeta-atendel` (#8052ff),
`--color-violeta-atendel-hondo` (#6e40f0), `--color-haz-*`, `--color-rastro-*`,
`--primer-*` (valores de Primer), `--gris-calido-1/2/3` (#f7f6f3, #efede8, #e3dfd7).

**Nombres heredados** (siguen vivos para que nada se rompa; no usar en código
nuevo): `--c-velo` → vidrio, `--c-velo-fuerte` → vidrio fuerte,
`--c-filo-campo` → borde fuerte, `--hairline` → borde, `--color-acento` → acción,
`--color-void`, `--color-bone-white`, `--color-silver-mist`, `--color-ash-gray`,
`--color-electric-iris`, `--color-saffron-spark`, `--color-deep-verdant`.

### Tipografía (Mona Sans; nunca 700)

| Clase | Tamaño | Peso | Interlineado / tracking | Color |
|---|---|---|---|---|
| `.t-display` (= `.t-display--enorme`, `.t-portada`) | 64px → 38px en celular (`--t-display`) | 425 | 1.08 / −0.035em | texto |
| `.t-grande` | 48 → 34 (`--t-grande`) | 440 | 1.18 / −0.02em | texto |
| `.t-seccion` | 40 → 30 (`--t-seccion`) | 460 | 1.2 / −0.015em | texto |
| `.t-titulo` | 24 | 600 | 1.3 | texto |
| `.t-sub` | 22 | 440 | 1.4 | texto |
| `.t-intro` | 18 | 400 | 1.5 / 0.01em, máx. 640px | texto-2 |
| `.t-editorial` | 16 | 400 | 1.5 | texto |
| `.t-cuerpo` | 16 | 400 | 1.5 | texto-2 |
| `.t-chico` | 14 | 400 | 1.5 | tenue |
| `.t-caption` | 12 | 400 | 1.5 | tenue |
| `.t-mono` | Mono 14 | 400 | 1.5, números tabulares | — |
| `.etiqueta` / `.t-etiqueta` | Mono 12 | 500 | mayúsculas, 0.015em | texto-2 (`--cielo`, `--tenue`, `--texto`) |
| `.t-rol` | Mono 12 | 500 | mayúsculas | enlace |

Títulos con `text-wrap: balance` y párrafos con `pretty` (capa base).
Pesos: `--peso-display` 425, `--peso-grande` 440, `--peso-seccion` 460,
`--peso-sub` 440, `--peso-titulo` 600, `--peso-cuerpo` 400, `--peso-medio` 500.

### Espacio, ancho y radios

- Escala de 4px: `--spacing-4, 8, 12, 16, 20, 24, 28, 32, 40, 44, 48, 64, 80, 96`.
- `--espacio-seccion`: 64px → 96px (clamp). `--espacio-bloque` 48px (encabezado → contenido).
  `--espacio-elementos` 24px, `--espacio-chico` 16px, `--relleno-tarjeta` 24px.
- `--ancho-max` 1200px, `--ancho-texto` 640px, `--orilla` 20 / 24 / 32px, `--barra-h` 64px.
- Heredados llevados a la rejilla de 4px: `--spacing-6`→8, `-18`→20, `-30`→32, `-36`→40, `-60`→64, `-120`→96.
- Radios: `--radio-boton` 6, `--radio-panel` 6, `--radio-campo` 8, `--radio-marco` 8,
  `--radio-imagen` 16, `--radio-tarjeta` 24, `--radio-pildora` 60, `--radio-circulo` 9999.
  (`--radius-inputs` se corrige a 8px como resuelve la guía.)
- Controles: `--alto-control` 40, `-grande` 48, `-chico` 36. Íconos: 16 / 20 / 24.

### Movimiento

`--ease` cubic-bezier(0.25,0.1,0.25,1) · `--ease-entrada` cubic-bezier(0.16,1,0.3,1)
· `--dur-micro` 0.2s · `--dur-grande` 0.4s. Solo `transform` y `opacity`.
Bloque global `prefers-reduced-motion`: deja solo transiciones de opacidad.
Cambio de modo: fundido cruzado con View Transitions (0.4s) en `ponerTema`
(`src/lib/tema.ts`); la clave `atendel-tema-v5` y `data-tema` no cambiaron.
Cada página entra con un fundido (`.page-enter`, `template.tsx`).

### Capa base

Anillo de foco único (`:focus-visible`: 2px `--c-foco`, separación 2px), sin
destello gris al tocar, `touch-action: manipulation` y sin selección de texto
en controles, inputs a 16px mínimo (sin zoom en iPhone), `hover:` de Tailwind
solo con puntero fino (`hoverOnlyWhenSupported`).

## Componentes base (`src/components/base/`)

| Componente | API | Cuándo |
|---|---|---|
| `Boton.tsx` → `<Boton>` | `variante` principal \| sutil \| fantasma · `tam` normal \| grande \| chico · `bloque` · `cargando` · `icono` · `flecha` · `href` (enlace con next/link) · `deshabilitado` (enlaces) / `disabled` (botones). `claseBotonBase()` da las clases. | Principal: la acción de la pantalla (una). Sutil: alternativa ("Prueba los agentes"). Fantasma: secundarias y navegación. |
| `TarjetaVidrio.tsx` | `nivel` normal \| fuerte \| frost · `destacada` · `relleno` normal \| amplio \| ninguno · `as` | Tarjetas, paneles de contenido, planes (destacada = recomendada), fichas (frost). |
| `Campo.tsx` → `<Campo>`, `<CampoCorreo>` | `etiqueta` · `error` · `ayuda` · `alCambiar(valor)` · `multilinea` (textarea con contador si hay `maxLength`) · atributos normales de input/textarea | Cualquier campo de formulario. `ui/Field.tsx` ahora lo envuelve. |
| `Pestanas.tsx` | `pestanas[{id, etiqueta, adorno?, contenido?, deshabilitada?}]` · `etiqueta` (aria-label) · `activa`/`alCambiar` (controlado) o `inicial` · `alineacion` centro \| izquierda | Cambiar de vista en el mismo lugar (agentes, negocios). Flechas/Inicio/Fin; en celular se desliza. |
| `Etiqueta.tsx` | `tono` cuerpo \| cielo \| tenue \| texto · `as` | Sellos de hora y canal, rótulos sobre títulos. |
| `MarcoNavegador.tsx` | `pestanas[{etiqueta, adorno?, activa?, id?}]` · `direccion` · `titulo` · `relleno` · `alElegir` (vuelve botones las pestañas) | Mostrar el producto (chat, conversaciones, paneles). Dentro: `.marco__panel`. |
| `Seccion.tsx` → `<Seccion>`, `<EncabezadoSeccion>` | Sección: `fondo` fondo \| portada \| fondo-2 \| ninguno · `espacio` normal \| compacto \| ninguno · `halo` · `ancho` normal \| angosto · `etiquetadaPor`. Encabezado: `adorno`, `etiqueta`, `titulo`, `texto`, `alineacion`, `nivel`, `id` | Toda sección de página. |
| `Halo.tsx` | `variante` halo \| haz \| rastro · `x`, `y`, `ancho`, `proporcion` · `suave` | Atmósfera detrás de títulos. Dentro de `.con-halo` (o `<Seccion halo>`). |
| `Acordeon.tsx` | `items[{id?, titulo, contenido}]` · `unoALaVez` · `abiertos` · `nivelTitulo` | Preguntas, listas largas plegables. |
| `Iconos.tsx` → `<Icono>`, `<Giro>` | `nombre` (chevron, chevron-derecha, flecha, flecha-arriba-derecha, candado, escudo, mano, correo, mensaje, calendario, usuarios, documento, check, check-circulo, alerta, menu, cerrar, sol, luna, enviar, reloj, mas) · `tono` cuerpo \| cielo · `tam` · `trazo` 1.5–2 · `titulo` (si va solo) | Todos los íconos. Nada de emojis ni íconos en círculos de color. |

Fuera de `base/`:

- `src/components/FormularioLista.tsx`: campo de correo + "Únete a la lista"
  (principal) + "Prueba los agentes" (sutil, a /pruebalo). Estados: vacío,
  escribiendo, enviando, enviado ("Listo. Te escribimos a …"), error. Se apila en
  celular. Props: `centrado`, `etiquetaBoton`, `conSecundario`. Campo trampa contra bots.
- `src/components/Buttons.tsx`: puente para lo existente: `claseBoton`/`BotonLink`
  mapean primario→principal, suave→sutil, texto/borde→fantasma.
- `src/components/Preguntas.tsx`: mismo contenido, ahora con `<Acordeon>`.
- Clases de estructura: `.contenedor`, `.contenedor--angosto`, `.seccion`,
  `.dos-columnas`, `.columnas-asimetricas` (5/7, `--invertidas`), `.divisor`,
  `.pildora`, `.lista-check`, `.marca-agente` (`--mini` 28, `--chica` 40, `--grande` 64).

## Lista de espera y contacto

- `supabase/migrations/0005_solicitudes.sql`: tabla `solicitudes` (id, creada,
  tipo lista \| contacto, correo, nombre, negocio, mensaje) con RLS; anónimos y
  autenticados **solo pueden insertar** (permiso por columna); nadie lee desde el
  sitio. Límites de largo y forma del correo en la base; un correo una sola vez en la lista.
- `src/app/api/lista/route.ts` (POST) valida, usa el cliente de Supabase del
  servidor (clave pública, nunca la service role) y responde `{ ok }` o
  `{ ok: false, error }`. Si la tabla no existe, contesta un mensaje amable (503).
- `src/lib/lista.ts`: tipos, validación compartida y `enviarSolicitud()`.
- **Falta correr la migración en Supabase** (no se aplicó a ninguna base): hasta
  entonces el formulario dice "La lista de espera abre muy pronto…".

## Inicio y archivos por grupo

`src/app/page.tsx` compone, en el orden del plan: `Portada` (#000, escena 3D
tenue de fondo recortada a la portada, halo, formulario) → `ChatEnMarco` →
`Agentes` → `QueEs` → `ComoFunciona` → `ParaQuien` → `Seguridad` → `Precios` →
`PreguntasInicio` → `CtaFinal` (en `src/components/inicio/`). Son versiones base
reales; cada grupo reemplaza la suya. `Sitio` acepta `fondo="ninguno"` (el inicio
monta su propia escena) y `Escena3D` acepta `tenue`.
CSS por grupo (vacíos, importados después de globals.css): `src/estilos/portada.css`,
`chat.css`, `agentes.css`, `informativas.css`, `conversion.css`, `estructura.css`, `tema-claro.css`.

## Pendientes que se dejan a los grupos (no son de la base)

- Grupo 6: la barra todavía usa el botón principal en "Pruébalo" (el plan pide
  sutil para dejar el color de acción —ahora azul— a cada pantalla) y el pie sigue en una fila.
- Grupo 1: afinar la escena 3D de la portada (hoy al 45% de opacidad, 32% en
  celular; oculta en modo claro porque se pinta sobre negro).
- Grupo 5: en `/preguntas` el candado de partículas queda detrás del acordeón.
- Las páginas viejas (agentes, precios, para quién es, preguntas, entrar,
  panel) ya usan los tokens nuevos pero conservan su composición anterior.

---

# Base 4b — dashboard (Paso 4b · arquitecto, 8 oct)

Dirección nueva del dueño: el **panel** y **`/pruebalo`** son un dashboard con
la arquitectura del dashboard de GitHub y el refinamiento visual de Apple,
**acento azul** y **oscuro primero** (ver `diseno/guia.md` → "Actualización:
dashboard", que manda). Todo lo de abajo está vivo en **`/base`** (sección
"Dashboard" arriba de todo, y una sección por componente, en oscuro y claro).
Capturas: `diseno/capturas/paso4b/`.

## Qué cambió para los grupos (léelo primero)

1. **El violeta ya no es acción.** `--c-accion` es **azul #0071e3** (hover
   #0077ed) en los dos modos y en TODO el sitio: `Boton variante="principal"`,
   `.btn--primario`, el botón de enviar del PromptBar, la burbuja propia del
   chat viejo (`--chat-tu`) y la selección de texto ya salen azules sin tocar
   nada. El violeta #8052ff queda como **`--c-marca`**: solo identidad (logo,
   personajes, detalles muy puntuales). **Nunca** en botones.
   Sigue la regla: **un solo botón principal por pantalla**.
2. **`.producto`**: pon `class="producto"` en el contenedor del dashboard (panel,
   `/pruebalo`, chat). Adentro, los `--c-*` de siempre toman los valores del
   producto del modo actual, la letra pasa a la pila del sistema a 14px y los
   radios a los del dashboard. La base y el chat se ven "de producto" sin
   cambiar su código. Afuera (sitio público) nada cambia.
3. **Mona Sans se queda para el sitio público.** El producto usa
   `--font-producto` (la pila del sistema: en Mac/iPhone se ve como Apple).
4. Nombres que **no** cambiaron: todos los `--c-*`, `--agente-*`, `--radio-*`,
   `--t-*` existentes; la clave de tema `atendel-tema-v5` y `data-tema`.
5. Renombrado: la clase `.escena` (fondo de partículas 2D) ahora es
   **`.escena-fondo`** (ya se cambió en `escena/Escena.tsx`). Era un nombre
   genérico que quitaba los clics a quien lo usara para otra cosa.

## Tokens nuevos (`src/app/globals.css`)

### Primitivos

| Token | Valor | Para qué |
|---|---|---|
| `--azul-accion` / `--azul-accion-hover` | #0071e3 / #0077ed | Botón principal y su hover |
| `--azul-enlace-noche` / `--azul-enlace-dia` | #4ea1ff / #0066cc | Texto azul de acción y enlaces del producto |
| `--noche-texto` / `--noche-texto-2` / `--noche-tenue` | #f0f6fc / #9198a1 / #6e7681 | Textos del producto en oscuro |
| `--noche-division` | #30363d | Divisiones en oscuro |
| `--noche-ambar` / `--dia-ambar` | #d29922 / #9a6700 | Atención |
| `--dia-blanco` / `--dia-niebla` / `--dia-papel` | #ffffff / #f5f5f7 / #fafafc | Superficies del producto en claro |
| `--dia-borde` / `--dia-borde-suave` | #d6d6d6 / #e6e6e8 | Bordes en claro |
| `--dia-tinta` / `--dia-pizarra` / `--dia-acero` | #1d1d1f / #707070 / #86868b | Textos del producto en claro |
| `--dia-rojo` | #cf222e | Error en claro |

### Semánticos (cambian solos entre oscuro y claro)

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--c-accion` | #0071e3 | #0071e3 | Botón principal (uno por pantalla) |
| `--c-accion-hover` | #0077ed | #0077ed | Hover del principal (capa que se funde con opacidad) |
| `--c-accion-presion` | #0071e3 + 14% negro | igual | Al presionar el principal |
| `--c-accion-texto` | #4ea1ff (6.9:1) | #0066cc (5.6:1) | Texto azul de acción, enlaces del producto, foco en `.producto` |
| `--c-accion-fondo` | azul al 15% | azul al 10% | Insignia azul, fondo de "seleccionado" con tinte |
| `--c-marca` | #8052ff | #6e40f0 | Violeta: SOLO identidad |
| `--c-exito` | #3fb950 | #1a7f37 | Solo insignias y puntos |
| `--c-atencion` | #d29922 | #9a6700 | Solo insignias y puntos ("espera tu visto bueno") |
| `--c-error` | #f85149 | #cf222e | Solo insignias, puntos y mensajes de error |
| `--c-exito-fondo` / `--c-atencion-fondo` / `--c-error-fondo` | su color al 15% | al 10–12% | Fondo de la insignia de ese estado |
| `--c-hover` | texto al 6% | texto al 5% | Matiz al pasar el cursor (filas, botones de ícono) |
| `--c-activo` | texto al 10% | texto al 8% | Seleccionado / elemento activo del lateral |
| `--c-elevado` | texto al 8% sobre el fondo | al 6% | Superficie elevada **opaca** (burbuja neutra, avatar de iniciales, chips) |
| `--c-propio` | azul-texto al 12% sobre el fondo | al 10% | "Lo mío" con tinte azul (mi mensaje, mi elemento), si se quiere |
| `--c-terciario` | #7c8980 (en `.producto`: #6e7681) | #656d76 (en `.producto`: #86868b) | Placeholders, deshabilitado, íconos inactivos. **No** para texto que hay que leer (en el producto no llega a AA) |
| `--sombra-flotante` | 0 8px 24px rgba(0,0,0,.24) | 0 8px 24px rgba(0,0,0,.08) | **Solo** lo que flota: menús, cajón, modal. Tarjetas sin sombra |
| `--c-menu-fondo` | superficie al 94% | al 92% | Panel de menú (vidrio, con blur 20px) |

### Producto (`--c-app-*`; dentro de `.producto` se vuelven los `--c-*`)

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--c-app-fondo` | #0d1117 | #f5f5f7 | Fondo de la app |
| `--c-app-superficie` | #151a22 | #ffffff | Tarjetas y paneles |
| `--c-app-superficie-2` | mezcla 50% de las dos de arriba | #fafafc | Superficie alterna |
| `--c-app-lateral` | #0d1117 | #fafafc | Menú lateral y cajón (`--c-lateral` en `.producto`) |
| `--c-app-barra` | #0d1117 al 82% | blanco al 72% | Barra superior translúcida (con `backdrop-filter: blur(20px)`; `--c-barra` en `.producto`) |
| `--c-app-borde` | #21262d | #e6e6e8 | Bordes sutiles |
| `--c-app-division` | #30363d | #d6d6d6 | Divisiones y contornos de control |
| `--c-app-texto` | #f0f6fc | #1d1d1f | Texto principal |
| `--c-app-texto-2` | #9198a1 (6.5:1) | #707070 (4.9:1) | Secundario |
| `--c-app-tenue` | #6e7681 (4.1:1) | #86868b (3.6:1) | Terciario: no para leer |

**Qué hace `.producto`** (así se mapea): fondo → `app-fondo`; superficie,
campos, vidrio → `app-superficie` (las tarjetas del producto son **sólidas**,
sin blur); borde → `app-borde`; borde-fuerte → `app-division`; texto →
`app-texto`; texto-2 y **tenue → `app-texto-2`** (el terciario de lectura se
queda en AA); `--c-terciario` → `app-tenue`; enlace, acento, foco y destacada
→ `--c-accion-texto`; botón sutil → neutro con contorno; botón fantasma →
sin borde; píldora activa → texto del producto. Radios: botón y campo 8,
panel y marco 12, tarjeta 16, píldora 9999. `--t-cuerpo` → 14px, `--t-intro`
→ 16px, `--barra-h` → 56px, `--relleno-tarjeta` → 20px. Títulos h1–h4 a 600.
Las variables van sin capa (para ganarle a `data-tema` en el mismo
elemento); el fondo, color y letra van en `@layer components` (Tailwind les
puede ganar). Si un trozo necesita otro modo, pon `data-tema` en el **mismo**
elemento que `.producto` o en uno de afuera, no adentro.

### Tipografía de producto (nunca 700)

| Token / clase | Valor |
|---|---|
| `--font-producto` | -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif |
| `.t-app` | 14px / 1.43 / −0.01em (es el cuerpo de `.producto`) |
| `.t-app-etiqueta` | 12px / 500 / 1.33, texto-2 (sin mayúsculas: no es la etiqueta Mono del sitio) |
| `.t-app-mediano` | 16px / 600 (títulos de tarjeta) |
| `.t-app-titulo` | 20px / 600 / 1.25 (título de panel) |
| `.t-app-titulo-grande` | 24px / 600 (título de vista) |
| `.t-app-saludo` | 28 → 32px / 600 / −0.02em (bienvenida) |
| `.cifras` | `font-variant-numeric: tabular-nums` (horas, contadores, métricas, tablas) |
| Tokens | `--t-app-etiqueta` 12 · `--t-app-cuerpo` 14 · `--t-app-mediano` 16 · `--t-app-titulo` 20 · `--t-app-titulo-grande` 24 · `--t-app-saludo` · `--interlineado-app` 1.43 · `--tracking-app` −0.01em · `--tracking-app-saludo` −0.02em · `--peso-app-medio` 500 · `--peso-app-titulo` 600 |

### Formas, medidas y movimiento

| Token | Valor | Uso |
|---|---|---|
| `--radio-app-control` | 8px | Botones e inputs del producto |
| `--radio-app-tarjeta` | 12px | Tarjetas compactas, filas, paneles internos |
| `--radio-app-menu` | 14px | Menús desplegables |
| `--radio-app-panel` | 16px | Tarjetas y paneles grandes |
| `--radio-app-pildora` | 9999px | Filtros, pestañas y buscador |
| `--radio-burbuja` / `--radio-burbuja-esquina` | 16px / 6px | Burbuja de chat y su esquina hacia quien habla |
| `--radio-kbd` | 6px | Teclas |
| `--barra-app-h` | 56px | Barra superior |
| `--ancho-app-lateral` / `--ancho-app-columna` / `--ancho-app-max` | 256 / 320 / 1440px | Lateral, columna derecha, las tres juntas |
| `--ancho-cajon` | min(85vw, 320px) | Cajón en celular |
| `--alto-app-fila` | 48px | Filas de lista (44–52) |
| `--alto-control-compacto` | 32px | Botones e íconos de la barra (44px de área táctil en celular) |
| `--espacio-app-tarjeta` / `-amplio` | 20 / 24px | Padding de tarjeta |
| `--espacio-app-bloques` / `-amplio` | 24 / 32px | Entre bloques |
| `--avatar-20/24/28/32/40/64` | 20…64px | Avatares |
| `--dur-salida` | 0.15s | Lo que se cierra (menús) sale más rápido de lo que entra |
| `--dur-respiro` | 12s | Atmósfera lenta y continua (pedido de G1-T4) |

Tailwind (`tailwind.config.ts`): colores `atencion`, `accion-texto`, `marca`,
`terciario`, `elevado`, `propio`, `capa-hover`, `capa-activa`, `lateral`;
radios `control`, `tarjeta-app`, `menu`, `panel-app`, `burbuja`, `circulo`;
`font-producto`; `shadow-flotante`. Ej.: `rounded-panel-app border border-borde bg-superficie`.

## Componentes nuevos (`src/components/base/`)

Todos accesibles, con hover (solo con puntero fino), foco visible, presionado,
deshabilitado y, donde aplica, cargando. Movimiento: 0.2s micro / 0.4s
grande; menús con opacidad + escala 0.98→1 + 4px; solo transform y opacity;
con movimiento reducido, solo opacidad.

| Componente | API | Notas |
|---|---|---|
| `Menu.tsx` → `<Menu>` | `etiqueta` (nombre) · `disparador` (ReactNode) · `aspecto` icono \| avatar \| boton \| libre · `etiquetaDisparador` · `claseDisparador` · `elementos` · `encabezado` {nombre, correo, foto, estado {tono, etiqueta}} · `alineacion` inicio \| fin · `lado` abajo \| arriba · `abiertoInicial` · `alCambiar(abierto)` | Elementos: `{id, etiqueta, icono, descripcion, href \| alElegir, peligroso, deshabilitado, pronto, atajo: ["N"], contador, actual}`, `{tipo:"separador"}`, `{tipo:"titulo", etiqueta}`. Panel radio 14, borde, `--sombra-flotante`, vidrio (sólido con `prefers-reduced-transparency`), sale desde su disparador. Clic afuera, Esc (foco vuelve), Tab, ↓ ↑ Inicio Fin, primera letra. Abierto con teclado → foco al primero; con mouse → al panel. `pronto` = deshabilitado con insignia "Pronto". |
| `Avatar.tsx` → `<Avatar>`, `iniciales()` | `nombre` · `src` · `tam` 20 \| 24 \| 28 \| 32 \| 40 \| 64 · `estado` (tono) · `etiquetaEstado` · `etiqueta` (si va solo) · `anillo` · `children` (personaje) | Foto (si falla, iniciales), iniciales sobre `--c-elevado`, filo interior de 1px. Decorativo por defecto. |
| `Insignia.tsx` → `<Insignia>` | `tono` neutra \| azul \| exito \| atencion \| error \| pronto · `contador` · `max` (99+) · `solida` · `punto` · `conPunto` · `sobre` · `etiqueta` (lectura) · `oculta` | Píldora 20px, 12/500, números tabulares. `sobre`: encima de un botón de ícono con anillo (`--anillo`). |
| `Buscador.tsx` → `<Buscador>` | `etiqueta` · `placeholder` · `valor`/`alCambiar` o `inicial` · `alBuscar` · `atajo` (sí) · `tam` normal 36 \| compacto 32 · `deshabilitado` · `name` · ref al input | `role="search"`. "/" lo enfoca desde cualquier parte (uno por página). Esc borra/suelta, ✕ borra. 16px táctil, 14px con mouse. Foco: superficie + anillo azul. |
| `Cajon.tsx` → `<Cajon>` | `abierto` · `alCerrar` · `titulo` o `cabeza` · `etiqueta` · `lado` izquierda \| derecha | `<dialog>` modal (encima de todo, foco atrapado y devuelto, resto inerte). Bloquea el scroll. Cierra con Esc, velo, ✕ o deslizando con el dedo (1:1, cierra pasando 30% o con gesto rápido; resorte si jalas al revés). Entra 0.4s, sale 0.3s. Área segura del iPhone. |
| `Kbd.tsx` → `<Kbd>` | `children` o `teclas={["Ctrl","K"]}` | Mona Sans Mono 12px. No mostrar en táctil. |
| `PuntoEstado.tsx` → `<PuntoEstado>` | `tono` exito \| azul \| atencion \| error \| neutro · `etiqueta` · `mostrarEtiqueta` · `pulso` · `grande` · `sobre` | 8px (10 grande). El color nunca va solo: la etiqueta se ve o se lee. `pulso` late con opacidad ("trabajando ahora"). |
| `BarraProgreso.tsx` → `<BarraProgreso>` | `etiqueta` · `valor` · `max` · `unidad` · `mostrarValor` · `ocultarEtiqueta` · `detalle` · `umbralAtencion` (0.8) · `umbralError` (1) | `role="progressbar"` con `aria-valuetext` ("320 de 500 mensajes"). Pista 6px; relleno con `translateX` (0.4s). Ámbar desde 80%, rojo al tope. |
| `Escribiendo.tsx` → `<Escribiendo>` | `quien` · `variante` burbuja \| suelto · `conTexto` | El "escribiendo…" compartido (pedido de G1 y G2). `role="status"`. Solo opacidad; con movimiento reducido sigue, más lento. Al integrar, puede reemplazar a `.conversa__puntos`, `.muestra__escribe` y `.chat-app__puntos`. |
| `Boton.tsx` (actualizado) | `tam` ahora también **"compacto"** (32px, 14/500, área táctil 44) · nuevo **`<BotonIcono etiqueta icono tam contador punto etiquetaContador anillo>`** | `BotonIcono`: 32px (compacto) o 44px, capa `--c-activo` al pasar/presionar, se queda puesta con `aria-expanded`/`aria-pressed`. `etiqueta` obligatoria. |
| `Iconos.tsx` (ampliado) | `campana`, `buscar`, `inicio`, `conversaciones`, `agentes` (un personaje), `clientes`, `grafica`, `ajustes`, `ayuda`, `perfil`, `persona`, `facturacion`, `negocio`, `cerrar-sesion`, `flecha-izquierda`, `chevron-izquierda`, `pausa`, `reproducir`, `repetir`, `copiar`, `basura`, `barra-lateral`, `estrella`, `fijar`, `filtro`, `puntos`, `check-doble`, `rayo` | Mismo trazo (1.75, rejilla de 24). Equivalencias con lo que pidieron: papelera → `basura`; panel-lateral → `barra-lateral`; seguir/play → `reproducir`. |
| `MarcoNavegador.tsx` (actualizado) | igual | Con `alElegir`, el cuerpo es `role="tabpanel"` con `aria-labelledby`, la pestaña activa lleva `aria-controls` y las flechas ← →, Inicio y Fin recorren las pestañas. |
| `Etiqueta.tsx` (actualizado) | acepta `data-*`, `aria-*`, `title`… | Pasan al elemento. |

Clases CSS de las piezas: `.menu*`, `.avatar*`, `.insignia*`, `.punto-estado*`,
`.kbd`, `.buscador*`, `.cajon*`, `.progreso*`, `.escribiendo*`,
`.boton--compacto`, `.boton-icono--capa`, `.boton-icono--compacto`, `.t-app*`, `.cifras`.

## Composición de referencia (en `/base#dashboard`)

Barra superior 56px translúcida (logo + "/ Resumen", buscador compacto con
"/", "+" con menú de acciones rápidas, campana con contador, avatar con menú
de perfil) · lateral de 256px (activo con relleno `--c-activo`, "Pronto" donde
no hay nada, "Tus agentes" con personaje y punto de estado) · tarjetas sólidas
(bienvenida con saludo de 28–32px, un solo botón principal azul y uno sutil;
actividad con filas y "escribiendo…"; columna derecha con uso del plan y
próximas citas). En celular el lateral vive en el `<Cajon>` (botón de barra
lateral). Es una **referencia**, no la entrega del Grupo 7: el Grupo 7 compone
la suya en `src/components/dashboard/*` y `src/estilos/dashboard.css` con
estas piezas. Los datos son de ejemplo (marcados "Datos de ejemplo").

## Pedidos a la base de los grupos 1 y 2

| Pedido | Quién | ¿Se atendió? |
|---|---|---|
| Indicador "escribiendo…" compartido | G1-T3, G2-T1 | **Sí**: `<Escribiendo>`. |
| Íconos: papelera, barra lateral, persona, copiar, buscar, pausa, seguir, repetir, chevron izquierda | G2-T2, G2-T3, G2-T4, G2-T5 | **Sí** (con los nombres de la tabla de arriba). |
| `--c-hover` / `--c-activo` (matices de hover y seleccionado) | G2-T3, G2-T5 | **Sí**, en los dos modos y recalculados dentro de `.producto`. |
| Radio de burbuja | G2-T1 (12px), G2-T2 (16px) | **Sí**: `--radio-burbuja` 16px (+ `--radio-burbuja-esquina` 6px). Se eligió 16: cuadra con las tarjetas del dashboard (16) y con la burbuja anterior. |
| Tamaños de avatar | G2-T4 (la propuesta ganadora del Grupo 2) | **Sí**: `--avatar-20/24/28/32/40/64` y `<Avatar tam>`; cubren sus `.chat__avatar--24/28/32/40/64`. |
| Tono de atención (#d29922 / #9a6700) | G2-T1 | **Sí**: `--c-atencion` (+ fondos de los tres estados). |
| Superficie elevada / burbuja propia / "lo propio" | G2-T3, G2-T5 | **Sí**: `--c-elevado` (neutro, opaco) y `--c-propio` (tinte azul). El grupo elige cuál usa su burbuja. |
| `MarcoNavegador`: `tabpanel` y `aria-controls` | G2-T2 | **Sí** (más flechas ← →). |
| `Etiqueta` con `data-*` | G1-T5 | **Sí** (acepta todos los atributos). |
| Renombrar `.escena` | G2-T5 | **Sí**: `.escena-fondo` (y `Escena.tsx`). |
| `.halo` con z-index variable | G1-T4 | **Sí**: `z-index: var(--halo-z, -1)`. |
| Token de duración larga de atmósfera | G1-T4 (12s), G1-T5 (7s) | **Sí, uno**: `--dur-respiro: 12s` (el de la propuesta ganadora G1-T4). No se agregó el de 7s de G1-T5. |
| Viñeta de `.escena3d` por modo | G1-T3 | **Sí, como opción**: `--escena-vineta` (por defecto la negra de siempre; una escena que pinta en el color del modo usa `var(--c-portada)`). No se cambió el valor por defecto porque la escena "historia" sigue pintando sobre negro. |
| Quitar la regla que ocultaba la escena 3D en modo claro | G1-T3, G1-T5 | **No se borró, se acotó**: solo afecta a la variante heredada `.escena3d--tenue` (la historia, que pinta sobre negro; la portada base de esta rama todavía la usa y sin la regla se vería un bloque negro en claro). Las escenas nuevas (`--polvo` de G1-T4, `--portada` de G1-T1) no llevan esa clase y se ven en los dos modos. |
| Quitar las reglas `.escena3d--tenue` | G1-T1, G1-T2, G1-T4 | **No (todavía)**: en esta rama las usa la portada base y G1-T4 las conserva como "heredado". El integrador las quita cuando ningún archivo use `tenue`. |
| Borrar el bloque `.chat-app*` de `globals.css` | G2-T1…T5 | **No**: verificado con grep, en esta rama lo usan `ChatDemo.tsx`, `panel/chat/Chat.tsx`, `chat/Piezas.tsx`, `portadas/ConversacionEnVivo.tsx` (`.chat-app__puntos`) y `ScrollSuave.tsx` (`.chat-app`). Se borra al integrar el chat ganador, dejando `.chat-app__puntos` + `@keyframes chat-app-punto` mientras `ConversacionEnVivo` exista (o cambiándolo por `<Escribiendo>`). Lo mismo para `.marco__cuerpo > .chat-app` (G2-T4). |
| Tamaños de personaje 64–176px | G1-T5 | **No**: la propuesta no ganó y el Grupo 3 es dueño de los personajes; si lo necesita, lo pide. |
| `--tracking-display-chico` | G1-T4 (opcional) | **No**: la ganadora ya usa `--tracking-grande`, que es lo que pide la curva de la guía. |
| Anchos del chat (lista 280–300, lectura 880, texto 680, tarjeta 440) | G2-T4 | **No**: dependen de dónde viva el chat; ahora vive dentro del dashboard (lateral 256 + columnas), así que el integrador los decide con el chat ganador. Para el dashboard ya están `--ancho-app-*`. |
| Agregar `.charla` a `ScrollSuave` | G2-T3 | **No**: no hace falta, sus zonas usan `data-lenis-prevent`, que ya funciona. `ScrollSuave` tampoco es de la base. |
| "Pruébalo" de la barra en principal (dos azules en la portada) | G1-T1, G1-T3, G2-T1 | **No es de la base**: es del Grupo 6 (sigue anotado). Con el cambio, ahora son dos azules en vez de dos violetas. |
| Ancla `#en-vivo` | G1-T3 | **No es de la base**: nota para el integrador (conservar `id="en-vivo"` en `ChatEnMarco`). |

## Lo que se verificó y lo que falta

- `npm run lint` y `npm run build` sin errores. (El aviso de Tailwind "safelist
  pattern doesn't match" ya salía antes: viene de `PromptBar.css`, que se
  procesa aparte y no trae las clases de la base.)
- Capturas en 1440×900 y 390×844, oscuro y claro, de `/base` (pantalla,
  página completa y una por sección), `/`, `/pruebalo` y `/precios`; más
  estados: buscador enfocado, menú de perfil abierto y cajón abierto en celular.
- Probado con Playwright: el menú se abre con Enter (foco al primero), ↓, Fin,
  primera letra, Esc (cierra y devuelve el foco), clic afuera; "/" enfoca el
  buscador y Esc lo borra; el cajón atrapa el foco, bloquea y libera el
  scroll, devuelve el foco y se cierra deslizándolo con el dedo (eventos
  táctiles emulados).
- **Falta en un teléfono real:** el arrastre del cajón, el área táctil de 44px,
  el blur de la barra y del menú, y cómo se ve `--font-producto` en un iPhone
  (en las capturas, Linux pone su letra de respaldo).
- `/panel` necesita sesión: no se capturó. Ya hereda el azul por `--c-accion`.
