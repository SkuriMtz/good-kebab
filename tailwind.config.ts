import type { Config } from "tailwindcss";

/**
 * Tokens del sistema de diseño de Atendel (ver DESIGN.md, estilo "título de
 * cine"): lienzo negro, texto blanco, un solo rojo como signo de puntuación,
 * titulares itálicos ultraligeros, líneas finas como única estructura y
 * cero esquinas redondeadas.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#000000", // lienzo
        shale: "#101010", // superficie apenas más clara
        bone: "#ffffff", // texto principal
        ash: "#8f8f8f", // texto secundario
        silver: "#c4c4c4", // texto de párrafos
        signal: "#ff2936", // acento rojo: máximo uno por pantalla
        // "Papel": lo que entregan los agentes en los ejemplos
        papel: { DEFAULT: "#f2f1ed", tinta: "#151515", gris: "#66635d", linea: "rgba(21,21,21,0.13)", rojo: "#cc1f2b" },
        // Alias para componentes existentes
        iris: { DEFAULT: "#ffffff", hover: "#ffffff" },
        saffron: "#ff2936",
        mint: "#ff2936",
        verdant: "#ffffff",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        cond: ["var(--font-cond)", "Impact", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1.4" }],
        nav: ["0.875rem", { lineHeight: "1", letterSpacing: "0.04em" }],
        body: ["1.0625rem", { lineHeight: "1.55" }],
        "heading-2xs": ["1.375rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "heading-sm": ["clamp(1.75rem, 3.4vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        heading: ["clamp(2.25rem, 5vw, 4rem)", { lineHeight: "1.02", letterSpacing: "-0.01em" }],
        "heading-lg": ["clamp(2.75rem, 7.4vw, 7rem)", { lineHeight: "0.98", letterSpacing: "-0.015em" }],
        display: ["clamp(3.5rem, 11vw, 10rem)", { lineHeight: "0.92", letterSpacing: "-0.015em" }],
        wordmark: ["clamp(6.5rem, 28vw, 22rem)", { lineHeight: "0.85", letterSpacing: "-0.02em" }],
      },
      spacing: {
        "4.5": "1.125rem",
        "7.5": "1.875rem",
        "15": "3.75rem",
        "30": "7.5rem",
      },
      maxWidth: {
        page: "90rem",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
