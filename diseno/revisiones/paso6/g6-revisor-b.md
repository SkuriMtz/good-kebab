# Grupo 6 · Estructura — Revisor B (Paso 6)

Revisé en modo ligero: miré con calma las capturas de cada trabajador (todas las
de 390 en oscuro y en claro, todas las de 1440 en claro y algunas de 1440 en
oscuro) y leí su código (`git diff 38b8bb8` de `Nav.tsx`, `Footer.tsx`,
`BotonTema.tsx`, `Sitio.tsx`, `Logo.tsx`, `estructura.css`, `tema-claro.css` y
`src/app/entrar/*`). No levanté servidores ni hice build. `npm run lint` pasa en
los tres worktrees. No leí el archivo del revisor A.

Puse atención especial en tres cosas: el celular (skill `mobile-native`), la
accesibilidad (foco, Esc, `aria-*`) y el modo claro de todo el sitio.

## Resultado

| Propuesta | 1. Fidelidad GitHub + Apple | 2. No genérico | 3. Evita errores de CLAUDE.md | 4. Claridad para el dueño | 5. Celular | 6. Acabado | **Promedio** |
|---|---|---|---|---|---|---|---|
| **G6-T1** (fiel a GitHub, con desplegables) | 8.5 | 8 | 8.5 | 8 | 8.5 | 8.5 | **8.33** |
| G6-T2 (mínima, calma de Apple) | 7 | 7.5 | 7 | 9 | 8.5 | 8 | **7.83** |
| G6-T3 (idioma del dashboard: buscador "/") | 9 | 8 | 7.5 | 8 | 8 | 7.5 | **8.00** |

**Ganadora: G6-T1.** Es la que mejor reproduce el sitio público de GitHub (barra
con paneles, pie con franja inferior y una página de entrar como la de GitHub),
la que tiene la accesibilidad más completa y la que menos rompe las reglas de
CLAUDE.md. Le falta el buscador redondo con "/", que el encargo pedía como parte
del idioma de la barra: hay que tomarlo de T3.

---

## Revisión común (las tres)

