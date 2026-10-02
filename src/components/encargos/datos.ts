/**
 * Los 15 agentes de Atendel y un ejemplo de cómo resuelve cada uno un pedido
 * típico de una clínica. Los nombres, cifras y fechas son de ejemplo.
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

export type Agente = {
  nombre: string;
  descripcion: string;
  disponible?: boolean;
  pedido: string;
  pasos: string[];
  entrega: Entrega;
};

export type Grupo = { nombre: string; agentes: Agente[] };

export const GRUPOS: Grupo[] = [
  {
    nombre: "Atender",
    agentes: [
      {
        nombre: "WhatsApp",
        descripcion: "Responde, agenda y da seguimiento a tus clientes.",
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
        nombre: "Correo",
        descripcion: "Resume tus correos y te sugiere qué contestar.",
        disponible: true,
        pedido: "¿Hay algo importante en el correo?",
        pasos: [
          "Revisé 23 correos sin leer",
          "4 necesitan respuesta; 12 son promociones",
          "Te dejé una respuesta sugerida para cada uno",
        ],
        entrega: {
          tipo: "filas",
          titulo: "Correo · 4 importantes",
          filas: [
            {
              a: "Andrea Solís",
              b: "Quiere cambiar su cita del martes a la tarde.",
              c: "“Claro, Andrea. El martes tengo 17:00 o 18:30, ¿cuál prefieres?”",
            },
            {
              a: "Proveedor de insumos",
              b: "Mandó la factura de septiembre; vence el día 10.",
              c: "Págala antes del jueves para no perder el descuento.",
              alerta: true,
            },
            {
              a: "Dr. Ernesto Vela",
              b: "Te recomienda a una paciente para valoración.",
              c: "“Gracias, doctor. Puedo recibirla el lunes o el miércoles por la mañana.”",
            },
          ],
          pie: "No envía ni borra nada: tú decides qué contestar.",
        },
      },
      {
        nombre: "Redes sociales",
        descripcion: "Responde comentarios y mensajes, y te sugiere qué publicar.",
        pedido: "Contesta los comentarios de la publicación del sábado.",
        pasos: [
          "Contesté 17 comentarios y 5 mensajes directos",
          "Te pasé 1 queja para que la veas tú",
          "Te propongo qué publicar el jueves",
        ],
        entrega: {
          tipo: "chat",
          titulo: "Instagram · publicación del sábado",
          mensajes: [
            { de: "cliente", quien: "ana.lu", texto: "¿Cuánto dura el efecto del botox?" },
            {
              de: "agente",
              texto: "Hola, Ana. Normalmente entre 4 y 6 meses, depende de la zona. ¿Te mandamos horarios por mensaje?",
            },
            { de: "cliente", quien: "ro.garza", texto: "¿Atienden sábados?" },
            { de: "agente", texto: "Sí, de 9:00 a 14:00. ¿Te apartamos un lugar?" },
            { de: "nota", texto: "Para el jueves a las 19:00: un antes y después de peeling (con permiso de la paciente)" },
          ],
        },
      },
      {
        nombre: "Atención postventa",
        descripcion: "Encuestas de satisfacción, quejas y reseñas.",
        pedido: "Pregunta a los clientes de esta semana cómo les fue.",
        pasos: ["Mandé 42 encuestas por WhatsApp", "Contestaron 29", "A quienes pusieron 5 les pedí una reseña"],
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
    nombre: "Vender",
    agentes: [
      {
        nombre: "Manejo de ventas",
        descripcion: "Contacta prospectos, les da seguimiento y cierra citas o ventas.",
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
            { a: "Paola Guerrero", b: "Cita el viernes a las 12:00", etiqueta: "Cerrada" },
            { a: "Daniel Torres", b: "Cita el sábado a las 10:30", etiqueta: "Cerrada" },
            { a: "Luis Medina", b: "Pregunta si hay pagos a meses", etiqueta: "Te toca", alerta: true },
            { a: "Sofía Ramírez", b: "No ha contestado; le escribo mañana", etiqueta: "En espera" },
          ],
          pie: "Y 8 más en espera.",
        },
      },
      {
        nombre: "Revisión de ventas",
        descripcion: "Analiza qué se vendió, qué falló y hacia dónde vas.",
        pedido: "¿Cómo nos fue en septiembre?",
        pasos: ["Revisé 214 ventas", "Las comparé con agosto", "Encontré 3 cosas que conviene ver"],
        entrega: {
          tipo: "barras",
          titulo: "Septiembre · ventas por servicio",
          barras: [
            { a: "Depilación láser", valor: 58200, texto: "$58,200" },
            { a: "Limpieza facial", valor: 41650, texto: "$41,650" },
            { a: "Botox", valor: 38400, texto: "$38,400" },
            { a: "Peeling", valor: 19800, texto: "$19,800" },
            { a: "Masaje", valor: 8900, texto: "$8,900", alerta: true },
          ],
          notas: [
            "La depilación láser subió 18% contra agosto.",
            "Los martes vendes la mitad que los viernes.",
            "Masajes bajó 30%: 7 personas dejaron su paquete a la mitad.",
          ],
        },
      },
      {
        nombre: "Marketing y promociones",
        descripcion: "Te sugiere promociones para la temporada baja y las programa.",
        pedido: "Noviembre siempre viene flojo. ¿Qué hacemos?",
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
            ["Dónde", "Instagram y WhatsApp, el 2 de noviembre a las 10:00"],
          ],
          nota: "No se publica nada hasta que lo apruebes.",
          acciones: ["Aprobar", "Cambiar algo"],
        },
      },
    ],
  },
  {
    nombre: "Organizar",
    agentes: [
      {
        nombre: "Agenda y citas",
        descripcion: "Organiza horarios, evita encimes y manda recordatorios.",
        pedido: "Mañana la doctora llega a las 11. Acomoda la agenda.",
        pasos: [
          "Encontré 2 citas antes de las 11",
          "Las pasé a la tarde; las dos pacientes dijeron que sí",
          "Programé recordatorios para las 12 citas de mañana",
        ],
        entrega: {
          tipo: "agenda",
          titulo: "Mañana",
          citas: [
            { hora: "11:00", quien: "Fernanda Ríos", que: "Botox" },
            { hora: "12:30", quien: "Jorge Aguilar", que: "Láser, piernas" },
            { hora: "14:00", quien: "Mariana López", que: "Limpieza facial" },
            { hora: "16:00", antes: "9:00", quien: "Carla Díaz", que: "Valoración" },
            { hora: "17:00", antes: "10:00", quien: "Rosa Peña", que: "Peeling" },
          ],
          pie: "Recordatorios programados para hoy a las 18:00",
        },
      },
      {
        nombre: "Clientes",
        descripcion: "El historial de cada cliente y cuándo vino por última vez.",
        pedido: "¿Quién no ha vuelto en más de tres meses?",
        pasos: ["Revisé el historial de 640 clientes", "31 no vienen desde junio", "Puse primero a quienes venían seguido"],
        entrega: {
          tipo: "ficha",
          nombre: "Laura Méndez",
          detalle: "Clienta desde 2023 · 6 visitas",
          campos: [
            ["Última visita", "14 de junio, hace 110 días"],
            ["Último servicio", "Peeling químico"],
            ["Prefiere", "Las tardes, con la Dra. Ruiz"],
            ["Cumpleaños", "12 de octubre"],
          ],
          sugerencia: "Mándale su promoción de cumpleaños la próxima semana.",
          otros: ["Patricia Olvera · 98 días", "Mónica Salas · 103 días", "y 28 más"],
        },
      },
      {
        nombre: "Recordatorios y notas",
        descripcion: "Tareas pendientes, pagos y renovaciones.",
        pedido: "¿Qué tengo pendiente esta semana?",
        pasos: ["Junté tus notas, pagos y vencimientos", "Te aviso un día antes de cada uno"],
        entrega: {
          tipo: "filas",
          titulo: "Esta semana",
          filas: [
            { a: "Lunes", b: "Pagar la luz del local", c: "$2,340" },
            { a: "Miércoles", b: "Renovar la póliza del equipo láser", c: "Vence el 30", alerta: true },
            { a: "Jueves", b: "Llamar al técnico para el mantenimiento" },
            { a: "Viernes", b: "Cobrar a Karla Vega la segunda parte", c: "$4,200" },
          ],
        },
      },
      {
        nombre: "Documentos",
        descripcion: "Contratos, consentimientos y facturas que se hacen solos.",
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
          extra: "También: factura A-1043 por $1,450, enviada a su correo.",
        },
      },
    ],
  },
  {
    nombre: "Números",
    agentes: [
      {
        nombre: "Finanzas básicas",
        descripcion: "Ingresos, gastos, quién te debe y cómo va tu caja.",
        pedido: "¿Cómo cerramos septiembre?",
        pasos: ["Sumé ingresos y gastos del mes", "Revisé quién tiene pagos pendientes", "Calculé si alcanza para la nómina"],
        entrega: {
          tipo: "cifras",
          titulo: "Septiembre",
          cifras: [
            { a: "Entró", valor: "$186,400" },
            { a: "Salió", valor: "$121,900" },
            { a: "Te quedó", valor: "$64,500" },
          ],
          subtitulo: "Te deben $9,800",
          filas: [
            { a: "Karla Vega", b: "2 sesiones de láser", c: "$4,200" },
            { a: "Rosa Peña", b: "Paquete de peeling", c: "$3,000" },
            { a: "Jorge Aguilar", b: "Valoración y crema", c: "$2,600" },
          ],
          pie: "Para la nómina del 15 necesitas $48,000: sí alcanza.",
        },
      },
      {
        nombre: "Inventario",
        descripcion: "Te avisa qué se está acabando y qué no se mueve.",
        pedido: "¿Qué tengo que pedir esta semana?",
        pasos: ["Revisé 48 productos", "Los crucé con las citas de los próximos 10 días"],
        entrega: {
          tipo: "filas",
          titulo: "Inventario",
          filas: [
            { a: "Ácido hialurónico 1 ml", b: "Quedan 3 · se acaba el jueves", c: "Pide 10", nivel: 0.1, alerta: true },
            { a: "Guantes de nitrilo M", b: "Quedan 2 cajas", c: "Pide 5", nivel: 0.22 },
            { a: "Gel conductor", b: "Alcanza para 3 semanas", c: "Bien", nivel: 0.68 },
            { a: "Mascarilla de colágeno", b: "14 piezas sin vender en 60 días", c: "Ponla en promoción", nivel: 0.92 },
          ],
        },
      },
      {
        nombre: "Reportes",
        descripcion: "Un resumen semanal o mensual de tu negocio, de un vistazo.",
        pedido: "Mándame cada lunes a las 8 un resumen de la semana.",
        pasos: ["Junté agenda, ventas, inventario y redes", "Listo: te llega cada lunes a las 8:00"],
        entrega: {
          tipo: "cifras",
          titulo: "Semana del 21 al 27 de septiembre",
          cifras: [
            { a: "Citas", valor: "86", nota: "9 más que la anterior" },
            { a: "Ventas", valor: "$72,300" },
            { a: "Cancelaciones", valor: "6" },
            { a: "Clientes nuevos", valor: "11" },
          ],
          pie: "Lo más importante: el viernes se llenó y 4 personas quedaron en lista de espera.",
        },
      },
    ],
  },
  {
    nombre: "Investigar",
    agentes: [
      {
        nombre: "Investigación",
        descripcion: "Busca información y te la entrega en Excel o en un documento.",
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
    ],
  },
];

export const AGENTES = GRUPOS.flatMap((g) => g.agentes.map((a) => ({ ...a, grupo: g.nombre })));
