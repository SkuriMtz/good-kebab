"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Texto } from "@/components/Texto";
import { claseBotonBase } from "@/components/base/Boton";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { PERSONAJES, Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, type IdAgente } from "@/lib/agentes";

/*
 * Las piezas del chat (las usan el chat de demostración —inicio y /pruebalo—
 * y el chat real del panel). El estilo vive en src/estilos/chat.css bajo ".chat".
 *
 * Idea: la conversación es un hilo de trabajo, como la línea de tiempo de una
 * revisión en GitHub. Una línea fina corre a la izquierda; sobre ella van los
 * personajes de los agentes y los "pasos" (quién le pasa el trabajo a quién).
 * Los agentes escriben sin caja (su nombre y su sello de hora hacen la
 * jerarquía); lo tuyo va en una burbuja a la derecha; lo que los agentes
 * producen (una cita, un mensaje programado, un archivo) va en una tarjeta.
 */

/** "Lola", "Lola y Víctor", "Lola, Clara e Iris". */
export function nombres(ids: readonly IdAgente[]) {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  return `${n.slice(0, -1).join(", ")} ${/^[iIíÍ]/.test(ultimo) ? "e" : "y"} ${ultimo}`;
}

/* ---------- Personajes ---------- */

/** El personaje de un agente dentro de un círculo (como un avatar de perfil). */
export function Avatar({ agente, tam = 32, className = "" }: { agente: IdAgente; tam?: 24 | 28 | 32 | 40 | 64; className?: string }) {
  return (
    <span className={`chat__avatar chat__avatar--${tam} ${className}`} aria-hidden="true">
      <Personaje agente={agente} avatar />
    </span>
  );
}

/** Varios personajes encimados, como la fila de colaboradores de un repositorio. */
export function PilaAvatares({ agentes, tam = 28 }: { agentes: readonly IdAgente[]; tam?: 24 | 28 | 32 | 40 }) {
  return (
    <span className="chat__pila" data-varios={agentes.length > 1 ? "" : undefined} aria-hidden="true">
      {agentes.slice(0, 4).map((id) => (
        <Avatar key={id} agente={id} tam={tam} />
      ))}
    </span>
  );
}

/** Compatibilidad: caras de una conversación (una o varias). */
export function Caras({ agentes, tam }: { agentes: readonly IdAgente[]; tam: number }) {
  const t = tam >= 40 ? 40 : tam >= 32 ? 32 : 28;
  return <PilaAvatares agentes={agentes} tam={t} />;
}

/* ---------- Texto de la persona ---------- */

/** Resalta @menciones y pinta las /acciones como código. */
function TextoTuyo({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/((?:^|\s)[@/][\wÀ-ÿ-]+)/g).map((p, i) => {
        if (!/^\s?[@/]/.test(p)) return <Fragment key={i}>{p}</Fragment>;
        const espacio = /^\s/.test(p) ? p[0] : "";
        const token = p.trim();
        return (
          <Fragment key={i}>
            {espacio}
            {token.startsWith("/") ? <code className="chat__comando">{token}</code> : <strong className="chat__mencion">{token}</strong>}
          </Fragment>
        );
      })}
    </>
  );
}

/* ---------- Filas del hilo ---------- */

type Fila = {
  /** Primer mensaje de un bloque seguido de la misma persona: lleva nombre y personaje. */
  primero: boolean;
  /** Último del bloque. */
  ultimo?: boolean;
  /** Mensaje recién llegado: entra con animación. */
  nueva?: boolean;
  /** Separación amplia arriba (empieza un bloque). */
  bloque?: boolean;
  hora?: string;
};

const clasesFila = (base: string, { nueva, bloque }: Pick<Fila, "nueva" | "bloque">) =>
  `chat__fila ${base}${nueva ? " chat__entra" : ""}${bloque ? " chat__fila--bloque" : ""}`;

/** El hilo: una columna con la línea de tiempo a la izquierda. */
export function Hilo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`chat__hilo ${className}`}>{children}</div>;
}

/** Separador del día ("Hoy", "Ayer", "lunes 12 sep."). */
export function Dia({ children }: { children: ReactNode }) {
  return (
    <p className="chat__dia">
      <span>{children}</span>
    </p>
  );
}

/** Un evento de la línea de tiempo: un nodo con ícono sobre la línea y una frase corta. */
function Evento({
  icono,
  children,
  hora,
  nueva,
  error = false,
}: {
  icono: NombreIcono;
  children: ReactNode;
  hora?: string;
  nueva?: boolean;
  error?: boolean;
}) {
  return (
    <div className={clasesFila(`chat__evento${error ? " chat__evento--error" : ""}`, { nueva, bloque: true })} role={error ? "alert" : undefined}>
      <span className="chat__nodo" aria-hidden="true">
        <Icono nombre={icono} tam={16} />
      </span>
      <p className="chat__evento-texto">
        {children}
        {hora ? <span className="chat__sello"> · {hora}</span> : null}
      </p>
    </div>
  );
}

