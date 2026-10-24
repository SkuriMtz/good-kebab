"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import type { ElementoMenu } from "@/components/base/Menu";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import { Armazon } from "./Armazon";
import { UsoPlan } from "./Columna";
import { nombresAgentes } from "./nombres";
import { useAhora } from "./tiempo";
import type { AgenteLateral, ElementoNav, GrupoLateral, IdVista, ResultadoBusqueda } from "./tipos";

export type DatosArmazonPanel = {
  correo: string;
  nombre: string;
  foto?: string | null;
  planId: IdPlan;
  /** Los agentes que de verdad trabajan con la persona (su plan + su elección). */
  activos: IdAgente[];
  negocio: string;
  /** Mensajes usados este mes (la línea del plan al pie del lateral). */
  usados: number;
  conGoogle: boolean;
  grupos: { id: string; nombre: string; agentes: IdAgente[] }[];
};

const NOMBRE: Record<string, string> = {
  resumen: "Panel",
  actividad: "Actividad",
  conversaciones: "Conversaciones",
  agentes: "Agentes",
  correo: "Correo",
};

/**
 * El armazón del panel real (/panel/*) con los datos de la cuenta: plan,
 * equipo, grupos y sesión. Navegar entre Resumen, Conversaciones, Agentes y
 * Correo no recarga: el layout se queda y solo cambia el contenido.
 * Lo que todavía no existe (Citas, Clientes, Reportes, Configuración,
 * Perfil, Mi negocio, Importar contactos) se marca "Pronto".
 */
export function ArmazonPanel({ datos, vista: vistaForzada, children }: { datos: DatosArmazonPanel; vista?: IdVista; children: ReactNode }) {
  const ruta = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const ahora = useAhora();
  const plan = PLAN_POR_ID[datos.planId];
  const conGrupos = plan.id !== "free";

  const vista: IdVista =
    vistaForzada ??
    (ruta.startsWith("/panel/chat")
      ? "conversaciones"
      : ruta.startsWith("/panel/agentes")
        ? "agentes"
        : params.get("vista") === "correo"
          ? "correo"
          : params.get("vista") === "actividad"
            ? "actividad"
            : "resumen");

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const nav: ElementoNav[] = [
    { id: "resumen", etiqueta: "Inicio", icono: "inicio", href: "/panel" },
    { id: "actividad", etiqueta: "Actividad", icono: "rayo", href: "/panel?vista=actividad" },
  ];

  const agentes: AgenteLateral[] = IDS_AGENTES.map((id) => {
    if (!plan.agentes.includes(id)) {
      return { id, estado: { tono: "neutro", etiqueta: "No incluido" }, bloqueado: `Con ${planMinimo(id).nombre}`, href: `/panel/agentes#agente-${id}` };
    }
    if (!datos.activos.includes(id)) {
      return { id, estado: { tono: "neutro", etiqueta: "Fuera de tu equipo" }, href: `/panel/agentes#agente-${id}` };
    }
    const etiqueta = id === "clara" ? (datos.conGoogle ? "Conectada a tu Gmail" : "Lista para leer correos") : "Lista en el chat";
    return { id, estado: { tono: "exito", etiqueta }, href: `/panel/chat?agente=${id}` };
  });

  const grupos: GrupoLateral[] = datos.grupos.map((g) => ({ ...g, href: `/panel/chat?c=${encodeURIComponent(g.id)}` }));

  const conLola = datos.activos.includes("lola");
  const crear: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Crear" },
    { id: "conversacion", etiqueta: "Nueva conversación", descripcion: `Con ${nombresAgentes(datos.activos)}`, icono: "mensaje", href: "/panel/chat" },
    conLola
      ? { id: "cita", etiqueta: "Agendar cita", descripcion: "Pídesela a Lola en su chat", icono: "calendario", href: "/panel/chat?agente=lola" }
      : { id: "cita", etiqueta: "Agendar cita", descripcion: `Lola llega con ${planMinimo("lola").nombre}`, icono: "calendario", deshabilitado: true },
    conGrupos
      ? { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "En Conversaciones, «Nuevo grupo»", icono: "usuarios", href: "/panel/chat" }
      : { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Los grupos llegan con Atendel One", icono: "usuarios", deshabilitado: true },
  ];

  const perfil: ElementoMenu[] = [
    { id: "agentes", etiqueta: "Mis agentes", descripcion: "Tu equipo y tu plan", icono: "agentes", href: "/panel/agentes" },
    { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", href: "/panel/chat" },
    { id: "correo", etiqueta: "Correo", descripcion: "Clara, Gmail y tu historial", icono: "correo", href: "/panel?vista=correo" },
    { tipo: "separador" },
    { id: "plan", etiqueta: "Plan y facturación", descripcion: plan.nombre, icono: "facturacion", href: "/panel/agentes#plan" },
  ];

  const indice: ResultadoBusqueda[] = useMemo(
    () => [
      { id: "s-resumen", grupo: "Secciones", titulo: "Inicio", icono: "inicio", href: "/panel" },
      { id: "s-actividad", grupo: "Secciones", titulo: "Actividad", icono: "rayo", href: "/panel?vista=actividad" },
      { id: "s-chat", grupo: "Secciones", titulo: "Conversaciones", icono: "conversaciones", href: "/panel/chat" },
      { id: "s-agentes", grupo: "Secciones", titulo: "Agentes", detalle: "Tu equipo y tu plan", icono: "agentes", href: "/panel/agentes" },
      { id: "s-correo", grupo: "Secciones", titulo: "Correo", detalle: "Resume un correo con Clara", icono: "correo", href: "/panel?vista=correo" },
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
      seccion={NOMBRE[vista] ?? "Resumen"}
      inicio={{ href: "/panel" }}
      nav={nav}
      activa={vista}
      agentes={agentes}
      accionAgentes={
        <Link href="/panel/agentes" className="boton-icono boton-icono--capa boton-icono--compacto" aria-label="Ver y buscar tus agentes" title="Ver y buscar tus agentes">
          <Icono nombre="buscar" tam={20} />
        </Link>
      }
      grupos={grupos}
      accionGrupos={
        conGrupos ? (
          <Link href="/panel/chat" className="boton-icono boton-icono--capa boton-icono--compacto" aria-label="Nuevo grupo" title="Nuevo grupo">
            <Icono nombre="mas" tam={20} />
          </Link>
        ) : null
      }
      vacioGrupos={
        <p className="dash-nota dash-lateral__vacio">
          {conGrupos
            ? `Junta a dos o más agentes en una conversación: ${nombresAgentes(datos.activos.slice(0, 2))} pueden trabajar juntos.`
            : `Los chats en grupo llegan con Atendel One. Hoy trabajas con ${AGENTE_POR_ID[datos.activos[0] ?? "clara"].nombre}.`}
        </p>
      }
      indice={indice}
      crear={crear}
      avisos={[]}
      ahora={ahora}
      usuario={{ nombre: datos.nombre, correo: datos.correo, foto: datos.foto, estado: { tono: "exito", etiqueta: plan.nombre } }}
      perfil={perfil}
      salir={{ id: "salir", etiqueta: "Cerrar sesión", icono: "cerrar-sesion", peligroso: true, alElegir: salir }}
      pieLateral={<UsoPlan plan={plan} usados={datos.usados} accion={{ href: "/panel/agentes#plan" }} />}
      conversaciones={{ href: "/panel/chat" }}
      completo={completo}
    >
      {completo ? <div className="dash-chat-real">{children}</div> : children}
    </Armazon>
  );
}
