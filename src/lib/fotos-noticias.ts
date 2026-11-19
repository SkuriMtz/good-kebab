import "server-only";
import { lookup } from "node:dns/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
import { esIpPrivada, fotoEnHtml, rutaDeFoto, tipoDeImagen, urlDeFoto, urlSegura, type Noticia } from "./noticias";

/*
 * LA FOTO DE CADA NOTICIA: la que el mismo medio publica para compartir la
 * nota (og:image). El servidor la baja una vez al día y la guarda en Supabase
 * Storage (bucket público «noticias»), así el panel no carga imágenes de
 * cualquier sitio.
 *
 * Cuidado al llamar a direcciones de fuera (SSRF): solo https, sin IP ni
 * puerto, el nombre no puede apuntar a una red privada, cada redirección se
 * vuelve a revisar, con tiempo y tamaño máximos; y la imagen se acepta solo
 * si sus bytes son de JPG, PNG o WebP (nada de SVG).
 */

const TIEMPO = 6_000;
const MAX_HTML = 400_000;
const MAX_FOTO = 2_500_000;
const AGENTE = "Mozilla/5.0 (compatible; AtendelBot/1.0; vista previa de noticias)";

/** Lee el cuerpo hasta `max` bytes; si es más grande, corta ahí (para el HTML) o falla (para la foto). */
async function leerHasta(r: Response, max: number, cortar: boolean): Promise<Uint8Array | null> {
  if (!r.body) return null;
  const lector = r.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await lector.cancel().catch(() => {});
      if (!cortar) return null;
      partes.push(value.slice(0, value.length - (total - max)));
      break;
    }
    partes.push(value);
  }
  const salida = new Uint8Array(partes.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of partes) {
    salida.set(p, i);
    i += p.length;
  }
  return salida;
}

/** GET a una dirección pública, revisando cada salto. Regresa la respuesta (sin leer) o null. */
async function traer(url: string, acepta: string): Promise<{ r: Response; url: string } | null> {
  let actual = urlSegura(url);
  for (let salto = 0; actual && salto < 4; salto++) {
    const host = new URL(actual).hostname;
    const ips = await lookup(host, { all: true }).catch(() => []);
    if (!ips.length || ips.some((d) => esIpPrivada(d.address))) return null;
    const r = await fetch(actual, { redirect: "manual", signal: AbortSignal.timeout(TIEMPO), headers: { "User-Agent": AGENTE, Accept: acepta } }).catch(() => null);
    if (!r) return null;
    if (r.status >= 300 && r.status < 400) {
      const destino = r.headers.get("location");
      await r.body?.cancel().catch(() => {});
      actual = destino ? urlSegura(new URL(destino, actual).toString()) : null;
      continue;
    }
    if (!r.ok) {
      await r.body?.cancel().catch(() => {});
      return null;
    }
    return { r, url: actual };
  }
  return null;
}

/** La foto de una nota: sus bytes y su tipo, o null si no tiene o no se pudo. */
async function fotoDe(pagina: string): Promise<{ datos: Uint8Array; ext: "jpg" | "png" | "webp" } | null> {
  const p = await traer(pagina, "text/html,application/xhtml+xml");
  if (!p) return null;
  if (!/text\/html|application\/xhtml/i.test(p.r.headers.get("content-type") ?? "")) {
    await p.r.body?.cancel().catch(() => {});
    return null;
  }
  const html = await leerHasta(p.r, MAX_HTML, true);
  const foto = html ? fotoEnHtml(new TextDecoder().decode(html), p.url) : null;
  if (!foto) return null;
  const f = await traer(foto, "image/jpeg,image/png,image/webp");
  if (!f) return null;
  const datos = await leerHasta(f.r, MAX_FOTO, false);
  const ext = datos ? tipoDeImagen(datos) : null;
  return datos && ext && datos.length > 2_000 ? { datos, ext } : null;
}

const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

/**
 * Baja y guarda la foto de cada noticia (en paralelo; la que falle se queda
 * sin foto) y borra las de días pasados de esa clave.
 */
export async function guardarFotos(admin: SupabaseClient, clave: string, dia: string, noticias: Noticia[]): Promise<Noticia[]> {
  const conFoto = await Promise.all(
    noticias.map(async (n, i) => {
      try {
        const f = await fotoDe(n.url);
        if (!f) return n;
        const ruta = rutaDeFoto(clave, dia, i + 1, f.ext);
        const { error } = await admin.storage.from("noticias").upload(ruta, f.datos, { contentType: MIME[f.ext], upsert: true, cacheControl: "86400" });
        if (error) return n;
        return { ...n, foto: ruta };
      } catch {
        return n;
      }
    }),
  );
  // Las fotos de otros días ya no se usan
  const carpeta = rutaDeFoto(clave, dia, 1, "jpg").split("/")[0];
  const { data: viejas } = await admin.storage.from("noticias").list(carpeta, { limit: 100 });
  const borrar = (viejas ?? []).filter((o) => !o.name.startsWith(`${dia}-`)).map((o) => `${carpeta}/${o.name}`);
  if (borrar.length) await admin.storage.from("noticias").remove(borrar);
  return conFoto;
}

/** Para mandar al navegador: la ruta guardada se vuelve la dirección pública. */
export const conUrlDeFoto = (n: Noticia): Noticia => {
  const url = n.foto ? urlDeFoto(n.foto) : null;
  return { id: n.id, titulo: n.titulo, resumen: n.resumen, fuente: n.fuente, url: n.url, ...(url ? { foto: url } : {}) };
};
