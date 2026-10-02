"use client";

import {
  createElement,
  Fragment,
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/**
 * Marca el elemento con data-in cuando entra a la pantalla.
 * El CSS (globals.css) se encarga de la animación.
 */
function useAlEntrar<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mostrar = () => {
      el.dataset.in = "";
    };
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      mostrar();
      return;
    }
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          mostrar();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return ref;
}

type RevealProps = {
  as?: ElementType;
  delay?: number;
  className?: string;
  id?: string;
  children: ReactNode;
};

/** Aparece suavemente (sube y se desenfoca) al hacer scroll. */
export function Reveal({ as = "div", delay = 0, className, id, children }: RevealProps) {
  const ref = useAlEntrar<HTMLElement>();
  return createElement(
    as,
    {
      ref,
      id,
      className,
      "data-reveal": "",
      style: delay ? ({ "--d": `${delay}ms` } as CSSProperties) : undefined,
    },
    children,
  );
}

type SplitProps = {
  as?: ElementType;
  text: string;
  delay?: number;
  className?: string;
  id?: string;
};

/** Titular que aparece palabra por palabra, como si saliera de una ranura. */
export function SplitText({ as = "h2", text, delay = 0, className, id }: SplitProps) {
  const ref = useAlEntrar<HTMLElement>();
  const palabras = text.split(" ");
  return createElement(
    as,
    {
      ref,
      id,
      className,
      "data-split": "",
      style: delay ? ({ "--d": `${delay}ms` } as CSSProperties) : undefined,
    },
    palabras.map((palabra, i) => (
      <Fragment key={`${palabra}-${i}`}>
        <span className="split-word">
          <span className="split-inner" style={{ "--i": i } as CSSProperties}>
            {palabra}
          </span>
        </span>
        {i < palabras.length - 1 ? " " : null}
      </Fragment>
    )),
  );
}
