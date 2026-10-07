"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import PromptBar, { type PromptBarSource } from "./PromptBar";
import { Personaje } from "./agentes/Personaje";
import { Icono } from "./base/Iconos";
import { Caras, Dia, Escribiendo, MensajeAgente, MensajeTuyo, NuevoGrupo, Sistema, nombres } from "./chat/Piezas";
import { Resultado } from "./chat/Resultado";
import {
  ACCIONES,
  APROBAR,
  INICIO,
  RESULTADOS,
  SALUDO,
  ahora,
  esperaDe,
  responder,
  type Conversacion,
  type Mensaje,
  type Turno,
} from "./chat/guion";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/** Los IDs nuevos empiezan aquí: solo esos mensajes entran con animación. */
const PRIMER_NUEVO = 1000;

/** Texto plano del último mensaje, para la vista previa de la lista. */
function vistaPrevia(c: Conversacion) {
  const u = c.mensajes[c.mensajes.length - 1];
  if (!u) return "";
  const plano = u.texto
    .replace(/\*\*/g, "")
    .replace(/^\s*([-*]|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (u.de === "sistema") return plano;
  if (u.de === "tu") return `Tú: ${plano}`;
  return c.agentes.length > 1 ? `${AGENTE_POR_ID[u.de].nombre}: ${plano}` : plano;
}

/**
 * El chat de demostración de /pruebalo, como el panel de verdad: a la
 * izquierda chats y grupos, al centro la conversación con la PromptBar, y a
 * la derecha el panel "Resultado" con lo que el agente dejó hecho (en
 * pantallas angostas se abre con el botón de la cabecera). Las respuestas
 * son de un guion local: nada de esto llama a la IA.
 */
export function ChatDemo() {
  const [convs, setConvs] = useState<Conversacion[]>(INICIO);
  const [activa, setActiva] = useState("recepcion");
  const [pendiente, setPendiente] = useState<{ conv: string; agente: IdAgente; conResultado?: boolean } | null>(null);
  const [creando, setCreando] = useState(false);
  const [barra, setBarra] = useState(false);
  const [panel, setPanel] = useState(false);
  const [nuevoResultado, setNuevoResultado] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const activaRef = useRef(activa);
  const siguienteId = useRef(PRIMER_NUEVO);
  const orden = useRef(10);
  const timers = useRef<number[]>([]);

  activaRef.current = activa;
  const conv = convs.find((c) => c.id === activa) ?? convs[0];
  const esGrupo = conv.agentes.length > 1;
  const ocupado = pendiente !== null;
  const escribiendoAqui = pendiente?.conv === conv.id ? pendiente.agente : null;
  const resultado = conv.resultado ? RESULTADOS[conv.resultado] : null;

  const limpiar = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => limpiar, []);

  // Al cambiar de chat, directo al final; con cada mensaje nuevo, un desliz suave
  const vista = useRef(activa);
  useLayoutEffect(() => {
    const el = listaRef.current;
    if (!el) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (vista.current !== activa || quieto) {
      vista.current = activa;
      el.scrollTop = el.scrollHeight;
    } else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [activa, conv.mensajes.length, escribiendoAqui]);

  // "?con=lola" abre directo el chat con ese agente (desde "Háblale a Lola")
  useEffect(() => {
    const con = new URLSearchParams(window.location.search).get("con");
    if (!con || !INICIO.some((c) => c.id === con)) return;
    setActiva(con);
    setConvs((cs) => cs.map((c) => (c.id === con ? { ...c, sinLeer: 0 } : c)));
  }, []);

  const agregar = (id: string, mensaje: Omit<Mensaje, "id">, resultadoNuevo?: string) =>
    setConvs((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              orden: ++orden.current,
              sinLeer: id === activaRef.current || mensaje.de === "tu" ? c.sinLeer : c.sinLeer + 1,
              resultado: resultadoNuevo ?? c.resultado,
              mensajes: [...c.mensajes, { ...mensaje, id: siguienteId.current++ }].slice(-40),
            }
          : c,
      ),
    );

  /** Cada agente "escribe" un momento (los tres puntos) y luego aparece su mensaje. */
  const correr = (id: string, turnos: Turno[]) => {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paso = (i: number) => {
      if (i >= turnos.length) {
        setPendiente(null);
        return;
      }
      const t = turnos[i];
      setPendiente({ conv: id, agente: t.agente, conResultado: Boolean(t.resultado) });
      timers.current.push(
        window.setTimeout(() => {
          agregar(id, { de: t.agente, texto: t.texto, hora: ahora() }, t.resultado);
          if (t.resultado && id === activaRef.current) setNuevoResultado(true);
          if (i + 1 < turnos.length) setPendiente(null);
          timers.current.push(window.setTimeout(() => paso(i + 1), i + 1 < turnos.length ? 450 : 0));
        }, quieto ? 500 : esperaDe(t.texto)),
      );
    };
    timers.current.push(window.setTimeout(() => paso(0), 350));
  };

  const anteriorDe = (c: Conversacion) =>
    [...c.mensajes].reverse().find((x) => x.de !== "tu" && x.de !== "sistema")?.de as IdAgente | undefined;

  const enviar = (texto: string) => {
    if (!texto.trim() || ocupado) return;
    limpiar();
    agregar(conv.id, { de: "tu", texto: texto.trim(), hora: ahora() });
    correr(conv.id, responder(texto, conv.agentes, anteriorDe(conv)));
  };

  const aprobar = () => {
    const a = conv.resultado ? APROBAR[conv.resultado] : undefined;
    if (!a || ocupado) return;
    limpiar();
    setPanel(false);
    agregar(conv.id, { de: "tu", texto: a.pides, hora: ahora() });
    correr(conv.id, [a.turno]);
  };

  const detener = () => {
    limpiar();
    setPendiente(null);
  };

  const abrir = (id: string) => {
    setActiva(id);
    setBarra(false);
    setNuevoResultado(false);
    setConvs((cs) => cs.map((c) => (c.id === id && c.sinLeer ? { ...c, sinLeer: 0 } : c)));
  };

  const crearGrupo = (nombre: string, agentes: IdAgente[]) => {
    limpiar();
    setPendiente(null);
    const id = `g${Date.now()}`;
    setConvs((cs) => [
      {
        id,
        nombre,
        agentes,
        sinLeer: 0,
        orden: ++orden.current,
        mensajes: [{ id: siguienteId.current++, de: "sistema", hora: ahora(), texto: `Creaste el grupo «${nombre}» con ${nombres(agentes)}.` }],
      },
      ...cs,
    ]);
    setCreando(false);
    abrir(id);
    correr(
      id,
      agentes.map((a, i) => ({
        agente: a,
        texto: i === agentes.length - 1 ? `${SALUDO[a]} Menciónanos con @ para pedirle algo a alguien en especial.` : SALUDO[a],
      })),
    );
  };

  // Escape cierra la lista de chats o el resultado en pantallas angostas
  useEffect(() => {
    if (!barra && !panel) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setBarra(false);
      setPanel(false);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [barra, panel]);

  const porOrden = (a: Conversacion, b: Conversacion) => b.orden - a.orden;
  const grupos = convs.filter((c) => c.agentes.length > 1).sort(porOrden);
  const chats = convs.filter((c) => c.agentes.length === 1).sort(porOrden);
  const comandos = ACCIONES.filter((a) => conv.agentes.includes(a.agente));
  const sugerencias = esGrupo ? conv.agentes.map((id) => comandos.find((c) => c.agente === id)!).filter(Boolean) : comandos;
  const fuentes: PromptBarSource[] = conv.agentes.map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="h-5 w-5" />,
  }));
  const sinLeerTotal = convs.reduce((s, c) => s + (c.id === activa ? 0 : c.sinLeer), 0);

  const fila = (c: Conversacion) => {
    const escribe = pendiente?.conv === c.id ? pendiente.agente : null;
    const ultimo = c.mensajes[c.mensajes.length - 1];
    return (
      <li key={c.id}>
        <button type="button" className="chat__conv" aria-current={c.id === activa ? "true" : undefined} onClick={() => abrir(c.id)}>
          <Caras agentes={c.agentes} />
          <span className="chat__conv-texto">
            <span className="chat__conv-linea">
              <span className="chat__conv-nombre">{c.nombre}</span>
              <time className="chat__conv-hora">{ultimo?.dia ?? ultimo?.hora}</time>
            </span>
            <span className="chat__conv-linea">
              {escribe ? (
                <span className="chat__conv-vista chat__escribe">
                  {c.agentes.length > 1 ? `${AGENTE_POR_ID[escribe].nombre} está escribiendo…` : "Escribiendo…"}
                </span>
              ) : (
                <span className="chat__conv-vista">{vistaPrevia(c)}</span>
              )}
              {c.sinLeer && c.id !== activa ? (
                <span className="chat__contador" aria-label={`${c.sinLeer} sin leer`}>
                  {c.sinLeer}
                </span>
              ) : null}
            </span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="chat chat--demo">
      {/* ---------- Lista de chats y grupos ---------- */}
      <aside className="chat__barra" data-abierta={barra ? "" : undefined} aria-label="Tus chats">
        <div className="chat__barra-cabeza">
          <p className="chat__barra-titulo">Chats</p>
          <button type="button" className="chat__icono chat__solo-angosto" onClick={() => setBarra(false)} aria-label="Cerrar la lista">
            <Icono nombre="cerrar" tam={20} />
          </button>
        </div>
        <div className="chat__barra-accion">
          <button type="button" className="chat__nuevo" onClick={() => setCreando(true)}>
            <Icono nombre="mas" tam={16} />
            Nuevo grupo
          </button>
        </div>
        <div className="chat__listas" data-lenis-prevent>
          <p className="chat__seccion">
            Grupos <span className="chat__seccion-n">{grupos.length}</span>
          </p>
          <ul>{grupos.map(fila)}</ul>
          <p className="chat__seccion">
            Agentes <span className="chat__seccion-n">{chats.length}</span>
          </p>
          <ul>{chats.map(fila)}</ul>
        </div>
      </aside>
      <button
        type="button"
        className="chat__velo"
        data-abierta={barra || panel ? "" : undefined}
        onClick={() => {
          setBarra(false);
          setPanel(false);
        }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ---------- Conversación abierta ---------- */}
      <section className="chat__principal" aria-label={`Chat: ${conv.nombre}`}>
        <header className="chat__cabeza">
          <button type="button" className="chat__icono chat__solo-angosto" onClick={() => setBarra(true)} aria-label="Ver chats">
            <Icono nombre="mensaje" tam={20} />
            {sinLeerTotal ? <span className="chat__punto" aria-label={`${sinLeerTotal} sin leer`} /> : null}
          </button>
          <Caras agentes={conv.agentes} />
          <div className="min-w-0 flex-1">
            <p className="chat__titulo">{conv.nombre}</p>
            <p className="chat__estado" aria-live="polite">
              {escribiendoAqui ? (
                <span className="chat__escribe">
                  {esGrupo ? `${AGENTE_POR_ID[escribiendoAqui].nombre} está escribiendo…` : "escribiendo…"}
                </span>
              ) : esGrupo ? (
                `Grupo · ${nombres(conv.agentes)}`
              ) : (
                `${AGENTE_POR_ID[conv.agentes[0]].area} · ${AGENTE_POR_ID[conv.agentes[0]].abarca}`
              )}
            </p>
          </div>
          <button
            type="button"
            className="chat__icono chat__solo-medio"
            onClick={() => {
              setPanel(true);
              setNuevoResultado(false);
            }}
            aria-label="Ver el resultado"
            aria-expanded={panel}
          >
            <Icono nombre="documento" tam={20} />
            {nuevoResultado ? <span className="chat__punto" aria-label="Resultado nuevo" /> : null}
          </button>
        </header>

        <div ref={listaRef} className="chat__mensajes" data-lenis-prevent role="log" aria-live="polite" aria-label={`Mensajes de ${conv.nombre}`}>
          <div key={conv.id} className="chat__hilo">
            {conv.mensajes.map((msg, i) => {
              const antes = conv.mensajes[i - 1];
              const dia = msg.dia ?? "Hoy";
              const nuevoDia = !antes || (antes.dia ?? "Hoy") !== dia;
              const despues = conv.mensajes[i + 1];
              const primero = nuevoDia || antes.de !== msg.de;
              const ultimo = !despues || despues.de !== msg.de || (despues.dia ?? "Hoy") !== dia;
              const f = { primero, ultimo, nueva: msg.id >= PRIMER_NUEVO, bloque: primero && !nuevoDia, hora: msg.hora };
              return (
                <Fragment key={msg.id}>
                  {nuevoDia ? <Dia>{dia}</Dia> : null}
                  {msg.de === "sistema" ? (
                    <Sistema texto={msg.texto} {...f} />
                  ) : msg.de === "tu" ? (
                    <MensajeTuyo texto={msg.texto} {...f} />
                  ) : (
                    <MensajeAgente agente={msg.de} texto={msg.texto} enGrupo={esGrupo} {...f} />
                  )}
                </Fragment>
              );
            })}
            {escribiendoAqui ? (
              <Escribiendo agente={escribiendoAqui} enGrupo={esGrupo} sigue={conv.mensajes[conv.mensajes.length - 1]?.de === escribiendoAqui} />
            ) : null}
          </div>
        </div>

        <div className="chat__pie">
          <div className="chat__sugerencias" aria-label="Prueba una acción">
            {sugerencias.map((a) => (
              <button key={a.key} type="button" className="chat__sugerencia" disabled={ocupado} onClick={() => enviar(a.name)}>
                <span className="chat__sugerencia-nombre">{a.name}</span>
                <span className="chat__sugerencia-desc">{a.description}</span>
              </button>
            ))}
          </div>
          <PromptBar
            key={conv.id}
            placeholder={esGrupo ? "Escribe al grupo · @ para mencionar, / para acciones" : `Escríbele a ${conv.nombre} · / para acciones`}
            sources={fuentes}
            commands={comandos}
            models={[]}
            efforts={[]}
            busy={ocupado}
            onSend={(texto) => enviar(texto)}
            onStop={detener}
            width={4000}
            maxRows={5}
          />
          <p className="chat__aviso">Demostración: respuestas de ejemplo, sin IA. En tu panel trabajan con tus datos.</p>
        </div>
      </section>

      {/* ---------- Lo que dejaron hecho ---------- */}
      <div className="chat__lateral" data-abierta={panel ? "" : undefined}>
        <button type="button" className="chat__icono chat__lateral-cerrar chat__solo-medio" onClick={() => setPanel(false)} aria-label="Cerrar el resultado">
          <Icono nombre="cerrar" tam={20} />
        </button>
        <Resultado
          id={`resultado-${conv.id}`}
          agente={pendiente?.conv === conv.id && pendiente.conResultado ? pendiente.agente : conv.agentes[0]}
          resultado={resultado}
          trabajando={pendiente?.conv === conv.id && Boolean(pendiente.conResultado)}
          onAprobar={conv.resultado && APROBAR[conv.resultado] ? aprobar : undefined}
        />
      </div>

      {creando ? <NuevoGrupo onCrear={crearGrupo} onCerrar={() => setCreando(false)} /> : null}
    </div>
  );
}
