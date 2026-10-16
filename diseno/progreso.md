# Progreso del rediseño (casa nueva: estilo GitHub)

Regla: un punto se marca `[x]` solo cuando está 100% terminado, con fecha/hora (UTC) y su evidencia. Si no hay evidencia, no está hecho.

Rama de trabajo principal: `rediseno-11`.

## Estado actual / qué sigue

- **8 oct: el dueño cambió la dirección** (dashboard tipo GitHub + Apple en panel y Pruébalo; acento azul; oscuro primero). Grupo 1 completo (gana G1-T4). Grupo 2 completo (gana G2-T4). Base 4b lista (commit 7525f6d). Grupo 7 (dashboard) lanzado el 2026-10-08 01:30 UTC; las 5 propuestas entregadas el 2026-10-14 (T2 14:11, T5 20:31, T1 20:33, T3 20:34, T4 20:35 UTC). Revisores G7 terminados: gana G7-T1 (8.58, `prop/g7-t1` bf6c614). Grupo 3 (3 trabajadores): las 3 propuestas entregadas el 2026-10-15; revisores G3 terminados: gana G3-T1 (8.33, `prop/g3-t1` d7b93ba). Grupo 4 (3 trabajadores) lanzado el 2026-10-15 14:33 UTC (worktrees `/home/user/wt/g4-t1…t3`, base 3da8ec7; encargo común en `/home/user/wt/g4-encargo.md`). Grupo 5 (3 trabajadores) lanzado el 2026-10-16 03:05 UTC (worktrees `/home/user/wt/g5-t1…t3`, base 3f124c7; encargo común en `/home/user/wt/g5-encargo.md`). Después: Grupo 4, 5, 6.
- **Interrupciones del Grupo 7 por límite de uso** (el trabajo de cada uno sigue en su worktree, sin perderse): límite de sesión el 8 oct (reanudados 21:04 UTC); otro límite de sesión el 8 oct ~21:10 UTC (reanudados 9 oct 03:39 UTC); límite semanal el 9 oct ~03:40 UTC (se reinició el 13 oct 18:00 UTC; reanudados 14 oct 04:28 UTC); límite de sesión el 14 oct ~05:00 UTC (reanudados 14 oct 13:53 UTC); límite de sesión el 14 oct ~14:15 UTC con G7-T1, T3, T4 y T5 ya con capturas hechas (reanudados 14 oct 20:31 UTC). Revisores G7 y Grupo 3: límite de sesión el 14 oct ~21:00 UTC (reanudados 15 oct 02:13 UTC) y el 15 oct ~02:40 UTC (reanudados 15 oct 14:01 UTC). Revisores G3 y Grupo 4: límite de sesión el 15 oct ~14:45 UTC (reanudados 16 oct 02:41 UTC). Mientras tanto se dejaron listas las instrucciones de los revisores del Grupo 7 y de los trabajadores del Grupo 3.

- **14 oct: el dueño pidió gastar menos del límite semanal y del de 5 horas** ("no me gastes tanto… lo que pienses que sea lo mejor, pero mantente constante"). Recortes decididos y aplicados igual a todo lo que falta: (1) grupos 3 a 6 con 3 trabajadores cada uno (12 en vez de 18); (2) los revisores A y B de los grupos 3 a 6 califican con las capturas y el código de cada trabajador, sin levantar cada propuesta ni hacer capturas propias (los dos revisores del Grupo 7 ya estaban trabajando y siguen completos); (3) revisión final con 2 revisores por ronda en vez de 3 (se mantiene el máximo de 4 rondas y la meta de ≥ 9). No se juntan los grupos 4 y 5.

- **2026-10-16 08:42 UTC:** G4-T1, G4-T2, G5-T1 y G5-T2 quedaron detenidos por una interrupción del dueño; el sistema no permite reanudarlos. Se le preguntó al dueño si se relanzan (pendiente su respuesta).

## Paso 0 — Archivos y respaldo

