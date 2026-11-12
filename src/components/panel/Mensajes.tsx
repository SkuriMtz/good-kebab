"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Texto } from "@/components/Texto";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import type { Tarjeta } from "@/components/chat/Piezas";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/*
 * Las piezas de la conversación del panel nuevo, como un chat de IA de hoy:
 * lo tuyo en una burbuja a la derecha; lo del agente como texto, con su
 * personaje chico y su nombre arriba de cada bloque. Lo que llega entra
 * subiendo 6px en 180ms (ANIMACIONES.md, "del chat"). Estilo en panel.css.
 */

/** "Lola", "Lola y Víctor", "Lola, Clara e Iris". */
export function nombresDe(ids: readonly IdAgente[]) {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  return `${n.slice(0, -1).join(", ")} ${/^[iIíÍ]/.test(ultimo) ? "e" : "y"} ${ultimo}`;
}

/** El personaje en un círculo. */
export function AvatarAgente({ agente, tam = 24, className = "" }: { agente: IdAgente; tam?: number; className?: string }) {
  return (
    <span className={`pc-avatar ${className}`} style={{ "--tam": `${tam}px` } as CSSProperties} aria-hidden="true">
      <Personaje agente={agente} avatar />
    </span>
  );
}

/** Varios personajes encimados (un grupo). */
export function PilaAgentes({ agentes, tam = 20 }: { agentes: readonly IdAgente[]; tam?: number }) {
  return (
    <span className="pc-pila" aria-hidden="true">
      {agentes.slice(0, 4).map((id) => (
        <AvatarAgente key={id} agente={id} tam={tam} />
      ))}
    </span>
  );
}

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
            {token.startsWith("/") ? <code className="pc-comando">{token}</code> : <strong className="pc-mencion">{token}</strong>}
          </Fragment>
        );
      })}
    </>
  );
}

export function MensajeTuyo({ texto, nuevo, hora }: { texto: string; nuevo?: boolean; hora?: string }) {
  return (
    <div className={`pc-msj pc-msj--tu${nuevo ? " pc-msj--nuevo" : ""}`}>
      <p className="pc-burbuja">
        <TextoTuyo texto={texto} />
      </p>
      {hora ? <span className="pc-msj__hora">{hora}</span> : null}
    </div>
  );
}

/**
 * Lo que dice un agente. `cabeza`: el primero de su bloque (personaje y
 * nombre). `enCurso`: llegando en streaming (el texto crece conforme llega).
 */
export function MensajeAgente({
  agente,
  texto,
  cabeza = true,
  enCurso = false,
  nuevo,
  hora,
  tarjeta,
  pie,
}: {
  agente: IdAgente;
  texto: string;
  cabeza?: boolean;
  enCurso?: boolean;
  nuevo?: boolean;
  hora?: string;
  tarjeta?: ReactNode;
  pie?: ReactNode;
}) {
  const info = AGENTE_POR_ID[agente];
  // Si llegó en vivo, se va escribiendo con calma (no de golpe)
  const [enVivo] = useState(enCurso);
  const visible = useRevelar(texto, enVivo);
  return (
    <div className={`pc-msj pc-msj--agente${nuevo ? " pc-msj--nuevo" : ""}${cabeza ? "" : " pc-msj--sigue"}`} aria-busy={enCurso || visible.length < texto.length || undefined}>
      {cabeza ? (
        <p className="pc-msj__quien">
          <AvatarAgente agente={agente} tam={24} />
          <span className="pc-msj__nombre">{info.nombre}</span>
          <span className="pc-msj__area">{info.area}</span>
          {hora ? <span className="pc-msj__hora">{hora}</span> : null}
        </p>
      ) : null}
      {visible ? (
        <div className="pc-msj__texto">
          <Texto texto={visible} />
        </div>
      ) : null}
      {visible.length >= texto.length ? (
        <>
          {tarjeta}
          {pie}
        </>
      ) : null}
    </div>
  );
}

/** Corta el texto en palabras sin dejar unas **negritas** abiertas. */
export function cortarTexto(texto: string, n: number) {
  let parte = texto.slice(0, n);
  const espacio = parte.lastIndexOf(" ");
  if (n < texto.length && espacio > 0) parte = parte.slice(0, espacio);
  if ((parte.match(/\*\*/g)?.length ?? 0) % 2 === 1) parte += "**";
  return parte;
}

/** Letras por segundo al escribir una respuesta: tranquilo y parejo (si se queda muy atrás, apura un poco). */
export const RITMO_LETRAS = 60;

/**
 * Muestra `texto` poco a poco a un ritmo tranquilo mientras `activo`; si el
 * texto crece (llega en vivo), lo va alcanzando sin saltos. Con "reducir
 * movimiento", todo de una vez.
 */
