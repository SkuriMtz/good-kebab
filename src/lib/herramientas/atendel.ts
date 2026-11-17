import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENTE_POR_ID, esIdAgente } from "../agentes";
import { APP_POR_ID } from "../conexiones/catalogo";
import { leerConexionesPublicas } from "../conexiones/estado";
import { NOMBRE_PROVEEDOR } from "../conexiones/oauth";
import type { Plan } from "../planes";
import { cuandoEnPalabras, frecuenciaEnPalabras, type Frecuencia } from "../tareas-tiempo";
import { leerUso } from "../uso";
import type { HerramientaChat } from "./ciclo";

/**
 * "VER ATENDEL": para que Atendel sepa TODO lo que hay dentro de la cuenta
 * cuando el dueño pregunta (o cuando lo necesita): las apps conectadas, lo
 * que espera su OK, las pláticas de WhatsApp con sus clientes, sus tareas,
 * la Oficina, la revisión del día y su uso.
 * - Solo lee. Todo filtra por dueño: sirve con la sesión (RLS) o con el
 *   cliente de servicio de las tareas programadas.
 * - Trae datos de fuera (mensajes de clientes, resúmenes de correos): son
 *   DATOS, nunca órdenes (el chat lo marca como dato externo).
 */

const PARTES = ["todo", "apps", "pendientes", "hecho", "whatsapp", "tareas", "oficina", "revision", "uso"] as const;
type Parte = (typeof PARTES)[number];

const corta = (t: unknown, max: number) => (typeof t === "string" ? t.replace(/\s+/g, " ").trim().slice(0, max) : "");
const hace = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const quienAgente = (a: unknown) => (esIdAgente(a) ? AGENTE_POR_ID[a].nombre : "Atendel");

