import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { limpiarAjustes } from "./ajustes";
import { citarLineas } from "./avisos";
import { conexionesSemana, cosechaMes } from "./cosecha";
import { NOMBRE_PROVEEDOR } from "./conexiones/oauth";
import { cargarCuenta } from "./cuenta";
import type { Proveedor } from "./nucleo-tipos";
import { notificar } from "./notificar";
import { MODELOS } from "./planes";
import { inicioSemana } from "./trabajo";
import { Gasto } from "./uso";

/**
 * INFORMES: el de la semana (por omisión, el lunes a las 9:00) y el resumen
 * del día (si lo prendes, a la hora que digas). La base dice a quién le toca
 * (informes_que_tocan(), migración 0026) y /api/trabajo?que=avisos los manda.
 * - Se arman con números de la base: nada de lo que escribieron tus clientes.
 * - El de la semana suma 2 o 3 recomendaciones del modelo Rápido (solo con
 *   esos números), si alcanza lo de «trabajo por su cuenta» de la semana.
 * - Completo en el chat de Avisos; corto en la notificación.
 * - Una semana (o un día) sin nada no se manda.
 */

type Numeros = {
  mensajes: number;
  lolaSola: number;
  esperanRespuesta: number;
  correos: number;
  respuestasListas: number;
  hechasSolo: number;
  aprobadas: number;
  descartadas: number;
  esperanOk: number;
  citas: number;
  tareas: number;
  oficina: number;
  appsConProblema: string[];
  usoTrabajo: number | null;
};

const HERRAMIENTAS_CORREO = ["gmail_enviar_correo", "outlook_enviar_correo"];
const CITAS = /calendar_(crear|mover|cancelar)_evento/;

async function numerosDe(admin: SupabaseClient, dueno: string, desde: string, zona: string): Promise<Numeros> {
  const cuenta = await cargarCuenta(admin, dueno);
  const [entrantes, lolaSola, esperanResp, correos, acciones, esperanOk, trabajos, conexiones, gastos] = await Promise.all([
    admin.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("owner_id", dueno).eq("direccion", "entrante").gte("creado_en", desde),
    admin.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("owner_id", dueno).eq("direccion", "saliente").eq("autor", "lola").gte("creado_en", desde),
    admin.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("owner_id", dueno).eq("direccion", "entrante").in("estado", ["esperando_ok", "sin_respuesta"]),
    admin.from("correos_vistos").select("mensaje_id", { count: "exact", head: true }).eq("owner_id", dueno).gte("visto_en", desde),
    admin.from("acciones").select("herramienta, estado, origen, creado_en, resuelto_en").eq("owner_id", dueno).gte("creado_en", desde).limit(1000),
    admin.from("acciones").select("id", { count: "exact", head: true }).eq("owner_id", dueno).eq("estado", "esperando"),
    admin.from("trabajos").select("titulo").eq("owner_id", dueno).gte("creado_en", desde).limit(500),
    admin.from("conexiones").select("proveedor, estado").eq("owner_id", dueno),
    admin.from("trabajo_uso").select("costo").eq("owner_id", dueno).gte("creado_en", inicioSemana(zona)),
  ]);
  const lista = (acciones.data ?? []) as { herramienta: string; estado: string; origen: string; creado_en: string; resuelto_en: string | null }[];
  // Lo que se hizo solo se guarda ya resuelto; lo que aprobaste, horas o minutos después
  const alMomento = (a: (typeof lista)[number]) => Boolean(a.resuelto_en) && new Date(a.resuelto_en!).getTime() - new Date(a.creado_en).getTime() < 10_000;
  const hechas = lista.filter((a) => a.estado === "hecha");
  const tit = ((trabajos.data ?? []) as { titulo: string }[]).map((t) => String(t.titulo));
  const gastado = ((gastos.data ?? []) as { costo: number }[]).reduce((n, g) => n + (Number(g.costo) || 0), 0);
  return {
    mensajes: entrantes.count ?? 0,
    lolaSola: lolaSola.count ?? 0,
    esperanRespuesta: esperanResp.count ?? 0,
    correos: correos.count ?? 0,
    respuestasListas: lista.filter((a) => HERRAMIENTAS_CORREO.includes(a.herramienta) && a.origen === "trabajo").length,
    hechasSolo: hechas.filter(alMomento).length,
    aprobadas: hechas.filter((a) => !alMomento(a)).length,
    descartadas: lista.filter((a) => a.estado === "descartada").length,
    esperanOk: esperanOk.count ?? 0,
    citas: hechas.filter((a) => CITAS.test(a.herramienta)).length,
    tareas: tit.filter((t) => t.startsWith("Tarea:")).length,
    oficina: tit.filter((t) => !t.startsWith("Tarea:")).length,
    appsConProblema: ((conexiones.data ?? []) as { proveedor: string; estado: string }[]).filter((c) => c.estado === "error").map((c) => NOMBRE_PROVEEDOR[c.proveedor as Proveedor] ?? c.proveedor),
    usoTrabajo: cuenta.plan.trabajo.semana > 0 ? Math.min(100, Math.round((gastado / cuenta.plan.trabajo.semana) * 100)) : null,
  };
}

