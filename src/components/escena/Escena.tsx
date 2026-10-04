"use client";

import { useEffect, useRef } from "react";
import { crearForma, POR_PUNTO, type NombreForma } from "./formas";
import { colocar, esEscena, type NombreEscena } from "./escenas";

/**
 * El fondo vivo del sitio (como el de Dala): una figura en 3D hecha de miles
 * de triangulitos de colores.
 * - Cada sección dice qué escena lleva: <section data-escena="globo">.
 * - Mientras lees una sección, su figura se queda QUIETA (apenas gira).
 * - Cuando la siguiente sección entra a la pantalla, los triangulitos se
 *   sueltan, flotan como polvo y vuelan a formar la figura nueva. Cada uno
 *   es un resorte suave: arranca despacio, acelera y frena sin rebotar.
 * - Alrededor flotan triangulitos sueltos y unos tetraedros grandes.
 * - Con "reducir movimiento" la figura cambia sin animación.
 * - Fuera de la pestaña no dibuja. Si el navegador no tiene WebGL, no hay fondo.
 */

/** La escena cambia cuando la siguiente sección pasa esta línea (fracción de la pantalla desde arriba). */
const LINEA_CAMBIO = 0.85;

const VERT_FIGURA = `
attribute vec2 aPos; attribute float aProf; attribute vec4 aCol; attribute float aTam;
attribute vec2 aAzar;
uniform vec2 uRes; uniform float uTiempo, uDpr, uCam;
varying vec3 vCol; varying float vAlfa, vTam, vAng;
void main() {
  float f = uCam / (uCam - aProf);
  vec2 px = uRes * 0.5 + aPos * f;
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
  vCol = aCol.rgb;
  vAlfa = aCol.a;
  gl_PointSize = max(aTam * f * uDpr, 1.0);
  vTam = gl_PointSize;
  vAng = aAzar.x * 6.2831 + uTiempo * aAzar.y;
}`;

const VERT_POLVO = `
attribute vec4 aP; attribute vec4 aC;
uniform vec2 uRes; uniform float uTiempo, uScroll, uDpr, uAlfa;
varying vec3 vCol; varying float vAlfa, vTam, vAng;
void main() {
  float prof = aP.z;
  float y = fract(aP.y - uScroll * (0.08 + 0.4 * prof) / (uRes.y * 1.2)) * 1.2 - 0.1;
  vec2 pos = vec2(aP.x + sin(uTiempo * 0.15 + aC.w * 6.28) * 0.012, y + cos(uTiempo * 0.12 + aC.w * 4.0) * 0.01);
  gl_Position = vec4(pos.x * 2.0 - 1.0, 1.0 - pos.y * 2.0, 0.0, 1.0);
  vCol = aC.rgb;
  vAlfa = (0.12 + 0.5 * prof * prof) * uAlfa;
  gl_PointSize = aP.w * uDpr;
  vTam = gl_PointSize;
  vAng = aC.w * 6.2831 + uTiempo * (aC.w - 0.5) * 0.4;
}`;

const FRAG = `
precision mediump float;
varying vec3 vCol; varying float vAlfa, vTam, vAng;
uniform float uClaro;
float tri(vec2 p) {
  const float k = 1.7320508;
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0 / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0, 0.0);
  return -length(p) * sign(p.y);
}
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float c = cos(vAng), s = sin(vAng);
  p = mat2(c, -s, s, c) * p;
  float d = tri(p * 1.75);
  float px = 3.5 / max(vTam, 1.0);
  float a = 1.0 - smoothstep(px * 0.6, px * 1.6, abs(d));
  a *= vAlfa;
  if (a < 0.01) discard;
  // En modo claro: colores más oscuros y lo blanco se vuelve violeta (si no, no se vería)
  float blanco = smoothstep(0.6, 0.9, min(min(vCol.r, vCol.g), vCol.b));
  vec3 col = mix(vCol, mix(vCol * 0.62, vec3(0.42, 0.26, 0.85), blanco), uClaro);
  gl_FragColor = vec4(col * a, a);
}`;