- [x] 0.1 Guardar los 4 archivos en `diseno/github/` (DESIGN.md, tokens.json, theme.css, variables.css) y verificar que están completos — **2026-10-05 05:19 UTC** — evidencia: `diseno/github/` (DESIGN.md 437 líneas, tokens.json JSON válido, theme.css 73, variables.css 106; idénticos byte a byte a los adjuntos; commit 1a99ec9)
- [x] 0.2 Respaldo de la versión actual (rama) y cómo volver a ella — **2026-10-05 05:19 UTC** — evidencia: rama `respaldo-antes-github` (local y origin, commit 24aeebd). Para volver: `git checkout respaldo-antes-github`

## Selección de skills

- [x] S.1 Elegir skills, decir para qué parte y por qué se dejan fuera las demás (`diseno/skills.md`) — **2026-10-05 05:19 UTC** — evidencia: `diseno/skills.md`

## Paso 1 — Aprender de los errores

- [x] 1.1 Revisar historial (commits, ramas, respaldos) — **2026-10-05 05:19 UTC** — evidencia: git log de 53 commits y 14 ramas (rediseno, rediseno-2…10, respaldo-*) resumido en CLAUDE.md
- [x] 1.2 `CLAUDE.md` con sección "Lecciones de diseño" (lista del dueño + historial + reglas anti-genéricas) — **2026-10-05 05:19 UTC** — evidencia: `CLAUDE.md`

## Paso 2 — Inventario

- [x] 2.1 Inventario por página en `diseno/inventario.md`, mostrado al dueño — **2026-10-05 05:19 UTC** — evidencia: `diseno/inventario.md`

## Paso 3 — Plan

- [x] 3.1 `diseno/plan.md`: cada página y sección, mueble, componente, qué la hace de Atendel, cómo evita lo genérico, grupo responsable — **2026-10-05 05:19 UTC** — evidencia: `diseno/plan.md`
- [x] 3.2 Resumen del plan mostrado al dueño — **2026-10-05 06:27 UTC** — evidencia: resumen enviado al dueño en el chat

## Paso 4 — Arquitecto (base común)

- [x] 4.1 Tokens de color, tipografía, espaciado y radios como variables (oscuro y claro) — **2026-10-05 06:27 UTC** — evidencia: `src/app/globals.css` (tokens oscuro y claro), `diseno/base.md`
- [x] 4.2 Fuentes Mona Sans y Mona Sans Mono instaladas — **2026-10-05 06:27 UTC** — evidencia: `src/fonts/MonaSansVF-opsz-wght.woff2`, `src/fonts/MonaSansMonoVF-wght.woff2`, `src/fonts/OFL.txt` (Mona Sans 2.027, OFL 1.1)
- [x] 4.3 Componentes base: botones, tarjeta de vidrio, input, pestañas en píldora, etiqueta, marco de navegador, contenedor de sección — **2026-10-05 06:27 UTC** — evidencia: `src/components/base/` (10 archivos), `src/components/FormularioLista.tsx`, muestrario `/base`, capturas `diseno/capturas/paso4/` (24)
- [x] 4.4 Commit de la base (hash anotado) — **2026-10-05 06:27 UTC** — evidencia: commit `d4f4a7c` en `rediseno-11` (en origin)

## Paso 4b — Arquitecto: base actualizada para el dashboard (8 oct)

- [x] 4b.1 Tokens del dashboard (azul, oscuro/claro, radios, sombras, pila tipográfica de producto) y pedidos a la base de G1/G2 — **2026-10-08 01:30 UTC** — evidencia: `src/app/globals.css` (superficie `.producto`, azul, estados, radios, sombras, letra de producto), `diseno/base.md` sección "Base 4b — dashboard"
- [x] 4b.2 Componentes nuevos (Menu, Avatar, Insignia, Buscador, Cajon, Kbd, PuntoEstado, BarraProgreso, íconos) en el muestrario `/base` — **2026-10-08 01:30 UTC** — evidencia: `src/components/base/` (Menu, Avatar, Insignia, Buscador, Cajon, Kbd, PuntoEstado, BarraProgreso, Escribiendo, BotonIcono, 28 íconos) y muestrario `/base`
- [x] 4b.3 Commit de la base actualizada (hash anotado) y capturas en `diseno/capturas/paso4b/` — **2026-10-08 01:30 UTC** — evidencia: commit `7525f6d` en `rediseno-11` (origin), 84 capturas en `diseno/capturas/paso4b/`

## Paso 5 — Grupos de trabajadores (33 propuestas)

