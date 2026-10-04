/**
 * Las figuras de la escena, hechas de puntos (cada punto se dibuja como un
 * triangulito). Cada figura tiene los mismos N puntos para poder pasar de
 * una a otra: el punto i de la burbuja viaja al punto i del globo.
 *
 * Por punto se guardan 8 números: x, y, z (la figura mide más o menos de -1 a 1),
 * r, g, b (de 0 a 1), opacidad y tamaño.
 */

export type NombreForma = "burbuja" | "esfera" | "candado" | "marca" | "polvo";
export const FORMAS: NombreForma[] = ["burbuja", "esfera", "candado", "marca", "polvo"];
export const POR_PUNTO = 8;

type Color = [number, number, number];
const hex = (h: string): Color => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Color;

const AMBAR = hex("#ffb829");
const VIOLETA = hex("#8052ff");
const VERDE = hex("#2fd6a8");
const BLANCO = hex("#ffffff");
const ROSA = hex("#ffb3c7");
const AZUL = hex("#5b8cff");
/** Lola, Clara, Víctor e Iris: los colores del logo. */
const AGENTES = [hex("#ff8a6b"), hex("#7fb2ff"), hex("#5fd09f"), hex("#f6c64a")];

/** Mezcla entre colores según t (0 a 1). */
function degradado(paradas: [number, Color][], t: number): Color {
  if (t <= paradas[0][0]) return paradas[0][1];
  for (let i = 1; i < paradas.length; i++) {
    const [t1, c1] = paradas[i];
    if (t <= t1) {
      const [t0, c0] = paradas[i - 1];
      const k = (t - t0) / (t1 - t0);
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
    }
  }
  return paradas[paradas.length - 1][1];
}

/* Ruido suave en 3D (para las manchas del globo) */
function azar3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function ruido(x: number, y: number, z: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => azar3(ix + dx, iy + dy, iz + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), ux), l(c(0, 1, 0), c(1, 1, 0), ux), uy),
    l(l(c(0, 0, 1), c(1, 0, 1), ux), l(c(0, 1, 1), c(1, 1, 1), ux), uy),
    uz,
  );
}
const manchas = (x: number, y: number, z: number) => ruido(x, y, z) * 0.65 + ruido(x * 2.1 + 5, y * 2.1, z * 2.1) * 0.35;

/** Dirección al azar sobre una esfera. */
function direccion(): [number, number, number] {
  const u = Math.random() * 2 - 1;
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(a), u, r * Math.sin(a)];
}

function poner(datos: Float32Array, i: number, x: number, y: number, z: number, c: Color, alfa: number, tam: number) {
  const o = i * POR_PUNTO;
  datos[o] = x;
  datos[o + 1] = y;
  datos[o + 2] = z;
  datos[o + 3] = c[0];
  datos[o + 4] = c[1];
  datos[o + 5] = c[2];
  datos[o + 6] = alfa;
  datos[o + 7] = tam;
}

/** Una burbuja de chat inflada, con los tres puntos de "escribiendo…" adentro. Ámbar arriba, violeta y verde abajo. */
function burbuja(n: number, d: Float32Array) {
  const paradas: [number, Color][] = [
    [0, VERDE],
    [0.22, AZUL],
    [0.38, VIOLETA],
    [0.62, ROSA],
    [0.85, AMBAR],
  ];
  for (let i = 0; i < n; i++) {
    const q = Math.random();
    if (q < 0.07) {
      // Los tres puntos
      const k = Math.floor(Math.random() * 3);
      const [dx, dy, dz] = direccion();
      const r = 0.1 * Math.cbrt(Math.random());
      poner(d, i, (k - 1) * 0.36 + dx * r, 0.06 + dy * r, 0.42 + dz * r, Math.random() < 0.5 ? BLANCO : ROSA, 1, 0.8);
    } else if (q < 0.17) {
      // La colita, abajo a la izquierda
      const u = Math.pow(Math.random(), 0.8);
      const ancho = 0.24 * (1 - u) + 0.02;
      const x = -0.5 - 0.42 * u + (Math.random() - 0.5) * ancho * 2;
      const y = -0.62 - 0.5 * u + (Math.random() - 0.5) * ancho * 0.6;
      const z = (Math.random() - 0.5) * 0.5 * (1 - u);
      poner(d, i, x, y, z, degradado(paradas, (y + 1.15) / 2.1), 0.9, 1);
    } else {
      // El cuerpo: un cojín con esquinas redondas
      let x = 0;
      let y = 0;
      let rho = 2;
      while (rho > 1) {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        rho = Math.pow(x ** 4 + y ** 4, 0.25);
      }
      const lado = Math.random() < 0.5 ? 1 : -1;
      const dentro = Math.random() < 0.18 ? Math.random() : 1;
      const z = lado * 0.4 * Math.sqrt(Math.max(0, 1 - rho ** 6)) * dentro;
      const X = x * 1.15;
      const Y = y * 0.82;
      poner(d, i, X, Y, z, degradado(paradas, (Y + 1.15) / 2.1), dentro < 1 ? 0.45 : 1, 1);
    }
  }
}

/** Un globo con manchas de color, como continentes, y un brillo blanco. */
function esfera(n: number, d: Float32Array) {
  const brillo: [number, number, number] = [-0.55, 0.25, 0.8];
  const lb = Math.hypot(...brillo);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = direccion();
    const m = manchas(x * 1.9 + 3, y * 1.9, z * 1.9);
    const cerca = (x * brillo[0] + y * brillo[1] + z * brillo[2]) / lb;
    if (cerca > 0.965 && Math.random() < 0.85) {
      poner(d, i, x, y, z, Math.random() < 0.6 ? BLANCO : ROSA, 1, 1.25);
    } else if (m > 0.38) {
      const c = manchas(x * 3.3 + 11, y * 3.3, z * 3.3);
      const color = c < 0.42 ? VIOLETA : c < 0.6 ? AMBAR : c < 0.7 ? VERDE : Math.random() < 0.5 ? AMBAR : VIOLETA;
      poner(d, i, x, y, z, color, 1, 1.3);
    } else {
      // Mar: puntitos tenues
      poner(d, i, x * 0.995, y * 0.995, z * 0.995, Math.random() < 0.5 ? VIOLETA : AMBAR, 0.3, 0.6);
    }
  }
}

