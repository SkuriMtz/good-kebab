/**
 * Los 4 agentes de Atendel. Cada uno se encarga de un área del negocio
 * y hace varias cosas dentro de ella.
 */

export const IDS_AGENTES = ["lola", "clara", "victor", "iris"] as const;
export type IdAgente = (typeof IDS_AGENTES)[number];

export type AgenteInfo = {
  id: IdAgente;
  nombre: string;
  area: string;
  /** Lo que junta esa área, en corto (p. ej. "WhatsApp y citas"). */
  abarca: string;
  /** Una línea: qué hace, en palabras de todos los días. */
  lema: string;
  capacidades: string[];
  /** Ideas para empezar a hablar con él en el chat. */
  sugerencias: string[];
  /** ¿Ya funciona conectado a tus herramientas? (hoy solo Correo) */
  conectado?: boolean;
};

export const AGENTES_INFO: AgenteInfo[] = [
  {
    id: "lola",
    nombre: "Lola",
    area: "Atención",
    abarca: "WhatsApp y citas",
    lema: "Contesta a tus clientes a cualquier hora y lleva tus citas.",
    capacidades: [
      "Contesta a tus clientes",
      "Resuelve preguntas frecuentes",
      "Agenda, confirma y recuerda citas",
      "Te avisa cuando alguien quiere hablar con una persona",
    ],
    sugerencias: [
      "Escribe la respuesta para alguien que pregunta precios de limpieza facial",
      "Hazme un mensaje para confirmar las citas de mañana",
      "¿Cuándo conviene pasarle la conversación a una persona?",
    ],
  },
  {
    id: "clara",
    nombre: "Clara",
    area: "Correo",
    abarca: "Bandeja, facturas y pagos",
    lema: "Recibe y contesta tu correo: lo urgente primero y nada se te pasa.",
    capacidades: ["Recibe y envía correos", "Resume tu bandeja", "La ordena por urgencia", "Detecta facturas y pagos"],
    sugerencias: [
      "Te pego un correo: dime qué tan urgente es y qué le contesto",
      "Escribe un correo para cobrar una factura atrasada, con tacto",
      "¿Cómo organizo mi correo para que no se me pase ningún pago?",
    ],
    conectado: true,
  },
  {
    id: "victor",
    nombre: "Víctor",
    area: "Clientes",
    abarca: "Ventas y reseñas",
    lema: "Trae de regreso a tus clientes y se encarga de que te recomienden.",
    capacidades: [
      "Sigue a quien preguntó y no agendó",
      "Reactiva clientes inactivos",
      "Rescata a quien faltó a su cita",
      "Pide reseñas después de cada cita",
    ],
    sugerencias: [
      "Escribe un mensaje para quien preguntó por botox y no agendó",
      "Escribe un mensaje para recuperar a clientes que no vienen hace 3 meses",
      "¿Cómo pido reseñas en Google sin sonar insistente?",
    ],
  },
  {
    id: "iris",
    nombre: "Iris",
    area: "Oficina",
    abarca: "Investigación, reportes y documentos",
    lema: "Investiga, resume y te arma los reportes y documentos de la oficina.",
    capacidades: [
      "Investiga y lo pone en Excel",
      "Resume PDFs",
      "Arma reportes mensuales de citas y clientes",
      "Prepara documentos",
    ],
    sugerencias: [
      "¿Qué debo revisar antes de comprar un equipo de láser?",
      "Te pego un contrato: resúmemelo en 5 puntos",
      "Arma una tabla para el reporte mensual de citas, lista para Excel",
    ],
  },
];

export const AGENTE_POR_ID = Object.fromEntries(AGENTES_INFO.map((a) => [a.id, a])) as Record<IdAgente, AgenteInfo>;

export function esIdAgente(v: unknown): v is IdAgente {
  return typeof v === "string" && (IDS_AGENTES as readonly string[]).includes(v);
}
