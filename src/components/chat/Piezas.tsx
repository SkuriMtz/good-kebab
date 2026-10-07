"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Texto } from "@/components/Texto";
import { Personaje } from "@/components/agentes/Personaje";
import { Boton } from "@/components/base/Boton";
import { Campo } from "@/components/base/Campo";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, type IdAgente } from "@/lib/agentes";

/*
 * Piezas del chat como una línea de tiempo (al estilo de una conversación de
 * revisión): cada mensaje es un comentario con el personaje a un lado y su
 * nombre en la cabecera; lo que el agente HACE (agendó, envió, marcó como
 * urgente) es un evento compacto sobre la línea, con ícono de contorno y la
 * hora en Mono. Las usan el chat de ejemplo (/ y /pruebalo) y el chat real
 * (/panel/chat). Estilos: src/estilos/chat.css (".charla").
 */

/** "Lola", "Lola y Víctor", "Lola, Clara e Iris". */
export function nombres(ids: readonly IdAgente[]) {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  return `${n.slice(0, -1).join(", ")} ${/^[iIíÍ]/.test(ultimo) ? "e" : "y"} ${ultimo}`;
}

/** **negritas** en una línea corta (eventos, avisos). Nunca interpreta HTML. */
export function negritas(texto: string): ReactNode {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>,
  );
}

/* ---------- Íconos propios del chat (mismo trazo que base/Iconos: 1.75, puntas redondas) ---------- */

function Trazo({ children, tam = 16 }: { children: ReactNode; tam?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tam}
      height={tam}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="charla__trazo"
    >
      {children}
    </svg>
  );
}

/** La persona (tú): cabeza y hombros. */
export const IconoPersona = ({ tam }: { tam?: number }) => (
  <Trazo tam={tam}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
  </Trazo>
);
/** Lista de conversaciones (panel lateral). */
export const IconoLado = ({ tam }: { tam?: number }) => (
  <Trazo tam={tam}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M9.5 4.5v15M6 8.5h1M6 11.5h1" />
  </Trazo>
);
export const IconoCopiar = ({ tam }: { tam?: number }) => (
  <Trazo tam={tam}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </Trazo>
);
export const IconoBasura = ({ tam }: { tam?: number }) => (
  <Trazo tam={tam}>
    <path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l.8 11.6A1.5 1.5 0 0 0 8.8 20h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    <path d="M10.25 11v5M13.75 11v5" />
  </Trazo>
);

/* ---------- Caras ---------- */

/** Posición de cada cara en una caja de 40px: encimadas, una sobre otra. */
const ACOMODO: Record<number, { x: number; y: number; s: number }[]> = {
  1: [{ x: 0, y: 0, s: 40 }],
  2: [
    { x: 0, y: 0, s: 28 },
    { x: 12, y: 12, s: 28 },
  ],
  3: [
    { x: 0, y: 2, s: 24 },
    { x: 16, y: 2, s: 24 },
    { x: 8, y: 16, s: 24 },
  ],
  4: [
    { x: 0, y: 0, s: 22 },
    { x: 18, y: 0, s: 22 },
    { x: 0, y: 18, s: 22 },
    { x: 18, y: 18, s: 22 },
  ],
};

/** El personaje (o los personajes encimados de un grupo) en un círculo. */
export function Caras({ agentes, tam }: { agentes: readonly IdAgente[]; tam: number }) {
  const k = tam / 40;
  const acomodo = ACOMODO[Math.min(Math.max(agentes.length, 1), 4)];
  return (
    <span className="charla__caras" style={{ width: tam, height: tam }} aria-hidden="true">
      {agentes.slice(0, 4).map((id, i) => {
        const p = acomodo[i];
        return (
          <span
            key={id}
            className="charla__cara"
            data-sola={agentes.length === 1 ? "" : undefined}
            style={{ left: p.x * k, top: p.y * k, width: p.s * k, height: p.s * k }}
          >
            <Personaje agente={id} avatar className="charla__cara-dibujo" />
          </span>
        );
      })}
    </span>
  );
}

