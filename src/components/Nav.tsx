"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Logo } from "./Logo";

export type NavItem = { href: string; label: string };

type Props = {
  items: NavItem[];
  homeHref?: string;
  /** Lo que va a la derecha en computadora (ej. el botón "Entrar"). */
  desktopRight?: ReactNode;
  /** Lo que va abajo del menú en celular. */
  mobileBottom?: ReactNode;
};

/**
 * Barra de navegación:
 * - Transparente arriba; se vuelve negra al bajar.
 * - Se esconde al bajar y reaparece al subir.
 * - En celular, un menú de pantalla completa que se abre como un círculo.
 */
export function Nav({ items, homeHref = "/", desktopRight, mobileBottom }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [oculta, setOculta] = useState(false);
  const [conFondo, setConFondo] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Mostrar/ocultar al hacer scroll
  useEffect(() => {
    let anterior = window.scrollY;
    let pendiente = false;
    const actualizar = () => {
      const y = window.scrollY;
      setConFondo(y > 8);
      if (Math.abs(y - anterior) > 6) {
        setOculta(y > anterior && y > 180);
        anterior = y;
      }
      pendiente = false;
    };
    const alHacerScroll = () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(actualizar);
      }
    };
    actualizar();
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    return () => window.removeEventListener("scroll", alHacerScroll);
  }, []);

  // Cerrar el menú al cambiar de página
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  // Con el menú abierto: bloquear el scroll, cerrar con Escape y enfocar el primer enlace
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
    window.addEventListener("keydown", alTeclear);
    const t = window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
    }, 380);
    return () => {
      html.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", alTeclear);
      window.clearTimeout(t);
    };
  }, [abierto]);

  const alternar = () => {
    // El círculo del menú crece desde el centro del botón
    const boton = botonRef.current;
    const menu = menuRef.current;
    if (boton && menu) {
      const r = boton.getBoundingClientRect();
      menu.style.setProperty("--mx", `${r.left + r.width / 2}px`);
      menu.style.setProperty("--my", `${r.top + r.height / 2}px`);
    }
    setAbierto((a) => !a);
  };

  // Enlaces a secciones de esta misma página: cerrar el menú y luego desplazarse suave
  const alElegir = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    const gato = href.indexOf("#");
    if (gato === -1) return;
    const ruta = href.slice(0, gato) || pathname;
    if (ruta !== pathname) return;
    const destino = document.getElementById(href.slice(gato + 1));
    if (!destino) return;
    e.preventDefault();
    const estabaAbierto = abierto;
    setAbierto(false);
    window.setTimeout(
      () => {
        const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        destino.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" });
        window.history.replaceState(null, "", `#${destino.id}`);
      },
      estabaAbierto ? 60 : 0,
    );
  };

  return (
    <>
      <header
        className="nav fixed inset-x-0 top-0 z-50"
        data-hidden={oculta && !abierto ? "true" : "false"}
        data-scrolled={conFondo && !abierto ? "true" : "false"}
      >
        <div className="mx-auto flex h-[72px] max-w-page items-center justify-between gap-6 px-6 lg:px-10">
          <Link href={homeHref} className="-m-2 rounded-lg p-2" aria-label="Atendel, inicio">
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-9 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                onClick={(e) => alElegir(e, item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-6 md:flex">{desktopRight}</div>

          <button
            ref={botonRef}
            type="button"
            className="burger md:hidden"
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            onClick={alternar}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        id="menu-movil"
        ref={menuRef}
        className="menu md:hidden"
        data-open={abierto ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        aria-hidden={!abierto}
      >
        <div className="flex h-full flex-col justify-between px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[112px]">
          <ul>
            {items.map((item, i) => (
              <li key={item.href} className="menu__item" style={{ "--i": i } as CSSProperties}>
                <Link
                  href={item.href}
                  className="menu-link"
                  tabIndex={abierto ? 0 : -1}
                  onClick={(e) => alElegir(e, item.href)}
                >
                  <span className="menu-link__n">{String(i + 1).padStart(2, "0")}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          {mobileBottom ? (
            <div className="menu__item" style={{ "--i": items.length } as CSSProperties}>
              {mobileBottom}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