Cada trabajador: rama `prop/gN-tM` en su propio worktree, capturas en `diseno/capturas/paso5/gN-tM/` (1440 y 390px).

### Grupo 1 — Portada (5 trabajadores): hero, halo, formulario y escena 3D de partículas como fondo

- [x] G1-T1 · rama `prop/g1-t1` · capturas `diseno/capturas/paso5/g1-t1/` — **2026-10-06 19:28 UTC** — evidencia: commit `877cd7c` en `prop/g1-t1` (origin), 8 capturas, `diseno/entregas/g1-t1.md`
- [x] G1-T2 · rama `prop/g1-t2` · capturas `diseno/capturas/paso5/g1-t2/` — **2026-10-06 18:32 UTC** — evidencia: commit `bfbc6f6` en `prop/g1-t2` (origin), 20 capturas, `diseno/entregas/g1-t2.md`
- [x] G1-T3 · rama `prop/g1-t3` · capturas `diseno/capturas/paso5/g1-t3/` — **2026-10-05 20:46 UTC** — evidencia: commit `461d575` en `prop/g1-t3` (origin), 9 capturas, `diseno/entregas/g1-t3.md`
- [x] G1-T4 · rama `prop/g1-t4` · capturas `diseno/capturas/paso5/g1-t4/` — **2026-10-06 18:34 UTC** — evidencia: commit `bb03e3b` en `prop/g1-t4` (origin), 11 capturas, `diseno/entregas/g1-t4.md`
- [x] G1-T5 · rama `prop/g1-t5` · capturas `diseno/capturas/paso5/g1-t5/` — **2026-10-06 18:44 UTC** — evidencia: commit `53cab9f` en `prop/g1-t5` (origin), 14 capturas, `diseno/entregas/g1-t5.md`

### Grupo 2 — Chat de los agentes (5 trabajadores): marco de producto bajo la portada y la página del chat con grupos y PromptBar

- [x] G2-T1 · rama `prop/g2-t1` · capturas `diseno/capturas/paso5/g2-t1/` — **2026-10-07 18:55 UTC** — evidencia: commit `55d3d2d` en `prop/g2-t1` (origin), 23 capturas, `diseno/entregas/g2-t1.md`
- [x] G2-T2 · rama `prop/g2-t2` · capturas `diseno/capturas/paso5/g2-t2/` — **2026-10-07 19:02 UTC** — evidencia: commit `f39d56f` en `prop/g2-t2` (origin), 30 capturas, `diseno/entregas/g2-t2.md`
- [x] G2-T3 · rama `prop/g2-t3` · capturas `diseno/capturas/paso5/g2-t3/` — **2026-10-07 14:14 UTC** — evidencia: commit `608fd13` en `prop/g2-t3` (origin), 33 capturas, `diseno/entregas/g2-t3.md`
- [x] G2-T4 · rama `prop/g2-t4` · capturas `diseno/capturas/paso5/g2-t4/` — **2026-10-07 19:12 UTC** — evidencia: commit `e1e005e` en `prop/g2-t4` (origin), 38 capturas, `diseno/entregas/g2-t4.md`
- [x] G2-T5 · rama `prop/g2-t5` · capturas `diseno/capturas/paso5/g2-t5/` — **2026-10-07 14:15 UTC** — evidencia: commit `039e7bc` en `prop/g2-t5` (origin), 22 capturas, `diseno/entregas/g2-t5.md`

### Grupo 3 — Agentes (3 trabajadores; eran 5): pestañas de los 4 agentes, personajes (blobs) y páginas de cada agente

