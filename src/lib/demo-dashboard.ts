import type {
  Cita,
  ConversacionReciente,
  Consejo,
  CorreoResumido,
  Destacado,
  Evento,
  Metrica,
  Pendiente,
  Usuario,
} from "@/components/dashboard/tipos";
import type { IdAgente } from "./agentes";

/**
 * DATOS DE EJEMPLO del dashboard de /pruebalo.
 *
 * Una clínica de estética inventada ("Clínica Alba") para enseñar cómo se ve
 * el panel un día normal. Nada de esto es un cliente, una cifra o un
 * testimonio real: la página lo marca como "Datos de ejemplo". Las personas,
 * horarios y montos siguen el mismo guion del chat de ejemplo (ChatDemo):
 * Carla Díaz pasó a las 17:00, Rosa Peña no ha confirmado, la factura de
 * Insumos Médicos del Bajío vence el jueves, septiembre cerró con 342 citas…
 * El demo NO llama a la IA.
 */

export const DEMO_NEGOCIO = {
  nombre: "Clínica Alba",
  giro: "Estética y dermatología",
};

export const DEMO_USUARIO: Usuario = {
  nombre: "Paulina Herrera",
  correo: "paulina@clinicaalba.mx",
  estado: { tono: "exito", etiqueta: "Disponible" },
};

export const DEMO_PLAN = { id: "max" as const, usados: 1284 };

/* ---------- Lo que espera tu visto bueno ---------- */

