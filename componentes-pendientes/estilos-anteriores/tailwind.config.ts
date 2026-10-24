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
        // Todos salen de variables CSS (globals.css): así cambian solos entre modo claro y oscuro
        void: "rgb(var(--c-void) / <alpha-value>)", // lienzo
        shale: "rgb(var(--c-shale) / <alpha-value>)", // superficie apenas más clara
        bone: "rgb(var(--c-bone) / <alpha-value>)", // texto principal
        ash: "rgb(var(--c-ash) / <alpha-value>)", // texto secundario
        silver: "rgb(var(--c-silver) / <alpha-value>)", // texto de párrafos
        signal: "rgb(var(--c-signal) / <alpha-value>)", // acento rojo: máximo uno por pantalla
        // "Papel": lo que entregan los agentes en los ejemplos (igual en ambos modos, salvo el fondo)
        papel: {
          DEFAULT: "rgb(var(--c-papel) / <alpha-value>)",
          tinta: "#151515",
          gris: "#66635d",
          linea: "rgba(21,21,21,0.13)",
          rojo: "#cc1f2b",
        },
        // Alias para componentes existentes
        iris: { DEFAULT: "rgb(var(--c-bone) / <alpha-value>)", hover: "rgb(var(--c-bone) / <alpha-value>)" },
        saffron: "rgb(var(--c-signal) / <alpha-value>)",
        mint: "rgb(var(--c-signal) / <alpha-value>)",
        verdant: "rgb(var(--c-bone) / <alpha-value>)",
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
        body: ["1.0625rem", { lineHeight: "1.7" }],
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
