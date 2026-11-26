import type { IdAgente } from "@/lib/agentes";
import type { IdApp } from "@/lib/nucleo-tipos";
import type { NombreDibujo } from "./Dibujos";

/**
 * Los textos de lo nuevo de la landing combinada (vista previa en /vista-zapia). Son de
 * Atendel: ejemplos de cosas que sí hace (como los de /pruebalo), sin clientes, cifras ni
 * opiniones inventadas. En español e inglés (los otros idiomas usan el inglés) hasta que pase a
 * «/», donde todo se muda a src/i18n con los 7 idiomas.
 */

export type AppQueHace = { id: IdApp; agente: IdAgente; titulo: string; cosas: string[]; nota?: string };
export type Idea = { texto: string; dibujo: NombreDibujo };

type Contenido = {
  /** El texto de la portada, corto (el equipo ya se presenta en el carrusel). */
  portada: string;
  avisos: { aria: string; lista: { agente: IdAgente; cuando: string; texto: string }[] };
  apps: { etiqueta: string; texto: string; nota: string; todas: string; lista: AppQueHace[] };
  ideas: { etiqueta: string; titulo: string; texto: string; sorprendeme: string; probar: string; categorias: { agente: IdAgente; nombre: string; ideas: Idea[] }[] };
  privacidad: { permisosTitulo: string; ejemplo: string; permisos: { id: IdApp; que: string; activo: boolean }[]; mas: string };
};

const ES: Contenido = {
  portada: "Atendel ve lo que pasa en tu negocio y lo resuelve como un socio, con su equipo.",
  avisos: {
    aria: "Ejemplos de avisos de tu equipo",
    lista: [
      { agente: "iris", cuando: "8:00", texto: "Tu plan de hoy: 6 citas, 2 correos que piden algo de ti y una factura por pagar." },
      { agente: "lola", cuando: "10:42", texto: "Una clienta pidió cita el jueves a las 17:00. Ya quedó en tu agenda." },
      { agente: "clara", cuando: "13:15", texto: "La factura del proveedor vence mañana. Te dejé la respuesta lista para tu OK." },
      { agente: "victor", cuando: "17:30", texto: "Alguien preguntó precios y no agendó. Te dejé un mensaje para escribirle." },
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
    mas: "Cómo cuidamos tus datos",
  },
};

const EN: Contenido = {
  portada: "Atendel sees what's happening in your business and sorts it out like a partner, with its team.",
  avisos: {
    aria: "Example alerts from your team",
    lista: [
      { agente: "iris", cuando: "8:00", texto: "Your plan for today: 6 appointments, 2 emails that need you and a bill to pay." },
      { agente: "lola", cuando: "10:42", texto: "A client asked for Thursday at 5 pm. It's already in your calendar." },
      { agente: "clara", cuando: "13:15", texto: "The supplier's invoice is due tomorrow. The reply is ready for your OK." },
      { agente: "victor", cuando: "17:30", texto: "Someone asked for prices and didn't book. I left you a message to send them." },
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
    mas: "How we look after your data",
  },
};

export const contenidoMezcla = (idioma: string): Contenido => (idioma === "es" ? ES : EN);
