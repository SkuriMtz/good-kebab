"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import type { ElementoMenu } from "@/components/base/Menu";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import { Armazon } from "./Armazon";
import type { ResultadoBusqueda } from "./BuscadorGlobal";
import type { AgenteLateral, ElementoNav, GrupoLateral } from "./Lateral";

/*
 * El armazón con los DATOS REALES de la cuenta (/panel y sus páginas).
 * Todo lo que todavía no existe se ve, marcado "Pronto", sin fingir que
 * funciona. El plan no se cambia desde aquí: solo se ve.
 */

export type GrupoPanel = { id: string; nombre: string; agentes: IdAgente[] };

type Vista = "resumen" | "conversaciones" | "agentes" | "correo";
const TITULO: Record<Vista, string> = { resumen: "Resumen", conversaciones: "Conversaciones", agentes: "Agentes", correo: "Correo" };

export function ArmazonPanel({
  usuario,
  planId,
  activos,
  conGoogle,
  grupos,
  children,
}: {
  usuario: { nombre: string; correo: string; foto: string | null };
  planId: IdPlan;
  activos: IdAgente[];
  conGoogle: boolean;
  grupos: GrupoPanel[];
  children: ReactNode;
}) {
  const ruta = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const plan = PLAN_POR_ID[planId];
  const vista: Vista = ruta.startsWith("/panel/chat")
    ? "conversaciones"
    : ruta.startsWith("/panel/agentes")
      ? "agentes"
      : params.get("vista") === "correo"
        ? "correo"
        : "resumen";

  const nav: ElementoNav[] = [
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
    if (activos.includes(a.id))
      return {
        id: a.id,
        tono: "exito",
        texto: a.id === "clara" && conGoogle ? "Conectada a tu Gmail" : "Disponible",
        accion: { etiqueta: `Hablar con ${a.nombre}`, href: `/panel/chat?agente=${a.id}` },
      };
    if (plan.agentes.includes(a.id))
      return { id: a.id, tono: "neutro", texto: "Fuera de tu equipo", accion: { etiqueta: "Tu equipo", href: "/panel/agentes" } };
    return { id: a.id, tono: "neutro", texto: `Con ${planMinimo(a.id).nombre}`, bloqueado: true, accion: { etiqueta: "Tu equipo", href: "/panel/agentes" } };
  });

  const lateralGrupos: GrupoLateral[] = grupos.map((g) => ({ ...g, accion: { etiqueta: g.nombre, href: `/panel/chat?c=${g.id}` } }));
  const conGrupos = plan.id !== "free";

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const menuCrear: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Crear" },
    { id: "conversacion", etiqueta: "Nueva conversación", icono: "mensaje", href: "/panel/chat" },
    { id: "correo", etiqueta: "Resumir un correo", descripcion: "Pega un correo y Clara lo resume", icono: "correo", href: "/panel?vista=correo" },
    conGrupos
      ? { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Desde la lista de chats", icono: "usuarios", href: "/panel/chat" }
      : { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Con Atendel One", icono: "usuarios", deshabilitado: true },
    { id: "cita", etiqueta: "Agendar cita", icono: "calendario", pronto: true },
    { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
  ];

  const menuPerfil: ElementoMenu[] = [
    { id: "perfil", etiqueta: "Perfil", icono: "perfil", pronto: true },
    { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
    { id: "plan", etiqueta: "Plan y facturación", descripcion: plan.nombre, icono: "facturacion", href: "/panel/agentes#plan" },
    { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", pronto: true },
    { tipo: "separador" },
    { id: "salir", etiqueta: "Cerrar sesión", icono: "cerrar-sesion", peligroso: true, alElegir: salir },
  ];

  // Todavía no hay avisos guardados: se dice tal cual y se manda a la actividad
  const avisos: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Avisos" },
    { id: "nada", etiqueta: "Por ahora no hay avisos", descripcion: "Lo que hace tu equipo está en el Resumen.", icono: "check-circulo", deshabilitado: true },
    { id: "actividad", etiqueta: "Ver la actividad", icono: "reloj", href: "/panel#actividad" },
  ];

  const busqueda: ResultadoBusqueda[] = useMemo(
    () => [
      { id: "v-resumen", grupo: "Vistas", etiqueta: "Resumen", icono: "inicio", accion: { etiqueta: "Resumen", href: "/panel" } },
      { id: "v-chat", grupo: "Vistas", etiqueta: "Conversaciones", icono: "conversaciones", accion: { etiqueta: "Conversaciones", href: "/panel/chat" } },
      { id: "v-agentes", grupo: "Vistas", etiqueta: "Agentes", detalle: "Tu equipo y tu plan", icono: "agentes", accion: { etiqueta: "Agentes", href: "/panel/agentes" } },
      { id: "v-correo", grupo: "Vistas", etiqueta: "Correo", detalle: "Resumir un correo, Gmail e historial", icono: "correo", accion: { etiqueta: "Correo", href: "/panel?vista=correo" } },
      ...AGENTES_INFO.map((a) => ({
        id: `a-${a.id}`,
        grupo: "Agentes",
        etiqueta: a.nombre,
        detalle: activos.includes(a.id) ? `${a.area} · ${a.abarca}` : `Con ${planMinimo(a.id).nombre}`,
        agentes: [a.id],
        accion: { etiqueta: a.nombre, href: activos.includes(a.id) ? `/panel/chat?agente=${a.id}` : "/panel/agentes" },
      })),
      ...grupos.map((g) => ({
        id: `g-${g.id}`,
        grupo: "Grupos",
        etiqueta: g.nombre,
        detalle: "Chat en grupo",
        agentes: g.agentes,
        accion: { etiqueta: g.nombre, href: `/panel/chat?c=${g.id}` },
      })),
    ],
    [activos, grupos],
  );

  return (
    <Armazon
      seccion={TITULO[vista]}
      inicio={{ etiqueta: "Resumen", href: "/panel" }}
      nav={nav}
      activo={vista}
      agentes={agentes}
      grupos={lateralGrupos}
      grupoNuevo={conGrupos ? { accion: { etiqueta: "Nuevo grupo", href: "/panel/chat" } } : { nota: "Grupos con Atendel One" }}
      usuario={{ nombre: usuario.nombre, correo: usuario.correo, foto: usuario.foto, estado: { tono: "exito", etiqueta: "En línea" } }}
      menuPerfil={menuPerfil}
      menuCrear={menuCrear}
      avisos={avisos}
      busqueda={busqueda}
      modo={vista === "conversaciones" ? "chat" : "normal"}
    >
      {children}
    </Armazon>
  );
}
