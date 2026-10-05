/**
 * Las figuras de la escena 3D, como nubes de puntos.
 * Cada figura se arma muestreando la SUPERFICIE de un modelo 3D sencillo
 * (hecho con matemáticas, sin archivos), así los puntos quedan repartidos
 * parejo por toda la figura.
 *
 * Por punto se guardan:
 * - posición (x, y, z) — la figura mide más o menos de -1.5 a 1.5
 * - normal (nx, ny, nz) — hacia dónde mira la superficie, para la luz
 *   (0, 0, 0 = polvo suelto, sin luz)
 * - color (r, g, b) de 0 a 1
 * - opacidad (0 a 1)
 */
export type Nube = {
  n: number;
  pos: Float32Array;
  normal: Float32Array;
  color: Float32Array;
  alfa: Float32Array;
};

type Color = [number, number, number];
const hex = (h: string): Color => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Color;
const mezcla = (a: Color, b: Color, k: number): Color => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** La paleta de la escena: ámbar, morado, blanco y un poco de verde azulado. */
export const PALETA = {
  ambar: hex("#f5a623"),
  morado: hex("#7b5cff"),
  blanco: hex("#ffffff"),
  verdeAzul: hex("#2fd6b5"),
};

/** Los colores de Lola, Clara, Víctor e Iris (los del logo), llevados hacia la paleta de la escena. */
const COLORES_LOGO: Color[] = [
  mezcla(hex("#ff8a6b"), PALETA.ambar, 0.45), // Lola: coral → ámbar
  mezcla(hex("#7fb2ff"), PALETA.morado, 0.6), // Clara: azul → morado
  mezcla(hex("#5fd09f"), PALETA.verdeAzul, 0.5), // Víctor: verde → verde azulado
  mezcla(hex("#f6c64a"), PALETA.ambar, 0.4), // Iris: amarillo → ámbar
];

function nueva(n: number): Nube {
  return {
    n,
    pos: new Float32Array(n * 3),
    normal: new Float32Array(n * 3),
    color: new Float32Array(n * 3),
    alfa: new Float32Array(n),
  };
}

function poner(f: Nube, i: number, p: [number, number, number], nrm: [number, number, number], c: Color, a: number) {
  f.pos.set(p, i * 3);
  f.normal.set(nrm, i * 3);
  f.color.set(c, i * 3);
  f.alfa[i] = a;
}

/**
 * El logo de Atendel en 3D: los cuatro círculos (uno por agente) como cuatro
 * esferas acomodadas dos por dos. Los puntos se reparten parejo sobre la
 * superficie de cada esfera (espiral de Fibonacci), así la luz les da volumen.
 * Un poco de polvo suelto alrededor, para que la figura "respire".
 */
export function logo(n: number): Nube {
  const f = nueva(n);
  const R = 0.52;
  const SEP = 0.62;
  const CENTROS: [number, number][] = [
    [-SEP, SEP],
    [SEP, SEP],
    [-SEP, -SEP],
    [SEP, -SEP],
  ];
  const polvo = Math.floor(n * 0.05);
  const porEsfera = Math.floor((n - polvo) / 4);
  const dorado = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < n; i++) {
    if (i < polvo) {
      // Polvo alrededor del logo: una nube suave
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 1.4;
      const s = Math.sqrt(1 - u * u);
      const c = [PALETA.ambar, PALETA.morado, PALETA.blanco, PALETA.verdeAzul][Math.floor(Math.random() * 4)];
      poner(f, i, [Math.cos(a) * s * r, u * r * 0.8, Math.sin(a) * s * r * 0.6], [0, 0, 0], c, 0.1 + Math.random() * 0.22);
      continue;
    }
    const j = i - polvo;
    const k = Math.min(3, Math.floor(j / porEsfera));
    const m = j - k * porEsfera;
    const [cx, cy] = CENTROS[k];
    // Espiral de Fibonacci: puntos repartidos parejo sobre la esfera
    const y = 1 - ((m + 0.5) / porEsfera) * 2;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const a = m * dorado + k * 1.7;
    const nx = Math.cos(a) * rr;
    const nz = Math.sin(a) * rr;
    // Color: el del agente, con destellos de la paleta (la mezcla del sitio de referencia)
    const azar = Math.random();
    let c = COLORES_LOGO[k];
    if (azar < 0.08) c = PALETA.blanco;
    else if (azar < 0.14) c = PALETA.morado;
    else if (azar < 0.19) c = PALETA.ambar;
    poner(f, i, [cx + nx * R, cy + y * R, nz * R], [nx, y, nz], c, 0.2 + Math.random() * 0.26);
  }
  return f;
}
