import type { IdAgente } from "@/lib/agentes";
import { DEMO_CORREOS, DEMO_NEGOCIO } from "@/lib/demo-dashboard";
import { diaLocal, diasEntre, horaLocal, inicioDia, sumarDias, type Periodo } from "@/lib/estadisticas";
import { calcularNegocio, type DatosNegocio, type FilaCita, type FilaCorreo, type FilaWhatsapp } from "@/lib/estadisticas-negocio";

/* =====================================================================
   DATOS DE EJEMPLO de Estudio Luna para /pruebalo (la vista lleva la
   insignia "Datos de ejemplo"). No son de nadie: salen de una semilla por
   día y pasan por el mismo cálculo que los reales (calcularNegocio).
   - Se generan desde el día 1 de hace tres meses, así 7 días, 30 días y
     este mes cuentan lo mismo para un mismo día.
   - Los correos son de los mismos remitentes de la vista Correo
     (DEMO_CORREOS), con sus mismas acciones: picar uno lleva a algo que sí
     existe en /pruebalo.
   - Nombres neutros, sin tipo de negocio.
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

/** Las clientas de las citas de hoy en /pruebalo, que escriben seguido. */
const FRECUENTES = ["Daniela Torres", "Rosa Peña", "Mariana Ruiz", "Carla Díaz"] as const;

const NOMBRES = ["Sofía", "Valeria", "Jorge", "Paola", "Luis", "Fernanda", "Diego", "Ximena", "Gabriela", "Ricardo", "Lucía", "Andrés", "Renata", "Emilio", "Camila", "Héctor", "Regina", "Óscar"];
const APELLIDOS = ["Herrera", "Núñez", "Ramírez", "Medina", "Ortega", "Cruz", "Morales", "Rojas", "Castro", "Flores", "Vargas", "Aguilar", "Mendoza", "Salinas"];

/** El cliente número n (siempre el mismo nombre para el mismo n). */
const nombreNuevo = (n: number) => `${NOMBRES[n % NOMBRES.length]} ${APELLIDOS[Math.floor(n / NOMBRES.length) % APELLIDOS.length]}`;

/** Lo que preguntan por WhatsApp (lo atiende Lola). */
const TEMAS: readonly (readonly [string, number])[] = [
  ["Agendar una cita", 30],
  ["Cambiar o cancelar su cita", 16],
  ["Precios y paquetes", 14],
  ["Horarios", 10],
  ["Formas de pago", 6],
  ["Ubicación y estacionamiento", 5],
];

/** Qué tema lleva cada correo de DEMO_CORREOS y cada cuánto escribe (por semana). */
const CORREOS: readonly { remitente: string; tema: string; accion?: string; porSemana: number }[] = (() => {
  const de = (r: string) => DEMO_CORREOS.find((c) => c.remitente === r);
  return [
    { remitente: "Andrea Solís", tema: "Cambiar o cancelar su cita", accion: de("Andrea Solís")?.accion, porSemana: 2 },
    { remitente: "Insumos del Bajío", tema: "Facturas y pagos", accion: de("Insumos del Bajío")?.accion, porSemana: 1.5 },
    { remitente: "Mario Vela", tema: "Agendar una cita", accion: de("Mario Vela")?.accion, porSemana: 1 },
    { remitente: "CFE", tema: "Recibo de luz", porSemana: 0.25 },
  ];
})();

/** Más movimiento a media mañana y a media tarde. */
const HORAS: readonly (readonly [number, number])[] = [
  [8, 4], [9, 9], [10, 13], [11, 12], [12, 9], [13, 6], [14, 5],
  [15, 7], [16, 10], [17, 10], [18, 8], [19, 6], [20, 4], [21, 2], [22, 1],
];

/** Lo que pesa cada día de la semana (domingo = 0). */
const SEMANA = [0.3, 1, 1.05, 0.95, 1.1, 1, 0.65];

const AGENTE_CORREO: IdAgente = "clara";
const AGENTE_WHATSAPP: IdAgente = "lola";

