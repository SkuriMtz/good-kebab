import "server-only";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { request } from "node:https";
import type { LookupFunction } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import { esIpPrivada, fotoEnHtml, rutaDeFoto, tipoDeImagen, urlDeFoto, urlSegura, type Noticia } from "./noticias";

/*
 * LA FOTO DE CADA NOTICIA: la que el mismo medio publica para compartir la
 * nota (og:image). El servidor la baja una vez al día y la guarda en Supabase
 * Storage (bucket público «noticias»), así el panel no carga imágenes de
 * cualquier sitio.
 *
 * Cuidado al llamar a direcciones de fuera (SSRF): solo https, sin IP ni
 * puerto; la IP se revisa al conectar (solo direcciones públicas: nada de
 * redes privadas, locales ni reservadas); cada redirección se vuelve a
 * revisar; con tiempo y tamaño máximos; y la imagen se acepta solo si sus
 * bytes son de JPG, PNG o WebP (nada de SVG).
 */

const TIEMPO = 6_000;
const MAX_HTML = 400_000;
const MAX_FOTO = 2_500_000;
const AGENTE = "Mozilla/5.0 (compatible; AtendelBot/1.0; vista previa de noticias)";

type Respuesta = { tipo: string; url: string; datos: Uint8Array };

/**
 * La IP se revisa en el momento de conectar (no antes): el socket usa la
 * dirección que esta función aprueba, así un nombre no puede cambiar a una
 * IP interna entre la revisión y la conexión (DNS rebinding).
 */
const lookupSeguro: LookupFunction = (host, opciones, listo) => {
  dnsLookup(host, { ...opciones, all: true }, (error, dirs) => {
    const lista = Array.isArray(dirs) ? dirs : [];
    if (error || !lista.length || lista.some((d) => esIpPrivada(d.address))) {
      (listo as (e: Error | null) => void)(error ?? new Error("dirección no permitida"));
      return;
    }
    if (opciones.all) (listo as (e: null, d: LookupAddress[]) => void)(null, lista);
    else (listo as (e: null, a: string, f: number) => void)(null, lista[0].address, lista[0].family);
  });
};

/** Un GET (sin seguir redirecciones), con tope de tiempo y de bytes. */
function pedir(url: string, acepta: string, max: number, cortar: boolean): Promise<{ status: number; tipo: string; ubicacion: string | null; datos: Uint8Array | null } | null> {
  return new Promise((resolver) => {
    let listo = false;
    const fin = (x: Awaited<ReturnType<typeof pedir>>) => {
      if (listo) return;
      listo = true;
      clearTimeout(reloj);
      resolver(x);
    };
    const req = request(url, { method: "GET", lookup: lookupSeguro, headers: { "User-Agent": AGENTE, Accept: acepta, "Accept-Encoding": "identity" } }, (res) => {
      const status = res.statusCode ?? 0;
      const tipo = String(res.headers["content-type"] ?? "");
      const ubicacion = typeof res.headers.location === "string" ? res.headers.location : null;
      if (status < 200 || status >= 300) {
        // No se lee el cuerpo de una redirección o un error: se corta ya (si no, podría no acabar nunca)
        fin({ status, tipo, ubicacion, datos: null });
        req.destroy();
        return;
      }
      const partes: Buffer[] = [];
      let total = 0;
      res.on("data", (c: Buffer) => {
        if (listo) return;
        total += c.length;
        if (total > max) {
          if (cortar) partes.push(c.subarray(0, c.length - (total - max)));
          fin(cortar ? { status, tipo, ubicacion, datos: new Uint8Array(Buffer.concat(partes)) } : null);
          req.destroy();
          return;
        }
        partes.push(c);
      });
      res.on("end", () => fin({ status, tipo, ubicacion, datos: new Uint8Array(Buffer.concat(partes)) }));
      res.on("error", () => fin(null));
    });
    const reloj = setTimeout(() => {
      fin(null);
      req.destroy();
    }, TIEMPO);
    req.on("error", () => fin(null));
    req.end();
  });
}

/** GET a una dirección pública: cada salto (redirección) se vuelve a revisar, máximo 3. */
async function traer(url: string, acepta: string, max: number, cortar: boolean): Promise<Respuesta | null> {
  let actual = urlSegura(url);
  for (let salto = 0; actual && salto < 4; salto++) {
    const r = await pedir(actual, acepta, max, cortar);
    if (!r) return null;
    if (r.status >= 300 && r.status < 400) {
      try {
        actual = r.ubicacion ? urlSegura(new URL(r.ubicacion, actual).toString()) : null;
      } catch {
        return null;
      }
      continue;
    }
    return r.datos ? { tipo: r.tipo, url: actual, datos: r.datos } : null;
  }
  return null;
}

/** La foto de una nota: sus bytes y su tipo, o null si no tiene o no se pudo. */
async function fotoDe(pagina: string): Promise<{ datos: Uint8Array; ext: "jpg" | "png" | "webp" } | null> {
  const p = await traer(pagina, "text/html,application/xhtml+xml", MAX_HTML, true);
  if (!p || !/text\/html|application\/xhtml/i.test(p.tipo)) return null;
  const foto = fotoEnHtml(new TextDecoder().decode(p.datos), p.url);
  if (!foto) return null;
  const f = await traer(foto, "image/jpeg,image/png,image/webp", MAX_FOTO, false);
  const ext = f ? tipoDeImagen(f.datos) : null;
  return f && ext && f.datos.length > 2_000 ? { datos: f.datos, ext } : null;
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
