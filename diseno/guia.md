# Guía de estilo de Atendel (casa nueva: estilo GitHub)

La siguen TODOS los agentes. Fuente principal: `diseno/github/` (DESIGN.md,
tokens.json, variables.css, theme.css). El proyecto usa **Tailwind v3**, así que
la referencia de tokens es `variables.css` (no `theme.css`, que es de Tailwind v4).
Este resumen marca lo más importante y **resuelve las contradicciones**: cuando
choque con los archivos, manda este documento.

## Uso permitido
Se toma el estilo, los valores, la estructura y el comportamiento. Las fuentes
Mona Sans y Mona Sans Mono (licencia OFL) se pueden usar. **No** se usa el logo de
GitHub, el Octocat, sus mascotas, el nombre "GitHub", sus ilustraciones, sus
textos ni logos de sus clientes. Todo dice y se ve como Atendel.

## Contradicciones resueltas
- Botones rellenos: radio **6px**, NO 9999px (se ignora la sección "Agent Prompt Guide" del DESIGN.md en ese punto).
- Inputs: radio **8px**, como dice el componente "Email Input Field".
- "Carbon" tiene dos valores: **#151a22** para inputs y botones elevados; **#090d0a** solo como relleno casi negro de botones.
- Las tarjetas son de **vidrio translúcido**, no de color "Iron" sólido.
- Nunca peso 700. El peso 800 solo si el DESIGN.md lo pide en un caso puntual.
- El DESIGN.md dice "no uses violeta sólido en botones", pero el dueño pidió usar el color principal de Atendel en el rol del verde de GitHub. **Manda el dueño:** el color de acción es el violeta de Atendel **#8052ff**, solo en el botón principal (uno por pantalla), con texto blanco.

