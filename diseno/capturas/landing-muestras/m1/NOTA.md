# Muestra M1 — "La v7 de regreso"

- **Idea:** el inicio vuelve a contarse por escenas, como la versión 7. La figura de triangulitos se queda quieta mientras lees y cambia de forma al bajar: burbuja de chat junto a la portada y, del mismo lado, un globo en "Tu equipo" (en celular, polvo ralo). Los títulos y párrafos aparecen línea por línea (Revela) y el scroll es suave.
- **De Dala (oscuro):** negro puro, títulos enormes en Geist 400 con -0.04em, párrafos ligeros (300) en gris, nada de cajas, botones y retratos con radio de 24px, puntos del carrusel.
- **De Vercel (claro):** lienzo #fafafa, títulos en Geist 450 con -0.06em, anillo fino doble y radio de 6px en campos, botones y retratos, el "registro" en Mono con ✓ en verde, partículas en gris suave.
- **De la v7:** el motor de figuras (`escena/Escena`), Revela, el scroll suave y el carrusel del equipo a todo lo ancho (copiado de `componentes-pendientes/carrusel-del-equipo`, con flechas, puntos y "Ver su ficha").
- **Botón principal:** solo "Únete a la lista", en el azul de Atendel; lo demás es secundario.
- **Muebles adaptados:** en el inicio la figura que cambia es la de la v7 (`escena/Escena`, en versión sobria: menos polvo y sin brillo), no el polvo de `Escena3D` (que sigue en /vista-3d). "Tu equipo" sube justo después de la portada y el chat de demostración queda enseguida. La vitrina de agentes con su conversación de ejemplo se cambia por el carrusel; la conversación sigue en la ficha de cada agente.
- Lo demás del inicio, la barra y el pie quedan como estaban.
