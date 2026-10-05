# Progreso del rediseño (casa nueva: estilo GitHub)

Regla: un punto se marca `[x]` solo cuando está 100% terminado, con fecha/hora (UTC) y su evidencia. Si no hay evidencia, no está hecho.

Rama de trabajo principal: `rediseno-11`.

## Estado actual / qué sigue

- Paso 4 terminado (commit d4f4a7c). Paso 5 en curso: tanda del Grupo 1 (5 trabajadores, worktrees `/home/user/wt/g1-t1…t5`, ramas `prop/g1-t1…t5`). Después: Grupo 2.

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

## Paso 5 — Grupos de trabajadores (28 propuestas)

Cada trabajador: rama `prop/gN-tM` en su propio worktree, capturas en `diseno/capturas/paso5/gN-tM/` (1440 y 390px).

### Grupo 1 — Portada (5 trabajadores): hero, halo, formulario y escena 3D de partículas como fondo

- [ ] G1-T1 · rama `prop/g1-t1` · capturas `diseno/capturas/paso5/g1-t1/`
- [ ] G1-T2 · rama `prop/g1-t2` · capturas `diseno/capturas/paso5/g1-t2/`
- [ ] G1-T3 · rama `prop/g1-t3` · capturas `diseno/capturas/paso5/g1-t3/`
- [ ] G1-T4 · rama `prop/g1-t4` · capturas `diseno/capturas/paso5/g1-t4/`
- [ ] G1-T5 · rama `prop/g1-t5` · capturas `diseno/capturas/paso5/g1-t5/`

### Grupo 2 — Chat de los agentes (5 trabajadores): marco de producto bajo la portada y la página del chat con grupos y PromptBar

- [ ] G2-T1 · rama `prop/g2-t1` · capturas `diseno/capturas/paso5/g2-t1/`
- [ ] G2-T2 · rama `prop/g2-t2` · capturas `diseno/capturas/paso5/g2-t2/`
- [ ] G2-T3 · rama `prop/g2-t3` · capturas `diseno/capturas/paso5/g2-t3/`
- [ ] G2-T4 · rama `prop/g2-t4` · capturas `diseno/capturas/paso5/g2-t4/`
- [ ] G2-T5 · rama `prop/g2-t5` · capturas `diseno/capturas/paso5/g2-t5/`

### Grupo 3 — Agentes (5 trabajadores): pestañas de los 4 agentes, personajes (blobs) y páginas de cada agente

- [ ] G3-T1 · rama `prop/g3-t1` · capturas `diseno/capturas/paso5/g3-t1/`
- [ ] G3-T2 · rama `prop/g3-t2` · capturas `diseno/capturas/paso5/g3-t2/`
- [ ] G3-T3 · rama `prop/g3-t3` · capturas `diseno/capturas/paso5/g3-t3/`
- [ ] G3-T4 · rama `prop/g3-t4` · capturas `diseno/capturas/paso5/g3-t4/`
- [ ] G3-T5 · rama `prop/g3-t5` · capturas `diseno/capturas/paso5/g3-t5/`

### Grupo 4 — Secciones informativas (5 trabajadores): Qué es Atendel, Cómo funciona, Para quién es y Seguridad

- [ ] G4-T1 · rama `prop/g4-t1` · capturas `diseno/capturas/paso5/g4-t1/`
- [ ] G4-T2 · rama `prop/g4-t2` · capturas `diseno/capturas/paso5/g4-t2/`
- [ ] G4-T3 · rama `prop/g4-t3` · capturas `diseno/capturas/paso5/g4-t3/`
- [ ] G4-T4 · rama `prop/g4-t4` · capturas `diseno/capturas/paso5/g4-t4/`
- [ ] G4-T5 · rama `prop/g4-t5` · capturas `diseno/capturas/paso5/g4-t5/`

### Grupo 5 — Conversión (4 trabajadores): Precios, Preguntas frecuentes, Lista de espera, Contacto y CTA final

- [ ] G5-T1 · rama `prop/g5-t1` · capturas `diseno/capturas/paso5/g5-t1/`
- [ ] G5-T2 · rama `prop/g5-t2` · capturas `diseno/capturas/paso5/g5-t2/`
- [ ] G5-T3 · rama `prop/g5-t3` · capturas `diseno/capturas/paso5/g5-t3/`
- [ ] G5-T4 · rama `prop/g5-t4` · capturas `diseno/capturas/paso5/g5-t4/`

### Grupo 6 — Estructura (4 trabajadores): barra de navegación, pie, modo claro/oscuro y adaptación a celular

