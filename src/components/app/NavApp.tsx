/**
 * Antes era la barra de la app (copia de la barra pública). Desde el
 * dashboard, la barra superior, el menú lateral y el menú de la cuenta los
 * pone el armazón (src/app/panel/layout.tsx → ArmazonPanel), así que aquí
 * ya no se pinta nada. Se queda para que el chat del panel
 * (src/app/panel/chat/Chat.tsx, del Grupo 2) siga funcionando sin cambios;
 * el integrador puede quitar la llamada cuando junte el chat ganador.
 */
export function NavApp(_props: { email: string }) {
  return null;
}
