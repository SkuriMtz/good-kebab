import type { ElementoMenu } from "@/components/base/Menu";
import type { TonoEstado } from "@/components/base/PuntoEstado";
import { diaSemana, periodo, rellenar, serie, sumarDias } from "@/components/dashboard/actividad";
import { NOVEDADES } from "@/components/dashboard/novedades";
import type { Accion, Cita, DatosResumen, DiaActividad } from "@/components/dashboard/tipos";
import type { IdAgente } from "./agentes";

/*
 * DATOS DE EJEMPLO del dashboard de /pruebalo. Son de una clínica de
 * dermatología y estética inventada para la demostración y se marcan en
 * pantalla como "Datos de ejemplo". No son clientes ni cifras reales.
 * Van de la mano con el guion del chat de demostración (ChatDemo): Sofía
 * Ramírez y su limpieza facial, Carla Díaz que pasó a las 17:00, el reporte
 * de septiembre de Iris, el seguimiento de botox de Víctor…
 * La demostración vive en un día fijo (jueves 8 de octubre de 2026) para
 * que todo cuadre con ese guion.
 */

export type VistaDemo = "resumen" | "conversaciones" | "agentes" | "citas" | "correo";

/** El "hoy" de la demostración. */
export const HOY_DEMO = "2026-10-08";
/** 26 semanas: desde el lunes de hace 25 semanas hasta hoy. */
const INICIO = sumarDias(sumarDias(HOY_DEMO, -diaSemana(HOY_DEMO)), -25 * 7);

export const USUARIO_DEMO = {
  nombre: "Daniela Ortiz",
  corto: "Daniela",
  correo: "daniela@clinica-ejemplo.mx",
  estado: { tono: "exito" as TonoEstado, etiqueta: "Disponible" },
};

export const NEGOCIO_DEMO = {
  nombre: "Clínica Alma",
  giro: "Dermatología y estética · Zapopan, Jal.",
};

/* ---------- Actividad de 26 semanas (siempre la misma: generador con semilla) ---------- */

