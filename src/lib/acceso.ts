/**
 * ACCESO SIN CONTRASEÑAS: las reglas que comparten el navegador y el servidor.
 *
 * El inicio de sesión y el alta de cuenta van con un código de 6 dígitos que
 * llega al correo (o con Google). Aquí viven:
 * - el contrato de /api/acceso/codigo, /api/acceso/verificar y /api/acceso/acepto
 *   (tipos de lo que se manda y de lo que se responde);
 * - las validaciones, como funciones puras (sin red, sin base de datos), para
 *   que el formulario avise lo mismo que el servidor;
 * - las funciones que arman la respuesta a partir de lo que dijo Supabase.
 *
 * Aquí no hay nada secreto: lo secreto (hashes, cookies, la llave de
 * servicio) vive en src/lib/acceso-servidor.ts.
 */
import { correoValido, normalizarCorreo } from "./lista";
import { esTipoNegocio } from "./tipos-negocio";

/* ---------------- Contrato ---------------- */

export type ModoAcceso = "entrar" | "crear";

/** Datos opcionales del alta. nacimiento: "AAAA-MM-DD"; tipo: un id de TIPOS_NEGOCIO. */
/** Datos del alta. Al crear cuenta todos son obligatorios menos `resumen` (unas líneas sobre el negocio). */
export type DatosAlta = { nombre?: string; nacimiento?: string; negocio?: string; tipo?: string; telefono?: string; resumen?: string };

/** POST /api/acceso/codigo (cuerpo ≤ 4 KB). */
export type PeticionCodigo = {
  correo: string;
  modo: ModoAcceso;
  datos?: DatosAlta;
  /** Obligatorio en "crear": acepta Términos y Aviso de privacidad y declara ser mayor de 18. */
  acepta?: boolean;
  /** Campo trampa: las personas lo dejan vacío. */
  sitio_web?: string;
  /** Token de Cloudflare Turnstile (solo si el servidor tiene TURNSTILE_SECRET). */
  turnstile?: string;
};

/** POST /api/acceso/verificar (cuerpo ≤ 1 KB). */
export type PeticionVerificar = { correo: string; codigo: string };

/** El campo al que se refiere un error (para ponerlo junto a ese campo). */
export type CampoAcceso = "correo" | "modo" | "acepta" | "datos" | keyof DatosAlta | "turnstile" | "codigo";

export type ErrorAcceso = { error: string; campo?: CampoAcceso };

/** Éxito de /codigo: SIEMPRE el mismo, exista o no la cuenta. */
export type RespuestaCodigo = { ok: true } | ErrorAcceso;
export type RespuestaVerificar = { ok: true; destino: "/panel" } | ErrorAcceso;
export type RespuestaAcepto = { ok: true } | ErrorAcceso;

export const RUTAS_ACCESO = {
  codigo: "/api/acceso/codigo",
  verificar: "/api/acceso/verificar",
  acepto: "/api/acceso/acepto",
} as const;

/* ---------------- Límites y mensajes ---------------- */

export const LIMITES_ACCESO = {
  nombre: 120,
  negocio: 120,
  resumen: 500,
  /** Largo total del teléfono escrito (con espacios y signos). */
  telefono: 30,
  telefonoDigitosMin: 8,
  telefonoDigitosMax: 20,
  edadMinima: 18,
  /** Nadie nació antes de esto (también lo revisa la base). */
  anioMinimo: 1900,
  turnstile: 2048,
  cuerpoCodigo: 4096,
  cuerpoVerificar: 1024,
  cuerpoAcepto: 4096,
} as const;

