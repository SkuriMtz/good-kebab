/**
 * EL USO DE TU PLAN, COMO EN CLAUDE (se puede usar en el navegador)
 *
 * No se cuentan mensajes: cada respuesta de la IA gasta lo que de verdad
 * costó (ver src/lib/uso.ts). Hay dos ventanas:
 *   - Sesión: 5 horas desde tu primer mensaje (si no hay una abierta).
 *   - Semana: se reinicia el lunes a las 12:00 a. m. de tu zona horaria.
 * Si cualquiera de las dos llega al 100 %, el chat espera a que se reinicie.
 */

export type VentanaUso = {
  /** Lo gastado y el límite, en micro-dólares (solo para sacar el porcentaje). */
  usado: number;
  limite: number;
  /** Cuándo se reinicia (ISO). En la sesión, null = todavía no empieza (empieza con tu siguiente mensaje). */
  reinicia: string | null;
};

export type EstadoUso = { sesion: VentanaUso; semana: VentanaUso; zona: string };

export const ZONA_PREDETERMINADA = "America/Mexico_City";

/** El porcentaje usado: no dice 100 si todavía queda algo, ni 0 si ya se usó algo. */
export function pctDe(v: Pick<VentanaUso, "usado" | "limite">) {
  if (v.limite <= 0) return 0;
  if (v.usado >= v.limite) return 100;
  const p = Math.round((v.usado / v.limite) * 100);
  return Math.min(99, Math.max(v.usado > 0 ? 1 : 0, p));
}

/** Qué ventana tiene el chat en pausa (la semana pesa más: tarda más en reiniciarse). */
export function bloqueoDe(e: EstadoUso): "sesion" | "semana" | null {
  if (e.semana.usado >= e.semana.limite) return "semana";
  if (e.sesion.reinicia && e.sesion.usado >= e.sesion.limite) return "sesion";
  return null;
}

const zonaValida = (zona: string) => {
  try {
    new Intl.DateTimeFormat("es-MX", { timeZone: zona });
    return zona;
  } catch {
    return ZONA_PREDETERMINADA;
  }
};

/** "a las 4:35 p. m.", "mañana a las 9:10 a. m." o "el lunes a las 12:00 a. m.", en la zona de la cuenta. */
export function cuandoReinicia(iso: string, zona: string, ahora = new Date()) {
  const z = zonaValida(zona);
  const fecha = new Date(iso);
  const dia = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: z, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const hora = new Intl.DateTimeFormat("es-MX", { timeZone: z, hour: "numeric", minute: "2-digit" }).format(fecha);
  const hoy = dia(ahora);
  const manana = dia(new Date(ahora.getTime() + 86_400_000));
  if (dia(fecha) === hoy) return `a las ${hora}`;
  if (dia(fecha) === manana) return `mañana a las ${hora}`;
  const semana = new Intl.DateTimeFormat("es-MX", { timeZone: z, weekday: "long" }).format(fecha);
  return `el ${semana} a las ${hora}`;
}

/** El aviso cuando se llegó al límite (null si no). */
export function mensajeLimite(e: EstadoUso, ahora = new Date()): string | null {
  const b = bloqueoDe(e);
  if (b === "semana") return `Llegaste al límite de uso de esta semana. Tu equipo vuelve a contestar ${cuandoReinicia(e.semana.reinicia ?? ahora.toISOString(), e.zona, ahora)}.`;
  if (b === "sesion") return `Llegaste al límite de esta sesión. Tu equipo vuelve a contestar ${cuandoReinicia(e.sesion.reinicia ?? ahora.toISOString(), e.zona, ahora)}.`;
  return null;
}

/** El aviso y hasta cuándo (para que el chat se vuelva a abrir solo a esa hora). */
export type Bloqueo = { texto: string; hasta: string | null };
export function bloqueoConHora(e: EstadoUso, ahora = new Date()): Bloqueo | null {
  const texto = mensajeLimite(e, ahora);
  if (!texto) return null;
  return { texto, hasta: bloqueoDe(e) === "semana" ? e.semana.reinicia : e.sesion.reinicia };
}

/** Minutos de diferencia de esa zona con UTC en ese momento (-360 en la Ciudad de México). */
function desfase(zona: string, fecha: Date) {
  const texto = new Intl.DateTimeFormat("en-US", { timeZone: zona, timeZoneName: "longOffset" }).formatToParts(fecha).find((p) => p.type === "timeZoneName")?.value ?? "";
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(texto);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
}

/** El próximo lunes a las 12:00 a. m. en esa zona (cuando se reinicia la semana). */
export function proximoLunes(zona: string, ahora = new Date()) {
  const z = zonaValida(zona);
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: z, year: "numeric", month: "numeric", day: "numeric", weekday: "short" }).formatToParts(ahora).map((p) => [p.type, p.value]),
  );
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(partes.weekday);
  const faltan = (8 - dia) % 7 || 7;
  const medianoche = Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day) + faltan);
  return new Date(medianoche - desfase(z, new Date(medianoche)) * 60_000);
}

/** Un uso de ejemplo para la demostración (datos de ejemplo, se ven en /pruebalo). */
export function usoDeEjemplo(limite: { sesion: number; semana: number }, ahora = new Date()): EstadoUso {
  // Sesión al 18 % que se reinicia en 3 horas; semana al 43 %, hasta el lunes
  const lunes = proximoLunes(ZONA_PREDETERMINADA, ahora);
  return {
    sesion: { usado: Math.round(limite.sesion * 0.18), limite: limite.sesion, reinicia: new Date(ahora.getTime() + 3 * 3_600_000).toISOString() },
    semana: { usado: Math.round(limite.semana * 0.43), limite: limite.semana, reinicia: lunes.toISOString() },
    zona: ZONA_PREDETERMINADA,
  };
}
