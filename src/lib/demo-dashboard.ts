import type {
  Aviso,
  Cita,
  Consejo,
  ElementoLista,
  Estado,
  Evento,
  IdVista,
  Metrica,
} from "@/components/dashboard/tipos";
import type { IdAgente } from "./agentes";
import type { IdPlan } from "./planes";

/**
 * DATOS DE EJEMPLO del dashboard de /pruebalo: una clínica de dermatología
 * y estética inventada para la demostración (se marca en pantalla como
 * "Datos de ejemplo"). Nada de esto es un cliente real ni una cifra real
 * de Atendel. Cuenta la misma historia que el chat de ejemplo (ChatDemo):
 * Sofía Ramírez agenda su primera limpieza, Carla Díaz cambia de hora,
 * Rosa Peña no ha confirmado, Clara leyó 23 correos, Víctor siguió a quien
 * preguntó por botox e Iris dejó el reporte de septiembre en Excel.
 *
 * Las horas van en minutos antes de "ahora" (haceMin): así la demostración
 * se ve al día a cualquier hora que se abra.
 */

/** A dónde lleva algo dentro de /pruebalo (sin recargar). `con`: abre ese chat. */
export type Destino = { vista: IdVista; con?: string; pestana?: IdPestana };
export type IdPestana = "actividad" | "visto-bueno" | "destacados";

export const DEMO_NEGOCIO = {
  nombre: "Clínica Luna",
  giro: "Dermatología y estética",
  ciudad: "Guadalajara, Jal.",
  plan: "max" as IdPlan,
  mensajesUsados: 1284,
};

export const DEMO_USUARIA = {
  nombre: "Ana López",
  // Dominio reservado para ejemplos: no es el correo de nadie
  correo: "ana@clinicaluna.example",
  estado: { tono: "exito" as const, etiqueta: "Disponible" },
};

/* ---------- Tu equipo ahora mismo ---------- */

export const DEMO_ESTADOS: Record<IdAgente, Estado> = {
  lola: { tono: "azul", etiqueta: "Contestando un WhatsApp", pulso: true },
  clara: { tono: "exito", etiqueta: "Tu correo está al día" },
  victor: { tono: "atencion", etiqueta: "Espera tu visto bueno" },
  iris: { tono: "neutro", etiqueta: "Sin pendientes" },
};

/** Lo de la semana de cada agente (para sus tarjetas fijadas y la vista Agentes). */
export const DEMO_SEMANA_AGENTE: Record<IdAgente, { icono: "mensaje" | "calendario" | "correo" | "usuarios" | "documento"; texto: string }[]> = {
  lola: [
    { icono: "mensaje", texto: "86 WhatsApp" },
    { icono: "calendario", texto: "41 citas" },
  ],
  clara: [
    { icono: "correo", texto: "112 correos leídos" },
    { icono: "documento", texto: "4 facturas" },
  ],
  victor: [
    { icono: "usuarios", texto: "12 seguimientos" },
    { icono: "mensaje", texto: "3 regresaron" },
  ],
  iris: [
    { icono: "documento", texto: "1 reporte" },
    { icono: "documento", texto: "1 investigación" },
  ],
};

export const DEMO_GRUPOS: { id: string; nombre: string; agentes: IdAgente[]; sinLeer?: number }[] = [
  { id: "recepcion", nombre: "Recepción", agentes: ["lola", "victor"] },
  { id: "cierre", nombre: "Cierre de mes", agentes: ["clara", "iris"], sinLeer: 1 },
];

/* ---------- Bienvenida: el día en tres renglones ---------- */

export const DEMO_DIA: { id: string; icono: "calendario" | "correo" | "reloj"; texto: string; detalle: string; tono?: "atencion" | "error"; ir: Destino }[] = [
  {
    id: "citas",
    icono: "calendario",
    texto: "12 citas mañana",
    detalle: "10 confirmadas, 1 cambio y 1 sin respuesta",
    ir: { vista: "actividad", pestana: "actividad" },
  },
  {
    id: "correo",
    icono: "correo",
    texto: "23 correos leídos",
    detalle: "1 urgente: una factura que vence el jueves",
    tono: "error",
    ir: { vista: "correo" },
  },
  {
    id: "visto",
    icono: "reloj",
    texto: "3 cosas esperan tu visto bueno",
    detalle: "Un mensaje de Víctor, uno de Lola y uno de Clara",
    tono: "atencion",
    ir: { vista: "actividad", pestana: "visto-bueno" },
  },
];

