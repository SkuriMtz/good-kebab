import type {
  Aviso,
  Cita,
  ConversacionReciente,
  Destacado,
  DiaActividad,
  Metrica,
  Pendiente,
} from "@/components/dashboard/tipos";
import type { IdAgente } from "@/lib/agentes";

/**
 * DATOS DE EJEMPLO del dashboard de /pruebalo.
 *
 * Una clínica estética inventada ("Clínica Luna") para que se vea cómo
 * trabaja el equipo en un día normal. Nada de esto es un cliente real ni
 * una cifra de Atendel: todo se marca en pantalla como "Datos de ejemplo".
 * Los nombres, horas y montos son los mismos que usa el chat de
 * demostración (ChatDemo), para que el dashboard y el chat cuenten la
 * misma historia.
 */

export const NEGOCIO_DEMO = {
  nombre: "Clínica Luna",
  giro: "Estética y dermatología",
  plan: "max" as const,
};

export const USUARIA_DEMO = {
  nombre: "Ana López",
  primerNombre: "Ana",
  correo: "ana@ejemplo.mx",
};

/** Mensajes del mes con el equipo (plan Max: 3,000 al mes). */
export const USO_DEMO = 1284;

/** Qué hace cada agente en este momento (en el lateral y en los fijados). */
export const ESTADO_AGENTES_DEMO: Record<IdAgente, { tono: "exito" | "azul" | "atencion" | "neutro"; etiqueta: string; pulso?: boolean; hoy: string }> = {
  lola: { tono: "azul", etiqueta: "Contestando un WhatsApp", pulso: true, hoy: "12 recordatorios hoy" },
  clara: { tono: "exito", etiqueta: "Bandeja al día", hoy: "23 correos resumidos" },
  victor: { tono: "atencion", etiqueta: "Espera tu visto bueno", hoy: "12 seguimientos" },
  iris: { tono: "neutro", etiqueta: "Sin pendientes", hoy: "1 reporte listo" },
};

export const ACTIVIDAD_DEMO: DiaActividad[] = [
  {
    dia: "Hoy",
    eventos: [
      {
        id: "a2",
        agente: "lola",
        para: "victor",
        tipo: "relevo",
        texto: "le pasó a Víctor el seguimiento de Sofía Ramírez",
        hora: "10:03",
        detalle: { tipo: "texto", texto: "Víctor le escribe el sábado para ver cómo le fue y pedirle su reseña en Google." },
      },
      {
        id: "a1",
        agente: "lola",
        tipo: "cita",
        texto: "agendó a Sofía Ramírez para su primera limpieza facial",
        hora: "10:02",
        insignia: { tono: "exito", texto: "Cita confirmada" },
        detalle: { tipo: "cita", quien: "Sofía Ramírez", servicio: "Limpieza facial · primera vez", cuando: "Viernes 10:00" },
      },
      {
        id: "a3",
        agente: "lola",
        tipo: "recordatorio",
        texto: "mandó recordatorio a las 12 citas de mañana",
        hora: "09:31",
        insignia: { tono: "atencion", texto: "1 sin respuesta" },
        detalle: {
          tipo: "lista",
          renglones: [
            { marca: "10", tono: "exito", texto: "ya confirmaron su cita." },
            { marca: "Cambio", tono: "azul", texto: "Carla Díaz pasó de 16:00 a 17:00." },
            { marca: "Pendiente", tono: "atencion", texto: "Rosa Peña no ha contestado; Lola le vuelve a escribir a las 18:00." },
          ],
        },
      },
      {
        id: "a4",
        agente: "clara",
        tipo: "correo",
        texto: "detectó la factura de CFE: $2,180, vence el 15",
        hora: "08:52",
        insignia: { tono: "atencion", texto: "Por pagar" },
      },
      {
        id: "a5",
        agente: "clara",
        tipo: "correo",
        texto: "resumió los 23 correos que llegaron hoy",
        hora: "08:41",
        detalle: {
          tipo: "lista",
          titulo: "Lo importante",
          renglones: [
            { marca: "Urgente", tono: "error", texto: "Insumos Médicos del Bajío: factura de $8,450 que vence el jueves." },
            { marca: "Hoy", tono: "azul", texto: "Andrea Solís quiere pasar su cita del martes a la tarde." },
            { marca: "Semana", tono: "neutra", texto: "El Dr. Vela te recomienda a una paciente para valoración." },
          ],
        },
      },
      {
        id: "a6",
        agente: "iris",
        tipo: "archivo",
        texto: "preparó el reporte de septiembre en Excel",
        hora: "08:16",
        detalle: { tipo: "archivo", nombre: "Reporte de septiembre.xlsx", descripcion: "Una hoja de citas y otra de pagos" },
      },
    ],
  },
  {
    dia: "Ayer",
    eventos: [
      {
        id: "a7",
        agente: "iris",
        tipo: "reporte",
        texto: "cerró septiembre: 342 citas y 47 clientes nuevos",
        hora: "18:04",
        insignia: { tono: "exito", texto: "18 citas más que en agosto" },
      },
      {
        id: "a8",
        agente: "victor",
        tipo: "mensaje",
        texto: "escribió a 12 personas que preguntaron por botox y no agendaron",
        hora: "12:01",
        insignia: { tono: "exito", texto: "3 ya contestaron" },
      },
    ],
  },
];

