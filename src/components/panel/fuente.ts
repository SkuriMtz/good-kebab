import localFont from "next/font/local";

/**
 * La serif del panel: Source Serif 4 (licencia SIL OFL 1.1, ver
 * src/fonts/SourceSerif4-OFL.txt). Elegida con UI UX Pro Max
 * (`search.py --domain google-fonts`): sobria, con eje de tamaño óptico
 * (opsz 8–60) para que el saludo de 40px y los títulos de 32px se vean
 * finos. Se sirve desde nuestro dominio (la CSP solo permite fuentes de
 * 'self') y solo se carga donde se usa la clase: /panel y /pruebalo.
 */
export const serifPanel = localFont({
  src: "../../fonts/SourceSerif4-opsz-latin.woff2",
  weight: "200 900",
  style: "normal",
  display: "swap",
  variable: "--font-serif-panel",
  fallback: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
});
