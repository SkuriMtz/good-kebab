import { describe, expect, it, vi } from "vitest";
import {
  codigoValido,
  edadDesde,
  esCuentaNueva,
  hoyEnMexico,
  MENSAJES_ACCESO,
  pedirCodigo,
  respuestaVerificar,
  telefonoValido,
  validarAlta,
  validarPeticionCodigo,
  validarPeticionVerificar,
  verificarCodigo,
  type AuthParaPedir,
  type AuthParaVerificar,
} from "@/lib/acceso";
import { hashCorreo, leerCuerpoJson, nuevoSecretoAlta, secretoCoincide } from "@/lib/acceso-servidor";

const HOY = "2026-11-17";

describe("edadDesde", () => {
  it("cuenta los años cumplidos", () => {
    expect(edadDesde("2008-11-17", HOY)).toBe(18);
    expect(edadDesde("2008-11-18", HOY)).toBe(17);
    expect(edadDesde("1990-01-01", HOY)).toBe(36);
  });
  it("29 de febrero: cumple el 1 de marzo en años no bisiestos", () => {
    expect(edadDesde("2008-02-29", "2026-02-28")).toBe(17);
    expect(edadDesde("2008-02-29", "2026-03-01")).toBe(18);
  });
  it("fechas que no existen dan null", () => {
    expect(edadDesde("2001-02-30", HOY)).toBeNull();
    expect(edadDesde("17/11/2000", HOY)).toBeNull();
    expect(edadDesde("2000-13-01", HOY)).toBeNull();
  });
});

describe("hoyEnMexico", () => {
  it("usa la fecha de México, no la de UTC", () => {
    // 03:00 UTC del 18 = 21:00 del 17 en Ciudad de México
    expect(hoyEnMexico(new Date("2026-11-18T03:00:00Z"))).toBe("2026-11-17");
    expect(hoyEnMexico(new Date("2026-11-18T07:00:00Z"))).toBe("2026-11-18");
  });
});

describe("telefonoValido", () => {
  it("acepta teléfonos normales", () => {
    for (const t of ["5512345678", "55 1234 5678", "+52 55 1234 5678", "(55) 1234-5678", "+1 (415) 555-0100"]) expect(telefonoValido(t), t).toBe(true);
  });
  it("rechaza teléfonos raros", () => {
    for (const t of [
      "1234567", // 7 dígitos
      "123456789012345678901", // 21 dígitos
      "55-1234-abcd",
      "55.1234.5678",
      "55 1234 5678 ext 2",
      "52+5512345678", // + en medio
      "++525512345678",
      "<script>5512345678",
      "1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6", // más de 30 caracteres
      "",
      "   ",
    ])
      expect(telefonoValido(t), t).toBe(false);
  });
});

describe("codigoValido", () => {
  it("solo exactamente 6 dígitos", () => {
    expect(codigoValido("123456")).toBe(true);
    expect(codigoValido("000000")).toBe(true);
  });
  it("rechaza letras, 5 o 7 dígitos y otros tipos", () => {
    for (const c of ["12345", "1234567", "12a456", "abcdef", " 123456", "123456 ", "12 3456", "１２３４５６", "-12345", ""]) expect(codigoValido(c), c).toBe(false);
    expect(codigoValido(123456)).toBe(false);
    expect(codigoValido(null)).toBe(false);
    expect(codigoValido(undefined)).toBe(false);
  });
});

