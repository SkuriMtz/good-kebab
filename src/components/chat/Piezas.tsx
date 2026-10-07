"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Texto } from "@/components/Texto";
import { Personaje } from "@/components/agentes/Personaje";
import { Boton } from "@/components/base/Boton";
import { Campo } from "@/components/base/Campo";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, type IdAgente } from "@/lib/agentes";

/*
 * Las piezas del chat (estilo de producto, como un chat de asistente en una
 * herramienta de desarrollo): el agente habla en texto corrido con su
 * personaje y su nombre arriba; lo tuyo va en una burbuja neutra a la
 * derecha. Sin cajas alrededor de cada respuesta: la jerarquía la hacen el
 * avatar, el nombre, la hora en Mono y el aire entre bloques.
 * Las usan el chat del inicio, /pruebalo y el chat real del panel.
 * Estilos: src/estilos/chat.css (bloque .chat).
 */

/** "Lola", "Lola y Víctor", "Lola, Clara e Iris". */
export function nombres(ids: readonly IdAgente[]) {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  return `${n.slice(0, -1).join(", ")} ${/^[iIíÍ]/.test(ultimo) ? "e" : "y"} ${ultimo}`;
}

/** El personaje del agente (o los de un grupo, encimados) en un círculo con filo de 1px. */
export function Caras({ agentes, tam = "normal" }: { agentes: readonly IdAgente[]; tam?: "chica" | "normal" | "grande" }) {
  const lista = agentes.slice(0, 4);
  return (
    <span className={`chat__caras chat__caras--${tam}`} data-n={lista.length} aria-hidden="true">
      {lista.map((id) => (
        <span key={id} className="chat__cara">
          <Personaje agente={id} avatar />
        </span>
      ))}
    </span>
  );
}

