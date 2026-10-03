"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Texto } from "@/components/Texto";
import { PERSONAJES, Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, type IdAgente } from "@/lib/agentes";

/*
 * Las piezas del chat con estilo de app de mensajería (burbujas, caras,
 * "escribiendo…", panel de nuevo grupo). Las usan el chat de ejemplo de la
 * página de inicio y el chat real del panel; el estilo vive en globals.css
 * bajo .chat-app.
 */

/** "Lola", "Lola y Víctor", "Lola, Clara e Iris". */
export function nombres(ids: readonly IdAgente[]) {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  return `${n.slice(0, -1).join(", ")} ${/^[iIíÍ]/.test(ultimo) ? "e" : "y"} ${ultimo}`;
}

/** Posición de cada cara en una caja de 46px: encimadas, una sobre otra. */
const ACOMODO: Record<number, { x: number; y: number; s: number }[]> = {
  1: [{ x: 0, y: 0, s: 46 }],
  2: [
    { x: 0, y: 0, s: 32 },
    { x: 14, y: 14, s: 32 },
  ],
  3: [
    { x: 0, y: 3, s: 28 },
    { x: 18, y: 3, s: 28 },
    { x: 9, y: 18, s: 28 },
  ],
  4: [
    { x: 0, y: 0, s: 26 },
    { x: 20, y: 0, s: 26 },
    { x: 0, y: 20, s: 26 },
    { x: 20, y: 20, s: 26 },
  ],
};

/** El personaje (o los personajes encimados de un grupo) en un círculo suave. */
export function Caras({ agentes, tam }: { agentes: readonly IdAgente[]; tam: number }) {
  const k = tam / 46;
  const acomodo = ACOMODO[Math.min(Math.max(agentes.length, 1), 4)];
  return (
    <span className="relative block shrink-0" style={{ width: tam, height: tam }} aria-hidden="true">
      {agentes.slice(0, 4).map((id, i) => {
        const p = acomodo[i];
        return (
          <span
            key={id}
            className="chat-app__cara"
            data-sola={agentes.length === 1 ? "" : undefined}
            style={{ left: p.x * k, top: p.y * k, width: p.s * k, height: p.s * k }}
          >
            <Personaje agente={id} avatar className="h-[78%] w-[78%]" />
          </span>
        );
      })}
    </span>
  );
}

