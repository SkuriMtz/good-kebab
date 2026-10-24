# Grupo 6 · Estructura (barra, pie, modo claro, celular, /entrar) — resultado

Revisión en modo ligero: los revisores calificaron con las capturas y el código de cada trabajador.

| Propuesta | Revisor A | Revisor B | **Promedio final** |
|---|:-:|:-:|:-:|
| **G6-T1 · Fiel a la barra y el pie de GitHub, con desplegables** | 8.58 | 8.33 | **8.46** |
| G6-T3 · La barra pública habla el idioma del dashboard | 8.00 | 8.00 | 8.00 |
| G6-T2 · Mínima, calma de Apple | 7.83 | 7.83 | 7.83 |

**Ganadora: G6-T1** (rama `prop/g6-t1`, commit `e304119`). Los dos revisores la eligen por separado. Es la más fiel al sitio de GitHub sin usar su marca y la más accesible. Sus desplegables explican a un dueño de clínica quién es cada agente y para qué negocio sirve, y tiene el menú de celular más completo. "Pruébalo" ya no es azul. La lógica de inicio de sesión quedó intacta.

## Debe corregir al integrarse
1. **Partículas en `/precios`:** en 1440 la figura queda detrás de la columna "Max" y estorba la lectura, en oscuro y en claro. Hay que despejar la zona del texto (ver la idea de T3).
2. **Botón de Google en `/entrar`:** "Continuar con Google" lleva texto azul y compite con el botón principal. Debe ser neutro.
3. **Modo claro:** las páginas internas quedan en blanco puro. Se usa el gris cálido de T2, pero **solo en el sitio público**: no se toca el token global `--c-fondo`, porque cambiaría el dashboard.
4. **Pie:** "Tus datos" y "Contacto" aparecen dos veces.
5. **Por confirmar en la integración:**
   - Una mancha azul detrás del logo en una captura en claro.
   - Una banda vacía bajo el pie en 390.
6. **Compatibilidad con `NavApp`:** `Nav` sigue aceptando las props viejas, y hay que comprobarlo con el dashboard ganador (G7-T1), que tiene su propia barra.
7. **Pedidos a la base:**
   - Quitar de `globals.css` las reglas viejas `.barra*`, `.menu-movil*`, `.pie*` y `.logo-palabra`.
   - El color de la barra del navegador en oscuro y claro (`tema.ts`).

## Mejores ideas de las otras propuestas para incorporar
- **G6-T3:**
  - El **buscador redondo "Escribe / para buscar"** con la tecla "/". Encuentra páginas, agentes, negocios, planes y preguntas, y se maneja con flechas, Enter y Esc. Es lo que más le falta a T1, y une el sitio con la barra del dashboard (referencia del dueño).
  - La **doble máscara de partículas**: nada detrás de la barra ni del texto.
  - El botón de Google sin color.
  - La opción de tema "como el sistema", pero hecha en `tema.ts` (en la base), no con lógica aparte.
- **G6-T2:**
  - El modo claro de todo el sitio público en gris cálido con superficies blancas (lección 9).
  - Arreglar `.page-enter` con `backwards`, para que el vidrio sí desenfoque lo de atrás.

## Problemas de las demás (para no traerlos)
- **G6-T3:**
  - El `aria-label` de su hamburguesa dice "Abrir el menú". No se ve, pero el encargo pide evitar la palabra.
  - Su tema "sistema" usa lógica propia fuera de `tema.ts`.
  - Sus capturas de página completa salieron dañadas.
- **G6-T2:**
  - Los enlaces de la barra van en gris y se aleja más de GitHub.
  - Cambió el token global del fondo, y eso también afecta al dashboard.

Evaluaciones completas: `g6-revisor-a.md` y `g6-revisor-b.md`.
