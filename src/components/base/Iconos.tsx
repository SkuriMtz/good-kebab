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
  | "mas"
  // Base 4b: dashboard y chat
  | "campana"
  | "buscar"
  | "inicio"
  | "conversaciones"
  | "agentes"
  | "clientes"
  | "grafica"
  | "ajustes"
  | "ayuda"
  | "perfil"
  | "persona"
  | "facturacion"
  | "negocio"
  | "cerrar-sesion"
  | "flecha-izquierda"
  | "chevron-izquierda"
  | "pausa"
  | "reproducir"
  | "repetir"
  | "copiar"
  | "basura"
  | "barra-lateral"
  | "estrella"
  | "fijar"
  | "filtro"
  | "puntos"
  | "check-doble"
  | "rayo";

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

  /* ---------- Base 4b: dashboard y chat ---------- */
  campana: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 5 2.5 7.5 2.5 7.5h-17S6 14.5 6 9.5Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  buscar: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </>
  ),
  inicio: <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z" />,
  conversaciones: (
    <>
      <path d="M15.5 9.5a6 6 0 0 1-8.7 5.4L3.5 16l1-3.1A6 6 0 1 1 15.5 9.5Z" />
      <path d="M16.9 9.6a5 5 0 0 1 2.6 8.4l1 2.5-2.8-1.3a5 5 0 0 1-6.3-2.8" />
    </>
  ),
  /* Un personaje (blob) con dos ojos: los agentes de Atendel */
  agentes: (
    <>
      <path d="M12 4c4.6 0 7.5 3.2 7.5 7.6 0 4.6-3.2 8.4-7.5 8.4s-7.5-3.8-7.5-8.4C4.5 7.2 7.4 4 12 4Z" />
      <path d="M9.5 11v1.5M14.5 11v1.5" />
    </>
  ),
  clientes: (
    <>
      <rect x="4" y="3.5" width="14.5" height="17" rx="2.5" />
      <circle cx="11.25" cy="10" r="2.5" />
      <path d="M7.5 16.5a3.9 3.9 0 0 1 7.5 0M18.5 7.5H20M18.5 12H20M18.5 16.5H20" />
    </>
  ),
  grafica: <path d="M4 20.5h16M7 16.5v-4M12 16.5v-9M17 16.5v-6.5" />,
  ajustes: (
    <>
      <path d="M18.2 9.74 20.44 10.36v3.28l-2.24.62-.22.53 1.15 2.02-2.32 2.32-2.02-1.15-.53.22-.62 2.24h-3.28l-.62-2.24-.53-.22-2.02 1.15-2.32-2.32 1.15-2.02-.22-.53-2.24-.62v-3.28l2.24-.62.22-.53-1.15-2.02 2.32-2.32 2.02 1.15.53-.22.62-2.24h3.28l.62 2.24.53.22 2.02-1.15 2.32 2.32-1.15 2.02.22.53Z" />
      <circle cx="12" cy="12" r="2.75" />
    </>
  ),
  ayuda: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.1-2.5 3.7M12 17h.01" />
    </>
  ),
  perfil: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.6 18.3a6.2 6.2 0 0 1 10.8 0" />
    </>
  ),
  persona: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  facturacion: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M7 14.5h3" />
    </>
  ),
  negocio: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
      <path d="M9 7.5h.01M15 7.5h.01M9 11.5h.01M15 11.5h.01M10 20.5v-4h4v4" />
    </>
  ),
  "cerrar-sesion": (
    <>
      <path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" />
      <path d="m15 8 4 4-4 4M19 12H9.5" />
    </>
  ),
  "flecha-izquierda": <path d="M19 12H5M11 6l-6 6 6 6" />,
  "chevron-izquierda": <path d="m15 6-6 6 6 6" />,
  pausa: (
    <>
      <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" />
    </>
  ),
  reproducir: <path d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10-6.4a.8.8 0 0 0 0-1.4l-10-6.4a.8.8 0 0 0-1.2.7Z" />,
  repetir: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-7.5-7.5c2.1 0 4 .8 5.6 2.3l1.9 1.7" />
      <path d="M19.5 4v4.5H15" />
    </>
  ),
  copiar: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  basura: (
    <>
      <path d="M4 6.5h16M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7" />
      <path d="m6 6.5.9 12.2a2 2 0 0 0 2 1.8h6.2a2 2 0 0 0 2-1.8L18 6.5M10 10.5v6M14 10.5v6" />
    </>
  ),
  "barra-lateral": (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M9.5 4.5v15" />
    </>
  ),
  estrella: <path d="M12 3.6l2.17 5.81 6.2.27-4.85 3.86 1.65 5.98L12 16.1l-5.17 3.42 1.65-5.98-4.85-3.86 6.2-.27L12 3.6Z" />,
  /* Chincheta: lo fijado arriba (agentes fijados) */
  fijar: <path d="M9 3.5h6M10 3.5v5.2L7 12v2h10v-2l-3-3.3V3.5M12 14v6.5" />,
  filtro: <path d="M4 7h16M7 12h10M10 17h4" />,
  puntos: (
    <>
      <circle cx="6" cy="12" r="1.1" />
      <circle cx="12" cy="12" r="1.1" />
      <circle cx="18" cy="12" r="1.1" />
    </>
  ),
  "check-doble": <path d="m2.5 12.5 4.5 4.5 9-9.5M12 16l1 1 9-9.5" />,
  rayo: <path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12L13 3Z" />,
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
