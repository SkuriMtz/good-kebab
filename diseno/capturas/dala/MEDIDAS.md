# Medidas cuadro por cuadro de los videos de Dala

Base para todo el equipo (Página A/B, Figuras A/B, revisores, integrador e inspector).
Medido por el trabajador Página A el 27 oct. Si encuentras un error, anótalo en tu NOTA.

Los dos videos (1212×750, 60 cuadros por segundo con algunos cuadros repetidos):
- **v1** `372afd5a-…7.37.00p.m..mov`, 19.6 s: portada → decisiones → caos → foco.
- **v2** `c359952e-…7.37.22p.m..mov`, 16.7 s: foco → globo → Our team → Our investors → cierre y pie.

v2 empieza donde termina v1, con el mismo scroll de 5571 px.

Todas las medidas son en px del video (1212×750). El porcentaje va contra 1212 de ancho y 750 de alto, salvo que se indique otra cosa. `vw` = px ÷ 12.12.
Cuadros y hojas para comparar: `referencia/` (lista al final).

---

## 0. Lo esencial (si solo lees esto)

1. **La página mide ≈ 10 090 px de alto (13.5 pantallas). El scroll máximo es ≈ 9 340 px.**
   Los reposos del video (scroll en px), con el título de la escena en y = 125 cuando la escena tiene título arriba:
   - portada 0;
   - decisiones 1235;
   - caos: grupo 1 en 2023, grupo 2 en 3251 y polvo junto en 4505;
   - foco 5571;
   - globo 6830;
   - equipo 7770;
   - planes 8485;
   - cierre 9340.
2. **Scroll suave como Lenis con `lerp ≈ 0.08`.** El contenido persigue al scroll real con λ ≈ 4.75/s (τ ≈ 0.21 s), así que sigue moviéndose ~1 s después de que la persona deja de bajar. La barra de macOS del video es el *destino* (en Lenis, `targetScroll`). La curva para repetirlo está en `referencia/scroll-v1.csv` y `scroll-v2.csv`.
3. **Las figuras siguen al scroll ya suavizado y además tienen su propio retraso.** Se mueven hasta ~1.5 s después de que la barra se detiene. Son resortes como los de la v7. Los cambios de figura van atados al scroll, no al tiempo: si la persona deja de bajar a la mitad, la figura se queda a la mitad (por ejemplo, el polvo a medio juntarse en 14.4–16.6 s).
4. **Rejilla:**
   - columna izquierda en x = 91 px (7.5 %);
   - columna derecha en x = 805 px (66.4 %);
   - columna de "Our investors" en x = 714 px (58.9 %);
   - el texto centrado tiene su centro en x ≈ 598.

   La página ocupa 1197 px: la barra de scroll tiene estilo propio y toma 15 px. Por eso el centro no cae en 606.
5. **Letra.** Equivalentes en Geist, igualando la altura de la x:
   - título de portada 94 px, peso ≈ 450;
   - títulos de escena 36 px, ≈ 350–400;
   - "Our team" y "Our investors" 65 px, ≈ 400;
   - párrafos del caos 28.5 px, ≈ 350;
   - cierre 38.5 px, ≈ 400;
   - párrafos de columna 15 px, ≈ 200 (muy ligeros);
   - textos chicos en mayúsculas 10–11 px, ≈ 500–600.
6. **Colores:**
   - el violeta del botón es **#8052ff** (el video lo muestra #7554fc porque está grabado en Display P3; convertido a sRGB da #7b52ff);
   - el ámbar es **#ffb829**;
   - el verde azulado de los íconos es ≈ **#009585** (en P3 #199285);
   - el fondo es **#000000** puro.
7. **Entrada del texto:**
   - los títulos suben por renglón desde una ranura (overflow hidden);
   - los párrafos suben **letra por letra**, de izquierda a derecha y renglón por renglón;
   - nada se desvanece al salir: el texto se va con el scroll y pasa debajo de la barra, que al bajar tiene fondo oscuro desenfocado de 57 px de alto.
8. **Barra:** al empezar a bajar sube 11 px, el nombre del logo se desvanece en 0.37 s y aparece el fondo oscuro desenfocado.

---

## 1. Cómo se midió