- [x] G3-T1 · rama `prop/g3-t1` · capturas `diseno/capturas/paso5/g3-t1/` — **2026-10-15 14:27 UTC** — evidencia: commit d7b93ba en origin/prop/g3-t1 ("Propuesta G3-T1: agentes como la fila de funciones de la portada de GitHub"), 42 capturas, entrega `diseno/entregas/g3-t1.md`; lint y build pasan; worktree limpio
- [x] G3-T2 · rama `prop/g3-t2` · capturas `diseno/capturas/paso5/g3-t2/` — **2026-10-15 14:16 UTC** — evidencia: commit 75142ce en origin/prop/g3-t2 ("Propuesta G3-T2: agentes como perfiles"), 38 capturas, entrega `diseno/entregas/g3-t2.md`; lint y build pasan; worktree limpio
- [x] G3-T3 · rama `prop/g3-t3` · capturas `diseno/capturas/paso5/g3-t3/` — **2026-10-15 14:30 UTC** — evidencia: commit 4ee44d0 en origin/prop/g3-t3 ("Propuesta G3-T3: agentes como documentación al estilo GitHub Docs"), 72 capturas, entrega `diseno/entregas/g3-t3.md`; lint y build pasan; worktree limpio
- [-] ~~G3-T4~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)
- [-] ~~G3-T5~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)

### Grupo 4 — Secciones informativas (3 trabajadores; eran 5): Qué es Atendel, Cómo funciona, Para quién es y Seguridad

- [ ] G4-T1 · rama `prop/g4-t1` · capturas `diseno/capturas/paso5/g4-t1/`
- [ ] G4-T2 · rama `prop/g4-t2` · capturas `diseno/capturas/paso5/g4-t2/`
- [x] G4-T3 · rama `prop/g4-t3` · capturas `diseno/capturas/paso5/g4-t3/` — **2026-10-16 03:03 UTC** — evidencia: commit 6f43d46 en origin/prop/g4-t3 ("Propuesta G4-T3: GitHub con la calma de Apple (tipografía protagonista, pocas cajas)"), 25 capturas, entrega `diseno/entregas/g4-t3.md`; lint y build pasan; worktree limpio
- [-] ~~G4-T4~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)
- [-] ~~G4-T5~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)

### Grupo 5 — Conversión (3 trabajadores; eran 4): Precios, Preguntas frecuentes, Lista de espera, Contacto y CTA final

- [ ] G5-T1 · rama `prop/g5-t1` · capturas `diseno/capturas/paso5/g5-t1/`
- [ ] G5-T2 · rama `prop/g5-t2` · capturas `diseno/capturas/paso5/g5-t2/`
- [x] G5-T3 · rama `prop/g5-t3` · capturas `diseno/capturas/paso5/g5-t3/` — **2026-10-16 08:42 UTC** — evidencia: commit 2f9a536 en origin/prop/g5-t3, 48 capturas, entrega `diseno/entregas/g5-t3.md`; lint y build pasan
- [-] ~~G5-T4~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)

### Grupo 6 — Estructura (3 trabajadores; eran 4): barra de navegación, pie, modo claro/oscuro y adaptación a celular

- [ ] G6-T1 · rama `prop/g6-t1` · capturas `diseno/capturas/paso5/g6-t1/`
- [ ] G6-T2 · rama `prop/g6-t2` · capturas `diseno/capturas/paso5/g6-t2/`
- [ ] G6-T3 · rama `prop/g6-t3` · capturas `diseno/capturas/paso5/g6-t3/`
- [-] ~~G6-T4~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)

### Grupo 7 — Dashboard (5 trabajadores, agregado el 8 oct): armazón del dashboard y vista Resumen en /panel y /pruebalo

