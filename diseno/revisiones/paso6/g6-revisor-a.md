# Revisión G6 · Estructura (barra, pie, modo claro, celular, /entrar) · Revisor A

Modo ligero: califiqué con las capturas de `diseno/capturas/paso5/g6-tN/` (todas las
de 1440 en oscuro y claro, y las de 390 en oscuro), la entrega de cada trabajador y su
código (`git diff 38b8bb8`). No levanté servidores ni hice capturas propias.
No leí el archivo del revisor B.

## Resultado

| Propuesta | 1 Fidelidad GitHub+Apple | 2 No genérico | 3 Errores CLAUDE.md | 4 Claridad dueño | 5 Celular | 6 Acabado | **Promedio** |
|---|---|---|---|---|---|---|---|
| **G6-T1** (fiel a la barra y al pie de GitHub, con desplegables) | 9 | 8 | 8 | 9 | 9 | 8.5 | **8.58** |
| G6-T2 (mínima, calma de Apple, modo claro cálido) | 7 | 7 | 7.5 | 9 | 8.5 | 8 | **7.83** |
| G6-T3 (la barra pública habla el idioma del dashboard) | 9 | 8.5 | 7.5 | 7 | 8.5 | 7.5 | **8.00** |

**Ganadora: G6-T1.** Es la que más se parece al sitio de GitHub sin copiar su marca, la que
mejor le explica a un dueño de clínica qué hay en cada lugar (los desplegables muestran a
los cuatro agentes y los negocios), y la que tiene el celular más completo. T3 queda cerca y
aporta las mejores ideas para integrar (buscador, máscara doble del fondo, botón de Google neutro).

---

## Revisión de reglas (para las tres)

