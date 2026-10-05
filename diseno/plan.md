# Plan del rediseño — casa nueva con estilo GitHub

Guía: `diseno/guia.md` (manda sobre `diseno/github/`). Lecciones y reglas
anti-genéricas: `CLAUDE.md`. Inventario: `diseno/inventario.md`. Skills: `diseno/skills.md`.

## Idea que hace que no se sienta plantilla

GitHub enseña su producto (el editor, el pull request) como prueba. Atendel
hace lo mismo con **su** producto: el día de una recepción. Cada sección muestra
algo que pasa de verdad en una clínica o estética — un WhatsApp a las 11 de la
noche contestado por Lola, un correo de proveedor resumido por Clara, una
paciente que no ha vuelto en 6 meses recordada por Víctor, una tabla de cortes
del día hecha por Iris. Los **personajes (blobs)** ocupan el lugar de las
mascotas 3D de GitHub: son el único elemento "ilustrado", y cada encabezado de
sección lleva al agente que hace ese trabajo. Las etiquetas en Mona Sans Mono se
usan como sellos de hora y de canal ("WHATSAPP · 23:14", "CORREO · 3 SIN LEER"),
no como adorno.

Ritmo de la página de inicio (no se repite el mismo formato dos veces seguidas):
centrado → producto en grande → pestañas → columnas asimétricas → lista con
línea de tiempo → pestañas/acordeón → tarjetas de precio → acordeón → centrado.

## Reparto de archivos (para que las propuestas se puedan juntar sin choques)

El arquitecto (Paso 4) crea la base y un archivo por sección. Cada grupo solo
toca sus archivos. Si un grupo necesita algo de la base, lo pide en su entrega
(`ENTREGA.md` de su rama) y el integrador lo agrega a la base.

| Dueño | Archivos |
|---|---|
| Arquitecto (base) | `src/app/globals.css` (tokens y capa base), `src/components/base/*`, `src/app/layout.tsx` (fuentes), `src/app/page.tsx` (orden de secciones), `src/lib/lista.ts`, `src/app/api/lista/route.ts`, `supabase/migrations/*_solicitudes.sql` |
| Grupo 1 · Portada | `src/components/inicio/Portada.tsx`, `src/estilos/portada.css`, `src/components/escena3d/*` |
| Grupo 2 · Chat | `src/components/inicio/ChatEnMarco.tsx`, `src/components/ChatDemo.tsx`, `src/components/PromptBar.tsx`, `src/components/PromptBar.css`, `src/components/chat/*`, `src/app/pruebalo/*`, `src/app/panel/chat/*`, `src/estilos/chat.css` |
| Grupo 3 · Agentes | `src/components/inicio/Agentes.tsx`, `src/components/agentes/*`, `src/app/agentes/**`, `src/estilos/agentes.css` |
| Grupo 4 · Informativas | `src/components/inicio/QueEs.tsx`, `ComoFunciona.tsx`, `ParaQuien.tsx`, `Seguridad.tsx`, `src/app/para-quien-es/*`, `src/estilos/informativas.css` |
| Grupo 5 · Conversión | `src/components/inicio/Precios.tsx`, `PreguntasInicio.tsx`, `CtaFinal.tsx`, `src/components/Planes.tsx`, `src/components/Preguntas.tsx`, `src/components/FormularioLista.tsx`, `src/app/precios/*`, `src/app/preguntas/*`, `src/app/contacto/*`, `src/app/lista/*`, `src/estilos/conversion.css` |
| Grupo 6 · Estructura | `src/components/Nav.tsx`, `Footer.tsx`, `BotonTema.tsx`, `Sitio.tsx`, `Logo.tsx`, `src/estilos/estructura.css`, `src/estilos/tema-claro.css`, `src/app/entrar/*`, `src/app/panel/Panel.tsx`, `src/app/panel/agentes/*`, `src/components/app/*` |

`/vista-3d` y `/opciones` (páginas de prueba, sin índice) se quedan; solo heredan la casa nueva.

## Inicio (`/`)

