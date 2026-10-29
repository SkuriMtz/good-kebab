# Grupo 7 · Dashboard (panel y /pruebalo) — resultado

Promedio de los dos revisores (cada uno promedió los 6 criterios):

| Propuesta | Revisor A | Revisor B | **Promedio final** |
|---|:-:|:-:|:-:|
| **G7-T1 · Fiel a la estructura del dashboard de GitHub, acabado de Apple** | 8.67 | 8.50 | **8.58** |
| G7-T5 · Se maneja con el teclado o con el pulgar (paleta de comandos, hojas) | 8.33 | 8.00 | 8.17 |
| G7-T3 · "Pendientes primero" (visto bueno como pull request) | 8.17 | 8.00 | 8.08 |
| G7-T2 · "El GitHub que respira" | 7.50 | 7.17 | 7.33 |
| G7-T4 · Cuadrícula de actividad | 6.67 | 7.67 | 7.17 |

**Ganadora: G7-T1** (rama `prop/g7-t1`, commit `bf6c614`). Los dos revisores la eligen por separado. Sus razones:

- Es la que más se parece al dashboard de GitHub. Cada evento del feed dice quién, qué verbo, qué objeto y hace cuánto, y debajo lleva la tarjeta del objeto.
- Cuenta el día de una clínica con los mismos datos que el chat de ejemplo.
- En el panel real tiene los mejores estados vacíos y es la más limpia en tokens.
- Es una de las dos cuyos menús de perfil, "+" y avisos tapan bien lo de atrás. En T2, T3 y T5 el contenido se lee a través del menú.

## Debe corregir al integrarse (de ambos revisores)
1. **Celular:**
   - La franja de demo se corta ("Demostración con datos de ejem…"): pasarla a dos renglones, como T4.
   - La pestaña "Destacados" se corta sin indicar que se desliza.
   - El Resumen es demasiado largo (5,822px). Hacer "Tu día" compacto, mostrar 4 o 5 eventos antes de "Ver actividad anterior" y poner primero el plan y las citas en la columna derecha.
2. **Tableta (1024):** Conversaciones queda apretada. Plegar el lateral a íconos o mandar la lista de chats a su botón.
3. **"Nuevo grupo"** (lateral y "+") abre el chat de Recepción, no el diálogo. Hay que conectarlo al diálogo del chat ganador (pedir al Grupo 2 una prop `nuevoGrupo`/`inicial`).
4. **Volver a montar `FichasAgentes` en `/pruebalo`**, como hizo T3, y dejar visible el camino de vuelta al sitio: "Volver al sitio" en la franja de demo, el pie mínimo con enlaces públicos y "Salir de la demostración".
5. **"Espera tu visto bueno" en el panel real** hoy siempre sale vacío. Alimentarlo con lo que Clara sugirió (`accion_sugerida`), con "Ya lo atendí" y "Ver en Correo".
6. **Textos:**
   - Una novedad dice que solo Max elige equipo, pero el código también deja elegir en One. Que lo decida el dueño, y que el texto y la lógica digan lo mismo.
   - La novedad "8 oct · Tu panel nuevo" debe llevar la fecha real de publicación.
   - El saludo dijo "Buenos días" a las 2 a.m.: revisar los rangos de hora.
7. **Chat dentro del armazón:**
   - Con el chat ganador (G2-T4), que el chat llene su contenedor en vez de usar `position: fixed`.
   - Quitar `NavApp` de `Chat.tsx`.
   - En celular, evitar dos botones de menú seguidos.
8. **Pasar a la base** lo que T1 resolvió en su CSS: menús sólidos dentro de la barra con vidrio (`menu--solido`, o vidrio en `::before` como T4), `Popover` que no sea menú, `Insignia` de contorno, tamaños 20, 24 y 32 de la marca de agente, e íconos nuevos. Corregir también la composición de `/base`, que tiene el mismo problema de menús transparentes.
9. **Código:** quitar o documentar como prueba la prop `vista` de `ArmazonPanel` y pasar a tokens los 2, 3 y 6px que quedan.

## Mejores ideas de las otras propuestas para incorporar
- **G7-T3:**
  - **El visto bueno como pull request:** "Lo que preparó" en su forma real (WhatsApp, correo, Excel), "Cómo llegó aquí" con los relevos entre agentes, y una caja tipo merge con "Aprobar y enviar", "Editar" y "Descartar" con Deshacer.
  - "Nada sale a tus clientes sin tu permiso".
  - Filtros por agente y "Relevos" en Actividad.
  - El Correo de la demo con los 3 correos de ejemplo y su resumen de guion, sin IA.
- **G7-T5:**
  - La paleta de comandos (Ctrl K y "/", búsqueda sin acentos, resultados agrupados) como capa sobre el buscador de T1.
  - En celular, "+" y avisos como hojas que se cierran deslizando, y búsqueda a pantalla completa.
  - "Atajos de teclado" en el menú de perfil, con las teclas visibles solo con puntero fino.
  - El filo de la barra que aparece al desplazar.
  - Conversaciones del alto exacto de la ventana.
  - La barra inferior de celular solo si se corrige su transparencia; el revisor A pide no ponerla.
- **G7-T2:**
  - El evento "ahora" ("Lola está contestando…") al inicio del feed.
  - El filtro "Todos los agentes".
  - "¿Cómo leo esto?" como ayuda en la columna derecha.
  - La insignia "Datos de ejemplo" junto a la sección.
  - Estados vacíos "firmados" por el agente que se va a encargar.
  - El buscador que también encuentra citas y actividad.
  - La dirección `?vista=&con=&pestana=`, para que funcionen Atrás y Adelante y se pueda enlazar a una vista.
- **G7-T4:**
  - "Ver como tabla" como gemelo accesible de cualquier gráfica.
  - La franja de demo en dos renglones en celular.
  - Si se quiere la cuadrícula de actividad, ponerla en Agentes o Reportes, no como protagonista del Resumen.

## Problemas de las demás (para no traerlos)
- **G7-T2, T3 y T5:** menús transparentes sobre el contenido, sobre todo en claro y en celular.
- **G7-T4:** la cuadrícula como protagonista del Resumen se siente de analítica y no de recepción; tiene valores derivados fuera de los tokens.
- **G7-T2 y T5:** no avisaron en su entrega que quitaron de `/pruebalo` la barra pública, el pie y las partículas.

## Para avisarle al dueño
- `/pruebalo` ahora es el dashboard. Ya no lleva la barra pública, el pie de 4 columnas ni el fondo de partículas. Las 5 propuestas lo hicieron y los dos revisores lo consideran justificado: dos barras romperían la estructura de GitHub, y partículas detrás de una app van contra las lecciones 7 y 11. **No se borra nada del proyecto:** la escena 3D y la barra pública siguen en todo el sitio público, y las fichas de agente vuelven a `/pruebalo` en la integración.
- Hay que decidir si elegir equipo es solo en Max (como decía el encargo) o también en One (como hace hoy el código).
- Pendiente para la integración: probar `/panel` con una cuenta real y en un iPhone. Ningún trabajador ni revisor pudo iniciar sesión ni usar un teléfono real.

Evaluaciones completas: `g7-revisor-a.md` y `g7-revisor-b.md`. Capturas propias del revisor B (235): `diseno/capturas/paso6/g7-revisor-b/`.
