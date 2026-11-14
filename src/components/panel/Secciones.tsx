"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { EVENTO_TEMA, ponerTema, preferenciaActual, type PreferenciaTema } from "@/lib/tema";
import { AvatarAgente } from "./Mensajes";
import { Marca } from "@/components/Logo";
import { BarraBuscar, Enlace, FragmentosQuietos, Odometro, Pildoras, Tarjeta, Vacio, claseBoton, retrasoEscalon } from "./Piezas";

/* =====================================================================
   Las secciones del panel, al estilo Mercury: una columna de 768px con
   el buscador ancho (⌘K) arriba, el título en serif de 32px, píldoras
   para filtrar y tarjetas de borde fino. Piezas sin datos: /panel les da
   lo real y /pruebalo lo de ejemplo.
   ===================================================================== */

/** La columna de una sección. `buscador={false}` si la vista trae el suyo (Estadísticas). */
export function Seccion({ children, ancha = false, buscador = true }: { children: ReactNode; ancha?: boolean; buscador?: boolean }) {
  return (
    <div className={`pc-seccion${ancha ? " pc-seccion--ancha" : ""}`}>
      {buscador ? <BarraBuscar /> : null}
      {children}
    </div>
  );
}

/* ---------- Pendientes: el tablero (ANIMACIONES.md punto 7) ---------- */

export type ColumnaTablero = "revisar" | "aprobado" | "enviado";
export const COLUMNAS: { id: ColumnaTablero; titulo: string }[] = [
  { id: "revisar", titulo: "Por revisar" },
  { id: "aprobado", titulo: "Aprobado" },
  { id: "enviado", titulo: "Enviado" },
];

export type ItemTablero = {
  id: string;
  columna: ColumnaTablero;
  agente?: IdAgente;
  titulo: string;
  para?: string;
  texto?: string;
  /** Una línea al pie: qué pasa al aprobar, o qué pasó. */
  nota?: string;
  hace?: string;
  /** Se puede aprobar y cambiar (en /pruebalo). */
  movible?: boolean;
  editado?: boolean;
  /** Enlaces propios (en /panel: "Ver en Correo", "Pedírselo a Atendel"). */
  acciones?: ReactNode;
};

const reducido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Tablero Por revisar → Aprobado → Enviado. Siempre con botones (Aprobar,
 * Cambiar algo), que también funcionan con teclado; arrastrar es opcional.
 * Al moverse, cada tarjeta viaja a su lugar nuevo con FLIP (WAAPI, 220ms) y
 * la que se levanta crece a 1.02 con sombra (150ms).
 */
