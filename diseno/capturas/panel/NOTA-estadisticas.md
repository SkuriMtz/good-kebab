# Estadísticas (?vista=estadisticas): notas

Hoja: `hoja-estadisticas.jpg`. De izquierda a derecha: oscuro a 1440 (30 días, con la burbuja de la gráfica), oscuro a 390 (7 días), claro a 1440 (30 días) y claro a 390 (este mes). Todo con **datos de ejemplo**. También se revisó a 1024 y el estado vacío.

- **Qué es:** inspirado en un panel de analítica de código abierto, solo en las ideas de diseño, sin su código ni su nombre. Arriba van 5 números con su flechita contra el periodo anterior; al picar uno, la gráfica cambia a esa métrica. Debajo, una gráfica grande por día, con el periodo anterior en punteado. Al final, tarjetas con barras: por agente, acciones sugeridas, quién escribe más, hora del día y la dona del plan.
- **Piezas:** se usan las piezas del panel (`Tarjeta`, `Cifra`, `Tendencia`, `ListaBarras`, `Dona`, `Vacio`, `EnlaceMas` y `Fragmentos`), además de las píldoras `.pnl-filtro` para el periodo. Lo propio de la vista vive en `estadisticas/estadisticas.css` (`.est-`).
- **Todo se puede picar:**
  - agente → su chat;
  - acción → Pendientes de correo;
  - remitente → Correo filtrado por esa persona;
  - hora → Actividad;
  - dona → Planes.
  El periodo va en la URL, así que el botón de atrás regresa al anterior.
- **Movimiento:**
  - los números suben al aparecer;
  - la línea se dibuja una vez, con un recorte que se abre por transform (250 ms);
  - las barras y las tarjetas entran escalonadas;
  - todo dura de 150 a 250 ms y solo anima transform y opacity;
  - con "reducir movimiento" no se desplaza nada, y los fragmentos se quedan quietos.
- **Nada inventado:** sin datos se ve "—" y un estado vacío con fragmentos y dos acciones (hablar con tu equipo o resumir un correo). En /pruebalo, los datos se generan con una semilla y pasan por el mismo cálculo que los reales.
- **Pendiente:** Correo (`&de=`) y Actividad (`&hora=`) en /panel todavía no filtran con esos parámetros.