| Revisión | T1 | T2 | T3 |
|---|---|---|---|
| Hamburguesa con `aria-label` y sin la palabra "Menú" | ✔ "Abrir/Cerrar la navegación" | ✔ "Abrir/Cerrar las páginas del sitio" | ✘ leve: `aria-label="Abrir el menú"` y el cajón se llama "Menú de Atendel". No se ve, pero el lector de pantalla dice "menú" y el encargo decía "nunca la palabra Menú" |
| "Pruébalo" sin azul de botón principal | ✔ sutil | ✔ sutil | ✔ sutil |
| Logo sin cambios | ✔ usa `Marca` tal cual | ⚠ cambió `Logo.tsx` por dentro: los colores ahora salen de las variables `--agente-*`. Los valores son los mismos y se ve igual, pero el encargo pedía no tocar el logo | ✔ usa `Marca` tal cual |
| Modo claro cálido y completo | ⚠ parcial: lienzo blanco de Primer y franja #f6f8fa en pie y tarjeta; solo ajustó la barra y los fragmentos | ✔ el más completo: todo el lienzo en gris cálido #f7f6f3 y las superficies en blanco. Pero lo logra cambiando `--c-fondo` en todo el sitio, lo que también afecta las secciones de G1 a G5 | ⚠ parcial: lienzo blanco, pie y tarjeta en #f6f8fa |
| Escena de fondo conservada, discreta y fija | ✔ opacidad 0.5/0.4, con máscara que la apaga en el centro | ⚠ opacidad 0.5/0.45 sin máscara: hay fragmentos detrás del texto (en `/entrar` oscuro a 390, un triángulo grande cruza el subtítulo) | ✔ opacidad 0.5/0.4/0.3, con dos máscaras: nada detrás de la barra y casi nada en el centro |
| Texto siempre legible | ⚠ en `/precios` a 1440, la figura de partículas queda detrás de la columna "Max" en oscuro y en claro. Con la máscara de T3 pasaría lo mismo, porque las orillas quedan al 100% | ⚠ ver arriba | ⚠ igual que T1 en las orillas (se alcanza a ver la esfera en `/precios`) |
| Lógica de inicio de sesión intacta | ✔ (`signInWithOtp` y `signInWithOAuth` iguales; solo cambió la presentación) | ✔ | ✔ (solo agrega la hora de envío) |
| Archivos de otros grupos | ✔ ninguno | ✔ ninguno (pero el cambio de `--c-fondo` en claro afecta lo de otros; sí lo avisó) | ✔ ninguno (escribe la clave de tema de la base desde `BotonTema`; lo avisó como pedido a la base) |
| Compatible con `NavApp` | ✔ todas las props opcionales | ✔ (`items` obligatorio; `NavApp` ya lo pasa) | ✔ (`items` obligatorio; sin `buscar` en la app) |
| Nada de la marca GitHub | ✔ solo en comentarios | ✔ | ✔ |
| Mona Sans | ✔ tokens de la base | ✔ | ✔ y además corrige la letra del sistema en su buscador |
| Hover solo con puntero fino | ✔ todo dentro de `(hover: hover) and (pointer: fine)` | ✔ | ✔ |
| 100dvh / 100svh, zona segura del notch | ✔ `100svh` en la envoltura, `env(safe-area-inset-*)` en la barra, la hoja y la franja del pie | ✔ `100dvh` en el panel, `100svh` en `/entrar` y zona segura en barra, panel y pie | ✔ `100svh`, `100dvh` en la búsqueda y zona segura en barra, cajón, paleta y pie |
| Campos sin zoom (16px) | ✔ `CampoCorreo` de la base (16px, `inputMode`, `enterKeyHint`) | ✔ | ✔ |
| Menú del celular a pantalla completa | ✔ hoja bajo la barra; Esc, foco atrapado, bloquea el scroll | ✔ panel bajo la barra; Esc, foco atrapado, foco al primer enlace | ✔ el `Cajon` del dashboard a 100vw; Esc, foco atrapado, se cierra deslizando |

---

## G6-T1 · fiel a la barra y al pie de GitHub — 8.33

**1. Fidelidad (8.5).** Es lo más parecido al sitio de GitHub: "Agentes ▾" y "Para
quién es ▾" abren paneles de dos columnas, con lo principal a la izquierda y
"Explora" a la derecha tras una línea fina, como los de GitHub. A la derecha:
botón de ícono con borde, división, "Entrar" fantasma y "Pruébalo" con borde.
El pie tiene marca, cuatro columnas y una franja #151a22 / #f6f8fa con el
selector de tema. `/entrar` es una réplica limpia del inicio de sesión de
GitHub: marca arriba, título, aviso de error encima de la tarjeta, tarjeta
angosta y la caja "¿Primera vez?". El acabado de Apple está en el vidrio al
bajar y en los paneles suaves. Le baja medio punto que no tiene el buscador
redondo con "/". El encargo lo nombraba como parte del idioma de la barra, y la
barra pública de GitHub también lo tiene.

