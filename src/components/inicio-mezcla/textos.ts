import type { IdAgente } from "@/lib/agentes";
import type { CategoriaApp, IdApp } from "@/lib/nucleo-tipos";

/**
 * Los textos de lo nuevo de la landing combinada (vista previa en /vista-zapia): los textos
 * cortos de las escenas de siempre (sin repetir lo que dice otra sección), los casos del día a
 * día, las apps y los permisos. Son de Atendel: ejemplos de cosas que
 * sí hace (como los de /pruebalo), sin clientes, cifras ni opiniones inventadas. En español e
 * inglés (los otros idiomas usan el inglés) hasta que pase a «/», donde se mudan a src/i18n.
 */

export type Caso = { agente: IdAgente; corto: string; titulo: string; texto: string; pide: string; responde: string };

type Contenido = {
  /** El texto de la portada, corto (el equipo ya se presenta en el carrusel). */
  portada: string;
  casos: { etiqueta: string; titulo: string; probar: string; lista: Caso[] };
  privacidad: { permisosTitulo: string; permisos: { id: IdApp; que: string; activo: boolean }[]; mas: string };
  /** Escenas de siempre, más cortas y sin repetir lo que ya dice otra sección. */
  decisionesTexto: string;
  focoTextos: string[];
  equipoSub: string;
  planesTexto: string;
  /** Las apps: qué es, cómo trabaja en ellas y un pedido de ejemplo por tipo de app. */
  apps: { etiqueta: string; titulo: string; texto: (n: number) => string; usa: string; pide: string; ejemplos: Record<CategoriaApp, string> };
};

const ES: Contenido = {
  decisionesTexto: "Vigila tu WhatsApp, tu correo y tu agenda todo el día. Lo importante te lo avisa por WhatsApp o con una notificación en tu celular.",
  focoTextos: [
    "Le pides todo en un solo chat. Atendel decide a quién de su equipo le toca, lo hace en tus propias apps y te cuenta una sola vez qué hizo.",
    "Aprende tu negocio con tus Reglas, tus Procesos y su Memoria, para resolver como lo harías tú.",
  ],
  equipoSub: "Cuatro agentes, cada uno en lo suyo.",
  planesTexto: "Empieza gratis con todo el equipo.",
  apps: {
    etiqueta: "Tus apps",
    titulo: "Se conecta con las apps que ya usas",
    texto: (n) => `Hoy son ${n}. Conectas tu cuenta de cada una y Atendel trabaja ahí mismo: lee lo que necesita y, si tú lo permites, agenda, contesta y manda.`,
    usa: "Lo usa",
    pide: "Pídele",
    ejemplos: {
      correo: "¿Qué correos necesitan respuesta hoy?",
      mensajes: "¿Quién me escribió y no le he contestado?",
      agenda: "¿Qué tengo mañana?",
      reservas: "¿Quién tiene cita hoy?",
      documentos: "Resume el archivo de precios",
      clientes: "¿Quién no ha vuelto en 3 meses?",
      resenas: "¿Qué reseñas nuevas tengo?",
      pagos: "¿Cuánto vendí esta semana?",
      contabilidad: "¿Qué facturas tengo por cobrar?",
      facturacion: "¿Qué facturas recibí este mes?",
    },
  },
  portada: "Atendel ve lo que pasa en tu negocio y lo resuelve como un socio, con su equipo.",
  casos: {
    etiqueta: "En el día a día",
    titulo: "Lo que tu equipo resuelve por ti",
    probar: "Pruébalo",
    lista: [
      { agente: "lola", corto: "Contesta de noche", titulo: "Contesta aunque estés dormido", texto: "Aura contesta tu WhatsApp con tus precios y tus reglas, ofrece un horario y deja la cita en tu agenda.", pide: "Hola, ¿cuánto cuesta la limpieza facial? ¿Tienen lugar el jueves?", responde: "¡Hola! Cuesta $650. El jueves tengo a las 11:00 o a las 17:00, ¿cuál te queda?" },
      { agente: "clara", corto: "Lo urgente del correo", titulo: "Lo urgente, primero", texto: "Altair lee tu bandeja, te dice qué necesita algo de ti y te deja la respuesta lista.", pide: "¿Qué es urgente en mi correo?", responde: "Dos cosas: una factura vence mañana y Andrea pide cambiar su cita. Te dejé las respuestas listas." },
      { agente: "victor", corto: "Pide reseñas", titulo: "Que te recomienden", texto: "Rigel les escribe a tus clientes después de su cita y les pide una reseña sin sonar insistente.", pide: "Pídeles reseña a los clientes de hoy", responde: "Les dejé un mensaje a cada uno para después de su cita. ¿Los mando?" },
      { agente: "iris", corto: "Tu reporte del mes", titulo: "Tus números, en limpio", texto: "Mira arma tus reportes y documentos y te los deja en la Oficina para revisar.", pide: "Hazme el reporte de ventas del mes", responde: "Listo: ventas por semana y por servicio, y qué subió contra el mes pasado. Está en tu Oficina." },
      { agente: "lola", corto: "Citas que chocan", titulo: "Ninguna cita encimada", texto: "Antes de agendar revisa tu agenda. Si algo choca, propone otro horario.", pide: "Se me cruzaron dos citas el viernes", responde: "Le propuse a Luis el viernes a las 18:00. Te aviso cuando conteste." },
      { agente: "victor", corto: "Recupera clientes", titulo: "Que regresen", texto: "Encuentra a quien no ha vuelto y le escribe un mensaje a su medida, con tu visto bueno.", pide: "¿Quién no ha vuelto en 3 meses?", responde: "Encontré a quienes no han vuelto y te dejé un mensaje para cada uno. ¿Los revisamos?" },
    ],
  },
  privacidad: {
    permisosTitulo: "Tus permisos",
    permisos: [
      { id: "whatsapp_business", que: "Contestar a tus clientes", activo: true },
      { id: "gmail", que: "Leer y resumir correos", activo: true },
      { id: "google_calendar", que: "Crear y mover citas", activo: false },
    ],
    mas: "Cómo cuidamos tus datos",
  },
};

