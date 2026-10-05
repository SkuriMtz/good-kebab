import * as THREE from "three";

/**
 * El material de las partículas: cada una es un cuadrito que siempre mira a
 * la cámara y, adentro, el shader dibuja un TETRAEDRO DE ALAMBRE diminuto que
 * gira sobre sí mismo (las 6 aristas, contorno delgado y definido).
 * - Cada partícula tiene su lugar en la figura A y en la figura B; uMezcla
 *   (0 a 1, ligado al scroll) la lleva de una a otra, con un retraso propio y
 *   un arco de dispersión, para que el cambio se vea orgánico.
 * - uDeshacer: la parte de abajo de la figura se deshace en partículas.
 * - Brillo aditivo moderado; luz desde arriba a la izquierda para el volumen;
 *   lo que está lejos del plano de foco se ve desenfocado.
 * Una sola llamada de dibujo para miles de partículas (InstancedBufferGeometry).
 */

const VERTEX = /* glsl */ `
attribute vec3 aPosA;
attribute vec3 aPosB;
attribute vec3 aNormA;
attribute vec3 aNormB;
attribute vec3 aColA;
attribute vec3 aColB;
attribute float aAlfaA;
attribute float aAlfaB;
attribute float aSize;
attribute vec4 aSpin;   // eje de giro (xyz) y velocidad (w)
attribute vec4 aSeed;   // azar propio: xy fases, z retraso, w libre
attribute vec3 aDir;    // hacia dónde se dispersa al cambiar de figura

uniform float uTime;
uniform float uAltoPx;     // cuántos píxeles mide 1 unidad a 1 unidad de distancia
uniform float uFoco;       // distancia de la cámara al plano enfocado
uniform float uDof;        // fuerza del desenfoque
uniform float uDeriva;     // cuánto "respira" cada partícula
uniform float uMezcla;     // 0 = figura A, 1 = figura B
uniform float uDispersa;   // qué tanto se abren al viajar
uniform float uDeshacer;   // 0 a 1: la parte de abajo de la figura se deshace
uniform float uOpacidad;   // opacidad general
uniform vec3 uLuz;         // hacia dónde viene la luz (mundo)

varying vec2 vLocal;
varying vec4 vAB;
varying vec4 vCD;
varying vec3 vColor;
varying float vAlpha;
varying float vAncho;
varying float vSuave;

vec3 rot(vec3 v, vec3 k, float a) {
  float c = cos(a), s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}

void main() {
  // Cada una sale con su propio retraso: no llegan todas al mismo tiempo
  float t = clamp((uMezcla - aSeed.z * 0.4) / 0.6, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(aPosA, aPosB, t) + aDir * sin(3.14159 * t) * uDispersa;
  vec3 nrm = mix(aNormA, aNormB, t);

  // La parte de abajo de la figura se deshace: se suelta y cae flotando
  float abajo = smoothstep(0.1, -1.3, aPosA.y + (aSeed.x - 0.5) * 0.6) * uDeshacer * (1.0 - t);
  p += (aDir * 0.9 + vec3(0.0, -0.8, 0.3)) * abajo * 1.6;

  // Respira: un vaivén pequeño y distinto para cada partícula
  p += uDeriva * vec3(
    sin(uTime * 0.7 + aSeed.x * 6.2831),
    cos(uTime * 0.6 + aSeed.y * 6.2831),
    sin(uTime * 0.5 + aSeed.x * 12.566)
  );
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.01);

  // Luz (solo las partículas de superficie, que traen normal)
  vec3 nv = normalMatrix * nrm;
  float ln = length(nv);
  float tieneN = smoothstep(0.05, 0.4, ln);
  vec3 n = nv / max(ln, 1e-4);
  vec3 L = normalize((viewMatrix * vec4(uLuz, 0.0)).xyz);
  float dif = max(dot(n, L), 0.0);
  float frente = smoothstep(-0.15, 0.65, n.z);
  float brillo = mix(1.0, 0.3 + 0.8 * dif, tieneN);
  float visible = mix(1.0, 0.08 + 0.92 * frente, tieneN);
  vColor = mix(aColA, aColB, t) * brillo;

  // Desenfoque según la distancia al plano de foco
  float blur = clamp(abs(dist - uFoco) / (uFoco * 0.55), 0.0, 1.0) * uDof;
  float crece = 1.0 + blur * 1.4;
  float px = aSize * uAltoPx / dist; // tamaño en píxeles

  mv.xy += position.xy * aSize * crece;
  gl_Position = projectionMatrix * mv;
  vLocal = position.xy * crece;

  // Los 4 vértices del tetraedro, girando, proyectados al cuadrito
  vec3 eje = normalize(aSpin.xyz + vec3(1e-4));
  float ang = aSeed.y * 6.2831 + uTime * aSpin.w;
  vec3 v0 = rot(vec3(0.0, 0.78, 0.0), eje, ang);
  vec3 v1 = rot(vec3(0.735, -0.26, 0.0), eje, ang);
  vec3 v2 = rot(vec3(-0.367, -0.26, 0.637), eje, ang);
  vec3 v3 = rot(vec3(-0.367, -0.26, -0.637), eje, ang);
  vAB = vec4(v0.xy, v1.xy);
  vCD = vec4(v2.xy, v3.xy);

  // Contorno delgado (~0.8 px) y definido; más ancho y suave si está desenfocado
  float unPx = 2.0 / max(px, 1.0);
  vAncho = mix(0.4 * unPx, 0.04, blur);
  vSuave = mix(0.8 * unPx, 0.16, blur);
  vAlpha = mix(aAlfaA, aAlfaB, t) * uOpacidad * visible * (1.0 - abajo * 0.4) * smoothstep(1.5, 4.0, px) / (1.0 + blur * 1.8);
}
`;

