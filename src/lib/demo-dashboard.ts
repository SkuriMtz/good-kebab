import type {
  AgenteFijado,
  AgenteLateral,
  Aviso,
  Cita,
  ConversacionReciente,
  Destacado,
  DiaSemana,
  ElementoNav,
  Estadistica,
  Evento,
  GrupoLateral,
  IdSeccion,
  ItemParaTi,
  Pendiente,
  ResultadoBusqueda,
  ResumenCorreo,
  Usuario,
} from "@/components/dashboard/tipos";
import type { Momento } from "@/components/dashboard/momento";
import { AGENTES_INFO } from "./agentes";
import { PLAN_POR_ID } from "./planes";

/**
 * DATOS DE EJEMPLO del dashboard de /pruebalo: una clínica de estética y
 * dermatología ficticia en Querétaro. Son los mismos personajes del chat de
 * ejemplo (ChatDemo): Sofía Ramírez, Carla Díaz, Rosa Peña, Andrea Solís,
 * Insumos Médicos del Bajío, el Dr. Vela… para que todo cuente la misma
 * historia. Nada de esto es un cliente real ni una cifra real de Atendel; la
 * página lo dice con la insignia "Datos de ejemplo".
 */

/** Vistas que existen en el demo (las demás secciones llevan "Pronto"). */
const VISTAS_DEMO: IdSeccion[] = ["resumen", "conversaciones", "agentes", "correo"];
export const esVistaDemo = (v: unknown): v is IdSeccion => typeof v === "string" && (VISTAS_DEMO as string[]).includes(v);

export const NEGOCIO_DEMO = {
  nombre: "Clínica Alba",
  giro: "Estética y dermatología · Querétaro",
};

export const USUARIO_DEMO: Usuario = {
  nombre: "Daniela Ortega",
  correo: "daniela@clinicaalba.mx",
  estado: { tono: "exito", etiqueta: "Disponible" },
};

/** El demo enseña el plan completo (los cuatro agentes). Sus límites son los reales de planes.ts. */
export const PLAN_DEMO = PLAN_POR_ID.max;
export const USO_DEMO = 1284;