/** Resalta @menciones y /acciones dentro del mensaje de la persona. */
function TextoTuyo({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/((?:^|\s)[@/][\wÀ-ÿ-]+)/g).map((p, i) =>
        /^\s?[@/]/.test(p) ? (
          <Fragment key={i}>
            {/^\s/.test(p) ? p[0] : ""}
            <strong className="font-semibold">{p.trim()}</strong>
          </Fragment>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

type Fila = {
  /** Primer mensaje de un bloque seguido de la misma persona. */
  primero: boolean;
  /** Último del bloque: lleva el avatar y la esquina más recta. */
  ultimo: boolean;
  /** Mensaje recién llegado: entra con animación. */
  nueva?: boolean;
  /** Separación amplia arriba (empieza un bloque que no va pegado a un separador). */
  bloque?: boolean;
  hora?: string;
};

const clasesFila = ({ nueva, bloque }: Fila) =>
  `chat-app__fila${nueva ? " chat-app__entra" : ""}${bloque ? " chat-app__fila--bloque" : ""}`;

/** Separador del día ("Hoy", "Ayer", "12 sep."). */
export function Dia({ children }: { children: ReactNode }) {
  return <p className="chat-app__dia">{children}</p>;
}

/** Aviso centrado, como "Creaste el grupo…". */
export function Sistema({ texto, error = false, ...fila }: Fila & { texto: string; error?: boolean }) {
  return (
    <p className={`${clasesFila(fila)} chat-app__sistema${error ? " chat-app__sistema--error" : ""}`} role={error ? "alert" : undefined}>
      <span>{texto}</span>
    </p>
  );
}

/** Burbuja de la persona: a la derecha, en el color de la marca. */
export function MensajeTuyo({ texto, ...fila }: Fila & { texto: string }) {
  return (
    <div className={`${clasesFila(fila)} justify-end`}>
      <p
        className="chat-app__burbuja chat-app__burbuja--tu"
        data-primero={fila.primero ? "" : undefined}
        data-ultimo={fila.ultimo ? "" : undefined}
      >
        <span className="whitespace-pre-wrap">
          <TextoTuyo texto={texto} />
        </span>
        {fila.hora ? <span className="chat-app__hora">{fila.hora}</span> : null}
      </p>
    </div>
  );
}

/** Nombre del agente arriba de su bloque, con su color. */
function Nombre({ agente, area }: { agente: IdAgente; area?: boolean }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <p className="chat-app__nombre">
      <span className="chat-app__marca" style={{ background: PERSONAJES[agente].color }} aria-hidden="true" />
      <span className="font-medium text-bone">{info.nombre}</span>
      {area ? <span className="text-ash">{info.area}</span> : null}
    </p>
  );
}

/** Burbuja de un agente: su personaje chiquito, su nombre arriba del bloque y el texto. */
export function MensajeAgente({
  agente,
  texto,
  enGrupo = false,
  pie,
  ...fila
}: Fila & { agente: IdAgente; texto: string; enGrupo?: boolean; pie?: ReactNode }) {
  return (
    <div className={clasesFila(fila)}>
      <span className="chat-app__avatar">{fila.ultimo ? <Personaje agente={agente} avatar className="h-8 w-8" /> : null}</span>
      <div className="chat-app__columna">
        {fila.primero ? <Nombre agente={agente} area={enGrupo} /> : null}
        <div
          className="chat-app__burbuja chat-app__burbuja--agente"
          data-primero={fila.primero ? "" : undefined}
          data-ultimo={fila.ultimo ? "" : undefined}
        >
          <div className="chat-app__texto">
            <Texto texto={texto} />
          </div>
          {fila.hora ? <span className="chat-app__hora">{fila.hora}</span> : null}
        </div>
        {pie}
      </div>
    </div>
  );
}

/** Los tres puntos de "escribiendo…", con el personaje de quien escribe. */
export function Escribiendo({ agente, sigue, enGrupo = false }: { agente: IdAgente; sigue: boolean; enGrupo?: boolean }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <div className={`chat-app__fila chat-app__entra${sigue ? "" : " chat-app__fila--bloque"}`}>
      <span className="chat-app__avatar">
        <Personaje agente={agente} avatar className="h-8 w-8" />
      </span>
      <div className="chat-app__columna">
        {sigue ? null : <Nombre agente={agente} area={enGrupo} />}
        <span
          className="chat-app__burbuja chat-app__burbuja--agente chat-app__puntos"
          data-primero={sigue ? undefined : ""}
          data-ultimo=""
          role="status"
          aria-label={`${info.nombre} está escribiendo`}
        >
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

export function IconoCerrar() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconoMas() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconoLista() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M3 6h14M3 10h14M3 14h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Panel para armar un grupo: se eligen los personajes y se le pone nombre. */
export function NuevoGrupo({
  onCrear,
  onCerrar,
  disponibles = IDS_AGENTES,
  nombreObligatorio = true,
  maxNombre = 40,
}: {
  onCrear: (nombre: string, agentes: IdAgente[]) => void;
  onCerrar: () => void;
  /** Agentes que se pueden elegir (los demás se ven apagados). */
  disponibles?: readonly IdAgente[];
  nombreObligatorio?: boolean;
  maxNombre?: number;
}) {
  const [elegidos, setElegidos] = useState<IdAgente[]>([]);
  const [nombre, setNombre] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const listo = elegidos.length >= 2 && (!nombreObligatorio || nombre.trim().length > 0);

  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;
  useEffect(() => {
    panelRef.current?.querySelector<HTMLButtonElement>("button[aria-pressed]:not(:disabled)")?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrarRef.current();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const alternar = (id: IdAgente) =>
    setElegidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : IDS_AGENTES.filter((x) => x === id || e.includes(x))));
  const crear = () => listo && onCrear(nombre.trim(), elegidos);

  return (
    <div className="chat-app__capa" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={panelRef} className="chat-app__panel" role="dialog" aria-modal="true" aria-labelledby="nuevo-grupo-titulo">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p id="nuevo-grupo-titulo" className="text-[1.25rem] font-medium tracking-[-0.01em]">
              Nuevo grupo
            </p>
            <p className="mt-1 text-[0.875rem] text-ash">
              Elige a quién incluir (mínimo dos) y ponle nombre{nombreObligatorio ? "" : " o tema"}.
            </p>
          </div>
          <button type="button" className="chat-app__icono -mr-2 -mt-1" onClick={onCerrar} aria-label="Cerrar">
            <IconoCerrar />
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AGENTES_INFO.map((a) => {
            const puede = disponibles.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                className="chat-app__elegir"
                aria-pressed={elegidos.includes(a.id)}
                disabled={!puede}
                title={puede ? undefined : "No está en tu equipo"}
                onClick={() => alternar(a.id)}
              >
                <span className="chat-app__check" aria-hidden="true">
                  <svg viewBox="0 0 20 20" className="h-3 w-3">
                    <path d="M5 10.5l3.2 3L15 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <Personaje agente={a.id} avatar className="h-14 w-14" />
                <span className="mt-3 text-[0.9375rem] font-medium text-bone">{a.nombre}</span>
                <span className="text-[0.75rem] text-ash">{puede ? a.area : "No está en tu equipo"}</span>
              </button>
            );
          })}
        </div>

        <label className="mt-7 block">
          <span className="text-[0.8125rem] text-ash">{nombreObligatorio ? "Nombre del grupo" : "Nombre o tema (opcional)"}</span>
          <input
            className="chat-app__campo mt-2"
            value={nombre}
            maxLength={maxNombre}
            placeholder={nombreObligatorio ? "Ej. Promociones de diciembre" : "Ej. Recepción, campaña de noviembre"}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crear()}
          />
        </label>

        <div className="mt-8 flex items-center justify-end gap-4 sm:justify-between">
          <p className="hidden min-w-0 truncate text-[0.8125rem] text-ash sm:block">
            {elegidos.length ? nombres(elegidos) : "Nadie todavía"}
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="chat-app__boton" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="button" className="chat-app__boton chat-app__boton--fuerte" disabled={!listo} onClick={crear}>
              Crear grupo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