- [x] G7-T1 · rama `prop/g7-t1` · capturas `diseno/capturas/paso5/g7-t1/` — **2026-10-14 20:33 UTC** — evidencia: commit bf6c614 en origin/prop/g7-t1 ("Propuesta G7-T1: dashboard fiel a la estructura de GitHub con acabado de Apple"), 94 capturas, entrega `diseno/entregas/g7-t1.md`; lint y build pasan; worktree limpio (ruta temporal del panel borrada)
- [x] G7-T2 · rama `prop/g7-t2` · capturas `diseno/capturas/paso5/g7-t2/` — **2026-10-14 14:11 UTC** — evidencia: commit a45526a en origin/prop/g7-t2 ("Propuesta G7-T2: dashboard 'el GitHub que respira'"), 70 capturas, entrega `diseno/entregas/g7-t2.md`; lint y build pasan; worktree limpio (ruta temporal del panel borrada)
- [x] G7-T3 · rama `prop/g7-t3` · capturas `diseno/capturas/paso5/g7-t3/` — **2026-10-14 20:34 UTC** — evidencia: commit ba2f1fa en origin/prop/g7-t3 ("Propuesta G7-T3: dashboard 'Pendientes primero' (panel y Pruébalo)"), 60 capturas, entrega `diseno/entregas/g7-t3.md`; lint y build pasan; worktree limpio (ruta temporal del panel borrada)
- [x] G7-T4 · rama `prop/g7-t4` · capturas `diseno/capturas/paso5/g7-t4/` — **2026-10-14 20:35 UTC** — evidencia: commit 1f89933 en origin/prop/g7-t4 ("Propuesta G7-T4: dashboard orientado a datos con la cuadrícula de actividad"), 96 capturas, entrega `diseno/entregas/g7-t4.md`; lint y build pasan; worktree limpio (ruta temporal del panel borrada)
- [x] G7-T5 · rama `prop/g7-t5` · capturas `diseno/capturas/paso5/g7-t5/` — **2026-10-14 20:31 UTC** — evidencia: commit 3f2c25f en origin/prop/g7-t5 ("Propuesta G7-T5: dashboard de GitHub que se maneja con el teclado o con el pulgar"), 78 capturas, entrega `diseno/entregas/g7-t5.md`; lint y build pasan; worktree limpio (ruta temporal del panel borrada)

## Paso 6 — Elección de los mejores (2 revisores por grupo)

