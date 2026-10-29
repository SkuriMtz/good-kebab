import type { Diccionario, Segmento } from "./es";

/**
 * The public site in English (the default language). Same shape as es.ts.
 * Plain, natural English for businesses that serve people; nothing made up,
 * and no business types named.
 */

const lista = (nombres: string[]) =>
  nombres.length <= 1 ? nombres.join("") : `${nombres.slice(0, -1).join(", ")} and ${nombres[nombres.length - 1]}`;

const segmentos: Segmento[] = [
  {
    id: "citas",
    nombre: "You work by appointment",
    corto: "Appointments",
    resumen: "Booking, confirming and reminding",
    frente: "lola",
    intro: "Booking, confirming and rescheduling eats up the day. The team handles it and lets you know when something needs a person.",
    ayuda: [
      { id: "lola", texto: "Answers WhatsApp at any hour, books, confirms and reminds appointments, and lets you know when a case needs a person." },
      { id: "clara", texto: "Tells you which emails are urgent, like a request to move an appointment, and suggests a reply." },
      { id: "victor", texto: "Writes to people who missed their appointment or asked and didn't book." },
      { id: "iris", texto: "Puts together the monthly report of appointments and clients." },
    ],
  },
  {
    id: "mensajes",
    nombre: "People message you at all hours",
    corto: "Messages",
    resumen: "Prices, hours and payment options",
    frente: "lola",
    intro: "Prices, hours, location and payment options: the same questions all day long, and at night too.",
    ayuda: [
      { id: "lola", texto: "Answers questions about prices, hours and payment options on WhatsApp and holds each person's spot." },
      { id: "victor", texto: "Follows up with people who asked and didn't book." },
      { id: "clara", texto: "Sorts your email by urgency and sums up what matters each day." },
      { id: "iris", texto: "Drafts documents, letters and summaries whenever you need them." },
    ],
  },
  {
    id: "regresan",
    nombre: "Your business runs on clients coming back",
    corto: "Returning clients",
    resumen: "Follow-ups and reviews",
    frente: "victor",
    intro: "What sells best is people coming back. The team remembers every client for you.",
    ayuda: [
      { id: "victor", texto: "Brings back people who haven't come in for months with a personal message, and asks for a review after each visit." },
      { id: "lola", texto: "Confirms the next day's appointments and reschedules anyone who can't make it." },
      { id: "clara", texto: "Lets you know about pending payments and charges." },
      { id: "iris", texto: "Compares your prices with other businesses nearby and puts it all in a table." },
    ],
  },
  {
    id: "oficina",
    nombre: "Paperwork eats your time",
    corto: "Paperwork",
    resumen: "Email, invoices and documents",
    frente: "iris",
    intro: "You're busy with clients while the office work piles up: emails, invoices, documents and reports.",
    ayuda: [
      { id: "iris", texto: "Drafts documents, letters and summaries, builds reports and walks you through procedures, with a note to confirm them." },
      { id: "clara", texto: "Sums up the day's email, sorts it by urgency and spots supplier invoices with their due dates." },
      { id: "lola", texto: "Handles WhatsApp while you work and passes you anything that needs a person." },
      { id: "victor", texto: "Follows up with clients and helps you get reviews." },
    ],
  },
];

