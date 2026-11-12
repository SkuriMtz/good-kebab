"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject, type UIEvent } from "react";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import { Enlace } from "./Piezas";
import { PilaAgentes } from "./Mensajes";

/**
 * La conversación abierta, en el mismo lugar que el Inicio: una cabecera
 * delgada de una línea, como la de un chat normal (el título y una flechita
 * con quién está en la conversación, "Nueva" y "Borrar"), los mensajes en una
 * columna centrada de 720px que se desplaza sola y la caja fija abajo con
 * las mismas medidas que en el Inicio. La forma es la misma en /panel
 * (IA de verdad) y en /pruebalo (guion local).
 */
export type AccionConversacion = { id: string; etiqueta: string; icono: NombreIcono; href?: string; alElegir?: () => void; peligroso?: boolean };

/** React 18 no conoce `inert`: así sale como atributo vacío. */
const INERTE = { inert: "" } as unknown as { inert?: boolean };

export function Conversacion({
  agentes,
  titulo,
  sub,
  estado,
  menu = [],
  children,
  caja,
  legal,
  aviso,
  scrollRef,
  alDesplazar,
}: {
  agentes: readonly IdAgente[];
  titulo: ReactNode;
  /** Con quién es (el área o el grupo): sale arriba del menú de la flechita. */
  sub: ReactNode;
  /** Lo que sale junto al título mientras alguien escribe ("Lola está escribiendo…"). */
  estado?: ReactNode;
  /** El menú de la flechita del título. */
  menu?: AccionConversacion[];
  children: ReactNode;
  caja: ReactNode;
  legal?: ReactNode;
  /** Arriba de la caja (límite del plan, un error). */
  aviso?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement>;
  alDesplazar?: (e: UIEvent<HTMLDivElement>) => void;
}) {
  // Mientras la respuesta se va escribiendo, la vista la sigue (si estabas abajo)
  const interno = useRef<HTMLDivElement>(null);
  const vista = scrollRef ?? interno;
  const columna = useRef<HTMLDivElement>(null);
  const cerca = useRef(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cajaMenu = useRef<HTMLDivElement>(null);
  const botonMenu = useRef<HTMLButtonElement>(null);
  const idMenu = useId();
  useEffect(() => {
    if (!menuAbierto) return;
    const fuera = (e: PointerEvent) => {
      if (!cajaMenu.current?.contains(e.target as Node)) setMenuAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuAbierto(false);
      botonMenu.current?.focus();
    };
    document.addEventListener("pointerdown", fuera);
    window.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      window.removeEventListener("keydown", tecla);
    };
  }, [menuAbierto]);
  useEffect(() => {
    const el = vista.current;
    const col = columna.current;
    if (!el || !col || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (cerca.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(col);
    return () => ro.disconnect();
  }, [vista]);

  return (
    <div className="pc-conv">
      <header className="pc-conv__cabeza">
        <div ref={cajaMenu} className="pc-conv__titulo-caja">
          <button
            ref={botonMenu}
            type="button"
            className="pc-conv__titulo-boton"
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
            aria-controls={idMenu}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <span className="pc-conv__titulo">{titulo}</span>
            <Icono nombre="chevron" tam={14} />
          </button>
          <div id={idMenu} className="pc-conv__menu" role="menu" data-abierto={menuAbierto ? "" : undefined} {...(menuAbierto ? {} : INERTE)}>
            <div className="pc-conv__menu-quien">
              <PilaAgentes agentes={agentes} tam={20} />
              <span>{sub}</span>
            </div>
            {menu.map((m) => {
              const clase = `pc-conv__menu-item${m.peligroso ? " pc-conv__menu-item--peligro" : ""}`;
              const elegir = () => {
                setMenuAbierto(false);
                m.alElegir?.();
              };
              const dentro = (
                <>
                  <Icono nombre={m.icono} tam={16} />
                  {m.etiqueta}
                </>
              );
              return m.href ? (
                <Enlace key={m.id} href={m.href} role="menuitem" className={clase} onClick={elegir}>
                  {dentro}
                </Enlace>
              ) : (
                <button key={m.id} type="button" role="menuitem" className={clase} onClick={elegir}>
                  {dentro}
                </button>
              );
            })}
          </div>
        </div>
        <p className="pc-conv__estado" aria-live="polite">
          {estado}
        </p>
      </header>
      <div
        ref={vista}
        className="pc-conv__mensajes"
        data-lenis-prevent
        onScroll={(e) => {
          const el = e.currentTarget;
          cerca.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
          alDesplazar?.(e);
        }}
      >
        <div ref={columna} className="pc-conv__columna">
          {children}
        </div>
      </div>
      <div className="pc-conv__pie">
        {aviso ? <div className="pc-conv__aviso">{aviso}</div> : null}
        <div className="pc-conv__caja">{caja}</div>
        {legal ? <p className="pc-conv__legal">{legal}</p> : null}
      </div>
    </div>
  );
}
