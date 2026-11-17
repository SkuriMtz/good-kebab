/**
 * ¿Es una ruta de Atendel? Solo letras, números y los signos de una ruta normal,
 * y nada que el navegador lea como otro sitio: «//sitio» o «/\\sitio» (el navegador
 * toma la diagonal invertida como «/» y saldría de Atendel).
 */
export function rutaInterna(ruta: string): boolean {
  if (!/^\/[A-Za-z0-9_\-./?=&%:#]*$/.test(ruta) || ruta.startsWith("//")) return false;
  try {
    return new URL(ruta, "https://atendel.invalid").origin === "https://atendel.invalid";
  } catch {
    return false;
  }
}
