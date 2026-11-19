import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { haceTexto } from "@/components/panel/Hoy";
import { nombreRemitente } from "@/components/panel/remitente";
import { APP_POR_ID } from "./conexiones/catalogo";
import { leerConexionesPublicas } from "./conexiones/estado";
import { LOGO_APP } from "./conexiones/logos";
import { NOMBRE_PROVEEDOR } from "./conexiones/oauth";
import type { Cuenta } from "./cuenta";
import { cargarNegocio } from "./estadisticas-negocio";
import { cargarHoy } from "./hoy";
import { negociosDe } from "./pendientes";
import { armarTablero, type DatosTablero, type EntradaTablero, type Renglon } from "./tablero";
import { leerUso } from "./uso";

/*
 * Junta lo del Tablero con la sesión de la persona (RLS: cada quien ve lo
 * suyo). Solo lee. Lo que no se pudo leer simplemente no sale.
 */

const corto = (t: unknown, max: number) => {
  const s = typeof t === "string" ? t.replace(/\s+/g, " ").trim() : "";
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

/** El día (AAAA-MM-DD) de una fecha en esa zona. */
const diaEn = (zona: string, d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: zona }).format(d);

/** Los últimos 7 días (de hace 6 a hoy) y los 7 de antes, en esa zona. */
function semanas(zona: string, ahora: number) {
  const dias = Array.from({ length: 14 }, (_, i) => diaEn(zona, new Date(ahora - (13 - i) * 86_400_000)));
  return { antes: dias.slice(0, 7), estas: dias.slice(7) };
}

const porcentaje = (usado: number, limite: number) => (limite > 0 ? Math.min(100, Math.round((usado / limite) * 100)) : null);

export async function cargarTablero(supabase: SupabaseClient, userId: string, o: { cuenta: Cuenta; conGoogle: boolean; zona: string }): Promise<DatosTablero> {
  const ahora = Date.now();
  const { antes: diasAntes, estas: diasEstas } = semanas(o.zona, ahora);
  const desde = new Date(ahora - 14 * 86_400_000).toISOString();
  const ids = await negociosDe(supabase, userId);

  const [hoy, negocio, wa, numero, correos, conexiones, uso] = await Promise.all([
    cargarHoy(supabase, userId, o.cuenta, o.conGoogle, ahora),
    cargarNegocio(supabase, userId, "7d", o.cuenta).catch(() => null),
    supabase.from("whatsapp_mensajes").select("telefono, nombre, texto, estado, creado_en").eq("owner_id", userId).eq("direccion", "entrante").gte("creado_en", desde).order("creado_en", { ascending: false }).limit(1000),
    supabase.from("whatsapp_numeros").select("phone_number_id").eq("owner_id", userId).limit(1).maybeSingle(),
    supabase.from("resumenes_correo").select("id, remitente, asunto, creado_en").in("negocio_id", ids).order("creado_en", { ascending: false }).limit(3),
    leerConexionesPublicas(supabase, userId).catch(() => []),
    leerUso(supabase, userId, o.cuenta.plan).catch(() => null),
  ]);

  /* WhatsApp: mensajes de clientes por día (esta semana y la anterior) */
  const msjs = (wa.data ?? []) as { telefono: string; nombre: string | null; texto: string | null; estado: string; creado_en: string }[];
  const conWhatsapp = Boolean(numero.data) || msjs.length > 0;
  const porDia = new Map<string, number>();
  for (const m of msjs) {
    const d = diaEn(o.zona, new Date(m.creado_en));
    porDia.set(d, (porDia.get(d) ?? 0) + 1);
  }
  const suma = (dias: string[]) => dias.reduce((n, d) => n + (porDia.get(d) ?? 0), 0);
  const ultimosWa: Renglon[] = msjs.slice(0, 3).map((m, i) => ({ id: `wa-${i}`, texto: `${corto(m.nombre, 30) || `+${String(m.telefono).slice(-4).padStart(8, "•")}`}: ${corto(m.texto, 60)}`, hora: haceTexto(m.creado_en, ahora, o.zona) }));

  /* Correo y lo demás: de las estadísticas de 7 días (ya con su comparación) */
  const n = negocio;
  const serieDe = (s: { actual: number[] } | null | undefined) => (s ? s.actual.slice(-7) : undefined);
  const conCorreo = Boolean(n?.canales.correo);

  const entrada: EntradaTablero = {
    base: "/panel",
    teNecesita: hoy.teNecesita.map((t) => ({ id: t.id, titulo: t.titulo, detalle: t.detalle, href: t.href ?? "/panel?vista=pendientes" })),
    totalTeNecesita: hoy.total,
    viene: hoy.viene,
    hecho: hoy.hecho.map((h) => ({ id: h.id, titulo: h.titulo, hace: h.hace })),
    whatsapp: conWhatsapp
      ? {
          semana: suma(diasEstas),
          antes: suma(diasAntes),
          serie: diasEstas.map((d) => porDia.get(d) ?? 0),
          esperan: msjs.filter((m) => m.estado === "esperando_ok" || m.estado === "sin_respuesta").length,
          ultimos: ultimosWa,
        }
      : null,
    correo:
      conCorreo && n
        ? {
            semana: n.correos.valor ?? 0,
            antes: n.correos.antes ?? 0,
            serie: serieDe(n.series.correos) ?? [],
            conAccion: n.correos.conAccion ?? 0,
            ultimos: ((correos.data ?? []) as { id: string; remitente: string | null; asunto: string | null; creado_en: string }[]).map((c) => ({
              id: `c-${c.id}`,
              texto: `${corto(nombreRemitente(c.remitente), 30)}${c.asunto ? `: ${corto(c.asunto, 50)}` : ""}`,
              hora: haceTexto(c.creado_en, ahora, o.zona),
            })),
          }
        : null,
    clientes: n && n.clientes.valor != null ? { semana: n.clientes.valor, antes: n.clientes.antes ?? 0, nuevos: n.clientes.nuevos ?? 0, serie: n.serie?.actual.slice(-7) ?? [] } : null,
    respuestas: n && n.respuestas.valor != null && n.respuestas.valor > 0 ? { semana: n.respuestas.valor, antes: n.respuestas.antes ?? 0, serie: serieDe(n.series.respuestas) ?? [] } : null,
    citas: n?.canales.citas && n.citas.agendadas.valor != null ? { semana: n.citas.agendadas.valor, antes: n.citas.agendadas.antes ?? 0, serie: serieDe(n.series.citas) ?? [] } : null,
    apps: conexiones.map((c, i) => ({
      id: `${c.proveedor}-${i}`,
      nombre: NOMBRE_PROVEEDOR[c.proveedor] ?? c.proveedor,
      cuenta: c.cuenta ? corto(c.cuenta, 60) : null,
      logo: c.apps[0] ? (LOGO_APP[c.apps[0]] ?? null) : null,
      apps: c.apps.map((a) => APP_POR_ID[a]?.nombre ?? a),
      estado: c.estado,
    })),
    uso: { semanaPct: uso ? porcentaje(uso.semana.usado, uso.semana.limite) : null, trabajoPct: uso?.trabajo ? porcentaje(uso.trabajo.usado, uso.trabajo.limite) : null },
    noticias: [],
  };
  return armarTablero(entrada);
}
