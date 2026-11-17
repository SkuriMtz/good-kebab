import { describe, expect, it } from "vitest";
import { esFallaDeLaApp } from "@/lib/fallos-apps";

describe("esFallaDeLaApp", () => {
  it("un 5xx es falla de la app", () => {
    expect(esFallaDeLaApp({ status: 500 })).toBe(true);
    expect(esFallaDeLaApp({ status: 503 })).toBe(true);
    expect(esFallaDeLaApp({ status: 599 })).toBe(true);
  });
  it("un 4xx es de la cuenta o de lo pedido, no de la app", () => {
    for (const status of [400, 401, 403, 404, 429]) expect(esFallaDeLaApp({ status })).toBe(false);
  });
  it("fuera del rango 5xx no cuenta", () => {
    expect(esFallaDeLaApp({ status: 600 })).toBe(false);
    expect(esFallaDeLaApp({ status: 302 })).toBe(false);
  });
  it("un error de red sí cuenta", () => {
    expect(esFallaDeLaApp(new TypeError("fetch failed"))).toBe(true);
    expect(esFallaDeLaApp(new TypeError("x", { cause: "ECONNRESET" }))).toBe(true);
    expect(esFallaDeLaApp(new TypeError("getaddrinfo ENOTFOUND api.x.com"))).toBe(true);
  });
  it("otros errores no cuentan", () => {
    expect(esFallaDeLaApp(new Error("fetch failed"))).toBe(false);
    expect(esFallaDeLaApp(new TypeError("Cannot read properties of undefined"))).toBe(false);
    expect(esFallaDeLaApp(null)).toBe(false);
    expect(esFallaDeLaApp("boom")).toBe(false);
  });
  it("si lo cortamos nosotros (señal abortada) no es culpa de la app", () => {
    const c = new AbortController();
    c.abort();
    expect(esFallaDeLaApp({ status: 500 }, c.signal)).toBe(false);
    expect(esFallaDeLaApp(new TypeError("fetch failed"), c.signal)).toBe(false);
    expect(esFallaDeLaApp({ status: 500 }, new AbortController().signal)).toBe(true);
  });
});
