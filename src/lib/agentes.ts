/**
 * Los 6 agentes de Atendel. Cada uno se encarga de un área del negocio
 * y hace varias cosas dentro de ella.
 */

export const IDS_AGENTES = ["clara", "lola", "victor", "oscar", "lucia", "iris"] as const;
export type IdAgente = (typeof IDS_AGENTES)[number];

export type AgenteInfo = {
  id: IdAgente;
  nombre: string;
  area: string;
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
    id: "clara",
    nombre: "Clara",
    area: "Correo",
    lema: "Pone en orden tu bandeja y te deja las respuestas listas.",
    capacidades: ["Resume tu bandeja", "Sugiere respuestas", "Prepara facturas y contratos desde el correo"],
    sugerencias: [
      "Ayúdame a contestar a un paciente que quiere cambiar su cita",
      "Escribe un correo para cobrar una factura atrasada, con tacto",
      "Hazme una plantilla de contrato de servicios",
    ],
    conectado: true,
  },
  {
    id: "lola",
    nombre: "Lola",
    area: "WhatsApp",
    lema: "Contesta a tus clientes a cualquier hora, agenda y les recuerda su cita.",
    capacidades: ["Responde dudas, precios y horarios", "Agenda citas", "Manda recordatorios"],
    sugerencias: [
      "Escribe la respuesta para alguien que pregunta precios de limpieza facial",
      "Hazme un mensaje de recordatorio de cita amable",
      "¿Cómo respondo a alguien que dice que está caro?",
    ],
  },
  {
    id: "victor",
    nombre: "Víctor",
    area: "Ventas",
    lema: "Va por las ventas: sigue prospectos, recupera clientes y ve qué se vendió.",
    capacidades: [
      "Da seguimiento a prospectos",
      "Recupera clientes que dejaron de venir",
      "Detecta a quien falta a sus citas",
      "Reporta qué se vendió y qué no",
    ],
    sugerencias: [
      "Escribe un mensaje para recuperar a clientes que no vienen hace 3 meses",
      "¿Qué hago con los pacientes que faltan sin avisar?",
      "Dame ideas para vender más los martes",
    ],
  },
  {
    id: "oscar",
    nombre: "Óscar",
    area: "Operación",
    lema: "Lleva el día a día: la agenda, el inventario y las cuentas.",
    capacidades: ["Organiza la agenda general", "Cuida el inventario", "Lleva ingresos y gastos"],
    sugerencias: [
      "Ayúdame a organizar la agenda de una semana con dos doctoras",
      "¿Cómo llevo un inventario simple de insumos?",
      "Hazme una tabla para anotar ingresos y gastos del mes",
    ],
  },
  {
    id: "lucia",
    nombre: "Lucía",
    area: "Clientes",
    lema: "Se acuerda de cada cliente y cuida que regrese contento.",
    capacidades: ["Historial de cada cliente", "Atención después de la cita", "Encuestas y reseñas"],
    sugerencias: [
      "Escribe una encuesta corta de satisfacción por WhatsApp",
      "¿Cómo respondo a una reseña negativa en Google?",
      "¿Qué datos de cada cliente me conviene guardar?",
    ],
  },
  {
    id: "iris",
    nombre: "Iris",
    area: "Investigación",
    lema: "Investiga por ti y te lo entrega en Excel o en un documento.",
    capacidades: ["Busca información", "Arma reportes", "Entrega en Excel o documento"],
    sugerencias: [
      "¿Qué debo revisar antes de comprar un equipo de láser?",
      "Explícame qué permisos necesita una clínica estética en México",
      "Compárame formas de cobrar a meses sin intereses",
    ],
  },
];

export const AGENTE_POR_ID = Object.fromEntries(AGENTES_INFO.map((a) => [a.id, a])) as Record<IdAgente, AgenteInfo>;

export function esIdAgente(v: unknown): v is IdAgente {
  return typeof v === "string" && (IDS_AGENTES as readonly string[]).includes(v);
}