const vacio = (n: Numeros) => !n.mensajes && !n.correos && !n.hechasSolo && !n.aprobadas && !n.descartadas && !n.citas && !n.tareas && !n.oficina && !n.esperanOk && !n.esperanRespuesta;
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Los renglones del informe (solo lo que tuvo algo). */
function renglones(n: Numeros): string[] {
  const r: string[] = [];
  if (n.mensajes || n.esperanRespuesta)
    r.push(
      `- **Clientes por WhatsApp:** ${plural(n.mensajes, "mensaje", "mensajes")}${n.lolaSola ? `; Aura contestó ${n.lolaSola} sola` : ""}.${n.esperanRespuesta ? ` ${plural(n.esperanRespuesta, "espera", "esperan")} tu respuesta.` : ""}`,
    );
  if (n.correos || n.respuestasListas) r.push(`- **Correos:** revisé ${n.correos}${n.respuestasListas ? `; te dejé ${plural(n.respuestasListas, "respuesta lista", "respuestas listas")}` : ""}.`);
  if (n.hechasSolo || n.aprobadas || n.descartadas || n.esperanOk)
    r.push(
      `- **Lo que hice:** ${plural(n.hechasSolo, "cosa", "cosas")} por mi cuenta y ${plural(n.aprobadas, "que aprobaste", "que aprobaste")}${n.descartadas ? `; descartaste ${n.descartadas}` : ""}.${n.esperanOk ? ` ${plural(n.esperanOk, "espera", "esperan")} tu OK.` : ""}`,
    );
  if (n.citas) r.push(`- **Citas:** ${plural(n.citas, "creada, movida o cancelada", "creadas, movidas o canceladas")}.`);
  if (n.tareas || n.oficina) r.push(`- **Oficina:** ${plural(n.tareas, "tarea terminada", "tareas terminadas")} y ${plural(n.oficina, "cosa nueva", "cosas nuevas")} de la revisión del día.`);
  if (n.appsConProblema.length) r.push(`- **Apps con problema:** ${n.appsConProblema.join(", ")}. Vuelve a conectarlas en [Tu negocio → Apps](/panel?vista=negocio&tab=apps).`);
  if (n.usoTrabajo != null && n.usoTrabajo > 0) r.push(`- **Trabajo por mi cuenta:** llevo ${n.usoTrabajo} % de lo de esta semana.`);
  return r;
}

/** El texto corto de la notificación. */
function corto(n: Numeros, inicio: string): string {
  const partes = [
    n.mensajes ? plural(n.mensajes, "mensaje de clientes", "mensajes de clientes") : "",
    n.hechasSolo + n.aprobadas ? plural(n.hechasSolo + n.aprobadas, "cosa hecha", "cosas hechas") : "",
    n.correos ? plural(n.correos, "correo revisado", "correos revisados") : "",
    n.esperanOk + n.esperanRespuesta ? `${n.esperanOk + n.esperanRespuesta} ${n.esperanOk + n.esperanRespuesta === 1 ? "espera" : "esperan"} tu respuesta u OK` : "",
  ].filter(Boolean);
  return `${inicio}: ${partes.join(", ") || "poco movimiento"}.`;
}

/** 2 o 3 recomendaciones para la semana, solo con los números (nada de fuera). */
async function recomendaciones(admin: SupabaseClient, dueno: string, n: Numeros, negocio: string, zona: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return "";
  const cuenta = await cargarCuenta(admin, dueno);
  const { data: gastos } = await admin.from("trabajo_uso").select("costo").eq("owner_id", dueno).gte("creado_en", inicioSemana(zona));
  const gastado = (gastos ?? []).reduce((s, g) => s + (Number(g.costo) || 0), 0);
  if (gastado + 5_000 > cuenta.plan.trabajo.semana) return "";
  const gasto = new Gasto();
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const r = await client.messages.create(
      {
        model: MODELOS.rapido.api,
        max_tokens: 400,
        output_config: { effort: MODELOS.rapido.esfuerzo },
        system: `Eres Atendel, el socio de IA de «${negocio}». Con los números de su semana, da 2 o 3 recomendaciones cortas y concretas para la semana que empieza, en español de México sencillo, cada una en un renglón que empiece con "- ". Solo con estos números: no inventes datos, clientes ni cifras. Sin saludo ni despedida.`,
        messages: [{ role: "user", content: JSON.stringify({ ...n, appsConProblema: n.appsConProblema.length }) }],
      },
      { timeout: 20_000, maxRetries: 1 },
    );
    gasto.sumar(r, MODELOS.rapido.api);
    const texto = r.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return citarLineas(
      texto
        .split("\n")
        .filter((l) => /^\s*-\s+\S/.test(l))
        .slice(0, 3)
        .join("\n"),
      700,
    );
  } catch (e) {
    console.error("Informe: la IA no contestó", e instanceof Error ? e.message : e);
    return "";
  } finally {
    if (gasto.costo > 0)
      await admin.from("trabajo_uso").insert({ owner_id: dueno, costo: Math.max(1, Math.min(Math.round(gasto.costo), 5_000_000)), entrada: gasto.entrada, salida: gasto.salida, modelo: gasto.modelo.slice(0, 60) });
  }
}

