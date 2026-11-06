import type { IdAgente } from "@/lib/agentes";
import type { Adaptador, Herramienta, IdApp, Proveedor } from "@/lib/nucleo-tipos";
import { APP_POR_ID, CATALOGO, VARIABLE_LLAVE, VARIABLES_PICKER } from "./catalogo";
import type { ConexionPublica } from "./estado";
import { airtable } from "./proveedores/airtable";
import { calendly } from "./proveedores/calendly";
import { dropbox } from "./proveedores/dropbox";
import { facturapi } from "./proveedores/facturapi";
import { google } from "./proveedores/google";
import { hubspot } from "./proveedores/hubspot";
import { mercadolibre } from "./proveedores/mercadolibre";
import { mercadopago } from "./proveedores/mercadopago";
import { meta } from "./proveedores/meta";
import { microsoft } from "./proveedores/microsoft";
import { notion } from "./proveedores/notion";
import { shopify } from "./proveedores/shopify";
import { slack } from "./proveedores/slack";
import { stripe } from "./proveedores/stripe";
import { telegram } from "./proveedores/telegram";
import { tiendanube } from "./proveedores/tiendanube";
import { trello } from "./proveedores/trello";
import { zoom } from "./proveedores/zoom";
import { acuity } from "./proveedores/acuity";
import { kommo } from "./proveedores/kommo";
import { mailchimp } from "./proveedores/mailchimp";
import { pipedrive } from "./proveedores/pipedrive";
import { simplybook } from "./proveedores/simplybook";
import { typeform } from "./proveedores/typeform";
import { zoho } from "./proveedores/zoho";
import { paypal } from "./proveedores/paypal";
import { conekta } from "./proveedores/conekta";
import { openpay } from "./proveedores/openpay";
import { square } from "./proveedores/square";

/**
 * REGISTRO DE PROVEEDORES: el único lugar que sabe qué adaptador atiende a
 * cada proveedor del contrato. Las rutas genéricas (conectar, callback,
 * desconectar, llave), /api/apps y el chat lo consultan.
 *
 * Cada proveedor vive en src/lib/conexiones/proveedores/<proveedor>.ts y
 * exporta `export const <proveedor>: Adaptador` (con el mismo nombre que
 * en Proveedor: meta, telegram, mercadopago…). Mientras su archivo no esté
 * unido, se registra con `pendiente(...)`: no se puede conectar y su
 * tarjeta sale "En camino". Para unir uno, se cambia su línea `pendiente`
 * por el import.
 */

function pendiente(proveedor: Proveedor): Adaptador {
  const app = CATALOGO.find((a) => a.proveedor === proveedor);
  return {
    proveedor,
    autenticacion: app?.autenticacion ?? "oauth",
    variables: [],
    async cuenta() {
      return "";
    },
    herramientas: [],
  };
}

// E (meta, telegram, calendly, zoom, dropbox, slack, trello, airtable y hubspot): ya unidos arriba
// F (stripe, mercadopago, mercadolibre, shopify, tiendanube y facturapi): ya unidos arriba
// v3 (E: reservas y CRM, unidos arriba; setmore y agendapro sin API pública · G: pagos MX y contabilidad)
const setmore = pendiente("setmore"); // import { setmore } from "./proveedores/setmore";
const agendapro = pendiente("agendapro"); // import { agendapro } from "./proveedores/agendapro";
const facturama = pendiente("facturama"); // import { facturama } from "./proveedores/facturama";
const alegra = pendiente("alegra"); // import { alegra } from "./proveedores/alegra";
const holded = pendiente("holded"); // import { holded } from "./proveedores/holded";
const quickbooks = pendiente("quickbooks"); // import { quickbooks } from "./proveedores/quickbooks";

export const ADAPTADORES: Record<Proveedor, Adaptador> = {
  google,
  microsoft,
  notion,
  meta,
  telegram,
  calendly,
  zoom,
  dropbox,
  slack,
  trello,
  airtable,
  hubspot,
  stripe,
  mercadopago,
  mercadolibre,
  shopify,
  tiendanube,
  facturapi,
  acuity,
  simplybook,
  setmore,
  agendapro,
  paypal,
  conekta,
  openpay,
  square,
  facturama,
  alegra,
  holded,
  zoho,
  quickbooks,
  pipedrive,
  kommo,
  typeform,
  mailchimp,
};

export const adaptador = (p: Proveedor): Adaptador => ADAPTADORES[p];

/** ¿Su archivo todavía no está unido? (un adaptador real trae con qué conectarse; su tarjeta sale "En camino"). */
export const esPendiente = (p: Proveedor) => !ADAPTADORES[p].urlAutorizacion && !ADAPTADORES[p].validarLlave;

type Entorno = Record<string, string | undefined>;
const tiene = (env: Entorno, nombre: string) => Boolean(env[nombre]?.trim());

/**
 * ¿Están en Vercel las variables del proveedor (y la llave de cifrado)?
 * Solo regresa los NOMBRES que faltan, nunca valores. Solo servidor.
 */
export function configurado(p: Proveedor, env: Entorno = process.env): { ok: boolean; falta: string[] } {
  const falta = [...ADAPTADORES[p].variables, VARIABLE_LLAVE].filter((n) => !tiene(env, n));
  return { ok: falta.length === 0 && !esPendiente(p), falta };
}

/** Como `configurado`, por app: Drive necesita además lo del Picker. */
export function configuradoApp(id: IdApp, env: Entorno = process.env): { ok: boolean; falta: string[] } {
  const app = APP_POR_ID[id];
  if (!app.proveedor || app.fase !== 1) return { ok: false, falta: [] };
  const base = configurado(app.proveedor, env);
  if (id !== "google_drive") return base;
  const falta = [...base.falta, ...VARIABLES_PICKER.filter((n) => !tiene(env, n))];
  return { ok: falta.length === 0 && base.ok, falta };
}

/**
 * Las herramientas de solo lectura que tocan a estos agentes, de las apps que
 * la persona tiene conectadas (y activas). En un grupo, las de sus miembros.
 */
export function herramientasPara(agentes: readonly IdAgente[], conexiones: readonly ConexionPublica[]): Herramienta[] {
  const vistas = new Set<string>();
  const lista: Herramienta[] = [];
  for (const c of conexiones) {
    if (c.estado !== "activa" || esPendiente(c.proveedor)) continue;
    for (const h of ADAPTADORES[c.proveedor].herramientas) {
      const app = APP_POR_ID[h.app];
      if (!app || app.fase !== 1 || app.proveedor !== c.proveedor || !c.apps.includes(h.app)) continue;
      if (!h.agentes.some((a) => agentes.includes(a)) || vistas.has(h.nombre)) continue;
      vistas.add(h.nombre);
      lista.push(h);
    }
  }
  return lista;
}

/** De qué proveedor es una herramienta (por su app). */
export const proveedorDe = (h: Herramienta): Proveedor | null => APP_POR_ID[h.app]?.proveedor ?? null;
