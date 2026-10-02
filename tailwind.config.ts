import type { Config } from "tailwindcss";

/**
 * Tokens del sistema de diseño de Atendel (ver DESIGN.md):
 * lienzo negro puro, un solo violeta para acciones, ámbar para resaltar,
 * titulares enormes de peso 400 y cuerpo ultraligero (200).
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        bone: "#ffffff",
        ash: "#9a9a9a",
        silver: "#bdbdbd",
        iris: { DEFAULT: "#8052ff", hover: "#9372ff" },
        saffron: "#ffb829",
        verdant: "#15846e",
        mint: "#1fc7a4",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1.5" }],
        nav: ["0.875rem", { lineHeight: "1.2", letterSpacing: "0.025em" }],
        body: ["1.125rem", { lineHeight: "1.5" }],
        "heading-2xs": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "heading-sm": ["clamp(1.875rem, 3.4vw, 2.625rem)", { lineHeight: "1.12", letterSpacing: "-0.04em" }],
        heading: ["clamp(2.125rem, 4.2vw, 3rem)", { lineHeight: "1.08", letterSpacing: "-0.035em" }],
        "heading-lg": ["clamp(2.5rem, 6.2vw, 4.875rem)", { lineHeight: "1.02", letterSpacing: "-0.04em" }],
        display: ["clamp(3rem, 8.8vw, 7.0625rem)", { lineHeight: "0.98", letterSpacing: "-0.04em" }],
      },
      spacing: {
        "4.5": "1.125rem",
        "7.5": "1.875rem",
        "15": "3.75rem",
        "30": "7.5rem",
      },
      maxWidth: {
        page: "80rem",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
