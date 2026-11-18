import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IDS_AGENTES } from "./agentes";
import { limpiarAjustes } from "./ajustes";
import { bloqueCerebro, cargarCerebro } from "./cerebro";
import { argTexto } from "./conexiones/http";
import { conexionesVigentes } from "./conexiones/tokens";
import { cargarCuenta } from "./cuenta";
import { accionesDelChat, instruccionesAcciones } from "./herramientas/acciones";
import { responderConHerramientas, type HerramientaChat, type PeticionRonda } from "./herramientas/ciclo";
import { herramientasDelChat, instruccionesHerramientas } from "./herramientas/preparar";
import { MODELOS } from "./planes";
import { cuandoEnPalabras, errorFrecuencia, frecuenciaEnPalabras, siguienteVez, zonaValida, type Frecuencia, type TipoTarea } from "./tareas-tiempo";
import { inicioSemana } from "./trabajo";
import { Gasto } from "./uso";
import { citar, citarLineas } from "./avisos";
import { avisarUsoTrabajo, limpiarCorto, notificar, recordar } from "./notificar";
import { herramientaVerAtendel } from "./herramientas/atendel";

/**
 * TAREAS (migración 0020): lo que el dueño le pide a Atendel que haga solo,
 * a cierta hora ("cada martes a las 3 pm pregúntale a Chuchito si llegó el
 * pedido"). Se piden en el chat (herramienta programar_tarea) o en Tareas.
 * A su hora, /api/trabajo las corre (ejecutarTarea): con las apps
 * conectadas (solo lectura), sus acciones (presentaciones; envíos al equipo
 * que quedan en Pendientes), y el cerebro (Reglas, Procesos, Memoria). El
 * resultado llega a la Oficina. Gasta del límite del trabajo por su cuenta.
 */

const TIPOS: TipoTarea[] = ["una_vez", "diaria", "semanal", "mensual"];

/**
 * La herramienta del chat para programar una tarea (con la sesión: RLS solo deja lo suyo).
 * Si en este turno hay datos de fuera (`turno.externo`: se usaron apps; `turno.contexto`: van correos
 * o documentos), la tarea se guarda PAUSADA, esperando que el dueño la active en Tareas: así un correo
 * o una app nunca puede dejar una tarea que corra sola.
 */