/** Estadísticas de ejemplo para ese periodo, con hoy como el último día. */
export function datosNegocioEjemplo(periodo: Periodo, ahora: Date = new Date()): DatosNegocio {
  const hoy = diaLocal(ahora);
  const horaAhora = horaLocal(ahora);
  const [y, m] = hoy.split("-").map(Number);
  const inicio = `${m <= 3 ? y - 1 : y}-${String(((m + 8) % 12) + 1).padStart(2, "0")}-01`;

  const whatsapp: FilaWhatsapp[] = [];
  const correos: FilaCorreo[] = [];
  const citas: FilaCita[] = [];
  const vistos: string[] = [...FRECUENTES];
  let siguiente = 0;

  for (const dia of diasEntre(inicio, hoy)) {
    const azar = semilla(`luna-${dia}`);
    const base = inicioDia(dia).getTime();
    const peso = SEMANA[new Date(`${dia}T12:00:00Z`).getUTCDay()];
    const k = Date.parse(dia) / 86_400_000;
    const hasta = dia === hoy ? horaAhora : 23;
    const horas = HORAS.filter(([h]) => h <= hasta);
    if (!horas.length) continue;
    const cuando = (extraMin = 0) => {
      const h = elegir(azar, horas);
      return new Date(base + h * 3_600_000 + Math.floor(azar() * 3_000_000) + extraMin * 60_000).toISOString();
    };

    // WhatsApp: unas 9 conversaciones entre semana, con olas lentas de más y menos
    const n = Math.round((8.5 + 1.8 * Math.sin(k / 6.5) + 0.9 * Math.sin(k / 2.3)) * peso * (0.85 + azar() * 0.3));
    for (let c = 0; c < n; c++) {
      let cliente: string;
      const r = azar();
      if (r < 0.2 || vistos.length < 8) {
        cliente = nombreNuevo(siguiente++);
        vistos.push(cliente);
      } else if (r < 0.42) cliente = FRECUENTES[Math.floor(azar() * FRECUENTES.length)];
      else cliente = vistos[Math.floor(azar() ** 1.6 * vistos.length)];
      const conversacion = `${dia}-${c}`;
      const tema = elegir(azar, TEMAS);
      const empieza = Date.parse(cuando());
      const turnos = 1 + Math.floor(azar() * 3);
      for (let t = 0; t < turnos; t++) {
        const fecha = empieza + t * 180_000;
        whatsapp.push({ conversacion, cliente, creado_en: new Date(fecha).toISOString(), de: "cliente", agente: AGENTE_WHATSAPP, tema: t === 0 ? tema : undefined });
        whatsapp.push({ conversacion, cliente, creado_en: new Date(fecha + 25_000).toISOString(), de: "equipo", agente: AGENTE_WHATSAPP });
      }
    }

    // Citas que se agendaron hoy (para los próximos días)
    const nuevasCitas = Math.round(6 * peso * (0.75 + azar() * 0.5));
    for (let c = 0; c < nuevasCitas; c++) {
      const cliente = vistos[Math.floor(azar() * vistos.length)];
      let dia2 = sumarDias(dia, 1 + Math.floor(azar() * 9));
      if (new Date(`${dia2}T12:00:00Z`).getUTCDay() === 0) dia2 = sumarDias(dia2, 1);
      const r = azar();
      citas.push({ cliente, dia: dia2, creado_en: cuando(), estado: r < 0.08 ? "cancelada" : r < 0.19 ? "reagendada" : "agendada" });
    }

    // Correos de los remitentes de la vista Correo
    for (const c of CORREOS) {
      const veces = (c.porSemana / 5) * (peso > 0.5 ? 1 : 0.3);
      if (azar() < veces) {
        correos.push({ remitente: c.remitente, accion_sugerida: c.accion && azar() < 0.85 ? c.accion : "ninguna", creado_en: cuando(), tema: c.tema });
      }
    }
  }

  return calcularNegocio({
    negocio: DEMO_NEGOCIO.nombre,
    periodo,
    hoy,
    correos,
    mensajes: [],
    conversaciones: [],
    whatsapp,
    citas,
  });
}
