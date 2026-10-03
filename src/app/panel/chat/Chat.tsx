"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { TriSpinner } from "@/components/Buttons";
import PromptBar, { type PromptBarSource } from "@/components/PromptBar";
import SwipeRow from "@/components/SwipeRow";
import { NavApp } from "@/components/app/NavApp";
import { Uso } from "@/components/app/Uso";
import { Personaje } from "@/components/agentes/Personaje";
import {
  Caras,
  Dia,
  Escribiendo,
  IconoCerrar,
  IconoLista,
  IconoMas,
  MensajeAgente,
  MensajeTuyo,
  NuevoGrupo,
  Sistema,
  nombres,
} from "@/components/chat/Piezas";
import { AGENTE_POR_ID, AGENTES_INFO, esIdAgente, type IdAgente } from "@/lib/agentes";
import { comandosDe } from "@/lib/comandos";
import { partirIntervenciones } from "@/lib/grupo";
import { PLAN_POR_ID, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

export type Conversacion = {
  id: string;
  agente: IdAgente;
  titulo: string;
  actualizado_en: string;
  /** Si es un grupo: los agentes que están (2 a 4). */
  participantes?: string[] | null;
  tema?: string | null;
};
type Mensaje = {
  id: string;
  rol: "user" | "assistant";
  contenido: string;
  agente?: string | null;
  creado_en?: string;
  error?: string;
  enCurso?: boolean;
  /** Escrito en esta visita: entra con animación. */
  nuevo?: boolean;
};
/** Lo que se pinta: cada voz de una respuesta en grupo es su propia burbuja. */
type Pieza = {
  key: string;
  de: "tu" | IdAgente;
  texto: string;
  fecha: Date;
  nuevo?: boolean;
  enCurso?: boolean;
  error?: string;
};

const MARCA_ERROR = "\u0000ERROR:";
const MAX_MENSAJE = 4000;
const MAX_TEMA = 120;

const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function cuando(fecha: string) {
  const d = new Date(fecha);
  if (mismoDia(d, new Date())) return hora(d);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

const hora = (d: Date) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

function dia(d: Date) {
  const hoy = new Date();
  if (mismoDia(d, hoy)) return "Hoy";
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (mismoDia(d, ayer)) return "Ayer";
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });
}

const integrantes = (c: Conversacion): IdAgente[] | null => {
  const p = (c.participantes ?? []).filter(esIdAgente);
  return p.length >= 2 ? p : null;
};

function Candado() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke="currentColor" />
      <path d="M4.5 6V4.2a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" />
    </svg>
  );
}

/**
 * Chat con los agentes, como una app de mensajería: a la izquierda tus
 * agentes, grupos y conversaciones; a la derecha la conversación abierta.
 * Eliges con quién hablar (uno o un grupo), escribes y la respuesta va
 * apareciendo. Se guarda todo.
 */
