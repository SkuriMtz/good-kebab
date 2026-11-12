import { esIdAgente, type IdAgente } from "./agentes";
import { nombreRemitente } from "@/components/panel/remitente";

/**
 * HECHO: lo que el equipo ya terminó. En /panel sale de datos de verdad:
 * cada cosa que la persona le pidió a su equipo en el chat y que ya tiene
 * respuesta (el pedido y el principio de la respuesta), y los correos que
 * Clara resumió. Nada se inventa: sin conversaciones, la lista está vacía.
 */

export type ItemHecho = {
  id: string;
  /** Cuándo quedó hecho (ISO). */
  en: string;
  agente: IdAgente;
  titulo: string;
  detalle?: string;
  /** Las apps que usó (IdApp), si se sabe. */
  apps?: string[];
  /** El archivo que entregó, si hubo. */
  archivo?: string;
  href?: string;
};

type Msj = { conversacion_id: string; rol: string; contenido: string; agente: string | null; creado_en: string };
type Conv = { id: string; agente: string | null };
type Resumen = { id: string; remitente: string | null; asunto: string | null; creado_en: string };

/** Una línea legible: sin marcas de formato, sin saltos y recortada. */
function linea(texto: string, max: number) {
  const limpio = texto
    .replace(/```[\s\S]*?```/g, " ")
    .split("\n")
    .map((l) => l.replace(/^[\s>#*\-•\d.)]+/, "").replace(/[*_`~|]/g, "").trim())
    .filter((l) => l.length > 2)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
}

export function armarHecho(mensajes: Msj[], conversaciones: Conv[], resumenes: Resumen[]): ItemHecho[] {
  const agenteDe = new Map(conversaciones.map((c) => [c.id, c.agente]));
  const porConv = new Map<string, Msj[]>();
  for (const m of mensajes) {
    const lista = porConv.get(m.conversacion_id) ?? [];
    lista.push(m);
    porConv.set(m.conversacion_id, lista);
  }
  const items: ItemHecho[] = [];
  for (const [conv, lista] of porConv) {
    lista.sort((a, b) => a.creado_en.localeCompare(b.creado_en));
    lista.forEach((m, i) => {
      if (m.rol !== "user") return;
      // La primera respuesta del equipo después de este pedido
      const resp = lista.slice(i + 1).find((x) => x.rol === "assistant");
      const siguientePedido = lista.slice(i + 1).find((x) => x.rol === "user");
      if (!resp || (siguientePedido && siguientePedido.creado_en < resp.creado_en)) return;
      const quien = esIdAgente(resp.agente) ? resp.agente : esIdAgente(agenteDe.get(conv)) ? (agenteDe.get(conv) as IdAgente) : "lola";
      const pedido = linea(m.contenido, 120);
      if (!pedido) return;
      items.push({ id: `m-${conv}-${i}`, en: resp.creado_en, agente: quien, titulo: pedido, detalle: linea(resp.contenido, 170), href: `/panel?c=${encodeURIComponent(conv)}` });
    });
  }
  for (const r of resumenes) {
    const quien = nombreRemitente(r.remitente);
    items.push({ id: `r-${r.id}`, en: r.creado_en, agente: "clara", titulo: `Resumió el correo de ${quien}`, detalle: r.asunto || "(sin asunto)", apps: ["gmail"], href: `/panel?vista=correo&de=${encodeURIComponent(quien)}` });
  }
  return items.sort((a, b) => b.en.localeCompare(a.en)).slice(0, 80);
}

/** /pruebalo: lo hecho de ejemplo (Estudio Luna), en minutos antes de `ahora`. */
export function hechoDeEjemplo(ahora: number): ItemHecho[] {
  const hace = (min: number) => new Date(ahora - min * 60_000).toISOString();
  return [
    { id: "e1", en: hace(25), agente: "iris", titulo: "Hazme el reporte de ventas del mes en Excel", detalle: "Listo: ventas por semana y por servicio, con lo que subió contra el mes pasado.", apps: ["excel"], archivo: "Reporte-noviembre.xlsx" },
    { id: "e2", en: hace(70), agente: "lola", titulo: "Confirma las citas de mañana", detalle: "Te dejó listos 6 mensajes de confirmación; los aprobaste y 5 clientes ya contestaron.", apps: ["whatsapp_business", "google_calendar"] },
    { id: "e3", en: hace(190), agente: "clara", titulo: "Lo importante del correo de hoy", detalle: "Leyó 14 correos: 2 urgentes y una factura por pagar el viernes.", apps: ["gmail"] },
    { id: "e4", en: hace(60 * 21), agente: "victor", titulo: "¿Quién no ha vuelto en 3 meses?", detalle: "Encontró 8 clientes y te dejó un mensaje para cada uno.", apps: ["whatsapp_business"] },
    { id: "e5", en: hace(60 * 23), agente: "iris", titulo: "Compara precios de 3 proveedores", detalle: "Tabla lista: con el más barato ahorras $1,240 al mes.", apps: ["google_sheets"], archivo: "Proveedores.xlsx" },
    { id: "e6", en: hace(60 * 26), agente: "lola", titulo: "Agenda a Mariana el jueves a las 5", detalle: "La cita quedó en tu calendario.", apps: ["google_calendar"] },
    { id: "e7", en: hace(60 * 50), agente: "clara", titulo: "Contesta lo del proveedor de la factura", detalle: "Borrador listo; lo revisaste y lo mandaste tú.", apps: ["gmail"] },
    { id: "e8", en: hace(60 * 74), agente: "iris", titulo: "Resume la semana en una hoja", detalle: "Documento de una página con citas, ventas y pendientes.", apps: ["google_drive"], archivo: "Resumen-semana.pdf" },
  ];
}
