import { describe, expect, it } from "vitest";
import { borrarCarpetaStorage, confirmacionValida, type BucketStorage } from "@/lib/cuenta-borrar";

describe("confirmacionValida", () => {
  it("solo acepta BORRAR exacto", () => {
    expect(confirmacionValida({ confirmacion: "BORRAR" })).toBe(true);
    for (const malo of [{ confirmacion: "borrar" }, { confirmacion: " BORRAR" }, { confirmacion: "BORRAR " }, { confirmacion: true }, {}, null, "BORRAR", ["BORRAR"], 5, undefined]) {
      expect(confirmacionValida(malo)).toBe(false);
    }
  });
});

/** Un bucket falso: carpeta → lista de objetos (id null = subcarpeta). */
function falso(arbol: Record<string, { name: string; id: string | null }[]>, opciones: { falloRemove?: number } = {}) {
  const quitados: string[][] = [];
  const bucket: BucketStorage = {
    list: async (carpeta, { limit, offset }) => ({ data: (arbol[carpeta] ?? []).slice(offset, offset + limit), error: null }),
    remove: async (rutas) => {
      if (opciones.falloRemove !== undefined && quitados.length === opciones.falloRemove) return { data: null, error: { message: "boom" } };
      quitados.push(rutas);
      return { data: [], error: null };
    },
  };
  return { bucket, quitados };
}

const archivos = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `a${i}.pdf`, id: `id${i}` }));

describe("borrarCarpetaStorage", () => {
  it("no hace nada si la carpeta está vacía", async () => {
    const { bucket, quitados } = falso({});
    expect(await borrarCarpetaStorage(bucket, "u1")).toBe(0);
    expect(quitados).toEqual([]);
  });

  it("pagina el listado y quita por lotes de 100", async () => {
    const { bucket, quitados } = falso({ u1: archivos(250) });
    expect(await borrarCarpetaStorage(bucket, "u1")).toBe(250);
    expect(quitados.map((l) => l.length)).toEqual([100, 100, 50]);
    expect(quitados[0][0]).toBe("u1/a0.pdf");
    expect(new Set(quitados.flat()).size).toBe(250);
  });

  it("recorre subcarpetas", async () => {
    const { bucket, quitados } = falso({ u1: [{ name: "x.pdf", id: "1" }, { name: "sub", id: null }], "u1/sub": [{ name: "y.pdf", id: "2" }] });
    expect(await borrarCarpetaStorage(bucket, "u1")).toBe(2);
    expect(quitados.flat().sort()).toEqual(["u1/sub/y.pdf", "u1/x.pdf"]);
  });

  it("truena si falla listar o quitar (para no borrar la cuenta a medias)", async () => {
    const malLista: BucketStorage = { list: async () => ({ data: null, error: { message: "no" } }), remove: async () => ({ data: [], error: null }) };
    await expect(borrarCarpetaStorage(malLista, "u1")).rejects.toThrow();
    const { bucket } = falso({ u1: archivos(150) }, { falloRemove: 1 });
    await expect(borrarCarpetaStorage(bucket, "u1")).rejects.toThrow();
  });

  it("rechaza carpetas raras", async () => {
    const { bucket } = falso({});
    for (const c of ["", "/", "../x", "a/../b"]) await expect(borrarCarpetaStorage(bucket, c)).rejects.toThrow();
  });
});
