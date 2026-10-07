"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Boton } from "@/components/base/Boton";
import { Campo } from "@/components/base/Campo";
import { Icono } from "@/components/base/Iconos";
import { Texto } from "@/components/Texto";
import { PERSONAJES, Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, type IdAgente } from "@/lib/agentes";

/*
 * Las piezas del chat (Grupo 2 · G2-T5). Las usan el chat de demostración
 * (/pruebalo) y el chat real del panel (/panel/chat); el estilo vive en
 * src/estilos/chat.css bajo ".charla".
 * Lenguaje de producto al estilo GitHub: la respuesta del agente va sin caja
 * (su personaje, su nombre y la hora en Mono arriba del bloque); lo tuyo, en
 * una burbuja neutra a la derecha; los avisos, como eventos de una línea de
 * tiempo. Nada de cajas sin intención.
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

/** El personaje (o los personajes encimados de un grupo), cada uno en un círculo con un velo de su color. */
export function Caras({ agentes, tam }: { agentes: readonly IdAgente[]; tam: number }) {
  const k = tam / 46;
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
            style={
              {
                left: p.x * k,
                top: p.y * k,
                width: p.s * k,
                height: p.s * k,
                "--agente": PERSONAJES[id].color,
              } as CSSProperties
            }
          >
            <Personaje agente={id} avatar />
          </span>
        );
      })}
    </span>
  );
}

