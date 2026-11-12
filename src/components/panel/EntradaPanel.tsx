"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MARCA_SVG, Marca } from "@/components/Logo";
import { GlassIconReveal, finalLogoShare } from "@/components/ui/liquid-glass-logo-reveal";
import { CLAVE_ENTRADA } from "@/lib/entrada";
import { temaActual } from "@/lib/tema";

/** "espera": el panel está escondido detrás; "entra": el panel aparece; null: ya pasó. */
export type FaseEntrada = "espera" | "entra" | null;

const TILE = 240;
const VELOCIDAD = 1.25;
/** Una pausa corta con el logo ya armado antes de que vuele. */
const PAUSA_MS = 260;
const VUELO_MS = 880;
/** Si algo falla (sin WebGL, el logo no carga), el panel entra de todos modos. */
const MAXIMO_MS = 5600;
/** La marca ocupa 82 de 100 en su viewBox (los círculos van de 9 a 91). */
const MARCA_CAJA = 0.82;

/** A dónde vuela el logo: a la marca del saludo (Inicio) o, si no hay, a la del menú; la primera que se vea entera. */
function destinoVisible() {
  const entera = (e: Element) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight;
  };
  return [...document.querySelectorAll<SVGElement>(".pc .pc-saludo__marca"), ...document.querySelectorAll<SVGElement>(".pc .pc-logo__marca")].find(entera);
}

/**
 * La entrada al panel, una vez por pestaña: el logo de Atendel (los cuatro
 * círculos) se arma en vidrio; luego vuela a su lugar en el panel mientras el
 * fondo se desvanece y el panel aparece detrás. Un clic o una tecla la
 * adelantan. Con "reducir movimiento" no sale.
 */
export function EntradaPanel({ alCambiar }: { alCambiar: (f: FaseEntrada) => void }) {
  const [fase, setFase] = useState<"revela" | "vuela" | "fin">("revela");
  const [look, setLook] = useState<"dark" | "light">("dark");
  const [tile, setTile] = useState(TILE);
  const faseRef = useRef<"revela" | "vuela" | "fin">("revela");
  const raiz = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLDivElement>(null);
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
    if (faseRef.current !== "revela") return;
    faseRef.current = "vuela";
    // Se mide antes de que el panel empiece a moverse: es donde va a quedar
    const destino = destinoVisible();
    const el = logo.current;
    const desde = el?.getBoundingClientRect();
    const hasta = destino?.getBoundingClientRect();
    setFase("vuela");
    alCambiar("entra");
    raiz.current?.querySelector(".pc-entrada__fondo")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 620, delay: 120, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" });
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
      vuelo = el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.7)" }], { duration: 520, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
    }
    // Termina cuando el logo llegó y el panel acabó de entrar
    Promise.all([vuelo?.finished, new Promise((r) => window.setTimeout(r, VUELO_MS + 40))]).then(terminar, terminar);
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
    setLook(temaActual() === "claro" ? "light" : "dark");
    const c = caja.current;
    if (c) setTile(Math.min(TILE, Math.min(c.clientWidth, c.clientHeight) / 1.75));
  }, [alCambiar]);

  useEffect(() => {
    if (faseRef.current !== "revela") return;
    const adelantar = () => volar();
    const tope = window.setTimeout(volar, MAXIMO_MS);
    window.addEventListener("keydown", adelantar);
    return () => {
      window.clearTimeout(tope);
      window.removeEventListener("keydown", adelantar);
    };
  }, [volar]);

  if (fase === "fin") return null;
  const lado = (finalLogoShare(look) * tile) / MARCA_CAJA;
  return (
    <div ref={raiz} className="pc-entrada" data-fase={fase} aria-hidden="true" onPointerDown={volar}>
      <div className="pc-entrada__fondo" />
      <div ref={caja} className="pc-entrada__caja">
        <GlassIconReveal
          className="pc-entrada__vidrio"
          logo={MARCA_SVG}
          label="Atendel"
          look={look}
          originalColors
          loop={false}
          speed={VELOCIDAD}
          tileSize={TILE}
          replayOnClick={false}
          onEnd={() => window.setTimeout(volar, PAUSA_MS)}
        />
        <div ref={logo} className="pc-entrada__logo" style={{ width: lado, height: lado, marginLeft: -lado / 2, marginTop: -lado / 2 }}>
          <Marca className="pc-entrada__marca" />
        </div>
      </div>
    </div>
  );
}
