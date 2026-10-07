"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import PromptBar, { type PromptBarSource } from "@/components/PromptBar";
import { Personaje } from "@/components/agentes/Personaje";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { Caras, Escribiendo, MensajeAgente, MensajeTuyo } from "./Piezas";
import { Resultado } from "./Resultado";
import {
  ACCIONES,
  APROBAR,
  ESCENAS,
  RESULTADOS,
  ahora,
  esperaDe,
  lolaPaciente,
  responder,
  type Resultado as TipoResultado,
  type Turno,
} from "./guion";

type Linea = { id: number; de: "tu" | IdAgente; texto: string; hora: string; nueva: boolean; visitante?: boolean };
type Estado = {
  lineas: Linea[];
  escribe: IdAgente | null;
  resultado: { clave?: string; r: TipoResultado } | null;
  jugada: boolean;
};

const VACIO: Estado = { lineas: [], escribe: null, resultado: null, jugada: false };

/** El estado final de una escena, sin animación (movimiento reducido, o al cambiar de pestaña a medias). */
function completa(i: number): Estado {
  const e = ESCENAS[i];
  let resultado: Estado["resultado"] = null;
  const lineas = e.pasos.map((p, k) => {
    if (p.resultado) resultado = { clave: p.resultado, r: RESULTADOS[p.resultado] };
    return { id: k + 1, de: p.de, texto: p.texto, hora: p.hora, nueva: false };
  });
  return { lineas, escribe: null, resultado, jugada: true };
}

let siguiente = 100;

/**
 * El producto en vivo (inicio): un marco de navegador con una pestaña por
 * canal. Cada pestaña es una conversación de verdad de una clínica que se
 * reproduce sola cuando la ves (guion local, sin IA) y, a la derecha, el
 * panel "Resultado" se llena cuando el agente termina: la cita en tu agenda,
 * la bandeja resumida, el seguimiento que espera tu visto bueno, el reporte.
 * Al terminar, puedes escribir tú (con Lola, como si fueras paciente).
 */
