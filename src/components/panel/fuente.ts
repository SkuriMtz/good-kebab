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

/*
 * Las letras que se pueden elegir en Ajustes > Apariencia (como en Claude:
 * letra de la interfaz y de las respuestas). Archivos variables, subconjunto
 * latino (español completo), servidos desde nuestro dominio; licencia SIL
 * OFL 1.1 (src/fonts/apariencia/LICENCIAS-OFL.txt). Con `preload: false`
 * solo se descarga la que alguien elige: el navegador baja una fuente hasta
 * que un texto la usa.
 */
const inter = localFont({ src: "../../fonts/apariencia/inter-latin-wght-normal.woff2", weight: "100 900", style: "normal", display: "swap", preload: false, variable: "--font-inter" });
const dmSans = localFont({ src: "../../fonts/apariencia/dm-sans-latin-wght-normal.woff2", weight: "100 1000", style: "normal", display: "swap", preload: false, variable: "--font-dm-sans" });
const manrope = localFont({ src: "../../fonts/apariencia/manrope-latin-wght-normal.woff2", weight: "200 800", style: "normal", display: "swap", preload: false, variable: "--font-manrope" });
const plex = localFont({ src: "../../fonts/apariencia/ibm-plex-sans-latin-wght-normal.woff2", weight: "100 700", style: "normal", display: "swap", preload: false, variable: "--font-plex" });
const nunito = localFont({ src: "../../fonts/apariencia/nunito-latin-wght-normal.woff2", weight: "200 1000", style: "normal", display: "swap", preload: false, variable: "--font-nunito" });
const grotesk = localFont({ src: "../../fonts/apariencia/space-grotesk-latin-wght-normal.woff2", weight: "300 700", style: "normal", display: "swap", preload: false, variable: "--font-grotesk" });
const atkinson = localFont({ src: "../../fonts/apariencia/atkinson-hyperlegible-next-latin-wght-normal.woff2", weight: "200 800", style: "normal", display: "swap", preload: false, variable: "--font-atkinson" });
const newsreader = localFont({ src: "../../fonts/apariencia/newsreader-latin-wght-normal.woff2", weight: "200 800", style: "normal", display: "swap", preload: false, variable: "--font-newsreader" });
const lora = localFont({ src: "../../fonts/apariencia/lora-latin-wght-normal.woff2", weight: "400 700", style: "normal", display: "swap", preload: false, variable: "--font-lora" });
const literata = localFont({ src: "../../fonts/apariencia/literata-latin-wght-normal.woff2", weight: "200 900", style: "normal", display: "swap", preload: false, variable: "--font-literata" });
const merriweather = localFont({ src: "../../fonts/apariencia/merriweather-latin-wght-normal.woff2", weight: "300 900", style: "normal", display: "swap", preload: false, variable: "--font-merriweather" });
const fraunces = localFont({ src: "../../fonts/apariencia/fraunces-latin-wght-normal.woff2", weight: "100 900", style: "normal", display: "swap", preload: false, variable: "--font-fraunces" });

/** Las clases que definen las variables (--font-inter…); van en el armazón del panel. */
export const clasesFuentesApariencia = [inter, dmSans, manrope, plex, nunito, grotesk, atkinson, newsreader, lora, literata, merriweather, fraunces].map((f) => f.variable).join(" ");
