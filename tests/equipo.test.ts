import { describe, expect, it } from "vitest";
import { marcoEquipo, marcoEstado, separarEquipo, separarEstado } from "../src/lib/estado-chat";
import { estadoSinNombre } from "../src/lib/herramientas/equipo";
import { armarFichas } from "../src/lib/tu-equipo";

describe("las tarjetitas del equipo en el stream", () => {
  it("separa los encargos del texto y sigue su estado", () => {
    const stream =
      "Va, le pido a Altair." +
      marcoEquipo({ t: "inicio", id: "a1", agente: "clara", titulo: "Contestar a Andrea", pos: 21 }) +
      marcoEquipo({ t: "estado", id: "a1", texto: "Revisando tu correo…" });
    const vivo = separarEquipo(stream);
    expect(vivo.resto).toBe("Va, le pido a Altair.");
    expect(vivo.encargos).toEqual([{ id: "a1", agente: "clara", titulo: "Contestar a Andrea", estado: "trabajando", resultado: "", pos: 21, ahora: "Revisando tu correo…" }]);

    const fin = separarEquipo(stream + marcoEquipo({ t: "listo", id: "a1", resultado: "Le contesté." }) + " Listo.");
    expect(fin.resto).toBe("Va, le pido a Altair. Listo.");
    expect(fin.encargos[0]).toMatchObject({ estado: "listo", resultado: "Le contesté.", ahora: undefined });
  });

  it("esconde un marco a medio llegar y deja pasar los estados de siempre", () => {
    const medio = "Hola" + marcoEquipo({ t: "inicio", id: "x", agente: "lola", titulo: "Ver la agenda", pos: 4 }).slice(0, 12);
    expect(separarEquipo(medio)).toEqual({ resto: "Hola", encargos: [] });
    const conEstado = separarEquipo("Hola" + marcoEstado("Pensando…"));
    expect(separarEstado(conEstado.resto)).toEqual({ texto: "Hola", estado: "Pensando…" });
  });

  it("ignora eventos que no tienen la forma exacta", () => {
    const malo = "\u0003" + JSON.stringify({ t: "inicio", id: "z", agente: "nadie", titulo: "x", pos: 0 }) + "\u0004";
    const sinInicio = marcoEquipo({ t: "listo", id: "q", resultado: "ok" });
    expect(separarEquipo("a" + malo + sinInicio + "b")).toEqual({ resto: "ab", encargos: [] });
  });
});

describe("lo que hace cada empleado", () => {
  it("quita el nombre del estado (en la tarjetita ya sale quién es)", () => {
    expect(estadoSinNombre("Altair está revisando tu correo…", "Altair")).toBe("Revisando tu correo…");
    expect(estadoSinNombre("Aura lo está haciendo…", "Aura")).toBe("Haciéndolo…");
    expect(estadoSinNombre("Buscando en tu agenda", "Aura")).toBe("Buscando en tu agenda");
    expect(estadoSinNombre("Mira", "Mira")).toBe("Trabajando…");
  });

  it("arma «Tu equipo»: quién trabaja, qué hizo hoy y qué espera tu OK", () => {
    const ahora = Date.parse("2026-11-25T18:00:00Z");
    const hace = (min: number) => new Date(ahora - min * 60_000).toISOString();
    const fichas = armarFichas(
      ["lola", "clara", "victor", "iris"],
      {
        encargos: [
          { id: "1", agente: "clara", titulo: "Contestar a Andrea", estado: "trabajando", creado_en: hace(1), conversacion_id: "c1" },
          { id: "2", agente: "clara", titulo: "Resumir la bandeja", estado: "listo", creado_en: hace(30), conversacion_id: null },
          // Se quedó «trabajando» hace mucho: se cortó, no cuenta como trabajando
          { id: "3", agente: "iris", titulo: "Reporte de ventas", estado: "trabajando", creado_en: hace(20), conversacion_id: null },
        ],
        acciones: [
          { id: "a", herramienta: "no_existe_x", categoria: "citas", resumen: "Mover la cita de Ana", estado: "esperando", creado_en: hace(5), resuelto_en: null },
          { id: "b", herramienta: "no_existe_y", categoria: "correos", resumen: "Mandar el correo a Luis", estado: "hecha", creado_en: hace(60), resuelto_en: hace(50) },
        ],
        trabajos: [{ id: "t", agente: "victor", titulo: "8 clientes por recuperar", creado_en: hace(90) }],
      },
      ahora,
    );
    const [aura, altair, rigel, mira] = fichas;
    expect(altair.trabajando).toBe("Contestar a Andrea");
    expect(altair.hoy).toBe(2);
    // Lo de ahorita va arriba, no se repite en la lista
    expect(altair.ultimos.map((h) => h.estado)).toEqual(["listo", "listo"]);
    expect(aura.trabajando).toBeNull();
    expect(aura.ultimos[0]).toMatchObject({ estado: "espera", href: "/panel?vista=equipo&aprobar=a" });
    expect(aura.hoy).toBe(0);
    expect(rigel.ultimos[0]).toMatchObject({ titulo: "8 clientes por recuperar", href: "/panel?vista=oficina" });
    expect(mira.trabajando).toBeNull();
    expect(mira.ultimos[0].estado).toBe("error");
  });
});
