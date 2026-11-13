"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { MAX_NOMBRE_GRUPO, idGrupo, organizar, repartir, type OrganizacionChats } from "@/lib/organizacion-chats";
import type { ChatMenu } from "./Armazon";
import { Enlace, Modal, claseBoton } from "./Piezas";

/** Lo que hace el menú "⋯" (cada panel lo guarda a su manera: /panel en la cuenta, /pruebalo en la pestaña). */
export type AccionesChats = {
  /** Fijar, archivar, mover a un grupo, crear o borrar grupos: un cambio puro sobre la organización. */
  organizar: (cambio: (o: OrganizacionChats) => OrganizacionChats) => void;
  /** Regresa el error que diga o null. */
  renombrar: (id: string, titulo: string) => Promise<string | null>;
  eliminar: (id: string) => Promise<string | null>;
};

export const MAX_TITULO_CHAT = 80;

/** React 18 no conoce `inert`: así sale como atributo vacío (inert=""). */
const INERTE = { inert: "" } as unknown as { inert?: boolean };

/** dir: "inicio" al abrir (sin deslizar); "adelante"/"atras" al cambiar de vista (se desliza). */
type Dir = "inicio" | "adelante" | "atras";
type Abierto = { tipo: "chat"; id: string; ancla: DOMRect; vista: "principal" | "grupo"; dir: Dir } | { tipo: "grupo"; id: string; ancla: DOMRect; vista: "principal"; dir: Dir };

/**
 * Fijados, Grupos, Recientes y Archivados en el menú de la izquierda, con el
 * "⋯" de cada conversación (como el de Claude): Fijar, Cambiar nombre,
 * Mover a grupo (como carpetas, para guardar conversaciones juntas),
 * Archivar y Eliminar, con sus atajos (P, R, G, A, D). El menú sale con una
 * animación corta desde los tres puntos (que brincan uno tras otro).
 */