/** Avatar de quien escribe: el personaje del agente o el ícono de la persona. */
export function Avatar({ autor, className = "" }: { autor: "tu" | IdAgente; className?: string }) {
  return (
    <span className={`charla__avatar ${className}`} data-tu={autor === "tu" ? "" : undefined} aria-hidden="true">
      {autor === "tu" ? <IconoPersona /> : <Personaje agente={autor} avatar className="charla__avatar-dibujo" />}
    </span>
  );
}

/* ---------- Línea de tiempo ---------- */

/** La lista que lleva la línea vertical. Dentro: Dia, Comentario, Evento, Escribiendo. */
export function Hilo({ children, etiqueta }: { children: ReactNode; etiqueta: string }) {
  return (
    <ol className="charla__hilo" aria-label={etiqueta}>
      {children}
    </ol>
  );
}

/** Separador del día ("Hoy", "Ayer", "lunes 6 oct.") sentado sobre la línea. */
export function Dia({ children }: { children: ReactNode }) {
  return (
    <li className="charla__dia">
      <span>{children}</span>
    </li>
  );
}

/**
 * Un comentario: personaje a la izquierda (sobre la línea), caja con cabecera
 * (nombre, hora en Mono y el área del agente) y el cuerpo. Los mensajes
 * seguidos de la misma voz van juntos en una sola caja.
 */
