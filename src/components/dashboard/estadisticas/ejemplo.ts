import type { IdAgente } from "@/lib/agentes";
import { DEMO_NEGOCIO } from "@/lib/demo-dashboard";
import {
  calcularEstadisticas,
  diaLocal,
  horaLocal,
  inicioDia,
  rangos,
  type DatosEstadisticas,
  type FilaConversacion,
  type FilaMensaje,
  type FilaResumen,
  type Periodo,
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

/** Los tres primeros son los mismos de Correo en /pruebalo: así el filtro por remitente encuentra sus correos. */
const REMITENTES: readonly (readonly [string, number])[] = [
  ["Andrea Solís <andrea.solis@correo.example>", 9],
  ["Insumos del Bajío <pedidos@insumos.example>", 7],
  ["Mario Vela <mario.vela@correo.example>", 6],
  ["Mariana Torres <mariana.torres@correo.example>", 5],
  ["Facturación <facturas@proveedor.example>", 4],
  ["Jorge Ramírez <jorge.ramirez@correo.example>", 3],
  ["Avisos del banco <avisos@banco.example>", 3],
  ["Boletín <hola@boletin.example>", 2],
];

const ACCIONES: readonly (readonly [string, number])[] = [
  ["Contestar hoy", 10],
  ["Confirmar la cita", 8],
  ["Pagar la factura antes del viernes", 6],
  ["Enviar la cotización", 5],
  ["Revisar el archivo adjunto", 4],
  ["Agradecer y dar seguimiento", 3],
  ["ninguna", 14],
];

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
  const dias = [...anterior.dias, ...actual.dias];
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
      resumenes.push({ remitente: elegir(azar, REMITENTES), accion_sugerida: elegir(azar, ACCIONES), creado_en: cuando() });
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
