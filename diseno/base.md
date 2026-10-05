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
4. **Un solo botón principal (violeta) por pantalla.** Lo demás: sutil o fantasma.
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
| `--c-accion` | `#8052ff` | `#6e40f0` | Botón principal (texto blanco: 4.6:1 / 5.7:1) |
| `--c-sobre-accion` | `#ffffff` | `#ffffff` | Texto sobre la acción |
| `--c-destacada` | `#8c93fb` | `#8c93fb` | Borde de lo destacado |
| `--c-foco` | `#8dd6ff` | `#0969da` | Anillo de foco |
| `--c-error` | `#f85149` | `#d1242f` | Error (Primer) |
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
  sutil para dejar el violeta a cada pantalla) y el pie sigue en una fila.
- Grupo 1: afinar la escena 3D de la portada (hoy al 45% de opacidad, 32% en
  celular; oculta en modo claro porque se pinta sobre negro).
- Grupo 5: en `/preguntas` el candado de partículas queda detrás del acordeón.
- Las páginas viejas (agentes, precios, para quién es, preguntas, entrar,
  panel) ya usan los tokens nuevos pero conservan su composición anterior.
