# Inspector · transiciones entre páginas (25 oct)

Rama prop/transiciones, commit 3fa95b9, comparada contra 298ae02. Revisé el código, la NOTA y las 4 tiras, con los criterios de review-animations, emil-design-eng y animation-performance. No levanté servidor.

## Veredicto
**Está bien hecha y se puede enseñar.** Antes de juntar conviene corregir 2 cosas de celular y del panel (puntos 1 y 2).

## Lo que está bien
- **La API, con Next 14:**
  - Se envuelven `router.push` y `router.replace` en el mismo objeto que usa `<Link>`. Así, los clics con Ctrl o Cmd, `target=_blank`, los enlaces externos y las descargas nunca llegan ahí: no se pierde ningún clic.
  - Si cambia solo el `#ancla` o el `?parámetro`, no hay transición.
  - La promesa se cumple cuando cambia la ruta (`rutaPintada`). Si tarda más de 400 ms, se usa `skipTransition`.
  - El botón de atrás funciona: el `popstate` se detiene en captura, se vuelve a mandar dentro de la transición, y si no es de Next (`__NA`) se deja pasar.
- **Claro/oscuro:** los nombres solo existen con `html.vt-pagina`, así que `tema.ts` sigue siendo un fundido de todo y no se tocó.
- **Curvas y duraciones (Emil):** sale en 150 ms, entra en 300 ms con 50 ms de espera, sube 8px, curva de salida fuerte, solo `opacity` y `transform`. Sin rebotes ni cortinas. Las tiras muestran el cruce limpio, sin doble imagen visible después de unos 100 ms.
- **Lo fijo se queda quieto:** la barra, el fondo y el armazón del panel.
  - Cada nombre es único: `.cabecera` solo existe en `Nav` y `.dash-*` solo en `Armazon`. /pruebalo no monta `Sitio`, así que no hay dos `vt-sale`.
  - La escena recuerda su estado entre páginas: guarda solo arreglos de números, no el contexto WebGL.
- **Respaldo y reducir movimiento:** sin View Transitions, `template.tsx` hace el fundido solo del contenido. Con "reducir movimiento" no se arranca la transición: el cambio es instantáneo, con un fundido de 200 ms.
- **Movimiento existente:** `Revela`, `AlBajar` y `ScrollTrigger.refresh` esperan a `trasLaTransicion()`.
- **Archivos prohibidos:** el diff no toca el dashboard, el chat, `chat.css`, `dashboard.css`, `ChatDemo`, `PromptBar` ni `tema.ts`.

## Defectos, en orden de importancia
1. **Animación doble al volver deslizando en el celular.** En iPhone (Safari 18) y en Android con gesto de atrás, el navegador ya hace su propia animación al deslizar, y luego se suma el fundido.
   - Arreglo, en `src/components/TransicionPaginas.tsx` (`alVolver`): salir sin interceptar si `(e as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition` es verdadero.
2. **Dentro del panel la transición pesa para lo seguido que se usa** (estándar 2 de review-animations: algo que se hace decenas de veces al día lleva movimiento mínimo).
   - Entre `/panel`, `/panel/chat` y `/panel/agentes`, el contenido sube 8px en 300 ms cada vez.
   - Arreglo, en `src/lib/transiciones.ts`: poner una clase `vt-app` en `<html>` cuando la ruta de salida y la de llegada empiezan con `/panel`.
   - Y en `src/estilos/transiciones.css`: con `:root.vt-app`, dejar `vt-entra` en solo opacidad, 150 ms y sin espera. Entre el sitio y el panel se queda como está.

## Opcional
3. Al llegar de otra página, el título de las páginas con `Revela` (inicio, /para-quien-es, 404) entra dos veces seguidas: primero entra la página casi vacía (350 ms) y después el texto línea por línea (hasta 1.15 s).
   - Conviene que, al navegar, `Revela.tsx` muestre el texto ya puesto. La entrada línea por línea quedaría solo para la primera carga.
4. Cuando la página tarda en llegar (la primera vez al `/panel`, que pide datos), la pantalla se queda congelada hasta 400 ms antes de soltar. Se podría bajar `TOPE_MS` a 250–300 en `transiciones.ts`.
5. La técnica depende de detalles internos de Next 14: que `useRouter()` devuelva el mismo objeto que usa `<Link>` y el estado `__NA` del historial. Si fallan, la página cambia sin transición, sin romperse. Hay que volver a revisarlo si se actualiza Next.
