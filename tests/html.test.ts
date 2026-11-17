import { describe, expect, it } from "vitest";
import { sinHtml } from "@/lib/conexiones/http";
import { htmlATexto } from "@/lib/documentos/url-segura";

const DOS_MB = 2 * 1024 * 1024;
/** Entrada hostil de ~2 MB que repite `trozo` hasta llenar. */
const hostil = (trozo: string) => trozo.repeat(Math.ceil(DOS_MB / trozo.length)).slice(0, DOS_MB);
const rapido = (f: () => unknown, ms = 1000) => {
  const t0 = performance.now();
  f();
  expect(performance.now() - t0).toBeLessThan(ms);
};

describe("sinHtml", () => {
  it("convierte HTML normal en texto", () => {
    const t = sinHtml("<html><head><title>x</title><style>p{color:red}</style></head><body><p>Hola <b>mundo</b></p><p>Segunda<br>línea</p><script>alert(1)</script></body></html>");
    expect(t).toContain("Hola mundo");
    expect(t).toContain("Segunda");
    expect(t).toContain("línea");
    expect(t).not.toMatch(/alert|color:red|<|>/);
  });
  it("decodifica entidades básicas", () => {
    expect(sinHtml("<p>Tom &amp; Jerry &lt;3</p>")).toContain("Tom & Jerry <3");
  });
  it("no se traba con 2 MB hostiles", () => {
    for (const t of ["<style", "<script", "<head", "<!--", "<", "<a", "<br", "</p", "<p<p<p"]) rapido(() => sinHtml(hostil(t)));
  });
});

describe("htmlATexto", () => {
  it("saca título y texto de una página normal", () => {
    const r = htmlATexto(
      "<!doctype html><html><head><title>Clínica &amp; Spa</title><style>a{}</style></head><body><nav>Menú</nav><h1>Servicios</h1><p>Limpieza dental</p><ul><li>Uno</li><li>Dos</li></ul><script>x()</script></body></html>",
    );
    expect(r.titulo).toBe("Clínica & Spa");
    expect(r.texto).toContain("Servicios");
    expect(r.texto).toContain("Limpieza dental");
    expect(r.texto).toContain("- Uno");
    expect(r.texto).not.toMatch(/Menú|x\(\)|a\{\}|<|>/);
  });
  it("quita comentarios y no deja etiquetas", () => {
    const r = htmlATexto("<p>antes<!-- secreto -->después</p>");
    expect(r.texto).not.toContain("secreto");
    expect(r.texto).toContain("antes");
    expect(r.texto).toContain("después");
  });
  it("no revienta con texto sin HTML ni con entradas vacías", () => {
    expect(htmlATexto("solo texto").texto).toBe("solo texto");
    expect(htmlATexto("")).toEqual({ titulo: "", texto: "" });
  });
  it("regresión ReDoS: 2 MB hostiles terminan en menos de 1 s", () => {
    for (const t of ["<style", "<!--", "<script", "<head", "<nav", "<title", "<svg", "<", "<a", "</p", "<li", "<p<p<p", "<!--<style<script", "<title><title"]) {
      rapido(() => htmlATexto(hostil(t)));
    }
  });
  it("regresión ReDoS: variantes con cierres parecidos y espacios", () => {
    rapido(() => htmlATexto("<style>" + "</style".repeat(400_000)));
    rapido(() => htmlATexto("<script>" + "</script ".repeat(250_000)));
    rapido(() => htmlATexto("<" + " ".repeat(DOS_MB)));
  });
});
