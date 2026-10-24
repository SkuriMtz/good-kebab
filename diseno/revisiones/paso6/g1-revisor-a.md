# Paso 6 · Grupo 1 (Portada) · Revisor A

Revisé las 5 propuestas con sus entregas (`diseno/entregas/g1-tN.md`), **todas** las
capturas de `diseno/capturas/paso5/g1-tN/` (una por una) y el código de
`Portada.tsx`, `portada.css` y `escena3d/*` (diff contra `d4a1307`). Las capturas
cubrían los 4 modos (1440/390, oscuro/claro) en las 5, así que no hizo falta
levantar ninguna. La barra con "Pruébalo" violeta es del Grupo 6 y sale igual en
las 5, así que no la conté en contra de nadie.

Criterio: la prioridad número uno es que se vea como el sitio de GitHub. Después
pesan las lecciones del dueño (CLAUDE.md) y que un dueño de clínica entienda qué
compra.

## Calificaciones

| Criterio | T1 · Cuatro esferas | T2 · Mensajes sin contestar | T3 · La recepción a las 23:14 | T4 · El título manda | T5 · Personajes + horizonte |
|---|:-:|:-:|:-:|:-:|:-:|
| 1. Fidelidad al estilo de GitHub | 8 | 8 | 8 | 9 | 8 |
| 2. Que no parezca hecho por IA ni genérico | 6 | 5 | 9 | 6 | 6 |
| 3. Evita los errores de CLAUDE.md | 6 | 6 | 8 | 8 | 6 |
| 4. Claridad para un dueño de clínica | 7 | 7 | 9 | 8 | 8 |
| 5. Calidad en celular | 7 | 6 | 7 | 8 | 7 |
| 6. Acabado y detalle | 7 | 6 | 8 | 8 | 7 |
| **Promedio** | **6.83** | **6.33** | **8.17** | **7.83** | **7.00** |

Orden: **T3 (8.17)** > T4 (7.83) > T5 (7.00) > T1 (6.83) > T2 (6.33).

---

## G1-T1 · "Las cuatro esferas" (6.83)

1. **Fidelidad, 8.** Es la portada de GitHub de libro (`inicio-portada-1440-oscuro`):
   fondo #000, halo, rótulo Mono en cielo, display 64/425 centrado, intro gris perla,
   formulario en línea y línea Mono. Le resta que, detrás del título, la textura de
   tetraedros llena casi todo el centro de la pantalla. GitHub deja el centro limpio
   y oscuro.
2. **No genérico, 6.** La idea (el logo de Atendel hecho de partículas y una
   "leyenda" que dice qué esfera es cada agente) es propia, pero no se lee. En la
   captura se ven cuatro nubes de polvo, no el logo. Y lo demás es el hero centrado
   estándar.
3. **Errores de CLAUDE.md, 6.** Las esferas se leen como "cascarones de polvo"
   (lección 10) y llenan la zona del texto (lección 11), aunque el texto se lee. En
   claro (`inicio-portada-1440-claro`, `-390-claro`) el polvo gris se ve sucio,
   como manchas sobre el gris cálido. Brillo bajo, bien (lección 7). Fondo fijo
   recortado y fundido a `--c-fondo`, bien (lección 8, `desplazada-1440-oscuro`).
