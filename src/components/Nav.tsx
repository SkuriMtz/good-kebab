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
import { BotonTema } from "./BotonTema";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";
import { Logo } from "./Logo";

export type NavItem = { href: string; label: string };

type Props = {
  items: NavItem[];
  /** El enlace más importante (el chat): va como botón con el color de la marca. */
  destacado?: NavItem;
  homeHref?: string;
  /** Lo que va a la derecha en computadora (ej. el botón "Entrar"). */
  desktopRight?: ReactNode;
  /** Lo que va abajo del menú en celular. */
  mobileBottom?: ReactNode;
  /** Los agentes, como el reparto de una película (dentro del menú). */
  reparto?: { nombre: string; papel: string; href: string }[];
  /** En computadora el menú va de lado (MenuLateral): el botón "Menú" solo en celular y tablet. */
  menuLateral?: boolean;
};

/**
 * Barra de navegación en forma de píldora flotante:
 * - Logo a la izquierda, secciones al centro y acciones a la derecha.
 * - Se esconde al bajar y reaparece al subir; su sombra crece al bajar.
 * - En celular (y en el panel), un menú de pantalla completa que baja como telón.
 */
export function Nav({ items, destacado, homeHref = "/", desktopRight, mobileBottom, reparto, menuLateral }: Props) {
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

  const alternar = () => setAbierto((a) => !a);

  // Enlaces a secciones de esta misma página: cerrar el menú y luego desplazarse suave
  const alElegir = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    // La ficha de un agente: si esta página ya puede abrirla, se abre aquí mismo
    const ficha = href.match(/[?&]ficha=([a-z]+)/)?.[1];
    if (ficha && document.documentElement.hasAttribute("data-fichas")) {
      e.preventDefault();
      setAbierto(false);
      window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: ficha }));
      return;
    }
    const gato = href.indexOf("#");
    if (gato === -1) {
      // Otra página (o la misma con otros datos): solo cerrar el menú
      setAbierto(false);
      return;
    }
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

      {/* Píldora flotante: logo a la izquierda, secciones al centro, acciones a la derecha */}
      <header
        className="nav pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5"
        data-hidden={oculta && !abierto ? "true" : "false"}
        data-fondo={conFondo && !abierto ? "true" : "false"}
        data-abierto={abierto ? "true" : "false"}
      >
        <div className="nav__pildora nav-hide pointer-events-auto">
          <Link href={homeHref} className="nav__logo shrink-0" aria-label="Atendel, inicio">
            <Logo />
          </Link>

          <nav className="nav__enlaces hidden lg:flex" aria-label="Secciones">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav__enlace"
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={(e) => alElegir(e, item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Contador de "capítulos": en tablet va al centro; en pantallas grandes, junto a las acciones */}
          <p className="nav-capitulo capitulo hidden md:block" aria-live="off">
            {capitulo && !abierto ? (
              <>
                <span className="capitulo__n">{dos(capitulo.n)}</span> — {capitulo.nombre}
                <span className="text-ash"> / {dos(capitulo.total)}</span>
              </>
            ) : null}
          </p>

          {destacado ? (
            <Link
              href={destacado.href}
              className="nav__destacado max-md:ml-auto"
              aria-current={pathname === destacado.href ? "page" : undefined}
            >
              <span className="punto-vivo" aria-hidden="true" />
              {destacado.label}
            </Link>
          ) : null}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <BotonTema />
            {desktopRight ? <div className="hidden items-center gap-4 md:flex">{desktopRight}</div> : null}
            <button
              ref={botonRef}
              type="button"
              className={`menu-trigger ${menuLateral ? "lg:hidden" : ""}`}
              aria-label={abierto ? "Cerrar menú" : "Menú"}
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
          </div>
        </div>
      </header>

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
        <div className="mx-auto flex h-full max-w-page flex-col px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[92px] lg:px-10 lg:pb-8 lg:pt-[110px]">
          <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-10 overflow-y-auto lg:grid-cols-12 lg:content-end lg:gap-8">
            <nav className="lg:col-span-8" aria-label="Secciones">
              <p className="menu__label">Índice</p>
              <ul className="menu__lista mt-3">
                {destacado ? (
                  <li style={{ "--i": 0 } as CSSProperties}>
                    <Link
                      href={destacado.href}
                      className="menu-link menu-link--destacado"
                      tabIndex={abierto ? 0 : -1}
                      aria-current={pathname === destacado.href ? "page" : undefined}
                      onClick={(e) => alElegir(e, destacado.href)}
                    >
                      <span className="menu-link__n">→</span>
                      <span className="menu-link__mask">
                        <span className="menu-link__text">{destacado.label}</span>
                      </span>
                    </Link>
                  </li>
                ) : null}
                {items.map((item, i) => (
                  <li key={item.href} style={{ "--i": i + (destacado ? 1 : 0) } as CSSProperties}>
                    <Link
                      href={item.href}
                      className="menu-link"
                      tabIndex={abierto ? 0 : -1}
                      aria-current={pathname === item.href ? "page" : undefined}
                      onClick={(e) => alElegir(e, item.href)}
                    >
                      <span className="menu-link__n">{dos(i + 1)}</span>
                      <span className="menu-link__mask">
                        <span className="menu-link__text">{item.label}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {reparto?.length ? (
              <div className="menu__reparto lg:col-span-4" style={{ "--i": items.length } as CSSProperties}>
                <p className="menu__label">Reparto</p>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 lg:grid-cols-1">
                  {reparto.map((r) => (
                    <li key={r.nombre}>
                      <Link
                        href={r.href}
                        className="reparto-link"
                        tabIndex={abierto ? 0 : -1}
                        onClick={(e) => alElegir(e, r.href)}
                      >
                        <span className="reparto-link__nombre">{r.nombre}</span>
                        <span className="reparto-link__papel">como {r.papel}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="menu__pie mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-t hairline pt-5">
            {mobileBottom ?? desktopRight}
            <Reloj />
          </div>
        </div>
      </div>
    </>
  );
}

/** Hora de la Ciudad de México en el pie del menú (como el reloj de una sala de edición). */
function Reloj() {
  const [hora, setHora] = useState("");
  useEffect(() => {
    const poner = () =>
      setHora(
        new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }),
      );
    poner();
    const id = window.setInterval(poner, 20000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <p className="font-cond text-base uppercase leading-none tracking-[0.03em] text-ash">
      Ciudad de México <span className="tabular-nums text-bone">{hora || "--:--"}</span>
    </p>
  );
}
