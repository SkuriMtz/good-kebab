"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { ChatDemo } from "@/components/ChatDemo";
import { Avatar } from "@/components/base/Avatar";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import type { ElementoMenu } from "@/components/base/Menu";
import { Pestanas } from "@/components/base/Pestanas";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES } from "@/lib/agentes";
import {
  DEMO_ACTIVIDAD,
  DEMO_ACTIVIDAD_ANTERIOR,
  DEMO_APROBACIONES,
  DEMO_AVISOS,
  DEMO_CITAS,
  DEMO_CONVERSACIONES,
  DEMO_CORREOS,
  DEMO_ESTADOS,
  DEMO_GRUPOS,
  DEMO_NEGOCIO,
  DEMO_SEMANA_AGENTE,
  DEMO_USUARIA,
  type CorreoDemo,
  type Destino,
  type IdPestana,
} from "@/lib/demo-dashboard";
import { PLAN_POR_ID } from "@/lib/planes";
import { Armazon } from "./Armazon";
import { Inicio, LineaTiempo, ListaVistoBueno, type OpcionPedido } from "./Centro";
import { ProximasCitas, TarjetaPlan } from "./Columna";
import { FilaAgente } from "./FilaAgente";
import { nombresAgentes } from "./nombres";
import { EnlaceMas, Hora, Vacio } from "./Piezas";
import { useAhora } from "./tiempo";
import type { ElementoNav, IdVista, ResultadoBusqueda } from "./tipos";

/* =====================================================================
   /pruebalo: el dashboard completo con DATOS DE EJEMPLO de una clínica.
   Se cambia de vista sin recargar (Resumen, Conversaciones, Agentes,
   Correo) y la dirección lo recuerda (#conversaciones, ?con=lola), así
   el botón "atrás" del navegador regresa a la vista anterior.
   Nada aquí llama a la IA: el chat es el guion local de ChatDemo.
   ===================================================================== */

type VistaDemo = Extract<IdVista, "resumen" | "conversaciones" | "agentes" | "correo">;
const VISTAS: VistaDemo[] = ["resumen", "conversaciones", "agentes", "correo"];
const NOMBRE_VISTA: Record<VistaDemo, string> = {
  resumen: "Resumen",
  conversaciones: "Conversaciones",
  agentes: "Agentes",
  correo: "Correo",
};

const PLAN = PLAN_POR_ID[DEMO_NEGOCIO.plan];

function leerDireccion(): { vista: VistaDemo; con: string | null } {
  const h = window.location.hash.replace("#", "") as VistaDemo;
  const con = new URLSearchParams(window.location.search).get("con");
  return { vista: VISTAS.includes(h) ? h : "resumen", con };
}

