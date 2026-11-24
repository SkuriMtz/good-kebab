import { describe, expect, it } from "vitest";
import { elegirModelo } from "../src/lib/elegir-modelo";

const max = { modelos: ["rapido", "avanzado"] as const };
const free = { modelos: ["rapido"] as const };
const libre = { sesion: { usado: 0, limite: 100, reinicia: null }, semana: { usado: 0, limite: 100, reinicia: null } };

describe("elegirModelo", () => {
  it("lo de todos los días va con Rápido", () => {
    expect(elegirModelo({ mensaje: "¿Qué citas tengo mañana?", plan: max, uso: libre })).toBe("rapido");
    expect(elegirModelo({ mensaje: "Contéstale a Mariana que sí hay lugar el jueves", plan: max, uso: libre })).toBe("rapido");
  });
  it("lo pesado va con Avanzado si el plan lo trae", () => {
    expect(elegirModelo({ mensaje: "Analiza mis ventas del mes y compáralas con el anterior", plan: max, uso: libre })).toBe("avanzado");
    expect(elegirModelo({ mensaje: "Hazme un reporte en Excel de mis clientes", plan: max, uso: libre })).toBe("avanzado");
    expect(elegirModelo({ mensaje: "Revisa este contrato", plan: max, uso: libre })).toBe("avanzado");
    expect(elegirModelo({ mensaje: "x".repeat(1300), plan: max, uso: libre })).toBe("avanzado");
  });
  it("Free siempre Rápido", () => {
    expect(elegirModelo({ mensaje: "Analiza mis ventas", plan: free, uso: libre })).toBe("rapido");
  });
  it("con voz, siempre Rápido", () => {
    expect(elegirModelo({ mensaje: "Analiza mis ventas", plan: max, uso: libre, voz: true })).toBe("rapido");
  });
  it("si ya va muy usado el límite, cuida lo que queda", () => {
    const usado = { ...libre, sesion: { usado: 75, limite: 100, reinicia: null } };
    expect(elegirModelo({ mensaje: "Analiza mis ventas", plan: max, uso: usado })).toBe("rapido");
  });
  it("no se confunde con palabras que contienen otras", () => {
    expect(elegirModelo({ mensaje: "¿Me reportas cómo va lo de hoy?", plan: max, uso: libre })).toBe("rapido");
  });
});
