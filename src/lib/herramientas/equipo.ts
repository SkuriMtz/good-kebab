import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENTE_POR_ID, esIdAgente, type IdAgente } from "@/lib/agentes";
import { ErrorArgs } from "@/lib/conexiones/http";
import { elegirModelo } from "@/lib/elegir-modelo";
import type { EventoEquipo } from "@/lib/estado-chat";
import { MODELOS, type Plan } from "@/lib/planes";
import type { Gasto } from "@/lib/uso";
import type { EstadoUso } from "@/lib/uso-estado";
import { mensajeErrorIa, responderConHerramientas, type HerramientaChat, type PeticionRonda } from "./ciclo";

/**
 * TU EQUIPO TRABAJANDO: la herramienta `encargar` de Atendel.
 *
 * Atendel (el coordinador) no entra a las apps: le encarga cada parte al
 * empleado que le toca. Cada encargo corre APARTE, como su propia plática con
 * la IA: con las instrucciones de ese empleado, SOLO sus herramientas y el
 * modelo que pide la tarea (Rápido o Avanzado, src/lib/elegir-modelo.ts).
 * Así, un correo con trampa que lee Altair no puede tocar la agenda de Aura.
 * Varios encargos en la misma ronda corren al mismo tiempo (el ciclo corre
 * las herramientas en paralelo).
 *
 * Mientras trabaja, el stream lleva sus eventos (inicio → estado → listo o
 * error) para la tarjetita del chat, y queda una fila en `encargos`
 * (migración 0040) para el historial y para «Tu equipo». Lo que reporta
 * vuelve a Atendel como DATOS (puede traer correos o mensajes de fuera).
 */

/** Lo más que trabaja un empleado en un encargo (la ruta del chat vive 120 s). */
export const TIEMPO_ENCARGO_MS = 60_000;
const MAX_TAREA = 4000;
const MAX_REPORTE = 4000;

export type OpcionesEquipo = {
  client: Anthropic;
  /** Los empleados que puede usar (los de su plan). */
  ids: readonly IdAgente[];
  plan: Pick<Plan, "modelos">;
  uso: Pick<EstadoUso, "sesion" | "semana"> | null;
  /** Lo que cuesta cada encargo cuenta en el límite del plan, igual que el chat. */
  gasto: Gasto;
  /** Se corta si el dueño toca «Detener». */
  senal: AbortSignal;
  /** Las herramientas de ese empleado (solo las de su área). */
  herramientasDe: (id: IdAgente) => HerramientaChat[];
  /** Las instrucciones de ese empleado, ya con lo de sus herramientas. */
  sistemaDe: (id: IdAgente, herramientas: HerramientaChat[]) => string;
  /** Fragmentos de los documentos del negocio para este mensaje ("" si no hay). */
  documentos?: string;
  /** Cada evento de la tarjetita (va al stream si el cliente lo pidió). */
  avisar: (e: EventoEquipo) => void;
  /** En qué parte del texto de Atendel van las tarjetitas de este encargo. */
  posicion: () => number;
  /** Dónde se guardan los encargos (sin cliente de servicio, solo se ven en vivo). */
  guardar: { admin: SupabaseClient | null; owner: string; conversacion: string | null };
  /** Los ids de los encargos de este turno (para ligarlos al mensaje al final). */
  hechos: string[];
};