- [x] G1 revisor A → `diseno/revisiones/paso6/g1-revisor-a.md` — **2026-10-06 19:31 UTC** — evidencia: `diseno/revisiones/paso6/g1-revisor-a.md` (gana G1-T3, 8.17)
- [x] G1 revisor B → `diseno/revisiones/paso6/g1-revisor-b.md` — **2026-10-07 13:59 UTC** — evidencia: `diseno/revisiones/paso6/g1-revisor-b.md` (gana G1-T4, 8.17) + 40 capturas en `diseno/capturas/paso6/g1-revisor-b/`
- [x] G1 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g1-resultado.md` — **2026-10-07 13:59 UTC** — evidencia: `diseno/revisiones/paso6/g1-resultado.md` — gana G1-T4 (8.00)
- [x] G2 revisor A → `diseno/revisiones/paso6/g2-revisor-a.md` — **2026-10-08 01:07 UTC** — evidencia: `diseno/revisiones/paso6/g2-revisor-a.md` (gana G2-T4, 8.33)
- [x] G2 revisor B → `diseno/revisiones/paso6/g2-revisor-b.md` — **2026-10-08 01:24 UTC** — evidencia: `diseno/revisiones/paso6/g2-revisor-b.md` (gana G2-T1, 8.33) + capturas en `diseno/capturas/paso6/g2-revisor-b/`
- [x] G2 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g2-resultado.md` — **2026-10-08 01:24 UTC** — evidencia: `diseno/revisiones/paso6/g2-resultado.md` — gana G2-T4 (8.25)
- [x] G3 revisor A → `diseno/revisiones/paso6/g3-revisor-a.md` — **2026-10-16 02:43 UTC** — evidencia: `diseno/revisiones/paso6/g3-revisor-a.md` (modo ligero; gana G3-T1, 8.33; T3 7.75, T2 7.42)
- [x] G3 revisor B → `diseno/revisiones/paso6/g3-revisor-b.md` — **2026-10-16 02:48 UTC** — evidencia: `diseno/revisiones/paso6/g3-revisor-b.md` (modo ligero; gana G3-T1, 8.33; T2 7.92, T3 7.67)
- [x] G3 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g3-resultado.md` — **2026-10-16 02:48 UTC** — evidencia: `diseno/revisiones/paso6/g3-resultado.md` — gana G3-T1 (8.33)
- [ ] G4 revisor A → `diseno/revisiones/paso6/g4-revisor-a.md`
- [ ] G4 revisor B → `diseno/revisiones/paso6/g4-revisor-b.md`
- [ ] G4 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g4-resultado.md`
- [ ] G5 revisor A → `diseno/revisiones/paso6/g5-revisor-a.md`
- [ ] G5 revisor B → `diseno/revisiones/paso6/g5-revisor-b.md`
- [ ] G5 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g5-resultado.md`
- [ ] G6 revisor A → `diseno/revisiones/paso6/g6-revisor-a.md`
- [ ] G6 revisor B → `diseno/revisiones/paso6/g6-revisor-b.md`
- [ ] G6 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g6-resultado.md`
- [x] G7 revisor A → `diseno/revisiones/paso6/g7-revisor-a.md` — **2026-10-15 02:26 UTC** — evidencia: `diseno/revisiones/paso6/g7-revisor-a.md` (gana G7-T1, 8.67; T5 8.33, T3 8.17, T2 7.50, T4 6.67)
- [x] G7 revisor B → `diseno/revisiones/paso6/g7-revisor-b.md` — **2026-10-15 14:15 UTC** — evidencia: `diseno/revisiones/paso6/g7-revisor-b.md` (gana G7-T1, 8.50; T3 8.00, T5 8.00, T4 7.67, T2 7.17) + 235 capturas propias con pruebas de interacción en `diseno/capturas/paso6/g7-revisor-b/`
- [x] G7 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g7-resultado.md` — **2026-10-15 14:15 UTC** — evidencia: `diseno/revisiones/paso6/g7-resultado.md` — gana G7-T1 (8.58)

## Paso 7 — Integrador

- [ ] 7.1 Juntar las 7 propuestas ganadoras en `rediseno-11`
- [ ] 7.2 Incorporar las mejores ideas anotadas
- [ ] 7.3 Unificar ritmo, animaciones, tono y transiciones
- [ ] 7.4 Ramas de todas las propuestas conservadas (en local y en origin)
- [ ] 7.5 Commit de integración (hash anotado)

## Paso 8 — Revisión final independiente (máximo 4 rondas)

Capturas de cada página en 1440 y 390px, oscuro y claro → `diseno/capturas/paso8/ronda-N/`.

### Ronda 1

- [ ] R1 capturas de todas las páginas
- [ ] R1 revisor A (nuevo) → `diseno/revisiones/paso8/ronda-1-revisor-a.md`
- [ ] R1 revisor B (nuevo) → `diseno/revisiones/paso8/ronda-1-revisor-b.md`
- [-] ~~R1 revisor C~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)
- [ ] R1 correcciones de todo criterio < 9 (o: todos ≥ 9, no hace falta otra ronda)

### Ronda 2

- [ ] R2 capturas de todas las páginas
- [ ] R2 revisor A (nuevo) → `diseno/revisiones/paso8/ronda-2-revisor-a.md`
- [ ] R2 revisor B (nuevo) → `diseno/revisiones/paso8/ronda-2-revisor-b.md`
- [-] ~~R2 revisor C~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)
- [ ] R2 correcciones de todo criterio < 9 (o: todos ≥ 9, no hace falta otra ronda)

### Ronda 3

- [ ] R3 capturas de todas las páginas
- [ ] R3 revisor A (nuevo) → `diseno/revisiones/paso8/ronda-3-revisor-a.md`
- [ ] R3 revisor B (nuevo) → `diseno/revisiones/paso8/ronda-3-revisor-b.md`
- [-] ~~R3 revisor C~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)
- [ ] R3 correcciones de todo criterio < 9 (o: todos ≥ 9, no hace falta otra ronda)

### Ronda 4

- [ ] R4 capturas de todas las páginas
- [ ] R4 revisor A (nuevo) → `diseno/revisiones/paso8/ronda-4-revisor-a.md`
- [ ] R4 revisor B (nuevo) → `diseno/revisiones/paso8/ronda-4-revisor-b.md`
- [-] ~~R4 revisor C~~ (no se hace: recorte para ahorrar límite de uso, decidido el 2026-10-14 con permiso del dueño)
- [ ] R4 correcciones de todo criterio < 9 (o: todos ≥ 9, no hace falta otra ronda)

- [ ] 8.L Lecciones nuevas de las revisiones agregadas a `CLAUDE.md`

## Paso 9 — Cierre

- [ ] 9.1 Revisar el inventario página por página: todo presente y funcionando (`diseno/verificacion-final.md`)
- [ ] 9.2 Reporte: skills usadas, instalaciones, ganador por grupo y por qué, ideas incorporadas, calificaciones finales, problemas y correcciones, lo que no encajó
- [ ] 9.3 Sitio publicado y enlace
- [ ] 9.4 Auditoría final de este archivo punto por punto con evidencia