describe("validarAlta", () => {
  it("sin datos o vacíos: ok y sin campos", () => {
    expect(validarAlta(undefined, HOY)).toEqual({ ok: true, valor: {} });
    expect(validarAlta({ nombre: "  ", telefono: "", tipo: null }, HOY)).toEqual({ ok: true, valor: {} });
  });
  it("datos completos: limpios y solo los conocidos", () => {
    const r = validarAlta({ nombre: "  Ana   López‮ ", nacimiento: "1990-05-04", negocio: "Clínica Sol", tipo: "clinica", telefono: "55 1234 5678", rol: "admin" }, HOY);
    expect(r).toEqual({ ok: true, valor: { nombre: "Ana López", nacimiento: "1990-05-04", negocio: "Clínica Sol", tipo: "clinica", telefono: "55 1234 5678" } });
  });
  it("menor de 18: error en nacimiento", () => {
    expect(validarAlta({ nacimiento: "2008-11-18" }, HOY)).toEqual({ ok: false, campo: "nacimiento", error: MENSAJES_ACCESO.menor });
    expect(validarAlta({ nacimiento: "2008-11-17" }, HOY)).toEqual({ ok: true, valor: { nacimiento: "2008-11-17" } });
  });
  it("fecha futura: error en nacimiento", () => {
    expect(validarAlta({ nacimiento: "2027-01-01" }, HOY)).toEqual({ ok: false, campo: "nacimiento", error: MENSAJES_ACCESO.nacimientoFutura });
  });
  it("fecha que no existe o muy antigua: error en nacimiento", () => {
    for (const n of ["2000-02-30", "2000-1-1", "04/05/1990", "1899-12-31", "hoy"]) {
      expect(validarAlta({ nacimiento: n }, HOY), n).toEqual({ ok: false, campo: "nacimiento", error: MENSAJES_ACCESO.nacimiento });
    }
  });
  it("teléfono raro: error en telefono", () => {
    expect(validarAlta({ telefono: "llámame" }, HOY)).toEqual({ ok: false, campo: "telefono", error: MENSAJES_ACCESO.telefono });
  });
  it("tipo que no está en la lista: error en tipo", () => {
    expect(validarAlta({ tipo: "casino" }, HOY)).toEqual({ ok: false, campo: "tipo", error: MENSAJES_ACCESO.tipo });
    expect(validarAlta({ tipo: "Clínica" }, HOY)).toMatchObject({ ok: false, campo: "tipo" });
  });
  it("largos máximos", () => {
    expect(validarAlta({ nombre: "a".repeat(120) }, HOY)).toMatchObject({ ok: true });
    expect(validarAlta({ nombre: "a".repeat(121) }, HOY)).toEqual({ ok: false, campo: "nombre", error: MENSAJES_ACCESO.nombre });
    expect(validarAlta({ negocio: "n".repeat(121) }, HOY)).toEqual({ ok: false, campo: "negocio", error: MENSAJES_ACCESO.negocio });
  });
  it("tipos equivocados", () => {
    expect(validarAlta([], HOY)).toMatchObject({ ok: false, campo: "datos" });
    expect(validarAlta("hola", HOY)).toMatchObject({ ok: false, campo: "datos" });
    expect(validarAlta({ nombre: 5 }, HOY)).toMatchObject({ ok: false, campo: "nombre" });
  });
});

