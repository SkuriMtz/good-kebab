import { describe, expect, it } from "vitest";
import { citar, citarLineas } from "@/lib/avisos";

describe("citar", () => {
  it("cambia los corchetes por paréntesis (no puede armar enlaces)", () => {
    expect(citar("[clic aquí](https://evil.com)")).toBe("(clic aquí)(https://evil.com)");
    expect(citar("a[b]c")).toBe("a(b)c");
  });

  it("quita caracteres invisibles y bidireccionales", () => {
    expect(citar("a‮b")).toBe("ab");
    expect(citar("a​b")).toBe("ab");
    expect(citar("a⁦b⁩c")).toBe("abc");
    expect(citar("a\u0000b\u007fc﻿d")).toBe("abcd");
  });

  it("junta espacios y saltos de línea en uno", () => {
    expect(citar("  hola \n\n  mundo\t!  ")).toBe("hola mundo !");
  });

  it("recorta al máximo (600 por omisión) y respeta el que se le pida", () => {
    expect(citar("x".repeat(5000)).length).toBe(600);
    expect(citar("x".repeat(50), 10)).toBe("x".repeat(10));
  });

  it("lo que no es texto da cadena vacía", () => {
    expect(citar(undefined)).toBe("");
    expect(citar(42)).toBe("");
    expect(citar(null)).toBe("");
  });
});

describe("citarLineas", () => {
  it("conserva los renglones pero junta los saltos de más", () => {
    expect(citarLineas("uno\ndos\n\n\n\ntres")).toBe("uno\ndos\n\ntres");
  });

  it("quita corchetes e invisibles", () => {
    expect(citarLineas("[x]‮​(y)")).toBe("(x)(y)");
  });

  it("recorta al máximo (900 por omisión)", () => {
    expect(citarLineas("y".repeat(5000)).length).toBe(900);
    expect(citarLineas("y".repeat(40), 5)).toBe("yyyyy");
  });

  it("lo que no es texto da cadena vacía", () => {
    expect(citarLineas({})).toBe("");
  });
});
