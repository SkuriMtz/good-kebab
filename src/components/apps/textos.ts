import type { CategoriaApp } from "@/lib/nucleo-tipos";

/**
 * Los textos cortos de /apps (el carrusel de tarjetas por tipo de app): qué hace Atendel en
 * cada tipo, en una frase, y los botones. En español e inglés; los demás idiomas usan el texto
 * de cada tipo de src/i18n (paginaApps.categorias).
 */
type TextosApps = {
  anterior: string;
  siguiente: string;
  probar: string;
  pidele: string;
  tipos: Record<CategoriaApp, string>;
};

const ES: TextosApps = {
  anterior: "Anterior",
  siguiente: "Siguiente",
  probar: "Pruébalo",
  pidele: "Pídele",
  tipos: {
    correo: "Lee, resume y responde tus correos con tu aprobación.",
    mensajes: "Lee los mensajes que te mandan tus clientes.",
    agenda: "Crea, mueve y cancela citas sin que se encimen.",
    reservas: "Consulta tus citas, tus clientes y tus servicios.",
    documentos: "Lee y resume tus archivos y hojas de cálculo.",
    clientes: "Encuentra a tus clientes en tus contactos y tu CRM.",
    resenas: "Lee tus reseñas y propone cómo responderlas.",
    pagos: "Consulta tus cobros, pedidos y ventas. Nunca mueve dinero.",
    contabilidad: "Consulta tus facturas y cobros. Solo lectura.",
    facturacion: "Lee tus facturas electrónicas (CFDI). Solo lectura.",
  },
};

const EN: TextosApps = {
  anterior: "Previous",
  siguiente: "Next",
  probar: "Try it",
  pidele: "Ask",
  tipos: {
    correo: "Reads, summarizes and replies to your email with your approval.",
    mensajes: "Reads the messages your clients send you.",
    agenda: "Creates, moves and cancels appointments without overlaps.",
    reservas: "Checks your bookings, clients and services.",
    documentos: "Reads and summarizes your files and spreadsheets.",
    clientes: "Finds your clients in your contacts and CRM.",
    resenas: "Reads your reviews and suggests how to reply.",
    pagos: "Checks your payments, orders and sales. It never moves money.",
    contabilidad: "Checks your invoices and payments. Read only.",
    facturacion: "Reads your e-invoices (CFDI). Read only.",
  },
};

export const textosApps = (idioma: string): TextosApps => (idioma === "es" ? ES : EN);
