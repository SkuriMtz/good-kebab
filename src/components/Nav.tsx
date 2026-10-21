"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { BotonTema, SelectorTema } from "./BotonTema";
import { Marca } from "./Logo";
import { PERSONAJES, Personaje } from "./agentes/Personaje";
import { Cajon } from "./base/Cajon";
import { Icono, type NombreIcono } from "./base/Iconos";
import { Kbd } from "./base/Kbd";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PAGINAS, PREGUNTAS, PRUEBALO, SEGMENTOS } from "@/lib/contenido";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";
import { PLANES } from "@/lib/planes";

export type NavItem = { href: string; label: string };
export type Reparto = { id: IdAgente; nombre: string; papel: string; href: string };

type Props = {
  items: NavItem[];
  /** "Pruébalo": botón sutil, siempre a la vista (el azul queda libre para el botón principal de cada pantalla). */
  destacado?: NavItem;
  homeHref?: string;
  /** Lo que va a la derecha en computadora (por defecto, "Entrar"). */
  desktopRight?: ReactNode;
  /** Lo que va abajo del menú en celular. */
  mobileBottom?: ReactNode;
  /** Los agentes, dentro del menú del celular. */
  reparto?: Reparto[];
  /** Muestra el buscador del sitio ("Escribe / para buscar"). */
  buscar?: boolean;
};

/* ---------------------------------------------------------------------
   Navegar dentro del sitio: la ficha de un agente se abre aquí mismo si la
   página puede, y un ancla de la misma página baja suave.
   --------------------------------------------------------------------- */

function navegarEnSitio(href: string, pathname: string, ir: (href: string) => void) {
  const ficha = href.match(/[?&]ficha=([a-z]+)/)?.[1];
  if (ficha && document.documentElement.hasAttribute("data-fichas")) {
    window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: ficha }));
    return;
  }
  const gato = href.indexOf("#");
  const ruta = gato === -1 ? href : href.slice(0, gato) || pathname;
  const destino = gato === -1 ? null : document.getElementById(href.slice(gato + 1));
  if (ruta === pathname && destino) {
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    destino.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" });
    window.history.replaceState(null, "", `#${destino.id}`);
    return;
  }
  ir(href);
}

/** Para los <Link>: deja que el navegador abra en otra pestaña con Ctrl/⌘ o el botón de en medio. */
function esClicNormal(e: MouseEvent) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

const ICONOS: Record<string, NombreIcono> = {
  "/": "inicio",
  "/agentes": "agentes",
  "/precios": "facturacion",
  "/para-quien-es": "negocio",
  "/preguntas": "ayuda",
  "/pruebalo": "conversaciones",
  "/entrar": "persona",
  "/contacto": "correo",
};

/** Páginas que no están en el menú pero tienen nombre propio en la miga. */
const OTRAS_SECCIONES: NavItem[] = [
  { href: "/entrar", label: "Entrar" },
  { href: "/contacto", label: "Contacto" },
  { href: "/lista", label: "Lista de espera" },
];

