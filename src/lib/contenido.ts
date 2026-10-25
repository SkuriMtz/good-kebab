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
    p: "¿Es difícil de usar?",
    r: "No. Entras con tu correo, sin contraseña, y lo usas desde el celular, la tablet o la computadora. No hay nada que instalar.",
  },
  {
    p: "¿Sirve para mi negocio?",
    r: "Si atiendes personas por WhatsApp, correo o con citas, sí: Lola, Clara, Víctor e Iris hacen esa parte del trabajo.",
  },
  {
    p: "¿Qué incluye cada plan?",
    r: "Con Free trabajas con Clara, tu agente de correo, y tienes pocos mensajes al mes. One suma a Lola, tu agente de atención para WhatsApp y citas. Max desbloquea a los cuatro agentes, eliges quién está en tu equipo y tienes muchos más mensajes y respuestas más elaboradas.",
  },
  {
    p: "¿Qué puedo usar desde hoy?",
    r: "Clara ya lee y resume tu correo, y puedes hablar por chat con todo el equipo. La conexión directa de Lola con tu WhatsApp y tu agenda llega por etapas.",
  },
  {
    p: "¿Mis clientes sabrán que es un agente de IA?",
    r: "Tú decides cómo se presenta. Te recomendamos decirlo con claridad, y cuando una conversación necesita a una persona, Lola te avisa y te la pasa.",
  },
  {
    p: "¿Qué pasa si un agente se equivoca?",
    r: "Puede pasar, como con cualquier persona nueva en el equipo. Por eso lo importante no sale sin tu aprobación y todo queda guardado para que lo revises.",
  },
  {
    p: "¿Qué pasa con mis datos y los de mis clientes?",
    r: "Son tuyos. Cada negocio solo ve lo suyo, todo viaja cifrado y no vendemos tu información a nadie.",
  },
];

/**
 * "Para quién es": no por tipo de negocio (Atendel sirve a cualquier negocio
 * que atiende personas), sino por situación. Cada una lleva al frente al
 * agente que más ayuda en ella; las tareas salen de lo que los agentes ya hacen.
 */
export const SEGMENTOS = [
  {
    id: "citas",
    nombre: "Trabajas con citas",
    corto: "Citas",
    resumen: "Agendar, confirmar y recordar",
    pastel: "durazno",
    frente: "lola",
    intro: "Agendar, confirmar y reagendar se come el día. El equipo lo lleva y te avisa cuando algo necesita a una persona.",
    ayuda: [
      ["lola", "Contesta el WhatsApp a cualquier hora, agenda, confirma y recuerda las citas, y te avisa cuando un caso necesita a una persona."],
      ["clara", "Te dice qué correo es urgente, como un cambio de cita, y te propone la respuesta."],
      ["victor", "Escribe a quien faltó a su cita o preguntó y no agendó."],
      ["iris", "Arma el reporte mensual de citas y clientes."],
    ],
  },
  {
    id: "mensajes",
    nombre: "Te escriben a todas horas",
    corto: "Mensajes",
    resumen: "Precios, horarios y formas de pago",
    pastel: "mantequilla",
    frente: "lola",
    intro: "Precios, horarios, ubicación y formas de pago: las mismas preguntas todo el día, también de noche.",
    ayuda: [
      ["lola", "Responde precios, horarios y formas de pago por WhatsApp y aparta el lugar de cada quien."],
      ["victor", "Da seguimiento a quien preguntó y no agendó."],
      ["clara", "Ordena tu correo por urgencia y te resume lo importante del día."],
      ["iris", "Redacta documentos, cartas y resúmenes cuando los necesitas."],
    ],
  },
  {
    id: "regresan",
    nombre: "Vives de que tus clientes regresen",
    corto: "Clientes que regresan",
    resumen: "Seguimiento y reseñas",
    pastel: "cielo",
    frente: "victor",
    intro: "Lo que más vende es que vuelvan. El equipo se acuerda de cada cliente por ti.",
    ayuda: [
      ["victor", "Trae de regreso a quien no viene desde hace meses con un mensaje personal, y pide su reseña después de cada visita."],
      ["lola", "Confirma las citas del día siguiente y reagenda a quien no puede."],
      ["clara", "Te avisa de pagos y cobros pendientes."],
      ["iris", "Compara tus precios con los de otros negocios cercanos y te lo deja en una tabla."],
    ],
  },
  {
    id: "oficina",
    nombre: "El papeleo te quita tiempo",
    corto: "Papeleo",
    resumen: "Correo, facturas y documentos",
    pastel: "menta",
    frente: "iris",
    intro: "Atiendes tú y la oficina se acumula: correos, facturas, documentos y reportes.",
    ayuda: [
      ["iris", "Redacta documentos, cartas y resúmenes, arma reportes y te explica trámites con la recomendación de confirmarlos."],
      ["clara", "Te resume el correo del día, lo ordena por urgencia y detecta las facturas de proveedores con su fecha límite."],
      ["lola", "Atiende el WhatsApp mientras tú trabajas y te pasa lo que necesita a una persona."],
      ["victor", "Hace el seguimiento de clientes y te ayuda a conseguir reseñas."],
    ],
  },
] as const;
