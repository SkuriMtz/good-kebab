"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import { FichasAgentes } from "@/components/agentes/FichasAgentes";
import type { ElementoMenu } from "@/components/base/Menu";
import { AGENTES_INFO, AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import { Armazon, coincide } from "./Armazon";
import type { AgenteLateral, ElementoLateral, GrupoResultados } from "./tipos";

/* =====================================================================
   El armazón del PANEL con datos reales (lo monta src/app/panel/layout.tsx).
   Todo lo que muestra sale de la cuenta: plan, uso, equipo, grupos y los
   últimos resúmenes de Clara. Lo que todavía no existe dice "Pronto".
   ===================================================================== */

export type ConversacionPanel = {
  id: string;
  agente: IdAgente;
  titulo: string;
  actualizado_en: string;
  participantes: IdAgente[] | null;
};

export type ResumenPanel = {
  id: string;
  remitente: string | null;
  asunto: string | null;
  resumen: string;
  accion_sugerida: string | null;
  creado_en: string;
};

const conSugerencia = (a: string | null) => Boolean(a && a.trim().toLowerCase() !== "ninguna");

export function ArmazonPanel({
  email,
  nombre,
  foto,
  planId,
  activos,
  conGoogle,
  conversaciones,
  resumenes,
  nuevos,
  ruta,
  children,
}: {
  email: string;
  /** Nombre de la cuenta (Google lo da); si no hay, se usa el correo. */
  nombre: string | null;
  foto: string | null;
  planId: IdPlan;
  activos: IdAgente[];
  conGoogle: boolean;
  conversaciones: ConversacionPanel[];
  resumenes: ResumenPanel[];
  /** Resúmenes de las últimas 24 horas (la campana). */
  nuevos: number;
  /** Solo para la vista previa sin sesión: la ruta que se finge. */
  ruta?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();
  const camino = ruta ?? pathname;
  const vista = parametros.get("vista");
  const plan = PLAN_POR_ID[planId];

  const activa = camino.startsWith("/panel/chat")
    ? "conversaciones"
    : camino.startsWith("/panel/agentes")
      ? "agentes"
      : vista === "correo"
        ? "correo"
        : "resumen";
  const seccion = { resumen: "Resumen", conversaciones: "Conversaciones", agentes: "Agentes", correo: "Correo" }[activa];

  const salir = useCallback(async () => {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }, [router]);

  const navegacion: ElementoLateral[] = [
    { id: "resumen", etiqueta: "Resumen", icono: "inicio", href: "/panel" },
    { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", href: "/panel/chat" },
    { id: "agentes", etiqueta: "Agentes", icono: "agentes", href: "/panel/agentes" },
    { id: "citas", etiqueta: "Citas", icono: "calendario", pronto: true },
    { id: "correo", etiqueta: "Correo", icono: "correo", href: "/panel?vista=correo" },
    { id: "clientes", etiqueta: "Clientes", icono: "clientes", pronto: true },
    { id: "reportes", etiqueta: "Reportes", icono: "grafica", pronto: true },
    { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
  ];

  const agentes: AgenteLateral[] = AGENTES_INFO.map((a) => {
    if (!plan.agentes.includes(a.id)) {
      return { id: a.id, nombre: a.nombre, estado: `Con ${planMinimo(a.id).nombre}`, tono: "neutro", apagado: true, href: "/panel/agentes" };
    }
    if (!activos.includes(a.id)) {
      return { id: a.id, nombre: a.nombre, estado: "Fuera de tu equipo", tono: "neutro", apagado: true, href: "/panel/agentes" };
    }
    return {
      id: a.id,
      nombre: a.nombre,
      estado: a.id === "clara" && conGoogle ? "Conectada a Gmail" : "En tu equipo",
      tono: "exito",
      href: `/panel/chat?agente=${a.id}`,
    };
  });

  const grupos = conversaciones
    .filter((c) => (c.participantes ?? []).length >= 2)
    .slice(0, 5)
    .map((c) => ({ id: c.id, nombre: c.titulo, agentes: c.participantes ?? [c.agente], href: `/panel/chat?c=${c.id}` }));
  const conGrupos = plan.id !== "free";

  const crear: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Crear" },
    { id: "conversacion", etiqueta: "Nueva conversación", icono: "mensaje", descripcion: "Con uno de tus agentes", href: "/panel/chat" },
    { id: "resumir", etiqueta: "Resumir un correo", icono: "correo", descripcion: "Clara te dice qué hacer", href: "/panel?vista=correo#probar" },
    { id: "cita", etiqueta: "Agendar cita", icono: "calendario", pronto: true },
    conGrupos
      ? { id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios", descripcion: "Desde Conversaciones", href: "/panel/chat" }
      : { id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios", descripcion: "Con Atendel One", deshabilitado: true },
    { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
  ];

  const conAccion = resumenes.filter((r) => conSugerencia(r.accion_sugerida)).slice(0, 5);
  const avisos: ElementoMenu[] = conAccion.length
    ? [
        { tipo: "titulo", etiqueta: "Clara te sugiere" },
        ...conAccion.map<ElementoMenu>((r) => ({
          id: `aviso-${r.id}`,
          etiqueta: r.asunto || "Correo sin asunto",
          descripcion: r.remitente ?? undefined,
          icono: "correo",
          href: "/panel?vista=correo#historial",
        })),
        { tipo: "separador" },
        { id: "aviso-todo", etiqueta: "Ver lo que Clara leyó", icono: "flecha", href: "/panel?vista=correo#historial" },
      ]
    : [
        { tipo: "titulo", etiqueta: "Avisos" },
        { id: "aviso-nada", etiqueta: "Todo al día", descripcion: "Aquí te avisamos cuando Clara resuma algo nuevo.", icono: "check", deshabilitado: true },
      ];

  const buscar = (q: string): GrupoResultados[] => [
    {
      titulo: "Conversaciones",
      elementos: conversaciones
        .filter((c) => coincide(c.titulo, q))
        .slice(0, 8)
        .map((c) => ({ id: `c-${c.id}`, etiqueta: c.titulo, detalle: AGENTE_POR_ID[c.agente]?.nombre, agente: c.agente, href: `/panel/chat?c=${c.id}` })),
    },
    {
      titulo: "Correos que Clara leyó",
      elementos: resumenes
        .filter((r) => coincide(`${r.asunto ?? ""} ${r.remitente ?? ""} ${r.resumen}`, q))
        .slice(0, 8)
        .map((r) => ({ id: `r-${r.id}`, etiqueta: r.asunto || "Correo sin asunto", detalle: r.resumen, icono: "correo" as const, href: "/panel?vista=correo#historial" })),
    },
    {
      titulo: "Agentes",
      elementos: AGENTES_INFO.filter((a) => coincide(`${a.nombre} ${a.area} ${a.abarca}`, q)).map((a) => ({
        id: `a-${a.id}`,
        etiqueta: a.nombre,
        detalle: `${a.area} · ${a.abarca}`,
        agente: a.id,
        href: activos.includes(a.id) ? `/panel/chat?agente=${a.id}` : "/panel/agentes",
      })),
    },
    {
      titulo: "Secciones",
      elementos: navegacion
        .filter((n) => !n.pronto && coincide(n.etiqueta, q))
        .map((n) => ({ id: `s-${n.id}`, etiqueta: n.etiqueta, icono: n.icono, href: n.href })),
    },
  ];

  return (
    <>
      <Armazon
        seccion={seccion}
        inicio={{ href: "/panel" }}
        navegacion={navegacion}
        activa={activa}
        agentes={agentes}
        grupos={grupos}
        nuevoGrupo={conGrupos ? { etiqueta: "Nuevo grupo", href: "/panel/chat" } : null}
        sinGrupos={conGrupos ? "Aún no tienes grupos. Créalos en Conversaciones." : "Los chats en grupo llegan con Atendel One."}
        usuario={{ nombre: nombre ?? email, correo: email, foto }}
        perfil={[
          { id: "perfil", etiqueta: "Perfil", icono: "perfil", pronto: true },
          { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
          { id: "plan", etiqueta: "Plan y facturación", icono: "facturacion", descripcion: plan.nombre, href: "/panel/agentes" },
          { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", pronto: true },
        ]}
        salir={{ etiqueta: "Cerrar sesión", alElegir: salir }}
        crear={crear}
        avisos={{ elementos: avisos, sinLeer: nuevos }}
        buscar={buscar}
        pantalla={activa === "conversaciones"}
      >
        {children}
      </Armazon>
      <FichasAgentes />
    </>
  );
}
