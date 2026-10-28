"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BotonTema } from "./BotonTema";
import { Marca } from "./Logo";
import { Icono } from "./base/Iconos";
import { BotonLista } from "./inicio-dala/BotonLista";
import { PRUEBALO } from "@/lib/contenido";

/*
 * La barra del sitio público, como la del video de referencia (MEDIDAS.md §3):
 * - Izquierda: la marca de los cuatro agentes y "Atendel".
 * - Derecha: Agentes, Precios, Cuándo sale y Preguntas en mayúsculas chicas
 *   (gris; blanco el encendido) y la píldora violeta "Únete a la lista".
 * - Al empezar a bajar, la barra sube 11 px, el nombre se desvanece y
 *   aparece una franja oscura con desenfoque (57 px a 1212×750).
 * - En el inicio los enlaces bajan a su escena y se encienden según la
 *   escena (data-enlace-activo en <html>, lo pone FondoInicio). En las demás
 *   páginas van a su página.
 * - Celular: la marca, la píldora y el ícono de hamburguesa (con aria-label,
 *   nunca la palabra "Menú"). La hoja trae los enlaces, Pruébalo, Para quién
 *   es, Entrar y el tema.
 */

type Enlace = { id: "agentes" | "precios" | "cuando" | "preguntas"; texto: string; inicio: string; otra: string };

const ENLACES: Enlace[] = [
  { id: "agentes", texto: "Agentes", inicio: "#agentes", otra: "/agentes" },
  { id: "precios", texto: "Precios", inicio: "#precios", otra: "/precios" },
  { id: "cuando", texto: "Cuándo sale", inicio: "#cuando-sale", otra: "/#cuando-sale" },
  { id: "preguntas", texto: "Preguntas", inicio: "/preguntas", otra: "/preguntas" },
];

const EXTRA_HOJA = [
  { href: PRUEBALO.href, texto: "Pruébalo" },
  { href: "/para-quien-es", texto: "Para quién es" },
];

export function Barra({ inicio = false }: { inicio?: boolean }) {
  const pathname = usePathname();
  const [bajando, setBajando] = useState(false);
  const [hoja, setHoja] = useState(false);
  const hamburguesa = useRef<HTMLButtonElement>(null);
  const hojaRef = useRef<HTMLDivElement>(null);

  // Al primer movimiento del scroll la barra toma su forma "abajo"
  useEffect(() => {
    const revisar = () => setBajando(window.scrollY > 2);
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, []);

  useEffect(() => setHoja(false), [pathname]);

  // Hoja abierta: sin scroll atrás, Escape la cierra y el foco no se sale de ella
  useEffect(() => {
    if (!hoja) return;
    const html = document.documentElement;
    const previo = html.style.overflow;
    html.style.overflow = "hidden";
    const computadora = window.matchMedia("(min-width: 900px)");
    const alCrecer = () => computadora.matches && setHoja(false);
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHoja(false);
        hamburguesa.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !hojaRef.current || !hamburguesa.current) return;
      const lista = [hamburguesa.current, ...Array.from(hojaRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"))];
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    window.addEventListener("keydown", alTeclear);
    computadora.addEventListener("change", alCrecer);
    return () => {
      html.style.overflow = previo;
      window.removeEventListener("keydown", alTeclear);
      computadora.removeEventListener("change", alCrecer);
    };
  }, [hoja]);

  const href = (e: Enlace) => (inicio ? e.inicio : e.otra);
  const actual = (e: Enlace) => (!inicio && pathname === e.otra ? ("page" as const) : undefined);

  return (
    <>
      <header
        className={`barra${inicio ? " barra--inicio" : ""}`}
        data-bajando={bajando ? "true" : "false"}
        data-hoja={hoja ? "true" : "false"}
      >
        <a href="#contenido" className="saltar">
          Saltar al contenido
        </a>
        <div className="barra__fila">
          <Link href="/" className="barra__logo" aria-label="Atendel, inicio">
            <Marca className="barra__marca" />
            <span className="barra__nombre" aria-hidden="true">
              Atendel
            </span>
          </Link>
          <nav className="barra__nav" aria-label="Principal">
            <ul className="barra__lista">
              {ENLACES.map((e) => (
                <li key={e.id}>
                  {href(e).startsWith("#") ? (
                    // Ancla de la misma página: la baja Lenis (ScrollSuave), sin el router
                    <a href={href(e)} className="barra__enlace" data-enlace={e.id}>
                      {e.texto}
                    </a>
                  ) : (
                    <Link href={href(e)} className="barra__enlace" data-enlace={e.id} aria-current={actual(e)}>
                      {e.texto}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <BotonLista className="barra__pildora" />
          <button
            ref={hamburguesa}
            type="button"
            className="barra__hamburguesa"
            aria-label={hoja ? "Cerrar la navegación" : "Abrir la navegación"}
            aria-expanded={hoja}
            aria-controls="hoja-barra"
            onClick={() => setHoja((h) => !h)}
          >
            <Icono nombre={hoja ? "cerrar" : "menu"} tam={20} />
          </button>
        </div>
      </header>

      <div id="hoja-barra" ref={hojaRef} className="hoja-barra" data-abierta={hoja ? "true" : "false"} aria-hidden={!hoja} data-lenis-prevent>
        <nav aria-label="Principal en celular">
          <ul className="hoja-barra__lista">
            {ENLACES.map((e) => (
              <li key={e.id}>
                {href(e).startsWith("#") ? (
                  <a href={href(e)} className="hoja-barra__enlace" tabIndex={hoja ? 0 : -1} onClick={() => setHoja(false)}>
                    {e.texto}
                  </a>
                ) : (
                  <Link href={href(e)} className="hoja-barra__enlace" aria-current={actual(e)} tabIndex={hoja ? 0 : -1} onClick={() => setHoja(false)}>
                    {e.texto}
                  </Link>
                )}
              </li>
            ))}
            {EXTRA_HOJA.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="hoja-barra__enlace hoja-barra__enlace--extra"
                  aria-current={pathname === e.href ? "page" : undefined}
                  tabIndex={hoja ? 0 : -1}
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hoja-barra__pie">
          <Link href="/entrar" className="hoja-barra__entrar" tabIndex={hoja ? 0 : -1}>
            Entrar
          </Link>
          <div className="hoja-barra__tema">
            <span id="hoja-barra-tema">Tema</span>
            <BotonTema variante="selector" etiquetadoPor="hoja-barra-tema" />
          </div>
        </div>
      </div>
    </>
  );
}
