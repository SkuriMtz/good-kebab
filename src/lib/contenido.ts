/**
 * Textos del sitio que se usan en varias páginas (para no repetirlos).
 * Lo marcado como "ejemplo" son borradores que falta revisar.
 */

/** Las páginas del sitio, en el orden del menú y del pie. */
export const PAGINAS = [
  { href: "/", label: "Inicio" },
  { href: "/agentes", label: "Agentes" },
  { href: "/precios", label: "Precios" },
  { href: "/para-quien-es", label: "Para quién es" },
  { href: "/preguntas", label: "Preguntas" },
];

/** El chat: lo más importante, va destacado en el menú. */
export const PRUEBALO = { href: "/pruebalo", label: "Pruébalo" };

export const PASOS = [
  ["Entras con tu correo", "Sin contraseña y sin instalar nada. Desde el celular, la tablet o la computadora."],
  ["Armas tu equipo", "Eliges qué agentes trabajan contigo: atención, correo, clientes u oficina."],
  ["Les encargas trabajo", "Les escribes como a una persona. Ellos resuelven, y lo importante no sale sin tu visto bueno."],
];

export const GARANTIAS = [
  ["Solo tu cuenta", "Tus clientes, tus citas y tus números solo los ve tu negocio. Lo controla la base de datos, no una promesa."],
  ["Con tu permiso", "Tú decides qué hace cada agente por su cuenta y qué te consulta primero. Clara contesta desde tu correo con las reglas que tú le pones."],
  ["Cifrado", "Todo viaja cifrado, de tu celular o computadora hasta nuestros servidores."],
];

export const PREGUNTAS = [
  {
    p: "¿Necesito saber de tecnología?",
    r: "No. Entras con tu correo, sin contraseña, y lo usas desde el celular, la tablet o la computadora. No hay nada que instalar.",
  },
  {
    p: "¿Qué cambia entre Free, One y Max?",
    r: "Con Free trabajas con Clara, tu agente de correo, y tienes pocos mensajes al mes. One suma a Lola, tu agente de atención para WhatsApp y citas. Max desbloquea a los cuatro agentes, eliges quién está en tu equipo y tienes muchos más mensajes y respuestas más elaboradas.",
  },
  {
    p: "¿Qué funciona hoy?",
    r: "Clara ya lee y resume tu correo, y puedes hablar por chat con todo el equipo. La conexión directa de Lola con tu WhatsApp y tu agenda llega por etapas.",
  },
  {
    p: "¿Mis clientes van a saber que les contesta una inteligencia artificial?",
    r: "Tú decides cómo se presenta. Te recomendamos decirlo con claridad, y cuando una conversación necesita a una persona, Lola te avisa y te la pasa.",
  },
  {
    p: "¿Y si se equivoca?",
    r: "Puede pasar, como con cualquier persona nueva en el equipo. Por eso lo importante no sale sin tu aprobación y todo queda guardado para que lo revises.",
  },
  {
    p: "¿Qué pasa con los datos de mis pacientes?",
    r: "Son tuyos. Cada negocio solo ve lo suyo, todo viaja cifrado y no vendemos tu información a nadie.",
  },
];

/**
 * "Para quién es": cada tipo de negocio y cómo le ayuda cada agente.
 * Las tareas salen de lo que los agentes ya hacen en el sitio; la
 * introducción de cada negocio es texto de ejemplo para revisar.
 */
export const SEGMENTOS = [
  {
    id: "clinicas",
    nombre: "Clínicas",
    pastel: "durazno",
    intro: "Mucho movimiento de pacientes, citas y proveedores: el equipo se encarga de que nada se quede sin respuesta.",
    ayuda: [
      ["lola", "Contesta el WhatsApp a cualquier hora, agenda, confirma y recuerda las citas, y te avisa cuando un caso necesita a una persona."],
      ["clara", "Te resume el correo del día, lo ordena por urgencia y detecta las facturas de proveedores con su fecha límite."],
      ["victor", "Escribe a quien faltó a su cita o preguntó y no agendó, y pide reseñas después de cada consulta."],
      ["iris", "Arma el reporte mensual de citas y pacientes, y te ayuda a redactar consentimientos y cartas."],
    ],
  },
  {
    id: "esteticas",
    nombre: "Estéticas",
    pastel: "mantequilla",
    intro: "Tus clientas preguntan precios y horarios a todas horas, y lo que más vende es que regresen.",
    ayuda: [
      ["lola", "Responde precios, horarios y formas de pago por WhatsApp y aparta el lugar para cada tratamiento."],
      ["victor", "Trae de regreso a quien no viene desde hace meses con un mensaje personal, y pide su reseña después de cada cita."],
      ["iris", "Compara tus precios con los de otros negocios cercanos y te lo deja en una tabla."],
      ["clara", "Ordena tu correo y te avisa de pagos y cobros pendientes."],
    ],
  },
  {
    id: "consultorios",
    nombre: "Consultorios",
    pastel: "cielo",
    intro: "Atiendes tú mismo y no tienes tiempo de estar en el teléfono: el equipo hace la parte de recepción y oficina.",
    ayuda: [
      ["lola", "Confirma las citas del día siguiente y reagenda a quien no puede, sin que tengas que escribir un solo mensaje."],
      ["clara", "Te dice qué correo es urgente, como la recomendación de un colega o un cambio de cita, y te propone la respuesta."],
      ["iris", "Redacta documentos, cartas y resúmenes, y te explica trámites con la recomendación de confirmarlos."],
      ["victor", "Da seguimiento a quien preguntó por una consulta y no agendó."],
    ],
  },
  {
    id: "servicios",
    nombre: "Negocios de servicios",
    pastel: "menta",
    intro: "Spas, fisioterapia, nutrición y cualquier negocio que vive de agendar y de que sus clientes regresen.",
    ayuda: [
      ["lola", "Atiende a tus clientes por WhatsApp y lleva tu agenda."],
      ["victor", "Hace el seguimiento y la reactivación de clientes, y te ayuda a conseguir reseñas."],
      ["clara", "Lleva tu correo, tus facturas y tus pagos."],
      ["iris", "Investiga, compara proveedores y te arma reportes y documentos."],
    ],
  },
] as const;