- ffmpeg estático (en el scratchpad) para sacar los cuadros con su hora exacta (pts). Se midió con Python + PIL, sin redondear a "1 cuadro por segundo".
- **Scroll.**
  - La barra de macOS se ve en x 1203–1206 mientras se baja: gris ≈ 70, 55.6 px de largo, riel de 748 px.
  - Su tope da el scroll real: `scroll = (tope − 2) × 13.49`.
  - Página ≈ 750 × 748 / 55.6 ≈ 10 090 px; máximo ≈ 9 340 px.
  - Donde la barra queda tapada por el globo (v2 1.65–6.9 s), el scroll se reconstruyó invirtiendo el suavizado a partir de un título visible (`n = c + c′/λ`).
- **Suavizado.** Se midió con la cola de tres títulos ya quietos:
  - decisiones: λ = 4.71/s;
  - Our team: λ = 5.11/s;
  - foco: λ = 4.43/s.

  Promedio λ ≈ 4.75/s → Lenis `lerp = λ/60 ≈ 0.079`.
- **Letra.**
  - Alturas medidas renglón por renglón (perfil de tinta): arriba de las ascendentes, línea de la x y línea base.
  - Geist medido en Chromium: mayúscula = 0.719 em, x = 0.531 em, ascendente = 0.719 em, "O" = 0.734 em.
  - El tamaño en Geist sale de igualar la altura de la x.
  - El peso sale de comparar la densidad de tinta del renglón del video con Geist renderizado de 200 a 500 en Chromium (`pw/pesos.mjs`).
- **Colores.** Mediana de las zonas planas. En los textos delgados se toma el núcleo más brillante: el color real es más intenso que el muestreado.
- **Figuras.** Caja (percentil 1–99 %) y centro de los píxeles brillantes por cuadro, sin la barra (y < 64) y sin el texto blanco grande. Están en el CSV de la sección 8.

---

## 2. Scroll

### 2.1 Reposos y posición de cada pieza en la página (px de página a 1212×750)

| Escena | Scroll en reposo | Qué hay en la pantalla en reposo | Pieza → y en la página |
|---|---|---|---|
| 1 portada | 0 | todo el hero | título renglón 1: 181 · etiqueta: 466 · párrafo: 493–572 · botón: 595–624 |
| 2 decisiones | 1235 | título en y = 125 | título: 1359 (renglones 1359 / 1402) · párrafo: 1463–1543 |
| 3 caos, grupo 1 | 2023 | párrafos centrados en y 403–571 | grupo 1: 2426 (renglones 2426 / 2463 · 2531 / 2568) |
| 3 caos, grupo 2 | 3251 (no llegó a asentarse) | párrafos en y ≈ 113–280 | grupo 2: 3349 (3349 / 3386 · 3454 / 3491) |
| 3 caos, grupo 3 | — (pasa sin parar) | — | grupo 3: ≈ 4220 (2 párrafos de 2 renglones) |
| 3→4 polvo junto | 4505 | solo polvo | — |
| 4 foco | 5571 | título en y = 124 | título: 5695 · párrafos: 5800–6025 |
| 5 globo | 6830 | título en y = 125 | título: 6955 · párrafos: 7058–7313 |
| 6 equipo | 7770 | "Our team" en y = 257 | título: 8027 · ficha: 8040–8406 · flechas: 8442–8478 |
| 7 planes | 8485 | "Our investors" en y = 220 | título: 8705 · párrafo: 8779–8829 · íconos: 8733–9083 |
| 8 cierre y pie | 9340 (fondo) | todo | renglón 1: 9618 · botón: 9720–9751 · línea del pie: ≈ 10 028 · texto del pie: 10 062 |

Separación entre títulos o grupos:
- portada → decisiones: 1178;
- decisiones → caos 1: 1067;
- caos 1 → 2: 923;
- caos 2 → 3: ≈ 871;
- caos 3 → foco: ≈ 1475 (aquí se junta el polvo);
- foco → globo: 1260;
- globo → equipo: 1072;
- equipo → planes: 678;
- planes → cierre: 913.

### 2.2 La curva del video (para repetirla)

`referencia/scroll-v1.csv` y `scroll-v2.csv` traen una fila por cuadro: `t, nativo_px, contenido_px, fuente`.
- `nativo_px` es la barra de macOS: lo que pide la persona; en Lenis, el destino.
- `contenido_px` es el nativo pasado por el suavizado de λ = 4.75/s: lo que se ve.
- `fuente` es `medido`, `interpolado` o `sostenido`.

Tramos de scroll (nativo):