/* ---------- Actividad (línea de tiempo) ---------- */

const RECORDATORIOS: ElementoLista[] = [
  { id: "r1", titulo: "Mariana Ruiz", detalle: "Limpieza facial profunda · 11:30", insignia: { tono: "exito", texto: "Confirmó" } },
  { id: "r2", titulo: "Jorge Peña", detalle: "Valoración para láser · 13:00", insignia: { tono: "exito", texto: "Confirmó" } },
  { id: "r3", titulo: "Carla Díaz", detalle: "Peeling químico · pasó de 16:00 a 17:00", insignia: { tono: "azul", texto: "Cambió de hora" } },
  { id: "r4", titulo: "Rosa Peña", detalle: "Consulta dermatológica · 10:00", insignia: { tono: "atencion", texto: "Sin respuesta" } },
  { id: "r5", titulo: "Daniela Torres", detalle: "Depilación láser · 9:00", insignia: { tono: "exito", texto: "Confirmó" } },
  { id: "r6", titulo: "Lucía Herrera", detalle: "Hidrafacial · 12:00", insignia: { tono: "exito", texto: "Confirmó" } },
];

export const DEMO_ACTIVIDAD: (Evento & { ir?: Destino })[] = [
  {
    id: "cita-sofia",
    agente: "lola",
    verbo: "agendó una cita para",
    objeto: "Sofía Ramírez",
    complemento: "por WhatsApp",
    haceMin: 12,
    tarjeta: {
      tipo: "cita",
      titulo: "Limpieza facial profunda · primera visita",
      detalle: "Viernes 10:00 · 60 min · Cabina 2 · $850",
      insignia: { tono: "exito", texto: "Confirmada" },
    },
    accion: { etiqueta: "Ver la conversación" },
    ir: { vista: "conversaciones", con: "recepcion" },
  },
  {
    id: "relevo-sofia",
    agente: "lola",
    con: "victor",
    verbo: "le pasó a",
    objeto: "Víctor",
    complemento: "el seguimiento de Sofía Ramírez",
    haceMin: 14,
    tarjeta: {
      tipo: "mensaje",
      texto: "El sábado le escribo para ver cómo sintió su piel y, si quedó contenta, le pido su reseña en Google.",
      pie: "Víctor · en el grupo Recepción",
    },
  },
  {
    id: "recordatorios",
    agente: "lola",
    verbo: "mandó recordatorio a las",
    objeto: "12 citas de mañana",
    haceMin: 47,
    insignia: { tono: "exito", texto: "10 confirmaron" },
    agrupado: { etiqueta: "Ver cómo contestaron", elementos: RECORDATORIOS },
    accion: { etiqueta: "Abrir el chat con Lola" },
    ir: { vista: "conversaciones", con: "lola" },
  },
  {
    id: "correos",
    agente: "clara",
    verbo: "leyó",
    objeto: "23 correos",
    complemento: "y separó lo importante",
    haceMin: 96,
    tarjeta: {
      tipo: "lista",
      elementos: [
        {
          id: "c1",
          titulo: "Insumos Médicos del Bajío",
          detalle: "Factura de $8,450 que vence el jueves",
          insignia: { tono: "error", texto: "Urgente" },
        },
        {
          id: "c2",
          titulo: "Andrea Solís",
          detalle: "Quiere pasar su cita del martes a la tarde",
          insignia: { tono: "atencion", texto: "Hoy" },
        },
        {
          id: "c3",
          titulo: "Dr. Vela",
          detalle: "Te recomienda a una paciente para valoración",
          insignia: { tono: "neutra", texto: "Esta semana" },
        },
      ],
      pie: "Los otros 20 son promociones y avisos: no necesitan nada.",
    },
    accion: { etiqueta: "Ir a Correo" },
    ir: { vista: "correo" },
  },
  {
    id: "victor-reactivar",
    agente: "victor",
    verbo: "preparó un mensaje para",
    objeto: "31 clientes",
    complemento: "que no vienen desde junio",
    haceMin: 128,
    insignia: { tono: "atencion", texto: "Espera tu visto bueno" },
    tarjeta: {
      tipo: "mensaje",
      para: "Para Laura y 30 clientes más, cada uno con su nombre",
      texto: "Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?",
    },
    accion: { etiqueta: "Revisar y aprobar" },
    ir: { vista: "actividad", pestana: "visto-bueno" },
  },
  {
    id: "iris-reporte",
    agente: "iris",
    verbo: "dejó listo",
    objeto: "el reporte de septiembre",
    haceMin: 171,
    tarjeta: {
      tipo: "archivo",
      nombre: "Reporte de septiembre.xlsx",
      detalle: "Excel · una hoja de citas y otra de pagos · 342 citas, 47 clientes nuevos",
    },
    accion: { etiqueta: "Ver en el grupo Cierre de mes" },
    ir: { vista: "conversaciones", con: "cierre" },
  },
  {
    id: "victor-botox",
    agente: "victor",
    verbo: "escribió a",
    objeto: "12 personas",
    complemento: "que preguntaron por botox y no agendaron",
    haceMin: 26 * 60 + 15,
    insignia: { tono: "exito", texto: "3 ya contestaron" },
    tarjeta: {
      tipo: "mensaje",
      para: "Para Paola y 11 personas más",
      texto: "Hola, Paola. La semana pasada preguntaste por botox. ¿Te aparto un lugar? Tengo viernes 12:00 o sábado 10:30.",
      pie: "Lola les está apartando cita a quienes contestaron.",
    },
  },
];

