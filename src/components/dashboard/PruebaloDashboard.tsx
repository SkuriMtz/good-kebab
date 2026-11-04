"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ChatDemo } from "@/components/ChatDemo";
import { Avatar } from "@/components/base/Avatar";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import type { ElementoMenu } from "@/components/base/Menu";
import { Pestanas } from "@/components/base/Pestanas";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";
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
  DEMO_USUARIA,
  VISTAS_DEMO,
  destinoDeParametros,
  direccionDe,
  type CorreoDemo,
  type Destino,
  type VistaDemo,
} from "@/lib/demo-dashboard";
import { diaLocal, horaLocal, type ResumenEstadisticas } from "@/lib/estadisticas";
import { PLAN_POR_ID } from "@/lib/planes";
import { ponerTema } from "@/lib/tema";
import { conTransicion, rutaPintada } from "@/lib/transiciones";
import { Armazon } from "./Armazon";
import { Inicio, LineaTiempo, ListaVistoBueno, type ModoPedido, type OpcionPedido } from "./Centro";
import { UsoPlan } from "./Columna";
import { FilaAgente } from "./FilaAgente";
import { nombresAgentes } from "./nombres";
import { VistaPendientes, type FiltroPendientes, type GrupoPendientes } from "./Pendientes";
import { Accionable, Cifra, Hora, Letra, Tarjeta, Vacio } from "./Piezas";
import { VistaEstadisticasEjemplo } from "./estadisticas/VistaEstadisticasEjemplo";
import { ResumenVista, coincideAccion, type FilaPendiente } from "./Resumen";
import { VistaAjustes } from "./Ajustes";
import { resumenSemanaEjemplo } from "./estadisticas/ejemplo";
import { rangoHora } from "./estadisticas/formato";
import { useAhora } from "./tiempo";
import type { ElementoNav, IdVista, NovedadLateral, PasoInicio, ResultadoBusqueda } from "./tipos";
import { useTema } from "./useTema";

/* =====================================================================
   /pruebalo: el panel completo con DATOS DE EJEMPLO de un negocio
   inventado. Se cambia de vista sin recargar y la dirección lo recuerda
   (?vista=agentes&agente=lola, ?vista=correo&de=…), así el botón "atrás"
   del navegador regresa a la vista anterior. Cada cambio usa la
   transición entre vistas de siempre (src/lib/transiciones.ts).
   Nada aquí llama a la IA: el chat es el guion local de ChatDemo.
   ===================================================================== */

const VISTAS = VISTAS_DEMO;
const NOMBRE_VISTA: Record<VistaDemo, string> = {
  resumen: "Inicio",
  pendientes: "Pendientes",
  estadisticas: "Estadísticas",
  actividad: "Actividad",
  conversaciones: "Chat",
  agentes: "Agentes",
  correo: "Correo",
  ajustes: "Ajustes",
};
const ICONO_VISTA = {
  resumen: "inicio",
  pendientes: "check-circulo",
  estadisticas: "grafica",
  actividad: "rayo",
  conversaciones: "conversaciones",
  agentes: "agentes",
  correo: "correo",
  ajustes: "ajustes",
} as const;

const PLAN = PLAN_POR_ID[DEMO_NEGOCIO.plan];

/** Lo que el inicio le pasa al chat de ejemplo: un texto para enviar o abrir "Nuevo grupo". */
type Encargo = { texto?: string; grupo?: boolean; n: number };

/** La dirección actual como destino. */
const leerDireccion = () => destinoDeParametros(new URLSearchParams(window.location.search), window.location.hash);

/** Los destinos guardados en los datos de ejemplo hablan de "actividad · visto bueno": hoy eso vive en Pendientes. */
function normalizarDestino(d: Destino): Destino {
  if (d.vista === "actividad" && d.pestana === "visto-bueno") return { vista: "pendientes", tipo: "visto-bueno" };
  return d;
}

const clave = (direccion: string) => `/pruebalo${direccion}`;

