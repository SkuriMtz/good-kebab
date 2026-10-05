import type { Config } from "tailwindcss";

/**
 * Tailwind solo expone los tokens semánticos de globals.css (cambian solos
 * entre modo oscuro y claro). Nada de colores sueltos: si falta uno, se
 * agrega como token en globals.css y luego aquí.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  // Las clases de la base común (globals.css, @layer components) se guardan
  // siempre, aunque un componente las arme con plantillas (`boton--${variante}`).
  safelist: [
    {
      pattern:
        /^(boton|btn|vidrio|entrada|pestanas|marco|halo|acordeon|icono|etiqueta|encabezado|seccion|contenedor|formulario-lista|pildora|marca-agente)(--|__|$)/,
    },
  ],
  future: {
    // hover: solo en dispositivos con puntero fino (evita el hover "pegado" en celular)
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        tinta: "var(--c-texto)", // títulos y texto principal
        grafito: "var(--c-texto-2)", // cuerpo
        tenue: "var(--c-tenue)", // texto terciario
        accion: "var(--c-accion)", // el único botón lleno
        enlace: "var(--c-enlace)", // enlaces y acentos fríos
        destacada: "var(--c-destacada)",
        borde: "var(--c-borde)",
        "borde-fuerte": "var(--c-borde-fuerte)",
        fondo: "var(--c-fondo)",
        "fondo-2": "var(--c-fondo-2)",
        portada: "var(--c-portada)",
        superficie: "var(--c-superficie)",
        error: "var(--c-error)",
        exito: "var(--c-exito)",
      },
      fontFamily: {
        sans: ["var(--font-mona-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mona-sans-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        page: "var(--ancho-max)",
        texto: "var(--ancho-texto)",
      },
      borderRadius: {
        boton: "var(--radio-boton)",
        campo: "var(--radio-campo)",
        tarjeta: "var(--radio-tarjeta)",
        imagen: "var(--radio-imagen)",
        pildora: "var(--radio-pildora)",
        panel: "var(--radio-panel)",
        marco: "var(--radio-marco)",
      },
      transitionTimingFunction: {
        base: "var(--ease)",
        entrada: "var(--ease-entrada)",
      },
      transitionDuration: {
        micro: "200ms",
        grande: "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