export const DEMO_PENDIENTES: Pendiente[] = [
  {
    id: "reactivar-junio",
    agente: "victor",
    titulo: "Mensaje para 4 pacientes que no vienen desde junio",
    detalle: "Víctor · WhatsApp · 4 pacientes",
    hora: "10:40",
    nuevo: true,
    vista: {
      tipo: "whatsapp",
      para: ["Laura Méndez", "Paola Ríos", "Fernanda Gil", "Regina Campos"],
      texto:
        "Hola, Laura. Hace tiempo que no te vemos en Clínica Alba. ¿Te aparto un lugar para tu limpieza facial? Tengo viernes a las 12:00 o sábado a las 10:30.",
    },
    relevos: [
      { quien: "iris", texto: "encontró a 4 pacientes de limpieza facial sin cita desde junio.", hora: "10:20" },
      { quien: "victor", texto: "escribió un mensaje corto para cada una, con su nombre.", hora: "10:35" },
      { quien: "lola", texto: "apartó viernes 12:00 y sábado 10:30 en la agenda.", hora: "10:40" },
      { quien: "tu", texto: "Falta **tu visto bueno** para enviarlo." },
    ],
    caja: {
      titulo: "Listo para enviar",
      detalle: "Sale por WhatsApp a cada paciente, con su nombre. Si alguna contesta, Lola le aparta la cita.",
      revisiones: ["Los dos horarios siguen libres en tu agenda", "Es un mensaje personal, sin promociones"],
      accion: "Aprobar y enviar",
      hecho: "aprobaste el mensaje de **Víctor** para 4 pacientes que no vienen desde junio",
    },
  },
  {
    id: "recordatorio-rosa",
    agente: "lola",
    titulo: "Segundo recordatorio para Rosa Peña",
    detalle: "Lola · WhatsApp · cita de mañana a las 12:00",
    hora: "09:40",
    urgencia: { tono: "atencion", texto: "Sale hoy 18:00" },
    vista: {
      tipo: "whatsapp",
      para: ["Rosa Peña"],
      texto:
        "Hola, Rosa. Te escribo de Clínica Alba para recordarte tu hidratación facial de mañana a las 12:00. ¿Nos confirmas? Si ya no puedes, con gusto te busco otro horario.",
    },
    relevos: [
      { quien: "lola", texto: "mandó recordatorio a las 12 citas de mañana; 10 ya confirmaron.", hora: "09:31" },
      { quien: "lola", texto: "vio que Rosa no contestó y le preparó un segundo mensaje.", hora: "09:40" },
      { quien: "tu", texto: "Falta **tu visto bueno** para enviarlo." },
    ],
    caja: {
      titulo: "Se envía hoy a las 18:00",
      detalle: "Si lo apruebas, Lola lo manda a esa hora y te avisa en cuanto Rosa conteste.",
      revisiones: ["Rosa no contestó el recordatorio de las 09:31", "Hoy no le llega otro mensaje de la clínica"],
      accion: "Aprobar y programar",
      hecho: "aprobaste el segundo recordatorio de **Lola** para Rosa Peña (sale a las 18:00)",
    },
  },
  {
    id: "factura-bajio",
    agente: "clara",
    titulo: "Respuesta a Insumos Médicos del Bajío",
    detalle: "Clara · Correo · factura F-2291 por $8,450",
    hora: "08:45",
    urgencia: { tono: "atencion", texto: "Vence el jueves" },
    vista: {
      tipo: "correo",
      para: "Cobranza · Insumos Médicos del Bajío",
      asunto: "Re: Factura F-2291",
      texto:
        "Buen día. Recibimos la factura F-2291 por $8,450. La pagaremos el miércoles por transferencia y les enviaremos el comprobante a este correo.\n\nSaludos,\nPaulina Herrera · Clínica Alba",
    },
    relevos: [
      { quien: "clara", texto: "leyó la factura entre los 23 correos de hoy y la marcó como urgente.", hora: "08:41" },
      { quien: "clara", texto: "escribió la respuesta con la fecha de pago.", hora: "08:45" },
      { quien: "tu", texto: "Falta **tu visto bueno** para enviarla." },
    ],
    caja: {
      titulo: "Listo para enviar",
      detalle: "Clara lo manda desde tu correo y te recuerda el pago el miércoles.",
      revisiones: ["El monto es el de la factura que llegó hoy", "Con pago el miércoles llegas antes del vencimiento"],
      accion: "Aprobar y enviar",
      hecho: "aprobaste la respuesta de **Clara** a Insumos Médicos del Bajío",
    },
  },
  {
    id: "reporte-contador",
    agente: "iris",
    titulo: "Reporte de septiembre para tu contador",
    detalle: "Iris · Correo con archivo · C.P. Arturo Salgado",
    hora: "08:20",
    urgencia: { tono: "neutra", texto: "Esta semana" },
    vista: {
      tipo: "documento",
      archivo: "reporte-septiembre.xlsx",
      detalle: "Excel · 2 hojas: citas y pagos",
      puntos: ["342 citas (agosto: 324)", "47 clientes nuevos", "2 facturas por pagar: $10,630"],
      para: "C.P. Arturo Salgado",
      texto: "Hola, Arturo. Te comparto el reporte de septiembre de Clínica Alba con las citas y los pagos del mes. Cualquier duda, me dices.",
    },
    relevos: [
      { quien: "clara", texto: "juntó los pagos y las facturas de septiembre.", hora: "08:10" },
      { quien: "iris", texto: "armó el reporte en Excel con una hoja de citas y otra de pagos.", hora: "08:16" },
      { quien: "tu", texto: "Falta **tu visto bueno** para mandarlo." },
    ],
    caja: {
      titulo: "Listo para enviar",
      detalle: "Iris lo manda a tu contador desde tu correo, con el Excel adjunto.",
      revisiones: ["Los números son los del cierre que viste ayer en «Cierre de mes»"],
      accion: "Aprobar y enviar",
      hecho: "aprobaste el reporte de **Iris** para tu contador",
    },
  },
];

/* ---------- Actividad: lo que hicieron los agentes ---------- */

