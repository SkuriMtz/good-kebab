/**
 * EL EQUIPO DEL NEGOCIO (tabla equipo_contactos): las personas que trabajan
 * con el dueño y a las que sus agentes les pueden mandar cosas por WhatsApp,
 * siempre con su visto bueno. No entran al panel (eso es "Invitar", pronto).
 */

export type ContactoEquipo = { id: string; nombre: string; rol: string; whatsapp: string };

/** Un número como lo escriben ("55 1234 5678", "+52 1 55…") → E.164 ("+525512345678"), o null. */
export function normalizarWhatsapp(texto: string): string | null {
  const t = texto.trim();
  const digitos = t.replace(/\D/g, "");
  if (t.startsWith("+")) return /^[1-9]\d{7,14}$/.test(digitos) ? `+${digitos}` : null;
  if (digitos.length === 10) return `+52${digitos}`; // México, sin lada de país
  if (digitos.length === 12 && digitos.startsWith("52")) return `+${digitos}`;
  if (digitos.length === 13 && digitos.startsWith("521")) return `+52${digitos.slice(3)}`; // el "1" de celular ya no se usa
  return null;
}

/** "+525512345678" → "+52 55 1234 5678" (los de México); los demás, tal cual. */
export function mostrarWhatsapp(e164: string) {
  const d = e164.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("52")) return `+52 ${d.slice(2, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
  return e164;
}

const plano = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** A quién se refiere ("todos", "Luis", "recepción"): los contactos que coinciden por nombre o por rol. */
export function elegirContactos(para: string[], contactos: ContactoEquipo[]): { elegidos: ContactoEquipo[]; sinEncontrar: string[] } {
  const todos = para.some((p) => /^(todos|todo el equipo|el equipo|equipo|todas)$/.test(plano(p)));
  if (todos) return { elegidos: contactos, sinEncontrar: [] };
  const elegidos = new Map<string, ContactoEquipo>();
  const sinEncontrar: string[] = [];
  for (const p of para) {
    const q = plano(p);
    if (!q) continue;
    const hallados = contactos.filter((c) => plano(c.nombre).split(/\s+/).some((w) => w === q) || plano(c.nombre) === q || plano(c.nombre).startsWith(q) || (c.rol && plano(c.rol) === q));
    if (hallados.length) hallados.forEach((c) => elegidos.set(c.id, c));
    else sinEncontrar.push(p);
  }
  return { elegidos: [...elegidos.values()], sinEncontrar };
}
