"use client";

import { useEffect, useRef } from "react";
import { crearForma, esForma, POR_PUNTO, type NombreForma } from "./formas";

/**
 * El fondo vivo del sitio: una figura en 3D hecha de miles de triangulitos
 * de colores (una burbuja de chat, un globo, un candado, el logo…).
 * - Cada sección de la página dice qué figura va con ella y de qué lado:
 *   <section data-forma="esfera" data-lado="izquierda">. Al bajar, los
 *   triangulitos se sueltan y vuelan a formar la figura de la siguiente.
 * - Alrededor flotan triangulitos sueltos y unos tetraedros grandes.
 * - La figura gira despacio y se inclina un poco hacia el cursor.
 * - Con "reducir movimiento" no se anima: la figura cambia de golpe.
 * - Fuera de la pestaña no dibuja. Si el navegador no tiene WebGL, no hay fondo.
 */

type Lado = "izquierda" | "derecha" | "centro";

const VERT_FIGURA = `
attribute vec3 aPosA; attribute vec4 aColA; attribute float aTamA;
attribute vec3 aPosB; attribute vec4 aColB; attribute float aTamB;
attribute vec4 aAzar; attribute vec3 aDir;
uniform float uT, uTiempo, uDpr;
uniform vec2 uRes, uRotA, uRotB, uOffA, uOffB;
uniform float uEscA, uEscB, uAlfA, uAlfB;
varying vec3 vCol; varying float vAlfa, vTam, vAng;
vec3 rotar(vec3 p, vec2 r) {
  float cy = cos(r.x), sy = sin(r.x);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  float cx = cos(r.y), sx = sin(r.y);
  return vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
}
void main() {
  float e = clamp((uT - aAzar.x * 0.35) / 0.65, 0.0, 1.0);
  e = e * e * (3.0 - 2.0 * e);
  float f = aAzar.w * 6.2831;
  vec3 deriva = vec3(sin(uTiempo * 0.6 + f), cos(uTiempo * 0.5 + f * 1.3), sin(uTiempo * 0.4 + f * 0.7)) * 0.012;
  vec3 p = mix(rotar(aPosA, uRotA), rotar(aPosB, uRotB), e) + aDir * sin(3.14159 * e) * 0.9 + deriva;
  float esc = mix(uEscA, uEscB, e);
  float z = 3.2 - p.z;
  vec2 q = p.xy * (3.2 / z) * esc;
  vec2 px = uRes * 0.5 + mix(uOffA, uOffB, e) * uRes + vec2(q.x, -q.y);
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
  vec4 col = mix(aColA, aColB, e);
  float frente = smoothstep(0.3, 1.0, (p.z + 1.1) / 2.2);
  vCol = col.rgb;
  vAlfa = col.a * mix(0.1, 1.0, frente) * mix(uAlfA, uAlfB, e);
  float tam = (3.5 + 6.0 * aAzar.y) * mix(aTamA, aTamB, e) * (3.2 / z) * clamp(esc / 330.0, 0.5, 1.25);
  gl_PointSize = max(tam * uDpr, 1.0);
  vTam = gl_PointSize;
  vAng = aAzar.z * 6.2831 + uTiempo * (aAzar.y - 0.5) * 0.8;
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
  vAng = aC.w * 6.2831 + uTiempo * (aC.w - 0.5) * 0.5;
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

/** Dónde va la figura y de qué tamaño, según la pantalla. */
function colocar(forma: NombreForma, lado: Lado, w: number, h: number) {
  const celular = w < 900;
  if (forma === "polvo") return { off: [0, 0], esc: Math.min(w, h) * 0.5, alfa: 0.5 };
  if (celular) return { off: [0, -0.2], esc: Math.min(w * 0.4, h * 0.27) * (forma === "esfera" ? 1.1 : 1), alfa: lado === "centro" ? 0.45 : 0.75 };
  if (lado === "centro") return { off: [0, 0], esc: Math.min(w * 0.22, h * 0.36), alfa: 0.5 };
  // El globo va más grande y se sale un poco de la orilla, como un planeta
  if (forma === "esfera") return { off: [lado === "izquierda" ? -0.27 : 0.3, 0.04], esc: Math.min(w * 0.25, h * 0.44), alfa: 1 };
  const x = lado === "derecha" ? 0.25 : -0.25;
  return { off: [x, 0.02], esc: Math.min(w * 0.19, h * 0.36), alfa: 1 };
}

/** Cómo gira cada figura (vuelta completa el globo; las demás se mecen). */
function giro(forma: NombreForma, t: number): [number, number] {
  switch (forma) {
    case "esfera":
      return [t * 0.12, 0.38];
    case "burbuja":
      return [Math.sin(t * 0.25) * 0.5 - 0.15, 0.12 + Math.sin(t * 0.21) * 0.06];
    case "candado":
      return [Math.sin(t * 0.3) * 0.55, 0.16];
    case "marca":
      return [Math.sin(t * 0.2) * 0.45, Math.sin(t * 0.17) * 0.2];
    default:
      return [t * 0.02, 0];
  }
}

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

export function Escena() {
  const ref = useRef<HTMLCanvasElement>(null);
  const refLineas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const lienzo = refLineas.current;
    const ctx2 = lienzo?.getContext("2d");
    if (!canvas || !lienzo || !ctx2) return;
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
    const N = ancho0 < 700 ? 4500 : ancho0 < 1200 ? 7500 : 9500;
    const NP = ancho0 < 700 ? 140 : 320;

    // Una figura por buffer, creada la primera vez que se necesita
    const buffers = new Map<NombreForma, WebGLBuffer>();
    const buffer = (forma: NombreForma) => {
      let b = buffers.get(forma);
      if (!b) {
        b = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, crearForma(forma, N), gl.STATIC_DRAW);
        buffers.set(forma, b);
      }
      return b;
    };

    // Lo que cada punto tiene de propio: retraso al volar, tamaño, giro y hacia dónde se dispersa
    const azar = new Float32Array(N * 7);
    for (let i = 0; i < N; i++) {
      azar.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 7);
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u) * (0.4 + Math.random() * 0.8);
      azar.set([r * Math.cos(a), u * 0.6, r * Math.sin(a)], i * 7 + 4);
    }
    const bufAzar = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, bufAzar);
    gl.bufferData(gl.ARRAY_BUFFER, azar, gl.STATIC_DRAW);

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
      const tam = grande ? 12 + Math.random() * 8 : 4 + prof * 6 + Math.random() * 2;
      const c = COLORES_POLVO[Math.floor(Math.random() * COLORES_POLVO.length)];
      polvo.set([Math.random(), Math.random(), prof, tam, c[0], c[1], c[2], Math.random()], i * 8);
    }
    const bufPolvo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, bufPolvo);
    gl.bufferData(gl.ARRAY_BUFFER, polvo, gl.STATIC_DRAW);

    const at = (p: WebGLProgram, n: string) => gl.getAttribLocation(p, n);
    const un = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const A = {
      posA: at(progFigura, "aPosA"),
      colA: at(progFigura, "aColA"),
      tamA: at(progFigura, "aTamA"),
      posB: at(progFigura, "aPosB"),
      colB: at(progFigura, "aColB"),
      tamB: at(progFigura, "aTamB"),
      azar: at(progFigura, "aAzar"),
      dir: at(progFigura, "aDir"),
      p: at(progPolvo, "aP"),
      c: at(progPolvo, "aC"),
    };
    const U = Object.fromEntries(
      ["uT", "uTiempo", "uDpr", "uRes", "uRotA", "uRotB", "uOffA", "uOffB", "uEscA", "uEscB", "uAlfA", "uAlfB", "uClaro"].map((n) => [n, un(progFigura, n)]),
    );
    const UP = Object.fromEntries(["uRes", "uTiempo", "uScroll", "uDpr", "uAlfa", "uClaro"].map((n) => [n, un(progPolvo, n)]));

    const atarFigura = (loc: { pos: number; col: number; tam: number }, forma: NombreForma) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer(forma));
      const paso = POR_PUNTO * 4;
      gl.enableVertexAttribArray(loc.pos);
      gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, paso, 0);
      gl.enableVertexAttribArray(loc.col);
      gl.vertexAttribPointer(loc.col, 4, gl.FLOAT, false, paso, 12);
      gl.enableVertexAttribArray(loc.tam);
      gl.vertexAttribPointer(loc.tam, 1, gl.FLOAT, false, paso, 28);
    };

    // Tetraedros grandes que flotan
    const tetras = Array.from({ length: ancho0 < 700 ? 4 : 7 }, (_, i) => ({
      x: (i + 0.5) / (ancho0 < 700 ? 4 : 7) + (Math.random() - 0.5) * 0.1,
      y: Math.random(),
      prof: Math.random(),
      tam: 16 + Math.random() * 22,
      color: ["#ffb829", "#8052ff", "#2fd6a8", "#e8e4ff", "#ffb829", "#8052ff", "#2fd6a8"][i],
      giro: [Math.random() * 6, Math.random() * 6],
      vel: [(Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.4],
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

    // Las secciones con figura
    let secciones: HTMLElement[] = [];
    const buscar = () => {
      secciones = Array.from(document.querySelectorAll<HTMLElement>("[data-forma]"));
    };
    buscar();
    const mo = new MutationObserver(buscar);
    mo.observe(document.body, { childList: true, subtree: true });

    let claro = document.documentElement.dataset.tema === "claro";
    const moTema = new MutationObserver(() => {
      claro = document.documentElement.dataset.tema === "claro";
      if (quieto) dibujar(0);
    });
    moTema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });

    // Inclinación hacia el cursor
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    const alMover = (e: PointerEvent) => {
      mouse.x = (e.clientX / w) * 2 - 1;
      mouse.y = (e.clientY / h) * 2 - 1;
    };

    /** Qué dos figuras se ven ahora y cuánto va de una a otra. */
    const estado = () => {
      let fondo = 0;
      const info = secciones.map((el) => {
        const r = el.getBoundingClientRect();
        fondo = r.bottom;
        const forma = esForma(el.dataset.forma) ? el.dataset.forma : "polvo";
        return { forma, lado: (el.dataset.lado as Lado) || "derecha", c: r.top + r.height / 2 - h / 2 };
      });
      // Después de la última figura, la página sigue con polvo
      const ultima = info[info.length - 1];
      if (ultima && ultima.forma !== "polvo") info.push({ forma: "polvo", lado: "centro", c: fondo - h / 2 + h * 0.6 });
      if (!info.length) return { a: { forma: "polvo" as NombreForma, lado: "centro" as Lado }, b: { forma: "polvo" as NombreForma, lado: "centro" as Lado }, t: 0 };
      let i = -1;
      for (let k = 0; k < info.length; k++) if (info[k].c <= 0) i = k;
      if (i < 0) return { a: info[0], b: info[0], t: 0 };
      if (i >= info.length - 1) return { a: info[i], b: info[i], t: 0 };
      let t = -info[i].c / (info[i + 1].c - info[i].c);
      t = Math.min(1, Math.max(0, (t - 0.15) / 0.7));
      if (quieto) t = t < 0.5 ? 0 : 1;
      return { a: info[i], b: info[i + 1], t };
    };

    const dibujar = (ms: number) => {
      const tiempo = quieto ? 0 : ms / 1000;
      mouse.sx += (mouse.x - mouse.sx) * 0.04;
      mouse.sy += (mouse.y - mouse.sy) * 0.04;
      const { a, b, t } = estado();

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
      atarFigura({ pos: A.posA, col: A.colA, tam: A.tamA }, a.forma);
      atarFigura({ pos: A.posB, col: A.colB, tam: A.tamB }, b.forma);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufAzar);
      gl.enableVertexAttribArray(A.azar);
      gl.vertexAttribPointer(A.azar, 4, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(A.dir);
      gl.vertexAttribPointer(A.dir, 3, gl.FLOAT, false, 28, 16);
      const ca = colocar(a.forma, a.lado, w, h);
      const cb = colocar(b.forma, b.lado, w, h);
      const ra = giro(a.forma, tiempo);
      const rb = giro(b.forma, tiempo);
      const ix = quieto ? 0 : mouse.sx * 0.3;
      const iy = quieto ? 0 : mouse.sy * 0.15;
      gl.uniform1f(U.uT, t);
      gl.uniform1f(U.uTiempo, tiempo);
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform2f(U.uRes, w, h);
      gl.uniform2f(U.uRotA, ra[0] + ix, ra[1] + iy);
      gl.uniform2f(U.uRotB, rb[0] + ix, rb[1] + iy);
      gl.uniform2f(U.uOffA, ca.off[0], ca.off[1]);
      gl.uniform2f(U.uOffB, cb.off[0], cb.off[1]);
      gl.uniform1f(U.uEscA, ca.esc);
      gl.uniform1f(U.uEscB, cb.esc);
      gl.uniform1f(U.uAlfA, ca.alfa * (claro ? 0.9 : 1));
      gl.uniform1f(U.uAlfB, cb.alfa * (claro ? 0.9 : 1));
      gl.uniform1f(U.uClaro, claro ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, N);

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
        for (const [p, q] of ARISTAS) {
          ctx2.moveTo(pts[p][0], pts[p][1]);
          ctx2.lineTo(pts[q][0], pts[q][1]);
        }
        ctx2.stroke();
      }
      ctx2.globalAlpha = 1;
    };

    let raf = 0;
    let corriendo = false;
    const cuadro = (ms: number) => {
      dibujar(ms);
      raf = requestAnimationFrame(cuadro);
    };
    const iniciar = () => {
      if (corriendo) return;
      corriendo = true;
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
      for (const b of buffers.values()) gl.deleteBuffer(b);
      gl.deleteBuffer(bufAzar);
      gl.deleteBuffer(bufPolvo);
      gl.deleteProgram(progFigura);
      gl.deleteProgram(progPolvo);
    };
  }, []);

  return (
    <div className="escena" aria-hidden="true">
      <canvas ref={ref} />
      <canvas ref={refLineas} />
    </div>
  );
}
