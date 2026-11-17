import { describe, expect, it } from "vitest";
import { destinatarioRebote, esRebote } from "@/lib/vigilar-correos";
import { leerAlertas } from "@/lib/trabajo";

describe("esRebote", () => {
  it("reconoce al servidor de correo por su dirección", () => {
    expect(esRebote({ correo: "MAILER-DAEMON@mx.google.com", de: "Mail Delivery Subsystem", asunto: "hola" })).toBe(true);
    expect(esRebote({ correo: "postmaster@empresa.com", de: "x", asunto: "x" })).toBe(true);
  });
  it("reconoce el asunto típico de un rebote", () => {
    for (const asunto of ["Undeliverable: Cita", "Delivery Status Notification (Failure)", "Mail delivery failed: returning message", "Mensaje no entregado", "Entrega fallida"]) {
      expect(esRebote({ correo: "a@b.com", de: "A", asunto })).toBe(true);
    }
  });
  it("sin dirección, mira el nombre del remitente", () => {
    expect(esRebote({ correo: null, de: "Mail Delivery (mailer-daemon)", asunto: "x" })).toBe(true);
    expect(esRebote({ correo: null, de: "Ana", asunto: "x" })).toBe(false);
  });
  it("un correo normal no es rebote", () => {
    expect(esRebote({ correo: "ana@gmail.com", de: "Ana", asunto: "¿Tienes cita el jueves?" })).toBe(false);
    // el nombre dice mailer-daemon pero la dirección es de una persona: manda la dirección
    expect(esRebote({ correo: "ana@gmail.com", de: "mailer-daemon", asunto: "hola" })).toBe(false);
  });
});

describe("destinatarioRebote", () => {
  it("toma el Final-Recipient del reporte", () => {
    expect(destinatarioRebote("Action: failed\nFinal-Recipient: rfc822; cliente@dominio.mx\nStatus: 5.1.1")).toBe("cliente@dominio.mx");
  });
  it("sin reporte, toma la primera dirección que no sea del servidor", () => {
    expect(destinatarioRebote("De mailer-daemon@googlemail.com: no se pudo entregar a juan@correo.com por error")).toBe("juan@correo.com");
  });
  it("sin dirección válida da null", () => {
    expect(destinatarioRebote("no hay nada aquí")).toBeNull();
    expect(destinatarioRebote("")).toBeNull();
    expect(destinatarioRebote("postmaster@x.com")).toBeNull();
  });
});

describe("leerAlertas", () => {
  it("acepta tipos conocidos con su texto limpio", () => {
    expect(leerAlertas([{ tipo: "pago_entro", texto: "  Entró   un pago\n de $500 " }])).toEqual([{ tipo: "pago_entro", texto: "Entró un pago de $500" }]);
  });
  it("descarta tipos desconocidos, textos vacíos y entradas raras", () => {
    expect(leerAlertas([{ tipo: "hackear", texto: "x" }, { tipo: "pago_fallido", texto: "   " }, { tipo: "pago_fallido" }, null, 5, "x"])).toEqual([]);
  });
  it("una sola alerta por tipo", () => {
    const r = leerAlertas([
      { tipo: "resena_mala", texto: "primera" },
      { tipo: "resena_mala", texto: "segunda" },
      { tipo: "tareas_atrasadas", texto: "otra" },
    ]);
    expect(r.map((a) => a.texto)).toEqual(["primera", "otra"]);
  });
  it("recorta el texto a 400", () => {
    expect(leerAlertas([{ tipo: "pago_entro", texto: "a".repeat(2000) }])[0].texto.length).toBe(400);
  });
  it("lo que no es lista da lista vacía", () => {
    expect(leerAlertas(undefined)).toEqual([]);
    expect(leerAlertas({ tipo: "pago_entro", texto: "x" })).toEqual([]);
  });
});