4. **Claridad, 7.** Título bueno ("Tu recepción sigue contestando mientras tú
   atiendes") e intro concreta. La leyenda de los 4 agentes ayuda. Pero pone "Plan
   Free · Gratis" justo después de prometer WhatsApp y citas, y el Free solo trae a
   Clara: el dueño puede creer que lo de WhatsApp es gratis.
5. **Celular, 7.** Se apila limpio y la leyenda queda en 2×2 como la marca
   (`390-oscuro`). Las esferas casi no se ven, así que la idea se pierde en celular.
6. **Acabado, 7.** La leyenda tiene estados (subrayado, punto que crece, 44px de
   área táctil, scale 0.97) y el fundido abajo está bien hecho. Sin embargo, la
   textura en claro le baja el acabado.

## G1-T2 · "Los mensajes sin contestar" (6.33)

1. **Fidelidad, 8.** Hero centrado sobre halo con un campo de estrellas: es el
   "cosmic command deck" del DESIGN.md (`inicio-portada-1440-oscuro`).
2. **No genérico, 5.** Arriba se ve un cielo de estrellas genérico. El remate (las
   partículas se ordenan en "renglones de bandeja") sale en
   `ordenada-1440-oscuro/claro` como líneas de puntitos que nadie va a leer como una
   bandeja de entrada. La metáfora solo se entiende leyendo la entrega.
3. **Errores de CLAUDE.md, 6.** Hay un corte duro de #000 a #0d1117 donde termina
   la portada (`bajando-1440-oscuro` en y≈630, `ordenada-1440-oscuro` en y≈495). En
   celular reserva 192px vacíos abajo a propósito, y en el primer pantallazo se ven
   como hueco muerto (`390-oscuro`). Brillo y cantidad de partículas, bien.
4. **Claridad, 7.** "Que ningún cliente se quede sin respuesta" es claro. Es la
   única que dice la verdad del plan gratis: "Plan Free gratis, con Clara".
5. **Celular, 6.** Tiene el hueco de abajo, y los renglones salen diminutos en
   `ordenada-390-*`.
6. **Acabado, 6.** A favor: capturó el estado de error del formulario en los 4
   modos y despeja la columna del texto en el shader. En contra: la costura dura y
   un remate que no se ve.

## G1-T3 · "La recepción a las 23:14" (8.17) · GANADORA

1. **Fidelidad, 8.** Hace lo que hace la portada de GitHub: título display sobre el
   halo, formulario en línea y la evidencia del producto asomando abajo
   (`inicio-portada-1440-oscuro`: la tarjeta de WhatsApp se asoma al borde). La
   tarjeta es de vidrio, radio 24, sin sombra, con sellos Mono. Le resta que unos
   pocos tetraedros grandes y desenfocados en las orillas (x≈1380,y≈410;
   x≈60,y≈770) se ven como confeti.
2. **No genérico, 9.** Es la única que muestra el producto real en la portada: un
   WhatsApp de Mariana a las 23:14 con precio ($850), duración y horarios, y el
   sello "CITA APARTADA · JUEVES 16:30 · 23:16" (`inicio-muestra-1440-*`). Es
   concreto, de una estética mexicana, y no se puede confundir con una plantilla.
3. **Errores de CLAUDE.md, 8.** Hay un solo protagonista: la tarjeta es chica
   (440px) y sin violeta. Las partículas quedan fuera de la columna del texto, con
   mezcla normal y brillo bajo. Funciona en claro con gris cálido. La leyenda es
   honesta: "Viene en Atendel One y Atendel Max" sale de `PLANES`. Le resta la
   costura dura #000 → #0d1117 al final de la portada (`muestra-1440-oscuro`,
   y≈760): su `::after` funde a `--c-portada`, no al fondo de la página.
