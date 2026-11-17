/*
 * Atendel · trabajador del navegador (service worker).
 * Hace tres cosas: muestra las notificaciones que manda el servidor; al
 * tocar una, abre el panel en el lugar justo; y si no hay internet al abrir
 * una página, muestra un aviso de «sin conexión» en vez del error del
 * navegador. No guarda NADA en caché (ni páginas ni datos tuyos).
 * Solo abre enlaces del panel (/panel…): nunca otro sitio.
 */

const ENLACE = /^\/panel(\?[A-Za-z0-9=&_.:%-]{0,290})?$/;
const enlaceSeguro = (x) => (typeof x === "string" && ENLACE.test(x) ? x : "/panel");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch (_) {
    d = {};
  }
  const titulo = typeof d.titulo === "string" && d.titulo.trim() ? d.titulo.slice(0, 120) : "Atendel";
  const texto = typeof d.texto === "string" ? d.texto.slice(0, 400) : "";
  const etiqueta = typeof d.etiqueta === "string" && /^[a-z0-9_]{2,30}$/.test(d.etiqueta) ? d.etiqueta : undefined;
  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: texto,
      icon: "/iconos/icono-192.png",
      badge: "/iconos/insignia-96.png",
      lang: "es",
      tag: etiqueta,
      // Las del mismo tipo se reemplazan, pero igual suenan
      renotify: Boolean(etiqueta),
      data: { enlace: enlaceSeguro(d.enlace) },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = new URL(enlaceSeguro(e.notification.data && e.notification.data.enlace), self.location.origin).href;
  e.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const v of ventanas) {
        if (new URL(v.url).origin !== self.location.origin) continue;
        try {
          const lista = await v.navigate(destino);
          if (lista) return lista.focus();
        } catch (_) {
          /* esa ventana no se deja mover: se abre otra */
        }
      }
      return self.clients.openWindow(destino);
    })(),
  );
});

// Si el navegador cambia la suscripción por su cuenta, se vuelve a guardar
const aBytes = (b64) => {
  const t = (b64 + "===".slice((b64.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
};
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil(
    (async () => {
      const r = await fetch("/api/avisos/llave", { credentials: "same-origin" });
      if (!r.ok) return;
      const { publica } = await r.json();
      const nueva = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(publica) });
      await fetch("/api/avisos/push", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suscripcion: nueva.toJSON() }),
      });
    })().catch(() => undefined),
  );
});

/* ---------- Sin conexión ---------- */

const SIN_CONEXION = {
  es: { titulo: "Sin conexión", texto: "No hay internet en este momento. Cuando vuelva, toca «Intentar de nuevo».", boton: "Intentar de nuevo" },
  en: { titulo: "You're offline", texto: "There's no internet right now. When it's back, tap “Try again”.", boton: "Try again" },
};

function paginaSinConexion(idioma) {
  const t = SIN_CONEXION[idioma] || SIN_CONEXION.en;
  return `<!doctype html><html lang="${idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atendel · ${t.titulo}</title>
<style>
:root{color-scheme:dark light;--fondo:#000;--texto:#ededed;--suave:#a1a1a1;--accion:#0071e3}
@media (prefers-color-scheme:light){:root{--fondo:#fafafa;--texto:#171717;--suave:#525252}}
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px 16px;background:var(--fondo);color:var(--texto);font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:420px;display:grid;gap:14px}.puntos{display:grid;grid-template-columns:repeat(2,12px);gap:4px}.puntos i{width:12px;height:12px;border-radius:50%;display:block}
h1{margin:8px 0 0;font-size:32px;font-weight:500;letter-spacing:-0.02em}p{margin:0;color:var(--suave);line-height:1.5}
a{justify-self:start;margin-top:8px;display:inline-flex;align-items:center;min-height:44px;padding:0 20px;border-radius:999px;background:var(--accion);color:#fff;text-decoration:none;font-weight:600}
a:focus-visible{outline:2px solid var(--accion);outline-offset:3px}
</style></head><body><main>
<div class="puntos" aria-hidden="true"><i style="background:#ff8a6b"></i><i style="background:#7fb2ff"></i><i style="background:#5fd09f"></i><i style="background:#f6c64a"></i></div>
<h1>${t.titulo}</h1><p>${t.texto}</p><a href="">${t.boton}</a>
</main></body></html>`;
}

self.addEventListener("fetch", (e) => {
  const r = e.request;
  // Solo al abrir una página de Atendel (nunca la API ni archivos, ni otros sitios)
  if (r.mode !== "navigate" || r.method !== "GET") return;
  const url = new URL(r.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(r).catch(() => {
      const idioma = url.pathname.startsWith("/panel") || url.pathname.startsWith("/pruebalo") || String(self.navigator.language || "").toLowerCase().startsWith("es") ? "es" : "en";
      return new Response(paginaSinConexion(idioma), { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }),
  );
});
