import type { NombreForma } from "./formas";
import type { EscenaInicio } from "@/lib/inicio";

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
  | "portada"
  | "agentesLista"
  | "vacio"
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
  "portada",
  "agentesLista",
  "vacio",
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
      if (celular) return { forma, modo: "objeto", cx: 0.5, cy: 0.27, escala: Math.min(w * 0.38, h * 0.21), giro, alfa: 0.5, tam: 0.75, ocultarAtras: globo ? 1 : 0.5 };
      return { forma, modo: "objeto", cx: globo ? 0.77 : 0.75, cy: 0.5, escala: Math.min(h * (globo ? 0.3 : 0.29), w * (globo ? 0.17 : 0.18)), giro, alfa: 0.6, tam: 1, ocultarAtras: globo ? 1 : 0.5 };
    }
    case "portada":
      // La portada del inicio: la burbuja a la derecha, con el título a su izquierda.
      // En celular, chica y arriba, para que el título quede en la primera pantalla.
      return celular
        ? { forma: "burbuja", modo: "objeto", cx: 0.5, cy: 0.215, escala: Math.min(w * 0.29, h * 0.14), giro: quieto(-0.3, 0.1, -0.1), alfa: 0.6, tam: 0.7, ocultarAtras: 0.55 }
        : { forma: "burbuja", modo: "objeto", cx: 0.765, cy: 0.56, escala: Math.min(h * 0.34, w * 0.2), giro: quieto(-0.34, 0.12, -0.12), alfa: 0.6, tam: 1, ocultarAtras: 0.55 };
    case "agentesLista":
      // La lista de agentes del inicio: la burbuja de la portada se vuelve un
      // globo del mismo lado (cambio corto, sin cruzar la pantalla, lección 10),
      // a la derecha de la lista. En celular, solo polvo ralo y tenue.
      return celular
        ? polvo("polvoArriba", 0.2)
        : { forma: "esfera", modo: "objeto", cx: 0.86, cy: 0.58, escala: Math.min(h * 0.2, w * 0.11), giro: (t) => [t * 0.015 - 0.05, 0.22, 0.1], alfa: 0.55, tam: 0.9, ocultarAtras: 1 };
    case "vacio":
      // El resto del inicio: la figura se deshace y no tapa ningún texto
      return polvo("polvo", 0);
    default:
      return polvo("polvo", 1);
  }
}

export const esEscena = (s: string | undefined): s is NombreEscena => !!s && (ESCENAS as string[]).includes(s);

/* =====================================================================
   El inicio (src/app/page.tsx): 8 escenas con el mismo nombre que usa la
   página (src/lib/inicio.ts). La figura de cada escena se elige SOLO en
   FORMA_INICIO: el grupo de Figuras cambia aquí "burbuja" por "cerebro",
   "foco", "globo"… sin tocar la página. Las colocaciones salen de los
   videos (diseno/capturas/dala/MEDIDAS.md, §6): centro en fracción de la
   pantalla y `escala` como el radio de la figura en px.
   ===================================================================== */

/** La figura de cada escena del inicio (provisionales del motor de la v7). */
export const FORMA_INICIO: Record<EscenaInicio, NombreForma> = {
  portada: "burbuja", // cerebro de lado, a la derecha
  decisiones: "burbuja", // el mismo cerebro, más grande y a la izquierda
  caos: "polvo", // polvo por toda la pantalla
  foco: "burbuja", // foco inclinado a la izquierda
  globo: "esfera", // globo con continentes a la derecha
  equipo: "polvoArriba", // polvo recargado arriba
  planes: "polvoIzquierda", // polvo ralo arriba a la izquierda
  cierre: "marca", // remolino detrás del texto del cierre
};

/** Dónde va la figura de cada escena del inicio. En celular, abajo y tenue para no tapar el texto. */
export function colocarInicio(escena: EscenaInicio, w: number, h: number): Colocacion {
  const forma = FORMA_INICIO[escena];
  const celular = w < 900;
  const pantalla = (alfa: number, tam = 1): Colocacion => ({
    forma,
    modo: "pantalla",
    cx: 0.5,
    cy: 0.5,
    escala: 1,
    giro: () => [0, 0, 0],
    alfa,
    tam: (celular ? 0.8 : 1) * tam,
    ocultarAtras: 0,
  });
  const objeto = (cx: number, cy: number, escala: number, giro: Colocacion["giro"], alfa = 1, ocultarAtras = 0.55): Colocacion => ({
    forma,
    modo: "objeto",
    cx,
    cy,
    escala,
    giro,
    alfa,
    tam: celular ? 0.75 : 1,
    ocultarAtras,
  });
  const globo = (t: number): [number, number, number] => [t * 0.015 - 0.05, 0.22, 0.1];
  if (celular) {
    switch (escena) {
      case "portada":
      case "decisiones":
        return objeto(0.5, 0.78, Math.min(w * 0.4, h * 0.2), quieto(-0.34, 0.12, -0.12), 0.55);
      case "foco":
        return objeto(0.5, 0.8, Math.min(w * 0.38, h * 0.19), quieto(-0.3, 0.1, -0.5), 0.55);
      case "globo":
        return objeto(0.62, 0.86, w * 0.48, globo, 0.55, 1);
      case "cierre":
        return objeto(0.5, 0.5, Math.min(w * 0.4, h * 0.22), quieto(-0.42, 0.14, 0, 0.08), 0.35, 0.4);
      case "caos":
        return pantalla(0.7);
      default:
        return pantalla(0.55);
    }
  }
  switch (escena) {
    case "portada":
      // Cerebro de lado: caja x 42.7–97.8 %, y 16.8–83.5 % → centro (70 %, 50 %), ≈ 668×500 px a 1212×750
      return objeto(0.7, 0.5, Math.min(h * 0.333, w * 0.206), quieto(-0.34, 0.12, -0.12));
    case "decisiones":
      // Más grande y a la izquierda, cortado por la orilla: caja x < 0–60.6 %, y 8–97 %
      return objeto(0.27, 0.53, Math.min(h * 0.5, w * 0.31), quieto(0.3, 0.18, 0.08));
    case "foco":
      // Inclinado ~35°: caja x 5.9–45.5 %, y 10–86 % → centro (26 %, 48 %)
      return objeto(0.26, 0.48, Math.min(h * 0.385, w * 0.24), quieto(-0.3, 0.1, 0.6));
    case "globo":
      // Centro (850, 500) px = (70 %, 67 %), radio ≈ 385 px: cortado a la derecha y abajo
      return objeto(0.7, 0.667, Math.min(h * 0.513, w * 0.318), globo, 1, 1);
    case "cierre":
      // Remolino detrás del texto: caja x 28–62 %, y 9–82 % → centro (45 %, 45 %)
      return objeto(0.45, 0.45, Math.min(h * 0.36, w * 0.22), quieto(-0.42, 0.14, 0, 0.08), 0.6, 0.4);
    case "caos":
      // El polvo del video es denso y de triangulitos de 8–14 px
      return pantalla(1.6, 1.7);
    default:
      return pantalla(0.85, 1.3);
  }
}
