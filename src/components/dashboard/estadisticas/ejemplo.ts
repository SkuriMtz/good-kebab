import type { IdAgente } from "@/lib/agentes";
import { DEMO_CORREOS, DEMO_NEGOCIO } from "@/lib/demo-dashboard";
import {
  calcularEstadisticas,
  diaLocal,
  diasEntre,
  horaLocal,
  inicioDia,
  rangos,
  resumenDe,
  type DatosEstadisticas,
  type FilaConversacion,
  type FilaMensaje,
  type FilaResumen,
  type Periodo,
  type ResumenEstadisticas,
} from "@/lib/estadisticas";
import { PLAN_POR_ID } from "@/lib/planes";

/* =====================================================================
   DATOS DE EJEMPLO para /pruebalo (el armazón ya pone el aviso "Datos de
   ejemplo"). No son de nadie: se generan con una semilla por día, así un
   mismo día da siempre lo mismo en 7 días, 30 días y este mes. Pasan por
   el mismo cálculo que los datos reales (calcularEstadisticas).
   Nombres neutros y correos con el dominio reservado .example.
   ===================================================================== */

/** Número pseudoaleatorio estable (mulberry32) a partir de un texto. */
function semilla(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  let t = h >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function elegir<T>(azar: () => number, opciones: readonly (readonly [T, number])[]): T {
  const total = opciones.reduce((t, [, p]) => t + p, 0);
  let r = azar() * total;
  for (const [valor, peso] of opciones) {
    r -= peso;
    if (r <= 0) return valor;
  }
  return opciones[opciones.length - 1][0];
}

const AGENTES: readonly (readonly [IdAgente, number])[] = [
  ["lola", 46],
  ["clara", 28],
  ["victor", 16],
  ["iris", 10],
];

/** Más movimiento a media mañana y a media tarde. */
const HORAS: readonly (readonly [number, number])[] = [
  [7, 2], [8, 5], [9, 9], [10, 12], [11, 12], [12, 10], [13, 7], [14, 5],
  [15, 7], [16, 9], [17, 9], [18, 7], [19, 5], [20, 4], [21, 2], [22, 1],
];

/**
 * Quién escribe y qué sugiere Clara: los mismos correos de la vista Correo de
 * /pruebalo (DEMO_CORREOS), así cada remitente y cada acción llevan a correos
 * que sí existen. Cada remitente manda su tipo de correo, con su acción
 * (si la tiene) la mayoría de las veces.
 */
const PESOS = [7, 9, 5, 3];
const CORREOS = DEMO_CORREOS.filter((c) => c.prioridad !== "sin-accion");
const REMITENTES: readonly (readonly [(typeof CORREOS)[number], number])[] = CORREOS.map((c, i) => [c, PESOS[i] ?? 2] as const);

/** Lo que pesa cada día de la semana (domingo = 0). */
const SEMANA = [0.3, 1, 1.05, 1, 1.1, 0.95, 0.6];

/**
 * Estadísticas de ejemplo para ese periodo, con `hoy` como el último día.
 * `usados` es el uso del plan del mes (por defecto, el del resto de /pruebalo).
 */
export function datosDeEjemplo(periodo: Periodo, ahora: Date = new Date(), usados = DEMO_NEGOCIO.mensajesUsados): DatosEstadisticas {
  const hoy = diaLocal(ahora);
  const horaAhora = horaLocal(ahora);
  const { actual, anterior } = rangos(periodo, hoy);
  // También el mes pasado desde el día 1 (el uso del plan se compara por mes), como en cargarEstadisticas
  const desde = [anterior.desde, rangos("mes", hoy).anterior.desde].sort()[0];
  const dias = diasEntre(desde, hoy);
  const plan = PLAN_POR_ID[DEMO_NEGOCIO.plan];

  const mensajes: FilaMensaje[] = [];
  const conversaciones: FilaConversacion[] = [];
  const resumenes: FilaResumen[] = [];

  dias.forEach((dia) => {
    const azar = semilla(`atendel-${dia}`);
    const inicio = inicioDia(dia).getTime();
    const semana = SEMANA[new Date(`${dia}T12:00:00Z`).getUTCDay()];
    // Olas lentas de más y menos movimiento, y poco a poco más uso hacia hoy
    const k = Date.parse(dia) / 86_400_000;
    const haceDias = (Date.parse(hoy) - Date.parse(dia)) / 86_400_000;
    const n = Math.round((14 + 2.5 * Math.sin(k / 9) + 1.2 * Math.sin(k / 3.7)) * (1 - haceDias * 0.005) * semana * (0.85 + azar() * 0.3));
    const hasta = dia === hoy ? horaAhora : 23;
    const cuando = () => {
      const h = elegir(azar, HORAS.filter(([x]) => x <= hasta));
      return new Date(inicio + h * 3_600_000 + Math.floor(azar() * 3_540_000)).toISOString();
    };
    if (hasta < 7) return;

    for (let c = 0; c < n; c++) {
      const id = `${dia}-${c}`;
      const agente = elegir(azar, AGENTES);
      conversaciones.push({ id, agente });
      const turnos = 1 + Math.floor(azar() * 4);
      const empieza = cuando();
      for (let t = 0; t < turnos; t++) {
        const fecha = new Date(Date.parse(empieza) + t * 120_000).toISOString();
        mensajes.push({ creado_en: fecha, rol: "user", conversacion_id: id });
        mensajes.push({ creado_en: new Date(Date.parse(fecha) + 20_000).toISOString(), rol: "assistant", conversacion_id: id, agente });
      }
    }

    const correos = Math.round((semana < 0.5 ? 1 : 5) * (0.6 + azar() * 0.9));
    for (let k = 0; k < correos; k++) {
      const c = elegir(azar, REMITENTES);
      resumenes.push({ remitente: c.remitente, accion_sugerida: c.accion && azar() < 0.8 ? c.accion : "ninguna", creado_en: cuando() });
    }
  });

  return calcularEstadisticas({
    periodo,
    hoy,
    mensajes,
    conversaciones,
    resumenes,
    plan: { id: plan.id, nombre: plan.nombre, limite: plan.mensajesMes },
    usados,
    activos: plan.agentes,
  });
}

/**
 * Los números de 7 días del ejemplo, en corto (por métrica y por agente), para
 * el Inicio y Agentes de /pruebalo: salen de los mismos datos que la vista,
 * así cuadran con Estadísticas a 7 días. Forma estable: ResumenEstadisticas.
 */
export function resumenSemanaEjemplo(ahora: Date = new Date()): ResumenEstadisticas {
  return resumenDe(datosDeEjemplo("7d", ahora));
}
