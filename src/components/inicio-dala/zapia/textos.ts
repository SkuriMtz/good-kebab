import type { NombreDibujo } from "./Dibujos";

/**
 * Los textos de la mezcla con el estilo de Zapia (prueba, /vista-zapia):
 * español e inglés (los demás idiomas usan el inglés). Son pedidos reales
 * que Atendel sabe hacer; al tocarlos se abren en el chat de ejemplo
 * (/pruebalo), sin inventar clientes ni cifras.
 */

export type Color = "coral" | "azul" | "verde" | "amarillo";
export type Idea = { texto: string; dibujo: NombreDibujo };
export type Categoria = { id: string; nombre: string; quien: string; color: Color; ideas: Idea[] };

type Textos = {
  escribe: string[];
  enviar: string;
  pidesela: string;
  globos: { quien: string; texto: string; color: Color }[];
  etiquetas: { decisiones: string; foco: string; globo: string; equipo: string; ideas: string; planes: string };
  ideas: { titulo: string; texto: string; suerte: string; probar: string; categorias: Categoria[] };
};

const ES: Textos = {
  escribe: ["Confirma las citas de mañana", "Dime qué es urgente en mi correo", "Pide reseñas a las clientas de hoy", "Hazme el reporte de ventas del mes"],
  enviar: "Pídeselo a Atendel",
  pidesela: "Pídeselo",
  globos: [
    { quien: "Aura", texto: "Confirma las citas de mañana", color: "coral" },
    { quien: "Altair", texto: "Contesta lo urgente del correo", color: "azul" },
    { quien: "Rigel", texto: "Pide reseñas a las clientas de hoy", color: "verde" },
    { quien: "Mira", texto: "Hazme el reporte del mes", color: "amarillo" },
  ],
  etiquetas: { decisiones: "Siempre atento", foco: "Un solo chat", globo: "Para crecer", equipo: "Tu equipo", ideas: "Ideas", planes: "Planes" },
  ideas: {
    titulo: "¿No sabes qué pedirle? Empieza con una",
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
};

const EN: Textos = {
  escribe: ["Confirm tomorrow's appointments", "Tell me what's urgent in my email", "Ask today's clients for reviews", "Make this month's sales report"],
  enviar: "Ask Atendel",
  pidesela: "Ask for it",
  globos: [
    { quien: "Aura", texto: "Confirm tomorrow's appointments", color: "coral" },
    { quien: "Altair", texto: "Answer the urgent emails", color: "azul" },
    { quien: "Rigel", texto: "Ask today's clients for reviews", color: "verde" },
    { quien: "Mira", texto: "Make this month's report", color: "amarillo" },
  ],
  etiquetas: { decisiones: "Always on", foco: "One chat", globo: "To grow", equipo: "Your team", ideas: "Ideas", planes: "Plans" },
  ideas: {
    titulo: "Not sure what to ask? Start with one",
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
};

export const textosZapia = (idioma: string): Textos => (idioma === "es" ? ES : EN);
