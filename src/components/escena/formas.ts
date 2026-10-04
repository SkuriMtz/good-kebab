/**
 * Las figuras de la escena, hechas de puntos (cada punto se dibuja como un
 * triangulito). Todas tienen los mismos N puntos para poder pasar de una a
 * otra: el punto i de la burbuja viaja al punto i del globo.
 *
 * Por punto se guardan 11 números: x, y, z (la figura mide más o menos de -1
 * a 1; "y" hacia arriba), r, g, b (de 0 a 1), opacidad, tamaño y hacia dónde
 * mira la superficie en ese punto (la normal: nx, ny, nz), que sirve para
 * iluminar la figura y que se vea en 3D.
 * Las figuras "de pantalla" (el polvo) usan x y y de -1 a 1 como toda la pantalla.
 */

export type NombreForma = "burbuja" | "esfera" | "candado" | "marca" | "polvo" | "polvoArriba" | "polvoIzquierda";
export const POR_PUNTO = 11;

type Color = [number, number, number];
const hex = (h: string): Color => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Color;

const AMBAR = hex("#ffb02e");
const DURAZNO = hex("#ffcfa3");
const LILA_BLANCO = hex("#f6d2cf");
const LILA = hex("#b98cff");
const VIOLETA = hex("#7d50ff");
const AZUL = hex("#4f7bff");
const TURQUESA = hex("#2fd6c0");
const VERDE = hex("#2fd6a8");
const VERDE_CLARO = hex("#7be08a");
const BLANCO = hex("#ffffff");
const ROSA = hex("#ffc2d4");
const CORAL = hex("#ff8a6b");
/** Lola, Clara, Víctor e Iris: los colores del logo. */
const AGENTES = [hex("#ff8a6b"), hex("#7fb2ff"), hex("#5fd09f"), hex("#f6c64a")];

