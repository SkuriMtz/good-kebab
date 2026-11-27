import type { IdAgente } from "@/lib/agentes";
import type { CategoriaApp, IdApp } from "@/lib/nucleo-tipos";

/**
 * Los textos de la landing combinada (vista previa en /vista-zapia). Tono: formal pero cercano,
 * corto y fácil para cualquiera (una idea por frase; nadie lee párrafos largos). Cada idea va
 * en una sola sección. Son de Atendel: ejemplos de cosas que sí hace (como los de /pruebalo),
 * sin clientes, cifras ni opiniones inventadas. En español e inglés (los otros idiomas usan los
 * textos de siempre) hasta que pase a «/», donde se mudan a src/i18n.
 */

export type Caso = { agente: IdAgente; corto: string; titulo: string; texto: string; pide: string; responde: string };

type Contenido = {
  /** La portada: qué es Atendel (etiqueta) y qué hace (texto). */
  portadaEtiqueta: string;
  portada: string;
  /** Las escenas de siempre, en corto. */
  decisionesTexto: string;
  caosTextos: string[];
  focoTextos: string[];
  globoTexto: string;
  equipoSub: string;
  planesTexto: string;
  cuandoTexto: string;
  garantias: { titulo: string; texto: string }[];
  casos: { probar: string; lista: Caso[] };
  privacidad: { permisosTitulo: string; permisos: { id: IdApp; que: string; activo: boolean }[]; mas: string };
  /** Las apps: qué es, cómo trabaja en ellas y un pedido de ejemplo por tipo de app. */
  apps: { etiqueta: string; titulo: string; texto: (n: number) => string; que: string; usa: string; pide: string; ejemplos: Record<CategoriaApp, string> };
};