export function herramientaProgramar(supabase: SupabaseClient, userId: string, zona: string, turno: { externo: boolean; contexto?: boolean }): HerramientaChat {
  return {
    nombre: "programar_tarea",
    descripcion:
      'Programa una tarea que Atendel hará SOLO a cierta hora, una vez o repetida (por ejemplo: "cada martes a las 3 pm pregúntale a Chuchito si llegó el pedido", "el último día de cada mes revisa mis ventas y hazme el reporte"). Úsala cuando el dueño pida algo para después o que se repita. Escribe la instrucción completa, para que se entienda sola cuando toque.',
    esquema: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "Nombre corto, por ejemplo: «Preguntarle a Chuchito por el pedido»." },
        instruccion: { type: "string", description: "Qué hacer exactamente cuando toque, con todos los detalles (a quién, qué revisar, qué entregar)." },
        tipo: { type: "string", enum: TIPOS, description: "una_vez, diaria, semanal o mensual." },
        dias: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 }, description: "Para semanal: días de la semana (0 = domingo, 1 = lunes … 6 = sábado)." },
        dia_mes: { type: "integer", description: "Para mensual: día del mes (1 a 31) o -1 para el último día." },
        fecha: { type: "string", description: "Para una_vez: AAAA-MM-DD." },
        hora: { type: "string", description: "HH:MM en 24 horas, en la hora del negocio. Por ejemplo 15:00." },
      },
      required: ["titulo", "instruccion", "tipo", "hora"],
      additionalProperties: false,
    },
    fuente: "Atendel",
    estado: "Atendel está programando la tarea…",
    async ejecutar(args) {
      const titulo = argTexto(args, "titulo", { requerido: true, max: 120 }).trim();
      const instruccion = argTexto(args, "instruccion", { requerido: true, max: 2000 }).trim();
      const tipo = TIPOS.find((t) => t === args.tipo);
      if (!tipo) return "El tipo debe ser una_vez, diaria, semanal o mensual.";
      const f: Frecuencia = {
        tipo,
        dias: Array.isArray(args.dias) ? args.dias.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6) : [],
        dia_mes: typeof args.dia_mes === "number" ? args.dia_mes : null,
        fecha: typeof args.fecha === "string" ? args.fecha.slice(0, 10) : null,
        hora: typeof args.hora === "string" ? args.hora.trim().padStart(5, "0") : "",
        zona: zonaValida(zona),
      };
      const esperaOk = turno.externo || Boolean(turno.contexto);
      const mal = errorFrecuencia(f);
      if (mal) return `No se programó: ${mal}`;
      const proxima = siguienteVez(f);
      if (!proxima) return "No se programó: esa fecha y hora ya pasaron.";
      const { error } = await supabase.from("tareas").insert({
        owner_id: userId,
        titulo,
        instruccion,
        tipo: f.tipo,
        dias: f.tipo === "semanal" ? f.dias : [],
        dia_mes: f.tipo === "mensual" ? f.dia_mes : null,
        fecha: f.tipo === "una_vez" ? f.fecha : null,
        hora: f.hora,
        zona: f.zona,
        proxima,
        activa: !esperaOk,
      });
      if (error) return error.code === "23514" ? "No se programó: ya tiene el máximo de 30 tareas. Que borre alguna en Tareas." : "No se pudo programar ahora. Que lo intente de nuevo en un momento.";
      if (esperaOk) {
        return `Tarea lista, ESPERANDO SU OK: «${titulo}». ${frecuenciaEnPalabras(f)}. Por seguridad, como en esta conversación hay correos o datos de sus apps, no la activé sola: que la active con un toque en [Tareas](/panel?vista=tareas) («Activar»). Díselo así de simple.`;
      }
      return `Tarea programada: «${titulo}». ${frecuenciaEnPalabras(f)}. La primera vez: ${cuandoEnPalabras(proxima, f.zona)}. La puede ver, pausar o borrar en [Tareas](/panel?vista=tareas). Cuando toque, la haces solo y el resultado llega a la Oficina.`;
    },
  };
}

/** Lo que se agrega a las instrucciones del chat sobre las tareas. */
export const INSTRUCCIONES_TAREAS = `

TAREAS PROGRAMADAS: si el dueño te pide algo para después o que se repita ("cada martes…", "el fin de mes…", "mañana a las 9…"), prográmalo con la herramienta programar_tarea (no le pidas que lo haga él) y confírmale cuándo será la primera vez. Si falta la hora, usa una razonable y díselo.`;

type FilaTarea = { id: string; owner_id: string; titulo: string; instruccion: string; tipo: TipoTarea; dias: number[] | null; dia_mes: number | null; fecha: string | null; hora: string; zona: string; proxima: string };

