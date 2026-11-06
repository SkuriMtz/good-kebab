import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * CIFRADO DE SECRETOS (solo en el servidor)
 *
 * Los tokens de las apps conectadas (Google, Microsoft, Notion) se guardan
 * cifrados en la tabla `conexiones` (columna token_cifrado). Así, aunque
 * alguien viera la base de datos, no podría usarlos sin la llave.
 *
 * - Algoritmo: AES-256-GCM (cifra y además detecta si alguien alteró el texto).
 * - Llave: la variable ATENDEL_LLAVE_CIFRADO en Vercel, 32 bytes en base64
 *   (se genera con `openssl rand -base64 32`). Nunca va en el código.
 * - cifrar/descifrar trabajan con texto; cifrarJson/descifrarJson, con objetos.
 * - Formato: "v1.<iv>.<tag>.<datos>", cada parte en base64url. El IV es
 *   aleatorio (12 bytes) en cada cifrado.
 * - `contexto` (opcional): un texto que se amarra al cifrado (p. ej. el
 *   id de la persona y el proveedor). Si al descifrar no es el mismo, falla.
 *
 * Si cambias la llave, los tokens guardados ya no se pueden leer: la
 * persona tendría que volver a conectar sus apps.
 */

const VERSION = "v1";
const LARGO_IV = 12;
const LARGO_TAG = 16;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const BASE64URL = /^[A-Za-z0-9_-]*$/;

export class ErrorCifrado extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorCifrado";
  }
}

/** Lee y revisa la llave cada vez (así un cambio en Vercel aplica sin redeploy de código). */
function llave(): Buffer {
  const texto = (process.env.ATENDEL_LLAVE_CIFRADO ?? "").replace(/\s+/g, "");
  if (!texto) {
    throw new ErrorCifrado(
      "Falta la llave de cifrado: agrega ATENDEL_LLAVE_CIFRADO en Vercel (32 bytes en base64; se genera con `openssl rand -base64 32`).",
    );
  }
  const bytes = BASE64.test(texto) ? Buffer.from(texto, "base64") : Buffer.alloc(0);
  if (bytes.length !== 32) {
    throw new ErrorCifrado(
      "La llave ATENDEL_LLAVE_CIFRADO no es válida: tiene que ser de 32 bytes en base64 (genera una nueva con `openssl rand -base64 32`).",
    );
  }
  return bytes;
}

/** ¿Está configurada la llave? (para avisar en la interfaz sin lanzar error). */
export function hayLlaveCifrado(): boolean {
  try {
    llave();
    return true;
  } catch {
    return false;
  }
}

/** Cifra un texto (p. ej. JSON.stringify(tokens)). */
export function cifrar(texto: string, contexto?: string): string {
  if (typeof texto !== "string") throw new ErrorCifrado("Solo se cifra texto: usa cifrarJson para objetos.");
  const iv = randomBytes(LARGO_IV);
  const cifrador = createCipheriv("aes-256-gcm", llave(), iv, { authTagLength: LARGO_TAG });
  if (contexto) cifrador.setAAD(Buffer.from(contexto, "utf8"));
  const datos = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final()]);
  const tag = cifrador.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), datos.toString("base64url")].join(".");
}

/** Descifra lo que dio `cifrar`. Falla si el texto se alteró, la llave cambió o el contexto no coincide. */
export function descifrar(texto: string, contexto?: string): string {
  const partes = typeof texto === "string" ? texto.split(".") : [];
  if (partes.length !== 4 || partes[0] !== VERSION || !partes.slice(1).every((p) => BASE64URL.test(p))) {
    throw new ErrorCifrado("El texto cifrado no tiene el formato esperado.");
  }
  const iv = Buffer.from(partes[1], "base64url");
  const tag = Buffer.from(partes[2], "base64url");
  const datos = Buffer.from(partes[3], "base64url");
  if (iv.length !== LARGO_IV || tag.length !== LARGO_TAG) {
    throw new ErrorCifrado("El texto cifrado no tiene el formato esperado.");
  }
  const clave = llave();
  try {
    const descifrador = createDecipheriv("aes-256-gcm", clave, iv, { authTagLength: LARGO_TAG });
    if (contexto) descifrador.setAAD(Buffer.from(contexto, "utf8"));
    descifrador.setAuthTag(tag);
    return Buffer.concat([descifrador.update(datos), descifrador.final()]).toString("utf8");
  } catch {
    throw new ErrorCifrado("No se pudo descifrar: el texto se alteró o la llave cambió.");
  }
}

/** Atajo: cifra cualquier valor que se pueda pasar a JSON (p. ej. los Tokens). */
export function cifrarJson(valor: unknown, contexto?: string): string {
  const json = JSON.stringify(valor);
  if (json === undefined) throw new ErrorCifrado("No se puede cifrar un valor vacío.");
  return cifrar(json, contexto);
}

/** Atajo: descifra y lee el JSON que guardó `cifrarJson`. */
export function descifrarJson<T = unknown>(texto: string, contexto?: string): T {
  return JSON.parse(descifrar(texto, contexto)) as T;
}
