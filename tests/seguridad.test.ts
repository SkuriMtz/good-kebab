import { afterEach, describe, expect, it, vi } from "vitest";
import { hashIp, ipDe } from "@/lib/seguridad";

const peticion = (cab: Record<string, string>) => ({ headers: new Headers(cab) });

describe("ipDe", () => {
  it("x-vercel-forwarded-for manda sobre las demás", () => {
    expect(ipDe(peticion({ "x-vercel-forwarded-for": "1.1.1.1, 9.9.9.9", "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))).toBe("1.1.1.1");
  });
  it("luego x-real-ip, luego x-forwarded-for", () => {
    expect(ipDe(peticion({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))).toBe("2.2.2.2");
    expect(ipDe(peticion({ "x-forwarded-for": "3.3.3.3, 4.4.4.4" }))).toBe("3.3.3.3");
  });
  it("acepta IPv6", () => {
    expect(ipDe(peticion({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  });
  it("sin cabeceras o con IP inválida da sin-ip", () => {
    expect(ipDe(peticion({}))).toBe("sin-ip");
    expect(ipDe(peticion({ "x-real-ip": "no-es-ip!" }))).toBe("sin-ip");
    expect(ipDe(peticion({ "x-forwarded-for": "1.2.3.4<script>" }))).toBe("sin-ip");
    expect(ipDe(peticion({ "x-real-ip": "1".repeat(100) }))).toBe("sin-ip");
  });
});

describe("hashIp", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("es estable y no contiene la IP", () => {
    const h = hashIp("203.0.113.7");
    expect(hashIp("203.0.113.7")).toBe(h);
    expect(h).toMatch(/^[0-9a-f]{32}$/);
    expect(h).not.toContain("203");
    expect(h).not.toContain("113");
  });
  it("IPs distintas dan hashes distintos", () => {
    expect(hashIp("203.0.113.7")).not.toBe(hashIp("203.0.113.8"));
  });
  it("con llave del servidor cambia el hash (y sigue estable y sin la IP)", () => {
    const sinLlave = hashIp("203.0.113.7");
    vi.stubEnv("ATENDEL_LLAVE_CIFRADO", "llave-de-prueba");
    const conLlave = hashIp("203.0.113.7");
    expect(conLlave).not.toBe(sinLlave);
    expect(hashIp("203.0.113.7")).toBe(conLlave);
    expect(conLlave).not.toContain("203.0.113.7");
  });
});
