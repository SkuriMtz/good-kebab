"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cloneElement, createElement, isValidElement, useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { CON_MOVIMIENTO, CURVA, DUR, ENTRADA_MAXIMA, ESCALONADO, SIN_MOVIMIENTO, esperarLetras, prepararGsap } from "@/lib/movimiento";

/**
 * El texto aparece como en Dala cuando llega a la pantalla, en una sola
 * secuencia corta (GSAP, una sola vez):
 * - Cada bloque entra en orden: etiqueta → título → párrafo → formulario.
 * - Los títulos suben línea por línea, cada línea saliendo de su "ranura".
 * - Los párrafos se pintan línea por línea, de izquierda a derecha.
 * - Los componentes (botones, formularios) y lo marcado con data-rv-unidad
 *   entran completos: fundido y 12px hacia arriba.
 * La secuencia completa dura menos de 1.2 s (ENTRADA_MAXIMA).
 * Uso: <Revela><h2>…</h2><p>…</p></Revela>. Con "reducir movimiento", el texto ya está.
 */

const TITULOS = new Set(["h1", "h2", "h3", "h4"]);
const PIEZAS = ".rv-i, .rv-w, .rv-bloque, [data-rv-unidad]";

type Props = { children?: ReactNode; className?: string; "data-rv-unidad"?: unknown };

function partir(nodo: ReactNode, titulo: boolean, clave: string): ReactNode {
  if (typeof nodo === "string") {
    return nodo.split(/(\s+)/).map((pedazo, i) => {
      if (!pedazo) return null;
      if (/^\s+$/.test(pedazo)) return pedazo;
      return titulo ? (
        <span key={clave + i} className="rv-p">
          <span className="rv-i">{pedazo}</span>
        </span>
      ) : (
        <span key={clave + i} className="rv-w">
          {pedazo}
        </span>
      );
    });
  }
  if (Array.isArray(nodo)) return nodo.map((n, i) => partir(n, titulo, `${clave}${i}-`));
  if (isValidElement(nodo) && nodo.type === "br") return nodo;
  if (isValidElement(nodo) && typeof nodo.type === "string") {
    const el = nodo as ReactElement<Props>;
    // Una pieza marcada entra completa, sin partir su texto
    if (el.props["data-rv-unidad"] !== undefined) return cloneElement(el, { key: el.key ?? clave });
    // Un botón aparece completo, con un fundido
    if (/(^|\s)btn(\s|$)/.test(el.props.className ?? "")) {
      return (
        <span key={clave} className="rv-bloque">
          {el}
        </span>
      );
    }
    const esTitulo = titulo || TITULOS.has(el.type as string);
    return cloneElement(el, { key: el.key ?? clave }, partir(el.props.children, esTitulo, clave));
  }
  if (isValidElement(nodo)) {
    // Un componente (un botón, un enlace, un formulario): aparece completo
    return (
      <span key={clave} className="rv-bloque">
        {nodo}
      </span>
    );
  }
  return nodo;
}

type Linea = { piezas: HTMLElement[]; x: number[] };

/** Agrupa las piezas de un bloque por renglón y mide dónde empieza cada una (0 = izquierda, 1 = derecha). */
function medir(piezas: HTMLElement[], caja: DOMRect): Linea[] {
  const lineas: Linea[] = [];
  let arriba = -Infinity;
  for (const p of piezas) {
    // La palabra de un título está corrida hacia abajo: se mide su ranura
    const r = (p.classList.contains("rv-i") ? (p.parentElement ?? p) : p).getBoundingClientRect();
    if (!lineas.length || Math.abs(r.top - arriba) > r.height * 0.5) {
      lineas.push({ piezas: [], x: [] });
      arriba = r.top;
    }
    const linea = lineas[lineas.length - 1];
    linea.piezas.push(p);
    linea.x.push(caja.width ? Math.min(1, Math.max(0, (r.left - caja.left) / caja.width)) : 0);
  }
  return lineas;
}