export function PruebaloDashboard({ version, inicial }: { version?: string; /** La vista pedida en la dirección (la lee la página en el servidor: no se pinta antes el inicio). */ inicial?: Destino }) {
  const ahora = useAhora();
  const tema = useTema();
  const [destino, setDestino] = useState<Destino>(() => normalizarDestino(inicial ?? { vista: "resumen" }));
  /** Cambia solo cuando se llega al chat desde fuera: así el chat de ejemplo se monta de nuevo en esa conversación. */
  const [montajeChat, setMontajeChat] = useState(0);
  const [aprobados, setAprobados] = useState<Set<string>>(() => new Set());
  /** Lo que se pidió desde el inicio: el chat de ejemplo envía el texto (o abre "Nuevo grupo") al abrir. */
  const [pedido, setPedido] = useState<Encargo | null>(null);
  const [avisosLeidos, setAvisosLeidos] = useState(false);
  const [anterior, setAnterior] = useState<"no" | "cargando" | "si">("no");
  const temporizador = useRef<number | undefined>(undefined);
  const pintada = useRef(clave(direccionDe(destino)));

  const vista = destino.vista as VistaDemo;
  const direccion = direccionDe(destino);

  // La vista nueva ya se pintó: la transición puede seguir
  useLayoutEffect(() => {
    pintada.current = clave(direccion);
    rutaPintada(pintada.current);
  }, [direccion]);

  // La dirección manda al entrar (?vista=agentes) y con atrás/adelante
  useEffect(() => {
    // La página ya trae la vista de la dirección; esto solo cubre la forma de antes (#agentes)
    const d0 = normalizarDestino(leerDireccion());
    setDestino((actual) => (direccionDe(actual) === direccionDe(d0) ? actual : d0));
    const alVolver = () => {
      const d = normalizarDestino(leerDireccion());
      conTransicion(pintada.current, () => {
        setDestino(d);
        setPedido(null);
        setMontajeChat((n) => n + 1);
      }, clave(direccionDe(d)));
    };
    window.addEventListener("popstate", alVolver);
    return () => {
      window.removeEventListener("popstate", alVolver);
      window.clearTimeout(temporizador.current);
    };
  }, []);

  const ir = useCallback((d0: Destino, encargo?: Encargo) => {
    const d = normalizarDestino(d0);
    if (!VISTAS.includes(d.vista as VistaDemo)) return;
    const nueva = direccionDe(d);
    const desde = `${window.location.search}`;
    const cambiar = () => {
      if (nueva !== desde || window.location.hash) window.history.pushState(null, "", `${window.location.pathname}${nueva}`);
      setDestino(d);
      setPedido(encargo ?? null);
      if (d.vista === "conversaciones") setMontajeChat((n) => n + 1);
      requestAnimationFrame(() => window.scrollTo({ top: 0 }));
    };
    // Misma dirección: no hay vista que cambiar (solo el encargo para el chat, si lo hay)
    if (nueva === desde && !window.location.hash) {
      if (encargo) cambiar();
      return;
    }
    conTransicion(clave(desde), cambiar, clave(nueva));
  }, []);

  const a = useCallback((d: Destino) => () => ir(d), [ir]);

  /** Elegir otra conversación dentro del chat de ejemplo: la dirección la sigue (atrás y recargar la respetan). */
  const alAbrirChat = useCallback((id: string | null) => {
    const d: Destino = id ? { vista: "conversaciones", con: id } : { vista: "conversaciones" };
    const nueva = direccionDe(d);
    if (nueva === window.location.search) return;
    window.history.pushState(null, "", `${window.location.pathname}${nueva}`);
    setDestino(d);
  }, []);

  /** La caja grande: abre el chat y el chat de ejemplo envía el texto (guion local, sin IA). */
  const pedir = useCallback((texto: string, con: string) => ir({ vista: "conversaciones", con }, { texto, n: Date.now() }), [ir]);
  const nuevoGrupo = useCallback(() => ir({ vista: "conversaciones", con: "recepcion" }, { grupo: true, n: Date.now() }), [ir]);

  /* ---------- Armazón ---------- */

  /** Los números de la semana salen de las mismas estadísticas de ejemplo que la vista Estadísticas (7 días). */
  const est7 = useMemo(() => resumenSemanaEjemplo(), []);
  const vistoBueno = DEMO_APROBACIONES.filter((p) => !aprobados.has(p.id)).length;
  const correosConAccion = DEMO_CORREOS.filter((c) => c.accion);
  const sinLeer = DEMO_CONVERSACIONES.filter((c) => c.sinLeer);
  const totalPendientes = vistoBueno + correosConAccion.length + sinLeer.length;

  const nav: ElementoNav[] = [
    { id: "resumen", etiqueta: "Inicio", icono: "inicio", alElegir: a({ vista: "resumen" }) },
    {
      id: "conversaciones",
      etiqueta: "Chat",
      icono: "conversaciones",
      alElegir: a({ vista: "conversaciones" }),
      hijos: [
        { id: "nueva", etiqueta: "Nueva conversación", icono: "mas", alElegir: a({ vista: "conversaciones" }) },
        ...DEMO_GRUPOS.map((g) => ({ id: g.id, etiqueta: g.nombre, agentes: g.agentes, contador: g.sinLeer, alElegir: a({ vista: "conversaciones", con: g.id }), actual: vista === "conversaciones" && destino.con === g.id })),
      ],
    },
    {
      id: "agentes",
      etiqueta: "Agentes",
      icono: "agentes",
      alElegir: a({ vista: "agentes" }),
      abierto: true,
      hijos: IDS_AGENTES.map((id) => ({
        id,
        etiqueta: AGENTE_POR_ID[id].nombre,
        agente: id,
        estado: DEMO_ESTADOS[id],
        alElegir: a({ vista: "agentes", agente: id }),
        actual: vista === "agentes" && destino.agente === id,
      })),
    },
    { id: "pendientes", etiqueta: "Pendientes", icono: "check-circulo", alElegir: a({ vista: "pendientes" }), contador: totalPendientes, etiquetaContador: `${totalPendientes} por revisar` },
    { id: "estadisticas", etiqueta: "Estadísticas", icono: "grafica", alElegir: a({ vista: "estadisticas" }) },
    { id: "correo", etiqueta: "Correo", icono: "correo", alElegir: a({ vista: "correo" }) },
    {
      id: "ajustes",
      etiqueta: "Ajustes",
      icono: "ajustes",
      alElegir: a({ vista: "ajustes" }),
      hijos: [
        { id: "plan", etiqueta: "Plan y uso", icono: "facturacion", alElegir: a({ vista: "ajustes" }) },
        { id: "gmail", etiqueta: "Conectar Gmail", icono: "correo", alElegir: a({ vista: "correo" }) },
        { id: "tema", etiqueta: tema === "oscuro" ? "Modo claro" : "Modo oscuro", icono: tema === "oscuro" ? "sol" : "luna", alElegir: () => ponerTema(tema === "oscuro" ? "claro" : "oscuro") },
        { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", pronto: true },
      ],
    },
  ];

  const crear: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Nuevo" },
    { id: "conversacion", etiqueta: "Nueva conversación", descripcion: "Con un agente o con un grupo", icono: "mensaje", alElegir: a({ vista: "conversaciones" }) },
    { id: "cita", etiqueta: "Agendar cita", descripcion: "Pídesela a Lola en su chat", icono: "calendario", alElegir: a({ vista: "conversaciones", con: "lola" }) },
    { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Junta a dos o más agentes", icono: "usuarios", alElegir: nuevoGrupo },
  ];

  const perfil: ElementoMenu[] = [
    { id: "agentes", etiqueta: "Mis agentes", icono: "agentes", alElegir: a({ vista: "agentes" }) },
    { id: "conversaciones", etiqueta: "Chat", icono: "conversaciones", alElegir: a({ vista: "conversaciones" }) },
    { id: "correo", etiqueta: "Correo", descripcion: "Lo que Clara leyó hoy", icono: "correo", alElegir: a({ vista: "correo" }) },
    { tipo: "separador" },
    { id: "plan", etiqueta: "Plan y facturación", descripcion: `${PLAN.nombre} (ejemplo)`, icono: "facturacion", alElegir: a({ vista: "ajustes" }) },
  ];

  const formato = new Intl.NumberFormat("es-MX");
  const menuNegocio: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: `${DEMO_NEGOCIO.nombre} (ejemplo)` },
    { id: "plan", etiqueta: "Ver mi plan y uso", descripcion: `${PLAN.nombre} · ${formato.format(DEMO_NEGOCIO.mensajesUsados)} de ${formato.format(PLAN.mensajesMes)} mensajes`, icono: "facturacion", alElegir: a({ vista: "ajustes" }) },
    { id: "planes", etiqueta: "Ver los planes", descripcion: "Para cambiar de plan, escríbenos", icono: "estrella", href: "/precios" },
    { id: "negocio", etiqueta: "Datos de mi negocio", icono: "negocio", pronto: true },
  ];

  const ayuda: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Ayuda" },
    { id: "preguntas", etiqueta: "Posibles preguntas", icono: "ayuda", href: "/preguntas" },
    { id: "datos", etiqueta: "Tus datos y tu privacidad", icono: "escudo", href: "/preguntas#seguridad" },
    { id: "contacto", etiqueta: "Escríbenos", icono: "mensaje", href: "/contacto" },
    { tipo: "separador" },
    { id: "sitio", etiqueta: "Ir al sitio de Atendel", icono: "inicio", href: "/" },
  ];

  const pasos: PasoInicio[] = [
    { id: "equipo", titulo: "Elige a tu equipo", detalle: "Lola, Clara, Víctor e Iris", listo: true, alElegir: a({ vista: "agentes" }) },
    { id: "gmail", titulo: "Conecta tu Gmail", detalle: "Clara lo lee. Solo lectura.", listo: false, alElegir: a({ vista: "correo" }) },
    { id: "chat", titulo: "Tu primera conversación", detalle: "Pídele algo a un agente.", listo: true, alElegir: a({ vista: "conversaciones" }) },
    { id: "grupo", titulo: "Tu primer grupo", detalle: "Junta a dos agentes en un chat.", listo: false, alElegir: nuevoGrupo },
  ];

  const novedades: NovedadLateral[] = [
    { id: "estadisticas", titulo: "Estadísticas de tu equipo", alElegir: a({ vista: "estadisticas" }) },
    { id: "grupos", titulo: "Chats en grupo con tus agentes", alElegir: a({ vista: "conversaciones", con: "recepcion" }) },
    { id: "gmail", titulo: "Clara lee tu Gmail", alElegir: a({ vista: "correo" }) },
  ];

  const avisos = DEMO_AVISOS.map((av) => ({ ...av, leido: avisosLeidos, alElegir: a(av.ir) }));

  const indice: ResultadoBusqueda[] = useMemo(
    () => [
      ...VISTAS.map((v) => ({ id: `v-${v}`, grupo: "Secciones", titulo: NOMBRE_VISTA[v], icono: ICONO_VISTA[v], alElegir: () => ir({ vista: v }) })),
      ...AGENTES_INFO.map((ag) => ({
        id: `a-${ag.id}`,
        grupo: "Agentes",
        titulo: ag.nombre,
        detalle: `${ag.area} · ${ag.abarca}`,
        agente: ag.id,
        claves: ag.capacidades.join(" "),
        alElegir: () => ir({ vista: "agentes", agente: ag.id }),
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
      ...DEMO_CORREOS.filter((c) => c.prioridad !== "sin-accion").map((c) => ({
        id: `m-${c.id}`,
        grupo: "Correos",
        titulo: `${c.remitente}: ${c.asunto}`,
        detalle: c.resumen,
        icono: "correo" as const,
        alElegir: () => ir({ vista: "correo", de: c.remitente }),
      })),
    ],
    [ir],
  );

  const aviso = (
    <div className="dash-demo" role="note">
      <Icono nombre="alerta" tam={16} className="dash-demo__icono" />
      <p className="dash-demo__texto">
        <strong>Datos de ejemplo.</strong>
        <span className="dash-demo__mas"> Un negocio inventado: nada se guarda ni se envía.</span>
      </p>
      <Link href="/entrar" className="dash-enlace dash-enlace--chico">
        Probarlo de verdad
        <Icono nombre="flecha" tam={16} />
      </Link>
    </div>
  );

  return (
    <Armazon
      inicio={{ alElegir: a({ vista: "resumen" }) }}
      aviso={aviso}
      nav={nav}
      activa={vista}
      negocio={{ nombre: DEMO_NEGOCIO.nombre, plan: PLAN.nombre.replace(/^Atendel\s+/, ""), menu: menuNegocio }}
      pasos={pasos}
      ayuda={ayuda}
      novedades={novedades}
      version={version}
      uso={<UsoPlan plan={PLAN} usados={DEMO_NEGOCIO.mensajesUsados} accion={{ href: "/precios" }} />}
      indice={indice}
      crear={crear}
      avisos={avisos}
      alLeerAvisos={() => setAvisosLeidos(true)}
      ahora={ahora}
      usuario={DEMO_USUARIA}
      perfil={perfil}
      salir={{ id: "salir", etiqueta: "Salir de la demostración", icono: "cerrar-sesion", href: "/" }}
      chat={{ alElegir: a({ vista: "conversaciones" }) }}
      completo={vista === "conversaciones"}
    >
      <div key={vista} className="dash-entra">
        {vista === "resumen" ? (
          <Resumen ahora={ahora} ir={ir} a={a} pedir={pedir} nuevoGrupo={nuevoGrupo} vistoBueno={vistoBueno} total={totalPendientes} aprobados={aprobados} est={est7} />
        ) : null}
        {vista === "ajustes" ? (
          <VistaAjustes
            plan={PLAN}
            usados={DEMO_NEGOCIO.mensajesUsados}
            conGmail={false}
            gmail={{ alElegir: a({ vista: "correo" }) }}
            equipo={{ alElegir: a({ vista: "agentes" }) }}
            planes={{ href: "/precios" }}
            marca={MARCA_EJEMPLO}
          />
        ) : null}
        {vista === "pendientes" ? <VistaPendientesDemo ahora={ahora} a={a} destino={destino} aprobados={aprobados} setAprobados={setAprobados} /> : null}
        {vista === "estadisticas" ? <VistaEstadisticasEjemplo ir={ir} insignia={MARCA_EJEMPLO} /> : null}
        {vista === "actividad" ? (
          <VistaActividad
            ahora={ahora}
            ir={ir}
            destino={destino}
            anterior={anterior}
            verAnterior={() => {
              setAnterior("cargando");
              temporizador.current = window.setTimeout(() => setAnterior("si"), 700);
            }}
          />
        ) : null}
        {vista === "conversaciones" ? <VistaConversaciones montaje={montajeChat} pedido={pedido} alAbrir={alAbrirChat} /> : null}
        {vista === "agentes" ? <VistaAgentes ir={ir} enfocado={destino.agente} est={est7} /> : null}
        {vista === "correo" ? <VistaCorreo ahora={ahora} ir={ir} de={destino.de} pedir={pedir} /> : null}
      </div>
    </Armazon>
  );
}

const MARCA_EJEMPLO = (
  <Insignia className="pnl-ejemplo" tono="neutra">
    Datos de ejemplo
  </Insignia>
);

/* =====================================================================
   INICIO: el chat, el equipo, los pendientes y las estadísticas.
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

/** Lo que hizo cada agente en los últimos 7 días (las mismas cuentas que Estadísticas). */
function datoSemana(est: ResumenEstadisticas, id: IdAgente) {
  const fila = est.agentes.find((f) => f.agente === id);
  return { cifra: fila ? fila.mensajes : null, unidad: "mensajes en 7 días" };
}

/** A Estadísticas en 7 días, con la métrica (y el agente) de ese número. */
const aEstadisticas = (metrica: string, agente?: IdAgente): Destino => ({ vista: "estadisticas", periodo: "7d", metrica, ...(agente ? { agente } : {}) });

/** Lo que espera algo de ti en el ejemplo, ya con a dónde lleva cada cosa. */
function filasPendientes(aprobados: Set<string>, a: (d: Destino) => () => void) {
  const vistoBueno: FilaPendiente[] = DEMO_APROBACIONES.filter((p) => !aprobados.has(p.id)).map((p) => ({
    id: `vb-${p.id}`,
    tipo: "Visto bueno",
    titulo: p.titulo,
    detalle: `${AGENTE_POR_ID[p.agente].nombre} lo dejó listo · ${p.para}`,
    agente: p.agente,
    haceMin: p.haceMin,
    alElegir: a({ vista: "pendientes", tipo: "visto-bueno" }),
  }));
  const correos: FilaPendiente[] = DEMO_CORREOS.filter((c) => c.accion).map((c) => ({
    id: `co-${c.id}`,
    tipo: "Correo",
    titulo: `${c.remitente}: ${c.asunto}`,
    detalle: `Clara sugiere: ${c.accion}`,
    quien: c.remitente,
    accion: c.accion,
    haceMin: c.haceMin,
    insignia: c.prioridad === "urgente" ? { tono: "error", texto: "Urgente" } : undefined,
    alElegir: a({ vista: "correo", de: c.remitente }),
  }));
  const conversaciones: FilaPendiente[] = DEMO_CONVERSACIONES.filter((c) => c.sinLeer).map((c) => ({
    id: `cv-${c.id}`,
    tipo: "Sin leer",
    titulo: c.cliente,
    detalle: `${c.canal} con ${AGENTE_POR_ID[c.agente].nombre} · ${c.ultimo}`,
    quien: c.cliente,
    haceMin: c.haceMin,
    alElegir: a(c.ir),
  }));
  return { vistoBueno, correos, conversaciones };
}

function Resumen({
  ahora,
  ir,
  a,
  pedir,
  nuevoGrupo,
  vistoBueno,
  total,
  aprobados,
  est,
}: {
  ahora: Date | null;
  ir: (d: Destino) => void;
  a: (d: Destino) => () => void;
  pedir: (texto: string, con: string) => void;
  nuevoGrupo: () => void;
  vistoBueno: number;
  total: number;
  aprobados: Set<string>;
  /** El resumen de ejemplo de 7 días: los mismos números que en la vista Estadísticas. */
  est: ResumenEstadisticas;
}) {
  const filas = filasPendientes(aprobados, a);
  const mezcla = [...filas.vistoBueno.slice(0, 2), ...filas.correos.slice(0, 2), ...filas.conversaciones.slice(0, 1)];
  const dato = (id: "mensajes" | "conversaciones" | "correos") => ({ ...est.metricas[id], alElegir: a(aEstadisticas(id)) });

  return (
    <ResumenVista
      negocio={DEMO_NEGOCIO.nombre}
      nombre={DEMO_USUARIA.nombre.split(" ")[0]}
      ahora={ahora}
      marca={MARCA_EJEMPLO}
      aviso={{
        clave: "atendel-pruebalo-aviso-estadisticas",
        texto: "Nuevo en tu panel: las estadísticas de tu equipo. Mira cuántos mensajes contestó cada agente y quién te escribe más.",
        accion: { etiqueta: "Ver estadísticas", alElegir: a({ vista: "estadisticas" }) },
      }}
      pedido={
        <Inicio
          sinTitulo
          titulo="Pregúntale a tu equipo"
          placeholder="Pregúntale a tu equipo… o escribe @ para elegir agente"
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
      }
      agentes={IDS_AGENTES.map((id) => ({ id, estado: DEMO_ESTADOS[id], ...datoSemana(est, id), alElegir: a({ vista: "agentes", agente: id }) }))}
      verAgentes={{ alElegir: a({ vista: "agentes" }) }}
      pendientes={{ total, filas: mezcla, accion: { alElegir: a({ vista: "pendientes" }) } }}
      estadisticas={{
        periodo: "7 días contra los 7 anteriores",
        accion: { alElegir: a({ vista: "estadisticas", periodo: "7d" }) },
        uso: { usados: DEMO_NEGOCIO.mensajesUsados, limite: PLAN.mensajesMes, plan: `${PLAN.nombre} · este mes`, alElegir: a({ vista: "estadisticas", periodo: "mes", metrica: "uso" }) },
        cifras: [
          { id: "mensajes", etiqueta: "Mensajes", icono: "mensaje", ...dato("mensajes") },
          { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", ...dato("conversaciones") },
          { id: "correos", etiqueta: "Correos resumidos", icono: "correo", ...dato("correos") },
          { id: "visto-bueno", etiqueta: "Esperan tu visto bueno", icono: "check-circulo", valor: vistoBueno, delta: null, alElegir: a({ vista: "pendientes", tipo: "visto-bueno" }) },
        ],
      }}
    />
  );
}

/* =====================================================================
   PENDIENTES: visto bueno, correos con acción y conversaciones sin leer.
   Filtros en la dirección: &tipo=, &de= (remitente) y &accion= (la acción
   sugerida, desde Estadísticas o desde Correo).
   ===================================================================== */

function VistaPendientesDemo({
  ahora,
  a,
  destino,
  aprobados,
  setAprobados,
}: {
  ahora: Date | null;
  a: (d: Destino) => () => void;
  destino: Destino;
  aprobados: Set<string>;
  setAprobados: Dispatch<SetStateAction<Set<string>>>;
}) {
  const { vistoBueno, correos, conversaciones } = filasPendientes(aprobados, a);
  const { tipo, de, accion } = destino;
  const soloCorreos = Boolean(de || accion);
  const aprobar = (id: string) => setAprobados((s) => new Set(s).add(id));
  const deshacer = (id: string) =>
    setAprobados((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });

  const correosDe = correos.filter((c) => (!de || c.quien === de) && (!accion || coincideAccion(c.accion, accion)));
  const grupos: GrupoPendientes[] = [];
  if (!soloCorreos && (!tipo || tipo === "visto-bueno")) {
    grupos.push({
      id: "visto-bueno",
      titulo: "Esperan tu visto bueno",
      icono: "check-circulo",
      total: vistoBueno.length,
      contenido: (
        <>
          <ListaVistoBueno
            pendientes={DEMO_APROBACIONES.map((p) => ({ ...p, editar: { alElegir: a(p.ir) } }))}
            aprobados={aprobados}
            alAprobar={aprobar}
            alDeshacer={deshacer}
            ahora={ahora}
          />
          {vistoBueno.length === 0 ? (
            <p className="dash-nota pnl-agrupada__nota">
              Todo aprobado.{" "}
              <button type="button" className="dash-enlace dash-enlace--chico" onClick={() => setAprobados(new Set())}>
                Volver a ver los ejemplos
              </button>
            </p>
          ) : null}
        </>
      ),
    });
  }
  if (!tipo || tipo === "correos" || soloCorreos) {
    const porRemitente = new Map<string, FilaPendiente[]>();
    correosDe.forEach((c) => porRemitente.set(c.quien ?? "", [...(porRemitente.get(c.quien ?? "") ?? []), c]));
    if (correosDe.length) {
      grupos.push({
        id: "correos",
        titulo: "Correos con una acción sugerida",
        agente: "clara",
        total: correosDe.length,
        subgrupos: [...porRemitente.entries()].map(([quien, filas]) => ({ id: quien, titulo: quien, filas: filas.map((f) => ({ ...f, titulo: f.titulo.replace(`${quien}: `, "") })) })),
      });
    }
  }
  if (!soloCorreos && (!tipo || tipo === "sin-leer")) {
    grupos.push({ id: "sin-leer", titulo: "Conversaciones sin leer", icono: "conversaciones", total: conversaciones.length, filas: conversaciones });
  }

  const filtros: FiltroPendientes[] = [
    { id: "todos", etiqueta: "Todos", cuenta: vistoBueno.length + correos.length + conversaciones.length, alElegir: a({ vista: "pendientes" }), actual: !tipo && !soloCorreos },
    { id: "visto-bueno", etiqueta: "Visto bueno", cuenta: vistoBueno.length, alElegir: a({ vista: "pendientes", tipo: "visto-bueno" }), actual: tipo === "visto-bueno" && !soloCorreos },
    { id: "correos", etiqueta: "Correos", cuenta: correos.length, alElegir: a({ vista: "pendientes", tipo: "correos" }), actual: tipo === "correos" && !soloCorreos },
    { id: "sin-leer", etiqueta: "Sin leer", cuenta: conversaciones.length, alElegir: a({ vista: "pendientes", tipo: "sin-leer" }), actual: tipo === "sin-leer" && !soloCorreos },
  ];
  // Quitar un filtro deja el otro puesto
  const quitar = [
    ...(de ? [{ etiqueta: `De: ${de}`, alElegir: a({ vista: "pendientes", tipo: "correos", ...(accion ? { accion } : {}) }) }] : []),
    ...(accion ? [{ etiqueta: `Acción: ${accion}`, alElegir: a({ vista: "pendientes", tipo: "correos", ...(de ? { de } : {}) }) }] : []),
  ];

  return (
    <VistaPendientes
      grupos={grupos}
      filtros={filtros}
      quitarFiltros={quitar}
      ahora={ahora}
      actividad={{ alElegir: a({ vista: "actividad" }) }}
      marca={MARCA_EJEMPLO}
      vacio={
        soloCorreos ? (
          <Vacio
            icono="correo"
            titulo={accion ? `Ningún correo de hoy pide «${accion}»` : `Ningún correo de ${de} espera algo de ti`}
            texto="En el ejemplo, Clara leyó 23 correos hoy; estos son los que traen una acción sugerida."
            accion={
              <button type="button" className="dash-enlace" onClick={a({ vista: "pendientes", tipo: "correos" })}>
                Ver todos los correos pendientes
              </button>
            }
          />
        ) : undefined
      }
    />
  );
}

/* =====================================================================
   ACTIVIDAD (como "Feed"): todo lo que hizo tu equipo, con el detalle.
   Filtros en la dirección: &agente=, &hora= (0–23) y &dia= (AAAA-MM-DD),
   en la hora de México, como las Estadísticas.
   ===================================================================== */

const fechaDia = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
/** "2026-11-04" → "miércoles 4 de noviembre". */
export const nombreDia = (dia: string) => fechaDia.format(new Date(`${dia}T12:00:00Z`));

function VistaActividad({
  ahora,
  ir,
  destino,
  anterior,
  verAnterior,
}: {
  ahora: Date | null;
  ir: (d: Destino) => void;
  destino: Destino;
  anterior: "no" | "cargando" | "si";
  verAnterior: () => void;
}) {
  const { agente, hora, dia } = destino;
  // Menos insignias: el texto del evento ya dice lo mismo
  const conAccion = <T extends { ir?: Destino; accion?: { etiqueta: string } }>(e: T) => ({
    ...e,
    insignia: undefined,
    accion: e.accion && e.ir ? { ...e.accion, alElegir: () => ir(e.ir as Destino) } : undefined,
  });
  const referencia = (ahora ?? new Date()).getTime();
  const todos = [...DEMO_ACTIVIDAD, ...(anterior === "si" || hora !== undefined || dia ? DEMO_ACTIVIDAD_ANTERIOR : [])];
  const eventos = todos
    .filter((e) => {
      if (agente && e.agente !== agente && e.con !== agente) return false;
      if (hora === undefined && !dia) return true;
      const cuando = new Date(referencia - (e.haceMin ?? 0) * 60_000);
      return (hora === undefined || horaLocal(cuando) === hora) && (!dia || diaLocal(cuando) === dia);
    })
    .map(conAccion);
  const filtrado = Boolean(agente || hora !== undefined || dia);
  const sin = (cambio: Partial<Destino>) => ({ vista: "actividad" as const, ...(agente ? { agente } : {}), ...(hora !== undefined ? { hora } : {}), ...(dia ? { dia } : {}), ...cambio });

  const pieActividad =
    filtrado ? null : anterior === "si" ? (
      <p className="dash-feed__fin">Es toda la actividad de ejemplo de esta semana.</p>
    ) : (
      <div className="dash-feed__mas">
        <Boton variante="sutil" tam="compacto" cargando={anterior === "cargando"} onClick={verAnterior}>
          {anterior === "cargando" ? "Cargando" : "Ver actividad anterior"}
        </Boton>
      </div>
    );

  return (
    <div className="pnl-pagina">
      <header className="pnl-vista__cabeza">
        <h1 className="pnl-vista__titulo">
          Actividad
          {MARCA_EJEMPLO}
        </h1>
      </header>
      <div className="pnl-filtros" role="group" aria-label="Filtrar la actividad">
        <button type="button" className={`pnl-filtro pnl-picable${agente ? "" : " pnl-filtro--actual"}`} aria-pressed={!agente} onClick={() => ir(sin({ agente: undefined }))}>
          Todo el equipo
        </button>
        {IDS_AGENTES.map((id) => (
          <button key={id} type="button" className={`pnl-filtro pnl-picable${agente === id ? " pnl-filtro--actual" : ""}`} aria-pressed={agente === id} onClick={() => ir(sin({ agente: id }))}>
            {AGENTE_POR_ID[id].nombre}
          </button>
        ))}
        {hora !== undefined ? (
          <button type="button" className="pnl-filtro pnl-filtro--quitar pnl-picable" aria-label={`Quitar el filtro: de ${rangoHora(hora)}`} onClick={() => ir(sin({ hora: undefined }))}>
            De {rangoHora(hora)}
            <Icono nombre="cerrar" tam={16} />
          </button>
        ) : null}
        {dia ? (
          <button type="button" className="pnl-filtro pnl-filtro--quitar pnl-picable" aria-label={`Quitar el filtro: ${nombreDia(dia)}`} onClick={() => ir(sin({ dia: undefined }))}>
            {nombreDia(dia)}
            <Icono nombre="cerrar" tam={16} />
          </button>
        ) : null}
      </div>
      <section className="pnl-tarjeta dash-actividad" aria-label="Actividad de tu equipo">
        {eventos.length ? (
          <LineaTiempo eventos={eventos} ahora={ahora} pie={pieActividad} />
        ) : (
          <Vacio
            icono="reloj"
            titulo="Nada con ese filtro en la actividad de ejemplo"
            texto="La actividad de ejemplo cubre esta semana. Quita un filtro para ver más."
            accion={
              <button type="button" className="dash-enlace" onClick={() => ir({ vista: "actividad" })}>
                Ver toda la actividad
              </button>
            }
          />
        )}
      </section>
    </div>
  );
}

/* =====================================================================
   CHAT: el chat de ejemplo (ChatDemo) dentro del armazón, en su tarjeta.
   Lee ?con= al montarse; al elegir otra conversación adentro, avisa para
   que la dirección la siga. Se monta de nuevo solo al llegar desde fuera.
   ===================================================================== */

function VistaConversaciones({ montaje, pedido, alAbrir }: { montaje: number; pedido: Encargo | null; alAbrir: (id: string | null) => void }) {
  return (
    <div className="dash-vista-chat dash-vista-chat--lleno pnl-chat-marco">
      <h1 className="sr-only">Chat</h1>
      <div className="dash-vista-chat__marco">
        <ChatDemo key={`${montaje}-${pedido?.n ?? 0}`} pedido={pedido?.texto} nuevoGrupo={pedido?.grupo} nombre={DEMO_USUARIA.nombre.split(" ")[0]} alAbrir={alAbrir} />
      </div>
    </div>
  );
}

/* =====================================================================
   AGENTES: el equipo en tarjetas grandes; ?agente=lola lo marca. Los
   números de cada uno son los de Estadísticas en 7 días y llevan ahí.
   ===================================================================== */

function VistaAgentes({ ir, enfocado, est }: { ir: (d: Destino) => void; enfocado?: IdAgente; est: ResumenEstadisticas }) {
  useEffect(() => {
    if (!enfocado) return;
    const el = document.getElementById(`agente-${enfocado}`);
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: reducir ? "auto" : "smooth" });
  }, [enfocado]);

  return (
    <div className="pnl-pagina">
      <header className="pnl-vista__cabeza">
        <div>
          <h1 className="pnl-vista__titulo">
            Agentes
            {MARCA_EJEMPLO}
          </h1>
          <p className="pnl-vista__texto">
            Tu equipo en {DEMO_NEGOCIO.nombre}. Con {PLAN.nombre} trabajan los cuatro; cada uno se encarga de un área y se pasan el trabajo entre ellos.
          </p>
        </div>
        {enfocado ? (
          <button type="button" className="pnl-filtro pnl-filtro--quitar pnl-picable" onClick={() => ir({ vista: "agentes" })} aria-label={`Quitar el filtro: ${AGENTE_POR_ID[enfocado].nombre}`}>
            {AGENTE_POR_ID[enfocado].nombre}
            <Icono nombre="cerrar" tam={16} />
          </button>
        ) : null}
      </header>
      <ul className="pnl-fichas">
        {IDS_AGENTES.map((id) => {
          const fila = est.agentes.find((f) => f.agente === id);
          const datos = [
            { metrica: "mensajes", icono: "mensaje" as const, valor: fila?.mensajes ?? null, texto: "mensajes en 7 días" },
            { metrica: "conversaciones", icono: "conversaciones" as const, valor: fila?.conversaciones ?? null, texto: "conversaciones en 7 días" },
          ];
          return (
            <FilaAgente
              key={id}
              id={id}
              enfocado={enfocado === id}
              insignias={
                <Insignia tono="exito" conPunto>
                  En tu equipo
                </Insignia>
              }
              datos={datos.map((d, i) => (
                <Accionable key={d.metrica} accion={{ alElegir: () => ir(aEstadisticas(d.metrica, id)) }} className="pnl-ficha__dato pnl-picable">
                  <Icono nombre={d.icono} tam={16} />
                  <Cifra valor={d.valor} indice={i} className="pnl-ficha__cifra" />
                  <span>{d.texto}</span>
                </Accionable>
              ))}
              estado={<PuntoEstado tono={DEMO_ESTADOS[id].tono} etiqueta={DEMO_ESTADOS[id].etiqueta} mostrarEtiqueta pulso={DEMO_ESTADOS[id].pulso} />}
              acciones={
                <Boton variante="principal" tam="compacto" icono={<Icono nombre="mensaje" tam={16} />} onClick={() => ir({ vista: "conversaciones", con: id })}>
                  Hablar con {AGENTE_POR_ID[id].nombre}
                </Boton>
              }
            />
          );
        })}
      </ul>
    </div>
  );
}

/* =====================================================================
   CORREO: lo que Clara leyó hoy, por urgencia; ?de=… filtra por
   remitente. Cada correo se abre para ver qué hacer con él.
   ===================================================================== */

const PRIORIDADES: { id: CorreoDemo["prioridad"]; titulo: string; insignia?: { tono: "error" | "atencion" | "neutra"; texto: string } }[] = [
  { id: "urgente", titulo: "Urgente", insignia: { tono: "error", texto: "Urgente" } },
  { id: "hoy", titulo: "Para hoy", insignia: { tono: "atencion", texto: "Hoy" } },
  { id: "semana", titulo: "Esta semana", insignia: { tono: "neutra", texto: "Esta semana" } },
  { id: "sin-accion", titulo: "No necesitan nada" },
];

function VistaCorreo({ ahora, ir, de, pedir }: { ahora: Date | null; ir: (d: Destino) => void; de?: string; pedir: (texto: string, con: string) => void }) {
  const lista = de ? DEMO_CORREOS.filter((c) => c.remitente === de) : DEMO_CORREOS;
  const [abierto, setAbierto] = useState<string | null>(de && lista.length === 1 ? lista[0].id : null);
  return (
    <div className="pnl-pagina">
      <header className="pnl-vista__cabeza">
        <div>
          <h1 className="pnl-vista__titulo">
            Correo
            {MARCA_EJEMPLO}
          </h1>
          <p className="pnl-vista__texto">
            Clara leyó 23 correos hoy y los ordenó por urgencia. En tu panel lee tu Gmail de verdad, solo lectura: nunca envía ni borra nada sin ti.
          </p>
        </div>
        {de ? (
          <button type="button" className="pnl-filtro pnl-filtro--quitar pnl-picable" onClick={() => ir({ vista: "correo" })} aria-label={`Quitar el filtro: ${de}`}>
            De: {de}
            <Icono nombre="cerrar" tam={16} />
          </button>
        ) : null}
      </header>

      {de && !lista.length ? (
        <section className="pnl-tarjeta">
          <Vacio
            icono="correo"
            titulo={`Hoy no hay correos de ${de}`}
            texto="En el ejemplo, Clara solo leyó los correos de hoy. Los de otros días se cuentan en Estadísticas."
            accion={
              <Boton variante="sutil" tam="compacto" onClick={() => ir({ vista: "correo" })}>
                Ver todos los correos
              </Boton>
            }
          />
        </section>
      ) : null}

      {PRIORIDADES.map((p) => {
        const correos = lista.filter((c) => c.prioridad === p.id);
        if (!correos.length) return null;
        return (
          <Tarjeta key={p.id} titulo={p.titulo} accion={<span className="pnl-cuenta cifras-app">{p.id === "sin-accion" ? 20 : correos.length}</span>}>
            <ul className="pnl-movs">
              {correos.map((c) => {
                const esteAbierto = abierto === c.id;
                const idDetalle = `correo-${c.id}-detalle`;
                return (
                  <li key={c.id} className={`pnl-correo${esteAbierto ? " pnl-correo--abierto" : ""}`}>
                    <button type="button" className="dash-correo pnl-correo__fila pnl-picable" aria-expanded={esteAbierto} aria-controls={idDetalle} onClick={() => setAbierto(esteAbierto ? null : c.id)}>
                      {c.prioridad === "sin-accion" ? (
                        <span className="pnl-letra pnl-letra--32 pnl-letra--neutra" aria-hidden="true">
                          <Icono nombre="correo" tam={16} />
                        </span>
                      ) : (
                        <Letra nombre={c.remitente} />
                      )}
                      <span className="dash-correo__cuerpo">
                        <span className="dash-correo__linea">
                          <span className="dash-correo__remitente">{c.remitente}</span>
                          <span className="dash-correo__asunto">{c.asunto}</span>
                        </span>
                        <span className="dash-correo__resumen">{c.resumen}</span>
                      </span>
                      <span className="dash-correo__fin">
                        <Hora item={c} ahora={ahora} />
                        {p.insignia ? (
                          <Insignia tono={p.insignia.tono} conPunto>
                            {p.insignia.texto}
                          </Insignia>
                        ) : null}
                      </span>
                    </button>
                    <div id={idDetalle} className="pnl-correo__detalle" hidden={!esteAbierto}>
                      {c.accion ? (
                        <button type="button" className="dash-correo__accion pnl-correo__accion" onClick={() => ir({ vista: "pendientes", tipo: "correos", accion: c.accion })}>
                          <Icono nombre="flecha" tam={16} />
                          {c.accion}
                        </button>
                      ) : (
                        <p className="dash-nota">Clara no ve nada que hacer con este correo.</p>
                      )}
                      <div className="pnl-correo__acciones">
                        <Boton
                          variante="sutil"
                          tam="compacto"
                          icono={<Icono nombre="mensaje" tam={16} />}
                          onClick={() => pedir(`Ayúdame con el correo de ${c.remitente}: «${c.asunto}». ${c.accion ?? "¿Hay que hacer algo?"}`, "clara")}
                        >
                          Pedirle a Clara que lo vea
                        </Boton>
                        {c.accion ? (
                          <Boton variante="fantasma" tam="compacto" onClick={() => ir({ vista: "pendientes", tipo: "correos", accion: c.accion })}>
                            Ver en Pendientes
                          </Boton>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>
        );
      })}

      <div className="pnl-tarjeta pnl-correo-chat">
        <p>¿Prefieres que Clara te lo resuma en el chat? Escríbele /resumir-correos.</p>
        <Boton variante="sutil" tam="compacto" icono={<Icono nombre="mensaje" tam={16} />} onClick={() => ir({ vista: "conversaciones", con: "clara" })}>
          Hablar con Clara
        </Boton>
      </div>
    </div>
  );
}
