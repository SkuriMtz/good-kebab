import type { Idioma } from "@/i18n";
import type { CategoriaApp, IdApp } from "@/lib/nucleo-tipos";

/*
 * Los textos de las páginas /apps y /cuando-sale (en español e inglés).
 * Todo sale de lo que la app hace hoy: src/lib/conexiones/catalogo.ts (qué
 * hace Atendel con cada app) y los planes (Free abierto; One y Max por etapas,
 * sin precio publicado). Nada de fechas ni cifras inventadas.
 */

export const CATEGORIAS_APPS: { id: CategoriaApp; nombre: Record<Idioma, string>; texto: Record<Idioma, string> }[] = [
  {
    id: "correo",
    nombre: { es: "Correo", en: "Email" },
    texto: {
      es: "Altair lee y resume tus correos, y puede contestar o mandar por ti con tu OK (o solo, si así lo eliges).",
      en: "Altair reads and summarizes your email, and can reply or send for you with your OK (or on its own, if you choose).",
    },
  },
  {
    id: "mensajes",
    nombre: { es: "Mensajes", en: "Messages" },
    texto: {
      es: "Aura lee los mensajes que te mandan tus clientes y Mira resume los canales de tu equipo. Solo lectura.",
      en: "Aura reads the messages your clients send you and Mira summarizes your team's channels. Read-only.",
    },
  },
  {
    id: "agenda",
    nombre: { es: "Agenda y pendientes", en: "Calendar and tasks" },
    texto: {
      es: "Aura ve tu agenda y, en Google Calendar y Outlook, crea, mueve o cancela citas revisando que no choquen. Mira ve tus pendientes y puede crearlos o completarlos.",
      en: "Aura sees your calendar and, in Google Calendar and Outlook, creates, moves or cancels appointments, checking they don't clash. Mira sees your to-dos and can create or complete them.",
    },
  },
  {
    id: "reservas",
    nombre: { es: "Reservas", en: "Bookings" },
    texto: {
      es: "Aura ve tus citas, las de cada cliente y tus servicios. Solo lectura.",
      en: "Aura sees your appointments, each client's bookings and your services. Read-only.",
    },
  },
  {
    id: "documentos",
    nombre: { es: "Documentos", en: "Documents" },
    texto: {
      es: "Mira lee los archivos y hojas que le indiques para resumirlos o sacar cuentas; en Airtable y Trello también agrega registros o tarjetas.",
      en: "Mira reads the files and sheets you point it to, to summarize them or run the numbers; in Airtable and Trello it can also add records or cards.",
    },
  },
  {
    id: "clientes",
    nombre: { es: "Clientes", en: "Clients" },
    texto: {
      es: "Rigel busca a tus clientes en tus contactos y tu CRM, y lee las respuestas de tus formularios y cómo les fue a tus campañas. Solo lectura.",
      en: "Rigel looks up your clients in your contacts and CRM, and reads your form responses and how your campaigns did. Read-only.",
    },
  },
  {
    id: "resenas",
    nombre: { es: "Reseñas", en: "Reviews" },
    texto: {
      es: "Rigel lee tus reseñas para proponerte cómo contestarlas. Solo lectura.",
      en: "Rigel reads your reviews to suggest how to answer them. Read-only.",
    },
  },
  {
    id: "pagos",
    nombre: { es: "Pagos y ventas", en: "Payments and sales" },
    texto: {
      es: "Mira ve tus cobros, pagos, pedidos y ventas para llevar las cuentas. Solo lectura: Atendel no mueve dinero.",
      en: "Mira sees your charges, payments, orders and sales to keep track of the numbers. Read-only: Atendel doesn't move money.",
    },
  },
  {
    id: "contabilidad",
    nombre: { es: "Contabilidad", en: "Accounting" },
    texto: {
      es: "Mira ve tus facturas, cobros y clientes. Solo lectura: no timbra ni cancela facturas.",
      en: "Mira sees your invoices, collections and clients. Read-only: it doesn't issue or cancel invoices.",
    },
  },
  {
    id: "facturacion",
    nombre: { es: "Facturas electrónicas", en: "E-invoices" },
    texto: {
      es: "Mira lee tus facturas electrónicas (CFDI) para llevar cobros y pagos. Solo lectura.",
      en: "Mira reads your electronic invoices (CFDI) to keep track of collections and payments. Read-only.",
    },
  },
];