/** Arma la secuencia de entrada: un bloque tras otro, cada uno por renglones. */
function secuencia(raiz: HTMLElement) {
  const todas = Array.from(raiz.querySelectorAll<HTMLElement>(PIEZAS));
  // Primero se mide todo (lecturas) y después se escribe (GSAP): sin saltos de diseño
  const caja = raiz.getBoundingClientRect();
  const plan = (Array.from(raiz.children) as HTMLElement[])
    .map((bloque) => medir(bloque.matches(PIEZAS) ? [bloque] : Array.from(bloque.querySelectorAll<HTMLElement>(PIEZAS)), caja))
    .filter((lineas) => lineas.length);

  const tl = gsap.timeline({
    defaults: { ease: CURVA.entrada },
    paused: true,
    onComplete: () => {
      gsap.set(todas, { clearProps: "transform,opacity" });
    },
  });
  let t = 0;
  for (const lineas of plan) {
    let espera = 0.1;
    lineas.forEach(({ piezas, x }, l) => {
      const titulos = piezas.filter((p) => p.classList.contains("rv-i"));
      const palabras = piezas.filter((p) => p.classList.contains("rv-w"));
      const xPalabras = x.filter((_, i) => piezas[i].classList.contains("rv-w"));
      const bloques = piezas.filter((p) => !p.classList.contains("rv-i") && !p.classList.contains("rv-w"));
      if (titulos.length) {
        // Título: cada renglón sube de su ranura, 80 ms después del anterior
        tl.fromTo(titulos, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: DUR.titulo }, t + l * 0.08);
        espera = 0.1 + l * 0.06;
      }
      if (palabras.length) {
        // Párrafo: cada renglón se pinta de izquierda a derecha; todo el párrafo, en menos de 0.25 s de diferencia
        tl.fromTo(
          palabras,
          { opacity: 0 },
          { opacity: 1, duration: DUR.entradaCorta, ease: CURVA.estado, stagger: (i: number) => xPalabras[i] * 0.1 },
          t + Math.min(l * 0.05, 0.15),
        );
      }
      if (bloques.length) {
        tl.fromTo(bloques, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: DUR.entrada, stagger: ESCALONADO }, t + l * ESCALONADO);
      }
    });
    t += espera;
  }
  // Nunca más larga que ENTRADA_MAXIMA: si un texto es muy largo, se acelera parejo
  if (tl.duration() > ENTRADA_MAXIMA) tl.timeScale(tl.duration() / ENTRADA_MAXIMA);
  return tl;
}

export function Revela({
  children,
  className,
  como = "div",
  id,
}: {
  children: ReactNode;
  className?: string;
  como?: "div" | "header" | "li";
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    prepararGsap();
    const mm = gsap.matchMedia();
    mm.add(SIN_MOVIMIENTO, () => {
      el.dataset.rv = "on";
    });
    mm.add(CON_MOVIMIENTO, () => {
      if (el.dataset.rv === "on") return;
      // Escondido por CSS mientras llega a la pantalla (sin el rescate de 4 s: aquí ya hay JavaScript)
      el.dataset.rv = "off";
      let tl: gsap.core.Timeline | null = null;
      let vivo = true;
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          // Con las letras ya puestas y dos cuadros después (lo pesado de la carga ya pasó),
          // para que la secuencia no se coma sus primeros cuadros
          esperarLetras().then(() =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                if (!vivo) return;
                // CSS suelta su estado escondido y GSAP pone el suyo en el mismo cuadro (sin parpadeo)
                el.dataset.rv = "on";
                tl = secuencia(el);
                tl.play();
              }),
            ),
          );
        },
      });
      return () => {
        vivo = false;
        st.kill();
        if (tl) tl.progress(1).kill();
        else delete el.dataset.rv;
      };
    });
    return () => mm.revert();
  }, []);

  return createElement(como, { ref, className, id, "data-revela": "" }, partir(children, false, "r"));
}