/** Aviso del sistema, como "Creaste el grupo…" (o un error, en rojo). */
export function Sistema({ texto, error = false, hora, nueva }: Partial<Fila> & { texto: string; error?: boolean }) {
  return (
    <Evento icono={error ? "alerta" : "usuarios"} hora={hora} nueva={nueva} error={error}>
      {texto}
    </Evento>
  );
}

/** Un agente le pasa el trabajo a otro: el momento en que se ve que colaboran. */
export function Paso({ de, a, texto, hora, nueva }: Partial<Fila> & { de: IdAgente; a: IdAgente; texto?: string }) {
  return (
    <Evento icono="flecha" hora={hora} nueva={nueva}>
      <strong>{AGENTE_POR_ID[de].nombre}</strong> {texto ?? "le pasa el trabajo a"} <strong>{AGENTE_POR_ID[a].nombre}</strong>
    </Evento>
  );
}

/** Lo que escribes tú: una burbuja a la derecha, sobre la superficie elevada. */
export function MensajeTuyo({ texto, ...fila }: Fila & { texto: string }) {
  return (
    <div className={clasesFila("chat__fila--tu", fila)}>
      <div className="chat__tu">
        <p className="chat__burbuja">
          <TextoTuyo texto={texto} />
        </p>
        {fila.hora && fila.ultimo !== false ? <span className="chat__sello chat__sello--tu">Tú · {fila.hora}</span> : null}
      </div>
    </div>
  );
}

/** Nombre del agente arriba de su bloque: nombre, área en Mono y sello de hora. */
function Cabeza({ agente, hora, area }: { agente: IdAgente; hora?: string; area: boolean }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <p className="chat__cabeza-msj">
      <span className="chat__nombre">{info.nombre}</span>
      {area ? <span className="chat__area">{info.area}</span> : null}
      {hora ? <span className="chat__sello">{hora}</span> : null}
    </p>
  );
}

/**
 * Lo que dice un agente: su personaje sobre la línea de tiempo, su nombre y
 * el texto sin caja. `tarjeta` agrega lo que produjo (cita, mensaje, archivo).
 */
export function MensajeAgente({
  agente,
  texto,
  enGrupo = true,
  tarjeta,
  pie,
  ...fila
}: Fila & { agente: IdAgente; texto: string; enGrupo?: boolean; tarjeta?: ReactNode; pie?: ReactNode }) {
  return (
    <div className={clasesFila("chat__fila--agente", fila)} style={{ ["--agente" as string]: PERSONAJES[agente].color }}>
      <span className="chat__carril">{fila.primero ? <Avatar agente={agente} tam={32} /> : null}</span>
      <div className="chat__columna">
        {fila.primero ? <Cabeza agente={agente} hora={fila.hora} area={enGrupo} /> : null}
        {texto ? (
          <div className="chat__texto">
            <Texto texto={texto} />
          </div>
        ) : null}
        {tarjeta}
        {pie}
      </div>
    </div>
  );
}