export function Chat({
  email,
  planId,
  activos,
  usadosIniciales,
  conversacionesIniciales,
  agenteInicial,
  conversacionInicial,
}: {
  email: string;
  planId: IdPlan;
  activos: IdAgente[];
  usadosIniciales: number;
  conversacionesIniciales: Conversacion[];
  agenteInicial: IdAgente;
  conversacionInicial: string | null;
}) {
  const plan = PLAN_POR_ID[planId];
  const [agente, setAgente] = useState<IdAgente>(agenteInicial);
  const [grupo, setGrupo] = useState<IdAgente[] | null>(null);
  const [tema, setTema] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [conversaciones, setConversaciones] = useState(conversacionesIniciales);
  const [actual, setActual] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [usados, setUsados] = useState(usadosIniciales);
  const [lista, setLista] = useState(false); // lista de chats en celular
  const [aviso, setAviso] = useState<string | null>(null);
  const [reintentos, setReintentos] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortar = useRef<AbortController | null>(null);
  const pegado = useRef(true); // ¿la vista está hasta abajo?

  const info = AGENTE_POR_ID[agente];
  const participantes: IdAgente[] = grupo ?? [agente];
  const disponible = participantes.every((id) => activos.includes(id));
  const sinMensajes = usados >= plan.mensajesMes;
  const puedeGrupos = activos.length >= 2;

  const ponerUrl = (params: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    window.history.replaceState(null, "", `/panel/chat${q ? `?${q}` : ""}`);
  };

  const nueva = useCallback((id: IdAgente) => {
    abortar.current?.abort();
    setAgente(id);
    setGrupo(null);
    setTema(null);
    setCreando(false);
    setActual(null);
    setMensajes([]);
    setAviso(null);
    setLista(false);
    ponerUrl({ agente: id });
  }, []);

  const nuevoGrupo = (ids: IdAgente[], temaNuevo: string | null) => {
    abortar.current?.abort();
    setAgente(ids[0]);
    setGrupo(ids);
    setTema(temaNuevo);
    setCreando(false);
    setActual(null);
    setMensajes([]);
    setAviso(null);
    setLista(false);
    ponerUrl({});
  };

  const abrir = useCallback(async (c: Conversacion) => {
    abortar.current?.abort();
    setLista(false);
    setCreando(false);
    setAviso(null);
    setActual(c.id);
    setAgente(c.agente);
    setGrupo(integrantes(c));
    setTema(c.tema ?? null);
    setMensajes([]);
    setCargando(true);
    ponerUrl({ c: c.id });
    const { data, error } = await createClient()
      .from("mensajes")
      .select("id, rol, contenido, agente, creado_en")
      .eq("conversacion_id", c.id)
      .order("creado_en", { ascending: true });
    setCargando(false);
    if (error) {
      setAviso("No se pudo abrir la conversación.");
      return;
    }
    pegado.current = true;
    setMensajes((data ?? []) as Mensaje[]);
  }, []);

  // Abrir la conversación de la URL al cargar
  useEffect(() => {
    if (!conversacionInicial) return;
    const c = conversacionesIniciales.find((x) => x.id === conversacionInicial);
    if (c) abrir(c);
  }, [conversacionInicial, conversacionesIniciales, abrir]);

  // Mantener la vista abajo mientras llega la respuesta (si la persona no subió)
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pegado.current) el.scrollTop = el.scrollHeight;
  }, [mensajes]);

  // Escape cierra la lista de chats en el celular
  useEffect(() => {
    if (!lista) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setLista(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [lista]);

  /** Con la ✕ pregunta antes; al deslizar la fila hasta el fondo ya es la confirmación. */
  async function borrar(c: Conversacion, preguntar = true) {
    if (preguntar && !window.confirm(`¿Borrar "${c.titulo}"?`)) return;
    const { error } = await createClient().from("conversaciones").delete().eq("id", c.id);
    if (error) {
      setAviso("No se pudo borrar la conversación.");
      setReintentos((n) => n + 1); // la fila deslizada vuelve a aparecer
      return;
    }
    setConversaciones((l) => l.filter((x) => x.id !== c.id));
    if (actual === c.id) nueva(c.agente);
  }

  async function enviar(contenido: string) {
    const limpio = contenido.trim();
    if (!limpio || enviando || !disponible || sinMensajes) return;
    if (limpio.length > MAX_MENSAJE) {
      setAviso(`El mensaje es muy largo (máximo ${MAX_MENSAJE} caracteres).`);
      return;
    }
    setAviso(null);
    pegado.current = true;
    const idRespuesta = `r-${Date.now()}`;
    const ahora = new Date().toISOString();
    setMensajes((m) => [
      ...m,
      { id: `u-${Date.now()}`, rol: "user", contenido: limpio, creado_en: ahora, nuevo: true },
      { id: idRespuesta, rol: "assistant", contenido: "", creado_en: ahora, enCurso: true, nuevo: true },
    ]);
    setEnviando(true);
    const control = new AbortController();
    abortar.current = control;

    const actualizar = (cambio: Partial<Mensaje>) =>
      setMensajes((m) => m.map((x) => (x.id === idRespuesta ? { ...x, ...cambio } : x)));

    // Un grupo nuevo manda a sus integrantes y el tema; uno ya guardado, solo su id
    const cuerpo = grupo && !actual ? { agentes: grupo, tema, mensaje: limpio } : { agente, mensaje: limpio, conversacionId: actual };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
        signal: control.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        actualizar({ enCurso: false, error: j.error ?? "No se pudo enviar el mensaje." });
        return;
      }
      setUsados((u) => u + 1);
      const idConv = res.headers.get("X-Conversacion-Id");
      if (idConv && idConv !== actual) {
        setActual(idConv);
        ponerUrl({ c: idConv });
      }
      // Subir (o agregar) la conversación al principio de la lista
      if (idConv) {
        setConversaciones((l) => {
          const existente = l.find((x) => x.id === idConv);
          const item: Conversacion = existente
            ? { ...existente, actualizado_en: new Date().toISOString() }
            : {
                id: idConv,
                agente,
                titulo: (tema ?? limpio).replace(/\s+/g, " ").slice(0, 80),
                actualizado_en: new Date().toISOString(),
                participantes: grupo,
                tema,
              };
          return [item, ...l.filter((x) => x.id !== idConv)];
        });
      }

      const lector = res.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        acumulado += decoder.decode(value, { stream: true });
        const corte = acumulado.indexOf(MARCA_ERROR);
        if (corte >= 0) {
          actualizar({ contenido: acumulado.slice(0, corte), error: acumulado.slice(corte + MARCA_ERROR.length) });
        } else {
          actualizar({ contenido: acumulado });
        }
      }
      actualizar({ enCurso: false });
    } catch (e) {
      const detenido = e instanceof DOMException && e.name === "AbortError";
      actualizar({ enCurso: false, error: detenido ? undefined : "Se perdió la conexión. Intenta de nuevo." });
    } finally {
      setEnviando(false);
      abortar.current = null;
    }
  }

  /** Una respuesta puede traer varias voces (grupo); cada una con su personaje. */
  const voces = (m: Mensaje) => {
    if (esIdAgente(m.agente)) return [{ agente: m.agente, texto: m.contenido }];
    if (grupo) return partirIntervenciones(m.contenido, grupo, m.enCurso);
    return [{ agente, texto: m.contenido }];
  };

  const piezas: Pieza[] = mensajes.flatMap((m): Pieza[] => {
    const fecha = m.creado_en ? new Date(m.creado_en) : new Date();
    if (m.rol === "user") return [{ key: m.id, de: "tu", texto: m.contenido, fecha, nuevo: m.nuevo }];
    return voces(m).map((v, i, todas) => {
      const ultima = i === todas.length - 1;
      return {
        key: `${m.id}-${i}`,
        de: v.agente,
        texto: v.texto,
        fecha,
        nuevo: m.nuevo,
        enCurso: m.enCurso && ultima,
        error: ultima ? m.error : undefined,
      };
    });
  });
  const visibles = piezas.filter((p) => p.texto || p.enCurso || p.error);
  // Quién escribe ahora (para los tres puntos y la cabecera)
  const enCurso = visibles[visibles.length - 1]?.enCurso ? (visibles[visibles.length - 1].de as IdAgente) : null;

  const fuentes: PromptBarSource[] = (grupo ?? activos).map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="h-5 w-5" />,
  }));
  const sugerencias = grupo ? grupo.slice(0, 3).map((id) => AGENTE_POR_ID[id].sugerencias[0]) : info.sugerencias;
  const gruposGuardados = conversaciones.filter((c) => integrantes(c));
  const chatsGuardados = conversaciones.filter((c) => !integrantes(c));

  const filaConversacion = (c: Conversacion) => {
    const ids = integrantes(c) ?? [c.agente];
    return (
      <li key={c.id} className="group relative">
        <SwipeRow
          key={`${c.id}-${reintentos}`}
          label={c.titulo}
          actions={[{ id: "borrar", label: "Borrar", icon: <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} /> }]}
          onCommit={() => borrar(c, false)}
          actionColor="#e5484d"
          drawerColor="var(--chat-barra)"
          rowColor="var(--chat-barra)"
          textColor="var(--color-bone-white)"
          height={68}
          radius={16}
          actionWidth={76}
          className="chat-app__deslizar"
        >
          <button type="button" className="chat-app__conv h-full" aria-current={c.id === actual ? "true" : undefined} onClick={() => abrir(c)}>
            <Caras agentes={ids} tam={44} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[0.9375rem] font-medium text-bone">{c.titulo}</span>
                <span className="shrink-0 text-[0.75rem] tabular-nums text-ash">{cuando(c.actualizado_en)}</span>
              </span>
              <span className="mt-0.5 block truncate text-[0.8125rem] text-ash">
                {ids.length > 1 ? nombres(ids) : AGENTE_POR_ID[c.agente]?.nombre}
              </span>
            </span>
          </button>
          <button type="button" className="chat-app__borrar" aria-label={`Borrar ${c.titulo}`} onClick={() => borrar(c)}>
            <IconoCerrar />
          </button>
        </SwipeRow>
      </li>
    );
  };

  return (
    <>
      <NavApp email={email} />
      <div className="chat-app chat-app--pantalla fixed inset-x-0 bottom-0 top-[72px]">
        {/* ---------- Agentes, grupos y conversaciones ---------- */}
        <aside className="chat-app__barra" data-abierta={lista ? "" : undefined} aria-label="Equipo y conversaciones">
          <div className="flex items-center justify-between px-5 pb-4 pt-6 sm:px-6">
            <p className="text-[1.125rem] font-medium tracking-[-0.01em]">Chats</p>
            <button type="button" className="chat-app__icono md:hidden" onClick={() => setLista(false)} aria-label="Cerrar la lista">
              <IconoCerrar />
            </button>
          </div>
          <div className="px-4 sm:px-5">
            {puedeGrupos ? (
              <button
                type="button"
                className="chat-app__nuevo"
                onClick={() => {
                  setCreando(true);
                  setLista(false);
                }}
              >
                <span className="chat-app__nuevo-mas" aria-hidden="true">
                  <IconoMas />
                </span>
                Nuevo grupo
              </button>
            ) : (
              <Link href="/#planes" className="chat-app__nuevo chat-app__nuevo--bloqueado">
                <span className="chat-app__nuevo-mas" aria-hidden="true">
                  <Candado />
                </span>
                Grupos con Atendel One
              </Link>
            )}
          </div>

          <div className="chat-app__listas">
            <p className="chat-app__seccion">Tu equipo</p>
            <ul>
              {AGENTES_INFO.map((a) => {
                const activo = activos.includes(a.id);
                const elegido = a.id === agente && !grupo && !actual;
                const contenido = (
                  <>
                    <Caras agentes={[a.id]} tam={44} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9375rem] font-medium text-bone">{a.nombre}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 truncate text-[0.8125rem] text-ash">
                        {activo ? (
                          `${a.area} · ${a.abarca}`
                        ) : (
                          <>
                            <Candado /> Con Atendel One
                          </>
                        )}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={a.id}>
                    {activo ? (
                      <button type="button" className="chat-app__conv" aria-current={elegido ? "true" : undefined} onClick={() => nueva(a.id)}>
                        {contenido}
                      </button>
                    ) : (
                      <Link href="/#planes" className="chat-app__conv opacity-50" title="Disponible con Atendel One">
                        {contenido}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {gruposGuardados.length ? (
              <>
                <p className="chat-app__seccion">Grupos</p>
                <ul>{gruposGuardados.map(filaConversacion)}</ul>
              </>
            ) : null}

            <p className="chat-app__seccion">Conversaciones</p>
            {chatsGuardados.length ? (
              <ul>{chatsGuardados.map(filaConversacion)}</ul>
            ) : (
              <p className="px-3 text-[0.8125rem] text-ash">Aquí aparecerán tus conversaciones.</p>
            )}
          </div>

          <div className="chat-app__plan">
            <p className="mb-2 text-[0.8125rem] font-medium text-bone">{plan.nombre}</p>
            <Uso usados={usados} plan={plan} compacto />
          </div>
        </aside>
        <button
          type="button"
          className="chat-app__velo md:hidden"
          data-abierta={lista ? "" : undefined}
          onClick={() => setLista(false)}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* ---------- Conversación abierta ---------- */}
        <section className="chat-app__principal" aria-label={grupo ? `Grupo: ${tema ?? nombres(grupo)}` : `Chat con ${info.nombre}`}>
          <header className="chat-app__cabeza">
            <button type="button" className="chat-app__icono md:hidden" onClick={() => setLista(true)} aria-label="Ver chats">
              <IconoLista />
            </button>
            <Caras agentes={participantes} tam={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1rem] font-medium leading-tight">{grupo ? (tema ?? nombres(grupo)) : info.nombre}</p>
              <p className="truncate text-[0.8125rem] leading-snug text-ash" aria-live="polite">
                {enCurso ? (
                  <span className="chat-app__escribe">
                    {grupo ? `${AGENTE_POR_ID[enCurso].nombre} está escribiendo…` : "escribiendo…"}
                  </span>
                ) : grupo ? (
                  `Grupo · ${nombres(grupo)}`
                ) : (
                  `${info.area} · ${info.abarca}`
                )}
              </p>
            </div>
            {actual ? (
              <button type="button" className="chat-app__probar inline-flex" onClick={() => (grupo ? nuevoGrupo(grupo, tema) : nueva(agente))}>
                <IconoMas />
                Nueva
              </button>
            ) : null}
          </header>

          <div
            ref={scrollRef}
            className="chat-app__mensajes"
            onScroll={(e) => {
              const el = e.currentTarget;
              pegado.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
          >
            <div className="mx-auto flex min-h-full w-full max-w-[880px] flex-col">
              {cargando ? (
                <p className="m-auto flex items-center gap-2 text-[0.875rem] text-ash">
                  <TriSpinner className="h-3 w-3" /> Abriendo conversación…
                </p>
              ) : mensajes.length === 0 ? (
                <div className="chat-app__vacio">
                  {grupo ? <Caras agentes={grupo} tam={92} /> : <Personaje agente={agente} className="h-28 w-28" />}
                  <p className="mt-6 text-[1.75rem] font-medium leading-tight tracking-[-0.02em] sm:text-[2rem]">
                    {grupo ? (tema ?? `Grupo con ${nombres(grupo)}`) : `Hola, soy ${info.nombre}.`}
                  </p>
                  <p className="mt-3 max-w-[460px] text-[0.9375rem] leading-relaxed text-silver">
                    {grupo
                      ? `${tema ? `Con ${nombres(grupo)}. ` : ""}Contesta quien sepa del tema y se complementan entre ellos. Usa @ para pedirle algo a alguien en especial.`
                      : info.lema}
                  </p>
                  {disponible ? (
                    <div className="mt-8 flex max-w-[620px] flex-wrap justify-center gap-2">
                      {sugerencias.map((s) => (
                        <button key={s} type="button" className="chat-app__sugerencia chat-app__sugerencia--larga" onClick={() => enviar(s)} disabled={sinMensajes}>
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-8 text-[0.9375rem] text-silver">
                      {grupo ? "Alguien de este grupo no está en tu equipo." : `${info.nombre} no está en tu equipo.`}{" "}
                      <Link href={planId === "free" ? "/#planes" : "/panel/agentes"} className="text-bone underline underline-offset-4">
                        {planId === "free" ? "Desbloquéalo con Atendel One" : "Agrégalo en Mis agentes"}
                      </Link>
                      .
                    </p>
                  )}
                </div>
              ) : (
                <div className="chat-app__hilo" role="log" aria-live="polite">
                  {visibles.map((p, i) => {
                    const antes = visibles[i - 1];
                    const despues = visibles[i + 1];
                    const nuevoDia = !antes || !mismoDia(antes.fecha, p.fecha);
                    const primero = nuevoDia || antes.de !== p.de;
                    const ultimo = !despues || despues.de !== p.de || !mismoDia(despues.fecha, p.fecha);
                    const fila = { primero, ultimo, nueva: p.nuevo, bloque: primero && !nuevoDia, hora: hora(p.fecha) };
                    let pieza;
                    if (p.de === "tu") pieza = <MensajeTuyo texto={p.texto} {...fila} />;
                    else if (!p.texto && p.enCurso) pieza = <Escribiendo agente={p.de} sigue={!primero} enGrupo={!!grupo} />;
                    else if (!p.texto) pieza = <Sistema texto={p.error ?? ""} error {...fila} />;
                    else
                      pieza = (
                        <MensajeAgente
                          agente={p.de}
                          texto={p.texto}
                          enGrupo={!!grupo}
                          {...fila}
                          hora={p.enCurso ? undefined : fila.hora}
                          pie={
                            p.error ? (
                              <p role="alert" className="chat-app__error">
                                {p.error}
                              </p>
                            ) : !p.enCurso && ultimo ? (
                              <Copiar texto={p.texto} fijo={i === visibles.length - 1} />
                            ) : null
                          }
                        />
                      );
                    return (
                      <Fragment key={p.key}>
                        {nuevoDia ? <Dia>{dia(p.fecha)}</Dia> : null}
                        {pieza}
                      </Fragment>
                    );
                  })}
                </div>
              )}
              {aviso ? (
                <p role="alert" className="chat-app__fila chat-app__sistema chat-app__sistema--error">
                  <span>{aviso}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="chat-app__pie mx-auto w-full max-w-[944px] pb-[max(18px,env(safe-area-inset-bottom))]">
            {sinMensajes ? (
              <p className="mb-3 text-center text-[0.875rem] text-silver">
                Llegaste a los {plan.mensajesMes} mensajes de este mes.{" "}
                <Link href="/#planes" className="text-bone underline underline-offset-4">
                  Ver planes
                </Link>
              </p>
            ) : null}
            {disponible && !sinMensajes ? (
              <PromptBar
                key={grupo ? grupo.join("-") : agente}
                className="prompt-bar--suave"
                placeholder={grupo ? "Escribe al grupo · @ para mencionar, / para acciones" : `Escríbele a ${info.nombre} · / para acciones`}
                sources={fuentes}
                commands={comandosDe(participantes)}
                models={[]}
                efforts={[]}
                busy={enviando}
                onSend={(t) => enviar(t)}
                onStop={() => abortar.current?.abort()}
                background="var(--chat-campo)"
                color="var(--color-bone-white)"
                menuBackground="var(--chat-menu)"
                width={4000}
                radius={22}
                maxRows={8}
              />
            ) : null}
            <p className="mt-3 text-center text-[0.75rem] text-ash">
              {grupo ? "Pueden equivocarse" : `${info.nombre} puede equivocarse`}. Revisa lo importante antes de enviarlo a un cliente.
            </p>
          </div>
        </section>

        {creando ? (
          <NuevoGrupo
            disponibles={activos}
            nombreObligatorio={false}
            maxNombre={MAX_TEMA}
            onCrear={(nombre, ids) => nuevoGrupo(ids, nombre || null)}
            onCerrar={() => setCreando(false)}
          />
        ) : null}
      </div>
    </>
  );
}

/** "Copiar" aparece al pasar el cursor; en pantallas táctiles, solo en la última respuesta (`fijo`). */
function Copiar({ texto, fijo }: { texto: string; fijo: boolean }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className={`chat-app__copiar${fijo ? " chat-app__copiar--fijo" : ""}`}
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
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}
