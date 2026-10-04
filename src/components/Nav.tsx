"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { BotonTema } from "./BotonTema";
import { Logo } from "./Logo";
import { PERSONAJES, Personaje } from "./agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";

export type NavItem = { href: string; label: string };
export type Reparto = { id: IdAgente; nombre: string; papel: string; href: string };

type Props = {
  items: NavItem[];
  /** El enlace más importante (el chat): el botón azul, siempre a la vista. */
  destacado?: NavItem;
  homeHref?: string;
  /** Lo que va a la derecha en computadora (ej. "Entrar"). */
  desktopRight?: ReactNode;
  /** Lo que va abajo del menú en celular. */
  mobileBottom?: ReactNode;
  /** Los agentes, dentro del menú del celular. */
  reparto?: Reparto[];
};

function IconoMenu({ abierto }: { abierto: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      {abierto ? (
        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      ) : (
        <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      )}
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-tenue" fill="none" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Barra de arriba, fija al hacer scroll:
 * - Computadora: logo a la izquierda, páginas al centro y, a la derecha,
 *   las acciones, el chat (botón azul) y el modo claro/oscuro.
 * - Celular y tablet: logo, el chat (botón azul) y el botón de menú; el menú
 *   es una hoja debajo de la barra con las páginas, los agentes y el modo.
 */
export function Nav({ items, destacado, homeHref = "/", desktopRight, mobileBottom, reparto }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [sombra, setSombra] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // La barra marca su orilla cuando ya bajaste
  useEffect(() => {
    const actualizar = () => setSombra(window.scrollY > 4);
    actualizar();
    window.addEventListener("scroll", actualizar, { passive: true });
    return () => window.removeEventListener("scroll", actualizar);
  }, []);

  // Cerrar el menú al cambiar de página
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  // Con el menú abierto: sin scroll detrás, Escape lo cierra y el foco va al primer enlace
  useEffect(() => {
    if (!abierto) return;
    const html = document.documentElement;
    const overflowPrevio = html.style.overflow;
    html.style.overflow = "hidden";
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        botonRef.current?.focus();
      }
    };
    // Si la pantalla crece a computadora, el menú ya no hace falta
    const computadora = window.matchMedia("(min-width: 1024px)");
    const alCrecer = () => computadora.matches && setAbierto(false);
    window.addEventListener("keydown", alTeclear);
    computadora.addEventListener("change", alCrecer);
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", alTeclear);
      computadora.removeEventListener("change", alCrecer);
    };
  }, [abierto]);

  // La ficha de un agente se abre aquí mismo si la página puede; los enlaces a secciones bajan suave
  const alElegir = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    const ficha = href.match(/[?&]ficha=([a-z]+)/)?.[1];
    if (ficha && document.documentElement.hasAttribute("data-fichas")) {
      e.preventDefault();
      setAbierto(false);
      window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: ficha }));
      return;
    }
    const gato = href.indexOf("#");
    if (gato === -1) {
      setAbierto(false);
      return;
    }
    const ruta = href.slice(0, gato) || pathname;
    if (ruta !== pathname) return;
    const destino = document.getElementById(href.slice(gato + 1));
    if (!destino) return;
    e.preventDefault();
    setAbierto(false);
    window.setTimeout(() => {
      const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      destino.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" });
      window.history.replaceState(null, "", `#${destino.id}`);
    }, 0);
  };

  const actual = (href: string) => (pathname === href ? "page" : undefined);

  return (
    <>
      <header className="barra" data-sombra={sombra ? "true" : "false"} data-abierto={abierto ? "true" : "false"}>
        <div className="barra__fila">
          <Link href={homeHref} className="flex min-h-[44px] shrink-0 items-center" aria-label="Atendel, inicio">
            <Logo />
          </Link>

          <nav className="barra__enlaces" aria-label="Principal">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="barra__enlace"
                aria-current={actual(item.href)}
                onClick={(e) => alElegir(e, item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="barra__acciones">
            {desktopRight ? <div className="hidden items-center gap-2 lg:flex">{desktopRight}</div> : null}
            {destacado ? (
              <Link href={destacado.href} className="btn btn--primario !px-3.5 sm:!px-4" aria-current={actual(destacado.href)}>
                {destacado.label}
              </Link>
            ) : null}
            <BotonTema className="hidden lg:inline-grid" />
            <button
              ref={botonRef}
              type="button"
              className="boton-icono lg:hidden"
              aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={abierto}
              aria-controls="menu-movil"
              onClick={() => setAbierto((a) => !a)}
            >
              <IconoMenu abierto={abierto} />
            </button>
          </div>
        </div>
      </header>

      <div id="menu-movil" ref={menuRef} className="menu-movil" data-abierto={abierto ? "true" : "false"} aria-hidden={!abierto}>
        <nav aria-label="Menú">
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="menu-movil__enlace" aria-current={actual(item.href)} onClick={(e) => alElegir(e, item.href)}>
                  {item.label}
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {reparto?.length ? (
          <>
            <p className="menu-movil__titulo">Los agentes</p>
            <ul>
              {reparto.map((r) => (
                <li key={r.id}>
                  <Link href={r.href} className="menu-movil__agente" onClick={(e) => alElegir(e, r.href)}>
                    <span className="marca-agente marca-agente--chica" style={{ "--agente": PERSONAJES[r.id].color } as CSSProperties}>
                      <Personaje agente={r.id} avatar />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{r.nombre}</span>
                      <span className="block truncate text-[0.875rem] text-tenue">{r.papel}</span>
                    </span>
                    <Chevron />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {(mobileBottom ?? desktopRight) ? <div className="mt-8 flex flex-col gap-3">{mobileBottom ?? desktopRight}</div> : null}
        <div className="mt-6">
          <BotonTema conTexto />
        </div>
      </div>
    </>
  );
}