| Video | De → a (s) | De → a (px) | Forma |
|---|---|---|---|
| v1 | 1.65 → 3.50 | 0 → 1235 | S suave: arranca en 0.3 s, crucero ~1100 px/s, frena en ~0.8 s |
| v1 | 7.65 → 8.90 | 1235 → 2023 | S |
| v1 | ~10.3 → 11.9 | 2023 → 3251 | S |
| v1 | 12.7 → 14.45 | 3251 → 4505 | S |
| v1 | 16.7 → 18.3 | 4505 → 5571 | S |
| v2 | 0.3 → 2.1 | 5571 → 6830 | S (de 1.65 a 2.1 s, reconstruido) |
| v2 | ~6.1 → 7.5 | 6830 → 7770 | S (6.1–6.95 s, reconstruido) |
| v2 | 8.9 → 10.0 | 7770 → 8485 | S |
| v2 | 13.9 → 15.2 | 8485 → 9340 | S (al final, el rebote de macOS) |

**Ajuste a cada sección.** Tres títulos (decisiones, foco y globo) quedan exactamente en y = 125 en reposo. Eso sugiere que el sitio ajusta el scroll a cada sección, como `scroll-snap` o algo parecido, y que el video no son paradas casuales. No está confirmado. Al repetir la curva da igual: los reposos ya vienen en el CSV.

### 2.3 Suavizado (lerp)
- Al soltar, lo que falta por recorrer se reduce ×0.78 cada 0.05 s.
- λ = 4.75/s, τ = 0.21 s.
- **Lenis `lerp: 0.08`** (equivale a λ = 4.8/s). Hoy el sitio usa 0.1.

---

## 3. Barra de navegación

| Pieza | Arriba (scroll 0) | Al bajar |
|---|---|---|
| Ícono del logo | x 24–42, y 23–48 (≈ 19×26) | sube 11 px: y 12–37 |
| Nombre "Dala" | x 48–84, mayúscula de 14 px (≈ 20 px de letra), color #fff | se desvanece: 1.683 → 2.05 s (0.37 s) |
| Enlaces | "MANIFESTO" x 856–918, "TEAM" 947–975, "BLOG" 1003–1031 · mayúscula de 7–8 px → **≈ 11 px**, peso ≈ 500–600, sin tracking extra · inactivo **#9a9a9a**, activo **#fff** | suben 11 px |
| Píldora | x 1058–1181, y 21–50 (**124×30 px**, radio completo) · relleno **#8052ff** · texto blanco de 11 px en mayúsculas, peso ≈ 600 (x 1071–1167) | y 10–40 |
| Fondo | ninguno | **franja oscura translúcida con desenfoque, 57 px de alto (y 0–56)**, borde de abajo nítido · lo de atrás se ve muy borroso a ~45 % de su luz → equivale a `rgba(0,0,0,.55)` + `backdrop-filter: blur(~20px)` |

**Cuándo.** Empieza con el primer movimiento del scroll (1.667 s). La barra sube 21 → 12 px en 0.2 s y llega a 10 a los 0.6 s: salida rápida, tipo expo/quart out de ~0.6 s.

**Enlace activo.** Solo uno a la vez:
- MANIFESTO se enciende cuando el primer grupo del caos llega arriba: v1 11.15 s, contenido ≈ 2350–2450.
- TEAM se enciende al ir de Our team a investors (v2 9.6 s, contenido ≈ 8050–8180) y queda encendido hasta el pie.
- Antes de MANIFESTO no hay ninguno encendido.

---

## 4. Letra (en Geist, a 1212 de ancho)

