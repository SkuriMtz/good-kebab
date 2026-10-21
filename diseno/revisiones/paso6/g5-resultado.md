# Grupo 5 · Conversión — resultado

**Sin competencia ni revisores de grupo.** G5-T1 y G5-T2 se detuvieron por una interrupción, y el dueño eligió el "punto medio": no relanzarlos, para ahorrar límite. La única propuesta, **G5-T3**, entra a la integración tal cual (rama `prop/g5-t3`, commit `2f9a536`).

Como nadie la calificó, el integrador la revisa contra CLAUDE.md. Además se corrige lo que anotó su propio trabajador:
- **Seguridad y Precios se parecen:** las dos son bandas de 3 columnas con líneas, una justo después de la otra. Hay que variar una.
- **El globo de partículas de `/precios`:** en celular ocupa casi media pantalla y en computadora se nota detrás del panel. Va discreto y lejos del texto (lecciones 7 y 11).
- **"Pruébalo" de la barra:** ya no es azul, porque G6-T1 lo resolvió. Queda un solo azul por pantalla.
- **`/preguntas#seguridad`:** monta el `Seguridad` reutilizable del Grupo 4.
- **Plan recomendado:** marcó Free como recomendado porque hoy es el único disponible. Hay que comprobarlo con `planes.ts`, sin inventar disponibilidad.
- **Formularios:** el aviso amable debe seguir funcionando mientras la migración `solicitudes` no esté corrida.

La revisión final del Paso 8 califica esta parte junto con todo el sitio.
