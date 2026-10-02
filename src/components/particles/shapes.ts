/**
 * Figuras para las constelaciones de partículas.
 * Cada figura es una lista de puntos dentro de un cuadro de [-1, 1]
 * (con "y" hacia abajo, como en la pantalla).
 */
export type ShapeName = "mail" | "chat" | "chart" | "search" | "lock" | "check" | "logo";
export type Punto = [number, number];
type Generador = (n: number, out: Punto[]) => void;

const rnd = Math.random;
const ruido = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
const conRuido = (x: number, y: number, j: number): Punto => [x + ruido() * j, y + ruido() * j];
const J = 0.014;

/** Puntos a lo largo de una línea quebrada. */
function linea(puntos: Punto[], cerrada = false, j = J): Generador {
  const lista = cerrada ? [...puntos, puntos[0]] : puntos;
  const segmentos: [Punto, Punto, number][] = [];
  let total = 0;
  for (let i = 0; i < lista.length - 1; i++) {
    const a = lista[i];
    const b = lista[i + 1];
    const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segmentos.push([a, b, largo]);
    total += largo;
  }
  return (n, out) => {
    for (let i = 0; i < n; i++) {
      let s = ((i + rnd()) / n) * total;
      let k = 0;
      while (k < segmentos.length - 1 && s > segmentos[k][2]) {
        s -= segmentos[k][2];
        k++;
      }
      const [a, b, largo] = segmentos[k];
      const t = Math.min(1, s / largo);
      out.push(conRuido(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, j));
    }
  };
}

/** Una franja gruesa entre dos puntos (para trazos tipo marcador). */
function trazo(a: Punto, b: Punto, grosor: number): Generador {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const largo = Math.hypot(dx, dy);
  const nx = -dy / largo;
  const ny = dx / largo;
  return (n, out) => {
    for (let i = 0; i < n; i++) {
      const t = rnd();
      const o = (rnd() - 0.5) * grosor;
      out.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]);
    }
  };
}

function arco(c: Punto, r: number, a0: number, a1: number, grosor = 0, j = J): Generador {
  return (n, out) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * ((i + rnd()) / n);
      const rr = r + (rnd() - 0.5) * grosor;
      out.push(conRuido(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, j));
    }
  };
}

/** Contorno de un rectángulo con esquinas redondeadas. */
function rectRedondo(x: number, y: number, w: number, h: number, r: number, j = J): Generador {
  const rectoW = w - 2 * r;
  const rectoH = h - 2 * r;
  const esquina = (Math.PI * r) / 2;
  const total = 2 * rectoW + 2 * rectoH + 4 * esquina;
  return (n, out) => {
    for (let i = 0; i < n; i++) {
      let s = ((i + rnd()) / n) * total;
      if (s < rectoW) {
        out.push(conRuido(x + r + s, y, j));
        continue;
      }
      s -= rectoW;
      if (s < esquina) {
        const a = -Math.PI / 2 + s / r;
        out.push(conRuido(x + w - r + Math.cos(a) * r, y + r + Math.sin(a) * r, j));
        continue;
      }
      s -= esquina;
      if (s < rectoH) {
        out.push(conRuido(x + w, y + r + s, j));
        continue;
      }
      s -= rectoH;
      if (s < esquina) {
        const a = s / r;
        out.push(conRuido(x + w - r + Math.cos(a) * r, y + h - r + Math.sin(a) * r, j));
        continue;
      }
      s -= esquina;
      if (s < rectoW) {
        out.push(conRuido(x + w - r - s, y + h, j));
        continue;
      }
      s -= rectoW;
      if (s < esquina) {
        const a = Math.PI / 2 + s / r;
        out.push(conRuido(x + r + Math.cos(a) * r, y + h - r + Math.sin(a) * r, j));
        continue;
      }
      s -= esquina;
      if (s < rectoH) {
        out.push(conRuido(x, y + h - r - s, j));
        continue;
      }
      s -= rectoH;
      const a = Math.PI + s / r;
      out.push(conRuido(x + r + Math.cos(a) * r, y + r + Math.sin(a) * r, j));
    }
  };
}

function caja(x: number, y: number, w: number, h: number): Generador {
  return (n, out) => {
    for (let i = 0; i < n; i++) out.push([x + rnd() * w, y + rnd() * h]);
  };
}

function disco(c: Punto, r: number): Generador {
  return (n, out) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = r * Math.sqrt(rnd());
      out.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]);
    }
  };
}

function dentro(poligono: Punto[], x: number, y: number) {
  let adentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i];
    const [xj, yj] = poligono[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) adentro = !adentro;
  }
  return adentro;
}

/** Relleno de uno o varios polígonos (regla par-impar, para hacer huecos). */
function relleno(poligonos: Punto[][]): Generador {
  const todos = poligonos.flat();
  const xs = todos.map((p) => p[0]);
  const ys = todos.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return (n, out) => {
    let k = 0;
    let intentos = 0;
    while (k < n && intentos < n * 60) {
      intentos++;
      const x = x0 + rnd() * (x1 - x0);
      const y = y0 + rnd() * (y1 - y0);
      let adentro = false;
      for (const p of poligonos) if (dentro(p, x, y)) adentro = !adentro;
      if (adentro) {
        out.push([x, y]);
        k++;
      }
    }
  };
}