| Estilo | Dónde | Medida del video (px) | Geist | Interlineado | Peso Geist | Color |
|---|---|---|---|---|---|---|
| Display | título de portada (3 renglones) | x 50 · ascendente 69 · paso 90.5 | **94 px (7.76vw)** | 90.5 px (0.96) | ≈ 450 | #fff |
| Título de escena | decisiones, foco, globo | x 19 · ascendente 25–26 · paso 43 | **36 px (2.95vw)** | 43 px (1.19) | ≈ 350 | #fff |
| Título grande | "Our team", "Our investors" | x 34.5 · mayúscula 48 | **65 px (5.36vw)** | — | ≈ 400 | #fff |
| Párrafo del caos | 3 grupos centrados | x 15 · ascendente 21 · paso 37 | **28.5 px (2.35vw)** | 37 px (1.30) | ≈ 350 | #fff (el núcleo se ve #e3e1e2) |
| Cierre | 2 renglones centrados | x 20 · mayúscula 28 · paso 45 | **38.5 px (3.18vw)** | 45 px (1.17) | ≈ 400 | #fff |
| Nombre en la ficha | "Joel / Kang" | ascendente 26 · paso 44 | **36 px (2.95vw)** | 44 px (1.22) | ≈ 350 | #fff |
| Subtítulo | "Build with us." | x 11 · ascendente 16 | **21 px (1.73vw)** | — | ≈ 400 | #fff |
| Nombre de ícono | "Seedcamp"… | x 10 · mayúscula 14 | **19 px (1.57vw)** | — | ≈ 300 | #fff (el núcleo se ve #c3c3c2) |
| Párrafo de columna | portada, decisiones, foco, globo | x 8 · paso 23.3 | **15 px (1.24vw)** | 23.3 px (1.55) | **≈ 200** | #fff (el núcleo se ve #707070: es muy delgado) |
| Párrafo chico | equipo, investors | paso 20.5 / 19.3 | **13.5 / 13 px (1.1vw)** | 20.5 / 19.3 px (1.5) | ≈ 250 | #fff (el núcleo se ve #8a8a8a) |
| Etiqueta ámbar | portada | mayúscula 7–8 → **≈ 11 px (0.9vw)** | 11 px | — | ≈ 600 | **#ffb829** |
| Cargo en la ficha | "CO FOUNDER & CTO" | mayúscula 7 → **≈ 10.5 px** | 10.5 px | — | ≈ 600 | **#8052ff** |
| Texto de botones | píldoras | mayúscula 8 → **≈ 11 px** | 11 px | — | ≈ 600 | #fff |
| Subtítulo de ícono | "Co-founder of…" | mayúscula 7 → **≈ 10 px** | 10 px | — | ≈ 400 | #9a9a9a |
| Pie | © y enlaces | mayúscula 6–7 → **≈ 9–10 px** | 9.5 px | — | ≈ 400–500 | #9a9a9a |

Notas:
- **Tracking.** En títulos, Dala usa −0.04em. Geist a −0.04em ya queda ~4–11 % más ancho que la letra de Dala a la misma altura de x: no se puede igualar a la vez el ancho y la altura. Se iguala la altura.
- **Palabra resaltada del globo.** "being better." va en **itálica y ámbar**; "doing more" va en itálica blanca. Geist no trae itálica: el navegador la inclina (sintética).
- La letra de Dala crece con el ancho de la ventana: 113 px a 1440 = 95 px a 1212. Conviene usar `vw` para que la composición sea la misma en cualquier ancho.

---

## 5. Colores

**Interfaz.** El video está en Display P3; entre paréntesis, el valor del video.
- Fondo **#000000** en todo. El pie también es #000; su línea de arriba es casi invisible (#040404).
- Violeta de botón, píldora y flechas: **#8052ff** (#7454fb–#7755fc).
- Ámbar de etiquetas y palabra resaltada: **#ffb829**. En letra fina se ve #b28c4d; en los íconos gruesos, #eabb2e → sRGB #f3b900.
- Verde azulado de los íconos de investors: **≈ #009585** (#199285).
- Violeta de los íconos de investors: **≈ #a078fe** (#9a7af6).
- Texto blanco #fff; gris de la barra y del pie #9a9a9a.
- Fichas apagadas del carrusel: retrato gris oscuro **#111111** de relleno, muy bajo de opacidad.

**Partículas (proporción de píxeles brillantes por figura).**
- Cerebro de la portada:
  - ámbar 49 %, con el borde exterior casi todo ámbar o dorado;
  - blanco o gris 31 % (el centro);
  - amarillo 7 %, violeta 4 %, magenta 3 %, rosa 2 %, coral 2 %, azul 1 % y verde azulado < 1 %.
  - Tonos brillantes en sRGB: ámbar ≈ #ffb02e, violeta ≈ #8b6ab0, rosa ≈ #c37287, azul ≈ #6987a5.
- Cerebro grande (decisiones): igual, con un poco más de violeta (7 %).
- Polvo del caos: ámbar 53 %, blanco 30 %, violeta 9 % y amarillo 7 %.
- Foco: ámbar 62 % (arriba y a la izquierda), blanco y durazno 35 % (el cuerpo), violeta 3 % (cuello) y una base de verde azulado, azul y violeta en la rosca.
- Globo: ámbar 46 %, blanco 20 % (más un parche blanco grande en el lado izquierdo, como brillo), violeta 12 %, amarillo 9 %, magenta 5 %, rosa 4 %, coral 3 %, azul 1 % y verde 1 %.
- Remolino del cierre:
  - ámbar o naranja 28 %, violeta 19 %, coral 12 %, rosa 6 % y blanco 32 %;
  - por zonas: verde azulado arriba, azul a la izquierda, violeta al centro y naranja o durazno abajo.