export const MENSAJES_ACCESO = {
  cuerpo: "No pudimos leer la petición. Recarga la página e intenta de nuevo.",
  grande: "La petición es demasiado grande.",
  escribeCorreo: "Escribe tu correo.",
  revisaCorreo: "Revisa tu correo: parece que le falta algo (por ejemplo, nombre@negocio.com).",
  acepta: "Para crear tu cuenta, acepta los Términos y el Aviso de privacidad y confirma que eres mayor de edad.",
  datos: "Revisa tus datos e intenta de nuevo.",
  nombre: `Tu nombre puede tener hasta ${LIMITES_ACCESO.nombre} caracteres.`,
  negocio: `El nombre de tu negocio puede tener hasta ${LIMITES_ACCESO.negocio} caracteres.`,
  telefono: "Revisa tu teléfono: de 8 a 20 números; puedes usar espacios, guiones, paréntesis y + al inicio.",
  nacimiento: "Revisa tu fecha de nacimiento.",
  nacimientoFutura: "Tu fecha de nacimiento no puede ser en el futuro.",
  menor: "Para crear una cuenta necesitas ser mayor de 18 años.",
  tipo: "Elige el tipo de negocio de la lista.",
  falta: "Completa este dato para crear tu cuenta.",
  resumen: `El resumen puede tener hasta ${LIMITES_ACCESO.resumen} caracteres.`,
  turnstile: "No pudimos comprobar que eres una persona. Intenta de nuevo.",
  codigoFormato: "El código son 6 números.",
  codigoInvalido: "El código no es correcto o ya venció.",
  limiteCodigo: "Pediste varios códigos en poco tiempo. Espera un rato e intenta de nuevo.",
  limiteIntentos: "Hiciste varios intentos seguidos. Espera unos minutos y pide un código nuevo.",
  servicio: "Ahora no pudimos continuar. Intenta de nuevo en unos minutos.",
} as const;

/* ---------------- Validaciones (puras) ---------------- */

type Fallo = { ok: false; error: string; campo: CampoAcceso };
const fallo = (campo: CampoAcceso, error: string): Fallo => ({ ok: false, error, campo });

/** Caracteres de control e invisibles (bidi, ancho cero) que no van en un nombre. */
const INVISIBLES = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g;

/** Texto de una línea: sin invisibles, espacios juntos y sin orillas. */
export function limpiarTexto(valor: string): string {
  return valor.slice(0, 2000).replace(INVISIBLES, " ").replace(/\s+/g, " ").trim();
}

/** ¿Exactamente 6 dígitos (0-9)? */
export function codigoValido(valor: unknown): valor is string {
  return typeof valor === "string" && /^[0-9]{6}$/.test(valor);
}

/** Solo dígitos, espacios, guiones, paréntesis y + al inicio; de 8 a 20 dígitos; máximo 30 caracteres. */
export function telefonoValido(valor: string): boolean {
  const t = valor.trim();
  if (!t || t.length > LIMITES_ACCESO.telefono) return false;
  if (!/^\+?[0-9 ()-]+$/.test(t)) return false;
  const digitos = t.replace(/[^0-9]/g, "").length;
  return digitos >= LIMITES_ACCESO.telefonoDigitosMin && digitos <= LIMITES_ACCESO.telefonoDigitosMax;
}

/** "AAAA-MM-DD" → [año, mes, día] si es una fecha que existe; si no, null. */
export function partesFecha(valor: string): [number, number, number] | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(valor);
  if (!m) return null;
  const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(Date.UTC(a, mes - 1, d));
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== mes - 1 || f.getUTCDate() !== d) return null;
  return [a, mes, d];
}

/** La fecha de hoy en México ("AAAA-MM-DD"). */
export function hoyEnMexico(ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(ahora);
  const p = (tipo: string) => partes.find((x) => x.type === tipo)?.value ?? "";
  return `${p("year")}-${p("month")}-${p("day")}`;
}

/**
 * Años cumplidos entre `nacimiento` y `hoy` (ambos "AAAA-MM-DD").
 * null si alguna fecha no existe; negativo si nacimiento es después de hoy.
 */
export function edadDesde(nacimiento: string, hoy: string): number | null {
  const n = partesFecha(nacimiento);
  const h = partesFecha(hoy);
  if (!n || !h) return null;
  const aun = h[1] < n[1] || (h[1] === n[1] && h[2] < n[2]);
  return h[0] - n[0] - (aun ? 1 : 0);
}

/** null si la fecha de nacimiento sirve; si no, el mensaje. */
export function revisarNacimiento(valor: string, hoy: string): string | null {
  const n = partesFecha(valor);
  if (!n || n[0] < LIMITES_ACCESO.anioMinimo) return MENSAJES_ACCESO.nacimiento;
  if (valor > hoy) return MENSAJES_ACCESO.nacimientoFutura;
  const edad = edadDesde(valor, hoy);
  if (edad === null) return MENSAJES_ACCESO.nacimiento;
  if (edad < LIMITES_ACCESO.edadMinima) return MENSAJES_ACCESO.menor;
  return null;
}

/** ¿El campo trampa trae algo? (Las personas no lo ven y lo dejan vacío.) */
export function esTrampa(valor: unknown): boolean {
  if (valor === undefined || valor === null) return false;
  return !(typeof valor === "string" && valor.trim() === "");
}