const TAU = Math.PI * 2;
const A_EXTERIOR: Punto[] = [
  [0, -0.94],
  [1, 0.94],
  [0.385, 0.94],
  [0, 0.226],
  [-0.385, 0.94],
  [-1, 0.94],
];
const A_INTERIOR: Punto[] = [
  [0, -0.456],
  [0.215, -0.04],
  [-0.215, -0.04],
];

type Figura = { partes: [Generador, number][]; dy?: number };

const FIGURAS: Record<ShapeName, Figura> = {
  // Sobre de correo
  mail: {
    partes: [
      [rectRedondo(-0.95, -0.62, 1.9, 1.24, 0.1), 0.5],
      [linea([[-0.88, -0.55], [0, 0.1], [0.88, -0.55]]), 0.27],
      [linea([[-0.9, 0.56], [-0.27, 0.02]]), 0.06],
      [linea([[0.9, 0.56], [0.27, 0.02]]), 0.06],
      [caja(-0.84, -0.5, 1.68, 1.0), 0.11],
    ],
  },
  // Globo de chat con tres puntos
  chat: {
    partes: [
      [rectRedondo(-0.95, -0.78, 1.9, 1.3, 0.36), 0.52],
      [linea([[-0.5, 0.52], [-0.7, 0.9], [-0.12, 0.52]]), 0.1],
      [disco([-0.42, -0.13], 0.11), 0.1],
      [disco([0, -0.13], 0.11), 0.1],
      [disco([0.42, -0.13], 0.11), 0.1],
      [caja(-0.78, -0.62, 1.56, 0.98), 0.08],
    ],
    dy: -0.06,
  },
  // Gráfica de barras con tendencia
  chart: {
    partes: [
      [linea([[-0.98, 0.84], [0.98, 0.84]]), 0.08],
      [caja(-0.84, 0.28, 0.3, 0.5), 0.08],
      [caja(-0.38, -0.14, 0.3, 0.92), 0.14],
      [caja(0.08, 0.1, 0.3, 0.68), 0.11],
      [caja(0.54, -0.5, 0.3, 1.28), 0.2],
      [linea([[-0.69, 0.06], [-0.23, -0.36], [0.23, -0.12], [0.69, -0.72]], false, 0.01), 0.22],
      [linea([[0.66, -0.52], [0.69, -0.72], [0.5, -0.64]], false, 0.008), 0.05],
      [disco([-0.69, 0.06], 0.045), 0.03],
      [disco([-0.23, -0.36], 0.045), 0.03],
      [disco([0.23, -0.12], 0.045), 0.03],
    ],
    dy: -0.05,
  },
  // Lupa
  search: {
    partes: [
      [arco([-0.2, -0.2], 0.56, 0, TAU, 0.11, 0.008), 0.56],
      [trazo([0.22, 0.22], [0.86, 0.86], 0.17), 0.26],
      [arco([-0.2, -0.2], 0.34, Math.PI * 1.08, Math.PI * 1.42, 0, 0.01), 0.08],
      [disco([-0.2, -0.2], 0.42), 0.1],
    ],
    dy: -0.02,
  },
  // Candado
  lock: {
    partes: [
      [arco([0, -0.2], 0.42, Math.PI, TAU, 0.1, 0.006), 0.22],
      [trazo([-0.42, -0.2], [-0.42, 0.04], 0.1), 0.04],
      [trazo([0.42, -0.2], [0.42, 0.04], 0.1), 0.04],
      [rectRedondo(-0.7, 0.02, 1.4, 0.98, 0.14), 0.44],
      [disco([0, 0.42], 0.11), 0.09],
      [trazo([0, 0.46], [0, 0.72], 0.08), 0.07],
      [caja(-0.6, 0.12, 1.2, 0.78), 0.06],
    ],
    dy: -0.16,
  },
  // Palomita de "listo"
  check: {
    partes: [
      [trazo([-0.6, 0.04], [-0.16, 0.48], 0.17), 0.3],
      [trazo([-0.16, 0.48], [0.68, -0.44], 0.17), 0.46],
      [arco([0.02, 0.02], 0.98, 0, TAU, 0, 0.006), 0.24],
    ],
  },
  // La "A" de Atendel
  logo: {
    partes: [
      [linea(A_EXTERIOR, true, 0.01), 0.52],
      [linea(A_INTERIOR, true, 0.006), 0.16],
      [relleno([A_EXTERIOR, A_INTERIOR]), 0.32],
    ],
  },
};

/** Devuelve exactamente `n` puntos de la figura, en orden aleatorio. */
export function shapePoints(nombre: ShapeName, n: number): Punto[] {
  const { partes, dy = 0 } = FIGURAS[nombre];
  const total = partes.reduce((s, [, w]) => s + w, 0);
  const out: Punto[] = [];
  partes.forEach(([generar, w], i) => {
    const k = i === partes.length - 1 ? n - out.length : Math.round((n * w) / total);
    if (k > 0) generar(k, out);
  });
  while (out.length < n) out.push(out[Math.floor(rnd() * out.length)] ?? [0, 0]);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, n).map(([x, y]) => [x, y + dy] as Punto);
}
