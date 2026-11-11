"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { VistaNegocio } from "@/components/dashboard/estadisticas-negocio/VistaNegocio";
import { datosNegocioEjemplo } from "@/components/dashboard/estadisticas-negocio/ejemplo";
import { AGENTES_INFO, esIdAgente } from "@/lib/agentes";
import { DEMO_APROBACIONES, DEMO_NEGOCIO, DEMO_USUARIA } from "@/lib/demo-dashboard";
import { periodoDe, type Periodo } from "@/lib/estadisticas";
import { resumirNegocio } from "@/lib/resumen-negocio";
import { PLAN_POR_ID } from "@/lib/planes";
import { conTransicion, rutaPintada } from "@/lib/transiciones";
import { ActividadDemo } from "./Actividad";
import { Armazon, type ChatMenu, type ElementoCuenta, type IdSeccion, type ResultadoBusqueda } from "./Armazon";
import { ConversacionDemo, InicioDemo, useGuion, type ConvGuion } from "./ChatGuion";
import { nombresDe } from "./Mensajes";
import { PanelInfo, type TabInfo } from "./PanelInfo";
import { ContextoNavegar, Enlace } from "./Piezas";
import { Seccion } from "./Secciones";
import { AgentesDemo, AjustesDemo, CitasDemo, CorreoDemo, PendientesDemo, tableroInicial, type CitaDemo } from "./SeccionesDemo";
import { PEDIDOS, esArea } from "./pedidos";
import { fuenteDemo } from "./negocio/demo";
import { ContextoNegocio } from "./negocio/fuente";
import { TuNegocio, pestanaDe } from "./negocio/TuNegocio";

/* =====================================================================
   /pruebalo: el mismo panel con DATOS DE EJEMPLO de un negocio inventado
   (Estudio Luna, Ana). Todo vive en el navegador: cada enlace cambia la
   dirección sin ir al servidor (?vista=…, ?con=…, ?area=…), así atrás y
   recargar funcionan, y cada cambio de sección usa el cruce corto de
   ANIMACIONES.md (punto 1). El chat es el guion local de ChatDemo: aquí
   no se llama a la IA.
   ===================================================================== */

const VISTAS = ["agentes", "pendientes", "citas", "negocio", "estadisticas", "actividad", "correo", "ajustes"];
const PLAN = PLAN_POR_ID[DEMO_NEGOCIO.plan];

function claveDe(url: URL) {
  const v = url.searchParams.get("vista");
  if (v && VISTAS.includes(v)) return `/pruebalo?${v}`;
  return url.searchParams.get("con") ? "/pruebalo?chat" : "/pruebalo?inicio";
}

/** ¿Es un grupo con nombre? (empieza con "Creaste el grupo…"): va en Fijados. */
const esFijado = (c: ConvGuion) => c.agentes.length > 1 && c.mensajes[0]?.de === "sistema";

