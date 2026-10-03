import { AGENTE_POR_ID, type AgenteInfo } from "@/lib/agentes";

/**
 * Ejemplos de cómo resuelve cada agente pedidos típicos de una clínica.
 * Los nombres, cifras y fechas son de ejemplo.
 */

export type Mensaje = { de: "cliente" | "agente" | "nota"; quien?: string; texto: string; hora?: string };
export type Fila = {
  a: string;
  b?: string;
  c?: string;
  etiqueta?: string;
  /** 0 a 1: barra de nivel (inventario). */
  nivel?: number;
  alerta?: boolean;
};

export type Entrega =
  | { tipo: "chat"; titulo: string; mensajes: Mensaje[] }
  | { tipo: "filas"; titulo: string; filas: Fila[]; pie?: string; marcas?: boolean }
  | {
      tipo: "tabla";
      titulo: string;
      columnas: string[];
      filas: string[][];
      destacar: number;
      pie: string;
      archivos: string[];
    }
  | { tipo: "barras"; titulo: string; barras: { a: string; valor: number; texto: string; alerta?: boolean }[]; notas: string[] }
  | {
      tipo: "agenda";
      titulo: string;
      citas: { hora: string; antes?: string; quien: string; que: string }[];
      pie: string;
    }
  | {
      tipo: "cifras";
      titulo: string;
      cifras: { a: string; valor: string; nota?: string }[];
      subtitulo?: string;
      filas?: Fila[];
      pie: string;
    }
  | {
      tipo: "ficha";
      nombre: string;
      detalle: string;
      campos: [string, string][];
      sugerencia: string;
      otros: string[];
    }
  | { tipo: "documento"; titulo: string; subtitulo: string; campos: [string, string][]; texto: string; extra: string }
  | { tipo: "propuesta"; titulo: string; campos: [string, string][]; nota: string; acciones: [string, string] }
  | {
      tipo: "encuesta";
      calificacion: string;
      respuestas: number;
      reparto: [string, number][];
      alerta: { quien: string; texto: string };
      pie: string;
    };

export type Tarea = { titulo: string; pedido: string; pasos: string[]; entrega: Entrega };
export type AgenteGaleria = AgenteInfo & { tareas: Tarea[] };

