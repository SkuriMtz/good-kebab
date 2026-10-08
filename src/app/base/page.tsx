import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Sitio } from "@/components/Sitio";
import { FormularioLista } from "@/components/FormularioLista";
import { Acordeon } from "@/components/base/Acordeon";
import { Avatar } from "@/components/base/Avatar";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import { Boton } from "@/components/base/Boton";
import { Buscador } from "@/components/base/Buscador";
import { Escribiendo } from "@/components/base/Escribiendo";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { Campo, CampoCorreo } from "@/components/base/Campo";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono, NOMBRES_ICONOS } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { Pestanas } from "@/components/base/Pestanas";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTES_INFO } from "@/lib/agentes";
import { DemoBotonesIcono, DemoCajon, DemoDashboard, DemoMenus, DemoProgreso, DosModos } from "./Demos";

export const metadata: Metadata = {
  title: "Base común",
  description: "Muestrario de los tokens y componentes base de Atendel.",
  robots: { index: false, follow: false },
};

/* ---------------------------------------------------------------------
   Muestrario de la base común (Paso 4). Referencia para quienes
   construyen y revisan: todo lo que se ve aquí sale de globals.css y de
   src/components/base/. Si algo no está aquí, no existe todavía: se pide.
   --------------------------------------------------------------------- */

const COLORES: { token: string; uso: string }[] = [
  { token: "--c-portada", uso: "Portada" },
  { token: "--c-fondo", uso: "Página" },
  { token: "--c-fondo-2", uso: "Franja secundaria" },
  { token: "--c-superficie", uso: "Inputs, elevado" },
  { token: "--c-relleno", uso: "Relleno casi negro" },
  { token: "--c-borde", uso: "Bordes 1px" },
  { token: "--c-borde-fuerte", uso: "Divisiones marcadas" },
  { token: "--c-texto", uso: "Títulos y texto" },
  { token: "--c-texto-2", uso: "Cuerpo" },
  { token: "--c-tenue", uso: "Terciario" },
  { token: "--c-enlace", uso: "Enlaces, acento frío" },
  { token: "--c-accion", uso: "Botón principal (azul)" },
  { token: "--c-accion-hover", uso: "Hover del principal" },
  { token: "--c-accion-texto", uso: "Texto azul de acción" },
  { token: "--c-marca", uso: "Violeta: solo identidad" },
  { token: "--c-destacada", uso: "Borde destacado" },
  { token: "--c-foco", uso: "Anillo de foco" },
  { token: "--c-exito", uso: "Éxito" },
  { token: "--c-atencion", uso: "Atención" },
  { token: "--c-error", uso: "Error" },
  { token: "--c-hover", uso: "Matiz al pasar el cursor" },
  { token: "--c-activo", uso: "Matiz de seleccionado" },
  { token: "--c-elevado", uso: "Superficie elevada opaca" },
  { token: "--c-propio", uso: "Lo mío (tinte azul)" },
  { token: "--c-vidrio", uso: "Vidrio 0.06" },
  { token: "--c-vidrio-frost", uso: "Vidrio frost 0.2" },
];

/* Los tokens del producto (dashboard): se ven dentro de .producto */
const COLORES_APP: { token: string; uso: string }[] = [
  { token: "--c-app-fondo", uso: "Fondo de la app" },
  { token: "--c-app-superficie", uso: "Tarjetas y paneles" },
  { token: "--c-app-superficie-2", uso: "Superficie alterna" },
  { token: "--c-app-lateral", uso: "Menú lateral y cajón" },
  { token: "--c-app-borde", uso: "Bordes sutiles" },
  { token: "--c-app-division", uso: "Divisiones y contornos" },
  { token: "--c-app-texto", uso: "Texto principal" },
  { token: "--c-app-texto-2", uso: "Secundario (AA)" },
  { token: "--c-app-tenue", uso: "Terciario (no para leer)" },
  { token: "--c-accion", uso: "Botón principal" },
  { token: "--c-accion-texto", uso: "Enlaces del producto" },
  { token: "--c-exito", uso: "Éxito" },
  { token: "--c-atencion", uso: "Atención" },
  { token: "--c-error", uso: "Error" },
];

const AGENTES_COLOR = AGENTES_INFO.map((a) => ({ token: `--agente-${a.id}`, uso: a.nombre }));

