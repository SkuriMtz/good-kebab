import type { NombreForma } from "./formas";

/**
 * Dónde y cómo se ve cada figura. Cada sección de una página dice qué
 * escena lleva: <section data-escena="globo">. La figura se queda quieta
 * mientras lees esa sección y, cuando llega la siguiente, se deshace y vuela
 * a formar la nueva.
 *
 * Medidas: cx y cy son fracciones de la pantalla (0 = izquierda/arriba);
 * `escala` es el radio de la figura en píxeles; `giro` da la inclinación
 * [hacia los lados, hacia adelante, de lado] según el tiempo en segundos.
 */
export type NombreEscena =
  | "burbuja"
  | "globo"
  | "equipo"
  | "lista"
  | "logo"
  | "burbujaDerecha"
  | "globoDerecha"
  | "logoDerecha"
  | "candadoDerecha"
  | "polvo";

export const ESCENAS: NombreEscena[] = [
  "burbuja",
  "globo",
  "equipo",
  "lista",
  "logo",
  "burbujaDerecha",
  "globoDerecha",
  "logoDerecha",
  "candadoDerecha",
  "polvo",
];

export type Colocacion = {
  forma: NombreForma;
  /** "objeto": una figura en 3D; "pantalla": polvo repartido por toda la pantalla. */
  modo: "objeto" | "pantalla";
  cx: number;
  cy: number;
  escala: number;
  giro: (t: number) => [number, number, number];
  /** Opacidad general (para que el texto encima se lea). */
  alfa: number;
  /** Tamaño de los triangulitos. */
  tam: number;
  /** Cuánto se apagan los puntos de atrás (1 = no se ven, como en un globo sólido). */
  ocultarAtras: number;
};

const quieto = (yaw: number, pitch: number, roll: number, mece = 0.04) => (t: number): [number, number, number] => [
  yaw + Math.sin(t * 0.13) * mece,
  pitch + Math.sin(t * 0.11) * mece * 0.5,
  roll,
];

export function colocar(escena: NombreEscena, w: number, h: number): Colocacion {
  const celular = w < 900;
  const polvo = (forma: NombreForma, alfa = 1): Colocacion => ({
    forma,
    modo: "pantalla",
    cx: 0.5,
    cy: 0.5,
    escala: 1,
    giro: () => [0, 0, 0],
    alfa,
    tam: celular ? 0.8 : 1,
    ocultarAtras: 0,
  });
  switch (escena) {
    case "burbuja":
      return celular
        ? { forma: "burbuja", modo: "objeto", cx: 0.5, cy: 0.27, escala: Math.min(w * 0.4, h * 0.22), giro: quieto(-0.3, 0.1, -0.1), alfa: 0.9, tam: 0.75, ocultarAtras: 0.55 }
        : { forma: "burbuja", modo: "objeto", cx: 0.29, cy: 0.57, escala: Math.min(h * 0.43, w * 0.25), giro: quieto(-0.38, 0.12, -0.14), alfa: 1, tam: 1, ocultarAtras: 0.55 };
    case "globo":
      return celular
        ? { forma: "esfera", modo: "objeto", cx: 0.66, cy: 0.28, escala: w * 0.55, giro: (t) => [t * 0.015 - 0.05, 0.22, 0.1], alfa: 0.9, tam: 0.8, ocultarAtras: 1 }
        : { forma: "esfera", modo: "objeto", cx: 0.74, cy: 0.74, escala: Math.min(h * 0.555, w * 0.36), giro: (t) => [t * 0.015 - 0.05, 0.22, 0.1], alfa: 1, tam: 1.15, ocultarAtras: 1 };
    case "equipo":
      return polvo("polvoArriba", celular ? 0.7 : 1);
    case "lista":
      return polvo("polvoIzquierda", celular ? 0.7 : 1);
    case "logo":
      return celular
        ? { forma: "marca", modo: "objeto", cx: 0.5, cy: 0.5, escala: Math.min(w * 0.42, h * 0.26), giro: quieto(-0.42, 0.14, 0, 0.08), alfa: 0.6, tam: 0.8, ocultarAtras: 0.4 }
        : { forma: "marca", modo: "objeto", cx: 0.5, cy: 0.455, escala: h * 0.38, giro: quieto(-0.42, 0.14, 0, 0.08), alfa: 0.75, tam: 1, ocultarAtras: 0.7 };
    case "burbujaDerecha":
    case "globoDerecha":
    case "logoDerecha":
    case "candadoDerecha": {
      const forma: NombreForma =
        escena === "burbujaDerecha" ? "burbuja" : escena === "globoDerecha" ? "esfera" : escena === "logoDerecha" ? "marca" : "candado";
      const globo = forma === "esfera";
      const giro = globo ? (t: number): [number, number, number] => [t * 0.015 - 0.05, 0.22, 0.1] : quieto(forma === "burbuja" ? -0.3 : -0.35, 0.12, forma === "burbuja" ? -0.1 : 0);
      if (celular) return { forma, modo: "objeto", cx: 0.5, cy: 0.27, escala: Math.min(w * 0.38, h * 0.21), giro, alfa: 0.85, tam: 0.75, ocultarAtras: globo ? 1 : 0.5 };
      return { forma, modo: "objeto", cx: globo ? 0.75 : 0.72, cy: 0.55, escala: Math.min(h * (globo ? 0.36 : 0.34), w * (globo ? 0.2 : 0.22)), giro, alfa: 1, tam: 1, ocultarAtras: globo ? 1 : 0.5 };
    }
    default:
      return polvo("polvo", 1);
  }
}

export const esEscena = (s: string | undefined): s is NombreEscena => !!s && (ESCENAS as string[]).includes(s);
