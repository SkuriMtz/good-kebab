import type { Periodo } from "@/lib/estadisticas";
import type { Cifra } from "@/lib/estadisticas-negocio";
import type { ResumenInfo } from "@/lib/resumen-negocio";

/**
 * Preguntarle a la gráfica del resumen: una pregunta escrita ("¿a qué hora me
 * escriben más?") elige qué gráfica dibujar y trae una respuesta corta hecha
 * SOLO con los números del periodo. En /panel la contesta la IA (ruta
 * /api/negocio/pregunta); en /pruebalo, y si la IA no está disponible, se
 * contesta aquí mismo con reglas (sin IA, sin red). Nada se inventa.
 */

export const IDS_GRAFICA = ["clientes", "citas", "respuestas", "correos", "hora", "semana"] as const;
export type IdGrafica = (typeof IDS_GRAFICA)[number];
export const esIdGrafica = (v: unknown): v is IdGrafica => typeof v === "string" && (IDS_GRAFICA as readonly string[]).includes(v);

export const GRAFICAS: Record<IdGrafica, { nombre: string; detalle: string; unidad: [string, string] }> = {
  clientes: { nombre: "Clientes por día", detalle: "Personas distintas que te escribieron cada día", unidad: ["cliente", "clientes"] },
  citas: { nombre: "Citas agendadas por día", detalle: "Las citas que se agendaron cada día", unidad: ["cita", "citas"] },
  respuestas: { nombre: "Respuestas por día", detalle: "Mensajes que contestó tu equipo cada día", unidad: ["respuesta", "respuestas"] },
  correos: { nombre: "Correos atendidos por día", detalle: "Correos de clientes que tu equipo resumió o respondió", unidad: ["correo", "correos"] },
  hora: { nombre: "A qué hora te escriben", detalle: "Mensajes y correos por hora del día", unidad: ["mensaje", "mensajes"] },
  semana: { nombre: "Qué días te escriben más", detalle: "Mensajes y correos por día de la semana", unidad: ["mensaje", "mensajes"] },
};

export type RespuestaGrafica = {
  grafica: IdGrafica;
  texto: string;
  /** "ia": la contestó la IA con tus datos; "reglas": se armó sin IA con los mismos números. */
  fuente: "ia" | "reglas";
};

export const MAX_PREGUNTA = 300;
export const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const FRASE_PERIODO: Record<Periodo, string> = { "7d": "en los últimos 7 días", "30d": "en los últimos 30 días", mes: "este mes" };

const numero = new Intl.NumberFormat("es-MX");
const formatoDia = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fecha = (d: string) => formatoDia.format(new Date(`${d}T12:00:00Z`));
const plural = (n: number, [uno, varios]: [string, string]) => `${numero.format(n)} ${n === 1 ? uno : varios}`;
const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function textoCambio(c: Cifra): string {
  if (c.valor === null || c.antes === null) return "";
  if (c.antes === 0) return c.valor > 0 ? " (antes no hubo)" : "";
  const d = Math.round(((c.valor - c.antes) / c.antes) * 100);
  if (d === 0) return ", igual que antes";
  return `, ${Math.abs(d)} % ${d > 0 ? "más" : "menos"} que antes`;
}

/** El día con más (y su valor) de una serie por día. */
function pico(dias: string[], valores: number[]) {
  let i = 0;
  valores.forEach((v, j) => {
    if (v > valores[i]) i = j;
  });
  return { dia: dias[i] ?? "", valor: valores[i] ?? 0 };
}

/** Qué gráfica responde mejor a la pregunta (por palabras). */
export function graficaDe(pregunta: string): IdGrafica {
  const q = sinAcentos(pregunta);
  if (/\bhoras?\b|horario|a que hora|temprano|tarde|noche|manana\b/.test(q)) return "hora";
  if (/que dia|dias? de la semana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|fin de semana/.test(q)) return "semana";
  if (/cita|agend|reserva/.test(q)) return "citas";
  if (/respuest|contest|respond|atendi/.test(q)) return "respuestas";
  if (/correo|mail|bandeja|email/.test(q)) return "correos";
  return "clientes";
}

