# Instrucciones para los trabajadores (Paso 5)

Eres un trabajador del rediseño de Atendel. Compites contra otros trabajadores de
tu grupo: cada uno construye SU PROPIA propuesta de la misma parte del sitio. Gana
la mejor según 2 revisores que califican del 1 al 10:
fidelidad al estilo de GitHub · que NO parezca hecho por IA ni genérico · que evite
los errores de CLAUDE.md · claridad para un dueño de clínica · calidad en celular ·
acabado y detalle.

## Prioridad número uno (lo pidió el dueño)
**Tiene que verse como el sitio de GitHub.** Fondo casi negro (#0d1117 / #000 en
la portada), halos morados difuminados, vidrio translúcido, bordes finos #21262d,
Mona Sans con sus pesos exactos (425/440/460), etiquetas en Mona Sans Mono,
botones de radio 6px, pestañas en píldora de 60px, el producto dentro de un marco
de navegador y mucho aire. Antes de entregar, compara tu propuesta contra
`diseno/github/DESIGN.md` punto por punto y corrige lo que se aleje. Lo que la
hace de Atendel es el contenido (agentes, conversaciones reales, personajes), no
cambiar el estilo.

## Antes de empezar (obligatorio, completo)
1. Lee `CLAUDE.md` (sobre todo "Lecciones de diseño" y "Reglas anti-genéricas").
2. Lee `diseno/guia.md` (manda), `diseno/github/DESIGN.md`, `diseno/plan.md`
   (tu grupo y el "Reparto de archivos"), `diseno/base.md` (la base común: tokens y
   componentes) e `diseno/inventario.md`.
3. Abre el muestrario de la base en `/base` cuando levantes el sitio.
4. Lee el `SKILL.md` de las skills elegidas que aplican a tu grupo
   (`diseno/skills.md`) en `.claude/skills/<nombre>/SKILL.md` y aplícalas. Todos
   usan refero-design, emil-design-eng, ui-ux-pro-max y mobile-native.
5. Lee los archivos actuales de tu parte y los datos reales (`src/lib/*.ts`,
   `src/components/agentes/detalle.ts`).

## Reglas
- Trabajas SOLO en tu worktree y tu rama (te dicen cuáles). No cambies de rama,
  no toques otras ramas, no hagas merge, no crees PRs.
- Solo editas los archivos de tu grupo según el "Reparto de archivos" del plan.
  No editas `src/app/globals.css` ni `src/components/base/*`. Si necesitas algo
  que la base no tiene, constrúyelo dentro de tus archivos usando solo tokens de
  la base y anótalo en "Pedidos a la base" de tu ENTREGA.md.
- Nada de colores, tamaños, radios ni tiempos fuera de los tokens de la base.
- Conserva TODOS los muebles de tu parte (ver inventario): funciones, contenido,
  efectos. Si algo no encaja, no lo quites: anótalo en ENTREGA.md.
- Nada inventado (cifras, clientes, testimonios, certificaciones). Textos
  concretos en español natural de México para clínicas, estéticas y consultorios.
- Nada de la marca GitHub (logo, Octocat, mascotas, nombre, textos).
- Sin TODOs, sin secciones vacías, sin código a medias.
- Tu propuesta debe ser TUYA: elige una dirección clara y defiéndela; no hagas la
  versión promedio. Un solo momento protagonista por pantalla.

## Cómo construir
- Sección por sección: constrúyela, levántala, toma capturas en computadora
  (1440×900) y celular (390×844), en oscuro y claro, MÍRALAS con la herramienta
  Read y corrige antes de pasar a la siguiente.
- Servidor: `fuser -k <PUERTO>/tcp; npm run build && (setsid npx next start -p <PUERTO> > /tmp/srv-<RAMA>.log 2>&1 &)`.
  Después de cada cambio: matar, reconstruir y volver a levantar.
- Capturas con Playwright:
  `import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'`,
  `executablePath` en `/opt/pw-browsers/chromium-*/chrome-linux/chrome` (búscalo con ls),
  args para WebGL `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
  Tema claro: `localStorage.setItem('atendel-tema-v5','claro')` con `addInitScript` antes de cargar (revisa `src/lib/tema.ts`).
  Para revelados al bajar, desplázate hasta la sección y espera ~1.5s antes de capturar.
  Guarda JPEG calidad 70 (`type: 'jpeg', quality: 70`).
- Capturas FINALES de tu propuesta en `diseno/capturas/paso5/<rama-sin-prop>/`
  (ej. `diseno/capturas/paso5/g1-t3/`), con nombres `<pagina>-<seccion>-<1440|390>-<oscuro|claro>.jpg`,
  cubriendo cada sección y página de tu parte en los 4 modos.
- `npm run lint` y `npm run build` deben pasar.

## Entrega
1. Escribe `diseno/entregas/<rama-sin-prop>.md` (ej. `diseno/entregas/g1-t3.md`) con:
   dirección de diseño elegida y por qué; qué hace específica para Atendel; cómo
   evita lo genérico (regla por regla); muebles conservados (lista) y si alguno
   no encajó; skills que usaste y cómo; "Pedidos a la base"; lista de capturas.
2. Commit en tu rama con mensaje en español que empiece con "Propuesta <GN-TM>:" y
   termine con estas dos líneas exactas:
   Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01VA2Ys65ykADGbseEXUTjJh
3. `git push -u origin <tu rama>` (si falla por red, reintenta hasta 4 veces
   esperando 2, 4, 8 y 16 s).
4. Mata tu servidor y borra la carpeta `.next` de tu worktree (para liberar disco).
5. Responde con: hash del commit, rama, ruta de capturas, resumen de tu dirección
   en 3 líneas y cualquier cosa que no pudiste hacer y por qué (con honestidad).
