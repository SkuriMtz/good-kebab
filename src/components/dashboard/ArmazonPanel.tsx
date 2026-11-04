"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useMemo, type MouseEvent, type ReactNode } from "react";
import type { ElementoMenu } from "@/components/base/Menu";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import { ponerTema } from "@/lib/tema";
import { conTransicion, rutaPintada } from "@/lib/transiciones";
import { Armazon } from "./Armazon";
import { UsoPlan } from "./Columna";
import { nombresAgentes } from "./nombres";
import { useAhora } from "./tiempo";
import type { ElementoNav, IdVista, NovedadLateral, PasoInicio, ResultadoBusqueda, SubElementoNav } from "./tipos";
import { useTema } from "./useTema";

export type DatosArmazonPanel = {
  correo: string;
  nombre: string;
  foto?: string | null;
  planId: IdPlan;
  /** Los agentes que de verdad trabajan con la persona (su plan + su elección). */
  activos: IdAgente[];
  negocio: string;
  /** Mensajes usados este mes (al pie del menú). */
  usados: number;
  conGoogle: boolean;
  grupos: { id: string; nombre: string; agentes: IdAgente[] }[];
  /** ¿Ya tuvo al menos una conversación? (un paso de "Primeros pasos"). */
  conConversaciones: boolean;
  /** Correos con una acción sugerida (el número de "Pendientes"). null si no se pudo leer. */
  pendientes: number | null;
  version?: string;
};

/** Las vistas de /panel que viven en ?vista= (todas son la misma página). */
const VISTAS_PANEL: IdVista[] = ["pendientes", "estadisticas", "correo", "actividad"];

/** La clave de una dirección del panel para la transición entre vistas ("/panel/?pendientes"). */
function claveDe(url: URL) {
  if (url.pathname !== "/panel") return url.pathname;
  const v = url.searchParams.get("vista");
  return `/panel/?${v && VISTAS_PANEL.includes(v as IdVista) ? v : "resumen"}`;
}

/** Los pasos de "Primeros pasos" con lo que de verdad ya hizo la persona. */
export function pasosPanel(d: { activos: IdAgente[]; conGoogle: boolean; conConversaciones: boolean; conGrupo: boolean; conGrupos: boolean }): PasoInicio[] {
  return [
    { id: "equipo", titulo: "Elige a tu equipo", detalle: nombresAgentes(d.activos), listo: d.activos.length > 0, href: "/panel/agentes" },
    { id: "gmail", titulo: "Conecta tu Gmail", detalle: "Clara lo lee. Solo lectura.", listo: d.conGoogle, href: "/panel?vista=correo#gmail" },
    { id: "chat", titulo: "Tu primera conversación", detalle: "Pídele algo a un agente.", listo: d.conConversaciones, href: "/panel/chat" },
    ...(d.conGrupos ? [{ id: "grupo", titulo: "Tu primer grupo", detalle: "Junta a dos agentes en un chat.", listo: d.conGrupo, href: "/panel/chat" }] : []),
  ];
}

/**
 * El armazón del panel real (/panel/*) con los datos de la cuenta: plan,
 * equipo, grupos y sesión. Navegar entre vistas no recarga: el layout se
 * queda y solo cambia el contenido, con la transición de siempre (también
 * entre las vistas de ?vista=, que son la misma página).
 */
