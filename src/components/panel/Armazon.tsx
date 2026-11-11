"use client";

import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import { ponerTema } from "@/lib/tema";
import { serifPanel } from "./fuente";
import { PilaAgentes } from "./Mensajes";
import { Marca } from "@/components/Logo";
import { ContextoNavegar, EVENTO_BUSCAR, Enlace, Modal } from "./Piezas";
import { useTema } from "./useTema";
import "./panel.css";

export type IdSeccion = "inicio" | "chat" | "agentes" | "pendientes" | "citas" | "negocio" | "estadisticas" | "ajustes" | "correo";
export type ChatMenu = { id: string; titulo: string; href: string; agentes: IdAgente[] };
export type ResultadoBusqueda = { id: string; grupo: string; titulo: string; detalle?: string; href: string; icono?: NombreIcono; agentes?: IdAgente[]; claves?: string };
export type ElementoCuenta = { id: string; etiqueta: string; detalle?: string; href?: string; alElegir?: () => void; icono: NombreIcono; peligroso?: boolean };

type Props = {
  activa: IdSeccion;
  /** La conversación abierta (se marca en Fijados o Recientes). */
  chatActual?: string | null;
  hrefs: { inicio: string; agentes: string; pendientes: string; citas: string; negocio: string; estadisticas: string; ajustes: string };
  /** Lo que espera algo de ti (null: no se pudo leer). */
  pendientes: number | null;
  /** Los chats en grupo. */
  fijados: ChatMenu[];
  /** Las conversaciones. */
  recientes: ChatMenu[];
  usuario: { nombre: string; plan: string };
  cuenta: ElementoCuenta[];
  indice: ResultadoBusqueda[];
  /** Encima del pie del menú y en la barra del celular (en /pruebalo: "Datos de ejemplo"). */
  aviso?: ReactNode;
  /** Antes de que un enlace navegue (el panel lo usa para la transición entre vistas). */
  alCapturarClic?: (e: MouseEvent<HTMLDivElement>) => void;
  /** El panel de información de la derecha (en el inicio y en el chat). Recibe cómo cerrarse. */
  info?: (alCerrar: () => void) => ReactNode;
  children: ReactNode;
};

/** React 18 no conoce `inert`: así sale como atributo vacío (inert=""), que es lo que pide el HTML. */
const INERTE = { inert: "" } as unknown as { inert?: boolean };
const CLAVE_OCULTO = "atendel-panel-menu-oculto";
const CLAVE_INFO = "atendel-panel-info";
const CELULAR = "(max-width: 859px)";
/** Debajo de este ancho, la información flota encima del chat (no le quita espacio). */
const ANGOSTO = "(max-width: 1359px)";

/**
 * El armazón del panel: el menú de 288px (en oscuro, igual a la captura;
 * en claro, una tarjeta blanca flotante sobre el lienzo gris), con
 * "+ Nueva conversación", las secciones, Fijados y Recientes, y el pie con
 * tu cuenta y el tema. En celular, el menú es un cajón (foco adentro y Esc
 * lo cierra). ⌘K abre el buscador.
 */