const linea = (t: unknown, max: number) =>
  typeof t === "string"
    ? t
        .replace(/[\u0000-\u001f\u007f]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";

/** «Altair está revisando tu correo…» → «Revisando tu correo…» (en la tarjetita ya sale quién es). */
export function estadoSinNombre(texto: string, nombre: string): string {
  let t = texto.trim();
  if (t.toLowerCase().startsWith(nombre.toLowerCase())) t = t.slice(nombre.length).trim();
  t = t.replace(/^lo está haciendo/i, "Haciéndolo").replace(/^está\s+/i, "");
  return (t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 160) || "Trabajando…";
}

export function herramientaEncargar(o: OpcionesEquipo): HerramientaChat {
  const lista = o.ids.map((id) => `${id} (${AGENTE_POR_ID[id].nombre}, ${AGENTE_POR_ID[id].area})`).join(", ");
  return {
    nombre: "encargar",
    descripcion: `Le encarga un trabajo a un empleado de tu equipo: lo hace de verdad, con sus herramientas, y te regresa su reporte. Para varias cosas de distintas áreas, úsala varias veces en la MISMA ronda (trabajan al mismo tiempo). Empleados: ${lista}.`,
    esquema: {
      type: "object",
      properties: {
        empleado: { type: "string", enum: [...o.ids], description: "A quién se lo encargas." },
        titulo: { type: "string", description: "Lo que el dueño ve en la tarjetita: de 2 a 7 palabras, por ejemplo «Contestar el correo de Andrea»." },
        tarea: { type: "string", description: "Todo lo que necesita para hacerlo (no ve la plática): qué hacer, con los datos tal como los dijo el dueño, y qué te tiene que entregar." },
      },
      required: ["empleado", "titulo", "tarea"],
      additionalProperties: false,
    },
    fuente: "el reporte de tu equipo",
    // Sin línea de estado general: cada empleado tiene su tarjetita
    estado: "",
    ejecutar: (args, senal) => encargar(o, args, senal),
  };
}

async function encargar(o: OpcionesEquipo, args: Record<string, unknown>, senal: AbortSignal): Promise<string> {
  const agente = args.empleado;
  if (!esIdAgente(agente) || !o.ids.includes(agente)) throw new ErrorArgs(`"empleado" tiene que ser uno de: ${o.ids.join(", ")}.`);
  const tarea = typeof args.tarea === "string" ? args.tarea.trim().slice(0, MAX_TAREA) : "";
  if (!tarea) throw new ErrorArgs('Falta "tarea": qué tiene que hacer.');
  const titulo = linea(args.titulo, 80) || "Trabajando en tu encargo";
  const nombre = AGENTE_POR_ID[agente].nombre;
  const id = crypto.randomUUID();
  const pos = o.posicion();

  o.avisar({ t: "inicio", id, agente, titulo, pos });
  if (o.guardar.admin) {
    const { error } = await o.guardar.admin
      .from("encargos")
      .insert({ id, owner_id: o.guardar.owner, conversacion_id: o.guardar.conversacion, agente, titulo, posicion: pos, origen: "chat" });
    if (!error) o.hechos.push(id);
    else console.error("Equipo: no se pudo guardar el encargo:", error.message);
  }

  // Se corta si el dueño toca «Detener», si se corta la ronda o si tarda demasiado
  const corte = AbortSignal.any([senal, o.senal, AbortSignal.timeout(TIEMPO_ENCARGO_MS)]);
  let reporte = "";
  let estado: "listo" | "error" = "listo";
  try {
    const herramientas = o.herramientasDe(agente);
    const modelo = MODELOS[elegirModelo({ mensaje: tarea, plan: o.plan, uso: o.uso })];
    const system = o.sistemaDe(agente, herramientas);
    const pedir = (p: PeticionRonda) =>
      o.client.beta.messages.stream({
        max_tokens: 6000,
        system: [{ type: "text" as const, cache_control: { type: "ephemeral" as const }, text: system }],
        ...p,
        model: modelo.api,
        output_config: { effort: modelo.esfuerzo },
        // Solo Opus tiene el respaldo del servidor (si declina por un falso positivo, reintenta solo)
        ...(modelo.api === "claude-opus-5-5" ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      });
    const { texto } = await responderConHerramientas({
      pedir,
      mensajes: [
        {
          role: "user" as const,
          content: [...(o.documentos ? [{ type: "text" as const, text: o.documentos }] : []), { type: "text" as const, text: `Encargo de Atendel:\n${tarea}` }],
        },
      ],
      herramientas,
      // El reporte no se le muestra al dueño tal cual: se lo entrega a Atendel
      alTexto: () => undefined,
      alEstado: (t) => o.avisar({ t: "estado", id, texto: estadoSinNombre(t, nombre) }),
      alUso: (m) => o.gasto.sumar(m, m.model),
      senal: corte,
    });
    reporte = texto.trim().slice(0, MAX_REPORTE) || "Terminé, pero no dejé nada que reportar.";
  } catch (e) {
    estado = "error";
    reporte = corte.aborted && !senal.aborted && !o.senal.aborted ? "Se me acabó el tiempo y no lo terminé." : mensajeErrorIa(e);
  }

  if (o.guardar.admin) {
    const { error } = await o.guardar.admin
      .from("encargos")
      .update({ estado, resultado: reporte, terminado_en: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", o.guardar.owner);
    if (error) console.error("Equipo: no se pudo cerrar el encargo:", error.message);
  }
  o.avisar({ t: estado, id, resultado: reporte });
  return estado === "listo" ? `${nombre} terminó. Su reporte:\n${reporte}` : `${nombre} NO pudo terminarlo: ${reporte}`;
}
