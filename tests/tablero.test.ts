import { describe, expect, it } from "vitest";
import { armarTablero, cambio, type EntradaTablero } from "@/lib/tablero";

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
  noticias: [],
};

describe("tablero", () => {
  it("sin WhatsApp ni correo no salen sus tarjetas ni sus accesos", () => {
    const t = armarTablero(base);
    const ids = t.filas.flatMap((f) => f.tarjetas.map((x) => x.id));
    expect(ids).not.toContain("whatsapp");
    expect(ids).not.toContain("correo");
    expect(t.accesos.map((a) => a.id)).not.toContain("clientes");
    // Sin apps: invita a conectarlas
    expect(ids).toContain("sin-apps");
  });

  it("una app con problema sube su fila y sale en lo importante", () => {
    const t = armarTablero({
      ...base,
      whatsapp: { semana: 10, antes: 5, serie: [1, 2, 1, 2, 1, 2, 1], esperan: 0, ultimos: [] },
      apps: [
        { id: "g", nombre: "Google", cuenta: "a@b.mx", logo: null, apps: ["Gmail"], estado: "activa" },
        { id: "m", nombre: "Microsoft", cuenta: "c@d.mx", logo: null, apps: ["Outlook"], estado: "error" },
      ],
    });
    expect(t.filas[0].id).toBe("apps");
    expect(t.filas[0].tarjetas[0]).toMatchObject({ titulo: "Microsoft", grande: true, tono: "alerta" });
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

  it("las noticias van en la columna de hoy (no en el banner), máximo 3", () => {
    const nota = (id: string) => ({ id, titulo: "Sube el precio del papel", resumen: "…", fuente: "eleconomista.com.mx", url: `https://ejemplo.mx/${id}` });
    const t = armarTablero({ ...base, noticias: ["1", "2", "3", "4"].map(nota) });
    expect(t.noticias).toHaveLength(3);
    expect(t.destacadas.some((d) => d.fuera)).toBe(false);
  });

  it("ley de Hick: solo los mosaicos con algo pendiente (máx. 4) y nada repetido", () => {
    const t = armarTablero(base);
    expect(t.mosaicos.length).toBeLessThanOrEqual(4);
    expect(t.mosaicos.every((m) => (m.cuenta ?? 0) > 0)).toBe(true);
    expect(t.destacadas.length).toBeLessThanOrEqual(4);
    const tarjetas = t.filas.flatMap((f) => f.tarjetas.map((x) => x.id));
    expect(tarjetas).not.toContain("viene");
    expect(tarjetas).not.toContain("hecho");
  });

  it("el cambio contra la semana pasada", () => {
    expect(cambio(12, 10)).toBe(20);
    expect(cambio(8, 10)).toBe(-20);
    expect(cambio(5, 0)).toBeNull();
    expect(cambio(5, null)).toBeNull();
  });
});
