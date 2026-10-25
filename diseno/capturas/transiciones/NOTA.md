# Transiciones entre páginas

## Técnica
- **View Transitions API** (sin dependencias). `src/components/TransicionPaginas.tsx`, en el layout raíz, envuelve `router.push` y `router.replace` del router de Next. Por ahí pasan `<Link>`, la barra, el pie, el panel y la entrada después de entrar. Cuando cambia la ruta, `src/lib/transiciones.ts` toma la foto de salida, hace la navegación y espera a que React pinte la página nueva antes de soltar la transición.
- **Atrás y adelante del navegador:** el aviso `popstate` se detiene antes de que lo lea Next. Se toma la foto y se le vuelve a mandar a Next. No hay parpadeo.
- **Sin transición:** si solo cambia el `#ancla` o el `?parámetro`, no se anima.
- **Página lenta:** si la página tarda más de 400 ms en llegar (por ejemplo, una que pide datos), se suelta la transición. La pantalla no se queda congelada.
- **Estilos:** todo está en `src/estilos/transiciones.css`. Los nombres solo existen mientras hay la clase `vt-pagina` en `<html>`. Por eso el cambio claro/oscuro sigue igual que antes: un fundido de toda la página en 0.4 s, sin nombres. Lo verifiqué.

## Duraciones y curvas
| Pieza | Qué hace | Tiempo | Curva |
|---|---|---|---|
| Contenido que sale (`vt-sale`) | Se desvanece en su lugar, aunque la página estuviera a la mitad | 150 ms (`--dur-salida`) | `--ease-entrada` = cubic-bezier(0.16, 1, 0.3, 1) |
| Contenido que entra (`vt-entra`) | Aparece y sube 8px, 50 ms después | 300 ms | la misma, de salida |
| Barra, hoja, barra y lateral del panel | Fundido cruzado parejo: como son iguales, no se nota | 150 ms | la misma |
| Fragmentos de fondo (`vt-escena`) | Fundido cruzado parejo | 300 ms | la misma |

Solo se animan `opacity` y `transform`. No hay rebotes, giros, barridos ni cortinas. Todo termina en 350 ms. La salida dura la mitad que la entrada.

## Qué se queda quieto
- La barra del sitio.
- Los fragmentos de fondo.
- En el panel y en Pruébalo: la barra superior y el menú lateral.

Cada pieza lleva su propio `view-transition-name`. Las piezas del panel se nombran desde el CSS nuevo, sin tocar `dashboard.css` ni sus componentes.

**Fondo:** antes, cada página montaba sus fragmentos de nuevo. El fondo se apagaba y volvía con otros triangulitos. Ahora `Escena.tsx` recuerda su estado entre páginas: el mismo polvo, los mismos tetraedros y el mismo reloj. Si la figura de la página nueva es otra (por ejemplo, el globo de Precios), se forma en su lugar desde una nube suave, sin cruzar la pantalla (lección 10).

**Hoja del celular abierta:** la hoja se desvanece encima de la página nueva. Lo que estaba detrás de la hoja no se asoma.

**Ficha o cajón abiertos:** la foto de salida es la pantalla tal cual se veía.

## Respaldo sin View Transitions
`template.tsx` decide al montar:
- **Si hubo transición**, no anima nada, para no repetirla.
- **Si no hubo** (navegador viejo o primera carga), queda el fundido, afinado:
  - en el sitio, solo entran el contenido y el pie (300 ms, suben 8px). La barra y el fondo ya no parpadean.
  - en el panel y en Pruébalo, solo opacidad, porque un transform rompería su barra pegada arriba.

## Reducir movimiento
No se arranca la transición: el cambio es instantáneo y el contenido aparece con un fundido mínimo de 200 ms, solo opacidad y sin desplazamiento.

## Texto, scroll y Lenis
- **Texto:** la entrada del texto de cada página (`Revela`, `AlBajar`) espera a que termine la transición. No se encima con ella ni se repite.
- **Scroll:** Next sube al inicio antes de la foto de llegada, así que no hay salto visible. Lenis se crea de nuevo con la página.
- **ScrollTrigger:** vuelve a medir una vez, al terminar la transición.

## Revisión con las skills
Usé emil-design-eng, animate, review-animations, animation-performance y apple-design.

| Antes | Después | Por qué |
|---|---|---|
| Toda la página (barra y fondo incluidos) entraba con 400 ms de opacidad | Solo el contenido: 150 ms al salir y 300 ms al entrar, subiendo 8px | Lo fijo no debe moverse; la salida más rápida que la entrada |
| El fondo se volvía a crear en cada página | El fondo sigue donde iba | Consistencia espacial; nada parpadea |
| El texto podía arrancar encima del cambio de página | El texto arranca al terminar la transición | Un solo momento protagonista |

- **Rendimiento:** la transición es del navegador (fuera del hilo principal), con `opacity` y `transform`, sin `will-change` ni desenfoque.
- **Aperturas que ya existían:** el submenú de la barra, la hoja del celular y la ficha del agente ya hablan el mismo lenguaje, así que no las toqué:
  - submenú: sale de su enlace (arriba a la izquierda), entra en 200 ms con ease-out y sale en 150 ms;
  - hoja: entra en 200/400 ms y sale en 150 ms;
  - ficha: es modal, centrada; entra en 400 ms y sale en 150 ms.

## Archivos
- **Videos:** `navegar-1440-oscuro.webm`, `navegar-1440-claro.webm` y `navegar-390-oscuro.webm`. Recorrido: inicio → Agentes → Precios → Preguntas → atrás → Pruébalo → Entrar, con clics reales en la barra; en el de 390, con la hoja del celular.
- **Tiras:** `tira-1440-oscuro.jpg` (Agentes a media página → Precios), `tira-1440-claro.jpg`, `tira-390-oscuro.jpg` (desde la hoja abierta) y `tira-1440-pruebalo.jpg` (sitio → Pruébalo).
  - Cuadros a los 0, 50, 100, 150, 200, 250 y 300 ms de la transición, más el final. Se tomaron con la animación a 1/50 de velocidad para que se vea la curva.

**Ojo con los videos.** En esta máquina sin tarjeta gráfica todo se dibuja por software: el sitio va a unos 10 cuadros por segundo y cada clic tarda de 1 a 2 s en empezar. Sin la transición, aquí también tarda unos 0.9 s en cambiar de página. Por eso los de 1440 duran unos 29 s en vez de 15–25. La transición en sí dura 350 ms, como se ve en las tiras.
