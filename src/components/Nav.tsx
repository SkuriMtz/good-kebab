"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent as FocoReact,
  type KeyboardEvent as TeclaReact,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { BotonTema } from "./BotonTema";
import { Marca } from "./Logo";
import { Personaje } from "./agentes/Personaje";
import { Boton } from "./base/Boton";
import { Icono } from "./base/Iconos";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PAGINAS, PRUEBALO, SEGMENTOS } from "@/lib/contenido";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";

/*
 * Barra de navegación del sitio público, con la estructura de la barra del
 * sitio de GitHub (solo el estilo, nada de su marca):
 * - Computadora: logo y nombre; "Agentes" y "Para quién es" abren un panel
 *   discreto con dos columnas (lo principal a la izquierda y "Explora" a la
 *   derecha); "Precios" y "Preguntas" son enlaces. A la derecha: el tema
 *   (botón de ícono con borde), "Entrar" y "Pruébalo" con borde.
 * - Celular y tablet: logo, "Pruébalo" y el ícono de hamburguesa (con
 *   aria-label, nunca la palabra "Menú"). La hoja ocupa toda la pantalla
 *   debajo de la barra, con los mismos grupos plegables.
 * - Transparente arriba; al bajar, fondo translúcido con desenfoque y una
 *   línea fina abajo (solo se anima la opacidad de esa capa).
 */

/** Título de una página tal como está en PAGINAS (una sola fuente para barra y pie). */
const titulo = (href: string) => PAGINAS.find((p) => p.href === href)?.label ?? href;

type IdGrupo = "agentes" | "negocios";
type Enlace = { href: string; nombre: string; detalle: string; agente?: IdAgente };
type Grupo = {
  id: IdGrupo;
  etiqueta: string;
  /** La página del grupo: estando en ella, el grupo se marca como actual. */
  ruta: string;
  principal: { titulo: string; enlaces: Enlace[]; rejilla?: boolean };
  explora: { href: string; nombre: string }[];
};

/** Frases cortas tomadas de la introducción de cada negocio (SEGMENTOS en contenido.ts). */
const RESUMEN_NEGOCIO: Record<string, string> = {
  clinicas: "Pacientes, citas y proveedores",
  esteticas: "Precios, horarios y clientas que regresan",
  consultorios: "La recepción, mientras tú atiendes",
  servicios: "Spas, fisioterapia y nutrición",
};

const GRUPOS: Grupo[] = [
  {
    id: "agentes",
    etiqueta: titulo("/agentes"),
    ruta: "/agentes",
    principal: {
      titulo: "Tu equipo",
      rejilla: true,
      enlaces: AGENTES_INFO.map((a) => ({
        href: `/agentes?ficha=${a.id}`,
        nombre: a.nombre,
        detalle: `${a.area} · ${a.abarca}`,
        agente: a.id,
      })),
    },
    explora: [
      { href: "/agentes", nombre: "Los cuatro agentes" },
      { href: PRUEBALO.href, nombre: "Pruébalo con un chat de ejemplo" },
      { href: "/precios", nombre: "Qué plan trae a cada uno" },
    ],
  },
  {
    id: "negocios",
    etiqueta: titulo("/para-quien-es"),
    ruta: "/para-quien-es",
    principal: {
      titulo: "Por tipo de negocio",
      enlaces: SEGMENTOS.map((s) => ({
        href: `/para-quien-es#${s.id}`,
        nombre: s.nombre,
        detalle: RESUMEN_NEGOCIO[s.id] ?? "",
      })),
    },
    explora: [
      { href: "/para-quien-es", nombre: "Cómo ayuda cada agente" },
      { href: "/preguntas#seguridad", nombre: "Tus datos y los de tus pacientes" },
    ],
  },
];

const SUELTOS = ["/precios", "/preguntas"].map((href) => ({ href, nombre: titulo(href) }));

export type NavItem = { href: string; label: string };
export type Reparto = { id: IdAgente; nombre: string; papel: string; href: string };

/**
 * Sin props es la barra del sitio público. Con `items` es la barra genérica
 * que todavía usa la app (src/components/app/NavApp.tsx): mismos estilos,
 * sus enlaces, lo que mande a la derecha y, en el celular, sus agentes.
 */
type PropsNav = {
  items?: NavItem[];
  destacado?: NavItem;
  homeHref?: string;
  desktopRight?: ReactNode;
  mobileBottom?: ReactNode;
  reparto?: Reparto[];
};

/** Lo que espera un panel abierto con el cursor antes de cerrarse al salir de él (= --dur-salida, 0.15s). */
const GRACIA_CIERRE = 150;