export function PanelDemo({ saludo, ahora }: { saludo: string; /** La hora de la página (la misma en el servidor y aquí). */ ahora: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const guion = useGuion();
  const [tablero, setTablero] = useState(() => tableroInicial(DEMO_APROBACIONES));
  const [citasExtra, setCitasExtra] = useState<CitaDemo[]>([]);

  const vista = params.get("vista");
  const valida = vista && VISTAS.includes(vista) ? vista : null;
  const con = params.get("con");
  const conv = con ? guion.convs.find((c) => c.id === con) : undefined;
  const clave = valida ? `/pruebalo?${valida}` : con ? "/pruebalo?chat" : "/pruebalo?inicio";
  const texto = (k: string, max = 200) => params.get(k)?.slice(0, max) || undefined;

  // La vista nueva ya se pintó: la transición puede seguir
  useLayoutEffect(() => {
    rutaPintada(clave);
  }, [clave]);

  /** Navegar sin ir al servidor (Next sincroniza useSearchParams); lo de fuera de /pruebalo navega normal. */
  const navegar = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/pruebalo") {
        router.push(href);
        return;
      }
      const desde = claveDe(new URL(window.location.href));
      const hacia = claveDe(url);
      const ir = () => {
        window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
        if (desde !== hacia) window.scrollTo({ top: 0 });
      };
      if (desde !== hacia) conTransicion(desde, ir, hacia);
      else ir();
    },
    [router],
  );

  const porRevisar = tablero.filter((i) => i.columna === "revisar").length;
  const ordenados = [...guion.convs].sort((a, b) => b.orden - a.orden);
  const aMenu = (c: ConvGuion): ChatMenu => ({ id: c.id, titulo: c.titulo, href: `/pruebalo?con=${c.id}`, agentes: c.agentes });
  const fijados = ordenados.filter(esFijado).map(aMenu);
  const recientes = ordenados.filter((c) => !esFijado(c)).map(aMenu);

  const activa: IdSeccion = valida === "actividad" ? "estadisticas" : valida ? (valida as IdSeccion) : conv ? "chat" : "inicio";

  const cuenta: ElementoCuenta[] = [
    { id: "plan", etiqueta: "Mi plan y uso", detalle: PLAN.nombre, icono: "facturacion", href: "/pruebalo?vista=ajustes" },
    { id: "planes", etiqueta: "Ver los planes", detalle: "Para cambiar de plan, escríbenos", icono: "estrella", href: "/precios" },
    { id: "crear", etiqueta: "Crear mi cuenta", icono: "perfil", href: "/entrar" },
    { id: "salir", etiqueta: "Salir de la demostración", icono: "cerrar-sesion", href: "/" },
  ];

  const indice: ResultadoBusqueda[] = useMemo(
    () => [
      { id: "s-inicio", grupo: "Secciones", titulo: "Nueva conversación", detalle: "Pídele algo a tu equipo", icono: "mas", href: "/pruebalo" },
      { id: "s-agentes", grupo: "Secciones", titulo: "Agentes", detalle: "Tu equipo y su semana", icono: "agentes", href: "/pruebalo?vista=agentes" },
      { id: "s-pendientes", grupo: "Secciones", titulo: "Pendientes", detalle: "Lo que espera tu visto bueno", icono: "check-circulo", href: "/pruebalo?vista=pendientes" },
      { id: "s-citas", grupo: "Secciones", titulo: "Citas", detalle: "La agenda de mañana", icono: "calendario", href: "/pruebalo?vista=citas" },
      { id: "s-negocio", grupo: "Secciones", titulo: "Tu negocio", detalle: "Perfil, documentos y apps de Estudio Luna", icono: "negocio", claves: "perfil documentos apps gmail calendar drive conectar subir", href: "/pruebalo?vista=negocio" },
      { id: "s-estadisticas", grupo: "Secciones", titulo: "Estadísticas", detalle: "Cómo va Estudio Luna", icono: "grafica", href: "/pruebalo?vista=estadisticas" },
      { id: "s-correo", grupo: "Secciones", titulo: "Correo", detalle: "Lo que Clara leyó hoy", icono: "correo", href: "/pruebalo?vista=correo" },
      { id: "s-actividad", grupo: "Secciones", titulo: "Actividad", detalle: "Lo último que pasó", icono: "rayo", href: "/pruebalo?vista=actividad" },
      { id: "s-ajustes", grupo: "Secciones", titulo: "Ajustes", detalle: "Plan, apariencia y cuenta", icono: "ajustes", href: "/pruebalo?vista=ajustes" },
      ...AGENTES_INFO.map((a) => ({ id: `a-${a.id}`, grupo: "Tu equipo", titulo: `Hablar con ${a.nombre}`, detalle: `${a.area} · ${a.abarca}`, agentes: [a.id], claves: a.capacidades.join(" "), href: `/pruebalo?con=${a.id}` })),
      ...PEDIDOS.map((p) => ({ id: `p-${p.id}`, grupo: "Pídele a tu equipo", titulo: p.titulo, detalle: p.detalle, agentes: [p.agente], href: `/pruebalo?agente=${p.agente}&pide=${encodeURIComponent(p.texto)}` })),
    ],
    [],
  );
  const indiceConChats: ResultadoBusqueda[] = [
    ...indice,
    ...fijados.map((g) => ({ id: `f-${g.id}`, grupo: "Fijados", titulo: g.titulo, detalle: nombresDe(g.agentes), agentes: g.agentes, href: g.href })),
    ...recientes.map((r) => ({ id: `r-${r.id}`, grupo: "Recientes", titulo: r.titulo, agentes: r.agentes, href: r.href })),
  ];

  // El panel de información de la derecha: en el inicio y en las conversaciones
  const cargarInfo = useCallback(async (p: Periodo) => resumirNegocio(datosNegocioEjemplo(p, new Date(ahora))), [ahora]);
  const info = valida
    ? undefined
    : ({ tab, alCambiarTab, alCerrar }: { tab: TabInfo; alCambiarTab: (t: TabInfo) => void; alCerrar: () => void }) => (
        <PanelInfo
          tab={tab}
          alCambiarTab={alCambiarTab}
          ejemplo
          cargar={cargarInfo}
          equipo={AGENTES_INFO.map((a) => a.id)}
          enConversacion={conv?.agentes}
          pendientes={porRevisar}
          pendientesLista={tablero
            .flatMap((i) => (i.columna === "revisar" && i.agente ? [{ id: i.id, agente: i.agente, titulo: i.titulo, detalle: i.para }] : []))}
          hrefs={{
            pendientes: "/pruebalo?vista=pendientes",
            estadisticas: "/pruebalo?vista=estadisticas",
            negocio: "/pruebalo?vista=negocio&tab=apps",
            documentos: "/pruebalo?vista=negocio&tab=documentos",
            chatCon: (a) => `/pruebalo?con=${a}`,
          }}
          alCerrar={alCerrar}
        />
      );

  let contenido;
  if (valida === "agentes") {
    const a = params.get("agente");
    contenido = <AgentesDemo enfocado={esIdAgente(a) ? a : undefined} />;
  } else if (valida === "pendientes") {
    const area = params.get("area");
    contenido = (
      <PendientesDemo
        items={tablero}
        area={esArea(area) ? area : "todo"}
        accion={texto("accion")}
        alMover={(id, columna) => setTablero((t) => t.map((i) => (i.id === id ? { ...i, columna } : i)))}
        alEditar={(id, nuevo) => setTablero((t) => t.map((i) => (i.id === id ? { ...i, texto: nuevo, editado: true } : i)))}
      />
    );
  } else if (valida === "citas") {
    contenido = <CitasDemo estado={params.get("estado") ?? "todas"} de={texto("de")} dia={texto("dia", 10)} ahora={ahora} extra={citasExtra} alAgregar={(c) => setCitasExtra((l) => [...l, c])} />;
  } else if (valida === "negocio") {
    contenido = <TuNegocio tab={pestanaDe(params.get("tab"))} plan={DEMO_NEGOCIO.plan} />;
  } else if (valida === "estadisticas") {
    const periodo = periodoDe(params.get("periodo"));
    contenido = (
      <Seccion buscador={false}>
        <VistaNegocio datos={datosNegocioEjemplo(periodo, new Date(ahora))} periodo={periodo} base="/pruebalo" insignia={<span className="pc-estado pc-estado--azul">Datos de ejemplo</span>} />
      </Seccion>
    );
  } else if (valida === "actividad") {
    const h = Number(params.get("hora"));
    const dia = texto("dia", 10);
    contenido = (
      <ActividadDemo
        hora={params.get("hora") !== null && Number.isInteger(h) && h >= 0 && h <= 23 ? h : undefined}
        dia={dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : undefined}
        periodo={periodoDe(params.get("periodo"))}
        ahora={ahora}
      />
    );
  } else if (valida === "correo") {
    contenido = <CorreoDemo prioridad={params.get("prioridad") ?? "todo"} de={texto("de")} />;
  } else if (valida === "ajustes") {
    contenido = <AjustesDemo />;
  } else if (conv) {
    contenido = <ConversacionDemo guion={guion} conv={conv} />;
  } else if (con && !guion.listo) {
    // Una conversación nueva de esta visita: se recupera de la pestaña en un momento
    contenido = <div className="pc-conv" aria-busy="true" />;
  } else {
    const area = params.get("area");
    const agente = params.get("agente");
    contenido = (
      <InicioDemo
        guion={guion}
        saludo={saludo}
        area={esArea(area) ? area : "todo"}
        agentePedido={esIdAgente(agente) ? agente : null}
        pide={texto("pide", 2000)}
        pendientes={porRevisar}
        usados={DEMO_NEGOCIO.mensajesUsados}
        total={PLAN.mensajesMes}
        alEmpezar={(id) => navegar(`/pruebalo?con=${id}`)}
      />
    );
    if (con)
      contenido = (
        <>
          {contenido}
          <p className="pc-aviso-flota pc-aviso-flota--suave" role="status">
            Esa conversación de ejemplo ya no está: se borra al cerrar la pestaña.
          </p>
        </>
      );
  }

  return (
    <ContextoNavegar.Provider value={navegar}>
      <ContextoNegocio.Provider value={fuenteDemo}>
      <Armazon
        activa={activa}
        chatActual={conv?.id ?? null}
        hrefs={{
          inicio: "/pruebalo",
          agentes: "/pruebalo?vista=agentes",
          pendientes: "/pruebalo?vista=pendientes",
          citas: "/pruebalo?vista=citas",
          negocio: "/pruebalo?vista=negocio",
          estadisticas: "/pruebalo?vista=estadisticas",
          ajustes: "/pruebalo?vista=ajustes",
        }}
        pendientes={porRevisar}
        fijados={fijados}
        recientes={recientes}
        usuario={{ nombre: DEMO_USUARIA.nombre.split(" ")[0], plan: PLAN.nombre.replace(/^Atendel\s+/, "") }}
        cuenta={cuenta}
        indice={indiceConChats}
        info={info}
        aviso={
          <>
            <span className="pc-estado pc-estado--azul">Datos de ejemplo</span>
            <span className="pc-aviso-demo__texto">Estudio Luna · no llama a la IA</span>
            <Enlace href="/entrar" className="pc-enlace">
              Crear mi cuenta
            </Enlace>
          </>
        }
      >
        {contenido}
      </Armazon>
      </ContextoNegocio.Provider>
    </ContextoNavegar.Provider>
  );
}