/** Lo que aparece con "Ver actividad anterior". */
export const DEMO_ACTIVIDAD_ANTERIOR: (Evento & { ir?: Destino })[] = [
  {
    id: "clara-facturas",
    agente: "clara",
    verbo: "encontró",
    objeto: "2 facturas por pagar",
    complemento: "en tu correo",
    haceMin: 30 * 60 + 40,
    tarjeta: {
      tipo: "lista",
      elementos: [
        { id: "f1", titulo: "Insumos Médicos del Bajío", detalle: "$8,450 · vence el jueves" },
        { id: "f2", titulo: "CFE", detalle: "$2,180 · vence el 15" },
      ],
      pie: "Por pagar: $10,630.",
    },
  },
  {
    id: "iris-laser",
    agente: "iris",
    verbo: "comparó precios de",
    objeto: "depilación láser",
    complemento: "en 4 clínicas cercanas",
    haceMin: 2 * 24 * 60 + 5 * 60,
    tarjeta: {
      tipo: "mensaje",
      texto: "Estás a la mitad del rango: $750 la sesión, 6 por $3,900. Los precios pueden cambiar; conviene confirmarlos.",
      pie: "Iris · en su chat",
    },
    ir: { vista: "conversaciones", con: "iris" },
    accion: { etiqueta: "Ver la comparación" },
  },
];

/* ---------- Espera tu visto bueno ---------- */

export type Aprobacion = {
  id: string;
  agente: IdAgente;
  titulo: string;
  para: string;
  texto: string;
  /** Qué pasa al aprobar (se dice antes de hacerlo). */
  alAprobar: string;
  haceMin: number;
  ir: Destino;
};

export const DEMO_APROBACIONES: Aprobacion[] = [
  {
    id: "reactivar",
    agente: "victor",
    titulo: "Mensaje para 31 clientes que no vienen desde junio",
    para: "Laura y 30 clientes más, cada uno con su nombre",
    texto: "Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?",
    alAprobar: "Víctor lo manda hoy a mediodía y te avisa quién regresa.",
    haceMin: 128,
    ir: { vista: "conversaciones", con: "victor" },
  },
  {
    id: "rosa",
    agente: "lola",
    titulo: "Volver a escribirle a Rosa Peña",
    para: "Rosa Peña · consulta dermatológica de mañana, 10:00",
    texto: "Hola, Rosa. ¿Nos confirmas tu consulta de mañana a las 10:00? Si no puedes, te busco otro horario esta semana.",
    alAprobar: "Lola le escribe a las 18:00.",
    haceMin: 47,
    ir: { vista: "conversaciones", con: "lola" },
  },
  {
    id: "andrea",
    agente: "clara",
    titulo: "Respuesta a Andrea Solís",
    para: "andrea.solis@correo.example · Cambio de cita",
    texto: "Hola, Andrea. Claro que sí: te pasamos a las 17:00 del martes. Si prefieres las 18:30, avísanos y lo cambiamos.",
    alAprobar: "Clara la envía desde tu correo.",
    haceMin: 96,
    ir: { vista: "conversaciones", con: "clara" },
  },
];