const ENFOCABLES = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Nav({ items, destacado, homeHref = "/", desktopRight, mobileBottom, reparto }: PropsNav = {}) {
  const enApp = Boolean(items);
  const grupos = enApp ? [] : GRUPOS;
  const sueltos = items
    ? items.filter((i) => i.href !== homeHref).map((i) => ({ href: i.href, nombre: i.label }))
    : SUELTOS;
  const sueltosHoja = items ? items.map((i) => ({ href: i.href, nombre: i.label })) : SUELTOS;
  const pathname = usePathname();
  const [abierto, setAbierto] = useState<IdGrupo | null>(null);
  const [fijado, setFijado] = useState(false);
  const [hoja, setHoja] = useState(false);
  const [pliegues, setPliegues] = useState<Set<IdGrupo>>(() => new Set<IdGrupo>(["agentes"]));
  const [conFondo, setConFondo] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const hojaRef = useRef<HTMLDivElement>(null);
  const hamburguesaRef = useRef<HTMLButtonElement>(null);
  const disparadores = useRef<Partial<Record<IdGrupo, HTMLButtonElement | null>>>({});
  const temporizador = useRef<number | undefined>(undefined);

  const cerrarPanel = useCallback((devolverFocoA?: IdGrupo) => {
    window.clearTimeout(temporizador.current);
    setAbierto(null);
    setFijado(false);
    if (devolverFocoA) disparadores.current[devolverFocoA]?.focus();
  }, []);

  // Al bajar, la barra toma fondo translúcido y su línea fina
  useEffect(() => {
    const revisar = () => setConFondo(window.scrollY > 8);
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, []);

  // Al cambiar de página se cierra todo
  useEffect(() => {
    setHoja(false);
    cerrarPanel();
  }, [pathname, cerrarPanel]);

  // Panel abierto: un clic afuera lo cierra
  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: globalThis.PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) cerrarPanel();
    };
    document.addEventListener("pointerdown", alTocar);
    return () => document.removeEventListener("pointerdown", alTocar);
  }, [abierto, cerrarPanel]);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  // Hoja del celular abierta: sin scroll detrás, Esc la cierra y el foco no se sale de ella
  useEffect(() => {
    if (!hoja) return;
    const html = document.documentElement;
    const previo = html.style.overflow;
    html.style.overflow = "hidden";
    const computadora = window.matchMedia("(min-width: 1024px)");
    const alCrecer = () => computadora.matches && setHoja(false);
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHoja(false);
        hamburguesaRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !hojaRef.current || !hamburguesaRef.current) return;
      const visibles = Array.from(hojaRef.current.querySelectorAll<HTMLElement>(ENFOCABLES)).filter(
        (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden",
      );
      const lista = [hamburguesaRef.current, ...visibles];
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

  // Fichas de agente: se abren aquí mismo si la página puede; las anclas de la misma página bajan suave
  const alElegir = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    cerrarPanel();
    const ficha = href.match(/[?&]ficha=([a-z]+)/)?.[1];
    if (ficha && document.documentElement.hasAttribute("data-fichas")) {
      e.preventDefault();
      setHoja(false);
      window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: ficha }));
      return;
    }
    const gato = href.indexOf("#");
    if (gato === -1) return;
    const ruta = href.slice(0, gato) || pathname;
    if (ruta !== pathname) return;
    const destino = document.getElementById(href.slice(gato + 1));
    if (!destino) return;
    e.preventDefault();
    setHoja(false);
    window.setTimeout(() => {
      const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      destino.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" });
      window.history.replaceState(null, "", `#${destino.id}`);
    }, 0);
  };

  const actual = (href: string) => (pathname === href ? ("page" as const) : undefined);

  // ----- Paneles de la computadora: se abren al pasar el cursor o con clic, y con el teclado -----
  const alEntrar = (id: IdGrupo) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(temporizador.current);
    if (abierto !== id) {
      setAbierto(id);
      setFijado(false);
    }
  };
  const alSalir = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || fijado) return;
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setAbierto(null), GRACIA_CIERRE);
  };
  const alPulsar = (id: IdGrupo) => {
    if (abierto === id && fijado) {
      cerrarPanel();
      return;
    }
    setAbierto(id);
    setFijado(true);
  };
  const teclaDisparador = (id: IdGrupo) => (e: TeclaReact<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setAbierto(id);
      setFijado(true);
      const cual = e.key === "ArrowDown" ? "first" : "last";
      window.requestAnimationFrame(() => {
        const enlaces = document.querySelectorAll<HTMLElement>(`#desplegable-${id} a`);
        enlaces[cual === "first" ? 0 : enlaces.length - 1]?.focus();
      });
    } else if (e.key === "Escape" && abierto) {
      cerrarPanel(id);
    }
  };
  const teclaPanel = (id: IdGrupo) => (e: TeclaReact<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cerrarPanel(id);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const enlaces = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("a"));
    const i = enlaces.indexOf(document.activeElement as HTMLElement);
    const siguiente =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? enlaces.length - 1
          : (i + (e.key === "ArrowDown" ? 1 : -1) + enlaces.length) % enlaces.length;
    e.preventDefault();
    enlaces[siguiente]?.focus();
  };
  const alPerderFoco = (id: IdGrupo) => (e: FocoReact<HTMLLIElement>) => {
    if (abierto === id && !e.currentTarget.contains(e.relatedTarget as Node | null)) cerrarPanel();
  };

  const alternarPliegue = (id: IdGrupo) =>
    setPliegues((previo) => {
      const nuevo = new Set(previo);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

  return (
    <>
      <header className="cabecera" data-fondo={conFondo ? "true" : "false"} data-hoja={hoja ? "true" : "false"}>
        <a href="#contenido" className="saltar">
          Saltar al contenido
        </a>
        <div className="cabecera__fila">
          <Link href={homeHref} className="cabecera__logo" aria-label="Atendel, inicio">
            <Marca className="cabecera__marca" />
            <span className="cabecera__nombre" aria-hidden="true">
              Atendel
            </span>
          </Link>

          <nav ref={navRef} className="cabecera__nav" aria-label="Principal">
            <ul className="cabecera__lista">
              {grupos.map((g) => {
                const esActual = pathname === g.ruta || pathname.startsWith(`${g.ruta}/`);
                const estaAbierto = abierto === g.id;
                return (
                  <li
                    key={g.id}
                    className="cabecera__item"
                    onPointerEnter={alEntrar(g.id)}
                    onPointerLeave={alSalir}
                    onBlur={alPerderFoco(g.id)}
                  >
                    <button
                      ref={(el) => {
                        disparadores.current[g.id] = el;
                      }}
                      type="button"
                      className="cabecera__enlace cabecera__disparador"
                      aria-expanded={estaAbierto}
                      aria-controls={`desplegable-${g.id}`}
                      data-actual={esActual ? "true" : undefined}
                      onClick={() => alPulsar(g.id)}
                      onKeyDown={teclaDisparador(g.id)}
                    >
                      {g.etiqueta}
                      <Icono nombre="chevron" tam={16} className="cabecera__chevron" />
                    </button>
                    <div
                      id={`desplegable-${g.id}`}
                      className={g.principal.rejilla ? "desplegable desplegable--ancho" : "desplegable"}
                      data-abierto={estaAbierto ? "true" : "false"}
                      onKeyDown={teclaPanel(g.id)}
                    >
                      <div className="desplegable__principal">
                        <p className="desplegable__titulo" id={`desplegable-${g.id}-titulo`}>
                          {g.principal.titulo}
                        </p>
                        <ul
                          className={g.principal.rejilla ? "desplegable__rejilla" : "desplegable__lista"}
                          aria-labelledby={`desplegable-${g.id}-titulo`}
                        >
                          {g.principal.enlaces.map((e) => (
                            <li key={e.href}>
                              <Link href={e.href} className="desplegable__enlace" onClick={(ev) => alElegir(ev, e.href)}>
                                {e.agente ? <Personaje agente={e.agente} avatar className="desplegable__personaje" /> : null}
                                <span className="desplegable__texto">
                                  <span className="desplegable__nombre">{e.nombre}</span>
                                  <span className="desplegable__detalle">{e.detalle}</span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="desplegable__explora">
                        <p className="desplegable__titulo" id={`desplegable-${g.id}-explora`}>
                          Explora
                        </p>
                        <ul className="desplegable__lista" aria-labelledby={`desplegable-${g.id}-explora`}>
                          {g.explora.map((e) => (
                            <li key={e.href}>
                              <Link
                                href={e.href}
                                className="desplegable__extra"
                                aria-current={actual(e.href)}
                                onClick={(ev) => alElegir(ev, e.href)}
                              >
                                <span>{e.nombre}</span>
                                <Icono nombre="flecha" tam={16} className="desplegable__flecha" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
              {sueltos.map((s) => (
                <li key={s.href} className="cabecera__item">
                  <Link href={s.href} className="cabecera__enlace" aria-current={actual(s.href)}>
                    {s.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="cabecera__acciones">
            <BotonTema className="cabecera__solo-computadora" />
            <span className="cabecera__division cabecera__solo-computadora" aria-hidden="true" />
            {enApp ? (
              desktopRight ? <div className="cabecera__solo-computadora cabecera__extra">{desktopRight}</div> : null
            ) : (
              <Link href="/entrar" className="cabecera__enlace cabecera__solo-computadora" aria-current={actual("/entrar")}>
                Entrar
              </Link>
            )}
            {enApp && !destacado ? null : (
              <Boton
                href={(destacado ?? PRUEBALO).href}
                variante="sutil"
                tam="compacto"
                className="cabecera__probar"
                aria-current={actual((destacado ?? PRUEBALO).href)}
              >
                {(destacado ?? PRUEBALO).label}
              </Boton>
            )}
            <button
              ref={hamburguesaRef}
              type="button"
              className="cabecera__hamburguesa"
              aria-label={hoja ? "Cerrar la navegación" : "Abrir la navegación"}
              aria-expanded={hoja}
              aria-controls="hoja-nav"
              onClick={() => setHoja((h) => !h)}
            >
              <span className="cabecera__hamburguesa-iconos" aria-hidden="true">
                <Icono nombre="menu" tam={16} className="cabecera__icono-abrir" />
                <Icono nombre="cerrar" tam={16} className="cabecera__icono-cerrar" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="hoja-nav"
        ref={hojaRef}
        className="hoja-nav"
        data-abierta={hoja ? "true" : "false"}
        aria-hidden={!hoja}
        data-lenis-prevent
      >
        <div className="hoja-nav__cuerpo">
          <nav aria-label="Principal en celular">
            <ul className="hoja-nav__lista">
              {grupos.map((g) => {
                const desplegado = pliegues.has(g.id);
                return (
                  <li key={g.id} className="hoja-nav__grupo">
                    <button
                      type="button"
                      className="hoja-nav__fila"
                      aria-expanded={desplegado}
                      aria-controls={`pliegue-${g.id}`}
                      onClick={() => alternarPliegue(g.id)}
                    >
                      {g.etiqueta}
                      <Icono nombre="chevron" tam={20} className="hoja-nav__chevron" />
                    </button>
                    <div id={`pliegue-${g.id}`} className="hoja-nav__pliegue" data-abierto={desplegado ? "true" : "false"}>
                      <div className="hoja-nav__interior">
                        <p className="hoja-nav__titulo">{g.principal.titulo}</p>
                        <ul>
                          {g.principal.enlaces.map((e) => (
                            <li key={e.href}>
                              <Link href={e.href} className="hoja-nav__enlace" onClick={(ev) => alElegir(ev, e.href)}>
                                {e.agente ? <Personaje agente={e.agente} avatar className="hoja-nav__personaje" /> : null}
                                <span className="desplegable__texto">
                                  <span className="hoja-nav__nombre">{e.nombre}</span>
                                  <span className="desplegable__detalle">{e.detalle}</span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <ul className="hoja-nav__explora">
                          {g.explora.map((e) => (
                            <li key={e.href}>
                              <Link
                                href={e.href}
                                className="desplegable__extra"
                                aria-current={actual(e.href)}
                                onClick={(ev) => alElegir(ev, e.href)}
                              >
                                <span>{e.nombre}</span>
                                <Icono nombre="flecha" tam={16} className="desplegable__flecha" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
              {sueltosHoja.map((s) => (
                <li key={s.href} className="hoja-nav__grupo">
                  <Link href={s.href} className="hoja-nav__fila" aria-current={actual(s.href)}>
                    {s.nombre}
                    <Icono nombre="chevron-derecha" tam={20} className="hoja-nav__chevron" />
                  </Link>
                </li>
              ))}
            </ul>
            {enApp && reparto?.length ? (
              <>
                <p className="hoja-nav__titulo hoja-nav__titulo--suelto">Tu equipo</p>
                <ul>
                  {reparto.map((r) => (
                    <li key={r.id}>
                      <Link href={r.href} className="hoja-nav__enlace" onClick={(ev) => alElegir(ev, r.href)}>
                        <Personaje agente={r.id} avatar className="hoja-nav__personaje" />
                        <span className="desplegable__texto">
                          <span className="hoja-nav__nombre">{r.nombre}</span>
                          <span className="desplegable__detalle">{r.papel}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </nav>

          <div className="hoja-nav__pie">
            {enApp ? (
              (mobileBottom ?? desktopRight)
            ) : (
              <>
                <Boton href="/entrar" variante="fantasma" tam="grande" bloque aria-current={actual("/entrar")}>
                  Entrar
                </Boton>
                <p className="hoja-nav__nota">Entras con tu correo, sin contraseña.</p>
              </>
            )}
            <div className="hoja-nav__tema">
              <span className="hoja-nav__tema-etiqueta" id="hoja-nav-tema">
                Tema
              </span>
              <BotonTema variante="selector" etiquetadoPor="hoja-nav-tema" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
