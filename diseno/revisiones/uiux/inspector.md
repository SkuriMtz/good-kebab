# Inspector · pase de UI/UX de la landing (25 oct)

Rama prop/uiux, commit 563862b, comparada contra 0b31664. Revisé la AUDITORIA, el código de los arreglos de gravedad alta y media, las 16 capturas de antes y después y el build que ya estaba hecho (`.next`). No levanté servidor.

## Veredicto
**Está lista.** No encontré defectos de gravedad alta ni media. Solo quedan 2 detalles bajos y 2 pendientes que no eran de este encargo.

## Revisado en el código
- **Foco tapado por la barra (#1):** usa `scroll-padding-top` en `html:has(.sitio)` y baja el `scroll-margin` de cada destino lo mismo.
  - Las cuentas cuadran: `[id]` sigue en barra + 24px, `.faq-grupo` en barra + 32px y `.pqe-bloque` en barra + 16px.
  - Lenis lee `scrollPaddingTop` y `scrollMarginTop`. El dashboard no se afecta, porque la regla depende de `.sitio`, y `chat.css` no usa scroll-margin.
- **/entrar (#16 a #19):** revisa el correo antes de enviar, con `correoValido`.
  - El error va junto al campo, con `aria-invalid`, `aria-describedby` y `role="alert"`, y el foco regresa al campo.
  - El `.catch` evita que el botón se quede girando. Se ve "Enviando…" y el campo queda de solo lectura mientras envía.
  - Ya no salen textos técnicos en inglés.
- **Títulos de /preguntas (#14):** `nivel={2}` da h1 → h2 → h3. El inicio sigue con h2 → h3 → h4.
- **Contraste (#10):** el contador usa `--c-tenue` sin opacidad. Ningún gris del estilo cambió.
- **Zonas de toque (#3, #11, #12, #15):** las capas `::after` caen sobre elementos con `position: relative` y llegan a 44px o más. No chocan con otros `::after`.
- **SEO (#2):** `src/lib/seo.ts` da título, descripción y Open Graph por página. No inventa imagen. La descripción del inicio es la frase de la portada.
- **404 (#20):** el build ya trae el título "Página no encontrada · Atendel" con `noindex` y Open Graph.
  - Sigue el estilo: Mono, título grande, un solo botón azul, atajos con líneas finas y la burbuja.
  - En 390, el botón se ve en la primera pantalla.
- **Movimiento:**
  - `Escena.tsx` arranca con `requestIdleCallback` (espera máxima de 600 ms; en Safari, `setTimeout`) y lo cancela al desmontar.
  - `movimiento.ts` deja de medir dos veces. No se pierde nada: ScrollTrigger vuelve a medir solo al cargar, y el `ResizeObserver` de `AlBajar` cubre los cambios de alto.
- **Estilo y contenido:**
  - Los colores, las letras, la composición de M1 y M3 y el único botón azul siguen igual.
  - Los textos nuevos suenan naturales ("Platica con los agentes…", "Escribe tu correo para mandarte el link.").
  - No se tocaron precios ni planes, y no hay datos inventados.
- **Archivos prohibidos:** el diff no toca el dashboard, el chat, `chat.css`, `dashboard.css`, `ChatDemo`, `PromptBar`, `tema.ts` ni `componentes-pendientes/`.

## Defectos (los dos son de gravedad baja)
1. **La 404 lleva `noindex` repetido.** Next ya agrega su propio `<meta name="robots" content="noindex">` y sale dos veces en el HTML.
   - Arreglo, en `src/app/not-found.tsx`: quitar `{ robots: { index: false } }` del tercer argumento de `metadatos`.
2. **En /entrar, el error del correo puede leerse dos veces.** El `role="alert"` del campo queda dentro de `.acceso__tarjeta`, que también tiene `aria-live="polite"`.
   - Arreglo, en `src/app/entrar/Login.tsx`: dejar `aria-live` solo en lo que cambia al enviar (el aviso general y el estado "enviado"), no en toda la tarjeta.

## Pendientes fuera de este encargo (para el coordinador)
- **Chat de demostración (hallazgo 8, gravedad alta):**
  - El cuadro de escribir no tiene etiqueta y un ícono no lleva `aria-hidden`.
  - Pestañas, sugerencias y "Enviar" miden 36–40px en celular.
  - Necesita un encargo pequeño aparte, con quien lleva el chat, porque sus archivos no se tocan aquí.
- **"Texto de ejemplo · revísalo" en "Para quién es" (hallazgo 9):** el dueño debe decidir antes de publicar.
- **(opcional)** No crear Lenis en pantallas solo táctiles (`ScrollSuave.tsx`, hallazgo 21), ni ajustar `theme-color` (#6) sin cuidar el dashboard.