export const NAV_DEMO: ElementoNav[] = [
  { id: "resumen", etiqueta: "Resumen", icono: "inicio", destino: { vista: "resumen" } },
  {
    id: "conversaciones",
    etiqueta: "Conversaciones",
    icono: "conversaciones",
    destino: { vista: "conversaciones" },
    contador: 3,
    etiquetaContador: "3 mensajes sin leer",
  },
  { id: "agentes", etiqueta: "Agentes", icono: "agentes", destino: { vista: "agentes" } },
  { id: "citas", etiqueta: "Citas", icono: "calendario", pronto: true },
  { id: "correo", etiqueta: "Correo", icono: "correo", destino: { vista: "correo" } },
  { id: "clientes", etiqueta: "Clientes", icono: "clientes", pronto: true },
  { id: "reportes", etiqueta: "Reportes", icono: "grafica", pronto: true },
  { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
];

export const AGENTES_LATERAL_DEMO: AgenteLateral[] = [
  { id: "lola", estado: "Contestando un WhatsApp", tono: "azul", pulso: true, destino: { vista: "conversaciones", con: "lola" } },
  { id: "clara", estado: "Activa", tono: "exito", destino: { vista: "conversaciones", con: "clara" } },
  { id: "victor", estado: "Espera tu visto bueno", tono: "atencion", destino: { vista: "resumen", pestana: "pendientes" } },
  { id: "iris", estado: "Sin pendientes", tono: "neutro", destino: { vista: "conversaciones", con: "iris" } },
];

export const GRUPOS_DEMO: GrupoLateral[] = [
  { id: "recepcion", nombre: "Recepción", agentes: ["lola", "victor"], destino: { vista: "conversaciones", con: "recepcion" } },
  { id: "cierre", nombre: "Cierre de mes", agentes: ["clara", "iris"], sinLeer: 1, destino: { vista: "conversaciones", con: "cierre" } },
];

export const AVISOS_DEMO: Aviso[] = [
  {
    id: "a1",
    agente: "victor",
    titulo: "Un mensaje para 31 clientes espera tu visto bueno",
    detalle: "Son pacientes que no vienen desde junio.",
    cuando: "hace 40 min",
    destino: { vista: "resumen", pestana: "pendientes" },
  },
  {
    id: "a2",
    agente: "clara",
    titulo: "Factura por vencer: Insumos Médicos del Bajío",
    detalle: "$8,450 · vence el jueves",
    cuando: "hace 1 h",
    destino: { vista: "correo" },
  },
  {
    id: "a3",
    agente: "lola",
    titulo: "Rosa Peña no ha confirmado su cita de mañana",
    detalle: "Lola le vuelve a escribir a las 18:00.",
    cuando: "hace 2 h",
    destino: { vista: "resumen", pestana: "destacados" },
  },
  {
    id: "a4",
    agente: "iris",
    titulo: "Tu reporte de septiembre está listo",
    detalle: "Reporte-septiembre.xlsx",
    cuando: "hace 3 h",
    leido: true,
    destino: { vista: "conversaciones", con: "cierre" },
  },
];

export function estadisticasDemo(): Estadistica[] {
  return [
    { valor: "10 de 12", etiqueta: "citas de mañana confirmadas" },
    { valor: "23", etiqueta: "correos resumidos por Clara" },
    { valor: "19", etiqueta: "conversaciones por WhatsApp" },
  ];
}

export const EVENTOS_DEMO: Evento[] = [
  {
    id: "e1",
    dia: "Hoy",
    cuando: "ahora",
    quien: "lola",
    accion: "está contestando a",
    objeto: "Valeria Núñez",
    detalle: "Pregunta si hay lugar para depilación láser el sábado.",
    vivo: true,
    destino: { vista: "conversaciones", con: "lola" },
  },
  {
    id: "e2",
    dia: "Hoy",
    cuando: "hace 25 min",
    quien: "lola",
    accion: "agendó la primera cita de",
    objeto: "Sofía Ramírez",
    adjunto: {
      tipo: "cita",
      cuando: "Viernes · 10:00",
      servicio: "Limpieza facial · 1 hora",
      persona: "Sofía Ramírez",
      estado: { tono: "exito", texto: "Confirmada por WhatsApp" },
    },
    destino: { vista: "conversaciones", con: "recepcion" },
  },
  {
    id: "e3",
    dia: "Hoy",
    cuando: "hace 24 min",
    quien: "lola",
    accion: "le pasó a Víctor el seguimiento de",
    objeto: "Sofía Ramírez",
    relevo: "victor",
    detalle: "Víctor le escribe el sábado para saber cómo le fue y pedirle su reseña.",
    destino: { vista: "conversaciones", con: "recepcion" },
  },
  {
    id: "e4",
    dia: "Hoy",
    cuando: "hace 1 h",
    quien: "clara",
    accion: "resumió",
    objeto: "23 correos",
    adjunto: {
      tipo: "correo",
      titulo: "Lo importante de hoy",
      puntos: [
        { etiqueta: "Urgente", texto: "Insumos Médicos del Bajío: factura de $8,450 que vence el jueves." },
        { etiqueta: "Hoy", texto: "Andrea Solís quiere pasar su cita del martes a la tarde." },
        { etiqueta: "Esta semana", texto: "El Dr. Vela te recomienda a una paciente para valoración." },
      ],
    },
    destino: { vista: "correo" },
  },
  {
    id: "e5",
    dia: "Hoy",
    cuando: "hace 2 h",
    quien: "lola",
    accion: "mandó recordatorio a",
    objeto: "12 citas de mañana",
    detalle: "10 ya confirmaron. Carla Díaz pasó de 16:00 a 17:00.",
    insignia: { tono: "atencion", texto: "1 sin confirmar" },
    destino: { vista: "conversaciones", con: "lola" },
  },
  {
    id: "e6",
    dia: "Hoy",
    cuando: "hace 3 h",
    quien: "iris",
    accion: "preparó el reporte de",
    objeto: "septiembre",
    adjunto: { tipo: "archivo", nombre: "Reporte-septiembre.xlsx", detalle: "Excel · hoja de citas y hoja de pagos" },
    destino: { vista: "conversaciones", con: "cierre" },
  },
  {
    id: "e7",
    dia: "Ayer",
    cuando: "Ayer, 12:01",
    quien: "victor",
    accion: "escribió a",
    objeto: "12 personas que preguntaron por botox",
    detalle: "3 ya contestaron y Lola les está apartando cita.",
    adjunto: {
      tipo: "mensaje",
      canal: "WhatsApp",
      texto: "Hola, Paola. La semana pasada preguntaste por botox. ¿Te aparto un lugar? Tengo viernes 12:00 o sábado 10:30.",
    },
    destino: { vista: "conversaciones", con: "victor" },
  },
  {
    id: "e8",
    dia: "Ayer",
    cuando: "Ayer, 18:04",
    quien: "clara",
    accion: "encontró",
    objeto: "2 facturas por pagar",
    detalle: "$10,630 en total. La más próxima vence el jueves.",
    destino: { vista: "conversaciones", con: "cierre" },
  },
];

export const PENDIENTES_DEMO: Pendiente[] = [
  {
    id: "p1",
    agente: "victor",
    titulo: "Mensaje para 31 clientes que no vienen desde junio",
    para: "31 clientes",
    canal: "WhatsApp",
    cuando: "hace 40 min",
    borrador:
      "Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar? A quien no conteste le escribo una vez más en 5 días.",
  },
  {
    id: "p2",
    agente: "clara",
    titulo: "Respuesta a Insumos Médicos del Bajío",
    para: "Insumos Médicos del Bajío",
    canal: "Correo",
    cuando: "hace 1 h",
    borrador:
      "Buen día. Recibimos su factura de septiembre por $8,450. Queda programado el pago para el jueves. Gracias por el aviso.",
  },
];

export const DESTACADOS_DEMO: Destacado[] = [
  {
    id: "d1",
    agente: "clara",
    titulo: "La factura de Insumos Médicos del Bajío vence el jueves",
    detalle: "$8,450 · la respuesta ya está lista para tu visto bueno.",
    insignia: { tono: "atencion", texto: "Por vencer" },
    cuando: "hace 1 h",
    destino: { vista: "correo" },
  },
  {
    id: "d2",
    agente: "lola",
    titulo: "Rosa Peña no ha confirmado su cita de mañana a las 12:30",
    detalle: "Lola le vuelve a escribir a las 18:00.",
    insignia: { tono: "atencion", texto: "Sin confirmar" },
    cuando: "hace 2 h",
    destino: { vista: "conversaciones", con: "lola" },
  },
  {
    id: "d3",
    agente: "clara",
    titulo: "El Dr. Vela te recomienda a una paciente",
    detalle: "Quiere una valoración esta semana. Conviene contestarle hoy.",
    insignia: { tono: "azul", texto: "Recomendación" },
    cuando: "hace 1 h",
    destino: { vista: "correo" },
  },
];

export function agentesFijadosDemo(): AgenteFijado[] {
  return [
    { id: "lola", estado: "Contestando un WhatsApp", tono: "azul", pulso: true, dato: "19 conversaciones hoy", destino: { vista: "conversaciones", con: "lola" } },
    { id: "clara", estado: "Activa", tono: "exito", dato: "23 correos resumidos hoy", destino: { vista: "conversaciones", con: "clara" } },
    { id: "victor", estado: "Espera tu visto bueno", tono: "atencion", dato: "3 pacientes regresaron esta semana", destino: { vista: "resumen", pestana: "pendientes" } },
    { id: "iris", estado: "Sin pendientes", tono: "neutro", dato: "Reporte de septiembre listo", destino: { vista: "conversaciones", con: "cierre" } },
  ];
}

export const CONVERSACIONES_DEMO: ConversacionReciente[] = [
  {
    id: "recepcion",
    nombre: "Recepción",
    agentes: ["lola", "victor"],
    vistaPrevia: "Lola: Lo anoté en su ficha para que no le lleguen dos mensajes el mismo día.",
    cuando: "10:05",
    destino: { vista: "conversaciones", con: "recepcion" },
  },
  {
    id: "lola",
    nombre: "Lola",
    agentes: ["lola"],
    vistaPrevia: "Hecho: Carla Díaz queda mañana a las 17:00. Ya le avisé.",
    cuando: "09:33",
    destino: { vista: "conversaciones", con: "lola" },
  },
  {
    id: "cierre",
    nombre: "Cierre de mes",
    agentes: ["clara", "iris"],
    vistaPrevia: "Iris: Listo. Te dejé el reporte en Excel con una hoja de citas y otra de pagos.",
    cuando: "08:16",
    sinLeer: 1,
    destino: { vista: "conversaciones", con: "cierre" },
  },
  {
    id: "clara",
    nombre: "Clara",
    agentes: ["clara"],
    vistaPrevia: "Llegó la factura de CFE: $2,180, vence el 15.",
    cuando: "08:52",
    sinLeer: 2,
    destino: { vista: "conversaciones", con: "clara" },
  },
  {
    id: "victor",
    nombre: "Víctor",
    agentes: ["victor"],
    vistaPrevia: "Enviado a las 12 personas. 3 ya contestaron y Lola les está apartando cita.",
    cuando: "Ayer",
    destino: { vista: "conversaciones", con: "victor" },
  },
];

export const CITAS_DEMO: Cita[] = [
  { id: "c1", persona: "Mónica Herrera", servicio: "Depilación láser", hora: "10:00", estado: { tono: "exito", etiqueta: "Confirmada" } },
  { id: "c2", persona: "Rosa Peña", servicio: "Limpieza facial", hora: "12:30", estado: { tono: "atencion", etiqueta: "Sin confirmar" } },
  { id: "c3", persona: "Jorge Medina", servicio: "Consulta de valoración", hora: "13:00", estado: { tono: "exito", etiqueta: "Confirmada" } },
  { id: "c4", persona: "Carla Díaz", servicio: "Aplicación de botox", hora: "17:00", estado: { tono: "azul", etiqueta: "Cambió de 16:00" } },
];

/** Conversaciones por WhatsApp y correo que atendió el equipo en los últimos 7 días (la última es hoy, hasta ahora). */
const SEMANA = [24, 31, 28, 35, 33, 12, 19];

export function semanaDemo(m: Momento): DiaSemana[] {
  return m.dias.map((d, i) => ({ ...d, valor: SEMANA[i], hoy: i === SEMANA.length - 1 }));
}

export const PARA_TI_DEMO: ItemParaTi[] = [
  {
    id: "t1",
    tipo: "consejo",
    titulo: "Pide reseñas sin sonar insistente",
    texto: "Víctor escribe a cada paciente un día después de su cita, y tú revisas el mensaje antes de que salga.",
    accion: { etiqueta: "Hablar con Víctor", destino: { vista: "conversaciones", con: "victor" } },
  },
  {
    id: "t2",
    tipo: "novedad",
    titulo: "Chats en grupo con tus agentes",
    texto: "Junta a Lola y a Víctor en un mismo chat: una agenda la cita y el otro da el seguimiento.",
    accion: { etiqueta: "Abrir «Recepción»", destino: { vista: "conversaciones", con: "recepcion" } },
  },
  {
    id: "t3",
    tipo: "novedad",
    titulo: "Clara y tu Gmail",
    texto: "Conecta tu Gmail y Clara resume tus correos sin leer. Es solo lectura: nunca envía ni borra nada.",
    accion: { etiqueta: "Ver el correo", destino: { vista: "correo" } },
  },
  {
    id: "t4",
    tipo: "consejo",
    titulo: "Busca desde cualquier parte",
    texto: "Escribe / y busca citas, conversaciones o a un agente sin soltar el teclado.",
  },
];

export const CORREOS_DEMO: ResumenCorreo[] = [
  {
    id: "m1",
    remitente: "Insumos Médicos del Bajío",
    asunto: "Factura de septiembre",
    resumen: "Factura por $8,450 de los insumos de septiembre. Vence el jueves.",
    accion: "Programa el pago antes del jueves; la respuesta ya espera tu visto bueno.",
    cuando: "hace 1 h",
    nuevo: true,
  },
  {
    id: "m2",
    remitente: "Andrea Solís",
    asunto: "¿Puedo cambiar mi cita?",
    resumen: "Quiere pasar su cita del martes a la tarde.",
    accion: "Lola ya le ofreció las 17:00 o las 18:30.",
    cuando: "hace 1 h",
    nuevo: true,
  },
  {
    id: "m3",
    remitente: "Dr. Vela",
    asunto: "Te recomiendo a una paciente",
    resumen: "Recomienda a una paciente para valoración de manchas en la piel.",
    accion: "Contéstale esta semana para agendar la valoración.",
    cuando: "hace 1 h",
  },
  {
    id: "m4",
    remitente: "CFE",
    asunto: "Tu recibo de luz",
    resumen: "Recibo por $2,180. Vence el día 15.",
    accion: "Agrégalo a los pagos del mes.",
    cuando: "hace 2 h",
  },
  {
    id: "m5",
    remitente: "Paola Ruiz",
    asunto: "Precio del botox",
    resumen: "Pregunta cuánto cuesta el botox y si hay lugar el sábado.",
    accion: null,
    cuando: "Ayer, 11:40",
  },
];

/** Lo que encuentra el buscador del demo. */
export function indiceDemo(): ResultadoBusqueda[] {
  return [
    ...NAV_DEMO.filter((n) => !n.pronto && n.destino).map((n) => ({
      id: `s-${n.id}`,
      grupo: "Secciones" as const,
      titulo: n.etiqueta,
      icono: n.icono,
      destino: n.destino!,
    })),
    ...AGENTES_INFO.map((a) => ({
      id: `a-${a.id}`,
      grupo: "Agentes" as const,
      titulo: a.nombre,
      detalle: `${a.area} · ${a.abarca}`,
      agente: a.id,
      destino: { vista: "conversaciones" as const, con: a.id },
    })),
    ...CONVERSACIONES_DEMO.filter((c) => c.agentes.length > 1).map((c) => ({
      id: `c-${c.id}`,
      grupo: "Conversaciones" as const,
      titulo: c.nombre,
      detalle: c.vistaPrevia,
      icono: "usuarios" as const,
      destino: c.destino,
    })),
    ...CITAS_DEMO.map((c) => ({
      id: `ci-${c.id}`,
      grupo: "Citas" as const,
      titulo: `${c.persona} · mañana ${c.hora}`,
      detalle: `${c.servicio} · ${c.estado.etiqueta}`,
      icono: "calendario" as const,
      destino: { vista: "resumen" as const },
    })),
    ...EVENTOS_DEMO.filter((e) => e.objeto).map((e) => ({
      id: `e-${e.id}`,
      grupo: "Actividad" as const,
      titulo: `${e.objeto}`,
      detalle: e.detalle ?? e.accion,
      agente: e.quien === "tu" ? undefined : e.quien,
      destino: e.destino ?? { vista: "resumen" as const },
    })),
  ];
}
