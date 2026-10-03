"use client";

import { isValidElement, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import "./BranchedMenu.css";

export type BranchedMenuChild = { value: string; label: string; icon?: IconSvgElement | ReactElement };
export type BranchedMenuItem = { label: string; value?: string; children?: BranchedMenuChild[] };

type Props = {
  items: BranchedMenuItem[];
  defaultOpen?: number | number[];
  defaultActive?: string;
  /** Opcional: quién manda el elemento activo desde afuera (p. ej. la sección en pantalla). */
  active?: string;
  onSelect?: (value: string, item: BranchedMenuChild | BranchedMenuItem) => void;
  onToggle?: (index: number, open: boolean) => void;
  color?: string;
  accentColor?: string;
  lineColor?: string;
  width?: number;
  rowHeight?: number;
  indent?: number;
  trunk?: number;
  radius?: number;
  lineWidth?: number;
  fontSize?: number;
  drawDuration?: number;
  foldDuration?: number;
  className?: string;
};

type Variables = CSSProperties & Record<`--${string}`, string | number>;

const PAD = 6;
const MARK = 16;

const renderIcon = (icon: IconSvgElement | ReactElement) =>
  isValidElement(icon) ? icon : <HugeiconsIcon icon={icon as IconSvgElement} size={16} strokeWidth={1.8} />;
const toSet = (open: number | number[]) => new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);

/**
 * BranchedMenu de React Bits: secciones que se despliegan como ramas, con una
 * línea que viaja hasta el elemento activo. Agregado para Atendel: `active`,
 * para que la sección en pantalla marque el menú.
 */
export default function BranchedMenu({
  items,
  defaultOpen = 0,
  defaultActive = "",
  active: activeProp,
  onSelect,
  onToggle,
  color = "#f5f5f5",
  accentColor = "#f5f5f5",
  lineColor = "#3f3f46",
  width = 240,
  rowHeight = 36,
  indent = 40,
  trunk = 14,
  radius = 10,
  lineWidth = 1.5,
  fontSize = 14,
  drawDuration = 400,
  foldDuration = 300,
  className = "",
}: Props) {
  const [open, setOpen] = useState(() => toSet(defaultOpen));
  const [active, setActive] = useState(() => {
    if (activeProp) return activeProp;
    if (defaultActive) return defaultActive;
    const first = items.find((it, i) => it.children && toSet(defaultOpen).has(i));
    return first?.children?.[0]?.value ?? "";
  });
  const navRef = useRef<HTMLElement>(null);
  const heads = useRef<(HTMLButtonElement | null)[]>([]);
  const markerRef = useRef<HTMLSpanElement>(null);
  const latest = useRef({ onSelect, onToggle });
  latest.current = { onSelect, onToggle };

  // Si el activo cambia desde afuera, se marca y se abre su sección
  useEffect(() => {
    if (activeProp === undefined) return;
    setActive(activeProp);
    const i = items.findIndex((it) => it.children?.some((kid) => kid.value === activeProp));
    if (i >= 0) setOpen((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  }, [activeProp, items]);

  const activeSection = items.findIndex((it) => it.children?.some((kid) => kid.value === active));
  const markerShown = activeSection >= 0 && open.has(activeSection);
  useLayoutEffect(() => {
    const place = (glide: boolean) => {
      const m = markerRef.current;
      const el = heads.current[activeSection];
      if (!m) return;
      const on = markerShown && el;
      if (!glide) m.style.transition = "none";
      if (on) m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`;
      m.toggleAttribute("data-on", Boolean(on));
      if (!glide) {
        void m.offsetHeight;
        m.style.transition = "";
      }
    };
    place(true);
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      place(false);
    });
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [activeSection, markerShown, items, fontSize, rowHeight]);

  const select = (value: string, item: BranchedMenuChild | BranchedMenuItem) => {
    setActive(value);
    latest.current.onSelect?.(value, item);
  };
  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      const isOpen = !next.has(i);
      if (isOpen) next.add(i);
      else next.delete(i);
      latest.current.onToggle?.(i, isOpen);
      return next;
    });
  };

  const r = Math.min(radius, rowHeight / 2 - 2);
  const endX = indent - 8;
  const rowY = (k: number) => PAD + k * rowHeight + rowHeight / 2;
  const branch = (k: number) => `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const reach = (k: number) => `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const length = (k: number) => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r);

  const vars: Variables = {
    "--bm-w": `${width}px`,
    "--bm-ink": color,
    "--bm-accent": accentColor,
    "--bm-line": lineColor,
    "--bm-font": `${fontSize}px`,
    "--bm-row": `${rowHeight}px`,
    "--bm-indent": `${indent}px`,
    "--bm-line-w": lineWidth,
    "--bm-draw": `${drawDuration}ms`,
    "--bm-fold": `${foldDuration}ms`,
  };

  return (
    <nav ref={navRef} className={`branched-menu${className ? ` ${className}` : ""}`} style={vars}>
      <span ref={markerRef} className="branched-menu__marker" aria-hidden="true" />
      {items.map((item, i) => {
        const kids = item.children;
        const isOpen = kids ? open.has(i) : false;
        const leafValue = item.value ?? item.label;
        const leafActive = !kids && leafValue === active;
        const bodyH = kids ? PAD * 2 + kids.length * rowHeight : 0;
        return (
          <div key={item.value ?? item.label} className="branched-menu__section" data-open={isOpen ? "" : undefined}>
            <button
              ref={(el) => {
                heads.current[i] = el;
              }}
              type="button"
              className="branched-menu__head"
              aria-expanded={kids ? isOpen : undefined}
              aria-current={leafActive ? "true" : undefined}
              data-active={leafActive ? "" : undefined}
              onClick={() => (kids ? toggle(i) : select(leafValue, item))}
            >
              {item.label}
            </button>
            {kids ? (
              <div className="branched-menu__body">
                <div className="branched-menu__fold">
                  <div className="branched-menu__tree" style={{ height: bodyH }}>
                    <svg className="branched-menu__lines" width={indent} height={bodyH} aria-hidden="true">
                      <path className="branched-menu__base" d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`} />
                      {kids.map((kid, k) => (
                        <path key={kid.value} className="branched-menu__base" d={branch(k)} />
                      ))}
                      {kids.map((kid, k) => (
                        <path
                          key={kid.value}
                          className="branched-menu__reach"
                          d={reach(k)}
                          style={{
                            strokeDasharray: length(k),
                            strokeDashoffset: kid.value === active ? 0 : length(k),
                          }}
                        />
                      ))}
                    </svg>
                    {kids.map((kid) => (
                      <button
                        key={kid.value}
                        type="button"
                        className="branched-menu__item"
                        aria-current={kid.value === active ? "true" : undefined}
                        data-active={kid.value === active ? "" : undefined}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => select(kid.value, kid)}
                      >
                        {kid.icon ? (
                          <span className="branched-menu__icon" aria-hidden="true">
                            {renderIcon(kid.icon)}
                          </span>
                        ) : null}
                        <span className="branched-menu__label">{kid.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
