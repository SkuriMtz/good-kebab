import * as THREE from "three";

/**
 * "Polvo de estrellas": la escena 3D de partículas como fondo de la portada.
 * Es la misma familia de la escena de /vista-3d (sus tetraedros de alambre),
 * pero quieta y casi imperceptible: el protagonista es el título.
 *
 * - Pocas partículas (lección 11), repartidas en profundidad: la mayoría son
 *   puntos lejanos y diminutos; unas pocas, cercanas, se alcanzan a ver como
 *   tetraedros de alambre que giran muy despacio. Las cercanas nunca pasan
 *   por la columna del texto, para que siempre se lea.
 * - Profundidad real: la cámara se corre un poco con el mouse (parallax) y
 *   mira a un punto lejano, así lo cercano se mueve más que lo lejano.
 *   Sin mouse (celular), la cámara deriva sola, muy lento.
 * - Brillo bajo (lección 7): opacidad por partícula de 0.5 a 0.8 por un
 *   factor general, sin bloom y con pocos blancos.
 * - El canvas es fijo: con el scroll solo se mueve el contenido (lección 8).
 * - Colores: se leen de los tokens de la base (--c-destacada, --c-enlace,
 *   --c-texto / --c-accion, --c-tenue) y cambian con el modo. En oscuro la
 *   mezcla es aditiva (luz sobre negro); en claro es normal (tinta sobre el
 *   gris cálido de la portada), para que también funcione en modo claro.
 * - Solo dibuja mientras la portada está en pantalla.
 */

export type Polvo = { destruir: () => void; recolorear: () => void };