/** La respuesta sin IA: los mismos números, en una o dos frases. */
export function responderConReglas(pregunta: string, d: ResumenInfo): RespuestaGrafica {
  const grafica = graficaDe(pregunta);
  const en = FRASE_PERIODO[d.periodo];
  let texto = "";
  if (grafica === "clientes") {
    const c = d.clientes;
    if (c.valor === null || !d.serie) texto = "Todavía no hay de dónde contar a tus clientes: conecta tu correo o tu WhatsApp.";
    else {
      const p = pico(d.serie.dias, d.serie.actual);
      const partes = c.nuevos !== null && c.regresan !== null ? ` (${numero.format(c.nuevos)} nuevos y ${numero.format(c.regresan)} que regresan)` : "";
      texto = `Te escribieron ${plural(c.valor, ["cliente", "clientes"])} ${en}${partes}${textoCambio(c)}. El día con más fue el ${fecha(p.dia)}, con ${numero.format(p.valor)}.`;
    }
  } else if (grafica === "hora" || grafica === "semana") {
    const serie = grafica === "hora" ? d.porHora : d.porSemana;
    if (!serie || serie.every((v) => v === 0)) texto = "Todavía no hay mensajes ni correos para ver cuándo te escriben.";
    else {
      const max = serie.indexOf(Math.max(...serie));
      const conAlgo = serie.map((v, i) => [v, i] as const).filter(([v]) => v > 0);
      const min = conAlgo.reduce((a, b) => (b[0] < a[0] ? b : a))[1];
      texto =
        grafica === "hora"
          ? `Te escriben más entre las ${max}:00 y las ${max + 1}:00 (${plural(serie[max], ["mensaje", "mensajes"])} ${en}). La hora más tranquila con movimiento es de ${min}:00 a ${min + 1}:00.`
          : `El día con más movimiento es el ${DIAS_SEMANA[max]} (${plural(serie[max], ["mensaje", "mensajes"])} ${en}); el más tranquilo, el ${DIAS_SEMANA[min]}.`;
    }
  } else {
    const cifra = grafica === "citas" ? d.citas.agendadas : grafica === "respuestas" ? d.respuestas : d.correos;
    const s = d.series[grafica];
    const unidad = GRAFICAS[grafica].unidad;
    if (cifra.valor === null || !s) texto = `Todavía no hay datos de ${grafica === "citas" ? "citas" : grafica === "respuestas" ? "respuestas" : "correos"}.`;
    else {
      const p = pico(s.dias, s.actual);
      const verbo = grafica === "citas" ? "Se agendaron" : grafica === "respuestas" ? "Tu equipo dio" : "Tu equipo atendió";
      texto = `${verbo} ${plural(cifra.valor, unidad)} ${en}${textoCambio(cifra)}.${p.valor > 0 ? ` El día con más fue el ${fecha(p.dia)}, con ${numero.format(p.valor)}.` : ""}`;
    }
  }
  return { grafica, texto, fuente: "reglas" };
}

/** Los números del periodo, compactos, para dárselos a la IA. */
export function datosParaIA(d: ResumenInfo) {
  const cifra = (c: Cifra) => ({ ahora: c.valor, antes: c.antes });
  const porDia = (s: { dias: string[]; actual: number[]; antes: number[] } | null) => (s ? s.dias.map((dia, i) => ({ dia, ahora: s.actual[i], antes: s.antes[i] ?? null })) : null);
  return {
    negocio: d.negocio,
    periodo: FRASE_PERIODO[d.periodo],
    clientes: { ...cifra(d.clientes), nuevos: d.clientes.nuevos, regresan: d.clientes.regresan },
    citas_agendadas: d.canales.citas ? cifra(d.citas.agendadas) : null,
    respuestas_del_equipo: cifra(d.respuestas),
    correos_atendidos: cifra(d.correos),
    clientes_por_dia: porDia(d.serie),
    citas_por_dia: porDia(d.series.citas),
    respuestas_por_dia: porDia(d.series.respuestas),
    correos_por_dia: porDia(d.series.correos),
    mensajes_por_hora: d.porHora,
    mensajes_por_dia_de_la_semana: d.porSemana ? Object.fromEntries(d.porSemana.map((v, i) => [DIAS_SEMANA[i], v])) : null,
    de_que_escriben: d.temas.map((t) => ({ tema: t.texto, veces: t.total })),
  };
}