describe("validarPeticionCodigo", () => {
  const crear = { correo: "Ana@Ejemplo.MX ", modo: "crear", acepta: true };

  it("entrar: correo normalizado, sin datos", () => {
    expect(validarPeticionCodigo({ correo: " ANA@ejemplo.mx", modo: "entrar", datos: { tipo: "casino" } }, HOY)).toEqual({
      tipo: "ok",
      valor: { correo: "ana@ejemplo.mx", modo: "entrar", datos: {}, turnstile: null },
    });
  });
  it("crear sin acepta (o con acepta que no es true): error en acepta", () => {
    expect(validarPeticionCodigo({ correo: "ana@ejemplo.mx", modo: "crear" }, HOY)).toEqual({ tipo: "error", campo: "acepta", error: MENSAJES_ACCESO.acepta });
    expect(validarPeticionCodigo({ ...crear, acepta: "true" }, HOY)).toMatchObject({ tipo: "error", campo: "acepta" });
    expect(validarPeticionCodigo({ ...crear, acepta: false }, HOY)).toMatchObject({ tipo: "error", campo: "acepta" });
  });
  it("crear con datos válidos", () => {
    expect(validarPeticionCodigo({ ...crear, datos: { nombre: "Ana", tipo: "dentista" } }, HOY)).toEqual({
      tipo: "ok",
      valor: { correo: "ana@ejemplo.mx", modo: "crear", datos: { nombre: "Ana", tipo: "dentista" }, turnstile: null },
    });
  });
  it("crear con menor de edad: error en nacimiento", () => {
    expect(validarPeticionCodigo({ ...crear, datos: { nacimiento: "2015-01-01" } }, HOY)).toEqual({ tipo: "error", campo: "nacimiento", error: MENSAJES_ACCESO.menor });
  });
  it("campo trampa lleno: trampa, aunque lo demás esté mal", () => {
    expect(validarPeticionCodigo({ correo: "no-es-correo", modo: "otro", sitio_web: "https://spam.example" }, HOY)).toEqual({ tipo: "trampa" });
    expect(validarPeticionCodigo({ ...crear, sitio_web: "x" }, HOY)).toEqual({ tipo: "trampa" });
    expect(validarPeticionCodigo({ ...crear, sitio_web: 1 }, HOY)).toEqual({ tipo: "trampa" });
  });
  it("campo trampa vacío: sigue normal", () => {
    expect(validarPeticionCodigo({ ...crear, sitio_web: "  " }, HOY)).toMatchObject({ tipo: "ok" });
    expect(validarPeticionCodigo({ ...crear, sitio_web: null }, HOY)).toMatchObject({ tipo: "ok" });
  });
  it("correo y modo inválidos", () => {
    expect(validarPeticionCodigo({ modo: "entrar" }, HOY)).toEqual({ tipo: "error", campo: "correo", error: MENSAJES_ACCESO.escribeCorreo });
    expect(validarPeticionCodigo({ correo: "ana@", modo: "entrar" }, HOY)).toEqual({ tipo: "error", campo: "correo", error: MENSAJES_ACCESO.revisaCorreo });
    expect(validarPeticionCodigo({ correo: ["ana@ejemplo.mx"], modo: "entrar" }, HOY)).toMatchObject({ tipo: "error", campo: "correo" });
    expect(validarPeticionCodigo({ correo: "ana@ejemplo.mx", modo: "borrar" }, HOY)).toMatchObject({ tipo: "error", campo: "modo" });
  });
  it("turnstile: texto de hasta 2048", () => {
    expect(validarPeticionCodigo({ ...crear, turnstile: "tok" }, HOY)).toMatchObject({ tipo: "ok", valor: { turnstile: "tok" } });
    expect(validarPeticionCodigo({ ...crear, turnstile: "x".repeat(2049) }, HOY)).toMatchObject({ tipo: "error", campo: "turnstile" });
    expect(validarPeticionCodigo({ ...crear, turnstile: 5 }, HOY)).toMatchObject({ tipo: "error", campo: "turnstile" });
  });
});

describe("validarPeticionVerificar", () => {
  it("ok con correo normalizado", () => {
    expect(validarPeticionVerificar({ correo: "ANA@ejemplo.mx", codigo: "012345" })).toEqual({ tipo: "ok", valor: { correo: "ana@ejemplo.mx", codigo: "012345" } });
  });
  it("códigos con letras o de 5/7 dígitos: error en codigo", () => {
    for (const codigo of ["12a456", "12345", "1234567", 123456]) {
      expect(validarPeticionVerificar({ correo: "ana@ejemplo.mx", codigo }), String(codigo)).toEqual({ tipo: "error", campo: "codigo", error: MENSAJES_ACCESO.codigoFormato });
    }
  });
});

