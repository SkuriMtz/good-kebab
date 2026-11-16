/*
 * Atendel · trabajador del navegador (service worker).
 * Solo hace dos cosas: muestra las notificaciones que manda el servidor y,
 * al tocar una, abre el panel en el lugar justo. No guarda nada en caché.
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