export const DEMO_ACTIVIDAD: Evento[] = [
  {
    id: "a1",
    tipo: "simple",
    dia: "Hoy",
    hora: "10:02",
    agente: "lola",
    icono: "calendario",
    texto: "**Lola** agendó a **Sofía Ramírez**: primera limpieza facial, viernes a las 10:00",
    insignia: { tono: "exito", texto: "Cita confirmada" },
  },
  {
    id: "a2",
    tipo: "relevo",
    dia: "Hoy",
    hora: "10:03",
    de: "lola",
    a: "victor",
    texto: "Sofía viene por primera vez el viernes. Te la paso para después de su cita.",
    respuesta: "El sábado le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña.",
  },
  {
    id: "a3",
    tipo: "simple",
    dia: "Hoy",
    hora: "09:31",
    agente: "lola",
    icono: "reloj",
    texto: "**Lola** mandó recordatorio a las **12 citas de mañana**: 10 confirmaron y Carla Díaz pasó a las 17:00",
  },
  {
    id: "a4",
    tipo: "caja",
    dia: "Hoy",
    hora: "08:41",
    agente: "clara",
    titulo: "**Clara** resumió los 23 correos de hoy",
    lineas: [
      { etiqueta: "Urgente", texto: "Insumos Médicos del Bajío: factura de $8,450 que vence el jueves." },
      { etiqueta: "Hoy", texto: "Andrea Solís quiere pasar su cita del martes a la tarde." },
      { etiqueta: "Esta semana", texto: "El Dr. Vela te recomienda a una paciente para valoración." },
    ],
  },
  {
    id: "a5",
    tipo: "relevo",
    dia: "Hoy",
    hora: "08:43",
    de: "clara",
    a: "lola",
    texto: "Andrea Solís quiere pasar su cita del martes a la tarde.",
    respuesta: "Le ofrecí 17:00 o 18:30 por WhatsApp.",
  },
  {
    id: "a6",
    tipo: "caja",
    dia: "Hoy",
    hora: "08:16",
    agente: "iris",
    titulo: "**Iris** generó el reporte de septiembre",
    archivo: { nombre: "reporte-septiembre.xlsx", detalle: "Excel · 2 hojas: citas y pagos" },
  },
  {
    id: "a7",
    tipo: "simple",
    dia: "Ayer",
    hora: "18:04",
    agente: "iris",
    icono: "grafica",
    texto: "**Iris** cerró septiembre: **342 citas**, 18 más que en agosto, y 47 clientes nuevos",
  },
  {
    id: "a8",
    tipo: "simple",
    dia: "Ayer",
    hora: "12:01",
    agente: "victor",
    icono: "enviar",
    texto: "**Víctor** envió el seguimiento a **12 personas** que preguntaron por botox y no agendaron",
    insignia: { tono: "exito", texto: "3 ya contestaron" },
  },
  {
    id: "a9",
    tipo: "simple",
    dia: "Ayer",
    hora: "11:40",
    agente: "tu",
    icono: "check",
    texto: "**Tú** aprobaste el mensaje de seguimiento de **Víctor**",
  },
];

/* ---------- Destacados de la semana ---------- */

export const DEMO_DESTACADOS: Destacado[] = [
  {
    id: "d1",
    agente: "iris",
    titulo: "Septiembre cerró con 342 citas",
    detalle: "18 más que agosto y 47 clientes nuevos. Lo más agendado fue depilación láser, con 96 citas.",
  },
  {
    id: "d2",
    agente: "clara",
    titulo: "2 facturas por pagar: $10,630",
    detalle: "Insumos Médicos del Bajío ($8,450) vence el jueves; CFE ($2,180) vence el 15.",
  },
  {
    id: "d3",
    agente: "victor",
    titulo: "3 personas contestaron el seguimiento de botox",
    detalle: "De las 12 que preguntaron y no agendaron. Lola les está apartando cita.",
  },
  {
    id: "d4",
    agente: "lola",
    titulo: "Las faltas bajaron de 26 a 21",
    detalle: "En septiembre, con el recordatorio que manda un día antes de cada cita.",
  },
];