export const GALERIA: AgenteGaleria[] = [
  {
    ...AGENTE_POR_ID.lola,
    tareas: [
      {
        titulo: "Contestar y agendar",
        pedido: "Contesta los mensajes de hoy y agenda a quien quiera cita.",
        pasos: ["Leí 9 mensajes nuevos", "Contesté precios y horarios a 6 personas", "Agendé 2 citas sin encimarlas"],
        entrega: {
          tipo: "chat",
          titulo: "WhatsApp · Mariana López",
          mensajes: [
            { de: "cliente", hora: "10:42", texto: "Hola! cuánto cuesta la limpieza facial? tienen lugar el jueves?" },
            {
              de: "agente",
              hora: "10:42",
              texto:
                "¡Hola, Mariana! La limpieza facial profunda cuesta $850 y dura una hora. El jueves tengo 11:00 o 16:30, ¿cuál te acomoda?",
            },
            { de: "cliente", hora: "10:44", texto: "16:30 porfa" },
            {
              de: "agente",
              hora: "10:44",
              texto: "Listo, te esperamos el jueves a las 16:30. Un día antes te mando un recordatorio.",
            },
            { de: "nota", texto: "Cita creada: jueves 16:30, limpieza facial" },
          ],
        },
      },
      {
        titulo: "Confirmar y recordar",
        pedido: "Confirma las citas de mañana y recuérdaselas.",
        pasos: ["Encontré 12 citas para mañana", "Mandé 12 recordatorios por WhatsApp", "10 confirmaron; 1 pidió cambiar de hora"],
        entrega: {
          tipo: "filas",
          titulo: "Recordatorios · mañana",
          marcas: true,
          filas: [
            { a: "Fernanda Ríos", b: "11:00 · Botox", etiqueta: "Confirmó" },
            { a: "Jorge Aguilar", b: "12:30 · Láser, piernas", etiqueta: "Confirmó" },
            { a: "Carla Díaz", b: "16:00 · Pide pasar a las 17:00", etiqueta: "Te toca", alerta: true },
            { a: "Rosa Peña", b: "17:00 · Peeling", etiqueta: "Sin respuesta" },
          ],
          pie: "Y 8 más confirmadas.",
        },
      },
      {
        titulo: "Pasarte a una persona",
        pedido: "Si alguien necesita hablar con una persona, avísame.",
        pasos: [
          "Atendí 14 conversaciones",
          "Una paciente preguntó por una molestia después de su tratamiento",
          "No le di indicaciones: te avisé a ti y a la doctora",
        ],
        entrega: {
          tipo: "chat",
          titulo: "WhatsApp · Rosa Peña",
          mensajes: [
            {
              de: "cliente",
              hora: "9:12",
              texto: "Buenos días. Ayer me hicieron el peeling y hoy amanecí con la piel muy roja. ¿Es normal?",
            },
            {
              de: "agente",
              hora: "9:12",
              texto:
                "Buenos días, Rosa. Gracias por avisarnos. Eso lo tiene que revisar la Dra. Ruiz: ya le pasé tu mensaje y te escribe ella en unos minutos.",
            },
            { de: "nota", texto: "Te avisé: Rosa Peña necesita hablar con la doctora" },
          ],
        },
      },
    ],
  },
  {
    ...AGENTE_POR_ID.clara,
    tareas: [
      {
        titulo: "Ordenar por urgencia",
        pedido: "¿Hay algo importante en el correo?",
        pasos: [
          "Revisé 23 correos sin leer",
          "Los ordené por urgencia; 12 son promociones",
          "Te dejé una respuesta sugerida para cada uno",
        ],
        entrega: {
          tipo: "filas",
          titulo: "Correo · lo importante primero",
          marcas: true,
          filas: [
            {
              a: "Insumos Médicos del Bajío",
              b: "Mandó la factura de septiembre; vence el jueves.",
              c: "Págala antes del jueves para no perder el descuento.",
              etiqueta: "Urgente",
              alerta: true,
            },
            {
              a: "Andrea Solís",
              b: "Quiere cambiar su cita del martes a la tarde.",
              c: "“Claro, Andrea. El martes tengo 17:00 o 18:30, ¿cuál prefieres?”",
              etiqueta: "Hoy",
            },
            {
              a: "Dr. Ernesto Vela",
              b: "Te recomienda a una paciente para valoración.",
              c: "“Gracias, doctor. Puedo recibirla el lunes o el miércoles por la mañana.”",
              etiqueta: "Esta semana",
            },
          ],
          pie: "No envía ni borra nada: tú decides qué contestar.",
        },
      },
      {
        titulo: "Detectar facturas y pagos",
        pedido: "¿Qué facturas o pagos llegaron este mes?",
        pasos: [
          "Busqué facturas, recibos y avisos de pago",
          "Encontré 4; una vence esta semana",
          "Revisé montos y fechas límite",
        ],
        entrega: {
          tipo: "filas",
          titulo: "Facturas y pagos · octubre",
          filas: [
            { a: "Insumos Médicos del Bajío", b: "Factura F-2291 · vence el jueves", c: "$8,450", alerta: true },
            { a: "CFE", b: "Recibo de luz · vence el 15", c: "$2,180" },
            { a: "Software de agenda", b: "Se cobra solo el día 20", c: "$599" },
            { a: "Karla Vega", b: "Te pagó por transferencia · ya llegó", c: "+$4,200" },
          ],
          pie: "Por pagar este mes: $11,229.",
        },
      },
    ],
  },
  {
    ...AGENTE_POR_ID.victor,
    tareas: [
      {
        titulo: "Seguir a quien no agendó",
        pedido: "Dale seguimiento a quienes preguntaron por botox y no agendaron.",
        pasos: [
          "Encontré 12 personas de las últimas dos semanas",
          "Les escribí a cada una por su nombre",
          "Contestaron 5; 3 ya tienen cita",
        ],
        entrega: {
          tipo: "filas",
          titulo: "Seguimiento · botox",
          marcas: true,
          filas: [
            { a: "Paola Guerrero", b: "Cita el viernes a las 12:00", etiqueta: "Agendó" },
            { a: "Daniel Torres", b: "Cita el sábado a las 10:30", etiqueta: "Agendó" },
            { a: "Luis Medina", b: "Pregunta si hay pagos a meses", etiqueta: "Te toca", alerta: true },
            { a: "Sofía Ramírez", b: "No ha contestado; le escribo mañana", etiqueta: "En espera" },
          ],
          pie: "Y 8 más en espera.",
        },
      },
      {
        titulo: "Reactivar inactivos",
        pedido: "Noviembre viene flojo. Trae de regreso a los que dejaron de venir.",
        pasos: [
          "Revisé tus últimos dos años: noviembre baja 22%",
          "Busqué los servicios que más te dejan",
          "Armé una promoción y a quién mandársela",
        ],
        entrega: {
          tipo: "propuesta",
          titulo: "Noviembre de piel",
          campos: [
            ["Qué", "Limpieza facial + peeling por $1,290 (normalmente $1,700)"],
            ["Cuándo", "Del 2 al 30 de noviembre"],
            ["Para quién", "184 clientes que no vienen desde julio"],
            ["Dónde", "Por WhatsApp, el 2 de noviembre a las 10:00"],
          ],
          nota: "No se manda nada hasta que lo apruebes.",
          acciones: ["Aprobar", "Cambiar algo"],
        },
      },
      {
        titulo: "Rescatar faltas",
        pedido: "¿Quién faltó esta semana sin avisar?",
        pasos: ["Crucé la agenda con las llegadas", "4 personas no llegaron", "Les escribí para reagendar; 2 ya tienen nueva cita"],
        entrega: {
          tipo: "filas",
          titulo: "Faltas sin aviso · esta semana",
          marcas: true,
          filas: [
            { a: "Andrea Solís", b: "Faltó el martes · nueva cita el lunes 10:00", etiqueta: "Reagendada" },
            { a: "Mónica Salas", b: "Faltó el miércoles · nueva cita el jueves 17:00", etiqueta: "Reagendada" },
            { a: "Raúl Pineda", b: "Segunda falta del mes", etiqueta: "Te toca", alerta: true },
            { a: "Elena Cruz", b: "No ha contestado; le escribo mañana", etiqueta: "En espera" },
          ],
          pie: "Sugerencia: pedir anticipo a quien falte dos veces.",
        },
      },
      {
        titulo: "Pedir reseñas",
        pedido: "Pregunta a los clientes de esta semana cómo les fue.",
        pasos: [
          "Mandé 42 encuestas por WhatsApp después de su cita",
          "Contestaron 29",
          "A quienes pusieron 5 les pedí una reseña en Google",
        ],
        entrega: {
          tipo: "encuesta",
          calificacion: "4.8",
          respuestas: 29,
          reparto: [
            ["5", 24],
            ["4", 3],
            ["3", 1],
            ["2", 1],
            ["1", 0],
          ],
          alerta: { quien: "Gabriela M.", texto: "Esperó 25 minutos en recepción. Te la dejé para que la llames tú." },
          pie: "11 reseñas nuevas en Google esta semana",
        },
      },
    ],
  },
  {
    ...AGENTE_POR_ID.iris,
    tareas: [
      {
        titulo: "Investigar y pasar a Excel",
        pedido: "¿Cuánto cobran otras clínicas de la zona por depilación láser?",
        pasos: ["Revisé 11 sitios y perfiles", "Encontré precios de 4 clínicas cercanas", "Armé la tabla con las fuentes"],
        entrega: {
          tipo: "tabla",
          titulo: "Depilación láser de axilas, por sesión",
          columnas: ["Clínica", "Sesión", "Paquete"],
          filas: [
            ["Clínica A", "$590", "8 por $3,900"],
            ["Clínica B", "$690", "6 por $3,500"],
            ["Tú", "$750", "6 por $3,900"],
            ["Clínica C", "$850", "Sin paquete"],
            ["Clínica D", "$990", "6 por $4,800"],
          ],
          destacar: 2,
          pie: "Estás a la mitad: dos cobran menos y dos más.",
          archivos: ["precios-laser.xlsx", "resumen.docx"],
        },
      },
      {
        titulo: "Resumir un PDF",
        pedido: "Resúmeme el contrato del proveedor del láser.",
        pasos: [
          "Leí el PDF completo: 18 páginas",
          "Separé lo que pagas y a lo que te obligas",
          "Marqué una cláusula para revisar con tu abogado",
        ],
        entrega: {
          tipo: "filas",
          titulo: "contrato-laser.pdf · en 4 puntos",
          filas: [
            { a: "Pago", b: "$18,900 al mes durante 36 meses." },
            { a: "Mantenimiento", b: "2 visitas al año incluidas; las demás cuestan $3,500." },
            { a: "Si se descompone", b: "Lo reparan en 72 horas o te prestan otro equipo." },
            {
              a: "Renovación",
              b: "Se renueva sola si no avisas con 60 días de anticipación.",
              c: "Revísala con tu abogado.",
              alerta: true,
            },
          ],
        },
      },
      {
        titulo: "Reporte del mes",
        pedido: "Arma el reporte de septiembre: citas y clientes.",
        pasos: ["Revisé las 342 citas del mes", "Las comparé con agosto", "Lo dejé en Excel y en PDF"],
        entrega: {
          tipo: "cifras",
          titulo: "Septiembre · citas y clientes",
          cifras: [
            { a: "Citas", valor: "342", nota: "18 más que agosto" },
            { a: "Clientes nuevos", valor: "47" },
            { a: "Faltas", valor: "21", nota: "6% de las citas" },
          ],
          subtitulo: "Lo más agendado",
          filas: [
            { a: "Depilación láser", c: "96 citas" },
            { a: "Limpieza facial", c: "71 citas" },
            { a: "Botox", c: "44 citas" },
          ],
          pie: "Te llega el día 1 de cada mes, en Excel y en PDF.",
        },
      },
      {
        titulo: "Preparar documentos",
        pedido: "Prepara el consentimiento de Laura para su peeling del viernes.",
        pasos: [
          "Usé tu formato de consentimiento",
          "Llené los datos de la paciente y del tratamiento",
          "Lo dejé listo para firmar en la tablet",
        ],
        entrega: {
          tipo: "documento",
          titulo: "Consentimiento informado",
          subtitulo: "Peeling químico",
          campos: [
            ["Paciente", "Laura Méndez Ortiz"],
            ["Fecha", "Viernes, 10:00"],
            ["Atiende", "Dra. Ana Ruiz"],
          ],
          texto:
            "Declaro que se me explicó el procedimiento, sus cuidados y sus posibles molestias, y que pude hacer todas mis preguntas.",
          extra: "También: su recibo por $1,450, listo para enviar.",
        },
      },
    ],
  },
];
