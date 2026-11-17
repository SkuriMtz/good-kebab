/**
 * BORRAR LA CUENTA: piezas puras (sin red) para poder probarlas.
 * - confirmacionValida(): el cuerpo debe ser exactamente {confirmacion: "BORRAR"}.
 * - borrarCarpetaStorage(): quita TODOS los objetos de una carpeta de un bucket
 *   (los objetos de Storage no se borran por cascada al borrar al usuario).
 */

export const PALABRA_BORRAR = "BORRAR";

/** ¿El cuerpo trae la confirmación exacta? (sin recortar espacios ni cambiar mayúsculas) */
export function confirmacionValida(cuerpo: unknown): boolean {
  return typeof cuerpo === "object" && cuerpo !== null && !Array.isArray(cuerpo) && (cuerpo as { confirmacion?: unknown }).confirmacion === PALABRA_BORRAR;
}

type Objeto = { name: string; id: string | null };
type Respuesta<T> = Promise<{ data: T | null; error: { message?: string } | null }>;

/** Lo mínimo que se usa del bucket de Supabase Storage (el cliente real lo cumple). */
export type BucketStorage = {
  list: (carpeta: string, opciones: { limit: number; offset: number }) => Respuesta<Objeto[]>;
  remove: (rutas: string[]) => Respuesta<unknown[]>;
};

const PAGINA = 100;
const LOTE = 100;
const MAX_OBJETOS = 20_000;
const MAX_PROFUNDIDAD = 4;

/** Todas las rutas de objetos dentro de la carpeta (paginando; las subcarpetas se recorren). */
async function listarRutas(bucket: BucketStorage, carpeta: string, profundidad: number, acumulado: string[]): Promise<void> {
  for (let offset = 0; ; offset += PAGINA) {
    const { data, error } = await bucket.list(carpeta, { limit: PAGINA, offset });
    if (error) throw new Error(`No se pudo listar ${carpeta}: ${error.message ?? "error"}`);
    const items = data ?? [];
    for (const it of items) {
      const ruta = `${carpeta}/${it.name}`;
      if (it.id === null) {
        // Subcarpeta (Storage la muestra sin id)
        if (profundidad < MAX_PROFUNDIDAD) await listarRutas(bucket, ruta, profundidad + 1, acumulado);
      } else acumulado.push(ruta);
      if (acumulado.length > MAX_OBJETOS) throw new Error("Demasiados archivos para borrar de una vez.");
    }
    if (items.length < PAGINA) return;
  }
}

/** Borra todo lo que hay en `carpeta` (sin la diagonal final). Regresa cuántos objetos quitó; truena si algo falla. */
export async function borrarCarpetaStorage(bucket: BucketStorage, carpeta: string): Promise<number> {
  if (!carpeta || carpeta.includes("..") || carpeta.startsWith("/")) throw new Error("Carpeta no válida.");
  const rutas: string[] = [];
  await listarRutas(bucket, carpeta, 0, rutas);
  for (let i = 0; i < rutas.length; i += LOTE) {
    const { error } = await bucket.remove(rutas.slice(i, i + LOTE));
    if (error) throw new Error(`No se pudo borrar en ${carpeta}: ${error.message ?? "error"}`);
  }
  return rutas.length;
}
