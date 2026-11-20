import "server-only";
import { AUTONOMIA, type IdAutonomia, type ModoAutonomia } from "./ajustes";
import { citar } from "./avisos";
import { limpiarCorto, notificar, recordar } from "./notificar";
import { verificarContraReglas, type Regla } from "./cerebro";
import { ErrorPermiso } from "./conexiones/http";
import { APP_POR_ID } from "./conexiones/catalogo";
import type { Herramienta } from "./nucleo-tipos";
import { clienteServicio } from "./supabase/servicio";

/**
 * LO QUE ATENDEL HACE EN TUS APPS (crear, mover o cancelar citas, mandar
 * correos, crear tareas…), según «Qué hace solo» (Ajustes > Autonomía):
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

/** La categoría con esos argumentos (una cita con invitados manda correos). */
export const categoriaDe = (h: Herramienta, args: Record<string, unknown>) => h.hace?.categoriaDe?.(args) ?? h.hace?.categoria;

/** Por qué espera tu OK; null si se puede hacer al momento. */
export async function porQueEspera(h: Herramienta, args: Record<string, unknown>, o: OpcionesAcciones): Promise<string | null> {
  const categoria = categoriaDe(h, args);
  if (!categoria) return "no se sabe qué tipo de acción es";
  if (o.autonomia[categoria as IdAutonomia] !== "solo") return `es de «${TITULO[categoria] ?? "algo nuevo"}», y eso me pediste que te lo pregunte antes`;
  if (o.externo()) return "en esta conversación hay cosas de fuera (correos, mensajes o datos de tus apps), y con eso nada se hace solo";
  // Lo que les llega a otras personas pasa por el verificador de Reglas antes de salir solo
  const sale = h.hace?.textoQueSale?.(args) ?? "";
  if (sale.trim()) {
    const v = await verificarContraReglas(sale, o.reglas ?? [], undefined, { estricto: true }).catch(() => ({ ok: false, problemas: ["no se pudo revisar contra tus Reglas"] }));
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
      categoria: categoriaDe(h, args),
      args,
      resumen: resumen.slice(0, 500),
      motivo: motivo.slice(0, 300),
      origen: o.origen,
      conversacion_id: o.conversacionId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  const id = String(data.id);
  // Si en 24 horas sigue esperando, te lo recuerda (si ya lo resolviste, no sale)
  await recordar(admin, dueno, {
    tipo: "accion_sigue_esperando",
    agente: "iris",
    corto: `Sigue esperando tu OK: ${limpiarCorto(resumen, 200)}.`,
    enlace: `/panel?aprobar=${id}`,
    minutos: 24 * 60,
    revisar: `accion:${id}`,
    clave: `espera24:${id}`,
  });
  return id;
}

/** Lo que se hizo al momento (para el historial). */
export async function registrarHecha(dueno: string, h: Herramienta, args: Record<string, unknown>, resumen: string, resultado: string, o: OpcionesAcciones) {
  const admin = clienteServicio();
  if (!admin || !h.hace) return;
  await admin.from("acciones").insert({
    owner_id: dueno,
    herramienta: h.nombre,
    app: h.app,
    categoria: categoriaDe(h, args),
    args,
    resumen: resumen.slice(0, 500),
    origen: o.origen,
    estado: "hecha",
    resultado: resultado.slice(0, 2000),
    resuelto_en: new Date().toISOString(),
    conversacion_id: o.conversacionId ?? null,
  });
}

/** Una app pide un permiso nuevo para hacer algo: te avisa una vez al día por app, con el botón para volver a conectarla. */
async function avisarPermisos(dueno: string, e: ErrorPermiso, agente: "lola" | "clara" | "victor" | "iris") {
  const admin = clienteServicio();
  if (!admin) return;
  const app = /^[a-z_]{2,40}$/.test(e.app) ? e.app : "";
  const nombre = (APP_POR_ID as Record<string, { nombre: string } | undefined>)[app]?.nombre ?? "Una de tus apps";
  const conectar = app ? `/panel?conectar=${app}` : "/panel?vista=negocio&tab=apps";
  await notificar(admin, dueno, {
    tipo: "app_permisos",
    agente,
    chat: `${nombre} no me dio permiso para ${citar(e.que, 80)}. Vuelve a conectarla para darle ese permiso: [Volver a conectar](${conectar})`,
    corto: `${nombre} necesita un permiso nuevo (${limpiarCorto(e.que, 60)}). Vuelve a conectarla.`,
    enlace: conectar,
    clave: `permisos:${app || "app"}:${new Date().toISOString().slice(0, 10)}`,
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
        await notificar(admin, dueno, {
          tipo: "accion_espera_ok",
          agente,
          chat: `Necesito tu OK para esto: ${citar(resumen, 400)}.\n\nTe pregunto porque ${espera}.\n\n[Aprobar y hacer](/panel?aprobar=${id})`,
          corto: `Necesito tu OK para: ${limpiarCorto(resumen, 200)}.`,
          enlace: `/panel?aprobar=${id}`,
        });
    }
    return `NO SE HIZO TODAVÍA: quedó esperando el OK del dueño («${resumen}»), porque ${espera}. Dile en una frase que lo dejaste listo y pon, en una línea aparte, este botón tal cual: [Aprobar y hacer](/panel?aprobar=${id}) — con un clic se hace. No digas que ya se hizo.`;
  }
  let resultado: string;
  try {
    resultado = await hacer();
  } catch (e) {
    // Fuera del chat nadie lo ve: si la app pide permisos nuevos, te avisa (una vez al día por app)
    if (e instanceof ErrorPermiso && o.origen !== "chat") await avisarPermisos(dueno, e, agente);
    throw e;
  }
  await registrarHecha(dueno, h, args, resumen, resultado, o);
  if (o.origen !== "chat") {
    const admin = clienteServicio();
    if (admin)
      await notificar(admin, dueno, {
        tipo: "hizo_solo",
        agente,
        chat: `Hice esto por mi cuenta: ${citar(resumen, 400)}.\n\n${citar(resultado, 500)}`,
        corto: `Hice esto por mi cuenta: ${limpiarCorto(resumen, 200)}.`,
      });
  }
  return `HECHO: ${resultado}`;
}