/* ---------- Destacados ---------- */

export const DEMO_DESTACADOS: { id: string; agente: IdAgente; titulo: string; detalle: string; ir: Destino }[] = [
  { id: "reporte", agente: "iris", titulo: "Reporte de septiembre", detalle: "Excel · en el grupo Cierre de mes", ir: { vista: "conversaciones", con: "cierre" } },
  { id: "recepcion", agente: "lola", titulo: "Grupo Recepción", detalle: "Lola y Víctor · citas y reseñas", ir: { vista: "conversaciones", con: "recepcion" } },
  { id: "laser", agente: "iris", titulo: "Precios de depilación láser", detalle: "Comparación con 4 clínicas cercanas", ir: { vista: "conversaciones", con: "iris" } },
];

/* ---------- Conversaciones recientes con clientes ---------- */

export type ConversacionDemo = {
  id: string;
  cliente: string;
  canal: "WhatsApp" | "Correo";
  agente: IdAgente;
  ultimo: string;
  haceMin: number;
  sinLeer?: boolean;
  ir: Destino;
};

export const DEMO_CONVERSACIONES: ConversacionDemo[] = [
  {
    id: "sofia",
    cliente: "Sofía Ramírez",
    canal: "WhatsApp",
    agente: "lola",
    ultimo: "Perfecto, ahí estaré el viernes. ¡Gracias!",
    haceMin: 9,
    sinLeer: true,
    ir: { vista: "conversaciones", con: "recepcion" },
  },
  {
    id: "carla",
    cliente: "Carla Díaz",
    canal: "WhatsApp",
    agente: "lola",
    ultimo: "Lola: Listo, quedas mañana a las 17:00.",
    haceMin: 52,
    ir: { vista: "conversaciones", con: "lola" },
  },
  {
    id: "andrea",
    cliente: "Andrea Solís",
    canal: "Correo",
    agente: "clara",
    ultimo: "¿Me podrían cambiar la cita del martes a la tarde?",
    haceMin: 101,
    sinLeer: true,
    ir: { vista: "conversaciones", con: "clara" },
  },
  {
    id: "paola",
    cliente: "Paola Méndez",
    canal: "WhatsApp",
    agente: "victor",
    ultimo: "Sí, el sábado a las 10:30 me queda bien.",
    haceMin: 22 * 60,
    ir: { vista: "conversaciones", con: "victor" },
  },
  {
    id: "insumos",
    cliente: "Insumos Médicos del Bajío",
    canal: "Correo",
    agente: "clara",
    ultimo: "Adjuntamos la factura F-2291 por $8,450.",
    haceMin: 23 * 60 + 30,
    ir: { vista: "correo" },
  },
];

/* ---------- Columna derecha ---------- */

export const DEMO_CITAS: Cita[] = [
  { id: "daniela", paciente: "Daniela Torres", servicio: "Depilación láser", hora: "9:00", estado: { tono: "exito", texto: "Confirmó" } },
  { id: "rosa", paciente: "Rosa Peña", servicio: "Consulta dermatológica", hora: "10:00", estado: { tono: "atencion", texto: "Sin respuesta" } },
  { id: "mariana", paciente: "Mariana Ruiz", servicio: "Limpieza facial profunda", hora: "11:30", estado: { tono: "exito", texto: "Confirmó" } },
  { id: "carla", paciente: "Carla Díaz", servicio: "Peeling químico", hora: "17:00", estado: { tono: "azul", texto: "Cambió de hora" } },
];