export function Armazon({ activa, chatActual, hrefs, pendientes, fijados, recientes, usuario, cuenta, indice, aviso, alCapturarClic, info, children }: Props) {
  const [cajon, setCajon] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [infoAbierta, setInfoAbierta] = useState(false);
  /** La información se arma la primera vez que se abre y se queda (así también se anima al cerrarse). */
  const [infoMontada, setInfoMontada] = useState(false);
  const [angosto, setAngosto] = useState(false);
  /** Hasta que se lee lo guardado no hay transiciones (si no, el menú y la información se moverían al cargar). */
  const [listo, setListo] = useState(false);
  const [buscar, setBuscar] = useState<{ instantaneo: boolean } | null>(null);
  const [celular, setCelular] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const principalRef = useRef<HTMLDivElement>(null);
  const hamburguesa = useRef<HTMLButtonElement>(null);
  const tema = useTema();

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLAVE_OCULTO) === "1") setOculto(true);
    } catch {
      /* sin almacenamiento: visible */
    }
    const mqAngosto = window.matchMedia(ANGOSTO);
    let guardada: string | null = null;
    try {
      guardada = window.localStorage.getItem(CLAVE_INFO);
    } catch {
      /* sin almacenamiento */
    }
    // La primera vez: abierta en pantallas anchas, cerrada en las demás
    setInfoAbierta(mqAngosto.matches ? false : guardada !== "0");
    setAngosto(mqAngosto.matches);
    const alCambiarAncho = () => {
      setAngosto(mqAngosto.matches);
      if (mqAngosto.matches) setInfoAbierta(false);
    };
    mqAngosto.addEventListener("change", alCambiarAncho);
    const cuadro = requestAnimationFrame(() => requestAnimationFrame(() => setListo(true)));
    const mq = window.matchMedia(CELULAR);
    const alCambiar = () => {
      setCelular(mq.matches);
      if (!mq.matches) setCajon(false);
    };
    alCambiar();
    mq.addEventListener("change", alCambiar);
    return () => {
      mq.removeEventListener("change", alCambiar);
      mqAngosto.removeEventListener("change", alCambiarAncho);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  useEffect(() => {
    if (infoAbierta) setInfoMontada(true);
  }, [infoAbierta]);

  const ponerInfo = useCallback(
    (abierta: boolean) => {
      setInfoAbierta(abierta);
      // Solo se recuerda en pantallas anchas (en las angostas flota y se cierra sola)
      if (!angosto)
        try {
          window.localStorage.setItem(CLAVE_INFO, abierta ? "1" : "0");
        } catch {
          /* sin almacenamiento */
        }
    },
    [angosto],
  );
  const cerrarInfo = useCallback(() => ponerInfo(false), [ponerInfo]);

  // Flotando (pantalla angosta): Esc la cierra
  useEffect(() => {
    if (!(info && infoAbierta && angosto)) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarInfo();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [info, infoAbierta, angosto, cerrarInfo]);

  const alternarOculto = () => {
    setOculto((o) => {
      try {
        window.localStorage.setItem(CLAVE_OCULTO, o ? "0" : "1");
      } catch {
        /* sin almacenamiento */
      }
      return !o;
    });
  };

  // ⌘K / Ctrl K: el buscador, sin animación (se abre con el teclado muchas veces al día)
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscar((b) => (b ? null : { instantaneo: true }));
      }
    };
    const evento = () => setBuscar({ instantaneo: false });
    window.addEventListener("keydown", tecla);
    window.addEventListener(EVENTO_BUSCAR, evento);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener(EVENTO_BUSCAR, evento);
    };
  }, []);

  // El cajón del celular: lo de atrás queda inerte, el foco adentro y Esc lo cierra
  const abiertoEnCelular = cajon && celular;
  useEffect(() => {
    const principal = principalRef.current;
    if (!abiertoEnCelular || !principal) return;
    principal.setAttribute("inert", "");
    const menu = menuRef.current;
    const boton = hamburguesa.current;
    menu?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCajon(false);
        return;
      }
      if (e.key !== "Tab" || !menu) return;
      const f = [...menu.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)")].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const [a, z] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => {
      principal.removeAttribute("inert");
      window.removeEventListener("keydown", tecla);
      boton?.focus({ preventScroll: true });
    };
  }, [abiertoEnCelular]);

  const item = (id: IdSeccion, etiqueta: string, icono: NombreIcono, href: string, extra?: ReactNode) => (
    <Enlace href={href} className="pc-menu__item" aria-current={activa === id ? "page" : undefined} title={oculto ? etiqueta : undefined}>
      <Icono nombre={icono} tam={18} />
      <span className="pc-menu__item-texto">{etiqueta}</span>
      {extra}
    </Enlace>
  );

  return (
    <div
      className={`pc ${serifPanel.variable}`}
      data-menu={oculto ? "oculto" : undefined}
      data-cajon={cajon ? "abierto" : undefined}
      data-info={info ? (infoAbierta ? "abierta" : "cerrada") : undefined}
      data-listo={listo ? "" : undefined}
      onClickCapture={alCapturarClic}
    >
      <a href="#pc-contenido" className="pc-saltar">
        Ir al contenido
      </a>
      <aside
        ref={menuRef}
        id="pc-menu"
        className="pc-menu"
        aria-label="Menú del panel"
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest("a[href]")) setCajon(false);
        }}
      >
        <div className="pc-menu__tarjeta">
          <div className="pc-menu__cabeza">
            <Enlace href={hrefs.inicio} className="pc-menu__logo" aria-label="Atendel, ir al inicio">
              <Marca className="pc-logo__marca" />
              <span className="pc-logo__nombre">Atendel</span>
            </Enlace>
            <button
              type="button"
              className="pc-icono pc-menu__ocultar"
              onClick={() => (celular ? setCajon(false) : alternarOculto())}
              aria-label={celular ? "Cerrar el menú" : oculto ? "Abrir el menú" : "Encoger el menú"}
              title={celular ? "Cerrar el menú" : oculto ? "Abrir el menú" : "Encoger el menú"}
              aria-expanded={celular ? undefined : !oculto}
            >
              <Icono nombre={celular ? "cerrar" : "barra-lateral"} tam={18} />
            </button>
          </div>

          <nav className="pc-menu__nav" aria-label="Secciones">
            <Enlace href={hrefs.inicio} className="pc-menu__nuevo" aria-current={activa === "inicio" ? "page" : undefined} title={oculto ? "Nueva conversación" : undefined}>
              <Icono nombre="mas" tam={18} />
              <span>Nueva conversación</span>
            </Enlace>
            <button type="button" className="pc-menu__item pc-menu__buscar" onClick={() => setBuscar({ instantaneo: false })} aria-keyshortcuts="Meta+K Control+K" title={oculto ? "Buscar (⌘K)" : undefined}>
              <Icono nombre="buscar" tam={18} />
              <span className="pc-menu__item-texto">Buscar</span>
              <kbd className="pc-menu__atajo" aria-hidden="true">
                ⌘K
              </kbd>
            </button>
            {item("agentes", "Agentes", "agentes", hrefs.agentes)}
            {item(
              "pendientes",
              "Pendientes",
              "check-circulo",
              hrefs.pendientes,
              pendientes ? (
                <span className="pc-menu__cuenta" aria-label={`${pendientes} por revisar`}>
                  {pendientes}
                </span>
              ) : null,
            )}
            {item("citas", "Citas", "calendario", hrefs.citas)}
            {item("negocio", "Tu negocio", "negocio", hrefs.negocio)}
            {item("estadisticas", "Estadísticas", "grafica", hrefs.estadisticas)}
            {item("ajustes", "Ajustes", "ajustes", hrefs.ajustes)}
          </nav>

          <div className="pc-menu__listas">
            <ListaChats titulo="Fijados" chats={fijados} actual={chatActual} grupos vacio="Tus chats en grupo aparecen aquí." />
            <ListaChats titulo="Recientes" chats={recientes} actual={chatActual} vacio="Aquí aparecen tus conversaciones." />
          </div>

          {aviso ? <div className="pc-aviso-demo">{aviso}</div> : null}
          <div className="pc-menu__pie">
            <MenuCuenta usuario={usuario} elementos={cuenta} />
            <button
              type="button"
              className="pc-icono"
              onClick={() => ponerTema(tema === "oscuro" ? "claro" : "oscuro")}
              aria-label={tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
            >
              <Icono nombre={tema === "oscuro" ? "sol" : "luna"} tam={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="pc-velo" aria-hidden="true" onClick={() => setCajon(false)} />

      <div ref={principalRef} className="pc-principal">
        <div className="pc-barra-movil">
          <button
            ref={hamburguesa}
            type="button"
            className="pc-icono"
            onClick={() => setCajon(true)}
            aria-label="Abrir el menú"
            aria-expanded={cajon}
            aria-controls="pc-menu"
          >
            <Icono nombre="menu" tam={20} />
          </button>
          <Enlace href={hrefs.inicio} className="pc-menu__logo" aria-label="Atendel, ir al inicio">
            <Marca className="pc-logo__marca" />
            <span className="pc-logo__nombre">Atendel</span>
          </Enlace>
          {aviso ? <div className="pc-aviso-demo pc-aviso-demo--movil">{aviso}</div> : null}
          <Enlace href={hrefs.inicio} className="pc-icono" aria-label="Nueva conversación">
            <Icono nombre="mas" tam={20} />
          </Enlace>
        </div>
        {info ? (
          <button
            type="button"
            className="pc-icono pc-info-boton"
            onClick={() => ponerInfo(!infoAbierta)}
            aria-expanded={infoAbierta}
            aria-controls="pc-info"
            aria-label={infoAbierta ? "Ocultar la información" : "Mostrar la información"}
            title={infoAbierta ? "Ocultar la información" : "Mostrar la información"}
          >
            <Icono nombre="barra-lateral" tam={18} />
          </button>
        ) : null}
        <main id="pc-contenido" className="pc-contenido" tabIndex={-1}>
          {children}
        </main>
      </div>

      {info ? (
        <>
          <aside
            id="pc-info"
            className="pc-lateral"
            aria-label="Información de tu negocio"
            data-abierta={infoAbierta ? "" : undefined}
            aria-hidden={infoAbierta ? undefined : true}
            {...(infoAbierta ? {} : INERTE)}
          >
            <div className="pc-lateral__dentro">{infoAbierta || infoMontada ? info(cerrarInfo) : null}</div>
          </aside>
          {angosto ? <div className="pc-velo-info" aria-hidden="true" data-visible={infoAbierta ? "" : undefined} onClick={cerrarInfo} /> : null}
        </>
      ) : null}

      <Buscador abierto={buscar !== null} instantaneo={buscar?.instantaneo ?? false} alCerrar={() => setBuscar(null)} indice={indice} />
    </div>
  );
}

