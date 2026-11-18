"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BotonTema } from "./BotonTema";
import { FondoFragmentos, MarcaFragmentos } from "./FragmentosMenu";
import { COLORES, Marca } from "./Logo";
import { Icono } from "./base/Iconos";
import { CENTRO_PRIVACIDAD, POLITICAS } from "@/legal/politicas";
import { IDS_AGENTES, AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";
import { CORREO_CONTACTO } from "@/lib/sitio";
import { BotonIdioma, useIdioma } from "@/i18n/Idioma";

/*
 * La barra del sitio público: la marca y "Atendel" a la izquierda y, a la
 * derecha, solo el botón del menú. Al bajar, la barra sube 11 px, el nombre
 * se desvanece y aparece una franja oscura con desenfoque.
 *
 * El menú cubre toda la pantalla (siempre oscuro):
 * - De fondo, fragmentos esparcidos que suben y giran lento.
 * - Izquierda (computadora): la marca de Atendel hecha de fragmentos (la del
 *   cierre del inicio), sin cuadro, que lleva a Agentes.
 * - Derecha: los lugares en letra grande (Agentes se abre y muestra a los
 *   cuatro; tocar uno abre su ficha), filas que se abren (Ayuda y contacto,
 *   Términos y políticas) y, hasta abajo, Crea tu cuenta, Entrar, el idioma y
 *   el tema. Nada lleva a la demo.
 * - Escape o la X lo cierran y el foco no se sale de él mientras está abierto.
 * En el inicio los lugares bajan a su escena; en las demás páginas van a su página.
 */

type Lugar = { id: "precios" | "cuando" | "preguntas" | "privacy"; inicio: string; otra: string };

const LUGARES: Lugar[] = [
  { id: "precios", inicio: "#precios", otra: "/precios" },
  { id: "cuando", inicio: "#cuando-sale", otra: "/#cuando-sale" },
  { id: "preguntas", inicio: "/preguntas", otra: "/preguntas" },
  { id: "privacy", inicio: CENTRO_PRIVACIDAD, otra: CENTRO_PRIVACIDAD },
];

const orden = (i: number) => ({ "--i": i }) as CSSProperties;

/** Un enlace que baja dentro de la página (#…), abre el correo o va a otra página. */
function Enlace({ href, className, actual, onClick, children }: { href: string; className: string; actual?: boolean; onClick: () => void; children: ReactNode }) {
  if (href.startsWith("#") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} aria-current={actual ? "page" : undefined} onClick={onClick}>
      {children}
    </Link>
  );
}

function IconoMenu() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6h14M3 10h14M3 14h9" />
    </svg>
  );
}