export function SeccionesChats({
  chats,
  organizacion,
  acciones,
  actual,
  avisar,
  compacto,
}: {
  chats: ChatMenu[];
  organizacion: OrganizacionChats;
  acciones: AccionesChats;
  actual?: string | null;
  avisar: (texto: string, tono?: "ok" | "error") => void;
  /** El menú encogido a íconos: no se pinta nada. */
  compacto?: boolean;
}) {
  const s = useMemo(() => repartir(chats, organizacion), [chats, organizacion]);
  const [abierto, setAbierto] = useState<Abierto | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [renombrando, setRenombrando] = useState<{ tipo: "chat" | "grupo"; id: string } | null>(null);
  const [porEliminar, setPorEliminar] = useState<ChatMenu | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const regreso = useRef<HTMLElement | null>(null);

  const cerrar = useCallback((devolverFoco = true) => {
    setSaliendo(true);
    window.setTimeout(() => {
      setAbierto(null);
      setSaliendo(false);
      if (devolverFoco) regreso.current?.focus({ preventScroll: true });
    }, 120);
  }, []);

  const abrir = (a: Abierto, boton: HTMLElement) => {
    regreso.current = boton;
    setSaliendo(false);
    setAbierto((x) => (x && x.id === a.id && x.tipo === a.tipo ? null : a));
  };

  const chatAbierto = abierto?.tipo === "chat" ? chats.find((c) => c.id === abierto.id) : undefined;
  const grupoAbierto = abierto?.tipo === "grupo" ? organizacion.grupos.find((g) => g.id === abierto.id) : undefined;

  const hacer = (fn: () => void) => {
    fn();
    cerrar(false);
  };

  const fila = (c: ChatMenu, dentro = false, icono = false) => (
    <FilaChat
      key={c.id}
      chat={c}
      actual={actual === c.id}
      dentro={dentro}
      icono={icono}
      abierto={abierto?.tipo === "chat" && abierto.id === c.id}
      renombrando={renombrando?.tipo === "chat" && renombrando.id === c.id}
      alAbrir={(boton) => abrir({ tipo: "chat", id: c.id, ancla: boton.getBoundingClientRect(), vista: "principal", dir: "inicio" }, boton)}
      alRenombrar={async (titulo) => {
        setRenombrando(null);
        if (titulo === c.titulo) return;
        const e = await acciones.renombrar(c.id, titulo);
        if (e) avisar(e, "error");
      }}
      alCancelar={() => setRenombrando(null)}
    />
  );

  if (compacto) return null;

  return (
    <>
      {s.fijados.length ? (
        <ListaPlegable titulo="Fijados">
          <ul className="pc-menu__chats">{s.fijados.map((c) => fila(c, false, true))}</ul>
        </ListaPlegable>
      ) : null}

      {organizacion.grupos.length ? (
        <ListaPlegable titulo="Grupos">
          <ul className="pc-menu__chats">
            {s.grupos.map((g) => (
              <Grupo
                key={g.id}
                id={g.id}
                nombre={g.nombre}
                cuantos={g.lista.length}
                abierto={abierto?.tipo === "grupo" && abierto.id === g.id}
                renombrando={renombrando?.tipo === "grupo" && renombrando.id === g.id}
                conActual={g.lista.some((c) => c.id === actual)}
                alAbrir={(boton) => abrir({ tipo: "grupo", id: g.id, ancla: boton.getBoundingClientRect(), vista: "principal", dir: "inicio" }, boton)}
                alRenombrar={(nombre) => {
                  setRenombrando(null);
                  acciones.organizar((o) => organizar.renombrarGrupo(o, g.id, nombre));
                }}
                alCancelar={() => setRenombrando(null)}
              >
                {g.lista.length ? g.lista.map((c) => fila(c, true)) : <li className="pc-menu__vacio pc-menu__vacio--grupo">Sin conversaciones todavía.</li>}
              </Grupo>
            ))}
          </ul>
        </ListaPlegable>
      ) : null}

      <ListaPlegable titulo="Recientes">
        {s.recientes.length ? <ul className="pc-menu__chats">{s.recientes.map((c) => fila(c))}</ul> : <p className="pc-menu__vacio">Aquí aparecen tus conversaciones.</p>}
      </ListaPlegable>

      {s.archivados.length ? (
        <ListaPlegable titulo="Archivados" inicial={false}>
          <ul className="pc-menu__chats">{s.archivados.map((c) => fila(c))}</ul>
        </ListaPlegable>
      ) : null}

      {/* El menú "⋯" de una conversación */}
      {abierto?.tipo === "chat" && chatAbierto ? (
        <Flotante ancla={abierto.ancla} saliendo={saliendo} alCerrar={() => cerrar()} etiqueta={`Opciones de «${chatAbierto.titulo}»`} medida={abierto.vista}>
          {abierto.vista === "principal" ? (
            <MenuPrincipal
              dir={abierto.dir}
              items={[
                organizacion.fijadas.includes(chatAbierto.id)
                  ? { id: "fijar", etiqueta: "Quitar de fijados", atajo: "P", alElegir: () => hacer(() => acciones.organizar((o) => organizar.fijar(o, chatAbierto.id, false))) }
                  : { id: "fijar", etiqueta: "Fijar", atajo: "P", alElegir: () => hacer(() => acciones.organizar((o) => organizar.fijar(o, chatAbierto.id, true))) },
                { id: "renombrar", etiqueta: "Cambiar nombre", atajo: "R", alElegir: () => hacer(() => setRenombrando({ tipo: "chat", id: chatAbierto.id })) },
                { id: "mover", etiqueta: "Mover a grupo", atajo: "G", submenu: true, alElegir: () => setAbierto({ ...abierto, vista: "grupo", dir: "adelante" }) },
                "raya",
                organizacion.archivadas.includes(chatAbierto.id)
                  ? { id: "archivar", etiqueta: "Desarchivar", atajo: "A", alElegir: () => hacer(() => acciones.organizar((o) => organizar.archivar(o, chatAbierto.id, false))) }
                  : { id: "archivar", etiqueta: "Archivar", atajo: "A", alElegir: () => hacer(() => acciones.organizar((o) => organizar.archivar(o, chatAbierto.id, true))) },
                { id: "eliminar", etiqueta: "Eliminar", atajo: "D", peligro: true, alElegir: () => hacer(() => setPorEliminar(chatAbierto)) },
              ]}
            />
          ) : (
            <MoverAGrupo
              dir={abierto.dir}
              organizacion={organizacion}
              grupoActual={s.grupoDe(chatAbierto.id)}
              alVolver={() => setAbierto({ ...abierto, vista: "principal", dir: "atras" })}
              alElegir={(grupo) => {
                const nombre = grupo ? organizacion.grupos.find((g) => g.id === grupo)?.nombre : null;
                hacer(() => acciones.organizar((o) => organizar.mover(o, chatAbierto.id, grupo)));
                if (nombre) avisar(`«${chatAbierto.titulo}» está en ${nombre}.`);
              }}
              alCrear={(nombre) => {
                hacer(() => acciones.organizar((o) => organizar.crearGrupo(o, idGrupo(), nombre, chatAbierto.id)));
                avisar(`Creaste el grupo ${nombre} con «${chatAbierto.titulo}».`);
              }}
            />
          )}
        </Flotante>
      ) : null}

      {/* El menú "⋯" de un grupo */}
      {abierto?.tipo === "grupo" && grupoAbierto ? (
        <Flotante ancla={abierto.ancla} saliendo={saliendo} alCerrar={() => cerrar()} etiqueta={`Opciones del grupo ${grupoAbierto.nombre}`} medida="principal">
          <MenuPrincipal
            dir="inicio"
            items={[
              { id: "renombrar", etiqueta: "Cambiar nombre", atajo: "R", alElegir: () => hacer(() => setRenombrando({ tipo: "grupo", id: grupoAbierto.id })) },
              "raya",
              {
                id: "eliminar",
                etiqueta: "Eliminar grupo",
                detalle: "Sus conversaciones regresan a Recientes",
                atajo: "D",
                peligro: true,
                alElegir: () => hacer(() => acciones.organizar((o) => organizar.borrarGrupo(o, grupoAbierto.id))),
              },
            ]}
          />
        </Flotante>
      ) : null}

      <Modal
        abierto={porEliminar !== null}
        alCerrar={() => setPorEliminar(null)}
        titulo="¿Eliminar esta conversación?"
        descripcion={porEliminar ? `«${porEliminar.titulo}» y sus mensajes se borran para siempre. Si solo quieres quitarla de la vista, mejor archívala.` : undefined}
        pie={
          <>
            <button type="button" className={claseBoton("fantasma")} onClick={() => setPorEliminar(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className={`${claseBoton("principal")} pc-boton--peligro`}
              disabled={eliminando}
              aria-busy={eliminando || undefined}
              onClick={async () => {
                if (!porEliminar) return;
                setEliminando(true);
                const e = await acciones.eliminar(porEliminar.id);
                setEliminando(false);
                setPorEliminar(null);
                if (e) avisar(e, "error");
              }}
            >
              {eliminando ? "Eliminando…" : "Eliminar"}
            </button>
          </>
        }
      >
        {null}
      </Modal>
    </>
  );
}

/* ---------- Una sección plegable (Fijados, Grupos, Recientes, Archivados) ---------- */

function ListaPlegable({ titulo, inicial = true, children }: { titulo: string; inicial?: boolean; children: ReactNode }) {
  const [abierta, setAbierta] = useState(inicial);
  const id = useId();
  return (
    <section className="pc-menu__grupo">
      <h2 className="pc-menu__titulo">
        <button type="button" className="pc-menu__titulo-boton" aria-expanded={abierta} aria-controls={id} onClick={() => setAbierta((a) => !a)}>
          {titulo}
          <Icono nombre="chevron" tam={12} trazo={2} className="pc-menu__chevron" />
        </button>
      </h2>
      <div id={id} className="pc-plegable" data-cerrado={abierta ? undefined : ""} aria-hidden={abierta ? undefined : true} {...(abierta ? {} : INERTE)}>
        <div className="pc-plegable__dentro">{children}</div>
      </div>
    </section>
  );
}

/* ---------- Los tres puntos (cada uno brinca al abrir) ---------- */

function Puntos() {
  return (
    <svg className="pc-puntos" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="4.5" cy="10" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="15.5" cy="10" r="1.6" />
    </svg>
  );
}

/* ---------- Una conversación del menú ---------- */

function FilaChat({
  chat,
  actual,
  dentro,
  icono,
  abierto,
  renombrando,
  alAbrir,
  alRenombrar,
  alCancelar,
}: {
  chat: ChatMenu;
  actual: boolean;
  dentro: boolean;
  /** En Fijados todas llevan ícono (grupo de agentes o conversación) para alinearse. */
  icono: boolean;
  abierto: boolean;
  renombrando: boolean;
  alAbrir: (boton: HTMLElement) => void;
  alRenombrar: (titulo: string) => void;
  alCancelar: () => void;
}) {
  const boton = useRef<HTMLButtonElement>(null);
  return (
    <li className="pc-chat" data-abierto={abierto ? "" : undefined} data-actual={actual ? "" : undefined} data-dentro={dentro ? "" : undefined}>
      {renombrando ? (
        <CampoNombre inicial={chat.titulo} max={MAX_TITULO_CHAT} etiqueta="Nuevo nombre de la conversación" alGuardar={alRenombrar} alCancelar={alCancelar} />
      ) : (
        <Enlace href={chat.href} className="pc-menu__chat" aria-current={actual ? "page" : undefined} title={chat.titulo}>
          {icono ? <Icono nombre={chat.agentes.length > 1 ? "usuarios" : "mensaje"} tam={20} /> : null}
          <span className="pc-menu__chat-texto">{chat.titulo}</span>
        </Enlace>
      )}
      {!renombrando ? (
        <button
          ref={boton}
          type="button"
          className="pc-chat__mas"
          aria-haspopup="menu"
          aria-expanded={abierto}
          aria-label={`Opciones de «${chat.titulo}»`}
          title="Opciones"
          onClick={(e) => {
            e.preventDefault();
            alAbrir(e.currentTarget);
          }}
        >
          <Puntos />
        </button>
      ) : null}
    </li>
  );
}

/* ---------- Un grupo (como carpeta) con sus conversaciones ---------- */

function Grupo({
  id,
  nombre,
  cuantos,
  abierto,
  renombrando,
  conActual,
  alAbrir,
  alRenombrar,
  alCancelar,
  children,
}: {
  id: string;
  nombre: string;
  cuantos: number;
  abierto: boolean;
  renombrando: boolean;
  conActual: boolean;
  alAbrir: (boton: HTMLElement) => void;
  alRenombrar: (nombre: string) => void;
  alCancelar: () => void;
  children: ReactNode;
}) {
  const [desplegado, setDesplegado] = useState(true);
  const lista = useId();
  return (
    <li className="pc-carpeta" data-abierto={abierto ? "" : undefined}>
      <div className="pc-chat" data-abierto={abierto ? "" : undefined}>
        {renombrando ? (
          <CampoNombre inicial={nombre} max={MAX_NOMBRE_GRUPO} etiqueta="Nuevo nombre del grupo" alGuardar={alRenombrar} alCancelar={alCancelar} />
        ) : (
          <button type="button" className="pc-menu__chat pc-carpeta__fila" aria-expanded={desplegado} aria-controls={lista} onClick={() => setDesplegado((d) => !d)} data-id={id}>
            <span className="pc-carpeta__icono" aria-hidden="true">
              <Icono nombre="carpeta" tam={20} />
            </span>
            <span className="pc-menu__chat-texto">{nombre}</span>
            <span className="pc-carpeta__cuantos" aria-label={`${cuantos} ${cuantos === 1 ? "conversación" : "conversaciones"}`}>
              {cuantos}
            </span>
          </button>
        )}
        {!renombrando ? (
          <button type="button" className="pc-chat__mas" aria-haspopup="menu" aria-expanded={abierto} aria-label={`Opciones del grupo ${nombre}`} title="Opciones" onClick={(e) => alAbrir(e.currentTarget)}>
            <Puntos />
          </button>
        ) : null}
      </div>
      <div id={lista} className="pc-plegable" data-cerrado={desplegado || conActual ? undefined : ""} aria-hidden={desplegado || conActual ? undefined : true} {...(desplegado || conActual ? {} : INERTE)}>
        <div className="pc-plegable__dentro">
          <ul className="pc-menu__chats pc-carpeta__lista">{children}</ul>
        </div>
      </div>
    </li>
  );
}

/* ---------- Cambiar nombre ahí mismo ---------- */

function CampoNombre({ inicial, max, etiqueta, alGuardar, alCancelar }: { inicial: string; max: number; etiqueta: string; alGuardar: (v: string) => void; alCancelar: () => void }) {
  const [v, setV] = useState(inicial);
  const ref = useRef<HTMLInputElement>(null);
  const listo = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const guardar = () => {
    if (listo.current) return;
    listo.current = true;
    const limpio = v.replace(/\s+/g, " ").trim();
    if (limpio) alGuardar(limpio.slice(0, max));
    else alCancelar();
  };
  return (
    <input
      ref={ref}
      className="pc-chat__campo"
      value={v}
      maxLength={max}
      aria-label={etiqueta}
      onChange={(e) => setV(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          guardar();
        } else if (e.key === "Escape") {
          e.preventDefault();
          listo.current = true;
          alCancelar();
        }
      }}
    />
  );
}

/* ---------- El menú flotante (fuera de la lista, para que no lo recorte) ---------- */

function Flotante({ ancla, saliendo, alCerrar, etiqueta, medida, children }: { ancla: DOMRect; saliendo: boolean; alCerrar: () => void; etiqueta: string; medida: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; arriba: boolean } | null>(null);
  const cerrar = useRef(alCerrar);
  cerrar.current = alCerrar;

  // Abajo de los tres puntos y alineado a su derecha; si no cabe abajo, arriba
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, ancla.right - w + 4));
    let top = ancla.bottom + 6;
    let arriba = false;
    if (top + h > window.innerHeight - 8 && ancla.top - h - 6 >= 8) {
      top = ancla.top - h - 6;
      arriba = true;
    }
    setPos((p) => (p && medida !== "principal" ? { ...p, left } : { top: Math.max(8, top), left, arriba }));
  }, [ancla, medida]);

  useEffect(() => {
    const fuera = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (ref.current?.contains(t) || t?.closest?.(".pc-chat__mas[aria-expanded='true']")) return;
      cerrar.current();
    };
    const tecla = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cerrar.current();
      }
    };
    const mover = () => cerrar.current();
    document.addEventListener("pointerdown", fuera, true);
    window.addEventListener("keydown", tecla, true);
    window.addEventListener("resize", mover);
    document.querySelector(".pc-menu__listas")?.addEventListener("scroll", mover, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", fuera, true);
      window.removeEventListener("keydown", tecla, true);
      window.removeEventListener("resize", mover);
      document.querySelector(".pc-menu__listas")?.removeEventListener("scroll", mover);
    };
  }, []);

  // Fuera del menú de la izquierda (su lista se desplaza y en celular el cajón se mueve), pero dentro del panel (sus colores)
  const destino = typeof document === "undefined" ? null : (document.querySelector(".pc") ?? document.body);
  const menu = (
    <div
      ref={ref}
      className="pc-flota"
      role="menu"
      aria-label={etiqueta}
      data-arriba={pos?.arriba ? "" : undefined}
      data-saliendo={saliendo ? "" : undefined}
      // Antes de medir queda fuera de la vista (sin "hidden": así el primer renglón puede tomar el foco)
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
    >
      {children}
    </div>
  );
  return destino ? createPortal(menu, destino) : menu;
}