export const DEMO_METRICAS: Metrica[] = [
  { id: "whatsapp", etiqueta: "WhatsApp contestados", valor: 86, delta: 9, periodo: "la semana pasada" },
  { id: "citas", etiqueta: "Citas agendadas", valor: 41, delta: 6, periodo: "la semana pasada" },
  { id: "correos", etiqueta: "Correos leídos", valor: 112, delta: -4, periodo: "la semana pasada" },
];

export const DEMO_CONSEJOS: (Omit<Consejo, "alElegir" | "href"> & { ir: Destino })[] = [
  {
    id: "grupo",
    agente: "victor",
    titulo: "Junta la cita y la reseña",
    texto: "En el grupo Recepción, Lola agenda y Víctor pide la reseña después. Nadie recibe dos mensajes el mismo día.",
    etiquetaAccion: "Abrir Recepción",
    ir: { vista: "conversaciones", con: "recepcion" },
  },
  {
    id: "reporte",
    agente: "iris",
    titulo: "Pídele a Iris el reporte del mes",
    texto: "Escribe /reporte en su chat y te lo deja en Excel, comparado con el mes anterior.",
    etiquetaAccion: "Hablar con Iris",
    ir: { vista: "conversaciones", con: "iris" },
  },
];

export const DEMO_AVISOS: (Omit<Aviso, "alElegir" | "href"> & { ir: Destino })[] = [
  {
    id: "a-victor",
    agente: "victor",
    titulo: "Víctor espera tu visto bueno",
    detalle: "Mensaje para 31 clientes que no vienen desde junio",
    haceMin: 128,
    ir: { vista: "actividad", pestana: "visto-bueno" },
  },
  {
    id: "a-clara",
    agente: "clara",
    titulo: "Un correo urgente",
    detalle: "Insumos Médicos del Bajío: factura de $8,450 que vence el jueves",
    haceMin: 96,
    ir: { vista: "correo" },
  },
  {
    id: "a-lola",
    agente: "lola",
    titulo: "Rosa Peña no ha confirmado",
    detalle: "Su consulta es mañana a las 10:00",
    haceMin: 47,
    ir: { vista: "actividad", pestana: "visto-bueno" },
  },
];

/* ---------- Vista Correo (lo que Clara leyó hoy) ---------- */

export type CorreoDemo = {
  id: string;
  remitente: string;
  asunto: string;
  resumen: string;
  accion?: string;
  prioridad: "urgente" | "hoy" | "semana" | "sin-accion";
  haceMin: number;
};

export const DEMO_CORREOS: CorreoDemo[] = [
  {
    id: "insumos",
    remitente: "Insumos Médicos del Bajío",
    asunto: "Factura F-2291",
    resumen: "Te mandan la factura de $8,450 por el último pedido de insumos. Vence el jueves.",
    accion: "Págala antes del jueves o pide unos días más.",
    prioridad: "urgente",
    haceMin: 23 * 60 + 30,
  },
  {
    id: "andrea",
    remitente: "Andrea Solís",
    asunto: "Cambio de cita",
    resumen: "Quiere pasar su cita del martes a la tarde. Clara le ofreció 17:00 o 18:30.",
    accion: "Aprueba la respuesta que dejó lista.",
    prioridad: "hoy",
    haceMin: 101,
  },
  {
    id: "vela",
    remitente: "Dr. Vela",
    asunto: "Paciente para valoración",
    resumen: "Te recomienda a una paciente con manchas en la cara para una valoración.",
    accion: "Contéstale para agradecer y agendar la valoración.",
    prioridad: "semana",
    haceMin: 140,
  },
  {
    id: "cfe",
    remitente: "CFE",
    asunto: "Tu recibo de luz",
    resumen: "Recibo de $2,180. Vence el 15.",
    prioridad: "semana",
    haceMin: 162,
  },
  {
    id: "promos",
    remitente: "20 correos más",
    asunto: "Promociones, boletines y avisos",
    resumen: "Ofertas de proveedores, boletines y notificaciones de redes sociales.",
    prioridad: "sin-accion",
    haceMin: 180,
  },
];
