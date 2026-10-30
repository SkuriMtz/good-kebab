# Figuras A — nota

## Más color y más 3D (30 oct, guía: `descripcion-cerebro.md`) → `hoja-color-final.jpg`

**Qué cambió en el motor**
- **Triángulo hueco:** las aristas que van al centro casi no se ven. Las partículas sueltas siguen
  siendo tetraedros, y algunas grandes son rombos. El rombo violáceo de abajo a la izquierda va borroso.
- **Halo suave por triángulo**, con mezcla aditiva.
- **Resplandor por partícula:** una mancha ancha y muy tenue que da el brillo de adentro del
  cerebro. No es un bloom de pantalla. En el celular (menos de 700 px) se apaga para que no trabe.
- **Profundidad de campo:** lo más cercano, sobre todo el lado izquierdo del cerebro, sale más
  grande, más difuso y doble. Lo de atrás es más chico y nítido. La capa lejana se ve a través,
  tenue.
- **Orilla densa y centro abierto (cáscara hueca):**
  - hay partículas "solo orilla" que se encienden donde la superficie se ve de lado;
  - la superficie se densificó con puntos intermedios entre vecinos;
  - la orilla usa una normal suavizada, así sale una banda ámbar pareja y gruesa.
- **Color por zona y orientación.** El ámbar va en la orilla y abajo; la banda inferior del
  temporal es la más brillante. Adentro va blanco y gris lavanda en manchas grandes, con violeta,
  turquesa en grupitos, destellos magenta en el borde de arriba y algo de azul.
- **Fisura entre hemisferios** oscura (de frente se ve la raya del medio).
- **Tronco más tenue**, que se apaga hacia abajo.
- **Foco:** cuerpo durazno y blanco, cuello y rosca más tenues, más chico y en su caja.
- **Globo:** el mar con puntitos visibles (la esfera se ve llena), más blanco y magenta en la tierra.

**Medidas en los cuadros clave del cerebro** (video / antes, be706e5 / ronda 1 / ronda 2)

| Medida | Video | Antes | Ronda 1 | Ronda 2 |
|---|---|---|---|---|
| 1.0 s · ámbar / blanco / violeta / magenta (%) | 46 / 40 / 4 / 5 | 43 / 40 / 8 / 2 | 44 / 41 / 4 / 6 | 44 / 46 / 3 / 2 |
| 1.0 s · brillo p50 / p90 / p99 | 65 / 152 / 212 | 74 / 148 / 255 | 70 / 142 / 234 | 69 / 141 / 240 |
| 1.0 s · densidad orilla / centro | 0.79 / 0.24 | 0.53 / 0.21 | 0.64 / 0.28 | 0.62 / 0.28 |
| 1.0 s · banda ámbar de la orilla (px) | 25 | 35 | 15 | 20 |
| 1.0 s · resplandor dentro (fondo, p50) | 32 | 3 | — | 23 |
| 1.0 s · tamaño del triangulito (px) | 9 | 12 | 10 | 10 |
| 2.2 s · ámbar / blanco (%) | 47 / 41 | — | 46 / 45 | 45 / 50 |
| 2.2 s · brillo p50 / p90 | 65 / 140 | — | 66 / 147 | 67 / 150 |
| 2.2 s · densidad orilla / centro | 0.86 / 0.27 | — | 0.57 / 0.30 | 0.57 / 0.28 |
| 2.8 s · ámbar / blanco (%) | 42 / 45 | — | 60 / 31 | 62 / 33 |
| 2.8 s · brillo p50 / p90 | 57 / 137 | — | 66 / 148 | 66 / 148 |

- **Dentro de ±10 %:** el color de lado y en 2.2 s, el brillo p50 y p90, la densidad del centro
  y el tamaño del triangulito.
- **Fuera de ±10 %:**
  - la densidad de la orilla es ~20 % menor que en el video;
  - el p99 es más alto (la banda de abajo satura un poco);
  - de frente (2.8 s) hay más ámbar que en el video: la cara de abajo se ve de canto y hace una
    banda horizontal.