/* Los tetraedros grandes (dibujados aparte, con líneas más gruesas) */
const VERTICES_TETRA = [
  [0, 1, 0],
  [0.943, -0.333, 0],
  [-0.471, -0.333, 0.816],
  [-0.471, -0.333, -0.816],
];
const ARISTAS = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [2, 3],
  [3, 1],
];

const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function Escena() {
  const ref = useRef<HTMLCanvasElement>(null);
  const refLineas = useRef<HTMLCanvasElement>(null);
  const refCaja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const lienzo = refLineas.current;
    const caja = refCaja.current;
    const ctx2 = lienzo?.getContext("2d");
    if (!canvas || !lienzo || !caja || !ctx2) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const compilar = (vert: string) => {
      const p = gl.createProgram()!;
      for (const [tipo, src] of [
        [gl.VERTEX_SHADER, vert],
        [gl.FRAGMENT_SHADER, FRAG],
      ] as const) {
        const s = gl.createShader(tipo)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        gl.attachShader(p, s);
      }
      gl.linkProgram(p);
      return p;
    };
    const progFigura = compilar(VERT_FIGURA);
    const progPolvo = compilar(VERT_POLVO);
    if (!gl.getProgramParameter(progFigura, gl.LINK_STATUS) || !gl.getProgramParameter(progPolvo, gl.LINK_STATUS)) return;

    const ancho0 = window.innerWidth;
    const N = ancho0 < 700 ? 6000 : ancho0 < 1200 ? 9000 : 12000;
    const NP = ancho0 < 700 ? 120 : 260;

    // Las figuras, creadas la primera vez que se necesitan
    const formas = new Map<NombreForma, Float32Array>();
    const forma = (nombre: NombreForma) => {
      let f = formas.get(nombre);
      if (!f) {
        f = crearForma(nombre, N);
        formas.set(nombre, f);
      }
      return f;
    };

    // Estado de cada triangulito: dónde está, a qué velocidad va, su color, opacidad y tamaño
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const alfa = new Float32Array(N);
    const tam = new Float32Array(N);
    // Lo propio de cada uno: qué tan rápido llega (resorte), su fase y su tamaño
    const rigidez = new Float32Array(N);
    const fase = new Float32Array(N);
    const tamBase = new Float32Array(N);
    const estatico = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      rigidez[i] = 7 + Math.random() * 13;
      fase[i] = Math.random() * Math.PI * 2;
      tamBase[i] = 3.2 + Math.random() * 5.5;
      estatico[i * 2] = Math.random();
      estatico[i * 2 + 1] = (Math.random() - 0.5) * 0.5;
    }
    const datos = new Float32Array(N * 8);

    const bufDatos = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, bufDatos);
    gl.bufferData(gl.ARRAY_BUFFER, datos.byteLength, gl.DYNAMIC_DRAW);
    const bufEstatico = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, bufEstatico);
    gl.bufferData(gl.ARRAY_BUFFER, estatico, gl.STATIC_DRAW);

    // El polvo de fondo: posición en pantalla (0 a 1), profundidad, tamaño, color y fase
    const COLORES_POLVO = [
      [1, 0.72, 0.16],
      [0.5, 0.32, 1],
      [0.18, 0.84, 0.66],
      [1, 1, 1],
      [1, 0.54, 0.42],
    ];
    const polvo = new Float32Array(NP * 8);
    for (let i = 0; i < NP; i++) {
      const prof = Math.random();
      const grande = Math.random() < 0.05;
      const t = grande ? 12 + Math.random() * 8 : 4 + prof * 6 + Math.random() * 2;
      const c = COLORES_POLVO[Math.floor(Math.random() * COLORES_POLVO.length)];
      polvo.set([Math.random(), Math.random(), prof, t, c[0], c[1], c[2], Math.random()], i * 8);
    }
    const bufPolvo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, bufPolvo);
    gl.bufferData(gl.ARRAY_BUFFER, polvo, gl.STATIC_DRAW);

    const at = (p: WebGLProgram, n: string) => gl.getAttribLocation(p, n);
    const un = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const A = {
      pos: at(progFigura, "aPos"),
      prof: at(progFigura, "aProf"),
      col: at(progFigura, "aCol"),
      tam: at(progFigura, "aTam"),
      azar: at(progFigura, "aAzar"),
      p: at(progPolvo, "aP"),
      c: at(progPolvo, "aC"),
    };
    const U = Object.fromEntries(["uRes", "uTiempo", "uDpr", "uCam", "uClaro"].map((n) => [n, un(progFigura, n)]));
    const UP = Object.fromEntries(["uRes", "uTiempo", "uScroll", "uDpr", "uAlfa", "uClaro"].map((n) => [n, un(progPolvo, n)]));

    // Tetraedros grandes que flotan
    const cuantos = ancho0 < 700 ? 4 : 7;
    const tetras = Array.from({ length: cuantos }, (_, i) => ({
      x: (i + 0.5) / cuantos + (Math.random() - 0.5) * 0.1,
      y: Math.random(),
      prof: Math.random(),
      tam: 16 + Math.random() * 22,
      color: ["#ffb829", "#d9d4e8", "#8052ff", "#ffb829", "#2fd6a8", "#d9d4e8", "#8052ff"][i],
      giro: [Math.random() * 6, Math.random() * 6],
      vel: [(Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.3],
    }));

    let w = 0;
    let h = 0;
    let dpr = 1;
    const medir = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 1.75);
      for (const c of [canvas, lienzo]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    medir();

    // Las secciones con escena
    let secciones: HTMLElement[] = [];
    const buscar = () => {
      secciones = Array.from(document.querySelectorAll<HTMLElement>("[data-escena]"));
    };
    buscar();
    const mo = new MutationObserver(buscar);
    mo.observe(document.body, { childList: true, subtree: true });

    let claro = document.documentElement.dataset.tema === "claro";

    /** La escena que toca según dónde va la página. */
    const escenaActual = (): NombreEscena => {
      let actual: NombreEscena | null = null;
      let fondo = Infinity;
      for (const el of secciones) {
        const nombre = el.dataset.escena;
        if (!esEscena(nombre)) continue;
        const r = el.getBoundingClientRect();
        // La primera figura ya se ve si su sección empieza arriba de la página
        if (r.top < h * LINEA_CAMBIO || (actual === null && r.top < h * 0.5)) {
          actual = nombre;
          fondo = r.bottom;
        }
      }
      if (actual === null) return "polvo";
      // Después de la última figura, la página sigue con polvo
      if (fondo < h * 0.35) return "polvo";
      return actual;
    };

    // Inclinación hacia el cursor (muy poca)
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    const alMover = (e: PointerEvent) => {
      mouse.x = (e.clientX / w) * 2 - 1;
      mouse.y = (e.clientY / h) * 2 - 1;
    };

    let activa: NombreEscena = escenaActual();
    let agitacion = 0;
    let primera = true;
    let antes = 0;

    /** Avanza a cada triangulito hacia su lugar en la figura de la escena activa. */
    const avanzar = (tiempo: number, dt: number, saltar: boolean) => {
      const C = colocar(activa, w, h);
      const F = forma(C.forma);
      let [yaw, pitch] = C.giro(tiempo);
      const roll = C.giro(tiempo)[2];
      if (C.modo === "objeto" && !quieto) {
        yaw += mouse.sx * 0.12;
        pitch += mouse.sy * 0.07;
      }
      // Matriz de giro: de lado (z), hacia los lados (y) y hacia adelante (x)
      const cz = Math.cos(roll);
      const sz = Math.sin(roll);
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cx = Math.cos(pitch);
      const sx = Math.sin(pitch);
      const ox = (C.cx - 0.5) * w;
      const oy = (C.cy - 0.5) * h;
      const S = C.escala;
      const factorTam = C.modo === "objeto" ? Math.min(1.3, Math.max(0.55, S / 330)) : Math.min(1.1, Math.max(0.7, w / 1400));
      const kColor = saltar ? 1 : 1 - Math.exp(-dt * 3.2);
      const fuerza = agitacion * 560;
      const pasos = Math.max(1, Math.min(5, Math.round(dt * 60)));
      const h1 = dt / pasos;

      for (let i = 0; i < N; i++) {
        const o = i * POR_PUNTO;
        const lx = F[o];
        const ly = F[o + 1];
        const lz = F[o + 2];
        let tx: number;
        let ty: number;
        let tz: number;
        let visible = 1;
        if (C.modo === "objeto") {
          // Girar
          const x1 = lx * cz - ly * sz;
          const y1 = lx * sz + ly * cz;
          const x2 = x1 * cy + lz * sy;
          const z2 = -x1 * sy + lz * cy;
          const y3 = y1 * cx - z2 * sx;
          const z3 = y1 * sx + z2 * cx;
          tx = ox + x2 * S;
          ty = oy - y3 * S;
          tz = z3 * S;
          // Lo de atrás se apaga (el globo se ve sólido)
          if (C.ocultarAtras > 0) visible = 1 - C.ocultarAtras * (1 - suave(-0.35, 0.3, z3));
          // En el globo, la orilla se apaga un poco (si no, se ve un anillo muy brillante)
          if (C.ocultarAtras >= 1) visible *= 0.5 + 0.5 * suave(0, 0.55, z3);
          // Respira apenas: casi quieta
          if (!quieto) {
            tx += Math.sin(tiempo * 0.7 + fase[i]) * 0.6;
            ty += Math.cos(tiempo * 0.6 + fase[i] * 1.3) * 0.6;
          }
        } else {
          tx = lx * w * 0.5;
          ty = -ly * h * 0.5;
          tz = lz * h * 0.25;
          if (!quieto) {
            tx += Math.sin(tiempo * 0.12 + fase[i]) * 14;
            ty += Math.cos(tiempo * 0.1 + fase[i] * 1.7) * 10;
          }
        }

        const p = i * 3;
        if (saltar) {
          pos[p] = tx;
          pos[p + 1] = ty;
          pos[p + 2] = tz;
          vel[p] = vel[p + 1] = vel[p + 2] = 0;
        } else {
          // Resorte con amortiguación crítica: llega suave, sin rebotar
          const k = rigidez[i];
          const amort = 2 * Math.sqrt(k);
          let fx = 0;
          let fy = 0;
          let fz = 0;
          if (fuerza > 1) {
            // Mientras cambia de figura, una corriente suave revuelve el polvo
            const px = pos[p];
            const py = pos[p + 1];
            const pz = pos[p + 2];
            fx = (Math.sin(py * 0.0085 + tiempo * 1.1 + fase[i]) + Math.sin(pz * 0.011 - tiempo * 0.8)) * fuerza;
            fy = (Math.sin(pz * 0.0095 + tiempo * 0.9) + Math.sin(px * 0.0075 + tiempo * 1.3 + fase[i])) * fuerza;
            fz = (Math.sin(px * 0.009 - tiempo) + Math.sin(py * 0.012 + tiempo * 0.8)) * fuerza;
          }
          // En pasos de 1/60 s: se mueve igual de suave aunque la computadora dibuje menos cuadros
          for (let paso = 0; paso < pasos; paso++) {
            vel[p] += ((tx - pos[p]) * k - vel[p] * amort + fx) * h1;
            vel[p + 1] += ((ty - pos[p + 1]) * k - vel[p + 1] * amort + fy) * h1;
            vel[p + 2] += ((tz - pos[p + 2]) * k - vel[p + 2] * amort + fz) * h1;
            pos[p] += vel[p] * h1;
            pos[p + 1] += vel[p + 1] * h1;
            pos[p + 2] += vel[p + 2] * h1;
          }
        }
        col[p] += (F[o + 3] - col[p]) * kColor;
        col[p + 1] += (F[o + 4] - col[p + 1]) * kColor;
        col[p + 2] += (F[o + 5] - col[p + 2]) * kColor;
        alfa[i] += (F[o + 6] * C.alfa * visible - alfa[i]) * kColor;
        tam[i] += (tamBase[i] * F[o + 7] * C.tam * factorTam - tam[i]) * kColor;

        const d = i * 8;
        datos[d] = pos[p];
        datos[d + 1] = pos[p + 1];
        datos[d + 2] = pos[p + 2];
        datos[d + 3] = col[p];
        datos[d + 4] = col[p + 1];
        datos[d + 5] = col[p + 2];
        datos[d + 6] = alfa[i];
        datos[d + 7] = tam[i];
      }
    };

    const dibujar = (ms: number) => {
      const tiempo = quieto ? 0 : ms / 1000;
      const dt = antes ? Math.min(1 / 12, Math.max(0, (ms - antes) / 1000)) : 1 / 60;
      antes = ms;
      mouse.sx += (mouse.x - mouse.sx) * 0.03;
      mouse.sy += (mouse.y - mouse.sy) * 0.03;

      const nueva = escenaActual();
      if (nueva !== activa) {
        activa = nueva;
        agitacion = 1;
      }
      agitacion *= Math.exp(-dt / 0.7);
      caja.dataset.escenaActiva = activa;

      if (primera) {
        // Al abrir la página: los triangulitos llegan de una nube suave y forman la figura
        avanzar(tiempo, dt, true);
        if (!quieto) {
          for (let i = 0; i < N; i++) {
            pos[i * 3] += (Math.random() - 0.5) * w * 0.12;
            pos[i * 3 + 1] += (Math.random() - 0.5) * h * 0.12;
            pos[i * 3 + 2] += (Math.random() - 0.5) * 120;
            alfa[i] = 0;
          }
          agitacion = 0.25;
        }
        primera = false;
      }
      avanzar(tiempo, dt, quieto);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      // Oscuro: los colores se suman y brillan. Claro: se pintan encima.
      if (claro) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      else gl.blendFunc(gl.ONE, gl.ONE);

      // Polvo de fondo
      gl.useProgram(progPolvo);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufPolvo);
      gl.enableVertexAttribArray(A.p);
      gl.vertexAttribPointer(A.p, 4, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(A.c);
      gl.vertexAttribPointer(A.c, 4, gl.FLOAT, false, 32, 16);
      gl.uniform2f(UP.uRes, w, h);
      gl.uniform1f(UP.uTiempo, tiempo);
      gl.uniform1f(UP.uScroll, window.scrollY);
      gl.uniform1f(UP.uDpr, dpr);
      gl.uniform1f(UP.uAlfa, claro ? 0.7 : 1);
      gl.uniform1f(UP.uClaro, claro ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, NP);
      gl.disableVertexAttribArray(A.p);
      gl.disableVertexAttribArray(A.c);

      // La figura
      gl.useProgram(progFigura);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufDatos);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, datos);
      gl.enableVertexAttribArray(A.pos);
      gl.vertexAttribPointer(A.pos, 2, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(A.prof);
      gl.vertexAttribPointer(A.prof, 1, gl.FLOAT, false, 32, 8);
      gl.enableVertexAttribArray(A.col);
      gl.vertexAttribPointer(A.col, 4, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(A.tam);
      gl.vertexAttribPointer(A.tam, 1, gl.FLOAT, false, 32, 28);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufEstatico);
      gl.enableVertexAttribArray(A.azar);
      gl.vertexAttribPointer(A.azar, 2, gl.FLOAT, false, 8, 0);
      gl.uniform2f(U.uRes, w, h);
      gl.uniform1f(U.uTiempo, tiempo);
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform1f(U.uCam, Math.max(h, 600) * 3);
      gl.uniform1f(U.uClaro, claro ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, N);
      for (const l of [A.pos, A.prof, A.col, A.tam, A.azar]) gl.disableVertexAttribArray(l);

      // Tetraedros grandes
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2.clearRect(0, 0, w, h);
      ctx2.lineWidth = 1.5;
      ctx2.lineJoin = "round";
      for (const te of tetras) {
        const y = ((((te.y - (window.scrollY * (0.1 + 0.3 * te.prof)) / (h * 1.3)) % 1) + 1) % 1) * 1.3 - 0.15;
        const cx = te.x * w + Math.sin(tiempo * 0.2 + te.giro[0]) * 12;
        const cy = y * h + Math.cos(tiempo * 0.17 + te.giro[1]) * 10;
        const ay = te.giro[0] + tiempo * te.vel[0];
        const ax = te.giro[1] + tiempo * te.vel[1];
        const pts = VERTICES_TETRA.map(([x, yy, z]) => {
          const x1 = Math.cos(ay) * x + Math.sin(ay) * z;
          const z1 = -Math.sin(ay) * x + Math.cos(ay) * z;
          const y1 = Math.cos(ax) * yy - Math.sin(ax) * z1;
          return [cx + x1 * te.tam, cy - y1 * te.tam];
        });
        ctx2.globalAlpha = (0.35 + 0.5 * te.prof) * (claro ? 0.6 : 1);
        ctx2.strokeStyle = te.color;
        ctx2.shadowColor = claro ? "transparent" : te.color;
        ctx2.shadowBlur = claro ? 0 : 10;
        ctx2.beginPath();
        for (const [a, b] of ARISTAS) {
          ctx2.moveTo(pts[a][0], pts[a][1]);
          ctx2.lineTo(pts[b][0], pts[b][1]);
        }
        ctx2.stroke();
      }
      ctx2.globalAlpha = 1;
    };

    const moTema = new MutationObserver(() => {
      claro = document.documentElement.dataset.tema === "claro";
      if (quieto) dibujar(0);
    });
    moTema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });

    let raf = 0;
    let corriendo = false;
    const cuadro = (ms: number) => {
      dibujar(ms);
      raf = requestAnimationFrame(cuadro);
    };
    const iniciar = () => {
      if (corriendo) return;
      corriendo = true;
      antes = 0;
      raf = requestAnimationFrame(cuadro);
    };
    const detener = () => {
      corriendo = false;
      cancelAnimationFrame(raf);
    };
    const alVisibilidad = () => (document.hidden ? detener() : iniciar());
    const alRedimensionar = () => {
      medir();
      if (quieto) dibujar(0);
    };
    // Con movimiento reducido solo se redibuja al bajar o cambiar de tamaño
    const alBajar = () => dibujar(0);

    window.addEventListener("resize", alRedimensionar);
    if (quieto) {
      window.addEventListener("scroll", alBajar, { passive: true });
      dibujar(0);
    } else {
      window.addEventListener("pointermove", alMover, { passive: true });
      document.addEventListener("visibilitychange", alVisibilidad);
      iniciar();
    }
    canvas.dataset.lista = "true";

    return () => {
      detener();
      mo.disconnect();
      moTema.disconnect();
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("pointermove", alMover);
      document.removeEventListener("visibilitychange", alVisibilidad);
      gl.deleteBuffer(bufDatos);
      gl.deleteBuffer(bufEstatico);
      gl.deleteBuffer(bufPolvo);
      gl.deleteProgram(progFigura);
      gl.deleteProgram(progPolvo);
    };
  }, []);

  return (
    <div ref={refCaja} className="escena" aria-hidden="true">
      <canvas ref={ref} />
      <canvas ref={refLineas} />
    </div>
  );
}