## Color de acción
El color principal de Atendel (#8052ff) ocupa el rol que GitHub le da a su verde
Terminal Green (#08872b): un solo botón de acción principal por pantalla, texto
blanco. Nunca en acciones secundarias, etiquetas ni decoración.

## Lo esencial
- Fondo de página #0d1117; la portada puede ir en #000000.
- Texto principal #ffffff · cuerpo y secundario #a4aea6 · terciario #7c8980 · enlaces y acentos fríos #8dd6ff.
- Bordes 1px #21262d; divisiones más marcadas #484f58.
- Tarjetas de vidrio: fondo rgba(255,255,255,0.06) a 0.2, borde 1px rgba(255,255,255,0.1), radio 24px, backdrop-filter blur(20px). Sin sombras.
- Tarjeta destacada (plan recomendado o elemento seleccionado): mismo vidrio con borde 1px #8c93fb.
- Halo de la portada: radial-gradient de rgba(167,162,255,0.5) a transparente, filter blur(60px), detrás del título.
- Degradados solo como atmósfera, nunca en botones, tarjetas ni texto. Siempre difuminados, opacidad máxima 0.3–0.6.
- Tipografía Mona Sans:
  - Display: 64px, peso 425, interlineado 1.08, tracking -0.035em (-2.24px). En celular baja a 36–40px.
  - Títulos grandes: 48px, peso 440, 1.18.
  - Títulos de sección: 40px, peso 460, 1.2.
  - Subtítulos: 24px peso 600, o 22px peso 400–480.
  - Intro de sección: 18px, peso 400, #a4aea6, tracking 0.01em, ancho máximo 640px.
  - Cuerpo: 16px, peso 400, interlineado 1.5. Párrafos nunca menos de 16px ni más de 18px.
  - Etiquetas: Mona Sans Mono 12px, peso 500, mayúsculas, tracking 0.015em.
- Espaciado con base de 4px. Entre secciones 64–96px. Contenido centrado, ancho máximo 1200px. Padding de tarjetas 24px. Entre elementos 16–24px.
- Dos formas, sin mezclarlas en el mismo tipo de componente: rectángulos de radio 6px para botones; píldoras de 60px para pestañas y filtros. Imágenes con radio 16px.

## Componentes
- **Botón principal:** color de acción, texto blanco 16px/400, radio 6px, padding 6px 20px.
- **Botón sutil secundario:** fondo rgba(31,35,40,0.4), texto #8dd6ff, borde 1px blanco, radio 6px.
- **Botón fantasma:** transparente; el texto y el borde hacen la señal.
- **Pestañas en píldora:** radio 60px, borde 1px rgba(255,255,255,0.3) en reposo, padding 8px 16px. Activa: relleno blanco o borde más fuerte.
- **Input de correo:** radio 8px, borde 1px #21262d, etiqueta flotante, placeholder #a4aea6 a 16px.
- **Barra de navegación:** ~64px de alto, transparente, logo de Atendel a la izquierda, enlaces 16px blancos y botones a la derecha. Hamburguesa en celular (nunca un botón que diga "Menú").
- **Encabezado de sección:** centrado, con un personaje o ícono 3D arriba, título 40px y texto 18px en gris perla.
- **Marco de producto:** ventana tipo navegador con los tres puntos de color y una barra de pestañas; radio 8px por fuera y 6px en paneles internos.
- **Pie de página:** fondo #0d1117, 4 columnas sin bordes, encabezados 16px/600 blancos, enlaces 14px/400 #a4aea6.
- **Íconos** de contorno de 1.5 a 2px, en #a4aea6 o #8dd6ff.

## Acomodo de los muebles
1. Portada centrada: título display, intro 18px, formulario en línea (campo de correo + botón principal "Únete a la lista" + botón secundario "Prueba los agentes"), halo morado detrás. La escena 3D de partículas puede ir como fondo atmosférico de la portada, recoloreada a esta paleta y con brillo bajo.
2. Debajo de la portada: el chat de los agentes en vivo dentro de un marco de navegador, como la prueba principal del producto.
3. Pestañas en píldora con los 4 agentes. Cada pestaña muestra qué hace el agente, su ejemplo de conversación y su personaje.
4. Encabezados de sección con el personaje 3D (blob) del agente correspondiente arriba.
5. "Qué es Atendel", "Cómo funciona", beneficios y seguridad: con tarjetas de vidrio, sin repetir el mismo formato en todas.
6. "Para quién es" (clínicas, estéticas, consultorios) en pestañas o acordeón.
7. Precios en tarjetas de vidrio; la recomendada con borde #8c93fb.
8. Preguntas frecuentes en acordeón.
9. CTA final que repite el formulario de la portada.
10. Pie de página de 4 columnas.
- No hay logos de clientes ni testimonios: no se inventan. Esas secciones se omiten.

## Chat de los agentes (estilo producto)
En su página propia y dentro del marco de navegador: más denso, texto 14–16px,
superficies #0d1117 / #151a22, bordes 1px #21262d, radio 6px en paneles internos,
íconos de contorno. Nada de cajas cuadradas sin intención: cada elemento con
jerarquía, espacio y estados (escribiendo, vacío, hover, foco).

## Modo claro (valores de Primer)
- Fondo #ffffff · secundario #f6f8fa · texto #1f2328 · texto secundario #59636e · bordes #d1d9e0 · enlaces y foco #0969da.
- Las tarjetas de vidrio pasan a blanco con borde #d1d9e0. El halo morado se mantiene, más suave, con matices de gris cálido; no solo blanco y negro.
- Se mantiene la transición suave entre modos que ya existe.

## Movimiento
- 0.2s para microinteracciones con ease (cubic-bezier(0.25, 0.1, 0.25, 1)); 0.4s para cambios más grandes.
- Entradas y revelados al hacer scroll: cubic-bezier(0.16, 1, 0.3, 1).
- Solo se animan transform y opacity. Con movimiento reducido: solo opacidad.

## Reglas anti-genéricas
Ver "Reglas anti-genéricas" en `CLAUDE.md`. Son obligatorias.