**2. No genérico (8).** El contenido es de Atendel: el panel "Tu equipo" con los
cuatro personajes (sin círculo de color detrás), su área y lo que abarcan, y los
negocios con frases sacadas de `SEGMENTOS` ("La recepción, mientras tú
atiendes"). El menú desplegable grande es un patrón conocido, aunque aquí está
bien hecho. En `/entrar` quitó los cuatro personajes y dejó solo la marca, así
que pierde algo de personalidad.

**3. Errores de CLAUDE.md (8.5).** No usa la palabra "Menú", no hay círculos de
color, el logo está intacto y no hay degradados ni brillos. Defectos menores:
la franja del pie repite "Tus datos" y "Contacto", que ya están en las columnas,
y la figura de partículas queda detrás de la columna derecha en `/precios` a
1440 (lección 11).

**4. Claridad (8).** Los paneles explican qué hace cada agente en una línea, y en
el celular los pliegues ("Agentes" abierto de entrada) se entienden solos. El
costo: en computadora, "Agentes" abre un panel en vez de llevar a la página.
Hay un paso más ("Los cuatro agentes") y al dueño de una clínica le puede
confundir un poco.

**5. Celular (8.5).** Logo, "Pruébalo" y hamburguesa con borde. La hoja ocupa la
pantalla debajo de la barra. Áreas de toque de 44px (botones de ícono con
`::after`, filas de 56px, enlaces del pie con puntero grueso),
`overscroll-behavior: contain`, zona segura, `touch-action` y `user-select`
solo en los controles. "Entrar" se ve en la primera pantalla del menú. En la
captura `entrar-pie-390-*` queda una banda vacía debajo de la franja del pie:
hay que confirmar que sea un error de la captura y no del diseño.

**6. Acabado (8.5).** Es la accesibilidad más completa de las tres:

- "Saltar al contenido".
- Paneles con `aria-expanded` y `aria-controls`; se mueven con ↓ ↑ Inicio Fin.
- Esc cierra y devuelve el foco; también cierran un clic afuera o perder el foco.
- Gracia de 150ms al quitar el cursor del panel.
- El foco pasa al título cuando aparece "Revisa tu correo".
- El ícono de tema lo decide el CSS, así que no parpadea.
- Respeta `prefers-reduced-transparency`.

Entregó todas las capturas, incluidos el error, el teclado y la página completa.

**Defectos a anotar:** no tiene buscador; la franja del pie repite enlaces; el
modo claro solo es "Primer blanco", con poco trabajo de gris cálido fuera de la
portada; en `precios-barra-al-bajar-1440-claro` casi no se ve el vidrio ni la
línea de la barra (revisar el contraste del vidrio al 72% sobre blanco); el
botón "Continuar con Google" es sutil con texto azul y compite un poco con el
único azul de la pantalla.

## G6-T2 · mínima, con la calma de Apple — 7.83

**1. Fidelidad (7).** La barra respeta lo básico de GitHub (logo con su nombre,
botón de ícono con borde, Entrar y Pruébalo), pero es la que más se aleja de
"casi idéntico a GitHub" (lección 13):

- No tiene desplegables ni buscador.
- El menú del celular, con enlaces de 30px, es de Apple, no de GitHub.
- En `/entrar` usa una tarjeta de vidrio de radio grande (la guía vieja), en vez
  del inicio de sesión de GitHub.
- El pie no tiene el bloque de marca.

**2. No genérico (7.5).** Hay detalles propios: "ESTÁS AQUÍ" en Mono en el menú,
la fila de los cuatro personajes encimados en `/entrar` y los dos pasos de
"Revisa tu correo". Aun así, una barra con cuatro enlaces y un pie mínimo se
parecen a muchos sitios. Los personajes van dentro de círculos de color (en el
menú y en `/entrar`).

**3. Errores de CLAUDE.md (7).** Pierde puntos por:

- Personajes en círculos de color (regla anti-genérica).
- Fragmentos sin máscara, que pasan detrás del texto (lecciones 7 y 11).
- Cambió `Logo.tsx` por dentro, aunque se vea igual.
- Para el modo claro, cambia `--c-fondo` en todo el sitio. Lo avisó, pero
  cambia cómo se ven las secciones de otros grupos y obliga al integrador a
  revisarlas todas.

**4. Claridad (9).** Es la más clara para el dueño de una clínica: cuatro enlaces
sin sorpresas, un menú del celular con letras grandes y "Estás aquí", y una
página de entrar que dice qué va a pasar ("con ese mismo link se crea tu cuenta
en el plan Free") y luego da dos pasos numerados.

**5. Celular (8.5).** Panel de `100dvh` con `data-lenis-prevent` y
`overscroll-behavior: contain`, zona segura arriba y abajo, entrada en cascada
de 40ms (y salida más rápida), fila "Modo claro" en el menú y 44px de toque. Los
agentes solo muestran su área ("Atención"), con menos información que en T1.

**6. Acabado (8).** Su modo claro es el más fino: gris cálido con superficies
blancas, sin franjas, y el selector del pie como píldora blanca. Cumple de
verdad la lección 9. Debilidades:

- Cuatro `<nav>` en el pie (ruido para los lectores de pantalla).
- No mueve el foco al título al enviar.
- El botón de Google no se pudo verificar.
- El logo de la barra se ve chico a 1440.

## G6-T3 · la barra pública habla el idioma del dashboard — 8.00

**1. Fidelidad (9).** Es la más fiel a la referencia del dashboard y la que más se
siente "de la misma casa" que G7:

- En celular: hamburguesa a la izquierda, marca con el nombre de la sección
  ("Atendel / Precios") y lupa.
- En computadora: buscador redondo "Escribe / para buscar" y botones de ícono
  con el borde y el radio del dashboard.
- La paleta de búsqueda es como la de GitHub (cubre la barra, con atajos ↑ ↓ ↵
  Esc abajo).
- Pie de cuatro columnas y `/entrar` con tarjeta sólida y "¿Primera vez?".

G7 también va a integrar una paleta con "/", así que encajan.

**2. No genérico (8).** La búsqueda solo encuentra lo que existe y habla de la
recepción ("cita" encuentra a Lola, Víctor, Iris, Clínicas y la pregunta de
planes). "Revisa tu correo" muestra la hora real de envío en Mono, y el botón de
Google es neutro. Le bajan puntos los personajes en círculos de color (menú,
búsqueda, `/entrar`) y la miga que repite la página donde ya estás (aparece
"Precios" dos veces en la barra).

**3. Errores de CLAUDE.md (7.5).**

- "menú" en el `aria-label` y en el nombre del cajón.
- Círculos de color.
- El menú del celular repite el destino: "Empezar gratis" y "Entrar" llevan los
  dos a `/entrar` (T2 quitó justo esa repetición).
- La lección 13 pide "nada muy exagerado": la paleta es sobria, pero suma
  complejidad a un sitio de seis páginas.
- La rayita azul bajo la página actual está bien justificada, aunque gasta un
  poco del acento.

**4. Claridad (8).** La miga ayuda a ubicarse y la búsqueda por tarea ("citas")
le sirve al dueño. Pero en el celular, dentro de las páginas, el nombre
"Atendel" se reemplaza por el de la sección (queda solo el logo). La opción
"Sistema" del tema también es un concepto de más para una clínica.

**5. Celular (8).** El cajón del dashboard ocupa toda la pantalla, se cierra
deslizando y tiene búsqueda, filas con ícono y una rayita en la página actual.
La paleta usa `100dvh` y oculta los atajos de teclado en pantallas táctiles.
Contras:

- "Empezar gratis" y "Entrar" quedan debajo del pliegue del menú.
- La descripción de Iris se corta ("docu…").
- La barra lleva cuatro piezas (hamburguesa, marca y sección, lupa, Pruébalo) y
  se siente un poco cargada.

**6. Acabado (7.5).** Lo visual está muy pulido (resalta lo que coincide en la
búsqueda, combobox con `aria-activedescendant`, conteo en `aria-live`). Bajan la
nota:

- Las capturas de página completa salieron corruptas (`inicio-completa-1440-claro`
  y `inicio-completa-390-oscuro` repiten la portada), así que la página entera no
  quedó comprobada.
- No hay captura del error de `/entrar`, y el error sale abajo de todo, después
  de Google, donde se nota menos.
- El ícono de tema y la pastilla del selector dependen del estado de React:
  parpadean al cargar en modo claro.
- La opción "Sistema" guarda una segunda clave y escribe la clave de la base
  desde un archivo del Grupo 6 (lógica de tema duplicada fuera de `tema.ts`).
- La barra va de orilla a orilla (logo en x=32) mientras el contenido y el pie
  están en la rejilla de 1200px (x=120).

---

## Ganadora: G6-T1

Es la que mejor junta "se ve como GitHub" con "está bien hecha": barra, pie y
entrada se reconocen como los de GitHub, la accesibilidad es la más completa y
casi no rompe reglas de CLAUDE.md. Lo que le falta (el buscador) se puede tomar
de T3 sin rehacer la barra.

## Mejores ideas de las otras (para llevar a la ganadora)

**De G6-T3:**
1. **Buscador redondo "Escribe / para buscar"** a la derecha de la barra
   (computadora) y **lupa** en el celular, con su paleta: índice solo con lo
   que existe (páginas, agentes por tarea, negocios, planes, preguntas),
   búsqueda sin acentos, ↑ ↓ ↵ Esc, combobox accesible y atajos ocultos en
   pantallas táctiles. Mejor si comparte el componente con la paleta de G7, en
   vez de tener dos.
2. **Máscara que borra los fragmentos detrás de la barra**, además de la del centro.
3. **"Continuar con Google" neutro** (sin texto azul), para que el único azul
   de `/entrar` sea "Enviarme el link".
4. **Hora de envío en Mona Sans Mono** en "Revisa tu correo" y la caja
   "¿Te equivocaste de correo? Usar otro correo".
5. **`Mona Sans` en el campo del buscador** (la base usaba la letra del sistema).

**De G6-T2:**
1. **Modo claro de todo el sitio con lienzo gris cálido (#f7f6f3) y superficies
   blancas**: es lo que pide la lección 9. Conviene llevarlo a la base
   (`globals.css`) en la integración y revisar sección por sección, no dejarlo
   como un cambio global escondido en `tema-claro.css`.
2. **"Estás aquí"** en Mono junto a la página actual en el menú del celular.
3. **Dos pasos numerados** en "Revisa tu correo" ("Abre el correo… / Toca el
   link y entras directo al chat con tu equipo").
4. **Fila "Modo claro / Modo oscuro"** con nombre en el menú del celular (se
   entiende mejor que un control sin texto).
5. Un solo "Entrar" en el menú del celular (sin "Empezar gratis" que lleva al
   mismo lugar).

## Problemas que la ganadora debe corregir

1. **Agregar el buscador redondo con "/"** (idea 1 de T3). Sin él, la barra no
   cumple el encargo ni queda "de la misma casa" que el dashboard.
2. **Legibilidad del fondo (lecciones 7 y 11):** en `/precios` y `/agentes` a
   1440, la figura de partículas queda detrás de la columna derecha, en oscuro y
   en claro. Hay que bajar la opacidad o la máscara detrás de la rejilla de
   1200px (no solo en el centro) y quitar los fragmentos de detrás de la barra.
3. **Modo claro de todo el sitio:** hoy es blanco Primer con #f6f8fa solo en el
   pie y la tarjeta. Aplicar el gris cálido de T2 (o decidirlo con el dueño) y
   revisar en claro `/`, `/agentes`, `/precios`, `/para-quien-es`, `/preguntas`
   y `/entrar`.
4. **Vidrio de la barra al bajar en claro:** en la captura de 1440 casi no se ve
   el fondo ni la línea. Revisar la opacidad del vidrio y el contraste de la
   línea `#d1d9e0`.
5. **Franja del pie:** quitar "Tus datos" y "Contacto", que ya están en las
   columnas (o poner otra cosa que no se repita).
6. **Banda vacía bajo el pie a 390** (`entrar-pie-390-*`): confirmar si es de la
   captura; si no, hacer que la franja llegue al final.
7. **`/entrar` sin personajes:** volver a poner a los cuatro, como fila encimada
   (idea de T2 y T3) pero **sin círculo de color detrás**, para que la entrada
   tenga la personalidad de Atendel sin romper la regla anti-genérica.
8. **"Pruébalo" en claro:** el texto azul con borde azulado se lee como un
   segundo botón azul junto al principal. Probar texto neutro con borde (sigue
   siendo sutil). Lo mismo para "Continuar con Google".
9. **Pedidos a la base (integrador):** `theme-color` según el modo (hoy hay un
   solo `#000000` en `layout.tsx`); borrar `.barra*`, `.menu-movil*`, `.pie*` y
   `.logo-palabra` de `globals.css`; token de opacidad de la escena por modo.
10. **Probar en un teléfono real** (desenfoque de la barra, notch, pliegues),
    como la misma entrega reconoce.