- Las rondas se acortaron a 2 por pedido del dueño (ir más rápido).

## Cerebro real (30 oct): "parece un corazón" → hoja `hoja-cerebro-2.jpg`

- **Forma de un cerebro humano real.** Viene de la plantilla **MNI ICBM152 2009a simétrica**
  (materia gris + blanca, el promedio de 152 resonancias), que trae el paquete nilearn y que
  también está en TemplateFlow (`tpl-MNI152NLin2009aSym`).
  - Se umbralizó, se rellenaron los huecos de adentro y se sacó la superficie: puntos con su
    normal y la hondura de cada surco.
  - Se ajustó por eje a las siluetas del video, con un ensanche leve de los temporales.
  - Los puntos van en `public/figuras/cerebro.bin` (60 KB); el motor los carga al abrir.
  - Mientras carga se ve polvo. Si el archivo no llega, queda el cerebro de lóbulos de respaldo.
- **Fuente y licencia.** © 1993-2004 Louis Collins, McConnell Brain Imaging Centre, Montreal
  Neurological Institute, McGill University.
  - Licencia permisiva, del tipo de MIT: se permite usar, copiar, modificar y distribuir para
    cualquier fin y sin pago, siempre que el aviso de copyright vaya en todas las copias.
  - El aviso completo va en `public/figuras/cerebro-LICENCIA.txt` y en un comentario de
    `formas.ts`.
  - Primero intenté la malla de Wikimedia Commons "Brain AS.stl" (CC BY 4.0), pero no bajó:
    Commons respondió 429 (demasiadas solicitudes) en 10 intentos. NIH 3D solo tenía modelos
    CC-BY-SA.
- **IoU contra la silueta del video** (mismo instante, mismo scroll):

  | Momento | IoU |
  |---|---|
  | de lado (1.0 s) | 0.94 |
  | 2.0 s | 0.94 |
  | 2.2 s | 0.93 |
  | 2.5 s | 0.91 |
  | de frente (2.8 s) | 0.93 |
  | decisiones (4.5 s) | 0.80 (abajo, el video tiene la cola de polvo, que no es cerebro) |

  - De frente es ancho, plano arriba, con la fisura apenas marcada, los temporales a los lados
    abajo y el tronco al centro.
  - De lado se ven el frontal, el temporal, el cerebelo y el tronco.
- **Poses.** Se ajustaron con la malla en 2.0, 2.2, 2.5 y 2.8 s; quedaron −79.5°, −30°, −13° y
  +14.5°, con una inclinación de −4° a −5°.
- **Retraso.** La figura iba ~30 px atrás del video al girar. La causa era el retraso propio del
  motor (~0.05 s) más el 10 % de velocidad que las partículas no copiaban. Ahora va con el
  scroll suavizado.
- **Brillo y densidad medidos.** El pico de un triangulito es 125 (el video, 122). En el centro
  hay 183 triangulitos sueltos (el video, 217).
- **Color por orientación y por manchas**, como en el video:

  | Zona | Video | Atendel |
  |---|---|---|
  | orilla de abajo, ámbar | 63 % | 76 % |
  | orilla derecha, ámbar | 65 % | 74 % |
  | orilla de arriba, ámbar | 47 % | 50 % |
  | centro | 62 % blanco, 23 % ámbar | 50 % blanco, 19 % ámbar |

  - Las caras que miran a la luz van en blanco.
  - Hay parches violeta y verde azulado que giran con el cerebro.
  - Los colores van en bandas y manchas, no regados triangulito por triangulito.
- **Planes más alto que en el video** (`FondoFiguras.tsx`). Si una sección mide más que su tramo
  en el video (Planes ahora tiene tarjetas), el cambio de figura se hace en el último pedazo,
  del mismo largo que en el video. Así llega igual cuando aparece el cierre.
- **Falta.** El video se ve con un brillo suave alrededor de cada triangulito; el nuestro es más
  nítido. Las bandas ámbar del video son un poco más gruesas.

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