---

## 6. Escena por escena

### 1. Portada (v1 0–1.65 s, scroll 0)
- **Texto (columna izquierda, x 91–440):**
  - título de 3 renglones: líneas de x en 290/380/…, ascendentes en 181/271/362, base en 250/340/430, de x 95 a 438 (7.8–36.1 %);
  - etiqueta ámbar: y 466–473, x 92–~330;
  - párrafo de 4 renglones: y 493–572 (paso 23.3), x 92–415 (7.6–34.2 %);
  - botón: **x 90–210, y 595–624 (121×30)**, texto x 102–198.
- **Cerebro:**
  - caja x 42.7–97.8 %, y 16.8–83.5 % (518–1185 × 126–626); centro ≈ (70 %, 50 %); ≈ 668×500 px;
  - tronco cerebral abajo: x ≈ 870–930, y 620–750;
  - **vista de lado, con el frente hacia la izquierda**;
  - el borde ámbar es muy marcado, el centro blanco, violeta y verde azulado, y los surcos se notan como vetas blancas.
- **Triangulitos sueltos grandes de contorno:**
  - ámbar en (10–65, 195–240), ámbar (490–520, 30–60), violeta (530–560, 625–655), ámbar (70–95, 450–470) y otros tenues;
  - trazo de ~2 px.
- **Polvo suelto:** triangulitos de 6–10 px en ámbar, violeta, verde azulado y blanco, escasos.

### 2. Decisiones (v1 3.5–7.6 s, scroll 1235)
- **Texto (columna derecha):**
  - título de 2 renglones: ascendentes en y 124 y 167, base en 150 y 193, x 807–1043 (66.6–86.1 %);
  - párrafo de 4 renglones: y 228–308 (paso 23.3), x 805–1104 (66.4–91.1 %); columna de ~300 px.
- **Cerebro grande:**
  - caja x ≈ 1.5–60.6 %, y 8.3–96.9 %, cortado por la izquierda; centro ≈ (30–38 %, 49 %); ≈ 1.4× la portada;
  - girado: se ve de tres cuartos;
  - abajo a la derecha se deshace en una **cola de polvo** (x 45–75 %, y 75–100 %), que crece de 3.6 a 4.4 s.
- Tetraedro blanco grande en (1105–1160, 418–460) y triángulo blanco en (405–460, 600–650).

### 3. Caos (v1 7.6–16.6 s; scroll 2023 → 4505)
- **Polvo:** llena toda la pantalla, con densidad casi pareja. Los triangulitos miden 8–14 px y algunos se ven como tetraedros pequeños.
- **Grupos de párrafos centrados** (centro x ≈ 598; el renglón más ancho va de x 145 a 1062, 12–87.6 %):
  - **grupo 1:** 2 párrafos de 2 renglones; en reposo, renglones en y 403/440 y 508/545; paso 37, separación entre párrafos 67 (= 37 + 30);
  - **grupo 2:** igual; renglones en 122/160 y 227/264 cuando el contenido está en 3227;
  - **grupo 3:** igual; pasa sin parar.
- **Polvo junto (v1 14.4–16.6 s, scroll 4505):** el polvo se recarga arriba a la izquierda y al centro (centro de masa x 39.5 %, y 50 %), como una nube que todavía no es foco.

### 4. Foco (v1 18.3–19.6 s / v2 0–0.3 s, scroll 5571)
- **Texto (columna derecha):**
  - título de 2 renglones: ascendentes en y 124 y 169, base en 150 y 193, x 807–1029;
  - 3 párrafos de 3 renglones: y 229–287, 313–370 y 398–454 (paso 23.5, separación 13.5), x 805–1101 (66.4–90.8 %).
- **Foco:**
  - caja x 5.9–45.5 %, y 10–86 %, más la rosca cortada por abajo; centro ≈ (26 %, 48 %); ≈ 480×570 px;
  - **inclinado ~35°**: el vidrio arriba a la izquierda y la rosca abajo a la derecha;
  - degradado: ámbar en el borde de arriba a la izquierda, blanco y durazno en el cuerpo, lila → violeta en el cuello, y verde azulado, verde y azul en la rosca.

