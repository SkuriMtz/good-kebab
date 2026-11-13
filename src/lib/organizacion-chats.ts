/**
 * Cómo acomoda cada quien sus conversaciones en el menú: las fijadas, las
 * archivadas y sus grupos (como carpetas: "Proveedores", "Clientes VIP").
 * En /panel se guarda en ajustes_cuenta.datos.organizacion (sin migración:
 * PUT /api/chats/organizacion); en /pruebalo, en la pestaña.
 *
 * Dónde sale cada conversación (en este orden): archivada → Archivados;
 * fijada → Fijados; en un grupo → ese grupo; si no → Recientes.
 */

export type GrupoChats = { id: string; nombre: string; chats: string[] };
export type OrganizacionChats = { fijadas: string[]; archivadas: string[]; grupos: GrupoChats[] };

export const ORGANIZACION_VACIA: OrganizacionChats = { fijadas: [], archivadas: [], grupos: [] };
export const MAX_GRUPOS = 30;
export const MAX_NOMBRE_GRUPO = 40;
const MAX_IDS = 300;

const esId = (v: unknown): v is string => typeof v === "string" && /^[\w-]{1,100}$/.test(v);
const ids = (v: unknown) => (Array.isArray(v) ? Array.from(new Set(v.filter(esId))).slice(0, MAX_IDS) : []);

/** El nombre de un grupo: sin saltos ni caracteres de control, recortado. */
export function limpiarNombreGrupo(v: unknown) {
  return typeof v === "string"
    ? v
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_NOMBRE_GRUPO)
    : "";
}

/** Lo que llega (de la base o del navegador) se limpia campo por campo; lo desconocido se ignora. */
export function limpiarOrganizacion(entrada: unknown): OrganizacionChats {
  const o = entrada && typeof entrada === "object" && !Array.isArray(entrada) ? (entrada as Record<string, unknown>) : {};
  const vistos = new Set<string>();
  const grupos: GrupoChats[] = [];
  for (const g of Array.isArray(o.grupos) ? o.grupos : []) {
    if (!g || typeof g !== "object") continue;
    const r = g as Record<string, unknown>;
    const nombre = limpiarNombreGrupo(r.nombre);
    if (!esId(r.id) || !nombre || grupos.some((x) => x.id === r.id)) continue;
    // Una conversación vive en un solo grupo
    const chats = ids(r.chats).filter((c) => !vistos.has(c));
    chats.forEach((c) => vistos.add(c));
    grupos.push({ id: r.id, nombre, chats });
    if (grupos.length >= MAX_GRUPOS) break;
  }
  return { fijadas: ids(o.fijadas), archivadas: ids(o.archivadas), grupos };
}

/** Las acciones del menú "⋯" sobre la organización (puras: regresan una copia). */
export const organizar = {
  fijar(o: OrganizacionChats, id: string, si: boolean): OrganizacionChats {
    const fijadas = o.fijadas.filter((x) => x !== id);
    return { ...o, fijadas: si ? [id, ...fijadas] : fijadas, archivadas: si ? o.archivadas.filter((x) => x !== id) : o.archivadas };
  },
  archivar(o: OrganizacionChats, id: string, si: boolean): OrganizacionChats {
    const archivadas = o.archivadas.filter((x) => x !== id);
    return { ...o, archivadas: si ? [id, ...archivadas] : archivadas, fijadas: si ? o.fijadas.filter((x) => x !== id) : o.fijadas };
  },
  /** A un grupo (o a ninguno con null). Sale de Fijados y de Archivados para verse en su grupo. */
  mover(o: OrganizacionChats, id: string, grupo: string | null): OrganizacionChats {
    const grupos = o.grupos.map((g) => ({ ...g, chats: g.id === grupo ? [id, ...g.chats.filter((x) => x !== id)] : g.chats.filter((x) => x !== id) }));
    return { fijadas: o.fijadas.filter((x) => x !== id), archivadas: o.archivadas.filter((x) => x !== id), grupos };
  },
  crearGrupo(o: OrganizacionChats, id: string, nombre: string, chat?: string): OrganizacionChats {
    const n = limpiarNombreGrupo(nombre);
    if (!n || o.grupos.length >= MAX_GRUPOS) return o;
    const nuevo: OrganizacionChats = { ...o, grupos: [...o.grupos, { id, nombre: n, chats: [] }] };
    return chat ? organizar.mover(nuevo, chat, id) : nuevo;
  },
  renombrarGrupo(o: OrganizacionChats, id: string, nombre: string): OrganizacionChats {
    const n = limpiarNombreGrupo(nombre);
    return n ? { ...o, grupos: o.grupos.map((g) => (g.id === id ? { ...g, nombre: n } : g)) } : o;
  },
  /** Borra el grupo; sus conversaciones regresan a Recientes (no se borran). */
  borrarGrupo(o: OrganizacionChats, id: string): OrganizacionChats {
    return { ...o, grupos: o.grupos.filter((g) => g.id !== id) };
  },
  /** Una conversación que se eliminó: sale de todo. */
  olvidar(o: OrganizacionChats, id: string): OrganizacionChats {
    return { fijadas: o.fijadas.filter((x) => x !== id), archivadas: o.archivadas.filter((x) => x !== id), grupos: o.grupos.map((g) => ({ ...g, chats: g.chats.filter((x) => x !== id) })) };
  },
};

/** Un id nuevo para un grupo ("g-" y letras al azar). */
export const idGrupo = () => `g-${Math.random().toString(36).slice(2, 10)}`;

/** Reparte las conversaciones (ya en orden de más nueva a más vieja) en las secciones del menú. */
export function repartir<T extends { id: string }>(chats: readonly T[], o: OrganizacionChats) {
  const archivadas = new Set(o.archivadas);
  const fijadas = new Set(o.fijadas);
  const enGrupo = new Map<string, string>();
  for (const g of o.grupos) for (const c of g.chats) enGrupo.set(c, g.id);
  const porId = new Map(chats.map((c) => [c.id, c]));
  return {
    // Fijados en el orden en que se fijaron (la última arriba)
    fijados: o.fijadas.map((id) => porId.get(id)).filter((c): c is T => Boolean(c) && !archivadas.has((c as T).id)),
    grupos: o.grupos.map((g) => ({ ...g, lista: chats.filter((c) => enGrupo.get(c.id) === g.id && !fijadas.has(c.id) && !archivadas.has(c.id)) })),
    recientes: chats.filter((c) => !archivadas.has(c.id) && !fijadas.has(c.id) && !enGrupo.has(c.id)),
    archivados: chats.filter((c) => archivadas.has(c.id)),
    grupoDe: (id: string) => enGrupo.get(id) ?? null,
  };
}
