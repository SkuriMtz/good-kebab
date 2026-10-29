# Figuras A — nota

## Cambios pedidos por el dueño (29 oct)

- **Cerebro 3D de verdad** (`hoja-cerebro.jpg`): dos hemisferios hechos de lóbulos (frontal,
  parietal, occipital, temporal y cerebelo) ajustados a las siluetas del video (IoU 0.90–0.94 de
  lado, girando y de frente), con surcos donde se juntan los lóbulos, circunvoluciones con ruido,
  fisura entre hemisferios y tronco. Perspectiva y giro lento; lo de enfrente es más grande y
  brillante y lo de atrás se ve a través, tenue. Color por orientación y por zona, medido en el
  video: ámbar en la orilla y en las caras de abajo, blanco donde la cara mira a la luz, y zonas
  verde azulado y violeta que giran con el cerebro (ya no sale todo ámbar parejo). De lado ya no
  se ve cuadrado.
- **Foco 3D** (`hoja-foco.jpg`): vidrio transparente (se ven los triangulitos de atrás, tenues),
  luz de frente con reflejo blanco y lado de sombra, ámbar solo en la orilla de arriba a la izquierda.
- **Planes → cierre fluido** (`tira-planes-a-cierre.jpg`). La causa: la marca se armaba solo en el
  último 5 % del tramo, que son los últimos ~40 px de scroll pegados al final de la página; ahí el
  scroll suave ya va frenando y llegaba a pasitos (y casi todas las partículas aparecían una por
  una). Arreglo: el polvo se junta de p 0.05 a 0.65 y la marca se arma de p 0.55 a 1, con un
  solo avance para todas (apenas escalonado), y las partículas de la marca ya se ven en la nube,
  así que al armarse solo se mueven. En modo automático ninguna escena reposa más abajo de donde
  llega el scroll (la última siempre termina). Probado en la página: la posición sube pareja de
  6.05 a 7.00 al bajar con la rueda.


Motor WebGL de la versión 7 (triangulitos como puntos, cada uno un resorte), ahora con
tetraedros de alambre como en el video, figuras con azar de semilla (siempre iguales) y
cambios atados al scroll. Laboratorio: `/laboratorio-figuras` (sin índice): botones por
escena (teclas 1–8), barra para recorrer la historia y repetición del scroll de los dos videos.

## Cómo se conecta

```tsx
import { FondoFiguras } from "@/components/escena/FondoFiguras";

<FondoFiguras />                               // automático: lee <section data-escena="…"> y el scroll
<FondoFiguras escena="globo" />                // cambio solo, en ~1.6 s
<FondoFiguras escena="foco" progreso={0.4} />  // atado al scroll (0 = en foco, 1 = ya en globo)
```

En modo automático cada sección reposa cuando su borde de arriba llega al borde de arriba
de la pantalla. Escena → figura:

| Escena | Figura |
|---|---|
| portada | cerebro de lado a la derecha (frente a la izquierda), con su tallo |
| decisiones | el cerebro gira de lado a frente, crece y se va a la izquierda; abajo a la derecha se deshace en cola de polvo |
| caos | el cerebro se deshace de abajo hacia arriba en polvo por toda la pantalla (fijo, no se mueve con el scroll); al final del tramo el polvo se junta arriba a la izquierda |
| foco | foco inclinado a la izquierda: ámbar en la orilla de arriba, blanco y durazno, violeta en el cuello, azul y verde en la rosca |
| globo | globo con continentes reales (África y Europa al frente, como el video) a la derecha, con parche blanco y mar de puntitos |
| equipo | el globo sube, se vacía en anillo y queda polvo arriba |
| planes | polvo ralo, más arriba a la izquierda |
| cierre | el polvo se junta al centro y forma el remolino |

Pantallas verticales (ancho < 700 o ancho/alto < 0.8): la figura va centrada en x 0.5, con
centro en y 0.72, 0.85 del ancho y brillo ×0.8; el polvo y los tetraedros siguen en toda la pantalla.

## Calificación (contra los cuadros del video)

| Figura | Nota | Por qué |
|---|---|---|
| Cerebro de la portada | 7 | silueta igual (IoU 0.95, misma caja); densidad y brillo por triangulito medidos (pico 117 contra 122); falta el relieve de lóbulos y surcos y el ámbar en las caras de abajo |
| Cerebro grande (decisiones) | 5 | lugar y escala estimados, no ajustados cuadro por cuadro |
| Polvo del caos | 7 | fijo en pantalla como en el video; tamaño, densidad y colores medidos |
| Polvo junto | 6 | nube en el lugar medido, densidad aproximada |
| Foco | 7 | forma, inclinación y degradado parecidos; el cuerpo un poco más cálido |
| Globo | 7 | centro y radio medidos, giro ajustado a los continentes del video; el parche blanco queda más tenue |
| Polvo de equipo y de planes | 6 | repartos medidos a ojo |
| Remolino | 5 | el del video es el logo de Dala (prohibido): aquí es un rehilete de 4 aspas con sus colores y su caja |
| Tetraedros grandes | 6 | en los lugares del video por escena, con paralaje |

| Cambio | Nota |
|---|---|
| portada → decisiones (giro, crece, a la izquierda) | 6 |
| decisiones → caos (se deshace de abajo hacia arriba) | 5 |
| caos → polvo junto → foco | 6 |
| foco → globo | 6 |
| globo → equipo (anillo, polvo arriba) | 5 |
| equipo → planes | 6 |
| planes → cierre (remolino) | 5 |

## Qué falta

- **Forma 3D real del cerebro.** Ya la reconstruí del video (casco visual con 10 siluetas del giro,
  simétrico, IoU medio 0.96) y la convertí a una función radial de 3.5 KB, pero no alcancé a
  meterla: quedaría con lóbulos, cerebelo y fisura del video.
- **Color del cerebro por dirección de la cara** (medido): orilla de abajo 63 % ámbar, orilla
  derecha 65 %, arriba 47 %, frente (izquierda) 33 % con más rosa y magenta, centro 23 %.
- **Tiempos.** En el video la figura sigue al scroll *pedido* (la barra), ~0.2 s antes que el
  texto: el lugar del cerebro es lineal contra ese scroll (error 11 px; contra el del texto, 15 px).
  Corrección propuesta: usar `P + P′/4.75`. Esto contradice MEDIDAS §0.3.
- Giro medido del cerebro: −90° (portada) → −72° (2.0 s) → −40° (2.2 s) → −28° (2.4 s) → de frente
  a los 2.66 s → +7° (2.8 s). Hay que pasarlo a las llaves con esos tiempos.
- Ajustar el cerebro de decisiones y la cúpula de decisiones → caos cuadro por cuadro.
- Hojas lado a lado y grabación .webm: no se hicieron (el coordinador cortó las rondas de comparación).
- Modo claro: solo lo básico (colores más hondos y lo blanco pasa a gris violáceo), sin comparar.