const FRAGMENT = /* glsl */ `
varying vec2 vLocal;
varying vec4 vAB;
varying vec4 vCD;
varying vec3 vColor;
varying float vAlpha;
varying float vAncho;
varying float vSuave;

float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = vLocal;
  float d = seg(p, vAB.xy, vAB.zw);
  d = min(d, seg(p, vAB.xy, vCD.xy));
  d = min(d, seg(p, vAB.xy, vCD.zw));
  d = min(d, seg(p, vAB.zw, vCD.xy));
  d = min(d, seg(p, vCD.xy, vCD.zw));
  d = min(d, seg(p, vCD.zw, vAB.zw));
  float a = (1.0 - smoothstep(vAncho, vAncho + vSuave, d)) * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

export type Uniformes = {
  uTime: { value: number };
  uAltoPx: { value: number };
  uFoco: { value: number };
  uDof: { value: number };
  uDeriva: { value: number };
  uMezcla: { value: number };
  uDispersa: { value: number };
  uDeshacer: { value: number };
  uOpacidad: { value: number };
  uLuz: { value: THREE.Vector3 };
};

export function crearMaterial(opciones: { deriva: number; dof: number; opacidad?: number }) {
  const uniforms: Uniformes = {
    uTime: { value: 0 },
    uAltoPx: { value: 1000 },
    uFoco: { value: 10 },
    uDof: { value: opciones.dof },
    uDeriva: { value: opciones.deriva },
    uMezcla: { value: 0 },
    uDispersa: { value: 0 },
    uDeshacer: { value: 0 },
    uOpacidad: { value: opciones.opacidad ?? 1 },
    uLuz: { value: new THREE.Vector3(-0.55, 0.65, 0.55).normalize() },
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
  return { material, uniforms };
}

/** Lo que una figura le da a cada partícula. */
export type Lugar = { pos: Float32Array; normal: Float32Array; color: Float32Array; alfa: Float32Array };
/** Lo propio de cada partícula, que no cambia entre figuras. */
export type Propio = { tam: Float32Array; giro: Float32Array; semilla: Float32Array; dir: Float32Array };

/**
 * Arma la geometría: un cuadrito (-1 a 1) repetido una vez por partícula,
 * con su lugar en la figura A y en la B. Devuelve cómo cambiar A y B.
 */
export function crearGeometria(a: Lugar, b: Lugar, propio: Propio, n: number, dinamica = false) {
  const cuadro = new THREE.PlaneGeometry(2, 2);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = cuadro.index;
  geo.setAttribute("position", cuadro.getAttribute("position"));
  const attr = (arr: Float32Array, size: number, cambia: boolean) => {
    const at = new THREE.InstancedBufferAttribute(new Float32Array(arr), size);
    if (cambia || dinamica) at.setUsage(THREE.DynamicDrawUsage);
    return at;
  };
  const A = { pos: attr(a.pos, 3, true), normal: attr(a.normal, 3, true), color: attr(a.color, 3, true), alfa: attr(a.alfa, 1, true) };
  const B = { pos: attr(b.pos, 3, true), normal: attr(b.normal, 3, true), color: attr(b.color, 3, true), alfa: attr(b.alfa, 1, true) };
  geo.setAttribute("aPosA", A.pos);
  geo.setAttribute("aNormA", A.normal);
  geo.setAttribute("aColA", A.color);
  geo.setAttribute("aAlfaA", A.alfa);
  geo.setAttribute("aPosB", B.pos);
  geo.setAttribute("aNormB", B.normal);
  geo.setAttribute("aColB", B.color);
  geo.setAttribute("aAlfaB", B.alfa);
  geo.setAttribute("aSize", new THREE.InstancedBufferAttribute(propio.tam, 1));
  geo.setAttribute("aSpin", new THREE.InstancedBufferAttribute(propio.giro, 4));
  geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(propio.semilla, 4));
  geo.setAttribute("aDir", new THREE.InstancedBufferAttribute(propio.dir, 3));
  geo.instanceCount = n;

  const copiar = (destino: typeof A, origen: Lugar) => {
    (destino.pos.array as Float32Array).set(origen.pos);
    (destino.normal.array as Float32Array).set(origen.normal);
    (destino.color.array as Float32Array).set(origen.color);
    (destino.alfa.array as Float32Array).set(origen.alfa);
    for (const at of [destino.pos, destino.normal, destino.color, destino.alfa]) at.needsUpdate = true;
  };
  return {
    geo,
    ponerFiguras(nuevaA: Lugar, nuevaB: Lugar) {
      copiar(A, nuevaA);
      copiar(B, nuevaB);
    },
    /** Para los tetraedros flotantes: la posición cambia en cada cuadro. */
    posicionesA: A.pos,
    posicionesB: B.pos,
  };
}
