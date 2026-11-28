/**
 * Una ASTILLA (fragmento de verdad, no un triangulito de juguete), para los lienzos 2D: un
 * tetraedro irregular —cada vértice a otra distancia, estirado y aplanado como un pedazo de
 * vidrio roto— que gira en 3D. Se dibuja con sus caras rellenas (cada cara con su propia luz,
 * según hacia dónde mira) y sus aristas encima.
 * La usan los fragmentos grandes que flotan (motor.ts) y los asteroides del río (FlujoInfo).
 * El polvo del fondo hace lo mismo dentro del shader de motor.ts.
 */
export type Astilla = number[][];

const BASE = [
  [0, 1, 0],
  [0.943, -0.333, 0],
  [-0.471, -0.333, 0.816],
  [-0.471, -0.333, -0.816],
];
const CARAS = [
  [0, 1, 2],
  [0, 2, 3],
  [0, 3, 1],
  [1, 3, 2],
];
const ARISTAS = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [2, 3],
  [3, 1],
];
// Luz que viene de arriba a la izquierda y de frente
const LUZ = (() => {
  const v = [-0.35, 0.55, 0.76];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((x) => x / l);
})();

/** Una forma de astilla al azar (con `r`, un azar de 0 a 1). */
export function crearAstilla(r: () => number): Astilla {
  const estira = 0.8 + r() * 0.55;
  const plano = 0.4 + r() * 0.45;
  return BASE.map(([x, y, z]) => {
    const k = 0.62 + r() * 0.6;
    return [x * k, y * k * estira, z * k * plano];
  });
}

/**
 * Dibuja la astilla en (x, y) con tamaño `tam` (px) y giros `ay`, `ax`, `az`.
 * `alfaCaras` y `alfaAristas` multiplican el globalAlpha que ya tenga el contexto; `resplandor`
 * (px) es un brillo solo en las aristas.
 */
export function dibujarAstilla(
  ctx: CanvasRenderingContext2D,
  forma: Astilla,
  x: number,
  y: number,
  tam: number,
  ay: number,
  ax: number,
  az: number,
  color: string,
  alfaCaras: number,
  alfaAristas: number,
  ancho: number,
  resplandor = 0,
) {
  const cy = Math.cos(ay);
  const sy = Math.sin(ay);
  const cx = Math.cos(ax);
  const sx = Math.sin(ax);
  const cz = Math.cos(az);
  const sz = Math.sin(az);
  const P = forma.map(([vx, vy, vz]) => {
    const x1 = cy * vx + sy * vz;
    const z1 = -sy * vx + cy * vz;
    const y1 = cx * vy - sx * z1;
    const z2 = sx * vy + cx * z1;
    const x2 = cz * x1 - sz * y1;
    const y2 = sz * x1 + cz * y1;
    return [x2, y2, z2];
  });
  const base = ctx.globalAlpha;
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  // Caras de atrás hacia adelante, cada una con su luz
  const caras = CARAS.map(([a, b, c]) => {
    const A = P[a];
    const B = P[b];
    const C = P[c];
    const ux = B[0] - A[0];
    const uy = B[1] - A[1];
    const uz = B[2] - A[2];
    const vx = C[0] - A[0];
    const vy = C[1] - A[1];
    const vz = C[2] - A[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    const luz = 0.2 + 0.8 * Math.abs((nx * LUZ[0] + ny * LUZ[1] + nz * LUZ[2]) / l);
    return { a, b, c, luz, z: A[2] + B[2] + C[2] };
  }).sort((p, q) => p.z - q.z);
  for (const f of caras) {
    ctx.globalAlpha = base * alfaCaras * f.luz;
    ctx.beginPath();
    ctx.moveTo(x + P[f.a][0] * tam, y - P[f.a][1] * tam);
    ctx.lineTo(x + P[f.b][0] * tam, y - P[f.b][1] * tam);
    ctx.lineTo(x + P[f.c][0] * tam, y - P[f.c][1] * tam);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = base * alfaAristas;
  ctx.lineWidth = ancho;
  if (resplandor > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = resplandor;
  }
  ctx.beginPath();
  for (const [a, b] of ARISTAS) {
    ctx.moveTo(x + P[a][0] * tam, y - P[a][1] * tam);
    ctx.lineTo(x + P[b][0] * tam, y - P[b][1] * tam);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = base;
}
