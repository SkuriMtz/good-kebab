# Skills elegidas para el rediseño (las usan TODOS los agentes)

Están instaladas en `.claude/skills/`. Cada agente lee el `SKILL.md` de las que
aplican a su parte antes de empezar.

| Skill | Para qué parte | Por qué |
|---|---|---|
| **refero-design** | Todos los grupos, antes de diseñar cada sección | Metodología de investigación primero, "reference lock" y controles anti-genéricos (anti-AI-slop). Sin el servidor de Refero se usan sus referencias incluidas. |
| **emil-design-eng** | Todos los grupos y los revisores | Pulido de componentes, estados (hover, foco, activo, deshabilitado, cargando) y detalles invisibles que separan un sitio hecho a mano de una plantilla. |
| **ui-ux-pro-max** | Todos los grupos y los revisores | Reglas de UX, accesibilidad (contraste, foco, objetivos táctiles), tipografía y jerarquía. |
| **design-system** | Arquitecto (Paso 4) y grupo 6 | Arquitectura de tokens en tres capas (primitivo → semántico → componente) para la base común y el modo claro. |
| **transitions-dev** | Grupos 3, 4, 5 y 6 | Recetas probadas de pestañas deslizantes, acordeón, revelado de textos, tooltip y menú. **Los tiempos y curvas se cambian por los de `diseno/guia.md`** (0.2s/0.4s, ease y cubic-bezier(0.16, 1, 0.3, 1)). |
| **animate** | Grupos 1 y 2 | Decidir si algo se anima, con qué propiedad y cómo se interrumpe: halo, escena 3D, mensajes del chat, "escribiendo…". |
| **mobile-native** | Todos los grupos, sobre todo el 6 | Celular: 100dvh, inputs que no hacen zoom, tap highlight, hover pegado, zona segura del notch. |
| **threejs-shaders** | Grupo 1 | Recolorear y bajar el brillo de la escena 3D de partículas para usarla como fondo de la portada. |

## Las que se dejan fuera y por qué
- **21st-ai, 21st-cli-use, 21st-ui-build, 21st-ui-explore, 21st-ui-review, 21st-registry, 21st-design-sync**: dependen del catálogo y la CLI de 21st.dev (con cuenta). Traen componentes de catálogo: justo el "aspecto por defecto de librería" que hay que evitar.
- **ui-styling** (shadcn/Radix), **pick-ui-library**: el proyecto no usa shadcn y no se va a meter otra librería de componentes.
- **design, brand, banner-design, slides, dataviz**: logos, banners, presentaciones y gráficas; no hay nada de eso en este trabajo (el logo de Atendel ya existe y no se cambia).
- **apple-design**: es otro lenguaje visual (el de Apple); mezclarlo con la casa de GitHub la volvería incoherente.
- **transitions-polish**: ajusta movimiento a la escala de tokens de transitions.dev; aquí manda la escala de tiempos de GitHub.
- **animation-vocabulary, find-animation-opportunities, improve-animations, review-animations**: son de consulta o auditoría de movimiento; el movimiento de esta casa es mínimo y ya está definido en la guía.
- **break-ui**: sirve para probar datos extremos en componentes de datos; los revisores ya revisan textos largos y celular con sus criterios.
- **prototype**: hace prototipos desechables; aquí se construye el sitio real.
- **animate-expo, write-swift, ask-sonner**: React Native, Swift y Sonner, que el proyecto no usa.
- **threejs-fundamentals/geometry/materials/lighting/loaders/textures/animation/interaction/postprocessing**: la escena 3D ya está construida; solo hace falta tocar sus shaders (se evita el bloom a propósito).
- Skills de documentos (docx, pdf, pptx, xlsx, docs), de artifacts y de configuración de Claude Code: no tienen que ver con el sitio.

## Nota sobre "Usa obligatoriamente estas: [nombres]"
El mensaje del dueño traía ese espacio sin llenar (decía literalmente "[nombres]").
Se usa la lista de arriba; si el dueño quería otras obligatorias, se agregan.