/** Corre una tarea que ya tocaba (ya apartada). Deja el resultado en la Oficina. */
export async function ejecutarTarea(admin: SupabaseClient, t: FilaTarea): Promise<{ hecho: boolean; motivo: string }> {
  const dueno = t.owner_id;
  if (!process.env.ANTHROPIC_API_KEY) return { hecho: false, motivo: "sin llave de IA" };
  const { data: filaAjustes } = await admin.from("ajustes_cuenta").select("datos").eq("owner_id", dueno).maybeSingle();
  const aj = limpiarAjustes(filaAjustes?.datos);
  const cuenta = await cargarCuenta(admin, dueno);
  const { data: gastos } = await admin.from("trabajo_uso").select("costo").eq("owner_id", dueno).gte("creado_en", inicioSemana(aj.zonaHoraria));
  const gastado = (gastos ?? []).reduce((n, g) => n + (Number(g.costo) || 0), 0);
  // Al 80 % y al llegar al límite, te avisa (una vez por semana cada uno)
  const lleno = gastado + 5_000 > cuenta.plan.trabajo.semana;
  await avisarUsoTrabajo(admin, dueno, { gastado, limite: cuenta.plan.trabajo.semana, semana: inicioSemana(aj.zonaHoraria), lleno });
  if (lleno) return { hecho: false, motivo: "límite de la semana" };

  const [conexiones, cerebro] = await Promise.all([conexionesVigentes(admin, dueno), cargarCerebro(admin, dueno)]);
  // Las apps (solo lectura) y las acciones de Atendel; los documentos no (dependen de la sesión)
  // Lo que lee marca la corrida como "con datos de fuera": desde ahí, lo que HACE algo espera tu OK
  const corrida = { externo: false };
  const leer = <T extends { ejecutar: (a: Record<string, unknown>, s: AbortSignal) => Promise<string> }>(h: T): T => ({
    ...h,
    ejecutar: (args: Record<string, unknown>, senal: AbortSignal) => {
      corrida.externo = true;
      return h.ejecutar(args, senal);
    },
  });
  const deApps = herramientasDelChat({
    supabase: admin,
    userId: dueno,
    participantes: IDS_AGENTES,
    conexiones,
    zona: aj.zonaHoraria,
    acciones: { autonomia: aj.autonomia, origen: "tarea", externo: () => corrida.externo, zona: aj.zonaHoraria, reglas: cerebro.reglas },
  })
    .filter((h) => h.nombre !== "buscar_en_documentos")
    .map((h) => (h.hace ? h : leer(h)));
  const herramientas = [
    ...deApps,
    ...accionesDelChat({ supabase: admin, userId: dueno, participantes: IDS_AGENTES, conversacionId: null, negocio: cuenta.negocio }),
    // Lo de su cuenta de Atendel (lo que espera su OK, WhatsApp, Oficina…): para tareas como «cada mañana dime qué tengo pendiente»
    leer(herramientaVerAtendel(admin, dueno, { zona: aj.zonaHoraria })),
  ];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const system = [
    {
      type: "text" as const,
      text: `Eres Atendel, el asistente (socio) de ${cuenta.negocio}, con tus agentes Aura (atención y citas), Altair (correo), Rigel (clientes) y Mira (oficina). El dueño te dejó programada una tarea y ya toca: hazla AHORA tú solo, con tus herramientas, sin preguntarle (no está en el chat).
Tarea: «${t.titulo}»
Lo que pidió: ${t.instruccion}

- Hazla completa con lo que tengas. Si algo no se puede (falta una app, un dato o una persona en su equipo), haz lo que sí se pueda y di claro qué faltó.
- Al terminar, escribe para el dueño, en español de México y en pocas líneas: qué hiciste, qué encontraste y qué queda pendiente (si algo).
- Nunca digas que enviaste algo que quedó en Pendientes esperando su visto bueno.${bloqueCerebro(cerebro, aj)}
${instruccionesHerramientas(IDS_AGENTES, deApps, conexiones)}${instruccionesAcciones(IDS_AGENTES)}`,
      cache_control: { type: "ephemeral" as const },
    },
  ];
  const gasto = new Gasto();
  const pedir = (p: PeticionRonda) => client.beta.messages.stream({ model: MODELOS.rapido.api, max_tokens: 4000, system, ...p, output_config: { effort: MODELOS.rapido.esfuerzo } });
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), 35_000);
  let texto = "";
  try {
    await responderConHerramientas({
      pedir,
      mensajes: [{ role: "user", content: [{ type: "text", text: `Ya toca: haz la tarea «${t.titulo}».`, cache_control: { type: "ephemeral" } }] }],
      herramientas,
      alTexto: (d) => {
        texto += d;
      },
      alEstado: () => {},
      alUso: (m) => gasto.sumar(m, MODELOS.rapido.api),
      senal: control.signal,
    });
  } catch (e) {
    if (!control.signal.aborted) console.error("Tarea falló:", e instanceof Error ? e.message : e);
  } finally {
    clearTimeout(reloj);
    if (gasto.costo > 0) {
      await admin.from("trabajo_uso").insert({ owner_id: dueno, costo: Math.max(1, Math.min(Math.round(gasto.costo), 5_000_000)), entrada: gasto.entrada, salida: gasto.salida, modelo: gasto.modelo.slice(0, 60) });
    }
  }

  const resultado = texto.trim().slice(0, 4000) || "No alcancé a terminarla esta vez; la vuelvo a intentar la próxima.";
  const { data: enOficina } = await admin
    .from("trabajos")
    .insert({
      owner_id: dueno,
      agente: "iris",
      titulo: `Tarea: ${t.titulo}`.slice(0, 160),
      detalle: frecuenciaEnPalabras({ tipo: t.tipo, dias: t.dias ?? [], dia_mes: t.dia_mes, fecha: t.fecha, hora: t.hora }).slice(0, 300),
      partes: [{ titulo: "Lo que hice", texto: resultado }],
    })
    .select("id")
    .single();
  await admin
    .from("tareas")
    .update({ ultima: new Date().toISOString(), ultimo_resultado: resultado.replace(/\s+/g, " ").slice(0, 300) })
    .eq("id", t.id)
    .eq("owner_id", dueno);
  // Y te avisa en el chat (Avisos de Atendel), no solo en la Oficina
  await notificar(admin, dueno, {
    tipo: texto.trim() ? "tarea_termino" : "tarea_fallo",
    agente: "iris",
    chat: `${texto.trim() ? "Hice" : "Intenté hacer"} tu tarea «${citar(t.titulo, 120)}».\n\n${citarLineas(resultado, 900)}\n\nCompleta en la [Oficina](/panel?vista=oficina).`,
    corto: texto.trim() ? `Hice tu tarea «${limpiarCorto(t.titulo, 80)}». Está en la Oficina.` : `No alcancé a hacer tu tarea «${limpiarCorto(t.titulo, 80)}»; la intento la próxima vez.`,
    enlace: "/panel?vista=oficina",
  });
  // Si en 2 días no la revisas en la Oficina, te lo recuerda
  if (enOficina?.id && texto.trim())
    await recordar(admin, dueno, {
      tipo: "oficina_espera",
      agente: "iris",
      corto: `Tu tarea «${limpiarCorto(t.titulo, 80)}» sigue esperando tu revisión en la Oficina.`,
      enlace: "/panel?vista=oficina",
      minutos: 2 * 24 * 60,
      revisar: `oficina:${enOficina.id}`,
      clave: `oficina2d:${enOficina.id}`,
    });
  return { hecho: Boolean(texto.trim()), motivo: texto.trim() ? "hecha" : "sin resultado" };
}