export function useRevelar(texto: string, activo: boolean) {
  const [n, setN] = useState(activo ? 0 : texto.length);
  const actual = useRef(n);
  const largo = texto.length;
  const alcanzado = n >= largo;
  useEffect(() => {
    if (!activo || alcanzado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      actual.current = largo;
      setN(largo);
      return;
    }
    let cuadro = 0;
    let antes = performance.now();
    let resto = 0;
    const paso = (t: number) => {
      const dt = Math.min(64, t - antes);
      antes = t;
      const falta = largo - actual.current;
      resto += ((RITMO_LETRAS + Math.max(0, falta - 160) * 0.6) * dt) / 1000;
      const mas = Math.floor(resto);
      if (mas > 0) {
        resto -= mas;
        actual.current = Math.min(largo, actual.current + mas);
        setN(actual.current);
      }
      if (actual.current < largo) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [activo, alcanzado, largo]);
  return activo && n < largo ? cortarTexto(texto, n) : texto;
}

/**
 * "Escribiendo…": tres triangulitos de contorno que laten, con el personaje
 * de quien escribe. Mientras tanto, los cuatro círculos del logo del menú
 * "respiran" (html[data-pc-escribe], en CSS; quietos con reducir movimiento).
 */
export function Escribiendo({ agente, cabeza = true, texto }: { agente: IdAgente; cabeza?: boolean; /** Lo que está haciendo ("Clara está revisando tu correo…"); sin esto, "está escribiendo…". */ texto?: string }) {
  const info = AGENTE_POR_ID[agente];
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.pcEscribe = "";
    return () => {
      delete html.dataset.pcEscribe;
    };
  }, []);
  return (
    <div className="pc-msj pc-msj--agente pc-msj--nuevo">
      {cabeza ? (
        <p className="pc-msj__quien">
          <AvatarAgente agente={agente} tam={24} />
          <span className="pc-msj__nombre">{info.nombre}</span>
          <span className="pc-msj__area">{info.area}</span>
        </p>
      ) : null}
      <LineaEscribe texto={texto ?? `${info.nombre} está escribiendo…`} />
    </div>
  );
}

/**
 * La línea tenue con los tres triangulitos que laten: "está escribiendo…"
 * o lo que hace un agente con una app ("Clara está revisando tu correo…").
 */
export function LineaEscribe({ texto }: { texto: string }) {
  return (
    <p className="pc-escribe" role="status">
      <span className="pc-escribe__tris" aria-hidden="true">
        {["#8052ff", "#3d7bff", "#23d9b5"].map((c) => (
          <svg key={c} viewBox="0 0 12 12" width="11" height="11" focusable="false">
            <path d="M6 1.6 10.6 10 1.4 10Z" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ))}
      </span>
      <span className="pc-escribe__texto">{texto}</span>
    </p>
  );
}

/** Un aviso en medio del hilo ("Creaste el grupo…", "Lola le pasa el seguimiento a Víctor", un error). */
export function AvisoHilo({ children, icono = "usuarios", error = false, nuevo }: { children: ReactNode; icono?: NombreIcono; error?: boolean; nuevo?: boolean }) {
  return (
    <p className={`pc-aviso-hilo${error ? " pc-aviso-hilo--error" : ""}${nuevo ? " pc-msj--nuevo" : ""}`} role={error ? "alert" : undefined}>
      <Icono nombre={error ? "alerta" : icono} tam={16} />
      <span>{children}</span>
    </p>
  );
}

/** Separador del día ("Hoy", "Ayer"). */
export function DiaHilo({ children }: { children: ReactNode }) {
  return (
    <p className="pc-dia">
      <span>{children}</span>
    </p>
  );
}

const ICONO_TARJETA: Record<Tarjeta["tipo"], NombreIcono> = { cita: "calendario", programado: "reloj", archivo: "documento" };

/** Lo que produce un agente en el guion de ejemplo: una cita, un mensaje listo para salir, un archivo. */
export function TarjetaTrabajo({ tarjeta, aprobable = false }: { tarjeta: Tarjeta; aprobable?: boolean }) {
  const [aprobado, setAprobado] = useState(false);
  const lista = tarjeta.tipo !== "programado" || aprobado;
  return (
    <div className="pc-trabajo">
      <div className="pc-trabajo__cabeza">
        <Icono nombre={ICONO_TARJETA[tarjeta.tipo]} tam={16} />
        <span className="pc-trabajo__sello">{tarjeta.sello}</span>
        <span className={`pc-estado${lista ? " pc-estado--exito" : " pc-estado--atencion"}`} aria-live="polite">
          {aprobado ? "Aprobado" : tarjeta.estado}
        </span>
      </div>
      {tarjeta.titulo ? <p className="pc-trabajo__titulo">{tarjeta.titulo}</p> : null}
      {tarjeta.datos?.length ? (
        <dl className="pc-trabajo__datos">
          {tarjeta.datos.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {tarjeta.cita ? <blockquote className="pc-trabajo__cita">{tarjeta.cita}</blockquote> : null}
      {aprobable && tarjeta.tipo === "programado" && !aprobado ? (
        <div className="pc-trabajo__acciones">
          <button type="button" className="pc-boton pc-boton--principal pc-boton--chico" onClick={() => setAprobado(true)}>
            Aprobar
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** "Copiar" debajo de una respuesta. */
export function Copiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="pc-msj__acciones">
      <button
        type="button"
        className="pc-icono pc-icono--chico"
        aria-label={copiado ? "Copiado" : "Copiar la respuesta"}
        title={copiado ? "Copiado" : "Copiar"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 1600);
          } catch {
            /* sin permiso para copiar */
          }
        }}
      >
        <Icono nombre={copiado ? "check" : "copiar"} tam={16} />
      </button>
    </div>
  );
}