/** Resalta @menciones y /acciones dentro del mensaje de la persona (en Mono, como código). */
function TextoTuyo({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/((?:^|\s)[@/][\wÀ-ÿ-]+)/g).map((p, i) =>
        /^\s?[@/]/.test(p) ? (
          <Fragment key={i}>
            {/^\s/.test(p) ? p[0] : ""}
            <span className="charla__mencion">{p.trim()}</span>
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
  /** Último del bloque: lleva la esquina más recta. */
  ultimo: boolean;
  /** Mensaje recién llegado: entra con animación. */
  nueva?: boolean;
  /** Separación amplia arriba (empieza un bloque que no va pegado a un separador). */
  bloque?: boolean;
  hora?: string;
};

const clasesFila = ({ nueva, bloque }: Fila, extra: string) =>
  `charla__fila ${extra}${nueva ? " charla__entra" : ""}${bloque ? " charla__fila--bloque" : ""}`;

/** Separador del día ("Hoy", "Ayer", "12 sep."), con líneas finas a los lados. */
export function Dia({ children }: { children: ReactNode }) {
  return (
    <p className="charla__dia">
      <span>{children}</span>
    </p>
  );
}

/** Aviso de una línea, como evento de línea de tiempo ("Creaste el grupo…") o error. */
export function Sistema({ texto, error = false, ...fila }: Fila & { texto: string; error?: boolean }) {
  return (
    <p
      className={`${clasesFila(fila, "charla__sistema")}${error ? " charla__sistema--error" : ""}`}
      role={error ? "alert" : undefined}
    >
      <span className="charla__sistema-icono" aria-hidden="true">
        <Icono nombre={error ? "alerta" : "usuarios"} tam={14} />
      </span>
      <span>{texto}</span>
      {fila.hora && !error ? <span className="charla__sello">{fila.hora}</span> : null}
    </p>
  );
}

/** Burbuja de la persona: a la derecha, neutra (el violeta queda para el botón principal). */
export function MensajeTuyo({ texto, ...fila }: Fila & { texto: string }) {
  return (
    <div className={clasesFila(fila, "charla__fila--tu")}>
      <p className="charla__burbuja" data-ultimo={fila.ultimo ? "" : undefined}>
        <span className="sr-only">Tú: </span>
        <span className="whitespace-pre-wrap">
          <TextoTuyo texto={texto} />
        </span>
        {fila.hora ? <span className="charla__sello charla__sello--dentro">{fila.hora}</span> : null}
      </p>
    </div>
  );
}

/** Quién habla: nombre, su área (en grupos) y la hora, en la cabeza de su bloque. */
function Autor({ agente, area, hora }: { agente: IdAgente; area?: boolean; hora?: string }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <p className="charla__autor">
      <span className="charla__autor-nombre">{info.nombre}</span>
      {area ? <span className="charla__sello">{info.area}</span> : null}
      {hora ? <span className="charla__sello">{hora}</span> : null}
    </p>
  );
}

/** Respuesta de un agente: su personaje y su nombre arriba del bloque, y el texto sin caja. */
export function MensajeAgente({
  agente,
  texto,
  enGrupo = false,
  pie,
  ...fila
}: Fila & { agente: IdAgente; texto: string; enGrupo?: boolean; pie?: ReactNode }) {
  return (
    <div className={clasesFila(fila, "charla__fila--agente")}>
      <span className="charla__avatar" style={{ "--agente": PERSONAJES[agente].color } as CSSProperties}>
        {fila.primero ? <Personaje agente={agente} avatar /> : null}
      </span>
      <div className="charla__columna">
        {fila.primero ? (
          <Autor agente={agente} area={enGrupo} hora={fila.hora} />
        ) : (
          <span className="sr-only">{AGENTE_POR_ID[agente].nombre}: </span>
        )}
        <div className="charla__texto">
          <Texto texto={texto} />
        </div>
        {pie}
      </div>
    </div>
  );
}

/** "Escribiendo…": el personaje de quien escribe y tres puntos, sin caja. */
export function Escribiendo({ agente, sigue, enGrupo = false }: { agente: IdAgente; sigue: boolean; enGrupo?: boolean }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <div className={`charla__fila charla__fila--agente charla__entra${sigue ? "" : " charla__fila--bloque"}`}>
      <span className="charla__avatar" style={{ "--agente": PERSONAJES[agente].color } as CSSProperties}>
        {sigue ? null : <Personaje agente={agente} avatar />}
      </span>
      <div className="charla__columna">
        {sigue ? null : <Autor agente={agente} area={enGrupo} />}
        <span className="charla__puntos" role="status" aria-label={`${info.nombre} está escribiendo`}>
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

export function IconoCerrar() {
  return <Icono nombre="cerrar" tam={16} />;
}

export function IconoMas() {
  return <Icono nombre="mas" tam={16} />;
}

/** Flecha hacia atrás (‹) para volver a la lista de chats en el celular. */
export function IconoLista() {
  return <Icono nombre="chevron-derecha" tam={20} className="charla__atras-flecha" />;
}

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
  const falta =
    elegidos.length < 2
      ? `Elige ${elegidos.length === 1 ? "a uno más" : "al menos a dos"}`
      : nombreObligatorio && !nombre.trim()
        ? "Falta el nombre del grupo"
        : null;

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
    <div className="charla__capa" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div
        ref={panelRef}
        className="charla__dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-grupo-titulo"
        data-lenis-prevent
      >
        <div className="charla__dialogo-cabeza">
          <div>
            <p id="nuevo-grupo-titulo" className="charla__dialogo-titulo">
              Nuevo grupo
            </p>
            <p className="charla__dialogo-texto">
              Elige a quién incluir (mínimo dos) y ponle nombre{nombreObligatorio ? "" : " o tema"}. Contesta quien sepa del tema.
            </p>
          </div>
          <button type="button" className="charla__icono" onClick={onCerrar} aria-label="Cerrar">
            <IconoCerrar />
          </button>
        </div>

        <div className="charla__elegir-rejilla">
          {AGENTES_INFO.map((a) => {
            const puede = disponibles.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                className="charla__elegir"
                aria-pressed={elegidos.includes(a.id)}
                disabled={!puede}
                title={puede ? undefined : "No está en tu equipo"}
                onClick={() => alternar(a.id)}
              >
                <span className="charla__check" aria-hidden="true">
                  <Icono nombre="check" tam={12} trazo={2} />
                </span>
                <span className="marca-agente marca-agente--chica" style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
                  <Personaje agente={a.id} avatar />
                </span>
                <span className="charla__elegir-nombre">{a.nombre}</span>
                <span className="charla__elegir-area">{puede ? a.area : "No está en tu equipo"}</span>
              </button>
            );
          })}
        </div>

        <Campo
          etiqueta={nombreObligatorio ? "Nombre del grupo" : "Nombre o tema (opcional)"}
          value={nombre}
          maxLength={maxNombre}
          placeholder={nombreObligatorio ? "Ej. Promociones de diciembre" : "Ej. Recepción, campaña de noviembre"}
          alCambiar={setNombre}
          onKeyDown={(e) => e.key === "Enter" && crear()}
          className="charla__dialogo-campo"
        />

        <div className="charla__dialogo-pie">
          <p className="charla__dialogo-estado" aria-live="polite">
            {falta ?? `Con ${nombres(elegidos)}`}
          </p>
          <div className="charla__dialogo-botones">
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