/** Flechas, Inicio y Fin entre los renglones del menú. */
function navegar(e: KeyboardEvent<HTMLElement>) {
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>("[role='menuitem']:not(:disabled)")];
  const i = items.indexOf(document.activeElement as HTMLElement);
  let j = -1;
  if (e.key === "ArrowDown") j = (i + 1) % items.length;
  else if (e.key === "ArrowUp") j = (i - 1 + items.length) % items.length;
  else if (e.key === "Home") j = 0;
  else if (e.key === "End") j = items.length - 1;
  if (j < 0) return false;
  e.preventDefault();
  items[j]?.focus();
  return true;
}

type ItemMenu = { id: string; etiqueta: string; detalle?: string; atajo?: string; submenu?: boolean; peligro?: boolean; alElegir: () => void };

function MenuPrincipal({ items, dir }: { items: (ItemMenu | "raya")[]; dir: Dir }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus({ preventScroll: true });
  }, []);
  let n = 0;
  return (
    <div
      ref={ref}
      className="pc-flota__vista"
      data-dir={dir}
      onKeyDown={(e) => {
        if (navegar(e)) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const it = items.find((x): x is ItemMenu => x !== "raya" && x.atajo?.toLowerCase() === e.key.toLowerCase());
        if (it) {
          e.preventDefault();
          it.alElegir();
        } else if (e.key === "ArrowRight") {
          const sub = items.find((x): x is ItemMenu => x !== "raya" && Boolean(x.submenu) && document.activeElement?.getAttribute("data-id") === x.id);
          if (sub) {
            e.preventDefault();
            sub.alElegir();
          }
        }
      }}
    >
      {items.map((it, k) =>
        it === "raya" ? (
          <hr key={`r${k}`} className="pc-flota__raya" />
        ) : (
          <button
            key={it.id}
            type="button"
            role="menuitem"
            data-id={it.id}
            aria-haspopup={it.submenu ? "menu" : undefined}
            aria-keyshortcuts={it.atajo}
            className={`pc-flota__item${it.peligro ? " pc-flota__item--peligro" : ""}`}
            style={{ "--i": n++ } as CSSProperties}
            onClick={it.alElegir}
          >
            <span className="pc-flota__textos">
              <span>{it.etiqueta}</span>
              {it.detalle ? <span className="pc-flota__detalle">{it.detalle}</span> : null}
            </span>
            {it.submenu ? <Icono nombre="chevron-derecha" tam={14} trazo={2} className="pc-flota__atajo" /> : it.atajo ? <kbd className="pc-flota__atajo">{it.atajo}</kbd> : null}
          </button>
        ),
      )}
    </div>
  );
}

