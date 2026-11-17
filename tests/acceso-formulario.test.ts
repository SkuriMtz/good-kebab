import { describe, expect, it } from "vitest";
import { destinoSeguro, edadDe, leerFecha, soloDigitos } from "../src/lib/acceso-formulario";

describe("acceso-formulario", () => {
  it("lee fechas reales y rechaza las inventadas", () => {
    expect(leerFecha("2000-02-29")).toEqual({ a: 2000, m: 2, d: 29 });
    expect(leerFecha("2001-02-29")).toBeNull();
    expect(leerFecha("20-01-2000")).toBeNull();
    expect(leerFecha("")).toBeNull();
  });

  it("calcula la edad con el cumpleaños exacto", () => {
    const hoy = new Date(2026, 10, 17);
    expect(edadDe("2008-11-17", hoy)).toBe(18);
    expect(edadDe("2008-11-18", hoy)).toBe(17);
    expect(edadDe("2030-01-01", hoy)).toBeNull();
  });

  it("solo navega a rutas propias", () => {
    expect(destinoSeguro("/panel")).toBe("/panel");
    expect(destinoSeguro("//malo.com")).toBe("/panel");
    expect(destinoSeguro("https://malo.com")).toBe("/panel");
    expect(destinoSeguro(undefined)).toBe("/panel");
  });

  it("deja solo seis dígitos", () => {
    expect(soloDigitos("12a3-4 5678")).toBe("123456");
  });
});
