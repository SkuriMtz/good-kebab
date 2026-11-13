"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { createClient } from "@/lib/supabase/client";
import type { DatosAjustes } from "./Ajustes";
import type { AjustesCuenta } from "@/lib/ajustes";
import type { ContactoEquipo } from "@/lib/equipo";
import type { Periodo } from "@/lib/estadisticas";
import type { ResumenInfo } from "@/lib/resumen-negocio";
import { responderConReglas, type RespuestaGrafica } from "@/lib/pregunta-grafica";
import { conTransicion, rutaPintada } from "@/lib/transiciones";
import { Armazon, type ChatMenu, type ElementoCuenta, type IdSeccion, type ResultadoBusqueda } from "./Armazon";
import { ContextoChats } from "./contexto";
import { EVENTO_CHAT_ELIMINADO, EVENTO_CHAT_RENOMBRADO, useOrganizacionChats, type AccionesChats } from "./MenuChats";
import { organizar, type OrganizacionChats } from "@/lib/organizacion-chats";
import { nombresDe } from "./Mensajes";
import { PanelInfo, type TabInfo } from "./PanelInfo";
import { PEDIDOS } from "./pedidos";
import type { EstadoUso } from "@/lib/uso-estado";

export type DatosArmazonReal = {
  userId: string;
  nombre: string;
  nombreCompleto: string;
  negocio: string;
  planId: string;
  /** Los agentes que incluye su plan. */
  planAgentes: IdAgente[];
  /** Las apps conectadas (IdApp). */
  conectadas: string[];
  /** Ajustes > Equipo. */
  contactos: ContactoEquipo[];
  ajustes: AjustesCuenta;
  correo: string;
  /** "Free", "One" o "Max". */
  plan: string;
  /** El uso del plan: sesión de 5 horas y semana (como Claude). */
  uso: EstadoUso;
  /** ¿Entró con Google? (entonces Clara lee su Gmail) */
  gmail: boolean;
  activos: IdAgente[];
  pendientes: number | null;
  /** Las conversaciones (de la más nueva a la más vieja) y cómo las acomodó (fijadas, archivadas, grupos). */
  chats: ChatMenu[];
  organizacion: OrganizacionChats;
};

/** Las secciones de /panel que viven en ?vista= (todas son la misma página). */
const VISTAS = ["pendientes", "hecho", "citas", "negocio", "estadisticas", "actividad", "correo", "ajustes"];

/** La clave de una dirección del panel para la transición entre vistas ("/panel?pendientes"). */
function claveDe(url: URL) {
  if (url.pathname !== "/panel") return url.pathname;
  const v = url.searchParams.get("vista");
  return `/panel?${v && VISTAS.includes(v) ? v : "chat"}`;
}

/**
 * El armazón de /panel con los datos de la cuenta. El layout se queda puesto
 * al moverse entre secciones; solo cambia el contenido, con el cruce corto
 * de ANIMACIONES.md (punto 1). Las conversaciones nuevas suben al menú sin
 * recargar (ContextoChats).
 */
