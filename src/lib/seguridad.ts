import "server-only";
import { createHash, createHmac } from "node:crypto";
import { clienteServicio } from "./supabase/servicio";

/**
 * SEGURIDAD COMPARTIDA (migración 0030):
 * - ipDe(): la IP de quien llama. En Vercel, x-real-ip / x-forwarded-for los
 *   pone Vercel y no se pueden falsificar desde fuera (Vercel reemplaza lo
 *   que mande el visitante). Fuera de Vercel (local) no son confiables.
 * - pasarLimite(): límite de intentos guardado en la base (compartido entre
 *   todos los servidores; antes vivía en la memoria de cada uno).
 * - registrarEvento(): bitácora de lo sospechoso (tabla eventos_seguridad),
 *   con la IP en hash (nunca la IP).
 */

type ConCabeceras = { headers: Headers };

export function ipDe(req: ConCabeceras): string {
  const h = req.headers;
  const ip = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  return /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip : "sin-ip";
}

/** La IP en hash (con una llave del servidor si existe): sirve para contar sin guardar la IP. */
export function hashIp(ip: string): string {
  const llave = process.env.ATENDEL_LLAVE_CIFRADO;
  return (llave ? createHmac("sha256", llave).update(`ip|${ip}`) : createHash("sha256").update(`atendel-ip|${ip}`)).digest("hex").slice(0, 32);
}

/**
 * ¿Puede pasar? Cuenta un intento con esa clave en una ventana de `segundos`.
 * Si la base no responde: `siFalla` (true deja pasar; false lo frena, para lo
 * que gasta dinero, como la IA).
 */
export async function pasarLimite(clave: string, max: number, segundos: number, siFalla: boolean): Promise<boolean> {
  const admin = clienteServicio();
  if (!admin) return siFalla;
  const { data, error } = await admin.rpc("pasar_limite", { p_clave: clave.slice(0, 200), p_max: max, p_segundos: segundos });
  if (error || typeof data !== "boolean") return siFalla;
  return data;
}

const TIPO = /^[a-z0-9_]{3,40}$/;

/** Anota algo sospechoso en la bitácora (sin datos personales). Nunca truena ni frena la respuesta por fallar. */
export async function registrarEvento(tipo: string, req?: ConCabeceras & { url?: string }, detalle?: string): Promise<void> {
  try {
    if (!TIPO.test(tipo)) return;
    const admin = clienteServicio();
    if (!admin) return;
    const ip = req ? hashIp(ipDe(req)) : null;
    // Que un ataque no llene la bitácora: 20 por hora por tipo e IP
    if (!(await pasarLimite(`evento:${tipo}:${ip ?? "-"}`, 20, 3600, false))) return;
    let ruta: string | null = null;
    try {
      ruta = req?.url ? new URL(req.url).pathname.slice(0, 200) : null;
    } catch {
      ruta = null;
    }
    await admin.from("eventos_seguridad").insert({ tipo, ruta, ip_hash: ip, detalle: detalle ? detalle.replace(/[\u0000-\u001f]/g, " ").slice(0, 300) : null });
    console.warn(`[seguridad] ${tipo}${ruta ? ` ${ruta}` : ""}`);
  } catch {
    /* la bitácora nunca rompe la petición */
  }
}
