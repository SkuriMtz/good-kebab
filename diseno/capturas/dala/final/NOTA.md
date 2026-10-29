# Inicio de Atendel contra los videos — comparación final

Página: `src/app/page.tsx` (rama `prop/dala`), con el fondo de figuras de Figuras A ya unido y afinado.

## Qué hay en esta carpeta

- `comparativa-01…10-*.jpg`: hojas lado a lado (video a la izquierda, Atendel a la derecha) en los mismos instantes: portada, cada escena y cada transición.
- `atendel-1212.webm`: la grabación completa a 1212×750 (36.3 s, 20 cuadros/s).
- `captura-portada-390-oscuro.jpg`, `captura-equipo-390-oscuro.jpg`, `captura-portada-1440-claro.jpg`, `captura-equipo-1440-claro.jpg`.

**Cómo se grabó.** Playwright a 1212×750 con un reloj propio: el tiempo de la página (requestAnimationFrame, `performance.now` y `Date.now`) solo avanza 1/60 s cuando el script lo pide. La rueda (`page.mouse.wheel`) repite cuadro por cuadro la curva de la barra de scroll del video (`referencia/scroll-v*.csv`). Así los tiempos son exactos aunque aquí WebGL vaya lento. No se usó `recordVideo`: con WebGL a ~10 cuadros por segundo saldría con otros tiempos.

## Calificación por escena (1 a 10)

| Escena | Nota | Por qué |
|---|---|---|
| 1. Portada | 7 | Barra, textos, tamaños, posiciones y entrada del texto iguales. El cerebro tiene la misma caja, giro y tiempos, pero es una cúpula lisa: le faltan los lóbulos y la variedad de color del video. |
| 2. Decisiones | 7 | El cerebro gira, crece y se va a la izquierda con las poses medidas del video (de −90° a +7° entre 1.0 y 2.8 s) y llega antes que el texto, como en el video. En reposo queda un poco más ancho. |
| 3. Caos | 8 | Polvo por toda la pantalla y los tres grupos de texto centrados en su lugar y tiempo. Hay menos texto que en el video (sin cifras inventadas), así que el tercer grupo se va antes. |
| 4. Foco | 7 | Se forma a la izquierda con su degradado y en el mismo tramo del scroll. La nube de "polvo junto" es más pareja que la del video. |
| 5. Globo | 7 | Mismo lugar, tamaño y continentes. Le falta el reflejo blanco de la izquierda y empieza a formarse ~0.2 s tarde. |
| 6. Tu equipo | 8 | Composición, carrusel, fichas apagadas, flechas y tiempos iguales. Van los personajes de los agentes en lugar de las fotos. |
| 7. Planes | 8 | Título a la derecha y cuatro tetraedros con texto que llegan volando como los íconos del video. |
| 8. Cierre | 8 | El polvo se junta y la marca se forma y gira en los mismos tiempos (15.2 → 16.1 s). Es la marca de Atendel (los cuatro círculos de los agentes), no la del video. Pie delgado igual. |

## Qué coincide

- Alto de la página (10 090 px a 750 de alto) y el reposo de cada escena en el mismo scroll: con la misma rueda, todo queda en el mismo lugar.
- Scroll suave medido (Lenis a 0.08): el texto sigue a la rueda como la curva de `referencia/scroll-v1.csv` (0–2 px); contra el texto real del video, la diferencia llega a ~45 px solo al acelerar (ver la errata abajo).
- Tipografía (Geist en los tamaños, pesos e interlineados medidos), columnas, colores, píldora violeta, enlace encendido de la barra en los mismos puntos.
- Entrada del texto: títulos que suben por renglón (0.8 s) y párrafos letra por letra.
- Figuras: cada cambio en el tramo de scroll medido; el cerebro va adelante del texto.

## Qué no se pudo igualar y por qué

- **Forma del cerebro.** La reconstrucción 3D que dejó Figuras A (en su carpeta temporal, no en su rama) salió cuadrada al verla de lado, así que se quedó el cerebro por perfiles medidos, ahora transparente y más denso como el del video. Faltan lóbulos, surcos y el color por cara.
- **Título de la portada** en 4 renglones: el texto en español es más largo; se conservó la caja del video.
- **Textos del caos:** tres párrafos cortos del encargo contra seis del video.
- **Globo:** sin el reflejo blanco; un poco más tenue.
- **Modo claro y celular:** no existen en el video; tienen la misma composición (en celular, el texto arriba y la figura abajo).
- **Errata de MEDIDAS:** la columna `contenido_px` de `scroll-v*.csv` es el modelo de suavizado (λ = 4.75/s); al acelerar, el texto real del video va hasta ~45 px más atrás (por ejemplo, a los 2.75 s). En reposo coinciden.

## Muebles que cambiaron de lugar

- **Chat de demostración:** salió del inicio; vive en `/pruebalo`, enlazado desde la ficha de cada agente ("Pruébalo con Lola"…) y desde la hoja del celular.
- **Barra:** la nueva (Agentes, Precios, Cuándo sale, Preguntas y "Únete a la lista") va en todas las páginas públicas; "Únete a la lista" abre el formulario de la lista ahí mismo.
- **Pie:** el delgado solo en el inicio; las demás páginas conservan el suyo.
- **Secciones del inicio anterior:** "Para quién es" en `/para-quien-es`; precios en "Planes" y `/precios`; preguntas y seguridad en `/preguntas`. Los componentes viejos siguen en `src/components/inicio/`.
- **Escena 3D:** sigue en `/vista-3d`.