export function ArmazonReal({ datos, children }: { datos: DatosArmazonReal; children: ReactNode }) {
  const ruta = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [chats, setChats] = useState(datos.chats);
  // Fijadas, archivadas y grupos: se guardan en la cuenta (PUT /api/chats/organizacion)
  const [organizacion, organizarChats] = useOrganizacionChats(datos.organizacion, (o) =>
    fetch("/api/chats/organizacion", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizacion: o }) }).catch(() => undefined),
  );

  const vista = params.get("vista");
  const c = params.get("c");
  const valida = vista && VISTAS.includes(vista) ? vista : null;
  // Actividad es un detalle de Estadísticas: se marca Estadísticas en el menú
  const activa: IdSeccion = ruta.startsWith("/panel/agentes") ? "agentes" : valida === "actividad" ? "estadisticas" : valida === "hecho" ? "pendientes" : valida ? (valida as IdSeccion) : c ? "chat" : "inicio";
  const clave = ruta === "/panel" ? `/panel?${valida ?? "chat"}` : ruta;

  // La vista nueva ya se pintó: la transición puede seguir
  useLayoutEffect(() => {
    rutaPintada(clave);
  }, [clave]);

  const alCapturarClic = (e: MouseEvent<HTMLDivElement>) => {
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

  const avisos = useMemo(
    () => ({
      agregar: (chat: ChatMenu, fijado: boolean) => {
        setChats((l) => [chat, ...l.filter((x) => x.id !== chat.id)]);
        if (fijado) organizarChats((o) => organizar.fijar(o, chat.id, true));
      },
      quitar: (id: string) => {
        setChats((l) => l.filter((x) => x.id !== id));
        organizarChats((o) => organizar.olvidar(o, id));
      },
    }),
    [organizarChats],
  );

  // El "⋯" de cada conversación del menú
  const acciones: AccionesChats = {
    organizar: organizarChats,
    renombrar: async (id, titulo) => {
      const chat = chats.find((x) => x.id === id);
      // Un grupo con nombre lo guarda en "tema" (y se pone también como título)
      const cambio = chat?.campo === "tema" ? { tema: titulo, titulo } : { titulo };
      const { error } = await createClient().from("conversaciones").update(cambio).eq("id", id);
      if (error) return "No se pudo cambiar el nombre. Intenta de nuevo.";
      setChats((l) => l.map((x) => (x.id === id ? { ...x, titulo } : x)));
      window.dispatchEvent(new CustomEvent(EVENTO_CHAT_RENOMBRADO, { detail: { id, titulo, campo: chat?.campo ?? "titulo" } }));
      return null;
    },
    eliminar: async (id) => {
      const { error } = await createClient().from("conversaciones").delete().eq("id", id);
      if (error) return "No se pudo eliminar la conversación. Intenta de nuevo.";
      setChats((l) => l.filter((x) => x.id !== id));
      organizarChats((o) => organizar.olvidar(o, id));
      window.dispatchEvent(new CustomEvent(EVENTO_CHAT_ELIMINADO, { detail: { id } }));
      return null;
    },
  };

  const cuenta: ElementoCuenta[] = [
    { id: "plan", etiqueta: "Mi plan y uso", detalle: `Atendel ${datos.plan}`, icono: "facturacion", href: "/panel?vista=ajustes&seccion=uso" },
    { id: "planes", etiqueta: "Ver los planes", detalle: "Para cambiar de plan, escríbenos", icono: "estrella", href: "/precios" },
    { id: "contacto", etiqueta: "Escríbenos", icono: "mensaje", href: "/contacto" },
    { id: "sitio", etiqueta: "Ir al sitio de Atendel", icono: "inicio", href: "/" },
    {
      id: "salir",
      etiqueta: "Cerrar sesión",
      icono: "cerrar-sesion",
      peligroso: true,
      alElegir: async () => {
        await createClient().auth.signOut();
        router.replace("/");
        router.refresh();
      },
    },
  ];

  const salirA = async (alcance: "local" | "global") => {
    await createClient().auth.signOut({ scope: alcance });
    router.replace("/");
    router.refresh();
  };
  /** Un PUT a la API; devuelve el error que diga o null. */
  const poner = async (url: string, cuerpo: unknown) => {
    try {
      const r = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      if (r.ok) return null;
      const j = (await r.json().catch(() => null)) as { error?: string } | null;
      return j?.error ?? "No se pudo guardar. Intenta de nuevo.";
    } catch {
      return "Sin conexión: no se guardó.";
    }
  };
  const ajustes: DatosAjustes = {
    nombre: datos.nombreCompleto,
    correo: datos.correo,
    negocio: datos.negocio,
    plan: { id: datos.planId, nombre: `Atendel ${datos.plan}`, uso: datos.uso, agentes: datos.planAgentes },
    activos: datos.activos,
    gmail: datos.gmail,
    conectadas: datos.conectadas,
    contactos: datos.contactos,
    ajustes: datos.ajustes,
    hrefs: { agentes: "/panel/agentes", apps: "/panel?vista=negocio&tab=apps", documentos: "/panel?vista=negocio&tab=documentos", negocio: "/panel?vista=negocio" },
    salir: { etiqueta: "Cerrar sesión", texto: "En este dispositivo.", alSalir: () => salirA("local") },
    salirDeTodo: () => salirA("global"),
    guardar: {
      ajustes: (a) => poner("/api/ajustes", { ajustes: a }),
      perfil: (cambios) => poner("/api/negocio/perfil", cambios),
      equipo: async (agentes) => {
        const { error: e } = await createClient().from("agentes_elegidos").upsert({ owner_id: datos.userId, agentes, actualizado_en: new Date().toISOString() });
        if (e) return "No se pudo guardar tu equipo. Intenta de nuevo.";
        router.refresh();
        return null;
      },
      contactos: {
        agregar: async (c) => {
          const { data, error: e } = await createClient().from("equipo_contactos").insert({ owner_id: datos.userId, ...c }).select("id, nombre, rol, whatsapp").single();
          if (e || !data) return "No se pudo agregar a esa persona. Intenta de nuevo.";
          return { id: String(data.id), nombre: String(data.nombre), rol: String(data.rol ?? ""), whatsapp: String(data.whatsapp) };
        },
        quitar: async (id) => {
          const { error: e } = await createClient().from("equipo_contactos").delete().eq("id", id).eq("owner_id", datos.userId);
          return e ? "No se pudo quitar. Intenta de nuevo." : null;
        },
      },
      nombre: async (nombre) => {
        const { error: e } = await createClient().auth.updateUser({ data: { full_name: nombre } });
        if (e) return "No se pudo guardar tu nombre.";
        router.refresh();
        return null;
      },
    },
  };

  const indice: ResultadoBusqueda[] = [
    { id: "s-inicio", grupo: "Secciones", titulo: "Nueva conversación", detalle: "Pídele algo a tu equipo", icono: "mas", href: "/panel" },
    { id: "s-agentes", grupo: "Secciones", titulo: "Agentes", detalle: "Tu equipo y quién está en él", icono: "agentes", href: "/panel/agentes" },
    { id: "s-pendientes", grupo: "Secciones", titulo: "Pendientes", detalle: "Lo que espera tu visto bueno", icono: "check-circulo", href: "/panel?vista=pendientes" },
    { id: "s-hecho", grupo: "Secciones", titulo: "Hecho", detalle: "Pendientes: lo que tu equipo ya terminó", icono: "check-doble", href: "/panel?vista=pendientes&tab=hecho", claves: "terminado listo historial tareas trabajos excel" },
    { id: "s-citas", grupo: "Secciones", titulo: "Citas", detalle: "La agenda que lleva Lola", icono: "calendario", href: "/panel?vista=citas" },
    { id: "s-negocio", grupo: "Secciones", titulo: "Tu negocio", detalle: "Perfil, documentos y apps conectadas", icono: "negocio", claves: "perfil documentos apps gmail calendar drive conectar subir", href: "/panel?vista=negocio" },
    { id: "s-estadisticas", grupo: "Secciones", titulo: "Estadísticas", detalle: "Cómo va tu negocio", icono: "grafica", href: "/panel?vista=estadisticas" },
    { id: "s-correo", grupo: "Secciones", titulo: "Correo", detalle: "Clara, tu Gmail y lo que ya leyó", icono: "correo", href: "/panel?vista=correo" },
    { id: "s-actividad", grupo: "Secciones", titulo: "Actividad", detalle: "Lo último que pasó con tu equipo", icono: "rayo", href: "/panel?vista=actividad" },
    { id: "s-ajustes", grupo: "Secciones", titulo: "Ajustes", detalle: "Plan, apariencia y cuenta", icono: "ajustes", href: "/panel?vista=ajustes" },
    ...AGENTES_INFO.filter((a) => datos.activos.includes(a.id)).map((a) => ({
      id: `a-${a.id}`,
      grupo: "Tu equipo",
      titulo: `Hablar con ${a.nombre}`,
      detalle: `${a.area} · ${a.abarca}`,
      agentes: [a.id],
      claves: a.capacidades.join(" "),
      href: `/panel?agente=${a.id}`,
    })),
    ...chats.map((r) => ({ id: `r-${r.id}`, grupo: "Conversaciones", titulo: r.titulo, detalle: r.agentes.length > 1 ? nombresDe(r.agentes) : undefined, agentes: r.agentes, href: r.href })),
    ...PEDIDOS.filter((p) => datos.activos.includes(p.agente)).map((p) => ({
      id: `p-${p.id}`,
      grupo: "Pídele a tu equipo",
      titulo: p.titulo,
      detalle: p.detalle,
      agentes: [p.agente],
      href: `/panel?agente=${p.agente}&pide=${encodeURIComponent(p.texto)}`,
    })),
  ];

  // El panel de información de la derecha: en el inicio y en las conversaciones (cifras reales de /api/negocio/resumen)
  const cargarInfo = useCallback(async (p: Periodo) => {
    const r = await fetch(`/api/negocio/resumen?periodo=${p}`, { cache: "no-store" });
    return r.ok ? ((await r.json()) as ResumenInfo) : null;
  }, []);
  // Preguntarle a la gráfica: la IA con tus números; si no está disponible, reglas (sin IA)
  const preguntarInfo = useCallback(async (pregunta: string, datos: ResumenInfo) => {
    try {
      const r = await fetch("/api/negocio/pregunta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta, periodo: datos.periodo }),
      });
      if (r.ok) return (await r.json()) as RespuestaGrafica;
      if (r.status === 429 || r.status === 400) {
        const e = (await r.json().catch(() => null)) as { error?: string } | null;
        return { error: e?.error ?? "No se pudo contestar." };
      }
    } catch {
      /* sin red: se contesta con reglas */
    }
    return responderConReglas(pregunta, datos);
  }, []);
  const enConversacion = c ? chats.find((x) => x.id === c)?.agentes : undefined;
  const info =
    activa === "inicio" || activa === "chat"
      ? ({ tab, pedido, alIr, alVer, alCerrar }: { tab: TabInfo; pedido: number; alIr: (t: TabInfo) => void; alVer: (t: TabInfo) => void; alCerrar: () => void }) => (
          <PanelInfo
            tab={tab}
            pedido={pedido}
          alIr={alIr}
          alVer={alVer}
            ejemplo={false}
            cargar={cargarInfo}
            preguntar={preguntarInfo}
            equipo={datos.activos}
            enConversacion={enConversacion}
            pendientes={datos.pendientes}
            hrefs={{
              pendientes: "/panel?vista=pendientes",
              estadisticas: "/panel?vista=estadisticas",
              negocio: "/panel?vista=negocio&tab=apps",
              documentos: "/panel?vista=negocio&tab=documentos",
            ajustes: "/panel?vista=ajustes",
              chatCon: (a) => `/panel?agente=${a}`,
            }}
            alCerrar={alCerrar}
          />
        )
      : undefined;

  return (
    <ContextoChats.Provider value={avisos}>
      <Armazon
        activa={activa}
        chatActual={c}
        hrefs={{
          inicio: "/panel",
          agentes: "/panel/agentes",
          pendientes: "/panel?vista=pendientes",
          citas: "/panel?vista=citas",
          negocio: "/panel?vista=negocio",
          estadisticas: "/panel?vista=estadisticas",
          ajustes: "/panel?vista=ajustes",
        }}
        pendientes={datos.pendientes}
        chats={chats}
        organizacion={organizacion}
        acciones={acciones}
        usuario={{ nombre: datos.nombre, plan: datos.plan }}
        cuenta={cuenta}
        ajustes={ajustes}
        indice={indice}
        alCapturarClic={alCapturarClic}
        info={info}
      >
        {children}
      </Armazon>
    </ContextoChats.Provider>
  );
}
