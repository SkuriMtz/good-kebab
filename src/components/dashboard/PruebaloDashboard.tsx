"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ChatDemo } from "@/components/ChatDemo";
import { Avatar } from "@/components/base/Avatar";
import { Boton, BotonIcono } from "@/components/base/Boton";
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
import { ActividadReciente, Inicio, LineaTiempo, ListaVistoBueno, PrimerosPasos, TarjetaEquipo, useCerrable, type ModoPedido, type OpcionPedido } from "./Centro";
import { UsoPlan } from "./Columna";
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

type VistaDemo = Extract<IdVista, "resumen" | "actividad" | "conversaciones" | "agentes" | "correo">;
const VISTAS: VistaDemo[] = ["resumen", "actividad", "conversaciones", "agentes", "correo"];
/** El título de la barra ("Panel" en el inicio, como "Dashboard"). */
const NOMBRE_VISTA: Record<VistaDemo, string> = {
  resumen: "Panel",
  actividad: "Actividad",
  conversaciones: "Conversaciones",
  agentes: "Agentes",
  correo: "Correo",
};

const PLAN = PLAN_POR_ID[DEMO_NEGOCIO.plan];

/** Lo que el inicio le pasa al chat de ejemplo: un texto para enviar o abrir "Nuevo grupo". */
type Encargo = { texto?: string; grupo?: boolean; n: number };

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
  /** Lo que se pidió desde el inicio: el chat de ejemplo envía el texto (o abre "Nuevo grupo") al abrir. */
  const [pedido, setPedido] = useState<Encargo | null>(null);
  const [avisosLeidos, setAvisosLeidos] = useState(false);
  const [anterior, setAnterior] = useState<"no" | "cargando" | "si">("no");
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
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
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
  const nuevoGrupo = useCallback(
    () => {
      ir({ vista: "conversaciones", con: "recepcion" });
      setPedido({ grupo: true, n: Date.now() });
    },
    [ir],
  );

  /* ---------- Armazón: navegación, agentes, grupos, menús ---------- */

  const pendientes = DEMO_APROBACIONES.filter((p) => !aprobados.has(p.id)).length;

  const nav: ElementoNav[] = [
    { id: "resumen", etiqueta: "Inicio", icono: "inicio", alElegir: a({ vista: "resumen" }) },
    { id: "actividad", etiqueta: "Actividad", icono: "rayo", alElegir: a({ vista: "actividad" }) },
  ];

  const agentesLateral = IDS_AGENTES.map((id) => ({ id, estado: DEMO_ESTADOS[id], alElegir: a({ vista: "conversaciones", con: id }) }));
  const grupos = DEMO_GRUPOS.map((g) => ({ ...g, alElegir: a({ vista: "conversaciones", con: g.id }) }));

  const crear: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Crear" },
    { id: "conversacion", etiqueta: "Nueva conversación", descripcion: "Con un agente o con un grupo", icono: "mensaje", alElegir: a({ vista: "conversaciones" }) },
    { id: "cita", etiqueta: "Agendar cita", descripcion: "Pídesela a Lola en su chat", icono: "calendario", alElegir: a({ vista: "conversaciones", con: "lola" }) },
    { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Junta a dos o más agentes", icono: "usuarios", alElegir: nuevoGrupo },
  ];

  const perfil: ElementoMenu[] = [
    { id: "agentes", etiqueta: "Mis agentes", icono: "agentes", alElegir: a({ vista: "agentes" }) },
    { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", alElegir: a({ vista: "conversaciones" }) },
    { id: "correo", etiqueta: "Correo", descripcion: "Lo que Clara leyó hoy", icono: "correo", alElegir: a({ vista: "correo" }) },
    { tipo: "separador" },
    { id: "plan", etiqueta: "Plan y facturación", descripcion: `${PLAN.nombre} (ejemplo)`, icono: "facturacion", href: "/precios" },
  ];

  const avisos = DEMO_AVISOS.map((av) => ({ ...av, leido: avisosLeidos, alElegir: a(av.ir) }));

  const indice: ResultadoBusqueda[] = useMemo(
    () => [
      ...VISTAS.map((v) => ({ id: `v-${v}`, grupo: "Secciones", titulo: v === "resumen" ? "Inicio" : NOMBRE_VISTA[v], icono: "inicio" as const, alElegir: () => ir({ vista: v }) })),
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
      accionAgentes={<BotonIcono etiqueta="Ver y buscar tus agentes" icono="buscar" onClick={a({ vista: "agentes" })} />}
      grupos={grupos}
      accionGrupos={<BotonIcono etiqueta="Nuevo grupo" icono="mas" onClick={nuevoGrupo} />}
      pieLateral={<UsoPlan plan={PLAN} usados={DEMO_NEGOCIO.mensajesUsados} accion={{ href: "/precios" }} />}
      conversaciones={{ alElegir: a({ vista: "conversaciones" }), sinLeer: 3 }}
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
        {vista === "resumen" ? <Resumen ahora={ahora} ir={ir} pedir={pedir} nuevoGrupo={nuevoGrupo} /> : null}
        {vista === "actividad" ? (
          <VistaActividad
            ahora={ahora}
            ir={ir}
            pestana={pestana}
            setPestana={setPestana}
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

/** A quién se le pide en la caja: todos (el grupo Recepción del ejemplo) o cada agente. */
const OPCIONES: OpcionPedido[] = [
  { id: "recepcion", nombre: "Todos los agentes", detalle: "Lo recibe Recepción (Lola y Víctor)", agentes: [...IDS_AGENTES] },
  ...AGENTES_INFO.map((ag) => ({ id: ag.id, nombre: ag.nombre, detalle: ag.area, agentes: [ag.id] })),
];

/** "Pedir ▾": cada modo escribe el principio del pedido y elige al agente. */
const MODOS: ModoPedido[] = [
  { id: "pedir", etiqueta: "Pedir", icono: "mensaje", texto: "" },
  { id: "cita", etiqueta: "Agendar cita", icono: "calendario", texto: "Agenda una cita para ", opcion: "lola" },
  { id: "correo", etiqueta: "Resumir un correo", icono: "correo", texto: "Resume este correo: ", opcion: "clara" },
  { id: "clientes", etiqueta: "Escribir a clientes", icono: "clientes", texto: "Escribe un mensaje para ", opcion: "victor" },
  { id: "reporte", etiqueta: "Preparar un reporte", icono: "documento", texto: "Prepara un reporte de ", opcion: "iris" },
];

function Resumen({
  ahora,
  ir,
  pedir,
  nuevoGrupo,
}: {
  ahora: Date | null;
  ir: (d: Destino) => void;
  pedir: (texto: string, con: string) => void;
  nuevoGrupo: () => void;
}) {
  const [equipo, cerrarEquipo] = useCerrable("atendel-pruebalo-equipo-cerrado");
  const eventos = DEMO_ACTIVIDAD.slice(0, 6).map((e) => ({
    ...e,
    accion: e.ir ? { etiqueta: e.accion?.etiqueta ?? "Ver", alElegir: () => ir(e.ir as Destino) } : undefined,
  }));

  return (
    <div className="dash-pagina dash-inicio-pagina">
      <Inicio
        titulo={`Bienvenida a Atendel, ${DEMO_USUARIA.nombre.split(" ")[0]}`}
        opciones={OPCIONES}
        modos={MODOS}
        alPedir={pedir}
        atajos={[
          { id: "cita", etiqueta: "Agendar cita", icono: "calendario", modo: "cita" },
          { id: "correo", etiqueta: "Resumir un correo", icono: "correo", modo: "correo" },
          { id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios", alElegir: nuevoGrupo },
          {
            id: "citas",
            etiqueta: "Ver citas",
            icono: "reloj",
            menu: [
              { tipo: "titulo", etiqueta: "Mañana · 10 de 12 confirmadas" },
              ...DEMO_CITAS.map((c) => ({
                id: c.id,
                etiqueta: `${c.hora} · ${c.paciente}`,
                descripcion: `${c.servicio} · ${c.estado.texto}`,
                alElegir: () => ir({ vista: "conversaciones", con: "lola" }),
              })),
            ],
          },
        ]}
      />

      {equipo ? (
        <TarjetaEquipo
          texto="Cuatro agentes, cada uno en lo suyo. Toca a uno para escribirle."
          agentes={IDS_AGENTES.map((id) => ({ id, alElegir: () => ir({ vista: "conversaciones", con: id }) }))}
          alCerrar={cerrarEquipo}
        />
      ) : null}

      <PrimerosPasos
        pasos={[
          { id: "correo", titulo: "Conecta tu correo", detalle: "Clara lee tu Gmail. Solo lectura.", listo: false, boton: "Conectar", alElegir: () => ir({ vista: "correo" }) },
          { id: "equipo", titulo: "Elige tu equipo", detalle: "Lola, Clara, Víctor e Iris.", listo: true, boton: "Ver", alElegir: () => ir({ vista: "agentes" }) },
          { id: "chat", titulo: "Prueba el chat", detalle: "Pídele algo a un agente.", listo: false, boton: "Abrir el chat", alElegir: () => ir({ vista: "conversaciones" }) },
        ]}
      />

      <ActividadReciente eventos={eventos} ahora={ahora} accion={<EnlaceMas accion={{ alElegir: () => ir({ vista: "actividad" }) }}>Ver todo</EnlaceMas>} />
    </div>
  );
}

/* =====================================================================
   ACTIVIDAD (como "Feed"): todo lo que hizo tu equipo, con el detalle, y
   lo que espera tu visto bueno.
   ===================================================================== */

function VistaActividad({
  ahora,
  ir,
  pestana,
  setPestana,
  aprobados,
  setAprobados,
  pendientes,
  anterior,
  verAnterior,
}: {
  ahora: Date | null;
  ir: (d: Destino) => void;
  pestana: IdPestana;
  setPestana: (p: IdPestana) => void;
  aprobados: Set<string>;
  setAprobados: Dispatch<SetStateAction<Set<string>>>;
  pendientes: number;
  anterior: "no" | "cargando" | "si";
  verAnterior: () => void;
}) {
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
    <div className="dash-pagina dash-vista dash-inicio-pagina">
      <header className="dash-vista__cabeza">
        <h1 className="t-app-titulo-grande">Actividad</h1>
      </header>
      <section className="dash-actividad" aria-label="Actividad de tu equipo">
        <Pestanas
          etiqueta="Actividad de tu equipo"
          alineacion="izquierda"
          activa={pestana === "destacados" ? "actividad" : pestana}
          alCambiar={(id) => setPestana(id as IdPestana)}
          classNamePanel="dash-actividad__panel"
          pestanas={[
            {
              id: "actividad",
              etiqueta: "Todo",
              contenido: <LineaTiempo eventos={eventos} ahora={ahora} pie={pieActividad} />,
            },
            {
              id: "visto-bueno",
              etiqueta: (
                <span className="dash-pestana">
                  Espera tu visto bueno
                  {pendientes ? <Insignia contador={pendientes} etiqueta={`${pendientes} pendientes`} /> : null}
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
                  texto="Nada espera tu visto bueno."
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
  );
}

/* =====================================================================
   CONVERSACIONES: el chat de ejemplo (ChatDemo, del Grupo 2) dentro del
   armazón, a lo alto de la pantalla. Se monta de nuevo al pedir otro chat
   (?con=lola) para que abra directo en esa conversación.
   ===================================================================== */

function VistaConversaciones({ chatCon, pedido }: { chatCon: string | null; pedido: Encargo | null }) {
  return (
    <div className="dash-vista-chat dash-vista-chat--lleno">
      <h1 className="sr-only">Conversaciones</h1>
      <div className="dash-vista-chat__marco">
        <ChatDemo key={`${chatCon ?? "inicio"}-${pedido?.n ?? 0}`} pedido={pedido?.texto} nuevoGrupo={pedido?.grupo} nombre={DEMO_USUARIA.nombre.split(" ")[0]} />
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
