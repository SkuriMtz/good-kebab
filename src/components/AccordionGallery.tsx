"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { gsap } from "gsap";
import "./AccordionGallery.css";

export type AccordionItem = {
  /** Imagen del panel (como el original)… */
  image?: string;
  /** …o, agregado para Atendel, cualquier contenido (aquí, el personaje del agente). */
  content?: ReactNode;
  label?: string;
  /** Agregado: texto que aparece debajo del nombre en el panel abierto. */
  caption?: ReactNode;
  /** Agregado: etiqueta vertical que se lee en los paneles cerrados. */
  railLabel?: string;
  link?: string;
  alt?: string;
};

type Props = {
  items: AccordionItem[];
  defaultIndex?: number;
  accentColor?: string;
  overlayColor?: string;
  textColor?: string;
  height?: number;
  gap?: number;
  radius?: number;
  expandRatio?: number;
  orientation?: "horizontal" | "vertical";
  duration?: number;
  ease?: string;
  parallax?: number;
  tilt?: number;
  stagger?: number;
  trigger?: "hover" | "click";
  showLabels?: boolean;
  grayscale?: boolean;
  /** Agregado: cuánto se oscurecen los paneles cerrados (0 = nada). */
  dim?: number;
  className?: string;
  ariaLabel?: string;
  /** Agregado: clic (o Enter) sobre el panel ya abierto. */
  onOpen?: (index: number) => void;
};

type Variables = CSSProperties & Record<`--${string}`, string>;

/**
 * AccordionGallery de React Bits: paneles que se expanden al pasar el mouse.
 * Cambios para Atendel: acepta contenido en lugar de imagen, el texto del
 * panel abierto puede tener una frase, los cerrados muestran una etiqueta
 * vertical y el clic sobre el panel abierto llama a `onOpen`.
 */