export function Barra({ inicio = false }: { inicio?: boolean }) {
  const pathname = usePathname();
  const { d, idioma } = useIdioma();
  const b = d.barra;
  const [bajando, setBajando] = useState(false);
  const [menu, setMenu] = useState(false);
  const [abierta, setAbierta] = useState<"agentes" | "ayuda" | "legal" | null>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Al primer movimiento del scroll la barra toma su forma "abajo"
  useEffect(() => {
    const revisar = () => setBajando(window.scrollY > 2);
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  // Menú abierto: sin scroll atrás, Escape lo cierra y el foco no se sale de él
  useEffect(() => {
    if (!menu) {
      setAbierta(null);
      return;
    }
    const html = document.documentElement;
    const previo = html.style.overflow;
    html.style.overflow = "hidden";
    const contenedor = menuRef.current;
    const abridor = boton.current;
    cerrarRef.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        return;
      }
      if (e.key !== "Tab" || !contenedor) return;
      const lista = Array.from(contenedor.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")).filter((el) => el.offsetParent !== null);
      if (!lista.length) return;
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
    return () => {
      html.style.overflow = previo;
      window.removeEventListener("keydown", alTeclear);
      // El foco vuelve al botón del menú si se había quedado adentro
      if (contenedor?.contains(document.activeElement)) abridor?.focus();
    };
  }, [menu]);

  const cerrar = () => setMenu(false);
  const alternar = (que: "agentes" | "ayuda" | "legal") => setAbierta((a) => (a === que ? null : que));
  const href = (l: Lugar) => (inicio ? l.inicio : l.otra);
  const agentesHref = inicio ? "#agentes" : "/agentes";
  const abrirFicha = (id: IdAgente) => {
    cerrar();
    window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: id }));
  };
  const chevron = <Icono nombre="chevron" className="menu-sitio__chevron" />;

  return (
    <>
      <header className={`barra${inicio ? " barra--inicio" : ""}`} data-bajando={bajando ? "true" : "false"}>
        <a href="#contenido" className="saltar">
          {b.saltar}
        </a>
        <div className="barra__fila">
          <Link href="/" className="barra__logo" aria-label={b.inicio}>
            <Marca className="barra__marca" />
            <span className="barra__nombre" aria-hidden="true">
              Atendel
            </span>
          </Link>
          <button
            ref={boton}
            type="button"
            className="barra__menu"
            aria-label={b.abrir}
            aria-expanded={menu}
            aria-controls="menu-sitio"
            onClick={() => setMenu(true)}
          >
            <IconoMenu />
          </button>
        </div>
      </header>

      <div
        id="menu-sitio"
        ref={menuRef}
        className="menu-sitio"
        data-abierto={menu ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-label={b.menu}
        inert={!menu}
        data-lenis-prevent
      >
        <FondoFragmentos activo={menu} />
        <div className="menu-sitio__arriba">
          <Link href="/" className="menu-sitio__logo" aria-label={b.inicio} onClick={cerrar}>
            <Marca className="barra__marca" />
            <span aria-hidden="true">Atendel</span>
          </Link>
          <button ref={cerrarRef} type="button" className="menu-sitio__cerrar" aria-label={b.cerrar} onClick={cerrar}>
            <Icono nombre="cerrar" tam={18} />
          </button>
        </div>

        <div className="menu-sitio__cuerpo">
          <aside className="menu-sitio__lado menu-sitio__entra" style={orden(0)}>
            <p className="menu-sitio__etiqueta">{b.equipo}</p>
            <Enlace href={agentesHref} className="menu-sitio__tarjeta" actual={pathname === "/agentes"} onClick={cerrar}>
              <span className="menu-sitio__figura">
                <MarcaFragmentos activo={menu} />
              </span>
              <span className="menu-sitio__tarjeta-titulo">{b.conoce}</span>
            </Enlace>
          </aside>

          <nav className="menu-sitio__nav" aria-label={b.principal}>
            <ul className="menu-sitio__grandes">
              <li className="menu-sitio__entra" style={orden(1)}>
                <Enlace href={inicio ? "#contenido" : "/"} className="menu-sitio__grande" actual={pathname === "/"} onClick={cerrar}>
                  {b.inicioMenu}
                </Enlace>
              </li>
              <li className="menu-sitio__entra" style={orden(2)}>
                <button
                  type="button"
                  className="menu-sitio__grande"
                  aria-expanded={abierta === "agentes"}
                  aria-controls="menu-sitio-agentes"
                  onClick={() => alternar("agentes")}
                >
                  {b.agentes}
                  {chevron}
                </button>
                <div id="menu-sitio-agentes" className="menu-sitio__abre" data-abierto={abierta === "agentes" ? "true" : "false"}>
                  <ul className="menu-sitio__sub">
                    {IDS_AGENTES.map((id, i) => (
                      <li key={id}>
                        <button type="button" className="menu-sitio__sub-enlace" onClick={() => abrirFicha(id)}>
                          <span className="menu-sitio__punto" style={{ background: COLORES[i] }} aria-hidden="true" />
                          {AGENTE_POR_ID[id].nombre}
                          <span className="menu-sitio__area">{d.agentes[id].area}</span>
                        </button>
                      </li>
                    ))}
                    <li>
                      <Enlace href={agentesHref} className="menu-sitio__sub-enlace" onClick={cerrar}>
                        {b.todos}
                        <Icono nombre="flecha" tam={16} />
                      </Enlace>
                    </li>
                  </ul>
                </div>
              </li>
              {LUGARES.map((l, i) => (
                <li key={l.id} className="menu-sitio__entra" style={orden(i + 3)}>
                  <Enlace href={href(l)} className="menu-sitio__grande" actual={!inicio && pathname === l.otra} onClick={cerrar}>
                    {b[l.id]}
                  </Enlace>
                </li>
              ))}
            </ul>

            <ul className="menu-sitio__filas menu-sitio__entra" style={orden(7)}>
              <li>
                <Enlace href="/para-quien-es" className="menu-sitio__fila" actual={pathname === "/para-quien-es"} onClick={cerrar}>
                  {b.paraQuien}
                  <Icono nombre="flecha" tam={16} />
                </Enlace>
              </li>
              <li>
                <button type="button" className="menu-sitio__fila" aria-expanded={abierta === "ayuda"} aria-controls="menu-sitio-ayuda" onClick={() => alternar("ayuda")}>
                  {b.ayuda}
                  {chevron}
                </button>
                <div id="menu-sitio-ayuda" className="menu-sitio__abre" data-abierto={abierta === "ayuda" ? "true" : "false"}>
                  <ul className="menu-sitio__sub menu-sitio__sub--fila">
                    <li>
                      <Enlace href="/contacto" className="menu-sitio__sub-enlace" actual={pathname === "/contacto"} onClick={cerrar}>
                        {b.contacto}
                      </Enlace>
                    </li>
                    <li>
                      <Enlace href={`mailto:${CORREO_CONTACTO}`} className="menu-sitio__sub-enlace" onClick={cerrar}>
                        {CORREO_CONTACTO}
                      </Enlace>
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <button type="button" className="menu-sitio__fila" aria-expanded={abierta === "legal"} aria-controls="menu-sitio-legal" onClick={() => alternar("legal")}>
                  {b.legal}
                  {chevron}
                </button>
                <div id="menu-sitio-legal" className="menu-sitio__abre" data-abierto={abierta === "legal" ? "true" : "false"}>
                  <ul className="menu-sitio__sub menu-sitio__sub--fila">
                    {POLITICAS.filter((p) => p.id === "privacidad" || p.id === "terminos" || p.id === "cookies").map((p) => (
                      <li key={p.id}>
                        <Enlace href={p.href} className="menu-sitio__sub-enlace" actual={pathname === p.href} onClick={cerrar}>
                          {p.nombre[idioma]}
                        </Enlace>
                      </li>
                    ))}
                    <li>
                      <Enlace href={CENTRO_PRIVACIDAD} className="menu-sitio__sub-enlace" onClick={cerrar}>
                        {b.todasPoliticas}
                        <Icono nombre="flecha" tam={16} />
                      </Enlace>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>

            <div className="menu-sitio__pie menu-sitio__entra" style={orden(8)}>
              <Link href="/crear-cuenta" className="menu-sitio__boton menu-sitio__boton--lleno" onClick={cerrar}>
                {b.crear}
              </Link>
              <Link href="/entrar" className="menu-sitio__boton" onClick={cerrar}>
                {b.entrar}
                <Icono nombre="flecha" tam={16} />
              </Link>
              <div className="menu-sitio__ajustes">
                <BotonIdioma />
                <BotonTema />
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