### 1. Portada — Grupo 1
- **Mueble:** el mensaje de Atendel + la escena 3D de partículas + el formulario.
- **Componentes:** fondo #000, halo morado (rgba(167,162,255,0.5) → transparente, blur 60px) detrás del título; título display 64px/425 (36–40px en celular); intro 18px #a4aea6 (máx. 640px); formulario en línea: input de correo (radio 8px, etiqueta flotante) + botón principal "Únete a la lista" (violeta #8052ff, radio 6px) + botón sutil "Prueba los agentes" (texto #8dd6ff) que lleva a `/pruebalo`.
- **Escena 3D:** como atmósfera detrás del halo: recoloreada a violeta/azul cielo/blanco frío, brillo bajo (lección 7), sin competir con el título. Fondo fijo: solo se mueve el contenido (lección 8). Con movimiento reducido o sin WebGL: solo el halo.
- **De Atendel:** el título habla de lo que pasa en la recepción, no de "IA"; debajo del formulario, una línea en Mono con lo que cuesta empezar ("PLAN FREE · SIN TARJETA · ENTRAS CON TU CORREO") — dato real de los planes.
- **Anti-genérico:** nada de "revoluciona"; un solo protagonista (el título con el halo); la escena no brilla.

### 2. El producto en vivo — Grupo 2
- **Mueble:** el chat de los agentes (`ChatDemo`) dentro de un **marco de navegador** (tres puntos, barra de pestañas con "Lola · WhatsApp", "Clara · Correo"…; radio 8px fuera, 6px dentro).
- **De Atendel:** se ve una conversación real del guion (paciente pide cita → Lola agenda → aparece la cita confirmada). Es la prueba principal, como el editor en GitHub.
- **Anti-genérico:** nada de cajas cuadradas: burbujas con jerarquía, avatar del personaje, estados de "escribiendo", hora en Mono, foco visible en el PromptBar.

### 3. Los cuatro agentes — Grupo 3
- **Mueble:** Lola, Clara, Víctor, Iris con sus personajes y ejemplos (`detalle.ts`, `ConversacionEjemplo`).
- **Componentes:** fila de pestañas en píldora (radio 60px); al elegir una: el personaje arriba, qué hace (lista corta), su ejemplo de conversación en un panel del producto, y en qué plan está. Enlace a la ficha y a su página.
- **De Atendel:** cada pestaña lleva el color del agente solo en el personaje (no en botones).
- **Anti-genérico:** no son 4 tarjetas iguales; es una sola vista que cambia.

### 4. Qué es Atendel — Grupo 4
- **Composición:** columnas asimétricas: a la izquierda título de sección 40px y texto; a la derecha un panel de vidrio con "el día de la recepción" (lista de cosas que los agentes resolvieron hoy, con sello de hora en Mono). Encabezado con el personaje que corresponda.
### 5. Cómo funciona — Grupo 4
- **Composición:** línea de tiempo vertical de 3 pasos (`PASOS`: entras con tu correo → armas tu equipo → les encargas trabajo), con números en Mono y una pequeña muestra del producto en el paso 3 (un mensaje que espera tu "visto bueno").
### 6. Para quién es — Grupo 4
- **Mueble:** `SEGMENTOS` (clínicas, estéticas, consultorios, negocios de servicios).
- **Composición:** pestañas o acordeón; cada negocio con sus tareas concretas por agente y el personaje del agente al lado de cada tarea.
### 7. Seguridad — Grupo 4
- **Mueble:** `GARANTIAS` (solo tu cuenta, con tu permiso, cifrado).
- **Composición:** distinta a las anteriores: una sola tarjeta de vidrio ancha con las tres garantías en fila separadas por divisiones de 1px, íconos de contorno (candado, mano, escudo) en #8dd6ff. Enlace a `/preguntas#seguridad`.

### 8. Precios — Grupo 5
- **Mueble:** `PLANES` (Free, One, Max) de `src/lib/planes.ts` (no se cambian precios ni condiciones).
- **Componentes:** tres tarjetas de vidrio; la recomendada con borde #8c93fb; qué agentes trae cada plan con sus personajes pequeños. El botón principal violeta solo en la recomendada; las demás con botón sutil o fantasma.
### 9. Preguntas frecuentes — Grupo 5
- **Mueble:** `PREGUNTAS`. Acordeón (grid-template-rows, 0.4s), una abierta a la vez opcional, chevron que gira.
### 10. CTA final — Grupo 5
- Repite el formulario de la portada (mismo `FormularioLista`), con un título distinto y concreto.
### 11. Pie de página — Grupo 6
- 4 columnas sin bordes: Producto (Agentes, Pruébalo, Precios), Negocios (Clínicas, Estéticas, Consultorios, Servicios), Ayuda (Preguntas, Tus datos, Contacto), Cuenta (Entrar, Mi panel). Encabezados 16px/600, enlaces 14px #a4aea6. Logo de Atendel y modo claro/oscuro abajo.