/** Un candado (tus datos): el arco en ámbar y el cuerpo de violeta a verde, con el ojo de la llave. */
function candado(n: number, d: Float32Array) {
  const W = 0.72;
  const H = 1.0;
  const D = 0.3;
  const top = 0.02;
  const caras = [
    [2 * W * H, "frente"],
    [2 * W * H, "atras"],
    [2 * D * H, "izq"],
    [2 * D * H, "der"],
    [4 * W * D, "arriba"],
    [4 * W * D, "abajo"],
  ] as const;
  const total = caras.reduce((s, c) => s + c[0], 0);
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.3) {
      // El arco: medio toro con dos patas
      const R = 0.44;
      const r = 0.085;
      const f = Math.random() * Math.PI * 2;
      const u = Math.random() * 1.35;
      let cx: number;
      let cy: number;
      let tx: number;
      let ty: number;
      if (u < 1) {
        const a = u * Math.PI;
        cx = Math.cos(a) * R;
        cy = 0.42 + Math.sin(a) * R;
        tx = Math.cos(a);
        ty = Math.sin(a);
      } else {
        const lado = Math.random() < 0.5 ? 1 : -1;
        cx = lado * R;
        cy = top + (0.42 - top) * ((u - 1) / 0.35);
        tx = lado;
        ty = 0;
      }
      const x = cx + tx * Math.cos(f) * r;
      const y = cy + ty * Math.cos(f) * r;
      const z = Math.sin(f) * r;
      poner(d, i, x, y, z, degradado([[0, AMBAR], [0.7, ROSA], [1, BLANCO]], (y - top) / 0.9), 1, 0.95);
      continue;
    }
    let x = 0;
    let y = 0;
    let z = 0;
    for (;;) {
      let k = Math.random() * total;
      let cara: (typeof caras)[number][1] = "frente";
      for (const [area, nombre] of caras) {
        if (k < area) {
          cara = nombre;
          break;
        }
        k -= area;
      }
      const a = Math.random() * 2 - 1;
      const b = Math.random();
      if (cara === "frente" || cara === "atras") {
        x = a * W;
        y = top - b * H;
        z = cara === "frente" ? D : -D;
        // El ojo de la llave queda vacío en el frente
        const ojo = Math.hypot(x, y + 0.4) < 0.12 || (Math.abs(x) < 0.05 && y < -0.4 && y > -0.74);
        if (cara === "frente" && ojo) continue;
      } else if (cara === "izq" || cara === "der") {
        x = cara === "der" ? W : -W;
        y = top - b * H;
        z = a * D;
      } else {
        x = a * W;
        y = cara === "arriba" ? top : top - H;
        z = (Math.random() * 2 - 1) * D;
      }
      break;
    }
    const c = degradado([[0, VERDE], [0.45, AZUL], [1, VIOLETA]], (y - top + H) / H);
    poner(d, i, x, y + 0.2, z, Math.random() < 0.06 ? AMBAR : c, 1, 0.9);
  }
  // Centrar el candado completo
  for (let i = 0; i < n; i++) d[i * POR_PUNTO + 1] -= 0.08;
}

/** El logo de Atendel: cuatro esferas, una por agente, con un brillo blanco. */
function marca(n: number, d: Float32Array) {
  const C = [
    [-0.47, 0.47],
    [0.47, 0.47],
    [-0.47, -0.47],
    [0.47, -0.47],
  ];
  const luz: [number, number, number] = [-0.5, 0.6, 0.62];
  for (let i = 0; i < n; i++) {
    const k = i % 4;
    const [x, y, z] = direccion();
    const r = 0.4 * (Math.random() < 0.15 ? Math.cbrt(Math.random()) : 1);
    const l = x * luz[0] + y * luz[1] + z * luz[2];
    const c = degradado([[0, AGENTES[k]], [0.75, AGENTES[k]], [1, BLANCO]], (l + 1) / 2);
    poner(d, i, C[k][0] + x * r, C[k][1] + y * r, z * r, c, r < 0.4 ? 0.45 : 1, 1);
  }
}

/** Polvo suelto por todas partes (para las secciones sin figura). */
function polvo(n: number, d: Float32Array) {
  const colores = [AMBAR, VIOLETA, VERDE, BLANCO, AMBAR, VIOLETA];
  for (let i = 0; i < n; i++) {
    poner(
      d,
      i,
      (Math.random() * 2 - 1) * 2.8,
      // Más arriba que abajo: como una nube que se dispersa
      1.7 - 3.4 * Math.pow(Math.random(), 1.6),
      (Math.random() * 2 - 1) * 1.4,
      colores[Math.floor(Math.random() * colores.length)],
      0.3,
      0.7,
    );
  }
}

const CONSTRUCTORES: Record<NombreForma, (n: number, d: Float32Array) => void> = { burbuja, esfera, candado, marca, polvo };

export function crearForma(nombre: NombreForma, n: number) {
  const d = new Float32Array(n * POR_PUNTO);
  CONSTRUCTORES[nombre](n, d);
  return d;
}

export const esForma = (s: string | undefined): s is NombreForma => !!s && (FORMAS as string[]).includes(s);