/** Las tareas que ya tocan: se apartan (se mueve su próxima vez) y se corren. */
export async function tareasQueTocan(admin: SupabaseClient, limite = 10): Promise<FilaTarea[]> {
  const { data } = await admin
    .from("tareas")
    .select("id, owner_id, titulo, instruccion, tipo, dias, dia_mes, fecha, hora, zona, proxima")
    .eq("activa", true)
    .lte("proxima", new Date().toISOString())
    .order("proxima", { ascending: true })
    .limit(limite * 3);
  // Parejo entre cuentas: una tarea por cuenta en cada vuelta
  const vistos = new Set<string>();
  return ((data ?? []) as FilaTarea[]).filter((t) => (vistos.has(t.owner_id) ? false : (vistos.add(t.owner_id), true)));
}

/** Aparta una tarea: le pone su siguiente vez (o la apaga si era una sola vez). true si se apartó aquí. */
export async function apartarTarea(admin: SupabaseClient, t: FilaTarea): Promise<boolean> {
  const siguiente = siguienteVez({ tipo: t.tipo, dias: t.dias ?? [], dia_mes: t.dia_mes, fecha: t.fecha, hora: t.hora, zona: t.zona });
  const { data } = await admin
    .from("tareas")
    .update(siguiente ? { proxima: siguiente } : { proxima: null, activa: false })
    .eq("id", t.id)
    .eq("proxima", t.proxima)
    .select("id");
  return Boolean(data?.length);
}
