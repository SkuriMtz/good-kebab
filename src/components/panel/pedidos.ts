import type { IdAgente } from "@/lib/agentes";

/**
 * "Pídele a tu equipo": ideas de pedidos para empezar una conversación (no
 * son datos del negocio, son sugerencias). Cada tarjeta abre el chat con
 * ese pedido ya escrito y con su agente elegido. Ejemplos neutros: sirven
 * para cualquier negocio que atiende personas.
 *
 * `comando`: en /pruebalo, la acción del guion local que contesta ese
 * pedido (ChatDemo); sin comando, contesta el texto libre del agente.
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
  comando?: string;
};

export const PEDIDOS: Pedido[] = [
  {
    id: "confirmar",
    agente: "lola",
    titulo: "Confirmar las citas de mañana",
    detalle: "Un mensaje corto para que cada quien confirme",
    texto: "Escribe un mensaje para confirmar las citas de mañana, corto y amable.",
    comando: "/confirmar",
  },
  {
    id: "urgente",
    agente: "clara",
    titulo: "¿Qué tan urgente es este correo?",
    detalle: "Pégalo y te dice qué contestar primero",
    texto: "Te pego un correo: dime qué tan urgente es y qué le contesto.",
    comando: "/resumir-correos",
  },
  {
    id: "regreso",
    agente: "victor",
    titulo: "Traer de regreso a quien no ha vuelto",
    detalle: "Un mensaje personal, no una promoción",
    texto: "Escribe un mensaje para recuperar a clientes que no vienen hace 3 meses.",
    comando: "/reactivar",
  },
  {
    id: "reporte",
    agente: "iris",
    titulo: "El reporte del mes, para Excel",
    detalle: "Citas y clientes contra el mes pasado",
    texto: "Arma una tabla para el reporte mensual de citas, lista para Excel.",
    comando: "/reporte",
  },
  {
    id: "precios",
    agente: "lola",
    titulo: "Responder precios y horarios",
    detalle: "La respuesta lista para quien pregunta",
    texto: "Escribe la respuesta para alguien que pregunta precios y horarios por WhatsApp.",
    comando: "/agendar",
  },
  {
    id: "cobrar",
    agente: "clara",
    titulo: "Cobrar una factura atrasada",
    detalle: "Un correo firme y con tacto",
    texto: "Escribe un correo para cobrar una factura atrasada, con tacto.",
    comando: "/facturas",
  },
  {
    id: "seguir",
    agente: "victor",
    titulo: "Seguir a quien preguntó y no agendó",
    detalle: "Una segunda oportunidad, a tiempo",
    texto: "Escribe un mensaje para quien preguntó por un servicio y no agendó.",
    comando: "/seguimiento",
  },
  {
    id: "proveedor",
    agente: "iris",
    titulo: "Antes de cambiar de proveedor",
    detalle: "Lo que conviene revisar y comparar",
    texto: "¿Qué debo revisar antes de cambiar de proveedor?",
    comando: "/investigar",
  },
  {
    id: "reagendar",
    agente: "lola",
    titulo: "Reagendar sin perder la cita",
    detalle: "Dos horarios nuevos para quien no puede",
    texto: "Alguien no puede venir mañana. Escríbele para ofrecerle dos horarios nuevos esta semana.",
    comando: "/agendar",
  },
  {
    id: "bandeja",
    agente: "clara",
    titulo: "Ordenar la bandeja de entrada",
    detalle: "Para que no se te pase ningún pago",
    texto: "¿Cómo organizo mi correo para que no se me pase ningún pago?",
  },
  {
    id: "resena",
    agente: "victor",
    titulo: "Pedir una reseña sin insistir",
    detalle: "Después de cada cita, en el tono justo",
    texto: "¿Cómo pido reseñas en Google sin sonar insistente?",
  },
  {
    id: "contrato",
    agente: "iris",
    titulo: "Resumir un contrato en 5 puntos",
    detalle: "Lo importante, sin letras chiquitas",
    texto: "Te pego un contrato: resúmemelo en 5 puntos.",
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
