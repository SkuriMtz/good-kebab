# Grupo 3 · Agentes — resultado

Revisión en modo ligero (decisión del 14 oct para ahorrar límite de uso): los dos revisores calificaron con las capturas y el código de cada trabajador.

| Propuesta | Revisor A | Revisor B | **Promedio final** |
|---|:-:|:-:|:-:|
| **G3-T1 · Pestañas como la fila de funciones de la portada de GitHub** | 8.33 | 8.33 | **8.33** |
| G3-T3 · `/agentes` como GitHub Docs | 7.75 | 7.67 | 7.71 |
| G3-T2 · Cada agente como perfil de GitHub | 7.42 | 7.92 | 7.67 |

**Ganadora: G3-T1** (rama `prop/g3-t1`, commit `d7b93ba`). Los dos revisores la eligen por separado:

- Es la más fiel a la portada de GitHub: pestañas en píldora y un panel de vidrio con el producto en marco.
- Cada canal se ve como es: WhatsApp con burbujas, Clara como hilo de correo, Iris con su archivo adjunto.
- Respeta a los personajes sin recargarlos.
- Es la más pareja entre inicio, `/agentes`, páginas de agente y ficha.

Las tres cumplen lo básico:

- anclas `#lola #clara #victor #iris` y `?ficha=`;
- las 4 páginas `/agentes/[agente]` estáticas;
- ficha frost que se cierra con Esc y devuelve el foco;
- API de `Personaje.tsx` sin cambios y sin tocar el panel;
- datos solo de los archivos permitidos;
- `npm run lint` pasa.

## Debe corregir al integrarse (de ambos revisores)
1. **Partículas sobre texto y botones** en el encabezado de `/agentes` y en la portada de cada agente (lección 11). Se coordina con la escena del Grupo 6.
2. **Celular:**
   - La pestaña de Iris se corta sin señal de que la fila se desliza.
   - El encabezado de `/agentes` ocupa unos 800px antes del contenido: hacerlo compacto, como T3.
3. **Ficha:**
   - El vidrio es tan transparente que se ven manchas de color detrás del texto.
   - El botón principal queda abajo, fuera de la vista: ponerlo arriba, como T2.
4. **Personajes:** usar un solo ciclo de animación compartido que se detenga en reposo (idea de T2), en lugar de una animación por personaje.
5. **Accesibilidad:** agregar `aria-controls` en las pestañas del inicio. Hay que pedirlo a la base `Pestanas`.
6. **Limpieza:**
   - Pasar los anchos sueltos de `agentes.css` a tokens.
   - Quitar las reglas viejas `.ficha*` de `globals.css`.
   - Confirmar en pantalla el acento de "Víctor" en la píldora pegada.
   - Confirmar que el encabezado repetido en la captura completa de `/agentes` en celular es solo un efecto de la captura.
7. **"Háblale a…"** lleva a `/pruebalo?con=<agente>`. Con el dashboard nuevo en `/pruebalo` (G7-T1), hay que confirmar que ese parámetro abre la conversación del agente.

## Mejores ideas de las otras propuestas para incorporar
- **G3-T3:**
  - La tabla "Quién hace qué" con la nota "Para empezar". Antes hay que corregir su fila de "Mensajes al mes" en celular, que hoy se ve corrida.
  - Los mensajes al mes en las tarjetas de plan.
  - El encabezado compacto en celular.
  - "Anterior / siguiente" al final de cada agente.
- **G3-T2:**
  - El ciclo de animación compartido de los personajes.
  - La ficha con sus botones arriba.
  - El sello "Agente" junto al nombre en la conversación.
  - Datos honestos con íconos: "Ya se conecta a tu correo" solo para Clara, "Por ahora, la pruebas en el chat".
  - El borde de identidad en el plan "Desde aquí".

## Problemas de las demás (para no traerlos)
- **G3-T3:** recargó a los personajes (respiran, se inclinan, sombra y degradado, ojos cerrados en algunas capturas), justo lo que el dueño ya había quitado. Además, la fila de mensajes al mes de su tabla sale corrida en celular y da un dato falso.
- **G3-T2:** las partículas pasan por detrás de todo el texto de lectura, y la conversación de ejemplo queda escondida detrás de la pestaña "Ejemplo".

Evaluaciones completas: `g3-revisor-a.md` y `g3-revisor-b.md`.
