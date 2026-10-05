import type { CSSProperties, ReactNode } from "react";

/**
 * Íconos de contorno de Atendel: SVG propios, trazo de 1.75px en una
 * rejilla de 24, puntas y uniones redondeadas. Toman el color del texto
 * (currentColor); `tono` los pone en gris perla (cuerpo) o azul cielo.
 *
 * Accesibilidad: si el ícono va junto a un texto, es decorativo (por
 * defecto, aria-hidden). Si va solo, pasa `titulo` y se anuncia.
 */

export type NombreIcono =
  | "chevron"
  | "chevron-derecha"
  | "flecha"
  | "flecha-arriba-derecha"
  | "candado"
  | "escudo"
  | "mano"
  | "correo"
  | "mensaje"
  | "calendario"
  | "usuarios"
  | "documento"
  | "check"
  | "check-circulo"
  | "alerta"
  | "menu"
  | "cerrar"
  | "sol"
  | "luna"
  | "enviar"
  | "reloj"
  | "mas";

const TRAZOS: Record<NombreIcono, ReactNode> = {
  chevron: <path d="m6 9 6 6 6-6" />,
  "chevron-derecha": <path d="m9 6 6 6-6 6" />,
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  "flecha-arriba-derecha": <path d="M7 17 17 7M8 7h9v9" />,
  candado: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3.5 5 6v5.5c0 4.4 2.9 7.8 7 9 4.1-1.2 7-4.6 7-9V6l-7-2.5Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  mano: (
    <>
      <path d="M8 12.5V6a1.5 1.5 0 0 1 3 0v5" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11V6a1.5 1.5 0 0 1 3 0v7.5" />
      <path d="M17 10.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.6a6 6 0 0 1-4.6-2.2L4.6 15a1.6 1.6 0 0 1 2.3-2.2L8 14" />
    </>
  ),
  correo: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </>
  ),
  mensaje: (
    <>
      <path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.4L3.5 20.5l1.5-4.6A8.4 8.4 0 1 1 20.5 11.6Z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
    </>
  ),
  usuarios: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  documento: (
    <>
      <path d="M14 3.5H7.5A2 2 0 0 0 5.5 5.5v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8L14 3.5Z" />
      <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  "check-circulo": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </>
  ),
  alerta: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5M12 16h.01" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  luna: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  enviar: (
    <>
      <path d="M20.5 3.5 10 14" />
      <path d="m20.5 3.5-6.5 17-4-6.5-6.5-4 17-6.5Z" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
};

export type PropsIcono = {
  nombre: NombreIcono;
  /** Lado en px (por defecto 20; los tokens son 16, 20 y 24). */
  tam?: number;
  /** cuerpo = gris perla (#a4aea6), cielo = azul cielo (#8dd6ff); sin tono, el color del texto. */
  tono?: "cuerpo" | "cielo";
  /** Grosor del trazo: 1.5 a 2 (por defecto 1.75). */
  trazo?: number;
  /** Si el ícono va solo (sin texto al lado), su nombre para lectores de pantalla. */
  titulo?: string;
  className?: string;
  style?: CSSProperties;
};

/** Un ícono de contorno. Ej.: <Icono nombre="candado" tono="cielo" tam={24} /> */
export function Icono({ nombre, tam, tono, trazo = 1.75, titulo, className = "", style }: PropsIcono) {
  const clases = ["icono", tono === "cuerpo" ? "icono--cuerpo" : tono === "cielo" ? "icono--cielo" : "", className].filter(Boolean).join(" ");
  const estilo = tam ? ({ "--icono-tam": `${tam}px`, ...style } as CSSProperties) : style;
  return (
    <svg
      className={clases}
      style={estilo}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={Math.min(2, Math.max(1.5, trazo))}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={titulo ? "img" : undefined}
      aria-hidden={titulo ? undefined : true}
      aria-label={titulo}
      focusable="false"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}

/** Todos los nombres (para el muestrario /base). */
export const NOMBRES_ICONOS = Object.keys(TRAZOS) as NombreIcono[];

/** Indicador de carga (círculo que gira). Hereda el color del texto. */
export function Giro({ className = "", etiqueta }: { className?: string; etiqueta?: string }) {
  return (
    <span
      className={`girando ${className}`}
      role={etiqueta ? "status" : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    />
  );
}