export const PENDIENTES_DEMO: Pendiente[] = [
  {
    id: "p1",
    agente: "victor",
    titulo: "Mensaje para 31 clientes que no vienen desde junio",
    mensaje: "Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?",
    para: "31 clientes",
    canal: "WhatsApp",
    cuando: "Hace 12 min",
    nota: "Va con el nombre de cada quien. A quien no conteste le escribe una vez más en 5 días.",
  },
  {
    id: "p2",
    agente: "lola",
    titulo: "Segundo recordatorio para Rosa Peña",
    mensaje: "Hola, Rosa. ¿Nos confirmas tu cita de mañana a las 12:30 para depilación láser? Si te queda mejor otro horario, con gusto lo movemos.",
    para: "Rosa Peña",
    canal: "WhatsApp",
    cuando: "Hace 25 min",
    nota: "Sale a las 18:00 si lo apruebas.",
  },
];

export const DESTACADOS_DEMO: Destacado[] = [
  {
    id: "d1",
    agente: "clara",
    marca: "Urgente",
    tono: "error",
    texto: "La factura de Insumos Médicos del Bajío por $8,450 vence el jueves.",
    cuando: "08:41",
  },
  {
    id: "d2",
    agente: "clara",
    marca: "Hoy",
    tono: "azul",
    texto: "Andrea Solís quiere pasar su cita del martes a la tarde. Lola le ofreció 17:00 o 18:30.",
    cuando: "08:41",
  },
  {
    id: "d3",
    agente: "clara",
    marca: "Esta semana",
    tono: "neutra",
    texto: "El Dr. Vela te recomienda a una paciente para valoración.",
    cuando: "08:41",
  },
];

/** Las mismas conversaciones con las que abre el chat de demostración. */
export const CONVERSACIONES_DEMO: Omit<ConversacionReciente, "href" | "alElegir">[] = [
  {
    id: "recepcion",
    nombre: "Recepción",
    agentes: ["lola", "victor"],
    vistaPrevia: "Lola: Lo anoté en su ficha para que no le lleguen dos mensajes el mismo día.",
    cuando: "10:05",
  },
  {
    id: "lola",
    nombre: "Lola",
    agentes: ["lola"],
    vistaPrevia: "Hecho: Carla Díaz queda mañana a las 17:00. Ya le avisé.",
    cuando: "09:33",
  },
  {
    id: "clara",
    nombre: "Clara",
    agentes: ["clara"],
    vistaPrevia: "Llegó la factura de CFE: $2,180, vence el 15.",
    cuando: "08:52",
    sinLeer: 2,
  },
  {
    id: "cierre",
    nombre: "Cierre de mes",
    agentes: ["clara", "iris"],
    vistaPrevia: "Iris: Listo. Te dejé el reporte en Excel con una hoja de citas y otra de pagos.",
    cuando: "08:16",
    sinLeer: 1,
  },
  {
    id: "victor",
    nombre: "Víctor",
    agentes: ["victor"],
    vistaPrevia: "Enviado a las 12 personas. 3 ya contestaron y Lola les está apartando cita.",
    cuando: "Ayer",
  },
  {
    id: "iris",
    nombre: "Iris",
    agentes: ["iris"],
    vistaPrevia: "Revisé 4 clínicas cercanas. Depilación láser de axilas…",
    cuando: "Lunes",
  },
];

