# Inventario de Atendel (antes de la casa nueva)

Rama de partida: `rediseno-11` (salió de `rediseno-10`). Todo lo de esta lista
se queda. Al final (Paso 9) se revisa punto por punto en `diseno/verificacion-final.md`.

## En todas las páginas públicas (`src/components/Sitio.tsx`)
- **Barra de navegación** (`Nav.tsx`): logo de Atendel (4 círculos de los agentes, `Logo.tsx`), enlaces Agentes, Precios, Para quién es, Preguntas; Entrar; botón "Pruébalo"; botón de modo claro/oscuro (`BotonTema.tsx`); menú de celular. Los enlaces salen de `PAGINAS` y `PRUEBALO` en `src/lib/contenido.ts`.
- **Pie de página** (`Footer.tsx`): páginas, Pruébalo, "Tus datos" (/preguntas#seguridad), Entrar, Mi panel.
- **Modo claro/oscuro** (`src/lib/tema.ts`, `BotonTema.tsx`): se guarda en `atendel-tema-v5`, transición suave, script antes de pintar.
- **Fichas de agente** (`agentes/AgenteModal.tsx`, `FichasAgentes.tsx`, `BotonFicha.tsx`): se abren desde cualquier página (evento `atendel:elegir-agente`), con personaje, qué hace, ejemplo de conversación y plan.
- **Fondo de partículas** (`escena/Escena.tsx`, v7 en 2D WebGL) o **escena 3D** (`escena3d/`, Three.js) con `fondo="3d"`.
- **Scroll suave** (`escena/ScrollSuave.tsx`, Lenis + GSAP).
- **Revelados al bajar** (`escena/Revela.tsx`, `escena3d/Aparece.tsx`) y tetraedros decorativos (`escena/Tetra.tsx`).

## Página por página

### `/` Inicio (`src/app/page.tsx`)
1. Qué es Atendel: "Agentes de IA para negocios que atienden personas" + 3 párrafos.
2. Cómo funciona: "Un equipo que trabaja contigo" (entrar con correo, elegir agentes, lo importante no sale sin tu visto bueno).
3. Tu equipo: carrusel de los 4 agentes (`CarruselEquipo.tsx`) con sus personajes, enlace a /agentes.
4. Para quién es: constelación de negocios (clínicas, estéticas, consultorios, servicios, tu negocio) con tetraedros.
5. Llamado final con el logo.

### `/agentes` Agentes
- Encabezado de página (`EncabezadoPagina`).
- Tarjetas de los 4 agentes (`TarjetasAgentes.tsx`).
- Una sección por agente (Lola, Clara, Víctor, Iris): personaje (`Personaje.tsx`), "Lo que hace" con lista y checks, conversación de ejemplo (`ConversacionEjemplo.tsx`, datos en `agentes/detalle.ts`), botón de ficha.
- Acceso al chat al final.

### `/pruebalo` Pruébalo
- Título "Pruébalo" y el **chat de demostración** (`ChatDemo.tsx`): lista de chats y grupos, conversación abierta, mensajes, "escribiendo…", **PromptBar** (`PromptBar.tsx` + `PromptBar.css`: comandos, modelos, fuentes, adjuntos), nuevo grupo, piezas del chat (`chat/Piezas.tsx`: caras, día, sistema, mensaje tuyo, mensaje de agente, escribiendo). Guion local, sin llamar a la IA.

### `/precios` Precios
- Encabezado; planes **Atendel Free, One y Max** (`Planes.tsx`, datos en `src/lib/planes.ts`); sección final con llamado.

### `/para-quien-es` Para quién es
- Encabezado; una sección por negocio de `SEGMENTOS` (clínicas, estéticas, consultorios, negocios de servicios) con cómo ayuda cada agente y su personaje; sección final. Textos marcados como borrador (`Borrador`).

### `/preguntas` Preguntas
- Preguntas frecuentes en acordeón (`Preguntas.tsx`, `PREGUNTAS`).
- Seguridad: "Cada negocio ve solo lo suyo" con `GARANTIAS` (solo tu cuenta, con tu permiso, cifrado) — ancla `#seguridad`.

### `/entrar` Entrar (`entrar/Login.tsx`)
- "Entra a Atendel": correo con enlace mágico (sin contraseña), Google si está activado (`useGoogleDisponible.ts`), estado "Revisa tu correo", errores. Campo de formulario `ui/Field.tsx`.

### `/panel` Panel (requiere sesión) (`panel/Panel.tsx`)
- Modo de prueba de Clara: pegar un correo (con correos de ejemplo) y resumirlo; conexión con Gmail; historial; uso del plan (`app/Uso.tsx`); navegación de la app (`app/NavApp.tsx`).

### `/panel/chat` Hablar con mi equipo (`panel/chat/Chat.tsx`)
- **Chat real**: agentes, grupos y conversaciones; conversación abierta; PromptBar; deslizar para borrar; chats en grupo con varios agentes (`src/lib/grupo.ts`); comandos (`src/lib/comandos.ts`); API `/api/chat`.

### `/panel/agentes` Mis agentes (`panel/agentes/MisAgentes.tsx`)
- "Tu equipo.": los 4 agentes, cuáles permite el plan, elegir equipo (solo Max).

### `/vista-3d` Vista previa de la escena 3D (noindex)
- Historia con la escena 3D (logo → cerebro → caos → se juntan → burbuja → calendario) y textos.

### `/opciones` y `/opciones/[a|b|c]` (noindex)
- Tres propuestas de portada (`portadas/Portadas.tsx`, `Constelacion.tsx`, `ConversacionEnVivo.tsx`).

## API y datos (no se tocan en el rediseño)
- `/api/chat`, `/api/agente-correo`, `/api/agente-correo/prueba`, `/auth/callback`; `src/lib/supabase/*`, `src/lib/cuenta.ts`, `src/lib/planes.ts`, `src/lib/agentes.ts`, `src/lib/agentes-prompts.ts`, `src/lib/resumir.ts`; `supabase/migrations`.

## Guardado aparte (se queda ahí, no se borra)
`componentes-pendientes/`: acordeon-de-agentes, apariciones-al-bajar, barra-y-menu-de-telon, boton-tema-en-circulo, botones-con-efectos, deslizar-para-borrar, dock, estilos-anteriores, menu-lateral-de-ramas, nombres-que-se-enfocan, particulas, personaje-animado, personajes-en-collage, portada-anterior.

## Lo que la casa nueva pide y hoy NO existe
- **Lista de espera** (formulario "Únete a la lista"): no hay tabla ni servicio para guardar correos. Ver decisión en `diseno/plan.md`.
- **Contacto**: no hay página ni correo de contacto publicado. Ver decisión en `diseno/plan.md`.
