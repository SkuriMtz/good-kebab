# Inspector · revisión final de la landing (23 oct)

Rama prop/landing-m1, commit c8ef743. Revisé las 40 capturas de `diseno/capturas/landing-final/`, la NOTA y el diff. No levanté servidor.

## Veredicto
**Se puede enseñar al dueño.** Antes conviene hacer los arreglos 1 a 3: son de CSS y cortos.

Calificaciones (1 a 10): fidelidad 9 · no genérica 8 · reglas 9 · partículas 8 · muebles 9 · celular 7 · familia 8 · dashboard y chat sin tocar 10.

## Mis arreglos anteriores
- **M1**, aplicados: la figura bajó a alfa 0.6 y ya no tiene blancos fuertes. Los fragmentos sueltos solo salen en las orillas de pantallas de 1360px o más, nunca sobre el texto. "TU EQUIPO" ya tiene aire bajo la barra. El retrato con color ya no aplica, porque se quitó el carrusel.
- **M3**, aplicados: la lista ya no está en la portada y los personajes miden 88px. No queda la franja de `.m3-resto`. En celular ya no se asoma el globo y ningún tetraedro tapa "Entrar".
- **Sigue igual (aviso):** el chat de demostración va después de los agentes. El dueño debe confirmarlo.

## Lo que está bien
- **Oscuro (Dala):** fondo #000, títulos enormes en 400 y radio de 24px. Precios, contacto y /entrar flotan sin caja.
- **Claro (Vercel):** fondo #fafafa, líneas finas, anillo doble, radio de 6px y etiquetas en Mono.
- **Botón azul:** hay uno solo por pantalla.
- **Datos:** las cifras (30, 600 y 3,000 mensajes) salen de `src/lib/planes.ts` y One y Max dicen "Próximamente". No hay nada de la marca de Dala, Vercel ni GitHub.
- **Navegación:** la barra lleva hamburguesa en celular, sin la palabra "Menú", y conserva el botón de tema. El pie, los formularios (lista, contacto y entrar) y las preguntas están completos.
- **Lo que no se tocó:** el dashboard, el chat y `componentes-pendientes/` siguen igual.
- **Familia:** todas las páginas se sienten del mismo sitio. Las que llevan figura ponen el título a la izquierda y la figura a la derecha; las de formulario van centradas.

## Defectos, en orden de importancia
1. **Precios: la línea de arriba de Free es violeta y en oscuro sale recortada.**
   - Pasa en el inicio y en /precios, en 1440 y en 390. Es `--c-destacada` (#8c93fb): violeta fuera del logo y los personajes, contra la lección 14.
   - En oscuro, el radio de 24px de `.planes` la recorta, así que empieza unos 18px después que la columna.
   - Arreglo, en `src/estilos/landing.css`: definir `--c-destacada: var(--c-texto)` (o el azul de acento) en los tokens de `.sitio` de los dos modos, y en oscuro `.sitio .planes { border-radius: 0; }`, porque ahí no hay caja que redondear.
2. **/para-quien-es en 1440 (los dos modos): el encabezado arranca en x≈168 y no en la orilla de 120** que usan la barra, el inicio y /precios.
   - Lo causa `.encabezado-escena__texto { margin-left: 4%; }` (`src/app/globals.css`, cerca de la línea 2678).
   - Arreglo, en `landing.css`: `.sitio .encabezado-escena__texto { margin-left: 0; }`.
3. **Celular, /para-quien-es: la figura ocupa media pantalla y el botón azul "Habla con los agentes" queda fuera de la primera pantalla.**
   - Lo causa `padding-top: 50svh` (`globals.css`, cerca de la línea 2686).
   - Arreglo, en `landing.css`: bajarlo a unos 30–34svh y achicar la burbuja en celular (`escenas.ts`, caso `burbujaDerecha`).
   - Revisar lo mismo en /precios, donde el globo ocupa los primeros 400px.
4. **/entrar en claro: el campo de correo tiene fondo gris,** distinto de los campos blancos de la portada y de contacto.
   - Arreglo, en `landing.css` (bloque Entrar): fondo #fff y el mismo borde fino que los demás campos.
5. **(opcional)** En oscuro, el globo de "Tu equipo" y el de /precios todavía se ven más saturados (dorado, violeta y verde) que la burbuja de la portada.
   - Arreglo: bajar `alfa` de 0.55–0.6 a unos 0.45 en `escenas.ts` (casos `agentesLista` y el globo de páginas).
6. **(opcional)** El marco del chat de demostración lleva tres puntos rojo, amarillo y verde y la barra "atendel.mx/pruebalo".
   - Es color de adorno fuera de Dala y Vercel, y un recurso de maqueta muy visto.
   - Arreglo: puntos en gris en `src/components/inicio/ChatEnMarco.tsx`, que no se tocó en este cambio. También hay que confirmar que el dominio sea el real.
7. **(opcional)** /agentes es "título centrado y 4 personajes en fila", cerca del patrón que la guía pide no repetir.
   - Podría usar la misma lista tipográfica del inicio, pero en grande. Es cuestión de gusto.