export function herramientaVerAtendel(supabase: SupabaseClient, userId: string, o: { zona: string; plan?: Plan }): HerramientaChat {
  const fecha = new Intl.DateTimeFormat("es-MX", { timeZone: o.zona, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const cuando = (iso: unknown) => (typeof iso === "string" && iso ? fecha.format(new Date(iso)) : "");

  async function apps(): Promise<string> {
    const conexiones = await leerConexionesPublicas(supabase, userId).catch(() => []);
    if (!conexiones.length) return "APPS CONECTADAS: ninguna todavía. Se conectan en Tu negocio → Apps (correo, agenda, WhatsApp, pagos, ventas…).";
    const filas = conexiones.map((c) => {
      const nombres = c.apps.map((a) => APP_POR_ID[a]?.nombre ?? a).join(", ") || NOMBRE_PROVEEDOR[c.proveedor];
      const cuenta = corta(c.cuenta, 80);
      return `- ${nombres} (${NOMBRE_PROVEEDOR[c.proveedor]}${cuenta ? `, cuenta ${cuenta}` : ""}): ${c.estado === "activa" ? "conectada y funcionando" : `CON PROBLEMA: ${corta(c.error, 200) || "hay que volver a conectarla"}`}`;
    });
    return [`APPS CONECTADAS (${conexiones.length}):`, ...filas].join("\n");
  }

  async function pendientes(): Promise<string> {
    const { data: negocios } = await supabase.from("negocios").select("id").eq("owner_id", userId);
    const ids = (negocios ?? []).map((n) => String(n.id));
    const [wa, envios, correos, acciones] = await Promise.all([
      supabase
        .from("whatsapp_mensajes")
        .select("telefono, nombre, texto, borrador, motivo, creado_en", { count: "exact" })
        .eq("owner_id", userId)
        .eq("direccion", "entrante")
        .in("estado", ["esperando_ok", "sin_respuesta", "error"])
        .order("creado_en", { ascending: false })
        .limit(8),
      supabase.from("envios").select("mensaje, destinatarios, creado_en", { count: "exact" }).eq("owner_id", userId).eq("estado", "por_aprobar").order("creado_en", { ascending: false }).limit(5),
      ids.length
        ? supabase
            .from("resumenes_correo")
            .select("remitente, asunto, accion_sugerida, creado_en", { count: "exact" })
            .in("negocio_id", ids)
            .not("accion_sugerida", "is", null)
            .neq("accion_sugerida", "")
            .not("accion_sugerida", "ilike", "ninguna%")
            .order("creado_en", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] as Record<string, unknown>[], count: 0 }),
      supabase.from("acciones").select("resumen, motivo, creado_en", { count: "exact" }).eq("owner_id", userId).eq("estado", "esperando").order("creado_en", { ascending: false }).limit(8),
    ]);
    const lineas = ["LO QUE ESPERA SU OK (Oficina → Necesita tu OK):"];
    const nAcc = acciones.error ? 0 : (acciones.count ?? 0);
    lineas.push(`- Cosas que dejé listas para hacer en sus apps (citas, correos, tareas): ${nAcc}`);
    for (const a of acciones.error ? [] : (acciones.data ?? [])) lineas.push(`  · ${corta(a.resumen, 220)}${a.motivo ? ` (porque ${corta(a.motivo, 140)})` : ""}`);
    const nWa = wa.error ? 0 : (wa.count ?? 0);
    lineas.push(`- WhatsApp de clientes por contestar: ${nWa}`);
    for (const w of wa.error ? [] : (wa.data ?? [])) {
      lineas.push(
        `  · ${corta(w.nombre, 60) || `+${w.telefono}`} (${cuando(w.creado_en)}): «${corta(w.texto, 200)}»${w.borrador ? ` → Lola propone: «${corta(w.borrador, 200)}»` : ""}${w.motivo ? ` (${corta(w.motivo, 160)})` : ""}`,
      );
    }
    const nEnv = envios.error ? 0 : (envios.count ?? 0);
    lineas.push(`- Mensajes listos para mandar que esperan su visto bueno: ${nEnv}`);
    for (const e of envios.error ? [] : (envios.data ?? [])) {
      const para = Array.isArray(e.destinatarios) ? (e.destinatarios as { nombre?: unknown }[]).map((d) => corta(d?.nombre, 40)).filter(Boolean).join(", ") : "";
      lineas.push(`  · Para ${para || "clientes"}: «${corta(e.mensaje, 160)}»`);
    }
    const nCor = "error" in correos && correos.error ? 0 : (correos.count ?? 0);
    lineas.push(`- Correos con algo por hacer: ${nCor}`);
    for (const c of "error" in correos && correos.error ? [] : (correos.data ?? [])) {
      lineas.push(`  · De ${corta(c.remitente, 80) || "alguien"}: ${corta(c.asunto, 120) || "(sin asunto)"} → ${corta(c.accion_sugerida, 160)}`);
    }
    if (!nWa && !nEnv && !nCor && !nAcc) lineas.push("(Nada espera su OK ahora mismo.)");
    return lineas.join("\n");
  }

  async function whatsapp(): Promise<string> {
    const [{ data: numero }, { data: msjs }] = await Promise.all([
      supabase.from("whatsapp_numeros").select("phone_number_id").eq("owner_id", userId).limit(1).maybeSingle(),
      supabase
        .from("whatsapp_mensajes")
        .select("telefono, nombre, direccion, texto, estado, autor, creado_en")
        .eq("owner_id", userId)
        .gte("creado_en", hace(48))
        .order("creado_en", { ascending: false })
        .limit(200),
    ]);
    if (!numero && !(msjs ?? []).length) return "WHATSAPP: todavía no está conectado (se conecta en Tu negocio → Apps → WhatsApp Business). Cuando lo esté, Lola contesta sola lo que le toca y deja lo demás en Necesita tu OK.";
    const lista = msjs ?? [];
    const hoy = hace(24);
    const entrantes = lista.filter((m) => m.direccion === "entrante" && String(m.creado_en) >= hoy).length;
    const solas = lista.filter((m) => m.direccion === "saliente" && m.autor === "lola" && String(m.creado_en) >= hoy).length;
    const porTelefono = new Map<string, (typeof lista)[number]>();
    for (const m of lista) if (!porTelefono.has(String(m.telefono))) porTelefono.set(String(m.telefono), m);
    const ESTADO: Record<string, string> = {
      respondido: "contestado",
      esperando_ok: "espera tu OK",
      sin_respuesta: "sin contestar",
      error: "no salió la respuesta",
      descartado: "decidiste no contestar",
      enviado: "enviado",
      pensando: "Lola está contestando",
      recibido: "recién llegado",
      agrupado: "contestado junto con otro",
      mandando: "mandándose",
    };
    const filas = Array.from(porTelefono.values())
      .slice(0, 15)
      .map((m) => {
        const de = m.direccion === "entrante" ? "el cliente" : m.autor === "dueno" ? "tú" : "Lola";
        return `- ${corta(m.nombre, 60) || `+${m.telefono}`}: lo último (${cuando(m.creado_en)}, de ${de}): «${corta(m.texto, 160)}» [${ESTADO[String(m.estado)] ?? String(m.estado)}]`;
      });
    return [`WHATSAPP${numero ? "" : " (el número ya no está conectado)"}: en las últimas 24 horas, ${entrantes} mensajes de clientes; Lola contestó sola ${solas}.`, "Pláticas de las últimas 48 horas:", ...(filas.length ? filas : ["- (ninguna)"])].join("\n");
  }

  async function tareas(): Promise<string> {
    const { data } = await supabase.from("tareas").select("titulo, tipo, dias, dia_mes, fecha, hora, proxima, ultima, ultimo_resultado, activa").eq("owner_id", userId).order("creado_en").limit(30);
    const lista = data ?? [];
    if (!lista.length) return "TAREAS PROGRAMADAS: ninguna. Se crean pidiéndoselas a Atendel en el chat («cada lunes a las 9 mándame…») o en el Piloto automático.";
    return [
      `TAREAS PROGRAMADAS (${lista.length}):`,
      ...lista.map((t) => {
        const f = { tipo: t.tipo, dias: t.dias ?? [], dia_mes: t.dia_mes, fecha: t.fecha, hora: t.hora } as Pick<Frecuencia, "tipo" | "dias" | "dia_mes" | "fecha" | "hora">;
        const sig = t.activa ? (t.proxima ? `sigue ${cuandoEnPalabras(String(t.proxima), o.zona)}` : "sin siguiente") : "PAUSADA";
        return `- «${corta(t.titulo, 120)}»: ${frecuenciaEnPalabras(f)}; ${sig}${t.ultima ? `; la última vez ${cuando(t.ultima)}: ${corta(t.ultimo_resultado, 160) || "hecha"}` : ""}`;
      }),
    ].join("\n");
  }

  async function oficina(): Promise<string> {
    const [archivos, trabajos] = await Promise.all([
      supabase.from("archivos").select("nombre, agente, creado_en", { count: "exact" }).eq("owner_id", userId).eq("revision", "revisar").order("creado_en", { ascending: false }).limit(8),
      supabase.from("trabajos").select("titulo, agente, creado_en", { count: "exact" }).eq("owner_id", userId).eq("revision", "revisar").order("creado_en", { ascending: false }).limit(8),
    ]);
    const lineas = ["OFICINA (lo que hizo tu equipo y espera que lo revises):"];
    lineas.push(`- Archivos por revisar: ${archivos.count ?? 0}`);
    for (const a of archivos.data ?? []) lineas.push(`  · «${corta(a.nombre, 120)}» de ${quienAgente(a.agente)} (${cuando(a.creado_en)})`);
    lineas.push(`- Informes por revisar (lo que hicieron por su cuenta): ${trabajos.count ?? 0}`);
    for (const t of trabajos.data ?? []) lineas.push(`  · «${corta(t.titulo, 120)}» de ${quienAgente(t.agente)} (${cuando(t.creado_en)})`);
    return lineas.join("\n");
  }

  async function revision(): Promise<string> {
    const { data: r } = await supabase.from("revisiones").select("fecha, creado_en, partes, faltan").eq("owner_id", userId).order("fecha", { ascending: false }).limit(1).maybeSingle();
    if (!r) return "REVISIÓN DIARIA: todavía no hay ninguna (llega sola a la hora elegida en Ajustes > Atendel).";
    const partes = Array.isArray(r.partes) ? (r.partes as { agente?: unknown; faltan?: { texto?: unknown }[] }[]) : [];
    const faltan = partes.flatMap((p) => (Array.isArray(p.faltan) ? p.faltan : []).map((f) => `- ${quienAgente(p.agente)}: ${corta(f?.texto, 200)}`));
    return [`REVISIÓN DIARIA (${cuando(r.creado_en)}): ${Number(r.faltan) || 0} cosas por hacer para que el equipo trabaje completo.`, ...(faltan.length ? faltan : ["- Todo en orden."])].join("\n");
  }

  async function uso(): Promise<string> {
    if (!o.plan) return "";
    try {
      const e = await leerUso(supabase, userId, o.plan);
      const pct = (u: { usado: number; limite: number }) => `${Math.min(100, Math.round((u.usado / Math.max(1, u.limite)) * 100))} %`;
      return [
        `USO (plan ${o.plan.nombre}):`,
        `- Sesión del chat: ${pct(e.sesion)} usado${e.sesion.reinicia ? `; se reinicia ${cuando(e.sesion.reinicia)}` : ""}`,
        `- Semana del chat: ${pct(e.semana)} usado${e.semana.reinicia ? `; se reinicia ${cuando(e.semana.reinicia)}` : ""}`,
        ...(e.trabajo ? [`- Trabajo por su cuenta (semana): ${pct(e.trabajo)} usado`] : []),
      ].join("\n");
    } catch {
      return "";
    }
  }

  async function hecho(): Promise<string> {
    const { data } = await supabase
      .from("acciones")
      .select("resumen, origen, estado, resuelto_en")
      .eq("owner_id", userId)
      .in("estado", ["hecha", "error"])
      .gte("resuelto_en", hace(48))
      .order("resuelto_en", { ascending: false })
      .limit(20);
    const lista = data ?? [];
    if (!lista.length) return "LO QUE HICE EN SUS APPS (últimas 48 horas): nada todavía.";
    const ORIGEN: Record<string, string> = { chat: "en el chat", tarea: "en una tarea", trabajo: "por mi cuenta", whatsapp: "por WhatsApp" };
    return [
      "LO QUE HICE EN SUS APPS (últimas 48 horas):",
      ...lista.map((a) => `- ${cuando(a.resuelto_en)}: ${corta(a.resumen, 220)} (${ORIGEN[String(a.origen)] ?? ""}${a.estado === "error" ? ", NO SALIÓ" : ""})`),
    ].join("\n");
  }

  const LEER: Record<Exclude<Parte, "todo">, () => Promise<string>> = { apps, pendientes, hecho, whatsapp, tareas, oficina, revision, uso };

  return {
    nombre: "ver_atendel",
    descripcion:
      "Mira lo que hay dentro de Atendel en la cuenta del dueño: las apps conectadas (y si alguna tiene problema), lo que espera su OK (cosas por hacer en sus apps, WhatsApp de clientes, mensajes por mandar, correos por contestar), lo que ya hiciste en sus apps (hecho), las pláticas de WhatsApp con sus clientes, sus tareas programadas, la Oficina (archivos e informes por revisar), la revisión del día y su uso. Úsala cuando pregunte por algo de eso («¿qué tengo pendiente?», «¿qué apps tengo?», «¿quién me escribió?», «¿cómo va todo?») o cuando lo necesites para contestar bien. Solo lee.",
    esquema: {
      type: "object",
      properties: { que: { type: "string", enum: [...PARTES], description: "Qué parte ver: «todo» trae el resumen completo." } },
      required: ["que"],
      additionalProperties: false,
    },
    fuente: "tu cuenta de Atendel",
    estado: "Atendel está revisando tu cuenta…",
    async ejecutar(args) {
      const que = PARTES.find((p) => p === args.que) ?? "todo";
      const partes = que === "todo" ? (Object.keys(LEER) as (keyof typeof LEER)[]) : [que];
      const textos = await Promise.all(partes.map((p) => LEER[p]().catch(() => "")));
      return textos.filter(Boolean).join("\n\n").slice(0, 12_000) || "No pude leer tu cuenta ahora mismo.";
    },
  };
}