export function ArmazonPanel({ datos, children }: { datos: DatosArmazonPanel; children: ReactNode }) {
  const ruta = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const ahora = useAhora();
  const tema = useTema();
  const plan = PLAN_POR_ID[datos.planId];
  const conGrupos = plan.id !== "free";
  const parametro = params.get("vista");

  const vista: IdVista = ruta.startsWith("/panel/chat")
    ? "conversaciones"
    : ruta.startsWith("/panel/agentes")
      ? "agentes"
      : parametro && VISTAS_PANEL.includes(parametro as IdVista)
        ? (parametro as IdVista)
        : "resumen";
  const agenteVisto = vista === "agentes" ? params.get("agente") : null;
  const chatVisto = vista === "conversaciones" ? params.get("c") : null;

  // La vista nueva ya se pintó: la transición entre vistas puede seguir
  const clave = ruta === "/panel" ? `/panel/?${vista}` : ruta;
  useLayoutEffect(() => {
    rutaPintada(clave);
  }, [clave]);

  /** Entre vistas de la misma página (/panel?vista=…), la transición la arranca aquí. */
  const alNavegar = (e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const destino = new URL(a.href, window.location.href);
    const actual = new URL(window.location.href);
    if (destino.origin !== actual.origin || destino.pathname !== "/panel" || actual.pathname !== "/panel") return;
    const desde = claveDe(actual);
    const hacia = claveDe(destino);
    if (desde === hacia) return;
    e.preventDefault();
    conTransicion(desde, () => router.push(`${destino.pathname}${destino.search}${destino.hash}`), hacia);
  };

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const subAgentes: SubElementoNav[] = IDS_AGENTES.map((id) => {
    const info = AGENTE_POR_ID[id];
    const base = { id, etiqueta: info.nombre, agente: id, href: `/panel/agentes?agente=${id}`, actual: agenteVisto === id };
    if (!plan.agentes.includes(id)) return { ...base, bloqueado: true, detalle: `Con ${planMinimo(id).nombre}` };
    if (!datos.activos.includes(id)) return { ...base, estado: { tono: "neutro", etiqueta: "Fuera de tu equipo" } };
    return { ...base, estado: { tono: "exito", etiqueta: id === "clara" && datos.conGoogle ? "Conectada a tu Gmail" : "Lista en el chat" } };
  });

  const nav: ElementoNav[] = [
    { id: "resumen", etiqueta: "Inicio", icono: "inicio", href: "/panel" },
    {
      id: "conversaciones",
      etiqueta: "Chat",
      icono: "conversaciones",
      href: "/panel/chat",
      hijos: [
        { id: "nueva", etiqueta: "Nueva conversación", icono: "mas", href: "/panel/chat" },
        ...datos.grupos.map((g) => ({ id: `g-${g.id}`, etiqueta: g.nombre, agentes: g.agentes, href: `/panel/chat?c=${encodeURIComponent(g.id)}`, actual: chatVisto === g.id })),
      ],
    },
    { id: "agentes", etiqueta: "Agentes", icono: "agentes", href: "/panel/agentes", abierto: true, hijos: subAgentes },
    {
      id: "pendientes",
      etiqueta: "Pendientes",
      icono: "check-circulo",
      href: "/panel?vista=pendientes",
      contador: datos.pendientes ?? undefined,
      etiquetaContador: datos.pendientes ? `${datos.pendientes} por revisar` : undefined,
    },
    { id: "estadisticas", etiqueta: "Estadísticas", icono: "grafica", href: "/panel?vista=estadisticas" },
    { id: "correo", etiqueta: "Correo", icono: "correo", href: "/panel?vista=correo" },
    {
      id: "configuracion",
      etiqueta: "Ajustes",
      icono: "ajustes",
      href: "/panel/agentes#plan",
      hijos: [
        { id: "plan", etiqueta: "Plan y uso", icono: "facturacion", href: "/panel/agentes#plan" },
        { id: "gmail", etiqueta: datos.conGoogle ? "Gmail conectado" : "Conectar Gmail", icono: "correo", href: "/panel?vista=correo#gmail" },
        { id: "tema", etiqueta: tema === "oscuro" ? "Modo claro" : "Modo oscuro", icono: tema === "oscuro" ? "sol" : "luna", alElegir: () => ponerTema(tema === "oscuro" ? "claro" : "oscuro") },
        { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", pronto: true },
      ],
    },
  ];

  const conLola = datos.activos.includes("lola");
  const crear: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Nuevo" },
    { id: "conversacion", etiqueta: "Nueva conversación", descripcion: `Con ${nombresAgentes(datos.activos)}`, icono: "mensaje", href: "/panel/chat" },
    conLola
      ? { id: "cita", etiqueta: "Agendar cita", descripcion: "Pídesela a Lola en su chat", icono: "calendario", href: "/panel/chat?agente=lola" }
      : { id: "cita", etiqueta: "Agendar cita", descripcion: `Lola llega con ${planMinimo("lola").nombre}`, icono: "calendario", deshabilitado: true },
    conGrupos
      ? { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "En el chat, «Nuevo grupo»", icono: "usuarios", href: "/panel/chat" }
      : { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Los grupos llegan con Atendel One", icono: "usuarios", deshabilitado: true },
  ];

  const perfil: ElementoMenu[] = [
    { id: "agentes", etiqueta: "Mis agentes", descripcion: "Tu equipo y tu plan", icono: "agentes", href: "/panel/agentes" },
    { id: "conversaciones", etiqueta: "Chat", icono: "conversaciones", href: "/panel/chat" },
    { id: "correo", etiqueta: "Correo", descripcion: "Clara, Gmail y tu historial", icono: "correo", href: "/panel?vista=correo" },
    { tipo: "separador" },
    { id: "plan", etiqueta: "Plan y facturación", descripcion: plan.nombre, icono: "facturacion", href: "/panel/agentes#plan" },
  ];

  const formato = new Intl.NumberFormat("es-MX");
  const menuNegocio: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: datos.negocio },
    { id: "plan", etiqueta: "Ver mi plan y uso", descripcion: `${plan.nombre} · ${formato.format(datos.usados)} de ${formato.format(plan.mensajesMes)} mensajes`, icono: "facturacion", href: "/panel/agentes#plan" },
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

  const novedades: NovedadLateral[] = [
    { id: "estadisticas", titulo: "Estadísticas de tu equipo", href: "/panel?vista=estadisticas" },
    conGrupos ? { id: "grupos", titulo: "Chats en grupo con tus agentes", href: "/panel/chat" } : { id: "grupos", titulo: "Chats en grupo (Atendel One)", href: "/precios" },
    { id: "gmail", titulo: "Clara lee tu Gmail", href: "/panel?vista=correo#gmail" },
  ];

  const indice: ResultadoBusqueda[] = useMemo(
    () => [
      { id: "s-resumen", grupo: "Secciones", titulo: "Inicio", icono: "inicio", href: "/panel" },
      { id: "s-chat", grupo: "Secciones", titulo: "Chat", detalle: "Habla con tu equipo", icono: "conversaciones", href: "/panel/chat" },
      { id: "s-agentes", grupo: "Secciones", titulo: "Agentes", detalle: "Tu equipo y tu plan", icono: "agentes", href: "/panel/agentes" },
      { id: "s-pendientes", grupo: "Secciones", titulo: "Pendientes", detalle: "Lo que espera algo de ti", icono: "check-circulo", href: "/panel?vista=pendientes" },
      { id: "s-estadisticas", grupo: "Secciones", titulo: "Estadísticas", detalle: "Mensajes, conversaciones y correos", icono: "grafica", href: "/panel?vista=estadisticas" },
      { id: "s-correo", grupo: "Secciones", titulo: "Correo", detalle: "Resume un correo con Clara", icono: "correo", href: "/panel?vista=correo" },
      { id: "s-actividad", grupo: "Secciones", titulo: "Actividad", detalle: "Todo lo que hizo tu equipo", icono: "rayo", href: "/panel?vista=actividad" },
      ...AGENTES_INFO.filter((a) => datos.activos.includes(a.id)).map((a) => ({
        id: `a-${a.id}`,
        grupo: "Tu equipo",
        titulo: a.nombre,
        detalle: `${a.area} · ${a.abarca}`,
        agente: a.id,
        claves: a.capacidades.join(" "),
        href: `/panel/chat?agente=${a.id}`,
      })),
      ...datos.grupos.map((g) => ({
        id: `g-${g.id}`,
        grupo: "Grupos",
        titulo: g.nombre,
        detalle: nombresAgentes(g.agentes),
        icono: "usuarios" as const,
        href: `/panel/chat?c=${encodeURIComponent(g.id)}`,
      })),
    ],
    [datos.activos, datos.grupos],
  );

  const completo = vista === "conversaciones";

  return (
    <Armazon
      inicio={{ href: "/panel" }}
      nav={nav}
      activa={vista}
      negocio={{ nombre: datos.negocio, plan: plan.nombre.replace(/^Atendel\s+/, ""), menu: menuNegocio }}
      pasos={pasosPanel({ activos: datos.activos, conGoogle: datos.conGoogle, conConversaciones: datos.conConversaciones, conGrupo: datos.grupos.length > 0, conGrupos })}
      mejorar={plan.id === "max" ? undefined : { href: "/precios" }}
      ayuda={ayuda}
      novedades={novedades}
      version={datos.version}
      uso={<UsoPlan plan={plan} usados={datos.usados} accion={{ href: "/panel/agentes#plan" }} />}
      indice={indice}
      crear={crear}
      avisos={[]}
      ahora={ahora}
      usuario={{ nombre: datos.nombre, correo: datos.correo, foto: datos.foto, estado: { tono: "exito", etiqueta: plan.nombre } }}
      perfil={perfil}
      salir={{ id: "salir", etiqueta: "Cerrar sesión", icono: "cerrar-sesion", peligroso: true, alElegir: salir }}
      chat={{ href: "/panel/chat" }}
      completo={completo}
      alNavegar={alNavegar}
    >
      {completo ? <div className="dash-chat-real">{children}</div> : children}
    </Armazon>
  );
}