/* ---------- Agentes: lo que lleva cada uno hoy ---------- */

export const DEMO_DATOS_AGENTE: Record<IdAgente, string[]> = {
  lola: ["14 citas hoy", "38 WhatsApp contestados"],
  clara: ["23 correos leídos", "2 facturas por pagar"],
  victor: ["12 seguimientos", "3 respuestas"],
  iris: ["1 reporte listo", "1 comparativa"],
};

/* ---------- Conversaciones (las mismas del chat de ejemplo) ---------- */

export const DEMO_CONVERSACIONES: Omit<ConversacionReciente, "href" | "alElegir">[] = [
  {
    id: "recepcion",
    nombre: "Recepción",
    agentes: ["lola", "victor"],
    ultimo: "Lola: Lo anoté en su ficha para que no le lleguen dos mensajes el mismo día.",
    hora: "10:05",
  },
  {
    id: "lola",
    nombre: "Lola",
    agentes: ["lola"],
    ultimo: "Hecho: Carla Díaz queda mañana a las 17:00. Ya le avisé.",
    hora: "09:33",
  },
  {
    id: "clara",
    nombre: "Clara",
    agentes: ["clara"],
    ultimo: "Llegó la factura de CFE: $2,180, vence el 15.",
    hora: "08:52",
    sinLeer: 2,
  },
  {
    id: "cierre",
    nombre: "Cierre de mes",
    agentes: ["clara", "iris"],
    ultimo: "Iris: Listo. Te dejé el reporte en Excel con una hoja de citas y otra de pagos.",
    hora: "08:16",
    sinLeer: 1,
  },
  {
    id: "victor",
    nombre: "Víctor",
    agentes: ["victor"],
    ultimo: "Enviado a las 12 personas. 3 ya contestaron y Lola les está apartando cita.",
    hora: "Ayer",
  },
];

export const DEMO_GRUPOS: { id: string; nombre: string; agentes: IdAgente[] }[] = [
  { id: "recepcion", nombre: "Recepción", agentes: ["lola", "victor"] },
  { id: "cierre", nombre: "Cierre de mes", agentes: ["clara", "iris"] },
];

/* ---------- Columna derecha ---------- */

export const DEMO_CITAS: { titulo: string; total: number; citas: Cita[] } = {
  titulo: "Mañana",
  total: 12,
  citas: [
    { hora: "10:00", nombre: "Jorge Peña", servicio: "Consulta de valoración", estado: { tono: "exito", texto: "Confirmó" } },
    { hora: "12:00", nombre: "Rosa Peña", servicio: "Hidratación facial", estado: { tono: "atencion", texto: "Sin confirmar" } },
    { hora: "16:30", nombre: "Mariana Ruiz", servicio: "Limpieza facial", estado: { tono: "exito", texto: "Confirmó" } },
    { hora: "17:00", nombre: "Carla Díaz", servicio: "Depilación láser", estado: { tono: "azul", texto: "Cambió de hora" } },
  ],
};

export const DEMO_METRICAS: Metrica[] = [
  { etiqueta: "Citas agendadas", valor: "38", cambio: { texto: "+6", tono: "exito" } },
  { etiqueta: "WhatsApp contestados", valor: "126", cambio: { texto: "+14", tono: "exito" } },
  { etiqueta: "Correos leídos", valor: "41" },
  { etiqueta: "Faltas", valor: "3", cambio: { texto: "−2", tono: "exito" } },
];

export const DEMO_CONSEJOS: Omit<Consejo, "href" | "alElegir">[] = [
  {
    id: "confirmar",
    texto: "Escribe **/confirmar** en el chat de Lola y manda los recordatorios de mañana en un paso.",
    accion: "Probar en el chat",
  },
  {
    id: "mencion",
    texto: "En un grupo, menciona a un agente con **@** para pedirle algo solo a él.",
    accion: "Ir a Recepción",
  },
];

/* ---------- Correo: la bandeja de hoy, resumida por Clara ---------- */