const mezcla = (a: Color, b: Color, k: number): Color => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Mezcla entre colores según t (0 a 1). */
function degradado(paradas: [number, Color][], t: number): Color {
  if (t <= paradas[0][0]) return paradas[0][1];
  for (let i = 1; i < paradas.length; i++) {
    const [t1, c1] = paradas[i];
    if (t <= t1) {
      const [t0, c0] = paradas[i - 1];
      return mezcla(c0, c1, (t - t0) / (t1 - t0));
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

function poner(d: Float32Array, i: number, x: number, y: number, z: number, c: Color, alfa: number, tam: number, nx = 0, ny = 0, nz = 1) {
  const o = i * POR_PUNTO;
  const ln = Math.hypot(nx, ny, nz) || 1;
  d[o + 8] = nx / ln;
  d[o + 9] = ny / ln;
  d[o + 10] = nz / ln;
  d[o] = x;
  d[o + 1] = y;
  d[o + 2] = z;
  d[o + 3] = c[0];
  d[o + 4] = c[1];
  d[o + 5] = c[2];
  d[o + 6] = alfa;
  d[o + 7] = tam;
}

/**
 * Una burbuja de chat redonda e inflada, con la colita abajo a la derecha
 * (como el foco de Dala: ámbar en la orilla de arriba, la cara blanca y
 * durazno, violeta abajo y la colita en azul, turquesa y verde).
 */
function burbuja(n: number, d: Float32Array) {
  // Eje del degradado: de arriba a la izquierda hacia la colita
  const ex = 0.5;
  const ey = -0.866;
  const color = (x: number, y: number, rho: number): Color => {
    const t = Math.min(1, Math.max(0, (x * ex + y * ey + 1.0) / 2.45));
    let c = degradado(
      [
        [0, AMBAR],
        [0.2, DURAZNO],
        [0.42, LILA_BLANCO],
        [0.58, LILA],
        [0.7, VIOLETA],
        [0.82, AZUL],
        [0.9, TURQUESA],
        [1, VERDE_CLARO],
      ],
      t,
    );
    // La orilla más saturada (ámbar arriba, violeta abajo); la cara, más blanca
    c = mezcla(c, t < 0.45 ? AMBAR : VIOLETA, suave(0.78, 1, rho) * 0.55);
    return mezcla(c, BLANCO, (1 - rho) * 0.08);
  };
  for (let i = 0; i < n; i++) {
    const q = Math.random();
    if (q < 0.05) {
      // Los tres puntos de "escribiendo…"
      const k = Math.floor(Math.random() * 3);
      const [dx, dy, dz] = direccion();
      const r = 0.085 * Math.cbrt(Math.random());
      poner(d, i, (k - 1) * 0.3 + dx * r, 0.08 + dy * r, 0.62 + dz * r, Math.random() < 0.6 ? BLANCO : ROSA, 0.55, 0.7, dx, dy, dz);
    } else if (q < 0.15) {
      // La colita: un cono que sale abajo a la derecha
      const u = Math.pow(Math.random(), 0.75);
      const radio = 0.2 * (1 - u) + 0.015;
      const a = Math.random() * Math.PI * 2;
      const x = 0.5 + 0.42 * u + Math.cos(a) * radio * 0.8;
      const y = -0.62 - 0.46 * u + Math.sin(a) * radio * 0.5;
      const z = Math.sin(a) * radio * 1.6;
      poner(d, i, x, y, z, color(x, y, 0.9), 0.7, 0.95, Math.cos(a), 0, Math.sin(a));
    } else {
      // El cuerpo: un cascarón inflado (los puntos en la superficie, así la orilla se ve nítida)
      const [dx, dy, dz] = direccion();
      const e = 2.6;
      const f = Math.abs(dx / 1.0) ** e + Math.abs(dy / 0.86) ** e + Math.abs(dz / 0.62) ** e;
      const r = 1 / Math.pow(f, 1 / e);
      const x = dx * r;
      const y = dy * r + 0.06;
      const z = dz * r;
      const rho = Math.min(1, Math.hypot(x, (y - 0.06) / 0.86));
      // Como en el foco de Dala: triangulitos separados, no una nube blanca
      // La normal de la superficie (para la luz): el gradiente de la forma
      const g = (v: number, k: number) => (Math.sign(v) * Math.abs(v / k) ** (e - 1)) / k;
      poner(d, i, x, y, z, color(x, y, rho), Math.random() < 0.3 ? 0 : 0.62, 1.05, g(x, 1), g(y - 0.06, 0.86), g(z, 0.62));
    }
  }
}

/** Un globo de puntos parejos, con manchas de color como continentes y un brillo blanco. */
function esfera(n: number, d: Float32Array) {
  const luz: [number, number, number] = [-0.58, 0.5, 0.64];
  const dorado = Math.PI * (3 - Math.sqrt(5));
  // El orden se baraja para que, al cambiar de figura, cada punto venga de un lugar al azar
  const orden = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  for (let j = 0; j < n; j++) {
    const i = orden[j];
    // Red de Fibonacci: puntos repartidos parejo, como en el globo del video
    const y = 1 - ((j + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = j * dorado;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    // Más tierra al frente (donde se ve) que atrás
    const m = manchas(x * 1.7 + 3, y * 1.7, z * 1.7) + z * 0.18;
    const cerca = x * luz[0] + y * luz[1] + z * luz[2];
    if (cerca > 0.982 && m > 0.4) {
      poner(d, i, x, y, z, Math.random() < 0.7 ? BLANCO : ROSA, 1, 1.45, x, y, z);
    } else if (m > 0.42) {
      const c = Math.random();
      const col = c < 0.47 ? AMBAR : c < 0.82 ? VIOLETA : c < 0.98 ? VERDE : BLANCO;
      poner(d, i, x, y, z, col, 1, 1.3, x, y, z);
    } else {
      // Mar: puntitos tenues
      poner(d, i, x * 0.99, y * 0.99, z * 0.99, Math.random() < 0.5 ? VIOLETA : AMBAR, 0.28, 0.5, x, y, z);
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
      poner(d, i, x, y + 0.12, z, degradado([[0, AMBAR], [0.7, ROSA], [1, BLANCO]], (y - top) / 0.9), 1, 0.95, tx * Math.cos(f), ty * Math.cos(f), Math.sin(f));
      continue;
    }
    let x = 0;
    let y = 0;
    let z = 0;
    let n: [number, number, number] = [0, 0, 1];
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
        n = [0, 0, cara === "frente" ? 1 : -1];
        // El ojo de la llave queda vacío en el frente
        const ojo = Math.hypot(x, y + 0.4) < 0.12 || (Math.abs(x) < 0.05 && y < -0.4 && y > -0.74);
        if (cara === "frente" && ojo) continue;
      } else if (cara === "izq" || cara === "der") {
        x = cara === "der" ? W : -W;
        y = top - b * H;
        z = a * D;
        n = [cara === "der" ? 1 : -1, 0, 0];
      } else {
        x = a * W;
        y = cara === "arriba" ? top : top - H;
        z = (Math.random() * 2 - 1) * D;
        n = [0, cara === "arriba" ? 1 : -1, 0];
      }
      break;
    }
    const c = degradado([[0, VERDE], [0.45, AZUL], [1, VIOLETA]], (y - top + H) / H);
    poner(d, i, x, y + 0.12, z, Math.random() < 0.06 ? AMBAR : c, 1, 0.9, ...n);
  }
}

/** El logo de Atendel: cuatro esferas de polvo fino, una por agente, con un brillo blanco. */
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
    // Más denso hacia la orilla, con algo de relleno: se ve como una nube
    const r = 0.41 * (Math.random() < 0.7 ? 0.9 + Math.random() * 0.1 : Math.cbrt(Math.random()));
    const l = x * luz[0] + y * luz[1] + z * luz[2];
    const c = degradado([[0, mezcla(AGENTES[k], VIOLETA, 0.25)], [0.6, AGENTES[k]], [1, BLANCO]], (l + 1) / 2);
    poner(d, i, C[k][0] + x * r, C[k][1] + y * r, z * r, c, 0.8, 0.55, x, y, z);
  }
}

const COLORES_POLVO: Color[] = [AMBAR, AMBAR, VIOLETA, VIOLETA, VERDE, BLANCO, CORAL, LILA];
const colorPolvo = () => COLORES_POLVO[Math.floor(Math.random() * COLORES_POLVO.length)];

/** Polvo suave por toda la pantalla. */
function polvo(n: number, d: Float32Array) {
  for (let i = 0; i < n; i++) {
    poner(d, i, Math.random() * 2.2 - 1.1, Math.random() * 2.2 - 1.1, Math.random() * 2 - 1, colorPolvo(), Math.random() < 0.08 ? 0.25 + Math.random() * 0.3 : 0, 0.7);
  }
}

/** El globo deshecho en polvo: una nube que llena la parte de arriba de la pantalla (la sala del equipo). */
function polvoArriba(n: number, d: Float32Array) {
  for (let i = 0; i < n; i++) {
    const abajo = Math.random() < 0.12;
    const y = abajo ? Math.random() * 1.9 - 1 : 0.92 - 1.05 * Math.pow(Math.random(), 1.7);
    // Solo una parte se ve: el polvo de Dala es ralo
    const alfa = Math.random() < 0.1 ? (abajo ? 0.3 : 0.45 + Math.random() * 0.5) : 0;
    poner(d, i, Math.random() * 2.1 - 1.05, y, Math.random() * 2 - 1, colorPolvo(), alfa, 0.75 + Math.random() * 0.6);
  }
}

/** El polvo recargado a la izquierda y arriba (la sala de la lista con tetraedros). */
function polvoIzquierda(n: number, d: Float32Array) {
  for (let i = 0; i < n; i++) {
    // Recargado a la izquierda y arriba, y se va haciendo ralo hacia la derecha (sin orillas)
    const banda = Math.random() < 0.3;
    const x = banda ? Math.random() * 2.1 - 1.05 : -1.05 + 1.9 * Math.pow(Math.random(), 2.2);
    const y = banda ? 0.9 - 0.45 * Math.pow(Math.random(), 1.5) : 0.92 - 1.8 * Math.pow(Math.random(), 1.3);
    poner(d, i, x, y, Math.random() * 2 - 1, colorPolvo(), Math.random() < 0.1 ? 0.4 + Math.random() * 0.5 : 0, 0.75 + Math.random() * 0.6);
  }
}

const CONSTRUCTORES: Record<NombreForma, (n: number, d: Float32Array) => void> = {
  burbuja,
  esfera,
  candado,
  marca,
  polvo,
  polvoArriba,
  polvoIzquierda,
};

export function crearForma(nombre: NombreForma, n: number) {
  const d = new Float32Array(n * POR_PUNTO);
  CONSTRUCTORES[nombre](n, d);
  return d;
}
