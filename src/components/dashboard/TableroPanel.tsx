"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Insignia } from "@/components/base/Insignia";
import { AGENTE_POR_ID, AGENTES_INFO, esIdAgente, type IdAgente } from "@/lib/agentes";
import { planMinimo, type Plan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import { Armazon, type AccionCrear } from "./Armazon";
import { haceCuanto } from "./contenido";
import type { Aviso, ElementoNav, ElementoPaleta, EstadoAgente, IdVista } from "./tipos";

/**
 * El armazón del panel con los DATOS REALES de la cuenta (plan, uso,
 * agentes, conversaciones y resúmenes de Clara). Lo monta
 * src/app/panel/layout.tsx; las páginas del panel leen estos datos con
 * useDatosPanel(). No cambia ninguna lógica de datos: solo lee lo que ya
 * existía (cuenta.ts, conversaciones y resumenes_correo, con RLS).
 */

export type ConversacionPanel = {
  id: string;
  agente: IdAgente;
  titulo: string | null;
  actualizado_en: string;
  participantes?: string[] | null;
  tema?: string | null;
};

export type ResumenAviso = { id: string; remitente: string | null; asunto: string | null; creado_en: string };

export type DatosPanel = {
  email: string;
  nombre: string;
  foto: string | null;
  conGoogle: boolean;
  plan: Plan;
  usados: number;
  activos: IdAgente[];
  elegidos: IdAgente[];
  negocio: string;
  conversaciones: ConversacionPanel[];
  resumenes: ResumenAviso[];
};

const ContextoPanel = createContext<DatosPanel | null>(null);

export function useDatosPanel() {
  const datos = useContext(ContextoPanel);
  if (!datos) throw new Error("useDatosPanel va dentro de TableroPanel");
  return datos;
}

/** Los agentes de una conversación (uno, o los del grupo). */
export function agentesDe(c: ConversacionPanel): IdAgente[] {
  const grupo = (c.participantes ?? []).filter(esIdAgente);
  return grupo.length > 1 ? grupo : [c.agente];
}

export function nombreConversacion(c: ConversacionPanel) {
  const ag = agentesDe(c);
  if (ag.length > 1) return c.tema?.trim() || ag.map((a) => AGENTE_POR_ID[a].nombre).join(", ");
  return c.titulo?.trim() || AGENTE_POR_ID[c.agente].nombre;
}

const CLAVE_VISTOS = "atendel-avisos-vistos";

export function TableroPanel({
  datos,
  vistaForzada,
  children,
}: {
  datos: DatosPanel;
  /** Solo para pruebas: qué sección marcar sin depender de la dirección. */
  vistaForzada?: IdVista;
  children: ReactNode;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [vistos, setVistos] = useState(0);
  // Las horas relativas ("Hace 5 min") se calculan solo en el navegador: el
  // servidor tiene otro reloj y otra zona horaria
  const [ahora, setAhora] = useState<Date | null>(null);
  const primera = useRef(true);

  // Al volver al Resumen se piden los datos otra vez (conversaciones nuevas del chat)
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    if (ruta === "/panel") router.refresh();
  }, [ruta, router]);

  // Qué avisos ya viste (solo en este navegador)
  useEffect(() => {
    setAhora(new Date());
    try {
      setVistos(Number(localStorage.getItem(CLAVE_VISTOS)) || 0);
    } catch {
      // Sin almacenamiento: todos cuentan como nuevos
    }
  }, []);

  const vista: IdVista = vistaForzada ?? (ruta.startsWith("/panel/chat")
    ? "conversaciones"
    : ruta.startsWith("/panel/agentes")
      ? "agentes"
      : params.get("vista") === "correo"
        ? "correo"
        : "resumen");
  const seccion = { resumen: "Resumen", conversaciones: "Conversaciones", agentes: "Agentes", correo: "Correo" }[vista as "resumen"] ?? "Resumen";

  const salir = useCallback(async () => {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }, [router]);

  const { plan, activos, conversaciones } = datos;
  const primerAgente = activos[0] ?? "clara";

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

  const agentes: EstadoAgente[] = AGENTES_INFO.map((a) => {
    if (!plan.agentes.includes(a.id)) return { id: a.id, tono: "neutro", etiqueta: "", bloqueado: `Con ${planMinimo(a.id).nombre}`, href: "/precios" };
    if (!activos.includes(a.id)) return { id: a.id, tono: "neutro", etiqueta: "Fuera de tu equipo", href: "/panel/agentes" };
    const etiqueta = a.id === "clara" ? (datos.conGoogle ? "Conectada a tu Gmail" : "Lista para tu correo") : "Lista en el chat";
    return { id: a.id, tono: "exito", etiqueta, href: `/panel/chat?agente=${a.id}` };
  });

  const grupos = conversaciones
    .filter((c) => agentesDe(c).length > 1)
    .slice(0, 5)
    .map((c) => ({ id: c.id, nombre: nombreConversacion(c), agentes: agentesDe(c), href: `/panel/chat?c=${c.id}` }));

  const crear: AccionCrear[] = [
    { id: "conversacion", etiqueta: "Nueva conversación", icono: "mensaje", atajo: ["N"], href: `/panel/chat?agente=${primerAgente}` },
    { id: "correo", etiqueta: "Resumir un correo", icono: "correo", descripcion: "Pégalo y Clara te dice qué hacer", href: "/panel?vista=correo" },
    { id: "cita", etiqueta: "Agendar cita", icono: "calendario", pronto: true },
    {
      id: "grupo",
      etiqueta: "Nuevo grupo",
      icono: "usuarios",
      descripcion: plan.id === "free" ? `Con ${planMinimo("lola").nombre}` : "Se arma en Conversaciones",
      href: plan.id === "free" ? "/precios" : "/panel/chat",
    },
    { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
  ];

  /* ---------- Avisos: lo que de verdad pasó (resúmenes de Clara y el límite del plan) ---------- */
  const avisos: Aviso[] = useMemo(() => {
    const lista: Aviso[] = datos.resumenes.map((r) => ({
      id: r.id,
      agente: "clara" as IdAgente,
      texto: `Resumió el correo de ${(r.remitente ?? "alguien").replace(/\s*<[^>]*>/, "")}${r.asunto ? `: «${r.asunto}»` : ""}.`,
      cuando: ahora ? haceCuanto(r.creado_en, ahora) : "",
      nuevo: new Date(r.creado_en).getTime() > vistos,
      href: "/panel?vista=correo#historial",
    }));
    const proporcion = datos.usados / plan.mensajesMes;
    if (proporcion >= 0.8 && ahora) {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      lista.unshift({
        id: "limite",
        texto:
          proporcion >= 1
            ? `Llegaste a los ${plan.mensajesMes.toLocaleString("es-MX")} mensajes de este mes.`
            : `Llevas ${datos.usados.toLocaleString("es-MX")} de ${plan.mensajesMes.toLocaleString("es-MX")} mensajes este mes.`,
        cuando: "Este mes",
        nuevo: vistos < inicioMes.getTime(),
        href: "/panel/agentes",
      });
    }
    return lista;
  }, [datos.resumenes, datos.usados, plan.mensajesMes, vistos, ahora]);

  const marcarVistos = () => {
    const momento = Date.now();
    setVistos(momento);
    try {
      localStorage.setItem(CLAVE_VISTOS, String(momento));
    } catch {
      // Sin almacenamiento: se marcan solo por esta visita
    }
  };

  const conversacionesPaleta: ElementoPaleta[] = useMemo(
    () =>
      conversaciones.slice(0, 20).map((c) => ({
        id: `conv-${c.id}`,
        grupo: "Conversaciones",
        etiqueta: nombreConversacion(c),
        descripcion: ahora ? haceCuanto(c.actualizado_en, ahora) : undefined,
        agentes: agentesDe(c),
        href: `/panel/chat?c=${c.id}`,
      })),
    [conversaciones, ahora],
  );

  return (
    <ContextoPanel.Provider value={datos}>
      <Armazon
        vista={vista}
        seccion={seccion}
        inicio="/panel"
        marcaBarra={<Insignia tono="azul">{plan.nombre}</Insignia>}
        nav={nav}
        agentes={agentes}
        grupos={grupos}
        sinGrupos={plan.id === "free" ? `Los chats en grupo llegan con ${planMinimo("lola").nombre}.` : "Junta a dos o más agentes en un chat."}
        nuevoGrupo={plan.id === "free" ? undefined : { href: "/panel/chat" }}
        usuario={{ nombre: datos.nombre, correo: datos.email, foto: datos.foto, estado: { tono: "exito", etiqueta: plan.nombre } }}
        perfil={[
          { id: "perfil", etiqueta: "Perfil", icono: "perfil", pronto: true },
          { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
          { id: "plan", etiqueta: "Plan y facturación", icono: "facturacion", descripcion: `${plan.nombre} · uso del mes`, href: "/panel/agentes" },
          { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", pronto: true },
        ]}
        salir={{ etiqueta: "Cerrar sesión", alElegir: salir }}
        crear={crear}
        avisos={avisos}
        alElegirAviso={() => marcarVistos()}
        alLeerAvisos={marcarVistos}
        vacioAvisos="Cuando Clara resuma un correo o te acerques al límite de tu plan, te avisamos aquí."
        conversacionesPaleta={conversacionesPaleta}
        chat={vista === "conversaciones"}
      >
        {children}
      </Armazon>
    </ContextoPanel.Provider>
  );
}
