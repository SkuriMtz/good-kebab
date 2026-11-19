import { describe, expect, it } from "vitest";
import { claveNoticias, diaNoticias, leerNoticias, noticiasGuardadas, pedidoNoticias, regionDeIdioma, urlSegura, urlsDeBusqueda } from "@/lib/noticias";

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

  it("un enlace que no salió de la búsqueda no pasa (nada inventado)", () => {
    const permitidas = urlsDeBusqueda([resultado("https://www.eleconomista.com.mx/a", "https://expansion.mx/b"), { type: "text", text: "x" }]);
    const texto =
      'Aquí van: {"noticias":[' +
      '{"titulo":"Nueva norma para consultorios","resumen":"Pide **registro** nuevo.","url":"https://www.eleconomista.com.mx/a"},' +
      '{"titulo":"Inventada por la IA","resumen":"x","url":"https://inventado.com/z"},' +
      '{"titulo":"Repetida otra vez igual","resumen":"x","url":"https://www.eleconomista.com.mx/a"},' +
      '{"titulo":"Sube el precio del material","resumen":"<b>15 %</b> más","url":"https://expansion.mx/b"}]}';
    const n = leerNoticias(texto, permitidas);
    expect(n.map((x) => x.fuente)).toEqual(["eleconomista.com.mx", "expansion.mx"]);
    expect(n[0].resumen).toBe("Pide registro nuevo.");
    expect(n[1].resumen).toBe("15 % más");
  });

  it("si no es JSON o no hay lista, nada", () => {
    expect(leerNoticias("no encontré nada", new Set())).toEqual([]);
    expect(leerNoticias('{"otra":1}', new Set())).toEqual([]);
  });

  it("lo guardado se vuelve a revisar al leer", () => {
    const n = noticiasGuardadas([{ titulo: "Buena", url: "https://expansion.mx/b" }, { titulo: "Mala", url: "javascript:x" }, "basura"]);
    expect(n).toHaveLength(1);
    expect(noticiasGuardadas(null)).toEqual([]);
  });
});
