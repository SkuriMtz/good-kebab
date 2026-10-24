# Inspector · movimiento GSAP + Lenis (24 oct)

Rama prop/animacion, commit da62a18, comparada contra d3fb12b. Revisé el código, la NOTA, las 3 tiras y la captura con "reducir movimiento". No levanté servidor.

## Veredicto
**Se puede enseñar el video al dueño.** Antes de juntar, conviene corregir los puntos 1 y 2. Ninguno cambia lo que se ve.

## Lo que está bien
- **Limpieza al desmontar:** `gsap.matchMedia()` con `revert()` en `Revela`, `AlBajar` y `ListaAgentes`. Los ScrollTriggers se matan y quitan sus estilos al terminar. Lenis se destruye y sale del reloj de GSAP.
- **Rendimiento:** solo se mueven `transform` y `opacity`. `quickTo` se crea una sola vez para `y`, `scaleY` y `opacity`. `Revela` mide primero y escribe después, y con `ScrollTrigger.batch` no hay trabajo pesado al bajar.
- **Reducir movimiento:** todo el texto se ve desde el primer cuadro (`reducido-1440-oscuro.png`), Lenis no arranca, `AlBajar` no hace nada y la banda salta sin animarse.
- **Si falla JavaScript:** nada queda escondido. Lo esconde el propio JS y `Revela` conserva el rescate de 4 s.
- **Tiempos:** 150, 200 y 250 ms para estados; 450, 600 y 700 ms para entradas, con `power2.out` y `power3.out`. La portada entra en menos de 1.15 s.
- **Partículas:** sin cambios, así que siguen cumpliendo las lecciones 7, 10 y 11.
- **UX:**
  - Foco visible de 2px en botones y filas.
  - Zonas de toque de 44px o más (por ejemplo, 40 + 10, y 32 + 12 en "¿Te equivocaste de correo?").
  - Se arregló la sacudida del error (antes decía `eyframes`).
- **Archivos prohibidos:** no se tocaron el dashboard, el chat, `chat.css`, `dashboard.css`, `ChatDemo`, `PromptBar` ni `componentes-pendientes/`.
- **Diseño aprobado:** no cambió. La banda tenue de la lista de agentes es lo que pedía el encargo.

## Defectos, en orden de importancia
1. **Puede quedar texto invisible al final del inicio.**
   - ScrollTrigger mide las posiciones al cargar. Cuando algo cambia de alto (las pestañas de "Para quién es", el acordeón de preguntas o el chat de demostración), no vuelve a medir.
   - Así, piezas de `AlBajar` pueden seguir en opacidad 0 aunque ya estén en pantalla. Con el cierre (`#lista .cta-final__centro`, que tiene el formulario) puede no dispararse nunca. Antes, `Revela` usaba IntersectionObserver, que no tenía este problema.
   - Arreglo, en `src/components/escena/AlBajar.tsx`: un `ResizeObserver` sobre `#contenido` que llame a `ScrollTrigger.refresh()` con un retraso de unos 150 ms y se desconecte en la limpieza.
2. **Limpieza incompleta.**
   - En `src/components/escena/AlBajar.tsx`: los `gsap.to` que se crean dentro de `onEnter` quedan fuera del contexto. Agregar `gsap.killTweensOf(piezas)` en la limpieza, antes del `clearProps`.
   - En `src/components/escena/ScrollSuave.tsx`: `gsap.ticker.lagSmoothing(0)` se queda puesto al salir del sitio público y afecta al panel. En la limpieza, devolver `gsap.ticker.lagSmoothing(500, 33)`.
3. **Parpadeo al cargar a media página** (al volver atrás o al llegar con un ancla).
   - `AlBajar` pone en 0 lo que ya estaba pintado y luego lo vuelve a mostrar.
   - Arreglo, en `AlBajar.tsx`: no esconder las piezas que ya están en pantalla al montar (`ScrollTrigger.isInViewport(el)`).
4. **El chat de demostración del inicio cambia un poco su movimiento.**
   - `landing.css` redefine `--ease`, `--ease-entrada` y `--dur-grande` en `.sitio`, y el chat los usa (16 veces en `chat.css`).
   - Arreglo, en `src/estilos/landing.css`: devolver los valores de la base dentro de `.sitio .chat` (o del marco del chat), para que se mueva igual que en /pruebalo.
5. **(opcional)** Con el mouse en la lista de agentes pero sin estar sobre una fila, las cuatro filas se apagan; en una tira se ven las cuatro grises. Usar `.m1-lista:has(.m1-agente:hover)` en lugar de `.m1-lista:hover` en `landing.css`.
6. **(opcional)** El salto a anclas dura 1.1 s, más que el resto del sistema. Bajarlo a 0.8–0.9 s en `ScrollSuave.tsx`.
7. **(nota)** La NOTA dice que `/home/user/wt/revisar.mjs` armaba mal la dirección. Hoy ya usa comillas invertidas, pero conviene volver a pasar la revisión automática de las landings anteriores si se corrió con la versión vieja.
