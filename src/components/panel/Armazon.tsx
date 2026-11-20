"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { IconoBarra } from "./IconosBarra";
import type { IdAgente } from "@/lib/agentes";
import { clasesFuentesApariencia, serifPanel } from "./fuente";
import { TraduccionPanel } from "./TraduccionPanel";

/** La misma cookie que IDIOMA_COOKIE de src/i18n (sin importar los diccionarios del sitio). */
const IDIOMA_COOKIE = "atendel-idioma";
import { TABS_INFO, esTabInfo, type TabInfo } from "./PanelInfo";
import { Marca } from "@/components/Logo";
import { EntradaPanel, type FaseEntrada } from "./EntradaPanel";
import { VentanaAjustes, esIdAjuste, type DatosAjustes, type IdAjuste } from "./Ajustes";
import { aparienciaDe, type Apariencia } from "@/lib/ajustes";
import { CLAVE_ENTRADA } from "@/lib/entrada";
import { ContextoNavegar, EVENTO_BUSCAR, Enlace, Modal } from "./Piezas";
import { ConectarApps, EVENTO_CONECTAR } from "./ConectarApps";
import { AprobarAccion } from "./AprobarAccion";
import { SeccionesChats, type AccionesChats } from "./MenuChats";
import type { OrganizacionChats } from "@/lib/organizacion-chats";
import { APP_POR_ID, esIdApp } from "@/lib/conexiones/catalogo";
import type { IdApp } from "@/lib/nucleo-tipos";
import "./panel.css";

export type IdSeccion = "tablero" | "apps" | "inicio" | "chat" | "agentes" | "oficina" | "tareas" | "pendientes" | "citas" | "negocio" | "estadisticas" | "ajustes" | "correo";
/** Una conversación del menú. `campo`: de dónde sale su nombre (el tema de un grupo o el título), para cambiarlo. */
/** El id de algo que espera tu OK (?aprobar=<id>). */
const ID_ACCION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ChatMenu = {
  id: string;
  titulo: string;
  href: string;
  agentes: IdAgente[];
  campo?: "tema" | "titulo";
  /** "Avisos de Atendel": lleva un puntito cuando hay avisos que no has visto. */
  avisos?: boolean;
  /** Cuándo cambió por última vez (ISO), para el puntito. */
  actualizado?: string;
};
export type ResultadoBusqueda = { id: string; grupo: string; titulo: string; detalle?: string; href: string; icono?: NombreIcono; agentes?: IdAgente[]; claves?: string };
export type ElementoCuenta = { id: string; etiqueta: string; detalle?: string; href?: string; alElegir?: () => void; icono: NombreIcono; peligroso?: boolean };

type Props = {
  activa: IdSeccion;
  /** La conversación abierta (se marca en Fijados o Recientes). */
  chatActual?: string | null;
  hrefs: { tablero?: string; inicio: string; tareas: string; pendientes: string; citas: string; negocio: string; estadisticas: string; ajustes: string; oficina?: string; correo?: string; apps?: string };
  /** Lo que Atendel dejó en la Oficina para revisar (el número junto a «Oficina»). */
  porRevisar?: number | null;
  /** Lo que espera algo de ti (null: no se pudo leer). */
  pendientes: number | null;
  /** Lo que te necesita (OK pendientes y archivos por revisar): el número de «Hoy». */
  teNecesita?: number | null;
  /** Las conversaciones, de la más nueva a la más vieja. */
  chats: ChatMenu[];
  /** Cómo las acomodó: fijadas, archivadas y sus grupos. */
  organizacion: OrganizacionChats;
  /** Lo que hace el "⋯" de cada conversación (Fijar, Cambiar nombre, Mover a grupo, Archivar, Eliminar). */
  acciones: AccionesChats;
  usuario: { nombre: string; plan: string };
  cuenta: ElementoCuenta[];
  indice: ResultadoBusqueda[];
  /** Encima del pie del menú y en la barra del celular (en /pruebalo: "Datos de ejemplo"). */
  aviso?: ReactNode;
  /** Antes de que un enlace navegue (el panel lo usa para la transición entre vistas). */
  alCapturarClic?: (e: MouseEvent<HTMLDivElement>) => void;
  /** El panel de información de la derecha (en el inicio y en el chat): qué pestaña y cómo cambiarla o cerrarse. */
  info?: (p: { tab: TabInfo; pedido: number; alIr: (t: TabInfo) => void; alVer: (t: TabInfo) => void; alCerrar: () => void }) => ReactNode;
  /** Lo que muestra la ventana de Ajustes (se abre con el engrane del pie del menú o con un enlace a ?vista=ajustes). */
  ajustes: DatosAjustes;
  /** Piezas que flotan sobre todo (ej. «¿Te aviso en este aparato?»): van dentro de .pc para tomar sus colores y sus botones. */
  flotantes?: ReactNode;
  children: ReactNode;
};

