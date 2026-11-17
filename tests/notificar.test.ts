import { describe, expect, it } from "vitest";
import { AJUSTES_INICIALES, type Avisos } from "@/lib/ajustes";
import { decidirApp, enSilencio, finDelSilencio, limpiarCorto, minutosDelDia, nombreSeguro, pasaElNivel } from "@/lib/notificar";

const MX = "America/Mexico_City";
/** Ciudad de México está en UTC-6 todo el año (sin horario de verano desde 2022). */
const mx = (hhmm: string) => new Date(`2026-01-15T${hhmm}:00-06:00`);
const avisos = (o: Partial<Avisos> = {}): Avisos => ({ ...AJUSTES_INICIALES.avisos, ...o });

describe("nombreSeguro", () => {
  it("deja solo letras, acentos, espacios, apóstrofo y guion", () => {
    expect(nombreSeguro("María José O'Brien-Pérez")).toBe("María José O'Brien-Pérez");
  });
  it("quita etiquetas, correos, enlaces y números", () => {
    expect(nombreSeguro("<b>Ana</b> ana@correo.com")).toBe("Ana");
    expect(nombreSeguro("Luis 555-1234 https://x.co")).toBe("Luis - https x co");
  });
  it("recorta a 30 y usa el valor de respaldo si queda vacío", () => {
    expect(nombreSeguro("a".repeat(200)).length).toBe(30);
    expect(nombreSeguro("12345")).toBe("Un cliente");
    expect(nombreSeguro(undefined, "Alguien")).toBe("Alguien");
  });
});

describe("limpiarCorto", () => {
  it("quita enlaces, correos y dominios", () => {
    const t = limpiarCorto("Mira https://evil.com/x y www.evil.com o a@b.com o evil.mx ya");
    expect(t).not.toMatch(/evil|a@b/);
    expect(t).toContain("…");
  });
  it("quita formato, saltos de línea e invisibles", () => {
    expect(limpiarCorto("**hola** [x](y)\n`z`‮​ fin")).toBe("hola xy z fin");
  });
  it("recorta al máximo y no se traba con entradas hostiles", () => {
    expect(limpiarCorto("a".repeat(5000), 50).length).toBe(50);
    const t0 = Date.now();
    limpiarCorto("a@".repeat(100_000));
    limpiarCorto("a.".repeat(100_000));
    expect(Date.now() - t0).toBeLessThan(1000);
  });
  it("lo que no es texto da cadena vacía", () => {
    expect(limpiarCorto(123)).toBe("");
  });
});

describe("pasaElNivel", () => {
  it("todo deja pasar todos los niveles", () => {
    expect(pasaElNivel("todo", "info")).toBe(true);
    expect(pasaElNivel("todo", "importante")).toBe(true);
    expect(pasaElNivel("todo", "urgente")).toBe(true);
  });
  it("importante deja pasar importante y urgente", () => {
    expect(pasaElNivel("importante", "info")).toBe(false);
    expect(pasaElNivel("importante", "importante")).toBe(true);
    expect(pasaElNivel("importante", "urgente")).toBe(true);
  });
  it("urgente solo deja pasar lo urgente", () => {
    expect(pasaElNivel("urgente", "importante")).toBe(false);
    expect(pasaElNivel("urgente", "urgente")).toBe(true);
  });
  it("nada no deja pasar nada", () => {
    expect(pasaElNivel("nada", "urgente")).toBe(false);
  });
});

describe("minutosDelDia", () => {
  it("lee la hora en la zona del negocio", () => {
    expect(minutosDelDia(new Date("2026-01-15T14:30:00Z"), MX)).toBe(8 * 60 + 30);
    expect(minutosDelDia(new Date("2026-01-15T06:00:00Z"), MX)).toBe(0); // medianoche local, no 24:00
  });
  it("cambia con la zona", () => {
    const t = new Date("2026-01-15T14:30:00Z");
    expect(minutosDelDia(t, "America/Tijuana")).toBe(6 * 60 + 30);
    expect(minutosDelDia(t, "UTC")).toBe(14 * 60 + 30);
  });
  it("una zona inválida cae en Ciudad de México", () => {
    expect(minutosDelDia(new Date("2026-01-15T14:30:00Z"), "Marte/Olimpo")).toBe(8 * 60 + 30);
  });
});

describe("enSilencio", () => {
  const a = avisos({ silencio: true, desde: "22:00", hasta: "08:00" });
  it("horas que cruzan la medianoche", () => {
    expect(enSilencio(a, mx("21:59"), MX)).toBe(false);
    expect(enSilencio(a, mx("22:00"), MX)).toBe(true);
    expect(enSilencio(a, mx("23:59"), MX)).toBe(true);
    expect(enSilencio(a, mx("00:00"), MX)).toBe(true);
    expect(enSilencio(a, mx("07:59"), MX)).toBe(true);
    expect(enSilencio(a, mx("08:00"), MX)).toBe(false);
    expect(enSilencio(a, mx("12:00"), MX)).toBe(false);
  });
  it("horas dentro del mismo día", () => {
    const b = avisos({ silencio: true, desde: "13:00", hasta: "15:00" });
    expect(enSilencio(b, mx("12:59"), MX)).toBe(false);
    expect(enSilencio(b, mx("13:00"), MX)).toBe(true);
    expect(enSilencio(b, mx("14:59"), MX)).toBe(true);
    expect(enSilencio(b, mx("15:00"), MX)).toBe(false);
  });
  it("sin silencio o con desde = hasta, nunca hay silencio", () => {
    expect(enSilencio(avisos({ silencio: false }), mx("23:00"), MX)).toBe(false);
    expect(enSilencio(avisos({ silencio: true, desde: "08:00", hasta: "08:00" }), mx("08:00"), MX)).toBe(false);
  });
  it("respeta la zona horaria del negocio", () => {
    // 04:00 UTC = 22:00 en Ciudad de México (silencio) pero 04:00 UTC en UTC (también) y 20:00 en Tijuana (no)
    const t = new Date("2026-01-15T04:00:00Z");
    expect(enSilencio(a, t, MX)).toBe(true);
    expect(enSilencio(a, t, "America/Tijuana")).toBe(false);
  });
});

