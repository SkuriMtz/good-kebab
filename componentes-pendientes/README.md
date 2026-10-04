# Componentes pendientes

Aquí están guardados los adornos (efectos y animaciones) que no se llevaron a la "casa nueva".
No se borró nada. Esta carpeta **no forma parte del sitio**: no se carga ni se revisa al publicar.

| Carpeta | Qué es | Dónde se usaba | A dónde regresa |
|---|---|---|---|
| `particulas/` | ATENDEL hecho de partículas (WordmarkHero) y figuras de partículas: candado, sobre, palomita (ParticleShape) | Portada, "Tus datos", Entrar, Panel de Clara | `src/components/particles/` |
| `nombres-que-se-enfocan/` | Los nombres de los agentes que se enfocan uno por uno (TrueFocus + EquipoEnFoco) | Página Agentes | `src/components/` |
| `acordeon-de-agentes/` | El acordeón animado de los personajes (AccordionGallery + AgentesGaleria) | Página Agentes | `src/components/` y `src/components/agentes/` |
| `menu-lateral-de-ramas/` | El menú que se desliza desde el borde izquierdo, con ramas (MenuLateral + BranchedMenu) | Todas las páginas (computadora) | `src/components/` |
| `deslizar-para-borrar/` | Deslizar una conversación para borrarla (SwipeRow) | Chat real del panel | `src/components/` |
| `apariciones-al-bajar/` | Textos que aparecen al hacer scroll y títulos palabra por palabra (Reveal + SplitText) | Casi todas las páginas | `src/components/` |
| `personajes-en-collage/` | Las tarjetas inclinadas de los personajes (HeroPersonajes) | Inicio | `src/components/agentes/` |
| `personaje-animado/` | El personaje que respira, parpadea y sigue el cursor | Todo el sitio (hoy va la versión quieta) | `src/components/agentes/Personaje.tsx` |
| `botones-con-efectos/` | Texto que rueda al pasar el mouse y botón "magnético" | Todos los botones | `src/components/Buttons.tsx` |
| `boton-tema-en-circulo/` | El cambio de modo claro/oscuro que se abre en círculo | Barra de arriba | `src/components/BotonTema.tsx` y `src/lib/tema.ts` |
| `barra-y-menu-de-telon/` | Barra que se esconde al bajar, menú que baja como telón, reloj de CDMX, contador de capítulos y línea de progreso | Todas las páginas | `src/components/Nav.tsx` y `Sitio.tsx` |
| `portada-anterior/` | La portada anterior completa (círculos del logo que aparecen y la miniatura del chat) | Inicio | `src/app/page.tsx` |
| `dock/` | El Dock (se había quitado en una versión anterior; versión antigua, puede necesitar ajustes) | Barra de navegación | `src/components/` |
| `estilos-anteriores/` | La hoja de estilos anterior completa: ahí está el CSS de todos estos efectos | Todo el sitio | se copia lo necesario a `src/app/globals.css` |

## Cómo regresar uno

Lo más fácil: pídelo, por ejemplo "regresa los nombres que se enfocan a la página Agentes".
Se conecta y se adapta al diseño nuevo.

A mano: copia el archivo a la ruta de la columna "A dónde regresa", copia su CSS desde
`estilos-anteriores/globals.css` y vuelve a ponerlo en la página donde se usaba.

La versión completa anterior del sitio sigue intacta en la rama `rediseno-3`.