export const CITAS_DEMO: Cita[] = [
  { id: "c1", cuando: "Hoy", hora: "16:30", quien: "Mariana Ruiz", servicio: "Limpieza facial", tono: "exito", estado: "Confirmada" },
  { id: "c2", cuando: "Hoy", hora: "18:30", quien: "Andrea Solís", servicio: "Valoración", tono: "azul", estado: "Por confirmar el cambio" },
  { id: "c3", cuando: "Mañana", hora: "12:30", quien: "Rosa Peña", servicio: "Depilación láser", tono: "atencion", estado: "Sin respuesta" },
  { id: "c4", cuando: "Mañana", hora: "17:00", quien: "Carla Díaz", servicio: "Limpieza facial", tono: "exito", estado: "Confirmada" },
];

/** Septiembre contra agosto, del reporte de Iris (el mismo del chat). */
export const METRICAS_DEMO: Metrica[] = [
  { id: "m1", etiqueta: "Citas", valor: "342", cambio: "+18", tonoCambio: "exito", nota: "Agosto: 324" },
  { id: "m2", etiqueta: "Clientes nuevos", valor: "47", cambio: "+8", tonoCambio: "exito", nota: "Agosto: 39" },
  { id: "m3", etiqueta: "Faltas", valor: "21", cambio: "−5", tonoCambio: "exito", nota: "Agosto: 26" },
];

export const AVISOS_DEMO: Omit<Aviso, "href" | "alElegir">[] = [
  { id: "n1", agente: "victor", texto: "Tiene listo un mensaje para 31 clientes que espera tu visto bueno.", cuando: "Hace 12 min", nuevo: true },
  { id: "n2", agente: "lola", texto: "Rosa Peña no ha confirmado su cita de mañana a las 12:30.", cuando: "Hace 25 min", nuevo: true },
  { id: "n3", agente: "clara", texto: "Llegó la factura de CFE: $2,180, vence el 15.", cuando: "08:52", nuevo: true },
  { id: "n4", agente: "lola", texto: "Carla Díaz quedó mañana a las 17:00. Ya le avisó.", cuando: "09:33", nuevo: false },
  { id: "n5", agente: "iris", texto: "Tu reporte de septiembre está listo en Excel.", cuando: "08:16", nuevo: false },
];

/** Lo que el dashboard le sugiere probar (sale de las sugerencias reales de cada agente). */
export const CONSEJO_DEMO = {
  agente: "victor" as IdAgente,
  texto: "Escribe un mensaje para recuperar a clientes que no vienen hace 3 meses",
};

/** Facturas y pagos del mes que Clara encontró en el correo (las mismas del chat: /facturas). */
export const FACTURAS_DEMO: { id: string; concepto: string; cuando: string; monto: string; tipo: "pagar" | "recibido" }[] = [
  { id: "f1", concepto: "Insumos Médicos del Bajío", cuando: "Vence el jueves", monto: "$8,450", tipo: "pagar" },
  { id: "f2", concepto: "CFE", cuando: "Vence el 15", monto: "$2,180", tipo: "pagar" },
  { id: "f3", concepto: "Software de agenda", cuando: "Se cobra el 20", monto: "$599", tipo: "pagar" },
  { id: "f4", concepto: "Karla Vega", cuando: "Pago recibido", monto: "+$4,200", tipo: "recibido" },
];

export const POR_PAGAR_DEMO = "$11,229";
