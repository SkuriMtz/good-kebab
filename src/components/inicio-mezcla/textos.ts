import type { IdAgente } from "@/lib/agentes";
import type { IdApp } from "@/lib/nucleo-tipos";
import type { NombreDibujo } from "./Dibujos";

/**
 * Los textos de lo nuevo de la landing combinada (vista previa en /vista-zapia). Son de
 * Atendel: ejemplos de cosas que sí hace (como los de /pruebalo), sin clientes, cifras ni
 * opiniones inventadas. La caja (A) está en los 7 idiomas; lo demás, en español e inglés (los
 * otros idiomas usan el inglés) hasta que pase a «/», donde todo se muda a src/i18n.
 */

type TextosMezcla = {
  /** Lo que se lee al tocar la caja (para lectores de pantalla). */
  pidele: string;
  /** Los pedidos que la caja escribe sola, uno tras otro. */
  ejemplos: string[];
};

const TEXTOS: Record<string, TextosMezcla> = {
  es: {
    pidele: "Pídeselo a Atendel",
    ejemplos: ["Confirma las citas de mañana", "¿Qué es urgente en mi correo?", "Pídeles reseña a los clientes de hoy", "Hazme el reporte de ventas del mes"],
  },
  en: {
    pidele: "Ask Atendel",
    ejemplos: ["Confirm tomorrow's appointments", "What's urgent in my email?", "Ask today's clients for a review", "Make this month's sales report"],
  },
  pt: {
    pidele: "Peça ao Atendel",
    ejemplos: ["Confirme os agendamentos de amanhã", "O que é urgente no meu e-mail?", "Peça avaliação aos clientes de hoje", "Faça o relatório de vendas do mês"],
  },
  fr: {
    pidele: "Demandez à Atendel",
    ejemplos: ["Confirme les rendez-vous de demain", "Qu'est-ce qui est urgent dans mes e-mails ?", "Demande un avis aux clients du jour", "Fais le rapport des ventes du mois"],
  },
  de: {
    pidele: "Frag Atendel",
    ejemplos: ["Bestätige die Termine für morgen", "Was ist in meinen E-Mails dringend?", "Bitte die Kunden von heute um eine Bewertung", "Erstelle den Umsatzbericht des Monats"],
  },
  it: {
    pidele: "Chiedilo ad Atendel",
    ejemplos: ["Conferma gli appuntamenti di domani", "Cosa c'è di urgente nella mia email?", "Chiedi una recensione ai clienti di oggi", "Prepara il report vendite del mese"],
  },
  zh: {
    pidele: "交给 Atendel",
    ejemplos: ["确认明天的预约", "我的邮件里有什么急事？", "请今天的客人留个评价", "做一份本月销售报告"],
  },
};

export const textosMezcla = (idioma: string): TextosMezcla => TEXTOS[idioma] ?? TEXTOS.en;

export type Caso = { agente: IdAgente; corto: string; titulo: string; texto: string; pide: string; responde: string };
export type AppQueHace = { id: IdApp; agente: IdAgente; titulo: string; cosas: string[]; nota?: string };
export type Idea = { texto: string; dibujo: NombreDibujo };

type Contenido = {
  avisos: { aria: string; lista: { agente: IdAgente; cuando: string; texto: string }[] };
  encargos: { etiqueta: string; tu: string; encarga: string; trabajando: string; listo: string; escenas: { pide: string; tareas: { agente: IdAgente; que: string }[] }[] };
  casos: { etiqueta: string; titulo: string; texto: string; probar: string; lista: Caso[] };
  formas: { etiqueta: string; lista: { dibujo: NombreDibujo; titulo: string; texto: string; boton: string; href: string | null }[] };
  apps: { etiqueta: string; texto: string; nota: string; todas: string; lista: AppQueHace[] };
  ideas: { etiqueta: string; titulo: string; texto: string; sorprendeme: string; probar: string; categorias: { agente: IdAgente; nombre: string; ideas: Idea[] }[] };
  privacidad: { permisosTitulo: string; ejemplo: string; permisos: { id: IdApp; que: string; activo: boolean }[]; globo: string; mas: string };
};

