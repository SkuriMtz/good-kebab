# Inspector ligero · 3 muestras de la landing (23 oct)

Revisé solo las 8 capturas, la NOTA.md y el diff de cada muestra (contra e464093). No levanté servidor.

## Calificaciones (1 a 10)

| Criterio | M1 "La v7 de regreso" | M2 "Zigzag y registro" | M3 "Tres zonas" |
|---|---|---|---|
| 1. Fidelidad (oscuro Dala / claro Vercel) | 8 | 9 | 8 |
| 2. No genérica, un solo protagonista | 7 | 6 | 6 |
| 3. Reglas (nada inventado, sin marca, 1 botón azul) | 8 | 9 | 9 |
| 4. Partículas (lecciones 7, 10, 11) | 6 | 5 | 7 |
| 5. Muebles | 8 | 8 | 7 |
| 6. Celular (390) | 8 | 6 | 7 |
| 7. Dashboard y chat sin tocar | 10 | 10 | 10 |
| **Total** | **55** | **53** | **54** |

Notas rápidas:
- **Las tres** cumplen lo básico: un solo botón azul ("Únete a la lista"), sin ▲ ni nombres de Dala/Vercel, sin logos de clientes. "Atendel Free · 30 mensajes al mes" sale de `src/lib/planes.ts` (no es inventado). Ninguna toca dashboard, chat ni `componentes-pendientes/`. Nadie escribió "Menú".
- **Las tres** cambiaron la escena 3D de polvo (`Escena3D`) de la portada por la figura de triangulitos de la v7 (`escena/Escena`); `Escena3D` sigue viva en /vista-3d. Hay que decírselo al dueño.
- **Las tres** quitaron del inicio la vitrina de pestañas con la conversación de ejemplo; la conversación sigue en la ficha de cada agente.
- **M1:** el oscuro es el más Dala (título de ~96px, burbuja grande, texto flotando). El carrusel de la v7 le da tamaño y personalidad a los personajes. Fallas: la burbuja y el globo brillan con blancos (alfa 0.85/0.8); un triángulo grande pasa sobre el párrafo de la portada y otro sobre "con" del título de agentes; el globo pisa la tarjeta de Iris. Las tarjetas del retrato llevan fondo con el color del agente (en oscuro eso es una caja). Movió el chat de demostración después de Agentes.
- **M2:** tiene el claro más fiel a Vercel y el "registro del día" enseña el producto de verdad, con datos marcados como EJEMPLO. Pero la portada es casi igual a la de M1 y el zigzag (personaje grande + 4 viñetas, 4 veces) se siente de plantilla. Usa la escena normal, no la sobria (260 de polvo, 7 tetraedros y brillo de 10px en oscuro): hay partículas encima del registro y del texto de Lola. En 390 la burbuja se sale por la derecha y queda bajo "Pruébalo" y la hamburguesa. Quitó "Prueba los agentes" de la portada.
- **M3:** la lista de nombres enormes con rayas finas es lo más propio y lo más Vercel en claro. Pero la portada tiene tres zonas que compiten (título, burbuja y lista): no hay un solo protagonista, y en 390 queda apretada. Los personajes bajaron a ~48px. `.m3-resto` deja una franja de otro color visible al final de los agentes en claro. En 390 el globo se asoma detrás del título. Hay tetraedros sobre "Entrar" y sobre "Iris". Movió el chat de demostración después de Agentes.

## Orden de preferencia

1. **M1**: tiene el protagonista más claro, es la más cercana a la v7 (la que más le gustó al dueño) y los personajes salen grandes. Lo que le falta se arregla con ajustes.
2. **M3**: su sección de agentes es la más original, pero la portada está cargada y los personajes quedan chicos.
3. **M2**: su registro es la mejor pieza de las tres (se puede llevar a la ganadora), pero la portada repite la de M1, el zigzag es de plantilla y las partículas no son las sobrias.

## Arreglos para cuando se termine

**M1**
- `src/components/escena/escenas.ts` ("portada" y "globoEquipo"): bajar alfa de 0.85/0.8 a ~0.6 y achicar el globo (escala ~h*0.16, cy ~0.24) para que no pise el carrusel.
- `src/components/escena/Escena.tsx` (modo `sobrio`): dejar 1–2 tetraedros en escritorio y alejarlos de la columna del texto.
- `src/estilos/inicio-m1.css` (líneas 266 y 270): quitar el `color-mix` con el color del agente del fondo del retrato. En oscuro, fondo #000 o transparente; el color, solo en el personaje.
- `src/estilos/inicio-m1.css`: la ceja "TU EQUIPO" queda pegada a la barra (en 1440 y 390). Dar 96px arriba a la sección.
- `src/app/page.tsx`: confirmar con el dueño que el chat de demostración vaya después de Agentes, o regresarlo a su lugar.

**M2**
- `src/app/page.tsx` + `src/components/escena/Escena.tsx`: usar la versión sobria (menos polvo y tetraedros, `shadowBlur` 0), como M1 y M3.
- `src/estilos/landing.css` (`.sitio--inicio .escena-fondo`): la máscara deja la derecha al 100% y ahí quedan el registro y los textos. Apagar la escena también en la sección de agentes.
- `src/components/escena/escenas.ts` ("constelacion" en celular): cambiar cx 0.76 / cy 0.14 por cx ~0.5 / cy ~0.2, con escala menor, para que no se corte ni quede bajo la barra.
- `src/estilos/landing.css`: el campo de correo tiene fondo gris en oscuro (una caja); dejarlo negro con borde fino.
- `src/components/inicio/Agentes.tsx`: recortar cada fila del zigzag a lema + enlace (las capacidades van en la ficha) y que el registro sea el protagonista.
- `src/components/inicio/Portada.tsx`: regresar "Prueba los agentes" como enlace de texto (como en M3).

**M3**
- `src/components/inicio/Portada.tsx` + `src/estilos/landing.css`: sacar la lista de agentes de la portada (la sección viene justo abajo) y dejar título + burbuja: un solo protagonista.
- `src/components/inicio/Agentes.tsx` / `landing.css`: subir los personajes a ~88–96px, o mostrar en grande el de la fila activa.
- `src/estilos/landing.css` (`.m3-resto`): usar el mismo lienzo (#000 / #fafafa) para que no se vea la franja de otro color.
- `src/components/escena/escenas.ts` ("tresZonasAgentes" en celular): bajar el alfa a ~0.2 o cambiar el globo por polvo ralo, para que no ensucie el título.
- `src/components/escena/Escena.tsx` (modo `sobria`): bajar `cuantos` de 4 a 2 en escritorio y evitar la franja de la barra (hoy hay un tetraedro sobre "Entrar").
