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
  const progresoRef = useRef<HTMLDivElement>(null);
  const [capitulo, setCapitulo] = useState<{ n: number; total: number; nombre: string } | null>(null);
  const pathname = usePathname();

  // Mostrar/ocultar al hacer scroll
  useEffect(() => {
    let anterior = window.scrollY;
    let pendiente = false;
    const actualizar = () => {
      const y = window.scrollY;
      setConFondo(y > 8);
      // El anillo del botón se llena conforme avanzas en la página
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progresoRef.current?.style.setProperty("--avance", String(max > 0 ? Math.min(1, y / max) : 0));
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

  // Contador de "capítulos": qué sección está en pantalla (como el líder de una película)
  useEffect(() => {
    const secciones = Array.from(document.querySelectorAll<HTMLElement>("[data-capitulo]"));
    if (!secciones.length) return;
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const i = secciones.indexOf(e.target as HTMLElement);
          setCapitulo({ n: i + 1, total: secciones.length, nombre: secciones[i].dataset.capitulo ?? "" });
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    secciones.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

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

  const dos = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <div ref={progresoRef} className="progress-line" aria-hidden="true" />

      {/* Solo tipografía: nombre a la izquierda, capítulo al centro, menú a la derecha */}
      <header
        className="nav pointer-events-none fixed inset-x-0 top-0 z-50"
        data-hidden={oculta && !abierto ? "true" : "false"}
        data-fondo={conFondo && !abierto ? "true" : "false"}
      >
        <div className="mx-auto grid h-[72px] max-w-page grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-10">
          <Link href={homeHref} className="nav-hide pointer-events-auto justify-self-start" aria-label="Atendel, inicio">
            <Logo />
          </Link>
          <p className="nav-hide capitulo hidden md:block" aria-live="off">
            {capitulo && !abierto ? (
              <>
                <span className="capitulo__n">{dos(capitulo.n)}</span> — {capitulo.nombre}
                <span className="text-ash"> / {dos(capitulo.total)}</span>
              </>
            ) : null}
          </p>
          {desktopRight ? (
            <div className="nav-hide pointer-events-auto hidden items-center gap-5 justify-self-end pr-[112px] md:flex">{desktopRight}</div>
          ) : (
            <span />
          )}
        </div>
      </header>

      <button
        ref={botonRef}
        type="button"
        className="menu-trigger"
        data-hidden={oculta && !abierto ? "true" : "false"}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        onClick={alternar}
      >
        <span className="menu-trigger__plus" aria-hidden="true">
          +
        </span>
        <span className="roll">
          <span className="roll__a">{abierto ? "Cerrar" : "Menú"}</span>
          <span className="roll__b" aria-hidden="true">
            {abierto ? "Cerrar" : "Menú"}
          </span>
        </span>
      </button>

      <div
        id="menu-movil"
        ref={menuRef}
        className="menu"
        data-open={abierto ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        aria-hidden={!abierto}
      >
        <div className="mx-auto flex h-full max-w-page flex-col justify-between gap-10 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[110px] lg:flex-row lg:items-end lg:gap-20 lg:px-10 lg:pb-16">
          <ul className="w-full lg:max-w-[64%]">
            {items.map((item, i) => (
              <li key={item.href} className="menu__item" style={{ "--i": i } as CSSProperties}>
                <Link
                  href={item.href}
                  className="menu-link"
                  tabIndex={abierto ? 0 : -1}
                  onClick={(e) => alElegir(e, item.href)}
                >
                  <span className="menu-link__n">{dos(i + 1)}</span>
                  <span className="menu-link__text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          {mobileBottom || desktopRight ? (
            <div className="menu__item lg:pb-3" style={{ "--i": items.length } as CSSProperties}>
              {mobileBottom ?? desktopRight}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
