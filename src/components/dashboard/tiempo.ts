"use client";

import { useEffect, useState } from "react";

/**
 * La hora del navegador (no la del servidor): el saludo, la fecha y las
 * horas relativas ("hace 12 min") se calculan en el equipo de quien mira,
 * con su zona horaria. Mientras no hay hora (primer pintado), vale null y
 * los textos de tiempo quedan vacíos en un espacio reservado.
 */
export function useAhora(cadaMs = 60_000) {
  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    setAhora(new Date());
    const t = window.setInterval(() => setAhora(new Date()), cadaMs);
    return () => window.clearInterval(t);
  }, [cadaMs]);
  return ahora;
}

export function saludo(ahora: Date | null) {
  if (!ahora) return "Hola";
  const h = ahora.getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

const capital = (t: string) => t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1);

/** "Miércoles 8 de octubre". */
export function fechaLarga(ahora: Date) {
  return capital(ahora.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }));
}

/** Nombre del mes en curso: "octubre". */
export const mesActualNombre = (ahora: Date) => ahora.toLocaleDateString("es-MX", { month: "long" });

/** "1 de noviembre": cuándo se renueva el plan (el primer día del mes que sigue). */
export function primeroDelSiguienteMes(ahora: Date) {
  const d = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
}

const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hora = (d: Date) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Fecha de un evento: la real (ISO) o la de ejemplo (minutos antes de ahora). */
export function fechaDe(item: { fecha?: string; haceMin?: number }, ahora: Date | null): Date | null {
  if (item.fecha) return new Date(item.fecha);
  if (typeof item.haceMin === "number" && ahora) return new Date(ahora.getTime() - item.haceMin * 60_000);
  return null;
}

/** Hora relativa, corta y en español de México: "ahora", "hace 12 min", "hace 3 h", "ayer, 12:01", "el lunes", "3 oct". */
export function relativo(fecha: Date | null, ahora: Date | null) {
  if (!fecha || !ahora) return "";
  const min = Math.round((ahora.getTime() - fecha.getTime()) / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  if (mismoDia(fecha, ahora)) return `hace ${Math.floor(min / 60)} h`;
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (mismoDia(fecha, ayer)) return `ayer, ${hora(fecha)}`;
  if (min < 6 * 24 * 60) return `el ${fecha.toLocaleDateString("es-MX", { weekday: "long" })}`;
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

/** Fecha completa para el globo del cursor: "miércoles 8 de octubre, 10:05". */
export function completa(fecha: Date | null) {
  if (!fecha) return undefined;
  return `${fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}, ${hora(fecha)}`;
}

/** "8 oct" para la línea de novedades (fechas fijas del historial). */
export function fechaCorta(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
