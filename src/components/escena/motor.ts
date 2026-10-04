import gsap from "gsap";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { crearForma, POR_PUNTO, type NombreForma } from "./formas";
import { colocar, type Colocacion, type NombreEscena } from "./escenas";

/**
 * El motor de la escena de fondo, con Three.js (como recomiendan las skills
 * threejs-webgl y web3d-integration-patterns para partículas con scroll):
 * - Miles de triangulitos (THREE.Points con un shader propio).
 * - Brillo suave alrededor de lo más luminoso (UnrealBloomPass), solo en modo oscuro.
 * - Profundidad de campo: lo que está muy cerca o muy lejos se ve desenfocado.
 * - Luz: cada figura se ilumina desde arriba a la izquierda y brilla en la orilla,
 *   así se ve su volumen en 3D.
 * - Transiciones coreografiadas (GSAP): al cambiar de escena, la figura se
 *   abre como una explosión suave, los triangulitos viajan en curvas, en ola
 *   (salen primero los que están del lado hacia donde van) y la cámara se
 *   desenfoca y vuelve a enfocar cuando la nueva figura se arma.
 * - Quieta mientras lees: ya formada, la figura solo respira y gira muy despacio.
 */

export type Motor = {
  ir: (escena: NombreEscena) => void;
  dibujarUnaVez: () => void;
  tema: (claro: boolean) => void;
  destruir: () => void;
};

const VERT_FIGURA = /* glsl */ `
attribute vec4 aColor;
attribute float aTam;
attribute vec2 aAzar;
uniform float uDpr, uTiempo, uCam, uFoco, uDof;
varying vec4 vColor;
varying float vTam, vAng, vBlur;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = -mv.z;
  // Profundidad de campo: fuera del plano de foco, más grande, más tenue y más suave
  float blur = clamp(abs(dist - uFoco) / (uCam * 0.16), 0.0, 1.0) * uDof;
  vBlur = blur;
  gl_PointSize = max(aTam * (uCam / dist) * (1.0 + blur * 1.25) * uDpr, 1.0);
  vTam = gl_PointSize;
  vColor = vec4(aColor.rgb, aColor.a / (1.0 + blur * 3.6));
  vAng = aAzar.x * 6.2831 + uTiempo * aAzar.y;
}`;

const VERT_POLVO = /* glsl */ `
attribute vec4 aColor;
attribute float aTam;
attribute vec2 aAzar;
uniform vec2 uRes;
uniform float uDpr, uTiempo, uScroll;
varying vec4 vColor;
varying float vTam, vAng, vBlur;
void main() {
  // position = (x de 0 a 1, y de 0 a 1, profundidad de 0 a 1)
  float prof = position.z;
  float y = fract(position.y - uScroll * (0.08 + 0.4 * prof) / (uRes.y * 1.2)) * 1.2 - 0.1;
  vec2 p = vec2(position.x + sin(uTiempo * 0.15 + aAzar.x * 6.28) * 0.012, y + cos(uTiempo * 0.12 + aAzar.x * 4.0) * 0.01);
  vec4 mv = modelViewMatrix * vec4((p.x - 0.5) * uRes.x, (0.5 - p.y) * uRes.y, 0.0, 1.0);
  gl_Position = projectionMatrix * mv;
  vBlur = (1.0 - prof) * 0.6;
  gl_PointSize = aTam * (1.0 + vBlur) * uDpr;
  vTam = gl_PointSize;
  vColor = vec4(aColor.rgb, aColor.a * (0.12 + 0.5 * prof * prof));
  vAng = aAzar.x * 6.2831 + uTiempo * (aAzar.y - 0.5) * 0.4;
}`;

const FRAG = /* glsl */ `
varying vec4 vColor;
varying float vTam, vAng, vBlur;
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
  // Nítido: el contorno del triangulito. Desenfocado: un triángulo suave y relleno (bokeh)
  float ancho = mix(px * 0.6, 0.3, vBlur);
  float suave = mix(px, 0.55, vBlur);
  float a = 1.0 - smoothstep(ancho, ancho + suave, abs(d));
  a = max(a, vBlur * 0.22 * (1.0 - smoothstep(-0.25, 0.25, d)));
  a *= vColor.a;
  if (a < 0.008) discard;
  float blanco = smoothstep(0.6, 0.9, min(min(vColor.r, vColor.g), vColor.b));
  vec3 col = mix(vColor.rgb, mix(vColor.rgb * 0.62, vec3(0.42, 0.26, 0.85), blanco), uClaro);
  gl_FragColor = vec4(col * a, a);
}`;

