"use client";

import { cloneElement, createElement, isValidElement, useEffect, useRef, type ReactElement, type ReactNode } from "react";

/**
 * El texto aparece como en Dala cuando llega a la pantalla:
 * - Los títulos suben línea por línea, cada línea saliendo de abajo de una "ranura".
 * - Los párrafos se van pintando línea por línea, de izquierda a derecha.
 * Uso: <Revela><h2>…</h2><p>…</p></Revela>. Solo parte el texto de etiquetas
 * HTML (h2, p, em, strong…); los componentes (botones, enlaces) aparecen con un fundido.
 * Con "reducir movimiento", el texto ya está.
 */

const TITULOS = new Set(["h1", "h2", "h3", "h4"]);

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
  if (isValidElement(nodo) && typeof nodo.type === "string" && nodo.type !== "br") {
    const el = nodo as ReactElement<{ children?: ReactNode; className?: string }>;
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
    // Un componente (un botón, un enlace): aparece con un fundido al final
    return (
      <span key={clave} className="rv-bloque">
        {nodo}
      </span>
    );
  }
  return nodo;
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.rv = "on";
      return;
    }
    el.dataset.rv = el.dataset.rv === "on" ? "on" : "off";

    // Numera las líneas (y dónde empieza cada palabra en su línea) para el orden de aparición
    const numerar = () => {
      if (el.dataset.rv === "on") return;
      const caja = el.getBoundingClientRect();
      let linea = -1;
      let arribaLinea = -Infinity;
      el.querySelectorAll<HTMLElement>(".rv-w, .rv-p, .rv-bloque").forEach((p) => {
        const r = p.getBoundingClientRect();
        if (Math.abs(r.top - arribaLinea) > r.height * 0.5) {
          linea++;
          arribaLinea = r.top;
        }
        p.style.setProperty("--rv-l", String(linea));
        p.style.setProperty("--rv-x", caja.width ? ((r.left - caja.left) / caja.width).toFixed(3) : "0");
      });
    };
    numerar();
    document.fonts?.ready.then(numerar);
    window.addEventListener("resize", numerar);

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.rv = "on";
        io.disconnect();
        window.removeEventListener("resize", numerar);
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("resize", numerar);
    };
  }, []);

  return createElement(como, { ref, className, id, "data-revela": "" }, partir(children, false, "r"));
}
