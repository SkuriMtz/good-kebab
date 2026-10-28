"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef, type CSSProperties } from "react";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { CON_MOVIMIENTO, prepararGsap } from "@/lib/movimiento";
import { PLANES, type Plan } from "@/lib/planes";

/** "Lola + Clara": los agentes del plan, empezando por Lola (como se presentan en el sitio). */
function agentesDe(plan: Plan) {
  if (plan.agentes.length === 4) return "Los cuatro agentes";
  const orden = ["lola", "clara", "victor", "iris"] as const;
  return orden
    .filter((a) => plan.agentes.includes(a))
    .map((a) => AGENTE_POR_ID[a].nombre)
    .join(" + ");
}

/** Lo que dice cada ícono, sacado de src/lib/planes.ts (sin precios inventados). */
function renglones() {
  const nombre = (p: Plan) => p.nombre.replace("Atendel ", "");
  const [free, one, max] = PLANES;
  return [
    { id: "free", nombre: nombre(free), sub: `${free.precio ?? "Próximamente"} · ${agentesDe(free)} · ${free.mensajesMes} mensajes al mes`, color: "#ffb829" },
    { id: "one", nombre: nombre(one), sub: `${one.precio ?? "Próximamente"} · ${agentesDe(one)}`, color: "#1a9a86" },
    { id: "max", nombre: nombre(max), sub: `${max.precio ?? "Próximamente"} · ${agentesDe(max)}`, color: "#ffb829" },
    { id: "cuando-sale", nombre: "Cuándo sale", sub: "Free ya está abierto; One y Max por etapas", color: "#a078fe" },
  ];
}

/* Tetraedro de alambre que gira en 3D (4 vértices, 6 aristas) */
const VERTICES = [
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

function trazo(ay: number, ax: number) {
  const pts = VERTICES.map(([x, y, z]) => {
    const x1 = Math.cos(ay) * x + Math.sin(ay) * z;
    const z1 = -Math.sin(ay) * x + Math.cos(ay) * z;
    const y1 = Math.cos(ax) * y - Math.sin(ax) * z1;
    return [50 + x1 * 40, 50 - y1 * 40];
  });
  return ARISTAS.map(([a, b]) => `M${pts[a][0].toFixed(1)} ${pts[a][1].toFixed(1)}L${pts[b][0].toFixed(1)} ${pts[b][1].toFixed(1)}`).join("");
}

/**
 * Los planes como los íconos de "Our investors" del video (MEDIDAS.md §6.7):
 * cuatro tetraedros de alambre que giran despacio, cada uno con su nombre
 * y una línea abajo. Al llegar la escena, los íconos vuelan a su lugar
 * (0.6 s) y después aparecen los nombres letra por letra (a los 1.2 s).
 */
export function PlanesIconos() {
  const ref = useRef<HTMLUListElement>(null);
  const items = renglones();

  useEffect(() => {
    const lista = ref.current;
    if (!lista) return;
    prepararGsap();
    gsap.registerPlugin(SplitText);
    const caminos = Array.from(lista.querySelectorAll<SVGPathElement>(".plan-icono__trazo"));
    const giros = caminos.map((_, i) => ({ ay: 0.6 + i * 1.3, ax: 0.4 + i * 0.7, vy: 0.22 + i * 0.05, vx: 0.15 - i * 0.03 }));
    const pintar = (t: number) => caminos.forEach((c, i) => c.setAttribute("d", trazo(giros[i].ay + t * giros[i].vy, giros[i].ax + t * giros[i].vx)));
    pintar(0);
    const mm = gsap.matchMedia();
    mm.add(CON_MOVIMIENTO, () => {
      // Giro lento y continuo, solo mientras la lista está cerca de la pantalla
      let raf = 0;
      let visible = false;
      const t0 = performance.now();
      const cuadro = (ms: number) => {
        pintar((ms - t0) / 1000);
        if (visible) raf = requestAnimationFrame(cuadro);
      };
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(cuadro);
      });
      io.observe(lista);

      const iconos = Array.from(lista.querySelectorAll<HTMLElement>(".plan-icono"));
      const textos = Array.from(lista.querySelectorAll<HTMLElement>(".plan__textos"));
      const partes = Array.from(lista.querySelectorAll<HTMLElement>(".plan__nombre, .plan__sub"));
      const split = SplitText.create(partes, { type: "lines,words,chars", mask: "lines", charsClass: "rt-letra", aria: "auto" });
      gsap.set(split.chars, { yPercent: 105 });
      // Llegan desde arriba y un poco de lado (como en el video, 10.1–10.6 s)
      gsap.set(iconos, { opacity: 0, x: (i) => [40, -30, 50, -60][i] ?? 0, y: (i) => [-120, -90, -160, -110][i] ?? -100, rotation: (i) => [-40, 30, -25, 45][i] ?? 0 });
      const tl = gsap.timeline({ paused: true, onComplete: () => split.revert() });
      tl.to(iconos, { opacity: 1, x: 0, y: 0, rotation: 0, duration: 0.6, ease: "power3.out", stagger: 0.05 }, 0);
      textos.forEach((_, i) => {
        const letras = Array.from(textos[i].querySelectorAll<HTMLElement>(".rt-letra"));
        tl.to(letras, { yPercent: 0, duration: 0.6, ease: "expo.out", stagger: 0.0025 }, 1.2 + i * 0.12);
      });
      const st = ScrollTrigger.create({ trigger: lista, start: "top 45%", once: true, onEnter: () => tl.play() });
      return () => {
        io.disconnect();
        cancelAnimationFrame(raf);
        st.kill();
        tl.kill();
        split.revert();
        gsap.set(iconos, { clearProps: "all" });
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <ul ref={ref} className="planes-iconos" aria-label="Planes">
      {items.map((it, i) => (
        <li key={it.id} className="plan" data-i={i} style={{ "--c": it.color } as CSSProperties}>
          <span className="plan-icono" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <path className="plan-icono__trazo" d={trazo(0.6 + i * 1.3, 0.4 + i * 0.7)} />
            </svg>
          </span>
          <span className="plan__textos">
            <span className="plan__nombre">{it.nombre}</span>
            <span className="plan__sub">{it.sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