export default function AccordionGallery({
  items,
  defaultIndex = 2,
  accentColor = "#ffffff",
  overlayColor = "#060010",
  textColor = "#ffffff",
  height = 460,
  gap = 10,
  radius = 16,
  expandRatio = 0.52,
  orientation = "horizontal",
  duration = 0.6,
  ease = "power3.out",
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  trigger = "hover",
  showLabels = true,
  grayscale = true,
  dim = 0.35,
  className = "",
  ariaLabel = "Galería",
  onOpen,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const railRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const firstRunRef = useRef(true);
  const mediaSizeRef = useRef(320);
  // Al tocar, el foco abre el panel antes del clic: recordamos si ya estaba abierto al presionar
  const yaAbiertoRef = useRef(false);

  const vertical = orientation === "vertical";
  const count = items.length;
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), count - 1));

  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const applyLayout = useCallback(
    (animate: boolean) => {
      const panels = panelRefs.current;
      if (!panels.length) return;

      const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
      const mediaSize = mediaSizeRef.current;

      tlRef.current?.kill();
      const dur = animate && !prefersReduced ? duration : 0;
      const tl = gsap.timeline();

      panels.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === active;
        const media = mediaRefs.current[i];
        const bar = barRefs.current[i];
        const text = textRefs.current[i];
        const rail = railRefs.current[i];

        const rot = isActive ? 0 : i < active ? tilt : -tilt;
        const rotProp = vertical ? { rotateX: -rot } : { rotateY: rot };

        // --ag-dim va en el panel (el original lo ponía en la imagen, donde el velo no lo alcanzaba)
        tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, "--ag-dim": isActive ? 0 : dim, duration: dur, ease }, 0);

        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i));
          const shift = drift * parallax * mediaSize * 0.06;
          const gray = grayscale ? (isActive ? 0 : 1) : 0;
          tl.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: vertical ? 0 : isActive ? 0 : shift,
              y: vertical ? (isActive ? 0 : shift) : 0,
              "--ag-gray": gray,
              duration: dur,
              ease,
            },
            0,
          );
        }

        if (showLabels && bar && text) {
          if (isActive) {
            tl.to([bar, text], { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : stagger }, 0);
          } else {
            tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0);
          }
        }
        if (rail) tl.to(rail, { opacity: isActive ? 0 : 1, duration: dur * 0.6, ease }, 0);
      });

      tlRef.current = tl;
    },
    [active, count, expandRatio, duration, ease, vertical, tilt, parallax, grayscale, dim, showLabels, stagger, prefersReduced],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = vertical ? rect.height : rect.width;
      const usable = Math.max(total - gap * (count - 1), 120);
      const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22);
      mediaSizeRef.current = size;
      el.style.setProperty("--ag-media-size", `${size}px`);
      applyLayout(!firstRunRef.current);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyLayout, gap, count, expandRatio, vertical]);

  useEffect(() => {
    applyLayout(!firstRunRef.current);
    firstRunRef.current = false;
  }, [applyLayout]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    [],
  );

  const handleEnter = (i: number) => {
    if (trigger === "hover") setActive(i);
  };

  const handleClick = (i: number, e: MouseEvent) => {
    if (i !== active || !yaAbiertoRef.current) {
      e.preventDefault();
      setActive(i);
    } else if (onOpen) {
      e.preventDefault();
      onOpen(i);
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (i + 1) % count;
      setActive(next);
      panelRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (i - 1 + count) % count;
      setActive(prev);
      panelRefs.current[prev]?.focus();
    } else if ((e.key === "Enter" || e.key === " ") && onOpen) {
      e.preventDefault();
      setActive(i);
      onOpen(i);
    }
  };

  const vars: Variables = {
    "--ag-accent": accentColor,
    "--ag-overlay": overlayColor,
    "--ag-text": textColor,
    "--ag-gap": `${gap}px`,
    "--ag-radius": `${radius}px`,
    height: vertical ? `${Math.round(height * 1.6)}px` : `${height}px`,
  };

  return (
    <div
      ref={rootRef}
      className={`accordion-gallery${vertical ? " accordion-gallery--vertical" : ""}${className ? ` ${className}` : ""}`}
      style={vars}
      role="list"
      aria-label={ariaLabel}
    >
      {items.map((item, i) => {
        const isActive = i === active;
        const Tag = item.link ? "a" : "div";
        return (
          <Tag
            key={i}
            ref={(el: HTMLElement | null) => {
              panelRefs.current[i] = el;
            }}
            className={`ag-panel${isActive ? " ag-panel--active" : ""}`}
            style={{ borderRadius: `${radius}px` }}
            href={item.link || undefined}
            onClick={(e: MouseEvent) => handleClick(i, e)}
            onMouseEnter={() => handleEnter(i)}
            onPointerDown={() => {
              yaAbiertoRef.current = i === active;
            }}
            onFocus={() => setActive(i)}
            onKeyDown={(e: KeyboardEvent) => handleKeyDown(i, e)}
            role="listitem"
            tabIndex={0}
            aria-current={isActive ? "true" : undefined}
            aria-label={item.label}
          >
            <span className="ag-panel__frame">
              <span className="ag-panel__media" ref={(el) => void (mediaRefs.current[i] = el)}>
                {item.content ?? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.alt || item.label || ""} draggable="false" />
                )}
              </span>
              <span className="ag-panel__overlay" aria-hidden="true" />
            </span>
            {item.railLabel ? (
              <span className="ag-panel__rail" aria-hidden="true" ref={(el) => void (railRefs.current[i] = el)}>
                {item.railLabel}
              </span>
            ) : null}
            {showLabels && (
              <span className="ag-panel__label" aria-hidden="true">
                <span className="ag-panel__bar" ref={(el) => void (barRefs.current[i] = el)} />
                <span className="ag-panel__text" ref={(el) => void (textRefs.current[i] = el)}>
                  <span className="ag-panel__name">{item.label}</span>
                  {item.caption ? <span className="ag-panel__caption">{item.caption}</span> : null}
                </span>
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
