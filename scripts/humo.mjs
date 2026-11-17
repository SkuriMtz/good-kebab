#!/usr/bin/env node
/**
 * PRUEBA DE HUMO: ¿la app arrancada responde lo mínimo y con sus defensas puestas?
 *
 *   BASE_URL=http://localhost:3000 npm run humo
 *
 * - BASE_URL: dónde está la app (por omisión http://localhost:3000).
 * - HUMO_PRODUCCION=1 / 0: si la app corre como producción (VERCEL_ENV=production).
 *   Por omisión se supone producción si BASE_URL no es localhost. Solo así se
 *   exige que /api/demo/estado no muestre "entorno".
 *
 * No necesita sesión ni llaves: solo revisa lo que debe estar cerrado. Sale con
 * código 1 si algo falla.
 */
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const ES_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(BASE);
const PRODUCCION = process.env.HUMO_PRODUCCION ? process.env.HUMO_PRODUCCION === "1" : !ES_LOCAL;

const resultados = [];
const revisar = async (nombre, f) => {
  try {
    const nota = await f();
    resultados.push({ nombre, ok: true, nota });
    console.log(`  ok   ${nombre}${nota ? ` (${nota})` : ""}`);
  } catch (e) {
    resultados.push({ nombre, ok: false, nota: e.message });
    console.log(`  FALLA ${nombre}: ${e.message}`);
  }
};
const exigir = (cond, mensaje) => {
  if (!cond) throw new Error(mensaje);
};
const pedir = (ruta, init = {}) => fetch(BASE + ruta, { redirect: "manual", signal: AbortSignal.timeout(30_000), ...init });
const json = { "Content-Type": "application/json" };

console.log(`Prueba de humo contra ${BASE} (${PRODUCCION ? "como producción" : "sin modo producción"})`);

for (const ruta of ["/", "/entrar", "/precios"]) {
  await revisar(`GET ${ruta} → 200`, async () => {
    const r = await pedir(ruta);
    exigir(r.status === 200, `respondió ${r.status}`);
  });
}

await revisar("GET /panel sin sesión → redirige a /entrar", async () => {
  const r = await pedir("/panel");
  exigir([301, 302, 303, 307, 308].includes(r.status), `respondió ${r.status}, esperaba una redirección`);
  const donde = r.headers.get("location") || "";
  exigir(/\/entrar(\?|$|\/)/.test(new URL(donde, BASE).pathname + new URL(donde, BASE).search), `redirige a ${donde || "(nada)"}`);
});

await revisar("POST /api/chat sin sesión → 401", async () => {
  const r = await pedir("/api/chat", { method: "POST", headers: json, body: JSON.stringify({ mensajes: [{ rol: "user", contenido: "hola" }] }) });
  exigir(r.status === 401, `respondió ${r.status}`);
});

await revisar("POST /api/trabajo sin llave → 401", async () => {
  const r = await pedir("/api/trabajo", { method: "POST", headers: json, body: "{}" });
  exigir(r.status === 401, `respondió ${r.status}`);
});

await revisar("POST /api/traducir sin sesión → 401 o 403", async () => {
  const r = await pedir("/api/traducir", { method: "POST", headers: json, body: JSON.stringify({ textos: ["hola"], idioma: "en" }) });
  exigir(r.status === 401 || r.status === 403, `respondió ${r.status}`);
});

await revisar("Cabeceras de seguridad y sin X-Powered-By", async () => {
  const r = await pedir("/");
  const faltan = ["content-security-policy", "strict-transport-security", "x-frame-options"].filter((h) => !r.headers.get(h));
  exigir(faltan.length === 0, `faltan: ${faltan.join(", ")}`);
  exigir(!r.headers.has("x-powered-by"), `X-Powered-By presente: ${r.headers.get("x-powered-by")}`);
});

await revisar("GET /api/demo/estado no expone \"entorno\" en producción", async () => {
  const r = await pedir("/api/demo/estado");
  const cuerpo = await r.text();
  if (!PRODUCCION) return "omitida: la app no corre como producción (usa HUMO_PRODUCCION=1)";
  exigir(r.status === 200, `respondió ${r.status}`);
  exigir(!/"entorno"|que_falta|llave_de_ia/.test(cuerpo), `la respuesta revela el entorno: ${cuerpo.slice(0, 120)}`);
});

const falladas = resultados.filter((x) => !x.ok);
console.log(`\n${resultados.length - falladas.length} de ${resultados.length} revisiones bien.`);
process.exit(falladas.length ? 1 : 0);