/**
 * Los datos opcionales del alta. Vacíos → se omiten. Devuelve solo los
 * campos conocidos, ya limpios. `hoy` es "AAAA-MM-DD" (hora de México).
 */
export function validarAlta(datos: unknown, hoy: string, obligatorio = false): { ok: true; valor: DatosAlta } | Fallo {
  if (datos === undefined || datos === null) return obligatorio ? fallo("nombre", MENSAJES_ACCESO.falta) : { ok: true, valor: {} };
  if (typeof datos !== "object" || Array.isArray(datos)) return fallo("datos", MENSAJES_ACCESO.datos);
  const d = datos as Record<string, unknown>;
  const valor: DatosAlta = {};

  const texto = (campo: keyof DatosAlta): string | undefined | Fallo => {
    const v = d[campo];
    if (v === undefined || v === null) return undefined;
    if (typeof v !== "string") return fallo(campo, MENSAJES_ACCESO.datos);
    return limpiarTexto(v) || undefined;
  };

  for (const campo of ["nombre", "negocio", "resumen"] as const) {
    const t = texto(campo);
    if (typeof t === "object") return t;
    if (t === undefined) continue;
    if (t.length > LIMITES_ACCESO[campo]) return fallo(campo, MENSAJES_ACCESO[campo]);
    valor[campo] = t;
  }

  const tel = texto("telefono");
  if (typeof tel === "object") return tel;
  if (tel !== undefined) {
    if (!telefonoValido(tel)) return fallo("telefono", MENSAJES_ACCESO.telefono);
    valor.telefono = tel;
  }

  const nac = texto("nacimiento");
  if (typeof nac === "object") return nac;
  if (nac !== undefined) {
    const problema = revisarNacimiento(nac, hoy);
    if (problema) return fallo("nacimiento", problema);
    valor.nacimiento = nac;
  }

  const tipo = texto("tipo");
  if (typeof tipo === "object") return tipo;
  if (tipo !== undefined) {
    if (!esTipoNegocio(tipo)) return fallo("tipo", MENSAJES_ACCESO.tipo);
    valor.tipo = tipo;
  }

  // Al crear cuenta: todo menos el resumen es obligatorio (en el orden del formulario)
  if (obligatorio) {
    for (const campo of ["nombre", "nacimiento", "negocio", "tipo", "telefono"] as const) {
      if (!valor[campo]) return fallo(campo, MENSAJES_ACCESO.falta);
    }
  }

  return { ok: true, valor };
}

/** Lo que /api/acceso/codigo ya puede usar. */
export type PeticionCodigoValida = { correo: string; modo: ModoAcceso; datos: DatosAlta; turnstile: string | null };

/**
 * Revisa el cuerpo de /api/acceso/codigo. "trampa" si el campo trampa viene
 * lleno (se contesta como si todo saliera bien, sin hacer nada).
 */
export function validarPeticionCodigo(
  cuerpo: Record<string, unknown>,
  hoy: string,
): { tipo: "trampa" } | ({ tipo: "error" } & Required<ErrorAcceso>) | { tipo: "ok"; valor: PeticionCodigoValida } {
  if (esTrampa(cuerpo.sitio_web)) return { tipo: "trampa" };
  const error = (f: Fallo) => ({ tipo: "error" as const, error: f.error, campo: f.campo });

  const correoCrudo = typeof cuerpo.correo === "string" ? cuerpo.correo : "";
  if (!correoCrudo.trim()) return error(fallo("correo", MENSAJES_ACCESO.escribeCorreo));
  if (!correoValido(correoCrudo)) return error(fallo("correo", MENSAJES_ACCESO.revisaCorreo));
  const correo = normalizarCorreo(correoCrudo);

  const modo = cuerpo.modo;
  if (modo !== "entrar" && modo !== "crear") return error(fallo("modo", MENSAJES_ACCESO.cuerpo));

  let datos: DatosAlta = {};
  if (modo === "crear") {
    if (cuerpo.acepta !== true) return error(fallo("acepta", MENSAJES_ACCESO.acepta));
    const alta = validarAlta(cuerpo.datos, hoy, true);
    if (!alta.ok) return error(alta);
    datos = alta.valor;
  }

  let turnstile: string | null = null;
  if (cuerpo.turnstile !== undefined && cuerpo.turnstile !== null) {
    const t = cuerpo.turnstile;
    if (typeof t !== "string" || !t || t.length > LIMITES_ACCESO.turnstile) return error(fallo("turnstile", MENSAJES_ACCESO.turnstile));
    turnstile = t;
  }

  return { tipo: "ok", valor: { correo, modo, datos, turnstile } };
}

