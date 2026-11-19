import { describe, expect, it } from "vitest";
import { armarTablero, cambio, FRASES_TABLERO, fraseDelDia, type EntradaTablero } from "@/lib/tablero";

const base: EntradaTablero = {
  base: "/panel",
  teNecesita: [],
  totalTeNecesita: 0,
  totalOk: 0,
  totalOficina: 0,
  viene: [],
  hecho: [],
  whatsapp: null,
  correo: null,
  clientes: null,
  respuestas: null,
  citas: null,
  apps: [],
  uso: { semanaPct: 10, trabajoPct: 5 },
};

describe("tablero", () => {
  it("sin WhatsApp ni correo no salen sus tarjetas ni sus accesos", () => {
    const t = armarTablero(base);
    const ids = t.filas.flatMap((f) => f.tarjetas.map((x) => x.id));
    expect(ids).not.toContain("whatsapp");
    expect(ids).not.toContain("correo");
    expect(t.accesos.map((a) => a.id)).not.toContain("clientes");
    // Sin apps: la columna de la derecha invita a conectarlas
    expect(t.apps.lista).toEqual([]);
  });

  it("una app con problema sale en lo importante y en la columna de apps", () => {
    const t = armarTablero({
      ...base,
      whatsapp: { semana: 10, antes: 5, serie: [1, 2, 1, 2, 1, 2, 1], esperan: 0, ultimos: [] },
      apps: [
        { id: "g", nombre: "Google", cuenta: "a@b.mx", logo: null, apps: ["Gmail"], estado: "activa" },
        { id: "m", nombre: "Microsoft", cuenta: "c@d.mx", logo: null, apps: ["Outlook"], estado: "error" },
      ],
    });
    // Las apps van en la columna de la derecha (no en las secciones)
    expect(t.filas.map((f) => f.id)).not.toContain("apps");
    expect(t.apps.lista.map((a) => a.estado)).toEqual(["activa", "error"]);
    expect(t.destacadas[0]).toMatchObject({ titulo: "Vuelve a conectar Microsoft", tono: "alerta" });
  });

  it("la tarjeta más importante de cada fila va en grande", () => {
    const t = armarTablero({
      ...base,
      whatsapp: { semana: 3, antes: 0, serie: [], esperan: 2, ultimos: [] },
      correo: { semana: 30, antes: 20, serie: [], conAccion: 0, ultimos: [] },
    });
    const clientes = t.filas.find((f) => f.id === "clientes")!;
    expect(clientes.tarjetas[0]).toMatchObject({ id: "whatsapp", grande: true });
    expect(clientes.tarjetas.filter((x) => x.grande)).toHaveLength(1);
  });

  it("todos los mosaicos, con lo pendiente primero, y nada repetido abajo", () => {
    const t = armarTablero(base);
    expect(t.mosaicos.map((m) => m.id)).toEqual(expect.arrayContaining(["ok", "citas", "oficina", "tareas", "estadisticas", "apps"]));
    const conCuenta = t.mosaicos.map((m) => Boolean(m.cuenta));
    expect(conCuenta).toEqual([...conCuenta].sort((a, z) => Number(z) - Number(a)));
    expect(t.destacadas.length).toBeLessThanOrEqual(4);
    const tarjetas = t.filas.flatMap((f) => f.tarjetas.map((x) => x.id));
    expect(tarjetas).not.toContain("viene");
    expect(tarjetas).not.toContain("hecho");
  });

  it("la frase de arriba: 15 distintas, fija todo el día y cambia entre días", () => {
    expect(new Set(FRASES_TABLERO).size).toBe(15);
    expect(fraseDelDia("2026-11-19", "u1")).toBe(fraseDelDia("2026-11-19", "u1"));
    const semana = ["13", "14", "15", "16", "17", "18", "19"].map((d) => fraseDelDia(`2026-11-${d}`, "u1"));
    expect(new Set(semana).size).toBeGreaterThan(3);
    expect(FRASES_TABLERO.every((f) => f.length <= 26)).toBe(true);
  });

  it("el cambio contra la semana pasada", () => {
    expect(cambio(12, 10)).toBe(20);
    expect(cambio(8, 10)).toBe(-20);
    expect(cambio(5, 0)).toBeNull();
    expect(cambio(5, null)).toBeNull();
  });
});
