"use client";

/** Secciones de la app (después de entrar). Se conservan por compatibilidad. */
export const NAV_APP = [
  { href: "/panel", label: "Resumen" },
  { href: "/panel/chat", label: "Hablar con mi equipo" },
  { href: "/panel/agentes", label: "Mis agentes" },
  { href: "/panel?vista=correo", label: "Correo con Clara" },
];

/**
 * Antes era la barra de la app. Ahora la barra superior, el menú lateral, el
 * menú de perfil (con "Cerrar sesión") y el cajón del celular los pone el
 * armazón del dashboard en src/app/panel/layout.tsx, alrededor de todas las
 * páginas de /panel. Se queda como componente vacío para que las páginas que
 * todavía lo llaman (el chat) no pinten una segunda barra.
 */
export function NavApp(_props: { email?: string }) {
  return null;
}
