import "server-only";
import { AUTONOMIA, type IdAutonomia, type ModoAutonomia } from "./ajustes";
import { avisarEnChat, citar } from "./avisos";
import { verificarContraReglas, type Regla } from "./cerebro";
import type { Herramienta } from "./nucleo-tipos";
import { clienteServicio } from "./supabase/servicio";

/**
 * LO QUE ATENDEL HACE EN TUS APPS (crear, mover o cancelar citas, mandar
 * correos, crear tareas…), según «Qué hace solo» (Ajustes > Atendel):
 * - Si esa categoría la hace sola, se hace al momento y queda en el historial.
 * - Si no (o si en esa misma respuesta leyó algo de fuera: correos, mensajes
 *   de clientes, datos de apps), NO se hace: queda en «Necesita tu OK»
 *   (tabla acciones, migración 0023) y se hace con un clic tuyo.
 * - Un correo que saldría solo pasa además por el verificador de Reglas.
 * - Lo que pasa fuera del chat (tareas, trabajo por su cuenta) te lo avisa en
 *   «Avisos de Atendel».
 * La tabla solo la escribe el servidor; el dueño la lee y decide.
 */

export type OrigenAccion = "chat" | "tarea" | "trabajo" | "whatsapp";

export type OpcionesAcciones = {
  autonomia: Record<IdAutonomia, ModoAutonomia>;
  origen: OrigenAccion;
  /** true: en este turno ya entró algo de fuera (correo, documento, mensaje, datos de una app). */
  externo: () => boolean;
  zona: string;
  conversacionId?: string | null;
  /** Para revisar lo que sale solo a otras personas (correos). */
  reglas?: Regla[];
};

const TITULO = Object.fromEntries(AUTONOMIA.map((x) => [x.id, x.titulo])) as Record<string, string>;
/** Lo más que puede esperar tu OK a la vez (para que nada llene la lista). */
const MAX_ESPERANDO = 100;

/** Por qué espera tu OK; null si se puede hacer al momento. */
export async function porQueEspera(h: Herramienta, args: Record<string, unknown>, o: OpcionesAcciones): Promise<string | null> {
  const categoria = h.hace?.categoria;
  if (!categoria) return "no se sabe qué tipo de acción es";
  if (o.autonomia[categoria as IdAutonomia] !== "solo") return `es de «${TITULO[categoria] ?? "algo nuevo"}», y eso me pediste que te lo pregunte antes`;
  if (o.externo()) return "en esta misma respuesta leí cosas de fuera (correos, mensajes o datos de tus apps), y con eso nada se hace solo";
  if (categoria === "correos" && typeof args.texto === "string") {
    const v = await verificarContraReglas(args.texto, o.reglas ?? [], undefined, { estricto: true }).catch(() => ({ ok: false, problemas: ["no se pudo revisar contra tus Reglas"] }));
    if (!v.ok) return `no cuadra con tus Reglas (${v.problemas.map((p) => citar(p, 150)).join("; ") || "revísalo"})`;
  }
  return null;
}

/** Deja la acción esperando tu OK. Regresa su id, o null si no se pudo. */
export async function guardarPendiente(dueno: string, h: Herramienta, args: Record<string, unknown>, resumen: string, motivo: string, o: OpcionesAcciones): Promise<string | null> {
  const admin = clienteServicio();
  if (!admin || !h.hace) return null;
  const { count } = await admin.from("acciones").select("id", { count: "exact", head: true }).eq("owner_id", dueno).eq("estado", "esperando");
  if ((count ?? 0) >= MAX_ESPERANDO) return null;
  const { data, error } = await admin
    .from("acciones")
    .insert({
      owner_id: dueno,
      herramienta: h.nombre,
      app: h.app,
      categoria: h.hace.categoria,
      args,
      resumen: resumen.slice(0, 500),
      motivo: motivo.slice(0, 300),
      origen: o.origen,
      conversacion_id: o.conversacionId ?? null,
    })
    .select("id")
    .single();
  return error || !data ? null : String(data.id);
}

/** Lo que se hizo al momento (para el historial). */
export async function registrarHecha(dueno: string, h: Herramienta, args: Record<string, unknown>, resumen: string, resultado: string, o: OpcionesAcciones) {
  const admin = clienteServicio();
  if (!admin || !h.hace) return;
  await admin.from("acciones").insert({
    owner_id: dueno,
    herramienta: h.nombre,
    app: h.app,
    categoria: h.hace.categoria,
    args,
    resumen: resumen.slice(0, 500),
    origen: o.origen,
    estado: "hecha",
    resultado: resultado.slice(0, 2000),
    resuelto_en: new Date().toISOString(),
    conversacion_id: o.conversacionId ?? null,
  });
}

/**
 * Una herramienta que HACE algo, con la regla de «Qué hace solo» encima.
 * `hacer` la corre de verdad (con el token de la persona). Al modelo le
 * regresa "HECHO: …" o "NO SE HIZO TODAVÍA: …" para que nunca diga que hizo
 * algo que no se hizo.
 */
export async function hacerOEsperar(
  dueno: string,
  h: Herramienta,
  args: Record<string, unknown>,
  o: OpcionesAcciones,
  hacer: () => Promise<string>,
  agente: "lola" | "clara" | "victor" | "iris",
): Promise<string> {
  // Si los datos no sirven, el modelo recibe el porqué (ErrorArgs) y nada se guarda
  const resumen = h.hace!.resumen(args, o.zona);
  const espera = await porQueEspera(h, args, o);
  if (espera) {
    const id = await guardarPendiente(dueno, h, args, resumen, espera, o);
    if (!id) return "NO SE HIZO: no pude dejarlo listo para su OK (algo falló al guardarlo o ya hay demasiadas cosas esperando). Díselo en una frase.";
    if (o.origen !== "chat") {
      const admin = clienteServicio();
      if (admin)
        await avisarEnChat(admin, dueno, {
          agente,
          texto: `Necesito tu OK para esto: ${citar(resumen, 400)}.\n\nTe pregunto porque ${espera}. Apruébalo con un clic en [Necesita tu OK](/panel?vista=pendientes).`,
        });
    }
    return `NO SE HIZO TODAVÍA: quedó esperando el OK del dueño («${resumen}»), porque ${espera}. Dile en una frase que lo apruebe con un clic en [Necesita tu OK](/panel?vista=pendientes). No digas que ya se hizo.`;
  }
  const resultado = await hacer();
  await registrarHecha(dueno, h, args, resumen, resultado, o);
  if (o.origen !== "chat") {
    const admin = clienteServicio();
    if (admin) await avisarEnChat(admin, dueno, { agente, texto: `Hice esto por mi cuenta: ${citar(resumen, 400)}.\n\n${citar(resultado, 500)}` });
  }
  return `HECHO: ${resultado}`;
}
