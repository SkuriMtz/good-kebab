"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { COLORES, Marca, POS } from "@/components/Logo";
import { CLAVE_ENTRADA } from "@/lib/entrada";

/** "espera": el panel está escondido detrás; "entra": el panel aparece; null: ya pasó. */
export type FaseEntrada = "espera" | "entra" | null;
type Fase = "arma" | "funde" | "vuela" | "fin";

/** Los colores de los fragmentos del panel (los mismos de FondoFragmentos). */
const COLORES_FRAGMENTO = ["#ffb829", "#8052ff", "#15846e", "#23d9b5", "#e040fb", "#3d7bff"];

/* El tiempo, en segundos: todo dura ~1.6 s */
/** Lo que tarda cada fragmento en llegar a su lugar en el logo. */
const VIAJE = 0.5;
/** El último fragmento sale a los 0.2 s. */
const ESCALON = 0.2;
/** El logo sólido empieza a aparecer sobre los fragmentos. */
const FUNDE = 0.56;
/** El logo vuela a su lugar y entra el panel. */
const VUELA = 0.92;
const VUELO_MS = 620;
/** Lo que tarda el panel en terminar de entrar (ver la sección 26 de panel.css). */
const PANEL_MS = 720;
/** Si algo falla, el panel entra de todos modos. */
const MAXIMO_MS = 3000;

type Fragmento = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  curva: number;
  giro0: number;
  giro: number;
  sale: number;
  tam0: number;
  tam1: number;
  de: [number, number, number];
  a: [number, number, number];
  rombo: boolean;
};

const rgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const limitar = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const suave = (a: number, b: number, v: number) => {
  const t = limitar((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Los fragmentos: salen de toda la pantalla y cada uno cae dentro de uno de los cuatro círculos. */
function crearFragmentos(ancho: number, alto: number, lado: number): Fragmento[] {
  const n = ancho < 860 ? 150 : 260;
  const cx = ancho / 2;
  const cy = alto / 2;
  const s = lado / 100;
  const lejos = Math.max(ancho, alto) * 0.62;
  return Array.from({ length: n }, (_, i) => {
    const k = i % 4;
    const [px, py] = POS[k];
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 17 * s;
    const t = Math.random() * Math.PI * 2;
    const d = lejos * (0.45 + Math.random() * 0.65);
    return {
      x0: cx + Math.cos(t) * d,
      y0: cy + Math.sin(t) * d,
      x1: cx + (px - 50) * s + Math.cos(a) * r,
      y1: cy + (py - 50) * s + Math.sin(a) * r,
      curva: (Math.random() - 0.5) * 0.5,
      giro0: Math.random() * Math.PI * 2,
      giro: (Math.random() - 0.5) * 5,
      sale: Math.random() * ESCALON,
      tam0: 9 + Math.random() * 12,
      tam1: (2.4 + Math.random() * 2.4) * Math.max(0.8, s),
      de: rgb(COLORES_FRAGMENTO[Math.floor(Math.random() * COLORES_FRAGMENTO.length)]),
      a: rgb(COLORES[k]),
      rombo: Math.random() < 0.18,
    };
  });
}

/** Dibuja un cuadro: cada fragmento viaja en una curva suave, se encoge y toma el color de su círculo. */
function dibujar(x: CanvasRenderingContext2D, fr: Fragmento[], t: number, dpr: number) {
  const { width, height } = x.canvas;
  x.clearRect(0, 0, width, height);
  const desvanece = 1 - suave(FUNDE + 0.1, VUELA, t);
  if (desvanece <= 0) return;
  x.lineWidth = 1.4 * dpr;
  x.lineJoin = "round";
  for (const f of fr) {
    const k = limitar((t - f.sale) / VIAJE);
    if (k <= 0) continue;
    const e = 1 - Math.pow(1 - k, 4);
    const dx = f.x1 - f.x0;
    const dy = f.y1 - f.y0;
    const curva = f.curva * Math.sin(Math.PI * e);
    const px = (f.x0 + dx * e - dy * curva) * dpr;
    const py = (f.y0 + dy * e + dx * curva) * dpr;
    const tam = (f.tam0 + (f.tam1 - f.tam0) * e) * dpr;
    const giro = f.giro0 + f.giro * (1 - e);
    const c = suave(0.5, 1, e);
    x.globalAlpha = Math.min(1, k * 5) * desvanece;
    x.strokeStyle = `rgb(${Math.round(f.de[0] + (f.a[0] - f.de[0]) * c)},${Math.round(f.de[1] + (f.a[1] - f.de[1]) * c)},${Math.round(f.de[2] + (f.a[2] - f.de[2]) * c)})`;
    x.beginPath();
    const puntas = f.rombo ? 4 : 3;
    for (let j = 0; j < puntas; j++) {
      const ang = giro + (j * Math.PI * 2) / puntas;
      const rr = f.rombo && j % 2 ? tam * 0.32 : tam * 0.5;
      const qx = px + Math.cos(ang) * rr;
      const qy = py + Math.sin(ang) * rr;
      if (j === 0) x.moveTo(qx, qy);
      else x.lineTo(qx, qy);
    }
    x.closePath();
    x.stroke();
  }
  x.globalAlpha = 1;
}

/** A dónde vuela el logo: a la marca del saludo (Inicio) o, si no hay, a la del menú; la primera que se vea entera. */
function destinoVisible() {
  const entera = (e: Element) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight;
  };
  return [...document.querySelectorAll<SVGElement>(".pc .pc-saludo__marca"), ...document.querySelectorAll<SVGElement>(".pc .pc-logo__marca")].find(entera);
}

/**
 * La entrada al panel, una vez por pestaña (~1.6 s): fragmentos de todos
 * colores llegan de toda la pantalla y forman el logo de Atendel (los cuatro
 * círculos); el logo se vuelve sólido, vuela a su lugar en el panel y el
 * panel aparece detrás. Un clic o una tecla la adelantan. Con "reducir
 * movimiento" no sale.
 */
export function EntradaPanel({ alCambiar }: { alCambiar: (f: FaseEntrada) => void }) {
  const [fase, setFase] = useState<Fase>("arma");
  const [lado, setLado] = useState(104);
  const faseRef = useRef<Fase>("arma");
  const raiz = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const logo = useRef<HTMLDivElement>(null);

  const terminar = useCallback(() => {
    if (faseRef.current === "fin") return;
    faseRef.current = "fin";
    try {
      window.sessionStorage.setItem(CLAVE_ENTRADA, "1");
    } catch {
      /* sin almacenamiento: puede volver a salir */
    }
    document.querySelectorAll("[data-entrada-destino]").forEach((e) => e.removeAttribute("data-entrada-destino"));
    setFase("fin");
    alCambiar(null);
  }, [alCambiar]);

  const volar = useCallback(() => {
    if (faseRef.current !== "arma" && faseRef.current !== "funde") return;
    faseRef.current = "vuela";
    // Se mide antes de que el panel empiece a moverse: es donde va a quedar
    const destino = destinoVisible();
    const el = logo.current;
    const desde = el?.getBoundingClientRect();
    const hasta = destino?.getBoundingClientRect();
    setFase("vuela");
    alCambiar("entra");
    raiz.current?.querySelector(".pc-entrada__fondo")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 460, delay: 40, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" });
    let vuelo: Animation | undefined;
    if (el && desde && hasta && destino) {
      destino.setAttribute("data-entrada-destino", "");
      const dx = hasta.left + hasta.width / 2 - (desde.left + desde.width / 2);
      const dy = hasta.top + hasta.height / 2 - (desde.top + desde.height / 2);
      vuelo = el.animate([{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${hasta.width / desde.width})` }], {
        duration: VUELO_MS,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "forwards",
      });
    } else if (el) {
      vuelo = el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.7)" }], { duration: 420, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
    }
    // Termina cuando el logo llegó y el panel acabó de entrar
    Promise.all([vuelo?.finished, new Promise((r) => window.setTimeout(r, Math.max(VUELO_MS, PANEL_MS) + 40))]).then(terminar, terminar);
  }, [alCambiar, terminar]);

  useLayoutEffect(() => {
    let vista = document.documentElement.hasAttribute("data-entrada-vista") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      vista ||= window.sessionStorage.getItem(CLAVE_ENTRADA) !== null;
    } catch {
      vista = true;
    }
    if (vista) {
      faseRef.current = "fin";
      setFase("fin");
      alCambiar(null);
      return;
    }
    setLado(Math.round(Math.min(112, Math.max(84, Math.min(window.innerWidth, window.innerHeight) * 0.14))));
  }, [alCambiar]);

  // El reloj: dibuja los fragmentos y pasa de fase
  useEffect(() => {
    if (faseRef.current !== "arma") return;
    const c = lienzo.current;
    const x = c?.getContext("2d");
    let id = 0;
    if (c && x) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(window.innerWidth * dpr);
      c.height = Math.round(window.innerHeight * dpr);
      const fr = crearFragmentos(window.innerWidth, window.innerHeight, lado);
      const t0 = performance.now();
      const cuadro = (ahora: number) => {
        const t = (ahora - t0) / 1000;
        if (faseRef.current === "vuela" || faseRef.current === "fin") return;
        dibujar(x, fr, t, dpr);
        if (t >= FUNDE && faseRef.current === "arma") {
          faseRef.current = "funde";
          setFase("funde");
        }
        if (t >= VUELA) volar();
        else id = requestAnimationFrame(cuadro);
      };
      id = requestAnimationFrame(cuadro);
    }
    const adelantar = () => volar();
    const tope = window.setTimeout(volar, MAXIMO_MS);
    window.addEventListener("keydown", adelantar);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(tope);
      window.removeEventListener("keydown", adelantar);
    };
  }, [lado, volar]);

  if (fase === "fin") return null;
  return (
    <div ref={raiz} className="pc-entrada" data-fase={fase} aria-hidden="true" onPointerDown={volar}>
      <div className="pc-entrada__fondo" />
      <canvas ref={lienzo} className="pc-entrada__lienzo" />
      <div ref={logo} className="pc-entrada__logo" style={{ width: lado, height: lado, marginLeft: -lado / 2, marginTop: -lado / 2 }}>
        <Marca className="pc-entrada__marca" />
      </div>
    </div>
  );
}