- [ ] G6-T1 · rama `prop/g6-t1` · capturas `diseno/capturas/paso5/g6-t1/`
- [ ] G6-T2 · rama `prop/g6-t2` · capturas `diseno/capturas/paso5/g6-t2/`
- [ ] G6-T3 · rama `prop/g6-t3` · capturas `diseno/capturas/paso5/g6-t3/`
- [ ] G6-T4 · rama `prop/g6-t4` · capturas `diseno/capturas/paso5/g6-t4/`

## Paso 6 — Elección de los mejores (2 revisores por grupo)

- [ ] G1 revisor A → `diseno/revisiones/paso6/g1-revisor-a.md`
- [ ] G1 revisor B → `diseno/revisiones/paso6/g1-revisor-b.md`
- [ ] G1 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g1-resultado.md`
- [ ] G2 revisor A → `diseno/revisiones/paso6/g2-revisor-a.md`
- [ ] G2 revisor B → `diseno/revisiones/paso6/g2-revisor-b.md`
- [ ] G2 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g2-resultado.md`
- [ ] G3 revisor A → `diseno/revisiones/paso6/g3-revisor-a.md`
- [ ] G3 revisor B → `diseno/revisiones/paso6/g3-revisor-b.md`
- [ ] G3 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g3-resultado.md`
- [ ] G4 revisor A → `diseno/revisiones/paso6/g4-revisor-a.md`
- [ ] G4 revisor B → `diseno/revisiones/paso6/g4-revisor-b.md`
- [ ] G4 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g4-resultado.md`
- [ ] G5 revisor A → `diseno/revisiones/paso6/g5-revisor-a.md`
- [ ] G5 revisor B → `diseno/revisiones/paso6/g5-revisor-b.md`
- [ ] G5 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g5-resultado.md`
- [ ] G6 revisor A → `diseno/revisiones/paso6/g6-revisor-a.md`
- [ ] G6 revisor B → `diseno/revisiones/paso6/g6-revisor-b.md`
- [ ] G6 ganador y mejores ideas de las demás → `diseno/revisiones/paso6/g6-resultado.md`

## Paso 7 — Integrador

- [ ] 7.1 Juntar las 6 propuestas ganadoras en `rediseno-11`
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
- [ ] R1 revisor C (nuevo) → `diseno/revisiones/paso8/ronda-1-revisor-c.md`
- [ ] R1 correcciones de todo criterio < 9 (o: todos ≥ 9, no hace falta otra ronda)

### Ronda 2

- [ ] R2 capturas de todas las páginas
- [ ] R2 revisor A (nuevo) → `diseno/revisiones/paso8/ronda-2-revisor-a.md`
- [ ] R2 revisor B (nuevo) → `diseno/revisiones/paso8/ronda-2-revisor-b.md`
- [ ] R2 revisor C (nuevo) → `diseno/revisiones/paso8/ronda-2-revisor-c.md`
- [ ] R2 correcciones de todo criterio < 9 (o: todos ≥ 9, no hace falta otra ronda)

### Ronda 3

- [ ] R3 capturas de todas las páginas
- [ ] R3 revisor A (nuevo) → `diseno/revisiones/paso8/ronda-3-revisor-a.md`
- [ ] R3 revisor B (nuevo) → `diseno/revisiones/paso8/ronda-3-revisor-b.md`
- [ ] R3 revisor C (nuevo) → `diseno/revisiones/paso8/ronda-3-revisor-c.md`
- [ ] R3 correcciones de todo criterio < 9 (o: todos ≥ 9, no hace falta otra ronda)

### Ronda 4

- [ ] R4 capturas de todas las páginas
- [ ] R4 revisor A (nuevo) → `diseno/revisiones/paso8/ronda-4-revisor-a.md`
- [ ] R4 revisor B (nuevo) → `diseno/revisiones/paso8/ronda-4-revisor-b.md`
- [ ] R4 revisor C (nuevo) → `diseno/revisiones/paso8/ronda-4-revisor-c.md`
- [ ] R4 correcciones de todo criterio < 9 (o: todos ≥ 9, no hace falta otra ronda)

- [ ] 8.L Lecciones nuevas de las revisiones agregadas a `CLAUDE.md`

## Paso 9 — Cierre

- [ ] 9.1 Revisar el inventario página por página: todo presente y funcionando (`diseno/verificacion-final.md`)
- [ ] 9.2 Reporte: skills usadas, instalaciones, ganador por grupo y por qué, ideas incorporadas, calificaciones finales, problemas y correcciones, lo que no encajó
- [ ] 9.3 Sitio publicado y enlace
- [ ] 9.4 Auditoría final de este archivo punto por punto con evidencia
