import type { IdAgente } from "@/lib/agentes";

/**
 * "Pídele a tu equipo": ideas de pedidos para empezar una conversación (no
 * son datos del negocio, son sugerencias). Cada tarjeta abre el chat con
 * ese pedido ya escrito y con su agente elegido. Ejemplos neutros: sirven
 * para cualquier negocio que atiende personas.
 */

export const AREAS = [
  { id: "todo", etiqueta: "Todo" },
  { id: "citas", etiqueta: "Citas", agente: "lola" },
  { id: "correo", etiqueta: "Correo", agente: "clara" },
  { id: "clientes", etiqueta: "Clientes", agente: "victor" },
  { id: "oficina", etiqueta: "Oficina", agente: "iris" },
] as const satisfies readonly { id: string; etiqueta: string; agente?: IdAgente }[];

export type IdArea = (typeof AREAS)[number]["id"];

export const esArea = (v: unknown): v is IdArea => typeof v === "string" && AREAS.some((a) => a.id === v);

export const AREA_DE_AGENTE: Record<IdAgente, Exclude<IdArea, "todo">> = { lola: "citas", clara: "correo", victor: "clientes", iris: "oficina" };

export type Pedido = {
  id: string;
  agente: IdAgente;
  titulo: string;
  /** Una línea debajo del título. */
  detalle: string;
  /** Lo que queda escrito en la caja. */
  texto: string;
  /** De dónde saca el agente lo que necesita: tu Gmail o tu WhatsApp (todavía no conectado). */
  requiere?: "gmail" | "whatsapp";
  /** En /pruebalo: la acción del guion local que contesta este pedido. */
  comando?: string;
  /** En /pruebalo: la respuesta del guion cuando ninguna acción le queda. */
  respuestaDemo?: string;
};

/**
 * Tareas sobre TU correo y TU WhatsApp: el agente ya lee lo tuyo, así que
 * no hace falta darle el texto de nada. Clara lee los resúmenes de tu Gmail (solo
 * lectura); WhatsApp todavía no está conectado: Lola y Víctor dejan el
 * mensaje listo para que lo mandes tú.
 */
export const PEDIDOS: Pedido[] = [
  {
    id: "confirmar",
    agente: "lola",
    titulo: "Confirmar citas",
    detalle: "Las de mañana, por WhatsApp",
    texto: "Confirma por WhatsApp las citas de mañana.",
    requiere: "whatsapp",
    comando: "/confirmar",
  },
  {
    id: "urgente",
    agente: "clara",
    titulo: "Correo urgente de hoy",
    detalle: "Qué contestar primero",
    texto: "¿Qué correo urgente tengo hoy?",
    requiere: "gmail",
    comando: "/resumir-correos",
  },
  {
    id: "regreso",
    agente: "victor",
    titulo: "Recuperar clientes",
    detalle: "Sin venir hace 3 meses",
    texto: "Escríbeles a los clientes que no vienen hace 3 meses.",
    requiere: "whatsapp",
    comando: "/reactivar",
  },
  {
    id: "reporte",
    agente: "iris",
    titulo: "Reporte del mes",
    detalle: "Citas y clientes, para Excel",
    texto: "Arma el reporte del mes de citas y clientes, listo para Excel.",
    comando: "/reporte",
  },
  {
    id: "precios",
    agente: "lola",
    titulo: "Contestar precios",
    detalle: "Quien preguntó por WhatsApp",
    texto: "Contesta a quien preguntó precios y horarios por WhatsApp.",
    requiere: "whatsapp",
    respuestaDemo:
      "Hoy **3 personas** preguntaron precios por WhatsApp. Les dejé lista esta respuesta, cada una con su nombre:\n\n- La sesión de 1 hora cuesta **$850**.\n- Hay lugar el **jueves 11:00** o el **viernes 10:00**.\n\n¿Se las mando o le cambias algo?",
  },
  {
    id: "resumen",
    agente: "clara",
    titulo: "Resumir mi correo",
    detalle: "Lo importante de tu bandeja",
    texto: "Resume mi correo de hoy.",
    requiere: "gmail",
    comando: "/resumir-correos",
  },
  {
    id: "seguir",
    agente: "victor",
    titulo: "Seguir a interesados",
    detalle: "Quien preguntó y no agendó",
    texto: "Escríbeles a quienes preguntaron por WhatsApp y no agendaron.",
    requiere: "whatsapp",
    comando: "/seguimiento",
  },
  {
    id: "proveedor",
    agente: "iris",
    titulo: "Comparar proveedores",
    detalle: "Antes de cambiar de uno",
    texto: "Compara a mis proveedores de insumos y dime qué conviene revisar antes de cambiar.",
    comando: "/investigar",
  },
  {
    id: "reagendar",
    agente: "lola",
    titulo: "Reagendar una cita",
    detalle: "A quien canceló, 2 horarios",
    texto: "Escríbele por WhatsApp a quien canceló su cita de mañana y ofrécele dos horarios nuevos esta semana.",
    requiere: "whatsapp",
    respuestaDemo:
      "**Rosa Peña** canceló su cita de mañana a las 10:00. Le dejé listo este mensaje:\n\n> Hola, Rosa. ¡No te preocupes! ¿Te queda mejor el jueves a las 16:30 o el viernes a las 10:00?\n\nEn cuanto conteste, le aparto el horario.",
  },
  {
    id: "cobrar",
    agente: "clara",
    titulo: "Cobrar una factura",
    detalle: "La atrasada de tu correo",
    texto: "Cobra la factura atrasada que llegó por correo: escribe la respuesta con tacto.",
    requiere: "gmail",
    comando: "/facturas",
  },
  {
    id: "resena",
    agente: "victor",
    titulo: "Pedir reseñas",
    detalle: "A quien vino esta semana",
    texto: "Pídeles una reseña a los clientes que vinieron esta semana, sin sonar insistente.",
    requiere: "whatsapp",
    respuestaDemo:
      "Esta semana vinieron **18 clientes**. Les dejé listo un mensaje corto para el día siguiente de su cita:\n\n> Hola, ¿cómo te fue? Si te gustó, nos ayudas mucho con una reseña en Google. ¡Gracias!\n\nA quien ya dejó reseña no le llega.",
  },
  {
    id: "documento",
    agente: "iris",
    titulo: "Redactar un aviso",
    detalle: "Para tus clientes, listo",
    texto: "Redacta un aviso para mis clientes sobre el horario de diciembre.",
    respuestaDemo:
      "Listo, te dejé el aviso:\n\n**Horario de diciembre**\nDel 20 al 31 de diciembre atendemos de 10:00 a 15:00. Si ya tienes cita en esos días, te escribimos para confirmarla. ¡Gracias por tu preferencia!",
  },
];

/** Los pedidos de un área (todos con "todo"). */
export function pedidosDe(area: IdArea) {
  if (area === "todo") return PEDIDOS;
  return PEDIDOS.filter((p) => AREA_DE_AGENTE[p.agente] === area);
}

/** "Buenos días" / "Buenas tardes" / "Buenas noches", con la hora de la Ciudad de México. */
export function saludoDeHora(fecha = new Date()) {
  const h = Number(new Intl.DateTimeFormat("es-MX", { hour: "numeric", hourCycle: "h23", timeZone: "America/Mexico_City" }).format(fecha));
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
}