/* ---------- Mover a grupo: buscar, elegir o crear (sobrio, como de oficina) ---------- */

function MoverAGrupo({
  organizacion,
  grupoActual,
  dir,
  alVolver,
  alElegir,
  alCrear,
}: {
  organizacion: OrganizacionChats;
  grupoActual: string | null;
  dir: Dir;
  alVolver: () => void;
  alElegir: (grupo: string | null) => void;
  alCrear: (nombre: string) => void;
}) {
  const [q, setQ] = useState("");
  const entrada = useRef<HTMLInputElement>(null);
  useEffect(() => {
    entrada.current?.focus({ preventScroll: true });
  }, []);
  const limpio = q.replace(/\s+/g, " ").trim();
  const norm = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  const lista = organizacion.grupos.filter((g) => norm(g.nombre).includes(norm(limpio)));
  const exacto = organizacion.grupos.some((g) => norm(g.nombre) === norm(limpio));
  const puedeCrear = limpio.length > 0 && !exacto && organizacion.grupos.length < 30;
  const cuantos = (id: string) => organizacion.grupos.find((g) => g.id === id)?.chats.length ?? 0;
  const icono = (n: NombreIcono) => <Icono nombre={n} tam={18} className="pc-flota__icono" />;
  let i = 0;

  return (
    <div
      className="pc-flota__vista pc-mover"
      data-dir={dir}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" && document.activeElement !== entrada.current) {
          e.preventDefault();
          alVolver();
          return;
        }
        if (e.key === "ArrowDown" && document.activeElement === entrada.current) {
          e.preventDefault();
          e.currentTarget.querySelector<HTMLElement>("[role='menuitem']")?.focus();
          return;
        }
        navegar(e);
      }}
    >
      <div className="pc-mover__cabeza">
        <button type="button" className="pc-mover__volver" onClick={alVolver} aria-label="Regresar a las opciones">
          <Icono nombre="chevron-izquierda" tam={16} trazo={2} />
        </button>
        <span className="pc-mover__titulo">Mover a grupo</span>
      </div>
      <label className="pc-mover__buscar">
        <Icono nombre="buscar" tam={16} />
        <input
          ref={entrada}
          value={q}
          maxLength={MAX_NOMBRE_GRUPO}
          placeholder={organizacion.grupos.length ? "Buscar o crear un grupo" : "Nombre del grupo nuevo"}
          aria-label="Buscar o crear un grupo"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (lista.length === 1 && (exacto || !puedeCrear)) alElegir(lista[0].id);
            else if (puedeCrear) alCrear(limpio);
            else if (exacto) alElegir(organizacion.grupos.find((g) => norm(g.nombre) === norm(limpio))?.id ?? null);
          }}
        />
      </label>
      {lista.length ? <p className="pc-mover__seccion">Tus grupos</p> : null}
      {lista.length ? (
        <div className="pc-mover__lista" role="group" aria-label="Tus grupos">
          {lista.map((g) => (
            <button
              key={g.id}
              type="button"
              role="menuitem"
              className="pc-flota__item pc-mover__grupo"
              style={{ "--i": i++ } as CSSProperties}
              aria-current={g.id === grupoActual ? "true" : undefined}
              onClick={() => (g.id === grupoActual ? undefined : alElegir(g.id))}
            >
              {icono("carpeta")}
              <span className="pc-flota__textos">
                <span>{g.nombre}</span>
              </span>
              {g.id === grupoActual ? <Icono nombre="check" tam={16} trazo={2} className="pc-mover__check" /> : <span className="pc-mover__cuantos">{cuantos(g.id)}</span>}
            </button>
          ))}
        </div>
      ) : !puedeCrear ? (
        <p className="pc-mover__nada">{organizacion.grupos.length ? "Ningún grupo se llama así." : "Todavía no tienes grupos. Escribe un nombre (por ejemplo, Proveedores) y presiona Enter."}</p>
      ) : null}
      {puedeCrear || grupoActual ? <hr className="pc-flota__raya" /> : null}
      {puedeCrear ? (
        <button type="button" role="menuitem" className="pc-flota__item" style={{ "--i": i++ } as CSSProperties} onClick={() => alCrear(limpio)}>
          {icono("mas")}
          <span className="pc-flota__textos">
            <span>
              Crear el grupo <strong className="pc-mover__nombre">{limpio}</strong>
            </span>
          </span>
        </button>
      ) : null}
      {grupoActual ? (
        <button type="button" role="menuitem" className="pc-flota__item" style={{ "--i": i++ } as CSSProperties} onClick={() => alElegir(null)}>
          {icono("cerrar")}
          <span className="pc-flota__textos">
            <span>Quitar del grupo</span>
          </span>
        </button>
      ) : null}
    </div>
  );
}