/** Revisa el cuerpo de /api/acceso/verificar. */
export function validarPeticionVerificar(cuerpo: Record<string, unknown>): ({ tipo: "error" } & Required<ErrorAcceso>) | { tipo: "ok"; valor: PeticionVerificar } {
  const correoCrudo = typeof cuerpo.correo === "string" ? cuerpo.correo : "";
  if (!correoCrudo.trim()) return { tipo: "error", error: MENSAJES_ACCESO.escribeCorreo, campo: "correo" };
  if (!correoValido(correoCrudo)) return { tipo: "error", error: MENSAJES_ACCESO.revisaCorreo, campo: "correo" };
  if (!codigoValido(cuerpo.codigo)) return { tipo: "error", error: MENSAJES_ACCESO.codigoFormato, campo: "codigo" };
  return { tipo: "ok", valor: { correo: normalizarCorreo(correoCrudo), codigo: cuerpo.codigo } };
}

/** "AAAA-MM-DD" (la versión de los textos legales). */
export const versionValida = (v: unknown): v is string => typeof v === "string" && partesFecha(v) !== null;

/** Ventana en la que una cuenta recién creada todavía se considera nueva. */
export const MINUTOS_CUENTA_NUEVA = 30;

/**
 * ¿La cuenta es nueva? Sin perfil del negocio todavía, o creada hace menos
 * de 30 minutos. Solo a una cuenta nueva se le aplican los datos del alta.
 */
export function esCuentaNueva(creadaEn: string | null | undefined, tienePerfil: boolean, ahora: number = Date.now()): boolean {
  if (!tienePerfil) return true;
  const t = creadaEn ? Date.parse(creadaEn) : NaN;
  if (!Number.isFinite(t)) return false;
  const edad = ahora - t;
  return edad > -60_000 && edad < MINUTOS_CUENTA_NUEVA * 60_000;
}

/* ---------------- Lo que dijo Supabase → la respuesta ---------------- */

/**
 * Lo mínimo de un error de Supabase Auth que se usa. El mensaje solo se
 * compara (para saber si es el tope de correos de todo el proyecto); nunca se
 * guarda ni se manda al navegador (puede traer el correo).
 */
export type ErrorAuth = { status?: number; code?: string; message?: string } | null;

/** Lo mínimo del cliente de Supabase para pedir el código (en pruebas, uno falso). */
export type AuthParaPedir = {
  signInWithOtp(credenciales: { email: string; options: { shouldCreateUser: boolean; emailRedirectTo: string } }): Promise<{ error: ErrorAuth }>;
};

/** Lo mínimo del cliente de Supabase para revisar el código. */
export type AuthParaVerificar = {
  verifyOtp(p: { email: string; token: string; type: "email" }): Promise<{ data: { user: UsuarioAcceso | null }; error: ErrorAuth }>;
};

export type UsuarioAcceso = { id: string; email?: string; created_at: string };

/**
 * "limite": Supabase frenó por exceso de intentos; "cliente": rechazó la
 * petición (correo sin cuenta, código malo…); "servicio": no respondió o
 * falló de su lado.
 */
export function clasificarErrorAuth(e: NonNullable<ErrorAuth>): "limite" | "cliente" | "servicio" {
  const s = typeof e.status === "number" ? e.status : 0;
  if (s === 429) return "limite";
  if (s >= 400 && s < 500) return "cliente";
  return "servicio";
}

/** Lo que Supabase contesta cuando el correo no tiene cuenta (en "entrar") o no se aceptan altas. */
export const CODIGOS_SIN_CUENTA = new Set(["otp_disabled", "signup_disabled", "user_not_found"]);

/** Qué pasó por dentro (para la bitácora y los logs; nunca va al navegador). */
export type AvisoAcceso = { tipo: "sin_cuenta" | "rechazo" | "servicio" | "tope_correos"; code: string; status: number };

export type ResultadoCodigo =
  | { status: 200; cuerpo: { ok: true }; aviso: AvisoAcceso | null }
  | { status: 429 | 503; cuerpo: { error: string }; aviso: AvisoAcceso };