function azar(semilla: number) {
  let t = semilla >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const ENTRA_VICTOR = "2026-07-13"; // la clínica sumó a Víctor a mediados de julio
const ENTRA_IRIS = "2026-09-01"; // y a Iris en septiembre (Atendel Max)
const CERRADO = new Set(["2026-09-16"]); // 16 de septiembre: la clínica no abre

/** Lo de hoy, tal como lo cuentan el resumen y el chat de ejemplo. */
const HOY: Partial<Record<IdAgente, number>> = { lola: 21, clara: 23, victor: 12, iris: 1 };

function generar(): DiaActividad[] {
  const cuentas = new Map<string, Partial<Record<IdAgente, number>>>();
  let i = 0;
  for (let f = INICIO; f <= HOY_DEMO; f = sumarDias(f, 1), i++) {
    if (f === HOY_DEMO) {
      cuentas.set(f, HOY);
      continue;
    }
    const r = azar(i * 7919 + 17);
    const dia = diaSemana(f);
    const habil = dia < 5;
    const sabado = dia === 5;
    const dom = Number(f.slice(8));
    // El equipo fue tomando ritmo: al principio, menos trabajo
    const ritmo = 0.62 + 0.38 * Math.min(1, i / 120);
    const p: Partial<Record<IdAgente, number>> = {};
    if (CERRADO.has(f)) {
      p.lola = 2 + Math.round(r() * 2); // solo contesta WhatsApp
    } else {
      p.lola = Math.round(ritmo * (habil ? 18 + r() * 16 : sabado ? 11 + r() * 8 : 3 + r() * 5));
      p.clara = Math.round(ritmo * (habil ? 13 + r() * 12 : sabado ? 3 + r() * 4 : r() * 3));
      if (f >= ENTRA_VICTOR) p.victor = habil ? (dia === 1 || dia === 3 ? 8 + Math.round(r() * 6) : Math.round(r() * 3)) : 0;
      if (f >= ENTRA_IRIS) p.iris = habil ? (dom >= 29 || dom <= 2 ? 3 + Math.round(r() * 2) : r() < 0.55 ? 0 : 1) : 0;
    }
    cuentas.set(f, p);
  }
  return rellenar(INICIO, HOY_DEMO, cuentas);
}

export const ACTIVIDAD_DEMO = generar();

/* ---------- Citas de hoy y mañana ---------- */

export const CITAS_DEMO: Cita[] = [
  { id: "c1", dia: "Hoy", hora: "16:30", cliente: "Valeria Montes", servicio: "Depilación láser · axilas", agente: "lola", estado: { tono: "exito", texto: "Confirmada" } },
  { id: "c2", dia: "Hoy", hora: "17:15", cliente: "Jimena Castro", servicio: "Peeling químico", agente: "lola", estado: { tono: "exito", texto: "Confirmada" } },
  { id: "c3", dia: "Hoy", hora: "18:00", cliente: "Luis Herrera", servicio: "Consulta de valoración", estado: { tono: "atencion", texto: "Por confirmar" } },
  { id: "c4", dia: "Mañana", hora: "10:00", cliente: "Sofía Ramírez", servicio: "Limpieza facial · primera vez", agente: "lola", estado: { tono: "exito", texto: "Confirmada" } },
  { id: "c5", dia: "Mañana", hora: "12:00", cliente: "Paola Méndez", servicio: "Botox", agente: "lola", estado: { tono: "exito", texto: "Confirmada" } },
  { id: "c6", dia: "Mañana", hora: "16:00", cliente: "Rosa Peña", servicio: "Hidratación facial", estado: { tono: "atencion", texto: "Sin respuesta" } },
  { id: "c7", dia: "Mañana", hora: "17:00", cliente: "Carla Díaz", servicio: "Limpieza facial", agente: "lola", estado: { tono: "azul", texto: "Cambió de horario" } },
];

/** Mañana hay 12 citas (Lola ya mandó los recordatorios); en la lista van las que piden algo. */
export const CITAS_MANANA_TOTAL = 12;

/** Agenda completa de hoy (para la vista Citas): las de la mañana ya pasaron. */
export const AGENDA_HOY_DEMO: Cita[] = [
  { id: "a1", dia: "Hoy", hora: "09:00", cliente: "Mónica Aguilar", servicio: "Depilación láser · piernas", agente: "lola", estado: { tono: "neutra", texto: "Atendida" } },
  { id: "a2", dia: "Hoy", hora: "10:00", cliente: "Regina Salas", servicio: "Consulta de valoración", estado: { tono: "neutra", texto: "Atendida" } },
  { id: "a3", dia: "Hoy", hora: "11:30", cliente: "Fernanda Ruiz", servicio: "Limpieza facial", agente: "lola", estado: { tono: "error", texto: "No vino" } },
  ...CITAS_DEMO.filter((c) => c.dia === "Hoy"),
];

/* ---------- Correos que Clara resumió hoy ---------- */

export type CorreoDemo = {
  id: string;
  hora: string;
  remitente: string;
  asunto: string;
  resumen: string;
  sugerencia?: string;
  urgencia: { tono: "error" | "atencion" | "neutra"; texto: string };
};

export const CORREOS_DEMO: CorreoDemo[] = [
  {
    id: "m1",
    hora: "08:41",
    remitente: "Insumos Médicos del Bajío",
    asunto: "Factura F-2291",
    resumen: "Mandan la factura de los insumos de septiembre por $8,450.",
    sugerencia: "Pagarla esta semana para no perder el descuento por pronto pago.",
    urgencia: { tono: "error", texto: "Urgente" },
  },
  {
    id: "m2",
    hora: "08:37",
    remitente: "Andrea Solís",
    asunto: "Cambio de cita",
    resumen: "Quiere pasar su cita del martes a la tarde.",
    sugerencia: "Ofrecerle martes 17:00 o 18:30 (ya está la respuesta lista).",
    urgencia: { tono: "atencion", texto: "Hoy" },
  },
  {
    id: "m3",
    hora: "08:30",
    remitente: "Dr. Arturo Vela",
    asunto: "Te recomiendo a una paciente",
    resumen: "Recomienda a una paciente para valoración de manchas en la piel.",
    sugerencia: "Que Lola le escriba para agendar la valoración.",
    urgencia: { tono: "neutra", texto: "Esta semana" },
  },
  {
    id: "m4",
    hora: "08:52",
    remitente: "CFE",
    asunto: "Tu recibo de luz",
    resumen: "Recibo de $2,180 que vence el 15.",
    urgencia: { tono: "neutra", texto: "Esta semana" },
  },
];

/* ---------- Grupos y estado de los agentes (lateral) ---------- */

export const GRUPOS_DEMO: { id: string; nombre: string; agentes: IdAgente[]; sinLeer?: number }[] = [
  { id: "recepcion", nombre: "Recepción", agentes: ["lola", "victor"] },
  { id: "cierre", nombre: "Cierre de mes", agentes: ["clara", "iris"], sinLeer: 1 },
];

export const ESTADO_AGENTES_DEMO: Record<IdAgente, { tono: TonoEstado; texto: string; pulso?: boolean }> = {
  lola: { tono: "azul", texto: "Contestando un WhatsApp", pulso: true },
  clara: { tono: "exito", texto: "Activa" },
  victor: { tono: "atencion", texto: "Espera tu visto bueno" },
  iris: { tono: "exito", texto: "Activa" },
};

/** Lo que cada agente hizo en el mes, para su tarjeta (vista Agentes). */
export const LOGROS_DEMO: Record<IdAgente, string[]> = {
  lola: ["12 recordatorios para las citas de mañana", "Pasó a Carla Díaz de 16:00 a 17:00", "Agendó a Sofía Ramírez, su primera vez"],
  clara: ["23 correos resumidos hoy, 1 urgente", "2 facturas por pagar: $10,630", "Respuesta lista para Andrea Solís"],
  victor: ["Seguimiento a 12 personas que preguntaron por botox", "3 ya contestaron y tienen cita", "Mensaje listo para 31 clientes inactivos"],
  iris: ["Reporte de septiembre en Excel", "Comparó precios de 4 clínicas cercanas", "Hoja de citas y de pagos del mes"],
};

/* ---------- Avisos (campana) ---------- */

export function avisosDemo(ir: (v: VistaDemo) => void, verPendientes: () => void): ElementoMenu[] {
  return [
    { tipo: "titulo", etiqueta: "Avisos" },
    { id: "av-victor", etiqueta: "Víctor espera tu visto bueno", descripcion: "Mensaje para 31 clientes · 12:40", icono: "usuarios", alElegir: verPendientes },
    { id: "av-clara", etiqueta: "Clara marcó una factura urgente", descripcion: "Insumos Médicos del Bajío, $8,450 · 08:41", icono: "correo", alElegir: () => ir("correo") },
    { id: "av-iris", etiqueta: "Iris terminó el reporte de septiembre", descripcion: "Excel con citas y pagos · 08:16", icono: "documento", alElegir: () => ir("conversaciones") },
  ];
}

/* ---------- El resumen completo ---------- */

const ir = (etiqueta: string, alElegir: () => void, icono?: Accion["icono"]): Accion => ({ etiqueta, alElegir, icono });

export function datosDemo(acciones: { ir: (v: VistaDemo) => void; verPendientes: () => void }): DatosResumen {
  const dias = ACTIVIDAD_DEMO;
  const a = acciones.ir;
  const p30 = (id: IdAgente) => periodo(dias, id, 30);

  return {
    ejemplo: true,
    bienvenida: {
      fecha: "Jueves 8 de octubre",
      nombre: USUARIO_DEMO.corto,
      resumen:
        "Desde la mañana, Lola contestó 21 mensajes y agendó 3 citas, y Clara resumió 23 correos. Víctor y Clara tienen 2 mensajes que esperan tu visto bueno.",
      hoy: [
        { valor: "3", etiqueta: "citas más hoy" },
        { valor: "21", etiqueta: "mensajes contestados" },
        { valor: "2", etiqueta: "esperan tu visto bueno" },
      ],
      acciones: [
        ir("Nueva conversación", () => a("conversaciones"), "mensaje"),
        ir("Revisar pendientes", acciones.verPendientes, "check-circulo"),
      ],
    },
    actividad: {
      dias,
      unidad: { una: "tarea", varias: "tareas" },
      explicacion: "Cada cuadro es un día: mensajes contestados, citas agendadas, correos resumidos, seguimientos y reportes.",
      agentes: ["lola", "clara", "victor", "iris"],
    },
    fijados: [
      {
        id: "lola",
        estado: ESTADO_AGENTES_DEMO.lola,
        descripcion: "Contesta el WhatsApp de la clínica y lleva la agenda.",
        cifra: { valor: p30("lola").actual, etiqueta: "tareas en 30 días" },
        secundaria: "12 recordatorios hoy · 10 ya confirmaron",
        serie: serie(dias, "lola", 30),
        accion: ir("Ver a Lola", () => a("agentes")),
      },
      {
        id: "clara",
        estado: ESTADO_AGENTES_DEMO.clara,
        descripcion: "Lee tu correo, te dice lo urgente y detecta facturas.",
        cifra: { valor: p30("clara").actual, etiqueta: "correos en 30 días" },
        secundaria: "23 correos hoy · 1 urgente",
        serie: serie(dias, "clara", 30),
        accion: ir("Ver a Clara", () => a("correo")),
      },
      {
        id: "victor",
        estado: ESTADO_AGENTES_DEMO.victor,
        descripcion: "Trae de regreso a quien no ha vuelto y pide reseñas.",
        cifra: { valor: p30("victor").actual, etiqueta: "clientes contactados" },
        secundaria: "3 de 12 contestaron al seguimiento",
        serie: serie(dias, "victor", 30),
        accion: ir("Ver a Víctor", () => a("agentes")),
      },
      {
        id: "iris",
        estado: ESTADO_AGENTES_DEMO.iris,
        descripcion: "Arma tus reportes y documentos de la oficina.",
        cifra: { valor: p30("iris").actual, etiqueta: "reportes y documentos" },
        secundaria: "Reporte de septiembre listo",
        serie: serie(dias, "iris", 30),
        accion: ir("Ver a Iris", () => a("agentes")),
      },
    ],
    eventos: [
      {
        dia: "Hoy",
        eventos: [
          {
            id: "e1",
            agente: "victor",
            texto: "preparó un mensaje para 31 clientes que no vienen desde junio",
            detalle: "Se envía por WhatsApp, cada uno con su nombre, cuando lo apruebes.",
            hora: "12:40",
            insignia: { tono: "atencion", texto: "Espera tu visto bueno" },
            accion: ir("Revisar", acciones.verPendientes),
          },
          {
            id: "e2",
            agente: "lola",
            texto: "agendó a Paola Méndez",
            detalle: "Botox · mañana 12:00. Contestó al seguimiento de Víctor.",
            hora: "12:20",
            insignia: { tono: "exito", texto: "Cita confirmada" },
          },
          {
            id: "e3",
            agente: "lola",
            texto: "agendó a Valeria Montes",
            detalle: "Depilación láser · hoy 16:30",
            hora: "11:05",
            insignia: { tono: "exito", texto: "Cita confirmada" },
          },
          {
            id: "e3b",
            agente: "lola",
            texto: "agendó a Sofía Ramírez",
            detalle: "Limpieza facial · mañana 10:00. Es su primera vez: le pidió llegar 10 minutos antes.",
            hora: "10:02",
            insignia: { tono: "exito", texto: "Cita confirmada" },
          },
          {
            id: "e4",
            agente: "lola",
            texto: "le pasó a Víctor la conversación con Sofía Ramírez",
            detalle: "Para escribirle después de su limpieza facial y pedirle su reseña.",
            hora: "10:03",
            relevo: "victor",
          },
          {
            id: "e5",
            agente: "lola",
            texto: "mandó recordatorio a las 12 citas de mañana",
            detalle: "10 ya confirmaron. Rosa Peña no ha contestado; le vuelve a escribir a las 18:00.",
            hora: "09:31",
          },
          {
            id: "e6",
            agente: "clara",
            texto: "resumió 23 correos",
            detalle: "1 urgente: la factura de Insumos Médicos del Bajío por $8,450.",
            hora: "08:41",
            insignia: { tono: "error", texto: "1 urgente" },
            accion: ir("Ver correos", () => a("correo")),
          },
          {
            id: "e7",
            agente: "iris",
            texto: "terminó el reporte de septiembre",
            detalle: "Una hoja de citas y otra de pagos.",
            hora: "08:16",
            archivo: "Reporte septiembre.xlsx",
          },
        ],
      },
      {
        dia: "Ayer",
        eventos: [
          {
            id: "e8",
            agente: "clara",
            texto: "encontró 2 facturas por pagar",
            detalle: "$10,630 en total. La más próxima vence esta semana.",
            hora: "18:04",
          },
          {
            id: "e9",
            agente: "victor",
            texto: "le escribió a 12 personas que preguntaron por botox",
            detalle: "3 ya contestaron y Lola les está apartando cita.",
            hora: "12:01",
            insignia: { tono: "exito", texto: "3 respuestas" },
          },
        ],
      },
    ],
    eventosVacio: { titulo: "Sin actividad", texto: "Aquí aparece lo que hace tu equipo." },
    pendientesEtiqueta: "Espera tu visto bueno",
    pendientes: [
      {
        id: "p1",
        agente: "victor",
        titulo: "Mensaje para 31 clientes que no vienen desde junio",
        cita: "Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?",
        detalle: "Por WhatsApp, cada uno con su nombre. A quien no conteste, Víctor le escribe una vez más en 5 días.",
        revisar: ir("Ver en el chat", () => a("conversaciones")),
        aprobable: true,
      },
      {
        id: "p2",
        agente: "clara",
        titulo: "Respuesta para Andrea Solís",
        cita: "Hola, Andrea. Claro que sí: el martes tengo libre a las 17:00 o a las 18:30. ¿Cuál te acomoda?",
        detalle: "Contesta a su correo «Cambio de cita». Lola aparta el horario que elija.",
        revisar: ir("Ver el correo", () => a("correo")),
        aprobable: true,
      },
    ],
    pendientesVacio: { titulo: "Nada espera tu visto bueno", texto: "Cuando un agente prepare un mensaje importante, te lo deja aquí antes de enviarlo." },
    destacados: [
      { id: "d1", agente: "iris", cifra: "342", texto: "citas en septiembre", detalle: "18 más que en agosto" },
      { id: "d2", agente: "iris", cifra: "47", texto: "clientes nuevos en septiembre", detalle: "8 más que en agosto" },
      { id: "d3", agente: "lola", cifra: "21", texto: "faltas en septiembre", detalle: "Eran 26 en agosto: Lola recuerda cada cita un día antes" },
      { id: "d4", agente: "iris", cifra: "96", texto: "citas de depilación láser", detalle: "Lo más agendado del mes" },
    ],
    destacadosVacio: { titulo: "Sin destacados", texto: "Aquí aparecen los números que vale la pena ver." },
    conversaciones: [
      { id: "recepcion", titulo: "Recepción", agentes: ["lola", "victor"], vista: "Lola: Lo anoté en su ficha para que no le lleguen dos mensajes el mismo día.", hora: "10:05", accion: ir("Abrir", () => a("conversaciones")) },
      { id: "lola", titulo: "Lola", agentes: ["lola"], vista: "Hecho: Carla Díaz queda mañana a las 17:00. Ya le avisé.", hora: "09:33", accion: ir("Abrir", () => a("conversaciones")) },
      { id: "clara", titulo: "Clara", agentes: ["clara"], vista: "Llegó la factura de CFE: $2,180, vence el 15.", hora: "08:52", sinLeer: 2, accion: ir("Abrir", () => a("conversaciones")) },
      { id: "cierre", titulo: "Cierre de mes", agentes: ["clara", "iris"], vista: "Iris: Listo. Te dejé el reporte en Excel con una hoja de citas y otra de pagos.", hora: "08:16", sinLeer: 1, accion: ir("Abrir", () => a("conversaciones")) },
      { id: "victor", titulo: "Víctor", agentes: ["victor"], vista: "Enviado a las 12 personas. 3 ya contestaron y Lola les está apartando cita.", hora: "Ayer", accion: ir("Abrir", () => a("conversaciones")) },
    ],
    conversacionesVacio: { titulo: "Sin conversaciones", texto: "Escríbele a un agente para empezar." },
    todasConversaciones: ir("Ver todas", () => a("conversaciones")),
    negocio: {
      nombre: NEGOCIO_DEMO.nombre,
      giro: NEGOCIO_DEMO.giro,
      correo: USUARIO_DEMO.correo,
      plan: "Atendel Max",
      uso: { etiqueta: "Mensajes de octubre", valor: 640, max: 3000, detalle: "Se renueva el 1 de noviembre." },
    },
    citas: CITAS_DEMO.slice(0, 5),
    citasVacio: { titulo: "Sin citas", texto: "No hay citas próximas." },
    metricas: [
      { id: "m-lola", agente: "lola", etiqueta: "Tareas de Lola", valor: p30("lola").actual, anterior: p30("lola").anterior, serie: serie(dias, "lola", 30), periodo: "30 días" },
      { id: "m-clara", agente: "clara", etiqueta: "Correos resumidos", valor: p30("clara").actual, anterior: p30("clara").anterior, serie: serie(dias, "clara", 30), periodo: "30 días" },
      { id: "m-victor", agente: "victor", etiqueta: "Clientes contactados", valor: p30("victor").actual, anterior: p30("victor").anterior, serie: serie(dias, "victor", 30), periodo: "30 días" },
    ],
    recomendaciones: [
      { id: "r1", agente: "victor", texto: "31 clientes no vienen desde junio. Víctor ya tiene listo el mensaje para invitarlos de vuelta.", accion: ir("Revisar el mensaje", acciones.verPendientes) },
      { id: "r2", agente: "lola", texto: "Rosa Peña no ha confirmado su cita de mañana a las 16:00.", accion: ir("Ver citas", () => a("citas")) },
    ],
    novedades: NOVEDADES,
  };
}
