/**
 * Secciones de la app (después de entrar). Las mismas que el menú lateral
 * del dashboard (src/components/dashboard/TableroPanel.tsx).
 */
export const NAV_APP = [
  { href: "/panel", label: "Resumen" },
  { href: "/panel/chat", label: "Conversaciones" },
  { href: "/panel/agentes", label: "Agentes" },
  { href: "/panel?vista=correo", label: "Correo con Clara" },
];

/**
 * Antes era la barra de la app. Desde el dashboard, la barra, el menú
 * lateral, tu cuenta y "Cerrar sesión" los pone el layout del panel
 * (src/app/panel/layout.tsx) para todas sus páginas, así que aquí ya no se
 * pinta nada. Se conserva para que las páginas que lo usan (como el chat)
 * no tengan que cambiar.
 */
export function NavApp(props: { email: string }) {
  void props;
  return null;
}