4. **Claridad, 9.** El dueño de una clínica entiende en 5 segundos qué compra:
   cerró, alguien escribió y Lola contestó y apartó la cita. El título ("Tu
   recepción contesta aunque ya hayas cerrado") y la muestra dicen lo mismo.
5. **Celular, 7.** La primera pantalla está limpia y la condición se parte antes de
   "Entras con tu correo…" (`390-*`). La tarjeta se lee bien (`muestra-390-*`) y
   la animación de "escribiendo" no hace brincar el contenido
   (`muestra-escribiendo-390-oscuro`). Le resta que algunos tetraedros rozan las
   orillas del texto de la intro (`390-oscuro`, x≈0 y x≈355 a la altura del
   párrafo).
6. **Acabado, 8.** Usa `figure`/`figcaption` y `time dateTime`. Se ve completa sin
   JS y con movimiento reducido, con rescate a los 6 s. La respuesta y el
   "escribiendo" comparten la misma celda (nada brinca). El enlace "Escríbele tú ↓"
   tiene estados y lleva al chat. El check es de contorno, en cielo.

## G1-T4 · "El título manda" (7.83)

1. **Fidelidad, 9.** Es la más pura: centro limpio, halo que respira, polvo
   finísimo y fundido suave a la sección siguiente, sin costura
   (`bajando-1440-oscuro/claro`). Es lo más parecido a github.com.
2. **No genérico, 6.** Es esencialmente el hero de GitHub con otro texto. Las
   palabras que suben una por una (`entrada-1440-oscuro`) son un truco muy visto y
   el campo de estrellas es genérico. Lo propio está en los nombres de los agentes
   en la intro y en la composición tipográfica a mano.
3. **Errores de CLAUDE.md, 8.** No tiene morphs, ni cascarones, ni costura. Las
   partículas son pocas y tenues, y en claro hay matices (`cambio-de-modo-1440-claro`).
   En la portada no hay producto real (lo deja para la sección siguiente).
4. **Claridad, 8.** "Lola contesta tu WhatsApp…, Clara ordena tu correo…" con los
   nombres resaltados se escanea rápido. La línea Mono trae un dato real ("30
   MENSAJES AL MES").
5. **Celular, 8.** Los cortes del título están compuestos a mano ("Que ningún /
   cliente se quede / sin respuesta") y el tracking es más abierto a 38px. Detalle
   menor: en `390-*` la línea Mono termina el primer renglón con un "·" colgado.
6. **Acabado, 8.** Tracking por tamaño, `opsz`, fundido inferior en ambos modos y
   suavizado del parallax independiente de los fps. Es muy cuidada.

## G1-T5 · "Los cuatro te están atendiendo" (7.00)

1. **Fidelidad, 8.** Las mascotas alrededor del título son muy de GitHub
   (`1440-oscuro`). En cambio, la ola de partículas en el tercio inferior no es de
   GitHub.
2. **No genérico, 6.** Los personajes son propios y mirar el formulario al enfocar
   es una buena idea de marca. Pero el "horizonte/ola de puntos" es el cliché más
   reconocible de hero hecho por IA/web3, y el reparto 2+2 simétrico se siente de
   plantilla.
3. **Errores de CLAUDE.md, 6.** Compiten tres cosas: el título, cuatro personajes de
   color y la ola. La ola es densa y marcada en claro (`1440-claro`, `768-claro`),
   al límite de la lección 7. Al bajar, la ola desaparece de inmediato (la tapa la
   sección siguiente) y deja una franja negra muerta con costura dura
   (`bajando-1440-oscuro`, y 220–450). El fondo fijo se pierde en la práctica.
4. **Claridad, 8.** Los personajes ponen cara al equipo que nombra la intro, y cada
   uno abre su ficha. El título con juego de palabras ("atendida mientras tú
   atiendes") se entiende.
5. **Celular, 7.** La fila de los cuatro personajes arriba del título queda
   simpática (`390-*`), pero la ola casi no se ve (una franjita al borde).
6. **Acabado, 7.** Tiene hover con nombre en Mono, foco, presión 0.97 y temperamento
   por personaje. En las capturas de foco no se nota que volteen. La transición al
   bajar es el punto débil.

---

## Ganadora: G1-T3 · "La recepción a las 23:14"

Es la única que cumple a la vez la estructura de GitHub (hero centrado, halo,
formulario en línea y el producto asomando debajo como prueba) y la regla que más
le importa al dueño después del estilo: mostrar el producto real, con algo que de
verdad pasa en una clínica. T4 es un poco más fiel a GitHub en lo puramente visual,
pero sin la muestra es "el hero de GitHub con otro texto", justo lo que el dueño ya
rechazó (lecciones 4 y 5).

### Mejores ideas de las que no ganaron (para incorporar)

1. **T4: fundido inferior y cortes a mano.** Fundir la portada al color de la página
   (como T4 y T1, `::after` hacia `--c-fondo`) para quitar la costura. Copiar los
   cortes del título compuestos por ancho y el tracking −0.02em a 38px en celular.
2. **T4: nombres de los agentes resaltados en la intro** (peso 500 y color de texto
   principal). T3 ya los nombra, así que es un cambio de una línea.
3. **T2: condición honesta del plan gratis.** "Plan Free gratis, con Clara · Entras
   con tu correo, sin contraseña". Con una muestra de Lola encima, decir que el Free
   trae a Clara evita la confusión. También vale que la columna del texto se despeje
   en el shader (`uColumna`) para que ninguna partícula toque el texto en celular.
4. **T1: leyenda de los cuatro agentes en Mono.** Punto de color y nombre, enlazados
   a su ficha. Se puede poner bajo la muestra o en la línea "Escríbele tú" como
   "o conoce a Clara, Víctor e Iris". Es una forma compacta de presentar al equipo
   sin tarjetas.
5. **T5: los personajes como puerta a la ficha** (botón accesible con nombre
   "Lola, Atención…"). En T3 el avatar de Lola de la muestra podría abrir su ficha.
   *No* traer la ola de partículas ni los cuatro personajes alrededor del título:
   competirían con el protagonista.
6. **T4: dato real "30 mensajes al mes"** del plan Free, si cabe en la línea Mono
   sin partirla mal.

### Problemas que la ganadora debe corregir al integrarse

1. **Costura dura** entre la portada (#000) y la sección del chat (#0d1117): el
   `::after` debe fundir hacia `--c-fondo`, no hacia `--c-portada`.
2. **Tetraedros grandes y desenfocados** en las orillas (efecto confeti): limitar el
   tamaño máximo del desenfoque, o quitar las partículas más cercanas.
3. **Partículas que rozan el texto en celular:** despejar de verdad la columna del
   texto a 390px.
4. **Repetición con la sección siguiente:** la muestra (Lola y Mariana, limpieza
   facial) y el chat en marco del Grupo 2 abren con Lola casi seguidos. Hay que
   coordinarlo con el integrador para que el chat en vivo arranque en otra
   conversación o pestaña. Si no, es la misma escena dos veces.
5. **Hora de la conversación:** en `detalle.ts` es 10:42 y la muestra la cambia a
   23:14. Se acepta porque está marcada como "Ejemplo", pero conviene que el dato
   viva en `detalle.ts` (o en los datos de la portada) y no escrito a mano en el
   componente, para que no se desincronice.
6. **Plan gratis junto a una muestra de Lola:** cambiar la línea Mono a la versión
   de T2 ("Plan Free gratis, con Clara…"), o confiar en la leyenda "Viene en Atendel
   One y Atendel Max". Hoy las dos líneas están a 300px una de otra y se pueden leer
   como contradictorias.
7. **Pedidos a la base** que trae T3: el indicador "escribiendo…" compartido con el
   chat, la viñeta de `.escena3d` por modo (y quitar el `visibility: hidden` en
   claro) y conservar el ancla `#en-vivo` en `ChatEnMarco`.
8. **Segundo violeta** en la barra ("Pruébalo"): lo resuelve el Grupo 6, pero la
   portada de la ganadora lo hace más visible porque es su primera pantalla.
