import { describe, expect, it } from "vitest";
import { correosDeResultados, correosEn, pareceInvestigacion, revisarDestinatarios, usoInternet, yaContactado } from "@/lib/investigar";

describe("correos que se pueden usar al investigar", () => {
  it("saca los correos de un texto, sin archivos ni ejemplos", () => {
    expect(correosEn("Escríbenos a Ventas@Proveedora.mx o a info@proveedora.mx. Logo: logo@2x.png")).toEqual(["ventas@proveedora.mx", "info@proveedora.mx"]);
    expect(correosEn("nombre@dominio.com, juan@example.com")).toEqual([]);
  });

  it("solo cuenta el texto de las páginas que abrió", () => {
    const pagina = (data: string, url = "https://acme.mx") => ({
      type: "web_fetch_tool_result",
      content: { type: "web_fetch_result", url, content: { type: "document", title: "titulo@acme.mx", source: { type: "text", media_type: "text/plain", data } } },
    });
    const bloques = [
      { type: "server_tool_use", input: { url: "https://x.mx", nota: "inventado@falso.mx" } },
      pagina("Contacto: compras@acme.mx", "https://acme.mx/?c=url@falso.mx"),
      { type: "bash_code_execution_tool_result", content: { stdout: "impreso@codigo.mx" } },
      { type: "web_search_tool_result", content: [{ type: "web_search_result", title: "busqueda@falso.mx", url: "https://y.mx" }] },
      { type: "text", text: "Le escribo a otro@inventado.mx" },
      { type: "tool_result", content: "cliente@privado.mx" },
    ];
    expect(correosDeResultados(bloques)).toEqual(["compras@acme.mx"]);
    expect(usoInternet(bloques)).toBe(true);
    expect(usoInternet([{ type: "text" }])).toBe(false);
  });

  it("no repite empresa (mismo dominio propio), pero sí distingue correos gratuitos", () => {
    expect(yaContactado("ventas@acme.mx", ["compras@acme.mx"])).toBe(true);
    expect(yaContactado("ana@gmail.com", ["luis@gmail.com"])).toBe(false);
    expect(yaContactado("Luis@Gmail.com", ["luis@gmail.com"])).toBe(true);
  });

  it("rechaza correos no vistos y los ya contactados", () => {
    const permitidos = new Set(["compras@acme.mx", "hola@nueva.mx"]);
    expect(revisarDestinatarios(["hola@nueva.mx"], permitidos, []).ok).toBe(true);
    const r = revisarDestinatarios(["inventado@x.mx", "compras@acme.mx"], permitidos, ["ventas@acme.mx"]);
    expect(r.ok).toBe(false);
    expect(r.noVistos).toEqual(["inventado@x.mx"]);
    expect(r.repetidos).toEqual(["compras@acme.mx"]);
  });

  it("reconoce cuándo una tarea pide investigar (y cuándo no)", () => {
    expect(pareceInvestigacion("cada lunes investiga 5 proveedores y mándales un mail")).toBe(true);
    expect(pareceInvestigacion("busca 3 nuevos proveedores de harina")).toBe(true);
    expect(pareceInvestigacion("compara precios de cajas en internet")).toBe(true);
    expect(pareceInvestigacion("confirma las citas de mañana")).toBe(false);
    expect(pareceInvestigacion("pregúntale a mi proveedor si llegó el pedido")).toBe(false);
  });

  it("los correos que escribió el dueño siempre se permiten, aunque se repitan", () => {
    const delDueno = new Set(["ventas@acme.mx"]);
    expect(revisarDestinatarios(["ventas@acme.mx"], new Set(delDueno), ["ventas@acme.mx"], delDueno).ok).toBe(true);
  });
});
