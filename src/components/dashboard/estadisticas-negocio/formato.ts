import type { Dia } from "@/lib/estadisticas";

/* Cómo se escriben los números, las fechas y las horas en Estadísticas (es-MX). */

const numero = new Intl.NumberFormat("es-MX");

/** 1,284 · sin datos: "—". */
export const cifra = (n: number | null | undefined) => (n === null || n === undefined ? "—" : numero.format(n));

/** "1 cliente", "12 clientes". */
export const cuenta = (n: number, una: string, varias: string) => `${numero.format(n)} ${n === 1 ? una : varias}`;

// Un día se pinta a mediodía UTC: así ninguna zona lo mueve al día anterior
const aFecha = (dia: Dia) => new Date(`${dia}T12:00:00Z`);
const sinPunto = (t: string) => t.replace(/\./g, "");

const fCorta = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
const fSemana = new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const fLarga = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "UTC" });
const fDiaSemana = new Intl.DateTimeFormat("es-MX", { weekday: "long", timeZone: "UTC" });

/** "4 nov". */
export const fechaCorta = (dia: Dia) => sinPunto(fCorta.format(aFecha(dia)));
/** "mar, 4 nov". */
export const fechaConDia = (dia: Dia) => sinPunto(fSemana.format(aFecha(dia)));
/** "4 de noviembre". */
export const fechaLarga = (dia: Dia) => fLarga.format(aFecha(dia));
/** "martes". */
export const nombreDia = (dia: Dia) => fDiaSemana.format(aFecha(dia));

/** Lunes = 0. */
export const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
export const DIAS_LARGOS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"] as const;

/** "Del 6 de octubre al 4 de noviembre" · "Del 1 al 4 de noviembre" · "El 4 de noviembre". */
export function rangoTexto(desde: Dia, hasta: Dia) {
  if (desde === hasta) return `El ${fechaLarga(hasta)}`;
  if (desde.slice(0, 7) === hasta.slice(0, 7)) return `Del ${Number(desde.slice(8))} al ${fechaLarga(hasta)}`;
  return `Del ${fechaLarga(desde)} al ${fechaLarga(hasta)}`;
}

const sufijo = (h: number) => (h % 24 < 12 ? "a. m." : "p. m.");
const doce = (h: number) => (h % 12 === 0 ? 12 : h % 12);

/** 0 → "12 a. m.", 15 → "3 p. m.". */
export const hora = (h: number) => `${doce(h)} ${sufijo(h)}`;

/** La hora que empieza en h: "10 a 11 a. m." · "11 a. m. a 12 p. m.". */
export function rangoHora(h: number) {
  const fin = (h + 1) % 24;
  return sufijo(h) === sufijo(fin) ? `${doce(h)} a ${doce(fin)} ${sufijo(fin)}` : `${hora(h)} a ${hora(fin)}`;
}

/** "Lola", "Lola y Clara", "Lola, Clara e Iris". */
export function lista(nombres: string[]) {
  if (nombres.length < 2) return nombres.join("");
  const ultimo = nombres[nombres.length - 1];
  const y = /^h?i/i.test(ultimo.normalize("NFD")) ? "e" : "y";
  return `${nombres.slice(0, -1).join(", ")} ${y} ${ultimo}`;
}
