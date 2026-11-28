import localFont from "next/font/local";

/**
 * La letra de acento del título de la portada: Instrument Serif itálica (licencia SIL OFL 1.1,
 * ver src/fonts/InstrumentSerif-OFL.txt). Elegida con UI UX Pro Max (pareja «sans + serif de
 * acento»): junto a Geist, una serif itálica fina y de alto contraste para las palabras que
 * cambian de tamaño. Se sirve desde nuestro dominio (la CSP solo permite fuentes de 'self'),
 * subconjunto latino; solo se carga en el inicio.
 */
export const acento = localFont({
  src: "../../fonts/InstrumentSerif-Italic-latin.woff2",
  weight: "400",
  style: "italic",
  display: "swap",
  variable: "--font-acento",
  fallback: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
});
