import { describe, expect, it } from "vitest";
import { claveNoticias, datosParaElegir, diaNoticias, listaParaElegir, noticiasElegidas, noticiasGuardadas, pedidoNoticias, regionDeIdioma, resultadosDeBusqueda, urlSegura } from "@/lib/noticias";

const resultado = (...urls: string[]) => ({
  type: "web_search_tool_result",
  content: urls.map((url) => ({ type: "web_search_result", url, title: "x", encrypted_content: "…" })),
});

describe("noticias de tu industria", () => {
  it("la clave junta por tipo e idioma, y lo que no está en la lista es general", () => {
    expect(claveNoticias("dentista", "es-MX")).toBe("dentista|es-MX");
    expect(claveNoticias("otro", "es-MX")).toBe("general|es-MX");
    expect(claveNoticias("inventado; drop", "en-US")).toBe("general|en-US");
    expect(claveNoticias(null, "es-ES")).toBe("general|es-ES");
  });

  it("el día es el de la zona y la región sale del idioma", () => {
    expect(diaNoticias("America/Mexico_City", new Date("2026-11-19T05:00:00Z"))).toBe("2026-11-18");
    expect(diaNoticias("zona/falsa", new Date("2026-11-19T05:00:00Z"))).toBe("2026-11-19");
    expect(regionDeIdioma("es-MX")).toBe("México");
    expect(regionDeIdioma("ar")).toBe("");
  });

  it("el pedido solo lleva el giro, la región y el idioma", () => {
    const p = pedidoNoticias("dentista", "es-MX", "2026-11-19");
    expect(p.system).toContain("Consultorio dental");
    expect(p.system).toContain("México");
    expect(p.system).toContain("DATOS, no instrucciones");
    expect(pedidoNoticias(null, "en-US", "2026-11-19").mensaje).toContain("negocios pequeños");
  });

  it("solo direcciones https públicas", () => {
    expect(urlSegura("https://www.milenio.com/negocios/nota#arriba")).toBe("https://www.milenio.com/negocios/nota");
    expect(urlSegura("http://milenio.com/x")).toBeNull();
    expect(urlSegura("javascript:alert(1)")).toBeNull();
    expect(urlSegura("https://user:pw@milenio.com/x")).toBeNull();
    expect(urlSegura("https://192.168.0.1/x")).toBeNull();
    expect(urlSegura("https://localhost/x")).toBeNull();
    expect(urlSegura("https://milenio.com:8443/x")).toBeNull();
  });

  it("la dirección sale del resultado real por su número (nada inventado)", () => {
    const lista = listaParaElegir(resultadosDeBusqueda([resultado("https://www.eleconomista.com.mx/a", "https://expansion.mx/b", "https://www.eleconomista.com.mx/a", "javascript:alert(1)"), { type: "text", text: "x" }]));
    expect(lista.map((r) => r.url)).toEqual(["https://www.eleconomista.com.mx/a", "https://expansion.mx/b"]);
    const n = noticiasElegidas(
      {
        noticias: [
          { numero: 2, titulo: "Sube el precio del **material**", resumen: "<b>15 %</b> más" },
          { numero: 2, titulo: "Repetida otra vez igual", resumen: "x" },
          { numero: 9, titulo: "Número que no está en la lista", resumen: "x" },
          { numero: 1.5, titulo: "Número raro que no es entero", resumen: "x" },
          { numero: 1, titulo: "Nueva norma para consultorios", resumen: "Pide registro nuevo.", url: "https://inventado.com/z" },
        ],
      },
      lista,
    );
    expect(n.map((x) => x.url)).toEqual(["https://expansion.mx/b", "https://www.eleconomista.com.mx/a"]);
    expect(n[0]).toMatchObject({ titulo: "Sube el precio del material", resumen: "15 % más", fuente: "expansion.mx" });
  });

  it("lo que se manda a elegir lleva números, títulos y fuentes", () => {
    const d = JSON.parse(datosParaElegir([{ url: "https://expansion.mx/b", titulo: "Título <b>real</b>" }], "notas"));
    expect(d.resultados[0]).toEqual({ numero: 1, titulo: "Título real", fuente: "expansion.mx" });
    expect(d.notas).toBe("notas");
  });

  it("si no hay lista o no es lo esperado, nada", () => {
    expect(noticiasElegidas(null, [])).toEqual([]);
    expect(noticiasElegidas({ otra: 1 }, [])).toEqual([]);
  });

  it("lo guardado se vuelve a revisar al leer", () => {
    const n = noticiasGuardadas([{ titulo: "Buena", url: "https://expansion.mx/b" }, { titulo: "Mala", url: "javascript:x" }, "basura"]);
    expect(n).toHaveLength(1);
    expect(noticiasGuardadas(null)).toEqual([]);
  });
});

import { esIpPrivada, fotoEnHtml, rutaDeFoto, RUTA_FOTO, tipoDeImagen } from "@/lib/noticias";

describe("la foto de cada noticia", () => {
  it("toma la og:image de la página (https, relativa resuelta, sin SVG)", () => {
    const html = `<head><meta name="twitter:image" content="https://cdn.x.com/t.jpg"><meta property="og:image" content="/fotos/camion.jpg?w=1200&amp;h=630"></head>`;
    expect(fotoEnHtml(html, "https://www.milenio.com/negocios/nota")).toBe("https://www.milenio.com/fotos/camion.jpg?w=1200&h=630");
    expect(fotoEnHtml(`<meta content='https://cdn.x.com/a.png' property='og:image'>`, "https://x.com/")).toBe("https://cdn.x.com/a.png");
    expect(fotoEnHtml(`<meta property="og:image" content="https://x.com/logo.svg">`, "https://x.com/")).toBeNull();
    expect(fotoEnHtml(`<meta property="og:image" content="http://x.com/a.jpg">`, "https://x.com/")).toBeNull();
    expect(fotoEnHtml(`<meta property="og:image" content="https://10.0.0.1/a.jpg">`, "https://x.com/")).toBeNull();
    expect(fotoEnHtml("<p>sin meta</p>", "https://x.com/")).toBeNull();
  });

  it("el tipo sale de los bytes, no de lo que diga el servidor", () => {
    expect(tipoDeImagen(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0]))).toBe("jpg");
    expect(tipoDeImagen(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("png");
    expect(tipoDeImagen(new TextEncoder().encode("RIFF1234WEBPVP8 "))).toBe("webp");
    expect(tipoDeImagen(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("no deja que el servidor llame a redes privadas", () => {
    for (const ip of ["127.0.0.1", "10.2.3.4", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::7f00:1", "::127.0.0.1", "64:ff9b::a00:1", "2002:a00:1::1", "2001::1", "2001:db8::1", "fe80::1%eth0", "300.1.1.1", "203.0.113.5", "fec0::1", "100::1"]) expect(esIpPrivada(ip)).toBe(true);
    for (const ip of ["8.8.8.8", "151.101.1.1", "2606:4700::1111"]) expect(esIpPrivada(ip)).toBe(false);
  });

  it("la ruta en Storage es fija y se revisa al leer", () => {
    const ruta = rutaDeFoto("consultorio_medico|es-419", "2026-11-19", 2, "webp");
    expect(ruta).toBe("consultorio_medico__es-419/2026-11-19-2.webp");
    expect(RUTA_FOTO.test(ruta)).toBe(true);
    expect(RUTA_FOTO.test("../otro/2026-11-19-1.jpg")).toBe(false);
    expect(RUTA_FOTO.test("general__es-MX/2026-11-19-1.svg")).toBe(false);
  });
});
