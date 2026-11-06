import type { IdAgente } from "@/lib/agentes";
import type { Adaptador, Herramienta, IdApp, Proveedor } from "@/lib/nucleo-tipos";
import { APP_POR_ID, CATALOGO, VARIABLE_LLAVE, VARIABLES_PICKER } from "./catalogo";
import type { ConexionPublica } from "./estado";
import { google } from "./proveedores/google";
import { facturapi } from "./proveedores/facturapi";
import { mercadolibre } from "./proveedores/mercadolibre";
import { mercadopago } from "./proveedores/mercadopago";
import { microsoft } from "./proveedores/microsoft";
import { notion } from "./proveedores/notion";
import { shopify } from "./proveedores/shopify";
import { stripe } from "./proveedores/stripe";
import { tiendanube } from "./proveedores/tiendanube";

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

// E: meta, telegram, calendly, zoom, dropbox, slack, trello, airtable y hubspot
const meta = pendiente("meta"); // import { meta } from "./proveedores/meta";
const telegram = pendiente("telegram"); // import { telegram } from "./proveedores/telegram";
const calendly = pendiente("calendly"); // import { calendly } from "./proveedores/calendly";
const zoom = pendiente("zoom"); // import { zoom } from "./proveedores/zoom";
const dropbox = pendiente("dropbox"); // import { dropbox } from "./proveedores/dropbox";
const slack = pendiente("slack"); // import { slack } from "./proveedores/slack";
const trello = pendiente("trello"); // import { trello } from "./proveedores/trello";
const airtable = pendiente("airtable"); // import { airtable } from "./proveedores/airtable";
const hubspot = pendiente("hubspot"); // import { hubspot } from "./proveedores/hubspot";
// F: stripe, mercadopago, mercadolibre, shopify, tiendanube y facturapi (unidos arriba)

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
};

const PENDIENTES = new Set<Proveedor>(
  (Object.keys(ADAPTADORES) as Proveedor[]).filter((p) => {
    const a = ADAPTADORES[p];
    // Un adaptador real trae algo con qué conectarse
    return !a.urlAutorizacion && !a.validarLlave;
  }),
);

export const adaptador = (p: Proveedor): Adaptador => ADAPTADORES[p];

/** ¿Su archivo todavía no está unido? (la tarjeta sale "En camino"). */
export const esPendiente = (p: Proveedor) => PENDIENTES.has(p);

type Entorno = Record<string, string | undefined>;
const tiene = (env: Entorno, nombre: string) => Boolean(env[nombre]?.trim());

/**
 * ¿Están en Vercel las variables del proveedor (y la llave de cifrado)?
 * Solo regresa los NOMBRES que faltan, nunca valores. Solo servidor.
 */
export function configurado(p: Proveedor, env: Entorno = process.env): { ok: boolean; falta: string[] } {
  const falta = [...ADAPTADORES[p].variables, VARIABLE_LLAVE].filter((n) => !tiene(env, n));
  return { ok: falta.length === 0 && !PENDIENTES.has(p), falta };
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
    if (c.estado !== "activa" || PENDIENTES.has(c.proveedor)) continue;
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