/** React 18 no conoce `inert`: así sale como atributo vacío (inert=""), que es lo que pide el HTML. */
const INERTE = { inert: "" } as unknown as { inert?: boolean };
const CLAVE_OCULTO = "atendel-panel-menu-oculto";
const CLAVE_INFO = "atendel-panel-info";
const CLAVE_TAB = "atendel-panel-info-tab";
const CELULAR = "(max-width: 859px)";
/** Las secciones de cada tema de la barra de abajo del celular. */
const TEMA_DIA: IdSeccion[] = ["pendientes", "oficina", "citas", "tareas"];
const TEMA_NEGOCIO: IdSeccion[] = ["correo", "estadisticas", "apps", "negocio"];
/** Debajo de este ancho, la información flota encima del chat (no le quita espacio). */
const ANGOSTO = "(max-width: 1359px)";

/** «+ Nueva conversación»: ya en «Hoy», la caja de Atendel queda lista para escribir (se espera a que la vista cambie). */
function enfocarCaja() {
  const campo = () => document.querySelector<HTMLElement>(".pc-inicio .pc-caja textarea, .pc-inicio .pc-caja [contenteditable], .pc-inicio .pc-caja input");
  let intentos = 0;
  const buscar = () => {
    const c = campo();
    if (c) c.focus({ preventScroll: true });
    else if (++intentos < 30) window.setTimeout(buscar, 50);
  };
  window.setTimeout(buscar, 60);
  // Si la vista cambió después (la transición reacomoda la página), una vez más con la caja ya puesta
  window.setTimeout(() => {
    const c = campo();
    if (c && document.activeElement !== c) c.focus({ preventScroll: true });
  }, 450);
}

/**
 * El armazón del panel: el menú de 288px (en oscuro, igual a la captura;
 * en claro, una tarjeta blanca flotante sobre el lienzo gris), con
 * "+ Nueva conversación", las secciones, Fijados y Recientes, y el pie con
 * tu cuenta y el engrane de Ajustes (una ventana). En celular, el menú es un cajón (foco adentro y Esc
 * lo cierra). ⌘K abre el buscador.
 */