/** Los tres puntos de "escribiendo…", con el personaje de quien escribe. */
export function Escribiendo({ agente, sigue, enGrupo = true }: { agente: IdAgente; sigue: boolean; enGrupo?: boolean }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <div className={clasesFila("chat__fila--agente", { nueva: true, bloque: !sigue })}>
      <span className="chat__carril">{sigue ? null : <Avatar agente={agente} tam={32} />}</span>
      <div className="chat__columna">
        {sigue ? null : <Cabeza agente={agente} area={enGrupo} />}
        <span className="chat__puntos" role="status" aria-label={`${info.nombre} está escribiendo`}>
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

/* ---------- Lo que producen los agentes ---------- */

export type Tarjeta = {
  tipo: "cita" | "programado" | "archivo";
  /** Sello en Mono: canal y momento ("Cita · WhatsApp"). */
  sello: string;
  /** Estado corto ("Confirmada", "Espera tu visto bueno", "Listo"). */
  estado: string;
  titulo?: string;
  /** Pares etiqueta/valor ("Paciente", "Sofía Ramírez"). */
  datos?: [string, string][];
  /** Texto citado (el mensaje que se va a mandar). */
  cita?: string;
};

const ICONO_TARJETA: Record<Tarjeta["tipo"], NombreIcono> = { cita: "calendario", programado: "reloj", archivo: "documento" };

/** Una pieza de trabajo terminada: la cita agendada, el mensaje listo para salir, el archivo. */
export function TarjetaTrabajo({ tarjeta }: { tarjeta: Tarjeta }) {
  const lista = tarjeta.tipo !== "programado";
  return (
    <div className="chat__tarjeta">
      <div className="chat__tarjeta-cabeza">
        <Icono nombre={ICONO_TARJETA[tarjeta.tipo]} tam={16} tono="cielo" />
        <span className="chat__tarjeta-sello">{tarjeta.sello}</span>
        <span className={`chat__estado${lista ? " chat__estado--listo" : ""}`}>
          {lista ? <Icono nombre="check" tam={16} trazo={2} /> : null}
          {tarjeta.estado}
        </span>
      </div>
      <div className="chat__tarjeta-cuerpo">
        {tarjeta.titulo ? <p className="chat__tarjeta-titulo">{tarjeta.titulo}</p> : null}
        {tarjeta.datos?.length ? (
          <dl className="chat__datos">
            {tarjeta.datos.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {tarjeta.cita ? <blockquote className="chat__cita">{tarjeta.cita}</blockquote> : null}
      </div>
    </div>
  );
}

/* ---------- Atajos ---------- */

/** Atajos de teclado debajo de la barra (solo con teclado y mouse). */
export function Atajos({ extra }: { extra?: ReactNode }) {
  return (
    <p className="chat__atajos">
      <span>
        <kbd>Enter</kbd> envía
      </span>
      <span>
        <kbd>Shift</kbd> <kbd>Enter</kbd> otra línea
      </span>
      <span>
        <kbd>@</kbd> menciona
      </span>
      <span>
        <kbd>/</kbd> acciones
      </span>
      {extra}
    </p>
  );
}

/* ---------- Íconos que se exportaban antes (los usa el panel) ---------- */

export function IconoCerrar() {
  return <Icono nombre="cerrar" tam={16} />;
}
export function IconoMas() {
  return <Icono nombre="mas" tam={16} />;
}
export function IconoLista() {
  return <Icono nombre="mensaje" tam={20} />;
}

/* ---------- Nuevo grupo ---------- */

/** Ventana para armar un grupo: se eligen agentes de una lista y se le pone nombre. */
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
  const faltaNombre = nombreObligatorio && nombre.trim().length === 0;
  const listo = elegidos.length >= 2 && !faltaNombre;
  const ayuda =
    elegidos.length < 2
      ? `Elige ${elegidos.length ? "uno más" : "al menos dos"}`
      : faltaNombre
        ? "Falta el nombre del grupo"
        : `Con ${nombres(elegidos)}`;

  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLInputElement>("input[type=checkbox]:not(:disabled)")?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarRef.current();
      // El foco no se sale de la ventana
      if (e.key === "Tab" && panelRef.current) {
        const f = [...panelRef.current.querySelectorAll<HTMLElement>("input:not(:disabled), button:not(:disabled)")];
        if (!f.length) return;
        const [a, z] = [f[0], f[f.length - 1]];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      previo?.focus?.({ preventScroll: true });
    };
  }, []);

  const alternar = (id: IdAgente) =>
    setElegidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : IDS_AGENTES.filter((x) => x === id || e.includes(x))));
  const crear = () => listo && onCrear(nombre.trim(), elegidos);

  return (
    <div className="chat__capa" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={panelRef} className="chat__dialogo" role="dialog" aria-modal="true" aria-labelledby="nuevo-grupo-titulo">
        <div className="chat__dialogo-cabeza">
          <p id="nuevo-grupo-titulo" className="chat__dialogo-titulo">
            Nuevo grupo
          </p>
          <button type="button" className="chat__icono" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" tam={16} />
          </button>
        </div>

        <fieldset className="chat__dialogo-cuerpo">
          <legend className="chat__dialogo-texto">Elige quién entra (mínimo dos). Contesta quien sepa del tema y se pasan el trabajo entre ellos.</legend>
          <ul className="chat__elegir-lista">
            {AGENTES_INFO.map((a) => {
              const puede = disponibles.includes(a.id);
              const marcado = elegidos.includes(a.id);
              return (
                <li key={a.id}>
                  <label className="chat__elegir" data-apagado={puede ? undefined : ""}>
                    <input type="checkbox" className="chat__casilla" checked={marcado} disabled={!puede} onChange={() => alternar(a.id)} />
                    <Avatar agente={a.id} tam={32} />
                    <span className="chat__elegir-texto">
                      <span className="chat__elegir-nombre">{a.nombre}</span>
                      <span className="chat__elegir-area">{puede ? `${a.area} · ${a.abarca}` : "No está en tu equipo"}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <label className="chat__dialogo-campo">
          <span className="chat__dialogo-etiqueta">{nombreObligatorio ? "Nombre del grupo" : "Nombre o tema (opcional)"}</span>
          <input
            className="chat__campo"
            value={nombre}
            maxLength={maxNombre}
            placeholder={nombreObligatorio ? "Ej. Promociones de diciembre" : "Ej. Recepción, campaña de noviembre"}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crear()}
            enterKeyHint="done"
          />
        </label>

        <div className="chat__dialogo-pie">
          <p className="chat__dialogo-ayuda" aria-live="polite">
            {ayuda}
          </p>
          <div className="chat__dialogo-botones">
            <button type="button" className={claseBotonBase("fantasma", "chico")} onClick={onCerrar}>
              Cancelar
            </button>
            <button type="button" className={claseBotonBase("principal", "chico")} disabled={!listo} onClick={crear}>
              Crear grupo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
