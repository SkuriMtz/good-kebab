import type { Config } from "tailwindcss";

/**
 * Tokens del sistema de diseño de Atendel, "cuaderno de papel cálido":
 * lienzo de papel tibio, tarjetas blancas con filo de 1px, un solo azul para
 * la acción principal y los colores de los cuatro agentes como acentos.
 * Todos los colores salen de variables CSS (globals.css): así cambian solos
 * entre modo claro y oscuro.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        lienzo: "rgb(var(--c-lienzo) / <alpha-value>)", // el fondo de todo
        superficie: "rgb(var(--c-superficie) / <alpha-value>)", // tarjetas
        tinta: "rgb(var(--c-tinta) / <alpha-value>)", // títulos y texto principal
        grafito: "rgb(var(--c-grafito) / <alpha-value>)", // párrafos
        tenue: "rgb(var(--c-tenue) / <alpha-value>)", // texto secundario
        accion: "rgb(var(--c-accion) / <alpha-value>)", // el único botón lleno
        enlace: "rgb(var(--c-enlace) / <alpha-value>)", // texto azul
        error: "rgb(var(--c-error) / <alpha-value>)",
        // Nombres anteriores: los usan componentes que siguen en uso y los de componentes-pendientes
        void: "rgb(var(--c-lienzo) / <alpha-value>)",
        shale: "rgb(var(--c-superficie) / <alpha-value>)",
        bone: "rgb(var(--c-tinta) / <alpha-value>)",
        silver: "rgb(var(--c-grafito) / <alpha-value>)",
        ash: "rgb(var(--c-tenue) / <alpha-value>)",
        signal: "rgb(var(--c-error) / <alpha-value>)",
        saffron: "rgb(var(--c-error) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1.33", letterSpacing: "0.01em" }],
        "body-sm": ["0.875rem", { lineHeight: "1.43" }],
        body: ["1rem", { lineHeight: "1.5" }],
      },
      maxWidth: {
        page: "75rem",
      },
      borderRadius: {
        tarjeta: "12px",
        boton: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