const COLORES_POLVO = [
  [1, 0.72, 0.16],
  [0.5, 0.32, 1],
  [0.18, 0.84, 0.66],
  [1, 1, 1],
  [1, 0.54, 0.42],
];
const COLORES_TETRA = ["#ffb829", "#d9d4e8", "#8052ff", "#ffb829", "#2fd6a8", "#d9d4e8", "#8052ff"];
/** Hacia dónde viene la luz (arriba a la izquierda, un poco al frente). */
const LUZ = new THREE.Vector3(-0.55, 0.6, 0.58).normalize();

const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function crearMotor(canvas: HTMLCanvasElement, opciones: { quieto: boolean; claro: boolean }): Motor | null {
  const { quieto } = opciones;
  let claro = opciones.claro;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  // Los colores se escriben tal cual (ya están en sRGB), sin conversiones
  THREE.ColorManagement.enabled = false;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const ancho0 = window.innerWidth;
  const celular = ancho0 < 700;
  const N = celular ? 6000 : ancho0 < 1200 ? 9000 : 12000;
  const NP = celular ? 120 : 260;

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(30, 1, 10, 20000);
  /** La figura vive en este grupo: la cámara "se mueve" acercándolo o girándolo un poco. */
  const grupo = new THREE.Group();
  escena.add(grupo);

  // ---------- La figura ----------
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const colAttr = new THREE.BufferAttribute(new Float32Array(N * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const tamAttr = new THREE.BufferAttribute(new Float32Array(N), 1).setUsage(THREE.DynamicDrawUsage);
  const azar = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    azar[i * 2] = Math.random();
    azar[i * 2 + 1] = (Math.random() - 0.5) * 0.5;
  }
  geo.setAttribute("position", posAttr);
  geo.setAttribute("aColor", colAttr);
  geo.setAttribute("aTam", tamAttr);
  geo.setAttribute("aAzar", new THREE.BufferAttribute(azar, 2));
  const uFig = {
    uDpr: { value: 1 },
    uTiempo: { value: 0 },
    uCam: { value: 2000 },
    uFoco: { value: 2000 },
    uDof: { value: 0.3 },
    uClaro: { value: claro ? 1 : 0 },
  };
  const matFigura = new THREE.ShaderMaterial({
    vertexShader: VERT_FIGURA,
    fragmentShader: FRAG,
    uniforms: uFig,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
  });
  const puntos = new THREE.Points(geo, matFigura);
  puntos.frustumCulled = false;
  grupo.add(puntos);

  // ---------- El polvo de fondo (no se mueve con la figura; sube un poco al bajar) ----------
  const geoPolvo = new THREE.BufferGeometry();
  const pp = new Float32Array(NP * 3);
  const pc = new Float32Array(NP * 4);
  const pt = new Float32Array(NP);
  const pa = new Float32Array(NP * 2);
  for (let i = 0; i < NP; i++) {
    const prof = Math.random();
    const c = COLORES_POLVO[Math.floor(Math.random() * COLORES_POLVO.length)];
    pp.set([Math.random(), Math.random(), prof], i * 3);
    pc.set([c[0], c[1], c[2], 1], i * 4);
    pt[i] = Math.random() < 0.05 ? 12 + Math.random() * 8 : 4 + prof * 6 + Math.random() * 2;
    pa.set([Math.random(), Math.random()], i * 2);
  }
  geoPolvo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  geoPolvo.setAttribute("aColor", new THREE.BufferAttribute(pc, 4));
  geoPolvo.setAttribute("aTam", new THREE.BufferAttribute(pt, 1));
  geoPolvo.setAttribute("aAzar", new THREE.BufferAttribute(pa, 2));
  const uPolvo = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uDpr: { value: 1 },
    uTiempo: { value: 0 },
    uScroll: { value: 0 },
    uClaro: uFig.uClaro,
  };
  const matPolvo = new THREE.ShaderMaterial({
    vertexShader: VERT_POLVO,
    fragmentShader: FRAG,
    uniforms: uPolvo,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
  });
  const polvo = new THREE.Points(geoPolvo, matPolvo);
  polvo.frustumCulled = false;
  escena.add(polvo);

  // ---------- Tetraedros grandes de alambre (brillan con el bloom) ----------
  const geoTetra = new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(1));
  const cuantosTetras = celular ? 4 : 7;
  const tetras = Array.from({ length: cuantosTetras }, (_, i) => {
    const mat = new THREE.LineBasicMaterial({ color: COLORES_TETRA[i], transparent: true, blending: THREE.AdditiveBlending, depthTest: false });
    const malla = new THREE.LineSegments(geoTetra, mat);
    escena.add(malla);
    return {
      malla,
      mat,
      x: (i + 0.5) / cuantosTetras + (Math.random() - 0.5) * 0.1,
      y: Math.random(),
      prof: Math.random(),
      tam: 16 + Math.random() * 22,
      giro: [Math.random() * 6, Math.random() * 6],
      vel: [(Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.3],
    };
  });

  // ---------- Brillo (solo en modo oscuro) ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(escena, camara));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.45, 0.32);
  composer.addPass(bloom);

  // ---------- Medidas ----------
  let w = 1;
  let h = 1;
  const medir = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, celular ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    // Bloom a menor resolución en celular (rinde más y se ve igual de suave)
    composer.setPixelRatio(celular ? 1 : dpr);
    composer.setSize(w, h);
    // Cámara a una distancia en la que 1 unidad = 1 píxel en el plano de la figura
    const dist = Math.max(h, 600) * 3;
    camara.position.set(0, 0, dist);
    camara.fov = (2 * Math.atan(h / 2 / dist) * 180) / Math.PI;
    camara.aspect = w / h;
    camara.far = dist * 4;
    camara.updateProjectionMatrix();
    uFig.uDpr.value = dpr;
    uFig.uCam.value = dist;
    uFig.uFoco.value = dist;
    uPolvo.uDpr.value = dpr;
    uPolvo.uRes.value.set(w, h);
    if (activa) C = colocar(activa, w, h);
  };

  // ---------- Estado de cada triangulito ----------
  const formas = new Map<NombreForma, Float32Array>();
  const forma = (nombre: NombreForma) => {
    let f = formas.get(nombre);
    if (!f) {
      f = crearForma(nombre, N);
      formas.set(nombre, f);
    }
    return f;
  };
  const pos = posAttr.array as Float32Array;
  const col = colAttr.array as Float32Array;
  const tam = tamAttr.array as Float32Array;
  const fase = new Float32Array(N);
  const tamBase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    fase[i] = Math.random() * Math.PI * 2;
    tamBase[i] = 3.2 + Math.random() * 5.5;
  }
  // La transición: de dónde sale (A), por dónde pasa (control), cuándo sale y cuánto tarda
  const desde = new Float32Array(N * 3);
  const control = new Float32Array(N * 3);
  const colDesde = new Float32Array(N * 4);
  const tamDesde = new Float32Array(N);
  const retraso = new Float32Array(N);
  const duracion = new Float32Array(N);
  const remolino = new Float32Array(N * 3);
  let inicioTransicion = -1;
  let finTransicion = -1;
  const curva = gsap.parseEase("power3.inOut");

  let activa: NombreEscena | null = null;
  let C: Colocacion = colocar("polvo", window.innerWidth, window.innerHeight);
  const efecto = { dof: 0.3, brillo: 0.5, acerca: 1, gira: 0 };
  let linea: gsap.core.Timeline | null = null;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let tiempo = 0;
  medir();

  /** Dónde va cada triangulito en la figura de la escena activa (con la luz y el giro de ahora). */
  const objetivo = new Float32Array(N * 3);
  const colObjetivo = new Float32Array(N * 4);
  const tamObjetivo = new Float32Array(N);
  const calcularObjetivos = () => {
    const F = forma(C.forma);
    let [yaw, pitch] = C.giro(quieto ? 0 : tiempo);
    const roll = C.giro(quieto ? 0 : tiempo)[2];
    if (C.modo === "objeto" && !quieto) {
      yaw += mouse.sx * 0.12;
      pitch += mouse.sy * 0.07;
    }
    const cz = Math.cos(roll);
    const sz = Math.sin(roll);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cx = Math.cos(pitch);
    const sx = Math.sin(pitch);
    const ox = (C.cx - 0.5) * w;
    const oy = (0.5 - C.cy) * h;
    const S = C.escala;
    const factorTam = C.modo === "objeto" ? Math.min(1.3, Math.max(0.55, S / 330)) : Math.min(1.1, Math.max(0.7, w / 1400));
    const objeto = C.modo === "objeto";
    for (let i = 0; i < N; i++) {
      const o = i * POR_PUNTO;
      const p = i * 3;
      const q = i * 4;
      let luz = 1;
      let visible = 1;
      if (objeto) {
        const gx = (x: number, y: number) => x * cz - y * sz;
        const gy = (x: number, y: number) => x * sz + y * cz;
        // Girar el punto
        const x1 = gx(F[o], F[o + 1]);
        const y1 = gy(F[o], F[o + 1]);
        const x2 = x1 * cy + F[o + 2] * sy;
        const z2 = -x1 * sy + F[o + 2] * cy;
        const y3 = y1 * cx - z2 * sx;
        const z3 = y1 * sx + z2 * cx;
        objetivo[p] = ox + x2 * S;
        objetivo[p + 1] = oy + y3 * S;
        objetivo[p + 2] = z3 * S;
        // Girar la normal igual y calcular la luz: difusa + brillo de orilla
        const n1x = gx(F[o + 8], F[o + 9]);
        const n1y = gy(F[o + 8], F[o + 9]);
        const n2x = n1x * cy + F[o + 10] * sy;
        const n2z = -n1x * sy + F[o + 10] * cy;
        const n3y = n1y * cx - n2z * sx;
        const n3z = n1y * sx + n2z * cx;
        const difusa = Math.max(0, n2x * LUZ.x + n3y * LUZ.y + n3z * LUZ.z);
        const orilla = Math.pow(1 - Math.abs(n3z), 2.2);
        luz = 0.45 + 0.5 * difusa + 0.32 * orilla;
        if (C.ocultarAtras > 0) visible = 1 - C.ocultarAtras * (1 - suave(-0.35, 0.3, z3));
        if (C.ocultarAtras >= 1) visible *= 0.5 + 0.5 * suave(0, 0.55, z3);
        if (!quieto) {
          objetivo[p] += Math.sin(tiempo * 0.7 + fase[i]) * 0.6;
          objetivo[p + 1] += Math.cos(tiempo * 0.6 + fase[i] * 1.3) * 0.6;
        }
      } else {
        objetivo[p] = F[o] * w * 0.5 + (quieto ? 0 : Math.sin(tiempo * 0.12 + fase[i]) * 14);
        objetivo[p + 1] = F[o + 1] * h * 0.5 + (quieto ? 0 : Math.cos(tiempo * 0.1 + fase[i] * 1.7) * 10);
        objetivo[p + 2] = F[o + 2] * h * 0.25;
      }
      colObjetivo[q] = Math.min(1.05, F[o + 3] * luz);
      colObjetivo[q + 1] = Math.min(1.05, F[o + 4] * luz);
      colObjetivo[q + 2] = Math.min(1.05, F[o + 5] * luz);
      colObjetivo[q + 3] = F[o + 6] * C.alfa * visible;
      tamObjetivo[i] = tamBase[i] * F[o + 7] * C.tam * factorTam;
    }
  };

  /** Prepara el viaje de cada triangulito desde donde está hacia la figura nueva. */
  const prepararViaje = (antes: Colocacion, intro: boolean) => {
    calcularObjetivos();
    const ax = (antes.cx - 0.5) * w * (antes.modo === "objeto" ? 1 : 0);
    const ay = (0.5 - antes.cy) * h * (antes.modo === "objeto" ? 1 : 0);
    const bx = (C.cx - 0.5) * w * (C.modo === "objeto" ? 1 : 0);
    const by = (0.5 - C.cy) * h * (C.modo === "objeto" ? 1 : 0);
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy);
    const ux = dist > 1 ? dx / dist : 0;
    const uy = dist > 1 ? dy / dist : 0;
    const radio = antes.modo === "objeto" ? antes.escala : Math.max(w, h) * 0.5;
    for (let i = 0; i < N; i++) {
      const p = i * 3;
      const q = i * 4;
      desde[p] = pos[p];
      desde[p + 1] = pos[p + 1];
      desde[p + 2] = pos[p + 2];
      colDesde[q] = col[q];
      colDesde[q + 1] = col[q + 1];
      colDesde[q + 2] = col[q + 2];
      colDesde[q + 3] = col[q + 3];
      tamDesde[i] = tam[i];
      // En ola: salen primero los que están del lado hacia donde van
      const lado = dist > 1 ? ((desde[p] - ax) * ux + (desde[p + 1] - ay) * uy) / radio : 0;
      retraso[i] = (intro ? 0.3 : 0.32) * (1 - Math.min(1, Math.max(0, (lado + 1) / 2))) + Math.random() * (intro ? 0.3 : 0.26);
      duracion[i] = (intro ? 1.3 : 1.35) + Math.random() * 0.6;
      // El punto de control de la curva: se abre desde el centro de la figura de antes
      // (explosión suave), se va de lado (arco) y entra o sale de la pantalla (profundidad)
      const mx = (desde[p] + objetivo[p]) / 2;
      const my = (desde[p + 1] + objetivo[p + 1]) / 2;
      const arco = (Math.random() - 0.5) * 2 * (0.25 * dist + 90);
      const abre = 0.35 + Math.random() * 0.35;
      control[p] = mx + (desde[p] - ax) * abre - uy * arco;
      control[p + 1] = my + (desde[p + 1] - ay) * abre + ux * arco;
      control[p + 2] = (desde[p + 2] + objetivo[p + 2]) / 2 + (Math.random() - 0.5) * 520;
      remolino[p] = Math.random() * 6.28;
      remolino[p + 1] = 18 + Math.random() * 40;
      remolino[p + 2] = Math.random() < 0.5 ? -1 : 1;
    }
    tiempo = performance.now() / 1000;
    inicioTransicion = tiempo;
    let maximo = 0;
    for (let i = 0; i < N; i++) maximo = Math.max(maximo, retraso[i] + duracion[i]);
    finTransicion = tiempo + maximo;

    // La cámara: se desenfoca, brilla más y se acerca un poco mientras viajan; luego vuelve a enfocar
    linea?.kill();
    linea = gsap
      .timeline()
      .to(efecto, { dof: 1, brillo: 0.7, acerca: 1.045, gira: 0.08 * (ux >= 0 ? 1 : -1), duration: 0.7, ease: "power2.out" })
      .to(efecto, { dof: 0.3, brillo: 0.5, acerca: 1, gira: 0, duration: 1.5, ease: "power3.inOut" });
  };

  const avanzar = () => {
    calcularObjetivos();
    const enViaje = inicioTransicion >= 0 && tiempo < finTransicion;
    if (!enViaje) inicioTransicion = -1;
    for (let i = 0; i < N; i++) {
      const p = i * 3;
      const q = i * 4;
      if (enViaje) {
        const t = (tiempo - inicioTransicion - retraso[i]) / duracion[i];
        if (t < 1) {
          const k = t <= 0 ? 0 : curva(t);
          const u = 1 - k;
          // Curva de Bézier (desde → control → objetivo) más un remolino que se apaga al llegar
          const giro = Math.sin(Math.PI * k) * remolino[p + 1];
          const ang = remolino[p] + k * 5 * remolino[p + 2];
          pos[p] = u * u * desde[p] + 2 * u * k * control[p] + k * k * objetivo[p] + Math.cos(ang) * giro;
          pos[p + 1] = u * u * desde[p + 1] + 2 * u * k * control[p + 1] + k * k * objetivo[p + 1] + Math.sin(ang) * giro;
          pos[p + 2] = u * u * desde[p + 2] + 2 * u * k * control[p + 2] + k * k * objetivo[p + 2];
          col[q] = colDesde[q] + (colObjetivo[q] - colDesde[q]) * k;
          col[q + 1] = colDesde[q + 1] + (colObjetivo[q + 1] - colDesde[q + 1]) * k;
          col[q + 2] = colDesde[q + 2] + (colObjetivo[q + 2] - colDesde[q + 2]) * k;
          col[q + 3] = colDesde[q + 3] + (colObjetivo[q + 3] - colDesde[q + 3]) * k;
          tam[i] = tamDesde[i] + (tamObjetivo[i] - tamDesde[i]) * k;
          continue;
        }
      }
      pos[p] = objetivo[p];
      pos[p + 1] = objetivo[p + 1];
      pos[p + 2] = objetivo[p + 2];
      col[q] = colObjetivo[q];
      col[q + 1] = colObjetivo[q + 1];
      col[q + 2] = colObjetivo[q + 2];
      col[q + 3] = colObjetivo[q + 3];
      tam[i] = tamObjetivo[i];
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    tamAttr.needsUpdate = true;
  };

  const pintar = () => {
    uFig.uTiempo.value = quieto ? 0 : tiempo;
    uPolvo.uTiempo.value = quieto ? 0 : tiempo;
    uPolvo.uScroll.value = window.scrollY;
    uFig.uDof.value = quieto ? 0.3 : efecto.dof;
    bloom.strength = efecto.brillo;
    grupo.scale.setScalar(efecto.acerca);
    grupo.rotation.y = efecto.gira;
    // Tetraedros: flotan, giran despacio y suben un poco al bajar la página
    for (const te of tetras) {
      const y = ((((te.y - (window.scrollY * (0.1 + 0.3 * te.prof)) / (h * 1.3)) % 1) + 1) % 1) * 1.3 - 0.15;
      const t = quieto ? 0 : tiempo;
      te.malla.position.set(te.x * w - w / 2 + Math.sin(t * 0.2 + te.giro[0]) * 12, h / 2 - y * h + Math.cos(t * 0.17 + te.giro[1]) * 10, 0);
      te.malla.rotation.set(te.giro[1] + t * te.vel[1], te.giro[0] + t * te.vel[0], 0);
      te.malla.scale.setScalar(te.tam);
      te.mat.opacity = (0.35 + 0.5 * te.prof) * (claro ? 0.6 : 1);
    }
    if (claro) {
      renderer.setClearColor(0x000000, 0);
      renderer.render(escena, camara);
    } else {
      renderer.setClearColor(0x000000, 1);
      composer.render();
    }
  };

  const cuadro = () => {
    tiempo = performance.now() / 1000;
    mouse.sx += (mouse.x - mouse.sx) * 0.03;
    mouse.sy += (mouse.y - mouse.sy) * 0.03;
    avanzar();
    pintar();
  };

  const alMover = (e: PointerEvent) => {
    mouse.x = (e.clientX / w) * 2 - 1;
    mouse.y = (e.clientY / h) * 2 - 1;
  };
  const alRedimensionar = () => {
    medir();
    if (quieto) cuadro();
  };
  window.addEventListener("resize", alRedimensionar);
  if (!quieto) {
    window.addEventListener("pointermove", alMover, { passive: true });
    // Un solo reloj para todo (GSAP, el scroll suave y la escena)
    gsap.ticker.add(cuadro);
  }

  const aplicarTema = (c: boolean) => {
    claro = c;
    uFig.uClaro.value = c ? 1 : 0;
    const modo = c ? THREE.OneMinusSrcAlphaFactor : THREE.OneFactor;
    matFigura.blendDst = modo;
    matPolvo.blendDst = modo;
    matFigura.needsUpdate = true;
    matPolvo.needsUpdate = true;
    for (const te of tetras) te.mat.blending = c ? THREE.NormalBlending : THREE.AdditiveBlending;
  };
  aplicarTema(claro);

  return {
    ir(nueva) {
      if (nueva === activa) return;
      const antes = activa === null ? null : C;
      activa = nueva;
      C = colocar(nueva, w, h);
      if (quieto) {
        cuadro();
        return;
      }
      if (antes === null) {
        // Al abrir la página: los triangulitos llegan desde una nube suave
        calcularObjetivos();
        for (let i = 0; i < N; i++) {
          const p = i * 3;
          pos[p] = objetivo[p] + (Math.random() - 0.5) * w * 0.6;
          pos[p + 1] = objetivo[p + 1] + (Math.random() - 0.5) * h * 0.6;
          pos[p + 2] = (Math.random() - 0.5) * 600;
          col.set([colObjetivo[i * 4], colObjetivo[i * 4 + 1], colObjetivo[i * 4 + 2], 0], i * 4);
          tam[i] = tamObjetivo[i];
        }
        prepararViaje(colocar("polvo", w, h), true);
        return;
      }
      prepararViaje(antes, false);
    },
    dibujarUnaVez: cuadro,
    tema(c) {
      aplicarTema(c);
      if (quieto) cuadro();
    },
    destruir() {
      gsap.ticker.remove(cuadro);
      linea?.kill();
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("pointermove", alMover);
      geo.dispose();
      geoPolvo.dispose();
      geoTetra.dispose();
      matFigura.dispose();
      matPolvo.dispose();
      for (const te of tetras) te.mat.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