describe("esCuentaNueva", () => {
  const ahora = Date.parse("2026-11-17T12:00:00Z");
  it("sin perfil del negocio: nueva", () => {
    expect(esCuentaNueva("2020-01-01T00:00:00Z", false, ahora)).toBe(true);
  });
  it("con perfil: solo si se creó hace menos de 30 minutos", () => {
    expect(esCuentaNueva("2026-11-17T11:45:00Z", true, ahora)).toBe(true);
    expect(esCuentaNueva("2026-11-17T11:29:00Z", true, ahora)).toBe(false);
    expect(esCuentaNueva(undefined, true, ahora)).toBe(false);
    expect(esCuentaNueva("no-es-fecha", true, ahora)).toBe(false);
  });
});

/** Un Supabase falso: la cuenta existe o no. */
function supabaseFalso(existe: boolean) {
  const llamadas: unknown[] = [];
  const auth: AuthParaPedir = {
    async signInWithOtp(c) {
      llamadas.push(c);
      if (existe || c.options.shouldCreateUser) return { error: null };
      return { error: { status: 422, code: "otp_disabled" } };
    },
  };
  return { auth, llamadas };
}

describe("pedirCodigo (enumeración de cuentas)", () => {
  const p = { correo: "ana@ejemplo.mx", redirect: "https://atendel.mx/auth/callback" };

  it("entrar: la respuesta es idéntica exista o no la cuenta", async () => {
    const conCuenta = await pedirCodigo(supabaseFalso(true).auth, { ...p, modo: "entrar" });
    const sinCuenta = await pedirCodigo(supabaseFalso(false).auth, { ...p, modo: "entrar" });
    expect(conCuenta.status).toBe(200);
    expect(sinCuenta.status).toBe(conCuenta.status);
    expect(sinCuenta.cuerpo).toEqual({ ok: true });
    expect(JSON.stringify(sinCuenta.cuerpo)).toBe(JSON.stringify(conCuenta.cuerpo));
    // Por dentro sí se sabe (para la bitácora), pero eso nunca sale
    expect(conCuenta.aviso).toBeNull();
    expect(sinCuenta.aviso).toMatchObject({ tipo: "sin_cuenta", code: "otp_disabled" });
  });

  it("crear: también idéntica", async () => {
    const a = await pedirCodigo(supabaseFalso(true).auth, { ...p, modo: "crear" });
    const b = await pedirCodigo(supabaseFalso(false).auth, { ...p, modo: "crear" });
    expect([a.status, a.cuerpo]).toEqual([b.status, b.cuerpo]);
  });

  it("shouldCreateUser solo en crear, con el enlace de regreso", async () => {
    const f = supabaseFalso(true);
    await pedirCodigo(f.auth, { ...p, modo: "entrar" });
    await pedirCodigo(f.auth, { ...p, modo: "crear" });
    expect(f.llamadas).toEqual([
      { email: "ana@ejemplo.mx", options: { shouldCreateUser: false, emailRedirectTo: p.redirect } },
      { email: "ana@ejemplo.mx", options: { shouldCreateUser: true, emailRedirectTo: p.redirect } },
    ]);
  });

  it("si Supabase frena por pedir otro código pronto (solo pasa con cuentas que existen), se contesta igual", async () => {
    const auth: AuthParaPedir = { signInWithOtp: async () => ({ error: { status: 429, code: "over_email_send_rate_limit" } }) };
    const r = await pedirCodigo(auth, { ...p, modo: "entrar" });
    expect(r.status).toBe(200);
    expect(r.cuerpo).toEqual({ ok: true });
  });

  it("si el servicio falla: 503 genérico, sin detalles", async () => {
    const caido: AuthParaPedir = { signInWithOtp: async () => ({ error: { status: 500, code: "unexpected_failure" } }) };
    const sinRed: AuthParaPedir = { signInWithOtp: vi.fn().mockRejectedValue(new Error("fetch failed ana@ejemplo.mx")) };
    for (const auth of [caido, sinRed]) {
      const r = await pedirCodigo(auth, { ...p, modo: "entrar" });
      expect(r.status).toBe(503);
      expect(r.cuerpo).toEqual({ error: MENSAJES_ACCESO.servicio });
      expect(JSON.stringify(r.cuerpo)).not.toContain("ana@");
    }
  });
});

