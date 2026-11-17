import { describe, expect, it } from "vitest";
import { datosDeFueraDelCuerpo, enlacePide, marcarAlTerminar, turnoDelChat } from "@/lib/datos-fuera";

const base = { marcada: false, enAvisos: false, conCorreos: false, conDocumentos: false };

describe("turnoDelChat con datosDeFuera", () => {
  it("sin el indicador, todo sigue igual", () => {
    expect(turnoDelChat(base)).toEqual({ externo: false, contexto: false });
    expect(turnoDelChat({ ...base, datosDeFuera: false })).toEqual({ externo: false, contexto: false });
  });
  it("con el indicador, el turno cuenta como con datos de fuera", () => {
    expect(turnoDelChat({ ...base, datosDeFuera: true })).toEqual({ externo: true, contexto: true });
  });
  it("el indicador nunca quita lo que ya era estricto", () => {
    const t = turnoDelChat({ ...base, marcada: true, conCorreos: true, datosDeFuera: false });
    expect(t.contexto).toBe(true);
    expect(turnoDelChat({ ...base, enAvisos: true, datosDeFuera: false }).externo).toBe(true);
  });
  it("la conversación queda marcada al terminar", () => {
    expect(marcarAlTerminar(false, turnoDelChat({ ...base, datosDeFuera: true }))).toBe(true);
    expect(marcarAlTerminar(true, turnoDelChat({ ...base, datosDeFuera: true }))).toBe(false);
    expect(marcarAlTerminar(false, turnoDelChat(base))).toBe(false);
  });
});

describe("datosDeFueraDelCuerpo", () => {
  it("solo acepta true exacto", () => {
    expect(datosDeFueraDelCuerpo({ datosDeFuera: true })).toBe(true);
    for (const x of [{}, { datosDeFuera: false }, { datosDeFuera: "true" }, { datosDeFuera: 1 }, null, undefined, "x", []]) {
      expect(datosDeFueraDelCuerpo(x)).toBe(false);
    }
  });
});

describe("enlacePide", () => {
  it("agrega fuera=1 solo con datos de fuera", () => {
    expect(enlacePide("hola & adiós", true)).toBe("/panel?pide=hola%20%26%20adi%C3%B3s&fuera=1");
    expect(enlacePide("hola", false)).toBe("/panel?pide=hola");
  });
  it("un texto de fuera no puede colar parámetros", () => {
    const e = enlacePide("x&fuera=0&c=1", true);
    expect(e.split("&")).toEqual(["/panel?pide=x%26fuera%3D0%26c%3D1", "fuera=1"]);
  });
});