/**
 * El tope de correos de TODO el proyecto («email rate limit exceeded»): no
 * depende de la cuenta, así que avisarlo no dice si un correo tiene cuenta.
 * (El otro 429, «solo puedes pedirlo después de N segundos», sí es por cuenta
 * y se sigue contestando igual que un éxito.)
 */
export const esTopeDeCorreos = (e: NonNullable<ErrorAuth>) => e.status === 429 && /email rate limit exceeded/i.test(e.message ?? "");

const avisoDe = (tipo: AvisoAcceso["tipo"], e: NonNullable<ErrorAuth> | null): AvisoAcceso => ({
  tipo,
  code: typeof e?.code === "string" ? e.code.slice(0, 60) : "sin_codigo",
  status: typeof e?.status === "number" ? e.status : 0,
});

/**
 * Pide el código a Supabase y arma la respuesta.
 *
 * ENUMERACIÓN: el éxito es SIEMPRE { ok: true }, exista o no la cuenta. Si
 * Supabase rechaza la petición (correo sin cuenta en "entrar", o ya pidió un
 * código hace poco, que solo pasa con cuentas que existen) se contesta igual.
 * Solo una falla del servicio (sin red, error 5xx) es distinta: 503 genérico;
 * y el tope de correos de todo el proyecto: 429 (no se mandó ningún correo, y
 * decir «revisa tu correo» haría esperar algo que no va a llegar).
 */
export async function pedirCodigo(auth: AuthParaPedir, p: { correo: string; modo: ModoAcceso; redirect: string }): Promise<ResultadoCodigo> {
  const exito = (aviso: AvisoAcceso | null): ResultadoCodigo => ({ status: 200, cuerpo: { ok: true }, aviso });
  let error: ErrorAuth;
  try {
    ({ error } = await auth.signInWithOtp({ email: p.correo, options: { shouldCreateUser: p.modo === "crear", emailRedirectTo: p.redirect } }));
  } catch {
    return { status: 503, cuerpo: { error: MENSAJES_ACCESO.servicio }, aviso: avisoDe("servicio", null) };
  }
  if (!error) return exito(null);
  if (esTopeDeCorreos(error)) return { status: 429, cuerpo: { error: MENSAJES_ACCESO.limiteCodigo }, aviso: avisoDe("tope_correos", error) };
  if (clasificarErrorAuth(error) === "servicio") return { status: 503, cuerpo: { error: MENSAJES_ACCESO.servicio }, aviso: avisoDe("servicio", error) };
  return exito(avisoDe(CODIGOS_SIN_CUENTA.has(error.code ?? "") ? "sin_cuenta" : "rechazo", error));
}

export type ResultadoVerificar =
  | { tipo: "ok"; usuario: UsuarioAcceso }
  | { tipo: "invalido"; aviso: AvisoAcceso }
  | { tipo: "limite"; aviso: AvisoAcceso }
  | { tipo: "servicio"; aviso: AvisoAcceso };

/** Revisa el código con Supabase (type "email": sirve para entrar y para el alta). */
export async function verificarCodigo(auth: AuthParaVerificar, p: PeticionVerificar): Promise<ResultadoVerificar> {
  try {
    const { data, error } = await auth.verifyOtp({ email: p.correo, token: p.codigo, type: "email" });
    if (!error && data.user?.id) return { tipo: "ok", usuario: data.user };
    if (!error) return { tipo: "servicio", aviso: avisoDe("servicio", null) };
    const clase = clasificarErrorAuth(error);
    if (clase === "limite") return { tipo: "limite", aviso: avisoDe("rechazo", error) };
    if (clase === "cliente") return { tipo: "invalido", aviso: avisoDe("rechazo", error) };
    return { tipo: "servicio", aviso: avisoDe("servicio", error) };
  } catch {
    return { tipo: "servicio", aviso: avisoDe("servicio", null) };
  }
}

/** La respuesta de /api/acceso/verificar para cada resultado. */
export function respuestaVerificar(r: ResultadoVerificar): { status: number; cuerpo: RespuestaVerificar } {
  switch (r.tipo) {
    case "ok":
      return { status: 200, cuerpo: { ok: true, destino: "/panel" } };
    case "invalido":
      return { status: 400, cuerpo: { error: MENSAJES_ACCESO.codigoInvalido, campo: "codigo" } };
    case "limite":
      return { status: 429, cuerpo: { error: MENSAJES_ACCESO.limiteIntentos } };
    default:
      return { status: 503, cuerpo: { error: MENSAJES_ACCESO.servicio } };
  }
}