const EN: Contenido = {
  decisionesTexto: "It watches your WhatsApp, email and calendar all day. It tells you what matters on WhatsApp or with a notification on your phone.",
  focoTextos: [
    "You ask for everything in one chat. Atendel decides who on its team takes it, does it in your own apps and tells you once what it did.",
    "It learns your business through your Rules, your Processes and its Memory, so it handles things the way you would.",
  ],
  equipoSub: "Four agents, each with their own job.",
  planesTexto: "Start free with the whole team.",
  apps: {
    etiqueta: "Your apps",
    titulo: "It connects to the apps you already use",
    texto: (n) => `${n} today. You connect your account for each one and Atendel works right there: it reads what it needs and, if you allow it, books, replies and sends.`,
    usa: "Used by",
    pide: "Ask",
    ejemplos: {
      correo: "Which emails need a reply today?",
      mensajes: "Who wrote to me and hasn't had an answer?",
      agenda: "What do I have tomorrow?",
      reservas: "Who has an appointment today?",
      documentos: "Sum up the price list file",
      clientes: "Who hasn't come back in 3 months?",
      resenas: "What new reviews do I have?",
      pagos: "How much did I sell this week?",
      contabilidad: "Which invoices are still unpaid?",
      facturacion: "Which invoices did I get this month?",
    },
  },
  portada: "Atendel sees what's happening in your business and sorts it out like a partner, with its team.",
  casos: {
    etiqueta: "Day to day",
    titulo: "What your team handles for you",
    probar: "Try it",
    lista: [
      { agente: "lola", corto: "Answers at night", titulo: "Answers while you sleep", texto: "Aura answers your WhatsApp with your prices and rules, offers a time and puts the appointment in your calendar.", pide: "Hi, how much is a facial? Do you have room on Thursday?", responde: "Hi! It's $650. On Thursday I have 11:00 or 17:00, which works for you?" },
      { agente: "clara", corto: "Urgent email", titulo: "Urgent things first", texto: "Altair reads your inbox, tells you what needs you and leaves the reply ready.", pide: "What's urgent in my email?", responde: "Two things: an invoice is due tomorrow and Andrea wants to move her appointment. Replies are ready." },
      { agente: "victor", corto: "Ask for reviews", titulo: "Get recommended", texto: "Rigel writes to your clients after their visit and asks for a review without being pushy.", pide: "Ask today's clients for a review", responde: "I left a message for each of them for after their visit. Shall I send them?" },
      { agente: "iris", corto: "Monthly report", titulo: "Your numbers, clean", texto: "Mira builds your reports and documents and leaves them in your Office to review.", pide: "Make this month's sales report", responde: "Done: sales by week and by service, and what grew vs last month. It's in your Office." },
      { agente: "lola", corto: "Clashing bookings", titulo: "No double bookings", texto: "Before booking it checks your calendar. If something clashes, it suggests another time.", pide: "Two appointments clash on Friday", responde: "I offered Luis Friday at 18:00. I'll tell you when he replies." },
      { agente: "victor", corto: "Win clients back", titulo: "Bring them back", texto: "It finds who hasn't come back and writes them a tailored message, with your OK.", pide: "Who hasn't come back in 3 months?", responde: "I found who hasn't come back and left a message for each one. Want to review them?" },
    ],
  },
  privacidad: {
    permisosTitulo: "Your permissions",
    permisos: [
      { id: "whatsapp_business", que: "Answer your clients", activo: true },
      { id: "gmail", que: "Read and sum up email", activo: true },
      { id: "google_calendar", que: "Create and move appointments", activo: false },
    ],
    mas: "How we look after your data",
  },
};

export const contenidoMezcla = (idioma: string): Contenido => (idioma === "es" ? ES : EN);