const ES: Contenido = {
  avisos: {
    aria: "Ejemplos de avisos de tu equipo",
    lista: [
      { agente: "iris", cuando: "8:00", texto: "Tu plan de hoy: 6 citas, 2 correos que piden algo de ti y una factura por pagar." },
      { agente: "lola", cuando: "10:42", texto: "Una clienta pidió cita el jueves a las 17:00. Ya quedó en tu agenda." },
      { agente: "clara", cuando: "13:15", texto: "La factura del proveedor vence mañana. Te dejé la respuesta lista para tu OK." },
      { agente: "victor", cuando: "17:30", texto: "Alguien preguntó precios y no agendó. Te dejé un mensaje para escribirle." },
    ],
  },
  encargos: {
    etiqueta: "Así reparte el trabajo",
    tu: "Tú",
    encarga: "Atendel le encarga a",
    trabajando: "Trabajando",
    listo: "Listo",
    escenas: [
      { pide: "Confirma las citas de mañana y dime qué es urgente en el correo", tareas: [{ agente: "lola", que: "Confirmar las citas de mañana" }, { agente: "clara", que: "Separar lo urgente del correo" }] },
      { pide: "Pídeles reseña a los clientes de hoy y hazme el reporte del mes", tareas: [{ agente: "victor", que: "Pedir reseña a los clientes de hoy" }, { agente: "iris", que: "Armar el reporte de ventas del mes" }] },
      { pide: "Contesta al proveedor y mueve la cita de Luis al viernes", tareas: [{ agente: "clara", que: "Contestar al proveedor" }, { agente: "lola", que: "Mover la cita de Luis al viernes" }] },
    ],
  },
  casos: {
    etiqueta: "En el día a día",
    titulo: "Lo que tu equipo resuelve por ti",
    texto: "Las cosas de todos los días, resueltas como las resolverías tú.",
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
  formas: {
    etiqueta: "Úsalo donde estés",
    lista: [
      { dibujo: "compu", titulo: "En tu computadora", texto: "Sin instalar nada: el chat, tu equipo y lo que espera tu OK.", boton: "Pruébalo", href: "/pruebalo" },
      { dibujo: "celular", titulo: "En tu celular", texto: "Instálalo como app desde el navegador y recibe los avisos al momento.", boton: "Entrar", href: "/entrar" },
      { dibujo: "telefono", titulo: "Por WhatsApp", texto: "Te avisa de lo importante. Con tu WhatsApp Business, Aura contesta a tus clientes.", boton: "Únete a la lista", href: null },
    ],
  },
  apps: {
    etiqueta: "Qué hace en cada una",
    texto: "Toca una app para ver qué hace Atendel ahí.",
    nota: "Cada app se conecta aparte, con su propio permiso, y la quitas cuando quieras.",
    todas: "Ver todas las apps",
    lista: [
      { id: "whatsapp_business", agente: "lola", titulo: "WhatsApp Business", cosas: ["Contesta a tus clientes con tus precios", "Agenda y confirma citas", "Te pasa lo que necesita a una persona"], nota: "La conexión de WhatsApp Business abre por etapas." },
      { id: "gmail", agente: "clara", titulo: "Gmail", cosas: ["Resume tu bandeja", "Te dice qué es urgente", "Contesta y manda con tu OK"] },
      { id: "google_calendar", agente: "lola", titulo: "Google Calendar", cosas: ["Ve tus citas del día", "Crea, mueve o cancela citas", "Revisa que no choquen"] },
      { id: "outlook", agente: "clara", titulo: "Outlook", cosas: ["Lee tu Outlook o Hotmail", "Te dice qué es urgente", "Contesta con tu OK"] },
      { id: "google_drive", agente: "iris", titulo: "Google Drive", cosas: ["Lee los archivos que tú elijas", "Resume documentos largos", "Solo lectura"] },
      { id: "google_sheets", agente: "iris", titulo: "Google Sheets", cosas: ["Lee tus hojas de cálculo", "Saca cuentas y arma reportes", "Solo lectura"] },
      { id: "google_business", agente: "victor", titulo: "Perfil de Negocio de Google", cosas: ["Lee tus reseñas", "Te propone cómo contestarlas", "Solo lectura"] },
      { id: "shopify", agente: "victor", titulo: "Shopify", cosas: ["Ve tus pedidos", "Revisa tu inventario", "Solo lectura"] },
    ],
  },
  ideas: {
    etiqueta: "Ideas",
    titulo: "Cosas que puedes pedirle hoy",
    texto: "Toca una y se abre en el chat, lista para mandar. Cámbiala como quieras.",
    sorprendeme: "Sorpréndeme",
    probar: "Pídeselo",
    categorias: [
      { agente: "lola", nombre: "Citas", ideas: [{ texto: "Confirma las citas de mañana", dibujo: "calendario" }, { texto: "Recuérdale a quien faltó", dibujo: "campana" }, { texto: "Contesta precios y horarios", dibujo: "globo" }, { texto: "Avísame si se cruzan dos citas", dibujo: "reloj" }] },
      { agente: "clara", nombre: "Correo", ideas: [{ texto: "Dime qué es urgente en mi correo", dibujo: "sobre" }, { texto: "Contesta al proveedor", dibujo: "avion" }, { texto: "Avísame de facturas por pagar", dibujo: "recibo" }, { texto: "Resume mi bandeja de la semana", dibujo: "pila" }] },
      { agente: "victor", nombre: "Clientes", ideas: [{ texto: "Pide reseña a los clientes de hoy", dibujo: "estrella" }, { texto: "Escríbele a quien preguntó y no agendó", dibujo: "puntos" }, { texto: "Recupera clientes de hace 3 meses", dibujo: "iman" }, { texto: "Felicita a mis clientes en su cumpleaños", dibujo: "regalo" }] },
      { agente: "iris", nombre: "Oficina", ideas: [{ texto: "Hazme el reporte de ventas del mes", dibujo: "grafica" }, { texto: "Compara precios de 3 proveedores", dibujo: "lupa" }, { texto: "Arma la presentación para mi socio", dibujo: "pizarron" }, { texto: "Ordena mis pendientes de la semana", dibujo: "lista" }] },
    ],
  },
  privacidad: {
    permisosTitulo: "Tus permisos",
    ejemplo: "Ejemplo",
    permisos: [
      { id: "whatsapp_business", que: "Contestar a tus clientes", activo: true },
      { id: "gmail", que: "Leer y resumir correos", activo: true },
      { id: "google_calendar", que: "Crear y mover citas", activo: false },
    ],
    globo: "¿Atendel manda cosas sin preguntarte? Solo lo que tú eliges. Lo de dinero, siempre te lo pregunta.",
    mas: "Cómo cuidamos tus datos",
  },
};

const EN: Contenido = {
  avisos: {
    aria: "Example alerts from your team",
    lista: [
      { agente: "iris", cuando: "8:00", texto: "Your plan for today: 6 appointments, 2 emails that need you and a bill to pay." },
      { agente: "lola", cuando: "10:42", texto: "A client asked for Thursday at 5 pm. It's already in your calendar." },
      { agente: "clara", cuando: "13:15", texto: "The supplier's invoice is due tomorrow. The reply is ready for your OK." },
      { agente: "victor", cuando: "17:30", texto: "Someone asked for prices and didn't book. I left you a message to send them." },
    ],
  },
  encargos: {
    etiqueta: "How it splits the work",
    tu: "You",
    encarga: "Atendel hands it to",
    trabajando: "Working",
    listo: "Done",
    escenas: [
      { pide: "Confirm tomorrow's appointments and tell me what's urgent in my email", tareas: [{ agente: "lola", que: "Confirm tomorrow's appointments" }, { agente: "clara", que: "Pick out the urgent emails" }] },
      { pide: "Ask today's clients for a review and make this month's report", tareas: [{ agente: "victor", que: "Ask today's clients for a review" }, { agente: "iris", que: "Build this month's sales report" }] },
      { pide: "Reply to the supplier and move Luis's appointment to Friday", tareas: [{ agente: "clara", que: "Reply to the supplier" }, { agente: "lola", que: "Move Luis's appointment to Friday" }] },
    ],
  },
  casos: {
    etiqueta: "Day to day",
    titulo: "What your team handles for you",
    texto: "Everyday things, handled the way you'd handle them.",
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
  formas: {
    etiqueta: "Use it wherever you are",
    lista: [
      { dibujo: "compu", titulo: "On your computer", texto: "Nothing to install: the chat, your team and what's waiting for your OK.", boton: "Try it", href: "/pruebalo" },
      { dibujo: "celular", titulo: "On your phone", texto: "Install it as an app from the browser and get alerts right away.", boton: "Sign in", href: "/entrar" },
      { dibujo: "telefono", titulo: "On WhatsApp", texto: "It tells you what matters. With your WhatsApp Business, Aura answers your clients.", boton: "Join the waitlist", href: null },
    ],
  },
  apps: {
    etiqueta: "What it does in each",
    texto: "Tap an app to see what Atendel does there.",
    nota: "Each app connects separately, with its own permission, and you can remove it anytime.",
    todas: "See all apps",
    lista: [
      { id: "whatsapp_business", agente: "lola", titulo: "WhatsApp Business", cosas: ["Answers clients with your prices", "Books and confirms appointments", "Hands you what needs a person"], nota: "The WhatsApp Business connection is rolling out in stages." },
      { id: "gmail", agente: "clara", titulo: "Gmail", cosas: ["Sums up your inbox", "Tells you what's urgent", "Replies and sends with your OK"] },
      { id: "google_calendar", agente: "lola", titulo: "Google Calendar", cosas: ["Sees today's appointments", "Creates, moves or cancels them", "Checks nothing clashes"] },
      { id: "outlook", agente: "clara", titulo: "Outlook", cosas: ["Reads your Outlook or Hotmail", "Tells you what's urgent", "Replies with your OK"] },
      { id: "google_drive", agente: "iris", titulo: "Google Drive", cosas: ["Reads the files you choose", "Sums up long documents", "Read only"] },
      { id: "google_sheets", agente: "iris", titulo: "Google Sheets", cosas: ["Reads your spreadsheets", "Does the math and builds reports", "Read only"] },
      { id: "google_business", agente: "victor", titulo: "Google Business Profile", cosas: ["Reads your reviews", "Suggests how to reply", "Read only"] },
      { id: "shopify", agente: "victor", titulo: "Shopify", cosas: ["Sees your orders", "Checks your inventory", "Read only"] },
    ],
  },
  ideas: {
    etiqueta: "Ideas",
    titulo: "Things you can ask for today",
    texto: "Tap one and it opens in the chat, ready to send. Change it however you like.",
    sorprendeme: "Surprise me",
    probar: "Ask for it",
    categorias: [
      { agente: "lola", nombre: "Appointments", ideas: [{ texto: "Confirm tomorrow's appointments", dibujo: "calendario" }, { texto: "Remind whoever missed theirs", dibujo: "campana" }, { texto: "Answer prices and hours", dibujo: "globo" }, { texto: "Warn me if two bookings clash", dibujo: "reloj" }] },
      { agente: "clara", nombre: "Email", ideas: [{ texto: "Tell me what's urgent in my email", dibujo: "sobre" }, { texto: "Reply to the supplier", dibujo: "avion" }, { texto: "Warn me about bills to pay", dibujo: "recibo" }, { texto: "Sum up my inbox this week", dibujo: "pila" }] },
      { agente: "victor", nombre: "Clients", ideas: [{ texto: "Ask today's clients for a review", dibujo: "estrella" }, { texto: "Follow up with who asked and didn't book", dibujo: "puntos" }, { texto: "Win back clients from 3 months ago", dibujo: "iman" }, { texto: "Wish my clients a happy birthday", dibujo: "regalo" }] },
      { agente: "iris", nombre: "Office", ideas: [{ texto: "Make this month's sales report", dibujo: "grafica" }, { texto: "Compare 3 suppliers' prices", dibujo: "lupa" }, { texto: "Build the deck for my partner", dibujo: "pizarron" }, { texto: "Sort my to-dos for the week", dibujo: "lista" }] },
    ],
  },
  privacidad: {
    permisosTitulo: "Your permissions",
    ejemplo: "Example",
    permisos: [
      { id: "whatsapp_business", que: "Answer your clients", activo: true },
      { id: "gmail", que: "Read and sum up email", activo: true },
      { id: "google_calendar", que: "Create and move appointments", activo: false },
    ],
    globo: "Does Atendel send things without asking? Only what you choose. Anything with money, it always asks.",
    mas: "How we look after your data",
  },
};

export const contenidoMezcla = (idioma: string): Contenido => (idioma === "es" ? ES : EN);
