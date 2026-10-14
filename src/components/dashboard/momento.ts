/**
 * La hora del dashboard, calculada en el servidor con la hora de México
 * (así el saludo y las fechas no cambian al cargar la página en el navegador).
 * Funciones puras: sirven igual en el servidor que en el navegador.
 */

const ZONA = "America/Mexico_City";

export type Momento = {
  /** "Buenos días", "Buenas tardes", "Buenas noches". */
  saludo: string;
  /** "Miércoles 8 de octubre". */
  fecha: string;
  /** Mes en curso, en minúsculas: "octubre". */
  mes: string;
  /** Los últimos 7 días, del más viejo a hoy: corto "L", largo "lunes 6". */
  dias: { corto: string; largo: string }[];
  /** El uso del plan se cuenta por mes: "Se renueva el 1 de noviembre." */
  renueva: string;
};

function partes(fecha: Date) {
  const f = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    hour: "numeric",
    hourCycle: "h23",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(fecha);
  const de = (t: string) => f.find((p) => p.type === t)?.value ?? "";
  return { hora: Number(de("hour")), semana: de("weekday"), dia: de("day"), mes: de("month") };
}

const mayuscula = (t: string) => t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1);

export function momento(ahora: Date = new Date()): Momento {
  const p = partes(ahora);
  const saludo = p.hora < 12 ? "Buenos días" : p.hora < 19 ? "Buenas tardes" : "Buenas noches";
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ahora.getTime() - (6 - i) * 86_400_000);
    const q = partes(d);
    return { corto: mayuscula(q.semana).charAt(0), largo: `${q.semana} ${q.dia}` };
  });
  // El contador de mensajes es por mes calendario (uso_mensual): vuelve a cero el día 1
  const proximo = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 1, 12));
  const mesProximo = new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", month: "long" }).format(proximo);
  return { saludo, fecha: `${mayuscula(p.semana)} ${p.dia} de ${p.mes}`, mes: p.mes, dias, renueva: `Se renueva el 1 de ${mesProximo}.` };
}

/** Clave del día (AAAA-MM-DD) en la hora de México, para agrupar por día. */
export function claveDia(fecha: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(fecha);
}

/** "Hoy", "Ayer" o "6 de octubre" (relativo a `ahora`). */
export function nombreDia(fecha: Date, ahora: Date = new Date()) {
  const hoy = claveDia(ahora);
  const ayer = claveDia(new Date(ahora.getTime() - 86_400_000));
  const k = claveDia(fecha);
  if (k === hoy) return "Hoy";
  if (k === ayer) return "Ayer";
  return new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, day: "numeric", month: "long" }).format(fecha);
}

/** "hace un momento", "hace 25 min", "hace 3 h", "Ayer, 12:01", "6 oct". */
export function haceCuanto(fecha: Date, ahora: Date = new Date()) {
  const min = Math.round((ahora.getTime() - fecha.getTime()) / 60_000);
  const dia = nombreDia(fecha, ahora);
  const hora = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(fecha);
  if (dia === "Hoy") {
    if (min < 1) return "hace un momento";
    if (min < 60) return `hace ${min} min`;
    return `hace ${Math.floor(min / 60)} h`;
  }
  if (dia === "Ayer") return `Ayer, ${hora}`;
  return new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, day: "numeric", month: "short" }).format(fecha).replace(".", "");
}