/* ---------- Para los paneles: la organización en memoria y guardada ---------- */

/** El chat se entera cuando el menú cambia el nombre o elimina una conversación (para su cabecera o volver al Inicio). */
export const EVENTO_CHAT_RENOMBRADO = "atendel:chat-renombrado";
export const EVENTO_CHAT_ELIMINADO = "atendel:chat-eliminado";

/**
 * La organización de las conversaciones: cambia al momento y se guarda un
 * poquito después (si se hacen varios cambios seguidos, una sola vez).
 * `cargar` (opcional) la lee después de montar (p. ej. de la pestaña), sin
 * volver a guardarla.
 */
export function useOrganizacionChats(inicial: OrganizacionChats, guardar: (o: OrganizacionChats) => unknown, cargar?: () => OrganizacionChats | null) {
  const [org, setOrg] = useState(inicial);
  const actual = useRef(inicial);
  const reloj = useRef(0);
  const guardarRef = useRef(guardar);
  guardarRef.current = guardar;
  const cargarRef = useRef(cargar);
  useEffect(() => {
    const leida = cargarRef.current?.();
    if (leida) {
      actual.current = leida;
      setOrg(leida);
    }
  }, []);
  const cambiar = useCallback((fn: (o: OrganizacionChats) => OrganizacionChats) => {
    const nueva = fn(actual.current);
    if (nueva === actual.current) return;
    actual.current = nueva;
    setOrg(nueva);
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => void guardarRef.current(actual.current), 350);
  }, []);
  return [org, cambiar] as const;
}