/** Avatar con iniciales para una persona (la paciente de la escena). */
export function Iniciales({ texto }: { texto: string }) {
  return (
    <span className="chat__iniciales" aria-hidden="true">
      {texto}
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
            <span className="chat__token">{p.trim()}</span>
          </Fragment>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export type Fila = {
  /** Primer mensaje de un bloque seguido de la misma persona: lleva avatar y nombre. */
  primero: boolean;
  /** Último del bloque. */
  ultimo?: boolean;
  /** Mensaje recién llegado: entra con animación. */
  nueva?: boolean;
  /** Separación amplia arriba (empieza un bloque nuevo). */
  bloque?: boolean;
  hora?: string;
};

const clasesFila = ({ nueva, bloque }: Fila, extra = "") =>
  ["chat__fila", nueva ? "chat__entra" : "", bloque ? "chat__fila--bloque" : "", extra].filter(Boolean).join(" ");

/** Separador del día: una línea fina con "HOY" o "AYER" en Mono al centro. */
export function Dia({ children }: { children: ReactNode }) {
  return (
    <p className="chat__dia">
      <span>{children}</span>
    </p>
  );
}

/** Evento del hilo ("Creaste el grupo…"), como una línea de la línea de tiempo. */
export function Sistema({ texto, error = false, ...fila }: Fila & { texto: string; error?: boolean }) {
  return (
    <p className={clasesFila(fila, `chat__sistema${error ? " chat__sistema--error" : ""}`)} role={error ? "alert" : undefined}>
      <Icono nombre={error ? "alerta" : "usuarios"} tam={16} />
      <span>{texto}</span>
    </p>
  );
}

/** Lo que escribes tú: burbuja neutra a la derecha, con la hora debajo en Mono. */
export function MensajeTuyo({ texto, quien, ...fila }: Fila & { texto: string; quien?: ReactNode }) {
  return (
    <div className={clasesFila(fila, "chat__fila--tu")}>
      <div className="chat__tu">
        {quien && fila.primero ? <p className="chat__quien">{quien}</p> : null}
        <p className="chat__burbuja" data-primero={fila.primero ? "" : undefined}>
          <span className="whitespace-pre-wrap">
            <TextoTuyo texto={texto} />
          </span>
        </p>
        {fila.hora && fila.ultimo !== false ? (
          <time className="chat__hora">{fila.hora}</time>
        ) : null}
      </div>
    </div>
  );
}

/** Nombre del agente arriba de su bloque: nombre, área en Mono (en grupo) y hora. */
function Cabeza({ agente, area, hora, extra }: { agente: IdAgente; area?: boolean; hora?: string; extra?: ReactNode }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <p className="chat__cabeza-msg">
      <span className="chat__nombre">{info.nombre}</span>
      {area ? <span className="chat__area">{info.area}</span> : null}
      {extra}
      {hora ? <time className="chat__hora chat__hora--linea">{hora}</time> : null}
    </p>
  );
}

/** Respuesta de un agente: su personaje y su nombre arriba del bloque, el texto corrido. */
export function MensajeAgente({
  agente,
  texto,
  enGrupo = false,
  pie,
  enCurso = false,
  ...fila
}: Fila & { agente: IdAgente; texto: string; enGrupo?: boolean; pie?: ReactNode; enCurso?: boolean }) {
  return (
    <div className={clasesFila(fila, "chat__fila--agente")} data-agente={agente}>
      <span className="chat__lado">{fila.primero ? <Caras agentes={[agente]} tam="chica" /> : null}</span>
      <div className="chat__columna">
        {fila.primero ? <Cabeza agente={agente} area={enGrupo} hora={fila.hora} /> : null}
        <div className="chat__texto" aria-busy={enCurso || undefined}>
          <Texto texto={texto} />
          {enCurso ? <span className="chat__cursor" aria-hidden="true" /> : null}
        </div>
        {pie}
      </div>
    </div>
  );
}

/** "Lola está escribiendo": su personaje, su nombre y tres puntos que laten (solo opacidad). */
export function Escribiendo({ agente, sigue = false, enGrupo = false }: { agente: IdAgente; sigue?: boolean; enGrupo?: boolean }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <div className={`chat__fila chat__fila--agente chat__entra${sigue ? "" : " chat__fila--bloque"}`} role="status">
      <span className="chat__lado">{sigue ? null : <Caras agentes={[agente]} tam="chica" />}</span>
      <div className="chat__columna">
        {sigue ? null : <Cabeza agente={agente} area={enGrupo} />}
        <span className="chat__puntos" aria-label={`${info.nombre} está escribiendo`}>
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

/**
 * Ventana para armar un grupo: se eligen los personajes (mínimo dos) y se le
 * pone nombre. Escape o tocar fuera la cierra; el foco entra al primer agente.
 */
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
  const faltan = elegidos.length < 2;
  const listo = !faltan && (!nombreObligatorio || nombre.trim().length > 0);

  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;
  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLButtonElement>("button[aria-pressed]:not(:disabled)")?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrarRef.current();
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      antes?.focus?.({ preventScroll: true });
    };
  }, []);

  const alternar = (id: IdAgente) =>
    setElegidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : IDS_AGENTES.filter((x) => x === id || e.includes(x))));
  const crear = () => listo && onCrear(nombre.trim(), elegidos);

  return (
    <div className="chat__capa" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={panelRef} className="chat__dialogo" role="dialog" aria-modal="true" aria-labelledby="nuevo-grupo-titulo">
        <div className="chat__dialogo-cabeza">
          <div>
            <p className="etiqueta etiqueta--tenue">Nuevo grupo</p>
            <p id="nuevo-grupo-titulo" className="chat__dialogo-titulo">
              ¿Quiénes trabajan juntos?
            </p>
          </div>
          <button type="button" className="chat__icono" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" tam={20} />
          </button>
        </div>

        <div className="chat__elegir-rejilla" role="group" aria-label="Agentes del grupo">
          {AGENTES_INFO.map((a) => {
            const puede = disponibles.includes(a.id);
            const elegido = elegidos.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                className="chat__elegir"
                aria-pressed={elegido}
                disabled={!puede}
                title={puede ? undefined : "No está en tu equipo"}
                onClick={() => alternar(a.id)}
              >
                <span className="chat__elegir-check" aria-hidden="true">
                  <Icono nombre="check" tam={16} trazo={2} />
                </span>
                <span className="chat__elegir-cara" aria-hidden="true">
                  <Personaje agente={a.id} avatar />
                </span>
                <span className="chat__elegir-nombre">{a.nombre}</span>
                <span className="chat__elegir-area">{puede ? a.area : "No está en tu equipo"}</span>
              </button>
            );
          })}
        </div>

        <Campo
          etiqueta={nombreObligatorio ? "Nombre del grupo" : "Nombre o tema (opcional)"}
          value={nombre}
          maxLength={maxNombre}
          alCambiar={setNombre}
          onKeyDown={(e) => e.key === "Enter" && crear()}
          ayuda={nombreObligatorio ? "Por ejemplo: Recepción, Promociones de diciembre" : "Por ejemplo: Recepción, campaña de noviembre"}
        />

        <div className="chat__dialogo-pie">
          <p className="chat__dialogo-resumen" aria-live="polite">
            {elegidos.length ? nombres(elegidos) : "Elige al menos dos"}
          </p>
          <div className="chat__dialogo-botones">
            <Boton variante="fantasma" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton variante="principal" disabled={!listo} onClick={crear}>
              Crear grupo
            </Boton>
          </div>
        </div>
      </div>
    </div>
  );
}