export function Tablero({
  items,
  alMover,
  alCambiar,
  vacios,
  agenteVacio,
}: {
  items: ItemTablero[];
  alMover?: (id: string, columna: ColumnaTablero) => void;
  alCambiar?: (id: string) => void;
  vacios: Record<ColumnaTablero, string>;
  /** Con "Por revisar" vacío: un grupito de fragmentos quietos con este agente. */
  agenteVacio?: IdAgente;
}) {
  const nodos = useRef(new Map<string, HTMLElement>());
  const antes = useRef(new Map<string, DOMRect>());
  /** Las tarjetas que ya estaban: al cambiar de columna no vuelven a "entrar" (solo viajan con FLIP). */
  const vistos = useRef(new Set<string>());
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<ColumnaTablero | null>(null);
  const orden = items.map((i) => `${i.id}:${i.columna}`).join("|");

  // FLIP: dónde estaba cada tarjeta, dónde quedó; se anima la diferencia
  useLayoutEffect(() => {
    const nuevas = new Map<string, DOMRect>();
    nodos.current.forEach((el, id) => nuevas.set(id, el.getBoundingClientRect()));
    if (!reducido()) {
      nuevas.forEach((r, id) => {
        const a = antes.current.get(id);
        const el = nodos.current.get(id);
        if (!a || !el) return;
        const dx = a.left - r.left;
        const dy = a.top - r.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: 220, easing: "cubic-bezier(0.77, 0, 0.175, 1)" });
      });
    }
    antes.current = nuevas;
    nuevas.forEach((_, id) => vistos.current.add(id));
  }, [orden]);

  const soltar = (e: DragEvent, columna: ColumnaTablero) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setSobre(null);
    setArrastrando(null);
    const item = items.find((i) => i.id === id);
    if (item && item.movible && item.columna !== columna && columna !== "enviado") alMover?.(id, columna);
  };

  return (
    <div className="pc-tablero">
      {COLUMNAS.map((col) => {
        const lista = items.filter((i) => i.columna === col.id);
        return (
          <section
            key={col.id}
            className="pc-tablero__columna"
            aria-labelledby={`col-${col.id}`}
            data-sobre={sobre === col.id ? "" : undefined}
            onDragOver={(e) => {
              if (!arrastrando || col.id === "enviado") return;
              e.preventDefault();
              setSobre(col.id);
            }}
            onDragLeave={() => setSobre((s) => (s === col.id ? null : s))}
            onDrop={(e) => soltar(e, col.id)}
          >
            <h2 id={`col-${col.id}`} className="pc-tablero__titulo">
              {col.titulo}
              <span className="pc-tablero__cuenta">{lista.length}</span>
            </h2>
            <ul className="pc-tablero__lista">
              {lista.map((item, i) => (
                <li
                  key={item.id}
                  ref={(el) => {
                    if (el) nodos.current.set(item.id, el);
                    else nodos.current.delete(item.id);
                  }}
                  className={`pc-tablero__item${vistos.current.has(item.id) ? "" : " pc-entra"}`}
                  style={{ "--d": `${retrasoEscalon(i)}ms` } as CSSProperties}
                  data-arrastrando={arrastrando === item.id ? "" : undefined}
                  draggable={Boolean(item.movible && alMover)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", item.id);
                    e.dataTransfer.effectAllowed = "move";
                    setArrastrando(item.id);
                  }}
                  onDragEnd={() => {
                    setArrastrando(null);
                    setSobre(null);
                  }}
                >
                  <TarjetaPendiente item={item} alMover={alMover} alCambiar={alCambiar} />
                </li>
              ))}
            </ul>
            {lista.length === 0 ? (
              <div className="pc-tablero__vacio">
                {col.id === "revisar" && agenteVacio ? <FragmentosQuietos agente={agenteVacio} className="pc-quietos--chico" /> : null}
                <p>{vacios[col.id]}</p>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function TarjetaPendiente({ item, alMover, alCambiar }: { item: ItemTablero; alMover?: (id: string, c: ColumnaTablero) => void; alCambiar?: (id: string) => void }) {
  const info = item.agente ? AGENTE_POR_ID[item.agente] : null;
  return (
    <article className="pc-pendiente" aria-label={item.titulo}>
      <p className="pc-pendiente__quien">
        {item.agente ? <AvatarAgente agente={item.agente} tam={20} /> : <Marca className="pc-pendiente__marca" />}
        <span>{info ? info.nombre : "Atendel"}</span>
        {item.hace ? <span className="pc-pendiente__hace">{item.hace}</span> : null}
        {item.editado ? <span className="pc-estado pc-estado--neutro">Editado</span> : null}
      </p>
      <h3 className="pc-pendiente__titulo">{item.titulo}</h3>
      {item.para ? <p className="pc-pendiente__para">{item.para}</p> : null}
      {item.texto ? <blockquote className="pc-pendiente__texto">{item.texto}</blockquote> : null}
      {item.nota ? <p className="pc-pendiente__nota">{item.nota}</p> : null}
      {item.movible && alMover ? (
        <div className="pc-pendiente__acciones">
          {item.columna === "revisar" ? (
            <>
              <button type="button" className={claseBoton("principal", true)} onClick={() => alMover(item.id, "aprobado")}>
                Aprobar
              </button>
              {alCambiar ? (
                <button type="button" className={claseBoton("borde", true)} onClick={() => alCambiar(item.id)}>
                  Cambiar algo
                </button>
              ) : null}
            </>
          ) : item.columna === "aprobado" ? (
            <button type="button" className={claseBoton("fantasma", true)} onClick={() => alMover(item.id, "revisar")}>
              Regresar a revisión
            </button>
          ) : null}
        </div>
      ) : item.acciones ? (
        <div className="pc-pendiente__acciones">{item.acciones}</div>
      ) : null}
    </article>
  );
}

/* ---------- Citas ---------- */

export type FilaCitaDatos = { id: string; hora: string; cliente: string; servicio: string; estado: string; tono: "exito" | "atencion" | "azul" | "neutro"; href?: string };

export function ListaCitas({ citas, titulo }: { citas: FilaCitaDatos[]; titulo: string }) {
  return (
    <Tarjeta como="section" className="pc-lista-tarjeta" etiqueta={titulo}>
      <ul className="pc-filas">
        {citas.map((c, i) => (
          <li key={c.id} className="pc-entra" style={{ "--d": `${retrasoEscalon(i)}ms` } as CSSProperties}>
            <FilaGenerica href={c.href}>
              <span className="pc-fila__hora cifras">{c.hora}</span>
              <span className="pc-fila__textos">
                <span className="pc-fila__titulo">{c.cliente}</span>
                <span className="pc-fila__detalle">{c.servicio}</span>
              </span>
              <span className={`pc-estado pc-estado--${c.tono}`}>{c.estado}</span>
            </FilaGenerica>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

/** Una fila que se puede picar (con ›) o solo leer. */
export function FilaGenerica({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <div className="pc-fila">{children}</div>;
  return (
    <Tarjeta href={href} className="pc-fila pc-fila--picable">
      {children}
      <Icono nombre="chevron-derecha" tam={16} />
    </Tarjeta>
  );
}

/* ---------- Agentes ---------- */

export function TarjetaAgente({
  agente,
  estado,
  datos,
  acciones,
  enfocado,
  indice,
  interruptor,
}: {
  agente: IdAgente;
  estado: { texto: string; tono: "exito" | "atencion" | "azul" | "neutro" };
  datos?: ReactNode;
  acciones: ReactNode;
  enfocado?: boolean;
  indice: number;
  /** "En tu equipo" (solo en /panel, donde se guarda). */
  interruptor?: ReactNode;
}) {
  const info = AGENTE_POR_ID[agente];
  return (
    <Tarjeta como="article" className="pc-agente" indice={indice} etiqueta={`${info.nombre}, ${info.area}`} style={enfocado ? ({ "--anillo": "1" } as CSSProperties) : undefined}>
      <div id={`agente-${agente}`} className="pc-agente__cabeza" data-enfocado={enfocado ? "" : undefined}>
        <span className="pc-agente__personaje" aria-hidden="true">
          <Personaje agente={agente} />
        </span>
        <div className="pc-agente__textos">
          <h2 className="pc-agente__nombre">{info.nombre}</h2>
          <p className="pc-agente__area">
            {info.area} · {info.abarca}
          </p>
          <span className={`pc-estado pc-estado--${estado.tono}`}>{estado.texto}</span>
        </div>
        {interruptor}
      </div>
      <p className="pc-agente__lema">{info.lema}</p>
      {datos ? <div className="pc-agente__datos">{datos}</div> : null}
      <div className="pc-agente__acciones">{acciones}</div>
    </Tarjeta>
  );
}

/* ---------- Ajustes ---------- */

export function BloqueAjustes({ titulo, texto, children, id }: { titulo: string; texto?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="pc-ajuste" aria-labelledby={id}>
      <div className="pc-ajuste__texto">
        <h2 id={id} className="pc-ajuste__titulo">
          {titulo}
        </h2>
        {texto ? <p className="pc-ajuste__sub">{texto}</p> : null}
      </div>
      <div className="pc-ajuste__cuerpo">{children}</div>
    </section>
  );
}

/** El plan: solo se ve (nadie cambia su plan desde aquí). */
export function TarjetaPlan({ plan, usados, total }: { plan: string; usados: number; total: number }) {
  const pct = Math.min(100, Math.round((usados / Math.max(1, total)) * 100));
  return (
    <Tarjeta className="pc-plan">
      <div className="pc-plan__fila">
        <p className="pc-plan__nombre">{plan}</p>
        <p className="pc-plan__pct">
          <Odometro valor={pct} /> %
        </p>
      </div>
      <div className="pc-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Mensajes del mes usados">
        <span className="pc-barra__lleno" style={{ "--v": pct / 100 } as CSSProperties} />
      </div>
      <p className="pc-plan__detalle">
        <Odometro valor={usados} /> de {total.toLocaleString("es-MX")} mensajes este mes
      </p>
      <div className="pc-plan__acciones">
        <Enlace href="/precios" className={claseBoton("borde", true)}>
          Ver los planes
        </Enlace>
        <Enlace href="/contacto" className="pc-enlace pc-plan__escribenos">
          Para cambiar de plan, escríbenos
        </Enlace>
      </div>
    </Tarjeta>
  );
}

/** Oscuro, claro o como el sistema (arranca con lo que eligió la persona). */
export function ElegirTema() {
  const [actual, setActual] = useState<PreferenciaTema>("oscuro");
  useEffect(() => {
    const leer = () => setActual(preferenciaActual());
    leer();
    window.addEventListener(EVENTO_TEMA, leer);
    return () => window.removeEventListener(EVENTO_TEMA, leer);
  }, []);
  return (
    <Pildoras
      etiqueta="Apariencia"
      activa={actual}
      alElegir={(id) => {
        const p = id as PreferenciaTema;
        setActual(p);
        ponerTema(p);
      }}
      opciones={[
        { id: "oscuro", etiqueta: "Oscuro" },
        { id: "claro", etiqueta: "Claro" },
        { id: "sistema", etiqueta: "Como el sistema" },
      ]}
    />
  );
}

/* ---------- Correo (la lista de lo que Clara leyó) ---------- */

export type FilaCorreoDatos = { id: string; remitente: string; asunto: string; resumen: string; accion?: string; hrefAccion?: string; fecha: string; prioridad?: { texto: string; tono: "error" | "atencion" | "neutro" | "azul" }; nuevo?: boolean };

export function ListaCorreos({ correos }: { correos: FilaCorreoDatos[] }) {
  return (
    <ul className="pc-correos">
      {correos.map((c, i) => (
        <li key={c.id} className="pc-entra" style={{ "--d": `${retrasoEscalon(i)}ms` } as CSSProperties}>
          <Tarjeta como="article" className="pc-correo">
            <p className="pc-correo__cabeza">
              <span className="pc-correo__de">{c.remitente}</span>
              {c.prioridad ? <span className={`pc-estado pc-estado--${c.prioridad.tono}`}>{c.prioridad.texto}</span> : null}
              {c.nuevo ? <span className="pc-estado pc-estado--azul">Nuevo</span> : null}
              <span className="pc-correo__fecha cifras">{c.fecha}</span>
            </p>
            <h3 className="pc-correo__asunto">{c.asunto}</h3>
            <p className="pc-correo__resumen">{c.resumen}</p>
            {c.accion ? (
              c.hrefAccion ? (
                <Enlace href={c.hrefAccion} className="pc-correo__accion">
                  <Icono nombre="flecha" tam={16} />
                  {c.accion}
                </Enlace>
              ) : (
                <p className="pc-correo__accion">
                  <Icono nombre="flecha" tam={16} />
                  {c.accion}
                </p>
              )
            ) : null}
          </Tarjeta>
        </li>
      ))}
    </ul>
  );
}

export { Vacio };