## Otras páginas

- **`/agentes`** (Grupo 3): encabezado con los 4 personajes; pestañas en píldora; una sección profunda por agente (qué hace, conversación de ejemplo en panel de producto, plan). Conserva las anclas `#lola`, `#clara`, `#victor`, `#iris` y `?ficha=`.
- **`/agentes/[agente]`** (Grupo 3): página propia de cada agente (Lola, Clara, Víctor, Iris) con su personaje grande, todo lo que hace, su conversación de ejemplo completa, en qué plan está y botón a la ficha / a probarlo.
- **Fichas de agente** (`AgenteModal`) (Grupo 3): vidrio "frost" (rgba 0.2) con blur, radio 24px.
- **`/pruebalo`** (Grupo 2): el chat completo dentro del marco de navegador, a lo ancho, con grupos y PromptBar; densidad de producto (14–16px, #0d1117/#151a22, bordes #21262d).
- **`/panel/chat`** (Grupo 2): el chat real con el mismo lenguaje que `/pruebalo`, con todas sus funciones (grupos, deslizar para borrar, comandos).
- **`/precios`** (Grupo 5): planes + comparación por agente + preguntas sobre planes.
- **`/preguntas`** (Grupo 5 las preguntas; Grupo 4 la sección `#seguridad`).
- **`/para-quien-es`** (Grupo 4): un bloque por negocio con composición alternada; se conserva la marca de "borrador" en los textos de ejemplo.
- **`/lista`** (Grupo 5): página de lista de espera (el mismo formulario a lo grande, qué pasa después de anotarte).
- **`/contacto`** (Grupo 5): formulario de contacto (nombre, correo, negocio, mensaje) con estados de enviando/enviado/error.
- **`/entrar`** (Grupo 6): tarjeta de vidrio centrada sobre el halo, input de correo con etiqueta flotante, botón principal, Google si está disponible, estado "Revisa tu correo".
- **`/panel`** y **`/panel/agentes`** (Grupo 6): densidad de producto, mismas superficies que el chat.
- **Barra de navegación** (Grupo 6): 64px, transparente con desenfoque al bajar; logo de Atendel, enlaces 16px; a la derecha Entrar (fantasma) y "Pruébalo" (sutil); el violeta queda libre para el botón principal de cada pantalla. En celular: ícono de hamburguesa (sin la palabra "Menú"), panel a pantalla completa.
- **Modo claro** (Grupo 6): valores de Primer (#ffffff, #f6f8fa, #1f2328, #59636e, #d1d9e0, #0969da), grises cálidos en superficies secundarias, halo más suave.

## Lista de espera y contacto (no existían)
No hay dónde guardar correos de lista de espera ni mensajes de contacto. Decisión:
el arquitecto agrega una tabla `solicitudes` en una migración nueva de Supabase
(solo permite **insertar** de forma anónima, con RLS; nadie puede leerla desde el
sitio) y una ruta `/api/lista` que la usa. **La migración se tiene que correr en
Supabase** para que el formulario guarde de verdad; mientras no se corra, el
formulario muestra un mensaje de error amable. Se le avisa al dueño.

## Movimiento (todos)
Microinteracciones 0.2s ease; cambios grandes 0.4s; revelados al bajar con
cubic-bezier(0.16, 1, 0.3, 1); solo transform y opacity; con movimiento reducido,
solo opacidad. Scroll suave (Lenis) se queda.

## Equipo
- Paso 4: 1 arquitecto.
- Paso 5: 28 trabajadores (G1 ×5, G2 ×5, G3 ×5, G4 ×5, G5 ×4, G6 ×4), cada uno en su rama `prop/gN-tM` y su worktree, por tandas de un grupo a la vez.
- Paso 6: 2 revisores por grupo (12), que no construyeron nada.
- Paso 7: 1 integrador.
- Paso 8: 3 revisores nuevos por ronda, hasta 4 rondas.