export function Comentario({
  autor,
  hora,
  nueva = false,
  acciones,
  pie,
  children,
}: {
  autor: "tu" | IdAgente;
  hora?: string;
  /** Recién llegado: entra con un desliz corto. */
  nueva?: boolean;
  /** Botones a la derecha de la cabecera (copiar). */
  acciones?: ReactNode;
  /** Debajo de la caja (un error, por ejemplo). */
  pie?: ReactNode;
  children: ReactNode;
}) {
  const tu = autor === "tu";
  const info = tu ? null : AGENTE_POR_ID[autor];
  return (
    <li className={`charla__entrada${nueva ? " charla__entra" : ""}`} data-tu={tu ? "" : undefined}>
      <Avatar autor={autor} className="charla__avatar--lado" />
      <article className="charla__caja" aria-label={tu ? "Tu mensaje" : `Mensaje de ${info!.nombre}`}>
        <header className="charla__caja-cabeza">
          <Avatar autor={autor} className="charla__avatar--cabeza" />
          <span className="charla__autor">{tu ? "Tú" : info!.nombre}</span>
          {hora ? (
            <time className="charla__hora" aria-label={`a las ${hora}`}>
              {hora}
            </time>
          ) : null}
          <span className="charla__caja-espacio" />
          {info ? <span className="charla__rol">{info.area}</span> : null}
          {acciones}
        </header>
        <div className="charla__caja-cuerpo">{children}</div>
      </article>
      {pie}
    </li>
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
            <span className="charla__token">{p.trim()}</span>
          </Fragment>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** Un mensaje dentro de un comentario (el de la persona o el de un agente). */
export function Cuerpo({ autor, texto }: { autor: "tu" | IdAgente; texto: string }) {
  return autor === "tu" ? (
    <p className="charla__parrafo whitespace-pre-wrap">
      <TextoTuyo texto={texto} />
    </p>
  ) : (
    <div className="charla__parrafo">
      <Texto texto={texto} />
    </div>
  );
}

export type TonoEvento = "neutro" | "exito" | "alerta" | "error";

/**
 * Lo que hizo un agente, compacto y sobre la línea: ícono en un círculo,
 * "**Lola** agendó…", el detalle en Mono y la hora.
 */
export function Evento({
  agente,
  icono,
  tono = "neutro",
  texto,
  detalle,
  hora,
  nueva = false,
  alerta = false,
}: {
  /** Quién lo hizo (su personaje chiquito antes del texto). Sin agente: aviso del sistema. */
  agente?: IdAgente | null;
  icono: NombreIcono;
  tono?: TonoEvento;
  /** Admite **negritas**. */
  texto: string;
  detalle?: string;
  hora?: string;
  nueva?: boolean;
  /** Se anuncia en voz alta (errores). */
  alerta?: boolean;
}) {
  return (
    <li className={`charla__evento${nueva ? " charla__entra" : ""}`} data-tono={tono} role={alerta ? "alert" : undefined}>
      <span className="charla__insignia" aria-hidden="true">
        <Icono nombre={icono} tam={16} />
      </span>
      <div className="charla__evento-texto">
        <p>
          {agente ? (
            <span className="charla__evento-quien">
              <Personaje agente={agente} avatar className="charla__mini" />
            </span>
          ) : null}
          {negritas(texto)}
          {hora ? (
            <time className="charla__hora charla__hora--evento" aria-label={`a las ${hora}`}>
              {hora}
            </time>
          ) : null}
        </p>
        {detalle ? <p className="charla__detalle">{detalle}</p> : null}
      </div>
    </li>
  );
}

/** "Lola está escribiendo", sin caja: el personaje sobre la línea y tres puntos. */
export function Escribiendo({ agente }: { agente: IdAgente }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <li className="charla__escribiendo charla__entra" role="status">
      <span className="charla__insignia charla__insignia--cara" aria-hidden="true">
        <Personaje agente={agente} avatar className="charla__avatar-dibujo" />
      </span>
      <p>
        <strong>{info.nombre}</strong> está escribiendo
        <span className="charla__puntos" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </p>
    </li>
  );
}

/* ---------- Nuevo grupo ---------- */

/** Ventana para armar un grupo: se eligen los personajes y se le pone nombre. */
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
  const falta =
    elegidos.length < 2
      ? `Elige ${elegidos.length ? "a uno más" : "a dos o más"}`
      : nombreObligatorio && !nombre.trim()
        ? "Falta el nombre"
        : nombres(elegidos);

  return (
    <div className="charla__capa" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={panelRef} className="charla__dialogo" role="dialog" aria-modal="true" aria-labelledby="nuevo-grupo-titulo">
        <header className="charla__dialogo-cabeza">
          <div>
            <p id="nuevo-grupo-titulo" className="charla__dialogo-titulo">
              Nuevo grupo
            </p>
            <p className="charla__dialogo-texto">
              Elige a quién incluir (mínimo dos) y ponle nombre{nombreObligatorio ? "" : " o tema"}.
            </p>
          </div>
          <button type="button" className="charla__boton-icono" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" tam={16} />
          </button>
        </header>

        <div className="charla__dialogo-cuerpo">
          <div className="charla__elegir-rejilla">
            {AGENTES_INFO.map((a) => {
              const puede = disponibles.includes(a.id);
              const si = elegidos.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  className="charla__elegir"
                  aria-pressed={si}
                  disabled={!puede}
                  onClick={() => alternar(a.id)}
                >
                  <span className="charla__casilla" aria-hidden="true">
                    <Icono nombre="check" tam={12} trazo={2} />
                  </span>
                  <Caras agentes={[a.id]} tam={40} />
                  <span className="charla__elegir-nombre">{a.nombre}</span>
                  <span className="charla__elegir-area">{puede ? a.area : "No está en tu equipo"}</span>
                </button>
              );
            })}
          </div>

          <Campo
            className="charla__dialogo-campo"
            etiqueta={nombreObligatorio ? "Nombre del grupo" : "Nombre o tema (opcional)"}
            value={nombre}
            maxLength={maxNombre}
            alCambiar={setNombre}
            onKeyDown={(e) => e.key === "Enter" && crear()}
            autoComplete="off"
          />
        </div>

        <footer className="charla__dialogo-pie">
          <p className="charla__dialogo-estado" aria-live="polite">
            {falta}
          </p>
          <div className="charla__dialogo-botones">
            <Boton variante="fantasma" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton variante="principal" disabled={!listo} onClick={crear}>
              Crear grupo
            </Boton>
          </div>
        </footer>
      </div>
    </div>
  );
}
