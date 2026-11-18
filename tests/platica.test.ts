import { describe, expect, it } from "vitest";
import { buscadores, contarMenciones, menciona, palabrasDeBusqueda } from "@/lib/contar-clientes";
import { costoEscuchar, costoHablar, frasesListas, MAX_FRASE, textoParaVoz } from "@/lib/platica";

describe("textoParaVoz", () => {
  it("quita Markdown, enlaces, emojis y tablas", () => {
    const md = "## Tu día\n- **Clientes:** 7 mensajes 🎉\n- Revisa [Tu negocio → Apps](/panel?vista=negocio) o https://ejemplo.com/x\n| a | b |\n|---|---|\n| 1 | 2 |";
    const t = textoParaVoz(md);
    expect(t).not.toMatch(/[#*|🎉]|https?:|\/panel|\]\(/);
    expect(t).toContain("Tu día");
    expect(t).toContain("Clientes: 7 mensajes");
    expect(t).toContain("Revisa Tu negocio → Apps");
  });
});

describe("frasesListas", () => {
  it("dice frases completas mientras llega y lo que sobra al final", () => {
    const parte = "Hoy te escribieron siete clientes por WhatsApp y Aura contestó cinco sola. Dos esperan tu";
    const a = frasesListas(parte, 0, false);
    expect(a.frases).toEqual(["Hoy te escribieron siete clientes por WhatsApp y Aura contestó cinco sola."]);
    const todo = `${parte} respuesta.`;
    const b = frasesListas(todo, a.hasta, true);
    expect(b.frases).toEqual(["Dos esperan tu respuesta."]);
    expect(b.hasta).toBe(todo.length);
  });

  it("junta frases cortas y no corta en «vercel.app» ni en números con punto", () => {
    const t = "Sí. Va. Entra a good-kebab.vercel.app para verlo, cuesta 1.5 dólares y ya está listo.";
    const r = frasesListas(t, 0, true);
    expect(r.frases.join(" ")).toContain("1.5");
    expect(r.frases.length).toBe(1);
  });

  it("parte lo muy largo sin pasar del tope", () => {
    const largo = Array.from({ length: 300 }, (_, i) => `palabra${i}`).join(" ");
    const r = frasesListas(largo, 0, true);
    expect(r.frases.length).toBeGreaterThan(1);
    for (const f of r.frases) expect(f.length).toBeLessThanOrEqual(MAX_FRASE);
  });
});

describe("costos de la voz", () => {
  it("cobra por letra al hablar y por segundo al escuchar", () => {
    expect(costoHablar("hola")).toBe(160);
    expect(costoEscuchar(10)).toBe(560);
    expect(costoEscuchar(0)).toBe(1);
  });
});

describe("contar en clientes", () => {
  it("limpia las palabras (sin símbolos, sin acentos, hasta 6)", () => {
    expect(palabrasDeBusqueda(["Envío", "envíos!", "a", "x".repeat(41), "dom,icilio)"])).toEqual(["envio", "envios", "dom icilio"]);
    expect(palabrasDeBusqueda("factura")).toEqual(["factura"]);
    expect(palabrasDeBusqueda(null)).toEqual([]);
    expect(palabrasDeBusqueda(Array.from({ length: 10 }, (_, i) => `p${i}x`))).toHaveLength(6);
  });

  it("encuentra la palabra al inicio de otra, sin acentos ni mayúsculas", () => {
    const res = buscadores(["envio"]);
    expect(menciona("¿Hacen ENVÍOS a Monterrey?", res)).toBe(true);
    expect(menciona("¿hacen envío?", res)).toBe(true);
    expect(menciona("reenvio de factura", res)).toBe(false);
    expect(menciona(null, res)).toBe(false);
  });

  it("cuenta clientes distintos y mensajes, con un ejemplo por cliente", () => {
    const res = buscadores(["envio", "domicilio"]);
    const r = contarMenciones(
      [
        { telefono: "1", texto: "¿Hacen envíos?" },
        { telefono: "1", texto: "¿y el envío cuánto cuesta?" },
        { telefono: "2", texto: "¿Entregan a domicilio?" },
        { telefono: "3", texto: "Hola, ¿qué horario tienen?" },
      ],
      res,
    );
    expect(r).toEqual({ clientes: 2, mensajes: 3, ejemplos: ["¿Hacen envíos?", "¿Entregan a domicilio?"] });
  });
});
