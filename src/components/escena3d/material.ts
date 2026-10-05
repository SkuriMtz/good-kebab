import * as THREE from "three";

/**
 * El material de las partículas: cada una es un cuadrito que siempre mira a
 * la cámara y, adentro, el shader dibuja un TETRAEDRO DE ALAMBRE diminuto que
 * gira sobre sí mismo (las 6 aristas, solo el contorno).
 * - Brillo aditivo: donde se juntan muchas, la luz se suma.
 * - Luz: las partículas que tienen normal (las de la superficie de la figura)
 *   se iluminan desde arriba a la izquierda y brillan en la orilla, así se ve el volumen.
 * - Profundidad de campo: lo que está lejos del plano de foco se ve más
 *   grande, más suave y más tenue (desenfocado).
 * Una sola llamada de dibujo para miles de partículas (InstancedBufferGeometry).
 */

const VERTEX = /* glsl */ `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec3 aColor;
attribute float aAlpha;
attribute float aSize;
attribute vec4 aSpin;   // eje de giro (xyz) y velocidad (w)
attribute vec2 aSeed;   // azar propio de cada partícula

uniform float uTime;
uniform float uAltoPx;  // cuántos píxeles mide 1 unidad a 1 unidad de distancia
uniform float uFoco;    // distancia de la cámara al plano enfocado
uniform float uDof;     // fuerza del desenfoque
uniform float uDeriva;  // cuánto "respira" cada partícula
uniform vec3 uLuz;      // hacia dónde viene la luz (mundo)

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
  // Respira: un vaivén pequeño y distinto para cada partícula
  vec3 p = aPos + uDeriva * vec3(
    sin(uTime * 0.7 + aSeed.x * 6.2831),
    cos(uTime * 0.6 + aSeed.y * 6.2831),
    sin(uTime * 0.5 + aSeed.x * 12.566)
  );
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.01);

  // Luz (solo las partículas de superficie, que traen normal)
  vec3 nv = normalMatrix * aNormal;
  float ln = length(nv);
  float tieneN = step(0.1, ln);
  vec3 n = nv / max(ln, 1e-4);
  vec3 L = normalize((viewMatrix * vec4(uLuz, 0.0)).xyz);
  float dif = max(dot(n, L), 0.0);
  float orilla = pow(1.0 - abs(n.z), 2.0);
  float frente = smoothstep(-0.15, 0.65, n.z);
  float brillo = mix(1.0, 0.18 + 1.0 * dif + 0.12 * orilla, tieneN);
  float visible = mix(1.0, 0.06 + 0.94 * frente, tieneN);
  vec3 col = aColor * brillo;
  col = mix(col, vec3(1.0), smoothstep(0.82, 1.0, dif) * 0.45 * tieneN);
  vColor = col;

  // Desenfoque según la distancia al plano de foco
  float blur = clamp(abs(dist - uFoco) / (uFoco * 0.55), 0.0, 1.0) * uDof;
  float crece = 1.0 + blur * 1.6;
  float px = aSize * uAltoPx / dist; // tamaño en píxeles

  // El cuadrito: más grande cuando está desenfocado (el tetraedro no cambia de tamaño)
  mv.xy += position.xy * aSize * crece;
  gl_Position = projectionMatrix * mv;
  vLocal = position.xy * crece;

  // Los 4 vértices del tetraedro, girando, proyectados al cuadrito
  vec3 eje = normalize(aSpin.xyz + vec3(1e-4));
  float ang = aSeed.x * 6.2831 + uTime * aSpin.w;
  vec3 v0 = rot(vec3(0.0, 0.78, 0.0), eje, ang);
  vec3 v1 = rot(vec3(0.735, -0.26, 0.0), eje, ang);
  vec3 v2 = rot(vec3(-0.367, -0.26, 0.637), eje, ang);
  vec3 v3 = rot(vec3(-0.367, -0.26, -0.637), eje, ang);
  vAB = vec4(v0.xy, v1.xy);
  vCD = vec4(v2.xy, v3.xy);

  // Grosor de línea: ~1.1 px nítido; ancho y suave si está desenfocado
  float unPx = 2.0 / max(px, 1.0);
  vAncho = mix(0.5 * unPx, 0.05, blur);
  vSuave = mix(unPx, 0.2, blur);
  // Muy chiquitas o muy desenfocadas se apagan un poco
  vAlpha = aAlpha * visible * smoothstep(1.5, 4.0, px) / (1.0 + blur * 1.6);
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
  float a = 1.0 - smoothstep(vAncho, vAncho + vSuave, d);
  // Un halo muy leve alrededor de las aristas (el brillo)
  a += 0.07 * (1.0 - smoothstep(0.0, vAncho + vSuave * 3.0, d));
  a *= vAlpha;
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
  uLuz: { value: THREE.Vector3 };
};

export function crearMaterial(opciones: { deriva: number; dof: number }) {
  const uniforms: Uniformes = {
    uTime: { value: 0 },
    uAltoPx: { value: 1000 },
    uFoco: { value: 10 },
    uDof: { value: opciones.dof },
    uDeriva: { value: opciones.deriva },
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

/** Datos de cada partícula (uno por instancia). */
export type Particulas = {
  pos: Float32Array;
  normal: Float32Array;
  color: Float32Array;
  alfa: Float32Array;
  tam: Float32Array;
  giro: Float32Array;
  semilla: Float32Array;
};

/** Arma la geometría: un cuadrito (-1 a 1) repetido una vez por partícula. */
export function crearGeometria(d: Particulas, n: number, dinamica = false) {
  const cuadro = new THREE.PlaneGeometry(2, 2);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = cuadro.index;
  geo.setAttribute("position", cuadro.getAttribute("position"));
  const attr = (arr: Float32Array, size: number) => {
    const a = new THREE.InstancedBufferAttribute(arr, size);
    if (dinamica) a.setUsage(THREE.DynamicDrawUsage);
    return a;
  };
  geo.setAttribute("aPos", attr(d.pos, 3));
  geo.setAttribute("aNormal", attr(d.normal, 3));
  geo.setAttribute("aColor", attr(d.color, 3));
  geo.setAttribute("aAlpha", attr(d.alfa, 1));
  geo.setAttribute("aSize", new THREE.InstancedBufferAttribute(d.tam, 1));
  geo.setAttribute("aSpin", new THREE.InstancedBufferAttribute(d.giro, 4));
  geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(d.semilla, 2));
  geo.instanceCount = n;
  return geo;
}
