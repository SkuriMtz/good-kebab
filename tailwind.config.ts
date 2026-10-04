import type { Config } from "tailwindcss";

/**
 * Colores del sistema de diseño (diseno/variables.css, a través de los temas
 * de globals.css): cambian solos entre modo oscuro y claro.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        tinta: "var(--c-texto)", // títulos y texto principal
        grafito: "var(--c-texto-2)", // párrafos
        tenue: "var(--c-tenue)", // texto secundario
        accion: "var(--c-accion)", // el único botón lleno
        enlace: "var(--c-enlace)", // enlaces y acentos de texto
        error: "var(--c-error)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "var(--page-max-width)",
      },
    },
  },
  plugins: [],
};
export default config;
