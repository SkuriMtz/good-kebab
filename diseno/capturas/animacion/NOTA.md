# Movimiento y UI/UX de la landing — auditoría corta

Rama `prop/animacion`. Solo el sitio público. El diseño aprobado (lección 16) no cambia:
solo el movimiento y los estados. Solo se animan `transform` y `opacity`.

**Sistema:** estados 150 / 200 / 250 ms · entradas 450 / 600 / 700 ms · curvas
`power2.out` (estados) y `power3.out` (entradas) · escalonado 60–80 ms. Vive en
`src/lib/movimiento.ts` (GSAP) y en las variables `--mov-*` de `src/estilos/landing.css` (CSS).

## Oportunidades, de la más a la menos importante

| # | Dónde | Qué cambia | Por qué | Duración y curva |
|---|---|---|---|---|
| 1 | Portada (`Revela.tsx`) | Una sola secuencia GSAP: etiqueta → título por línea → párrafo → formulario → registro. Antes eran transiciones CSS sueltas que tardaban ~2 s. | Un solo momento protagonista y el botón listo en cuanto se lee el título. | Total 1.12 s (tope 1.15 s). Título: 700 ms `power3.out`, +80 ms por línea. Párrafo: 450 ms `power2.out`, de izquierda a derecha. Formulario: 600 ms, 12 px. |
| 2 | Al bajar, todo el inicio (`AlBajar.tsx`) | Filas de agentes, encabezados, filas del día, pasos, garantías, planes, preguntas y cierre entran una sola vez con `ScrollTrigger.batch`. Antes aparecían de golpe. | Guía la lectura sin competir: lo que llega junto entra como grupo. | 600 ms `power3.out`, 16 px, escalonado 70 ms. Solo opacidad (no `visibility`): se puede llegar con el teclado. |
| 3 | Lista de agentes (`ListaAgentes.tsx`) | Banda tenue que se desliza a la fila con `gsap.quickTo`; el personaje reacciona apenas (antes 1.08 y −4°, ahora 1.04, −3° y −2 px); con el teclado pasa lo mismo que con el mouse; al tocar en celular la fila se aclara. | El resaltado se lee como un solo objeto que se mueve, no filas que parpadean. | Banda: 250 ms `power3.out` (y, scaleY), 200 ms `power2.out` (opacidad). Personaje y nombre: 250 ms. |
| 4 | Lenis (`ScrollSuave.tsx`) | Las anclas caían 168 px arriba (offset −80 sumado al `scroll-margin-top` de 88 px): ahora quedan a 88 px exactos. Menos "flotado": lerp 0.075 → 0.1 y rueda ×0.9 → ×1. `ScrollTrigger.refresh()` cuando cargan letras e imágenes. En celular, scroll nativo. | Saltos precisos y un scroll que se siente del sistema, solo que sin tirones. | Anclas: 1.1 s `power3.out`. |
| 5 | Formularios (lista de espera y contacto) | La sacudida del primer error no funcionaba (`eyframes` sin `@k` en `conversion.css`): arreglada. El error aparece con fundido; éxito y aviso suben 6 px; borde de foco suave. "¿Te equivocaste de correo?" con 44 px para tocar. | Estados claros: enviando (giro), éxito, error en español junto al campo. | Error 200 ms `power2.out`; éxito/aviso 450 ms `power3.out`; foco 150 ms. |
| 6 | Hamburguesa (hoja del celular) | Las filas bajan de la barra una tras otra; al cerrar todo se va junto y más rápido. El ícono ☰ → ✕ ya cruzaba bien (toma la curva nueva). | Abrir se siente ordenado; cerrar, inmediato. | Abrir 450 ms `power3.out`, +60 ms por fila; cerrar 150 ms. |
| 7 | Botones | Presión a 0.97 ya existía con 200 ms "ease": ahora 150 ms `power2.out`. Foco visible de 2 px. | La presión tiene que sentirse al instante. | 150 ms `power2.out`. |
| 8 | Zonas de toque en celular | Botones chicos (36–40 px), pestañas de negocio (42), "Cómo cuidamos tus datos" (36), temas de preguntas (40) y selector de tema del pie (34) crecen a ≥ 44 px con una capa invisible. | Tocar sin fallar, sin mover nada de lugar. | — |
| 9 | Ficha del agente | Ya entraba bien (fundido + 8 px + escala 0.98) y salía más rápido: solo toma `power3.out` y 450 ms; sale en 150 ms. | Se conserva: es correcta. | Entra 450 ms, sale 150 ms. |
| 10 | Fuera de mi alcance | Con el mouse encima del chat de demostración, la rueda se queda en el chat (`overscroll-behavior: contain` en `chat.css`) y la página deja de bajar. No lo toqué: es del chat. | Para decidirlo con quien trabaja el chat. | — |

## Lo que se cuidó

- **Reducir movimiento:** todo el texto está desde el primer cuadro (`reducido-1440-oscuro.png`); no hay entradas, ni Lenis, y la banda salta sin animarse.
- **Sin saltos de diseño:** solo `transform` y `opacity`; al terminar cada entrada se quitan los estilos en línea.
- **Partículas:** sin cambios. Ya cambian de figura al cruzar cada sección, en orden y con brillo bajo (lecciones 7, 10 y 11).
- **Videos:** el navegador de pruebas dibuja la escena de partículas sin tarjeta de video (≈ 10 cuadros por segundo), así que en los `.webm` el movimiento se ve más entrecortado que en una computadora real. Los tiempos son los mismos: GSAP va por reloj, no por cuadros.
- **Revisión automática:** sin problemas en 44 páginas (1440/390, oscuro/claro), aparte de los avisos de `.sr-only` y la red de `/entrar`. Ojo: `/home/user/wt/revisar.mjs` arma la dirección entre comillas simples (`'http://localhost:${…}'`), así que nunca usa el puerto y revisa páginas en blanco; la corrí con una copia que usa comillas invertidas.