| Regla | T1 | T2 | T3 |
|---|---|---|---|
| Hamburguesa con `aria-label`, nunca la palabra "Menú" | Sí: "Abrir la navegación" | Sí: "Abrir las páginas del sitio" | **A medias:** se ve solo el ícono, pero `aria-label="Abrir el menú"` y el cajón se llama "Menú de Atendel" (el encargo dice "nunca la palabra Menú") |
| "Pruébalo" no azul (variante sutil) | Sí | Sí | Sí |
| Logo de Atendel sin cambios | Sí (solo se acomoda) | Sí: `Logo.tsx` cambió, pero solo usa `var(--agente-*)`, que valen lo mismo (#ff8a6b, #7fb2ff, #5fd09f, #f6c64a) | Sí (`Logo.tsx` sin tocar) |
| Modo claro con grises cálidos | Parcial: portada #f7f6f3, páginas internas #fff, franja del pie #f6f8fa | **El mejor:** todo el lienzo en #f7f6f3 y las superficies en blanco | Parcial: páginas internas #fff, pie y tarjeta de /entrar en #f6f8fa |
| Fondo de fragmentos conservado, fijo y discreto | Sí (opacidad 0.5/0.4 y máscara al centro), pero el "globo" de polvo se cruza con el texto de Precios | Sí (0.5/0.45), sin máscara; en claro se ve como confeti denso | **El mejor:** dos máscaras (nada detrás de la barra, casi nada al centro) |
| Lógica de inicio de sesión intacta | Idéntica (`enviar`, `entrarConGoogle`, `traducirError`) | Idéntica | Idéntica; solo agrega guardar la hora para mostrarla |
| No tocar archivos de otros grupos | Sí (ni `globals.css` ni `tema.ts`) | Sí, pero en `tema-claro.css` reasigna el token global `--c-fondo` (afecta a todo el sitio en claro, también al producto y al dashboard) | Sí, pero agrega una preferencia "Sistema" con su propia clave en `localStorage` y `SincronizarTema`: lógica de tema por fuera de `tema.ts` |
| Compatibilidad con `NavApp` | Sí (props opcionales; sin props es la barra pública) | Sí (mismas props) | Sí (mismas props; sin buscador en la app) |
| Nada de la marca GitHub | Sí (solo en comentarios) | Sí | Sí |
| Mona Sans en todo | Sí (y Mono en etiquetas) | Sí | Sí (también en el campo de búsqueda) |

---

## G6-T1 · 8.58 (ganadora)

**1. Fidelidad a GitHub, afinada con Apple: 9.** Es la barra del sitio de GitHub: "Agentes ▾" y
"Para quién es ▾" abren un panel de dos columnas (lo principal con un rótulo en Mono y
"Explora" a la derecha, separado por una línea fina), enlaces blancos de 16px, botón de ícono
con borde para el tema, una división fina, "Entrar" fantasma y "Pruébalo" con borde. El pie
tiene la franja inferior en #151a22 / #f6f8fa como el de GitHub, con el selector de tema. /entrar
es el inicio de sesión de GitHub (marca, título, aviso de error arriba de la tarjeta, caja de
"¿Primera vez?" abajo). Lo de Apple está en los materiales: vidrio solo al bajar, sólido con
`prefers-reduced-transparency`. Le falta el buscador que sí tiene la barra pública de GitHub.

**2. Que no parezca hecho por IA: 8.** Los desplegables están llenos de Atendel: "Tu equipo" con los
cuatro personajes sin círculo de color detrás, frases reales de `SEGMENTOS` ("Pacientes, citas y
proveedores") y "Explora" con destinos que existen. Resta: la frase "Entras con tu correo, sin
contraseña" se repite en la portada, en el sello del pie, en la hoja del celular y en /entrar.

**3. Errores de CLAUDE.md: 8.** Cumple las reglas de la tabla. Defectos: (a) en
`precios-panel-agentes-1440-*` el globo de partículas cae justo detrás de la columna "Max" y se
cruza con el texto en oscuro y en claro (lección 11); la máscara solo limpia el centro.
(b) "Continuar con Google" usa la variante sutil, con texto azul: junto al botón principal azul
hay dos puntos azules en la tarjeta. (c) En claro, las páginas internas quedan en blanco puro;
el matiz lo dan la portada y la franja del pie, no el lienzo (lección 9 a medias).

**4. Claridad para un dueño de clínica: 9.** Al pasar por "Agentes" ve quién es quién y qué hace;
en "Para quién es" encuentra su tipo de negocio. La caja "¿Primera vez? … tu cuenta se crea al
entrar, con el plan Free" responde lo que un dueño se pregunta en /entrar. Los desplegables
agregan un paso, pero los enlaces sueltos (Precios, Preguntas) siguen directos.

**5. Celular: 9.** Tiene la hoja a pantalla completa con pliegues como el menú móvil de GitHub
("Agentes" abierto con los personajes), filas de 56px, "Entrar" con su nota y el selector de tema
abajo. Tiene `100svh`, zona segura, `overscroll-behavior: contain`, hover solo con puntero fino,
foco atrapado y Esc. La barra queda limpia: logo, "Pruébalo" y la hamburguesa con borde.

**6. Acabado: 8.5.** Tiene el teclado más trabajado de las tres (↓/↑/Inicio/Fin en los paneles,
gracia de 150ms al salir con el cursor, foco que vuelve al disparador), "Saltar al contenido",
`aria-current` con línea fina y capturas completas (incluido el estado de error). Resta:
"Tus datos" y "Contacto" aparecen dos veces en el pie (en la columna Ayuda y en la franja); hay
una mancha azul difusa detrás de "Atendel / Agentes" en `precios-panel-agentes-1440-claro.jpg`;
en `entrar-pie-390-oscuro.jpg` queda una banda vacía de otro tono debajo de la franja del pie
(hay que verificar si es de la captura o del sitio).

## G6-T2 · 7.83

**1. Fidelidad: 7.** Usa el vocabulario de GitHub (64px, logo con nombre, botón de ícono con
borde, pie de 4 columnas), pero lo aleja en lo que más se ve: los enlaces de la barra van en
gris apagado (la guía y la referencia piden blanco), no hay desplegables, la hoja del celular usa
letras de 30px al estilo Apple y /entrar es una tarjeta de vidrio de radio 24. Se siente más
Apple que GitHub, y la lección 13 pide "casi idéntico a GitHub".

**2. No genérico: 7.** Es tranquila y está bien hecha, pero la barra mínima, todo centrado y el
menú de letras gigantes son un patrón muy visto en sitios SaaS. La fila de avatares del equipo en
/entrar y los pasos 1 y 2 de "Revisa tu correo" sí son de Atendel.

**3. Errores de CLAUDE.md: 7.5.** Da la mejor respuesta a la lección 9 (lienzo cálido #f7f6f3 y
superficies blancas). Pero lo hace reasignando `--c-fondo` en `:root[data-tema="claro"]`, que
es un token global: cambia el fondo de todo lo que lo use en claro, incluido el dashboard del
G7 (la guía pide #fff / #f5f5f7 ahí). Las partículas en claro se ven como confeti denso sobre el
gris (lecciones 7 y 11), y no hay captura del botón de Google.

**4. Claridad: 9.** Es la más simple: cuatro enlaces, "ESTÁS AQUÍ" en el menú del celular y en
/entrar los pasos "abre el correo / toca el link y entras directo al chat con tu equipo". Quitó
"Empezar gratis" del menú porque llevaba al mismo lugar que "Entrar".

**5. Celular: 8.5.** Tiene el panel con `100dvh`, cascada corta, zona segura, `inputMode`,
`autoCapitalize`, `enterKeyHint` y 44px táctiles. Resta: un hueco grande entre los agentes y
"Entrar", y un "Pruébalo" grande que pesa mucho en la barra.

**6. Acabado: 8.** Está limpia y es consistente, y avisa de un bug real de la base
(`.page-enter` con `fill-mode` que rompe el desenfoque). Resta: "Entrar" no se marca como página
actual en /entrar, el pie no tiene marca ni franja (queda pobre al lado del de GitHub) y no hay
captura de Google.

## G6-T3 · 8.00

**1. Fidelidad: 9.** Es la más cercana a la referencia del dashboard y a la barra ganadora del
G7: miga "Atendel / Precios", la píldora "Escribe / para buscar", botones de ícono con borde,
la línea bajo la página actual, el cajón del dashboard como menú del celular y el pie con
"Claro · Oscuro · Sistema" como el de GitHub. Resta: la barra va de orilla a orilla, así que el
logo (x=32) no se alinea con el contenido (x=120) a 1440, y la miga es un recurso del producto,
no del sitio público.

**2. No genérico: 8.5.** El buscador es de Atendel de verdad: "cita" encuentra a Lola, Víctor,
Iris, Clínicas y la pregunta de planes, y cada agente sale con su personaje. "Link enviado" lleva
la hora real en Mono. Resta: "Todos los derechos reservados" es relleno.

**3. Errores de CLAUDE.md: 7.5.** Tiene el mejor fondo (máscaras cruzadas) y un botón de Google
neutro. Defectos: (a) "Menú" en el `aria-label` y en la etiqueta del cajón. (b) Una preferencia
"Sistema" con clave nueva en `localStorage` y `SincronizarTema`: es lógica de tema fuera de
`tema.ts`, y si el dueño elige "Sistema" en el sitio y luego cambia el modo en el panel, el sitio
puede pisar su elección. (c) En el menú del celular "Empezar gratis" y "Entrar" llevan al mismo
lugar.

**4. Claridad: 7.** "Escribe / para buscar" con una tecla dibujada es lenguaje de programador,
no de recepción. La miga repite la sección ("Atendel / Precios" y el enlace "Precios" subrayado
al lado), y en el celular el nombre "Atendel" se cambia por el de la sección.

**5. Celular: 8.5.** Tiene el cajón con gesto de deslizar, filas con ícono, la rayita azul de
la página actual, búsqueda a lo ancho, zona segura y 44px. Resta: la barra de 390 lleva cuatro
controles (hamburguesa, marca + sección, lupa, Pruébalo) y se siente cargada.

**6. Acabado: 7.5.** El combobox es muy accesible (`aria-activedescendant`, conteo en
`aria-live`, resaltado sin acentos). Pero las capturas de página completa salieron corruptas: en
1440 la portada se repite al final y no aparece el pie, y en 390 se repite tres veces. No se
puede verificar el sitio entero en claro y oscuro. Tampoco hay captura del estado de error, y el
"Atendel" del pie va con otro peso que el de la barra.

---

## Mejores ideas de las demás para meter en la ganadora

De **T3**:
1. **Las dos máscaras del fondo** (`.sitio__fondo .escena-fondo`: nada detrás de la barra y
   casi nada al centro). Resuelve el globo de partículas detrás del texto que tiene T1.
2. **El botón de Google neutro** en /entrar: reasignar `--c-sutil-*` dentro de la tarjeta
   para que el único azul sea "Enviarme el link".
3. **El buscador del sitio** (paleta `<dialog>` con índice de `contenido.ts`, `agentes.ts`,
   `planes.ts` y `PREGUNTAS`). La barra pública de GitHub también lo tiene. Si entra, conviene
   un texto de reposo menos técnico ("Busca un agente o una pregunta") y el atajo "/" solo como
   pista discreta en computadora.
4. "Link enviado" con `PuntoEstado` y la hora real de envío en Mono.
5. Reusar el `Cajon` de la base en lugar de una hoja propia, si el integrador quiere un solo
   componente de cajón (sin perder los pliegues de T1).

De **T2**:
1. **El lienzo cálido del modo claro** (#f7f6f3 de fondo y superficies blancas), pero aplicado
   solo al envoltorio público (`.sitio`) o pedido a la base, **no** reasignando `--c-fondo` en
   `:root`, para no cambiar el dashboard.
2. Los atributos del campo de correo: `inputMode="email"`, `autoCapitalize="none"`,
   `autoCorrect="off"`, `enterKeyHint="send"` (si `CampoCorreo` no los pone ya).
3. Los pasos 1 y 2 de "Revisa tu correo" ("toca el link y entras directo al chat con tu equipo").
4. La detección de la portada con `.sitio:has(> main > .seccion--portada:first-child)` en
   lugar de depender de `fondo="ninguno"`.
5. El aviso sobre `.page-enter` (`fill-mode`) que rompe el desenfoque del vidrio: lo revisa el
   integrador en la base.

## Lo que la ganadora (T1) debe corregir antes de integrarse

1. **Partículas detrás del texto:** el globo de polvo cruza la columna "Max" de Precios en ambos
   modos (lección 11). Hay que aplicar la máscara doble de T3 o limpiar también los costados donde hay texto.
2. **Botón de Google** neutro (no texto azul) para que haya un solo azul en la tarjeta.
3. **Modo claro:** las páginas internas quedan en blanco puro. Hay que darles el matiz cálido
   (idea de T2) sin tocar tokens globales que use el dashboard, y revisar en claro `/agentes`,
   `/para-quien-es`, `/preguntas` y `/pruebalo`.
4. **"Pruébalo" en claro:** con texto y borde azules, al lado del botón principal se lee como un
   segundo azul. Conviene borde neutro (#d1d9e0) en la barra, para dejar el azul al botón
   principal de cada pantalla.
5. **Pie:** quitar el duplicado de "Tus datos" y "Contacto" (columna Ayuda y franja). Bajar
   las repeticiones de "Entras con tu correo, sin contraseña".
6. Verificar la **mancha azul** detrás del logo en `precios-panel-agentes-1440-claro.jpg` y la
   **banda vacía** debajo del pie en `entrar-pie-390-oscuro.jpg`.
7. Pedidos a la base que deja T1 (los resuelve el integrador): borrar `.barra*`, `.menu-movil*`,
   `.pie*` y `.logo-palabra` de `globals.css`; quitar `.menu-movil` del `prevent` de
   `ScrollSuave`; `COLOR_BARRA.oscuro` de `tema.ts` a #0d1117 fuera de la portada.
8. Probar en un teléfono real: el desenfoque de la barra, la zona segura y los pliegues de la hoja.
