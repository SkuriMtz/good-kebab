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
        /^(boton|btn|boton-icono|vidrio|entrada|pestanas|marco|halo|acordeon|icono|etiqueta|encabezado|seccion|contenedor|formulario-lista|pildora|marca-agente|producto|menu|avatar|insignia|punto-estado|kbd|buscador|cajon|progreso|escribiendo|t-app)(--|__|-|$)/,
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
        // Base 4b (dashboard)
        atencion: "var(--c-atencion)",
        "accion-texto": "var(--c-accion-texto)", // texto azul de acción (enlaces del producto)
        marca: "var(--c-marca)", // violeta de Atendel: solo identidad
        terciario: "var(--c-terciario)", // placeholders, deshabilitado, íconos inactivos
        elevado: "var(--c-elevado)",
        propio: "var(--c-propio)",
        "capa-hover": "var(--c-hover)",
        "capa-activa": "var(--c-activo)",
        lateral: "var(--c-lateral, var(--c-fondo))",
      },
      fontFamily: {
        sans: ["var(--font-mona-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mona-sans-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        producto: ["var(--font-producto)"],
      },
      boxShadow: {
        flotante: "var(--sombra-flotante)", // solo lo que flota: menús, cajón, modal
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
        // Base 4b (dashboard)
        control: "var(--radio-app-control)", // 8
        "tarjeta-app": "var(--radio-app-tarjeta)", // 12
        menu: "var(--radio-app-menu)", // 14
        "panel-app": "var(--radio-app-panel)", // 16
        burbuja: "var(--radio-burbuja)", // 16
        circulo: "var(--radio-circulo)",
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