export function PruebaloDashboard() {
  const ahora = useAhora();
  const [vista, setVista] = useState<VistaDemo>("resumen");
  const [chatCon, setChatCon] = useState<string | null>(null);
  const [pestana, setPestana] = useState<IdPestana>("actividad");
  const [aprobados, setAprobados] = useState<Set<string>>(() => new Set());
  /** Lo que se pidió en la caja del Resumen: el chat de ejemplo lo envía al abrir. */
  const [pedido, setPedido] = useState<{ texto: string; n: number } | null>(null);
  const [avisosLeidos, setAvisosLeidos] = useState(false);
  const [anterior, setAnterior] = useState<"no" | "cargando" | "si">("no");
  const pestanasRef = useRef<HTMLDivElement>(null);
  const temporizador = useRef<number | undefined>(undefined);

  // La dirección manda al entrar (#agentes, ?con=lola) y con atrás/adelante
  useEffect(() => {
    const aplicar = () => {
      const { vista: v, con } = leerDireccion();
      setVista(v);
      setChatCon(con);
      setPedido(null);
    };
    aplicar();
    window.addEventListener("popstate", aplicar);
    return () => {
      window.removeEventListener("popstate", aplicar);
      window.clearTimeout(temporizador.current);
    };
  }, []);

  const ir = useCallback((d: Destino) => {
    const vistaNueva = d.vista as VistaDemo;
    if (!VISTAS.includes(vistaNueva)) return;
    const url = new URL(window.location.href);
    if (d.con) url.searchParams.set("con", d.con);
    else url.searchParams.delete("con");
    url.hash = vistaNueva === "resumen" ? "" : vistaNueva;
    const destino = `${url.pathname}${url.search}${url.hash}`;
    if (destino !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, "", destino);
    setChatCon(d.con ?? null);
    setVista(vistaNueva);
    setPedido(null);
    if (d.pestana) setPestana(d.pestana);
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      if (vistaNueva === "resumen" && d.pestana && pestanasRef.current) {
        pestanasRef.current.scrollIntoView({ block: "start", behavior: quieto ? "auto" : "smooth" });
      } else window.scrollTo({ top: 0 });
    });
  }, []);

  const a = useCallback((d: Destino) => () => ir(d), [ir]);

  /** La caja grande: abre Conversaciones con ese chat y el chat de ejemplo envía el texto (guion local, sin IA). */
  const pedir = useCallback(
    (texto: string, con: string) => {
      ir({ vista: "conversaciones", con });
      setPedido({ texto, n: Date.now() });
    },
    [ir],
  );

  /* ---------- Armazón: navegación, agentes, grupos, menús ---------- */

  const pendientes = DEMO_APROBACIONES.filter((p) => !aprobados.has(p.id)).length;

  const nav: ElementoNav[] = [
    { id: "resumen", etiqueta: "Resumen", icono: "inicio", alElegir: a({ vista: "resumen" }) },
    { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", contador: 3, etiquetaContador: "3 mensajes sin leer", alElegir: a({ vista: "conversaciones" }) },
    { id: "agentes", etiqueta: "Agentes", icono: "agentes", alElegir: a({ vista: "agentes" }) },
    { id: "correo", etiqueta: "Correo", icono: "correo", contador: 1, etiquetaContador: "1 correo urgente", alElegir: a({ vista: "correo" }) },
  ];

  const agentesLateral = IDS_AGENTES.map((id) => ({ id, estado: DEMO_ESTADOS[id], alElegir: a({ vista: "conversaciones", con: id }) }));
  const grupos = DEMO_GRUPOS.map((g) => ({ ...g, alElegir: a({ vista: "conversaciones", con: g.id }) }));

  const crear: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Crear" },
    { id: "conversacion", etiqueta: "Nueva conversación", descripcion: "Con un agente o con un grupo", icono: "mensaje", alElegir: a({ vista: "conversaciones" }) },
    { id: "cita", etiqueta: "Agendar cita", descripcion: "Pídesela a Lola en su chat", icono: "calendario", alElegir: a({ vista: "conversaciones", con: "lola" }) },
    { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Junta a dos o más agentes", icono: "usuarios", alElegir: a({ vista: "conversaciones", con: "recepcion" }) },
    { tipo: "separador" },
    { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
  ];

  const perfil: ElementoMenu[] = [
    { id: "perfil", etiqueta: "Perfil", icono: "perfil", pronto: true },
    { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
    { id: "plan", etiqueta: "Plan y facturación", descripcion: `${PLAN.nombre} (ejemplo)`, icono: "facturacion", href: "/precios" },
    { id: "negocio", etiqueta: "Mi negocio", descripcion: DEMO_NEGOCIO.nombre, icono: "negocio", pronto: true },
  ];

  const avisos = DEMO_AVISOS.map((av) => ({ ...av, leido: avisosLeidos, alElegir: a(av.ir) }));

  const indice: ResultadoBusqueda[] = useMemo(
    () => [
      ...VISTAS.map((v) => ({ id: `v-${v}`, grupo: "Secciones", titulo: NOMBRE_VISTA[v], icono: "inicio" as const, alElegir: () => ir({ vista: v }) })),
      ...AGENTES_INFO.map((ag) => ({
        id: `a-${ag.id}`,
        grupo: "Agentes",
        titulo: ag.nombre,
        detalle: `${ag.area} · ${ag.abarca}`,
        agente: ag.id,
        claves: ag.capacidades.join(" "),
        alElegir: () => ir({ vista: "conversaciones", con: ag.id }),
      })),
      ...DEMO_GRUPOS.map((g) => ({
        id: `g-${g.id}`,
        grupo: "Grupos",
        titulo: g.nombre,
        detalle: nombresAgentes(g.agentes),
        icono: "usuarios" as const,
        alElegir: () => ir({ vista: "conversaciones", con: g.id }),
      })),
      ...DEMO_CONVERSACIONES.map((c) => ({
        id: `c-${c.id}`,
        grupo: "Conversaciones",
        titulo: c.cliente,
        detalle: `${c.canal} · ${c.ultimo}`,
        icono: (c.canal === "Correo" ? "correo" : "mensaje") as "correo" | "mensaje",
        alElegir: () => ir(c.ir),
      })),
      ...DEMO_CITAS.map((c) => ({
        id: `cita-${c.id}`,
        grupo: "Citas de mañana",
        titulo: c.paciente,
        detalle: `${c.hora} · ${c.servicio}`,
        icono: "calendario" as const,
        alElegir: () => ir({ vista: "resumen" }),
      })),
    ],
    [ir],
  );

  const aviso = (
    <div className="dash-demo" role="note">
      <Icono nombre="alerta" tam={16} className="dash-demo__icono" />
      <p className="dash-demo__texto">
        <strong>Datos de ejemplo.</strong>
        <span className="dash-demo__mas"> Una clínica inventada: nada se guarda ni se envía.</span>
      </p>
      <Link href="/entrar" className="dash-enlace dash-enlace--chico">
        Probarlo de verdad
        <Icono nombre="flecha" tam={16} />
      </Link>
    </div>
  );

  return (
    <Armazon
      seccion={NOMBRE_VISTA[vista]}
      inicio={{ alElegir: a({ vista: "resumen" }) }}
      aviso={aviso}
      nav={nav}
      activa={vista}
      agentes={agentesLateral}
      accionAgentes={
        <button type="button" className="dash-enlace dash-enlace--chico" onClick={a({ vista: "agentes" })}>
          Ver todos
        </button>
      }
      grupos={grupos}
      accionGrupos={
        <Boton variante="sutil" tam="compacto" icono={<Icono nombre="mas" tam={16} />} onClick={a({ vista: "conversaciones", con: "recepcion" })} className="dash-nuevo">
          Nuevo
        </Boton>
      }
      indice={indice}
      crear={crear}
      avisos={avisos}
      alLeerAvisos={() => setAvisosLeidos(true)}
      ahora={ahora}
      usuario={DEMO_USUARIA}
      perfil={perfil}
      salir={{ id: "salir", etiqueta: "Salir de la demostración", icono: "cerrar-sesion", href: "/" }}
      completo={vista === "conversaciones"}
    >
      <div key={vista} className="dash-entra">
        {vista === "resumen" ? (
          <Resumen
            ahora={ahora}
            ir={ir}
            pedir={pedir}
            pestana={pestana}
            setPestana={setPestana}
            pestanasRef={pestanasRef}
            aprobados={aprobados}
            setAprobados={setAprobados}
            pendientes={pendientes}
            anterior={anterior}
            verAnterior={() => {
              setAnterior("cargando");
              temporizador.current = window.setTimeout(() => setAnterior("si"), 700);
            }}
          />
        ) : null}
        {vista === "conversaciones" ? <VistaConversaciones chatCon={chatCon} pedido={pedido} /> : null}
        {vista === "agentes" ? <VistaAgentes ir={ir} /> : null}
        {vista === "correo" ? <VistaCorreo ahora={ahora} ir={ir} /> : null}
      </div>
    </Armazon>
  );
}

/* =====================================================================
   RESUMEN
   ===================================================================== */

/** A quién se le puede pedir algo en la caja: el grupo Recepción o cada agente (los chats de ejemplo). */
const OPCIONES: OpcionPedido[] = [
  { id: "recepcion", nombre: "Recepción", detalle: "El grupo de Lola y Víctor", agentes: ["lola", "victor"] },
  ...AGENTES_INFO.map((ag) => ({ id: ag.id, nombre: ag.nombre, detalle: ag.area, agentes: [ag.id] })),
];

function Resumen({
  ahora,
  ir,
  pedir,
  pestana,
  setPestana,
  pestanasRef,
  aprobados,
  setAprobados,
  pendientes,
  anterior,
  verAnterior,
}: {
  ahora: Date | null;
  ir: (d: Destino) => void;
  pedir: (texto: string, con: string) => void;
  pestana: IdPestana;
  setPestana: (p: IdPestana) => void;
  pestanasRef: RefObject<HTMLDivElement>;
  aprobados: Set<string>;
  setAprobados: Dispatch<SetStateAction<Set<string>>>;
  pendientes: number;
  anterior: "no" | "cargando" | "si";
  verAnterior: () => void;
}) {
  const idActividad = useId().replace(/:/g, "");
  // Menos insignias: el texto del evento ya dice lo mismo
  const conAccion = <T extends { ir?: Destino; accion?: { etiqueta: string } }>(e: T) => ({
    ...e,
    insignia: undefined,
    accion: e.accion && e.ir ? { ...e.accion, alElegir: () => ir(e.ir as Destino) } : undefined,
  });
  const eventos = [...DEMO_ACTIVIDAD, ...(anterior === "si" ? DEMO_ACTIVIDAD_ANTERIOR : [])].map(conAccion);

  const pieActividad =
    anterior === "si" ? (
      <p className="dash-feed__fin">Es toda la actividad de ejemplo de esta semana.</p>
    ) : (
      <div className="dash-feed__mas">
        <Boton variante="sutil" tam="compacto" cargando={anterior === "cargando"} onClick={verAnterior}>
          {anterior === "cargando" ? "Cargando" : "Ver actividad anterior"}
        </Boton>
      </div>
    );

  const aprobar = (id: string) => setAprobados((s) => new Set(s).add(id));
  const deshacer = (id: string) =>
    setAprobados((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });

  return (
    <div className="dash-pagina dash-rejilla">
      <div className="dash-centro">
        <Inicio
          ahora={ahora}
          nombre={DEMO_USUARIA.nombre.split(" ")[0]}
          opciones={OPCIONES}
          alPedir={pedir}
          atajos={[
            { id: "cita", etiqueta: "Agendar cita", icono: "calendario", alElegir: () => ir({ vista: "conversaciones", con: "lola" }) },
            { id: "correo", etiqueta: "Resumir un correo", icono: "correo", alElegir: () => ir({ vista: "correo" }) },
            { id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios", alElegir: () => ir({ vista: "conversaciones", con: "recepcion" }) },
            {
              id: "citas",
              etiqueta: "Ver citas",
              icono: "reloj",
              alElegir: () => {
                const el = document.getElementById("citas-de-manana");
                el?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
                el?.focus({ preventScroll: true });
              },
            },
          ]}
        />

        <section className="dash-bloque dash-actividad" aria-labelledby={`${idActividad}-titulo`} ref={pestanasRef}>
          <h2 id={`${idActividad}-titulo`} className="sr-only">
            Actividad de tu equipo
          </h2>
          <Pestanas
            etiqueta="Actividad de tu equipo"
            alineacion="izquierda"
            activa={pestana === "destacados" ? "actividad" : pestana}
            alCambiar={(id) => setPestana(id as IdPestana)}
            classNamePanel="dash-actividad__panel"
            pestanas={[
              {
                id: "actividad",
                etiqueta: "Actividad",
                contenido: <LineaTiempo eventos={eventos} ahora={ahora} pie={pieActividad} />,
              },
              {
                id: "visto-bueno",
                etiqueta: (
                  <span className="dash-pestana">
                    Espera tu visto bueno
                    {pendientes ? <Insignia contador={pendientes} tono="atencion" etiqueta={`${pendientes} pendientes`} /> : null}
                  </span>
                ),
                contenido: pendientes ? (
                  <ListaVistoBueno
                    pendientes={DEMO_APROBACIONES.map((p) => ({ ...p, editar: { alElegir: () => ir(p.ir) } }))}
                    aprobados={aprobados}
                    alAprobar={aprobar}
                    alDeshacer={deshacer}
                    ahora={ahora}
                  />
                ) : (
                  <Vacio
                    icono="check-circulo"
                    titulo="Todo al día"
                    texto="Nada espera tu visto bueno. Lo que salga a tu nombre aparece aquí antes de enviarse."
                    accion={
                      <button type="button" className="dash-enlace" onClick={() => setAprobados(new Set())}>
                        Volver a ver los ejemplos
                      </button>
                    }
                  />
                ),
              },
            ]}
          />
        </section>
      </div>

      <aside className="dash-derecha" aria-label="Tu plan y tus citas">
        <TarjetaPlan
          negocio={DEMO_NEGOCIO.nombre}
          plan={PLAN}
          usados={DEMO_NEGOCIO.mensajesUsados}
          ahora={ahora}
          accion={<EnlaceMas accion={{ href: "/precios" }}>Ver los planes</EnlaceMas>}
        />
        <div id="citas-de-manana" tabIndex={-1} className="dash-ancla">
          <ProximasCitas titulo="Citas de mañana" resumen="12 · 10 confirmadas" citas={DEMO_CITAS} />
        </div>
      </aside>
    </div>
  );
}

/* =====================================================================
   CONVERSACIONES: el chat de ejemplo (ChatDemo, del Grupo 2) dentro del
   armazón, a lo alto de la pantalla. Se monta de nuevo al pedir otro chat
   (?con=lola) para que abra directo en esa conversación.
   ===================================================================== */

function VistaConversaciones({ chatCon, pedido }: { chatCon: string | null; pedido: { texto: string; n: number } | null }) {
  return (
    <div className="dash-vista-chat">
      <header className="dash-vista-chat__cabeza">
        <div>
          <h1 className="t-app-titulo">Conversaciones</h1>
          <p className="dash-vista__texto">Las respuestas son de ejemplo: aquí no se llama a la IA.</p>
        </div>
      </header>
      <div className="dash-vista-chat__marco">
        <ChatDemo key={`${chatCon ?? "inicio"}-${pedido?.n ?? 0}`} pedido={pedido?.texto} />
      </div>
    </div>
  );
}

/* =====================================================================
   AGENTES: la lista del equipo (como la lista de repositorios).
   ===================================================================== */

function VistaAgentes({ ir }: { ir: (d: Destino) => void }) {
  return (
    <div className="dash-pagina dash-vista">
      <header className="dash-vista__cabeza">
        <div>
          <h1 className="t-app-titulo-grande">Agentes</h1>
          <p className="dash-vista__texto">
            Tu equipo en {DEMO_NEGOCIO.nombre}. Con {PLAN.nombre} trabajan los cuatro; cada uno se encarga de un área y se pasan el trabajo entre ellos.
          </p>
        </div>
        <Insignia>Datos de ejemplo</Insignia>
      </header>
      <ul className="dash-lista dash-lista--borde dash-agentes">
        {IDS_AGENTES.map((id) => (
          <FilaAgente
            key={id}
            id={id}
            insignias={
              <Insignia tono="exito" conPunto>
                En tu equipo
              </Insignia>
            }
            estado={
              <>
                <PuntoEstado tono={DEMO_ESTADOS[id].tono} etiqueta={DEMO_ESTADOS[id].etiqueta} mostrarEtiqueta pulso={DEMO_ESTADOS[id].pulso} />
                {DEMO_SEMANA_AGENTE[id].map((m) => (
                  <span key={m.texto} className="dash-fijado__dato">
                    <Icono nombre={m.icono} tam={16} />
                    {m.texto} esta semana
                  </span>
                ))}
              </>
            }
            acciones={
              <Boton variante="sutil" tam="compacto" icono={<Icono nombre="mensaje" tam={16} />} onClick={() => ir({ vista: "conversaciones", con: id })}>
                Hablar con {AGENTE_POR_ID[id].nombre}
              </Boton>
            }
          />
        ))}
      </ul>
    </div>
  );
}

/* =====================================================================
   CORREO: lo que Clara leyó hoy, por urgencia (como la bandeja de avisos).
   ===================================================================== */

const PRIORIDADES: { id: CorreoDemo["prioridad"]; titulo: string; insignia?: { tono: "error" | "atencion" | "neutra"; texto: string } }[] = [
  { id: "urgente", titulo: "Urgente", insignia: { tono: "error", texto: "Urgente" } },
  { id: "hoy", titulo: "Para hoy", insignia: { tono: "atencion", texto: "Hoy" } },
  { id: "semana", titulo: "Esta semana", insignia: { tono: "neutra", texto: "Esta semana" } },
  { id: "sin-accion", titulo: "No necesitan nada" },
];

function VistaCorreo({ ahora, ir }: { ahora: Date | null; ir: (d: Destino) => void }) {
  return (
    <div className="dash-pagina dash-vista">
      <header className="dash-vista__cabeza">
        <div>
          <h1 className="t-app-titulo-grande">Correo</h1>
          <p className="dash-vista__texto">
            Clara leyó 23 correos hoy y los ordenó por urgencia. En tu panel lee tu Gmail de verdad, solo lectura: nunca envía ni borra nada sin ti.
          </p>
        </div>
        <Insignia>Datos de ejemplo</Insignia>
      </header>

      {PRIORIDADES.map((p) => {
        const correos = DEMO_CORREOS.filter((c) => c.prioridad === p.id);
        if (!correos.length) return null;
        return (
          <section key={p.id} className="dash-bloque" aria-label={p.titulo}>
            <h2 className="dash-grupo-titulo">
              {p.titulo}
              <span className="dash-grupo-titulo__cuenta cifras">{p.id === "sin-accion" ? 20 : correos.length}</span>
            </h2>
            <ul className="dash-lista dash-lista--borde">
              {correos.map((c) => (
                <li key={c.id} className="dash-correo">
                  {c.prioridad === "sin-accion" ? (
                    <Avatar nombre={c.remitente} tam={32}>
                      <Icono nombre="correo" tam={16} />
                    </Avatar>
                  ) : (
                    <Avatar nombre={c.remitente} tam={32} />
                  )}
                  <div className="dash-correo__cuerpo">
                    <p className="dash-correo__linea">
                      <span className="dash-correo__remitente">{c.remitente}</span>
                      <span className="dash-correo__asunto">{c.asunto}</span>
                    </p>
                    <p className="dash-correo__resumen">{c.resumen}</p>
                    {c.accion ? (
                      <p className="dash-correo__accion">
                        <Icono nombre="flecha" tam={16} />
                        {c.accion}
                      </p>
                    ) : null}
                  </div>
                  <div className="dash-correo__fin">
                    <Hora item={c} ahora={ahora} />
                    {p.insignia ? (
                      <Insignia tono={p.insignia.tono} conPunto>
                        {p.insignia.texto}
                      </Insignia>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <div className="dash-correo__chat">
        <p>¿Prefieres que Clara te lo resuma en el chat? Escríbele /resumir-correos.</p>
        <Boton variante="sutil" tam="compacto" icono={<Icono nombre="mensaje" tam={16} />} onClick={() => ir({ vista: "conversaciones", con: "clara" })}>
          Hablar con Clara
        </Boton>
      </div>
    </div>
  );
}
