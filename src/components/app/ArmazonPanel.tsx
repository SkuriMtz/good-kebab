"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, type ReactNode } from "react";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import type { ElementoMenu } from "@/components/base/Menu";
import { Armazon } from "@/components/dashboard/Armazon";
import type { AgenteLateral, Destino, ElementoNav, GrupoLateral, IdSeccion, ResultadoBusqueda, Usuario } from "@/components/dashboard/tipos";

const TITULOS: Record<IdSeccion, string> = {
  resumen: "Resumen",
  conversaciones: "Conversaciones",
  agentes: "Agentes",
  citas: "Citas",
  correo: "Correo",
  clientes: "Clientes",
  reportes: "Reportes",
  configuracion: "Configuración",
};

/** A qué ruta del panel corresponde una vista (por si un componente pide ir a una vista). */
function rutaDe(d: Destino): string {
  if ("href" in d) return d.href;
  if (d.vista === "conversaciones") return d.con ? `/panel/chat?c=${encodeURIComponent(d.con)}` : "/panel/chat";
  if (d.vista === "agentes") return "/panel/agentes";
  if (d.vista === "correo") return "/panel?vista=correo";
  return d.pestana && d.pestana !== "actividad" ? `/panel?pestana=${d.pestana}` : "/panel";
}

/**
 * El armazón del dashboard con los datos REALES de la cuenta (lo monta
 * src/app/panel/layout.tsx alrededor de todas las páginas del panel):
 * secciones con su ruta, tus agentes según tu plan y tu equipo, tus grupos
 * de verdad, el buscador sobre tus conversaciones y el menú de tu cuenta.
 * Lo que todavía no existe (citas, clientes, reportes, configuración,
 * perfil) dice "Pronto" en vez de fingir que funciona.
 */
export function ArmazonPanel({
  usuario,
  planId,
  activos,
  negocio,
  conGoogle,
  grupos,
  conversaciones,
  children,
}: {
  usuario: Usuario;
  planId: IdPlan;
  activos: IdAgente[];
  negocio: string;
  conGoogle: boolean;
  grupos: { id: string; nombre: string; agentes: IdAgente[] }[];
  conversaciones: { id: string; titulo: string; agentes: IdAgente[] }[];
  children: ReactNode;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const plan = PLAN_POR_ID[planId];
  const conGrupos = plan.id !== "free";

  const seccion: IdSeccion = ruta.startsWith("/panel/chat")
    ? "conversaciones"
    : ruta.startsWith("/panel/agentes")
      ? "agentes"
      : params.get("vista") === "correo"
        ? "correo"
        : "resumen";

  const ir = useCallback((d: Destino) => router.push(rutaDe(d)), [router]);

  const salir = useCallback(async () => {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }, [router]);

  const nav: ElementoNav[] = [
    { id: "resumen", etiqueta: "Resumen", icono: "inicio", destino: { href: "/panel" } },
    { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", destino: { href: "/panel/chat" } },
    { id: "agentes", etiqueta: "Agentes", icono: "agentes", destino: { href: "/panel/agentes" } },
    { id: "citas", etiqueta: "Citas", icono: "calendario", pronto: true },
    { id: "correo", etiqueta: "Correo", icono: "correo", destino: { href: "/panel?vista=correo" } },
    { id: "clientes", etiqueta: "Clientes", icono: "clientes", pronto: true },
    { id: "reportes", etiqueta: "Reportes", icono: "grafica", pronto: true },
    { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
  ];

  const agentes: AgenteLateral[] = AGENTES_INFO.map((a) => {
    if (!plan.agentes.includes(a.id)) return { id: a.id, estado: "", tono: "neutro", bloqueado: `Con ${planMinimo(a.id).nombre}`, destino: { href: "/panel/agentes" } };
    if (!activos.includes(a.id)) return { id: a.id, estado: "Fuera de tu equipo", tono: "neutro", destino: { href: "/panel/agentes" } };
    return {
      id: a.id,
      estado: a.id === "clara" && conGoogle ? "Conectada a tu Gmail" : "En tu equipo",
      tono: "exito",
      destino: { href: `/panel/chat?agente=${a.id}` },
    };
  });

  const lateralGrupos: GrupoLateral[] = grupos.map((g) => ({ ...g, destino: { href: `/panel/chat?c=${g.id}` } }));

  const acciones: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Acciones rápidas" },
    { id: "conversacion", etiqueta: "Nueva conversación", icono: "mensaje", href: "/panel/chat" },
    { id: "cita", etiqueta: "Agendar cita", icono: "calendario", pronto: true },
    conGrupos
      ? { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Se arma desde Conversaciones", icono: "usuarios", href: "/panel/chat" }
      : { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Con Atendel One", icono: "usuarios", deshabilitado: true },
    { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
  ];

  const perfil = {
    antes: [
      { id: "perfil", etiqueta: "Perfil", icono: "perfil", pronto: true },
      { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
      { id: "plan", etiqueta: "Plan y facturación", descripcion: plan.nombre, icono: "facturacion", href: "/panel/agentes", actual: seccion === "agentes" },
      { id: "negocio", etiqueta: "Mi negocio", descripcion: negocio, icono: "negocio", pronto: true },
    ] satisfies ElementoMenu[],
    salir: { id: "salir", etiqueta: "Cerrar sesión", icono: "cerrar-sesion", peligroso: true, alElegir: salir } satisfies ElementoMenu,
  };

  const indice = useMemo<ResultadoBusqueda[]>(
    () => [
      ...nav
        .filter((n) => !n.pronto && n.destino)
        .map((n) => ({ id: `s-${n.id}`, grupo: "Secciones" as const, titulo: n.etiqueta, icono: n.icono, destino: n.destino! })),
      ...AGENTES_INFO.filter((a) => plan.agentes.includes(a.id)).map((a) => ({
        id: `a-${a.id}`,
        grupo: "Agentes" as const,
        titulo: a.nombre,
        detalle: `${a.area} · ${a.abarca}`,
        agente: a.id,
        destino: { href: `/panel/chat?agente=${a.id}` },
      })),
      ...conversaciones.map((c) => ({
        id: `c-${c.id}`,
        grupo: "Conversaciones" as const,
        titulo: c.titulo,
        detalle: c.agentes.map((x) => AGENTE_POR_ID[x].nombre).join(", "),
        agente: c.agentes.length === 1 ? c.agentes[0] : undefined,
        icono: "usuarios" as const,
        destino: { href: `/panel/chat?c=${c.id}` },
      })),
    ],
    // nav es fijo; depende del plan y de las conversaciones
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversaciones, planId],
  );

  return (
    <Armazon
      seccion={seccion}
      titulo={TITULOS[seccion]}
      nav={nav}
      agentes={agentes}
      grupos={lateralGrupos}
      vacioGrupos={conGrupos ? "Arma uno desde Conversaciones con dos o más agentes." : "Los grupos llegan con Atendel One."}
      usuario={{ ...usuario, estado: { tono: "exito", etiqueta: plan.nombre } }}
      avisos={[]}
      acciones={acciones}
      perfil={perfil}
      indice={indice}
      ir={ir}
      inicio={{ href: "/panel" }}
      todo={{ href: "/panel" }}
      app={seccion === "conversaciones"}
    >
      {children}
    </Armazon>
  );
}
