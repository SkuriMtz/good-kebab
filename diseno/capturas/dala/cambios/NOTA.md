# Cambios que pidió el dueño (después de aeecb1c)

Rama `prop/dala`. Capturas en esta carpeta, en inglés (`-en-`) y en español (`-es-`), a 1440 y 390.

## 1. Planes con las tarjetas de siempre

- La escena de Planes ahora muestra las tarjetas de precios de siempre: `src/components/Planes.tsx` con los datos de `src/lib/planes.ts`, sin precios inventados.
  - **Free:** gratis ($0 en inglés). Su botón violeta, "Start for free" / "Empieza gratis", lleva a /entrar.
  - **One y Max:** "Coming soon" / "Próximamente", con su lista de lo que incluye. Su botón "Join the waitlist" / "Únete a la lista" abre la lista de espera ahí mismo.
- **Estilo del inicio** (variante `inicio` de Planes): fondo negro, líneas finas, letra Geist y el violeta solo en los botones.
- Debajo de las tarjetas va **cuándo sale**: Free ya está abierto; One y Max abren por etapas.
- La sección sigue siendo el ancla de "Pricing/Precios" (`#precios`) y de "Launch/Cuándo sale" (`#cuando-sale`).
- Capturas: `planes-*.jpg`.

## 2. Tu equipo

- El nombre ya no va al lado de la ficha. Ahora va centrado debajo de ella:
  - el nombre, grande (26–36 px, peso 500);
  - el cargo en Mono gris, en mayúsculas con tracking (por ejemplo, "FRONT DESK · WHATSAPP & APPOINTMENTS");
  - abajo, las dos flechas violetas con "View profile" / "Ver su ficha" entre ellas, como botón con borde.
- La ficha es un poco más chica para que todo quepa en la escena.
- El nombre y el cargo entran con un fundido corto al cambiar de agente.
- Capturas: `tu-equipo-*.jpg`.

## 3. Botones: todos probados con Playwright

Script: `botones.mjs` (en la carpeta temporal de la sesión), a 1440×900 y a 390×844 (táctil). **41 de 41 pruebas pasan.**

| Dónde | Qué se probó | Resultado |
|---|---|---|
| Barra | Agents, Pricing y Launch bajan a su escena (`#agentes`, `#precios`, `#cuando-sale`); Questions abre /preguntas; el logo vuelve al inicio | funciona |
| Barra | "Join the waitlist" abre la lista; se cierra con Escape y con la ✕ | funciona |
| Barra | EN → ES → EN: cambia `<html lang>`, la cookie `atendel-idioma` y todos los textos sin recargar; el título que entra letra por letra se ve completo | funciona |
| Portada y cierre | "Join the waitlist" abre la lista | funciona |
| Tu equipo | Flechas siguiente y anterior; tocar la ficha del centro abre la ficha del agente; "View profile" abre la ficha; tocar una ficha de al lado la trae al centro | funciona |
| Ficha del agente | "Start for free" (/entrar), "Try it with Lola" (/pruebalo), "Their page" (/agentes/lola) y "See pricing" (/precios) | funciona |
| Planes | Free lleva a /entrar; One y Max abren la lista de espera | funciona (antes eran íconos sin botón) |
| Pie | Agents, Pricing, Questions, Contact y Sign in llevan a su página; el botón de tema cambia oscuro ↔ claro | funciona |
| Celular | La hamburguesa abre y cierra la hoja; Agents y Pricing bajan a su escena y cierran la hoja; EN/ES y el tema funcionan dentro de la hoja; la píldora abre la lista | funciona |

**Qué estaba roto y cómo quedó.**

- En Chromium no apareció ningún botón que no hiciera nada.
- Lo que sí fallaba era que en Planes los nombres de los planes (Free, One, Max y Cuándo sale) parecían botones y no hacían nada. Ahora son las tarjetas, cada una con su botón.
- "Ver su ficha" era un texto gris de 11 px, fácil de no ver. Ahora es un botón con borde entre las flechas.
- Faltaba el botón de idioma: ya está en la barra y en la hoja del celular.
- Si el dueño sigue viendo uno que no responda, conviene saber en qué navegador o teléfono. Safari de iPhone no se puede probar aquí.

## 4. Inglés por defecto y botón EN / ES

- **Diccionarios:** `src/i18n/en.ts` y `src/i18n/es.ts`, con la misma forma, y la ayuda `t(idioma)`.
  - El español es el texto de siempre.
  - El inglés está escrito para sonar natural: dice "businesses that serve people" y no nombra tipos de negocio.
  - Donde el ejemplo en español insinuaba un tipo de negocio, el inglés usa uno neutro: "the one-hour session" en vez de un tratamiento, y "forms" en vez de consentimientos.
- **Cookie `atendel-idioma`** (por defecto "en"):
  - las páginas del servidor la leen con `cookies()` (`src/i18n/servidor.ts`);
  - el botón EN / ES la cambia y llama a `router.refresh()` (`src/i18n/Idioma.tsx`);
  - `<html lang>` sigue al idioma.
- **Páginas que cambian de idioma:**
  - inicio, barra, los dos pies y botón de tema;
  - lista de espera (ventana, formulario y /lista);
  - fichas de agentes y su conversación de ejemplo;
  - /agentes y la página de cada agente;
  - /precios con su tabla, /preguntas, /para-quien-es, /contacto (con su formulario), /entrar y la 404;
  - los títulos y descripciones de cada página.
- **El panel y /pruebalo siguen en español:**
  - el middleware les pone la cabecera `x-idioma-fijo` y el layout les deja `lang="es"`;
  - no se tocó ningún archivo del dashboard ni del chat.
- **Arreglo de paso:** el título del sitio decía "para clínicas y estéticas". Ahora dice "para negocios que atienden personas" (lección 17).
- **Por el idioma, todas las páginas se generan al pedirlas**, porque leen la cookie.
- Capturas:
  - inicio: `inicio-en-*.jpg` e `inicio-es-*.jpg`;
  - menú del celular con EN / ES: `menu-celular-*.jpg`.

## 5. Figuras

Se unió `prop/dala-fig-a` (2d4a654). Se revisó en las capturas que el cerebro, el foco y el paso de Planes al cierre se ven bien con la página nueva, en los dos idiomas:

- el cerebro y el foco en 3D;
- el paso de Planes al cierre fluido;
- la marca de Atendel del cierre.

## Revisión

- `npm run lint` y `npm run build` limpios.
- `PUERTO=3601 node /home/user/wt/revisar.mjs`: 44 vistas sin problemas nuevos. Solo los de siempre:
  - textos `sr-only` marcados como cortados (están ocultos a propósito);
  - /entrar, que no puede llegar a Supabase desde esta máquina.