const VERTEX = /* glsl */ `
attribute float aTam;    // tamaño en unidades del mundo
attribute vec4 aSemilla; // azar propio: xy fases, z intensidad, w velocidad de giro
attribute float aTono;   // 0, 1 o 2: cuál de los tres colores
attribute float aCerca;  // 1 = partícula cercana (se dibuja como tetraedro)

uniform float uTiempo;
uniform float uEscalaPx;  // píxeles que mide 1 unidad a 1 unidad de distancia
uniform float uOpacidad;  // factor general (cambia por modo)
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;

varying vec3 vColor;
varying float vAlfa;
varying float vTetra;
varying float vPx;
varying vec4 vAB;
varying vec4 vCD;

vec3 rot(vec3 v, vec3 k, float a) {
  float c = cos(a), s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}

void main() {
  vec3 p = position;
  // Deriva lenta, distinta para cada una (vaivén, no viaje)
  p.x += sin(uTiempo * 0.05 + aSemilla.x * 6.2831) * 0.12;
  p.y += cos(uTiempo * 0.04 + aSemilla.y * 6.2831) * 0.12;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.1);
  float px = aTam * uEscalaPx / dist;
  vPx = max(px, 1.5);
  gl_PointSize = vPx;
  gl_Position = projectionMatrix * mv;

  // Titila apenas; lo lejano se apaga hacia el fondo
  float titila = 0.88 + 0.12 * sin(uTiempo * (0.25 + aSemilla.w * 0.35) + aSemilla.x * 40.0);
  float fondo = mix(0.45, 1.0, smoothstep(48.0, 10.0, dist));
  vAlfa = (0.5 + 0.3 * aSemilla.z) * titila * fondo * uOpacidad * mix(1.0, 0.55, aCerca);

  vColor = mix(mix(uColA, uColB, step(0.5, aTono)), uColC, step(1.5, aTono));
  vTetra = aCerca;

  // Los 4 vértices del tetraedro girando, proyectados al cuadro del punto
  vec3 eje = normalize(vec3(aSemilla.x - 0.5, 0.8, aSemilla.y - 0.5));
  float ang = aSemilla.y * 6.2831 + uTiempo * (0.08 + 0.1 * aSemilla.w);
  vec3 v0 = rot(vec3(0.0, 0.78, 0.0), eje, ang);
  vec3 v1 = rot(vec3(0.735, -0.26, 0.0), eje, ang);
  vec3 v2 = rot(vec3(-0.367, -0.26, 0.637), eje, ang);
  vec3 v3 = rot(vec3(-0.367, -0.26, -0.637), eje, ang);
  vAB = vec4(v0.xy, v1.xy);
  vCD = vec4(v2.xy, v3.xy);
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlfa;
varying float vTetra;
varying float vPx;
varying vec4 vAB;
varying vec4 vCD;

float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  c.y = -c.y;
  // Punto: centro suave, sin halo propio (nada de destellos)
  float punto = 1.0 - smoothstep(0.15, 1.0, length(c));
  // Tetraedro de alambre: las 6 aristas, contorno de ~1 px
  float d = seg(c, vAB.xy, vAB.zw);
  d = min(d, seg(c, vAB.xy, vCD.xy));
  d = min(d, seg(c, vAB.xy, vCD.zw));
  d = min(d, seg(c, vAB.zw, vCD.xy));
  d = min(d, seg(c, vCD.xy, vCD.zw));
  d = min(d, seg(c, vCD.zw, vAB.zw));
  float unPx = 2.0 / vPx;
  float alambre = 1.0 - smoothstep(0.5 * unPx, 1.6 * unPx, d);
  float a = mix(punto, alambre, vTetra) * vAlfa;
  if (a < 0.008) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

function azar(a: number, b: number) {
  return a + Math.random() * (b - a);
}

/** Pone en `destino` un token de color de la base, ya resuelto para el modo actual. */
function token(destino: THREE.Color, nombre: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  // Sin conversión a lineal: el shader escribe el color tal cual (sRGB), igual que el CSS
  if (v) destino.setStyle(v, THREE.LinearSRGBColorSpace);
}

const FOV = 50;
const CAM_Z = 10;

export function crearPolvo(
  canvas: HTMLCanvasElement,
  opciones: { movil: boolean; observar?: Element | null },
): Polvo | null {
  const { movil, observar } = opciones;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
  camara.position.set(0, 0, CAM_Z);
  const mira = new THREE.Vector3(0, 0, -30); // punto lejano: lo cercano se mueve más que lo lejano

  // ---------- Las partículas ----------
  const N = movil ? 420 : 950;
  const tanMedio = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const aspecto = Math.max(window.innerWidth / Math.max(window.innerHeight, 1), 1.9);
  const pos = new Float32Array(N * 3);
  const tam = new Float32Array(N);
  const semilla = new Float32Array(N * 4);
  const tono = new Float32Array(N);
  const cerca = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const esCerca = Math.random() < 0.018;
    // Distancia a la cámara: casi todas lejos (polvo); unas cuantas cerca
    const d = esCerca ? azar(3.2, 6.5) : 7 + Math.pow(Math.random(), 0.75) * 46;
    const medioAlto = tanMedio * d * 1.15; // un poco más ancho que la pantalla, por el parallax
    const medioAncho = medioAlto * aspecto;
    let x = azar(-1, 1) * medioAncho;
    // Las cercanas no cruzan la columna del texto
    if (esCerca) x = (Math.random() < 0.5 ? -1 : 1) * azar(0.42, 1) * medioAncho;
    pos.set([x, azar(-1, 1) * medioAlto, CAM_Z - d], i * 3);
    tam[i] = esCerca ? azar(0.1, 0.15) : azar(0.03, 0.065);
    semilla.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    const r = Math.random();
    tono[i] = r < 0.56 ? 0 : r < 0.92 ? 1 : 2; // pocos del tercer color (blancos en oscuro)
    cerca[i] = esCerca ? 1 : 0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aTam", new THREE.BufferAttribute(tam, 1));
  geo.setAttribute("aSemilla", new THREE.BufferAttribute(semilla, 4));
  geo.setAttribute("aTono", new THREE.BufferAttribute(tono, 1));
  geo.setAttribute("aCerca", new THREE.BufferAttribute(cerca, 1));

  const uniforms = {
    uTiempo: { value: 0 },
    uEscalaPx: { value: 1000 },
    uOpacidad: { value: 0.7 },
    uColA: { value: new THREE.Color() },
    uColB: { value: new THREE.Color() },
    uColC: { value: new THREE.Color() },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const puntos = new THREE.Points(geo, material);
  puntos.frustumCulled = false;
  escena.add(puntos);

  // ---------- Colores del modo actual (tokens de la base) ----------
  const recolorear = () => {
    const claro = document.documentElement.dataset.tema === "claro";
    if (claro) {
      // Tinta sobre gris cálido: violeta hondo, azul de enlace y gris tenue
      token(uniforms.uColA.value, "--c-accion");
      token(uniforms.uColB.value, "--c-enlace");
      token(uniforms.uColC.value, "--c-tenue");
      uniforms.uOpacidad.value = 0.55;
      material.blending = THREE.NormalBlending;
    } else {
      // Luz sobre negro: ultravioleta, cielo y unos pocos blancos
      token(uniforms.uColA.value, "--c-destacada");
      token(uniforms.uColB.value, "--c-enlace");
      token(uniforms.uColC.value, "--c-texto");
      uniforms.uOpacidad.value = 0.62;
      material.blending = THREE.AdditiveBlending;
    }
    material.needsUpdate = true;
    if (!corriendo) dibujar(ultimo);
  };

  // ---------- Medidas ----------
  const medir = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    uniforms.uEscalaPx.value = (h * dpr) / (2 * tanMedio);
  };

  // ---------- Mouse: el parallax, con suavizado que no depende de los fps ----------
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const alMover = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  const inicio = performance.now();
  let ultimo = 0;
  let previo = performance.now();
  const dibujar = (t: number) => {
    uniforms.uTiempo.value = t;
    // Deriva propia muy lenta (lo único que se mueve en celular) + el mouse
    const cx = Math.sin(t * 0.045) * 0.18 + mouse.sx * 0.55;
    const cy = Math.cos(t * 0.037) * 0.12 - mouse.sy * 0.35;
    camara.position.set(cx, cy, CAM_Z);
    camara.lookAt(mira);
    renderer.render(escena, camara);
  };

  let corriendo = false;
  let raf = 0;
  const cuadro = (ahora: number) => {
    raf = requestAnimationFrame(cuadro);
    const dt = Math.min((ahora - previo) / 1000, 0.1);
    previo = ahora;
    const k = 1 - Math.exp(-dt * 2.4);
    mouse.sx += (mouse.x - mouse.sx) * k;
    mouse.sy += (mouse.y - mouse.sy) * k;
    ultimo = (ahora - inicio) / 1000;
    dibujar(ultimo);
  };
  const arrancar = () => {
    if (corriendo) return;
    corriendo = true;
    previo = performance.now();
    raf = requestAnimationFrame(cuadro);
  };
  const parar = () => {
    corriendo = false;
    cancelAnimationFrame(raf);
  };

  medir();
  recolorear();
  dibujar(0);

  // Solo se dibuja mientras la portada está en pantalla
  let io: IntersectionObserver | null = null;
  if (observar && "IntersectionObserver" in window) {
    io = new IntersectionObserver(([e]) => (e.isIntersecting ? arrancar() : parar()), { rootMargin: "64px 0px" });
    io.observe(observar);
  } else {
    arrancar();
  }

  const alRedimensionar = () => {
    medir();
    if (!corriendo) dibujar(ultimo);
  };
  window.addEventListener("resize", alRedimensionar);
  window.addEventListener("pointermove", alMover, { passive: true });

  return {
    recolorear,
    destruir() {
      parar();
      io?.disconnect();
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("pointermove", alMover);
      geo.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