/** La fecha de hoy en su zona (AAAA-MM-DD), para no mandar dos veces el mismo informe. */
const hoyEn = (zona: string) => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

/** Marca que ya tocó (aunque no hubo nada que contar), para no volver a revisar. */
async function marcarSinNada(admin: SupabaseClient, dueno: string, tipo: "informe_semana" | "resumen_dia", clave: string) {
  await admin.from("avisos_salida").insert({
    owner_id: dueno,
    tipo,
    nivel: tipo === "informe_semana" ? "importante" : "info",
    titulo: tipo === "informe_semana" ? "Tu informe de la semana" : "Tu resumen del día",
    texto: "Sin movimiento: no se mandó.",
    clave,
    app: "omitido",
  });
}

async function informeSemana(admin: SupabaseClient, dueno: string): Promise<boolean> {
  const { data: fila } = await admin.from("ajustes_cuenta").select("datos").eq("owner_id", dueno).maybeSingle();
  const aj = limpiarAjustes(fila?.datos);
  const clave = `informe:${hoyEn(aj.zonaHoraria)}`;
  const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const n = await numerosDe(admin, dueno, desde, aj.zonaHoraria);
  if (vacio(n)) {
    await marcarSinNada(admin, dueno, "informe_semana", clave);
    return false;
  }
  const { negocio } = await cargarCuenta(admin, dueno);
  const consejos = await recomendaciones(admin, dueno, n, negocio, aj.zonaHoraria);
  // Patrones de la semana y, el primer lunes del mes, las Reglas que te propone (la cosecha)
  const conexiones = await conexionesSemana(admin, dueno, desde, negocio, aj.zonaHoraria);
  const primeraSemana = Number(hoyEn(aj.zonaHoraria).slice(8, 10)) <= 7;
  const cosecha = primeraSemana ? await cosechaMes(admin, dueno, negocio, aj.zonaHoraria) : "";
  const chat = [
    `**Tu semana con Atendel** (los últimos 7 días):`,
    "",
    ...renglones(n),
    ...(consejos ? ["", "**Lo que te recomiendo:**", consejos] : []),
    ...(conexiones ? ["", "**Conexiones de la semana** (lo que noté al juntar todo):", conexiones] : []),
    ...(cosecha ? ["", "**Cosecha del mes:** esto aprendí de ti este mes. Toca «Guardarla» para dejarla como Regla (nada se guarda solo):", cosecha] : []),
  ].join("\n");
  const r = await notificar(admin, dueno, { tipo: "informe_semana", agente: "iris", chat, corto: corto(n, "Tu semana"), clave });
  return r !== "repetido" && r !== "fallo";
}

async function resumenDia(admin: SupabaseClient, dueno: string): Promise<boolean> {
  const { data: fila } = await admin.from("ajustes_cuenta").select("datos").eq("owner_id", dueno).maybeSingle();
  const aj = limpiarAjustes(fila?.datos);
  const hoy = hoyEn(aj.zonaHoraria);
  const clave = `resumen:${hoy}`;
  // Desde las 00:00 de hoy en su zona
  const desde = new Date(Date.now() - (minutosDesdeMedianoche(aj.zonaHoraria) * 60_000 + (Date.now() % 60_000))).toISOString();
  const n = await numerosDe(admin, dueno, desde, aj.zonaHoraria);
  if (vacio(n)) {
    await marcarSinNada(admin, dueno, "resumen_dia", clave);
    return false;
  }
  const chat = [`**Tu día con Atendel:**`, "", ...renglones(n)].join("\n");
  const r = await notificar(admin, dueno, { tipo: "resumen_dia", agente: "iris", chat, corto: corto(n, "Hoy"), clave });
  return r !== "repetido" && r !== "fallo";
}

function minutosDesdeMedianoche(zona: string): number {
  try {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: zona, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    return (Number(p.find((x) => x.type === "hour")?.value ?? 0) % 24) * 60 + Number(p.find((x) => x.type === "minute")?.value ?? 0);
  } catch {
    return 0;
  }
}

/** Los informes que tocan (según la base). Regresa cuántos se mandaron. */
export async function mandarInformes(admin: SupabaseClient, tiempo = 30_000): Promise<number> {
  const empezo = Date.now();
  const { data, error } = await admin.rpc("informes_que_tocan");
  if (error || !Array.isArray(data)) return 0;
  let n = 0;
  for (const f of data as { owner_id: string; tipo: string }[]) {
    if (Date.now() - empezo > tiempo) break;
    try {
      if (await (f.tipo === "informe_semana" ? informeSemana(admin, String(f.owner_id)) : resumenDia(admin, String(f.owner_id)))) n++;
    } catch (e) {
      console.error("Informe falló:", e instanceof Error ? e.message : e);
    }
  }
  return n;
}
