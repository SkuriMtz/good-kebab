import type { ItemOficina } from "./Oficina";

/**
 * La Oficina de ejemplo de /pruebalo (Estudio Luna): lo que el equipo dejó
 * mientras no estabas. Cifras de ejemplo, como el resto de la demostración.
 */
export function oficinaDeEjemplo(ahora: number): ItemOficina[] {
  const hace = (min: number) => new Date(ahora - min * 60_000).toISOString();
  return [
    {
      id: "o1",
      nombre: "Reporte de citas de octubre.xlsx",
      tipo: "xlsx",
      agente: "iris",
      en: hace(38),
      revision: "revisar",
      detalle: "Citas, cancelaciones y clientes nuevos, por semana.",
      vista: {
        tipo: "tabla",
        columnas: ["Semana", "Citas", "Canceladas", "Clientes nuevos"],
        filas: [
          ["1 al 5 oct", "41", "3", "6"],
          ["6 al 12 oct", "47", "2", "9"],
          ["13 al 19 oct", "44", "5", "7"],
          ["20 al 26 oct", "52", "1", "11"],
          ["27 al 31 oct", "29", "2", "4"],
          ["Total", "213", "13", "37"],
        ],
        nota: "Hoja 1 de 2. La segunda trae las citas una por una.",
      },
    },
    {
      id: "o2",
      nombre: "Presentación de servicios.pptx",
      tipo: "pptx",
      agente: "iris",
      en: hace(190),
      revision: "revisar",
      detalle: "Para mandarla a quien pregunta qué ofrecen.",
      vista: {
        tipo: "laminas",
        laminas: [
          { titulo: "Estudio Luna", puntos: ["Lo que hacemos y para quién", "Lunes a sábado, 9:00 a 19:00"] },
          { titulo: "Servicios", puntos: ["Primera visita", "Sesión de 1 hora", "Seguimiento y revisión"] },
          { titulo: "Cómo agendar", puntos: ["Por WhatsApp, a cualquier hora", "Te confirmamos un día antes"] },
        ],
      },
    },
    {
      id: "o3",
      nombre: "Facturas por pagar de noviembre.xlsx",
      tipo: "xlsx",
      agente: "clara",
      en: hace(60 * 20),
      revision: "revisar",
      detalle: "Lo que llegó a tu correo, con fecha de vencimiento.",
      vista: {
        tipo: "tabla",
        columnas: ["Proveedor", "Concepto", "Monto", "Vence"],
        filas: [
          ["Papelería Centro", "Material de oficina", "$1,280", "18 nov"],
          ["Limpieza Brillo", "Servicio mensual", "$2,400", "20 nov"],
          ["Internet", "Noviembre", "$599", "25 nov"],
          ["Total", "", "$4,279", ""],
        ],
      },
    },
    {
      id: "o4",
      nombre: "Plan para recuperar clientes.docx",
      tipo: "docx",
      agente: "victor",
      en: hace(60 * 26),
      revision: "revisar",
      detalle: "A quién escribirle, qué decirle y cuándo.",
      vista: {
        tipo: "texto",
        partes: [
          { titulo: "A quién", texto: "18 clientes que no vienen desde hace más de 3 meses y que antes venían seguido." },
          { titulo: "Qué decirles", texto: "Un saludo corto, sin promociones agresivas: preguntar cómo están y ofrecer apartarles un horario esta semana." },
          { titulo: "Cuándo", texto: "Martes y miércoles por la mañana, en dos tandas. Lola contesta a quien responda y agenda." },
        ],
      },
    },
    {
      id: "o5",
      nombre: "Resumen de la semana.pdf",
      tipo: "pdf",
      agente: "iris",
      en: hace(60 * 24 * 3),
      revision: "aprobado",
      detalle: "Citas, mensajes y correos de la semana pasada.",
      vista: {
        tipo: "texto",
        partes: [
          { titulo: "Citas", texto: "47 citas, 2 canceladas y 5 cambios de hora." },
          { titulo: "Mensajes", texto: "Lola contestó 86 WhatsApp; lo que más preguntan son horarios y precios." },
          { titulo: "Correo", texto: "Clara leyó 112 correos: 4 facturas y 2 proveedores esperan respuesta." },
        ],
      },
    },
  ];
}