const esDe = (pathname: string, href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

/* ---------------------------------------------------------------------
   El índice del buscador: solo lo que existe en el sitio (páginas,
   agentes, negocios, planes y preguntas), sin inventar nada.
   --------------------------------------------------------------------- */

type Destino = {
  id: string;
  grupo: "Páginas" | "Agentes" | "Negocios" | "Planes" | "Ayuda";
  titulo: string;
  detalle?: string;
  href: string;
  icono?: NombreIcono;
  agente?: IdAgente;
  claves?: string;
};

const DETALLE_PAGINA: Record<string, string> = {
  "/": "Qué es Atendel y cómo trabaja",
  "/agentes": "Lola, Clara, Víctor e Iris: qué hace cada uno",
  "/precios": "Planes Free, One y Max",
  "/para-quien-es": "Clínicas, estéticas, consultorios y servicios",
  "/preguntas": "Preguntas frecuentes",
  "/pruebalo": "Prueba a los agentes con datos de ejemplo",
};

const INDICE: Destino[] = [
  ...[...PAGINAS, PRUEBALO].map<Destino>((p) => ({
    id: `pagina${p.href}`,
    grupo: "Páginas",
    titulo: p.label,
    detalle: DETALLE_PAGINA[p.href],
    href: p.href,
    icono: ICONOS[p.href],
  })),
  { id: "pagina/contacto", grupo: "Páginas", titulo: "Contacto", detalle: "Escríbenos", href: "/contacto", icono: "correo" },
  { id: "pagina/entrar", grupo: "Páginas", titulo: "Entrar", detalle: "Con tu correo, sin contraseña", href: "/entrar", icono: "persona", claves: "iniciar sesión cuenta login" },
  ...AGENTES_INFO.map<Destino>((a) => ({
    id: `agente-${a.id}`,
    grupo: "Agentes",
    titulo: a.nombre,
    detalle: `${a.area} · ${a.abarca}`,
    href: `/agentes?ficha=${a.id}`,
    agente: a.id,
    claves: `${a.lema} ${a.capacidades.join(" ")}`,
  })),
  ...SEGMENTOS.map<Destino>((s) => ({
    id: `negocio-${s.id}`,
    grupo: "Negocios",
    titulo: s.nombre,
    detalle: s.intro,
    href: `/para-quien-es#${s.id}`,
    icono: "negocio",
  })),
  ...PLANES.map<Destino>((p) => ({
    id: `plan-${p.id}`,
    grupo: "Planes",
    titulo: p.nombre,
    detalle: p.resumen,
    href: "/precios",
    icono: "facturacion",
    claves: p.incluye.join(" "),
  })),
  {
    id: "ayuda-datos",
    grupo: "Ayuda",
    titulo: "Tus datos y seguridad",
    detalle: "Cada negocio ve solo lo suyo",
    href: "/preguntas#seguridad",
    icono: "candado",
    claves: "privacidad cifrado pacientes clientes seguridad",
  },
  ...PREGUNTAS.map<Destino>((p, i) => ({
    id: `pregunta-${i}`,
    grupo: "Ayuda",
    titulo: p.p,
    detalle: "Preguntas frecuentes",
    href: "/preguntas",
    icono: "ayuda",
    claves: p.r,
  })),
];

/** Lo que se ve al abrir el buscador sin escribir nada. */
const SUGERENCIAS = ["pagina/pruebalo", "pagina/agentes", "pagina/precios", "pagina/para-quien-es", "pagina/preguntas", ...AGENTES_INFO.map((a) => `agente-${a.id}`)]
  .map((id) => INDICE.find((d) => d.id === id))
  .filter((d): d is Destino => Boolean(d));

const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es-MX")
    .trim();

function buscarEnIndice(q: string): Destino[] {
  const nq = sinAcentos(q);
  if (!nq) return SUGERENCIAS;
  const puntos = (d: Destino) => {
    const t = sinAcentos(d.titulo);
    if (t.startsWith(nq)) return 3;
    if (t.includes(nq)) return 2;
    return sinAcentos(`${d.detalle ?? ""} ${d.claves ?? ""}`).includes(nq) ? 1 : 0;
  };
  return INDICE.map((d) => ({ d, p: puntos(d) }))
    .filter((r) => r.p > 0)
    .sort((a, b) => b.p - a.p)
    .slice(0, 10)
    .map((r) => r.d);
}

/** Marca lo que coincide con la búsqueda ("vic" en "Víctor"). */
function resaltar(texto: string, q: string): ReactNode {
  const nq = sinAcentos(q);
  if (!nq) return texto;
  const chars = Array.from(texto);
  const plano = chars.map((c) => sinAcentos(c).charAt(0) || c).join("");
  const i = plano.indexOf(nq);
  if (i < 0) return texto;
  return (
    <>
      {chars.slice(0, i).join("")}
      <mark className="busqueda__marca">{chars.slice(i, i + nq.length).join("")}</mark>
      {chars.slice(i + nq.length).join("")}
    </>
  );
}

function MarcaAgente({ id }: { id: IdAgente }) {
  return (
    <span className="marca-agente marca-agente--mini" style={{ "--agente": PERSONAJES[id].color } as CSSProperties} aria-hidden="true">
      <Personaje agente={id} avatar />
    </span>
  );
}

/* ---------------------------------------------------------------------
   Buscador del sitio: una ventana (como la paleta de búsqueda de un
   dashboard) con el campo arriba y los destinos abajo. Se abre con la
   píldora de la barra, con la lupa en celular o con "/".
   --------------------------------------------------------------------- */

function Busqueda({ abierta, alCerrar }: { abierta: boolean; alCerrar: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const temporizador = useRef<number | undefined>(undefined);
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState(0);
  const id = useId().replace(/:/g, "");

  const resultados = useMemo(() => buscarEnIndice(q), [q]);
  const grupos = useMemo(() => {
    const mapa = new Map<string, { d: Destino; i: number }[]>();
    resultados.forEach((d, i) => mapa.set(d.grupo, [...(mapa.get(d.grupo) ?? []), { d, i }]));
    return Array.from(mapa.entries());
  }, [resultados]);

  // Abrir y cerrar el <dialog> (encima de todo; lo demás se vuelve inerte)
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    window.clearTimeout(temporizador.current);
    if (abierta) {
      delete d.dataset.cerrando;
      if (!d.open) {
        setQ("");
        setActivo(0);
        d.showModal();
        campo.current?.focus();
      }
      // Un cuadro después, para que la entrada se anime desde el estado cerrado
      requestAnimationFrame(() => {
        d.dataset.abierto = "true";
      });
      return;
    }
    if (!d.open) return;
    d.dataset.cerrando = "true";
    delete d.dataset.abierto;
    temporizador.current = window.setTimeout(() => {
      d.close();
      delete d.dataset.cerrando;
      // Si se abrió con "/" no había foco previo: vuelve a la píldora del buscador
      requestAnimationFrame(() => {
        const foco = document.activeElement;
        if (!foco || foco === document.body || d.contains(foco)) {
          document.querySelector<HTMLElement>(".barra-sitio__buscar")?.focus();
        }
      });
    }, 150);
  }, [abierta]);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  // La opción activa siempre a la vista
  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-indice="${activo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activo]);

  const elegir = (d: Destino | undefined) => {
    if (!d) return;
    alCerrar();
    // Después de cerrar (el foco ya volvió a la barra)
    window.setTimeout(() => navegarEnSitio(d.href, pathname, (href) => router.push(href)), 0);
  };

  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!resultados.length) return;
      const paso = e.key === "ArrowDown" ? 1 : -1;
      setActivo((a) => (a + paso + resultados.length) % resultados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      elegir(resultados[activo]);
    }
  };

  const hayTexto = Boolean(q.trim());

  return (
    <dialog
      ref={dialogo}
      className="busqueda"
      aria-label="Buscar en el sitio"
      onCancel={(e) => {
        e.preventDefault();
        if (q) setQ("");
        else alCerrar();
      }}
      onClose={() => {
        if (dialogo.current?.dataset.abierto) {
          delete dialogo.current.dataset.abierto;
          alCerrar();
        }
      }}
    >
      <div className="busqueda__velo" onClick={alCerrar} aria-hidden="true" />
      <div className="busqueda__panel">
        <div className="busqueda__cabeza">
          <Icono nombre="buscar" tam={16} className="busqueda__lupa" />
          <input
            ref={campo}
            className="busqueda__campo"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-lista`}
            aria-activedescendant={resultados.length ? `${id}-op-${activo}` : undefined}
            aria-autocomplete="list"
            aria-label="Buscar en el sitio"
            placeholder="Busca una página, un agente o una pregunta"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActivo(0);
            }}
            onKeyDown={alTeclear}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="go"
          />
          <span className="busqueda__esc" aria-hidden="true">
            <Kbd>Esc</Kbd>
          </span>
          <button type="button" className="boton-icono boton-icono--capa boton-icono--compacto busqueda__cerrar" aria-label="Cerrar la búsqueda" onClick={alCerrar}>
            <Icono nombre="cerrar" tam={16} />
          </button>
        </div>

        <div className="busqueda__cuerpo">
          <p className="sr-only" aria-live="polite">
            {hayTexto ? (resultados.length ? `${resultados.length} resultados` : "Sin resultados") : ""}
          </p>
          {resultados.length ? (
            <ul ref={lista} id={`${id}-lista`} role="listbox" aria-label={hayTexto ? "Resultados" : "Sugerencias"} className="busqueda__lista">
              {grupos.map(([grupo, filas]) => (
                <li key={grupo} role="presentation">
                  <p className="busqueda__grupo" aria-hidden="true">
                    {hayTexto ? grupo : grupo === "Páginas" ? "Sugerencias" : grupo}
                  </p>
                  <ul role="group" aria-label={grupo}>
                    {filas.map(({ d, i }) => (
                      <li
                        key={d.id}
                        id={`${id}-op-${i}`}
                        role="option"
                        aria-selected={i === activo}
                        data-indice={i}
                        className="busqueda__opcion"
                        onMouseMove={() => i !== activo && setActivo(i)}
                        onClick={() => elegir(d)}
                      >
                        {d.agente ? <MarcaAgente id={d.agente} /> : <Icono nombre={d.icono ?? "flecha"} tam={16} />}
                        <span className="busqueda__texto">
                          <span className="busqueda__titulo">{resaltar(d.titulo, q)}</span>
                          {d.detalle ? <span className="busqueda__detalle">{d.detalle}</span> : null}
                        </span>
                        <span className="busqueda__ir" aria-hidden="true">
                          <Kbd>↵</Kbd>
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="busqueda__nada">
              Nada con «{q.trim()}». Prueba con «citas», «correo», «precios» o el nombre de un agente.
            </p>
          )}
        </div>

        <p className="busqueda__pie" aria-hidden="true">
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> para moverte
          </span>
          <span>
            <Kbd>↵</Kbd> para abrir
          </span>
          <span>
            <Kbd>Esc</Kbd> para cerrar
          </span>
        </p>
      </div>
    </dialog>
  );
}

/* ---------------------------------------------------------------------
   Logo con el nombre de la sección, como en la barra del dashboard:
   "Atendel / Precios". En celular queda la marca y la sección.
   --------------------------------------------------------------------- */

function Miga({ homeHref, seccion, alIr }: { homeHref: string; seccion?: string; alIr?: () => void }) {
  return (
    <div className="miga" data-seccion={seccion ? "true" : undefined}>
      <Link href={homeHref} className="miga__logo" aria-label="Atendel, inicio" onClick={alIr}>
        <Marca className="miga__marca" />
        <span className="miga__nombre">Atendel</span>
      </Link>
      {seccion ? (
        <>
          <span className="miga__separador" aria-hidden="true">
            /
          </span>
          <span className="miga__seccion">{seccion}</span>
        </>
      ) : null}
    </div>
  );
}

/**
 * Barra pública con el lenguaje de la barra del dashboard:
 * - Logo con el nombre de la sección ("Atendel / Precios").
 * - Las páginas (16px), con una línea azul bajo la página en la que estás.
 * - A la derecha: el buscador redondo "Escribe / para buscar" (lleva a
 *   cualquier página, agente, negocio o pregunta), el modo claro/oscuro en un
 *   botón de ícono con borde, "Entrar" (fantasma) y "Pruébalo" (sutil).
 * - Transparente arriba; al bajar, vidrio con desenfoque y una orilla de 1px.
 * - Celular: hamburguesa con borde (con aria-label, sin la palabra "Menú"),
 *   la marca con la sección, la lupa y "Pruébalo". El menú es el mismo cajón
 *   del dashboard, a pantalla completa (se cierra con Esc, tocando ✕ o
 *   deslizándolo con el dedo).
 */
export function Nav({ items, destacado, homeHref = "/", desktopRight, mobileBottom, reparto, buscar = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [busqueda, setBusqueda] = useState(false);
  const [bajado, setBajado] = useState(false);

  // La barra se vuelve vidrio cuando ya bajaste
  useEffect(() => {
    const actualizar = () => setBajado(window.scrollY > 4);
    actualizar();
    window.addEventListener("scroll", actualizar, { passive: true });
    return () => window.removeEventListener("scroll", actualizar);
  }, []);

  // Al cambiar de página se cierra todo
  useEffect(() => {
    setMenu(false);
    setBusqueda(false);
  }, [pathname]);

  // Si la pantalla crece a computadora, el menú del celular ya no hace falta
  useEffect(() => {
    if (!menu) return;
    const computadora = window.matchMedia("(min-width: 1024px)");
    const alCrecer = () => computadora.matches && setMenu(false);
    computadora.addEventListener("change", alCrecer);
    return () => computadora.removeEventListener("change", alCrecer);
  }, [menu]);

  // "/" abre el buscador (si no estás escribiendo y si la página no tiene ya su propio buscador con atajo)
  useEffect(() => {
    if (!buscar) return;
    const alTeclear = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      e.preventDefault();
      setBusqueda(true);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [buscar]);

  const alElegir = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!esClicNormal(e)) return;
      e.preventDefault();
      setMenu(false);
      navegarEnSitio(href, pathname, (h) => router.push(h));
    },
    [pathname, router],
  );

  const todas = destacado ? [...items, destacado] : items;
  const seccion =
    pathname === homeHref ? undefined : [...todas, ...OTRAS_SECCIONES].filter((i) => i.href !== homeHref).find((i) => esDe(pathname, i.href))?.label;
  const actual = (href: string) => (pathname === href ? "page" : esDe(pathname, href) && href !== homeHref ? "true" : undefined);
  const abrirBusqueda = () => setBusqueda(true);

  return (
    <>
      <header className="barra-sitio" data-bajado={bajado ? "true" : "false"} data-portada={buscar && pathname === "/" ? "true" : undefined}>
        <div className="barra-sitio__fila">
          <button
            type="button"
            className="boton-icono boton-icono--capa boton-icono--compacto barra-sitio__icono barra-sitio__solo-movil"
            aria-label="Abrir el menú"
            aria-haspopup="dialog"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <Icono nombre="menu" tam={16} />
          </button>

          <Miga homeHref={homeHref} seccion={seccion} />

          <nav className="barra-sitio__enlaces" aria-label="Principal">
            {items
              .filter((item) => item.href !== homeHref)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="barra-sitio__enlace"
                  aria-current={actual(item.href)}
                  onClick={(e) => alElegir(e, item.href)}
                >
                  {item.label}
                </Link>
              ))}
          </nav>

          <div className="barra-sitio__acciones">
            {buscar ? (
              <button
                type="button"
                className="barra-sitio__buscar"
                aria-label="Buscar en el sitio"
                aria-haspopup="dialog"
                aria-expanded={busqueda}
                aria-keyshortcuts="/"
                onClick={abrirBusqueda}
              >
                <Icono nombre="buscar" tam={16} />
                <span className="barra-sitio__buscar-texto" aria-hidden="true">
                  Escribe <Kbd>/</Kbd> para buscar
                </span>
                <span className="barra-sitio__buscar-corto" aria-hidden="true">
                  Buscar
                </span>
              </button>
            ) : null}
            <span className="barra-sitio__division barra-sitio__solo-escritorio" aria-hidden="true" />
            <BotonTema className="barra-sitio__solo-escritorio" />
            <div className="barra-sitio__solo-escritorio barra-sitio__cuenta">
              {desktopRight ?? (
                <Link href="/entrar" className="boton boton--fantasma boton--compacto boton--solo-texto" aria-current={actual("/entrar")}>
                  Entrar
                </Link>
              )}
            </div>
            {destacado ? (
              <Link href={destacado.href} className="boton boton--sutil boton--compacto barra-sitio__destacado" aria-current={actual(destacado.href)}>
                {destacado.label}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {buscar ? <Busqueda abierta={busqueda} alCerrar={() => setBusqueda(false)} /> : null}

      <Cajon
        abierto={menu}
        alCerrar={() => setMenu(false)}
        etiqueta="Menú de Atendel"
        className="menu-sitio"
        cabeza={<Miga homeHref={homeHref} alIr={() => setMenu(false)} />}
      >
        <div className="menu-sitio__cuerpo">
          {buscar ? (
            <button type="button" className="menu-sitio__buscar" onClick={abrirBusqueda} aria-haspopup="dialog">
              <Icono nombre="buscar" tam={16} />
              Buscar en el sitio
            </button>
          ) : null}

          <nav aria-label="Páginas">
            <ul className="menu-sitio__lista">
              {todas.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="menu-sitio__fila" aria-current={actual(item.href)} onClick={(e) => alElegir(e, item.href)}>
                    {ICONOS[item.href] ? <Icono nombre={ICONOS[item.href]} tam={16} /> : null}
                    <span className="menu-sitio__texto">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {reparto?.length ? (
            <section aria-labelledby="menu-sitio-agentes" className="menu-sitio__bloque">
              <h2 id="menu-sitio-agentes" className="menu-sitio__titulo">
                Los agentes
              </h2>
              <ul className="menu-sitio__lista">
                {reparto.map((r) => (
                  <li key={r.id}>
                    <Link href={r.href} className="menu-sitio__fila menu-sitio__fila--agente" onClick={(e) => alElegir(e, r.href)}>
                      <MarcaAgente id={r.id} />
                      <span className="menu-sitio__texto">
                        <span className="menu-sitio__nombre">{r.nombre}</span>
                        <span className="menu-sitio__papel">{r.papel}</span>
                      </span>
                      <Icono nombre="chevron-derecha" tam={16} className="menu-sitio__chevron" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="menu-sitio__bloque">
            <SelectorTema bloque />
          </div>

          {(mobileBottom ?? desktopRight) ? <div className="menu-sitio__acciones">{mobileBottom ?? desktopRight}</div> : null}
        </div>
      </Cajon>
    </>
  );
}
