import type { IdAgente } from "@/lib/agentes";
import type { IdApp } from "@/lib/nucleo-tipos";
import type { NombreDibujo } from "./Dibujos";

/**
 * Los textos de la landing de prueba (/vista-zapia): el cuerpo de Zapia
 * (sus secciones y su orden) con la cabeza de Atendel. Español e inglés (los
 * demás idiomas usan el inglés). Solo cosas que Atendel sí hace: nada de
 * clientes, cifras ni opiniones inventadas. Las conversaciones son ejemplos
 * (como en /pruebalo) y al tocarlas se abren en el chat de ejemplo.
 */

export type Color = "coral" | "azul" | "verde" | "amarillo";
export type Idea = { texto: string; dibujo: NombreDibujo };
export type Categoria = { id: string; nombre: string; quien: string; color: Color; ideas: Idea[] };
export type Caso = { agente: IdAgente; corto: string; titulo: string; texto: string; pide: string; responde: string };
export type AppConecta = { id: IdApp; titulo: string; agente: IdAgente; cosas: string[]; nota?: string };

export const COLOR_DE: Record<IdAgente, Color> = { lola: "coral", clara: "azul", victor: "verde", iris: "amarillo" };

type Textos = {
  hero: { texto: string; probar: string };
  escribe: string[];
  enviar: string;
  pidesela: string;
  globos: { quien: string; texto: string; color: Color }[];
  formas: { etiqueta: string; titulo: string; texto: string; tarjetas: { arriba: string; titulo: string; texto: string; boton: string; href: string; color: Color; dibujo: NombreDibujo }[] };
  casos: { etiqueta: string; titulo: string; texto: string; probar: string; lista: Caso[] };
  conecta: { etiqueta: string; titulo: string; texto: string; nota: string; mas: string; apps: AppConecta[] };
  avisos: { etiqueta: string; titulo: string; texto: string; lista: { agente: IdAgente; quien: string; texto: string; cuando: string }[] };
  privacidad: { etiqueta: string; titulo: string; texto: string; puntos: { titulo: string; texto: string }[]; permisosTitulo: string; permisos: { id: IdApp; que: string; activo: boolean }[]; globo: string };
  equipo: string;
  ideas: { etiqueta: string; titulo: (n: number) => string; texto: string; suerte: string; probar: string; categorias: Categoria[] };
  preguntas: { etiqueta: string; titulo: string };
  mas: { titulo: string; texto: string; tarjetas: { titulo: string; texto: string; boton: string; color: Color; dibujo: NombreDibujo; pide: string }[] };
  planes: string;
  cierre: { titulo: string; texto: string; probar: string };
};