### 5. Globo (v2 3.0–6.1 s, scroll 6830)
- **Texto (columna izquierda):**
  - título de 2 renglones: ascendentes en y 124 y 167, x 91–380 (7.5–31.4 %);
  - párrafo 1 de 4 renglones (con salto de línea antes de "to being better."): y 228–310;
  - párrafo 2: y 335–395; párrafo 3: y 420–483; paso 23.3; x 91–419 (7.5–34.6 %).
  - La palabra ámbar en itálica va en x 106–186, y 296–310.
- **Globo:**
  - **centro ≈ (850, 500) px = (70 %, 67 %), radio ≈ 385 px**, cortado a la derecha y abajo;
  - continentes densos (ámbar, violeta, verde azulado y blanco) y océano oscuro con puntitos ralos;
  - **parche blanco** grande en el lado izquierdo (x 540–700, y 330–510), como reflejo;
  - el borde se ve iluminado en ámbar y violeta.

### 6. Our team → "Tu equipo" (v2 7.5–8.9 s, scroll 7770)
- **Texto (izquierda):**
  - "Our team" de un renglón: mayúscula en y 257–306, x 94–349 (7.7–28.8 %);
  - "Build with us.": y 372–389, x 90–211;
  - párrafo: y 421–492 (paso 20.5), x 91–391. El 4.º renglón aparece cortado en el video por su propia entrada letra por letra.
- **Carrusel:**
  - ficha central (retrato): **x 476–725, y 270–636 (249×366 px · 20.5 % × 48.8 %)**, radio ≈ 24 px;
  - cargo violeta: x 748, y 333–340;
  - nombre de 2 renglones: x 748–825, ascendentes en 361 y 404; íconos sociales en y 451–461.
- **Fichas apagadas:**
  - van atrás, a la misma altura (empiezan en y ≈ 300), ≈ 210 px de ancho (0.84×), grises y muy bajas de opacidad;
  - centros cada ≈ 307 px: x ≈ −10, 295, [600], 907 y 1215 (pasan por debajo de la orilla).
- **Flechas:** 2 círculos violetas de **36 px** de diámetro con flecha blanca, centros en (577, 690) y (623, 690): 47.6 % y 51.4 %, y = 92 %; 10 px entre ellos.
- **Figura:** polvo recargado arriba (y 8–35 %) y ralo en lo demás.

### 7. Our investors → "Planes" (v2 10.0–13.9 s, scroll 8485)
- **Texto (derecha):**
  - "Our investors": mayúscula en y 220–268, x 717–1084 (59.2–89.4 %);
  - párrafo de 3 renglones: y 294–344 (paso 19.3), x 714–1002.
- **Íconos.** Son tetraedros de alambre de trazo grueso (~3 px), con brillo leve, de ≈ 50–56 px, y giran. En reposo:

| # | Ícono (caja) | Centro (%) | Color | Nombre | Subtítulo |
|---|---|---|---|---|---|
| 1 | 105–160, 248–305 | 10.9 %, 36.8 % | ámbar | x 171–266, y 268–287 | — |
| 2 | 292–340, 320–372 | 26.1 %, 46.1 % | verde azulado | x 350–497, y 332–350 | x 350–476, y 356–364 |
| 3 | 105–158, 432–482 | 10.9 %, 60.9 % | ámbar | x 172–288, y 452–471 | — |
| 4 | 512–568, 484–538 | 44.6 %, 68.1 % | violeta | x 580–757, y 494–512 | x 580–713, y 518–526 |
| 5 | 210–258, 545–598 | 19.3 %, 76.2 % | violeta | x 274–395, y 563–582 | — |

- Las flechas del carrusel siguen arriba (y 55–90) en reposo.
- **Fondo:** polvo ralo, más arriba a la izquierda. Tetraedro ámbar grande cortado en la orilla izquierda (0–68, 260–325) y uno lila grande en (968–1032, 588–640).

### 8. Cierre y pie (v2 15.2–16.7 s, scroll 9340)
- **Texto centrado:**
  - renglón 1: y 278–313, x 336–859;
  - renglón 2: y 323–351, x 452–740; centro x ≈ 598;
  - botón: **x 539–661, y 380–411 (122×31)**.
- **Remolino:**
  - abanico o listón torcido de 4–5 aspas curvas, detrás del texto;
  - caja x ≈ 28–62 %, y ≈ 9–82 % (340–750 × 70–610); centro ≈ (45 %, 45 %);
  - verde azulado arriba, azul a la izquierda, violeta al centro y naranja o durazno abajo;
  - se forma de 15.0 a 16.1 s.
