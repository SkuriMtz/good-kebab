/**
 * AVISOS EN ESTE APARATO (solo en el navegador): activar o apagar las
 * notificaciones de la app y saber si Atendel se puede instalar.
 * El servidor guarda la suscripción (/api/avisos/push) y manda las
 * notificaciones (src/lib/notificar.ts); public/sw.js las muestra.
 */

export type EstadoAparato = "cargando" | "sin-soporte" | "instalar-ios" | "bloqueado" | "apagado" | "activo";

const hayVentana = () => typeof window !== "undefined";

export const soportaAvisos = () => hayVentana() && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const esIOS = () => hayVentana() && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
export const estaInstalada = () => hayVentana() && (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

/** Registra el trabajador de las notificaciones (public/sw.js). */
export async function registrarTrabajador(): Promise<ServiceWorkerRegistration | null> {
  if (!hayVentana() || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch {
    return null;
  }
}

async function suscripcionActual(): Promise<PushSubscription | null> {
  if (!soportaAvisos()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function estadoAparato(): Promise<{ estado: EstadoAparato; endpoint: string | null }> {
  if (!soportaAvisos()) return { estado: esIOS() && !estaInstalada() ? "instalar-ios" : "sin-soporte", endpoint: null };
  if (Notification.permission === "denied") return { estado: "bloqueado", endpoint: null };
  const s = await suscripcionActual().catch(() => null);
  return s && Notification.permission === "granted" ? { estado: "activo", endpoint: s.endpoint } : { estado: "apagado", endpoint: null };
}

const aBytes = (b64: string) => {
  const t = (b64 + "===".slice((b64.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
};

const mismaLlave = (a: ArrayBuffer | null | undefined, b: Uint8Array) => {
  if (!a) return false;
  const x = new Uint8Array(a);
  return x.length === b.length && x.every((v, i) => v === b[i]);
};

async function errorDe(r: Response, siNo: string): Promise<string> {
  try {
    const j = (await r.json()) as { error?: unknown };
    return typeof j?.error === "string" ? j.error : siNo;
  } catch {
    return siNo;
  }
}

/** Pide permiso y activa los avisos en este aparato. Devuelve el error para mostrar, o null si quedó. */
export async function activarAvisos(): Promise<string | null> {
  if (!soportaAvisos()) return esIOS() ? "En iPhone, primero agrega Atendel a tu pantalla de inicio y ábrelo desde ahí." : "Este navegador no puede mostrar notificaciones.";
  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted")
      return permiso === "denied" ? "Bloqueaste las notificaciones. Permítelas para este sitio en la configuración del navegador y vuelve a intentar." : "No diste permiso para las notificaciones.";
    const reg = await registrarTrabajador();
    if (!reg) return "No se pudo preparar este navegador para los avisos.";
    await navigator.serviceWorker.ready;
    const r = await fetch("/api/avisos/llave", { cache: "no-store" });
    if (!r.ok) return errorDe(r, "No se pudieron preparar los avisos. Intenta en un momento.");
    const { publica } = (await r.json()) as { publica: string };
    const llave = aBytes(publica);
    let s = await reg.pushManager.getSubscription();
    // Si era de otras llaves, ya no sirve
    if (s && !mismaLlave(s.options.applicationServerKey, llave)) {
      await s.unsubscribe().catch(() => false);
      s = null;
    }
    if (!s) s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: llave });
    const g = await fetch("/api/avisos/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suscripcion: s.toJSON() }) });
    if (!g.ok) return errorDe(g, "No pudimos guardar este aparato. Intenta de nuevo.");
    return null;
  } catch {
    return "No se pudieron activar los avisos en este navegador. Intenta de nuevo.";
  }
}

/** Apaga los avisos en este aparato (y lo quita de tu lista). */
export async function apagarAvisos(): Promise<string | null> {
  try {
    const s = await suscripcionActual();
    if (!s) return null;
    const endpoint = s.endpoint;
    await s.unsubscribe().catch(() => false);
    const r = await fetch("/api/avisos/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint }) });
    return r.ok ? null : errorDe(r, "No pudimos quitar este aparato de tu lista.");
  } catch {
    return "No se pudieron apagar los avisos. Intenta de nuevo.";
  }
}

/* ---------- Instalar Atendel como app ---------- */

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
declare global {
  interface Window {
    /** El aviso de instalar del navegador, guardado por SCRIPT_INSTALAR (src/app/layout.tsx). */
    __atendelInstalar?: EventoInstalar | null;
  }
}

/**
 * Corre antes de que cargue la página: el navegador avisa una sola vez que
 * Atendel se puede instalar; se guarda para el botón «Instalar Atendel».
 */
export const SCRIPT_INSTALAR =
  "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__atendelInstalar=e;window.dispatchEvent(new Event('atendel:instalar'));});window.addEventListener('appinstalled',function(){window.__atendelInstalar=null;window.dispatchEvent(new Event('atendel:instalar'));});";

export const puedeInstalar = () => hayVentana() && Boolean(window.__atendelInstalar);

export function alCambiarInstalacion(f: () => void): () => void {
  if (!hayVentana()) return () => undefined;
  window.addEventListener("atendel:instalar", f);
  return () => window.removeEventListener("atendel:instalar", f);
}

/** Abre el aviso de instalar del navegador. true si la persona dijo que sí. */
export async function instalar(): Promise<boolean> {
  const e = hayVentana() ? window.__atendelInstalar : null;
  if (!e) return false;
  try {
    await e.prompt();
    const r = await e.userChoice;
    return r.outcome === "accepted";
  } catch {
    return false;
  } finally {
    window.__atendelInstalar = null;
    window.dispatchEvent(new Event("atendel:instalar"));
  }
}