const ES: Contenido = {
  portadaEtiqueta: "Asistente de IA para tu negocio",
  portada: "Atendel atiende tu WhatsApp, tu correo y tu agenda. Tú solo le dices qué necesitas.",
  decisionesTexto: "Está pendiente de tu negocio todo el día y te avisa cuando algo requiere tu atención.",
  caosTextos: ["Así es tu día hoy: mensajes, correos, citas y pendientes por todos lados.", "Respondes tarde, se pasa una cita y un cliente ya no regresa.", "Y el papeleo se acumula para la noche."],
  focoTextos: ["Pides todo en un mismo chat. Atendel reparte el trabajo entre su equipo y te confirma cuando está listo.", "Aprende cómo trabajas para resolver como tú lo harías."],
  globoTexto: "Entra con tu correo, sin contraseña, desde tu celular o computadora.",
  equipoSub: "Cuatro agentes, cada uno con su especialidad.",
  planesTexto: "Empieza gratis con todo el equipo.",
  cuandoTexto: "Free ya está disponible. One y Max se abrirán por etapas.",
  garantias: [
    { titulo: "Solo tu cuenta", texto: "Tu información solo la ve tu negocio." },
    { titulo: "Con tu permiso", texto: "Tú decides qué hace solo y qué te consulta antes. Los pagos siempre esperan tu aprobación." },
    { titulo: "Cifrado", texto: "Toda tu información viaja cifrada." },
  ],
  casos: {
    probar: "Pruébalo",
    lista: [
      { agente: "lola", corto: "Atención de noche", titulo: "Atiende aunque no estés", texto: "Aura responde tu WhatsApp con tus precios y agenda las citas.", pide: "Hola, ¿cuánto cuesta la limpieza facial? ¿Tienen lugar el jueves?", responde: "¡Hola! Cuesta $650. El jueves hay lugar a las 11:00 o a las 17:00. ¿Cuál prefieres?" },
      { agente: "clara", corto: "Correo urgente", titulo: "Lo urgente, primero", texto: "Altair revisa tu correo y te prepara las respuestas.", pide: "¿Qué es urgente en mi correo?", responde: "Dos cosas: una factura vence mañana y Andrea quiere cambiar su cita. Las respuestas están listas." },
      { agente: "victor", corto: "Reseñas", titulo: "Más recomendaciones", texto: "Rigel pide una reseña a tus clientes después de su visita.", pide: "Pide reseña a los clientes de hoy", responde: "Preparé un mensaje para cada uno. ¿Los envío?" },
      { agente: "iris", corto: "Reporte del mes", titulo: "Tus números, claros", texto: "Mira prepara tus reportes y documentos para que los revises.", pide: "Prepara el reporte de ventas del mes", responde: "Listo: ventas por semana y por servicio, comparadas con el mes pasado." },
      { agente: "lola", corto: "Citas encimadas", titulo: "Sin citas encimadas", texto: "Revisa tu agenda antes de agendar y propone otro horario si hace falta.", pide: "Tengo dos citas al mismo tiempo el viernes", responde: "Le propuse a Luis el viernes a las 18:00. Te aviso cuando confirme." },
      { agente: "victor", corto: "Recuperar clientes", titulo: "Que regresen", texto: "Encuentra a quien no ha vuelto y le escribe, con tu aprobación.", pide: "¿Quién no ha vuelto en 3 meses?", responde: "Encontré a quienes no han vuelto y preparé un mensaje para cada uno. ¿Los revisamos?" },
    ],
  },
  privacidad: {
    permisosTitulo: "Tus permisos",
    permisos: [
      { id: "whatsapp_business", que: "Responder a tus clientes", activo: true },
      { id: "gmail", que: "Leer y resumir correos", activo: true },
      { id: "google_calendar", que: "Crear y mover citas", activo: false },
    ],
    mas: "Cómo cuidamos tus datos",
  },
  apps: {
    etiqueta: "Tus apps",
    titulo: "Funciona con las apps que ya usas",
    texto: (n) => `${n} apps disponibles. Conecta tu cuenta y Atendel trabaja en ellas, siempre con tu permiso.`,
    que: "Qué hace",
    usa: "Quién la usa",
    pide: "Ejemplo",
    ejemplos: {
      correo: "¿Qué correos necesitan respuesta hoy?",
      mensajes: "¿Qué mensajes tengo sin responder?",
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
};

const EN: Contenido = {
  portadaEtiqueta: "AI assistant for your business",
  portada: "Atendel handles your WhatsApp, email and calendar. You just tell it what you need.",
  decisionesTexto: "It keeps an eye on your business all day and lets you know when something needs your attention.",
  caosTextos: ["This is your day today: messages, emails, appointments and to-dos everywhere.", "You reply late, an appointment slips and a client doesn't come back.", "And the paperwork piles up for the evening."],
  focoTextos: ["Ask for everything in one chat. Atendel splits the work among its team and confirms when it's done.", "It learns how you work, so it handles things the way you would."],
  globoTexto: "Sign in with your email, no password, from your phone or computer.",
  equipoSub: "Four agents, each with their own specialty.",
  planesTexto: "Start free with the whole team.",
  cuandoTexto: "Free is available now. One and Max will open in stages.",
  garantias: [
    { titulo: "Only your account", texto: "Only your business can see your information." },
    { titulo: "With your permission", texto: "You decide what it does on its own and what it checks with you first. Payments always wait for your approval." },
    { titulo: "Encrypted", texto: "All your information travels encrypted." },
  ],
  casos: {
    probar: "Try it",
    lista: [
      { agente: "lola", corto: "After hours", titulo: "Covers for you after hours", texto: "Aura answers your WhatsApp with your prices and books appointments.", pide: "Hi, how much is a facial? Do you have room on Thursday?", responde: "Hi! It's $650. On Thursday there's room at 11:00 or 17:00. Which do you prefer?" },
      { agente: "clara", corto: "Urgent email", titulo: "Urgent things first", texto: "Altair reviews your email and drafts the replies.", pide: "What's urgent in my email?", responde: "Two things: an invoice is due tomorrow and Andrea wants to move her appointment. Replies are ready." },
      { agente: "victor", corto: "Reviews", titulo: "More recommendations", texto: "Rigel asks your clients for a review after their visit.", pide: "Ask today's clients for a review", responde: "I drafted a message for each of them. Shall I send them?" },
      { agente: "iris", corto: "Monthly report", titulo: "Your numbers, clear", texto: "Mira prepares your reports and documents for you to review.", pide: "Prepare this month's sales report", responde: "Done: sales by week and by service, compared with last month." },
      { agente: "lola", corto: "Double bookings", titulo: "No double bookings", texto: "It checks your calendar before booking and suggests another time if needed.", pide: "I have two appointments at the same time on Friday", responde: "I offered Luis Friday at 18:00. I'll let you know when he confirms." },
      { agente: "victor", corto: "Win clients back", titulo: "Bring them back", texto: "It finds who hasn't come back and writes to them, with your approval.", pide: "Who hasn't come back in 3 months?", responde: "I found who hasn't come back and drafted a message for each one. Shall we review them?" },
    ],
  },
  privacidad: {
    permisosTitulo: "Your permissions",
    permisos: [
      { id: "whatsapp_business", que: "Reply to your clients", activo: true },
      { id: "gmail", que: "Read and summarize email", activo: true },
      { id: "google_calendar", que: "Create and move appointments", activo: false },
    ],
    mas: "How we protect your data",
  },
  apps: {
    etiqueta: "Your apps",
    titulo: "Works with the apps you already use",
    texto: (n) => `${n} apps available. Connect your account and Atendel works in them, always with your permission.`,
    que: "What it does",
    usa: "Who uses it",
    pide: "Example",
    ejemplos: {
      correo: "Which emails need a reply today?",
      mensajes: "Which messages haven't I answered?",
      agenda: "What do I have tomorrow?",
      reservas: "Who has an appointment today?",
      documentos: "Summarize the price list file",
      clientes: "Who hasn't come back in 3 months?",
      resenas: "What new reviews do I have?",
      pagos: "How much did I sell this week?",
      contabilidad: "Which invoices are still unpaid?",
      facturacion: "Which invoices did I get this month?",
    },
  },
};

export const contenidoMezcla = (idioma: string): Contenido => (idioma === "es" ? ES : EN);