- **Pie (delgado):**
  - línea casi invisible en y ≈ 688;
  - "© 2021 …" en x 20–251, y 722–727;
  - enlaces en mayúsculas en x 452–747, centrados;
  - 3 íconos a la derecha en x 1062–1135;
  - todo en #9a9a9a de 9–10 px; fondo #000.

---

## 7. Movimiento del texto (las curvas)

- **Títulos (renglón por renglón):**
  - cada renglón vive en una ranura (overflow hidden) y sube de abajo hacia arriba, sin fundido;
  - el primero empieza cuando su ranura cruza ~**88 % del alto de la pantalla**: decisiones a 2.92 s, foco a 17.72 s y globo a 1.60 s;
  - la parte visible pasa de 4 px a los 25 px completos en **~0.37 s**, y termina de asentarse en ~0.7–0.8 s (salida tipo power3/expo out);
  - el segundo renglón empieza **~0.1 s** después.
  - Hoja: `ref-11-entrada-titulo.jpg`.
- **Párrafos (letra por letra):**
  - cada letra sube desde la ranura de su renglón;
  - el frente de revelado cruza un renglón de ~900 px en ~0.15 s (≈ 2–3 ms por letra);
  - cada letra tarda ~0.3–0.5 s en subir (salida rápida);
  - cada renglón empieza ~0.07–0.14 s después del anterior;
  - el párrafo empieza cuando llega a ~78–85 % del alto;
  - en las columnas (decisiones, foco, globo), el párrafo empieza ~0.4–0.6 s después del título.
  - Hojas: `ref-10-entrada-parrafo-caos.jpg` y `ref-11`.
- **Caos:** cada grupo entra así al subir desde abajo y **sale sin desvanecerse**, empujado por el scroll, hasta quedar debajo de la barra (y < 57).
  - Grupo 1: entra a 8.55–8.8 s y sale a 10.4–11.35 s.
  - Grupo 2: entra a 11.47–11.7 s y sale a 12.8–13.3 s.
  - Grupo 3: entra a 13.39–13.55 s y sale a 13.7–14.35 s.
- **Our team:** "Our team" sube por renglón (a 7.3 s se ve cortado por su ranura). La ficha, el nombre y las fichas apagadas entran con el scroll; el párrafo entra letra por letra.
- **Investors:**
  - los íconos llegan volando y girando hacia su lugar: a 11.0 s todavía se mueven (`cuadros/07-planes-entrando`);
  - los nombres y subtítulos aparecen después, letra por letra, de 11.0 a 12.5 s, ya con el contenido quieto.
- **Cierre:** las dos líneas suben por renglón (15.0–15.6 s) y después aparece el botón.
- **Enlace activo de la barra:** cambio de color de ~0.2 s.

---

## 8. Cambios de figura

CSV completo (10 cuadros/s): `referencia/figura-v1.csv` y `figura-v2.csv`, con caja 1–99 % y centro de masa en % de la pantalla.

| Cambio | Tiempo (video) | Scroll del contenido | Qué pasa |
|---|---|---|---|
| portada → decisiones | v1 1.9 → 4.4 s | 50 → 1235 | el cerebro **gira de lado a frente** (2.3–2.7 s: se ven los dos hemisferios), se va a la izquierda y crece (centro x 64 → 31 %, 2.0–3.2 s), y luego se acomoda en tres cuartos (3.2–4.4 s, centro 31 → 38 %); la cola de polvo crece abajo a la derecha |
| decisiones → caos | v1 7.9 → 9.2 s | 1250 → 2010 | el cerebro se hunde y se deshace en polvo (de abajo hacia arriba) hasta llenar la pantalla |
| caos (quieto) | v1 9.2 → 14.2 s | 2010 → 4300 | polvo por toda la pantalla mientras pasan los 3 grupos |
| polvo → polvo junto | v1 14.2 → 16.0 s | 4300 → 4505 | el polvo se junta arriba a la izquierda (centro x 51 → 39 %) |
| polvo junto → foco | v1 17.0 → 18.2 s (asienta hasta 19.4) | 4520 → 5400 (→ 5571) | se forma el foco a la izquierda |
| foco → globo | v2 0.8 → 1.4 s (asienta hasta 3.0) | ≈ 5650 → 6100 (→ 6830) | el foco se deshace y el globo se forma a la derecha |
| globo → equipo | v2 6.9 → 8.0 s | ≈ 7100 → 7750 | el globo se vacía en un **anillo** (7.0–7.3 s) y queda polvo arriba |
| equipo → planes | v2 9.2 → 10.0 s | 7800 → 8390 | el polvo se reparte ralo; los íconos (en el DOM) entran después |
| planes → cierre | v2 14.4 → 16.1 s | 8500 → 9340 | el polvo se junta al centro (15.0 s) y forma el remolino (15.4–16.1 s) |