export const en: Diccionario = {
  idioma: "en",
  meta: {
    locale: "en_US",
    tituloInicio: "Atendel — AI agents for businesses that serve people",
    descripcionInicio:
      "Lola answers your WhatsApp and books appointments, Clara organizes your email, Víctor brings your clients back and Iris handles the office work. AI agents for businesses that serve people.",
    agentes: ["Agents", "Lola, Clara, Víctor and Iris: what each Atendel agent does, how they talk and which plan includes them."],
    precios: ["Pricing", "Atendel Free is free and comes with Clara, your email agent. One adds Lola; Max, all four agents."],
    preguntas: [
      "Questions you might have",
      "How to get started, what each plan includes, how the agents work with your clients and how we protect your data.",
    ],
    paraQuien: [
      "Who it's for",
      "If you work by appointment, get messages at all hours, rely on clients coming back or lose time to paperwork: here's what Lola, Clara, Víctor and Iris do for you.",
    ],
    lista: ["Waitlist", "Leave your email and we'll let you know when your spot in Atendel opens."],
    contacto: ["Contact", "Send us your questions about Atendel, the plans or how we protect your data. We'll reply to your email."],
    entrar: ["Sign in", "Sign in to Atendel with your email, no password. If it's your first time, your account is created when you sign in, on the Free plan."],
    noEncontrada: [
      "Page not found",
      "This address doesn't exist on Atendel. Go back home or continue to the agents, pricing or questions.",
    ],
    agente: (nombre: string, area: string, lema: string) => [`${nombre} · ${area}`, `${nombre}, Atendel's ${area.toLowerCase()} agent. ${lema}`],
  },
  lista,

  barra: {
    saltar: "Skip to content",
    inicio: "Atendel, home",
    principal: "Main",
    principalCelular: "Main (mobile)",
    agentes: "Agents",
    precios: "Pricing",
    cuando: "Launch",
    preguntas: "Questions",
    pruebalo: "Try it",
    paraQuien: "Who it's for",
    entrar: "Sign in",
    tema: "Theme",
    idioma: "Language",
    unete: "Join the waitlist",
    abrir: "Open navigation",
    cerrar: "Close navigation",
  },

  tema: {
    grupo: "Theme",
    oscuro: "Dark",
    claro: "Light",
    sistema: "System",
    aClaro: "Switch to light mode",
    aOscuro: "Switch to dark mode",
    modoClaro: "Light mode",
    modoOscuro: "Dark mode",
  },

  pie: {
    aria: "Footer",
    agentes: "Agents",
    precios: "Pricing",
    preguntas: "Questions",
    contacto: "Contact",
    entrar: "Sign in",
    producto: "Product",
    paraQuien: "Who it's for",
    ayuda: "Help",
    cuenta: "Account",
    pruebalo: "Try it",
    tusDatos: "Your data",
    miPanel: "My dashboard",
    lema: "Lola, Clara, Víctor and Iris: four AI agents for your business's front desk and office.",
    sello: "Sign in with your email · no password",
    franja: "Help and data",
  },

  inicio: {
    portada: {
      etiqueta: "Your team of AI agents",
      titulo: "No client left without an answer.",
      texto:
        "Lola answers your WhatsApp and books appointments, Clara organizes your email, Víctor brings your clients back and Iris handles the office work. Nothing important goes out without your OK.",
    },
    decisiones: {
      titulo: "Never miss a message",
      texto: "Your agents reply at any hour, book and confirm appointments, and let you know when something needs a person.",
    },
    caos: {
      aria: "This is your day today",
      textos: [
        "This is your day today. WhatsApp messages, emails, appointments and to-dos scattered between your phone, a notebook and your head.",
        "You reply late because you're with a client. You forget to confirm an appointment. Someone who asked never comes back.",
        "And the paperwork piles up for the evening.",
      ],
    },
    foco: {
      titulo: "Your team, ready around the clock",
      textos: [
        "Atendel is a team of four artificial intelligence agents that work for your business.",
        "You write to them like you would to a person and they get it done: they reply, book appointments, organize your email and prepare documents.",
        "You decide what they do on their own and what they check with you first.",
      ],
    },
    globo: {
      titulo: "Grow your business, not your workload",
      texto1: "Great service shouldn't depend on being glued to your phone.",
      texto2a: "Your clients get answers and you get your time back to ",
      texto2b: "serve them better",
      texto2c: ".",
      texto3: "Sign in with your email, no password, from your phone or your computer.",
    },
    equipo: {
      titulo: "Your team",
      sub: "Four agents, each with their own job.",
      texto: "Tap any of them to see everything they do.",
    },
    planes: {
      titulo: "Plans",
      texto: "Start for free. One and Max open in stages: join the waitlist and we'll let you know.",
      cuandoTitulo: "When it launches",
      cuandoTexto: "Free is open now. One and Max are opening in stages: join the waitlist and we'll let you know when your spot opens.",
    },
    cierre: { linea1: "Your business already has someone to answer.", linea2: "Let Atendel handle it." },
  },

  carrusel: {
    region: "The four agents",
    tipo: "carousel",
    verFicha: "View profile",
    abrir: (nombre: string, cargo: string) => `${nombre}, ${cargo}: view profile`,
    anterior: (nombre: string) => `Previous: ${nombre}`,
    siguiente: (nombre: string) => `Next: ${nombre}`,
    cargo: { lola: "Front desk · WhatsApp & appointments", clara: "Email", victor: "Clients", iris: "Office" },
  },

  listaEspera: {
    titulo: "Join the waitlist",
    texto: "Leave your email and we'll let you know when your spot in Atendel opens.",
    cerrar: "Close",
    formulario: "Atendel waitlist",
    correo: "Your email",
    boton: "Join the waitlist",
    anotando: "Signing you up…",
    reintentar: "Try again",
    pruebaAgentes: "Try the agents",
    listoA: "Done. We'll write to ",
    listoB: " as soon as your spot opens.",
    corregir: "Wrong email? Fix it",
    trampa: "Don't fill in this field",
    irPruebalo: "Go to Try it",
    errores: {
      vacio: "Enter your email.",
      invalido: "Check your email: it looks like something's missing (for example, name@business.com).",
      datos: "Check your email and the form details.",
      pausa: "The waitlist opens very soon. Meanwhile, you can try the agents in Try it.",
      falla: "We couldn't save your details. Please try again in a moment.",
      conexion: "No connection. Check your internet and try again.",
    },
    pagina: {
      equipo: "Lola, Clara, Víctor and Iris",
      etiqueta: "Waitlist",
      titulo: "Sign up and we'll let you know when your spot opens",
      texto: "For businesses that serve people. All we need is your email.",
      despuesTitulo: "What happens next",
      despues: [
        { titulo: "Your email goes on the list", texto: "That's all we ask for: no phone number, no password, no business details." },
        {
          titulo: "We'll write when your spot opens",
          texto: "Atendel opens in stages: Lola's connection to your WhatsApp and calendar is rolling out little by little. We'll let you know at that email.",
        },
        {
          titulo: "Meanwhile, you can already start",
          texto: "With Atendel Free you can sign in today with your email, no password, and work with Clara on your email. And in Try it you can chat with all four.",
        },
      ],
      pruebaAgentes: "Try the agents",
      empiezaFree: "Start with Free",
      preguntar: "Would you rather ask us something first?",
      escribenos: "Write to us",
    },
  },

  agentes: {
    lola: {
      area: "Front desk",
      abarca: "WhatsApp & appointments",
      lema: "Answers your clients at any hour and keeps your appointments on track.",
      capacidades: [
        "Replies to your clients",
        "Answers common questions",
        "Books, confirms and reminds appointments",
        "Lets you know when someone wants to talk to a person",
      ],
      sugerencias: [
        "Write a reply for someone asking about prices and hours",
        "Draft a message to confirm tomorrow's appointments",
        "When should a conversation be handed to a person?",
      ],
    },
    clara: {
      area: "Email",
      abarca: "Inbox, invoices & payments",
      lema: "Reads and answers your email: urgent things first, and nothing slips through.",
      capacidades: ["Receives and sends email", "Summarizes your inbox", "Sorts it by urgency", "Spots invoices and payments"],
      sugerencias: [
        "Here's an email: tell me how urgent it is and how to reply",
        "Write a tactful email to collect an overdue invoice",
        "How should I organize my email so I never miss a payment?",
      ],
    },
    victor: {
      area: "Clients",
      abarca: "Sales & reviews",
      lema: "Brings your clients back and makes sure they recommend you.",
      capacidades: [
        "Follows up with people who asked but didn't book",
        "Wins back inactive clients",
        "Reschedules people who missed their appointment",
        "Asks for a review after each appointment",
      ],
      sugerencias: [
        "Write a message for someone who asked about a service and didn't book",
        "Write a message to win back clients who haven't come in for 3 months",
        "How do I ask for Google reviews without sounding pushy?",
      ],
    },
    iris: {
      area: "Office",
      abarca: "Research, reports & documents",
      lema: "Researches, summarizes and puts together your office reports and documents.",
      capacidades: [
        "Researches and puts it in Excel",
        "Summarizes PDFs",
        "Builds monthly reports on appointments and clients",
        "Prepares documents",
      ],
      sugerencias: [
        "What should I check before switching suppliers?",
        "Here's a contract: summarize it in 5 points",
        "Build a table for the monthly appointments report, ready for Excel",
      ],
    },
  },

  detalle: {
    lola: {
      descripcion:
        "Lola is your WhatsApp receptionist. She answers your clients right away and at any hour, handles the usual questions and manages your appointments from start to finish. When a conversation needs a person, she lets you know and hands it over.",
      funciones: [
        { titulo: "Replies right away", detalle: "Answers WhatsApp messages at any hour, in your business's tone." },
        { titulo: "Answers common questions", detalle: "Prices, hours, location, payment options and how to prepare for each service." },
        { titulo: "Books appointments", detalle: "Offers open times and holds the spot without double-booking." },
        { titulo: "Confirms and reminds", detalle: "Sends reminders before each appointment and keeps track of who confirmed." },
        { titulo: "Hands it to a person", detalle: "If there's a complaint, a sensitive question or the client asks for it, she lets you know right away." },
      ],
      canal: "WhatsApp",
      conversacion: [
        { de: "otro", quien: "Mariana", hora: "10:42", texto: "Hi! how much is the one-hour session? do you have anything thursday?" },
        { de: "agente", hora: "10:42", texto: "Hi, Mariana! The one-hour session is $850. On Thursday I have 11:00 or 4:30, which works for you?" },
        { de: "otro", quien: "Mariana", hora: "10:44", texto: "4:30 please" },
        { de: "agente", hora: "10:44", texto: "Done, see you Thursday at 4:30. I'll send you a reminder the day before." },
        { de: "nota", texto: "Appointment created: Thursday 4:30 · 1-hour session" },
      ],
    },
    clara: {
      descripcion:
        "Clara takes care of your business email. She receives and reads what comes in, tells you what's urgent and what can wait, replies from your account and makes sure no invoice or payment slips through.",
      funciones: [
        { titulo: "Summarizes your inbox", detalle: "Each email in one line: who's writing and what they need." },
        { titulo: "Sorts by urgency", detalle: "Urgent first, then today's, and promotions last." },
        { titulo: "Sends and receives email", detalle: "Replies from your own email, with your name and your business's tone." },
        { titulo: "Spots invoices and payments", detalle: "Amounts, due dates and payments received, all in one list." },
        { titulo: "You set the rules", detalle: "You decide what she answers on her own and what she checks with you before sending." },
      ],
      canal: "Email",
      conversacion: [
        {
          de: "otro",
          quien: "Andrea Solís",
          hora: "9:15",
          texto: "Hi, could I move my Tuesday appointment to the afternoon? I can't make it in the morning.",
        },
        { de: "agente", hora: "9:16", texto: "Of course, Andrea. On Tuesday I have 5:00 or 6:30, which do you prefer?" },
        { de: "otro", quien: "Andrea Solís", hora: "9:40", texto: "5:00, please. Thank you!" },
        { de: "agente", hora: "9:40", texto: "All set, Andrea: see you Tuesday at 5:00. I'll send you a reminder the day before." },
        { de: "nota", texto: "Emails sent from your account · appointment moved to Tuesday 5:00" },
      ],
    },
    victor: {
      descripcion:
        "Víctor makes sure clients come in and come back. He follows up with people who asked and didn't book, wins back people who stopped coming, reschedules no-shows and asks for a review when someone leaves happy.",
      funciones: [
        { titulo: "Follows up with people who didn't book", detalle: "Writes by name to anyone who asked and was left hanging." },
        { titulo: "Wins back inactive clients", detalle: "Finds people who stopped coming and invites them back." },
        { titulo: "Rescues no-shows", detalle: "Offers a new time to anyone who missed their appointment." },
        { titulo: "Asks for reviews", detalle: "After each appointment he asks how it went and, if they're happy, asks for a review." },
        { titulo: "Never pushy", detalle: "Personal messages, never mass or pushy promotions." },
      ],
      canal: "WhatsApp",
      conversacion: [
        {
          de: "agente",
          hora: "11:05",
          texto: "Hi, Paola. Last week you asked about the one-hour session. Shall I save you a spot? This week I have Friday at 12:00 or Saturday at 10:30.",
        },
        { de: "otro", quien: "Paola", hora: "11:20", texto: "Yes! friday works perfectly" },
        { de: "agente", hora: "11:20", texto: "Done, Paola: Friday at 12:00. I'll send you the location and a reminder the day before." },
        { de: "nota", texto: "From inquiry to booked appointment" },
      ],
    },
    iris: {
      descripcion:
        "Iris does the office work you never have time for. She researches whatever you ask and gives it to you in Excel, summarizes long PDFs, builds the monthly report on appointments and clients, and prepares documents like forms and contracts.",
      funciones: [
        { titulo: "Researches and puts it in Excel", detalle: "Compares prices, suppliers or options and hands you the table." },
        { titulo: "Summarizes PDFs", detalle: "Contracts and long documents, down to the points that matter." },
        { titulo: "Monthly report", detalle: "The month's appointments, new clients and no-shows, compared with the month before." },
        { titulo: "Prepares documents", detalle: "Forms, contracts and letters in your own templates." },
        { titulo: "Tells you how to double-check", detalle: "When something can change —prices, procedures— she tells you where to confirm it." },
      ],
      canal: "Chat with Iris",
      conversacion: [
        { de: "otro", quien: "You", texto: "How much do other businesses around here charge for a one-hour session?" },
        {
          de: "agente",
          texto: "I checked 4 businesses nearby: they charge between $590 and $990 for a one-hour session. You're at $750, right in the middle. I left the table with sources in prices-nearby.xlsx.",
        },
        { de: "otro", quien: "You", texto: "Perfect. And the September report?" },
        { de: "agente", texto: "Done: 342 appointments (18 more than August), 47 new clients and 21 no-shows. I left it in Excel and PDF." },
      ],
    },
  },

  paginaAgentes: {
    etiqueta: "Front desk · Email · Clients · Office",
    titulo: "What will you hand off today?",
    texto:
      "Lola answers your WhatsApp and books appointments, Clara handles your email, Víctor brings your clients back and Iris does the office work. Tap any of them to see their profile.",
    hablar: "Talk to the agents",
    verPrecios: "See pricing",
    chatEtiqueta: "The chat",
    chatTitulo: "Try them in the chat",
    chatTexto: "Tell them what you need, like in any chat, or start a group with the ones you want.",
    irAgente: "Go to an agent",
    verFicha: "View profile",
    abrirFicha: (nombre: string, area: string) => `${nombre}, ${area}: view profile`,
    suPagina: "Their page",
    todoLoQueHace: "Everything they do",
    vieneEn: "Included in",
    conversacionCon: (nombre: string) => `Sample conversation with ${nombre}`,
  },

  ficha: {
    cerrar: "Close profile",
    queEs: "What it is and what it's for",
    todo: "Everything they can do",
    enQuePlan: "Which plans include them",
    incluido: "Included",
    noIncluido: "Not included",
    llegaCon: (nombre: string, plan: string) => `${nombre} comes with ${plan}. Meanwhile, you can start for free with Clara.`,
    probarGratis: (nombre: string) => `Try ${nombre} for free`,
    empezarGratis: "Start for free",
    pruebaloCon: (nombre: string) => `Try it with ${nombre}`,
    suPagina: "Their page",
    verPrecios: "See pricing",
  },

  conversacion: {
    loAtiende: (nombre: string) => ` · handled by ${nombre}`,
    ejemplo: "Sample names",
    desdeTuCorreo: "from your email",
  },

  paginaAgente: {
    ruta: "Breadcrumb",
    agentes: "Agents",
    hablale: (nombre: string) => `Talk to ${nombre}`,
    verFicha: "View profile",
    conversacionEtiqueta: (canal: string) => `Sample conversation · ${canal}`,
    tituloConversacion: {
      lola: "How Lola answers a WhatsApp message",
      clara: "How Clara answers an email",
      victor: "How Víctor follows up with someone who didn't book",
      iris: "How you hand work to Iris",
    },
    queHace: "What they do",
    todoLoQueHace: (nombre: string) => `Everything ${nombre} does`,
    paraEmpezar: "To get started",
    pidele: (nombre: string) => `Ask ${nombre} for something`,
    ideas: "Ideas for what you can ask. Type them into the demo chat, like in any chat.",
    planes: "Plans",
    enQuePlan: (nombre: string) => `Which plans include ${nombre}`,
    enLosTres: (nombre: string) => `${nombre} comes with all three plans, including the free one: you can start today.`,
    llegaCon: (nombre: string, plan: string) => `${nombre} comes with ${plan}. Meanwhile, you can start for free with Clara.`,
    desdeAqui: "Starts here",
    incluye: (nombre: string) => `Includes ${nombre}`,
    noViene: "Not in this plan",
    verPreciosPlanes: "See pricing and what each plan includes",
    tuEquipo: "Your team",
    otrosTres: "The other three agents",
  },

  planes: {
    free: {
      nivel: "Free",
      precio: "$0",
      resumen: "Get to know Atendel with your email agent.",
      incluye: ["Clara, your email agent", "30 chat messages a month", "Email summaries"],
    },
    one: {
      nivel: "Mid",
      precio: null,
      resumen: "Your email and your client service.",
      incluye: [
        "Clara, your email agent",
        "Lola, your front desk agent: WhatsApp and appointments",
        "Group chats with your agents",
        "600 chat messages a month",
      ],
    },
    max: {
      nivel: "Complete",
      precio: null,
      resumen: "The whole team, for the business that never stops.",
      incluye: [
        "All 4 agents: Front desk, Email, Clients and Office",
        "You choose who's on your team",
        "Group chats with your agents",
        "3,000 chat messages a month",
        "More thorough answers",
      ],
    },
  },
  tarjetasPlanes: {
    aria: "Atendel plans",
    disponibleHoy: "Available today",
    nivel: (nivel: string) => `Atendel · ${nivel}`,
    proximamente: "Coming soon",
    agentesAria: (nombres: string) => `Agents: ${nombres}`,
    losCuatro: "All four agents",
    empiezaGratis: "Start for free",
    avisame: "Notify me when it opens",
    unete: "Join the waitlist",
    sinContrasena: "Sign in with your email, no password.",
    porAnunciar: "Price to be announced.",
    incluye: "Includes",
  },

  paginaPrecios: {
    etiqueta: "Pricing · Free, One and Max",
    titulo: "Start for free. Grow when your business needs it.",
    intro: "Free to get to know Clara, your email agent. One to add Lola for WhatsApp and appointments. Max to have all four.",
    planes: "Plans",
    compararEtiqueta: "Comparison",
    compararTitulo: "Who works with you on each plan",
    compararTexto: "Each plan adds agents and messages. Clara is on all of them; Lola comes with One; Víctor and Iris, with Max.",
    antes: "Before you decide",
    preguntasTitulo: "Questions about the plans",
    cierreTitulo: "Try them before you decide.",
    cierreTexto: "Chat with Lola, Clara, Víctor and Iris in the demo chat, or sign up to hear when One and Max open.",
    pruebaAgentes: "Try the agents",
    listaEspera: "Waitlist",
  },

  comparacion: {
    caption: "Which agents and features come with each Atendel plan",
    agenteOFuncion: "Agent or feature",
    incluido: "Included",
    noIncluido: "Not included",
    agentes: "Agents",
    enElChat: "In the chat",
    mensajesMes: "Messages per month",
    funciones: ["Group chats with your agents", "You choose who's on your team", "More thorough answers"],
  },

  preguntas: {
    etiqueta: "Help",
    titulo: "Questions you might have",
    texto: "Things you might wonder before getting started with your business.",
    temas: "Topics",
    cuidamos: "How we protect your data",
    pruebaAgentes: "Try the agents",
    precios: "Pricing",
    seguridadEtiqueta: "Your data",
    seguridadTitulo: "Each business sees only its own",
    algoMas: "Anything else about your data?",
    escribenos: "Write to us",
    noEsta: "Don't see your question?",
    pregunta: "question",
    preguntasPalabra: "questions",
    grupos: {
      empezar: {
        nombre: "Getting started",
        preguntas: [
          {
            p: "Is it hard to use?",
            r: "No. You sign in with your email, no password, and use it from your phone, tablet or computer. There's nothing to install.",
          },
          {
            p: "Will it work for my business?",
            r: "If you serve people over WhatsApp, email or by appointment, yes: Lola, Clara, Víctor and Iris take care of that part of the work.",
          },
          {
            p: "What can I use today?",
            r: "Clara already reads and summarizes your email, and you can chat with the whole team. Lola's direct connection to your WhatsApp and calendar is rolling out in stages.",
          },
        ],
      },
      planes: {
        nombre: "Plans and pricing",
        preguntas: [
          {
            p: "What does each plan include?",
            r: "With Free you work with Clara, your email agent, and get a few messages a month. One adds Lola, your front desk agent for WhatsApp and appointments. Max unlocks all four agents: you choose who's on your team, with many more messages and more thorough answers.",
          },
          {
            p: "How much does it cost?",
            r: "Atendel Free is free. Prices for Atendel One and Atendel Max haven't been announced yet: leave your email on the waitlist and we'll let you know when they open.",
          },
          { p: "Do I need a card to start?", r: "No. You sign in with your email, no password, and start working with Clara, your email agent." },
          {
            p: "What happens if I run out of messages?",
            r: "The chat lets you know you've reached your messages for the month (30 on Free, 600 on One and 3,000 on Max) and stops sending until next month, when the count starts over.",
          },
          {
            p: "How do I change plans?",
            r: "For now you can't change it from your account: One and Max are opening in stages. Join the waitlist and we'll write to you when your spot opens.",
          },
          {
            p: "Can I choose which agents I use?",
            r: "Yes, with Max: in your dashboard, under My agents, you decide who's on your team: Lola, Clara, Víctor and Iris.",
          },
        ],
      },
      clientes: {
        nombre: "With your clients",
        preguntas: [
          {
            p: "Will my clients know it's an AI agent?",
            r: "You decide how it introduces itself. We recommend saying so clearly, and when a conversation needs a person, Lola lets you know and hands it over.",
          },
          {
            p: "What if an agent makes a mistake?",
            r: "It can happen, like with anyone new on the team. That's why nothing important goes out without your approval, and everything is saved so you can review it.",
          },
        ],
      },
      datos: {
        nombre: "Your data",
        preguntas: [
          {
            p: "What happens to my data and my clients' data?",
            r: "It's yours. Each business only sees its own, everything travels encrypted and we never sell your information to anyone.",
          },
        ],
      },
    },
    garantias: [
      {
        titulo: "Only your account",
        texto: "Your clients, your appointments and your numbers are only visible to your business. The database enforces it, not a promise.",
      },
      {
        titulo: "With your permission",
        texto: "You decide what each agent does on its own and what it checks with you first. Clara replies from your email following the rules you set.",
      },
      { titulo: "Encrypted", texto: "Everything travels encrypted, from your phone or computer to our servers." },
    ],
  },

  paraQuien: {
    etiqueta: "Who it's for",
    titulo: "For businesses that serve people.",
    texto: "If your business lives on serving people, booking appointments and having clients come back, the Atendel team does that part with you.",
    hablar: "Talk to the agents",
    indice: "On this page",
    resto: "The rest of the team",
    cierreEtiqueta: "Try it",
    cierreTitulo: "Try it with your business in mind.",
    verPrecios: "See pricing",
    segmentos,
  },

  contacto: {
    etiqueta: "Contact",
    titulo: "Write to us",
    texto: "Questions about the plans, your kind of business or how we protect your data. We'll reply to your email.",
    atajosAria: "Your answer may already be here",
    atajosEtiqueta: "Maybe it's already here",
    atajos: [
      { href: "/preguntas", titulo: "Questions you might have", texto: "How to get started and what each agent does" },
      { href: "/precios", titulo: "Pricing", texto: "What Free, One and Max include" },
      { href: "/preguntas#seguridad", titulo: "Your data", texto: "How we protect your business's information" },
    ],
    formulario: {
      aria: "Contact form",
      pausa: "This form isn't taking messages yet: we're just finishing opening it. Your text is still here; please try again in a few days.",
      nombreFalta: "Enter your name.",
      correoFalta: "Enter your email so we can reply.",
      correoInvalido: "Check your email: it looks like something's missing (for example, name@business.com).",
      mensajeFalta: "Write your message.",
      mensajeLargo: (n: string) => `Your message can be up to ${n} characters.`,
      recibimos: "We got your message",
      contestamosA: "We'll reply to ",
      mientras: ". Meanwhile, you can chat with the agents in ",
      pruebalo: "Try it",
      otro: "Write another message",
      nombre: "Your name",
      negocio: "Your business (optional)",
      negocioAyuda: "Your business name and city.",
      correo: "Your email",
      correoAyuda: "We'll reply there.",
      mensaje: "Your message",
      trampa: "Don't fill in this field",
      todos: "All fields are required except your business.",
      enviando: "Sending…",
      reintentar: "Try again",
      enviar: "Send message",
    },
  },

  entrar: {
    inicio: "Atendel, home",
    correoNoValido: "That email doesn't look right. Check that it's spelled correctly.",
    variosLinks: "You asked for several links in a row. Wait a minute and try again.",
    sinConexion: "No connection. Check your internet and try again.",
    noSeEnvio: "We couldn't send the link. Please try again in a moment.",
    noInicio: "We couldn't sign you in. Request a new link and open it in this same browser.",
    escribeCorreo: "Enter your email so we can send you the link.",
    revisaCorreo: "Check your email: it looks like something's missing (for example, name@business.com).",
    tituloEnviado: "Check your email",
    titulo: "Sign in to Atendel",
    formulario: "Sign in with your email",
    correo: "Email",
    ayuda: "We'll send you a link to sign in. No password.",
    enviando: "Sending…",
    enviar: "Email me the link",
    o: "or",
    google: "Continue with Google",
    linkEnviado: "Link sent",
    mandamosA: "We sent a link to ",
    abrelo: ". Open it in this same browser to sign in.",
    noLlega: "Not there? Check Spam or Promotions. It can take a couple of minutes.",
    otroCorreo: "Use a different email",
    primeraVez: "First time? Enter your email and your account is created when you sign in, on the Free plan.",
    verPlanes: "See the plans",
  },

  noEncontrada: {
    etiqueta: "Error 404",
    titulo: "This page doesn't exist",
    texto: "The link may be mistyped, or the page may have moved.",
    volver: "Back to home",
    sigue: "Or try one of these",
    atajos: [
      { href: "/agentes", titulo: "Agents", texto: "Lola, Clara, Víctor and Iris: what each one does" },
      { href: "/precios", titulo: "Pricing", texto: "What Free, One and Max include" },
      { href: "/preguntas", titulo: "Questions you might have", texto: "How to get started and how we protect your data" },
      { href: "/pruebalo", titulo: "Try it", texto: "Chat with the agents in a sample chat" },
    ],
  },
};