describe("finDelSilencio", () => {
  const a = avisos({ desde: "22:00", hasta: "08:00" });
  it("de noche, termina a las 8:00 del día siguiente", () => {
    expect(finDelSilencio(a, mx("23:00"), MX).toISOString()).toBe(new Date("2026-01-16T08:00:00-06:00").toISOString());
  });
  it("de madrugada, termina a las 8:00 del mismo día", () => {
    expect(finDelSilencio(a, mx("03:10"), MX).toISOString()).toBe(new Date("2026-01-15T08:00:00-06:00").toISOString());
  });
  it("justo a la hora de fin, espera al día siguiente", () => {
    expect(finDelSilencio(a, mx("08:00"), MX).toISOString()).toBe(new Date("2026-01-16T08:00:00-06:00").toISOString());
  });
  it("siempre queda en el futuro y a minuto exacto", () => {
    const t = new Date("2026-01-15T05:17:42.500Z");
    const f = finDelSilencio(a, t, MX);
    expect(f.getTime()).toBeGreaterThan(t.getTime());
    expect(f.getTime() % 60_000).toBe(0);
  });
});

describe("decidirApp", () => {
  const base = { ahora: mx("12:00"), zona: MX };
  it("por debajo del nivel elegido: nunca", () => {
    expect(decidirApp({ ...base, nivel: "info", av: avisos({ app: "importante" }) })).toBe("nunca");
    expect(decidirApp({ ...base, nivel: "urgente", av: avisos({ app: "nada" }) })).toBe("nunca");
    expect(decidirApp({ ...base, nivel: "importante", av: avisos({ app: "urgente" }) })).toBe("nunca");
  });
  it("de día y sin pendientes: ahora", () => {
    expect(decidirApp({ ...base, nivel: "info", av: avisos({ app: "todo" }) })).toBe("ahora");
  });
  it("en horas de silencio espera a que terminen", () => {
    const r = decidirApp({ ...base, ahora: mx("23:00"), nivel: "importante", av: avisos({ app: "todo" }) });
    expect(r).toBeInstanceOf(Date);
    expect((r as Date).toISOString()).toBe(new Date("2026-01-16T08:00:00-06:00").toISOString());
  });
  it("lo urgente despierta solo si lo activó", () => {
    const noche = { ...base, ahora: mx("23:00"), nivel: "urgente" as const };
    expect(decidirApp({ ...noche, av: avisos({ urgentePasa: true }) })).toBe("ahora");
    expect(decidirApp({ ...noche, av: avisos({ urgentePasa: false }) })).toBeInstanceOf(Date);
  });
  it("urgentePasa no despierta lo que no es urgente", () => {
    expect(decidirApp({ ...base, ahora: mx("23:00"), nivel: "importante", av: avisos({ urgentePasa: true }) })).toBeInstanceOf(Date);
  });
  it("lo de seguridad (siempre) sale aunque haya silencio", () => {
    expect(decidirApp({ ...base, ahora: mx("23:00"), nivel: "importante", siempre: true, av: avisos({ urgentePasa: false }) })).toBe("ahora");
  });
  it("lo informativo espera 3 horas desde el último", () => {
    const ultimo = new Date(base.ahora.getTime() - 3_600_000);
    const r = decidirApp({ ...base, nivel: "info", ultimoInfo: ultimo, av: avisos() });
    expect((r as Date).getTime()).toBe(ultimo.getTime() + 3 * 3_600_000);
    const viejo = new Date(base.ahora.getTime() - 4 * 3_600_000);
    expect(decidirApp({ ...base, nivel: "info", ultimoInfo: viejo, av: avisos() })).toBe("ahora");
  });
  it("lo importante no espera las 3 horas", () => {
    const ultimo = new Date(base.ahora.getTime() - 60_000);
    expect(decidirApp({ ...base, nivel: "importante", ultimoInfo: ultimo, av: avisos() })).toBe("ahora");
  });
  it("si la espera de 3 horas cae en silencio, sigue hasta que termine", () => {
    const ahora = mx("20:00");
    const ultimo = mx("19:30"); // +3h = 22:30, en silencio
    const r = decidirApp({ ahora, zona: MX, nivel: "info", ultimoInfo: ultimo, av: avisos() });
    expect((r as Date).toISOString()).toBe(new Date("2026-01-16T08:00:00-06:00").toISOString());
  });
});