const TIPOS: { clase: string; spec: string; ejemplo: string }[] = [
  { clase: "t-display", spec: "64px · 425 · 1.08 · −0.035em (38px en celular)", ejemplo: "Que ningún cliente se quede sin respuesta" },
  { clase: "t-grande", spec: "48px · 440 · 1.18 (34px en celular)", ejemplo: "Cuatro agentes, un solo equipo" },
  { clase: "t-seccion", spec: "40px · 460 · 1.2 (30px en celular)", ejemplo: "Cada negocio ve solo lo suyo" },
  { clase: "t-titulo", spec: "24px · 600 · 1.3", ejemplo: "Lola, tu agente de atención" },
  { clase: "t-sub", spec: "22px · 440 · 1.4", ejemplo: "Contesta tu WhatsApp a cualquier hora" },
  { clase: "t-intro", spec: "18px · 400 · 0.01em · #a4aea6 · máx. 640px", ejemplo: "Les hablas como a una persona y te entregan el trabajo hecho." },
  { clase: "t-editorial", spec: "16px · 400 · 1.5 · color de texto", ejemplo: "Agenda, confirma y recuerda citas." },
  { clase: "t-cuerpo", spec: "16px · 400 · 1.5 · #a4aea6", ejemplo: "Responde los mensajes de WhatsApp a cualquier hora, con el tono de tu negocio." },
  { clase: "t-chico", spec: "14px · 400 · terciario", ejemplo: "Entras con tu correo, sin contraseña." },
  { clase: "t-caption", spec: "12px · 400 · terciario", ejemplo: "Nombres de ejemplo" },
  { clase: "t-mono", spec: "Mona Sans Mono 14px · 400", ejemplo: "atendel.mx/panel/chat" },
  { clase: "etiqueta", spec: "Mona Sans Mono 12px · 500 · mayúsculas · 0.015em", ejemplo: "WhatsApp · 23:14" },
];

const ESPACIOS = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96];
const RADIOS: { token: string; uso: string }[] = [
  { token: "--radio-panel", uso: "Paneles internos 6px" },
  { token: "--radio-boton", uso: "Botones 6px" },
  { token: "--radio-campo", uso: "Inputs 8px" },
  { token: "--radio-marco", uso: "Marco 8px" },
  { token: "--radio-imagen", uso: "Imágenes 16px" },
  { token: "--radio-tarjeta", uso: "Tarjetas 24px" },
  { token: "--radio-pildora", uso: "Píldoras 60px" },
];
const RADIOS_APP: { token: string; uso: string }[] = [
  { token: "--radio-app-control", uso: "Botones 8px" },
  { token: "--radio-app-tarjeta", uso: "Tarjetas 12px" },
  { token: "--radio-app-menu", uso: "Menús 14px" },
  { token: "--radio-app-panel", uso: "Paneles 16px" },
  { token: "--radio-burbuja", uso: "Burbuja 16px" },
  { token: "--radio-app-pildora", uso: "Píldora 9999px" },
];

const TIPOS_APP: { clase: string; spec: string; ejemplo: string }[] = [
  { clase: "t-app-saludo", spec: "28 → 32px · 600 · −0.02em", ejemplo: "Buenos días, Ana" },
  { clase: "t-app-titulo-grande", spec: "24px · 600", ejemplo: "Conversaciones" },
  { clase: "t-app-titulo", spec: "20px · 600", ejemplo: "Actividad de tus agentes" },
  { clase: "t-app-mediano", spec: "16px · 600", ejemplo: "Próximas citas" },
  { clase: "t-app", spec: "14px · 1.43 · −0.01em (el cuerpo de .producto)", ejemplo: "Lola agendó a Mariana para el jueves a las 16:30." },
  { clase: "t-app-etiqueta", spec: "12px · 500 · 1.33", ejemplo: "Martes 8 de octubre · 10:44" },
];

function Bloque({ id, titulo, texto, children }: { id: string; titulo: string; texto?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="border-t border-borde py-[var(--spacing-64)]">
      <h2 id={`${id}-t`} className="t-titulo">
        {titulo}
      </h2>
      {texto ? <p className="t-cuerpo mt-[var(--spacing-8)] max-w-[70ch]">{texto}</p> : null}
      <div className="mt-[var(--spacing-32)]">{children}</div>
    </section>
  );
}

function Muestra({ etiqueta, children, className = "" }: { etiqueta: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Etiqueta tono="tenue" className="mb-[var(--spacing-12)]">
        {etiqueta}
      </Etiqueta>
      {children}
    </div>
  );
}

