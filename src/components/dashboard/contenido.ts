import type { IdVista, Novedad } from "./tipos";

/**
 * Contenido del dashboard que es igual en /pruebalo y en /panel.
 * Todo es real: funciones que Atendel ya tiene, atajos que sí funcionan.
 */

/** Novedades de Atendel: solo cosas que ya existen y se pueden usar hoy. */
export const NOVEDADES: Novedad[] = [
  { id: "grupos", titulo: "Chats en grupo", texto: "Junta a dos o más agentes en una conversación y que se repartan el trabajo." },
  { id: "gmail", titulo: "Clara lee tu Gmail", texto: "Conecta tu cuenta y resume lo que no has leído. Solo lectura: nunca envía ni borra." },
  { id: "comandos", titulo: "Acciones con /", texto: "Escribe / en el chat para ver lo que puede hacer cada agente." },
  { id: "claro", titulo: "Modo claro", texto: "Cámbialo desde tu menú de perfil o desde la paleta de comandos." },
];

/** Segunda tecla después de "G" para ir a cada vista (como en GitHub: G y luego la letra). */
export const TECLA_VISTA: Partial<Record<IdVista, string>> = {
  resumen: "R",
  conversaciones: "C",
  agentes: "A",
  correo: "E",
};

export type GrupoAtajos = { titulo: string; atajos: { teclas: string[]; texto: string }[] };

/** La hoja de atajos (tecla "?"). `mod` se cambia por ⌘ en Mac y Ctrl en lo demás. */
export function gruposAtajos(mod: string): GrupoAtajos[] {
  return [
    {
      titulo: "Moverte",
      atajos: [
        { teclas: [mod, "K"], texto: "Abrir la paleta: vistas, agentes y conversaciones" },
        { teclas: ["/"], texto: "Buscar" },
        { teclas: ["G", "R"], texto: "Ir a Resumen" },
        { teclas: ["G", "C"], texto: "Ir a Conversaciones" },
        { teclas: ["G", "A"], texto: "Ir a Agentes" },
        { teclas: ["G", "E"], texto: "Ir a Correo" },
      ],
    },
    {
      titulo: "Hacer",
      atajos: [
        { teclas: ["N"], texto: "Nueva conversación" },
        { teclas: ["?"], texto: "Ver estos atajos" },
        { teclas: ["Esc"], texto: "Cerrar menús y ventanas" },
      ],
    },
    {
      titulo: "En la paleta",
      atajos: [
        { teclas: ["↑", "↓"], texto: "Moverte entre resultados" },
        { teclas: ["↵"], texto: "Abrir el resultado elegido" },
      ],
    },
  ];
}

/** Para buscar sin que importen acentos ni mayúsculas ("victor" encuentra "Víctor"). */
export const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es-MX")
    .trim();

export function saludoPorHora(fecha: Date) {
  const h = fecha.getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

/** "Martes 8 de octubre" */
export function fechaLarga(fecha: Date) {
  const texto = fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toLocaleUpperCase("es-MX") + texto.slice(1).replace(",", "");
}

/** "1 de noviembre": cuándo se renueva el conteo de mensajes. */
export function renovacion(fecha: Date) {
  const siguiente = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1);
  return siguiente.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
}

/** "octubre" */
export function mesDe(fecha: Date) {
  return fecha.toLocaleDateString("es-MX", { month: "long" });
}

/** "Hace 5 min", "Hace 3 h", "Ayer", "12 sept." */
export function haceCuanto(iso: string, ahora = new Date()) {
  const d = new Date(iso);
  const min = Math.round((ahora.getTime() - d.getTime()) / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24 && d.getDate() === ahora.getDate()) return `Hace ${horas} h`;
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export const esMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
