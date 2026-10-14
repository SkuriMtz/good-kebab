/**
 * Antes era la barra de la app (la barra pública con el correo y "Salir").
 * Desde el dashboard, la barra, el menú lateral y el menú de perfil (con
 * "Cerrar sesión") los pone el armazón de src/app/panel/layout.tsx para
 * TODAS las páginas del panel. Esto queda vacío para que el chat real
 * (src/app/panel/chat/Chat.tsx, del Grupo 2) siga compilando sin cambios;
 * al integrar su versión ganadora se puede quitar la línea que lo usa.
 */
export function NavApp(props: { email: string }) {
  void props;
  return null;
}