export const DEMO_CORREOS: CorreoResumido[] = [
  {
    id: "c1",
    remitente: "Insumos Médicos del Bajío",
    asunto: "Factura F-2291",
    resumen: "Factura por $8,450 de los insumos de septiembre. Vence el jueves.",
    sugerencia: "Pagarla antes del jueves. La respuesta ya está lista en tus pendientes.",
    cuando: "Hoy 08:12",
    nuevo: true,
    urgente: true,
  },
  {
    id: "c2",
    remitente: "Andrea Solís",
    asunto: "Cambio de cita",
    resumen: "Quiere pasar su cita del martes a la tarde.",
    sugerencia: "Lola ya le ofreció 17:00 o 18:30 por WhatsApp.",
    cuando: "Hoy 07:55",
    nuevo: true,
  },
  {
    id: "c3",
    remitente: "Dr. Arturo Vela",
    asunto: "Paciente recomendada",
    resumen: "Te recomienda a una paciente para valoración de manchas. Ella te escribirá esta semana.",
    sugerencia: "Avisarle a Lola para darle el primer lugar libre.",
    cuando: "Hoy 07:30",
  },
  {
    id: "c4",
    remitente: "CFE",
    asunto: "Tu recibo de luz",
    resumen: "Recibo por $2,180. Vence el 15.",
    sugerencia: "Pagarlo antes del 15.",
    cuando: "Ayer 19:20",
  },
  {
    id: "c5",
    remitente: "Software de agenda",
    asunto: "Renovación de tu suscripción",
    resumen: "Se cobran $599 el día 20, con la tarjeta de siempre.",
    sugerencia: null,
    cuando: "Ayer 10:05",
  },
];

/** Correos de muestra para probar a Clara en el ejemplo. La respuesta es de guion: aquí no se llama a la IA. */
export const DEMO_CORREOS_PRUEBA = [
  {
    etiqueta: "Paciente quiere cita",
    remitente: "Mariana Ruiz <mariana.ruiz@gmail.com>",
    asunto: "Cita para limpieza facial",
    contenido:
      "Hola, buenas tardes. Quisiera agendar una limpieza facial para la próxima semana, de preferencia martes o jueves después de las 5. ¿Tienen lugar? ¿Y cuánto cuesta? Gracias.",
    resultado: {
      resumen: "Mariana quiere una limpieza facial la próxima semana, martes o jueves después de las 5, y pregunta el precio.",
      accion: "Ofrecerle el jueves a las 17:30 y mandarle el precio de la limpieza facial.",
    },
  },
  {
    etiqueta: "Pregunta de precios",
    remitente: "Andrea Ruiz <andrea.ruiz@hotmail.com>",
    asunto: "Precio de depilación láser",
    contenido:
      "¡Hola! Vi su publicación en Instagram. ¿Cuánto cuesta el paquete de depilación láser de piernas completas? ¿Tienen promoción este mes? Y cuántas sesiones se necesitan normalmente.",
    resultado: {
      resumen: "Andrea pregunta el precio del paquete de depilación láser de piernas completas, si hay promoción y cuántas sesiones necesita.",
      accion: "Mandarle el precio del paquete y ofrecerle una valoración para saber cuántas sesiones necesita.",
    },
  },
  {
    etiqueta: "Cancelación",
    remitente: "Roberto Salinas <rsalinas@empresa.com.mx>",
    asunto: "No podré ir mañana",
    contenido:
      "Buenos días, les escribo para avisar que no podré asistir a mi consulta de mañana a las 10:00 am por un tema de trabajo. ¿Me podrían reprogramar para el viernes? Una disculpa por el aviso tan tarde.",
    resultado: {
      resumen: "Roberto no puede ir a su consulta de mañana a las 10:00 y pide pasarla al viernes.",
      accion: "Reprogramarla al viernes y confirmarle el nuevo horario.",
    },
  },
];