/** Los nombres que el catálogo tiene en español, en inglés. */
export const NOMBRE_APP_EN: Partial<Record<IdApp, string>> = {
  google_tasks: "Google Tasks",
  google_contacts: "Google Contacts",
  google_business: "Google Business Profile",
  outlook_calendar: "Outlook Calendar",
  outlook_contacts: "Outlook Contacts",
  facebook_resenas: "Facebook reviews",
  cfdi: "CFDI invoices",
};

export const TEXTOS_APPS = {
  es: {
    meta: ["Apps que se conectan", "Las apps que se conectan con Atendel y qué hace Atendel con cada una."],
    etiqueta: "Apps",
    titulo: "Atendel trabaja con las apps que ya usas.",
    intro: (n: number) => `Conecta las tuyas y el equipo trabaja con lo que ya tienes. Hoy se conectan ${n} apps; lo de dinero siempre espera tu OK.`,
    pronto: "En camino",
    marcas: "Las marcas y logos son de sus dueños; aquí solo dicen con qué se conecta Atendel. Algunas apps piden aprobar a Atendel antes de funcionar con cualquier cuenta.",
    cierreTitulo: "Conecta tus apps en minutos",
    cierreTexto: "Entra con tu correo, sin contraseña, y conéctalas desde Tu negocio → Apps conectadas. Las quitas cuando quieras.",
    crear: "Crea tu cuenta",
  },
  en: {
    meta: ["Connected apps", "The apps that connect with Atendel and what Atendel does with each one."],
    etiqueta: "Apps",
    titulo: "Atendel works with the apps you already use.",
    intro: (n: number) => `Connect yours and the team works with what you already have. ${n} apps connect today; anything involving money always waits for your OK.`,
    pronto: "Coming soon",
    marcas: "Brands and logos belong to their owners; here they only show what Atendel connects with. Some apps need to approve Atendel before it works with any account.",
    cierreTitulo: "Connect your apps in minutes",
    cierreTexto: "Sign in with your email, no password, and connect them from Your business → Connected apps. Remove them whenever you want.",
    crear: "Create account",
  },
} satisfies Record<Idioma, unknown>;

export const TEXTOS_CUANDO = {
  es: {
    meta: ["Cuándo sale", "Free ya está abierto. One y Max abren por etapas: anótate y te avisamos."],
    etiqueta: "Lanzamiento",
    titulo: "Cuándo sale Atendel",
    intro: "Free ya está abierto. One y Max abren por etapas: anótate en la lista y te avisamos cuando abra tu lugar.",
    etapas: [
      {
        plan: "Free",
        estado: "abierto",
        estadoTexto: "Ya está abierto",
        texto: "Entra hoy con tu correo, sin contraseña, y trabaja con Atendel y su equipo en el modo Rápido.",
      },
      {
        plan: "One",
        estado: "pronto",
        estadoTexto: "Abre por etapas",
        texto: "Para el día a día: los modos Rápido y Avanzado, y más trabajo por su cuenta. Precio por anunciar.",
      },
      {
        plan: "Max",
        estado: "pronto",
        estadoTexto: "Abre por etapas",
        texto: "Todo lo de One, con 5 veces su uso. Precio por anunciar.",
      },
    ],
    crear: "Crea tu cuenta",
    nota: "Nunca te cobraremos nada sin que antes aceptes el precio y las condiciones.",
    cierreTitulo: "¿Te avisamos?",
    cierreTexto: "Déjanos tu correo y te escribimos cuando abra tu lugar en One o Max.",
  },
  en: {
    meta: ["When it launches", "Free is open now. One and Max are opening in stages: join the list and we'll let you know."],
    etiqueta: "Launch",
    titulo: "When Atendel launches",
    intro: "Free is open now. One and Max are opening in stages: join the waitlist and we'll let you know when your spot opens.",
    etapas: [
      {
        plan: "Free",
        estado: "abierto",
        estadoTexto: "Open now",
        texto: "Sign in today with your email, no password, and work with Atendel and its whole team in Fast mode.",
      },
      {
        plan: "One",
        estado: "pronto",
        estadoTexto: "Opening in stages",
        texto: "For your day to day: Fast and Advanced modes, and more work done on its own. Price to be announced.",
      },
      {
        plan: "Max",
        estado: "pronto",
        estadoTexto: "Opening in stages",
        texto: "Everything in One, with 5 times the usage. Price to be announced.",
      },
    ],
    crear: "Create account",
    nota: "We'll never charge you anything before you accept the price and the terms.",
    cierreTitulo: "Want us to let you know?",
    cierreTexto: "Leave us your email and we'll write when your spot in One or Max opens.",
  },
} satisfies Record<Idioma, unknown>;
