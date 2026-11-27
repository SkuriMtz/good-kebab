import type { IdAgente } from "@/lib/agentes";

/**
 * La primera línea del cierre («… Deja que Atendel lo haga.») cambia según la página. La
 * segunda línea no cambia. En español e inglés; los demás idiomas usan la frase del inicio
 * (d.inicio.cierre.linea1).
 */
export type PaginaCierre = "apps" | "agentes" | IdAgente | "precios" | "preguntas" | "paraQuien" | "contacto" | "cuando";

const ES: Record<PaginaCierre, string> = {
  apps: "Contestar correos, mover citas, revisar cobros.",
  agentes: "WhatsApp, correo, clientes y oficina.",
  lola: "Tus clientes esperan respuesta.",
  clara: "Tu bandeja no se va a vaciar sola.",
  victor: "Tus clientes de antes pueden volver.",
  iris: "Ese reporte no se va a hacer solo.",
  precios: "Elige el plan a tu medida.",
  preguntas: "Ya sabes cómo funciona.",
  paraQuien: "Sea cual sea tu negocio.",
  contacto: "Tus clientes también merecen respuesta.",
  cuando: "Los lugares ya se están abriendo.",
};

const EN: Record<PaginaCierre, string> = {
  apps: "Answering emails, moving appointments, checking payments.",
  agentes: "WhatsApp, email, clients and office work.",
  lola: "Your clients are waiting for an answer.",
  clara: "Your inbox won't empty itself.",
  victor: "Your past clients can come back.",
  iris: "That report won't write itself.",
  precios: "Pick the plan that fits you.",
  preguntas: "Now you know how it works.",
  paraQuien: "Whatever your business.",
  contacto: "Your clients deserve an answer too.",
  cuando: "Spots are opening up.",
};

export const fraseCierre = (idioma: string, pagina: PaginaCierre): string | undefined =>
  idioma === "es" ? ES[pagina] : idioma === "en" ? EN[pagina] : undefined;