function Paleta({ tema, producto = false }: { tema: "oscuro" | "claro"; producto?: boolean }) {
  const lista = producto ? COLORES_APP : [...COLORES, ...AGENTES_COLOR];
  return (
    <div data-tema={tema} className={`${producto ? "producto rounded-panel-app" : "rounded-tarjeta"} border border-borde bg-fondo p-[var(--spacing-24)] text-tinta`}>
      <Etiqueta tono="texto">{producto ? `Producto · ${tema}` : `Modo ${tema}`}</Etiqueta>
      <ul className="mt-[var(--spacing-16)] grid grid-cols-1 gap-[var(--spacing-12)] sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((c) => (
          <li key={c.token} className="flex items-center gap-[var(--spacing-12)]">
            <span
              className="h-10 w-10 shrink-0 rounded-panel border border-borde"
              style={{ background: `var(${c.token})` }}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="t-mono block truncate !text-[12px] text-tinta">{c.token}</span>
              <span className="t-caption block">{c.uso}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Base() {
  const pestanasAgentes = AGENTES_INFO.map((a) => ({
    id: a.id,
    etiqueta: a.nombre,
    adorno: <Personaje agente={a.id} avatar />,
    contenido: (
      <TarjetaVidrio>
        <Etiqueta tono="cielo">
          {a.area} · {a.abarca}
        </Etiqueta>
        <p className="t-editorial mt-[var(--spacing-8)]">{a.lema}</p>
      </TarjetaVidrio>
    ),
  }));

  return (
    <Sitio fondo="ninguno">
      <Seccion fondo="portada" halo espacio="compacto">
        <Halo y="0%" suave />
        <Etiqueta tono="cielo">Paso 4 y 4b · Arquitecto</Etiqueta>
        <h1 className="t-grande mt-[var(--spacing-16)]">Base común de Atendel</h1>
        <p className="t-intro mt-[var(--spacing-16)]">
          Tokens y componentes que usan todas las propuestas. Desde la base 4b la acción es azul (el violeta queda como marca) y el
          dashboard tiene sus piezas: menú, avatar, insignias, buscador, cajón y más. Nada fuera de aquí: si falta algo, se pide en
          el ENTREGA.md de tu rama. La documentación completa está en diseno/base.md.
        </p>
        <nav aria-label="Secciones del muestrario" className="mt-[var(--spacing-24)] flex flex-wrap gap-[var(--spacing-8)]">
          {[
            ["dashboard", "Dashboard"],
            ["color", "Color"],
            ["tipografia", "Tipografía"],
            ["espacios", "Espacios y radios"],
            ["botones", "Botones"],
            ["menu", "Menú"],
            ["avatar", "Avatar"],
            ["insignias", "Insignias"],
            ["buscador", "Buscador"],
            ["cajon", "Cajón"],
            ["progreso", "Progreso"],
            ["escribiendo", "Escribiendo"],
            ["campos", "Campos"],
            ["pestanas", "Pestañas"],
            ["tarjetas", "Tarjetas"],
            ["marco", "Marco"],
            ["halo", "Halo"],
            ["acordeon", "Acordeón"],
            ["iconos", "Íconos"],
            ["formulario", "Formulario"],
            ["movimiento", "Movimiento"],
          ].map(([id, nombre]) => (
            <a key={id} href={`#${id}`} className="chip">
              {nombre}
            </a>
          ))}
        </nav>
      </Seccion>

      <div className="contenedor pb-[var(--spacing-96)]">
        <Bloque
          id="dashboard"
          titulo="Dashboard: composición de referencia"
          texto="Barra superior (56px, translúcida: logo y sección, buscador con «/», «+», campana con contador, avatar con menú de perfil) + menú lateral (activo con relleno sutil, «Pronto» donde no hay nada, tus agentes con su estado) + tarjetas (bienvenida, actividad, uso del plan). Todo dentro de .producto. En celular el lateral vive en el cajón (botón de barra lateral). Datos de ejemplo."
        >
          <div className="grid gap-[var(--spacing-32)]">
            <DemoDashboard tema="oscuro" />
            <DemoDashboard tema="claro" />
          </div>
        </Bloque>

        <Bloque
          id="color"
          titulo="Color"
          texto="Tokens semánticos (--c-*): cambian solos entre modos. Los paneles usan data-tema para verse lado a lado. El azul de acción solo va en el botón principal (uno por pantalla); el violeta es marca, nunca botón. Abajo, los mismos --c-* dentro de .producto (el dashboard)."
        >
          <div className="grid gap-[var(--spacing-24)] lg:grid-cols-2">
            <Paleta tema="oscuro" />
            <Paleta tema="claro" />
            <Paleta tema="oscuro" producto />
            <Paleta tema="claro" producto />
          </div>
        </Bloque>

        <Bloque id="tipografia" titulo="Tipografía" texto="Mona Sans (variable) y Mona Sans Mono. Nunca peso 700. Títulos con text-wrap: balance; párrafos con pretty.">
          <ul className="flex flex-col">
            {TIPOS.map((t) => (
              <li key={t.clase} className="grid gap-[var(--spacing-8)] border-t border-borde py-[var(--spacing-20)] first:border-t-0 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-[var(--spacing-32)]">
                <div>
                  <p className="t-mono text-tinta">.{t.clase}</p>
                  <p className="t-caption">{t.spec}</p>
                </div>
                <p className={t.clase}>{t.ejemplo}</p>
              </li>
            ))}
          </ul>
          <Muestra etiqueta="Producto (dentro de .producto): pila del sistema, números tabulares con .cifras" className="mt-[var(--spacing-40)]">
            <DosModos>
              <ul className="flex flex-col gap-[var(--spacing-16)]">
                {TIPOS_APP.map((t) => (
                  <li key={t.clase}>
                    <p className={t.clase}>{t.ejemplo}</p>
                    <p className="t-app-etiqueta mt-[var(--spacing-4)] !text-terciario">
                      .{t.clase} · {t.spec}
                    </p>
                  </li>
                ))}
                <li className="t-app-titulo cifras">320 / 500 · 10:44 · 1,280</li>
              </ul>
            </DosModos>
          </Muestra>
        </Bloque>

        <Bloque id="espacios" titulo="Espacios y radios" texto="Base de 4px. Entre secciones 64–96px (--espacio-seccion), entre elementos 16–24px, padding de tarjeta 24px, contenido máx. 1200px.">
          <ul className="flex flex-col gap-[var(--spacing-8)]">
            {ESPACIOS.map((e) => (
              <li key={e} className="flex items-center gap-[var(--spacing-16)]">
                <span className="t-mono w-28 shrink-0 text-tinta">--spacing-{e}</span>
                <span className="h-3 rounded-panel bg-[var(--c-enlace)]" style={{ width: e * 3 }} aria-hidden="true" />
                <span className="t-caption">{e}px</span>
              </li>
            ))}
          </ul>
          <ul className="mt-[var(--spacing-40)] grid grid-cols-2 gap-[var(--spacing-16)] sm:grid-cols-4 lg:grid-cols-7">
            {RADIOS.map((r) => (
              <li key={r.token}>
                <span
                  className="block h-20 border border-borde-fuerte bg-[var(--c-vidrio)]"
                  style={{ borderRadius: `var(${r.token})` }}
                  aria-hidden="true"
                />
                <p className="t-mono mt-[var(--spacing-8)] !text-[12px] text-tinta">{r.token}</p>
                <p className="t-caption">{r.uso}</p>
              </li>
            ))}
          </ul>
          <Muestra etiqueta="Dashboard: radios, sombra solo para lo que flota" className="mt-[var(--spacing-40)]">
            <ul className="grid grid-cols-2 gap-[var(--spacing-16)] sm:grid-cols-3 lg:grid-cols-7">
              {RADIOS_APP.map((r) => (
                <li key={r.token}>
                  <span
                    className="block h-20 border border-borde-fuerte bg-[var(--c-vidrio)]"
                    style={{ borderRadius: `var(${r.token})` }}
                    aria-hidden="true"
                  />
                  <p className="t-mono mt-[var(--spacing-8)] !text-[12px] text-tinta">{r.token}</p>
                  <p className="t-caption">{r.uso}</p>
                </li>
              ))}
              <li>
                <span className="block h-20 rounded-menu border border-borde-fuerte bg-superficie shadow-flotante" aria-hidden="true" />
                <p className="t-mono mt-[var(--spacing-8)] !text-[12px] text-tinta">--sombra-flotante</p>
                <p className="t-caption">Menús, cajón, modal</p>
              </li>
            </ul>
          </Muestra>
        </Bloque>

        <Bloque
          id="botones"
          titulo="Botones"
          texto="<Boton variante=… tam=… cargando deshabilitado href>. Pasa el cursor para ver el hover y usa Tab para ver el foco. Presionado: scale(0.97)."
        >
          <div className="grid gap-[var(--spacing-32)] md:grid-cols-3">
            <Muestra etiqueta="Principal">
              <div className="flex flex-col items-start gap-[var(--spacing-12)]">
                <Boton>Únete a la lista</Boton>
                <Boton flecha href="/entrar">
                  Empieza gratis
                </Boton>
                <Boton cargando>Anotando…</Boton>
                <Boton disabled>Deshabilitado</Boton>
              </div>
            </Muestra>
            <Muestra etiqueta="Sutil">
              <div className="flex flex-col items-start gap-[var(--spacing-12)]">
                <Boton variante="sutil">Prueba los agentes</Boton>
                <Boton variante="sutil" icono={<Icono nombre="mensaje" tam={16} />}>
                  Háblale a Lola
                </Boton>
                <Boton variante="sutil" cargando>
                  Cargando
                </Boton>
                <Boton variante="sutil" disabled>
                  Deshabilitado
                </Boton>
              </div>
            </Muestra>
            <Muestra etiqueta="Fantasma">
              <div className="flex flex-col items-start gap-[var(--spacing-12)]">
                <Boton variante="fantasma">Entrar</Boton>
                <Boton variante="fantasma" flecha href="/agentes">
                  Conoce a los agentes
                </Boton>
                <Boton variante="fantasma" href="/precios" deshabilitado>
                  Enlace deshabilitado
                </Boton>
                <Boton variante="fantasma" disabled>
                  Deshabilitado
                </Boton>
              </div>
            </Muestra>
          </div>
          <Muestra etiqueta="Tamaños: compacto · chico · normal · grande" className="mt-[var(--spacing-32)]">
            <div className="flex flex-wrap items-center gap-[var(--spacing-12)]">
              <Boton tam="compacto" variante="fantasma">
                Compacto 32px
              </Boton>
              <Boton tam="chico" variante="fantasma">
                Chico 36px
              </Boton>
              <Boton variante="fantasma">Normal 40px</Boton>
              <Boton tam="grande" variante="fantasma">
                Grande 48px
              </Boton>
            </div>
          </Muestra>
          <Muestra etiqueta="Dentro de .producto: radio 8px, sutil neutro con contorno, fantasma sin borde, compacto 32px" className="mt-[var(--spacing-32)]">
            <DosModos>
              <div className="flex flex-wrap items-center gap-[var(--spacing-8)]">
                <Boton tam="compacto">Nueva conversación</Boton>
                <Boton tam="compacto" variante="sutil" icono={<Icono nombre="calendario" />}>
                  Agendar cita
                </Boton>
                <Boton tam="compacto" variante="fantasma">
                  Ver todo
                </Boton>
                <Boton tam="compacto" cargando>
                  Enviando
                </Boton>
                <Boton tam="compacto" variante="sutil" disabled>
                  Deshabilitado
                </Boton>
              </div>
              <div className="mt-[var(--spacing-16)]">
                <DemoBotonesIcono />
              </div>
            </DosModos>
          </Muestra>
        </Bloque>

        <Bloque
          id="campos"
          titulo="Campos"
          texto="<Campo> y <CampoCorreo>: etiqueta flotante, radio 8px, 16px (sin zoom en iPhone), error con role=alert ligado por aria-describedby."
        >
          <div className="grid gap-[var(--spacing-24)] md:grid-cols-2">
            <Muestra etiqueta="Vacío">
              <CampoCorreo name="m-vacio" />
            </Muestra>
            <Muestra etiqueta="Con valor">
              <CampoCorreo name="m-valor" defaultValue="recepcion@clinicaluna.mx" />
            </Muestra>
            <Muestra etiqueta="Con placeholder y ayuda">
              <Campo etiqueta="Nombre de tu negocio" name="m-negocio" placeholder="Ej. Estética Coral" ayuda="Así te llamarán tus agentes." />
            </Muestra>
            <Muestra etiqueta="Error">
              <CampoCorreo name="m-error" defaultValue="recepcion@" error="Revisa tu correo: parece que le falta algo." />
            </Muestra>
            <Muestra etiqueta="Deshabilitado">
              <CampoCorreo name="m-desh" defaultValue="hola@negocio.mx" disabled />
            </Muestra>
            <Muestra etiqueta="Multilínea con contador">
              <Campo multilinea etiqueta="Tu mensaje" name="m-mensaje" maxLength={500} defaultValue="" rows={3} />
            </Muestra>
          </div>
        </Bloque>

        <Bloque
          id="pestanas"
          titulo="Pestañas en píldora"
          texto="<Pestanas>: radio 60px, la activa con relleno que se desliza (0.2s). Flechas, Inicio y Fin cambian de pestaña. En celular la fila se desliza de lado."
        >
          <Pestanas etiqueta="Agentes (muestrario)" pestanas={pestanasAgentes} alineacion="izquierda" />
          <Muestra etiqueta="Sin adorno, una deshabilitada" className="mt-[var(--spacing-40)]">
            <Pestanas
              etiqueta="Tipos de negocio (muestrario)"
              alineacion="izquierda"
              pestanas={[
                { id: "clinicas", etiqueta: "Clínicas", contenido: <p className="t-cuerpo">Clínicas: pestaña activa.</p> },
                { id: "esteticas", etiqueta: "Estéticas", contenido: <p className="t-cuerpo">Estéticas.</p> },
                { id: "consultorios", etiqueta: "Consultorios", contenido: <p className="t-cuerpo">Consultorios.</p> },
                { id: "pronto", etiqueta: "Muy pronto", deshabilitada: true, contenido: null },
              ]}
            />
          </Muestra>
        </Bloque>

        <Bloque
          id="menu"
          titulo="Menú desplegable"
          texto="<Menu>: disparador (icono, avatar, botón), panel con radio 14px, borde, sombra suave y vidrio. Entra con opacidad + escala 0.98→1 + 4px (0.2s) y sale en 0.15s. Clic afuera o Esc lo cierran (el foco vuelve al disparador); ↓ ↑ Inicio Fin y la primera letra para moverse. Aquí se ven abiertos."
        >
          <DosModos alto="460px">
            <DemoMenus />
          </DosModos>
        </Bloque>

        <Bloque
          id="avatar"
          titulo="Avatar y punto de estado"
          texto="<Avatar nombre src tam estado>: foto o iniciales, tamaños 20 · 24 · 28 · 32 · 40 · 64, punto de estado con anillo. <PuntoEstado tono etiqueta mostrarEtiqueta pulso>: el color nunca va solo."
        >
          <DosModos>
            <div className="flex flex-wrap items-end gap-[var(--spacing-16)]">
              {([20, 24, 28, 32, 40, 64] as const).map((t) => (
                <div key={t} className="flex flex-col items-center gap-[var(--spacing-8)]">
                  <Avatar nombre="Ana López" tam={t} estado={t >= 32 ? "exito" : undefined} anillo="var(--c-app-fondo)" />
                  <span className="t-app-etiqueta cifras">{t}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-[var(--spacing-8)]">
                <Avatar nombre="Lola" tam={40} estado="azul" anillo="var(--c-app-fondo)">
                  <Personaje agente="lola" avatar />
                </Avatar>
                <span className="t-app-etiqueta">agente</span>
              </div>
            </div>
            <ul className="mt-[var(--spacing-24)] flex flex-col gap-[var(--spacing-12)]">
              <li>
                <PuntoEstado tono="exito" etiqueta="Activa" mostrarEtiqueta />
              </li>
              <li>
                <PuntoEstado tono="azul" etiqueta="Trabajando ahora (late despacio)" mostrarEtiqueta pulso />
              </li>
              <li>
                <PuntoEstado tono="atencion" etiqueta="Espera tu visto bueno" mostrarEtiqueta />
              </li>
              <li>
                <PuntoEstado tono="error" etiqueta="Con un problema" mostrarEtiqueta />
              </li>
              <li>
                <PuntoEstado tono="neutro" etiqueta="En pausa" mostrarEtiqueta />
              </li>
            </ul>
          </DosModos>
        </Bloque>

        <Bloque
          id="insignias"
          titulo="Insignias y teclas"
          texto="<Insignia tono contador solida punto conPunto sobre>: contadores y estados (neutra, azul, éxito, atención, error) y «Pronto» para lo que todavía no existe. <Kbd> para atajos."
        >
          <DosModos>
            <div className="flex flex-wrap items-center gap-[var(--spacing-8)]">
              <Insignia>Borrador</Insignia>
              <Insignia tono="azul">Nuevo</Insignia>
              <Insignia tono="exito" conPunto>
                Conectado
              </Insignia>
              <Insignia tono="atencion" conPunto>
                Espera tu visto bueno
              </Insignia>
              <Insignia tono="error" conPunto>
                Falló el envío
              </Insignia>
              <Insignia tono="pronto">Pronto</Insignia>
            </div>
            <div className="mt-[var(--spacing-16)] flex flex-wrap items-center gap-[var(--spacing-8)]">
              <Insignia contador={2} etiqueta="2 sin leer" />
              <Insignia contador={12} tono="azul" etiqueta="12 sin leer" />
              <Insignia contador={3} solida etiqueta="3 avisos" />
              <Insignia contador={240} solida etiqueta="Más de 99 avisos" />
              <Insignia punto etiqueta="Hay algo nuevo" />
            </div>
            <div className="mt-[var(--spacing-16)] flex flex-wrap items-center gap-[var(--spacing-12)] text-grafito">
              <span className="flex items-center gap-[var(--spacing-8)]">
                Buscar <Kbd>/</Kbd>
              </span>
              <span className="flex items-center gap-[var(--spacing-8)]">
                Cerrar <Kbd>Esc</Kbd>
              </span>
              <span className="flex items-center gap-[var(--spacing-8)]">
                Comandos <Kbd teclas={["Ctrl", "K"]} />
              </span>
            </div>
          </DosModos>
        </Bloque>

        <Bloque
          id="buscador"
          titulo="Buscador redondo"
          texto="<Buscador etiqueta placeholder tam atajo>: píldora con lupa, tinte sutil; al enfocar, superficie con anillo azul. «/» lo enfoca desde cualquier parte (uno por página), Esc borra o suelta, ✕ borra. 16px en táctil (sin zoom), 14px con mouse."
        >
          <DosModos>
            <div className="grid gap-[var(--spacing-16)]">
              <Buscador etiqueta="Buscar (muestra normal)" placeholder="Busca citas, clientes o chats" atajo={false} />
              <Buscador etiqueta="Buscar (muestra compacta)" placeholder="Compacto 32px" tam="compacto" atajo={false} />
              <Buscador etiqueta="Buscar (muestra con texto)" inicial="Mariana" atajo={false} />
              <Buscador etiqueta="Buscar (muestra deshabilitada)" placeholder="Deshabilitado" deshabilitado atajo={false} />
            </div>
          </DosModos>
        </Bloque>

        <Bloque
          id="cajon"
          titulo="Cajón lateral (celular)"
          texto="<Cajon abierto alCerrar titulo|cabeza lado>: <dialog> modal: queda encima de todo, foco atrapado y devuelto, scroll bloqueado. Se cierra con Esc, tocando el velo, con ✕ o deslizándolo con el dedo. Entra en 0.4s y sale en 0.3s."
        >
          <div data-tema="oscuro" className="producto inline-block rounded-panel-app border border-borde p-[var(--spacing-16)]">
            <DemoCajon />
          </div>
        </Bloque>

        <Bloque
          id="progreso"
          titulo="Barra de progreso"
          texto="<BarraProgreso etiqueta valor max unidad detalle>: role=progressbar con valor leído en palabras. Azul; ámbar desde el 80%; rojo al tope. El relleno se corre con transform (0.4s)."
        >
          <DosModos>
            <DemoProgreso />
          </DosModos>
        </Bloque>

        <Bloque
          id="escribiendo"
          titulo="Escribiendo…"
          texto="<Escribiendo quien variante conTexto>: el indicador compartido del chat y de la portada. Solo opacidad; con movimiento reducido sigue, más lento."
        >
          <DosModos>
            <div className="flex flex-col items-start gap-[var(--spacing-16)]">
              <Escribiendo quien="Lola" variante="burbuja" />
              <Escribiendo quien="Clara" conTexto />
              <span className="flex items-center gap-[var(--spacing-8)] text-grafito">
                Víctor <Escribiendo quien="Víctor" />
              </span>
            </div>
          </DosModos>
        </Bloque>

        <Bloque id="tarjetas" titulo="Tarjetas de vidrio" texto="<TarjetaVidrio nivel destacada relleno>. Sin sombras: la elevación la hacen la translucidez y el borde.">
          <div className="grid gap-[var(--spacing-24)] md:grid-cols-2 lg:grid-cols-4">
            <TarjetaVidrio>
              <Etiqueta>Normal · 0.06</Etiqueta>
              <p className="t-editorial mt-[var(--spacing-8)]">La tarjeta de siempre.</p>
            </TarjetaVidrio>
            <TarjetaVidrio nivel="fuerte">
              <Etiqueta>Fuerte · 0.1</Etiqueta>
              <p className="t-editorial mt-[var(--spacing-8)]">Un poco más presente.</p>
            </TarjetaVidrio>
            <TarjetaVidrio nivel="frost">
              <Etiqueta>Frost · 0.2</Etiqueta>
              <p className="t-editorial mt-[var(--spacing-8)]">Para ventanas flotantes.</p>
            </TarjetaVidrio>
            <TarjetaVidrio destacada>
              <Etiqueta tono="cielo">Destacada · #8c93fb</Etiqueta>
              <p className="t-editorial mt-[var(--spacing-8)]">Plan recomendado o elegido.</p>
            </TarjetaVidrio>
          </div>
        </Bloque>

        <Bloque id="marco" titulo="Marco de navegador" texto="<MarcoNavegador pestanas direccion relleno>. Radio 8px por fuera; paneles internos con .marco__panel (6px).">
          <MarcoNavegador
            titulo="Ejemplo del marco"
            direccion="atendel.mx/panel/chat"
            relleno
            pestanas={[
              { etiqueta: "Lola · WhatsApp", adorno: <Personaje agente="lola" avatar />, activa: true },
              { etiqueta: "Clara · Correo", adorno: <Personaje agente="clara" avatar /> },
              { etiqueta: "Iris · Oficina", adorno: <Personaje agente="iris" avatar /> },
            ]}
          >
            <div className="grid gap-[var(--spacing-16)] md:grid-cols-[240px_minmax(0,1fr)]">
              <div className="marco__panel p-[var(--spacing-12)]">
                <Etiqueta tono="tenue">Chats</Etiqueta>
                <p className="t-editorial mt-[var(--spacing-8)]">Mariana</p>
                <p className="t-chico">16:30 porfa</p>
              </div>
              <div className="marco__panel p-[var(--spacing-16)]">
                <Etiqueta tono="cielo">Lola · WhatsApp · 10:44</Etiqueta>
                <p className="t-editorial mt-[var(--spacing-8)]">
                  Listo, te esperamos el jueves a las 16:30. Un día antes te mando un recordatorio.
                </p>
                <p className="t-chico mt-[var(--spacing-12)]">Cita creada: jueves 16:30 · limpieza facial</p>
              </div>
            </div>
          </MarcoNavegador>
        </Bloque>

        <Bloque id="halo" titulo="Halo y degradados" texto="<Halo variante=halo|haz|rastro>: solo atmósfera, siempre difuminados, opacidad máx. 0.6 (más suave en claro). Dentro de un padre con .con-halo.">
          <div className="grid gap-[var(--spacing-24)] md:grid-cols-3">
            {(["halo", "haz", "rastro"] as const).map((v) => (
              <div key={v} className="con-halo grid h-56 place-items-center overflow-hidden rounded-tarjeta border border-borde bg-portada">
                <Halo variante={v} ancho="120%" />
                <Etiqueta tono="texto">{v}</Etiqueta>
              </div>
            ))}
          </div>
        </Bloque>

        <Bloque id="acordeon" titulo="Acordeón" texto="<Acordeon items unoALaVez abiertos>: grid-template-rows 0fr → 1fr (0.4s), chevron que gira, aria-expanded.">
          <div className="max-w-[760px]">
            <Acordeon
              abiertos={["abierta"]}
              items={[
                { id: "abierta", titulo: "Pregunta abierta", contenido: <p>El panel está abierto: se ve la respuesta y el chevron apunta hacia arriba.</p> },
                { id: "cerrada", titulo: "Pregunta cerrada", contenido: <p>Esta respuesta aparece al abrir la pregunta.</p> },
              ]}
            />
          </div>
        </Bloque>

        <Bloque id="iconos" titulo="Íconos de contorno" texto="<Icono nombre tono tam>: trazo de 1.75px, en gris perla (cuerpo) o azul cielo. La base 4b agregó los del dashboard y el chat (campana, buscar, inicio, conversaciones, agentes, clientes, gráfica, ajustes, ayuda, perfil, persona, facturación, negocio, cerrar sesión, flechas a la izquierda, pausa, reproducir, repetir, copiar, basura, barra lateral, estrella, fijar, filtro, puntos, check doble, rayo).">
          <ul className="grid grid-cols-3 gap-[var(--spacing-16)] sm:grid-cols-6 lg:grid-cols-11">
            {NOMBRES_ICONOS.map((n, i) => (
              <li key={n} className="flex flex-col items-center gap-[var(--spacing-8)] text-center">
                <Icono nombre={n} tam={24} tono={i % 2 ? "cielo" : "cuerpo"} />
                <span className="t-caption">{n}</span>
              </li>
            ))}
          </ul>
        </Bloque>

        <Bloque id="formulario" titulo="Formulario de lista de espera" texto="<FormularioLista>: vacío, escribiendo, enviando, enviado y error. En celular se apila. Envía a /api/lista.">
          <FormularioLista />
        </Bloque>

        <Bloque id="movimiento" titulo="Movimiento" texto="Solo transform y opacity. Con movimiento reducido, solo opacidad.">
          <ul className="grid gap-[var(--spacing-16)] sm:grid-cols-2">
            {[
              ["--dur-micro", "0.2s · microinteracciones (hover, presión, pestañas)"],
              ["--dur-grande", "0.4s · cambios grandes (acordeón, cambio de modo)"],
              ["--ease", "cubic-bezier(0.25, 0.1, 0.25, 1)"],
              ["--ease-entrada", "cubic-bezier(0.16, 1, 0.3, 1) · entradas y revelados"],
              ["--dur-salida", "0.15s · lo que se cierra (menús) sale más rápido"],
              ["--dur-respiro", "12s · atmósfera lenta (respiro del halo)"],
            ].map(([t, d]) => (
              <li key={t} className="marco__panel p-[var(--spacing-16)]">
                <p className="t-mono text-tinta">{t}</p>
                <p className="t-chico">{d}</p>
              </li>
            ))}
          </ul>
        </Bloque>
      </div>
    </Sitio>
  );
}
