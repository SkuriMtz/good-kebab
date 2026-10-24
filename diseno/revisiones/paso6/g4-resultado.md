# Grupo 4 · Informativas — resultado

Revisión en modo ligero: los revisores calificaron con las capturas y el código de cada trabajador.

| Propuesta | Revisor A | Revisor B | **Promedio final** |
|---|:-:|:-:|:-:|
| **G4-T3 · GitHub con la calma de Apple, pocas cajas** | 8.50 | 8.00 | **8.25** |
| G4-T1 · Ritmo de secciones de la portada de GitHub, fiel al plan | 7.83 | 8.33 | 8.08 |
| G4-T2 · El producto explica cada sección | 6.83 | 6.17 | 6.50 |

**Ganadora: G4-T3** (rama `prop/g4-t3`, commit `6f43d46`), por promedio. Los revisores se dividieron:

- **Revisor A eligió T3:** es la más sobria y la más parecida a GitHub, usa líneas en lugar de cajas y es la mejor en celular.
- **Revisor B eligió T1:** es la más fiel al plan y la que enseña más producto.

T3 además va con la lección 13 del 16 oct ("minimalismo, nada muy exagerado"). Por eso gana T3, y **se le incorpora el producto real de T1**.

## Debe corregir al integrarse
1. **Mona Sans en las muestras de producto** (lección 13). La muestra del visto bueno usa `.producto`, que hoy sale en la letra del sistema. Se corrige en la base: `--font-producto` pasa a Mona Sans.
2. **"Cómo funciona" en 1440:** queda un hueco bajo los pasos 1 y 2. Se llena con contenido útil (ver ideas T1-2 y T2-1).
3. **Personajes en los encabezados:** al menos los 4 personajes pequeños sobre "Qué es Atendel", como hace T1, sin recargarlos.
4. **Revelado al bajar:** hoy va atado al scroll y deja filas a medio mostrar. Se cambia por un revelado de una sola vez (0.4s, `cubic-bezier(0.16,1,0.3,1)`) y se quita de la muestra interactiva.
5. **Celular:** la pestaña "Negocios de servicios" se corta sin pista. Agregar un desvanecido en el borde o permitir dos filas.
6. **Puntos finales en los títulos:** una sola regla para todo el sitio, a decidir en la integración.
7. **`AL_FRENTE` de `/para-quien-es`** (Clínicas → Clara, Estéticas → Víctor, Consultorios → Iris, Servicios → Lola) es una decisión editorial del trabajador. **Se le pregunta al dueño.**
8. **Para la integración:**
   - Quitar o renombrar `.equipo` de `globals.css` (carrusel viejo).
   - Usar `<Seguridad variante="preguntas" />` en `/preguntas#seguridad`, con una prop `id` para no repetir ids.
   - Poner "Pruébalo" de la barra como botón sutil, para que no haya dos azules.
   - Despejar la escena detrás del texto de entrada de `/para-quien-es`.

## Mejores ideas de las otras propuestas para incorporar
**De G4-T1:**
- El plan de cada agente como etiqueta Mono tenue ("DESDE FREE / DESDE ONE / EN MAX", con `planMinimo`).
- Las píldoras de los 4 agentes en el paso 2.
- Una conversación real por negocio en `/para-quien-es` (con `detalle.ts`), la del agente que va al frente.
- El resultado de cada fila del día como línea Mono tenue, sin cajas.
- "Ver el panel de ejemplo →" que lleva a `/pruebalo`.
- La intro de Seguridad ("Los datos de tus pacientes y clientes son tuyos…").
- El camino "Editar" de la muestra, con botones sutiles.
- En celular, el índice que se desliza solo hasta el negocio actual.

**De G4-T2:**
- Microtextos reales del producto en los pasos 1 y 2 ("Revisa tu correo. Sin contraseñas.", "En tu equipo"), como sello pequeño y sin marco.
- Las cifras del reporte de ejemplo de Iris (de `detalle.ts`).
- Estados ("Cita creada", "Correo enviado") como texto Mono, con medida.
- La línea de instrucción "Elige tu tipo de negocio…".

## Problemas de las demás (para no traerlos)
- **G4-T2:** muestra un panel "Permisos de tu cuenta" que no existe en el producto. Además mete cajas dentro de cajas, repite "texto + marco" en 3 de las 4 secciones y tiene botones dibujados que no hacen nada.
- **G4-T1:** sus fichas parecen botones y se cortan con puntos suspensivos en 390. La sección Seguridad es lo más cercano a una plantilla: título centrado más 3 columnas con ícono.

Evaluaciones completas: `g4-revisor-a.md` y `g4-revisor-b.md`.