const ES: Textos = {
  hero: {
    texto: "Atendel y su equipo atienden tu WhatsApp, tu correo y tus citas, y te avisan de lo importante. Tú solo le dices qué necesitas.",
    probar: "Pruébalo",
  },
  escribe: ["Confirma las citas de mañana", "Dime qué es urgente en mi correo", "Pide reseñas a las clientas de hoy", "Hazme el reporte de ventas del mes"],
  enviar: "Pídeselo a Atendel",
  pidesela: "Pídeselo",
  globos: [
    { quien: "Aura", texto: "Confirma las citas de mañana", color: "coral" },
    { quien: "Altair", texto: "Contesta lo urgente del correo", color: "azul" },
    { quien: "Rigel", texto: "Pide reseñas a las clientas de hoy", color: "verde" },
    { quien: "Mira", texto: "Hazme el reporte del mes", color: "amarillo" },
  ],
  formas: {
    etiqueta: "Tres formas de empezar",
    titulo: "Usa Atendel a tu manera",
    texto: "En tu compu, en tu celular o por el WhatsApp que ya usas.",
    tarjetas: [
      { arriba: "Sin instalar nada", titulo: "En tu compu", texto: "Platica con Atendel, mira a tu equipo trabajando y aprueba lo importante con un toque.", boton: "Pruébalo", href: "/pruebalo", color: "coral", dibujo: "compu" },
      { arriba: "Como una app", titulo: "En tu celular", texto: "Agrégalo a tu pantalla de inicio desde el navegador: el chat en tu bolsillo y los avisos al momento.", boton: "Entrar", href: "/entrar", color: "azul", dibujo: "celular" },
      { arriba: "Con lo que ya usas", titulo: "Por WhatsApp", texto: "Te avisa de lo importante por WhatsApp. Con tu WhatsApp Business conectado, Aura contesta a tus clientes.", boton: "Únete a la lista", href: "#unete", color: "verde", dibujo: "telefono" },
    ],
  },
  casos: {
    etiqueta: "Tu equipo en acción",
    titulo: "Para lo que de verdad te quita el día",
    texto: "Las cosas de todos los días, resueltas como las resolverías tú.",
    probar: "Pruébalo tú",
    lista: [
      { agente: "lola", corto: "Contesta de noche", titulo: "Contesta aunque estés dormido", texto: "Aura contesta tu WhatsApp con tus precios y tus reglas, ofrece una cita y la deja en tu agenda.", pide: "Hola, ¿cuánto cuesta la limpieza facial? ¿Tienen lugar el jueves?", responde: "¡Hola! Cuesta $650. El jueves tengo a las 11:00 o a las 17:00, ¿cuál te queda?" },
      { agente: "clara", corto: "Lo urgente del correo", titulo: "Lo urgente, primero", texto: "Altair lee tu bandeja, te dice qué necesita algo de ti y te deja la respuesta lista.", pide: "¿Qué es urgente en mi correo?", responde: "Dos cosas: una factura vence mañana y Andrea pide cambiar su cita. Te dejé las respuestas listas." },
      { agente: "victor", corto: "Pide reseñas", titulo: "Que te recomienden", texto: "Rigel les escribe a tus clientes después de su cita y les pide una reseña sin sonar insistente.", pide: "Pídeles reseña a las clientas de hoy", responde: "Les dejé un mensaje a cada una para después de su cita. ¿Los mando?" },
      { agente: "iris", corto: "Tu reporte del mes", titulo: "Tus números, en limpio", texto: "Mira arma tus reportes y documentos de la oficina y te los deja para revisar.", pide: "Hazme el reporte de ventas del mes", responde: "Listo: ventas por semana y por servicio, y qué subió contra el mes pasado. Te lo dejé en la Oficina." },
      { agente: "lola", corto: "Citas que chocan", titulo: "Ninguna cita encimada", texto: "Antes de agendar, revisa tu agenda. Si algo choca, te propone otro horario.", pide: "Se me cruzaron dos citas el viernes", responde: "Le propuse a Luis el viernes a las 18:00. Te aviso cuando conteste." },
      { agente: "victor", corto: "Recupera clientes", titulo: "Que regresen", texto: "Encuentra a quien no ha vuelto y le escribe un mensaje a su medida, con tu visto bueno.", pide: "¿Quién no ha vuelto en 3 meses?", responde: "Encontré a quienes no han vuelto y te dejé un mensaje para cada uno. ¿Los reviso contigo?" },
    ],
  },
  conecta: {
    etiqueta: "Cómo funciona",
    titulo: "Conecta lo que ya usas. Atendel trabaja ahí mismo",
    texto: "Correo, agenda, archivos y ventas. Cada app se conecta aparte, con su propio permiso.",
    nota: "Se conecta con tu cuenta y la quitas cuando quieras.",
    mas: "Y más apps",
    apps: [
      { id: "whatsapp_business", titulo: "WhatsApp, al día", agente: "lola", cosas: ["Contesta a tus clientes con tus precios", "Agenda y confirma citas", "Te pasa lo que necesita a una persona", "Te avisa de lo importante"], nota: "La conexión de WhatsApp Business abre por etapas." },
      { id: "gmail", titulo: "Gmail, sin pendientes", agente: "clara", cosas: ["Resume tu bandeja", "Te dice qué es urgente", "Contesta y manda con tu OK", "Detecta facturas y pagos"] },
      { id: "google_calendar", titulo: "Tu agenda, en orden", agente: "lola", cosas: ["Ve tus citas del día", "Crea, mueve o cancela citas", "Revisa que no choquen", "Te recuerda lo que viene"] },
      { id: "outlook", titulo: "Outlook, al corriente", agente: "clara", cosas: ["Lee tu Outlook o Hotmail", "Te dice qué es urgente", "Contesta con tu OK", "Detecta facturas y pagos"] },
      { id: "google_drive", titulo: "Drive, sin buscar tanto", agente: "iris", cosas: ["Lee los archivos que tú elijas", "Resume documentos largos", "Saca lo importante de un PDF", "Solo lectura"] },
      { id: "google_sheets", titulo: "Tus hojas, con sentido", agente: "iris", cosas: ["Lee tus hojas de cálculo", "Saca cuentas por ti", "Arma reportes", "Solo lectura"] },
      { id: "google_business", titulo: "Tus reseñas de Google", agente: "victor", cosas: ["Lee tus reseñas", "Te propone cómo contestarlas", "Solo lectura"] },
      { id: "shopify", titulo: "Tu tienda, a la mano", agente: "victor", cosas: ["Ve tus pedidos", "Revisa tu inventario", "Conoce a tus clientes", "Solo lectura"] },
    ],
  },
  avisos: {
    etiqueta: "Te avisa primero",
    titulo: "Lo importante, antes de que se te pase",
    texto: "Atendel revisa tu correo, tu agenda y tus chats, y te avisa por WhatsApp o en tu celular. Cada cosa con lo que sigue.",
    lista: [
      { agente: "iris", quien: "Mira", texto: "Tu plan del día: 6 citas, 2 correos que piden algo y una factura por pagar.", cuando: "8:00" },
      { agente: "lola", quien: "Aura", texto: "Dos citas chocan el viernes a las 17:00. Te propongo mover una.", cuando: "10:42" },
      { agente: "clara", quien: "Altair", texto: "La factura de tu proveedor vence mañana. Te dejé el recordatorio.", cuando: "13:15" },
      { agente: "victor", quien: "Rigel", texto: "Una clienta preguntó y no agendó. Te dejé un mensaje para escribirle.", cuando: "17:30" },
    ],
  },
  privacidad: {
    etiqueta: "Privacidad",
    titulo: "Tus datos son tuyos",
    texto: "Conectar tu correo y tu WhatsApp es un paso grande. Esto es exactamente lo que pasa.",
    puntos: [
      { titulo: "Solo tu cuenta", texto: "Tus clientes, tus citas y tus números solo los ve tu negocio." },
      { titulo: "Tú eliges, app por app", texto: "Leer y hacer cosas son permisos aparte, y quitas cualquiera cuando quieras." },
      { titulo: "Con tu permiso", texto: "Tú decides qué hace solo y qué te pregunta antes." },
      { titulo: "Cifrado", texto: "Todo viaja cifrado, de tu celular o computadora hasta nuestros servidores." },
    ],
    permisosTitulo: "Tus permisos",
    permisos: [
      { id: "whatsapp_business", que: "Contestar a tus clientes", activo: true },
      { id: "gmail", que: "Leer y resumir correos", activo: true },
      { id: "google_calendar", que: "Crear y mover citas", activo: false },
    ],
    globo: "¿Atendel manda cosas sin preguntarte? Solo lo que tú eliges. Lo de dinero, siempre te lo pregunta.",
  },
  equipo: "Tu equipo",
  ideas: {
    etiqueta: "Ideas",
    titulo: (n) => `${n} formas de empezar hoy`,
    texto: "Toca una y se abre en el chat, lista para mandar. Cámbiala como quieras.",
    suerte: "Voy a tener suerte",
    probar: "Pídeselo",
    categorias: [
      {
        id: "citas",
        nombre: "Citas",
        quien: "Aura",
        color: "coral",
        ideas: [
          { texto: "Confirma las citas de mañana", dibujo: "calendario" },
          { texto: "Recuérdale a quien faltó", dibujo: "campana" },
          { texto: "Contesta precios y horarios", dibujo: "globo" },
          { texto: "Avísame si se cruzan dos citas", dibujo: "reloj" },
        ],
      },
      {
        id: "correo",
        nombre: "Correo",
        quien: "Altair",
        color: "azul",
        ideas: [
          { texto: "Dime qué es urgente en mi correo", dibujo: "sobre" },
          { texto: "Contesta al proveedor", dibujo: "avion" },
          { texto: "Avísame de facturas por pagar", dibujo: "recibo" },
          { texto: "Resume mi bandeja de la semana", dibujo: "pila" },
        ],
      },
      {
        id: "clientes",
        nombre: "Clientes",
        quien: "Rigel",
        color: "verde",
        ideas: [
          { texto: "Pide reseñas a las clientas de hoy", dibujo: "estrella" },
          { texto: "Escríbele a quien preguntó y no agendó", dibujo: "puntos" },
          { texto: "Recupera clientes de hace 3 meses", dibujo: "iman" },
          { texto: "Felicita a mis clientes en su cumpleaños", dibujo: "regalo" },
        ],
      },
      {
        id: "oficina",
        nombre: "Oficina",
        quien: "Mira",
        color: "amarillo",
        ideas: [
          { texto: "Hazme el reporte de ventas del mes", dibujo: "grafica" },
          { texto: "Compara precios de 3 proveedores", dibujo: "lupa" },
          { texto: "Arma la presentación para mi socio", dibujo: "pizarron" },
          { texto: "Ordena mis pendientes de la semana", dibujo: "lista" },
        ],
      },
    ],
  },
  preguntas: { etiqueta: "Preguntas", titulo: "Lo que suelen preguntar" },
  mas: {
    titulo: "Atendel va más allá",
    texto: "Hace más por ti de dos formas: revisa todo cada mañana y hace solo lo que le programas.",
    tarjetas: [
      { titulo: "Revisión del día", texto: "Cada mañana revisa tu correo, tu agenda y tus chats y te deja el plan del día: lo que vence, lo que choca y lo que necesita algo de ti.", boton: "Pruébala", color: "coral", dibujo: "lista", pide: "¿Qué tengo hoy?" },
      { titulo: "Tareas", texto: "Lo que Atendel hace por ti una y otra vez, con tus palabras. Di «todos los lunes» o «el día antes de que venza» y queda hecho, siempre.", boton: "Pruébalas", color: "amarillo", dibujo: "reloj", pide: "Cada lunes a las 9 mándame el resumen de la semana" },
    ],
  },
  planes: "Planes",
  cierre: { titulo: "Deja que Atendel se encargue.", texto: "Tu socio de IA y su equipo, trabajando para tu negocio.", probar: "Pruébalo" },
};