**Reglas que se ven.**
1. Toda figura cambia **mientras el contenido se mueve** y termina ~0.5–1 s después de que se detiene el contenido. Son resortes: no hay rebote.
2. No hay cambios "por tiempo" cuando el scroll está quieto, salvo el respirar lento de la figura.
3. Los triangulitos sueltos grandes se mueven poco: flotan despacio, giran y bajan con un paralaje leve.

---

## 9. Para Atendel (lo que cambia por el contenido)

- **Título de portada.** "Que ningún cliente se quede sin respuesta." es mucho más largo que "Unlock collective wisdom.". A 94 px no cabe en la caja de Dala (x 95–438, 3 renglones de 90.5).
  - Para conservar la **misma caja**, se puede usar **4 renglones a ~72 px** ("Que ningún / cliente se / quede sin / respuesta."). Medirlo en el navegador.
  - O 3 renglones más anchos, que chocan con el cerebro.
  - Elección de cada trabajador; anotarla en su NOTA.
- **Caos.** Dala tiene 3 grupos de 2 párrafos; Atendel tiene 3 párrafos (2, 2 y 1 renglones). Conviene un párrafo por grupo, con las mismas posiciones de grupo. Sin el "30 %".
- **Planes.** 4 íconos en lugar de 5: usar las posiciones 1–4 de la tabla del §6.7, o 1, 2, 3 y 5.
- **Barra.**
  - 4 enlaces en lugar de 3: mismo tamaño y separación (~28 px entre enlaces), alineados a la derecha antes de la píldora.
  - Enlace activo con los mismos puntos del video: el 1.º se enciende con el caos (contenido ≈ 2400), el 2.º al pasar del equipo a los planes (≈ 8100).
- **Equipo.** El retrato se cambia por el personaje grande dentro de la misma ficha de 249×366 con radio de 24 px. Las fichas apagadas van atrás, con la misma separación de 307 px.

---

## 10. Pendiente (se completa en la siguiente versión de este archivo)
- Curva exacta (ajuste por mínimos cuadrados) de la subida de títulos y letras.
- Posición y giro de los tetraedros grandes a lo largo del video.
- Opacidad exacta de las fichas apagadas y del fondo de la barra.
- Confirmar si hay ajuste del scroll a cada sección.

---

## Archivos de referencia (`diseno/capturas/dala/referencia/`)

| Archivo | Qué es |
|---|---|
| `ref-01-portada.jpg` | portada quieta (v1 0–1.6 s) |
| `ref-02-portada-a-decisiones.jpg` | 10 cuadros/s, v1 1.6–4.8 s |
| `ref-03-decisiones-a-caos.jpg` | 10 cuadros/s, v1 7.6–9.8 s |
| `ref-04-caos-textos.jpg` | 10 cuadros/s, v1 9.8–14.5 s (entran y salen los grupos) |
| `ref-05-caos-a-foco.jpg` | 10 cuadros/s, v1 14.4–19.6 s |
| `ref-06-foco-a-globo.jpg` | 10 cuadros/s, v2 0–3.4 s |
| `ref-07-globo-a-equipo.jpg` | 10 cuadros/s, v2 6.0–8.8 s |
| `ref-08-equipo-a-planes.jpg` | 10 cuadros/s, v2 8.8–12.8 s |
| `ref-09-planes-a-cierre.jpg` | 10 cuadros/s, v2 13.6–16.7 s |
| `ref-10-entrada-parrafo-caos.jpg` | todos los cuadros de la entrada de un párrafo (letra por letra) |
| `ref-11-entrada-titulo.jpg` | 30 cuadros/s de la entrada de título y párrafo |
| `cuadros/*.jpg` | un cuadro a tamaño real por escena y transición (14) |
| `scroll-v1.csv`, `scroll-v2.csv` | curva de scroll por cuadro (nativo y contenido) |
| `figura-v1.csv`, `figura-v2.csv` | caja y centro de la figura cada 0.1 s |

Cada hoja lleva el video y la hora en cada cuadro.