export function EnVivo() {
  const [activa, setActiva] = useState(0);
  const [estados, setEstados] = useState<Estado[]>(() => ESCENAS.map(() => VACIO));
  const [visto, setVisto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const hiloRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const activaRef = useRef(0);
  activaRef.current = activa;

  const escena = ESCENAS[activa];
  const est = estados[activa];
  const info = AGENTE_POR_ID[escena.agente];
  const ocupado = est.escribe !== null || (visto && !est.jugada);

  const cambiar = (i: number, f: (e: Estado) => Estado) => setEstados((todos) => todos.map((e, k) => (k === i ? f(e) : e)));
  const limpiar = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const tras = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  const quieto = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Los turnos de un agente: escribe un momento y aparece su mensaje; el resultado se actualiza al terminar. */
  const correr = useCallback((i: number, turnos: (Turno & { cita?: TipoResultado })[], alFinal?: () => void) => {
    const paso = (k: number) => {
      if (k >= turnos.length) {
        alFinal?.();
        return;
      }
      const t = turnos[k];
      cambiar(i, (e) => ({ ...e, escribe: t.agente }));
      tras(quieto() ? 300 : esperaDe(t.texto), () => {
        cambiar(i, (e) => ({
          ...e,
          escribe: null,
          lineas: [...e.lineas, { id: ++siguiente, de: t.agente, texto: t.texto, hora: ahora(), nueva: true }],
          resultado: t.cita ? { r: t.cita } : t.resultado ? { clave: t.resultado, r: RESULTADOS[t.resultado] } : e.resultado,
        }));
        tras(450, () => paso(k + 1));
      });
    };
    paso(0);
  }, []);

  /** Reproduce la escena i desde cero: lo tuyo aparece solo; el agente escribe antes de contestar. */
  const jugar = useCallback((i: number) => {
    limpiar();
    if (quieto()) {
      cambiar(i, () => completa(i));
      return;
    }
    cambiar(i, () => ({ ...VACIO }));
    const pasos = ESCENAS[i].pasos;
    const paso = (k: number) => {
      if (k >= pasos.length) {
        cambiar(i, (e) => ({ ...e, jugada: true }));
        return;
      }
      const p = pasos[k];
      const agregar = () =>
        cambiar(i, (e) => ({
          ...e,
          escribe: null,
          lineas: [...e.lineas, { id: ++siguiente, de: p.de, texto: p.texto, hora: p.hora, nueva: true }],
          resultado: p.resultado ? { clave: p.resultado, r: RESULTADOS[p.resultado] } : e.resultado,
        }));
      if (p.de === "tu") {
        tras(k === 0 ? 500 : 900, () => {
          agregar();
          paso(k + 1);
        });
      } else {
        const agente = p.de;
        tras(500, () => {
          cambiar(i, (e) => ({ ...e, escribe: agente }));
          tras(esperaDe(p.texto), () => {
            agregar();
            paso(k + 1);
          });
        });
      }
    };
    paso(0);
  }, []);

  // Empieza cuando el marco se ve (y no antes: así nadie se pierde la escena)
  useEffect(() => {
    const el = raizRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        setVisto(true);
        jugar(activaRef.current);
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      limpiar();
    };
  }, [jugar]);

  const elegir = (id: string) => {
    const i = ESCENAS.findIndex((e) => e.agente === id);
    if (i < 0 || i === activa) return;
    limpiar();
    // La que dejas queda completa; la nueva se reproduce si nunca se vio
    setEstados((todos) => todos.map((e, k) => (k === activa && !e.jugada && visto ? completa(k) : k === activa ? { ...e, escribe: null } : e)));
    setActiva(i);
    if (visto && !estados[i].jugada) jugar(i);
  };

  const detener = () => {
    limpiar();
    cambiar(activa, (e) => (e.jugada ? { ...e, escribe: null } : completa(activa)));
  };

  const enviar = (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || ocupado) return;
    limpiar();
    const i = activa;
    cambiar(i, (e) => ({ ...e, lineas: [...e.lineas, { id: ++siguiente, de: "tu", texto: limpio, hora: ahora(), nueva: true, visitante: true }] }));
    const turnos = escena.comoPaciente ? [lolaPaciente(limpio)] : responder(limpio, [escena.agente], escena.agente);
    tras(350, () => correr(i, turnos));
  };

  const aprobar = () => {
    const clave = est.resultado?.clave;
    const a = clave ? APROBAR[clave] : undefined;
    if (!a || ocupado) return;
    limpiar();
    cambiar(activa, (e) => ({ ...e, lineas: [...e.lineas, { id: ++siguiente, de: "tu", texto: a.pides, hora: ahora(), nueva: true, visitante: true }] }));
    const i = activa;
    tras(350, () => correr(i, [a.turno]));
  };

  // La conversación baja sola (solo su propio scroll; la página no se mueve)
  useLayoutEffect(() => {
    const el = hiloRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: quieto() ? "auto" : "smooth" });
  }, [est.lineas.length, est.escribe, activa]);

  const fuentes: PromptBarSource[] = [
    {
      key: info.id,
      name: info.nombre,
      description: `${info.area} · ${info.abarca}`,
      icon: <Personaje agente={info.id} avatar className="h-5 w-5" />,
    },
  ];
  const comandos = escena.comoPaciente ? [] : ACCIONES.filter((a) => a.agente === escena.agente);

  return (
    <div ref={raizRef}>
      <MarcoNavegador
        titulo="Los agentes de Atendel trabajando, por canal"
        className="envivo-marco"
        alElegir={elegir}
        pestanas={ESCENAS.map((e, i) => ({
          id: e.agente,
          etiqueta: `${AGENTE_POR_ID[e.agente].nombre} · ${e.canal}`,
          adorno: <Personaje agente={e.agente} avatar />,
          activa: i === activa,
        }))}
      >
        <div className="envivo chat" role="tabpanel" aria-label={`${info.nombre} · ${escena.canal}`}>
          <section className="envivo__conv" aria-label={`Conversación: ${escena.sello}`}>
            <header className="chat__cabeza">
              <Caras agentes={[escena.agente]} />
              <div className="min-w-0 flex-1">
                <p className="chat__titulo">{escena.comoPaciente ? `${info.nombre} · tu clínica` : info.nombre}</p>
                <p className="chat__estado" aria-live="polite">
                  {est.escribe ? (
                    <span className="chat__escribe">escribiendo…</span>
                  ) : escena.comoPaciente ? (
                    "Así lo ve tu paciente en WhatsApp"
                  ) : (
                    `${info.area} · ${info.abarca}`
                  )}
                </p>
              </div>
              <p className="etiqueta etiqueta--tenue chat__sello">{escena.sello}</p>
            </header>

            <div ref={hiloRef} className="chat__mensajes" data-lenis-prevent role="log" aria-label={`Mensajes con ${info.nombre}`}>
              <div className="chat__hilo">
                {est.lineas.length === 0 && !est.escribe ? (
                  <p className="chat__espera">
                    <span className="chat__puntos" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    Abriendo la conversación…
                  </p>
                ) : null}
                {est.lineas.map((l, k) => {
                  const antes = est.lineas[k - 1];
                  const despues = est.lineas[k + 1];
                  const primero = !antes || antes.de !== l.de || antes.visitante !== l.visitante;
                  const ultimo = !despues || despues.de !== l.de;
                  const fila = { primero, ultimo, nueva: l.nueva, bloque: primero && k > 0, hora: l.hora };
                  return (
                    <Fragment key={l.id}>
                      {l.de === "tu" ? (
                        <MensajeTuyo
                          texto={l.texto}
                          quien={
                            escena.comoPaciente && est.lineas.slice(0, k).filter((x) => x.de === "tu").pop()?.visitante !== (l.visitante ?? false) ||
                            (escena.comoPaciente && !est.lineas.slice(0, k).some((x) => x.de === "tu"))
                              ? l.visitante
                                ? "Tú, como paciente"
                                : `${escena.persona.nombre} · ${escena.persona.papel.toLowerCase()}`
                              : undefined
                          }
                          {...fila}
                        />
                      ) : (
                        <MensajeAgente agente={l.de} texto={l.texto} {...fila} />
                      )}
                    </Fragment>
                  );
                })}
                {est.escribe ? <Escribiendo agente={est.escribe} sigue={est.lineas[est.lineas.length - 1]?.de === est.escribe} /> : null}
              </div>
            </div>

            <div className="chat__pie">
              <PromptBar
                key={escena.agente}
                placeholder={est.jugada ? escena.placeholder : `${info.nombre} está atendiendo…`}
                sources={fuentes}
                commands={comandos}
                models={[]}
                efforts={[]}
                busy={ocupado}
                onSend={(t) => enviar(t)}
                onStop={detener}
                width={4000}
                maxRows={4}
              />
              <p className="chat__aviso">Demostración con respuestas de ejemplo. Nada sale de esta página.</p>
            </div>
          </section>

          <Resultado
            className="envivo__resultado"
            id={`resultado-${escena.agente}`}
            agente={escena.agente}
            resultado={est.resultado?.r ?? null}
            trabajando={est.escribe !== null}
            onAprobar={est.resultado?.clave && APROBAR[est.resultado.clave] ? aprobar : undefined}
            onRepetir={est.jugada ? () => jugar(activa) : undefined}
          />
        </div>
      </MarcoNavegador>
    </div>
  );
}
