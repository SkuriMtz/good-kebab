# Grupo 2 · Chat de los agentes — resultado

Promedio de los dos revisores (cada uno promedió los 6 criterios):

| Propuesta | Revisor A | Revisor B | **Promedio final** |
|---|:-:|:-:|:-:|
| **G2-T4 · "Hilo de trabajo"** (línea de tiempo, relevos entre agentes) | 8.33 | 8.17 | **8.25** |
| G2-T1 · "La mesa de trabajo" (3 columnas que se adaptan al contenedor) | 8.00 | 8.33 | 8.17 |
| G2-T5 · "Míralo trabajar" (escena paso a paso) | 8.00 | 7.67 | 7.83 |
| G2-T2 · "Lo que quedó hecho" (pestañas por canal + resultado) | 7.50 | 7.50 | 7.50 |
| G2-T3 · "Línea de revisión" | 6.67 | 7.00 | 6.83 |

**Ganadora: G2-T4** (rama `prop/g2-t4`, commit `e1e005e`), por muy poco sobre G2-T1. Ambos revisores coinciden en que es la más pareja: agentes sin caja sobre una línea de tiempo, relevos visibles entre agentes ("Lola le pasa el seguimiento a Víctor") y cajas solo para el trabajo terminado — resuelve "puros cuadrados y cajas".

## Debe corregir al integrarse (de ambos revisores)
- **Adaptarse al contenedor, no a la ventana** (lo marcan los dos): tomar la técnica de G2-T1 (columnas según el ancho del propio chat) para que funcione como vista "Conversaciones" del dashboard.
- Aplicar la base 4b: azul en lugar de violeta, pila tipográfica de producto, radios 12–16px; sin marco de navegador dentro del dashboard.
- Textos cortados en celular, falta espacio entre personaje y nombre en pestañas, ayudas repetidas bajo el compositor.

## Mejores ideas de las otras propuestas para incorporar
- **G2-T1:** layout por container queries y la columna "Lo que quedó hecho" (equivale a la columna derecha del dashboard).
- **G2-T2:** "Así lo ve tu paciente en WhatsApp", tarjetas de resultado y el botón "Dar visto bueno" (con el color de atención en "Espera tu visto bueno").
- **G2-T5:** celular como app (lista en pantalla aparte, "Nuevo grupo" como hoja que sube).
- **G2-T3:** eventos que aparecen en el hilo al usar una acción "/".

## Problemas de las demás (para no traerlos)
- G2-T3: mensajes en cajas con borde, "Lolaestá escribiendo" sin espacio, ruta de prueba en el código.
- G2-T2: sugerencias desbordadas, rayitas en la lista del panel, "Nuevo grupo" cortado en celular.
- G2-T5: quitó el fondo de partículas de `/pruebalo` sin avisar.

Pendiente para la integración: probar `/panel/chat` con una cuenta real (ningún revisor pudo iniciar sesión).

Evaluaciones completas: `g2-revisor-a.md` y `g2-revisor-b.md`. Capturas propias del revisor B: `diseno/capturas/paso6/g2-revisor-b/`.