/* ---------- Fijados y Recientes ---------- */

function ListaChats({ titulo, chats, actual, grupos = false, vacio }: { titulo: string; chats: ChatMenu[]; actual?: string | null; grupos?: boolean; vacio: string }) {
  const [abierta, setAbierta] = useState(true);
  const id = useId();
  return (
    <section className="pc-menu__grupo">
      <h2 className="pc-menu__titulo">
        <button type="button" className="pc-menu__titulo-boton" aria-expanded={abierta} aria-controls={id} onClick={() => setAbierta((a) => !a)}>
          {titulo}
          <span className="pc-menu__triangulo" aria-hidden="true" />
        </button>
      </h2>
      <div id={id} className="pc-plegable" data-cerrado={abierta ? undefined : ""} aria-hidden={abierta ? undefined : true} {...(abierta ? {} : INERTE)}>
        <div className="pc-plegable__dentro">
        {chats.length ? (
          <ul className="pc-menu__chats">
            {chats.map((c) => (
              <li key={c.id}>
                <Enlace href={c.href} className="pc-menu__chat" aria-current={actual === c.id ? "page" : undefined} title={c.titulo}>
                  {grupos ? <PilaAgentes agentes={c.agentes} tam={18} /> : null}
                  <span className="pc-menu__chat-texto">{c.titulo}</span>
                </Enlace>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pc-menu__vacio">{vacio}</p>
        )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Tu cuenta (al pie) ---------- */

function MenuCuenta({ usuario, elementos }: { usuario: { nombre: string; plan: string }; elementos: ElementoCuenta[] }) {
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const antes = useRef(false);
  useEffect(() => {
    if (antes.current && !abierto) {
      setCerrando(true);
      const t = window.setTimeout(() => setCerrando(false), 120);
      antes.current = abierto;
      return () => window.clearTimeout(t);
    }
    antes.current = abierto;
    setCerrando(false);
  }, [abierto]);
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const inicial = (usuario.nombre.trim()[0] ?? "?").toLocaleUpperCase("es-MX");

  useEffect(() => {
    if (!abierto) return;
    raiz.current?.querySelector<HTMLElement>(".pc-cuenta__lista a, .pc-cuenta__lista button")?.focus({ preventScroll: true });
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("pointerdown", fuera);
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("pointerdown", fuera);
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  return (
    <div ref={raiz} className="pc-cuenta">
      <button ref={boton} type="button" className="pc-cuenta__boton" aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto((a) => !a)}>
        <span className="pc-cuenta__inicial" aria-hidden="true">
          {inicial}
        </span>
        <span className="pc-cuenta__nombre">{usuario.nombre}</span>
        <span className="pc-cuenta__plan">· {usuario.plan}</span>
        <Icono nombre="chevron" tam={14} trazo={2} />
      </button>
      {abierto || cerrando ? (
        <ul id={id} className="pc-cuenta__lista" data-cerrando={abierto ? undefined : ""} {...(abierto ? {} : INERTE)}>
          {elementos.map((e) => (
            <li key={e.id}>
              {e.href ? (
                <Enlace href={e.href} className={`pc-cuenta__item${e.peligroso ? " pc-cuenta__item--peligro" : ""}`} onClick={() => setAbierto(false)}>
                  <Icono nombre={e.icono} tam={16} />
                  <span className="pc-cuenta__textos">
                    <span>{e.etiqueta}</span>
                    {e.detalle ? <span className="pc-cuenta__detalle">{e.detalle}</span> : null}
                  </span>
                </Enlace>
              ) : (
                <button
                  type="button"
                  className={`pc-cuenta__item${e.peligroso ? " pc-cuenta__item--peligro" : ""}`}
                  onClick={() => {
                    setAbierto(false);
                    e.alElegir?.();
                  }}
                >
                  <Icono nombre={e.icono} tam={16} />
                  <span className="pc-cuenta__textos">
                    <span>{e.etiqueta}</span>
                    {e.detalle ? <span className="pc-cuenta__detalle">{e.detalle}</span> : null}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ---------- Buscador (⌘K) ---------- */

const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function Buscador({ abierto, instantaneo, alCerrar, indice }: { abierto: boolean; instantaneo: boolean; alCerrar: () => void; indice: ResultadoBusqueda[] }) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);
  const local = useContext(ContextoNavegar);
  const router = useRouter();
  const id = useId();

  const resultados = useMemo(() => {
    const t = sinAcentos(q.trim());
    const lista = t ? indice.filter((r) => sinAcentos(`${r.titulo} ${r.detalle ?? ""} ${r.grupo} ${r.claves ?? ""}`).includes(t)) : indice.filter((r) => r.grupo === "Secciones" || r.grupo === "Tu equipo");
    return lista.slice(0, 12);
  }, [q, indice]);

  useEffect(() => {
    if (!abierto) return;
    setQ("");
    setCursor(0);
    entrada.current?.focus({ preventScroll: true });
  }, [abierto]);

  const ir = useCallback(
    (r: ResultadoBusqueda | undefined) => {
      if (!r) return;
      alCerrar();
      if (local) local(r.href);
      else router.push(r.href);
    },
    [alCerrar, local, router],
  );

  return (
    <Modal abierto={abierto} alCerrar={alCerrar} titulo="Buscar en tu panel" instantaneo={instantaneo} ancho="ancho" className="pc-buscador">
      <div className="pc-buscador__campo">
        <Icono nombre="buscar" tam={18} />
        <input
          ref={entrada}
          className="pc-buscador__entrada"
          placeholder="Secciones, agentes, conversaciones…"
          value={q}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-r`}
          aria-activedescendant={resultados[cursor] ? `${id}-${cursor}` : undefined}
          aria-label="Buscar"
          onChange={(e) => {
            setQ(e.target.value);
            setCursor(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, resultados.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              ir(resultados[cursor]);
            }
          }}
        />
      </div>
      <ul id={`${id}-r`} className="pc-buscador__lista" role="listbox" aria-label="Resultados">
        {resultados.map((r, i) => (
          <li
            key={r.id}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === cursor}
            className="pc-buscador__fila"
            onPointerEnter={() => setCursor(i)}
            onClick={() => ir(r)}
          >
            {r.agentes?.length ? <PilaAgentes agentes={r.agentes} tam={20} /> : <Icono nombre={r.icono ?? "flecha"} tam={18} />}
            <span className="pc-buscador__textos">
              <span className="pc-buscador__titulo">{r.titulo}</span>
              {r.detalle ? <span className="pc-buscador__detalle">{r.detalle}</span> : null}
            </span>
            <span className="pc-buscador__grupo">{r.grupo}</span>
          </li>
        ))}
        {resultados.length === 0 ? <li className="pc-buscador__nada">Nada coincide con “{q}”.</li> : null}
      </ul>
    </Modal>
  );
}