const EN: Textos = {
  hero: {
    texto: "Atendel and its team take care of your WhatsApp, your email and your appointments, and tell you what matters. You just say what you need.",
    probar: "Try it",
  },
  escribe: ["Confirm tomorrow's appointments", "Tell me what's urgent in my email", "Ask today's clients for reviews", "Make this month's sales report"],
  enviar: "Ask Atendel",
  pidesela: "Ask for it",
  globos: [
    { quien: "Aura", texto: "Confirm tomorrow's appointments", color: "coral" },
    { quien: "Altair", texto: "Answer the urgent emails", color: "azul" },
    { quien: "Rigel", texto: "Ask today's clients for reviews", color: "verde" },
    { quien: "Mira", texto: "Make this month's report", color: "amarillo" },
  ],
  formas: {
    etiqueta: "Three ways to start",
    titulo: "Use Atendel your way",
    texto: "On your computer, on your phone or through the WhatsApp you already use.",
    tarjetas: [
      { arriba: "Nothing to install", titulo: "On your computer", texto: "Chat with Atendel, watch your team work and approve what matters with one tap.", boton: "Try it", href: "/pruebalo", color: "coral", dibujo: "compu" },
      { arriba: "Like an app", titulo: "On your phone", texto: "Add it to your home screen from the browser: the chat in your pocket and alerts right away.", boton: "Sign in", href: "/entrar", color: "azul", dibujo: "celular" },
      { arriba: "With what you use", titulo: "On WhatsApp", texto: "It tells you what matters on WhatsApp. With your WhatsApp Business connected, Aura answers your clients.", boton: "Join the waitlist", href: "#unete", color: "verde", dibujo: "telefono" },
    ],
  },
  casos: {
    etiqueta: "Your team at work",
    titulo: "For what really eats your day",
    texto: "Everyday things, handled the way you'd handle them.",
    probar: "Try it yourself",
    lista: [
      { agente: "lola", corto: "Answers at night", titulo: "Answers while you sleep", texto: "Aura answers your WhatsApp with your prices and rules, offers a slot and puts it in your calendar.", pide: "Hi, how much is a facial? Do you have room on Thursday?", responde: "Hi! It's $650. On Thursday I have 11:00 or 17:00, which works for you?" },
      { agente: "clara", corto: "Urgent email", titulo: "Urgent things first", texto: "Altair reads your inbox, tells you what needs you and leaves the reply ready.", pide: "What's urgent in my email?", responde: "Two things: an invoice is due tomorrow and Andrea wants to move her appointment. Replies are ready." },
      { agente: "victor", corto: "Ask for reviews", titulo: "Get recommended", texto: "Rigel writes to your clients after their visit and asks for a review without being pushy.", pide: "Ask today's clients for a review", responde: "I left a message for each of them for after their visit. Shall I send them?" },
      { agente: "iris", corto: "Monthly report", titulo: "Your numbers, clean", texto: "Mira builds your reports and office documents and leaves them for you to review.", pide: "Make this month's sales report", responde: "Done: sales by week and by service, and what grew vs last month. It's in your Office." },
      { agente: "lola", corto: "Clashing bookings", titulo: "No double bookings", texto: "Before booking, it checks your calendar. If something clashes, it suggests another time.", pide: "Two appointments clash on Friday", responde: "I offered Luis Friday at 18:00. I'll tell you when he replies." },
      { agente: "victor", corto: "Win clients back", titulo: "Bring them back", texto: "It finds who hasn't come back and writes them a tailored message, with your OK.", pide: "Who hasn't come back in 3 months?", responde: "I found who hasn't come back and left a message for each one. Want to review them with me?" },
    ],
  },
  conecta: {
    etiqueta: "How it works",
    titulo: "Connect what you already use. Atendel works right there",
    texto: "Email, calendar, files and sales. Each app connects separately, with its own permission.",
    nota: "It connects with your account and you remove it whenever you want.",
    mas: "And more apps",
    apps: [
      { id: "whatsapp_business", titulo: "WhatsApp, up to date", agente: "lola", cosas: ["Answers clients with your prices", "Books and confirms appointments", "Hands you what needs a person", "Tells you what matters"], nota: "The WhatsApp Business connection is rolling out in stages." },
      { id: "gmail", titulo: "Gmail, no backlog", agente: "clara", cosas: ["Sums up your inbox", "Tells you what's urgent", "Replies and sends with your OK", "Spots bills and payments"] },
      { id: "google_calendar", titulo: "Your calendar, in order", agente: "lola", cosas: ["Sees today's appointments", "Creates, moves or cancels", "Checks nothing clashes", "Reminds you what's next"] },
      { id: "outlook", titulo: "Outlook, caught up", agente: "clara", cosas: ["Reads your Outlook or Hotmail", "Tells you what's urgent", "Replies with your OK", "Spots bills and payments"] },
      { id: "google_drive", titulo: "Drive, less searching", agente: "iris", cosas: ["Reads the files you choose", "Sums up long documents", "Pulls what matters from a PDF", "Read only"] },
      { id: "google_sheets", titulo: "Your sheets, making sense", agente: "iris", cosas: ["Reads your spreadsheets", "Does the math for you", "Builds reports", "Read only"] },
      { id: "google_business", titulo: "Your Google reviews", agente: "victor", cosas: ["Reads your reviews", "Suggests how to reply", "Read only"] },
      { id: "shopify", titulo: "Your store, at hand", agente: "victor", cosas: ["Sees your orders", "Checks your inventory", "Knows your customers", "Read only"] },
    ],
  },
  avisos: {
    etiqueta: "It tells you first",
    titulo: "What matters, before it slips by",
    texto: "Atendel checks your email, calendar and chats, and tells you on WhatsApp or on your phone. Each with what comes next.",
    lista: [
      { agente: "iris", quien: "Mira", texto: "Your plan for today: 6 appointments, 2 emails that need you and a bill to pay.", cuando: "8:00" },
      { agente: "lola", quien: "Aura", texto: "Two appointments clash on Friday at 17:00. I suggest moving one.", cuando: "10:42" },
      { agente: "clara", quien: "Altair", texto: "Your supplier's invoice is due tomorrow. I set a reminder.", cuando: "13:15" },
      { agente: "victor", quien: "Rigel", texto: "A client asked and didn't book. I left you a message to send her.", cuando: "17:30" },
    ],
  },
  privacidad: {
    etiqueta: "Privacy",
    titulo: "Your data is yours",
    texto: "Connecting your email and WhatsApp is a big step. This is exactly what happens.",
    puntos: [
      { titulo: "Only your account", texto: "Your clients, appointments and numbers are seen only by your business." },
      { titulo: "You choose, app by app", texto: "Reading and doing things are separate permissions, and you can remove any of them." },
      { titulo: "With your permission", texto: "You decide what it does on its own and what it asks first." },
      { titulo: "Encrypted", texto: "Everything travels encrypted, from your phone or computer to our servers." },
    ],
    permisosTitulo: "Your permissions",
    permisos: [
      { id: "whatsapp_business", que: "Answer your clients", activo: true },
      { id: "gmail", que: "Read and sum up email", activo: true },
      { id: "google_calendar", que: "Create and move appointments", activo: false },
    ],
    globo: "Does Atendel send things without asking? Only what you choose. Anything with money, it always asks.",
  },
  equipo: "Your team",
  ideas: {
    etiqueta: "Ideas",
    titulo: (n) => `${n} ways to start today`,
    texto: "Tap one and it opens in the chat, ready to send. Change it however you like.",
    suerte: "I'm feeling lucky",
    probar: "Ask for it",
    categorias: [
      {
        id: "citas",
        nombre: "Appointments",
        quien: "Aura",
        color: "coral",
        ideas: [
          { texto: "Confirm tomorrow's appointments", dibujo: "calendario" },
          { texto: "Remind whoever missed theirs", dibujo: "campana" },
          { texto: "Answer prices and hours", dibujo: "globo" },
          { texto: "Warn me if two bookings clash", dibujo: "reloj" },
        ],
      },
      {
        id: "correo",
        nombre: "Email",
        quien: "Altair",
        color: "azul",
        ideas: [
          { texto: "Tell me what's urgent in my email", dibujo: "sobre" },
          { texto: "Reply to the supplier", dibujo: "avion" },
          { texto: "Warn me about bills to pay", dibujo: "recibo" },
          { texto: "Sum up my inbox this week", dibujo: "pila" },
        ],
      },
      {
        id: "clientes",
        nombre: "Clients",
        quien: "Rigel",
        color: "verde",
        ideas: [
          { texto: "Ask today's clients for reviews", dibujo: "estrella" },
          { texto: "Follow up with who asked and didn't book", dibujo: "puntos" },
          { texto: "Win back clients from 3 months ago", dibujo: "iman" },
          { texto: "Wish my clients a happy birthday", dibujo: "regalo" },
        ],
      },
      {
        id: "oficina",
        nombre: "Office",
        quien: "Mira",
        color: "amarillo",
        ideas: [
          { texto: "Make this month's sales report", dibujo: "grafica" },
          { texto: "Compare 3 suppliers' prices", dibujo: "lupa" },
          { texto: "Build the deck for my partner", dibujo: "pizarron" },
          { texto: "Sort my to-dos for the week", dibujo: "lista" },
        ],
      },
    ],
  },
  preguntas: { etiqueta: "Questions", titulo: "What people usually ask" },
  mas: {
    titulo: "Atendel goes further",
    texto: "It does more for you in two ways: it checks everything each morning and does on its own what you schedule.",
    tarjetas: [
      { titulo: "Daily review", texto: "Every morning it checks your email, calendar and chats and leaves you the day's plan: what's due, what clashes and what needs you.", boton: "Try it", color: "coral", dibujo: "lista", pide: "What do I have today?" },
      { titulo: "Tasks", texto: "What Atendel does for you again and again, in your words. Say “every Monday” or “the day before it's due” and it's done, always.", boton: "Try them", color: "amarillo", dibujo: "reloj", pide: "Every Monday at 9 send me the week's summary" },
    ],
  },
  planes: "Plans",
  cierre: { titulo: "Let Atendel handle it.", texto: "Your AI partner and its team, working for your business.", probar: "Try it" },
};

export const textosZapia = (idioma: string): Textos => (idioma === "es" ? ES : EN);