describe("verificarCodigo + respuestaVerificar", () => {
  const p = { correo: "ana@ejemplo.mx", codigo: "123456" };
  const con = (r: Awaited<ReturnType<AuthParaVerificar["verifyOtp"]>>): AuthParaVerificar => ({ verifyOtp: async () => r });

  it("código bueno: destino /panel", async () => {
    const r = await verificarCodigo(con({ data: { user: { id: "u1", email: "ana@ejemplo.mx", created_at: "2026-11-17T00:00:00Z" } }, error: null }), p);
    expect(r).toMatchObject({ tipo: "ok", usuario: { id: "u1" } });
    expect(respuestaVerificar(r)).toEqual({ status: 200, cuerpo: { ok: true, destino: "/panel" } });
  });
  it("código malo o vencido (o correo sin cuenta): el mismo 400", async () => {
    const malo = await verificarCodigo(con({ data: { user: null }, error: { status: 403, code: "otp_expired" } }), p);
    const sinCuenta = await verificarCodigo(con({ data: { user: null }, error: { status: 400, code: "validation_failed" } }), p);
    expect(respuestaVerificar(malo)).toEqual({ status: 400, cuerpo: { error: "El código no es correcto o ya venció.", campo: "codigo" } });
    expect(respuestaVerificar(sinCuenta)).toEqual(respuestaVerificar(malo));
  });
  it("Supabase frena: 429; se cae: 503", async () => {
    expect(respuestaVerificar(await verificarCodigo(con({ data: { user: null }, error: { status: 429, code: "over_request_rate_limit" } }), p)).status).toBe(429);
    expect(respuestaVerificar(await verificarCodigo(con({ data: { user: null }, error: { status: 502 } }), p)).status).toBe(503);
    expect(respuestaVerificar(await verificarCodigo({ verifyOtp: vi.fn().mockRejectedValue(new Error("x")) }, p)).status).toBe(503);
  });
});

describe("piezas de servidor", () => {
  const peticion = (cuerpo: string, cab: Record<string, string> = {}) => new Request("https://atendel.test/api", { method: "POST", body: cuerpo, headers: cab });

  it("leerCuerpoJson: tope de bytes aunque no haya content-length", async () => {
    expect(await leerCuerpoJson(peticion(JSON.stringify({ a: "x".repeat(5000) })), 4096)).toEqual({ ok: false, status: 413 });
    expect(await leerCuerpoJson(peticion("{}", { "content-length": "99999" }), 4096)).toEqual({ ok: false, status: 413 });
    expect(await leerCuerpoJson(peticion("no es json"), 4096)).toEqual({ ok: false, status: 400 });
    expect(await leerCuerpoJson(peticion("[1,2]"), 4096)).toEqual({ ok: false, status: 400 });
    expect(await leerCuerpoJson(peticion('{"correo":"a@b.mx"}'), 4096)).toEqual({ ok: true, cuerpo: { correo: "a@b.mx" } });
  });

  it("hashCorreo: estable, sin mayúsculas ni espacios, y sin el correo", () => {
    const h = hashCorreo("ana@ejemplo.mx");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashCorreo(" ANA@Ejemplo.MX ")).toBe(h);
    expect(hashCorreo("ana2@ejemplo.mx")).not.toBe(h);
    expect(h).not.toContain("ana");
  });

  it("secreto del alta: solo coincide con su cookie", () => {
    const { secreto, hash } = nuevoSecretoAlta();
    expect(secretoCoincide(secreto, hash)).toBe(true);
    expect(secretoCoincide(nuevoSecretoAlta().secreto, hash)).toBe(false);
    expect(secretoCoincide(null, hash)).toBe(false);
    expect(secretoCoincide(secreto, "no-es-hash")).toBe(false);
    expect(secretoCoincide("x".repeat(500), hash)).toBe(false);
  });
});
