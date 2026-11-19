import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * El servidor no puede llamar funciones (ni usar constantes) de un archivo
 * "use client": en vez del valor recibe una referencia y truena con «Attempted
 * to call X() from the server». Así se rompieron varias pestañas del panel.
 * Esta prueba revisa que ningún archivo del servidor (o compartido) importe
 * de un archivo "use client" algo que no sea un componente usado como <Etiqueta>.
 */

/** Todos los .ts y .tsx de una carpeta (con subcarpetas). */
const archivosDe = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivosDe(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []));

const esCliente = (f: string) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(readFileSync(f, "utf8").slice(0, 400));

function resolver(spec: string, desde: string): string | null {
  const base = spec.startsWith("@/") ? join("src", spec.slice(2)) : spec.startsWith(".") ? normalize(join(dirname(desde), spec)) : null;
  if (!base) return null;
  for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) if (existsSync(base + ext) && !base.endsWith("/") && (ext || /\.tsx?$/.test(base))) return base + ext;
  return null;
}

describe("servidor y navegador", () => {
  it("el servidor no llama funciones de archivos «use client»", () => {
    const archivos = archivosDe("src").filter((f) => !esCliente(f));
    const malos: string[] = [];
    for (const f of archivos) {
      const s = readFileSync(f, "utf8");
      for (const m of s.matchAll(/import\s+\{([^}]*)\}\s+from\s+["']([^"']+)["']/g)) {
        const destino = resolver(m[2], f);
        if (!destino || !esCliente(destino)) continue;
        const nombres = m[1]
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n && !n.startsWith("type "))
          .map((n) => n.split(" as ").pop()!.trim());
        for (const n of nombres) if (!new RegExp(`<${n}[\\s/>]`).test(s)) malos.push(`${f}: ${n} (de ${m[2]})`);
      }
    }
    expect(malos).toEqual([]);
  });
});