export function Armazon({ activa, chatActual, hrefs, pendientes, teNecesita, porRevisar, chats, organizacion, acciones, usuario, cuenta, indice, aviso, alCapturarClic, info, ajustes, flotantes, children }: Props) {
  const [cajon, setCajon] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [infoAbierta, setInfoAbierta] = useState(false);
  /** La información se arma la primera vez que se abre y se queda (así también se anima al cerrarse). */
  const [infoMontada, setInfoMontada] = useState(false);
  const [tab, setTab] = useState<TabInfo>("resumen");
  /** Sube cada vez que se pide ir a una parte: el panel se desliza hasta ella. */
  const [pedido, setPedido] = useState(0);
  const [angosto, setAngosto] = useState(false);
  /** Hasta que se lee lo guardado no hay transiciones (si no, el menú y la información se moverían al cargar). */
  const [listo, setListo] = useState(false);
  const [buscar, setBuscar] = useState<{ instantaneo: boolean } | null>(null);
  const [celular, setCelular] = useState(false);
  /** La entrada con el logo de vidrio (una vez por pestaña). */
  const [entrada, setEntrada] = useState<FaseEntrada>("espera");
  /** La ventana de Ajustes: abierta o no, y en qué parte (la parte se queda al cerrar, para que salga animada). */
  const [ajustesAbierto, setAjustesAbierto] = useState(false);
  const [parteAjustes, setParteAjustes] = useState<IdAjuste>("atendel");
  /** "Conectar una app" desde el chat (null: cerrada) y el aviso al regresar del permiso. */
  const [conectar, setConectar] = useState<{ app: IdApp | null } | null>(null);
  const [avisoApp, setAvisoApp] = useState<{ tono: "ok" | "error"; texto: string } | null>(null);
  /** El color y la letra que eligió en Ajustes > Apariencia. */
  const [apariencia, setApariencia] = useState<Apariencia>(() => aparienciaDe(ajustes.ajustes));
  const alCambiarApariencia = useCallback((a: Apariencia) => setApariencia((x) => ((Object.keys(a) as (keyof Apariencia)[]).every((k) => x[k] === a[k]) ? x : a)), []);
  // El idioma de las respuestas: la demostración lo manda con cada mensaje (en /panel lo lee el servidor de tus ajustes)
  useEffect(() => {
    try {
      window.sessionStorage.setItem("atendel-idioma", apariencia.idioma);
      // La página pública solo tiene español e inglés: si eliges uno de esos, también cambia
      const sitio = apariencia.idioma.startsWith("en") ? "en" : apariencia.idioma.startsWith("es") ? "es" : null;
      if (sitio) document.cookie = `${IDIOMA_COOKIE}=${sitio}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* sin almacenamiento */
    }
  }, [apariencia.idioma]);
  // El anillo de foco solo con teclado: al picar con el mouse no se queda el aro azul en el botón
  useEffect(() => {
    const raiz = document.documentElement;
    const raton = () => {
      raiz.dataset.foco = "raton";
    };
    const teclado = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) raiz.dataset.foco = "teclado";
    };
    window.addEventListener("pointerdown", raton, true);
    window.addEventListener("keydown", teclado, true);
    return () => {
      window.removeEventListener("pointerdown", raton, true);
      window.removeEventListener("keydown", teclado, true);
      delete raiz.dataset.foco;
    };
  }, []);
  const parametros = useSearchParams();
  const menuRef = useRef<HTMLElement>(null);
  const principalRef = useRef<HTMLDivElement>(null);
  const hamburguesa = useRef<HTMLButtonElement>(null);

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
      const t = window.localStorage.getItem(CLAVE_TAB);
      if (esTabInfo(t)) setTab(t);
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
  const cambiarTab = useCallback((t: TabInfo) => {
    setTab(t);
    try {
      window.localStorage.setItem(CLAVE_TAB, t);
    } catch {
      /* sin almacenamiento */
    }
  }, []);
  const irA = useCallback(
    (t: TabInfo) => {
      cambiarTab(t);
      setPedido((n) => n + 1);
    },
    [cambiarTab],
  );
  /** Un ícono de arriba: abre la información en esa parte; si ya se está viendo, la cierra. */
  const alPicarTab = (t: TabInfo) => {
    if (infoAbierta && tab === t) return ponerInfo(false);
    irA(t);
    ponerInfo(true);
  };

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

  // Ajustes es una ventana: los enlaces a ?vista=ajustes (y llegar con esa dirección) la abren.
  // Lo que se movió a Tu negocio (perfil, reglas de los agentes, apps) lleva ahí.
  const routerAjustes = useRouter();
  const abrirAjustes = useCallback(
    (parte?: string | null) => {
      const movida = parte ? ({ negocio: "perfil", agentes: "reglas" } as Record<string, string>)[parte] : undefined;
      if (movida) {
        routerAjustes.replace(`${hrefs.negocio}&tab=${movida}`);
        return;
      }
      setParteAjustes(esIdAjuste(parte) ? parte : "atendel");
      setAjustesAbierto(true);
      setCajon(false);
    },
    [routerAjustes, hrefs.negocio],
  );
  useEffect(() => {
    if (parametros.get("vista") === "ajustes") abrirAjustes(parametros.get("seccion"));
  }, [parametros, abrirAjustes]);
  // "Conectar una app": con un enlace ?conectar=<app> (lo pone el agente en su respuesta) o con el "+" de la caja
  const abrirConectar = useCallback((app: string | null) => {
    setConectar({ app: esIdApp(app) ? app : null });
    setCajon(false);
  }, []);
  useEffect(() => {
    const c = parametros.get("conectar");
    if (c !== null) abrirConectar(c);
  }, [parametros, abrirConectar]);
  // "¿Lo hago?": con un enlace ?aprobar=<id> (lo pone Atendel cuando algo espera tu OK)
  const [aprobar, setAprobar] = useState<string | null>(null);
  useEffect(() => {
    const a = parametros.get("aprobar");
    if (a && ID_ACCION.test(a)) setAprobar(a);
  }, [parametros]);
  useEffect(() => {
    const evento = (e: Event) => abrirConectar((e as CustomEvent<{ app: string | null }>).detail?.app ?? null);
    window.addEventListener(EVENTO_CONECTAR, evento);
    return () => window.removeEventListener(EVENTO_CONECTAR, evento);
  }, [abrirConectar]);
  // De regreso del permiso a este chat (?conectada=gmail o ?error=…&app=…): el aviso arriba, y se quita de la dirección
  useEffect(() => {
    if (parametros.get("vista") === "negocio") return; // Apps tiene su propio aviso
    const lista = parametros.get("conectada");
    const error = parametros.get("error");
    if (!lista && !error) return;
    const app = esIdApp(lista) ? APP_POR_ID[lista] : null;
    const fallo = parametros.get("app");
    const appFallo = esIdApp(fallo) ? APP_POR_ID[fallo] : null;
    if (app) setAvisoApp({ tono: "ok", texto: `Listo: ${app.nombre} quedó conectada. Ya la puedes usar en el chat.` });
    else if (error) setAvisoApp({ tono: "error", texto: `${appFallo ? `${appFallo.nombre}: ` : ""}${error === "cancelado" ? "no se dio el permiso. Puedes intentarlo otra vez." : "no se pudo conectar. Vuelve a intentarlo."}` });
    const url = new URL(window.location.href);
    for (const k of ["conectada", "error", "app"]) url.searchParams.delete(k);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [parametros]);
  useEffect(() => {
    if (!avisoApp) return;
    const t = window.setTimeout(() => setAvisoApp(null), avisoApp.tono === "ok" ? 6000 : 9000);
    return () => window.clearTimeout(t);
  }, [avisoApp]);
  useEffect(() => {
    const clic = (e: globalThis.MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href");
      if (!href || !(href.includes("vista=ajustes") || href.includes("conectar=") || href.includes("aprobar="))) return;
      const u = new URL(href, window.location.href);
      if (u.origin !== window.location.origin) return;
      const porAprobar = u.searchParams.get("aprobar");
      if (porAprobar && ID_ACCION.test(porAprobar) && !u.pathname.startsWith("/api/")) {
        e.preventDefault();
        e.stopPropagation();
        setAprobar(porAprobar);
      } else if (u.searchParams.get("vista") === "ajustes") {
        e.preventDefault();
        e.stopPropagation();
        abrirAjustes(u.searchParams.get("seccion"));
      } else if (u.searchParams.has("conectar") && !u.pathname.startsWith("/api/")) {
        e.preventDefault();
        e.stopPropagation();
        abrirConectar(u.searchParams.get("conectar"));
      }
    };
    document.addEventListener("click", clic, true);
    return () => document.removeEventListener("click", clic, true);
  }, [abrirAjustes, abrirConectar]);

  const preferencias = {
    menuCompacto: oculto,
    alCambiarMenu: (compacto: boolean) => {
      if (compacto !== oculto) alternarOculto();
    },
    infoAlAbrir: infoAbierta,
    alCambiarInfo: (abierta: boolean) => {
      try {
        window.localStorage.setItem(CLAVE_INFO, abierta ? "1" : "0");
      } catch {
        /* sin almacenamiento */
      }
      ponerInfo(abierta);
    },
    alCambiarApariencia,
    verEntrada: () => {
      try {
        window.sessionStorage.removeItem(CLAVE_ENTRADA);
      } catch {
        /* sin almacenamiento */
      }
      document.documentElement.removeAttribute("data-entrada-vista");
      setAjustesAbierto(false);
      setEntrada("espera");
    },
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
      <Icono nombre={icono} tam={20} />
      <span className="pc-menu__item-texto">{etiqueta}</span>
      {extra}
    </Enlace>
  );

  /* En celular (como WhatsApp): la barra de abajo con 5 pestañas (Inicio · Chat · Tu día · Negocio ·
     Ajustes) y, arriba, los botones del tema elegido (Tu día: Tu OK, Oficina, Citas y Tareas; Negocio:
     Correo, Estadísticas, Apps y Tu negocio). Ajustes abre su ventana. En compu no se ven (panel.css). */
  const conTablero = Boolean(hrefs.tablero);
  const tema: "inicio" | "chat" | "dia" | "negocio" = TEMA_DIA.includes(activa) ? "dia" : TEMA_NEGOCIO.includes(activa) ? "negocio" : conTablero && activa !== "tablero" ? "chat" : "inicio";
  const opcionesTema: { id: IdSeccion; etiqueta: string; href: string; cuenta?: number | null }[] =
    tema === "dia"
      ? [
          { id: "pendientes", etiqueta: "Tu OK", href: hrefs.pendientes, cuenta: pendientes },
          ...(hrefs.oficina ? [{ id: "oficina" as const, etiqueta: "Oficina", href: hrefs.oficina, cuenta: porRevisar }] : []),
          { id: "citas", etiqueta: "Citas", href: hrefs.citas },
          { id: "tareas", etiqueta: "Tareas", href: hrefs.tareas },
        ]
      : tema === "negocio"
        ? [
            ...(hrefs.correo ? [{ id: "correo" as const, etiqueta: "Correo", href: hrefs.correo }] : []),
            { id: "estadisticas", etiqueta: "Estadísticas", href: hrefs.estadisticas },
            ...(hrefs.apps ? [{ id: "apps" as const, etiqueta: "Apps", href: hrefs.apps }] : []),
            { id: "negocio", etiqueta: "Tu negocio", href: hrefs.negocio },
          ]
        : [];
  const cuentaDia = (pendientes ?? 0) + (porRevisar ?? 0);
  // Como la de Instagram: solo el ícono (dibujado); el nombre queda para los lectores de pantalla
  const pestanaAbajo = (id: typeof tema, etiqueta: string, href: string, cuenta?: number) => (
    <Enlace href={href} className="pc-abajo__item" aria-current={tema === id && !ajustesAbierto ? "page" : undefined} title={etiqueta}>
      <span className="pc-abajo__icono">
        <IconoBarra nombre={id} />
        {cuenta ? (
          <span className="pc-abajo__cuenta" aria-hidden="true">
            {cuenta > 99 ? "99+" : cuenta}
          </span>
        ) : null}
      </span>
      <span className="pc-abajo__texto">{cuenta ? `${etiqueta}, ${cuenta} por ver` : etiqueta}</span>
    </Enlace>
  );

  return (
    <div
      className={`pc ${serifPanel.variable} ${clasesFuentesApariencia}`}
      data-menu={oculto ? "oculto" : undefined}
      data-cajon={cajon ? "abierto" : undefined}
      data-info={info ? (infoAbierta ? "abierta" : "cerrada") : undefined}
      data-listo={listo ? "" : undefined}
      data-entrada={entrada ?? undefined}
      data-acento={apariencia.acento !== "azul" ? apariencia.acento : undefined}
      data-letra={apariencia.letra !== "normal" ? apariencia.letra : undefined}
      data-fuente={apariencia.fuente !== "geist" ? apariencia.fuente : undefined}
      data-respuestas={apariencia.respuestas !== "sans" ? apariencia.respuestas : undefined}
      data-ancho={apariencia.ancho !== "normal" ? apariencia.ancho : undefined}
      data-movimiento={apariencia.movimiento !== "sistema" ? apariencia.movimiento : undefined}
      data-interlineado={apariencia.interlineado !== "normal" ? apariencia.interlineado : undefined}
      data-densidad={apariencia.densidad !== "normal" ? apariencia.densidad : undefined}
      data-contraste={apariencia.contraste !== "normal" ? apariencia.contraste : undefined}
      data-enlaces={apariencia.enlaces !== "normal" ? apariencia.enlaces : undefined}
      data-horas={apariencia.horas !== "mostrar" ? apariencia.horas : undefined}
      onClickCapture={alCapturarClic}
    >
      {/* Todo el panel en el idioma de Ajustes > Apariencia */}
      <TraduccionPanel idioma={apariencia.idioma} />
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
          {/* Como Claude: el botón del menú a la izquierda y el nombre en serif (la marca va en el saludo) */}
          <div className="pc-menu__cabeza">
            <button
              type="button"
              className="pc-icono pc-menu__ocultar"
              onClick={() => (celular ? setCajon(false) : alternarOculto())}
              aria-label={celular ? "Cerrar el menú" : oculto ? "Abrir el menú" : "Encoger el menú"}
              title={celular ? "Cerrar el menú" : oculto ? "Abrir el menú" : "Encoger el menú"}
              aria-expanded={celular ? undefined : !oculto}
            >
              <Icono nombre={celular ? "cerrar" : "barra-lateral"} tam={20} />
            </button>
            <Enlace href={hrefs.tablero ?? hrefs.inicio} className="pc-menu__logo" aria-label="Atendel, ir al inicio">
              <Marca className="pc-logo__marca" />
              <span className="pc-logo__nombre">Atendel</span>
            </Enlace>
            <Enlace href={hrefs.inicio} className="pc-icono pc-menu__nueva" aria-label="Nueva conversación" title="Nueva conversación" onClick={enfocarCaja}>
              <Icono nombre="mas" tam={20} />
            </Enlace>
          </div>

          <nav className="pc-menu__nav" aria-label="Secciones">
            {hrefs.tablero ? item("tablero", "Tablero", "inicio", hrefs.tablero) : item("inicio", "Oficina", "documento", hrefs.inicio)}
            {hrefs.tablero ? item("inicio", "Chat", "conversaciones", hrefs.inicio) : null}
            <button type="button" className="pc-menu__item pc-menu__buscar" onClick={() => setBuscar({ instantaneo: false })} aria-keyshortcuts="Meta+K Control+K" title={oculto ? "Buscar (⌘K)" : undefined}>
              <Icono nombre="buscar" tam={20} />
              <span className="pc-menu__item-texto">Buscar</span>
              <kbd className="pc-menu__atajo" aria-hidden="true">
                ⌘K
              </kbd>
            </button>
            {hrefs.tablero ? (
              <>
                {/* Como Supabase y ElevenLabs: las secciones en grupos */}
                <p className="pc-menu__subtitulo">Tu día</p>
                {item("pendientes", "Necesita tu OK", "check-circulo", hrefs.pendientes, pendientes ? <span className="pc-menu__cuenta" aria-label={`${pendientes} por ver`}>{pendientes}</span> : null)}
                {item("citas", "Citas", "calendario", hrefs.citas)}
                {item("tareas", "Tareas", "reloj", hrefs.tareas)}
                {item("oficina", "Oficina", "documento", hrefs.oficina ?? hrefs.inicio, porRevisar ? <span className="pc-menu__cuenta" aria-label={`${porRevisar} por ver`}>{porRevisar}</span> : null)}
                <p className="pc-menu__subtitulo">Tu negocio</p>
                {hrefs.correo ? item("correo", "Correo", "correo", hrefs.correo) : null}
                {item("estadisticas", "Estadísticas", "grafica", hrefs.estadisticas)}
                {hrefs.apps ? item("apps", "Apps conectadas", "enlace", hrefs.apps) : null}
                {item("negocio", "Tu negocio", "negocio", hrefs.negocio)}
              </>
            ) : (
              <>
                {item("citas", "Citas", "calendario", hrefs.citas)}
                {item(
                  "tareas",
                  "Tareas",
                  "reloj",
                  hrefs.tareas,
                  teNecesita ? (
                    <span className="pc-menu__cuenta" aria-label={`${teNecesita} te necesitan`}>
                      {teNecesita}
                    </span>
                  ) : null,
                )}
                {item("negocio", "Tu negocio", "negocio", hrefs.negocio)}
              </>
            )}
          </nav>

          <div className="pc-menu__listas">
            <SeccionesChats chats={chats} organizacion={organizacion} acciones={acciones} actual={chatActual} avisar={(texto, tono = "ok") => setAvisoApp({ tono, texto })} />
          </div>

          {aviso ? <div className="pc-aviso-demo">{aviso}</div> : null}
          <div className="pc-menu__pie">
            <MenuCuenta usuario={usuario} elementos={cuenta} />
            <button type="button" className="pc-icono" onClick={() => abrirAjustes("atendel")} aria-label="Ajustes" title="Ajustes" aria-haspopup="dialog">
              <Icono nombre="ajustes" tam={20} />
            </button>
          </div>
        </div>
      </aside>
      <div className="pc-velo" aria-hidden="true" onClick={() => setCajon(false)} />

      <div ref={principalRef} className="pc-principal">
        <div className="pc-barra-movil">
          {/* Tus conversaciones (el cajón): solo en el Chat; lo demás está en la barra de abajo */}
          {tema === "chat" ? (
            <button
              ref={hamburguesa}
              type="button"
              className="pc-icono"
              onClick={() => setCajon(true)}
              aria-label="Tus conversaciones"
              title="Tus conversaciones"
              aria-expanded={cajon}
              aria-controls="pc-menu"
            >
              <Icono nombre="menu" tam={20} />
            </button>
          ) : null}
          <Enlace href={hrefs.tablero ?? hrefs.inicio} className="pc-menu__logo" aria-label="Atendel, ir al inicio">
            <Marca className="pc-logo__marca" />
            <span className="pc-logo__nombre">Atendel</span>
          </Enlace>
          {aviso ? <div className="pc-aviso-demo pc-aviso-demo--movil">{aviso}</div> : null}
          <button type="button" className="pc-icono" onClick={() => setBuscar({ instantaneo: false })} aria-label="Buscar">
            <Icono nombre="buscar" tam={20} />
          </button>
          <Enlace href={hrefs.inicio} className="pc-icono" aria-label="Nueva conversación" onClick={enfocarCaja}>
            <Icono nombre="mas" tam={20} />
          </Enlace>
        </div>
        {opcionesTema.length ? (
          <nav className="pc-subtemas" aria-label={tema === "dia" ? "Tu día" : "Tu negocio"}>
            {opcionesTema.map((o) => (
              <Enlace key={o.id} href={o.href} className="pc-subtemas__opcion" aria-current={activa === o.id ? "page" : undefined}>
                {o.etiqueta}
                {o.cuenta ? (
                  <span className="pc-subtemas__cuenta" aria-label={`${o.cuenta} por ver`}>
                    {o.cuenta > 99 ? "99+" : o.cuenta}
                  </span>
                ) : null}
              </Enlace>
            ))}
          </nav>
        ) : null}
        {info ? (
          <div className="pc-barra-info" role="toolbar" aria-label="Información de tu negocio">
            {/* Un solo botón con nombre (antes, cuatro iconos sin nombre): abre o cierra el resumen */}
            <button
              type="button"
              className="pc-barra-info__boton pc-barra-info__resumen"
              onClick={() => alPicarTab(tab)}
              aria-pressed={infoAbierta}
              aria-controls="pc-info"
              title={infoAbierta ? "Ocultar el resumen" : "Ver el resumen de tu negocio"}
              data-ultima=""
            >
              <Icono nombre="barra-lateral" tam={17} />
              Resumen
            </button>
          </div>
        ) : null}
        <main id="pc-contenido" className="pc-contenido" tabIndex={-1}>
          {children}
        </main>
      </div>

      <nav className="pc-abajo" aria-label="Menú">
        {pestanaAbajo("inicio", "Inicio", hrefs.tablero ?? hrefs.inicio)}
        {conTablero ? pestanaAbajo("chat", "Chat", hrefs.inicio) : null}
        {pestanaAbajo("dia", "Tu día", hrefs.pendientes, cuentaDia)}
        {pestanaAbajo("negocio", "Negocio", hrefs.correo ?? hrefs.estadisticas)}
        <button type="button" className="pc-abajo__item" onClick={() => abrirAjustes("atendel")} aria-haspopup="dialog" data-activo={ajustesAbierto ? "" : undefined} title="Ajustes">
          <span className="pc-abajo__icono">
            <IconoBarra nombre="ajustes" />
          </span>
          <span className="pc-abajo__texto">Ajustes</span>
        </button>
      </nav>

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
            <div className="pc-lateral__dentro">{infoAbierta || infoMontada ? info({ tab, pedido, alIr: irA, alVer: cambiarTab, alCerrar: cerrarInfo }) : null}</div>
          </aside>
          {angosto ? <div className="pc-velo-info" aria-hidden="true" data-visible={infoAbierta ? "" : undefined} onClick={cerrarInfo} /> : null}
        </>
      ) : null}

      <Buscador abierto={buscar !== null} instantaneo={buscar?.instantaneo ?? false} alCerrar={() => setBuscar(null)} indice={indice} />
      <AprobarAccion
        id={aprobar}
        alCerrar={() => {
          setAprobar(null);
          const url = new URL(window.location.href);
          if (!url.searchParams.has("aprobar")) return;
          url.searchParams.delete("aprobar");
          window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
        }}
      />
      <ConectarApps
        abierta={conectar !== null}
        enfocar={conectar?.app ?? null}
        alCerrar={() => {
          setConectar(null);
          // Si se abrió con ?conectar=, se quita de la dirección (al recargar ya no sale)
          const url = new URL(window.location.href);
          if (!url.searchParams.has("conectar")) return;
          url.searchParams.delete("conectar");
          window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
        }}
      />
      {avisoApp ? (
        <div className={`pc-aviso-subida pc-aviso-subida--${avisoApp.tono}`} role={avisoApp.tono === "error" ? "alert" : "status"}>
          <Icono nombre={avisoApp.tono === "ok" ? "check-circulo" : "alerta"} tam={16} />
          <span className="pc-aviso-subida__texto">{avisoApp.texto}</span>
          <button type="button" className="pc-icono pc-aviso-subida__cerrar" onClick={() => setAvisoApp(null)} aria-label="Cerrar el aviso">
            <Icono nombre="cerrar" tam={14} />
          </button>
        </div>
      ) : null}
      <VentanaAjustes abierta={ajustesAbierto} seccion={parteAjustes} alElegir={setParteAjustes} alCerrar={() => setAjustesAbierto(false)} datos={ajustes} preferencias={preferencias} />
      {entrada ? <EntradaPanel alCambiar={setEntrada} /> : null}
      {flotantes}
    </div>
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
          placeholder="Secciones, conversaciones…"
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
            <Icono nombre={r.icono ?? (r.agentes?.length ? "mensaje" : "flecha")} tam={18} />
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
