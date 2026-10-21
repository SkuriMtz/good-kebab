"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { BotonTema } from "./BotonTema";
import { Logo } from "./Logo";
import { Boton } from "./base/Boton";
import { Etiqueta } from "./base/Etiqueta";
import { Icono } from "./base/Iconos";
import { PERSONAJES, Personaje } from "./agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";

export type NavItem = { href: string; label: string };
export type Reparto = { id: IdAgente; nombre: string; papel: string; href: string };

type Props = {
  /** Las páginas (la primera puede ser el inicio: en la barra la representa el logo). */
  items: NavItem[];
  /** "Pruébalo": botón sutil, siempre a la vista (el azul queda libre para cada pantalla). */
  destacado?: NavItem;
  /** "Entrar": fantasma en la barra; en el celular, abajo del panel. */
  cuenta?: NavItem;
  homeHref?: string;
  /** Para la barra de la app (NavApp): lo que va a la derecha en computadora (correo, "Salir"). */
  desktopRight?: ReactNode;
  /** Para la barra de la app: lo que va abajo del panel en celular (en lugar de "Entrar"). */
  mobileBottom?: ReactNode;
  /** Los agentes, dentro del panel del celular. */
  reparto?: Reparto[];
};

/**
 * La barra de arriba: delgada y silenciosa, todo en una línea.
 * - Computadora: logo y nombre; las cuatro páginas (sin desplegables);
 *   a la derecha el modo claro/oscuro (botón de ícono con borde), "Entrar"
 *   (fantasma) y "Pruébalo" (sutil).
 * - Arriba de todo es transparente (toma el color de la portada si la página
 *   abre con una); al bajar, se vuelve vidrio con desenfoque y una línea fina.
 * - Celular y tablet: logo, "Pruébalo" y la hamburguesa (con aria-label,
 *   nunca la palabra "Menú"). Abre un panel a pantalla completa con las
 *   páginas en grande, los agentes y, abajo, la cuenta y el modo.
 */
export function Nav({ items, destacado, cuenta, homeHref = "/", desktopRight, mobileBottom, reparto }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [bajado, setBajado] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Al bajar, la barra se vuelve vidrio
  useEffect(() => {
    let cuadro = 0;
    const medir = () => {
      cuadro = 0;
      setBajado(window.scrollY > 8);
    };
    const alBajar = () => {
      if (!cuadro) cuadro = window.requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", alBajar, { passive: true });
    return () => {
      window.removeEventListener("scroll", alBajar);
      if (cuadro) window.cancelAnimationFrame(cuadro);
    };
  }, []);

  // Cerrar el panel al cambiar de página
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  // Panel abierto: sin scroll detrás, Esc cierra, el foco no se sale del panel
  useEffect(() => {
    if (!abierto) return;
    const html = document.documentElement;
    const overflowPrevio = html.style.overflow;
    html.style.overflow = "hidden";
    const enfocables = () =>
      [botonRef.current, ...Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [])].filter(
        (el): el is HTMLElement => Boolean(el),
      );
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        botonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = enfocables();
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo?.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero?.focus();
      }
    };
    // Si la pantalla crece a computadora, el panel ya no hace falta
    const computadora = window.matchMedia("(min-width: 1024px)");
    const alCrecer = () => computadora.matches && setAbierto(false);
    window.addEventListener("keydown", alTeclear);
    computadora.addEventListener("change", alCrecer);
    panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });
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
  const paginas = items.filter((item) => item.href !== homeHref);

  return (
    <>
      <header className="cabecera" data-bajado={bajado ? "true" : "false"} data-abierto={abierto ? "true" : "false"}>
        <div className="cabecera__fila">
          <Link href={homeHref} className="cabecera__inicio" aria-label="Atendel, inicio" onClick={() => setAbierto(false)}>
            <Logo />
          </Link>

          <nav className="cabecera__nav" aria-label="Principal">
            <ul className="cabecera__enlaces">
              {paginas.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="cabecera__enlace"
                    aria-current={actual(item.href)}
                    onClick={(e) => alElegir(e, item.href)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="cabecera__acciones">
            <BotonTema className="cabecera__solo-compu" />
            {cuenta || desktopRight ? <span className="cabecera__division cabecera__solo-compu" aria-hidden="true" /> : null}
            {desktopRight ? <div className="cabecera__extra cabecera__solo-compu">{desktopRight}</div> : null}
            {cuenta ? (
              <Boton
                href={cuenta.href}
                variante="fantasma"
                tam="chico"
                className="boton--solo-texto cabecera__solo-compu"
                aria-current={actual(cuenta.href)}
              >
                {cuenta.label}
              </Boton>
            ) : null}
            {destacado ? (
              <Boton href={destacado.href} variante="sutil" tam="chico" aria-current={actual(destacado.href)}>
                {destacado.label}
              </Boton>
            ) : null}
            <button
              ref={botonRef}
              type="button"
              className="boton-borde cabecera__hamburguesa"
              aria-label={abierto ? "Cerrar las páginas del sitio" : "Abrir las páginas del sitio"}
              aria-expanded={abierto}
              aria-controls="menu-movil"
              onClick={() => setAbierto((a) => !a)}
            >
              <span className="hamburguesa" data-abierto={abierto ? "true" : "false"} aria-hidden="true">
                <Icono nombre="menu" tam={16} className="hamburguesa__abrir" />
                <Icono nombre="cerrar" tam={16} className="hamburguesa__cerrar" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="menu-movil"
        ref={panelRef}
        className="cortina"
        data-abierto={abierto ? "true" : "false"}
        aria-hidden={!abierto}
        data-lenis-prevent
      >
        <nav aria-label="Páginas del sitio">
          <ul className="cortina__paginas">
            {items.map((item, i) => (
              <li key={item.href} className="cortina__item" style={{ "--i": i } as CSSProperties}>
                <Link
                  href={item.href}
                  className="cortina__enlace"
                  aria-current={actual(item.href)}
                  onClick={(e) => alElegir(e, item.href)}
                >
                  {item.label}
                  {actual(item.href) ? (
                    <Etiqueta tono="tenue" as="span" aria-hidden="true">
                      Estás aquí
                    </Etiqueta>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {reparto?.length ? (
          <section className="cortina__item cortina__agentes" style={{ "--i": items.length } as CSSProperties} aria-labelledby="cortina-agentes">
            <Etiqueta tono="tenue" as="h2" id="cortina-agentes">
              Los agentes
            </Etiqueta>
            <ul className="cortina__rejilla">
              {reparto.map((r) => (
                <li key={r.id}>
                  <Link href={r.href} className="cortina__agente" onClick={(e) => alElegir(e, r.href)}>
                    <span className="marca-agente marca-agente--mini" style={{ "--agente": PERSONAJES[r.id].color } as CSSProperties}>
                      <Personaje agente={r.id} avatar />
                    </span>
                    <span className="cortina__agente-texto">
                      <span className="cortina__agente-nombre">{r.nombre}</span>
                      <span className="cortina__agente-papel">{r.papel}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="cortina__item cortina__cuenta" style={{ "--i": items.length + 1 } as CSSProperties}>
          {mobileBottom ??
            (cuenta ? (
              <>
                <Boton href={cuenta.href} variante="fantasma" tam="grande" bloque aria-current={actual(cuenta.href)}>
                  {cuenta.label}
                </Boton>
                <p className="cortina__nota">Entras con tu correo, sin contraseña.</p>
              </>
            ) : null)}
          <BotonTema variante="fila" />
        </div>
      </div>
    </>
  );
}
